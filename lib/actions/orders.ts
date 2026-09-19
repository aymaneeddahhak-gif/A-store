"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { listOrdersForUser, listAllOrders } from "@/lib/queries/orders"
import { listStoreProducts, PRODUCTS_CACHE_TAG, invalidateProductCache } from "@/lib/queries/products"
import { validatePromo } from "@/lib/actions/promos"
import { isAdminEmail } from "@/lib/admin"
import { logAudit } from "@/lib/actions/audit"
import { ORDER_STATUSES, SHIPPING_FEE, type ShippingAddress } from "@/lib/types"
import type { CartItem, Order } from "@/lib/types"

/**
 * Server actions — mutations against Supabase.
 *
 * Why server actions (not browser→Supabase):
 *  - Centralized authorization + validation chokepoint
 *  - Avoids exposing mutation paths to the anon key alone
 *  - Lets us revalidate cached pages and run side effects
 *  - Works under restrictive RLS: the server uses the user's session
 *    cookies, so policies evaluate against the authenticated requester
 *
 * All actions return a discriminated result so callers can show toasts
 * without try/catch. They never throw to the client.
 */

const ORDERS_TABLE = "orders"
const PRODUCTS_TABLE = "products"

export type ActionResult<T = null> =
  | ({ ok: true; data: T })
  | { ok: false; error: string; field?: string }

function fail<T = null>(error: string, field?: string): ActionResult<T> {
  return { ok: false, error, field }
}
function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

function genOrderId(): string {
  return crypto.randomUUID()
}

/** Shipping details are validated here too — never trust the client alone. */
function validateShipping(input: unknown):
  | { ok: true; data: ShippingAddress }
  | { ok: false; error: string; field: string } {
  const s = (input ?? {}) as Partial<ShippingAddress>
  const required: (keyof ShippingAddress)[] = [
    "firstName",
    "lastName",
    "email",
    "address",
    "city",
    "postalCode",
  ]
  const labels: Record<keyof ShippingAddress, string> = {
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    address: "Street address",
    city: "City",
    postalCode: "Postal code",
    country: "Country",
  }
  for (const field of required) {
    if (!s[field]?.trim()) {
      return { ok: false, error: `${labels[field]} is required.`, field }
    }
  }
  if (!/.+@.+\..+/.test(s.email!.trim())) {
    return {
      ok: false,
      error: "Enter a valid email address (e.g. you@example.com).",
      field: "email",
    }
  }
  return {
    ok: true,
    data: {
      firstName: s.firstName!.trim(),
      lastName: s.lastName!.trim(),
      email: s.email!.trim(),
      address: s.address!.trim(),
      city: s.city!.trim(),
      postalCode: s.postalCode!.trim(),
      country: s.country?.trim() || "Morocco",
    },
  }
}

/**
 * Places an order as the signed-in session user.
 *
 * Trust boundary: the client decides *which* items and *how many*, the server
 * decides *who* is buying and *what they cost*. The user id comes from the
 * session, and prices are recomputed from the product table so a tampered
 * client can't checkout at $0.
 */
