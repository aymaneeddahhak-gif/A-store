"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

/**
 * Login Mascot Showcase:
 * Displays the store lion mascot @[public/videos/mascot/login.mp4] standing
 * beside the login card at large scale (matching the form height), with ZERO
 * background (chroma-keyed canvas in real time + transparent poster fallback).
 */
export function LoginShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    let animId: number
    let isRunning = true

    const render = () => {
      if (!isRunning) return

      if (video.readyState >= 2 && !video.paused) {
        if (!videoReady) setVideoReady(true)
        const w = canvas.width
        const h = canvas.height
        ctx.clearRect(0, 0, w, h)
        ctx.drawImage(video, 0, 0, w, h)
        const frame = ctx.getImageData(0, 0, w, h)
        const data = frame.data
        const len = data.length

        for (let i = 0; i < len; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const bright = (r + g + b) / 3
          const sat = Math.max(r, g, b) - Math.min(r, g, b)

          // Background chroma keying: neutral studio backdrop
          if (bright > 214 && sat < 24) {
            data[i + 3] = 0
          } else if (bright > 196 && sat < 18) {
            data[i + 3] = Math.max(0, Math.min(255, Math.floor(255 * (1 - (bright - 196) / 18))))
          }
        }
        ctx.putImageData(frame, 0, 0)
      }

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      isRunning = false
      cancelAnimationFrame(animId)
    }
  }, [videoReady])

  return (
    <div className="relative flex items-center justify-center w-full h-full select-none pointer-events-none">
      {/* Hidden source video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="sr-only"
        aria-hidden
      >
        <source src="/videos/mascot/login.webm" type="video/webm" />
        <source src="/videos/mascot/login.mp4" type="video/mp4" />
      </video>

      {/* Immediate crisp transparent poster while video boots */}
      {!videoReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/images/mascot/lion-login.png"
            alt="Store Mascot"
            width={480}
            height={540}
            priority
            className="h-full w-auto max-h-[500px] object-contain drop-shadow-2xl"
          />
        </div>
      )}

      {/* Real-time background-free animated canvas */}
      <canvas
        ref={canvasRef}
        width={480}
        height={540}
        aria-label="A-Store mascot welcoming you"
        className={`w-auto h-full max-h-[500px] object-contain drop-shadow-2xl transition-opacity duration-300 ${
          videoReady ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  )
}
