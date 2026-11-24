"use client"

import React, { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { PackageSearch } from "lucide-react"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { useLikes } from "@/contexts/providers/likes-context"
import { useCart } from "@/contexts/providers/cart-context"
import type { FilterState, SortBy } from "@/lib/storefront/types"
import type { DealsPopupConfig } from "@/lib/actions/deals-popup"
import { FilterCapsulesBar } from "@/components/storefront/filter-capsules-bar"
import { HeroShowcase } from "@/components/storefront/hero-showcase"
import { ProductCard } from "@/components/storefront/product-card"
import { toStorefrontProduct } from "@/components/storefront/product-adapter"
import { CartLoader } from "@/components/delivery-loader-overlay"

const FilterDrawer = dynamic(
  () => import("@/components/storefront/filter-drawer").then((m) => m.FilterDrawer),
  { ssr: false }
)

const DealsPopup = dynamic(
  () => import("@/components/storefront/deals-popup").then((m) => m.DealsPopup),
  { ssr: false }
)

const DEFAULT_FILTERS = {
  maxPrice: 8000,
  badgeOnly: false,
  sortBy: "featured" as SortBy,
}

/**
 * Storefront home — moving hero showcase, filter capsules bar, and the
 * catalog grid (one continuous page background, no section bands). Category
 * and search live in the catalog context (shared with the top nav, sidebar,
 * and mobile nav); sort and deal toggles are local to this page.
 */
export function StoreFront({ initialDealsConfig }: { initialDealsConfig?: DealsPopupConfig }) {
  const router = useRouter()
  const { products, selectedCategory, setCategory, searchQuery, setSearchQuery, categories } = useCatalog()
  const { likedProducts, toggleLike } = useLikes()
  const { addToCart } = useCart()

  // The moving hero only belongs on the unfiltered storefront. As soon as a
  // category or a search is active, it steps aside for a category header so
  // results start at the top of the page.
  const trimmedQuery = searchQuery.trim()
  const isFiltering = selectedCategory !== "all" || trimmedQuery !== ""
  const categoryLabel =
    categories.find((c) => c.id === selectedCategory)?.label ?? selectedCategory
  const resultsHeading = trimmedQuery
    ? `Results for “${trimmedQuery}”`
    : selectedCategory === "all"
      ? "All Products"
      : categoryLabel

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortBy>("featured")
  const [freeShippingOnly, setFreeShippingOnly] = useState(false)
  const [topOrdersOnly, setTopOrdersOnly] = useState(false)
  const [dealsOnly, setDealsOnly] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  // Entry popup shows once per session so returning to "/" does not re-block the user.
  const [dealsOpen, setDealsOpen] = useState(false)
  React.useEffect(() => {
    try {
      if (!window.sessionStorage.getItem("astore_deals_dismissed")) {
        setDealsOpen(true)
      }
    } catch {
      setDealsOpen(true)
    }
  }, [])

  const dismissDealsPopup = () => {
    setDealsOpen(false)
    try {
      window.sessionStorage.setItem("astore_deals_dismissed", "1")
    } catch {
      // Ignore storage error
    }
  }
  const [dealsConfig] = useState<DealsPopupConfig>(
    () =>
      initialDealsConfig ?? {
        enabled: true,
        title: "Discount",
        subtitle: "Up to",
        button_label: "Shop now",
      }
  )

  // Store products adapted to the card data shape, with live like state.
  const storefrontProducts = useMemo(
    () => products.map((product) => toStorefrontProduct(product, likedProducts.includes(product.id))),
    [products, likedProducts]
  )

  // Filter + sort the catalog (same rules as the design's reference app),
  // layered with the shared search box from the top nav.
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const list = storefrontProducts.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false
      if (item.price > DEFAULT_FILTERS.maxPrice) return false
      if (query && !item.title.toLowerCase().includes(query) && !item.subtitle.toLowerCase().includes(query))
        return false
      if (freeShippingOnly && !item.freeShipping) return false
      if (dealsOnly && !(item.discountPercent && item.discountPercent > 0)) return false
      if (topOrdersOnly && (!item.ordersCount || item.ordersCount < 1000)) return false
      return true
    })

    if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price)
    else if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price)
    else if (sortBy === "top-rated") list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    else if (sortBy === "orders") list.sort((a, b) => (b.ordersCount ?? 0) - (a.ordersCount ?? 0))

    return list
  }, [storefrontProducts, selectedCategory, searchQuery, freeShippingOnly, topOrdersOnly, dealsOnly, sortBy])

  // Live max catalog discount for the entry popup.
  const maxDiscount = useMemo(
    () => storefrontProducts.reduce((max, item) => Math.max(max, item.discountPercent ?? 0), 0),
    [storefrontProducts]
  )
  // Popup percent = live max catalog discount. Admin offer applies set real
  // product prices, so the popup reflects them without extra state.
  const popupPercent = maxDiscount

  const handleShopDeals = () => {
    dismissDealsPopup()
    setCategory("all")
    setSearchQuery("")
    setDealsOnly(true)
    document.getElementById("all-products-heading")?.scrollIntoView({ behavior: "smooth" })
  }

  // Search fallback: when the query matches nothing, suggest related
  // products — any title/description word sharing a prefix with any query
  // word ("tset" → "test..."), then substring hits, then top-rated items —
  // never an empty dead end.
  const searchSuggestions = useMemo(() => {
    if (!trimmedQuery || filteredProducts.length > 0) return []
    const queryWords = trimmedQuery.toLowerCase().split(/\s+/).filter(Boolean)
    const words = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)

    const scored = storefrontProducts
      .map((item) => {
        const haystack = words(`${item.title} ${item.subtitle}`)
        let score = 0
        for (const q of queryWords) {
          if (haystack.some((w) => w.startsWith(q) || q.startsWith(w.slice(0, 2)))) score += 2
          else if (`${item.title} ${item.subtitle}`.toLowerCase().includes(q)) score += 1
        }
        return { item, score }
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item)

    const topRated = [...storefrontProducts].sort(
      (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
    )
    return [...scored, ...topRated.filter((item) => !scored.includes(item))].slice(0, 6)
  }, [trimmedQuery, filteredProducts.length, storefrontProducts])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedCategory !== "all") count++
    if (sortBy !== "featured") count++
    if (freeShippingOnly) count++
    if (topOrdersOnly) count++
    if (dealsOnly) count++
    return count
  }, [selectedCategory, sortBy, freeShippingOnly, topOrdersOnly, dealsOnly])

  const filters: FilterState = {
    category: selectedCategory,
    searchQuery,
    ...DEFAULT_FILTERS,
    freeShippingOnly,
    topOrdersOnly,
    dealsOnly,
    sortBy,
  }

  const handleUpdateFilters = (updated: Partial<FilterState>) => {
    if (updated.category !== undefined) setCategory(updated.category)
    if (updated.sortBy !== undefined) setSortBy(updated.sortBy)
    if (updated.freeShippingOnly !== undefined) setFreeShippingOnly(updated.freeShippingOnly)
    if (updated.topOrdersOnly !== undefined) setTopOrdersOnly(updated.topOrdersOnly)
    if (updated.dealsOnly !== undefined) setDealsOnly(updated.dealsOnly)
  }

  const handleResetFilters = () => {
    setCategory("all")
    setSortBy("featured")
    setFreeShippingOnly(false)
    setTopOrdersOnly(false)
    setDealsOnly(false)
  }

  const handleToggleWishlist = (id: string) => {
    const storeProduct = products.find((product) => String(product.id) === id)
    if (storeProduct) toggleLike(storeProduct)
  }

  const handleAddToCart = (id: string) => {
    const storeProduct = products.find((product) => String(product.id) === id)
    if (storeProduct) addToCart(storeProduct)
  }

  const handleOpenProduct = (id: string) => router.push(`/product/${id}`)

  // Show the smooth CartLoader from first paint / SSR onward until products arrive,
  // preventing the Filter Bar jump and grey skeleton flash on reload.
  if (products.length === 0) {
    const loaderOverlay = (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-[#faf7f2]/92 dark:bg-[#0b0d11]/90 backdrop-blur-md"
      >
        <CartLoader message="Loading" />
      </div>
    )
    return (
      <div className="min-h-screen">
        {mounted ? createPortal(loaderOverlay, document.body) : loaderOverlay}
      </div>
    )
  }

  return (
    <div className="-mx-4 flex flex-col">
      <main className="w-full">
        {/* 1. FULL-WIDTH MOVING PRODUCT HERO SECTION — hidden while a
            category or search is active so results start at the top. */}
        {!isFiltering && <HeroShowcase />}

        {/* 2. FILTER CAPSULES BAR */}
        <header
          id="storefront-catalog-start"
          className="w-full px-4 sm:px-6 pt-8 pb-4 scroll-mt-[104px] sm:scroll-mt-[120px] lg:scroll-mt-[132px]"
        >
          <FilterCapsulesBar
            selectedCategory={selectedCategory}
            onSelectCategory={setCategory}
            onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
            activeFilterCount={activeFilterCount}
          />
        </header>

        {/* 3. PRODUCT CATALOG GRID — full-width, same card design and filter state */}
        <section className="w-full px-4 sm:px-6 pt-6 pb-10 sm:pb-12" aria-labelledby="all-products-heading">
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <h2 id="all-products-heading" className="text-lg font-black text-[var(--foreground)] tracking-tight">
                {trimmedQuery && filteredProducts.length === 0 && searchSuggestions.length > 0
                  ? `No exact results for “${trimmedQuery}” — you may like these instead:`
                  : resultsHeading}
              </h2>
            </div>
            <span className="text-xs font-bold text-[var(--muted-foreground)]">
              {filteredProducts.length > 0 ? `${filteredProducts.length} item${filteredProducts.length === 1 ? "" : "s"}` : ""}
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            trimmedQuery && searchSuggestions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {searchSuggestions.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onToggleWishlist={handleToggleWishlist}
                    onOpenProduct={handleOpenProduct}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-[24px] border border-gray-200/70 text-center">
                <PackageSearch size={40} className="text-gray-300 mb-3" aria-hidden />
                <p className="text-sm font-bold text-gray-900 mb-1">No products match your filters</p>
                <p className="text-xs text-gray-500 mb-5">Try a different category or reset the filters.</p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 rounded-2xl bg-[#ffb5a0] hover:bg-[#ffa38b] text-[#1e293b] font-bold text-sm transition-all cursor-pointer shadow-xs"
                >
                  Reset Filters
                </button>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 3}
                  onToggleWishlist={handleToggleWishlist}
                  onOpenProduct={handleOpenProduct}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FILTER DRAWER */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        categories={categories}
        onUpdateFilters={handleUpdateFilters}
        onResetFilters={handleResetFilters}
        totalResultsCount={filteredProducts.length}
      />

      {/* ENTRY DISCOUNT POPUP — every home visit, live max discount */}
      {dealsConfig.enabled && popupPercent > 0 && (
        <DealsPopup
          open={dealsOpen}
          percent={popupPercent}
          title={dealsConfig.title}
          subtitle={dealsConfig.subtitle}
          buttonLabel={dealsConfig.button_label}
          onClose={dismissDealsPopup}
          onShopNow={handleShopDeals}
        />
      )}
    </div>
  )
}
