"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "motion/react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { toHeroItem } from "@/components/storefront/product-adapter"
import { CardMedia } from "@/components/product/card-media"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { Product } from "@/lib/types"
import type { HeroProductItem } from "@/lib/storefront/types"

/** How long each product holds center focus before switching to the next. */
const CENTER_HOLD_MS = 3500

type SlotPosition = -1 | 0 | 1

interface VisibleHeroSlot {
  key: string
  item: HeroProductItem
  offset: SlotPosition
}

/**
 * Full-viewport depth-of-field floating product showcase:
 * - Top bar holds Left/Right switch buttons around the active product name.
 * - Nothing renders below the moving carousel.
 * - Center product is enlarged and autoplays its showcase video on arrival;
 *   flanking blurred neighbors glide into focus when clicked, dragged, or auto-switched.
 */
export const HeroShowcase: React.FC<{ initialProducts?: Product[] }> = ({
  initialProducts = [],
}) => {
  const router = useRouter()
  const { products: catalogProducts } = useCatalog()
  const reducedMotion = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)

  const products = catalogProducts.length > 0 ? catalogProducts : initialProducts

  const items = useMemo(() => {
    const featured = products.filter((p) => p.featured)
    return (featured.length > 0 ? featured : products).map(toHeroItem)
  }, [products])
  const total = items.length

  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(true)
  const draggedRef = useRef(false)

  // Pause hero video decoding & 3.5s slide timer when scrolled out of view.
  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) setInView(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const safeIndex = total > 0 ? currentIndex % total : 0
  const current = items[safeIndex]

  const goPrev = useCallback(() => {
    if (total <= 1) return
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + total) % total)
  }, [total])

  const goNext = useCallback(() => {
    if (total <= 1) return
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % total)
  }, [total])

  // Auto-advance (pauses while hovered, scrolled out of view, hidden, or reduced-motion)
  useEffect(() => {
    if (total <= 1 || paused || !inView || reducedMotion) return
    const timer = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % total)
    }, CENTER_HOLD_MS)
    return () => window.clearInterval(timer)
  }, [total, paused, inView, reducedMotion])

  // Keyboard arrow navigation when on storefront
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if (e.key === "ArrowLeft") goPrev()
      else if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [goPrev, goNext])

  const visibleSlots: VisibleHeroSlot[] = useMemo(() => {
    if (total === 0 || !current) return []
    if (total === 1) {
      return [{ key: `center-${current.id}`, item: current, offset: 0 }]
    }
    const prevItem = items[(safeIndex - 1 + total) % total]
    const upcoming = items[(safeIndex + 1) % total]
    if (total === 2) {
      return [
        { key: `prev-${prevItem.id}`, item: prevItem, offset: -1 },
        { key: `center-${current.id}`, item: current, offset: 0 },
        { key: `next-${upcoming.id}`, item: upcoming, offset: 1 },
      ]
    }
    // Key by stable item.id when total >= 3 so Motion morphs positions smoothly
    return [
      { key: prevItem.id, item: prevItem, offset: -1 },
      { key: current.id, item: current, offset: 0 },
      { key: upcoming.id, item: upcoming, offset: 1 },
    ]
  }, [current, items, safeIndex, total])

  if (total === 0 || !current) return null

  const openProduct = (item: HeroProductItem) => {
    if (draggedRef.current) return
    router.push(`/product/${item.id}`)
  }

  return (
    <section
      ref={sectionRef}
      id="hero-showcase-section"
      aria-label="Featured products showcase"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="h-[calc(100svh-96px)] sm:h-[calc(100svh-120px)] lg:h-[calc(100svh-136px)] min-h-[440px] flex flex-col items-center justify-center px-4 sm:px-8 pb-2 relative w-full overflow-x-clip select-none"
    >
      {/* TOP-RIGHT VERTICAL SWITCH BUTTONS (compact close stack like old filter arrows) */}
      <div className="absolute top-2 right-4 sm:right-8 z-30 flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={goPrev}
          disabled={total <= 1}
          aria-label="Previous product"
          className="w-7 h-7 rounded-full bg-white border border-[#e7e0d5] hover:bg-[#f5f0e8] flex items-center justify-center text-[#5e564c] transition-all shadow-2xs cursor-pointer dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/15 dark:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={total <= 1}
          aria-label="Next product"
          className="w-7 h-7 rounded-full bg-white border border-[#e7e0d5] hover:bg-[#f5f0e8] flex items-center justify-center text-[#5e564c] transition-all shadow-2xs cursor-pointer dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/15 dark:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* CENTERED ACTIVE PRODUCT NAME */}
      <div className="relative z-20 w-full max-w-[680px] flex items-center justify-center px-2 mb-2 shrink-0">
        <h2 className="font-sans text-base sm:text-lg font-bold text-[#162020] dark:text-[var(--foreground)] tracking-tight leading-snug text-center truncate">
          {current.name}
        </h2>
      </div>

      {/* FLOATING DEPTH-OF-FIELD 3-ITEM STAGE */}
      <motion.div
        className="relative w-full max-w-[1480px] flex-1 flex items-center justify-center"
        drag={total > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.14}
        onDragStart={() => {
          draggedRef.current = true
        }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -50 || info.velocity.x < -280) {
            goNext()
          } else if (info.offset.x > 50 || info.velocity.x > 280) {
            goPrev()
          }
          window.setTimeout(() => {
            draggedRef.current = false
          }, 90)
        }}
      >
        <AnimatePresence initial={false} custom={direction}>
          {visibleSlots.map(({ key, item, offset }) => {
            const isCenter = offset === 0
            const xTarget = offset === -1 ? "-112%" : offset === 1 ? "112%" : "0%"

            return (
              <motion.div
                key={key}
                custom={direction}
                initial={{
                  x: direction > 0 ? "160%" : "-160%",
                  scale: 0.55,
                  opacity: 0,
                }}
                animate={{
                  x: xTarget,
                  scale: isCenter ? 1 : 0.66,
                  opacity: isCenter ? 1 : 0.52,
                  zIndex: isCenter ? 20 : 10,
                }}
                exit={{
                  x: direction > 0 ? "-160%" : "160%",
                  scale: 0.55,
                  opacity: 0,
                  zIndex: 0,
                }}
                transition={
                  reducedMotion
                    ? { duration: 0.15 }
                    : {
                        type: "spring",
                        stiffness: 240,
                        damping: 28,
                        mass: 0.85,
                      }
                }
                onClick={() => {
                  if (offset === -1) goPrev()
                  else if (offset === 1) goNext()
                  else openProduct(item)
                }}
                className={`absolute flex flex-col items-center justify-center cursor-pointer will-change-transform ${
                  isCenter
                    ? "w-[min(94vw,520px)] sm:w-[min(78vw,680px)] lg:w-[min(64vw,760px)]"
                    : "hidden sm:flex w-[260px] sm:w-[340px] lg:w-[430px] blur-[4px]"
                }`}
                aria-label={
                  isCenter
                    ? `View ${item.name}`
                    : offset === -1
                      ? `Previous product: ${item.name}`
                      : `Next product: ${item.name}`
                }
              >
                {/* Flanking neighbor name sits subtly on top */}
                {!isCenter && (
                  <div className="w-full mb-2 sm:mb-2.5 text-center px-2">
                    <p className="font-sans text-xs sm:text-sm font-bold tracking-tight leading-snug text-[var(--foreground)] text-center line-clamp-1">
                      {item.name}
                    </p>
                  </div>
                )}

                {/* Product media: autoplay showcase video when centered, still/cutout on sides */}
                <div
                  data-hero-media
                  className={`relative w-full flex items-center justify-center ${
                    isCenter
                      ? "h-[clamp(300px,68svh,560px)]"
                      : "h-[clamp(210px,46svh,390px)]"
                  }`}
                >
                  {isCenter && item.video ? (
                    <div className="relative w-full h-full rounded-[32px] overflow-hidden shadow-[0_32px_70px_-16px_rgba(0,0,0,0.34)] bg-white/80 dark:bg-white/5">
                      <CardMedia
                        image={item.mainImage}
                        video={item.video}
                        alt={item.name}
                        active={inView}
                        priority
                        videoOnly
                        eagerVideo
                        fallbackToImage
                        sizes="(max-width: 640px) 94vw, (max-width: 1024px) 78vw, 760px"
                      />
                    </div>
                  ) : item.cutoutImage ? (
                    <div className="relative w-full h-full p-2">
                      <Image
                        src={item.cutoutImage}
                        alt={item.name}
                        fill
                        priority={isCenter}
                        unoptimized
                        draggable={false}
                        sizes="(max-width: 640px) 94vw, (max-width: 1024px) 78vw, 760px"
                        className="object-contain pointer-events-none drop-shadow-[0_22px_28px_rgba(0,0,0,0.18)]"
                      />
                    </div>
                  ) : (
                    <div className="relative w-[90%] h-[92%] rounded-[28px] overflow-hidden shadow-[0_28px_60px_-15px_rgba(0,0,0,0.28)] bg-white/80 dark:bg-white/5">
                      <Image
                        src={item.mainImage}
                        alt={item.name}
                        fill
                        priority={isCenter}
                        unoptimized
                        draggable={false}
                        sizes="(max-width: 640px) 86vw, (max-width: 1024px) 72vw, 700px"
                        className="object-cover pointer-events-none"
                      />
                    </div>
                  )}
                </div>

                {/* Soft elliptical ground shadow beneath the center floating product */}
                {isCenter && (
                  <div
                    aria-hidden
                    className="w-[260px] sm:w-[360px] h-4 sm:h-5 rounded-full bg-black/20 dark:bg-black/60 blur-xl mt-1.5 pointer-events-none shrink-0"
                  />
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
