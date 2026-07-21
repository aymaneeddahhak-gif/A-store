import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { MOCK_PRODUCTS } from "@/lib/mock-data"
import type { Product } from "@/lib/types"

/**
 * Queries — server-only read access to Supabase.
 *
 * Every database READ in the app goes through this module (or its siblings).
 * This is the single chokepoint that lets us swap storage, add caching,
 * or enforce RLS assumptions without hunting call sites across the codebase.
 *
 * Conventions:
 *  - Always return typed data (never raw Supabase rows).
 *  - On DB error or empty result, fall back to MOCK_PRODUCTS so the demo
 *    always renders (important for portfolio/preview deployments).
 *  - Never throw — callers are server components and route handlers that
 *    should degrade gracefully.
 */

const PRODUCTS_TABLE = "products"

export async function listProducts(): Promise<Product[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select("*")
      .order("id", { ascending: true })

    if (error || !data || data.length === 0) {
      console.warn("[products] listProducts using mock fallback:", error?.message ?? "empty")
      return MOCK_PRODUCTS
    }
    return data as Product[]
  } catch (err) {
    console.error("[products] listProducts database down, using mock fallback:", err)
    return MOCK_PRODUCTS
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (error || !data) {
      const fallback = MOCK_PRODUCTS.find((p) => p.id === id)
      if (fallback) {
        console.warn(`[products] getProductById(${id}) using mock fallback`)
        return fallback
      }
      return null
    }
    return data as Product
  } catch (err) {
    console.error(`[products] getProductById(${id}) database down, using mock fallback:`, err)
    return MOCK_PRODUCTS.find((p) => p.id === id) ?? null
  }
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const all = await listProducts()
  return all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit)
}
