"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useQuickView } from "@/contexts/providers/quick-view-context"
import { useCart } from "@/contexts/providers/cart-context"
import { useLikes } from "@/contexts/providers/likes-context"
import { X, ShoppingBag, Heart, ArrowRight } from "lucide-react"

export function QuickViewModal() {
  const { quickViewProduct, closeQuickView } = useQuickView()
  const { addToCart } = useCart()
  const { isLiked: isProductLiked, toggleLike } = useLikes()
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!quickViewProduct) return
    const previouslyFocused = document.activeElement as HTMLElement | null

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeQuickView()
        return
      }
      if (e.key !== "Tab") return
      // Keep focus inside the dialog while it is open.
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKey)
    closeRef.current?.focus()
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
      previouslyFocused?.focus?.()
    }
  }, [quickViewProduct, closeQuickView])

  if (!quickViewProduct) return null

  const liked = isProductLiked(quickViewProduct.id)
  const description =
    quickViewProduct.description ||
    "Premium quality with fast shipping and hassle-free returns."

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={closeQuickView}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
    >
      <div
        ref={panelRef}
        className="w-full sm:w-[90%] max-w-4xl max-h-[92vh] sm:max-h-[85vh] bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col sm:flex-row shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={closeQuickView}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[var(--glass-bg)] text-[var(--foreground)] hover:bg-[var(--glass-highlight)] transition-colors"
          aria-label="Close quick view"
        >
          <X size={20} />
        </button>

        <div className="relative w-full sm:w-1/2 h-[40vh] sm:h-auto sm:min-h-[400px] bg-gradient-to-br from-[var(--glass-bg)] to-transparent shrink-0">
          <Image
            src={quickViewProduct.image}
            alt={quickViewProduct.name}
            fill
            className="object-contain p-8"
            sizes="(max-width: 640px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="w-full sm:w-1/2 p-6 sm:p-8 flex flex-col justify-center gap-5 overflow-y-auto">
          <div className="space-y-2">
            <span className="text-[var(--muted-foreground)] uppercase tracking-widest text-xs font-semibold">
              {quickViewProduct.category}
            </span>
            <h2 id="quick-view-title" className="font-display text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
              {quickViewProduct.name}
            </h2>
            <p className="text-xl font-bold text-[var(--accent)]">${quickViewProduct.price.toFixed(2)}</p>
          </div>

          <p className="text-[var(--muted-foreground)] leading-relaxed text-sm sm:text-base">{description}</p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              type="button"
              onClick={() => {
                addToCart(quickViewProduct)
                closeQuickView()
              }}
              className="flex-1 py-3.5 bg-[var(--hero-btn-bg)] text-[var(--hero-btn-text)] font-bold rounded-xl hover:bg-[var(--hero-btn-hover)] transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag size={18} />
              Add to cart
            </button>
            <Link
              href={`/product/${quickViewProduct.id}`}
              prefetch
              onClick={closeQuickView}
              className="px-5 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--glass-highlight)] transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              View More
              <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              onClick={() => toggleLike(quickViewProduct)}
              className={`px-4 py-3.5 rounded-xl border transition-all ${
                liked
                  ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-muted)]"
                  : "border-[var(--border-color)] text-[var(--foreground)] hover:border-[var(--accent)]"
              }`}
              aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={liked}
            >
              <Heart size={20} fill={liked ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
