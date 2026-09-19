"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { X, Plus, Power, Trash2 } from "lucide-react"
import type { Order, Product } from "@/lib/types"
import { useToast } from "@/contexts/toast-context"
import {
  listPromosAction,
  createPromoAction,
  togglePromoAction,
  deletePromoAction,
  type PromoCode,
} from "@/lib/actions/promos"
import {
  getDealsPopupAction,
  updateDealsPopupAction,
  applyDealsPercentAction,
  clearAppliedPercentAction,
} from "@/lib/actions/deals-popup"

// Exact home-card palette per tier — same card, only the color changes.
const TIERS = [
  { pct: 100, text: "text-rose-400", title: "text-rose-500", line: "after:bg-rose-200 before:bg-rose-200", close: "text-rose-400/70 hover:text-rose-600 hover:bg-rose-100", btn: "bg-rose-400 hover:bg-rose-300" },
  { pct: 90, text: "text-orange-400", title: "text-orange-500", line: "after:bg-orange-200 before:bg-orange-200", close: "text-orange-400/70 hover:text-orange-600 hover:bg-orange-100", btn: "bg-orange-400 hover:bg-orange-300" },
  { pct: 80, text: "text-amber-400", title: "text-amber-500", line: "after:bg-amber-200 before:bg-amber-200", close: "text-amber-400/70 hover:text-amber-600 hover:bg-amber-100", btn: "bg-amber-400 hover:bg-amber-300" },
  { pct: 70, text: "text-yellow-400", title: "text-yellow-500", line: "after:bg-yellow-200 before:bg-yellow-200", close: "text-yellow-400/70 hover:text-yellow-600 hover:bg-yellow-100", btn: "bg-yellow-400 hover:bg-yellow-300" },
  { pct: 60, text: "text-lime-500", title: "text-lime-600", line: "after:bg-lime-200 before:bg-lime-200", close: "text-lime-500/70 hover:text-lime-700 hover:bg-lime-100", btn: "bg-lime-500 hover:bg-lime-400" },
  { pct: 50, text: "text-green-500", title: "text-green-600", line: "after:bg-green-200 before:bg-green-200", close: "text-green-500/70 hover:text-green-700 hover:bg-green-100", btn: "bg-green-500 hover:bg-green-400" },
  { pct: 40, text: "text-emerald-400", title: "text-emerald-500", line: "after:bg-emerald-200 before:bg-emerald-200", close: "text-emerald-400/70 hover:text-emerald-600 hover:bg-emerald-100", btn: "bg-emerald-400 hover:bg-emerald-300" },
  { pct: 30, text: "text-teal-400", title: "text-teal-500", line: "after:bg-teal-200 before:bg-teal-200", close: "text-teal-400/70 hover:text-teal-600 hover:bg-teal-100", btn: "bg-teal-400 hover:bg-teal-300" },
  { pct: 20, text: "text-cyan-400", title: "text-cyan-500", line: "after:bg-cyan-200 before:bg-cyan-200", close: "text-cyan-400/70 hover:text-cyan-600 hover:bg-cyan-100", btn: "bg-cyan-400 hover:bg-cyan-300" },
  { pct: 10, text: "text-sky-400", title: "text-sky-500", line: "after:bg-sky-200 before:bg-sky-200", close: "text-sky-400/70 hover:text-sky-600 hover:bg-sky-100", btn: "bg-sky-400 hover:bg-sky-300" },
]

function discountOf(p: Product): number {
  return p.original_price && p.original_price > p.price
    ? Math.round((1 - p.price / p.original_price) * 100)
    : 0
}

