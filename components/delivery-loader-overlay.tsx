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
 * Global Transition & Async Action Overlay: Shows the Cart Loader smoothly on
 * route transitions (internal links, sidebar/nav clicks, programmatic pushState)
 * and explicit async DB actions (`start-delivery-loading`), without expensive
 * backdrop-blur filters that degrade frame rate.
 */
export function DeliveryLoaderOverlay() {
  const [loading, setLoading] = useState(false)
  const [loaderMessage, setLoaderMessage] = useState("Loading")
  const pathname = usePathname()
  const safetyMsRef = useRef(4000)
  const loadingRef = useRef(false)

  // Dismiss loader cleanly once the target route renders.
  useEffect(() => {
    const timer = setTimeout(() => {
      loadingRef.current = false
      setLoading(false)
    }, 120)
    return () => clearTimeout(timer)
  }, [pathname])

  useEffect(() => {
    const startRouteLoading = (message = "Loading") => {
      if (loadingRef.current) return
      safetyMsRef.current = 4000
      loadingRef.current = true
      setLoaderMessage(message)
      setLoading(true)
    }

    const startExplicitLoading = (message = "Loading") => {
      safetyMsRef.current = 15000
      loadingRef.current = true
      setLoaderMessage(message)
      setLoading(true)
    }

    const handleDocumentClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const target = (e.target as HTMLElement)?.closest("a, button")
      if (!target) return

      const href = target.getAttribute("href")
      if (href && !href.startsWith("#") && !href.startsWith("javascript:") && !href.startsWith("mailto:")) {
        try {
          const parsed = new URL(href, window.location.origin)
          if (
            parsed.origin === window.location.origin &&
            (parsed.pathname !== window.location.pathname || parsed.search !== window.location.search)
          ) {
            startRouteLoading("Loading")
          }
        } catch {}
      }

      if (
        target.hasAttribute("data-loading-trigger") ||
        target.getAttribute("data-action") === "checkout"
      ) {
        startExplicitLoading("Loading")
      }
    }

    // Defer state updates out of Next.js 15's useInsertionEffect call stack.
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
            queueMicrotask(() => startRouteLoading("Loading"))
          }
        } catch {}
      }
      return originalPush(...args)
    }

    const onPopState = () => {
      queueMicrotask(() => startRouteLoading("Loading"))
    }

    const handleCustomStart = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string; label?: string }>
      const text = customEvent.detail?.message || customEvent.detail?.label || "Loading"
      startExplicitLoading(text)
    }

    const handleCustomStop = () => {
      loadingRef.current = false
      setLoading(false)
    }

    document.addEventListener("click", handleDocumentClick, true)
    window.addEventListener("popstate", onPopState)
    window.addEventListener("start-delivery-loading", handleCustomStart)
    window.addEventListener("stop-delivery-loading", handleCustomStop)

    return () => {
      history.pushState = originalPush
      document.removeEventListener("click", handleDocumentClick, true)
      window.removeEventListener("popstate", onPopState)
      window.removeEventListener("start-delivery-loading", handleCustomStart)
      window.removeEventListener("stop-delivery-loading", handleCustomStop)
    }
  }, [])

  // Safety timeout so users are never stuck if an async navigation or DB call drops.
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
      className="fixed inset-0 z-[220] flex items-center justify-center p-4 pointer-events-auto bg-[#faf7f2]/88 dark:bg-[#0b0d11]/88 animate-in fade-in duration-150"
    >
      <CartLoader message={loaderMessage} />
    </div>
  )
}
