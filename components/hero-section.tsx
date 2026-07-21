"use client"
import { Eye } from "lucide-react"
import Image from "next/image"
import { useShop } from "@/contexts/shop-context"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

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
        id: 9,
        name: "iPhone 17 Pro Max",
        price: 1199,
        category: "Electronics",
        image: "/images/iphone-17-pro-max-naranja-cosmico-5.png",
        description: "The pinnacle of mobile engineering with a cosmic orange finish.",
    },
    {
        id: 10,
        name: "Flexpedition Down Jacket",
        price: 299,
        category: "Fashion",
        image: "/images/10748_2703_00.png",
        description: "High-performance insulation for extreme urban exploration.",
    },
    {
        id: 12,
        name: "Dell XPS 15 Premium",
        price: 1899,
        category: "Electronics",
        image: "/images/ASSET_MP_98772542.png",
        description: "High-performance workstation with a sleek, minimalist carbon fiber chassis.",
    },
    {
        id: 13,
        name: "Stealth Urban Umbrella",
        price: 55,
        category: "Fashion",
        image: "/images/images.png",
        description: "Reinforced aerodynamic canopy for the sophisticated city dweller.",
    },
    {
        id: 3,
        name: "Madrid Kit 25/26",
        price: 120,
        category: "Fashion",
        image: "/images/RMADRIDKIT.png",
        description: "Official home kit, breathable tech fabric.",
    },
]

export function HeroSection() {
    const { openQuickView, products } = useShop()
    const reducedMotion = useReducedMotion()

    // Double the array for seamless infinite loop (0% to -50% animation)
    const doubled = reducedMotion ? MARQUEE_PRODUCTS : [...MARQUEE_PRODUCTS, ...MARQUEE_PRODUCTS]

    const handleProductClick = (item: typeof MARQUEE_PRODUCTS[0]) => {
        const full = products.find((p) => p.id === item.id)
        if (full) {
            openQuickView(full)
            return
        }
        openQuickView({
            ...item,
            likes: 0,
            rating: 5,
            reviews: [],
            description: item.description,
        })
    }

    return (
        <div className="relative w-full h-[520px] md:h-[600px] mb-12 rounded-[48px] overflow-hidden shadow-2xl">
            {/* Background */}
            <div className="absolute inset-0 bg-[var(--card)] z-0" />

            {/* Scrolling Product Cards */}
            <div className="absolute inset-0 z-10 flex items-center overflow-hidden">
                <div className={`flex items-center gap-8 px-4 ${reducedMotion ? "flex-wrap justify-center" : "hero-marquee-track will-change-transform"}`}>
                    {doubled.map((product, i) => (
                        <div
                            key={`${product.id}-${i}`}
                            className="hero-marquee-item flex-shrink-0 relative cursor-pointer group/card"
                            onClick={() => handleProductClick(product)}
                        >
                            <div className="relative w-[300px] h-[420px] md:w-[340px] md:h-[460px] rounded-3xl overflow-hidden border border-[var(--border-color)] bg-[var(--background)] shadow-xl transition-all duration-300 group-hover/card:shadow-2xl group-hover/card:border-[var(--glass-border)] group-hover/card:scale-[1.03]">
                                {/* Glass shine */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent z-10 pointer-events-none" />

                                {/* Product image container with radial base for premium blending */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,white_0%,rgba(255,255,255,0.8)_60%,transparent_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,1)_0%,rgba(255,255,255,0.4)_70%,transparent_100%)]">
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover/card:scale-110 mix-blend-multiply"
                                        sizes="340px"
                                    />
                                </div>

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
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--glass-highlight)] blur-[32px] rounded-full pointer-events-none opacity-25 z-0" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--electric-light-color)] blur-[32px] rounded-full pointer-events-none opacity-10 z-0" />
        </div>
    )
}
