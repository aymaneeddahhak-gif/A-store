import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { migrateProductAssetPaths } from "@/lib/product-media"
import { isSupabaseOffline } from "@/lib/supabase-circuit"
import { getFallbackOrders } from "@/lib/fallback-catalog"
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
  if (isSupabaseOffline()) {
    return getFallbackOrders()
      .filter((o) => o.user_id === userId || userId.startsWith("demo-"))
      .map(sanitizeOrder)
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      return getFallbackOrders()
        .filter((o) => o.user_id === userId || userId.startsWith("demo-"))
        .map(sanitizeOrder)
    }
    return ((data as Order[]) ?? []).map(sanitizeOrder)
  } catch {
    return getFallbackOrders()
      .filter((o) => o.user_id === userId || userId.startsWith("demo-"))
      .map(sanitizeOrder)
  }
}

export async function listAllOrders(): Promise<Order[]> {
  if (isSupabaseOffline()) {
    return getFallbackOrders().map(sanitizeOrder)
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return getFallbackOrders().map(sanitizeOrder)
    }
    return ((data as Order[]) ?? []).map(sanitizeOrder)
  } catch {
    return getFallbackOrders().map(sanitizeOrder)
  }
}
