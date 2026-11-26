"use server"

import { cookies } from "next/headers"
import {
  DEMO_SIG_COOKIE,
  DEMO_USER_COOKIE,
  createSupabaseServerClient,
  signDemoCookiePayload,
  verifyDemoCookiePayload,
} from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { DEMO_ACCOUNTS, type DemoAccountId } from "@/lib/demo-accounts"
import { ensureVisitorDemoUser, isUuid } from "@/lib/demo-seller-server"

const VISITOR_SELLER_UID_COOKIE = "astore_visitor_seller_uid"
const VISITOR_CLIENT_UID_COOKIE = "astore_visitor_client_uid"

async function setSignedDemoCookie(payload: { id: string; email: string; full_name: string }) {
  const cookieStore = await cookies()
  const signed = signDemoCookiePayload(payload)
  cookieStore.set(DEMO_SIG_COOKIE, signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  })
}

export async function demoSessionLoginAction(accountId: DemoAccountId): Promise<{
  ok: boolean
  user?: {
    id: string
    email: string
    fullName: string
    metadata?: Record<string, unknown>
  }
  error?: string
}> {
  const account = DEMO_ACCOUNTS.find((a) => a.id === accountId)
  if (!account) return { ok: false, error: "Unknown account." }

  const cookieStore = await cookies()
  const visitorCookieName =
    accountId === "demo_seller" ? VISITOR_SELLER_UID_COOKIE : VISITOR_CLIENT_UID_COOKIE
  const existingUid = cookieStore.get(visitorCookieName)?.value

  const res = await ensureVisitorDemoUser({
    role: accountId,
    fullName: accountId === "demo_seller" ? "Seller" : "Alex Customer",
    existingUserId: existingUid,
  })
  if (!res.ok) return { ok: false, error: res.error }

  cookieStore.set(visitorCookieName, res.user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  })

  await setSignedDemoCookie({
    id: res.user.id,
    email: res.user.email,
    full_name: res.user.fullName,
  })

  return { ok: true, user: res.user }
}

/**
 * Persists profile metadata updates for cookie-signed Supabase users
 * (`Seller` / `Client`) directly into Supabase Auth `user_metadata`.
 */
export async function updateDemoProfileMetadataAction(
  patch: Record<string, unknown>,
  options?: { password?: string }
): Promise<{ ok: boolean; metadata?: Record<string, unknown>; error?: string }> {
  const cookieStore = await cookies()
  const signedUser = verifyDemoCookiePayload(cookieStore.get(DEMO_SIG_COOKIE)?.value)
  if (!signedUser || !isUuid(signedUser.id)) {
    return { ok: false, error: "You must be signed in." }
  }

  const admin = createSupabaseAdminClient()
  if (!admin) {
    return { ok: false, error: "Supabase service role key is required to save profile." }
  }

  const { data: existing, error: readErr } = await admin.auth.admin.getUserById(signedUser.id)
  if (readErr || !existing?.user) {
    return { ok: false, error: readErr?.message || "Account not found." }
  }

  const nextMeta = { ...(existing.user.user_metadata ?? {}), ...patch }
  const { data: updated, error: updateErr } = await admin.auth.admin.updateUserById(
    signedUser.id,
    {
      ...(options?.password ? { password: options.password } : {}),
      user_metadata: nextMeta,
    }
  )
  if (updateErr) {
    return { ok: false, error: updateErr.message }
  }

  const nextName =
    typeof nextMeta.full_name === "string" && nextMeta.full_name.trim()
      ? nextMeta.full_name.trim()
      : signedUser.email ?? "User"

  await setSignedDemoCookie({
    id: signedUser.id,
    email: existing.user.email ?? signedUser.email ?? "",
    full_name: nextName,
  })

  return {
    ok: true,
    metadata: (updated?.user?.user_metadata ?? nextMeta) as Record<string, unknown>,
  }
}

/** Fetches the active signed-cookie user's live metadata from Supabase Auth. */
export async function getSignedDemoSessionUserAction(): Promise<{
  id: string
  email: string
  fullName: string
  metadata: Record<string, unknown>
} | null> {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user || !isUuid(auth.user.id)) return null

  const admin = createSupabaseAdminClient()
  if (admin) {
    const { data } = await admin.auth.admin.getUserById(auth.user.id)
    if (data?.user) {
      const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>
      const fullName =
        typeof meta.full_name === "string" && meta.full_name.trim()
          ? meta.full_name.trim()
          : data.user.email?.split("@")[0] || "User"
      return {
        id: data.user.id,
        email: data.user.email ?? "",
        fullName,
        metadata: meta,
      }
    }
  }

  const meta = (auth.user.user_metadata ?? {}) as Record<string, unknown>
  return {
    id: auth.user.id,
    email: auth.user.email ?? "",
    fullName:
      typeof meta.full_name === "string" && meta.full_name.trim()
        ? meta.full_name.trim()
        : auth.user.email?.split("@")[0] || "User",
    metadata: meta,
  }
}

export async function demoSignOutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(DEMO_SIG_COOKIE)
  cookieStore.delete(DEMO_USER_COOKIE)
}
