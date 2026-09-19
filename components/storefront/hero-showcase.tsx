"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence, type Variants } from "motion/react"
import { Truck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { toHeroItem } from "@/components/storefront/product-adapter"
import { CardMedia } from "@/components/product/card-media"
import type { HeroProductItem } from "@/lib/storefront/types"

/**
 * Full-width moving showcase. Five real catalog products sit side by side in
 * a row; the center card is dominant and wider, the flanking cards are scaled
 * down with deep shadows and stay as still images until rotation brings them
 * to the center. The center card's clip is buffered by the section-level
 * preloaders BEFORE the product ever reaches the center, so it starts playing
 * the instant the card arrives — no blank flash (the product photo shows
 * through until the first frame is decodable). Rotation holds each product in
 * the center long enough for the clip to actually play.
 */

/** How long each product holds the center card before rotating on. */
const CENTER_HOLD_MS = 6000
export const HeroShowcase: React.FC = () => {
  const router = useRouter()
  const { products } = useCatalog()

  const items = React.useMemo(() => {
    // Admin-pinned products take the stage when any exist; otherwise the
    // whole catalog rotates as before.
    const featured = products.filter((p) => p.featured)
    return (featured.length > 0 ? featured : products).map(toHeroItem)
  }, [products])
  const total = items.length

  // Distinct showcase videos, buffered from mount so no center card ever
  // waits on its clip.
  const preloadVideos = React.useMemo(
    () => Array.from(new Set(items.map((item) => item.video).filter((v): v is string => Boolean(v)))),
    [items]
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)

  // Derive 5 distinct visible products across the full web width
  const farPrev = items[(currentIndex - 2 + total) % total]
  const prev = items[(currentIndex - 1 + total) % total]
  const current = items[currentIndex]
  const next = items[(currentIndex + 1) % total]
  const farNext = items[(currentIndex + 2 + total) % total]

  // Auto rotation remains active continuously even on hover
  useEffect(() => {
    if (total === 0) return
    const interval = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prevIndex) => (prevIndex + 1) % total)
    }, CENTER_HOLD_MS)

    return () => clearInterval(interval)
  }, [total])

  if (total === 0 || !current) return null

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setDirection(-1)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + total) % total)
  }

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setDirection(1)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % total)
  }

  const openProduct = (item: HeroProductItem) => router.push(`/product/${item.id}`)

  // Snappy horizontal spring sliding animation
  const slideVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0.35,
      scale: 0.94,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 380, damping: 30 },
        opacity: { duration: 0.16 },
        scale: { duration: 0.16 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0.35,
      scale: 0.94,
      transition: {
        x: { type: "spring", stiffness: 380, damping: 30 },
        opacity: { duration: 0.14 },
        scale: { duration: 0.14 },
      },
    }),
  }

  return (
    <section
      id="hero-showcase-section"
      className="relative w-full overflow-hidden py-8 sm:py-12 md:py-14 select-none"
    >
      {/* Warm EVERY showcase clip (one hidden <video> per product video) so
          the center card plays the instant its product arrives instead of
          buffering on a blank card. Keyed by src so the elements persist
          across rotations and the cache is never thrown away. */}
      <HeroVideoPreloaders videos={preloadVideos} />
      {/* Prefetch the current product's detail route too, so clicking the
          center card opens the page without a server-render wait. */}
      <CenterRoutePrefetcher id={current.id} router={router} />
      {/* Section heading */}
      <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-8 lg:px-12 pb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Handpicked for you
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-[var(--foreground)] uppercase">
          Top Products
        </h2>
      </div>
      {/* MULTI-PRODUCT SIDE-BY-SIDE TRACK — one flex row, center card widest */}
      <div className="relative w-full max-w-[1750px] mx-auto flex items-center justify-center gap-3 sm:gap-5 lg:gap-6 min-h-[440px] sm:min-h-[510px] md:min-h-[560px] px-4 sm:px-8 lg:px-12 overflow-hidden">
        {/* 1. FAR-LEFT CARD: Smaller with deeper shadow */}
        <HeroSideCard
          item={farPrev}
          onClick={handlePrev}
          className="hidden 2xl:block relative w-[220px] h-[290px] rounded-[22px] overflow-hidden border border-white/60 shadow-[0_44px_85px_-10px_rgba(0,0,0,0.85),0_20px_42px_-8px_rgba(0,0,0,0.6)] z-0 opacity-50 bg-white shrink-0"
        />

        {/* 2. INNER-LEFT CARD: Scaled smaller with intense deep shadow */}
        <HeroSideCard
          item={prev}
          onClick={handlePrev}
          className="hidden md:block relative w-[260px] lg:w-[310px] h-[340px] lg:h-[380px] rounded-[24px] overflow-hidden border border-white/70 shadow-[0_50px_95px_-12px_rgba(0,0,0,0.9),0_24px_48px_-10px_rgba(0,0,0,0.65)] z-10 opacity-75 bg-white shrink-0"
        />

        {/* 3. CENTER CARD: DOMINANT PROMINENT CENTER DISPLAY */}
        <div className="relative z-20 w-full max-w-[440px] sm:max-w-[580px] md:max-w-[660px] shrink-0">
          <AnimatePresence mode="wait" custom={direction}>
            <CenterCard
              key={current.id}
              item={current}
              direction={direction}
              variants={slideVariants}
              onSelect={openProduct}
            />
          </AnimatePresence>
        </div>

        {/* 4. INNER-RIGHT CARD: Scaled smaller with intense deep shadow */}
        <HeroSideCard
          item={next}
          onClick={handleNext}
          className="hidden md:block relative w-[260px] lg:w-[310px] h-[340px] lg:h-[380px] rounded-[24px] overflow-hidden border border-white/70 shadow-[0_50px_95px_-12px_rgba(0,0,0,0.9),0_24px_48px_-10px_rgba(0,0,0,0.65)] z-10 opacity-75 bg-white shrink-0"
        />

        {/* 5. FAR-RIGHT CARD: Smaller with deeper shadow */}
        <HeroSideCard
          item={farNext}
          onClick={handleNext}
          className="hidden 2xl:block relative w-[220px] h-[290px] rounded-[22px] overflow-hidden border border-white/60 shadow-[0_44px_85px_-10px_rgba(0,0,0,0.85),0_20px_42px_-8px_rgba(0,0,0,0.6)] z-0 opacity-50 bg-white shrink-0"
        />
      </div>
    </section>
  )
}

