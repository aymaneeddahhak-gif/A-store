"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { listOrdersForUser, listAllOrders } from "@/lib/queries/orders"
import {
  listStoreProducts,
  PRODUCTS_CACHE_TAG,
  invalidateProductCache,
} from "@/lib/queries/products"
import { validatePromo } from "@/lib/actions/promos"
import { isAdminEmail } from "@/lib/admin"
import { logAudit } from "@/lib/actions/audit"
import { isSupabaseOffline } from "@/lib/supabase-circuit"
import {
  getFallbackOrders,
  setFallbackOrders,
  getFallbackProducts,
  setFallbackProducts,
} from "@/lib/fallback-catalog"
import {
  ORDER_STATUSES,
  TRACKING_REQUIRED_STATUSES,
  orderNextStatuses,
  SHIPPING_FEE,
  type ShippingAddress,
} from "@/lib/types"
import { isSellerEmail } from "@/lib/seller"
import type { CartItem, Order } from "@/lib/types"

const ORDERS_TABLE = "orders"
const PRODUCTS_TABLE = "products"

export type ActionResult<T = null> =
  | { ok: true; data: T }
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

async function adjustStock(
  fallback: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  items: CartItem[],
  direction: 1 | -1
): Promise<void> {
  if (isSupabaseOffline()) {
    const products = getFallbackProducts()
    setFallbackProducts(
      products.map((p) => {
        const line = items.find((i) => i.id === p.id)
        if (!line) return p
        const qty = Math.min(99, Math.max(1, Math.floor(Number(line.quantity) || 1)))
        const cur = Math.max(0, Math.floor(Number(p.stock ?? 20)))
        return { ...p, stock: Math.max(0, cur + direction * qty) }
      })
    )
    invalidateProductCache()
    revalidateTag(PRODUCTS_CACHE_TAG)
    return
  }

  try {
    const db = createSupabaseAdminClient() ?? fallback
    for (const item of items) {
      const quantity = Math.min(99, Math.max(1, Math.floor(Number(item.quantity) || 1)))
      for (let attempt = 0; attempt < 2; attempt++) {
        const { data } = await db
          .from(PRODUCTS_TABLE)
          .select("stock")
          .eq("id", item.id)
          .maybeSingle()
        const row = data as { stock?: number | null } | null
        if (!row) break
        const current = Math.max(0, Math.floor(Number(row.stock) || 0))
        const next = Math.max(0, current + direction * quantity)
        const patch = db.from(PRODUCTS_TABLE).update({ stock: next }).eq("id", item.id)
        const { data: updated, error } =
          row.stock === null || row.stock === undefined
            ? await patch.is("stock", null).select("id")
            : await patch.eq("stock", current).select("id")
        if (!error && updated && updated.length > 0) break
      }
    }
  } catch {
    // Ignore stock error when DB is paused
  }
  invalidateProductCache()
  revalidateTag(PRODUCTS_CACHE_TAG)
}

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

