"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

const GAP_PX = 12
const ESTIMATED_FLYOUT_HEIGHT = 380

export function useRailAnchoredFlyout(open: boolean) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }

    const rail = document.querySelector("aside.floating-sidebar")
    const trigger = document.querySelector("[data-seller-trigger]") ?? rail
    if (!rail || !trigger) return

    const update = () => {
      const railRect = rail.getBoundingClientRect()
      const triggerRect = trigger.getBoundingClientRect()
      const maxTop = Math.max(16, window.innerHeight - ESTIMATED_FLYOUT_HEIGHT - 16)
      const top = Math.max(16, Math.min(triggerRect.top, maxTop))
      setPosition({ top, left: railRect.right + GAP_PX })
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [open])

  return position
}

export function RailFlyoutPortal({
  open,
  top,
  left,
  label,
  children,
}: {
  open: boolean
  top: number | null
  left: number | null
  label?: string
  children: React.ReactNode
}) {
  if (!open || top === null || left === null) return null

  return createPortal(
    <div
      data-rail-flyout={label}
      className="fixed z-[65] hidden md:block"
      style={{ top, left }}
    >
      {children}
    </div>,
    document.body
  )
}
