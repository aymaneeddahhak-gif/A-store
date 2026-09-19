"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "motion/react"
import { X, ZoomIn, Play } from "lucide-react"
import type { MediaItem } from "@/lib/product-media"

/** Thumbnails shown beside the main stage; the rest live behind "+N more". */
const VISIBLE_THUMBS = 4

/**
 * Gallery — main stage with zoom, thumbnail rail, and an all-angles
 * lightbox. Media is the product's images followed by its showcase clip.
 */
export function DetailGallery({
  media,
  title,
  selectedIndex,
  onSelectIndex,
}: {
  media: MediaItem[]
  title: string
  selectedIndex: number
  onSelectIndex: (index: number) => void
}) {
  const [showMoreModal, setShowMoreModal] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  const current = media[selectedIndex] ?? media[0]
  if (!current) return null

  const visibleThumbs = media.slice(0, VISIBLE_THUMBS)
  const hiddenCount = media.length - visibleThumbs.length

  const select = (index: number) => {
    onSelectIndex(index)
    setIsZoomed(false)
  }

  return (
    <div className="flex flex-col w-full">
      {/* Main Big Product Showcase Box */}
      <div
        className={`relative w-full aspect-[4/3.2] sm:aspect-[4/3] rounded-2xl md:rounded-[22px] bg-[#f2f0eb] dark:bg-white/5 flex items-center justify-center p-6 md:p-8 overflow-hidden group select-none ${
          current.kind === "image" ? "cursor-zoom-in" : ""
        }`}
        onClick={() => {
          if (current.kind === "image") setIsZoomed(!isZoomed)
        }}
      >
        <AnimatePresence mode="wait">
          {current.kind === "video" ? (
            <motion.video
              key={current.src}
              src={current.src}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="w-full h-full object-contain max-h-[560px] drop-shadow-sm pointer-events-none"
              autoPlay
              muted
              loop
              playsInline
              aria-label={`${title} showcase video`}
            />
          ) : (
            <motion.div
              key={current.src}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: isZoomed ? 1.15 : 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="relative w-full h-full"
            >
              <Image
                src={current.src}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-contain drop-shadow-sm pointer-events-none"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover zoom indicator hint */}
        {current.kind === "image" && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-xs text-neutral-600 rounded-full p-2 text-xs flex items-center gap-1 shadow-xs">
            <ZoomIn className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium pr-1">{isZoomed ? "Reset" : "Zoom"}</span>
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {media.length > 1 && (
        <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5 mt-3.5 sm:mt-4 w-full">
          {visibleThumbs.map((item, index) => {
            const isSelected = selectedIndex === index
            return (
              <button
                key={`${item.kind}-${item.src}`}
                type="button"
                onClick={() => select(index)}
                className={`relative aspect-[4/3] rounded-xl sm:rounded-2xl bg-[#f2f0eb] dark:bg-white/5 p-1.5 sm:p-2 overflow-hidden flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-neutral-900 dark:ring-white shadow-xs"
                    : "hover:opacity-85 ring-1 ring-black/5"
                }`}
                title={item.kind === "video" ? "Showcase video" : `${title} view ${index + 1}`}
                aria-pressed={isSelected}
              >
                {item.kind === "video" ? (
                  <>
                    <video
                      src={item.src}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain pointer-events-none"
                      aria-hidden
                    />
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 fill-white" aria-hidden />
                      </span>
                    </span>
                  </>
                ) : (
                  <Image
                    src={item.src}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-contain p-1.5 sm:p-2 pointer-events-none"
                  />
                )}
              </button>
            )
          })}

          {/* "+N more" Button */}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowMoreModal(true)}
              className="aspect-[4/3] rounded-xl sm:rounded-2xl bg-[#f2f0eb] dark:bg-white/5 hover:bg-[#eae8e1] dark:hover:bg-white/10 flex items-center justify-center p-2 text-neutral-800 dark:text-[var(--foreground)] text-[12px] sm:text-[13px] font-semibold transition-colors cursor-pointer ring-1 ring-black/5"
              title={`View all ${media.length} angles`}
            >
              <span>+{hiddenCount} more</span>
            </button>
          )}
        </div>
      )}

      {/* All-angles Lightbox Modal */}
      {showMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Product Gallery • {title}</h3>
              <button
                type="button"
                onClick={() => setShowMoreModal(false)}
                aria-label="Close gallery"
                className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-5">
              {media.map((item, idx) => (
                <div
                  key={`${item.kind}-${item.src}-modal`}
                  onClick={() => {
                    select(idx)
                    setShowMoreModal(false)
                  }}
                  className="bg-[#f2f0eb] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:ring-2 hover:ring-black transition-all"
                >
                  {item.kind === "video" ? (
                    <span className="w-full h-36 flex items-center justify-center">
                      <span className="w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center">
                        <Play className="w-4 h-4 fill-white" aria-hidden />
                      </span>
                    </span>
                  ) : (
                    <Image
                      src={item.src}
                      alt={`${title} angle ${idx + 1}`}
                      width={400}
                      height={400}
                      sizes="300px"
                      className="w-full h-36 object-contain"
                    />
                  )}
                  <span className="text-xs font-medium text-neutral-600 mt-2">
                    {item.kind === "video" ? "Showcase video" : `Angle 0${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
