"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { isAdminEmail } from "@/lib/admin"
import { CATEGORIES } from "@/lib/categories"
import { LEGACY_CATEGORY } from "@/components/storefront/product-adapter"

const CATEGORIES_TABLE = "categories"
const PRODUCTS_TABLE = "products"

export interface CategoryRow {
  id: string
  label: string
}

export type CategoryActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string }

const BUILTIN_IDS: Set<string> = new Set(CATEGORIES.map((c) => c.id))

/** DB-defined categories (empty when the table is missing/empty). */
export async function listCategoriesAction(): Promise<CategoryActionResult<CategoryRow[]>> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from(CATEGORIES_TABLE)
      .select("id, label")
      .order("label", { ascending: true })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data ?? []) as CategoryRow[] }
  } catch {
    return { ok: false, error: "Database connection failed." }
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
  return { ok: true as const, supabase }
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

  const { data, error } = await gate.supabase
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

  const { count, error: countError } = await gate.supabase
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

  const { error } = await gate.supabase.from(CATEGORIES_TABLE).delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  revalidatePath("/seller")
  return { ok: true, data: null }
}
