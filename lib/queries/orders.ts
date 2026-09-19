import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { migrateProductAssetPaths } from "@/lib/product-media"
import type { CartItem, Order } from "@/lib/types"

/**
 * Orders read queries — server-only.
 *
 * All order reads require an authenticated user id; we never return another
 * user's orders. RLS on the `orders` table is the source of truth, and we
 * filter here as well so a policy gap cannot leak rows.
 */
const ORDERS_TABLE = "orders"

/**
 * Order items are product snapshots from checkout time — they predate asset
 * moves exactly like cart lines do. Heal image paths on read (and drop lines
 * whose image no longer ships) so old orders can't 400 the optimizer.
 */
function sanitizeOrderItems(items: CartItem[]): CartItem[] {
  return (items ?? []).flatMap((item) => {
    if (typeof item !== "object" || item === null || typeof item.id !== "number") return []
    const migrated = migrateProductAssetPaths(item)
    if (!migrated) return []
    return [
      {
        ...migrated,
        quantity: Math.max(1, Number(item.quantity) || 1),
        selected: item.selected !== false,
      },
    ]
  })
}

function sanitizeOrder(order: Order): Order {
  return { ...order, items: sanitizeOrderItems(order.items) }
}

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
    return ((data as Order[]) ?? []).map(sanitizeOrder)
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
    return ((data as Order[]) ?? []).map(sanitizeOrder)
  } catch (err) {
    console.error("[orders] listAllOrders database down:", err)
    return []
  }
}
