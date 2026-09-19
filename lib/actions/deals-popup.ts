"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { isAdminEmail } from "@/lib/admin"
import { logAudit } from "@/lib/actions/audit"

const TABLE = "deals_popup"

export interface DealsPopupConfig {
  enabled: boolean
  title: string
  subtitle: string
  button_label: string
}

// Local only — "use server" modules may only export async functions.
const DEFAULT_DEALS_POPUP: DealsPopupConfig = {
  enabled: true,
  title: "Discount",
  subtitle: "Up to",
  button_label: "Shop now",
}

export type DealsPopupResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

/** Public config read — falls back to defaults when the table is missing. */
export async function getDealsPopupAction(): Promise<DealsPopupResult<DealsPopupConfig>> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select("enabled, title, subtitle, button_label")
      .eq("id", 1)
      .maybeSingle()
    if (error || !data) return { ok: true, data: DEFAULT_DEALS_POPUP }
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
    return { ok: true, data: DEFAULT_DEALS_POPUP }
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
  // applied_percent is managed exclusively by apply/clear below; never clobber
  // it from the generic settings form.
  const { error } = await supabase.from(TABLE).upsert([row], { onConflict: "id" })
  if (error) return { ok: false, error: error.message }

  revalidatePath("/")
  void logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "update",
    entity: "deals popup",
  })
  return { ok: true, data: { ...row } }
}

/**
 * Applies a tier from the seller Offers ladder to the ADMIN'S OWN products
 * (user_id = null rows): each product's original_price is set so its computed
 * discount matches the tier. Products that already carry the tier discount are
 * skipped; prices before the apply are snapshotted so Clear can restore them.
 * Admin-only, audit-logged. The home popup keeps deriving its percent from the
 * live catalog, so after applying 50% it naturally shows 50%.
 */
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

  const { data: rows, error: readErr } = await supabase
    .from("products")
    .select("id, price, original_price")
    .is("user_id", null)
  if (readErr) return { ok: false, error: readErr.message }
  const products = (rows ?? []) as { id: number; price: number; original_price: number | null }[]

  // Snapshot current prices (only rows not already carrying this tier) into
  // the deals_popup row so Clear can restore the exact prior prices.
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

  // price = discounted; original_price = undiscounted base. Products without a
  // real compare-at price get their base derived from the current price.
  const updates = targets.map((p) => {
    const base = p.original_price && p.original_price > p.price ? p.original_price : p.price
    return { id: p.id, price: Math.round(base * (1 - pct / 100) * 100) / 100, original_price: base }
  })
  for (const u of updates) {
    const { error } = await supabase
      .from("products")
      .update({ price: u.price, original_price: u.original_price })
      .eq("id", u.id)
    if (error) return { ok: false, error: error.message }
  }

  // Persist the snapshot for Clear (best-effort — the row may not exist).
  await supabase
    .from(TABLE)
    .upsert([{ id: 1, applied_percent: pct, previous_prices: previous } as never], {
      onConflict: "id",
    })

  revalidatePath("/")
  void logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "update",
    entity: `admin offer ${pct}% applied to ${updates.length} products`,
  })
  return { ok: true, data: pct }
}

/**
 * Clears the applied offer: restores the snapshotted prices on the admin's
 * products. Admin-only, audit-logged.
 */
export async function clearAppliedPercentAction(): Promise<DealsPopupResult<null>> {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user || !isAdminEmail(auth.user.email)) {
    return { ok: false, error: "Restricted to the store admin." }
  }
  const { data: row } = await supabase
    .from(TABLE)
    .select("previous_prices")
    .eq("id", 1)
    .maybeSingle()
  const snapshot =
    (row as { previous_prices?: { id: number; price: number; original_price: number | null }[] } | null)
      ?.previous_prices ?? []
  for (const p of snapshot) {
    await supabase
      .from("products")
      .update({ price: p.price, original_price: p.original_price })
      .eq("id", p.id)
  }
  const { error } = await supabase
    .from(TABLE)
    .update({ applied_percent: null, previous_prices: null })
    .eq("id", 1)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/")
  void logAudit({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "update",
    entity: "deals popup offer cleared",
  })
  return { ok: true, data: null }
}
