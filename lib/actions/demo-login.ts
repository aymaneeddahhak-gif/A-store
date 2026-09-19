"use server"

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { isAdminEmail } from "@/lib/admin"

/**
 * Admin one-click demo sign-in — server-side only.
 *
 * The admin password lives in ADMIN_DEMO_PASSWORD (server env, never
 * NEXT_PUBLIC), so it never ships to the browser bundle and is not in the
 * repo. The admin demo card is additionally hidden outside development.
 */
export async function demoAdminLoginAction(): Promise<{ ok: boolean; error?: string }> {
  const password = process.env.ADMIN_DEMO_PASSWORD
  if (!password) {
    return { ok: false, error: "Admin demo sign-in is not configured on this deployment." }
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: "admin@a-store.shop",
      password,
    })
    if (error) return { ok: false, error: error.message }

    // Belt-and-braces: confirm the signed-in account is the configured admin.
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user || !isAdminEmail(auth.user.email)) {
      return { ok: false, error: "This account is not the store admin." }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not sign in. Check your connection." }
  }
}
