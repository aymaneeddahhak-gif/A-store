"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { PRODUCTS_CACHE_TAG, invalidateProductCache } from "@/lib/queries/products"
import type { Review } from "@/lib/types"

const PRODUCTS_TABLE = "products"
const MAX_COMMENT_LENGTH = 1000
const MIN_COMMENT_LENGTH = 3
const MAX_REVIEW_PHOTOS = 4

export type ReviewActionResult<T = null> =
  | { ok: true; data: T; persisted: boolean }
  | { ok: false; error: string }

export type NewReviewInput = { rating: number; comment: string; photos?: string[] }

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
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) {
      return { ok: false, error: "Please sign in to post a review." }
    }

    const authorName =
      (auth.user.user_metadata?.username as string | undefined) ||
      (auth.user.user_metadata?.full_name as string | undefined) ||
      auth.user.email?.split("@")[0] ||
      "Customer"

    const newReview: Review = {
      id: crypto.randomUUID(),
      user: authorName,
      rating,
      comment,
      date: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorName)}`,
      ...(photos ? { photos } : {}),
    }

    const db = createSupabaseAdminClient() ?? supabase
    const { data: row, error: readErr } = await db
      .from(PRODUCTS_TABLE)
      .select("reviews")
      .eq("id", productId)
      .maybeSingle()

    if (readErr || !row) {
      return { ok: false, error: readErr?.message || "Product not found." }
    }

    const existing: Review[] = Array.isArray(row.reviews) ? (row.reviews as Review[]) : []
    const updatedReviews = [newReview, ...existing]
    const avgRating =
      updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length

    const { error } = await db
      .from(PRODUCTS_TABLE)
      .update({
        reviews: updatedReviews,
        rating: parseFloat(avgRating.toFixed(1)),
      })
      .eq("id", productId)

    if (error) {
      return { ok: false, error: error.message }
    }

    revalidateTag(PRODUCTS_CACHE_TAG)
    revalidatePath(`/product/${productId}`)
    invalidateProductCache()
    return { ok: true, data: newReview, persisted: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not save review to Supabase.",
    }
  }
}
