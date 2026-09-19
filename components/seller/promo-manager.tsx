"use client"

import { useCallback, useEffect, useState } from "react"
import { TicketPercent, Trash2, Plus, Power } from "lucide-react"
import { useToast } from "@/contexts/toast-context"
import {
  listPromosAction,
  createPromoAction,
  togglePromoAction,
  deletePromoAction,
  type PromoCode,
} from "@/lib/actions/promos"

/** Admin promo codes — percent-off codes redeemable at checkout. */
export function PromoManager() {
  const { showToast } = useToast()
  const [promos, setPromos] = useState<PromoCode[] | null>(null)
  const [code, setCode] = useState("")
  const [percent, setPercent] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await listPromosAction()
    if (res.ok) setPromos(res.data)
    else {
      setPromos([])
      showToast(res.error, "error")
    }
  }, [showToast])

  useEffect(() => {
    void load()
  }, [load])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const res = await createPromoAction({ code, percent_off: Number(percent) })
      if (res.ok) {
        setCode("")
        setPercent("")
        await load()
        showToast(`Code ${res.data.code} created.`, "success")
      } else {
        showToast(res.error, "error")
      }
    } finally {
      setBusy(false)
    }
  }

  const handleToggle = async (promo: PromoCode) => {
    const res = await togglePromoAction(promo.code, !promo.active)
    if (res.ok) {
      setPromos((prev) =>
        prev?.map((p) => (p.code === promo.code ? { ...p, active: !p.active } : p)) ?? prev
      )
    } else {
      showToast(res.error, "error")
    }
  }

  const handleDelete = async (promo: PromoCode) => {
    if (!confirm(`Delete promo code ${promo.code}?`)) return
    const res = await deletePromoAction(promo.code)
    if (res.ok) {
      setPromos((prev) => prev?.filter((p) => p.code !== promo.code) ?? prev)
      showToast("Promo deleted.", "info")
    } else {
      showToast(res.error, "error")
    }
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[40px] overflow-hidden">
      <div className="p-8 border-b border-[var(--border-color)]">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <TicketPercent className="text-emerald-500" /> Promo Codes
        </h2>
      </div>
      <div className="p-8 pt-6 space-y-5">
        {promos === null ? (
          <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
        ) : promos.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            No codes yet — create one below.
          </p>
        ) : (
          <div className="space-y-2">
            {promos.map((promo) => (
              <div
                key={promo.code}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-[var(--background)] border border-[var(--border-color)] rounded-2xl"
              >
                <div>
                  <span className="font-mono font-bold text-sm">{promo.code}</span>
                  <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                    {promo.percent_off}% off
                  </span>
                  {!promo.active && (
                    <span className="ml-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-full">
                      Off
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void handleToggle(promo)}
                    aria-label={promo.active ? `Deactivate ${promo.code}` : `Activate ${promo.code}`}
                    title={promo.active ? "Deactivate" : "Activate"}
                    className="p-2.5 hover:bg-[var(--glass-bg)] rounded-xl transition-all cursor-pointer"
                  >
                    <Power size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(promo)}
                    aria-label={`Delete ${promo.code}`}
                    className="p-2.5 hover:bg-rose-500/10 text-rose-500 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="CODE"
            aria-label="Promo code"
            className="flex-1 min-w-0 px-4 py-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-sm font-mono uppercase outline-none focus:ring-1 focus:ring-[var(--foreground)]"
          />
          <input
            type="number"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            placeholder="%"
            aria-label="Percent off"
            min={1}
            max={90}
            className="w-20 px-4 py-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-sm outline-none focus:ring-1 focus:ring-[var(--foreground)]"
          />
          <button
            type="submit"
            disabled={busy || !code.trim() || !percent}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--foreground)] text-[var(--background)] rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Plus size={14} aria-hidden /> Add
          </button>
        </form>
      </div>
    </div>
  )
}
