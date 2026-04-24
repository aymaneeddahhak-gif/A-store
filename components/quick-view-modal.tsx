"use client"

import { useShop, Product } from "@/contexts/shop-context"
import { X, ShoppingBag, Heart } from "lucide-react"

export function QuickViewModal() {
    const { quickViewProduct, closeQuickView, addToCart } = useShop()

    if (!quickViewProduct) return null

    // Prevent closing when clicking content
    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeQuickView}
        >
            <div
                className="w-[90%] max-w-4xl h-[70vh] bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-3xl overflow-hidden flex shadow-2xl relative animate-in zoom-in-95 duration-300"
                onClick={handleContentClick}
            >
                {/* Close Button */}
                <button
                    onClick={closeQuickView}
                    className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[var(--glass-bg)] text-[var(--foreground)] hover:bg-[var(--glass-highlight)] transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Left: Image */}
                <div className="w-1/2 h-full relative bg-gradient-to-br from-[var(--glass-bg)] to-transparent overflow-hidden">
                    <img
                        src={quickViewProduct.image}
                        alt={quickViewProduct.name}
                        className="w-full h-full object-cover"
                    />
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-transparent opacity-20 pointer-events-none" />
                </div>

                {/* Right: details */}
                <div className="w-1/2 h-full p-8 flex flex-col justify-center gap-6 relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-[var(--electric-border-color)] blur-[120px] opacity-20 pointer-events-none rounded-full translate-x-1/2 -translate-y-1/2" />

                    <div className="space-y-2 z-10">
                        <span className="text-[var(--silver-medium)] uppercase tracking-widest text-xs font-semibold">
                            {quickViewProduct.category}
                        </span>
                        <h2 className="text-4xl font-bold text-[var(--foreground)] tracking-tight">
                            {quickViewProduct.name}
                        </h2>
                        <p className="text-2xl text-[var(--electric-light-color)] font-medium">
                            ${quickViewProduct.price}
                        </p>
                    </div>

                    <p className="text-[var(--muted-foreground)] leading-relaxed z-10 max-w-md">
                        Engineered for perfection. This premium edition features stealth aesthetics,
                        military-grade materials, and our signature electric aura.
                        Limited stock available.
                    </p>

                    <div className="flex gap-4 mt-4 z-10">
                        <button
                            onClick={() => {
                                addToCart(quickViewProduct)
                                closeQuickView()
                            }}
                            className="flex-1 py-4 bg-[var(--hero-btn-bg)] text-[var(--hero-btn-text)] font-bold rounded-xl hover:bg-[var(--hero-btn-hover)] transition-all flex items-center justify-center gap-2 group"
                        >
                            <ShoppingBag size={20} />
                            Add to Cart
                        </button>
                        <button className="px-6 py-4 rounded-xl border border-[var(--border-color)] text-[var(--foreground)] hover:border-[var(--electric-border-color)] hover:text-[var(--electric-light-color)] transition-all">
                            <Heart size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
