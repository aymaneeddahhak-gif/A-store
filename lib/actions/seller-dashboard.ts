"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { isAdminEmail } from "@/lib/admin"
import { isSellerEmail } from "@/lib/seller"

export interface Subscriber {
  email: string
  source: string
  created_at: string
}

export type DashboardActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string }

/** Subscribers read — any signed-in seller sees the list; missing table degrades to []. */
export async function listSubscribersAction(): Promise<DashboardActionResult<Subscriber[]>> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user || !isSellerEmail(auth.user.email)) {
      return { ok: false, error: "Seller access required." }
    }
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("email, source, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
    if (error) return { ok: true, data: [] }
    return { ok: true, data: (data as Subscriber[]) ?? [] }
  } catch {
    return { ok: true, data: [] }
  }
}

/** Public subscribe — anyone (even anonymous visitors) may opt in. */
export async function subscribeAction(
  email: string,
  source = "footer"
): Promise<DashboardActionResult> {
  const clean = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { ok: false, error: "Enter a valid email address." }
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert([{ email: clean, source }], { onConflict: "email" })
    if (error) {
      return {
        ok: false,
        error:
          error.code === "42P01"
            ? "Run sql/seller-dashboard.sql in Supabase first."
            : error.message,
      }
    }
    revalidatePath("/seller")
    return { ok: true, data: null }
  } catch {
    return { ok: false, error: "Database connection failed." }
  }
}

export interface StoreSettings {
  store_name: string
  currency: string
  notification_email: string
}

const DEFAULT_SETTINGS: StoreSettings = {
  store_name: "A-store",
  currency: "USD",
  notification_email: "",
}

/** Settings read — signed-in sellers only; missing row returns defaults. */
export async function getStoreSettingsAction(): Promise<DashboardActionResult<StoreSettings>> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user || !isSellerEmail(auth.user.email)) {
      return { ok: false, error: "Seller access required." }
    }
    const { data, error } = await supabase
      .from("store_settings")
      .select("store_name, currency, notification_email")
      .eq("id", 1)
      .maybeSingle()
    if (error || !data) return { ok: true, data: DEFAULT_SETTINGS }
    return { ok: true, data: { ...DEFAULT_SETTINGS, ...(data as Partial<StoreSettings>) } }
  } catch {
    return { ok: true, data: DEFAULT_SETTINGS }
  }
}

/** Settings write — admin only, single row upsert (service role when available). */
export async function saveStoreSettingsAction(
  settings: StoreSettings
): Promise<DashboardActionResult> {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return { ok: false, error: "You must be signed in." }
  if (!isAdminEmail(auth.user.email)) {
    return { ok: false, error: "Restricted to the store admin." }
  }

  const row = {
    id: 1,
    store_name: settings.store_name.trim().slice(0, 60) || DEFAULT_SETTINGS.store_name,
    currency: ["USD", "EUR", "GBP"].includes(settings.currency) ? settings.currency : "USD",
    notification_email: settings.notification_email.trim().slice(0, 120),
    updated_at: new Date().toISOString(),
  }

  const db = createSupabaseAdminClient() ?? supabase
  const { error } = await db.from("store_settings").upsert([row], { onConflict: "id" })
  if (error) {
    return {
      ok: false,
      error:
        error.code === "42P01"
          ? "Run sql/seller-dashboard.sql in Supabase first."
          : error.message,
    }
  }
  revalidatePath("/seller")
  return { ok: true, data: null }
}

export interface CustomerProfile {
  id: string
  name: string
  email: string
}

/**
 * Real customer identities for the admin dashboard — service-role read of
 * auth users. Non-admin sellers keep the anonymized order-derived view.
 */
export async function listCustomerProfilesAction(): Promise<
  DashboardActionResult<CustomerProfile[]>
> {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return { ok: false, error: "You must be signed in." }
  if (!isAdminEmail(auth.user.email)) {
    return { ok: false, error: "Restricted to the store admin." }
  }
  const admin = createSupabaseAdminClient()
  if (!admin) {
    return { ok: false, error: "Needs SUPABASE_SERVICE_ROLE_KEY in the environment." }
  }

  const allUsers: CustomerProfile[] = []
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) return { ok: false, error: error.message }
    const batch = data?.users ?? []
    for (const u of batch) {
      allUsers.push({
        id: u.id,
        name: (u.user_metadata?.full_name as string | undefined) || u.email?.split("@")[0] || "—",
        email: u.email ?? "—",
      })
    }
    if (batch.length < 200) break
  }

  return {
    ok: true,
    data: allUsers,
  }
}
