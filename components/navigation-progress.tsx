"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

/**
 * Facebook-style top progress bar. Every client-side navigation (Link clicks,
 * router.push, back/forward) slides an indeterminate bar across the top edge
 * while the next route loads, so slow navigations read as loading instead of
 * lag. App Router has no router events, so navigation starts are detected by
 * wrapping history.pushState — the same technique nextjs-toploader uses.
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const [phase, setPhase] = useState<"hidden" | "running" | "done">("hidden")
  const safetyTimer = useRef<number | undefined>(undefined)
  // Instant navigations would flash the bar for a single frame — hold it for
  // a beat so it always reads as a loading indicator.
  const startedAt = useRef(0)
  const start = () => {
    startedAt.current = Date.now()
    // Next fires history.pushState internally from inside useInsertionEffect;
    // setting state synchronously in that call stack crashes React
    // ("useInsertionEffect must not schedule updates"), so the bar starts on
    // a microtask instead — still before the next paint.
    queueMicrotask(() => {
      setPhase((prev) => (prev === "hidden" ? "running" : prev))
    })
    window.clearTimeout(safetyTimer.current)
    safetyTimer.current = window.setTimeout(() => {
      setPhase((prev) => (prev === "running" ? "done" : prev))
    }, 4000)
  }

  // The pathname committing means the navigation finished rendering.
  useEffect(() => {
    setPhase((prev) => (prev === "running" ? "done" : prev))
  }, [pathname])

  useEffect(() => {
    if (phase !== "done") return
    const elapsed = Date.now() - startedAt.current
    const visibleFor = 450 + Math.max(0, 600 - elapsed)
    const t = window.setTimeout(() => setPhase("hidden"), visibleFor)
    return () => window.clearTimeout(t)
  }, [phase])

  useEffect(() => {
    const originalPush = history.pushState.bind(history)
    history.pushState = (...args: Parameters<typeof originalPush>) => {
      start()
      return originalPush(...args)
    }
    window.addEventListener("popstate", start)
    return () => {
      history.pushState = originalPush
      window.removeEventListener("popstate", start)
      window.clearTimeout(safetyTimer.current)
    }
  }, [])

  if (phase === "hidden") return null

  return (
    <div className="nav-progress" role="progressbar" aria-label="Loading page">
      <div
        className={`nav-progress__bar ${
          phase === "running" ? "nav-progress__bar--running" : "nav-progress__bar--done"
        }`}
      />
    </div>
  )
}
