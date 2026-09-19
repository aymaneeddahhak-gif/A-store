import "server-only"

import { cache } from "react"
import { createClient } from "@supabase/supabase-js"
import { migrateProductAssetPaths } from "@/lib/product-media"
import type { Product } from "@/lib/types"

/**
 * Queries — server-only read access to Supabase.
 *
 * Every database READ in the app goes through this module (or its siblings).
 * This is the single chokepoint that lets us swap storage, add caching,
 * or enforce RLS assumptions without hunting call sites across the codebase.
 *
 * Conventions:
 *  - Always return typed data (never raw Supabase rows).
 *  - When Supabase is unconfigured or unreachable, return the last good
 *    cached set (or [] when there is none) — never mock rows. A
 *    configured-but-empty database returns [] honestly.
 *  - Never throw — callers are server components and route handlers that
 *    should degrade gracefully.
 *
 * The catalog is public data, so reads use a plain anon client rather than the
 * cookie-bound SSR client. That matters for more than tidiness: touching
 * `cookies()` opts every consuming route out of static rendering and out of the
 * data cache, which is what made product pages pay a full round trip (and up to
 * the whole timeout budget) on each navigation. Writes still go through the
 * cookie-bound client in lib/actions/* so RLS sees the caller's session.
 */

const PRODUCTS_TABLE = "products"
/** Mutations must revalidateTag() this so cached catalog reads are dropped. */
export const PRODUCTS_CACHE_TAG = "products"
/** Seconds before a cached catalog read is considered stale. */
const PRODUCTS_REVALIDATE_MS = 900_000
const QUERY_TIMEOUT_MS = 8000

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createAnonClient() {
  // Non-null: only called behind the isConfigured() guard below.
  // no-store is load-bearing: App Router force-caches every bare fetch —
  // including supabase-js's — indefinitely, and neither revalidateTag nor
  // the unstable_cache wrapper above can evict those inner entries. Without
  // this, the storefront fossilizes on the first response it ever sees.
  const noStoreFetch: typeof fetch = (url, init) =>
    fetch(url, { ...init, cache: "no-store" })
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: noStoreFetch },
  })
}

const isConfigured = () => Boolean(supabaseUrl && supabaseAnonKey)

type TimedOut = { data: null; error: { message: string } }

/** Never let a hung database hold a page render open indefinitely. */
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

/**
 * Cross-request catalog cache with poison protection. A failed or timed-out
 * read must NEVER overwrite good data: it serves the last good set (or the
 * mock catalog when there is none) instead of caching the failure. Mutations
 * drop the slots explicitly via invalidateProductCache().
 */
interface CacheSlot {
  at: number
  data: Product[]
}

const allSlot: CacheSlot = { at: 0, data: [] }
const storeSlot: CacheSlot = { at: 0, data: [] }

async function getCached(
  slot: CacheSlot,
  loader: () => Promise<Product[]>
): Promise<Product[]> {
  if (slot.data.length > 0 && Date.now() - slot.at < PRODUCTS_REVALIDATE_MS) {
    return slot.data
  }
  // Stale-while-revalidate: with a warm slot the caller gets the cached rows
  // INSTANTLY and the fresh read lands in the background. First load after a
  // cold start still waits for the DB, but every other request skips it.
  if (slot.data.length > 0) {
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
    }
    return rows
  } catch (err) {
    // No mock fallback — serve last good set or empty honestly.
    console.error("[products] catalog read failed:", err instanceof Error ? err.message : err)
    return slot.data.length > 0 ? slot.data : []
  }
}

/** Drops both slots so the next read fetches fresh. Called by mutations. */
export function invalidateProductCache(): void {
  allSlot.at = 0
  storeSlot.at = 0
}

async function liveAllProducts(): Promise<Product[]> {
  if (!isConfigured()) throw new Error("unconfigured")
  const supabase = createAnonClient()
  const { data, error } = await withTimeout(
    supabase.from(PRODUCTS_TABLE).select("*").order("id", { ascending: true })
  )
  if (error || !data) throw new Error("unavailable")
  return migrateOrThrow(data as Product[], (data as Product[]).length)
}

/**
 * Shared migration step: rewrite moved asset paths and drop rows whose
 * image has no file left in the project. When ANY row drops, the whole set
 * is untrustworthy (stale catalog) — the caller treats that as a failure
 * and keeps serving its last good set instead.
 */
function migrateOrThrow(rows: Product[], expectedLength: number): Product[] {
  // ponytail: dropped rows mean the DB references files this project no
  // longer ships (stale catalog → only stray rows render). The real fix is
  // updating the rows in Supabase.
  const migrated = rows
    .map(migrateProductAssetPaths)
    .filter((product): product is Product => product !== null)
  if (migrated.length !== expectedLength) {
    const dropped = rows.filter((p) => migrateProductAssetPaths(p) === null).map((p) => p.id)
    console.error(`[products] stale catalog — dropped ids: ${dropped.join(", ")}`)
    throw new Error("stale catalog")
  }
  return migrated
}

/**
 * Public storefront read — ownerless, published rows only. Sandbox rows
 * (created by non-admin sellers for practice) never reach the store,
 * search, related items, or detail pages. Drafts are hidden the same way.
 *
 * Falls back to the unfiltered list when the user_id column does not exist
 * yet (older schema), so the store keeps working before the migration runs.
 */
async function liveStoreProducts(): Promise<Product[]> {
  if (!isConfigured()) throw new Error("unconfigured")
  const supabase = createAnonClient()
  const { data, error } = await withTimeout(
    supabase
      .from(PRODUCTS_TABLE)
      .select("*")
      .is("user_id", null)
      .eq("is_published", true)
      .order("id", { ascending: true })
  )
  if (error || !data) {
    console.error("[products] liveStoreProducts query error:", error?.message, (error as { code?: string })?.code)
  }
  if (!error && data) return migrateOrThrow(data as Product[], (data as Product[]).length)
  // A missing user_id/is_published column (older schema) errors the filtered
  // read — the whole table is the store. Any other failure propagates to the
  // stale-or-mock fallback in getCached.
  if (error && /user_id|is_published|PGRST204/.test(`${error.message} ${(error as { code?: string }).code ?? ""}`)) {
    return liveAllProducts()
  }
  throw new Error("unavailable")
}

/** React.cache dedupes the call within one render pass (layout + page + metadata). */
export const listProducts = cache(async (): Promise<Product[]> =>
  getCached(allSlot, liveAllProducts)
)

/** Storefront catalog (layout seed, grid, detail, related). Never sandbox rows. */
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
