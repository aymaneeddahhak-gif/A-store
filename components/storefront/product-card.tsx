"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, Truck, ShoppingCart } from "lucide-react"
import { CardMedia } from "@/components/product/card-media"
import { formatPrice } from "@/components/storefront/product-adapter"
import { useCatalog } from "@/contexts/providers/catalog-context"
import type { EcommerceProduct } from "@/lib/storefront/types"

interface ProductCardProps {
  product: EcommerceProduct
  priority?: boolean
  onToggleWishlist?: (id: string) => void
  onOpenProduct?: (id: string) => void
  onAddToCart?: (id: string) => void
}

function NotchFillet({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      className={`w-5 h-5 text-[#eff4f4] dark:text-[var(--card)] pointer-events-none ${className}`}
    >
      <path d="M20 0 H0 A20 20 0 0 1 20 20 Z" fill="currentColor" />
    </svg>
  )
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  priority = false,
  onToggleWishlist,
  onOpenProduct,
  onAddToCart,
}) => {
  const router = useRouter()
  const { categories } = useCatalog()
  // Hover-to-play: the card shows its still image until a mouse hovers it, so
  // a full grid of cards costs zero video requests on load. Hovering also
  // prefetches the detail route so clicking through feels instant.
  const [hovered, setHovered] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const productHref = `/product/${product.id}`

  // Merchant-controlled only: discount comes from the adapter's
  // original_price derivation. No recompute here — without a stored offer
  // there is no badge, period.
  const discountPercent = product.discountPercent ?? 0
  const categoryLabel =
    categories.find((c) => c.id === product.category)?.label ?? product.category
  const displayRating = product.rating ?? 4.9
  const reviewsCount = product.reviewsCount ?? 0
  const liked = product.isLiked ?? false
  const soldOut = (product.stock ?? 1) <= 0
  const isPremium = Boolean(product.isPremium)

  const footerChips = useMemo(() => {
    const raw = [
      categoryLabel,
      `${displayRating} (${reviewsCount})`,
      product.specs[0]?.value,
      product.specs[1]?.value,
    ].filter((v): v is string => Boolean(v && v.trim()))
    return Array.from(new Set(raw)).slice(0, 4)
  }, [categoryLabel, displayRating, reviewsCount, product.specs])

  const openProduct = () => onOpenProduct?.(product.id)
  const handleAddToCart = () => {
    setIsAdded(true)
    onAddToCart?.(product.id)
    window.setTimeout(() => setIsAdded(false), 1800)
  }

  return (
    <article className="card-perf-contain group relative w-full max-w-sm sm:max-w-md bg-[#eff4f4] dark:bg-[var(--card)] rounded-[30px] p-2.5 sm:p-3 overflow-visible border border-[#e0e9e9] dark:border-[var(--border-color)] shadow-[0_6px_24px_-8px_rgba(31,45,45,0.08)] hover:shadow-[0_14px_34px_-10px_rgba(31,45,45,0.16)] transition-shadow duration-300 font-sans flex flex-col">
      {isPremium && <span aria-hidden className="premium-corner-ribbon" />}

      {/* 1. Framed Media Stage: Top-Left Offer, Top-Right Concave Price Notch, Bottom Status Strip */}
      <div className="relative w-full aspect-[4/3] bg-[#f8fbfb] dark:bg-white/5 rounded-[22px] overflow-hidden">
        <Link
          href={productHref}
          prefetch={false}
          className="relative block w-full h-full flex items-center justify-center cursor-pointer"
          onPointerEnter={(e) => {
            if (e.pointerType !== "mouse") return
            setHovered(true)
            router.prefetch(productHref)
          }}
          onFocus={() => router.prefetch(productHref)}
          onPointerLeave={() => setHovered(false)}
        >
          <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out">
            <CardMedia
              image={product.imageUrl}
              video={product.video ?? null}
              alt={product.title}
              active={hovered}
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

          {/* Top-Left Offer Discount Badge (#F05423) */}
          {discountPercent > 0 && (
            <div
              className={`absolute top-3 ${
                isPremium ? "left-[92px]" : "left-3"
              } z-10 flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#F05423] text-white text-center select-none`}
              style={{ boxShadow: "0 6px 18px rgba(240, 84, 35, 0.4)" }}
            >
              <span className="text-[8px] font-semibold uppercase tracking-wider leading-none mb-0.5">
                UP TO
              </span>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight leading-none my-0.5">
                {discountPercent}%
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wider leading-none mt-0.5">
                OFF
              </span>
            </div>
          )}

          {/* Bottom Integrated Delivery / Offer Banner */}
          <div
            className={`absolute inset-x-0 bottom-0 z-10 px-3 py-1.5 text-center text-[11px] font-semibold tracking-wide flex items-center justify-center gap-1.5 pointer-events-none ${
              soldOut
                ? "bg-neutral-900/95 text-white"
                : product.freeShipping
                  ? "bg-[#567a59]/95 dark:bg-emerald-600/95 text-white"
                  : discountPercent > 0
                    ? "bg-neutral-900/90 text-white"
                    : "bg-neutral-900/85 text-white"
            }`}
          >
            {soldOut ? (
              <span>Sold Out</span>
            ) : product.freeShipping ? (
              <>
                <Truck className="w-3.5 h-3.5 shrink-0" />
                <span>{discountPercent > 0 ? "Free Shipping · Limited Time" : "Free Shipping"}</span>
              </>
            ) : discountPercent > 0 ? (
              <span>Limited Time · Save {discountPercent}%</span>
            ) : (
              <span>Fast Shipping</span>
            )}
          </div>
        </Link>

        {/* Top-Right Price in Concave Frame Cutout Notch */}
        <div className="absolute top-0 right-0 z-20 bg-[#eff4f4] dark:bg-[var(--card)] rounded-bl-[20px] pl-3.5 pr-2.5 pt-1 pb-2 flex items-baseline gap-1.5 pointer-events-none">
          <NotchFillet className="absolute -left-5 top-0" />
          <NotchFillet className="absolute right-0 -bottom-5" />
          <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[#162020] dark:text-[var(--foreground)]">
            ${formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-[11px] font-semibold text-[#5f7070] dark:text-neutral-400 line-through">
              ${formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Wishlist Heart Button — sibling outside <Link> */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleWishlist?.(product.id)
          }}
          aria-label={liked ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
          aria-pressed={liked}
          className="absolute bottom-10 right-2.5 z-20 w-8 h-8 rounded-full bg-white/95 dark:bg-neutral-900/95 shadow-sm flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-red-500 hover:bg-white transition-colors cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              liked ? "fill-red-500 text-red-500" : ""
            }`}
          />
        </button>
      </div>

      {/* 2. Footer: Title + Action Buttons Row, followed by Compact Pill Chips */}
      <div className="px-1.5 pt-3 pb-1 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <h3
              className={`text-base sm:text-lg font-bold text-[#162020] dark:text-[var(--foreground)] tracking-tight leading-snug line-clamp-1 ${
                onOpenProduct ? "cursor-pointer" : ""
              }`}
              onClick={openProduct}
            >
              {product.title}
            </h3>
            <p className="text-xs text-[#4d5e5e] dark:text-[var(--muted-foreground)] line-clamp-1 mt-0.5">
              {product.subtitle}
            </p>
          </div>

          {/* Exact Existing Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={soldOut}
              aria-label={soldOut ? `${product.title} is sold out` : `Add ${product.title} to cart`}
              className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer dark:bg-white/5 dark:border-white/10 dark:text-[var(--foreground)] dark:hover:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${
                isAdded
                  ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                  : "border-[#d4e0e0] hover:border-[#162020] text-[#162020] bg-white/85 hover:bg-white active:scale-95"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
            </button>

            {soldOut ? (
              <button
                type="button"
                disabled
                className="px-3.5 py-2 rounded-xl bg-neutral-200 text-neutral-500 text-xs font-bold tracking-wide whitespace-nowrap transition-all cursor-not-allowed dark:bg-white/10 dark:text-[var(--muted-foreground)]"
              >
                <span>SOLD OUT</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openProduct}
                aria-label={`Shop ${product.title} now`}
                className="group/shop relative w-[96px] h-[34px] bg-[#222] dark:bg-white dark:text-black rounded-[0.45em] text-center cursor-pointer overflow-hidden transition-colors"
              >
                <span className="absolute inset-0 overflow-hidden rounded-[0.45em]">
                  <span className="absolute left-0 w-full h-full top-0 flex items-center justify-center text-[11px] font-bold tracking-wide text-white dark:text-black transition-[top] duration-500 group-hover/shop:top-[-100%]">
                    SHOP NOW
                  </span>
                  <span className="absolute left-0 w-full h-full top-full flex items-center justify-center text-white dark:text-black transition-[top] duration-500 group-hover/shop:top-0">
                    <ShoppingCart className="w-4 h-4" />
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Spec / Metadata Pills */}
        {footerChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {footerChips.map((chip) => (
              <span
                key={chip}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/80 text-[#3c4d4d] dark:bg-white/10 dark:text-neutral-300"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
})
ProductCard.displayName = "ProductCard"
