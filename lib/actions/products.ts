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
import { isDemoSellerUser } from "@/lib/demo-seller-products"
import { isUuid, resetDemoSellerRows } from "@/lib/demo-seller-server"
import { logAudit } from "@/lib/actions/audit"
import { allowedCategoryIds } from "@/lib/actions/categories"
import { isSupabaseOffline } from "@/lib/supabase-circuit"
import { getFallbackProducts, setFallbackProducts } from "@/lib/fallback-catalog"
import type { Product } from "@/lib/types"

const PRODUCTS_TABLE = "products"

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
  const demoSandbox = !admin && isDemoSellerUser(email) && isUuid(auth.user.id)
  return {
    supabase,
    userId: auth.user.id,
    email,
    admin,
    demoSandbox,
  }
}

function writeClient(seller: NonNullable<Awaited<ReturnType<typeof requireSeller>>>) {
  return seller.admin || seller.demoSandbox
    ? createSupabaseAdminClient() ?? seller.supabase
    : seller.supabase
}

function sanitizeVariants(input: {
  custom_colors?: unknown
  custom_sizes?: unknown
  images?: unknown
}): {
  custom_colors: { name: string; hex: string }[]
  custom_sizes: string[]
  images: string[] | undefined
} {
  const rawColors = Array.isArray(input.custom_colors) ? input.custom_colors : []
  const custom_colors = rawColors
    .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
    .map((c) => {
      const hex = String(c.hex ?? "")
      return {
        name: String(c.name ?? "").trim().slice(0, 30),
        hex: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#888888",
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
  if (isSupabaseOffline()) {
    const row = getFallbackProducts().find((p) => p.id === id)
    return row?.user_id === userId
  }
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
    // Demo sandbox products stay strictly unpublished so they never leak to the main storefront.
    is_published: seller.demoSandbox ? false : input.is_published ?? true,
    featured: false,
    user_id: seller.admin ? null : seller.userId,
  }

  if (!isSupabaseOffline()) {
    try {
      const db = writeClient(seller)
      const { data, error } = await db.from(PRODUCTS_TABLE).insert([row]).select().single()
      if (!error && data) {
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
      }
    } catch {
      // Fall through to in-memory fallback when Supabase is paused
    }
  }

  const current = getFallbackProducts()
  const nextId = current.reduce((max, p) => Math.max(max, p.id), 0) + 1
  const created: Product = { ...row, id: nextId }
  setFallbackProducts([...current, created])
  invalidateProductCache()
  revalidateTag(PRODUCTS_CACHE_TAG)
  revalidatePath("/")
  revalidatePath("/seller")
  return { ok: true, data: created }
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
  const db = writeClient(seller)
  if (!seller.admin && !(await ownsRow(db, seller.userId, id))) {
    return { ok: false, error: "You can only edit your own products." }
  }
  if (
    validUpdates.category !== undefined &&
    !(await allowedCategoryIds()).has(validUpdates.category)
  ) {
    return { ok: false, error: "Unknown category." }
  }
  if (seller.demoSandbox) {
    validUpdates.is_published = false
  }

  if (!isSupabaseOffline()) {
    try {
      let query = db.from(PRODUCTS_TABLE).update(validUpdates).eq("id", id)
      if (!seller.admin) query = query.eq("user_id", seller.userId)
      const { data: updated, error } = await query.select("id")
      if (!error && updated && updated.length > 0) {
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
      }
    } catch {
      // Fall through to fallback store
    }
  }

  const current = getFallbackProducts()
  setFallbackProducts(current.map((p) => (p.id === id ? { ...p, ...validUpdates } : p)))
  invalidateProductCache()
  revalidateTag(PRODUCTS_CACHE_TAG)
  revalidatePath("/")
  revalidatePath(`/product/${id}`)
  revalidatePath("/seller")
  return { ok: true, data: null }
}

export async function deleteProductAction(id: number): Promise<ProductActionResult> {
  const seller = await requireSeller()
  if (!seller) return { ok: false, error: "Seller account required to manage products." }
  const db = writeClient(seller)
  if (!seller.admin && !(await ownsRow(db, seller.userId, id))) {
    return { ok: false, error: "You can only delete your own products." }
  }

  if (!isSupabaseOffline()) {
    try {
      let query = db.from(PRODUCTS_TABLE).delete().eq("id", id)
      if (!seller.admin) query = query.eq("user_id", seller.userId)
      const { data: deleted, error } = await query.select("id")
      if (!error && deleted && deleted.length > 0) {
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
      }
    } catch {
      // Fall through to fallback store
    }
  }

  setFallbackProducts(getFallbackProducts().filter((p) => p.id !== id))
  invalidateProductCache()
  revalidateTag(PRODUCTS_CACHE_TAG)
  revalidatePath("/")
  revalidatePath("/seller")
  return { ok: true, data: null }
}

export async function toggleProductLikeAction(
  id: number,
  _clientLikes: number,
  liked: boolean
): Promise<ProductActionResult<{ likes: number }>> {
  if (!isSupabaseOffline()) {
    try {
      const supabase = await createSupabaseServerClient()
      const db = createSupabaseAdminClient() ?? supabase

      const { data: currentProduct } = await db
        .from(PRODUCTS_TABLE)
        .select("likes")
        .eq("id", id)
        .maybeSingle()

      if (currentProduct) {
        const currentLikes = Math.max(0, Number(currentProduct.likes) || 0)
        const nextLikes = liked ? Math.max(0, currentLikes - 1) : currentLikes + 1
        const { error } = await db
          .from(PRODUCTS_TABLE)
          .update({ likes: nextLikes })
          .eq("id", id)
        if (!error) {
          invalidateProductCache()
          revalidateTag(PRODUCTS_CACHE_TAG)
          revalidatePath(`/product/${id}`)
          return { ok: true, data: { likes: nextLikes } }
        }
      }
    } catch {
      // Fall through to fallback store
    }
  }

  const current = getFallbackProducts()
  const target = current.find((p) => p.id === id)
  const currentLikes = Math.max(0, Number(target?.likes) || 0)
  const nextLikes = liked ? Math.max(0, currentLikes - 1) : currentLikes + 1
  setFallbackProducts(current.map((p) => (p.id === id ? { ...p, likes: nextLikes } : p)))
  invalidateProductCache()
  revalidateTag(PRODUCTS_CACHE_TAG)
  return { ok: true, data: { likes: nextLikes } }
}

export async function listSellerProductsAction(): Promise<ProductActionResult<Product[]>> {
  const seller = await requireSeller()
  if (!seller) return { ok: false, error: "Seller account required to manage products." }

  if (!isSupabaseOffline()) {
    try {
      const db = writeClient(seller)
      let query = db.from(PRODUCTS_TABLE).select("*").order("id", { ascending: true })
      if (seller.admin) {
        // Official Admin sees store products + published seller products, never ephemeral demo sandboxes.
        query = query.or("user_id.is.null,is_published.eq.true")
      } else {
        query = query.eq("user_id", seller.userId)
      }
      const { data, error } = await query
      if (!error && Array.isArray(data)) {
        const rows = (data as Product[])
          .map(migrateProductAssetPaths)
          .filter((product): product is Product => product !== null)
        // Return exact DB rows (even if empty — never leak store catalog products to non-admin sellers!)
        if (seller.demoSandbox || !seller.admin || rows.length > 0) {
          return { ok: true, data: rows }
        }
      }
    } catch {
      // Fall through to fallback products only when Supabase is unreachable
    }
  }

  const all = getFallbackProducts()
  const rows = seller.admin ? all : all.filter((p) => p.user_id === seller.userId)
  return { ok: true, data: rows }
}

export async function resetDemoSellerProductsAction(): Promise<ProductActionResult<Product[]>> {
  const seller = await requireSeller()
  if (!seller || !seller.demoSandbox) {
    return { ok: false, error: "Reset is only available for Demo Seller sessions." }
  }
  const seeded = await resetDemoSellerRows(seller.userId)
  if (!seeded) {
    return { ok: false, error: "Could not reset demo products right now." }
  }
  revalidatePath("/seller")
  return { ok: true, data: seeded }
}

export async function toggleFeaturedAction(
  id: number,
  featured: boolean
): Promise<ProductActionResult> {
  const seller = await requireSeller()
  if (!seller || !seller.admin) {
    return { ok: false, error: "Restricted to the store admin." }
  }

  if (!isSupabaseOffline()) {
    try {
      const db = writeClient(seller)
      const { data: pinned, error } = await db
        .from(PRODUCTS_TABLE)
        .update({ featured })
        .eq("id", id)
        .select("id")
      if (!error && pinned && pinned.length > 0) {
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
      }
    } catch {
      // Fall through to fallback products
    }
  }

  setFallbackProducts(
    getFallbackProducts().map((p) => (p.id === id ? { ...p, featured } : p))
  )
  invalidateProductCache()
  revalidateTag(PRODUCTS_CACHE_TAG)
  revalidatePath("/")
  return { ok: true, data: null }
}

export async function refreshCatalogAction(): Promise<ProductActionResult<Product[]>> {
  try {
    return { ok: true, data: await listStoreProducts() }
  } catch {
    return { ok: true, data: getFallbackProducts().filter((p) => p.user_id == null) }
  }
}
