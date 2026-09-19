"use client"

import React, { useState, useEffect } from "react"
import type { FilterState, SortBy } from "@/lib/storefront/types"

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  categories: { id: string; label: string }[]
  onUpdateFilters: (filters: Partial<FilterState>) => void
  onResetFilters: () => void
  totalResultsCount: number
}

const CATEGORY_OPTIONS = [
  { id: "phones", label: "Phones & IT" },
  { id: "sneakers", label: "Sneakers" },
  { id: "gaming", label: "Audio & Gaming" },
  { id: "clothes", label: "Clothes & Style" },
  { id: "food", label: "Gourmet Food" },
  { id: "all", label: "All Products" },
]

const SORT_PRICE_OPTIONS = [
  { id: "featured", label: "All" },
  { id: "price-asc", label: "Low to High" },
  { id: "price-desc", label: "High to Low" },
  { id: "top-rated", label: "Top Rated" },
]

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  categories,
  onUpdateFilters,
}) => {
  const [tempCategory, setTempCategory] = useState<string>(filters.category)
  const [selectedSort, setSelectedSort] = useState<string>(filters.sortBy || "featured")
  const [freeShippingOnly, setFreeShippingOnly] = useState<boolean>(!!filters.freeShippingOnly)
  const [topOrdersOnly, setTopOrdersOnly] = useState<boolean>(!!filters.topOrdersOnly)
  const [dealsOnly, setDealsOnly] = useState<boolean>(!!filters.dealsOnly)

  useEffect(() => {
    if (isOpen) {
      setTempCategory(filters.category)
      setSelectedSort(filters.sortBy || "featured")
      setFreeShippingOnly(!!filters.freeShippingOnly)
      setTopOrdersOnly(!!filters.topOrdersOnly)
      setDealsOnly(!!filters.dealsOnly)
    }
  }, [
    isOpen,
    filters.category,
    filters.sortBy,
    filters.freeShippingOnly,
    filters.topOrdersOnly,
    filters.dealsOnly,
  ])

  // Escape closes the sheet — same behavior as clicking the backdrop.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Built-in options plus admin-added categories not already listed.
  const categoryOptions = [
    ...CATEGORY_OPTIONS,
    ...categories
      .filter(
        (c) => c.id !== "all" && !CATEGORY_OPTIONS.some((o) => o.id === c.id)
      )
      .map((c) => ({ id: c.id, label: c.label })),
  ]

  const handleApply = () => {
    onUpdateFilters({
      category: tempCategory,
      sortBy: selectedSort as SortBy,
      freeShippingOnly,
      topOrdersOnly,
      dealsOnly,
    })
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden flex items-end sm:items-center justify-center select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Search filter"
    >
      {/* Dimmed backdrop */}
      <div onClick={handleCancel} className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300" />

      {/* Bottom Sheet / Modal Container */}
      <div
        id="search-filter-modal"
        className="relative z-10 w-full max-w-[430px] bg-white rounded-t-[36px] sm:rounded-[36px] shadow-2xl p-6 sm:p-8 space-y-5 animate-in slide-in-from-bottom-8 duration-300"
      >
        {/* Top Centered Drag Handle */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto" />

        {/* Modal Title */}
        <h2 className="text-xl font-bold text-center text-[#1e293b] tracking-tight">
          Search Filter
        </h2>

        {/* Section 1: Category */}
        <div className="space-y-2.5">
          <label className="text-sm font-bold text-[#1e293b] block">Category</label>
          <div className="grid grid-cols-2 gap-2.5">
            {categoryOptions.map((cat) => {
              const isSelected = tempCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setTempCategory(isSelected && cat.id !== "all" ? "all" : cat.id)}
                  className={`py-3 px-4 rounded-2xl text-xs sm:text-[13px] font-semibold text-center transition-all cursor-pointer border ${
                    isSelected
                      ? "border-[#ff9b82] text-[#1e293b] bg-white ring-1 ring-[#ff9b82]"
                      : "border-gray-200/90 text-[#334155] bg-white hover:border-gray-300"
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Section 2: Price & Rating Sorting */}
        <div className="space-y-2.5">
          <label className="text-sm font-bold text-[#1e293b] block">Price & Rating</label>
          <div className="grid grid-cols-4 gap-2">
            {SORT_PRICE_OPTIONS.map((opt) => {
              const isSelected = selectedSort === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedSort(opt.id)}
                  className={`py-2.5 px-1 rounded-2xl text-[11px] sm:text-xs font-semibold text-center transition-all cursor-pointer border truncate ${
                    isSelected
                      ? "border-[#ff9b82] text-[#1e293b] bg-white ring-1 ring-[#ff9b82]"
                      : "border-gray-200/90 text-[#334155] bg-white hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Section 3: Marketplace Badges & Deals */}
        <div className="space-y-2.5">
          <label className="text-sm font-bold text-[#1e293b] block">Deals & Delivery</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFreeShippingOnly(!freeShippingOnly)}
              className={`py-2.5 px-2 rounded-2xl text-[11px] sm:text-xs font-semibold text-center transition-all cursor-pointer border truncate ${
                freeShippingOnly
                  ? "border-[#ff9b82] text-[#1e293b] bg-white ring-1 ring-[#ff9b82]"
                  : "border-gray-200/90 text-[#334155] bg-white hover:border-gray-300"
              }`}
            >
              Free Shipping
            </button>
            <button
              type="button"
              onClick={() => setDealsOnly(!dealsOnly)}
              className={`py-2.5 px-2 rounded-2xl text-[11px] sm:text-xs font-semibold text-center transition-all cursor-pointer border truncate ${
                dealsOnly
                  ? "border-[#ff9b82] text-[#1e293b] bg-white ring-1 ring-[#ff9b82]"
                  : "border-gray-200/90 text-[#334155] bg-white hover:border-gray-300"
              }`}
            >
              On sale
            </button>
            <button
              type="button"
              onClick={() => setTopOrdersOnly(!topOrdersOnly)}
              className={`py-2.5 px-2 rounded-2xl text-[11px] sm:text-xs font-semibold text-center transition-all cursor-pointer border truncate ${
                topOrdersOnly
                  ? "border-[#ff9b82] text-[#1e293b] bg-white ring-1 ring-[#ff9b82]"
                  : "border-gray-200/90 text-[#334155] bg-white hover:border-gray-300"
              }`}
            >
              1000+ Sold
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Apply Button */}
          <button
            id="btn-filter-apply"
            type="button"
            onClick={handleApply}
            className="w-full py-3.5 rounded-2xl bg-[#ffb5a0] hover:bg-[#ffa38b] active:scale-98 text-[#1e293b] font-bold text-sm transition-all cursor-pointer shadow-xs"
          >
            Apply
          </button>

          {/* Cancel Button */}
          <button
            id="btn-filter-cancel"
            type="button"
            onClick={handleCancel}
            className="w-full py-3.5 rounded-2xl bg-white border border-[#1e293b] hover:bg-gray-50 active:scale-98 text-[#1e293b] font-bold text-sm transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
