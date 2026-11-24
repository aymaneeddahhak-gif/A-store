"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

/**
 * Seller nav — shared between the site rail (which reveals the seller
 * sidebar on hover and navigates on click) and the seller page (which renders
 * the active tab content).
 */

type SellerNavContextValue = {
  flyoutOpen: boolean
  setFlyoutOpen: (open: boolean) => void
  openFlyout: () => void
  scheduleCloseFlyout: () => void
  cancelCloseFlyout: () => void
  sellerTab: string
  setSellerTab: (tab: string) => void
}

const SellerNavContext = createContext<SellerNavContextValue | undefined>(undefined)

export function SellerNavProvider({ children }: { children: ReactNode }) {
  const [flyoutOpen, setFlyoutOpenState] = useState(false)
  const [sellerTab, setSellerTab] = useState("Dashboard")
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelCloseFlyout = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const setFlyoutOpen = useCallback(
    (open: boolean) => {
      cancelCloseFlyout()
      setFlyoutOpenState(open)
    },
    [cancelCloseFlyout]
  )

  const openFlyout = useCallback(() => {
    cancelCloseFlyout()
    setFlyoutOpenState(true)
  }, [cancelCloseFlyout])

  const scheduleCloseFlyout = useCallback(() => {
    cancelCloseFlyout()
    closeTimerRef.current = setTimeout(() => {
      setFlyoutOpenState(false)
      closeTimerRef.current = null
    }, 260)
  }, [cancelCloseFlyout])

  useEffect(() => {
    return () => cancelCloseFlyout()
  }, [cancelCloseFlyout])

  const value = useMemo(
    () => ({
      flyoutOpen,
      setFlyoutOpen,
      openFlyout,
      scheduleCloseFlyout,
      cancelCloseFlyout,
      sellerTab,
      setSellerTab,
    }),
    [flyoutOpen, setFlyoutOpen, openFlyout, scheduleCloseFlyout, cancelCloseFlyout, sellerTab]
  )

  return <SellerNavContext.Provider value={value}>{children}</SellerNavContext.Provider>
}

export function useSellerNav() {
  const ctx = useContext(SellerNavContext)
  if (ctx === undefined) throw new Error("useSellerNav must be used within SellerNavProvider")
  return ctx
}
