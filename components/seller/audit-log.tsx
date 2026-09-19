"use client"

import { useCallback, useEffect, useState } from "react"
import { ScrollText } from "lucide-react"
import { useToast } from "@/contexts/toast-context"
import { listAuditAction, type AuditEntry } from "@/lib/actions/audit"

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const ACTION_LABELS: Record<string, string> = {
  create: "created",
  update: "updated",
  delete: "deleted",
  status: "updated status on",
  cancel: "cancelled",
  ban: "banned",
  unban: "unbanned",
  feature: "featured",
  unfeature: "unfeatured",
}

function describe(entry: AuditEntry): string {
  const verb = ACTION_LABELS[entry.action] ?? entry.action
  const target = entry.entity_id ? ` ${entry.entity} #${entry.entity_id}` : ` ${entry.entity}`
  return `${verb}${target}`
}

/** Admin audit trail — who created/edited/deleted what, newest first. */
export function AuditLog() {
  const { showToast } = useToast()
  const [entries, setEntries] = useState<AuditEntry[] | null>(null)
  const [unconfigured, setUnconfigured] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    const res = await listAuditAction(50)
    if (res.ok) setEntries(res.data)
    else if (res.unconfigured) setUnconfigured(true)
    else {
      setFailed(true)
      showToast(res.error, "error")
    }
  }, [showToast])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[40px] overflow-hidden">
      <div className="p-8 border-b border-[var(--border-color)]">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <ScrollText className="text-blue-500" /> Audit Log
        </h2>
      </div>
      <div className="p-8 pt-6">
        {unconfigured ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-6">
            Audit needs <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in
            .env.local.
          </p>
        ) : failed ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-6">
            Audit log is unavailable (missing audit_log table?).
          </p>
        ) : !entries ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-6">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-6">
            No admin activity recorded yet.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-2xl text-xs"
              >
                <div className="min-w-0">
                  <span className="font-bold">{entry.actor_email ?? "system"}</span>{" "}
                  <span className="text-[var(--muted-foreground)]">{describe(entry)}</span>
                </div>
                <span className="text-[var(--muted-foreground)] shrink-0 tabular-nums">
                  {formatTime(entry.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
