"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { isAdminEmail } from "@/lib/admin"
import { isSellerEmail } from "@/lib/seller"
import { logAudit } from "@/lib/actions/audit"
import { createResilientFetch } from "@/lib/supabase-circuit"
import { PRODUCTS_CACHE_TAG, invalidateProductCache } from "@/lib/queries/products"

const TABLE = "deals_popup"
const DEALS_REVALIDATE_MS = 900_000
const DEALS_QUERY_TIMEOUT_MS = 4000

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

interface DealsCacheSlot {
  at: number
  data: DealsPopupConfig
  dirty: boolean
}

const globalDeals = globalThis as unknown as {
  __astoreDealsCache?: DealsCacheSlot
}

function getDealsCache(): DealsCacheSlot {
  if (!globalDeals.__astoreDealsCache) {
    globalDeals.__astoreDealsCache = { at: 0, data: DEFAULT_DEALS_POPUP, dirty: true }
  }
  return globalDeals.__astoreDealsCache
}

function invalidateDealsCache(): void {
  const slot = getDealsCache()
  slot.at = 0
  slot.dirty = true
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
    global: { fetch: createResilientFetch() },
  })
}

/**
 * Cookie-less public config read — avoids calling `cookies()` during HomePage
 * rendering so `/` stays fast and cacheable.
 */
export async function getDealsPopupAction(): Promise<DealsPopupResult<DealsPopupConfig>> {
  const slot = getDealsCache()
  if (!slot.dirty && Date.now() - slot.at < DEALS_REVALIDATE_MS) {
    return { ok: true, data: slot.data }
  }

  const anon = createAnonDealsClient()
  if (!anon) return { ok: true, data: slot.data }

  try {
    const result = await Promise.race([
      anon
        .from(TABLE)
        .select("enabled, title, subtitle, button_label")
        .eq("id", 1)
        .maybeSingle(),
      new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(
          () => resolve({ data: null, error: { message: "Deals query timeout" } }),
          DEALS_QUERY_TIMEOUT_MS
        )
      ),
    ])

    if (result.error || !result.data) {
      return { ok: true, data: slot.data }
    }
    const resolved: DealsPopupConfig = {
      enabled: (result.data as Partial<DealsPopupConfig>).enabled ?? true,
      title: (result.data as Partial<DealsPopupConfig>).title || DEFAULT_DEALS_POPUP.title,
      subtitle: (result.data as Partial<DealsPopupConfig>).subtitle || DEFAULT_DEALS_POPUP.subtitle,
      button_label:
        (result.data as Partial<DealsPopupConfig>).button_label || DEFAULT_DEALS_POPUP.button_label,
    }
    slot.data = resolved
    slot.at = Date.now()
    slot.dirty = false
    return { ok: true, data: resolved }
  } catch {
    return { ok: true, data: slot.data }
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

  const db = createSupabaseAdminClient() ?? supabase
  const { error } = await db.from(TABLE).upsert([row], { onConflict: "id" })
  if (error) return { ok: false, error: error.message }

  invalidateDealsCache()
  revalidatePath("/")
  void logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "update",
    entity: "deals popup",
  })
  return { ok: true, data: { ...row } }
}

export async function applyDealsPercentAction(
  percent: number
): Promise<DealsPopupResult<number>> {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user || !isSellerEmail(auth.user.email)) {
    return { ok: false, error: "Seller account required to apply offers." }
  }
  const pct = Math.round(Number(percent))
  if (!Number.isFinite(pct) || pct < 1 || pct > 100) {
    return { ok: false, error: "Percent must be between 1 and 100." }
  }

  const admin = isAdminEmail(auth.user.email)
  const db = createSupabaseAdminClient() ?? supabase
  let readQuery = db.from("products").select("id, price, original_price")
  readQuery = admin ? readQuery.is("user_id", null) : readQuery.eq("user_id", auth.user.id)

  const { data: rows, error: readErr } = await readQuery
  if (readErr) return { ok: false, error: readErr.message }

  const products = (rows ?? []) as { id: number; price: number; original_price: number | null }[]
  if (products.length === 0) {
    return { ok: false, error: "Add at least one product before applying an offer." }
  }

  const targets = products.filter((p) => {
    const currentPct =
      p.original_price && p.original_price > p.price
        ? Math.round((1 - p.price / p.original_price) * 100)
        : 0
    return currentPct !== pct
  })

  const updates = targets.map((p) => {
    const base = p.original_price && p.original_price > p.price ? p.original_price : p.price
    return {
      id: p.id,
      price: Math.round(base * (1 - pct / 100) * 100) / 100,
      original_price: base,
    }
  })

  for (const u of updates) {
    let updQuery = db
      .from("products")
      .update({ price: u.price, original_price: u.original_price })
      .eq("id", u.id)
    if (!admin) updQuery = updQuery.eq("user_id", auth.user.id)
    const { error } = await updQuery
    if (error) return { ok: false, error: error.message }
  }

  if (admin) {
    await db
      .from(TABLE)
      .upsert([{ id: 1, applied_percent: pct }], { onConflict: "id" })
  }

  invalidateProductCache()
  revalidateTag(PRODUCTS_CACHE_TAG)
  revalidatePath("/")
  revalidatePath("/seller")
  void logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "update",
    entity: `offer ${pct}% applied to ${updates.length} products`,
  })
  return { ok: true, data: pct }
}

export async function clearAppliedPercentAction(): Promise<DealsPopupResult<null>> {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user || !isSellerEmail(auth.user.email)) {
    return { ok: false, error: "Seller account required to clear offers." }
  }

  const admin = isAdminEmail(auth.user.email)
  const db = createSupabaseAdminClient() ?? supabase
  let readQuery = db.from("products").select("id, price, original_price")
  readQuery = admin ? readQuery.is("user_id", null) : readQuery.eq("user_id", auth.user.id)

  const { data: rows, error: readErr } = await readQuery
  if (readErr) return { ok: false, error: readErr.message }

  const discounted = ((rows ?? []) as { id: number; price: number; original_price: number | null }[])
    .filter((p) => p.original_price !== null && p.original_price > p.price)

  for (const p of discounted) {
    let updQuery = db
      .from("products")
      .update({ price: p.original_price, original_price: null })
      .eq("id", p.id)
    if (!admin) updQuery = updQuery.eq("user_id", auth.user.id)
    const { error } = await updQuery
    if (error) return { ok: false, error: error.message }
  }

  if (admin) {
    const { error } = await db
      .from(TABLE)
      .update({ applied_percent: null })
      .eq("id", 1)
    if (error) return { ok: false, error: error.message }
  }

  invalidateProductCache()
  revalidateTag(PRODUCTS_CACHE_TAG)
  revalidatePath("/")
  revalidatePath("/seller")
  void logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "update",
    entity: "deals popup offer cleared",
  })
  return { ok: true, data: null }
}
