import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { migrateProductAssetPaths } from "@/lib/product-media"
import type { CartItem, Order } from "@/lib/types"

const ORDERS_TABLE = "orders"

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
    const db = createSupabaseAdminClient() ?? supabase
    const { data, error } = await db
      .from(ORDERS_TABLE)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error || !data) return []
    return (data as Order[]).map(sanitizeOrder)
  } catch {
    return []
  }
}

export async function listAllOrders(): Promise<Order[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const db = createSupabaseAdminClient() ?? supabase
    const { data, error } = await db
      .from(ORDERS_TABLE)
      .select("*")
      .order("created_at", { ascending: false })

    if (error || !data) return []
    return (data as Order[]).map(sanitizeOrder)
  } catch {
    return []
  }
}
