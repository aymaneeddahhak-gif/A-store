"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { CartItem, Product } from "@/lib/types"
import { readCartFromStorage, writeCartToStorage } from "@/lib/storage"
import { useToast } from "@/contexts/toast-context"
import { pokeMascot } from "@/components/mascot-surface"

/**
 * Cart + Quick View — persisted to localStorage.
 * Cart toggles don't re-render the catalog or auth tree.
 */

type CartVariant = { color?: string; size?: string }

type CartContextValue = {
  cart: CartItem[]
  /** Lines the customer ticked — the only ones that are billed. */
  selectedItems: CartItem[]
  selectedCount: number
  selectedSubtotal: number
  allSelected: boolean
  isCartOpen: boolean
  cartHydrated: boolean
  addToCart: (product: Product, quantity?: number, variant?: CartVariant) => void
  /** Updates the variant (color/size) of an existing cart line — the "Edit" flow. */
  updateCartItem: (productId: number, patch: CartVariant) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  toggleSelected: (productId: number) => void
  setAllSelected: (selected: boolean) => void
  /** Drops the checked-out lines, leaving unselected ones in the cart. */
  removeSelected: () => void
  clearCart: () => void
  toggleCart: () => void
  setCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const [cart, setCart] = useState<CartItem[]>([])
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
    (product: Product, quantity = 1, variant?: CartVariant) => {
      // Sold-out lines never enter the bag — checkout would reject them.
      if (product.stock !== undefined && product.stock <= 0) {
        showToast(`${product.name} is sold out.`, "error")
        return
      }
      const normalizedQuantity = Math.max(1, Math.floor(quantity))
      setCart((prev) => {
        const existing = prev.find((item) => item.id === product.id)
        return existing
          ? prev.map((item) =>
              // Re-adding a line the customer had unticked selects it again —
              // otherwise the add would silently not affect the total.
              item.id === product.id
                ? { ...item, quantity: item.quantity + normalizedQuantity, selected: true, ...variant }
                : item
            )
          : [...prev, { ...product, quantity: normalizedQuantity, selected: true, ...variant }]
      })
      // Reverts exactly this add: decrements by the added quantity and
      // drops the line if it reaches zero.
      const undoAdd = () =>
        setCart((prev) =>
          prev
            .map((item) => item.id === product.id ? { ...item, quantity: item.quantity - normalizedQuantity } : item)
            .filter((item) => item.quantity > 0)
        )
      // State updaters must remain pure. This event-side notification runs
      // after the update has been scheduled, never during another render.
      const variantSummary = [variant?.color, variant?.size ? `Size ${variant.size}` : undefined]
        .filter(Boolean)
        .join(" · ")
      showToast(`${product.name} added to cart.`, "success", [
        { label: "Undo", onClick: undoAdd },
        { label: "View Cart", onClick: () => setIsCartOpen(true) },
      ], {
        title: "Added to cart",
        productName: variantSummary || undefined,
        price: `$${product.price.toFixed(2)}`,
        icon: "check",
        accent: "emerald",
      })
      pokeMascot("cart")
    },
    [showToast]
  )

  const removeFromCart = useCallback(
    (productId: number) => setCart((prev) => prev.filter((item) => item.id !== productId)),
    []
  )
  /** Edit flow: swap a line's variant without touching quantity or selection. */
  const updateCartItem = useCallback((productId: number, patch: CartVariant) => {
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, ...patch } : item))
    )
  }, [])
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((item) => item.id !== productId)
        : prev.map((item) => item.id === productId ? { ...item, quantity } : item)
    )
  }, [])
  const clearCart = useCallback(() => setCart([]), [])
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), [])
  const setCartOpen = useCallback((open: boolean) => setIsCartOpen(open), [])

  const toggleSelected = useCallback((productId: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, selected: !item.selected } : item))
    )
  }, [])
  const setAllSelected = useCallback((selected: boolean) => {
    setCart((prev) => prev.map((item) => ({ ...item, selected })))
  }, [])
  const removeSelected = useCallback(() => {
    setCart((prev) => prev.filter((item) => !item.selected))
  }, [])

  const selectedItems = useMemo(() => cart.filter((item) => item.selected), [cart])
  const selectedCount = useMemo(
    () => selectedItems.reduce((total, item) => total + item.quantity, 0),
    [selectedItems]
  )
  const selectedSubtotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems]
  )
  const allSelected = cart.length > 0 && selectedItems.length === cart.length

  const value = useMemo(
    () => ({
      cart,
      selectedItems,
      selectedCount,
      selectedSubtotal,
      allSelected,
      isCartOpen,
      cartHydrated,
      addToCart,
      updateCartItem,
      removeFromCart,
      updateQuantity,
      toggleSelected,
      setAllSelected,
      removeSelected,
      clearCart,
      toggleCart,
      setCartOpen,
    }),
    [
      cart,
      selectedItems,
      selectedCount,
      selectedSubtotal,
      allSelected,
      isCartOpen,
      cartHydrated,
      addToCart,
      updateCartItem,
      removeFromCart,
      updateQuantity,
      toggleSelected,
      setAllSelected,
      removeSelected,
      clearCart,
      toggleCart,
      setCartOpen,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (ctx === undefined) throw new Error("useCart must be used within CartProvider")
  return ctx
}
