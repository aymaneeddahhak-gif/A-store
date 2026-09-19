"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { X } from "lucide-react"

interface DealsPopupProps {
  open: boolean
  percent: number
  title: string
  subtitle: string
  buttonLabel: string
  onClose: () => void
  onShopNow: () => void
}

/**
 * Entry discount popup — shows on every home visit. The percentage is the
 * live max catalog discount; heading copy comes from the admin config.
 */
export function DealsPopup({
  open,
  percent,
  title,
  subtitle,
  buttonLabel,
  onClose,
  onShopNow,
}: DealsPopupProps) {
  // Skip the entrance flash: for the first paint the card mounts with the
  // final layout but without the transient entrance styles, so it never
  // shows a different shape/height before settling into place.
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    if (!open || entered) return
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [open, entered])

  // Escape closes the popup — keyboard users had no way out.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} ${percent} percent off`}
      onClick={onClose}
    >
      <div
        className={`overflow-y-auto overflow-x-hidden relative w-full max-w-[min(28rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] rounded-2xl bg-gray-50 text-sky-400 flex flex-col justify-end items-center gap-2 py-5 px-4 shadow-2xl ${
          entered ? "animate-in zoom-in-95 fade-in duration-200" : "opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Watermark bag */}
        <svg
          className="absolute opacity-30 -rotate-12 -bottom-16 -right-16 w-56 h-56 stroke-current pointer-events-none"
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
          onClick={onClose}
          aria-label="Close discount popup"
          className="absolute top-2 right-2 z-20 p-2 bg-white/85 hover:bg-white text-sky-500 hover:text-sky-700 rounded-full shadow-md transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <p className="text-2xl font-extrabold text-sky-500">{title}</p>
          <p className="relative text-sm inline-block text-sky-400 after:absolute after:content-[''] after:ml-2 after:top-1/2 after:bg-sky-200 after:w-12 after:h-0.5 before:absolute before:content-[''] before:-ml-14 before:top-1/2 before:bg-sky-200 before:w-12 before:h-0.5">
            {subtitle}
          </p>
        </div>
        <span className="font-extrabold text-6xl sm:text-8xl leading-none -skew-x-12 -skew-y-12 -mt-1 mb-1 text-sky-400">
          {percent}%
        </span>
        <Image
          src="/images/discount/discount.jpeg"
          alt="Discount mascot"
          width={480}
          height={480}
          /* Mascot fills the card width (capped at 440px) but sits in a
             fixed-height box, so a bigger photo no longer makes the card
             taller — and fluid width means it never overflows on phones. */
          className="h-[200px] w-full max-w-[440px] object-cover object-top rounded-xl -my-2 sm:h-[280px]"
          priority
        />
        <button
          type="button"
          onClick={onShopNow}
          className="z-10 px-6 py-3 bg-sky-400 text-gray-50 hover:bg-sky-300 active:scale-95 transition-all cursor-pointer font-bold text-base rounded-lg"
        >
          {buttonLabel}
        </button>
        <p className="text-sm mb-1 font-bold tracking-widest text-sky-400">BIG SAVINGS</p>
      </div>
    </div>
  )
}
