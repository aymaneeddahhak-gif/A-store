"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

/**
 * Positions a hover flyout OUTSIDE the site rail's DOM and stacking context.
 *
 * Why: an `absolute left-full` panel inside the rail's sticky z-30 wrapper can
 * never paint above the fixed top nav (z-50) or above page content that comes
 * later in the stacking order, so the flyout's top strip rendered *behind*
 * the nav/page whenever the page was scrolled. A body-level portal escapes
 * that context entirely and a z-index above the nav wins for real.
 *
 * The panel is anchored to the rail aside's live bounding rect and follows it
 * on scroll/resize, so it stays glued to the rail row while scrolling.
 */

const GAP_PX = 12 // same visual gap the old pl-3 padding created

export function useRailAnchoredFlyout(open: boolean) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }

    const anchor = document.querySelector("aside.floating-sidebar")
    if (!anchor) return

    const update = () => {
      const rect = anchor.getBoundingClientRect()
      setPosition({ top: rect.top, left: rect.right + GAP_PX })
    }

    update()
    // Passive: we only read scroll position, never block it.
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [open])

  return position
}

/**
 * Portal + fixed-position wrapper shared by the rail's hover flyouts.
 * `z-[65]` is load-bearing: among body-level siblings, an explicit z-index
 * wins over DOM order, so the wrapper must sit ABOVE the top nav's z-50
 * wrapper and below the notifications panel (z-[70]) and mobile nav (z-[80]+).
 * Without it the flyout's top strip still painted behind the nav band.
 * `hidden md:block` keeps the desktop-only behavior the old markup had.
 */
export function RailFlyoutPortal({
  open,
  top,
  left,
  label,
  onMouseEnter,
  onMouseLeave,
  children,
}: {
  open: boolean
  top: number | null
  left: number | null
  /** Stable identifier for tests/probes (data-rail-flyout="..."). */
  label?: string
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  children: React.ReactNode
}) {
  if (!open || top === null || left === null) return null

  return createPortal(
    <div
      data-rail-flyout={label}
      className="fixed z-[65] hidden md:block"
      style={{ top, left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
    ,
    document.body
  )
}
