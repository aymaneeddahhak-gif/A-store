"use client"

import React, { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

/**
 * Animated E-Commerce Cart Loader (From Uiverse.io by abhinav_7137)
 *
 * Features falling product icons (mobile, laptop, tablet, headphones, mixer)
 * dropping smoothly into a bouncing shopping cart, with wave animated dots.
 * Clean, transparent design without any card box or background.
 */
export function CartLoader({
  message = "Loading",
}: {
  message?: string
}) {
  return (
    <div
      className="flex flex-col items-center justify-center select-none animate-in fade-in zoom-in-95 duration-200"
      aria-label={message}
    >
      <div className="cart-loader">
        <div className="items-container">
          <div id="item-mobile" className="item" />
          <div id="item-laptop" className="item" />
          <div id="item-tab" className="item" />
          <div id="item-headphone" className="item" />
          <div id="item-mixer" className="item" />
        </div>

        <div id="cart-icon" />
      </div>
      <span className="sr-only">{message}</span>
    </div>
  )
}

/**
 * Global Transition Overlay: Shows the Cart Loader whenever any route or
 * action across the website takes time to load.
 * 
 * Styled with a clean, professional full-screen translucent white shadow/glow
 * backdrop (zero card background or border around the loader itself).
 */
export function DeliveryLoaderOverlay() {
  const [loading, setLoading] = useState(false)
  const [loaderMessage, setLoaderMessage] = useState("Loading")
  const pathname = usePathname()
  const delayTimerRef = useRef<number | null>(null)
  const safetyMsRef = useRef<number>(3500)
  const loadingRef = useRef(false)

  // Dismiss loader (and cancel any delayed route loader) once the route renders
  useEffect(() => {
    if (delayTimerRef.current !== null) {
      window.clearTimeout(delayTimerRef.current)
      delayTimerRef.current = null
    }
    const timer = setTimeout(() => {
      loadingRef.current = false
      setLoading(false)
    }, 120)
    return () => clearTimeout(timer)
  }, [pathname])

  // Global listener for navigation clicks and custom triggers
  useEffect(() => {
    const clearDelay = () => {
      if (delayTimerRef.current !== null) {
        window.clearTimeout(delayTimerRef.current)
        delayTimerRef.current = null
      }
    }

    const scheduleRouteLoading = (message = "Loading") => {
      // Never shorten an active explicit async/DB loader (e.g., Sign In -> redirect)
      if (loadingRef.current) return
      clearDelay()
      safetyMsRef.current = 3500
      delayTimerRef.current = window.setTimeout(() => {
        loadingRef.current = true
        setLoaderMessage(message)
        setLoading(true)
        delayTimerRef.current = null
      }, 220)
    }

    const startImmediateLoading = (message = "Loading", safetyMs = 15000) => {
      clearDelay()
      safetyMsRef.current = safetyMs
      loadingRef.current = true
      setLoaderMessage(message)
      setLoading(true)
    }

    const stopAllLoading = () => {
      clearDelay()
      loadingRef.current = false
      setLoading(false)
    }

    const handleDocumentClick = (e: MouseEvent) => {
      // Don't intercept modified clicks (Cmd/Ctrl + click opens new tab)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const target = (e.target as HTMLElement)?.closest("a, button")
      if (!target) return

      // 1. Check for link navigation (wait 220ms so instant navigations never flash an overlay)
      const href = target.getAttribute("href")
      if (href && !href.startsWith("#") && !href.startsWith("javascript:") && !href.startsWith("mailto:")) {
        try {
          const parsed = new URL(href, window.location.origin)
          // Internal link to a different path or query
          if (
            parsed.origin === window.location.origin &&
            (parsed.pathname !== window.location.pathname || parsed.search !== window.location.search)
          ) {
            scheduleRouteLoading("Loading")
          }
        } catch {}
      }

      // 2. Check for button triggers that initiate async operations
      if (
        target.hasAttribute("data-loading-trigger") ||
        target.getAttribute("data-action") === "checkout"
      ) {
        startImmediateLoading("Loading", 15000)
      }
    }

    // 3. Intercept history.pushState so slow programmatic navigations show loader after 220ms.
    // Next.js 15 invokes history.pushState inside React's useInsertionEffect, where
    // scheduling synchronous state updates crashes React ("useInsertionEffect must not
    // schedule updates"). Always defer via queueMicrotask and never block originalPush.
    const originalPush = history.pushState.bind(history)
    history.pushState = (...args: Parameters<typeof originalPush>) => {
      const urlArg = args[2] ? String(args[2]) : ""
      if (urlArg) {
        try {
          const parsed = new URL(urlArg, window.location.origin)
          if (
            parsed.pathname !== window.location.pathname ||
            parsed.search !== window.location.search
          ) {
            queueMicrotask(() => {
              scheduleRouteLoading("Loading")
            })
          }
        } catch {}
      }
      return originalPush(...args)
    }

    const onPopState = () => {
      queueMicrotask(() => {
        scheduleRouteLoading("Loading")
      })
    }

    const handleCustomStart = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string; label?: string }>
      const text = customEvent.detail?.message || customEvent.detail?.label || "Loading"
      startImmediateLoading(text, 15000)
    }

    const handleCustomStop = () => {
      stopAllLoading()
    }

    document.addEventListener("click", handleDocumentClick, true)
    window.addEventListener("popstate", onPopState)
    window.addEventListener("start-delivery-loading", handleCustomStart)
    window.addEventListener("stop-delivery-loading", handleCustomStop)

    return () => {
      clearDelay()
      history.pushState = originalPush
      document.removeEventListener("click", handleDocumentClick, true)
      window.removeEventListener("popstate", onPopState)
      window.removeEventListener("start-delivery-loading", handleCustomStart)
      window.removeEventListener("stop-delivery-loading", handleCustomStop)
    }
  }, [])

  // Auto-dismiss safety timeout so user is never stuck (3.5s routes / 15s explicit DB auth)
  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => {
      loadingRef.current = false
      setLoading(false)
    }, safetyMsRef.current)
    return () => clearTimeout(timer)
  }, [loading])

  if (!loading) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[220] flex items-center justify-center p-4 transition-opacity duration-300 pointer-events-auto bg-white/75 dark:bg-black/65 backdrop-blur-md shadow-[inset_0_0_120px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_0_120px_rgba(255,255,255,0.06)] animate-in fade-in"
    >
      <CartLoader message={loaderMessage} />
    </div>
  )
}
