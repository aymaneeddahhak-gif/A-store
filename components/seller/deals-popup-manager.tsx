"use client"

import { useCallback, useEffect, useState } from "react"
import { BadgePercent, Power } from "lucide-react"
import { useToast } from "@/contexts/toast-context"
import {
  getDealsPopupAction,
  updateDealsPopupAction,
} from "@/lib/actions/deals-popup"

/** Admin entry-popup content — title, subtitle, button label, on/off. */
export function DealsPopupManager() {
  const { showToast } = useToast()
  const [enabled, setEnabled] = useState(true)
  const [title, setTitle] = useState("Discount")
  const [subtitle, setSubtitle] = useState("Up to")
  const [buttonLabel, setButtonLabel] = useState("Shop now")
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await getDealsPopupAction()
    if (res.ok) {
      setEnabled(res.data.enabled)
      setTitle(res.data.title)
      setSubtitle(res.data.subtitle)
      setButtonLabel(res.data.button_label)
      setLoaded(true)
    } else {
      showToast(res.error, "error")
    }
  }, [showToast])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const res = await updateDealsPopupAction({ enabled, title, subtitle, button_label: buttonLabel })
      if (res.ok) showToast("Deals popup saved.", "success")
      else showToast(res.error, "error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[40px] overflow-hidden">
      <div className="p-8 border-b border-[var(--border-color)] flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <BadgePercent className="text-sky-500" /> Deals Popup
        </h2>
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          aria-pressed={enabled}
          title={enabled ? "Disable popup" : "Enable popup"}
          className="p-2.5 hover:bg-[var(--glass-bg)] rounded-xl transition-all cursor-pointer"
        >
          <Power size={16} aria-hidden className={enabled ? "text-emerald-500" : "text-[var(--muted-foreground)]"} />
        </button>
      </div>
      <form onSubmit={handleSave} className="p-8 pt-6 space-y-3">
        {!loaded ? (
          <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider opacity-50 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-sm outline-none focus:ring-1 focus:ring-[var(--foreground)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider opacity-50 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-sm outline-none focus:ring-1 focus:ring-[var(--foreground)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider opacity-50 mb-1">
                Button label
              </label>
              <input
                type="text"
                value={buttonLabel}
                onChange={(e) => setButtonLabel(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-sm outline-none focus:ring-1 focus:ring-[var(--foreground)]"
              />
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              {enabled
                ? "Shows on every home visit with the live max discount."
                : "Currently hidden from visitors."}
            </p>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 bg-[var(--foreground)] text-[var(--background)] rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer"
            >
              {busy ? "Saving…" : "Save Popup"}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
