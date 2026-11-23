"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/seller/new-design/Sidebar"
import { RailFlyoutPortal, useRailAnchoredFlyout } from "@/components/rail-flyout-portal"
import { useSellerNav } from "@/contexts/providers/seller-nav-context"
import { useThemeContext } from "@/contexts/providers/theme-context"
import { useAuth } from "@/contexts/providers/auth-context"

/**
 * Seller sidebar flyout — opens on click of the rail's Seller button, aligned
 * vertically with that button, and stays pinned until clicking outside or
 * pressing Escape. Selecting any tab routes directly to `/seller` (or guides
 * unauthenticated users straight to `/login?next=/seller`).
 */
export function SellerFlyout() {
  const { flyoutOpen, setFlyoutOpen, sellerTab, setSellerTab } = useSellerNav()
  const { isDarkMode } = useThemeContext()
  const { user } = useAuth()
  const router = useRouter()

  const position = useRailAnchoredFlyout(flyoutOpen)

  useEffect(() => {
    if (!flyoutOpen) return

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('[data-rail-flyout="seller"]')) return
      if (target.closest("[data-seller-trigger]")) return
      setFlyoutOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFlyoutOpen(false)
    }

    document.addEventListener("mousedown", onMouseDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onMouseDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [flyoutOpen, setFlyoutOpen])

  if (!flyoutOpen) return null

  return (
    <RailFlyoutPortal
      open={flyoutOpen}
      top={position?.top ?? null}
      left={position?.left ?? null}
      label="seller"
    >
      <div className="block rounded-[22px] bg-[var(--popover)] shadow-[0_18px_60px_rgba(0,0,0,0.35)] ring-1 ring-[var(--border-color)] overflow-hidden animate-in fade-in slide-in-from-left-2 duration-150">
        <Sidebar
          activeTab={sellerTab}
          onTabChange={(tab) => {
            setSellerTab(tab)
            setFlyoutOpen(false)
            if (!user) {
              router.push("/seller")
              return
            }
            router.push("/seller")
          }}
          isDarkMode={isDarkMode}
        />
      </div>
    </RailFlyoutPortal>
  )
}
