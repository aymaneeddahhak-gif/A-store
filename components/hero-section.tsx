"use client"
import { Eye } from "lucide-react"
import Image from "next/image"
import { useShop } from "@/contexts/shop-context"

const MARQUEE_PRODUCTS = [
    {
        id: 1,
        name: "Stealth Earbuds Pro",
        price: 249,
        category: "Electronics",
        image: "/images/airpods.png",
        description: "Advanced active noise cancellation with 48h battery life.",
    },
    {
        id: 2,
        name: "Artisan Petit Pain",
        price: 12,
        category: "Food",
        image: "/images/pteitpain.png",
        description: "Flaky, buttery perfection baked fresh daily.",
    },
    {
        id: 3,
        name: "Madrid Kit 25/26",
        price: 120,
        category: "Fashion",
        image: "/images/RMADRIDKIT.png",
        description: "Official home kit, breathable tech fabric.",
    },
    {
        id: 4,
        name: "Urban Kicks White",
        price: 180,
        category: "Fashion",
        image: "/images/sneakers.png",
        description: "Street-ready minimalist design with cloud foam sole.",
    },
]

export function HeroSection() {
    const { openQuickView } = useShop()

    // Triple the array for seamless infinite scroll on wide screens
    const tripled = [...MARQUEE_PRODUCTS, ...MARQUEE_PRODUCTS, ...MARQUEE_PRODUCTS]

    const handleProductClick = (product: typeof MARQUEE_PRODUCTS[0]) => {
        openQuickView({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            image: product.image,
        })
    }

    return (
        <div className="relative w-full h-[480px] md:h-[540px] mb-8 rounded-[32px] overflow-hidden border border-[var(--border-color)]">
            {/* Background */}
            <div className="absolute inset-0 bg-[var(--card)] z-0" />

            {/* Scrolling Product Cards */}
            <div className="absolute inset-0 z-10 flex items-center overflow-hidden">
                <div className="hero-marquee-track flex items-center gap-8 will-change-transform px-4">
                    {tripled.map((product, i) => (
                        <div
                            key={`${product.id}-${i}`}
                            className="hero-marquee-item flex-shrink-0 relative cursor-pointer group/card"
                            onClick={() => handleProductClick(product)}
                        >
                            <div className="relative w-[300px] h-[420px] md:w-[340px] md:h-[460px] rounded-3xl overflow-hidden border border-[var(--border-color)] bg-[var(--background)] shadow-xl transition-all duration-300 group-hover/card:shadow-2xl group-hover/card:border-[var(--glass-border)] group-hover/card:scale-[1.03]">
                                {/* Glass shine */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent z-10 pointer-events-none" />

                                {/* Product image */}
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover/card:scale-110"
                                    sizes="340px"
                                />

                                {/* Hover overlay with product info */}
                                <div className="absolute inset-0 z-20 flex flex-col justify-end opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                                    {/* Gradient backdrop */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                                    {/* Info content */}
                                    <div className="relative p-5 flex flex-col gap-2.5">
                                        {/* Category badge */}
                                        <span className="w-fit px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest bg-white/15 backdrop-blur-sm text-white/90 border border-white/10">
                                            {product.category}
                                        </span>

                                        <h3 className="text-white font-bold text-lg leading-tight">
                                            {product.name}
                                        </h3>

                                        <p className="text-white/60 text-sm leading-relaxed line-clamp-2">
                                            {product.description}
                                        </p>

                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-white font-bold text-xl">
                                                ${product.price}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-white/70 text-xs font-medium bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                                                <Eye className="w-3.5 h-3.5" />
                                                Quick View
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Always-visible bottom info bar */}
                                <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover/card:opacity-0 transition-opacity duration-300">
                                    <div className="flex items-center justify-between">
                                        <p className="text-white font-semibold text-base truncate">
                                            {product.name}
                                        </p>
                                        <span className="text-white/90 text-base font-bold">
                                            ${product.price}
                                        </span>
                                    </div>
                                    <p className="text-white/50 text-xs mt-1">{product.category}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Soft edge fades */}
            <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-r from-[var(--background)] via-transparent to-[var(--background)] opacity-40" />

            {/* Ambient Light Blob */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--glass-highlight)] blur-[120px] rounded-full pointer-events-none opacity-25 z-0" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--electric-light-color)] blur-[100px] rounded-full pointer-events-none opacity-10 z-0" />
        </div>
    )
}
