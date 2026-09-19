"use client"

import {
  ShoppingCart,
  ShoppingBag,
  Truck,
  Star,
  Tag,
  Bell,
  CheckCircle2,
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
  check: CheckCircle2,
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
    <div className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-[#f9f9f9] dark:bg-[var(--card)] shadow-[0_1px_4px_rgba(0,0,0,0.1),0_2px_3px_rgba(0,0,0,0.1)] px-2.5 py-2">
      <div className="inline-flex flex-nowrap items-center w-full">
        <div className="w-[20%] shrink-0">
          <div
            className={`w-12 h-12 rounded-full text-center mx-auto flex items-center justify-center ${style.softBg}`}
          >
            <Icon size={20} className={style.iconText} aria-hidden />
          </div>
        </div>

        <div className="w-[80%] min-w-0">
          <div className="inline-flex flex-nowrap items-baseline w-full">
            <span className="w-[95%] text-[1em] font-semibold text-neutral-800 dark:text-[var(--foreground)] pl-2.5 pt-3 truncate">
              {title}
            </span>
            {onClose && (
              <span className="w-[5%] text-right pr-7">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Dismiss notification"
                  className="cursor-pointer text-black/20 dark:text-white/30 hover:text-black/60 dark:hover:text-white/80 transition-colors"
                >
                  <X size={15} aria-hidden />
                </button>
              </span>
            )}
          </div>
          {message && (
            <p className="text-xs text-neutral-500 dark:text-[var(--muted-foreground)] pl-2.5 mt-0.5 line-clamp-2">
              {message}
            </p>
          )}
          {productName && (
            <p className="text-[0.8em] text-neutral-500 dark:text-[var(--muted-foreground)] pl-2.5 mt-2 truncate">
              {productName}
            </p>
          )}
          {price && (
            <p className="text-[0.9em] font-semibold text-neutral-800 dark:text-[var(--foreground)] pl-2.5">
              {price}
            </p>
          )}
          {footnote && (
            <p className="text-[10px] text-neutral-400 dark:text-[var(--muted-foreground)] opacity-70 pl-2.5 mt-1">
              {footnote}
            </p>
          )}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2.5 pb-1.5 pt-1">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={`text-[0.7em] font-semibold px-2.5 py-1 rounded-[15px] border uppercase cursor-pointer transition-all duration-200 ${style.btn}`}
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

const SUCCESS_WAVE_PATH =
  "M0,256L11.4,240C22.9,224,46,192,69,192C91.4,192,114,224,137,234.7C160,245,183,235,206,213.3C228.6,192,251,160,274,149.3C297.1,139,320,149,343,181.3C365.7,213,389,267,411,282.7C434.3,299,457,277,480,250.7C502.9,224,526,192,549,181.3C571.4,171,594,181,617,208C640,235,663,277,686,256C708.6,235,731,149,754,122.7C777.1,96,800,128,823,165.3C845.7,203,869,245,891,224C914.3,203,937,117,960,112C982.9,107,1006,181,1029,197.3C1051.4,213,1074,171,1097,144C1120,117,1143,107,1166,133.3C1188.6,160,1211,224,1234,218.7C1257.1,213,1280,139,1303,133.3C1325.7,128,1349,192,1371,192C1394.3,192,1417,128,1429,96L1440,64L1440,320L1428.6,320C1417.1,320,1394,320,1371,320C1348.6,320,1326,320,1303,320C1280,320,1257,320,1234,320C1211.4,320,1189,320,1166,320C1142.9,320,1120,320,1097,320C1074.3,320,1051,320,1029,320C1005.7,320,983,320,960,320C937.1,320,914,320,891,320C868.6,320,846,320,823,320C800,320,777,320,754,320C731.4,320,709,320,686,320C662.9,320,640,320,617,320C594.3,320,571,320,549,320C525.7,320,503,320,480,320C457.1,320,434,320,411,320C388.6,320,366,320,343,320C320,320,297,320,274,320C251.4,320,229,320,206,320C182.9,320,160,320,137,320C114.3,320,91,320,69,320C45.7,320,23,320,11,320L0,320Z"

/**
 * Uiverse success card (akshat-patel28), used verbatim for the order-placed
 * toast: wave backdrop, green check disc, bold title + sub line, dismiss X.
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
    <div className="w-[330px] max-w-full min-h-[80px] rounded-lg box-border px-[15px] py-[10px] bg-white shadow-[rgba(149,157,165,0.2)_0px_8px_24px] relative overflow-hidden flex items-center justify-around gap-[15px]">
      <svg
        className="absolute rotate-90 left-[-31px] top-[32px] w-[80px] fill-[#04e4003a]"
        viewBox="0 0 1440 320"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path d={SUCCESS_WAVE_PATH} fillOpacity="1" />
      </svg>

      <div className="w-[35px] h-[35px] flex justify-center items-center bg-[#04e40048] rounded-full ml-2 shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          strokeWidth="0"
          fill="currentColor"
          stroke="currentColor"
          className="w-[17px] h-[17px] text-[#269b24]"
          aria-hidden
        >
          <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z" />
        </svg>
      </div>
      <div className="flex flex-col justify-center items-start grow min-w-0">
        <p className="m-0 cursor-default text-[#269b24] text-[17px] font-bold truncate w-full">{title}</p>
        {sub && <p className="m-0 cursor-default text-[14px] text-[#555] truncate w-full">{sub}</p>}
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#269b24]/40 text-[#269b24] bg-[#04e40048] hover:bg-[#269b24] hover:text-white transition-colors cursor-pointer"
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
          className="cursor-pointer shrink-0 text-[#555] hover:text-black transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 15 15"
            strokeWidth="0"
            fill="none"
            stroke="currentColor"
            className="w-[18px] h-[18px]"
            aria-hidden
          >
            <path
              fill="currentColor"
              d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
              clipRule="evenodd"
              fillRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
