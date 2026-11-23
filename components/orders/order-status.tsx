"use client"

/**
 * Option 1: Editorial Monochrome & Hairline Borders.
 * Clean 1px bordered capsules with muted semantic tints and an outline-to-solid
 * action button — zero neon glow or dots before words.
 */

const EDITORIAL: Record<string, { pill: string; button: string }> = {
  Pending: {
    pill: "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/35",
    button:
      "border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-black",
  },
  Confirmed: {
    pill: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/35",
    button:
      "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white",
  },
  Processing: {
    pill: "bg-blue-500/12 text-blue-600 dark:text-blue-400 border-blue-500/35",
    button:
      "border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white",
  },
  Shipped: {
    pill: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 border-indigo-500/35",
    button:
      "border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white",
  },
  Delivered: {
    pill: "bg-zinc-900/8 text-zinc-800 dark:bg-white/10 dark:text-zinc-100 border-zinc-500/35",
    button:
      "border-zinc-500/40 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-black",
  },
  Cancelled: {
    pill: "bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-500/35",
    button:
      "border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white",
  },
}

const FALLBACK = {
  pill: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 border-neutral-400/35",
  button:
    "border-neutral-400/40 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-800 hover:text-white",
}

export function OrderStatusPill({ status, large = false }: { status: string; large?: boolean }) {
  const style = EDITORIAL[status] ?? FALLBACK
  return (
    <span
      className={`inline-flex items-center justify-center font-semibold rounded-full border ${style.pill} ${
        large ? "px-3.5 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]"
      }`}
    >
      {status}
    </span>
  )
}

/** Editorial outline-to-solid action button for order status actions (e.g. Cancel Order). */
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
  const style = EDITORIAL[status] ?? FALLBACK
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center rounded-full border font-semibold text-xs px-4 py-1.5 cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${style.button}`}
    >
      {children}
    </button>
  )
}
