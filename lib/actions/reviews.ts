"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { Product, Review } from "@/lib/types"

const PRODUCTS_TABLE = "products"

export type ReviewActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export type NewReviewInput = Omit<Review, "id" | "date">

export async function addReviewAction(
  productId: number,
  input: NewReviewInput,
  currentReviews: Review[]
): Promise<ReviewActionResult<Review>> {
  const newReview: Review = {
    ...input,
    id: Math.random().toString(36).slice(2, 11),
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  }

  const updatedReviews = [newReview, ...currentReviews]
  const avgRating =
    updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length

  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase
      .from(PRODUCTS_TABLE)
      .update({
        reviews: updatedReviews,
        rating: parseFloat(avgRating.toFixed(1)),
      })
      .eq("id", productId)

    if (error) return { ok: false, error: error.message }

    revalidatePath(`/product/${productId}`)
    revalidatePath("/")
    return { ok: true, data: newReview }
  } catch (err) {
    console.error("[reviews] addReviewAction failed:", err)
    return { ok: false, error: "Database connection failed." }
  }
}

// Re-export for callers that still think in Product terms.
export type { Product }