export async function placeOrderAction(input: {
  items: Array<{ id: number; quantity: number }>
  promoCode?: string
  shipping?: ShippingAddress
}): Promise<ActionResult<Order | null>> {
  try {
    if (input.items.length === 0) return fail("Your cart is empty.")

    const shipping = validateShipping(input.shipping)
    if (!shipping.ok) return fail(shipping.error, shipping.field)

    const supabase = await createSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return fail("You must be signed in to place an order.")

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

    if (!isSupabaseOffline()) {
      try {
        const row: Record<string, unknown> = {
          id: order.id,
          user_id: order.user_id,
          items: order.items,
          total: order.total,
          status: order.status,
        }
        if (promo?.code) row.promo_code = promo.code
        const db = createSupabaseAdminClient() ?? supabase
        let { error } = await db.from(ORDERS_TABLE).insert([row])
        if (error && promo?.code && error.message.includes("promo_code")) {
          delete row.promo_code
          const retry = await db.from(ORDERS_TABLE).insert([row])
          error = retry.error
        }
        if (!error) {
          await adjustStock(supabase, items, -1)
          revalidateTag(PRODUCTS_CACHE_TAG)
          revalidatePath("/orders")
          revalidatePath("/seller")
          invalidateProductCache()
          return ok(order)
        }
      } catch {
        // Fall through to fallback order store
      }
    }

    setFallbackOrders([order, ...getFallbackOrders()])
    await adjustStock(supabase, items, -1)
    revalidateTag(PRODUCTS_CACHE_TAG)
    revalidatePath("/orders")
    revalidatePath("/seller")
    invalidateProductCache()
    return ok(order)
  } catch (err) {
    console.error("[orders] placeOrderAction failed:", err)
    return fail("Could not place order.")
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: string,
  shipment?: { carrier?: string; trackingNumber?: string }
): Promise<ActionResult> {
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    return fail("Unknown order status.")
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return fail("You must be signed in.")
    if (!isSellerEmail(auth.user.email)) {
      return fail("Restricted to the store team.")
    }

    if (isSupabaseOffline()) {
      const orders = getFallbackOrders()
      const existing = orders.find((o) => o.id === orderId)
      if (!existing) return fail("Order not found.")
      const from = existing.status ?? "Pending"
      if (from === status) return ok(null)
      if (!orderNextStatuses(from).includes(status)) {
        return fail(`An order that is ${from} cannot become ${status}.`)
      }
      const carrier = (shipment?.carrier ?? existing.carrier ?? "").trim()
      const trackingNumber = (shipment?.trackingNumber ?? existing.tracking_number ?? "").trim()
      if (TRACKING_REQUIRED_STATUSES.includes(status) && (!carrier || !trackingNumber)) {
        return fail("Add the carrier and tracking number before shipping this order.", "tracking")
      }
      setFallbackOrders(
        orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status,
                status_updated_at: new Date().toISOString(),
                carrier: carrier || o.carrier,
                tracking_number: trackingNumber || o.tracking_number,
              }
            : o
        )
      )
      if (status === "Cancelled" && from !== "Cancelled") {
        await adjustStock(supabase, existing.items ?? [], 1)
      }
      revalidatePath("/orders")
      revalidatePath("/seller")
      return ok(null)
    }

    const { data: row } = await supabase
      .from(ORDERS_TABLE)
      .select("id, status, carrier, tracking_number, items")
      .eq("id", orderId)
      .maybeSingle()
    const existing = row as {
      status?: string
      carrier?: string | null
      tracking_number?: string | null
      items?: CartItem[] | null
    } | null
    if (!existing) return fail("Order not found.")

    const from = existing.status ?? "Pending"
    if (from === status) return ok(null)
    if (!orderNextStatuses(from).includes(status)) {
      return fail(`An order that is ${from} cannot become ${status}.`)
    }

    const carrier = (shipment?.carrier ?? existing.carrier ?? "").trim()
    const trackingNumber = (shipment?.trackingNumber ?? existing.tracking_number ?? "").trim()
    if (TRACKING_REQUIRED_STATUSES.includes(status) && (!carrier || !trackingNumber)) {
      return fail("Add the carrier and tracking number before shipping this order.", "tracking")
    }

    const db = createSupabaseAdminClient() ?? supabase
    const payload: Record<string, unknown> = {
      status,
      status_updated_at: new Date().toISOString(),
    }
    if (carrier) payload.carrier = carrier
    if (trackingNumber) payload.tracking_number = trackingNumber

    let res = await db.from(ORDERS_TABLE).update(payload).eq("id", orderId).select("id")
    if (res.error && /status_updated_at|carrier|tracking_number/.test(res.error.message)) {
      res = await db.from(ORDERS_TABLE).update({ status }).eq("id", orderId).select("id")
    }
    if (res.error) return fail(res.error.message)
    if (!res.data || res.data.length === 0) return fail("Could not update this order.")

    if (status === "Cancelled" && from !== "Cancelled") {
      await adjustStock(supabase, existing.items ?? [], 1)
    }

    revalidatePath("/orders")
    revalidatePath("/seller")
    void logAudit({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: "status",
      entity: "order",
      entityId: orderId,
      detail: { from, status, carrier: carrier || null, tracking_number: trackingNumber || null },
    })
    return ok(null)
  } catch (err) {
    console.error("[orders] updateOrderStatusAction failed:", err)
    return fail("Database connection failed.")
  }
}

