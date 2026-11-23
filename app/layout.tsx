import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { TopNav } from "@/components/top-nav"
import { Sidebar } from "@/components/sidebar"
import { SiteFooter } from "@/components/site-footer"
import { Providers } from "@/contexts/providers"
import { GlobalOverlays } from "@/components/global-overlays"
import { NavigationProgress } from "@/components/navigation-progress"
import { listStoreProducts } from "@/lib/queries/products"
import { SITE_URL } from "@/lib/site"

const siteUrl = SITE_URL

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

const THEME_INIT_SCRIPT = `try{var d=document.documentElement,t=localStorage.getItem("theme");d.classList.toggle("dark",t==="dark")}catch(e){}`

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialProductsPromise = listStoreProducts()
  void initialProductsPromise

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />
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
          <GlobalOverlays />

          <div className="relative flex min-h-screen w-full bg-[radial-gradient(circle_at_center,var(--gradient-color)_0%,transparent_70%)] text-foreground">
            <div className="flex w-full flex-col min-h-screen">
              <div className="w-full z-50">
                <TopNav />
              </div>

              <div className="flex w-full flex-1 pt-[96px] sm:pt-[120px] lg:pt-[136px] pb-12 px-4 gap-6">
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
