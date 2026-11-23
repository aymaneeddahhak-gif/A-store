"use server"

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { isSellerEmail } from "@/lib/seller"

const BUCKET = "product-media"
const MAX_SELLER_BYTES = 5 * 1024 * 1024
const MAX_SHOPPER_IMAGE_BYTES = 2 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
])

const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"])

export type MediaActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; unconfigured?: boolean }

/**
 * Uploads validated image/video media to the public product-media bucket.
 * Video uploads are restricted to the store team; shoppers may only upload
 * sanitized raster images (no SVG) up to 2 MB for avatars/reviews.
 */
export async function uploadMediaAction(
  formData: FormData
): Promise<MediaActionResult<{ url: string }>> {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    return { ok: false, error: "You must be signed in to upload media." }
  }

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file first." }
  }

  const isImage = ALLOWED_IMAGE_TYPES.has(file.type)
  const isVideo = ALLOWED_VIDEO_TYPES.has(file.type)
  if (!isImage && !isVideo) {
    return {
      ok: false,
      error: "Only JPEG, PNG, WebP, AVIF images or MP4/WebM videos are allowed.",
    }
  }

  const isSeller = isSellerEmail(auth.user.email)
  if (isVideo && !isSeller) {
    return { ok: false, error: "Video uploads are restricted to store sellers." }
  }

  const maxAllowed = isSeller ? MAX_SELLER_BYTES : MAX_SHOPPER_IMAGE_BYTES
  if (file.size > maxAllowed) {
    return {
      ok: false,
      error: `File must be under ${Math.round(maxAllowed / (1024 * 1024))} MB.`,
    }
  }

  const admin = createSupabaseAdminClient()
  if (!admin) {
    return {
      ok: false,
      error: "Uploads need SUPABASE_SERVICE_ROLE_KEY in .env.local.",
      unconfigured: true,
    }
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const folder = isVideo ? "videos" : isSeller ? "images" : `user-uploads/${auth.user.id}`
  const path = `${folder}/${Date.now()}-${safeName}`
  const bytes = await file.arrayBuffer()

  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  })
  if (error) {
    const missing =
      error.message.includes("Bucket not found") || error.message.includes("bucket")
    return {
      ok: false,
      error: missing
        ? "Missing public 'product-media' storage bucket — create it once in Supabase."
        : error.message,
    }
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  return { ok: true, data: { url: data.publicUrl } }
}
