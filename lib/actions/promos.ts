"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { isAdminEmail } from "@/lib/admin"
import { isSupabaseOffline } from "@/lib/supabase-circuit"

const PROMOS_TABLE = "promo_codes"

export interface PromoCode {
  code: string
  percent_off: number
  active: boolean
}

export type PromoActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string }

const INITIAL_FALLBACK_PROMOS: PromoCode[] = [
  { code: "WELCOME10", percent_off: 10, active: true },
  { code: "SAVE20", percent_off: 20, active: true },
  { code: "VIP50", percent_off: 50, active: true },
]

const globalPromos = globalThis as unknown as {
  __astoreFallbackPromos?: PromoCode[]
}

function getFallbackPromos(): PromoCode[] {
  if (!globalPromos.__astoreFallbackPromos) {
    globalPromos.__astoreFallbackPromos = INITIAL_FALLBACK_PROMOS.map((p) => ({ ...p }))
  }
  return globalPromos.__astoreFallbackPromos
}

/** Shared validator (also used by placeOrderAction) — active code or null. */
export async function validatePromo(
  code: string
): Promise<{ code: string; percent_off: number } | null> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return null

  if (isSupabaseOffline()) {
    const match = getFallbackPromos().find((p) => p.code === normalized && p.active)
    return match ? { code: match.code, percent_off: match.percent_off } : null
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from(PROMOS_TABLE)
      .select("code, percent_off, active")
      .eq("code", normalized)
      .maybeSingle()
    if (error || !data) {
      if (isSupabaseOffline()) {
        const match = getFallbackPromos().find((p) => p.code === normalized && p.active)
        return match ? { code: match.code, percent_off: match.percent_off } : null
      }
      return null
    }
    const row = data as PromoCode
    if (!row.active) return null
    return { code: row.code, percent_off: row.percent_off }
  } catch {
    const match = getFallbackPromos().find((p) => p.code === normalized && p.active)
    return match ? { code: match.code, percent_off: match.percent_off } : null
  }
}

export async function validatePromoAction(
  code: string
): Promise<PromoActionResult<{ code: string; percent_off: number }>> {
  const promo = await validatePromo(code)
  if (!promo) return { ok: false, error: "Invalid or expired promo code." }
  return { ok: true, data: promo }
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user || !isAdminEmail(auth.user.email)) {
    return { ok: false as const, error: "Restricted to the store admin." }
  }
  return {
    ok: true as const,
    db: createSupabaseAdminClient() ?? supabase,
    adminEmail: auth.user.email ?? "",
  }
}

export async function listPromosAction(): Promise<PromoActionResult<PromoCode[]>> {
  if (isSupabaseOffline()) {
    return { ok: true, data: getFallbackPromos() }
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from(PROMOS_TABLE)
      .select("*")
      .order("code", { ascending: true })
    if (error) {
      if (isSupabaseOffline()) return { ok: true, data: getFallbackPromos() }
      return { ok: false, error: error.message }
    }
    return { ok: true, data: (data ?? []) as PromoCode[] }
  } catch {
    return { ok: true, data: getFallbackPromos() }
  }
}

export async function createPromoAction(input: {
  code: string
  percent_off: number
}): Promise<PromoActionResult<PromoCode>> {
  const gate = await requireAdmin()
  if (!gate.ok) return gate

  const code = input.code.trim().toUpperCase()
  const percent = Math.floor(Number(input.percent_off))
  if (!/^[A-Z0-9-]{3,24}$/.test(code)) {
    return { ok: false, error: "Code must be 3–24 letters, digits or dashes." }
  }
  if (!Number.isFinite(percent) || percent < 1 || percent > 90) {
    return { ok: false, error: "Discount must be between 1 and 90%." }
  }

  if (isSupabaseOffline()) {
    const list = getFallbackPromos()
    if (list.some((p) => p.code === code)) {
      return { ok: false, error: "That code already exists." }
    }
    const created = { code, percent_off: percent, active: true }
    globalPromos.__astoreFallbackPromos = [...list, created]
    revalidatePath("/seller")
    return { ok: true, data: created }
  }

  const { data, error } = await gate.db
    .from(PROMOS_TABLE)
    .insert([{ code, percent_off: percent, active: true }])
    .select()
    .single()
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "That code already exists." : error.message,
    }
  }
  revalidatePath("/seller")
  return { ok: true, data: data as PromoCode }
}

export async function togglePromoAction(
  code: string,
  active: boolean
): Promise<PromoActionResult> {
  const gate = await requireAdmin()
  if (!gate.ok) return gate

  if (isSupabaseOffline()) {
    globalPromos.__astoreFallbackPromos = getFallbackPromos().map((p) =>
      p.code === code ? { ...p, active } : p
    )
    revalidatePath("/seller")
    return { ok: true, data: null }
  }

  const { error } = await gate.db
    .from(PROMOS_TABLE)
    .update({ active })
    .eq("code", code)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/seller")
  return { ok: true, data: null }
}

export async function deletePromoAction(code: string): Promise<PromoActionResult> {
  const gate = await requireAdmin()
  if (!gate.ok) return gate

  if (isSupabaseOffline()) {
    globalPromos.__astoreFallbackPromos = getFallbackPromos().filter((p) => p.code !== code)
    revalidatePath("/seller")
    return { ok: true, data: null }
  }

  const { error } = await gate.db.from(PROMOS_TABLE).delete().eq("code", code)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/seller")
  return { ok: true, data: null }
}
