"use server"

import { cookies } from "next/headers"
import {
  createSupabaseServerClient,
  DEMO_SIG_COOKIE,
  DEMO_USER_COOKIE,
  signDemoCookiePayload,
} from "@/lib/supabase-server"
import { DEMO_ACCOUNTS, type DemoAccountId } from "@/lib/demo-accounts"
import { isSupabaseOffline } from "@/lib/supabase-circuit"

async function setSignedDemoCookie(payload: { id: string; email: string; full_name: string }) {
  const cookieStore = await cookies()
  const signed = signDemoCookiePayload(payload)
  cookieStore.set(DEMO_SIG_COOKIE, signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function demoSessionLoginAction(accountId: DemoAccountId): Promise<{
  ok: boolean
  user?: { id: string; email: string; fullName: string }
  error?: string
}> {
  const account = DEMO_ACCOUNTS.find((a) => a.id === accountId)
  if (!account) return { ok: false, error: "Unknown demo account." }

  const isSeller = accountId === "demo_seller" || accountId === "demo_admin"
  const demoIdentity = {
    id: isSeller ? "demo-seller-role-id" : "demo-customer-id",
    email: account.email,
    fullName: isSeller ? "Demo Seller" : "Alex Customer",
  }

  // If Supabase is paused/offline, issue a server-signed HttpOnly demo cookie
  // immediately so portfolio visitors never hit a hang.
  if (isSupabaseOffline()) {
    await setSignedDemoCookie({
      id: demoIdentity.id,
      email: demoIdentity.email,
      full_name: demoIdentity.fullName,
    })
    return { ok: true, user: demoIdentity }
  }

  const password =
    isSeller ? process.env.DEMO_SELLER_PASSWORD || process.env.DEMO_ADMIN_PASSWORD : account.password

  if (password) {
    try {
      const supabase = await createSupabaseServerClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password,
      })
      if (!error && data.user) {
        return {
          ok: true,
          user: {
            id: data.user.id,
            email: data.user.email ?? account.email,
            fullName:
              (data.user.user_metadata?.full_name as string | undefined) || demoIdentity.fullName,
          },
        }
      }
      if (isSupabaseOffline()) {
        await setSignedDemoCookie({
          id: demoIdentity.id,
          email: demoIdentity.email,
          full_name: demoIdentity.fullName,
        })
        return { ok: true, user: demoIdentity }
      }
      // Fall back cleanly to signed demo session when demo Supabase user hasn't been seeded yet.
      await setSignedDemoCookie({
        id: demoIdentity.id,
        email: demoIdentity.email,
        full_name: demoIdentity.fullName,
      })
      return { ok: true, user: demoIdentity }
    } catch {
      await setSignedDemoCookie({
        id: demoIdentity.id,
        email: demoIdentity.email,
        full_name: demoIdentity.fullName,
      })
      return { ok: true, user: demoIdentity }
    }
  }

  await setSignedDemoCookie({
    id: demoIdentity.id,
    email: demoIdentity.email,
    full_name: demoIdentity.fullName,
  })
  return { ok: true, user: demoIdentity }
}

export async function demoSignOutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(DEMO_SIG_COOKIE)
  cookieStore.delete(DEMO_USER_COOKIE)
}
