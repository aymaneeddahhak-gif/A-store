"use client"

import {
  ShoppingCart,
  ShoppingBag,
  Truck,
  Star,
  Tag,
  Bell,
  Check,
  AlertCircle,
  Info,
  X,
} from "lucide-react"
import type { ToastDetail } from "@/lib/types"

export type NotificationAccent = NonNullable<ToastDetail["accent"]>
export type NotificationIconKind = NonNullable<ToastDetail["icon"]>

const ICONS: Record<NotificationIconKind, typeof Info> = {
  cart: ShoppingCart,
  bag: ShoppingBag,
  truck: Truck,
  star: Star,
  tag: Tag,
  bell: Bell,
  check: Check,
  alert: AlertCircle,
  info: Info,
}

/** Full static classes per accent (no interpolation — Tailwind safe). */
const ACCENTS: Record<
  NotificationAccent,
  { softBg: string; iconText: string; btn: string }
> = {
  teal: {
    softBg: "bg-teal-600/10",
    iconText: "text-teal-600 dark:text-teal-300",
    btn: "text-teal-700 border-teal-600 bg-teal-600/10 hover:bg-teal-600 hover:text-white dark:text-teal-300 dark:hover:text-white",
  },
  emerald: {
    softBg: "bg-emerald-600/10",
    iconText: "text-emerald-600 dark:text-emerald-300",
    btn: "text-emerald-700 border-emerald-600 bg-emerald-600/10 hover:bg-emerald-600 hover:text-white dark:text-emerald-300 dark:hover:text-white",
  },
  blue: {
    softBg: "bg-blue-500/10",
    iconText: "text-blue-600 dark:text-blue-300",
    btn: "text-blue-700 border-blue-500 bg-blue-500/10 hover:bg-blue-500 hover:text-white dark:text-blue-300 dark:hover:text-white",
  },
  amber: {
    softBg: "bg-amber-500/10",
    iconText: "text-amber-600 dark:text-amber-300",
    btn: "text-amber-700 border-amber-500 bg-amber-500/10 hover:bg-amber-500 hover:text-white dark:text-amber-300 dark:hover:text-white",
  },
  rose: {
    softBg: "bg-rose-500/10",
    iconText: "text-rose-600 dark:text-rose-300",
    btn: "text-rose-700 border-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white dark:text-rose-300 dark:hover:text-white",
  },
  slate: {
    softBg: "bg-neutral-500/10",
    iconText: "text-neutral-600 dark:text-neutral-300",
    btn: "text-neutral-700 border-neutral-400 bg-neutral-500/10 hover:bg-neutral-500 hover:text-white dark:text-neutral-300 dark:hover:text-white",
  },
}

/** Default icon + accent per toast type / bell feed type. */
export const STYLE_FOR_TYPE: Record<string, { icon: NotificationIconKind; accent: NotificationAccent }> = {
  cart: { icon: "cart", accent: "teal" },
  order: { icon: "bag", accent: "emerald" },
  shipping: { icon: "truck", accent: "blue" },
  review: { icon: "star", accent: "amber" },
  promo: { icon: "tag", accent: "emerald" },
  system: { icon: "bell", accent: "slate" },
  success: { icon: "check", accent: "emerald" },
  error: { icon: "alert", accent: "rose" },
  warning: { icon: "alert", accent: "amber" },
  info: { icon: "info", accent: "slate" },
}

interface NotificationCardProps {
  title: string
  message?: string
  productName?: string
  price?: string
  footnote?: string
  icon?: NotificationIconKind
  accent?: NotificationAccent
  actions?: { label: string; onClick: () => void }[]
  onClose?: () => void
}

/**
 * Uiverse-style notification card: icon disc, bold title, optional product
 * + price lines, action buttons, dismiss X. Used by toasts and the bell
 * panel alike; visual style varies by event via icon + accent.
 */
export function NotificationCard({
  title,
  message,
  productName,
  price,
  footnote,
  icon = "info",
  accent = "slate",
  actions,
  onClose,
}: NotificationCardProps) {
  const Icon = ICONS[icon]
  const style = ACCENTS[accent]

  return (
    <div className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-[#f9f9f9] dark:bg-[var(--card)] shadow-[0_10px_28px_rgba(0,0,0,0.12)] px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="flex items-start gap-3 w-full">
        <span className="pt-0.5 shrink-0 flex items-center justify-center">
          <Icon size={20} strokeWidth={2.2} className={style.iconText} aria-hidden />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 w-full">
            <span className="text-[15px] font-bold text-neutral-900 dark:text-[var(--foreground)] truncate">
              {title}
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Dismiss notification"
                className="cursor-pointer shrink-0 text-black/35 dark:text-white/40 hover:text-black/75 dark:hover:text-white/80 transition-colors"
              >
                <X size={17} aria-hidden />
              </button>
            )}
          </div>
          {message && (
            <p className="text-[13px] text-neutral-600 dark:text-[var(--muted-foreground)] mt-0.5 line-clamp-2">
              {message}
            </p>
          )}
          {productName && (
            <p className="text-[13px] text-neutral-500 dark:text-[var(--muted-foreground)] mt-1 truncate">
              {productName}
            </p>
          )}
          {price && (
            <p className="text-sm font-bold text-neutral-900 dark:text-[var(--foreground)] mt-1">
              {price}
            </p>
          )}
          {footnote && (
            <p className="text-[11px] text-neutral-400 dark:text-[var(--muted-foreground)] opacity-80 mt-1">
              {footnote}
            </p>
          )}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2.5 pt-3">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={`text-xs font-bold px-4 py-1.5 rounded-full border uppercase tracking-wide cursor-pointer transition-all duration-200 ${style.btn}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Clean minimal confirmation toast (no left circle icon disc or wave backdrop).
 */
export function OrderSuccessToast({
  title,
  sub,
  actions,
  onClose,
}: {
  title: string
  sub?: string
  actions?: { label: string; onClick: () => void }[]
  onClose?: () => void
}) {
  return (
    <div className="w-[330px] max-w-full rounded-xl border border-black/10 dark:border-white/10 border-l-4 border-l-emerald-600 px-3.5 py-3 bg-white dark:bg-[var(--card)] shadow-[0_6px_20px_rgba(0,0,0,0.08)] flex items-start gap-2.5">
      <Check size={17} strokeWidth={2.4} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden />
      <div className="flex flex-col justify-center items-start grow min-w-0">
        <p className="m-0 text-neutral-900 dark:text-[var(--foreground)] text-sm font-bold truncate w-full">{title}</p>
        {sub && <p className="m-0 mt-0.5 text-xs text-neutral-500 dark:text-[var(--muted-foreground)] truncate w-full">{sub}</p>}
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-600/35 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="cursor-pointer shrink-0 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors"
        >
          <X size={15} aria-hidden />
        </button>
      )}
    </div>
  )
}
