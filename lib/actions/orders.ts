"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { Order, Product } from "@/lib/types"

/**
 * Server actions — mutations against Supabase.
 *
 * Why server actions (not browser→Supabase):
 *  - Centralized authorization + validation chokepoint
 *  - Avoids exposing mutation paths to the anon key alone
 *  - Lets us revalidate cached pages and run side effects
 *  - Makes the demo work even with restrictive RLS (server uses the
 *    user's session cookies, so RLS sees the authenticated requester)
 *
 * All actions return a discriminated result so callers can show toasts
 * without try/catch. They never throw to the client.
 */

const ORDERS_TABLE = "orders"

export type ActionResult<T = null> =
  | ({ ok: true; data: T })
  | { ok: false; error: string }

function fail(error: string): ActionResult {
  return { ok: false, error }
}
function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

function genOrderId(): string {
  return `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export async function placeOrderAction(input: {
  userId: string
  items: Product[]
  shippingFee?: number
}): Promise<ActionResult<Order | null>> {
  const shippingFee = input.shippingFee ?? 15
  const subtotal = input.items.reduce((sum, item) => sum + item.price, 0)
  const total = subtotal + (subtotal > 0 ? shippingFee : 0)

  const order: Order = {
    id: genOrderId(),
    user_id: input.userId,
    items: input.items,
    total,
    status: "Pending",
    created_at: new Date().toISOString(),
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from(ORDERS_TABLE).insert([
      {
        id: order.id,
        user_id: order.user_id,
        items: order.items,
        total: order.total,
        status: order.status,
      },
    ])

    if (error) {
      console.warn("[orders] placeOrderAction insert failed:", error.message)
      // Caller can still surface the order locally for the demo.
      return fail(error.message)
    }

    revalidatePath("/orders")
    revalidatePath("/seller")
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
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase
      .from(ORDERS_TABLE)
      .update({ status })
      .eq("id", orderId)

    if (error) return fail(error.message)

    revalidatePath("/orders")
    revalidatePath("/seller")
    return ok(null)
  } catch (err) {
    console.error("[orders] updateOrderStatusAction failed:", err)
    return fail("Database connection failed.")
  }
}

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  return updateOrderStatusAction(orderId, "Cancelled")
}
