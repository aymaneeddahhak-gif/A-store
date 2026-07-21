"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { Product } from "@/lib/types"

/**
 * Product CRUD server actions (seller-facing).
 * See lib/actions/orders.ts for the result-type rationale.
 */

const PRODUCTS_TABLE = "products"

export type ProductActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export type NewProductInput = Omit<Product, "id" | "likes" | "rating" | "reviews">

export async function createProductAction(
  input: NewProductInput
): Promise<ProductActionResult<Product>> {
  try {
    const supabase = await createSupabaseServerClient()
    const row = {
      ...input,
      likes: Math.floor(Math.random() * 50),
      rating: 5.0,
      reviews: [],
    }
    const { data, error } = await supabase.from(PRODUCTS_TABLE).insert([row]).select().single()

    if (error) return { ok: false, error: error.message }

    revalidatePath("/")
    revalidatePath("/seller")
    return { ok: true, data: data as Product }
  } catch (err) {
    console.error("[products] createProductAction failed:", err)
    return { ok: false, error: "Database connection failed." }
  }
}

export async function updateProductAction(
  id: number,
  updates: Partial<Product>
): Promise<ProductActionResult> {
  // Strip id from the patch — never let callers mutate the primary key.
  const { id: _id, ...validUpdates } = updates as Partial<Product> & { id?: number }
  void _id

  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from(PRODUCTS_TABLE).update(validUpdates).eq("id", id)
    if (error) return { ok: false, error: error.message }

    revalidatePath("/")
    revalidatePath(`/product/${id}`)
    revalidatePath("/seller")
    return { ok: true, data: null }
  } catch (err) {
    console.error("[products] updateProductAction failed:", err)
    return { ok: false, error: "Database connection failed." }
  }
}

export async function deleteProductAction(id: number): Promise<ProductActionResult> {
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from(PRODUCTS_TABLE).delete().eq("id", id)
    if (error) return { ok: false, error: error.message }

    revalidatePath("/")
    revalidatePath("/seller")
    return { ok: true, data: null }
  } catch (err) {
    console.error("[products] deleteProductAction failed:", err)
    return { ok: false, error: "Database connection failed." }
  }
}

export async function toggleProductLikeAction(
  id: number,
  currentLikes: number,
  liked: boolean
): Promise<ProductActionResult<{ likes: number }>> {
  const nextLikes = liked ? Math.max(0, currentLikes - 1) : currentLikes + 1
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from(PRODUCTS_TABLE).update({ likes: nextLikes }).eq("id", id)
    if (error) return { ok: false, error: error.message }

    // Likes are cosmetic — don't blow away the home route cache on every tap.
    revalidatePath(`/product/${id}`)
    return { ok: true, data: { likes: nextLikes } }
  } catch (err) {
    console.error("[products] toggleProductLikeAction failed:", err)
    return { ok: false, error: "Database connection failed." }
  }
}
