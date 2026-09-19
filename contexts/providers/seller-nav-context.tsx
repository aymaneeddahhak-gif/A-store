"use client"

import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

/**
 * Seller nav — shared between the site rail (which reveals the seller
 * sidebar on hover) and the seller page (which renders the tab content).
 * The seller sidebar is never fixed: it only appears as a hover flyout.
 */

type SellerNavContextValue = {
  flyoutOpen: boolean
  setFlyoutOpen: (open: boolean) => void
  sellerTab: string
  setSellerTab: (tab: string) => void
}

const SellerNavContext = createContext<SellerNavContextValue | undefined>(undefined)

export function SellerNavProvider({ children }: { children: ReactNode }) {
  const [flyoutOpen, setFlyoutOpen] = useState(false)
  const [sellerTab, setSellerTab] = useState("Dashboard")

  const setOpen = useCallback((open: boolean) => setFlyoutOpen(open), [])

  const value = useMemo(
    () => ({ flyoutOpen, setFlyoutOpen: setOpen, sellerTab, setSellerTab }),
    [flyoutOpen, setOpen, sellerTab]
  )

  return <SellerNavContext.Provider value={value}>{children}</SellerNavContext.Provider>
}

export function useSellerNav() {
  const ctx = useContext(SellerNavContext)
  if (ctx === undefined) throw new Error("useSellerNav must be used within SellerNavProvider")
  return ctx
}
