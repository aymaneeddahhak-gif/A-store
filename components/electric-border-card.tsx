"use client"
import { useCallback } from "react"
import { Heart, ShoppingBag } from "lucide-react"
import { useShop, Product } from "@/contexts/shop-context"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface ElectricBorderCardProps {
  image?: string;
  className?: string;
  product?: Product;
}

export default function ElectricBorderCard({ image, className, product }: ElectricBorderCardProps) {
  const router = useRouter()
  const { toggleLike, likedProducts, addToCart } = useShop()
  const isLiked = product ? likedProducts.includes(product.id) : false

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (product) toggleLike(product.id)
  }, [product, toggleLike])

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (product) addToCart(product)
  }, [product, addToCart])

  const handleCardClick = useCallback(() => {
    if (product) router.push(`/product/${product.id}`)
  }, [product, router])

  const displayImage = product?.image || image

  return (
    <div
      className={`relative h-full min-h-[420px] rounded-[24px] overflow-hidden group/card cursor-pointer bg-[var(--card)] border border-[var(--border-color)] transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_20px_40px_rgba(255,255,255,0.02)] flex flex-col p-[1px] ${className || ""}`}
      onClick={handleCardClick}
    >
      {/* ── SPINNABLE ELECTRIC BORDER LASER ON HOVER ── */}
      <div className="absolute inset-[-200%] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_35%,var(--electric-light-color)_50%,transparent_65%,transparent_100%)] opacity-0 group-hover/card:opacity-100 group-hover/card:animate-[spin_4s_linear_infinite] transition-opacity duration-500 pointer-events-none z-0" />

      {/* ── CARD INNER LAYOUT ── */}
      <div className="relative z-10 w-full h-full min-h-0 rounded-[23px] overflow-hidden bg-[var(--card)] flex flex-col flex-1">
        
        {/* ── PRODUCT SHOWCASE IMAGE AREA ── */}
        <div className="relative w-full flex-1 min-h-[280px] sm:min-h-[300px] overflow-hidden flex items-center justify-center p-4 sm:p-5 bg-[radial-gradient(ellipse_at_center,var(--glass-highlight)_0%,var(--glass-bg)_45%,transparent_100%)] select-none group-hover/card:bg-black/5 transition-colors duration-500">
          
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
            <div className="relative z-10 w-full max-w-[340px] aspect-square mx-auto transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover/card:scale-105 group-hover/card:-translate-y-2">
              <Image
                src={displayImage}
                alt={product?.name || "Product"}
                fill
                className="object-contain object-center p-2 drop-shadow-[0_12px_28px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_16px_36px_rgba(0,0,0,0.45)] transition-all duration-500"
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, (max-width: 1280px) 32vw, 28vw"
                loading="lazy"
              />
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
            aria-label={isLiked ? "Unlike product" : "Like product"}
            className={`
              absolute top-3 right-3 z-20 p-2 rounded-full border transition-all duration-300 backdrop-blur-md cursor-pointer
              ${isLiked
                ? "bg-rose-500/10 border-rose-500/30 text-rose-500 opacity-100 scale-100"
                : "bg-black/5 dark:bg-white/5 border-[var(--border-color)] text-[var(--foreground)] opacity-70 group-hover/card:opacity-100 hover:scale-110 active:scale-95"
              }
            `}
          >
            <Heart size={13} fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>

        {/* ── GLASSMORPHIC DETAILS BOTTOM PANEL ── */}
        {product && (
          <div className="relative z-20 shrink-0 p-4 sm:p-5 bg-[var(--glass-bg)] backdrop-blur-md border-t border-[var(--border-color)] flex flex-col gap-2 transition-all duration-300">
            {/* Title */}
            <h3 className="text-base font-extrabold text-[var(--foreground)] tracking-wide line-clamp-2 group-hover/card:text-[var(--accent)] transition-colors duration-300">
              {product.name}
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

            {/* ── ADD TO CART BUTTON (Slide up on hover) ── */}
            <div className="h-0 opacity-0 group-hover/card:h-9 group-hover/card:opacity-100 group-hover/card:mt-2.5 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden">
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

