"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { isAdminEmail } from "@/lib/admin"
import { logAudit } from "@/lib/actions/audit"

export interface ManagedUser {
  id: string
  email: string
  fullName: string
  createdAt: string
  banned: boolean
}

export type UsersActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string; unconfigured?: boolean }

/**
 * Session gate for user management — admin login only, plus a configured
 * service-role key (server-side only, never shipped to the browser).
 */
async function requireAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user || !isAdminEmail(auth.user.email)) {
    return { ok: false as const, error: "Restricted to the store admin." }
  }
  const admin = createSupabaseAdminClient()
  if (!admin) {
    return {
      ok: false as const,
      error: "User management needs SUPABASE_SERVICE_ROLE_KEY in .env.local (server restart required).",
      unconfigured: true,
    }
  }
  return {
    ok: true as const,
    admin,
    ownId: auth.user.id,
    ownEmail: auth.user.email ?? "",
  }
}

export async function listUsersAction(): Promise<UsersActionResult<ManagedUser[]>> {
  const gate = await requireAdmin()
  if (!gate.ok) return gate

  const { data, error } = await gate.admin.auth.admin.listUsers()
  if (error) return { ok: false, error: error.message }

  return {
    ok: true,
    // ban_duration is returned by the Auth API but missing from the
    // client User type — read it loosely.
    data: data.users.map((u) => {
      const banDuration = (u as unknown as { ban_duration?: string }).ban_duration
      return {
        id: u.id,
        email: u.email ?? "—",
        fullName:
          (u.user_metadata?.full_name as string | undefined) ||
          (u.email?.split("@")[0] ?? "—"),
        createdAt: u.created_at,
        banned: !!banDuration && banDuration !== "none",
      }
    }),
  }
}

export async function deleteUserAction(id: string): Promise<UsersActionResult> {
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  if (id === gate.ownId) {
    return { ok: false, error: "You cannot delete your own admin account." }
  }

  const { error } = await gate.admin.auth.admin.deleteUser(id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/seller")
  void logAudit({
    actorId: gate.ownId,
    actorEmail: gate.ownEmail,
    action: "delete",
    entity: "user",
    entityId: id,
  })
  return { ok: true, data: null }
}

export async function setUserBannedAction(
  id: string,
  banned: boolean
): Promise<UsersActionResult> {
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  if (id === gate.ownId) {
    return { ok: false, error: "You cannot ban your own admin account." }
  }

  const { error } = await gate.admin.auth.admin.updateUserById(id, {
    ban_duration: banned ? "876000h" : "none",
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath("/seller")
  void logAudit({
    actorId: gate.ownId,
    actorEmail: gate.ownEmail,
    action: banned ? "ban" : "unban",
    entity: "user",
    entityId: id,
  })
  return { ok: true, data: null }
}
