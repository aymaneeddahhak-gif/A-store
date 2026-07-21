"use client"

import { useState } from "react"
import type { Product } from "@/lib/types"

/**
 * Product info tabs — client island for the description/specs toggle.
 */
export function ProductTabs({ product }: { product: Product }) {
  const [activeTab, setActiveTab] = useState("description")

  return (
    <>
      <div className="flex gap-8 border-b border-[var(--border-color)] mb-8">
        {["description", "specs"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab
                ? "text-[var(--foreground)]"
                : "text-[var(--foreground)] opacity-30 hover:opacity-100"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[var(--foreground)] rounded-full animate-in fade-in duration-300" />
            )}
          </button>
        ))}
      </div>

      <div className="min-h-[100px] mb-10">
        {activeTab === "description" ? (
          <p className="text-lg text-[var(--foreground)] opacity-60 leading-relaxed max-w-xl animate-in fade-in duration-500">
            {product.description ||
              "Experience the future of premium tech. Designed for those who demand both style and performance."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-y-4 animate-in slide-in-from-left-4 duration-500">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Weight</span>
              <span className="text-sm font-bold text-[var(--foreground)]">240g</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Material</span>
              <span className="text-sm font-bold text-[var(--foreground)]">Premium Ceramic</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Dimensions</span>
              <span className="text-sm font-bold text-[var(--foreground)]">14 x 8 x 2 cm</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
