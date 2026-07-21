"use client"

import { useState } from "react"
import { ShoppingBag, Heart, Share2 } from "lucide-react"
import type { Product } from "@/lib/types"
import { useCart } from "@/contexts/providers/cart-context"
import { useLikes } from "@/contexts/providers/likes-context"

/**
 * Product actions — client island for quantity, add-to-cart, like.
 * These are the only truly interactive parts of the PDP top section.
 */
export function ProductActions({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()
  const { isLiked, toggleLike } = useLikes()
  const liked = isLiked(product.id)

  return (
    <div className="flex flex-col gap-4 mb-12">
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-[var(--card)] border border-[var(--border-color)] rounded-2xl p-1">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-12 h-12 flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--glass-bg)] rounded-xl transition-colors font-bold"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="w-12 text-center font-black text-[var(--foreground)]">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-12 h-12 flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--glass-bg)] rounded-xl transition-colors font-bold"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          onClick={() => {
            for (let i = 0; i < quantity; i++) addToCart(product)
          }}
          className="flex-1 bg-[var(--foreground)] text-[var(--background)] h-[64px] rounded-3xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <ShoppingBag size={20} />
          Add to Bag
        </button>
        <div className="flex flex-col items-center gap-1 group/like">
          <button
            onClick={() => toggleLike(product)}
            aria-label={liked ? "Unlike product" : "Like product"}
            className={`w-[64px] h-[64px] border border-[var(--border-color)] rounded-3xl flex items-center justify-center transition-all ${
              liked
                ? "bg-rose-500 border-rose-500 text-white"
                : "text-[var(--foreground)] hover:bg-[var(--glass-bg)]"
            }`}
          >
            <Heart size={24} fill={liked ? "currentColor" : "none"} />
          </button>
          <span className="text-[10px] font-black text-[var(--foreground)] opacity-40">
            {product.likes || 0} Likes
          </span>
        </div>
      </div>
      <button className="w-full h-14 border border-[var(--border-color)] rounded-2xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--foreground)] opacity-40 hover:opacity-100 transition-opacity">
        <Share2 size={16} />
        Share with friends
      </button>
    </div>
  )
}
