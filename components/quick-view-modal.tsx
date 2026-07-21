"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { useShop } from "@/contexts/shop-context"
import { X, ShoppingBag, Heart } from "lucide-react"

export function QuickViewModal() {
  const { quickViewProduct, closeQuickView, addToCart, toggleLike, likedProducts } = useShop()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!quickViewProduct) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeQuickView()
    }
    document.addEventListener("keydown", onKey)
    closeRef.current?.focus()
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [quickViewProduct, closeQuickView])

  if (!quickViewProduct) return null

  const isLiked = likedProducts.includes(quickViewProduct.id)
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

          <div className="flex gap-3 mt-2">
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
            <button
              type="button"
              onClick={() => toggleLike(quickViewProduct.id)}
              className={`px-4 py-3.5 rounded-xl border transition-all ${
                isLiked
                  ? "border-rose-500/40 text-rose-500 bg-rose-500/10"
                  : "border-[var(--border-color)] text-[var(--foreground)] hover:border-[var(--accent)]"
              }`}
              aria-label={isLiked ? "Unlike product" : "Like product"}
            >
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