/** Pixel-clone of the home discount card — only palette + percent vary. */
function DealPopupCard({
  tier,
  liveCount,
  title,
  subtitle,
  buttonLabel,
  showApply,
  applyBusy,
  onApply,
  onHide,
}: {
  tier: (typeof TIERS)[number]
  liveCount: number
  title: string
  subtitle: string
  buttonLabel: string
  showApply: boolean
  applyBusy: boolean
  onApply: () => void
  onHide: () => void
}) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`overflow-hidden relative w-full rounded-2xl bg-gray-50 ${tier.text} flex flex-col justify-end items-center gap-3 py-10 px-6 shadow-2xl`}
      >
        <svg
          className="absolute opacity-20 -rotate-12 -bottom-20 -right-20 w-44 h-44 stroke-current pointer-events-none"
          height="100"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 100 100"
          width="100"
          aria-hidden
        >
          <path
            d="M65.8,46.1V30.3a15.8,15.8,0,1,0-31.6,0V46.1M22.4,38.2H77.6l4,47.3H18.4Z"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="8"
          />
        </svg>

        <button
          type="button"
          onClick={onHide}
          aria-label="Hide preview"
          className={`absolute top-2 right-2 z-10 p-1.5 ${tier.close} rounded-full transition-colors cursor-pointer`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center">
          <p className={`text-2xl font-extrabold ${tier.title}`}>{title}</p>
          <p className={`relative text-sm inline-block ${tier.text} after:absolute after:content-[''] after:ml-2 after:top-1/2 ${tier.line} after:w-12 after:h-0.5 before:absolute before:content-[''] before:-ml-14 before:top-1/2 before:w-12 before:h-0.5`}>
            {subtitle}
          </p>
        </div>
        <span className={`font-extrabold text-7xl xl:text-8xl whitespace-nowrap leading-none -skew-x-12 -skew-y-12 -mt-1 mb-2 ${tier.text}`}>
          {tier.pct}%
        </span>
        <Image
          src="/images/discount/discount.jpeg"
          alt="Discount mascot"
          width={480}
          height={480}
          className="w-[314px] max-w-full h-auto object-contain -my-2"
        />
        <button
          type="button"
          className={`z-10 px-6 py-3 ${tier.btn} text-gray-50 active:scale-95 transition-all cursor-pointer font-bold text-base rounded-lg`}
        >
          {buttonLabel}
        </button>
        <p className={`text-sm mb-1 font-bold tracking-widest ${tier.text}`}>BIG SAVINGS</p>
      </div>
      <div className="flex items-center justify-center gap-2 mt-2">
        {showApply && (
          <button
            type="button"
            onClick={onApply}
            disabled={applyBusy}
            className="px-4 py-1.5 rounded-full bg-gray-900 text-white text-[11px] font-bold hover:bg-gray-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {applyBusy ? "Applying…" : "Apply"}
          </button>
        )}
        <p className="text-[11px] font-semibold text-gray-400">
          {liveCount > 0 ? `${liveCount} live at ~${tier.pct}%` : `No live deals at ${tier.pct}%`}
        </p>
      </div>
    </div>
  )
}

/**
 * Offers tab — deal-popup ladder (exact home cards, recolored 100→10) plus
 * promo codes in the new design's coupon-card language. All counts live.
 */
