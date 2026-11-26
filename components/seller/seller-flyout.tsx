"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar } from "@/components/seller/new-design/Sidebar"
import { RailFlyoutPortal, useRailAnchoredFlyout } from "@/components/rail-flyout-portal"
import { useSellerNav } from "@/contexts/providers/seller-nav-context"
import { useThemeContext } from "@/contexts/providers/theme-context"

/**
 * Seller sidebar flyout — opens on hover over the rail's Seller button,
 * stays open while the pointer is inside the flyout, and routes straight to
 * `/seller` (or `/login?next=/seller&reason=seller` when logged out).
 */
export function SellerFlyout() {
  const {
    flyoutOpen,
    setFlyoutOpen,
    cancelCloseFlyout,
    scheduleCloseFlyout,
    sellerTab,
    setSellerTab,
  } = useSellerNav()
  const { isDarkMode } = useThemeContext()
  const router = useRouter()
  const pathname = usePathname()

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
      {/* Invisible left bridge (-ml-3 pl-3) keeps hover continuous between sidebar and flyout */}
      <div
        className="-ml-3 pl-3"
        onMouseEnter={cancelCloseFlyout}
        onMouseLeave={scheduleCloseFlyout}
      >
        <div className="block rounded-[22px] bg-[var(--popover)] shadow-[0_18px_60px_rgba(0,0,0,0.35)] ring-1 ring-[var(--border-color)] overflow-hidden animate-in fade-in slide-in-from-left-2 duration-150">
          <Sidebar
            activeTab={sellerTab}
            onTabChange={(tab) => {
              setSellerTab(tab)
              setFlyoutOpen(false)
              if (pathname !== "/seller") {
                router.push("/seller")
              }
            }}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </RailFlyoutPortal>
  )
}
