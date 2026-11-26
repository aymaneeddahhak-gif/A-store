"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { useSellerNav } from "@/contexts/providers/seller-nav-context"

const SELLER_SLIDES = [
  { id: "Dashboard", label: "Overview", src: "/images/seller/dashboard.png" },
  { id: "Products", label: "Products", src: "/images/seller/products.png" },
  { id: "EditProduct", label: "Edit Product", src: "/images/seller/edit-product.png" },
  { id: "Offers", label: "Offers", src: "/images/seller/offers.png" },
  { id: "Orders", label: "Orders", src: "/images/seller/orders.png" },
] as const

export function SellerRestrictedGate({
  isSignedInNonSeller = false,
}: {
  isSignedInNonSeller?: boolean
}) {
  const { sellerTab, setSellerTab } = useSellerNav()
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const matched = SELLER_SLIDES.findIndex(
      (s) =>
        s.id.toLowerCase() === sellerTab.toLowerCase() ||
        s.label.toLowerCase() === sellerTab.toLowerCase()
    )
    if (matched >= 0) {
      setActiveIndex(matched)
    }
  }, [sellerTab])

  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SELLER_SLIDES.length)
    }, 3500)
    return () => window.clearInterval(timer)
  }, [paused])

  const goTo = (index: number) => {
    const next = (index + SELLER_SLIDES.length) % SELLER_SLIDES.length
    setActiveIndex(next)
    setSellerTab(SELLER_SLIDES[next].id)
  }

  return (
    <section
      aria-label="Seller Dashboard preview"
      className="w-full max-w-[800px] mx-auto flex flex-col items-center gap-4 pb-10"
    >
      {/* Only the Sign-In heading and button guiding to Login */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--foreground)] text-center sm:text-left">
          {isSignedInNonSeller
            ? "Sign in as a Seller to access the Seller Dashboard"
            : "Sign in required to access the Seller Dashboard"}
        </h1>

        <Link
          href={isSignedInNonSeller ? "/login?next=/seller&switch=1" : "/login?next=/seller"}
          prefetch
          className="px-6 py-2.5 rounded-xl bg-[#151717] text-white dark:bg-white dark:text-[#151717] text-xs sm:text-sm font-bold tracking-wide hover:opacity-90 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 shrink-0"
        >
          <span>{isSignedInNonSeller ? "Sign In as Seller" : "Sign In"}</span>
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>

      {/* Left / Right buttons on top between the sign-in text and the screenshot */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          aria-label="Previous Seller Dashboard screenshot"
          className="w-10 h-10 rounded-full bg-white/95 dark:bg-[#15181e]/95 border border-gray-200/80 dark:border-white/10 shadow-sm flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--glass-bg)] transition-colors cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          aria-label="Next Seller Dashboard screenshot"
          className="w-10 h-10 rounded-full bg-white/95 dark:bg-[#15181e]/95 border border-gray-200/80 dark:border-white/10 shadow-sm flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--glass-bg)] transition-colors cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Option 1: Gallery Mat Card holding the auto-sliding Admin Seller screenshots */}
      <div
        className="w-full rounded-[26px] bg-white dark:bg-[#171a21] border-2 border-[#b9b2a8] dark:border-white/30 p-3 sm:p-4 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_22px_54px_-12px_rgba(0,0,0,0.55)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative w-full rounded-[18px] overflow-hidden border border-[#cbc4ba] dark:border-white/25 bg-[#f4f5f7] dark:bg-[#111318]">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {SELLER_SLIDES.map((slide, index) => (
              <div key={slide.id} className="w-full min-w-full shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.src}
                  alt={`Seller Dashboard ${slide.label}`}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="w-full h-auto block select-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
