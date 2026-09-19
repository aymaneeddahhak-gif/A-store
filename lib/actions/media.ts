"use server"

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"

const BUCKET = "product-media"
const MAX_BYTES = 25 * 1024 * 1024

export type MediaActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; unconfigured?: boolean }

/**
 * Uploads a product photo/video to the public product-media bucket and
 * returns its public URL for the product form. Any signed-in seller may
 * upload; the serviceside client bypasses storage RLS so no storage policy
 * is needed beyond public read.
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
  const isImage = file.type.startsWith("image/")
  const isVideo = file.type.startsWith("video/")
  if (!isImage && !isVideo) {
    return { ok: false, error: "Only image or video files are allowed." }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File must be under 25 MB." }
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
  const path = `${isImage ? "images" : "videos"}/${Date.now()}-${safeName}`
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
