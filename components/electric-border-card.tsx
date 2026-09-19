"use client"
import { useCallback, useRef, useState } from "react"
import { Heart, ShoppingBag } from "lucide-react"
import Link from "next/link"
import type { Product } from "@/lib/types"
import { useCart } from "@/contexts/providers/cart-context"
import { useLikes } from "@/contexts/providers/likes-context"
import { useQuickView } from "@/contexts/providers/quick-view-context"
import Image from "next/image"
import { CardMedia } from "@/components/product/card-media"
import { getProductVideo } from "@/lib/product-media"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

interface ElectricBorderCardProps {
  image?: string;
  className?: string;
  product?: Product;
}

export default function ElectricBorderCard({ image, className, product }: ElectricBorderCardProps) {
  const { addToCart } = useCart()
  const { isLiked, toggleLike } = useLikes()
  const { openQuickView } = useQuickView()
  const liked = product ? isLiked(product.id) : false
  const cardRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  // Drives the video crossfade. Mouse only — a touch tap should open the
  // product, not start a clip the finger is covering.
  const [hovered, setHovered] = useState(false)

  // Cursor-following 3D tilt. Writes CSS vars only (compositor-only transform,
  // no layout) — the .card-tilt class in globals.css consumes them.
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || e.pointerType !== "mouse" || !cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      cardRef.current.style.setProperty("--tilt-x", `${(-py * 7).toFixed(2)}deg`)
      cardRef.current.style.setProperty("--tilt-y", `${(px * 7).toFixed(2)}deg`)
    },
    [reducedMotion]
  )

  const resetTilt = useCallback(() => {
    const el = cardRef.current
    if (!el) return
    el.style.setProperty("--tilt-x", "0deg")
    el.style.setProperty("--tilt-y", "0deg")
  }, [])

  const handlePointerEnter = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") setHovered(true)
  }, [])

  const handlePointerLeave = useCallback(() => {
    setHovered(false)
    resetTilt()
  }, [resetTilt])

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (product) toggleLike(product)
  }, [product, toggleLike])

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (product) addToCart(product)
  }, [product, addToCart])

  const handleCardClick = useCallback(() => {
    if (product) openQuickView(product)
  }, [product, openQuickView])

  const displayImage = product?.image || image

  return (
    <div
      ref={cardRef}
      className={`card-tilt card-lift relative h-full rounded-[24px] overflow-hidden group/card cursor-pointer bg-[var(--card)] border border-[var(--border-color)] hover:shadow-[0_28px_60px_-12px_rgba(0,0,0,0.28)] dark:hover:shadow-[0_28px_60px_-12px_rgba(0,0,0,0.7)] flex flex-col p-[1px] ${className || ""}`}
      onClick={handleCardClick}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* ── SPINNABLE ELECTRIC BORDER LASER ON HOVER ── */}
      <div className="absolute inset-[-200%] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_35%,var(--electric-light-color)_50%,transparent_65%,transparent_100%)] opacity-0 group-hover/card:opacity-100 group-hover/card:animate-[spin_4s_linear_infinite] transition-opacity duration-500 pointer-events-none z-0" />

      {/* ── CARD INNER LAYOUT ── */}
      <div className="relative z-10 w-full h-full min-h-0 rounded-[23px] overflow-hidden bg-[var(--card)] flex flex-col flex-1">
        
        {/* ── PRODUCT SHOWCASE IMAGE AREA ── */}
        <div className="relative w-full aspect-[4/3] overflow-hidden flex items-center justify-center select-none group-hover/card:bg-black/5 transition-colors duration-500">
          
          {/* Subtle Cyber Grid backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40 dark:opacity-30" />
          
          {/* Soft glowing radial backdrop light (Pulsing color glow) */}
          <div className="absolute w-[120px] h-[120px] rounded-full bg-amber-500/10 dark:bg-amber-500/15 blur-xl opacity-0 group-hover/card:opacity-100 group-hover/card:scale-150 transition-all duration-700 pointer-events-none z-0" />
          
          {/* Futuristic holographic target lines (corners) to look like a high-tech scanner */}
          <div className="absolute inset-4 border border-white/5 rounded-2xl pointer-events-none group-hover/card:border-[var(--electric-light-color)]/20 transition-colors duration-500 z-0">
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-white/20 group-hover/card:border-[var(--electric-light-color)]/50 transition-colors duration-500" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-white/20 group-hover/card:border-[var(--electric-light-color)]/50 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-white/20 group-hover/card:border-[var(--electric-light-color)]/50 transition-colors duration-500" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-white/20 group-hover/card:border-[var(--electric-light-color)]/50 transition-colors duration-500" />
          </div>

          {/* Premium Glassmorphic Pedestal Platform underneath the floating product */}
          <div className="absolute bottom-4 w-32 h-1 bg-white/10 dark:bg-white/25 rounded-full blur-[1px] opacity-25 group-hover/card:w-24 group-hover/card:opacity-50 group-hover/card:shadow-[0_0_15px_rgba(255,255,255,0.25)] transition-all duration-500 z-0" />
          <div className="absolute bottom-4 w-16 h-0.5 bg-[var(--electric-light-color)] rounded-full blur-[1px] opacity-0 group-hover/card:opacity-60 group-hover/card:shadow-[0_0_10px_var(--electric-light-color)] transition-all duration-500 z-0" />

          {displayImage ? (
            <div className="absolute inset-0 z-10 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover/card:scale-105">
              {product ? (
                <CardMedia
                  image={product.image}
                  video={getProductVideo(product)}
                  alt={product.name}
                  active={hovered}
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, (max-width: 1280px) 32vw, 28vw"
                />
              ) : (
                <Image
                  src={displayImage}
                  alt="Product"
                  fill
                  className="object-contain object-center p-2 drop-shadow-[0_12px_28px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_16px_36px_rgba(0,0,0,0.45)] transition-all duration-500"
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, (max-width: 1280px) 32vw, 28vw"
                  loading="lazy"
                />
              )}
            </div>
          ) : (
            /* Fallback placeholder when no image is loaded */
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-[var(--muted-foreground)]">
              <ShoppingBag size={40} className="opacity-10" />
              <span className="text-[10px] font-mono tracking-widest uppercase opacity-35">No image</span>
            </div>
          )}

          {/* ── CATEGORY BADGE ── */}
          {product && (
            <div className="absolute top-3 left-3 z-20">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/10 dark:bg-white/5 text-[var(--muted-foreground)] border border-[var(--border-color)] backdrop-blur-md select-none">
                {product.category}
              </span>
            </div>
          )}

          {/* ── LIKE BUTTON ── */}
          <button
            type="button"
            onClick={handleLike}
            aria-label={liked ? `Remove ${product?.name ?? "product"} from wishlist` : `Add ${product?.name ?? "product"} to wishlist`}
            aria-pressed={liked}
            className={`
              absolute top-3 right-3 z-20 p-2 rounded-full border transition-all duration-300 backdrop-blur-md cursor-pointer
              ${liked
                ? "bg-[var(--accent-muted)] border-[var(--accent)] text-[var(--accent)] opacity-100 scale-100"
                : "bg-black/5 dark:bg-white/5 border-[var(--border-color)] text-[var(--foreground)] opacity-70 group-hover/card:opacity-100 hover:scale-110 active:scale-95"
              }
            `}
          >
            <Heart size={13} fill={liked ? "currentColor" : "none"} aria-hidden />
          </button>
        </div>

        {/* ── GLASSMORPHIC DETAILS BOTTOM PANEL ── */}
        {product && (
          <div className="relative z-20 shrink-0 p-4 sm:p-5 bg-[var(--card)] border-t border-[var(--border-color)] flex flex-col gap-2 transition-all duration-300">
            {/* The title is the keyboard/screen-reader path into the product.
                Clicking the card body opens quick view as a pointer shortcut. */}
            <h3 className="text-base font-extrabold text-[var(--foreground)] tracking-wide line-clamp-2 group-hover/card:text-[var(--accent)] transition-colors duration-300">
              <Link
                href={`/product/${product.id}`}
                prefetch
                onClick={(e) => e.stopPropagation()}
                className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] hover:underline underline-offset-2"
              >
                {product.name}
              </Link>
            </h3>

            {/* Rating and Price */}
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-[var(--foreground)] tracking-tight">
                ${product.price.toFixed(2)}
              </span>
              {product.rating > 0 && (
                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[10px] text-amber-500 font-bold">
                  <span>★</span>
                  <span>{product.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Reveals on hover, and on keyboard focus so it is reachable
                without a pointer. */}
            <div className="min-h-9 opacity-100">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full h-full rounded-xl bg-[var(--foreground)] text-[var(--background)] font-black text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(255,255,255,0.02)]"
              >
                Add to Cart
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