export async function placeOrderAction(input: {
  items: Array<{ id: number; quantity: number }>
  promoCode?: string
  shipping?: ShippingAddress
}): Promise<ActionResult<Order | null>> {
  try {
    if (input.items.length === 0) return fail("Your cart is empty.")

    // Shipping is validated FIRST so a bad address fails here with the
    // field named — never as a cryptic database error at the end.
    const shipping = validateShipping(input.shipping)
    if (!shipping.ok) return fail(shipping.error, shipping.field)

    const supabase = await createSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return fail("You must be signed in to place an order.")

    // Published store rows only — drafts and sandbox products cannot be
    // bought, even with a forged request.
    const products = await listStoreProducts()
    const items: CartItem[] = []
    for (const line of input.items) {
      const product = products.find((product) => product.id === line.id)
      if (!product) return fail(`Product ${line.id} is no longer available.`)
      const quantity = Math.min(99, Math.max(1, Math.floor(line.quantity) || 1))
      const stock = product.stock ?? Number.MAX_SAFE_INTEGER
      if (stock <= 0) return fail(`${product.name} is sold out.`)
      if (stock < quantity) return fail(`Only ${stock} left of ${product.name}.`)
      items.push({ ...product, quantity, selected: true })
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const promo = input.promoCode ? await validatePromo(input.promoCode) : null
    const discount = promo ? subtotal * (promo.percent_off / 100) : 0
    const total = Math.max(0, subtotal - discount) + (subtotal > 0 ? SHIPPING_FEE : 0)

    const order: Order = {
      id: genOrderId(),
      user_id: auth.user.id,
      items,
      total,
      status: "Pending",
      created_at: new Date().toISOString(),
      promo_code: promo?.code ?? null,
    }

    const row: Record<string, unknown> = {
      id: order.id,
      user_id: order.user_id,
      items: order.items,
      total: order.total,
      status: order.status,
    }
    // promo_code column is optional (older schema) — retry without it.
    if (promo?.code) row.promo_code = promo.code
    let { error } = await supabase.from(ORDERS_TABLE).insert([row])
    if (error && promo?.code && error.message.includes("promo_code")) {
      delete row.promo_code
      const retry = await supabase.from(ORDERS_TABLE).insert([row])
      error = retry.error
    }

    if (error) {
      console.warn("[orders] placeOrderAction insert failed:", error.message)
      // The caller keeps the order in session state so the customer still gets
      // a confirmation rather than a dead end.
      return fail(error.message)
    }

    // Decrement stock (best effort — the order itself already succeeded).
    for (const line of input.items) {
      const product = products.find((p) => p.id === line.id)
      if (product?.stock !== undefined) {
        const quantity = Math.min(99, Math.max(1, Math.floor(line.quantity) || 1))
        await supabase
          .from(PRODUCTS_TABLE)
          .update({ stock: Math.max(0, product.stock - quantity) })
          .eq("id", line.id)
      }
    }

    revalidateTag(PRODUCTS_CACHE_TAG)
    revalidatePath("/orders")
    revalidatePath("/seller")
    invalidateProductCache()
    return ok(order)
  } catch (err) {
    console.error("[orders] placeOrderAction database down:", err)
    return fail("Database connection failed.")
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: string
): Promise<ActionResult> {
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    return fail("Unknown order status.")
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return fail("You must be signed in.")
    // Fulfillment is admin-only — customers cancel their own orders through
    // cancelOrderAction below.
    if (!isAdminEmail(auth.user.email)) {
      return fail("Restricted to the store admin.")
    }

    // The write goes through the service role when available so order-level
    // RLS (orders are owner-writable) can never block the admin's fulfillment
    // update from the seller dashboard; otherwise the session client is used.
    const db = createSupabaseAdminClient() ?? supabase

    const { error } = await db
      .from(ORDERS_TABLE)
      .update({ status, status_updated_at: new Date().toISOString() })
      .eq("id", orderId)

    // status_updated_at column is optional (older schema) — retry without it.
    if (error && error.message.includes("status_updated_at")) {
      const retry = await db.from(ORDERS_TABLE).update({ status }).eq("id", orderId)
      if (retry.error) return fail(retry.error.message)
    } else if (error) {
      return fail(error.message)
    }

    revalidatePath("/orders")
    revalidatePath("/seller")
    void logAudit({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: "status",
      entity: "order",
      entityId: orderId,
      detail: { status },
    })
    return ok(null)
  } catch (err) {
    console.error("[orders] updateOrderStatusAction failed:", err)
    return fail("Database connection failed.")
  }
}

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return fail("You must be signed in.")

    // Customers may cancel their own orders; the admin may cancel anything.
    if (!isAdminEmail(auth.user.email)) {
      const { data: row } = await supabase
        .from(ORDERS_TABLE)
        .select("user_id")
        .eq("id", orderId)
        .maybeSingle()
      if ((row as { user_id?: string } | null)?.user_id !== auth.user.id) {
        return fail("You can only cancel your own orders.")
      }
    }

    const { error } = await supabase
      .from(ORDERS_TABLE)
      .update({ status: "Cancelled", status_updated_at: new Date().toISOString() })
      .eq("id", orderId)

    // status_updated_at column is optional (older schema) — retry without it.
    if (error && error.message.includes("status_updated_at")) {
      const retry = await supabase
        .from(ORDERS_TABLE)
        .update({ status: "Cancelled" })
        .eq("id", orderId)
      if (retry.error) return fail(retry.error.message)
    } else if (error) {
      return fail(error.message)
    }

    revalidatePath("/orders")
    revalidatePath("/seller")
    void logAudit({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: "cancel",
      entity: "order",
      entityId: orderId,
    })
    return ok(null)
  } catch (err) {
    console.error("[orders] cancelOrderAction failed:", err)
    return fail("Database connection failed.")
  }
}

/**
 * Reads the signed-in user's order history. The id comes from the session
 * rather than the caller, so one user can never request another's orders even
 * if RLS were misconfigured.
 */
export async function fetchMyOrdersAction(): Promise<ActionResult<Order[]>> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return ok([])

    const orders = await listOrdersForUser(auth.user.id)
    return ok(orders)
  } catch {
    return fail("Could not load your orders.")
  }
}

/**
 * Reads every order for the seller dashboard. Requires a session; row-level
 * visibility is RLS's call (a real store would gate on a seller role).
 */
export async function fetchAllOrdersAction(): Promise<ActionResult<Order[]>> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return ok([])

    return ok(await listAllOrders())
  } catch {
    return fail("Could not load orders.")
  }
}
