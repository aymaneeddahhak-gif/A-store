"use client"

/**
 * Order status style (Uiverse BHARGAVPATEL1244): solid glow pill per status
 * for labels, skewed-shroud sweep for status-changing buttons.
 */

const GLOW: Record<string, { pill: string; sweep: string }> = {
  Pending: {
    pill: "bg-[#fbb034] text-black shadow-[0_2px_12px_rgba(251,176,52,0.45)]",
    sweep:
      "bg-[#fbb034] text-white hover:text-black before:bg-black shadow-[0_2px_12px_rgba(251,176,52,0.45)]",
  },
  Confirmed: {
    pill: "bg-[#00ffaa] text-black shadow-[0_2px_12px_rgba(0,255,170,0.45)]",
    sweep:
      "bg-[#00ffaa] text-white hover:text-black before:bg-black shadow-[0_2px_12px_rgba(0,255,170,0.45)]",
  },
  Processing: {
    pill: "bg-[#3b82f6] text-white shadow-[0_2px_12px_rgba(59,130,246,0.45)]",
    sweep:
      "bg-[#3b82f6] text-white hover:text-black before:bg-black shadow-[0_2px_12px_rgba(59,130,246,0.45)]",
  },
  Shipped: {
    pill: "bg-[#8b5cf6] text-white shadow-[0_2px_12px_rgba(139,92,246,0.45)]",
    sweep:
      "bg-[#8b5cf6] text-white hover:text-black before:bg-black shadow-[0_2px_12px_rgba(139,92,246,0.45)]",
  },
  Delivered: {
    pill: "bg-[#10b981] text-white shadow-[0_2px_12px_rgba(16,185,129,0.45)]",
    sweep:
      "bg-[#10b981] text-white hover:text-black before:bg-black shadow-[0_2px_12px_rgba(16,185,129,0.45)]",
  },
  Cancelled: {
    pill: "bg-[#f43f5e] text-white shadow-[0_2px_12px_rgba(244,63,94,0.45)]",
    sweep:
      "bg-[#f43f5e] text-white hover:text-black before:bg-black shadow-[0_2px_12px_rgba(244,63,94,0.45)]",
  },
}

const FALLBACK = {
  pill: "bg-neutral-500 text-white shadow-[0_2px_12px_rgba(115,115,115,0.45)]",
  sweep:
    "bg-neutral-500 text-white hover:text-black before:bg-black shadow-[0_2px_12px_rgba(115,115,115,0.45)]",
}

export function OrderStatusPill({ status, large = false }: { status: string; large?: boolean }) {
  const style = GLOW[status] ?? FALLBACK
  return (
    <span
      className={`inline-flex items-center justify-center font-bold tracking-[0.05rem] rounded-full ${style.pill} ${
        large ? "px-4 py-1.5 text-xs" : "px-2.5 py-0.5 text-[11px]"
      }`}
    >
      <span className="relative z-10">{status}</span>
    </span>
  )
}

/** Status-colored action button with the skewed black shroud sweep on hover. */
export function StatusSweepButton({
  status,
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  status: string
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  ariaLabel?: string
}) {
  const style = GLOW[status] ?? FALLBACK
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`relative inline-block overflow-hidden rounded-full font-bold tracking-[0.05rem] uppercase text-[11px] px-5 py-2 cursor-pointer transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed
        before:content-[''] before:absolute before:top-0 before:left-[-10%] before:w-[120%] before:h-full before:z-0
        before:bg-black before:[transform:skew(30deg)] before:transition-transform before:duration-300
        hover:before:translate-x-full ${style.sweep}`}
    >
      <span className="relative z-10 transition-colors duration-300">{children}</span>
    </button>
  )
}
