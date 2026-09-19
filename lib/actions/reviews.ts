"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { PRODUCTS_CACHE_TAG, invalidateProductCache } from "@/lib/queries/products"
import type { Product, Review } from "@/lib/types"

const PRODUCTS_TABLE = "products"
const MAX_COMMENT_LENGTH = 1000
const MIN_COMMENT_LENGTH = 3

export type ReviewActionResult<T = null> =
  | { ok: true; data: T; persisted: boolean }
  | { ok: false; error: string }

/** Only the fields a reviewer actually supplies. Author + date are server-side. */
export type NewReviewInput = { rating: number; comment: string; photos?: string[] }

const MAX_REVIEW_PHOTOS = 4

function sanitizePhotos(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined
  const urls = input
    .filter((u): u is string => typeof u === "string")
    .map((u) => u.trim())
    .filter((u) => u !== "" && u.length <= 2500)
    .slice(0, MAX_REVIEW_PHOTOS)
  return urls.length > 0 ? urls : undefined
}

function validate(input: NewReviewInput): string | null {
  const rating = Number(input?.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return "Please choose a rating between 1 and 5 stars."
  }
  const comment = typeof input?.comment === "string" ? input.comment.trim() : ""
  if (comment.length < MIN_COMMENT_LENGTH) {
    return "Please write a little more about the product."
  }
  if (comment.length > MAX_COMMENT_LENGTH) {
    return `Reviews are limited to ${MAX_COMMENT_LENGTH} characters.`
  }
  return null
}

/**
 * Adds a review to a product.
 *
 * Reviews live in a JSON column on `products`, so the append is a
 * read-modify-write. The current array is re-read here rather than accepted
 * from the caller: trusting a client-supplied array would let anyone rewrite
 * every review on the product, and would clobber concurrent submissions.
 *
 * The write needs UPDATE on `products`, which anonymous visitors will not have
 * under a sensible RLS policy. When the write is refused the review is still
 * returned with `persisted: false` so the storefront can show it for the
 * session — the same degradation the orders flow already uses.
 */
export async function addReviewAction(
  productId: number,
  input: NewReviewInput
): Promise<ReviewActionResult<Review>> {
  if (!Number.isInteger(productId)) {
    return { ok: false, error: "Unknown product." }
  }

  const invalid = validate(input)
  if (invalid) return { ok: false, error: invalid }

  const comment = input.comment.trim()
  const rating = Number(input.rating)
  const photos = sanitizePhotos(input.photos)

  try {
    const supabase = await createSupabaseServerClient()

    // Attribute the review to the signed-in account when there is one.
    const { data: auth } = await supabase.auth.getUser()
    const authorName =
      (auth?.user?.user_metadata?.username as string | undefined) ||
      (auth?.user?.user_metadata?.full_name as string | undefined) ||
      auth?.user?.email?.split("@")[0] ||
      "Guest"

    const newReview: Review = {
      id: crypto.randomUUID(),
      user: authorName,
      rating,
      comment,
      date: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorName)}`,
      ...(photos ? { photos } : {}),
    }

    const { data: row } = await supabase
      .from(PRODUCTS_TABLE)
      .select("reviews")
      .eq("id", productId)
      .maybeSingle()

    const existing: Review[] = Array.isArray(row?.reviews) ? (row.reviews as Review[]) : []
    const updatedReviews = [newReview, ...existing]
    const avgRating =
      updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length

    const { error } = await supabase
      .from(PRODUCTS_TABLE)
      .update({
        reviews: updatedReviews,
        rating: parseFloat(avgRating.toFixed(1)),
      })
      .eq("id", productId)

    if (error) {
      return { ok: true, data: newReview, persisted: false }
    }

    revalidateTag(PRODUCTS_CACHE_TAG)
    revalidatePath(`/product/${productId}`)
    invalidateProductCache()
    return { ok: true, data: newReview, persisted: true }
  } catch {
    return {
      ok: true,
      data: {
        id: crypto.randomUUID(),
        user: "Guest",
        rating,
        comment,
        date: new Date().toISOString(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`,
        ...(sanitizePhotos(input.photos) ? { photos: sanitizePhotos(input.photos) } : {}),
      },
      persisted: false,
    }
  }
}

// Re-export for callers that still think in Product terms.
export type { Product }
