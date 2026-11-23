"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { isAdminEmail } from "@/lib/admin"
import { logAudit } from "@/lib/actions/audit"
import { createResilientFetch, isSupabaseOffline } from "@/lib/supabase-circuit"
import { getFallbackProducts, setFallbackProducts } from "@/lib/fallback-catalog"
import { PRODUCTS_CACHE_TAG, invalidateProductCache } from "@/lib/queries/products"

const TABLE = "deals_popup"

export interface DealsPopupConfig {
  enabled: boolean
  title: string
  subtitle: string
  button_label: string
}

const DEFAULT_DEALS_POPUP: DealsPopupConfig = {
  enabled: true,
  title: "Discount",
  subtitle: "Up to",
  button_label: "Shop now",
}

const globalDeals = globalThis as unknown as {
  __astoreFallbackDealsConfig?: DealsPopupConfig
  __astoreFallbackDealsSnapshot?: {
    applied_percent: number | null
    previous_prices: { id: number; price: number; original_price: number | null }[]
  }
}

export type DealsPopupResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function createAnonDealsClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: createResilientFetch({ noStore: true }) },
  })
}

/**
 * Cookie-less public config read — avoids calling `cookies()` during HomePage
 * rendering so `/` is not forced dynamic by session cookies.
 */
export async function getDealsPopupAction(): Promise<DealsPopupResult<DealsPopupConfig>> {
  const fallback = globalDeals.__astoreFallbackDealsConfig ?? DEFAULT_DEALS_POPUP
  if (isSupabaseOffline()) return { ok: true, data: fallback }

  const anon = createAnonDealsClient()
  if (!anon) return { ok: true, data: fallback }

  try {
    const { data, error } = await anon
      .from(TABLE)
      .select("enabled, title, subtitle, button_label")
      .eq("id", 1)
      .maybeSingle()
    if (error || !data) return { ok: true, data: fallback }
    return {
      ok: true,
      data: {
        enabled: (data as Partial<DealsPopupConfig>).enabled ?? true,
        title: (data as Partial<DealsPopupConfig>).title || DEFAULT_DEALS_POPUP.title,
        subtitle: (data as Partial<DealsPopupConfig>).subtitle || DEFAULT_DEALS_POPUP.subtitle,
        button_label:
          (data as Partial<DealsPopupConfig>).button_label || DEFAULT_DEALS_POPUP.button_label,
      },
    }
  } catch {
    return { ok: true, data: fallback }
  }
}

export async function updateDealsPopupAction(
  input: DealsPopupConfig
): Promise<DealsPopupResult<DealsPopupConfig>> {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user || !isAdminEmail(auth.user.email)) {
    return { ok: false, error: "Restricted to the store admin." }
  }

  const row = {
    id: 1,
    enabled: !!input.enabled,
    title: input.title.trim().slice(0, 40) || DEFAULT_DEALS_POPUP.title,
    subtitle: input.subtitle.trim().slice(0, 40) || DEFAULT_DEALS_POPUP.subtitle,
    button_label: input.button_label.trim().slice(0, 24) || DEFAULT_DEALS_POPUP.button_label,
  }

  if (isSupabaseOffline()) {
    globalDeals.__astoreFallbackDealsConfig = {
      enabled: row.enabled,
      title: row.title,
      subtitle: row.subtitle,
      button_label: row.button_label,
    }
    revalidatePath("/")
    return { ok: true, data: { ...row } }
  }

  const db = createSupabaseAdminClient() ?? supabase
  const { error } = await db.from(TABLE).upsert([row], { onConflict: "id" })
  if (error) {
    if (isSupabaseOffline()) {
      globalDeals.__astoreFallbackDealsConfig = {
        enabled: row.enabled,
        title: row.title,
        subtitle: row.subtitle,
        button_label: row.button_label,
      }
      revalidatePath("/")
      return { ok: true, data: { ...row } }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath("/")
  void logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "update",
    entity: "deals popup",
  })
  return { ok: true, data: { ...row } }
}

function applyPercentToFallback(pct: number): void {
  const products = getFallbackProducts().filter((p) => p.user_id == null)
  const targets = products.filter((p) => {
    const currentPct =
      p.original_price && p.original_price > p.price
        ? Math.round((1 - p.price / p.original_price) * 100)
        : 0
    return currentPct !== pct
  })
  const previous = targets.map((p) => ({
    id: p.id,
    price: p.price,
    original_price: p.original_price ?? null,
  }))
  globalDeals.__astoreFallbackDealsSnapshot = {
    applied_percent: pct,
    previous_prices: previous,
  }
  const updates = new Map(
    targets.map((p) => {
      const base = p.original_price && p.original_price > p.price ? p.original_price : p.price
      return [
        p.id,
        {
          price: Math.round(base * (1 - pct / 100) * 100) / 100,
          original_price: base,
        },
      ]
    })
  )
  setFallbackProducts(
    getFallbackProducts().map((p) => {
      const patch = updates.get(p.id)
      return patch ? { ...p, ...patch } : p
    })
  )
  invalidateProductCache()
  revalidateTag(PRODUCTS_CACHE_TAG)
  revalidatePath("/")
}

