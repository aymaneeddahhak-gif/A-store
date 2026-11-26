"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import {
  PRODUCTS_CACHE_TAG,
  invalidateProductCache,
  listStoreProducts,
} from "@/lib/queries/products"
import { migrateProductAssetPaths } from "@/lib/product-media"
import { isAdminEmail } from "@/lib/admin"
import { isSellerEmail } from "@/lib/seller"
import { isUuid } from "@/lib/demo-seller-server"
import { logAudit } from "@/lib/actions/audit"
import { allowedCategoryIds } from "@/lib/actions/categories"
import type { Product } from "@/lib/types"

const PRODUCTS_TABLE = "products"
const LIKES_TABLE = "product_likes"

export type ProductActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export type NewProductInput = Omit<Product, "id" | "likes" | "rating" | "reviews">

async function requireSeller() {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return null
  const email = auth.user.email ?? ""
  if (!isSellerEmail(email)) return null
  const admin = isAdminEmail(email)
  return {
    supabase,
    userId: auth.user.id,
    email,
    admin,
  }
}

function writeClient(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  return createSupabaseAdminClient() ?? supabase
}

function isMissingTableError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false
  const msg = `${error.code ?? ""} ${error.message ?? ""}`
  return /42P01|PGRST205|schema cache|does not exist/i.test(msg)
}

function parseLikedIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  return Array.from(
    new Set(raw.map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0))
  )
}

function sanitizeVariants(input: {
  custom_colors?: unknown
  custom_sizes?: unknown
  images?: unknown
}): {
  custom_colors: { name: string; hex: string; image?: string }[]
  custom_sizes: string[]
  images: string[] | undefined
} {
  const rawColors = Array.isArray(input.custom_colors) ? input.custom_colors : []
  const custom_colors = rawColors
    .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
    .map((c) => {
      const hex = String(c.hex ?? "")
      const rawImg = typeof c.image === "string" ? c.image.trim() : ""
      const safeImg =
        rawImg && (rawImg.startsWith("/images/") || /^https?:\/\//i.test(rawImg))
          ? rawImg.slice(0, 500)
          : undefined
      return {
        name: String(c.name ?? "").trim().slice(0, 30),
        hex: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#888888",
        ...(safeImg ? { image: safeImg } : {}),
      }
    })
    .filter((c) => c.name !== "")
    .slice(0, 8)
  const rawSizes = Array.isArray(input.custom_sizes) ? input.custom_sizes : []
  const custom_sizes = rawSizes
    .map((s) => String(s).trim().slice(0, 12))
    .filter((s) => s !== "")
    .slice(0, 12)
  const rawImages = Array.isArray(input.images) ? input.images : undefined
  const images = rawImages
    ? [...new Set(rawImages.map((s) => String(s).trim()).filter(Boolean))].slice(0, 6)
    : undefined
  return { custom_colors, custom_sizes, images }
}

async function ownsRow(
  db: ReturnType<typeof writeClient>,
  userId: string,
  id: number
): Promise<boolean> {
  const { data } = await db
    .from(PRODUCTS_TABLE)
    .select("user_id")
    .eq("id", id)
    .maybeSingle()
  return (data as { user_id?: string | null } | null)?.user_id === userId
}

function validateProductInput(input: {
  name?: string
  price?: number
  original_price?: number | null
}) {
  if (input.name !== undefined) {
    if (!input.name.trim()) return "Product name is required."
    if (input.name.trim().length > 120) return "Product name is too long."
  }
  if (input.price !== undefined) {
    if (typeof input.price !== "number" || !Number.isFinite(input.price) || input.price < 0) {
      return "Price must be a positive number."
    }
  }
  if (input.original_price !== undefined && input.original_price !== null) {
    if (
      typeof input.original_price !== "number" ||
      !Number.isFinite(input.original_price) ||
      input.original_price < 0
    ) {
      return "Compare-at price must be a positive number."
    }
  }
  return null
}

export async function createProductAction(
  input: NewProductInput
): Promise<ProductActionResult<Product>> {
  const validationError = validateProductInput(input)
  if (validationError) return { ok: false, error: validationError }

  const seller = await requireSeller()
  if (!seller) return { ok: false, error: "Seller account required to manage products." }
  if (!seller.admin && !isUuid(seller.userId)) {
    return { ok: false, error: "Authenticated Supabase user required." }
  }
  if (!(await allowedCategoryIds()).has(input.category)) {
    return { ok: false, error: "Unknown category." }
  }

  const { user_id: _owner, featured: _featured, ...rest } = input as NewProductInput & {
    user_id?: unknown
    featured?: unknown
  }
  void _owner
  void _featured
  const row = {
    ...rest,
    ...sanitizeVariants(input),
    name: input.name.trim(),
    likes: 0,
    rating: 0,
    reviews: [],
    stock: input.stock ?? 0,
    is_published: input.is_published ?? true,
    featured: false,
    user_id: seller.admin ? null : seller.userId,
  }

  try {
    const db = writeClient(seller.supabase)
    const { data, error } = await db.from(PRODUCTS_TABLE).insert([row]).select().single()
    if (error || !data) {
      return { ok: false, error: error?.message || "Could not create product in Supabase." }
    }
    invalidateProductCache()
    revalidateTag(PRODUCTS_CACHE_TAG)
    revalidatePath("/")
    revalidatePath("/seller")
    const created = data as Product
    void logAudit({
      actorId: seller.userId,
      actorEmail: seller.email,
      action: "create",
      entity: "product",
      entityId: created.id,
      detail: { name: created.name, price: created.price },
    })
    return { ok: true, data: created }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not reach Supabase.",
    }
  }
}

