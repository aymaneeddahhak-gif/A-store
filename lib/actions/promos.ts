"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { isAdminEmail } from "@/lib/admin"

const PROMOS_TABLE = "promo_codes"

export interface PromoCode {
  code: string
  percent_off: number
  active: boolean
}

export type PromoActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string }

/** Shared validator (also used by placeOrderAction) — active code or null. */
export async function validatePromo(
  code: string
): Promise<{ code: string; percent_off: number } | null> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return null

  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from(PROMOS_TABLE)
      .select("code, percent_off, active")
      .eq("code", normalized)
      .maybeSingle()
    if (error || !data) return null
    const row = data as PromoCode
    if (!row.active) return null
    return { code: row.code, percent_off: row.percent_off }
  } catch {
    return null
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
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from(PROMOS_TABLE)
      .select("*")
      .order("code", { ascending: true })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data ?? []) as PromoCode[] }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not load promo codes.",
    }
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

  const { error } = await gate.db.from(PROMOS_TABLE).delete().eq("code", code)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/seller")
  return { ok: true, data: null }
}