export async function applyDealsPercentAction(
  percent: number
): Promise<DealsPopupResult<number>> {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user || !isAdminEmail(auth.user.email)) {
    return { ok: false, error: "Restricted to the store admin." }
  }
  const pct = Math.round(Number(percent))
  if (!Number.isFinite(pct) || pct < 1 || pct > 100) {
    return { ok: false, error: "Percent must be between 1 and 100." }
  }

  if (isSupabaseOffline()) {
    applyPercentToFallback(pct)
    return { ok: true, data: pct }
  }

  const db = createSupabaseAdminClient() ?? supabase
  const { data: rows, error: readErr } = await db
    .from("products")
    .select("id, price, original_price")
    .is("user_id", null)
  if (readErr) {
    if (isSupabaseOffline()) {
      applyPercentToFallback(pct)
      return { ok: true, data: pct }
    }
    return { ok: false, error: readErr.message }
  }
  const products = (rows ?? []) as { id: number; price: number; original_price: number | null }[]

  const targets = products.filter((p) => {
    const currentPct =
      p.original_price && p.original_price > p.price
        ? Math.round((1 - p.price / p.original_price) * 100)
        : 0
    return currentPct !== pct
  })
  const previous = targets.map((p) => ({
    id: p.id,
    price: p.price,
    original_price: p.original_price,
  }))

  const updates = targets.map((p) => {
    const base = p.original_price && p.original_price > p.price ? p.original_price : p.price
    return {
      id: p.id,
      price: Math.round(base * (1 - pct / 100) * 100) / 100,
      original_price: base,
    }
  })
  for (const u of updates) {
    const { error } = await db
      .from("products")
      .update({ price: u.price, original_price: u.original_price })
      .eq("id", u.id)
    if (error) return { ok: false, error: error.message }
  }

  await db
    .from(TABLE)
    .upsert([{ id: 1, applied_percent: pct, previous_prices: previous } as never], {
      onConflict: "id",
    })

  invalidateProductCache()
  revalidateTag(PRODUCTS_CACHE_TAG)
  revalidatePath("/")
  void logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "update",
    entity: `admin offer ${pct}% applied to ${updates.length} products`,
  })
  return { ok: true, data: pct }
}

function clearFallbackOffer(): void {
  const snap = globalDeals.__astoreFallbackDealsSnapshot?.previous_prices ?? []
  if (snap.length > 0) {
    const byId = new Map(snap.map((p) => [p.id, p]))
    setFallbackProducts(
      getFallbackProducts().map((p) => {
        const orig = byId.get(p.id)
        return orig ? { ...p, price: orig.price, original_price: orig.original_price } : p
      })
    )
  }
  globalDeals.__astoreFallbackDealsSnapshot = { applied_percent: null, previous_prices: [] }
  invalidateProductCache()
  revalidateTag(PRODUCTS_CACHE_TAG)
  revalidatePath("/")
}

export async function clearAppliedPercentAction(): Promise<DealsPopupResult<null>> {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user || !isAdminEmail(auth.user.email)) {
    return { ok: false, error: "Restricted to the store admin." }
  }

  if (isSupabaseOffline()) {
    clearFallbackOffer()
    return { ok: true, data: null }
  }

  const db = createSupabaseAdminClient() ?? supabase
  const { data: row } = await db
    .from(TABLE)
    .select("previous_prices")
    .eq("id", 1)
    .maybeSingle()
  const snapshot =
    (row as { previous_prices?: { id: number; price: number; original_price: number | null }[] } | null)
      ?.previous_prices ?? []
  for (const p of snapshot) {
    await db
      .from("products")
      .update({ price: p.price, original_price: p.original_price })
      .eq("id", p.id)
  }
  const { error } = await db
    .from(TABLE)
    .update({ applied_percent: null, previous_prices: null })
    .eq("id", 1)
  if (error) {
    if (isSupabaseOffline()) {
      clearFallbackOffer()
      return { ok: true, data: null }
    }
    return { ok: false, error: error.message }
  }

  invalidateProductCache()
  revalidateTag(PRODUCTS_CACHE_TAG)
  revalidatePath("/")
  void logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "update",
    entity: "deals popup offer cleared",
  })
  return { ok: true, data: null }
}
