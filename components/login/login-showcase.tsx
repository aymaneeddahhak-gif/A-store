"use client"

import { useEffect, useRef } from "react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

/**
 * Login Mascot Showcase:
 * Plays the background-free transparent WebM exported from
 * `public/videos/mascot/login.mp4`, auto-playing and looping reliably even
 * after switching browser tabs or returning from another application window.
 */
export function LoginShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (reducedMotion) {
      video.pause()
      return
    }

    const ensurePlaying = () => {
      if (document.hidden) return
      video.muted = true
      if (video.ended || (Number.isFinite(video.duration) && video.duration > 0 && video.currentTime >= video.duration - 0.05)) {
        video.currentTime = 0
      }
      if (video.paused) {
        void video.play().catch(() => {})
      }
    }

    const handleEnded = () => {
      video.currentTime = 0
      void video.play().catch(() => {})
    }

    const handlePause = () => {
      // Chromium sometimes pauses background/looping videos when switching windows;
      // resume immediately whenever the page is visible.
      if (!document.hidden) {
        window.setTimeout(ensurePlaying, 60)
      }
    }

    const handleVisibility = () => {
      if (!document.hidden) {
        ensurePlaying()
      }
    }

    const handleFocus = () => {
      ensurePlaying()
    }

    // Kick off immediately + keep alive across tab/window switches and stalls
    ensurePlaying()
    video.addEventListener("ended", handleEnded)
    video.addEventListener("pause", handlePause)
    video.addEventListener("stalled", ensurePlaying)
    video.addEventListener("canplay", ensurePlaying)
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("focus", handleFocus)
    window.addEventListener("pageshow", handleFocus)

    const watchdog = window.setInterval(() => {
      if (!document.hidden && (video.paused || video.ended)) {
        ensurePlaying()
      }
    }, 1200)

    return () => {
      window.clearInterval(watchdog)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("stalled", ensurePlaying)
      video.removeEventListener("canplay", ensurePlaying)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("pageshow", handleFocus)
    }
  }, [reducedMotion])

  return (
    <div className="relative flex items-center justify-center w-full rounded-[20px] overflow-hidden bg-white border border-[#ecedec] dark:border-white/10 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_22px_54px_-12px_rgba(0,0,0,0.55)] select-none pointer-events-none">
      <video
        ref={videoRef}
        src="/videos/mascot/login.mp4"
        poster="/images/mascot/lion-login.png"
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload noplaybackrate noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        preload="auto"
        aria-label="A-Store mascot welcoming you"
        className="w-full h-auto max-h-[760px] object-contain pointer-events-none select-none block"
      />
    </div>
  )
}
