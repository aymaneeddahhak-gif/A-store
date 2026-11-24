"use client"

import React from "react"
import Image from "next/image"
import { SlidersHorizontal } from "lucide-react"
import { CATEGORIES } from "@/lib/storefront/category-capsules"

interface FilterCapsulesBarProps {
  selectedCategory: string
  onSelectCategory: (categoryId: string) => void
  onOpenFilterDrawer: () => void
  activeFilterCount?: number
}

export const FilterCapsulesBar: React.FC<FilterCapsulesBarProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenFilterDrawer,
  activeFilterCount = 0,
}) => {
  return (
    <div className="w-full">
      {/* FILTER CAPSULES BAR WITH IMAGE BESIDE WORD & FILTERS BUTTON */}
      <div className="relative flex items-center gap-3">
        {/* [ Filters ] Button */}
        <div className="flex-shrink-0">
          <button
            id="btn-open-filters"
            onClick={onOpenFilterDrawer}
            className={`inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-full transition-all duration-200 font-bold text-xs sm:text-sm shadow-2xs cursor-pointer border ${
              activeFilterCount > 0
                ? "bg-black text-white border-black ring-2 ring-black/20 dark:bg-white dark:text-black dark:border-white"
                : "bg-white hover:bg-[#f5f0e8] text-[#1f1b16] border-[#e7e0d5] dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border-white/10"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.4]" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-black text-[10px] flex items-center justify-center font-black">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Thin vertical separator line */}
        <div className="h-6 w-px bg-gray-300/90 dark:bg-white/15 flex-shrink-0" />

        {/* Horizontal Scrollable Capsules Bar */}
        <div className="relative flex-1 overflow-hidden">
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1.5 px-0.5 scroll-smooth">
            {CATEGORIES.map((item) => {
              const isSelected = selectedCategory === item.id
              const isAll = item.id === "all"
              return (
                <button
                  key={item.id}
                  id={`capsule-filter-${item.id}`}
                  onClick={() => onSelectCategory(item.id)}
                  className={`group flex-shrink-0 flex items-center ${
                    isAll ? "px-5 py-2 sm:py-2.5" : "gap-2.5 pl-1.5 pr-4 py-1.5"
                  } rounded-full transition-all duration-200 cursor-pointer select-none text-left border ${
                    isSelected
                      ? "bg-black text-white border-black shadow-md ring-2 ring-black/20 scale-[1.02] dark:bg-white dark:text-black dark:border-white"
                      : "bg-white hover:bg-[#f5f0e8] text-[#1f1b16] border-[#ece6dc] shadow-2xs hover:shadow-xs hover:border-[#d8d0c4] dark:bg-white/5 dark:hover:bg-white/10 dark:text-neutral-200 dark:border-white/10 dark:hover:border-white/25"
                  }`}
                >
                  {/* Round Image Avatar Beside the Word (omitted for 'All') */}
                  {!isAll && (
                    <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-black/10 bg-gray-100">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="32px"
                        referrerPolicy="no-referrer"
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                    </div>
                  )}

                  {/* Word label */}
                  <span
                    className={`text-[13px] sm:text-[13.5px] font-bold leading-tight tracking-tight whitespace-nowrap ${
                      isSelected ? "text-white dark:text-black" : "text-gray-900 group-hover:text-black dark:text-neutral-200 dark:group-hover:text-white"
                    }`}
                  >
                    {item.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
