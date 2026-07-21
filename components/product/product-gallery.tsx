"use client"

import { useState } from "react"
import Image from "next/image"
import { Zap } from "lucide-react"
import type { Product } from "@/lib/types"

/**
 * Product gallery — client island for the active-image state.
 * Server-rendered parent passes the product; this component only owns
 * the "which thumbnail is selected" interaction.
 */
export function ProductGallery({ product }: { product: Product }) {
  const [activeImage, setActiveImage] = useState(product.image)
  const allImages = [product.image, ...(product.images || [])].filter(
    (img, i, self) => self.indexOf(img) === i
  )

  return (
    <div className="space-y-6">
      <div className="relative aspect-square rounded-[40px] bg-[var(--card)] border border-[var(--border-color)] overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <Image
          src={activeImage}
          alt={product.name}
          fill
          className="object-contain p-12 transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        <div className="absolute top-8 left-8 p-3 bg-[var(--foreground)] text-[var(--background)] rounded-2xl shadow-2xl animate-bounce">
          <Zap size={20} fill="currentColor" />
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {allImages.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveImage(img)}
            aria-label={`View image ${i + 1}`}
            className={`relative w-24 h-24 rounded-3xl overflow-hidden border-2 transition-all flex-shrink-0 bg-[var(--card)] ${
              activeImage === img
                ? "border-[var(--foreground)] scale-105 shadow-xl"
                : "border-[var(--border-color)] opacity-50 hover:opacity-100"
            }`}
          >
            <Image src={img} alt="" fill className="object-contain p-2" sizes="96px" />
          </button>
        ))}
      </div>
    </div>
  )
}
