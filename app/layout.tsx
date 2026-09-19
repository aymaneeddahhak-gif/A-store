import type React from "react"
import type { Metadata, Viewport } from "next"
import { Syne, IBM_Plex_Sans } from "next/font/google"
import "./globals.css"
import { TopNav } from "@/components/top-nav"
import { Sidebar } from "@/components/sidebar"
import { SiteFooter } from "@/components/site-footer"
import { Providers } from "@/contexts/providers"
import { QuickViewModal } from "@/components/quick-view-modal"
import { CartDrawer } from "@/components/cart-drawer"
import { NotificationPanel } from "@/components/notification-panel"
import { NavigationProgress } from "@/components/navigation-progress"
import Chatbot from "@/components/chatbot"
import { listStoreProducts } from "@/lib/queries/products"
import type { Product } from "@/lib/types"

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
    default: "A-store",
    template: "%s | A-store",
  },
  description:
    "A-store — premium tech and fashion e-commerce, curated products, seamless checkout, and seller tools.",
  keywords: ["e-commerce", "premium store", "electronics", "fashion"],
  authors: [{ name: "A-store" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "A-store",
    title: "A-store",
    description: "Premium tech and fashion e-commerce experience.",
    images: [{ url: "/images/logo/logotrsnprt.png", width: 896, height: 1200, alt: "A-store" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "A-store",
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

/**
 * Applies the stored theme before first paint. Without this the page renders
 * with the default palette for a frame and then snaps — visible as a flash on
 * every reload.
 *
 * Injected via dangerouslySetInnerHTML because it must run synchronously in
 * <head>. The string is a fixed literal with no interpolation, so there is no
 * injection surface; keep it that way if it is ever edited.
 */
const THEME_INIT_SCRIPT = `try{var d=document.documentElement,t=localStorage.getItem("theme");d.classList.toggle("dark",t!=="light")}catch(e){}`

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The catalog read is started immediately but never awaited: the shell
  // (nav, sidebar, route skeletons) renders and streams right away while
  // Supabase responds in parallel. Awaiting here used to hold EVERY route —
  // login, profile, seller — hostage to the database round trip.
  // Retry-once-on-empty: during a cold dev compile the first read can lose
  // the race against the render and resolve [] — without this the storefront
  // would seed an empty catalog and never recover until a mutation.
  async function catalogWithRetry(): Promise<Product[]> {
    const first = await listStoreProducts()
    if (first.length > 0) return first
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return listStoreProducts()
  }
  const initialProductsPromise = catalogWithRetry()
  // Eagerly kick the read so the DB round trip overlaps with compile/HTML
  // streaming instead of starting when the client CatalogSeed mounts.
  void initialProductsPromise

  return (
    <html lang="en" className={`${syne.variable} ${ibmPlex.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-body antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-xl focus:bg-[var(--foreground)] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[var(--background)]"
        >
          Skip to content
        </a>
        <Providers initialProductsPromise={initialProductsPromise}>
          <NavigationProgress />
          <QuickViewModal />
          <CartDrawer />
          <NotificationPanel />
          <Chatbot />

          <div className="relative flex min-h-screen w-full bg-[radial-gradient(circle_at_center,var(--gradient-color)_0%,transparent_70%)] text-foreground">
              <div className="flex w-full flex-col min-h-screen">
                <div className="w-full z-50">
                  <TopNav />
                </div>

                <div className="flex w-full flex-1 pt-[96px] sm:pt-[120px] lg:pt-[136px] pb-12 px-4 gap-6">
                  {/* Left rail: slim sidebar pinned to the screen edge (logo lives in the top nav).
                      No overflow clipping — the seller/profile flyouts open OUTSIDE the rail. */}
                  <div className="hidden md:flex flex-col items-center gap-5 sticky top-32 z-30 self-start overflow-visible -ml-4">
                    <Sidebar />
                  </div>

                  <main id="main-content" className="flex-1 relative min-w-0 isolate">
                    {children}
                  </main>
                </div>

                <SiteFooter />
              </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
