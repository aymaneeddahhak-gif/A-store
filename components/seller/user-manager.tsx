"use client"

import { useCallback, useEffect, useState } from "react"
import { Users, Trash2, Ban, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/contexts/providers/auth-context"
import { useToast } from "@/contexts/toast-context"
import {
  listUsersAction,
  deleteUserAction,
  setUserBannedAction,
  type ManagedUser,
} from "@/lib/actions/users"

function formatDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

/**
 * Admin user management — lists every auth user with ban/delete. Rendered
 * for the admin login only; without SUPABASE_SERVICE_ROLE_KEY it explains
 * the one-line setup instead of failing.
 */
export function UserManager() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [users, setUsers] = useState<ManagedUser[] | null>(null)
  const [unconfigured, setUnconfigured] = useState(false)
  const [failed, setFailed] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await listUsersAction()
    if (res.ok) {
      setUsers(res.data)
    } else if (res.unconfigured) {
      setUnconfigured(true)
    } else {
      setFailed(true)
      showToast(res.error, "error")
    }
  }, [showToast])

  useEffect(() => {
    void load()
  }, [load])

  const handleDelete = async (target: ManagedUser) => {
    if (!confirm(`Permanently delete ${target.email}? Their sandbox products go with it.`)) return
    setBusyId(target.id)
    try {
      const res = await deleteUserAction(target.id)
      if (res.ok) {
        setUsers((prev) => prev?.filter((u) => u.id !== target.id) ?? prev)
        showToast("User deleted.", "info")
      } else {
        showToast(res.error, "error")
      }
    } finally {
      setBusyId(null)
    }
  }

  const handleBanToggle = async (target: ManagedUser) => {
    setBusyId(target.id)
    try {
      const res = await setUserBannedAction(target.id, !target.banned)
      if (res.ok) {
        setUsers((prev) =>
          prev?.map((u) => (u.id === target.id ? { ...u, banned: !u.banned } : u)) ?? prev
        )
        showToast(target.banned ? "User unbanned." : "User banned.", "success")
      } else {
        showToast(res.error, "error")
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[40px] overflow-hidden mt-8">
      <div className="p-8 border-b border-[var(--border-color)] flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Users className="text-emerald-500" /> Users
        </h2>
        {users && (
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] rounded-full opacity-60">
            {users.length} total
          </span>
        )}
      </div>

      {unconfigured ? (
        <p className="px-8 py-12 text-center text-sm text-[var(--muted-foreground)]">
          User management needs <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in
          .env.local (server restart required). Product tools above work without it.
        </p>
      ) : failed ? (
        <p className="px-8 py-12 text-center text-sm text-[var(--muted-foreground)]">
          Could not load users.
        </p>
      ) : !users ? (
        <p className="px-8 py-12 text-center text-sm text-[var(--muted-foreground)]">
          Loading users…
        </p>
      ) : users.length === 0 ? (
        <p className="px-8 py-12 text-center text-sm text-[var(--muted-foreground)]">
          No users yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest opacity-40 font-black border-b border-[var(--border-color)]">
                <th className="px-8 py-5 text-left">User</th>
                <th className="px-8 py-5 text-left">Joined</th>
                <th className="px-8 py-5 text-left">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {users.map((u) => {
                const isSelf = u.id === user?.id
                return (
                  <tr key={u.id} className="hover:bg-[var(--glass-bg)] transition-all">
                    <td className="px-8 py-5">
                      <div className="font-bold text-sm">
                        {u.fullName}
                        {isSelf && (
                          <span className="ml-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-[var(--glass-highlight)] rounded-full opacity-70">
                            you
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">{u.email}</div>
                    </td>
                    <td className="px-8 py-5 text-sm">{formatDate(u.createdAt)}</td>
                    <td className="px-8 py-5">
                      {u.banned ? (
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded-full">
                          Banned
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void handleBanToggle(u)}
                          disabled={isSelf || busyId === u.id}
                          aria-label={u.banned ? `Unban ${u.email}` : `Ban ${u.email}`}
                          title={u.banned ? "Unban" : "Ban"}
                          className="p-3 hover:bg-amber-500/10 text-amber-500 rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {u.banned ? <CheckCircle2 size={18} /> : <Ban size={18} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(u)}
                          disabled={isSelf || busyId === u.id}
                          aria-label={`Delete ${u.email}`}
                          title="Delete"
                          className="p-3 hover:bg-rose-500/10 text-rose-500 rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
