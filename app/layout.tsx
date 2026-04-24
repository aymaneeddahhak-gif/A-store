import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { TopNav } from "@/components/top-nav"
import { Sidebar } from "@/components/sidebar"

export const metadata: Metadata = {
  title: "FIKRA.LABS — Premium Store",
  description: "Experience the next generation of premium tech and fashion",
  generator: 'v0.app'
}

import { ShopProvider } from "@/contexts/shop-context"

import { QuickViewModal } from "@/components/quick-view-modal"
import { CartDrawer } from "@/components/cart-drawer"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ShopProvider>
          {/* Global SVG Filter — rendered ONCE for all cards */}
          <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
            <defs>
              <filter id="turbulent-displace" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
                <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
                  <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>
                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
                <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
                  <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>
                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="2" />
                <feOffset in="noise1" dx="0" dy="0" result="offsetNoise3">
                  <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>
                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="2" />
                <feOffset in="noise2" dx="0" dy="0" result="offsetNoise4">
                  <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>
                <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
                <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
                <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />
                <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="30" xChannelSelector="R" yChannelSelector="B" />
              </filter>
            </defs>
          </svg>

          {/* Global Modal Overlay */}
          <QuickViewModal />
          {/* Slide-out Cart */}
          <CartDrawer />

          {/* Main Content Wrapper */}
          <div className="relative flex h-screen w-full bg-[radial-gradient(circle_at_center,var(--gradient-color)_0%,transparent_70%)] text-foreground">

            {/* Content */}
            <div className="flex w-full h-full flex-col md:flex-row">
              <div className="w-full md:w-auto z-50">
                <TopNav />
              </div>

              <div className="flex w-full h-full pt-24 pb-4 px-4 gap-4">
                <Sidebar />

                <main className="flex-1 relative rounded-[24px] overflow-y-auto overflow-x-hidden border border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-sm shadow-2xl flex items-start justify-center p-8">
                  {children}
                </main>
              </div>
            </div>
          </div>
        </ShopProvider>
      </body>
    </html>
  )
}