export function OffersDiscountView({
  orders,
  products,
  isAdmin,
}: {
  orders: Order[]
  products: Product[]
  /** Only the store admin may apply offer tiers to their own products. */
  isAdmin: boolean
}) {
  const { showToast } = useToast()
  const [promos, setPromos] = useState<PromoCode[] | null>(null)
  const [code, setCode] = useState("")
  const [percent, setPercent] = useState("")
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [hidden, setHidden] = useState<number[]>([])
  const [popupTitle, setPopupTitle] = useState("Discount")
  const [popupSubtitle, setPopupSubtitle] = useState("Up to")
  const [popupButton, setPopupButton] = useState("Shop now")
  const [popupEnabled, setPopupEnabled] = useState(true)
  const [savingPopup, setSavingPopup] = useState(false)
  const [applying, setApplying] = useState<number | null>(null)

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
    void getDealsPopupAction().then((res) => {
      if (res.ok) {
        setPopupEnabled(res.data.enabled)
        setPopupTitle(res.data.title)
        setPopupSubtitle(res.data.subtitle)
        setPopupButton(res.data.button_label)
      }
    })
  }, [load])

  const usesOf = useCallback(
    (promoCode: string) => orders.filter((o) => (o.promo_code ?? "").toUpperCase() === promoCode).length,
    [orders]
  )

  const liveAt = useCallback(
    (pct: number) =>
      products.filter((p) => {
        const d = discountOf(p)
        return d > 0 && Math.round(d / 10) * 10 === pct
      }).length + (promos ?? []).filter((p) => p.percent_off === pct && p.active).length,
    [products, promos]
  )

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const res = await createPromoAction({ code, percent_off: Number(percent) })
      if (res.ok) {
        setCode("")
        setPercent("")
        setShowForm(false)
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
      setPromos((prev) => prev?.map((p) => (p.code === promo.code ? { ...p, active: !p.active } : p)) ?? prev)
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

  const handleApply = async (pct: number) => {
    if (applying !== null) return
    setApplying(pct)
    try {
      const res = await applyDealsPercentAction(pct)
      if (res.ok) {
        showToast(`${pct}% offer applied to your products.`, "success")
      } else {
        showToast(res.error, "error")
      }
    } finally {
      setApplying(null)
    }
  }

  const handleClearOffer = async () => {
    if (applying !== null) return
    setApplying(-1)
    try {
      const res = await clearAppliedPercentAction()
      if (res.ok) {
        showToast("Offer cleared — previous prices restored.", "info")
      } else {
        showToast(res.error, "error")
      }
    } finally {
      setApplying(null)
    }
  }

  const handleSavePopup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (savingPopup) return
    setSavingPopup(true)
    try {
      const res = await updateDealsPopupAction({
        enabled: popupEnabled,
        title: popupTitle,
        subtitle: popupSubtitle,
        button_label: popupButton,
      })
      showToast(res.ok ? "Home popup saved." : res.error, res.ok ? "success" : "error")
    } finally {
      setSavingPopup(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. DEAL POPUP LADDER — exact home cards, 100% → 10% */}
      <div className="p-6 rounded-[22px] border bg-white border-gray-100 shadow-sm">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">Deal Popups 100% → 10%</h3>
          <p className="text-xs text-gray-400 mt-0.5">Same card as the home discount popup, one color per tier</p>
          {isAdmin && (
            <div className="mt-2 flex items-center gap-3">
              <p className="text-[11px] text-gray-400">Applying a tier sets this discount on your own products.</p>
              <button
                type="button"
                onClick={() => void handleClearOffer()}
                disabled={applying === -1}
                className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 underline disabled:opacity-40 cursor-pointer"
              >
                Clear offer (restore prices)
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {TIERS.filter((t) => !hidden.includes(t.pct)).map((tier) => (
            <DealPopupCard
              key={tier.pct}
              tier={tier}
              liveCount={liveAt(tier.pct)}
              title={popupTitle}
              subtitle={popupSubtitle}
              buttonLabel={popupButton}
              showApply={isAdmin}
              applyBusy={applying === tier.pct}
              onApply={() => void handleApply(tier.pct)}
              onHide={() => setHidden((prev) => [...prev, tier.pct])}
            />
          ))}
        </div>
        {hidden.length > 0 && (
          <button
            type="button"
            onClick={() => setHidden([])}
            className="mt-4 text-[11px] font-semibold text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            Show hidden previews ({hidden.length})
          </button>
        )}
      </div>

      {/* 2. PROMO CODES — new-design coupon cards, live */}
      <div className="p-6 rounded-[22px] border bg-white border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Promotions & Discounts</h3>
            <p className="text-xs text-gray-400 mt-0.5">Active discount coupons redeemable at checkout</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-xl bg-[#98e4af] text-gray-950 text-xs font-bold hover:bg-[#88deb3] cursor-pointer"
          >
            Create Coupon
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="flex gap-2 mb-5">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="CODE"
              aria-label="Promo code"
              className="flex-1 min-w-0 px-4 py-2.5 bg-[#F3F4F6] rounded-xl text-sm font-mono uppercase outline-none focus:bg-white focus:ring-1 focus:ring-[#98e4af]"
            />
            <input
              type="number"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="%"
              aria-label="Percent off"
              min={1}
              max={90}
              className="w-20 px-4 py-2.5 bg-[#F3F4F6] rounded-xl text-sm outline-none focus:bg-white focus:ring-1 focus:ring-[#98e4af]"
            />
            <button
              type="submit"
              disabled={busy || !code.trim() || !percent}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#98e4af] text-gray-950 rounded-xl text-xs font-bold hover:bg-[#88deb3] disabled:opacity-40 cursor-pointer"
            >
              <Plus size={14} aria-hidden /> Add
            </button>
          </form>
        )}

        {promos === null ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : promos.length === 0 ? (
          <p className="text-sm text-gray-400">No codes yet — create one above.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {promos.map((promo) => (
              <div
                key={promo.code}
                className="p-5 rounded-2xl border bg-[#F9FAFB] border-gray-200/80"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-[#98e4af] text-gray-950 font-mono font-bold text-xs">
                    {promo.code}
                  </span>
                  <span className={`text-xs font-semibold ${promo.active ? "text-emerald-600" : "text-gray-400"}`}>
                    {promo.active ? "Active" : "Off"}
                  </span>
                </div>
                <h4 className="text-xl font-bold tracking-tight text-gray-900">{promo.percent_off}% OFF</h4>
                <p className="text-xs text-gray-400 mt-1">{usesOf(promo.code)} redemptions</p>
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => void handleToggle(promo)}
                    aria-label={promo.active ? `Deactivate ${promo.code}` : `Activate ${promo.code}`}
                    className="p-2 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
                  >
                    <Power size={16} aria-hidden className={promo.active ? "text-emerald-500" : "text-gray-400"} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(promo)}
                    aria-label={`Delete ${promo.code}`}
                    className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. HOME POPUP COPY — same words feed every card above */}
      <div className="p-6 rounded-[22px] border bg-white border-gray-100 shadow-sm">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-gray-900">Home Popup Content</h3>
          <p className="text-xs text-gray-400 mt-0.5">Title, subtitle and button shown on the home discount popup</p>
        </div>
        <form onSubmit={handleSavePopup} className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
          <input
            type="text"
            value={popupTitle}
            onChange={(e) => setPopupTitle(e.target.value)}
            aria-label="Popup title"
            className="px-4 py-2.5 rounded-xl text-sm outline-none bg-[#F3F4F6] text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#98e4af]"
          />
          <input
            type="text"
            value={popupSubtitle}
            onChange={(e) => setPopupSubtitle(e.target.value)}
            aria-label="Popup subtitle"
            className="px-4 py-2.5 rounded-xl text-sm outline-none bg-[#F3F4F6] text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#98e4af]"
          />
          <input
            type="text"
            value={popupButton}
            onChange={(e) => setPopupButton(e.target.value)}
            aria-label="Popup button label"
            className="px-4 py-2.5 rounded-xl text-sm outline-none bg-[#F3F4F6] text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#98e4af]"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPopupEnabled((v) => !v)}
              aria-pressed={popupEnabled}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${popupEnabled ? "bg-[#98e4af] text-gray-950" : "bg-gray-100 text-gray-500"}`}
            >
              {popupEnabled ? "Popup On" : "Popup Off"}
            </button>
            <button
              type="submit"
              disabled={savingPopup}
              className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-xs hover:opacity-90 disabled:opacity-40 cursor-pointer"
            >
              {savingPopup ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
