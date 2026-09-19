"use server"

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { isAdminEmail } from "@/lib/admin"

export interface AuditEntry {
  id: number
  created_at: string
  actor_email: string | null
  action: string
  entity: string
  entity_id: string | null
  detail: unknown
}

/**
 * Fire-and-forget audit write. Never throws and never blocks the calling
 * action — when the audit_log table or service key is missing it silently
 * skips. Callers use `void logAudit(...)`.
 */
export async function logAudit(input: {
  actorId?: string | null
  actorEmail?: string | null
  action: string
  entity: string
  entityId?: string | number | null
  detail?: unknown
}): Promise<void> {
  try {
    const admin = createSupabaseAdminClient()
    if (!admin) return
    await admin.from("audit_log").insert([
      {
        actor_id: input.actorId ?? null,
        actor_email: input.actorEmail ?? null,
        action: input.action,
        entity: input.entity,
        entity_id:
          input.entityId === undefined || input.entityId === null
            ? null
            : String(input.entityId),
        detail: input.detail ?? null,
      },
    ])
  } catch {
    // Audit must never break the action it records.
  }
}

export type AuditActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; unconfigured?: boolean }

export async function listAuditAction(
  limit = 50
): Promise<AuditActionResult<AuditEntry[]>> {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user || !isAdminEmail(auth.user.email)) {
    return { ok: false, error: "Restricted to the store admin." }
  }
  const admin = createSupabaseAdminClient()
  if (!admin) {
    return {
      ok: false,
      error: "Audit needs SUPABASE_SERVICE_ROLE_KEY in .env.local.",
      unconfigured: true,
    }
  }
  const { data, error } = await admin
    .from("audit_log")
    .select("*")
    .order("id", { ascending: false })
    .limit(limit)
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: (data ?? []) as AuditEntry[] }
}
