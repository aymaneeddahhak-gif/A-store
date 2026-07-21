"use client"

import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import type { Product } from "@/lib/types"

/**
 * Quick View modal state — isolated so opening a modal doesn't re-render
 * the catalog grid (the old god context re-rendered every card on open).
 */

type QuickViewContextValue = {
  quickViewProduct: Product | null
  openQuickView: (product: Product) => void
  closeQuickView: () => void
}

const QuickViewContext = createContext<QuickViewContextValue | undefined>(undefined)

export function QuickViewProvider({ children }: { children: ReactNode }) {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  const openQuickView = useCallback((product: Product) => setQuickViewProduct(product), [])
  const closeQuickView = useCallback(() => setQuickViewProduct(null), [])

  const value = useMemo(
    () => ({ quickViewProduct, openQuickView, closeQuickView }),
    [quickViewProduct, openQuickView, closeQuickView]
  )

  return <QuickViewContext.Provider value={value}>{children}</QuickViewContext.Provider>
}

export function useQuickView() {
  const ctx = useContext(QuickViewContext)
  if (ctx === undefined) throw new Error("useQuickView must be used within QuickViewProvider")
  return ctx
}
