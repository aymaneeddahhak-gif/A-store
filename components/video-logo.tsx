"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

/**
 * Animated brand logo. The transparent WebM plays in Chromium and
 * Firefox; browsers that can't decode it keep the static PNG poster instead,
 * so the header never renders empty.
 *
 * The transparent WebM is the logo — the PNG is only a fallback poster.
 * No plate in light mode (transparency shows through); dark mode keeps a
 * dark plate so the surrounding chrome blends with the theme.
 */
export function VideoLogo({
  className = "",
  videoClassName = "h-16 sm:h-20 lg:h-24",
}: {
  className?: string
  videoClassName?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (reducedMotion) {
      video.pause()
    } else {
      void video.play().catch(() => {})
    }
  }, [reducedMotion])

  return (
    <Link
      href="/"
      className={`inline-flex items-center group select-none rounded-2xl px-1 py-0.5 ${className}`}
      aria-label="A-store home"
    >
      <video
        ref={videoRef}
        src="/videos/mascot/LOogovideo.webm"
        poster="/images/logo/logotrsnprt.png"
        muted
        loop
        playsInline
        autoPlay
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload noplaybackrate noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        preload="metadata"
        aria-hidden
        className={`${videoClassName} w-auto aspect-video object-cover transition-transform duration-500 ease-out group-hover:scale-105 pointer-events-none select-none`}
      />
    </Link>
  )
}
