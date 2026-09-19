"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/seller/new-design/Sidebar"
import { RailFlyoutPortal, useRailAnchoredFlyout } from "@/components/rail-flyout-portal"
import { useSellerNav } from "@/contexts/providers/seller-nav-context"
import { useThemeContext } from "@/contexts/providers/theme-context"

/**
 * Seller sidebar as a hover flyout — portaled to the body and anchored next
 * to the site rail, so it paints ABOVE the top nav and page content instead
 * of behind them (the old absolute-in-rail version was trapped in the rail's
 * z-30 stacking context). Opens on hover of the rail's Seller row; the rail
 * owns the delayed close (see components/sidebar.tsx) so the mouse can cross
 * the gap without the panel snapping shut.
 */
export function SellerFlyout() {
  const { flyoutOpen, setFlyoutOpen, sellerTab, setSellerTab } = useSellerNav()
  const { isDarkMode } = useThemeContext()
  const router = useRouter()

  const position = useRailAnchoredFlyout(flyoutOpen)

  if (!flyoutOpen) return null

  return (
    <RailFlyoutPortal
      open={flyoutOpen}
      top={position?.top ?? null}
      left={position?.left ?? null}
      label="seller"
      onMouseEnter={() => setFlyoutOpen(true)}
      onMouseLeave={() => setFlyoutOpen(false)}
    >
      <div className="block rounded-[22px] bg-[var(--popover)] shadow-[0_18px_60px_rgba(0,0,0,0.35)] ring-1 ring-[var(--border-color)] overflow-hidden animate-in fade-in slide-in-from-left-2 duration-150">
        <Sidebar
          activeTab={sellerTab}
          onTabChange={(tab) => {
            setSellerTab(tab)
            setFlyoutOpen(false)
            router.push("/seller")
          }}
          isDarkMode={isDarkMode}
        />
      </div>
    </RailFlyoutPortal>
  )
}
