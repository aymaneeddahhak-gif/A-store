"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { PRODUCTS_CACHE_TAG, invalidateProductCache } from "@/lib/queries/products"
import { isSupabaseOffline } from "@/lib/supabase-circuit"
import { getFallbackProducts, setFallbackProducts } from "@/lib/fallback-catalog"
import type { Product, Review } from "@/lib/types"

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

function persistReviewInFallback(productId: number, newReview: Review) {
  const products = getFallbackProducts()
  setFallbackProducts(
    products.map((p) => {
      if (p.id !== productId) return p
      const reviews = [newReview, ...(p.reviews ?? [])]
      const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      return { ...p, reviews, rating: parseFloat(avg.toFixed(1)) }
    })
  )
  invalidateProductCache()
  revalidateTag(PRODUCTS_CACHE_TAG)
  revalidatePath(`/product/${productId}`)
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

    if (isSupabaseOffline()) {
      persistReviewInFallback(productId, newReview)
      return { ok: true, data: newReview, persisted: true }
    }

    const { data: row } = await supabase
      .from(PRODUCTS_TABLE)
      .select("reviews")
      .eq("id", productId)
      .maybeSingle()

    if (isSupabaseOffline()) {
      persistReviewInFallback(productId, newReview)
      return { ok: true, data: newReview, persisted: true }
    }

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
    const fallbackReview: Review = {
      id: crypto.randomUUID(),
      user: "Guest",
      rating,
      comment,
      date: new Date().toISOString(),
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest",
      ...(photos ? { photos } : {}),
    }
    if (isSupabaseOffline()) {
      persistReviewInFallback(productId, fallbackReview)
      return { ok: true, data: fallbackReview, persisted: true }
    }
    return { ok: true, data: fallbackReview, persisted: false }
  }
}

export type { Product }
