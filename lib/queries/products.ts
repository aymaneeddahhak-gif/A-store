import "server-only"

import { cache } from "react"
import { createClient } from "@supabase/supabase-js"
import { migrateProductAssetPaths } from "@/lib/product-media"
import { createResilientFetch, isSupabaseOffline } from "@/lib/supabase-circuit"
import { getFallbackProducts } from "@/lib/fallback-catalog"
import type { Product } from "@/lib/types"

const PRODUCTS_TABLE = "products"
/** Mutations must revalidateTag() this so cached catalog reads are dropped. */
export const PRODUCTS_CACHE_TAG = "products"
/** Milliseconds before a cached catalog read is considered stale. */
const PRODUCTS_REVALIDATE_MS = 900_000
const QUERY_TIMEOUT_MS = 1200

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createAnonClient() {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: createResilientFetch({ noStore: true }) },
  })
}

const isConfigured = () => Boolean(supabaseUrl && supabaseAnonKey)

type TimedOut = { data: null; error: { message: string } }

function withTimeout<T>(promise: PromiseLike<T>): Promise<T | TimedOut> {
  return Promise.race([
    promise,
    new Promise<TimedOut>((resolve) =>
      setTimeout(
        () => resolve({ data: null, error: { message: "Database request timeout" } }),
        QUERY_TIMEOUT_MS
      )
    ),
  ])
}

interface CacheSlot {
  at: number
  data: Product[]
  dirty: boolean
}

const allSlot: CacheSlot = { at: 0, data: [], dirty: true }
const storeSlot: CacheSlot = { at: 0, data: [], dirty: true }

async function getCached(
  slot: CacheSlot,
  loader: () => Promise<Product[]>,
  fallback: () => Product[]
): Promise<Product[]> {
  if (isSupabaseOffline()) {
    return slot.data.length > 0 ? slot.data : fallback()
  }

  if (!slot.dirty && slot.data.length > 0 && Date.now() - slot.at < PRODUCTS_REVALIDATE_MS) {
    return slot.data
  }

  if (!slot.dirty && slot.data.length > 0) {
    void loader()
      .then((rows) => {
        if (rows.length > 0) {
          slot.data = rows
          slot.at = Date.now()
        }
      })
      .catch(() => {})
    return slot.data
  }

  try {
    const rows = await loader()
    if (rows.length > 0) {
      slot.data = rows
      slot.at = Date.now()
      slot.dirty = false
      return rows
    }
    slot.dirty = false
    return slot.data.length > 0 ? slot.data : fallback()
  } catch {
    slot.dirty = false
    return slot.data.length > 0 ? slot.data : fallback()
  }
}

export function invalidateProductCache(): void {
  allSlot.at = 0
  allSlot.dirty = true
  storeSlot.at = 0
  storeSlot.dirty = true
}

function migrateOrThrow(rows: Product[], expectedLength: number): Product[] {
  const migrated = rows
    .map(migrateProductAssetPaths)
    .filter((product): product is Product => product !== null)
  if (migrated.length !== expectedLength) {
    throw new Error("stale catalog")
  }
  return migrated
}

async function liveAllProducts(): Promise<Product[]> {
  if (!isConfigured() || isSupabaseOffline()) throw new Error("unavailable")
  const supabase = createAnonClient()
  const { data, error } = await withTimeout(
    supabase.from(PRODUCTS_TABLE).select("*").order("id", { ascending: true })
  )
  if (error || !data) throw new Error("unavailable")
  return migrateOrThrow(data as Product[], (data as Product[]).length)
}

async function liveStoreProducts(): Promise<Product[]> {
  if (!isConfigured() || isSupabaseOffline()) throw new Error("unavailable")
  const supabase = createAnonClient()
  const { data, error } = await withTimeout(
    supabase
      .from(PRODUCTS_TABLE)
      .select("*")
      .is("user_id", null)
      .eq("is_published", true)
      .order("id", { ascending: true })
  )
  if (!error && data) return migrateOrThrow(data as Product[], (data as Product[]).length)
  if (
    error &&
    /user_id|is_published|PGRST204/.test(
      `${error.message} ${(error as { code?: string }).code ?? ""}`
    )
  ) {
    return liveAllProducts()
  }
  throw new Error("unavailable")
}

export const listProducts = cache(async (): Promise<Product[]> =>
  getCached(allSlot, liveAllProducts, () => getFallbackProducts())
)

export const listStoreProducts = cache(async (): Promise<Product[]> =>
  getCached(storeSlot, liveStoreProducts, () =>
    getFallbackProducts().filter((p) => p.user_id == null && p.is_published !== false)
  )
)

export const getProductById = cache(async (id: number): Promise<Product | null> =>
  Number.isFinite(id) ? (await listStoreProducts()).find((product) => product.id === id) ?? null : null
)

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const all = await listStoreProducts()
  return all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit)
}
