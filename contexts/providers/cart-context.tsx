"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Product } from "@/lib/types"
import { readCartFromStorage, writeCartToStorage } from "@/lib/storage"
import { useToast } from "@/contexts/toast-context"

/**
 * Cart + Quick View — persisted to localStorage.
 * Cart toggles don't re-render the catalog or auth tree.
 */

type CartContextValue = {
  cart: Product[]
  isCartOpen: boolean
  cartHydrated: boolean
  addToCart: (product: Product) => void
  removeFromCart: (productId: number) => void
  clearCart: () => void
  toggleCart: () => void
  setCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const [cart, setCart] = useState<Product[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartHydrated, setCartHydrated] = useState(false)

  // Hydrate from localStorage exactly once.
  useEffect(() => {
    setCart(readCartFromStorage())
    setCartHydrated(true)
  }, [])

  // Persist whenever cart changes (after hydration).
  useEffect(() => {
    if (!cartHydrated) return
    writeCartToStorage(cart)
  }, [cart, cartHydrated])

  const addToCart = useCallback(
    (product: Product) => {
      setCart((prev) => {
        if (prev.some((item) => item.id === product.id)) {
          showToast(`${product.name} is already in your cart.`, "info")
          return prev
        }
        showToast(`${product.name} added to cart.`, "success")
        return [...prev, product]
      })
      setIsCartOpen(true)
    },
    [showToast]
  )

  const removeFromCart = useCallback(
    (productId: number) => setCart((prev) => prev.filter((item) => item.id !== productId)),
    []
  )
  const clearCart = useCallback(() => setCart([]), [])
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), [])
  const setCartOpen = useCallback((open: boolean) => setIsCartOpen(open), [])

  const value = useMemo(
    () => ({
      cart,
      isCartOpen,
      cartHydrated,
      addToCart,
      removeFromCart,
      clearCart,
      toggleCart,
      setCartOpen,
    }),
    [cart, isCartOpen, cartHydrated, addToCart, removeFromCart, clearCart, toggleCart, setCartOpen]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (ctx === undefined) throw new Error("useCart must be used within CartProvider")
  return ctx
}
