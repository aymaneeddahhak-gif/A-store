"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { isAdminEmail } from "@/lib/admin"
import { CATEGORIES } from "@/lib/categories"
import { LEGACY_CATEGORY } from "@/components/storefront/product-adapter"
import { createResilientFetch, isSupabaseOffline } from "@/lib/supabase-circuit"

const CATEGORIES_TABLE = "categories"
const PRODUCTS_TABLE = "products"
const CATEGORIES_REVALIDATE_MS = 900_000
const CATEGORIES_QUERY_TIMEOUT_MS = 1200

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export interface CategoryRow {
  id: string
  label: string
}

export type CategoryActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string }

const BUILTIN_IDS: Set<string> = new Set(CATEGORIES.map((c) => c.id))

interface CategoriesCacheSlot {
  at: number
  data: CategoryRow[]
  dirty: boolean
}

const globalCategories = globalThis as unknown as {
  __astoreFallbackCategories?: CategoryRow[]
  __astoreCategoriesCache?: CategoriesCacheSlot
}

function getCategoriesCache(): CategoriesCacheSlot {
  if (!globalCategories.__astoreCategoriesCache) {
    globalCategories.__astoreCategoriesCache = { at: 0, data: [], dirty: true }
  }
  return globalCategories.__astoreCategoriesCache
}

function invalidateCategoriesCache(): void {
  const slot = getCategoriesCache()
  slot.at = 0
  slot.dirty = true
}

function getFallbackCategories(): CategoryRow[] {
  if (!globalCategories.__astoreFallbackCategories) {
    globalCategories.__astoreFallbackCategories = []
  }
  return globalCategories.__astoreFallbackCategories
}

/** DB-defined categories (empty when offline or missing). */
export async function listCategoriesAction(): Promise<CategoryActionResult<CategoryRow[]>> {
  if (isSupabaseOffline() || !supabaseUrl || !supabaseAnonKey) {
    return { ok: true, data: getFallbackCategories() }
  }

  const slot = getCategoriesCache()
  if (!slot.dirty && Date.now() - slot.at < CATEGORIES_REVALIDATE_MS) {
    return { ok: true, data: slot.data }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: createResilientFetch() },
    })

    const result = await Promise.race([
      supabase.from(CATEGORIES_TABLE).select("id, label").order("label", { ascending: true }),
      new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(
          () => resolve({ data: null, error: { message: "Category query timeout" } }),
          CATEGORIES_QUERY_TIMEOUT_MS
        )
      ),
    ])

    if (result.error) {
      if (slot.data.length > 0) return { ok: true, data: slot.data }
      if (isSupabaseOffline()) return { ok: true, data: getFallbackCategories() }
      return { ok: false, error: result.error.message }
    }

    const rows = (result.data ?? []) as CategoryRow[]
    slot.data = rows
    slot.at = Date.now()
    slot.dirty = false
    return { ok: true, data: rows }
  } catch {
    if (slot.data.length > 0) return { ok: true, data: slot.data }
    return { ok: true, data: getFallbackCategories() }
  }
}

/** Every id a product row may reference: built-ins, legacy names, DB rows. */
export async function allowedCategoryIds(): Promise<Set<string>> {
  const ids: Set<string> = new Set([
    ...CATEGORIES.map((c) => c.id),
    ...Object.keys(LEGACY_CATEGORY),
  ])
  const res = await listCategoriesAction()
  if (res.ok) res.data.forEach((c) => ids.add(c.id))
  return ids
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user || !isAdminEmail(auth.user.email)) {
    return { ok: false as const, error: "Restricted to the store admin." }
  }
  return { ok: true as const, db: createSupabaseAdminClient() ?? supabase }
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function createCategoryAction(
  label: string
): Promise<CategoryActionResult<CategoryRow>> {
  const gate = await requireAdmin()
  if (!gate.ok) return gate

  const id = slugify(label)
  if (id.length < 2 || id.length > 24) {
    return { ok: false, error: "Name must slugify to 2–24 characters." }
  }
  if (BUILTIN_IDS.has(id)) {
    return { ok: false, error: "That category already exists." }
  }

  if (isSupabaseOffline()) {
    const current = getFallbackCategories()
    if (current.some((c) => c.id === id)) {
      return { ok: false, error: "That category already exists." }
    }
    const row = { id, label: label.trim() }
    globalCategories.__astoreFallbackCategories = [...current, row]
    invalidateCategoriesCache()
    revalidatePath("/")
    revalidatePath("/seller")
    return { ok: true, data: row }
  }

  const { data, error } = await gate.db
    .from(CATEGORIES_TABLE)
    .insert([{ id, label: label.trim() }])
    .select()
    .single()
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "That category already exists." : error.message,
    }
  }
  invalidateCategoriesCache()
  revalidatePath("/")
  revalidatePath("/seller")
  return { ok: true, data: data as CategoryRow }
}

export async function deleteCategoryAction(id: string): Promise<CategoryActionResult> {
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  if (BUILTIN_IDS.has(id)) {
    return { ok: false, error: "Built-in categories cannot be deleted." }
  }

  if (isSupabaseOffline()) {
    globalCategories.__astoreFallbackCategories = getFallbackCategories().filter((c) => c.id !== id)
    invalidateCategoriesCache()
    revalidatePath("/")
    revalidatePath("/seller")
    return { ok: true, data: null }
  }

  const { count, error: countError } = await gate.db
    .from(PRODUCTS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("category", id)
  if (countError) return { ok: false, error: countError.message }
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `Still used by ${count} product${count === 1 ? "" : "s"} — recategorize them first.`,
    }
  }

  const { error } = await gate.db.from(CATEGORIES_TABLE).delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  invalidateCategoriesCache()
  revalidatePath("/")
  revalidatePath("/seller")
  return { ok: true, data: null }
}
