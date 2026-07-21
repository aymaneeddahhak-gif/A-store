import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { Order } from "@/lib/types"

/**
 * Orders read queries — server-only.
 *
 * All order reads require an authenticated user id; we never return another
 * user's orders. RLS on the `orders` table is the source of truth, but we
 * also filter here so the demo (with mock fallback) stays correct.
 */
const ORDERS_TABLE = "orders"

export async function listOrdersForUser(userId: string): Promise<Order[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[orders] listOrdersForUser error:", error.message)
      return []
    }
    return (data as Order[]) ?? []
  } catch (err) {
    console.error("[orders] listOrdersForUser database down:", err)
    return []
  }
}

export async function listAllOrders(): Promise<Order[]> {
  // Seller/admin view. RLS must restrict this to seller+ roles at the DB level.
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[orders] listAllOrders error:", error.message)
      return []
    }
    return (data as Order[]) ?? []
  } catch (err) {
    console.error("[orders] listAllOrders database down:", err)
    return []
  }
}