export async function updateProductAction(
  id: number,
  updates: Partial<Product>
): Promise<ProductActionResult> {
  const {
    id: _id,
    likes: _likes,
    rating: _rating,
    user_id: _owner,
    featured: _featured,
    ...validUpdates
  } = updates as Partial<Product> & { id?: number }
  void _id
  void _likes
  void _rating
  void _owner
  void _featured

  for (const key of ["custom_colors", "custom_sizes", "images"] as const) {
    if (key in validUpdates) {
      const clean = sanitizeVariants({
        [key]: (validUpdates as Record<string, unknown>)[key],
      })
      ;(validUpdates as Record<string, unknown>)[key] = clean[key]
    }
  }

  if (
    validUpdates.price !== undefined ||
    validUpdates.name !== undefined ||
    validUpdates.original_price !== undefined
  ) {
    const validationError = validateProductInput({
      ...(validUpdates.name !== undefined ? { name: validUpdates.name } : {}),
      ...(validUpdates.price !== undefined ? { price: validUpdates.price } : {}),
      ...(validUpdates.original_price !== undefined
        ? { original_price: validUpdates.original_price }
        : {}),
    })
    if (validationError) return { ok: false, error: validationError }
  }

  const seller = await requireSeller()
  if (!seller) return { ok: false, error: "Seller account required to manage products." }
  const db = writeClient(seller.supabase)
  if (!seller.admin && !(await ownsRow(db, seller.userId, id))) {
    return { ok: false, error: "You can only edit your own products." }
  }
  if (
    validUpdates.category !== undefined &&
    !(await allowedCategoryIds()).has(validUpdates.category)
  ) {
    return { ok: false, error: "Unknown category." }
  }

  try {
    let query = db.from(PRODUCTS_TABLE).update(validUpdates).eq("id", id)
    if (!seller.admin) query = query.eq("user_id", seller.userId)
    const { data: updated, error } = await query.select("id")
    if (error || !updated || updated.length === 0) {
      return { ok: false, error: error?.message || "Could not update product in Supabase." }
    }
    invalidateProductCache()
    revalidateTag(PRODUCTS_CACHE_TAG)
    revalidatePath("/")
    revalidatePath(`/product/${id}`)
    revalidatePath("/seller")
    void logAudit({
      actorId: seller.userId,
      actorEmail: seller.email,
      action: "update",
      entity: "product",
      entityId: id,
      detail: validUpdates,
    })
    return { ok: true, data: null }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not reach Supabase.",
    }
  }
}

export async function deleteProductAction(id: number): Promise<ProductActionResult> {
  const seller = await requireSeller()
  if (!seller) return { ok: false, error: "Seller account required to manage products." }
  const db = writeClient(seller.supabase)
  if (!seller.admin && !(await ownsRow(db, seller.userId, id))) {
    return { ok: false, error: "You can only delete your own products." }
  }

  try {
    let query = db.from(PRODUCTS_TABLE).delete().eq("id", id)
    if (!seller.admin) query = query.eq("user_id", seller.userId)
    const { data: deleted, error } = await query.select("id")
    if (error || !deleted || deleted.length === 0) {
      return { ok: false, error: error?.message || "Could not delete product from Supabase." }
    }
    invalidateProductCache()
    revalidateTag(PRODUCTS_CACHE_TAG)
    revalidatePath("/")
    revalidatePath("/seller")
    void logAudit({
      actorId: seller.userId,
      actorEmail: seller.email,
      action: "delete",
      entity: "product",
      entityId: id,
    })
    return { ok: true, data: null }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not reach Supabase.",
    }
  }
}

async function readUserLikedIds(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  fallbackMeta?: Record<string, unknown>
): Promise<{ mode: "table" | "metadata"; ids: number[] }> {
  const db = createSupabaseAdminClient() ?? supabase
  const { data, error } = await db
    .from(LIKES_TABLE)
    .select("product_id")
    .eq("user_id", userId)

  if (!error && Array.isArray(data)) {
    return {
      mode: "table",
      ids: parseLikedIds(data.map((r) => (r as { product_id: number }).product_id)),
    }
  }

  if (isMissingTableError(error)) {
    const admin = createSupabaseAdminClient()
    if (admin) {
      const { data: userRes } = await admin.auth.admin.getUserById(userId)
      const meta = (userRes?.user?.user_metadata ?? fallbackMeta ?? {}) as Record<string, unknown>
      return { mode: "metadata", ids: parseLikedIds(meta.liked_product_ids) }
    }
    return { mode: "metadata", ids: parseLikedIds(fallbackMeta?.liked_product_ids) }
  }

  return { mode: "metadata", ids: parseLikedIds(fallbackMeta?.liked_product_ids) }
}

