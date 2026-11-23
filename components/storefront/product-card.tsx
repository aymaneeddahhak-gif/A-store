"use client"

import React, { useState } from "react"
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

export const ProductCard: React.FC<ProductCardProps> = ({
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
  const heartPosClass = isPremium
    ? discountPercent > 0
      ? "top-4 right-[6.25rem] sm:right-[7.25rem]"
      : "top-4 right-4"
    : "top-4 left-4"

  const openProduct = () => onOpenProduct?.(product.id)
  const handleAddToCart = () => {
    setIsAdded(true)
    onAddToCart?.(product.id)
    window.setTimeout(() => setIsAdded(false), 1800)
  }

  return (
    <article className="group relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl overflow-visible border border-neutral-200 shadow-sm hover:shadow-xl transition-all duration-300 font-sans dark:bg-[var(--card)] dark:border-[var(--border-color)]">
      {isPremium && <span aria-hidden className="premium-corner-ribbon" />}

      {/* 1. Image Area with Floating Badges — Classic Square Aspect Ratio */}
      <div className="relative w-full aspect-square bg-[#FAF7F2] rounded-t-3xl overflow-hidden dark:bg-white/5">
        <Link
          href={productHref}
          prefetch={true}
          className={`relative block w-full h-full flex items-center justify-center ${
            onOpenProduct ? "cursor-pointer" : ""
          }`}
          onClick={openProduct}
          onPointerEnter={(e) => {
            if (e.pointerType !== "mouse") return
            setHovered(true)
            router.prefetch(productHref)
          }}
          onPointerLeave={() => setHovered(false)}
        >
          <div className="w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out">
            <CardMedia
              image={product.imageUrl}
              video={product.video ?? null}
              alt={product.title}
              active={hovered}
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

          {/* Circular Discount Badge (#F05423) */}
          {discountPercent > 0 && (
            <div
              className="absolute top-4 right-4 z-10 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#F05423] text-white text-center select-none"
              style={{ boxShadow: "0 6px 18px rgba(240, 84, 35, 0.4)" }}
            >
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider leading-none mb-0.5">
                UP TO
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-none my-0.5">
                {discountPercent}%
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider leading-none mt-0.5">
                OFF
              </span>
            </div>
          )}

          {/* Bottom Tag Overlay */}
          <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
            {soldOut ? (
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-neutral-900 text-white rounded-md shadow-xs">
                SOLD OUT
              </span>
            ) : discountPercent > 0 ? (
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-neutral-900/85 text-white rounded-md backdrop-blur-sm shadow-xs">
                LIMITED TIME
              </span>
            ) : (
              <span />
            )}
            {product.freeShipping && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white rounded-md backdrop-blur-sm shadow-xs">
                <Truck className="w-3 h-3" />
                FREE SHIPPING
              </span>
            )}
          </div>
        </Link>

        {/* Wishlist Heart Button — sibling outside <Link> for valid HTML & a11y */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleWishlist?.(product.id)
          }}
          aria-label={liked ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
          aria-pressed={liked}
          className={`absolute ${heartPosClass} z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-neutral-600 hover:text-red-500 hover:bg-white transition-colors cursor-pointer`}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              liked ? "fill-red-500 text-red-500" : "text-neutral-600"
            }`}
          />
        </button>
      </div>

      {/* 2. Product Details */}
      <div className="p-5 sm:p-6 bg-white rounded-b-3xl flex flex-col justify-between space-y-3.5 dark:bg-[var(--card)]">
        <div>
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1 font-medium dark:text-[var(--muted-foreground)]">
            <span className="uppercase tracking-wider font-semibold">{categoryLabel}</span>
            <span className="text-amber-500 font-semibold flex items-center gap-1">
              ★ {displayRating} ({reviewsCount})
            </span>
          </div>

          <h3
            className={`text-lg sm:text-xl font-bold text-neutral-900 tracking-tight mb-1 dark:text-[var(--foreground)] ${
              onOpenProduct ? "cursor-pointer" : ""
            }`}
            onClick={openProduct}
          >
            {product.title}
          </h3>

          <p className="text-xs sm:text-sm text-neutral-500 line-clamp-2 leading-relaxed mb-3 dark:text-[var(--muted-foreground)]">
            {product.subtitle}
          </p>
        </div>

        {/* 3. Pricing & Cart Action Row */}
        <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-x-2 gap-y-3 dark:border-white/10">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#F05423] tracking-tight">
                ${formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm sm:text-base font-medium text-neutral-400 line-through">
                  ${formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {discountPercent > 0 && (
              <p className="text-[11px] text-neutral-400 font-medium dark:text-[var(--muted-foreground)]">
                Includes {discountPercent}% discount
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={soldOut}
              aria-label={soldOut ? `${product.title} is sold out` : `Add ${product.title} to cart`}
              className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer dark:bg-white/5 dark:border-white/10 dark:text-[var(--foreground)] dark:hover:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${
                isAdded
                  ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                  : "border-neutral-200 hover:border-neutral-900 text-neutral-700 hover:text-neutral-900 bg-neutral-50 active:scale-95"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
            </button>

            {soldOut ? (
              <button
                type="button"
                disabled
                className="px-4 py-2.5 rounded-xl bg-neutral-200 text-neutral-500 text-xs sm:text-sm font-bold tracking-wide whitespace-nowrap transition-all cursor-not-allowed dark:bg-white/10 dark:text-[var(--muted-foreground)]"
              >
                <span>SOLD OUT</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openProduct}
                aria-label={`Shop ${product.title} now`}
                className="group/shop relative w-[100px] h-[35px] bg-[#222] dark:bg-white dark:text-black rounded-[0.45em] text-center cursor-pointer overflow-hidden transition-colors"
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
      </div>
    </article>
  )
}
