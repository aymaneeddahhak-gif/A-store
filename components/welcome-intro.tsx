"use client"

import { useEffect, useState, useRef } from "react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

export default function WelcomeIntro() {
  const reducedMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(0)
  const bgVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const dismissed = sessionStorage.getItem("welcome_dismissed")
    if (dismissed === "true" || reducedMotion) {
      return
    }
    setIsVisible(true)
    document.body.style.overflow = "hidden"

    const duration = reducedMotion ? 0 : 2200
    if (duration === 0) {
      handleEnter()
      return
    }

    const intervalTime = 30
    const step = 100 / (duration / intervalTime)
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          handleEnter()
          return 100
        }
        return Math.min(100, prev + step)
      })
    }, intervalTime)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion])

  useEffect(() => {
    if (isVisible && bgVideoRef.current) {
      bgVideoRef.current.play().catch(() => {})
    }
  }, [isVisible])

  const handleEnter = () => {
    setIsExiting(true)
    document.body.style.overflow = ""
    setTimeout(() => {
      setIsVisible(false)
      sessionStorage.setItem("welcome_dismissed", "true")
    }, reducedMotion ? 0 : 500)
  }

  if (!isVisible) return null

  return (
    <div
      onClick={handleEnter}
      onKeyDown={(e) => e.key === "Enter" && handleEnter()}
      role="dialog"
      aria-label="Welcome"
      tabIndex={0}
      className={`fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center overflow-hidden transition-all duration-500 ease-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        isExiting ? "opacity-0 scale-[1.02] pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      <video
        ref={bgVideoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="/icon.svg"
        className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
        src="/videos/welcome.mp4"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(5,5,5,0.3)_0%,#050505_85%)] pointer-events-none" />

      <div
        className={`relative z-10 max-w-lg w-full px-6 flex flex-col items-center text-center transition-all duration-500 ${
          isExiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        <p className="text-[10px] font-semibold text-neutral-400 tracking-[0.2em] uppercase mb-6">
          JUST SHOP
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
          Premium shopping, refined
        </h1>
        <p className="text-sm text-neutral-400 max-w-sm mb-10 leading-relaxed">
          Curated tech and fashion with a seamless checkout experience.
        </p>

        <div className="w-full max-w-xs flex flex-col gap-2">
          <div className="flex justify-between text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
            <span>Loading</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-75 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleEnter()
            }}
            className="mt-6 text-xs font-semibold text-white/80 hover:text-white underline underline-offset-4 transition-colors"
          >
            Enter store
          </button>
        </div>
      </div>
    </div>
  )
}
