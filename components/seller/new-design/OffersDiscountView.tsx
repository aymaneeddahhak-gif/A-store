"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import type { Product } from "@/lib/types"
import { useToast } from "@/contexts/toast-context"
import { listPromosAction, type PromoCode } from "@/lib/actions/promos"
import {
  getDealsPopupAction,
  applyDealsPercentAction,
  clearAppliedPercentAction,
  type DealsPopupConfig,
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
        className={`overflow-hidden relative w-full rounded-2xl bg-white ${tier.text} flex flex-col justify-end items-center gap-3 py-10 px-6 shadow-2xl`}
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
          aria-label={`Hide the ${tier.pct}% preview`}
          className={`absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 ${tier.close} transition-colors cursor-pointer`}
        >
          <X className="w-4 h-4" />
        </button>
        <p className={`text-2xl font-extrabold ${tier.title}`}>{title}</p>
        <p className={`relative text-sm inline-block ${tier.text} after:absolute after:content-[''] after:ml-2 after:top-1/2 ${tier.line} after:w-12 after:h-0.5 before:absolute before:content-[''] before:-ml-14 before:top-1/2 ${tier.line} before:w-12 before:h-0.5`}>
          {subtitle}
        </p>
        <span className={`font-extrabold text-7xl leading-none -skew-x-12 -skew-y-12 ${tier.text}`}>
          {tier.pct}%
        </span>
        <div className="h-[150px] w-full max-w-[340px] rounded-xl bg-white overflow-hidden flex items-center justify-center">
          <Image
            src="/images/discount/discount-white.png"
            alt=""
            width={340}
            height={190}
            className="h-full w-full object-contain object-center bg-white"
          />
        </div>
        <button
          type="button"
          className={`z-10 px-6 py-2.5 ${tier.btn} text-gray-50 transition-colors font-bold text-base rounded-lg`}
        >
          {buttonLabel}
        </button>
        <p className={`text-sm font-bold tracking-widest ${tier.text}`}>BIG SAVINGS</p>
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <p className="text-[11px] text-gray-400">
          {liveCount > 0 ? `${liveCount} live at this tier` : "no live deals at this tier"}
        </p>
        {showApply && (
          <button
            type="button"
            onClick={onApply}
            disabled={applyBusy}
            className="px-4 py-1.5 rounded-full bg-gray-900 text-white text-[11px] font-bold hover:opacity-85 disabled:opacity-40 transition-opacity cursor-pointer"
          >
            {applyBusy ? "Applying…" : "Apply"}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Offers tab — the deal-popup ladder only (exact home cards, recolored
 * 100→10) with admin Apply/Clear. Promo codes and popup-copy editing were
 * removed by design; the home popup's words come from the seeded defaults.
 */
export function OffersDiscountView({
  isDarkMode = false,
  products,
  isAdmin,
}: {
  isDarkMode?: boolean
  products: Product[]
  /** Only the store admin may apply offer tiers to their own products. */
  isAdmin: boolean
}) {
  const { showToast } = useToast()
  const [promoCount, setPromoCount] = useState<number | null>(null)
  const [hidden, setHidden] = useState<number[]>([])
  const [popupCopy, setPopupCopy] = useState<DealsPopupConfig | null>(null)
  const [applying, setApplying] = useState<number | null>(null)

  useEffect(() => {
    void listPromosAction().then((res: Awaited<ReturnType<typeof listPromosAction>>) => {
      // Promo codes were removed from this view; we still count active ones
      // so the ladder's "live" numbers include them, same as before.
      if (res.ok) setPromoCount(res.data.filter((p: PromoCode) => p.active).length)
    })
    void getDealsPopupAction().then((res) => {
      if (res.ok) setPopupCopy(res.data)
    })
  }, [])

  const liveAt = useCallback(
    (pct: number) =>
      products.filter((p) => {
        const d = discountOf(p)
        return d > 0 && Math.round(d / 10) * 10 === pct
      }).length + (promoCount ?? 0),
    [products, promoCount]
  )

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

  return (
    <div className="space-y-6">
      {/* DEAL POPUP LADDER — exact home cards, 100% → 10% */}
      <div className={`p-6 rounded-[22px] border transition-colors ${isDarkMode ? 'bg-[#1e2022] border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className="mb-6">
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Deal Popups 100% → 10%</h3>
          <p className="text-xs text-gray-400 mt-0.5">Same card as the home discount popup, one color per tier</p>
          {isAdmin && (
            <div className="mt-2 flex items-center gap-3">
              <p className="text-[11px] text-gray-400">Applying a tier sets this discount on your own products.</p>
              <button
                type="button"
                onClick={() => void handleClearOffer()}
                disabled={applying === -1}
                className={`text-[11px] font-semibold underline disabled:opacity-40 cursor-pointer ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
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
              title={popupCopy?.title ?? "Discount"}
              subtitle={popupCopy?.subtitle ?? "Up to"}
              buttonLabel={popupCopy?.button_label ?? "Shop now"}
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
    </div>
  )
}
