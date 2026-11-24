"use server"

import { cookies } from "next/headers"
import {
  DEMO_SIG_COOKIE,
  DEMO_USER_COOKIE,
  signDemoCookiePayload,
  verifyDemoCookiePayload,
} from "@/lib/supabase-server"
import { DEMO_ACCOUNTS, type DemoAccountId } from "@/lib/demo-accounts"
import {
  destroyDemoSellerSession,
  isActiveDemoSandboxUser,
  isUuid,
  provisionDemoSellerSession,
} from "@/lib/demo-seller-server"

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

  const isAdmin = accountId === "demo_admin"
  const isSeller = accountId === "demo_seller"

  let demoIdentity: { id: string; email: string; fullName: string }

  if (isSeller) {
    // Reuse the visitor's active ephemeral Supabase sandbox if they already have one,
    // otherwise provision a brand-new isolated Supabase user + auto-seed 3 products.
    const cookieStore = await cookies()
    const existing = verifyDemoCookiePayload(cookieStore.get(DEMO_SIG_COOKIE)?.value)
    if (
      existing &&
      existing.email?.toLowerCase() === account.email.toLowerCase() &&
      isUuid(existing.id) &&
      (await isActiveDemoSandboxUser(existing.id))
    ) {
      demoIdentity = {
        id: existing.id,
        email: account.email,
        fullName: "Demo Seller",
      }
    } else {
      const provisioned = await provisionDemoSellerSession()
      demoIdentity = {
        id: provisioned.id,
        email: provisioned.email,
        fullName: provisioned.fullName,
      }
    }
  } else {
    demoIdentity = {
      id: isAdmin ? "admin-official-id" : "demo-customer-id",
      email: account.email,
      fullName: isAdmin ? "Store Admin" : "Alex Customer",
    }
  }

  // Portfolio One-Click demo accounts sign in via the server-signed HttpOnly
  // demo session cookie so entering /seller or /profile is fast and reliable.
  await setSignedDemoCookie({
    id: demoIdentity.id,
    email: demoIdentity.email,
    full_name: demoIdentity.fullName,
  })
  return { ok: true, user: demoIdentity }
}

export async function demoSignOutAction(): Promise<void> {
  const cookieStore = await cookies()
  const existing = verifyDemoCookiePayload(cookieStore.get(DEMO_SIG_COOKIE)?.value)
  cookieStore.delete(DEMO_SIG_COOKIE)
  cookieStore.delete(DEMO_USER_COOKIE)
  if (existing?.id && isUuid(existing.id)) {
    void destroyDemoSellerSession(existing.id)
  }
}
