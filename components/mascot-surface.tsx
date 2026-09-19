"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

type MascotVariant = "loading" | "ambient" | "emblem" | "showcase" | "checkout"

export type MascotReaction = "search" | "cart" | "checkout"

let lastPokeAt = 0

/**
 * Fire-and-forget signal that makes every mounted mascot play a short
 * reaction animation. Throttled so rapid triggers (typing in search)
 * don't restart the animation into jitter; pass minGapMs=0 to force.
 */
export function pokeMascot(reaction: MascotReaction, minGapMs = 900) {
  if (typeof window === "undefined") return
  const now = Date.now()
  if (now - lastPokeAt < minGapMs) return
  lastPokeAt = now
  window.dispatchEvent(new CustomEvent<MascotReaction>("mascot:react", { detail: reaction }))
}

type MascotSurfaceProps = {
  /** Primary video source. Pair with fallbackSrc so codecs degrade gracefully. */
  src: string
  /** Secondary source for browsers that can't decode the primary (e.g. WebM → MP4). */
  fallbackSrc?: string
  alt: string
  variant?: MascotVariant
  className?: string
  priority?: boolean
  playDelayMs?: number
}

function videoMime(src: string) {
  if (src.endsWith(".webm")) return "video/webm"
  if (src.endsWith(".ogg") || src.endsWith(".ogv")) return "video/ogg"
  return "video/mp4"
}

/**
 * A video-backed brand character rather than a video player. The surrounding
 * surface supplies depth, lighting and a theme-aware material treatment so it
 * feels integrated with the interface in both color modes.
 */
export function MascotSurface({
  src,
  fallbackSrc,
  alt,
  variant = "ambient",
  className = "",
  priority = false,
  playDelayMs = 0,
}: MascotSurfaceProps) {
  const reducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [shouldLoad, setShouldLoad] = useState(priority)
  const [isReady, setIsReady] = useState(false)
  const [reaction, setReaction] = useState<MascotReaction | null>(null)

  useEffect(() => {
    if (reducedMotion) return
    let timer: number | undefined
    const onReact = (e: Event) => {
      const detail = (e as CustomEvent<MascotReaction>).detail
      // Drop and re-add the class on the next frame so a repeat reaction
      // restarts its CSS animation instead of being ignored.
      setReaction(null)
      requestAnimationFrame(() => setReaction(detail))
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setReaction(null), 1200)
    }
    window.addEventListener("mascot:react", onReact)
    return () => {
      window.removeEventListener("mascot:react", onReact)
      window.clearTimeout(timer)
    }
  }, [reducedMotion])

  useEffect(() => {
    if (priority || !containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: "240px" }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [priority])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !shouldLoad || reducedMotion) return
    const playbackTimer = window.setTimeout(() => {
      void video.play().catch(() => {})
    }, playDelayMs)
    return () => window.clearTimeout(playbackTimer)
  }, [playDelayMs, reducedMotion, shouldLoad])

  return (
    <div
      ref={containerRef}
      className={`mascot-surface mascot-surface--${variant} ${isReady ? "is-ready" : ""} ${reaction ? `is-reacting is-reacting--${reaction}` : ""} ${className}`}
      role="img"
      aria-label={alt}
    >
      <div className="mascot-surface__aura" aria-hidden />
      <div className="mascot-surface__halo" aria-hidden />
      <video
        ref={videoRef}
        className="mascot-surface__video"
        muted
        loop
        playsInline
        controls={false}
        preload={priority ? "metadata" : "none"}
        onCanPlay={() => setIsReady(true)}
      >
        {shouldLoad && (
          <>
            <source src={src} type={videoMime(src)} />
            {fallbackSrc && <source src={fallbackSrc} type={videoMime(fallbackSrc)} />}
          </>
        )}
      </video>
      <div className="mascot-surface__sheen" aria-hidden />
    </div>
  )
}
