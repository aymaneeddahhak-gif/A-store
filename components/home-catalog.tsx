"use client"

import { useState, useMemo } from "react"
import ElectricBorderCard from "@/components/electric-border-card"
import { HeroSection } from "@/components/hero-section"
import { useShop } from "@/contexts/shop-context"
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react"

type SortOption = "default" | "price-asc" | "price-desc" | "name-asc" | "name-desc" | "rating-desc" | "likes-desc"

const SORT_LABELS: Record<SortOption, string> = {
  default: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A → Z",
  "name-desc": "Name: Z → A",
  "rating-desc": "Top Rated",
  "likes-desc": "Most Popular",
}

const CATEGORIES = ["All", "Electronics", "Fashion", "Food"]

export function HomeCatalog() {
  const { products, selectedCategory, setCategory, searchQuery, setSearchQuery } = useShop()

  const [sort, setSort] = useState<SortOption>("default")
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const clearAll = () => {
    setSearchQuery("")
    setSort("default")
    setCategory("All")
    setMinPrice("")
    setMaxPrice("")
    setShowSortMenu(false)
  }

  const hasActiveFilters =
    searchQuery.trim() ||
    sort !== "default" ||
    selectedCategory !== "All" ||
    minPrice ||
    maxPrice

  const displayedProducts = useMemo(() => {
    let list = [...products]

    if (selectedCategory !== "All") {
      list = list.filter((p) => p.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      )
    }

    if (minPrice) list = list.filter((p) => p.price >= Number(minPrice))
    if (maxPrice) list = list.filter((p) => p.price <= Number(maxPrice))

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price)
        break
      case "price-desc":
        list.sort((a, b) => b.price - a.price)
        break
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "rating-desc":
        list.sort((a, b) => b.rating - a.rating)
        break
      case "likes-desc":
        list.sort((a, b) => b.likes - a.likes)
        break
    }

    return list
  }, [products, selectedCategory, searchQuery, sort, minPrice, maxPrice])

  return (
    <div className="w-full flex flex-col gap-6">
      {selectedCategory === "All" && !searchQuery.trim() && <HeroSection />}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="w-full pl-9 pr-9 py-2.5 bg-[var(--glass-bg)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSortMenu(!showSortMenu)}
              aria-expanded={showSortMenu}
              aria-haspopup="listbox"
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--glass-bg)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--foreground)] hover:bg-[var(--glass-highlight)] transition-all whitespace-nowrap"
            >
              <span className="text-[var(--muted-foreground)]">Sort:</span>
              <span className="font-medium">{SORT_LABELS[sort]}</span>
              <ChevronDown
                size={14}
                className={`text-[var(--muted-foreground)] transition-transform ${showSortMenu ? "rotate-180" : ""}`}
              />
            </button>
            {showSortMenu && (
              <ul
                role="listbox"
                className="absolute right-0 top-full mt-2 w-52 bg-[var(--card)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                  <li key={key} role="option" aria-selected={sort === key}>
                    <button
                      type="button"
                      onClick={() => {
                        setSort(key)
                        setShowSortMenu(false)
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--glass-bg)]
                        ${sort === key ? "font-semibold text-[var(--foreground)] bg-[var(--glass-highlight)]" : "text-[var(--muted-foreground)]"}`}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-all
              ${showFilters
                ? "bg-[var(--foreground)] text-[var(--background)] border-transparent"
                : "bg-[var(--glass-bg)] border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--glass-highlight)]"
              }`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] inline-block" aria-hidden />
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs text-rose-500 border border-rose-500/30 hover:bg-rose-500/10 transition-all"
            >
              <X size={12} /> Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-4 p-4 bg-[var(--glass-bg)] border border-[var(--border-color)] rounded-xl">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-[var(--muted-foreground)]">
                Category
              </span>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all
                      ${selectedCategory === cat
                        ? "bg-[var(--foreground)] text-[var(--background)] border-transparent"
                        : "bg-transparent border-[var(--border-color)] text-[var(--muted-foreground)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-10 bg-[var(--border-color)] hidden sm:block" />

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-[var(--muted-foreground)]">
                Price range ($)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  aria-label="Minimum price"
                  className="w-20 px-3 py-1.5 bg-[var(--card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                />
                <span className="text-[var(--muted-foreground)] text-sm">—</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  aria-label="Maximum price"
                  className="w-20 px-3 py-1.5 bg-[var(--card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--muted-foreground)]">
            {displayedProducts.length === products.length
              ? `${products.length} products`
              : `${displayedProducts.length} of ${products.length} products`}
          </p>
          {hasActiveFilters && (
            <p className="text-xs text-[var(--muted-foreground)]">
              Filtered · <span className="text-[var(--foreground)]">{SORT_LABELS[sort]}</span>
            </p>
          )}
        </div>
      </div>

      <div className="cards-grid" onClick={() => setShowSortMenu(false)}>
        {displayedProducts.length > 0 ? (
          displayedProducts.map((product) => (
            <ElectricBorderCard key={product.id} image={product.image} product={product} />
          ))
        ) : (
          <div className="col-span-full h-64 flex flex-col items-center justify-center gap-3 text-[var(--muted-foreground)]">
            <Search size={40} className="opacity-20" aria-hidden />
            <p className="text-lg font-medium opacity-50">
              {searchQuery.trim()
                ? `No results for "${searchQuery}"`
                : "No products match your filters"}
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-[var(--foreground)] underline underline-offset-2 hover:no-underline transition-all"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
