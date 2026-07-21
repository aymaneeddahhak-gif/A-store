import type React from "react"
import type { Metadata, Viewport } from "next"
import { Syne, IBM_Plex_Sans } from "next/font/google"
import "./globals.css"
import { TopNav } from "@/components/top-nav"
import { Sidebar } from "@/components/sidebar"
import WelcomeIntro from "@/components/welcome-intro"
import { Providers } from "@/contexts/providers"
import { QuickViewModal } from "@/components/quick-view-modal"
import { CartDrawer } from "@/components/cart-drawer"
import { NotificationPanel } from "@/components/notification-panel"
import Chatbot from "@/components/chatbot"
import { listProducts } from "@/lib/queries/products"

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://justshop.example.com"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JUST SHOP — Premium Store",
    template: "%s | JUST SHOP",
  },
  description:
    "Premium tech and fashion e-commerce — curated products, seamless checkout, and seller tools.",
  keywords: ["e-commerce", "premium store", "electronics", "fashion"],
  authors: [{ name: "JUST SHOP" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "JUST SHOP",
    title: "JUST SHOP — Premium Store",
    description: "Premium tech and fashion e-commerce experience.",
  },
  twitter: {
    card: "summary_large_image",
    title: "JUST SHOP — Premium Store",
    description: "Premium tech and fashion e-commerce experience.",
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e0e0e0" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialProducts = await listProducts()

  return (
    <html lang="en" className={`${syne.variable} ${ibmPlex.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased">
        <Providers initialProducts={initialProducts}>
          <WelcomeIntro />
          <QuickViewModal />
          <CartDrawer />
          <NotificationPanel />
          <Chatbot />

          <div className="relative flex min-h-screen w-full bg-[radial-gradient(circle_at_center,var(--gradient-color)_0%,transparent_70%)] text-foreground">
            <div className="flex w-full flex-col">
              <div className="w-full z-50">
                <TopNav />
              </div>

              <div className="flex w-full pt-24 pb-12 px-4 gap-6">
                <div className="hidden md:block sticky top-24 h-fit">
                  <Sidebar />
                </div>

                <main id="main-content" className="flex-1 relative">
                  {children}
                </main>
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
