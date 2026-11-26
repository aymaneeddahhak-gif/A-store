"use client"

/**
 * Option 2: Architectural Left Accent Bar.
 * Clean flat tag with a crisp 3px left semantic border — zero dots, zero glow.
 */

const ARCHITECTURAL_BASE =
  "border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-[#1e2022] text-gray-900 dark:text-gray-100 border-l-[3px]"

const ARCHITECTURAL_STATUS: Record<string, string> = {
  Pending: `${ARCHITECTURAL_BASE} border-l-amber-600 dark:border-l-amber-400`,
  Confirmed: `${ARCHITECTURAL_BASE} border-l-emerald-600 dark:border-l-[#98e4af]`,
  "Order Confirmed": `${ARCHITECTURAL_BASE} border-l-emerald-600 dark:border-l-[#98e4af]`,
  Processing: `${ARCHITECTURAL_BASE} border-l-blue-600 dark:border-l-blue-400`,
  "In Transit": `${ARCHITECTURAL_BASE} border-l-blue-600 dark:border-l-blue-400`,
  Shipped: `${ARCHITECTURAL_BASE} border-l-indigo-600 dark:border-l-indigo-400`,
  Delivered:
    "border border-emerald-600/25 border-l-[3px] border-l-emerald-700 bg-[#98e4af]/18 text-gray-900 dark:border-[#98e4af]/30 dark:border-l-[#98e4af] dark:bg-[#98e4af]/15 dark:text-gray-100",
  Cancelled: `${ARCHITECTURAL_BASE} border-l-rose-600 dark:border-l-rose-400 text-rose-700 dark:text-rose-400`,
  "Cancel Order": `${ARCHITECTURAL_BASE} border-l-rose-600 dark:border-l-rose-400 text-rose-700 dark:text-rose-400`,
}

const EDITORIAL_BUTTONS: Record<string, string> = {
  Pending: "border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-black",
  Confirmed: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white",
  Processing: "border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white",
  Shipped: "border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white",
  Delivered:
    "border-zinc-500/40 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-black",
  Cancelled: "border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white",
}

const FALLBACK_STATUS = `${ARCHITECTURAL_BASE} border-l-gray-400 dark:border-l-gray-500`
const FALLBACK_BUTTON =
  "border-neutral-400/40 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-800 hover:text-white"

export function orderStatusBadgeClass(status: string): string {
  return ARCHITECTURAL_STATUS[status] ?? FALLBACK_STATUS
}

export function OrderStatusPill({ status, large = false }: { status: string; large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center font-bold rounded-[4px] whitespace-nowrap ${orderStatusBadgeClass(
        status
      )} ${large ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[10.5px]"}`}
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
  const buttonStyle = EDITORIAL_BUTTONS[status] ?? FALLBACK_BUTTON
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center rounded-full border font-semibold text-xs px-4 py-1.5 cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${buttonStyle}`}
    >
      {children}
    </button>
  )
}
