"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { PRODUCTS_CACHE_TAG, invalidateProductCache } from "@/lib/queries/products"
import { migrateProductAssetPaths } from "@/lib/product-media"
import { isAdminEmail } from "@/lib/admin"
import { logAudit } from "@/lib/actions/audit"
import { allowedCategoryIds } from "@/lib/actions/categories"
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

/**
 * Session plus role: the admin manages the whole catalog, every other
 * seller is sandboxed to rows carrying their own id.
 */
async function requireSeller() {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return null
  return {
    supabase,
    userId: auth.user.id,
    email: auth.user.email ?? "",
    admin: isAdminEmail(auth.user.email),
  }
}

/**
 * Trust-boundary sanitizer for seller-defined variants. Names, sizes and
 * image lists are capped so a forged request cannot stash junk in a row.
 */
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

/**
 * Ownership pre-check for non-admin writes. Supabase reports a scoped
 * UPDATE/DELETE with zero matches as success, so without this check a
 * seller could not tell a forbidden id from a missing one.
 */
async function ownsRow(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  id: number
): Promise<boolean> {
  const { data } = await supabase
    .from(PRODUCTS_TABLE)
    .select("user_id")
    .eq("id", id)
    .maybeSingle()
  return (data as { user_id?: string | null } | null)?.user_id === userId
}

function validateProductInput(input: { name?: string; price?: number; original_price?: number | null }) {
  // Each field is validated only when the caller supplies it: creation sends
  // both, updates send a partial patch (a price-only patch must not fail on
  // a missing name).
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
    if (typeof input.original_price !== "number" || !Number.isFinite(input.original_price) || input.original_price < 0) {
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

  try {
    const seller = await requireSeller()
    if (!seller) return { ok: false, error: "You must be signed in to manage products." }
    if (!(await allowedCategoryIds()).has(input.category)) {
      return { ok: false, error: "Unknown category." }
    }

    // Ownership and featuring are server-assigned: admin rows join the
    // public catalog, everyone else's rows are sandboxed to their own
    // dashboard, and only the admin can pin the hero via toggleFeaturedAction.
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
      user_id: seller.admin ? null : seller.userId,
    }
    const { data, error } = await seller.supabase.from(PRODUCTS_TABLE).insert([row]).select().single()

    if (error) return { ok: false, error: error.message }

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
    console.error("[products] createProductAction failed:", err)
    return { ok: false, error: "Database connection failed." }
  }
}

export async function updateProductAction(
  id: number,
  updates: Partial<Product>
): Promise<ProductActionResult> {
  // Strip id from the patch — never let callers mutate the primary key.
  // Ownership and featuring are stripped too: assigned at creation (owner)
  // or via the admin-only toggle (featured), never through a patch.
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

  if (validUpdates.price !== undefined || validUpdates.name !== undefined || validUpdates.original_price !== undefined) {
    const validationError = validateProductInput({
      ...(validUpdates.name !== undefined ? { name: validUpdates.name } : {}),
      ...(validUpdates.price !== undefined ? { price: validUpdates.price } : {}),
      ...(validUpdates.original_price !== undefined ? { original_price: validUpdates.original_price } : {}),
    })
    if (validationError) return { ok: false, error: validationError }
  }

  try {
    const seller = await requireSeller()
    if (!seller) return { ok: false, error: "You must be signed in to manage products." }
    if (!seller.admin && !(await ownsRow(seller.supabase, seller.userId, id))) {
      return { ok: false, error: "You can only edit your own products." }
    }
    if (validUpdates.category !== undefined && !(await allowedCategoryIds()).has(validUpdates.category)) {
      return { ok: false, error: "Unknown category." }
    }

    const { error } = await seller.supabase.from(PRODUCTS_TABLE).update(validUpdates).eq("id", id)
    if (error) return { ok: false, error: error.message }

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
    console.error("[products] updateProductAction failed:", err)
    return { ok: false, error: "Database connection failed." }
  }
}

export async function deleteProductAction(id: number): Promise<ProductActionResult> {
  try {
    const seller = await requireSeller()
    if (!seller) return { ok: false, error: "You must be signed in to manage products." }
    if (!seller.admin && !(await ownsRow(seller.supabase, seller.userId, id))) {
      return { ok: false, error: "You can only delete your own products." }
    }

    const { error } = await seller.supabase.from(PRODUCTS_TABLE).delete().eq("id", id)
    if (error) return { ok: false, error: error.message }

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
    invalidateProductCache()
    revalidateTag(PRODUCTS_CACHE_TAG)
    revalidatePath(`/product/${id}`)
    return { ok: true, data: { likes: nextLikes } }
  } catch (err) {
    console.error("[products] toggleProductLikeAction failed:", err)
    return { ok: false, error: "Database connection failed." }
  }
}

/**
 * Dashboard inventory read — intentionally uncached (per-seller data must
 * never be shared between sessions via unstable_cache). The admin sees the
 * whole table; every other seller sees only their own sandbox rows.
 */
export async function listSellerProductsAction(): Promise<
  ProductActionResult<Product[]>
> {
  try {
    const seller = await requireSeller()
    if (!seller) return { ok: false, error: "You must be signed in to manage products." }

    let query = seller.supabase.from(PRODUCTS_TABLE).select("*").order("id", { ascending: true })
    if (!seller.admin) query = query.eq("user_id", seller.userId)

    const { data, error } = await query
    if (error || !data) return { ok: false, error: error?.message ?? "Database connection failed." }

    const rows = (data as Product[])
      .map(migrateProductAssetPaths)
      .filter((product): product is Product => product !== null)
    return { ok: true, data: rows }
  } catch (err) {
    console.error("[products] listSellerProductsAction failed:", err)
    return { ok: false, error: "Database connection failed." }
  }
}

/**
 * Pins or unpins a product on the moving hero showcase. Admin-only, and
 * only store rows (user_id null) can be featured — sandbox rows never reach
 * the storefront anyway.
 */
export async function toggleFeaturedAction(
  id: number,
  featured: boolean
): Promise<ProductActionResult> {
  try {
    const seller = await requireSeller()
    if (!seller || !seller.admin) {
      return { ok: false, error: "Restricted to the store admin." }
    }

    const { data: row } = await seller.supabase
      .from(PRODUCTS_TABLE)
      .select("user_id")
      .eq("id", id)
      .maybeSingle()
    if ((row as { user_id?: string | null } | null)?.user_id) {
      return { ok: false, error: "Only store products can be featured." }
    }

    const { error } = await seller.supabase
      .from(PRODUCTS_TABLE)
      .update({ featured })
      .eq("id", id)
    if (error) return { ok: false, error: error.message }

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
    console.error("[products] toggleFeaturedAction failed:", err)
    return { ok: false, error: "Database connection failed." }
  }
}