/**
 * Off-screen clips that buffer EVERY showcase product's video ahead of its
 * center-slot rotation. One stable element per distinct video (keyed by src)
 * keeps the browser cache warm — a preloaded clip plays instantly when its
 * card takes the center.
 */
function HeroVideoPreloaders({ videos }: { videos: string[] }) {
  return (
    <div aria-hidden className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0">
      {videos.map((video) => (
        <video key={video} src={video} muted playsInline preload="auto" tabIndex={-1} />
      ))}
    </div>
  )
}

/** Prefetches the center product's detail route as soon as it arrives. */
function CenterRoutePrefetcher({
  id,
  router,
}: {
  id: string | number
  router: ReturnType<typeof useRouter>
}) {
  useEffect(() => {
    router.prefetch(`/product/${id}`)
  }, [id, router])
  return null
}

/**
 * Flanking card — still image only. The clip plays once the card's product
 * rotates into the center position, so side cards never load video.
 */
function HeroSideCard({
  item,
  onClick,
  className,
}: {
  item: HeroProductItem
  onClick: (e?: React.MouseEvent) => void
  className: string
}) {
  const router = useRouter()

  return (
    <div
      onClick={onClick}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") router.prefetch(`/product/${item.id}`)
      }}
      className={`cursor-pointer transition-all duration-300 group hover:scale-[1.02] ${className}`}
    >
      <CardMedia
        image={item.mainImage}
        video={null}
        alt={item.name}
        active={false}
        sizes="310px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 p-3 text-center z-10">
        <h4 className="text-xs font-extrabold text-white uppercase tracking-tight line-clamp-1 drop-shadow-md">
          {item.name}
        </h4>
      </div>
    </div>
  )
}

/** Center card — the dominant display with spring slide transitions. The
 * showcase clip is the whole card (no still image) and plays for as long as
 * the product holds the center. */
function CenterCard({
  item,
  direction,
  variants,
  onSelect,
}: {
  item: HeroProductItem
  direction: 1 | -1
  variants: Variants
  onSelect: (item: HeroProductItem) => void
}) {
  const router = useRouter()

  return (
    <motion.div
      key={item.id}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      onClick={() => onSelect(item)}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") router.prefetch(`/product/${item.id}`)
      }}
      className="relative w-full h-[470px] sm:h-[540px] md:h-[590px] rounded-[36px] overflow-hidden bg-white shadow-[0_35px_80px_-15px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.9)] border-2 border-white flex flex-col justify-end cursor-pointer group"
    >
      <CardMedia
        image={item.mainImage}
        video={item.video}
        alt={item.name}
        active
        videoOnly
        eagerVideo
        fallbackToImage
        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 60vw, 660px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

      {/* Top Discount Tag & Fast Delivery Badge */}
      <div className="absolute top-5 inset-x-5 flex items-center justify-between z-10">
        {item.discountBadge ? (
          <span className="bg-black/90 text-white text-xs font-black uppercase px-3 py-1 rounded-full backdrop-blur-md tracking-wider border border-white/20 shadow-md">
            {item.discountBadge}
          </span>
        ) : (
          <div />
        )}
        <span className="bg-white/95 text-gray-900 text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-md">
          <Truck className="w-3 h-3 text-emerald-600" />
          {item.shipping}
        </span>
      </div>

      {/* Bottom Content Area: Name, Price & Slashed Comparison */}
      <div className="relative z-10 p-7 sm:p-8 text-center">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-2">
          {item.name}
        </h3>

        <div className="flex items-center justify-center gap-2.5">
          <span className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
            {item.price}
          </span>
          {item.originalPrice && (
            <span className="text-sm sm:text-base font-bold text-gray-300 line-through drop-shadow-sm">
              {item.originalPrice}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