export async function updateOrderShipmentAction(
  orderId: string,
  carrier: string,
  trackingNumber: string
): Promise<ActionResult> {
  const label = (carrier ?? "").trim()
  const code = (trackingNumber ?? "").trim()
  if (!label || !code) return fail("Carrier and tracking number are both required.")
  try {
    const supabase = await createSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return fail("You must be signed in.")
    if (!isSellerEmail(auth.user.email)) return fail("Restricted to the store team.")

    if (isSupabaseOffline()) {
      const orders = getFallbackOrders()
      const existing = orders.find((o) => o.id === orderId)
      if (!existing) return fail("Order not found.")
      if (existing.status === "Cancelled" || existing.status === "Delivered") {
        return fail("This order is closed — its shipment details can no longer change.")
      }
      setFallbackOrders(
        orders.map((o) =>
          o.id === orderId ? { ...o, carrier: label, tracking_number: code } : o
        )
      )
      revalidatePath("/orders")
      revalidatePath("/seller")
      return ok(null)
    }

    const { data: row } = await supabase
      .from(ORDERS_TABLE)
      .select("id, status")
      .eq("id", orderId)
      .maybeSingle()
    const existing = row as { status?: string } | null
    if (!existing) return fail("Order not found.")
    if (existing.status === "Cancelled" || existing.status === "Delivered") {
      return fail("This order is closed — its shipment details can no longer change.")
    }

    const db = createSupabaseAdminClient() ?? supabase
    const res = await db
      .from(ORDERS_TABLE)
      .update({ carrier: label, tracking_number: code })
      .eq("id", orderId)
      .select("id")
    if (res.error && /carrier|tracking_number/.test(res.error.message)) {
      return fail("Run sql/orders-lifecycle.sql once to enable shipment tracking.")
    }
    if (res.error) return fail(res.error.message)
    if (!res.data || res.data.length === 0) return fail("Could not save the shipment details.")

    revalidatePath("/orders")
    revalidatePath("/seller")
    void logAudit({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: "shipment",
      entity: "order",
      entityId: orderId,
      detail: { carrier: label, tracking_number: code },
    })
    return ok(null)
  } catch (err) {
    console.error("[orders] updateOrderShipmentAction failed:", err)
    return fail("Database connection failed.")
  }
}

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return fail("You must be signed in.")

    if (isSupabaseOffline()) {
      const orders = getFallbackOrders()
      const order = orders.find((o) => o.id === orderId)
      if (!order) return fail("Order not found.")
      if (order.status === "Cancelled") return fail("This order is already cancelled.")
      if (order.status === "Shipped" || order.status === "Delivered") {
        return fail("This order has shipped and can no longer be cancelled.")
      }
      setFallbackOrders(
        orders.map((o) =>
          o.id === orderId
            ? { ...o, status: "Cancelled", status_updated_at: new Date().toISOString() }
            : o
        )
      )
      await adjustStock(supabase, order.items ?? [], 1)
      revalidatePath("/orders")
      revalidatePath("/seller")
      return ok(null)
    }

    const { data: row } = await supabase
      .from(ORDERS_TABLE)
      .select("user_id, status, items")
      .eq("id", orderId)
      .maybeSingle()
    const order = row as {
      user_id?: string
      status?: string
      items?: CartItem[] | null
    } | null
    if (!order) return fail("Order not found.")

    const admin = isAdminEmail(auth.user.email)
    if (!admin && order.user_id !== auth.user.id) {
      return fail("You can only cancel your own orders.")
    }
    if (!admin && order.status !== "Pending") {
      return fail("This order is already confirmed — contact the store to cancel it.")
    }
    if (order.status === "Cancelled") return fail("This order is already cancelled.")
    if (order.status === "Shipped" || order.status === "Delivered") {
      return fail("This order has shipped and can no longer be cancelled.")
    }

    const db = createSupabaseAdminClient() ?? supabase
    const { error } = await db
      .from(ORDERS_TABLE)
      .update({ status: "Cancelled", status_updated_at: new Date().toISOString() })
      .eq("id", orderId)

    if (error && error.message.includes("status_updated_at")) {
      const retry = await db
        .from(ORDERS_TABLE)
        .update({ status: "Cancelled" })
        .eq("id", orderId)
      if (retry.error) return fail(retry.error.message)
    } else if (error) {
      return fail(error.message)
    }

    await adjustStock(supabase, order.items ?? [], 1)

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

export async function fetchMyOrdersAction(): Promise<ActionResult<Order[]>> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return ok([])

    const orders = await listOrdersForUser(auth.user.id)
    return ok(orders)
  } catch {
    return ok(getFallbackOrders())
  }
}

export async function fetchAllOrdersAction(): Promise<ActionResult<Order[]>> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return ok([])

    return ok(await listAllOrders())
  } catch {
    return ok(getFallbackOrders())
  }
}
