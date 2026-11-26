import "server-only"

import { cache } from "react"
import { createClient } from "@supabase/supabase-js"
import { migrateProductAssetPaths } from "@/lib/product-media"
import { createResilientFetch } from "@/lib/supabase-circuit"
import type { Product } from "@/lib/types"

const PRODUCTS_TABLE = "products"
/** Mutations must revalidateTag() this so cached catalog reads are dropped. */
export const PRODUCTS_CACHE_TAG = "products"
/** Milliseconds before a cached catalog read is considered stale. */
const PRODUCTS_REVALIDATE_MS = 900_000
const QUERY_TIMEOUT_MS = 4000

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createAnonClient() {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: createResilientFetch() },
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

const globalProductsCache = globalThis as unknown as {
  __astoreProductsCache?: {
    all: CacheSlot
    store: CacheSlot
  }
}

if (!globalProductsCache.__astoreProductsCache) {
  globalProductsCache.__astoreProductsCache = {
    all: { at: 0, data: [], dirty: true },
    store: { at: 0, data: [], dirty: true },
  }
}

const allSlot = globalProductsCache.__astoreProductsCache.all
const storeSlot = globalProductsCache.__astoreProductsCache.store

async function getCached(
  slot: CacheSlot,
  loader: () => Promise<Product[]>
): Promise<Product[]> {
  if (!slot.dirty && slot.data.length > 0 && Date.now() - slot.at < PRODUCTS_REVALIDATE_MS) {
    return slot.data
  }

  if (!slot.dirty && slot.data.length > 0) {
    void loader()
      .then((rows) => {
        slot.data = rows
        slot.at = Date.now()
      })
      .catch(() => {})
    return slot.data
  }

  try {
    const rows = await loader()
    slot.data = rows
    slot.at = Date.now()
    slot.dirty = false
    return rows
  } catch {
    slot.dirty = false
    return slot.data
  }
}

export function invalidateProductCache(): void {
  allSlot.at = 0
  allSlot.dirty = true
  storeSlot.at = 0
  storeSlot.dirty = true
}

function migrateRows(rows: Product[]): Product[] {
  return rows
    .map(migrateProductAssetPaths)
    .filter((product): product is Product => product !== null)
}

async function liveAllProducts(): Promise<Product[]> {
  if (!isConfigured()) return []
  const supabase = createAnonClient()
  const { data, error } = await withTimeout(
    supabase.from(PRODUCTS_TABLE).select("*").order("id", { ascending: true })
  )
  if (error || !data) throw new Error("unavailable")
  return migrateRows(data as Product[])
}

async function liveStoreProducts(): Promise<Product[]> {
  if (!isConfigured()) return []
  const supabase = createAnonClient()
  const { data, error } = await withTimeout(
    supabase
      .from(PRODUCTS_TABLE)
      .select("*")
      .eq("is_published", true)
      .order("id", { ascending: true })
  )
  if (!error && data) return migrateRows(data as Product[])
  if (
    error &&
    /is_published|PGRST204/.test(
      `${error.message} ${(error as { code?: string }).code ?? ""}`
    )
  ) {
    return liveAllProducts()
  }
  throw new Error("unavailable")
}

export const listProducts = cache(async (): Promise<Product[]> =>
  getCached(allSlot, liveAllProducts)
)

export const listStoreProducts = cache(async (): Promise<Product[]> =>
  getCached(storeSlot, liveStoreProducts)
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
