"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

/**
 * Card media — still image by default, crossfading to the showcase clip while
 * the card is hovered (the clip auto-plays on hover).
 *
 * The <video> element is only mounted after the first activation, so a grid
 * of cards costs zero video requests on load. Once mounted it stays mounted
 * (metadata is already cached) and subsequent activations only play/pause.
 * `videoOnly` skips the still image entirely (hero center card): the clip is
 * mounted on first paint when `active` starts true, so it plays the moment
 * the card arrives instead of flashing the image first.
 * `fallbackToImage` pairs with `videoOnly` to keep the product photo visible
 * underneath the clip until the first frame is actually decodable — a freshly
 * mounted video paints nothing (transparent) while buffering, so without the
 * image behind it the card flashes blank.
 */
export function CardMedia({
  image,
  video,
  alt,
  active,
  sizes,
  priority = false,
  videoOnly = false,
  eagerVideo = false,
  fallbackToImage = false,
}: {
  image: string
  video: string | null
  alt: string
  active: boolean
  sizes: string
  priority?: boolean
  videoOnly?: boolean
  eagerVideo?: boolean
  fallbackToImage?: boolean
}) {
  const reducedMotion = useReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  const enabled = Boolean(video) && !reducedMotion

  // Mount the clip immediately when the card arrives already active (hero
  // center) instead of waiting one frame for the effect below.
  const [mounted, setMounted] = useState(active && enabled)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!enabled || videoOnly) return
    if (active) {
      setMounted(true)
      return
    }
    if (!mounted) return
    const timer = window.setTimeout(() => {
      setMounted(false)
      setPlaying(false)
    }, 450)
    return () => window.clearTimeout(timer)
  }, [active, enabled, mounted, videoOnly])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !enabled) return

    if (active) {
      // play() rejects when the browser blocks autoplay or the hover ends
      // before the promise settles — neither is an error worth surfacing.
      void el.play().catch(() => {})
      return
    }

    el.pause()
    el.currentTime = 0
    setPlaying(false)
  }, [active, enabled, mounted])

  // Whether the still image shows through: always for the non-videoOnly path,
  // and for videoOnly cards until the first frame is ready to paint.
  const showImage = !videoOnly || (fallbackToImage && !playing)

  // Keep centered contain display specifically for the new studio laptop & umbrella
  const isCenteredProduct =
    alt.toLowerCase().includes("laptop") ||
    alt.toLowerCase().includes("studio pro") ||
    alt.toLowerCase().includes("umbrella") ||
    image.includes("laptop") ||
    image.includes("umbrella")

  const imageFittingCls = isCenteredProduct
    ? "object-contain object-center p-3 sm:p-4"
    : "object-cover object-center"

  return (
    <>
      {(showImage || !videoOnly) && (
        <Image
          src={image}
          alt={alt}
          fill
          className={`${imageFittingCls} transition-opacity duration-500 ${
            playing ? "opacity-0" : "opacity-100"
          }`}
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
      )}

      {mounted && video && (
        <video
          key={video}
          ref={videoRef}
          src={video}
          poster={image}
          muted
          loop
          playsInline
          autoPlay
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload noplaybackrate noremoteplayback"
          preload={eagerVideo ? "auto" : "metadata"}
          aria-hidden
          tabIndex={-1}
          onContextMenu={(e) => e.preventDefault()}
          onPlaying={() => setPlaying(true)}
          className={`pointer-events-none select-none absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ${
            videoOnly || playing ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </>
  )
}
