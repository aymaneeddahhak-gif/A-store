"use client"
import { useState } from "react"
import { Heart } from "lucide-react"
import { useShop } from "@/contexts/shop-context"

interface ElectricBorderCardProps {
  image?: string;
  className?: string;
  product?: {
    id: number;
    name: string;
    price: number;
    category: string;
    description?: string;
  };
}

export default function ElectricBorderCard({ image, className, product }: ElectricBorderCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { openQuickView } = useShop()

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
  }

  const handleCardClick = () => {
    if (product && image) {
      openQuickView({ ...product, image })
    }
  }

  return (
    <div
      className={`card-container ${className || ''} group/card cursor-pointer relative overflow-hidden`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image — simple, fast, no WebGL overhead */}
      <div className="absolute inset-0 z-0 rounded-[24px] overflow-hidden">
        {image && (
          <img
            src={image}
            alt={product?.name || "Product"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
            loading="lazy"
          />
        )}
        {/* Subtle gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-overlay-from)] via-transparent to-transparent opacity-80" />
      </div>

      {/* Inner container with text overlays */}
      <div className="inner-container h-full relative z-20 m-[2px] pointer-events-none">
        <div className="border-outer h-full relative flex flex-col justify-end">

          {/* Product Info Overlay (Visible on Hover) */}
          {product && (
            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[var(--card-overlay-from)] to-transparent translate-y-full group-hover/card:translate-y-0 transition-transform duration-300 flex flex-col items-start gap-1">
              <span className="text-[var(--foreground)] font-bold">{product.name}</span>
              <span className="text-[var(--silver-medium)] text-sm mb-1">${product.price}</span>
              {product.description && (
                <p className="text-[var(--foreground)] opacity-70 text-xs leading-snug">{product.description}</p>
              )}
            </div>
          )}

          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`
                absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all duration-300 pointer-events-auto
                ${isLiked
                ? "bg-black/40 border-rose-500/50 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-100 opacity-100"
                : "bg-black/20 border-white/10 text-white/70 hover:bg-black/40 hover:text-white opacity-0 group-hover/card:opacity-100 scale-90 group-hover/card:scale-100"
              }
              `}
          >
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          </button>

          {/* Electric Border Layer (Overlay using SVG Filter — filter defined ONCE in layout) */}
          <div className="main-card !bg-transparent relative z-10 pointer-events-none"></div>
        </div>
        <div className="glow-layer-1 pointer-events-none"></div>
        <div className="glow-layer-2 pointer-events-none"></div>

        {/* Glossy Overlays */}
        <div className="overlay-1 pointer-events-none"></div>
        <div className="overlay-2 pointer-events-none"></div>
      </div>
    </div>
  )
}
