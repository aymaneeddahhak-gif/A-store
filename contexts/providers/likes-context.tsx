"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Product } from "@/lib/types"
import { readLikesFromStorage, writeLikesToStorage } from "@/lib/storage"
import { toggleProductLikeAction } from "@/lib/actions/products"

/**
 * Likes / Wishlist — persisted product ids + optimistic UI.
 * Calls the toggleProductLikeAction server action for DB persistence.
 * Catalog state (product.likes counts) lives in CatalogProvider; this
 * provider only owns the user's liked set so toggling a like doesn't
 * re-render unrelated cards.
 */

type LikesContextValue = {
  likedProducts: number[]
  toggleLike: (product: Product) => void
  isLiked: (productId: number) => boolean
}

const LikesContext = createContext<LikesContextValue | undefined>(undefined)

export function LikesProvider({ children }: { children: ReactNode }) {
  const [likedProducts, setLikedProducts] = useState<number[]>([])

  useEffect(() => {
    setLikedProducts(readLikesFromStorage())
  }, [])

  useEffect(() => {
    writeLikesToStorage(likedProducts)
  }, [likedProducts])

  const isLiked = useCallback((productId: number) => likedProducts.includes(productId), [likedProducts])

  const toggleLike = useCallback((product: Product) => {
    setLikedProducts((prev) => {
      const liked = prev.includes(product.id)
      return liked ? prev.filter((id) => id !== product.id) : [...prev, product.id]
    })

    // Fire-and-forget server persistence. The UI is already updated optimistically.
    const liked = likedProducts.includes(product.id)
    void toggleProductLikeAction(product.id, product.likes, liked).catch((err) =>
      console.error("[likes] toggleLike server sync failed:", err)
    )
  }, [likedProducts])

  const value = useMemo(
    () => ({ likedProducts, toggleLike, isLiked }),
    [likedProducts, toggleLike, isLiked]
  )

  return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>
}

export function useLikes() {
  const ctx = useContext(LikesContext)
  if (ctx === undefined) throw new Error("useLikes must be used within LikesProvider")
  return ctx
}