export async function getMyLikedProductIdsAction(): Promise<ProductActionResult<number[]>> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user || !isUuid(auth.user.id)) return { ok: true, data: [] }

    const { ids } = await readUserLikedIds(
      supabase,
      auth.user.id,
      (auth.user.user_metadata ?? {}) as Record<string, unknown>
    )
    return { ok: true, data: ids }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not load favourites.",
    }
  }
}

export async function toggleProductLikeAction(
  id: number,
  _clientLikes: number,
  _likedHint: boolean
): Promise<ProductActionResult<{ likes: number; likedIds: number[] }>> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user || !isUuid(auth.user.id)) {
      return { ok: false, error: "Please sign in to save favourites." }
    }

    const db = createSupabaseAdminClient() ?? supabase
    const { mode, ids } = await readUserLikedIds(
      supabase,
      auth.user.id,
      (auth.user.user_metadata ?? {}) as Record<string, unknown>
    )
    const currentlyLiked = ids.includes(id)
    const nextLikedIds = currentlyLiked ? ids.filter((x) => x !== id) : [...ids, id]

    if (mode === "table") {
      if (currentlyLiked) {
        const { error } = await db
          .from(LIKES_TABLE)
          .delete()
          .eq("user_id", auth.user.id)
          .eq("product_id", id)
        if (error) return { ok: false, error: error.message }
      } else {
        const { error } = await db
          .from(LIKES_TABLE)
          .upsert([{ user_id: auth.user.id, product_id: id }], {
            onConflict: "user_id,product_id",
          })
        if (error) return { ok: false, error: error.message }
      }
    } else {
      const admin = createSupabaseAdminClient()
      if (admin) {
        const { data: existing } = await admin.auth.admin.getUserById(auth.user.id)
        const nextMeta = {
          ...(existing?.user?.user_metadata ?? {}),
          liked_product_ids: nextLikedIds,
        }
        const { error } = await admin.auth.admin.updateUserById(auth.user.id, {
          user_metadata: nextMeta,
        })
        if (error) return { ok: false, error: error.message }
      } else {
        const { error } = await supabase.auth.updateUser({
          data: { liked_product_ids: nextLikedIds },
        })
        if (error) return { ok: false, error: error.message }
      }
    }

    const { data: currentProduct } = await db
      .from(PRODUCTS_TABLE)
      .select("likes")
      .eq("id", id)
      .maybeSingle()

    const currentLikes = Math.max(0, Number(currentProduct?.likes) || 0)
    const nextLikes = currentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1
    if (currentProduct) {
      await db.from(PRODUCTS_TABLE).update({ likes: nextLikes }).eq("id", id)
      invalidateProductCache()
      revalidateTag(PRODUCTS_CACHE_TAG)
      revalidatePath(`/product/${id}`)
    }

    return { ok: true, data: { likes: nextLikes, likedIds: nextLikedIds } }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not update favourites.",
    }
  }
}

export async function listSellerProductsAction(): Promise<ProductActionResult<Product[]>> {
  const seller = await requireSeller()
  if (!seller) return { ok: false, error: "Seller account required to manage products." }

  try {
    const db = writeClient(seller.supabase)
    let query = db.from(PRODUCTS_TABLE).select("*").order("id", { ascending: true })
    if (seller.admin) {
      query = query.or("user_id.is.null,is_published.eq.true")
    } else {
      query = query.eq("user_id", seller.userId)
    }
    const { data, error } = await query
    if (error || !Array.isArray(data)) {
      return { ok: false, error: error?.message || "Could not load products from Supabase." }
    }
    const rows = (data as Product[])
      .map(migrateProductAssetPaths)
      .filter((product): product is Product => product !== null)
    return { ok: true, data: rows }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not reach Supabase.",
    }
  }
}

export async function toggleFeaturedAction(
  id: number,
  featured: boolean
): Promise<ProductActionResult> {
  const seller = await requireSeller()
  if (!seller || !seller.admin) {
    return { ok: false, error: "Restricted to the store admin." }
  }

  try {
    const db = writeClient(seller.supabase)
    const { data: pinned, error } = await db
      .from(PRODUCTS_TABLE)
      .update({ featured })
      .eq("id", id)
      .select("id")
    if (error || !pinned || pinned.length === 0) {
      return { ok: false, error: error?.message || "Could not update featured status." }
    }
    invalidateProductCache()
    revalidateTag(PRODUCTS_CACHE_TAG)
    revalidatePath("/")
    void logAudit({
      actorId: seller.userId,
      actorEmail: seller.email,
      action: featured ? "feature" : "unfeature",
      entity: "product",
      entityId: id,
    })
    return { ok: true, data: null }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not reach Supabase.",
    }
  }
}

export async function refreshCatalogAction(): Promise<ProductActionResult<Product[]>> {
  try {
    return { ok: true, data: await listStoreProducts() }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not load catalog.",
    }
  }
}
