"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { Product } from "@/lib/types"
import { readLikesFromStorage, writeLikesToStorage } from "@/lib/storage"
import { useCatalog } from "@/contexts/providers/catalog-context"
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
  const likedProductsRef = useRef<number[]>([])
  const { setProductLikes } = useCatalog()

  useEffect(() => {
    const storedLikes = readLikesFromStorage()
    likedProductsRef.current = storedLikes
    setLikedProducts(storedLikes)
  }, [])

  useEffect(() => {
    likedProductsRef.current = likedProducts
    writeLikesToStorage(likedProducts)
  }, [likedProducts])

  const isLiked = useCallback((productId: number) => likedProducts.includes(productId), [likedProducts])

  const toggleLike = useCallback((product: Product) => {
    // Read from a ref so rapid taps always use the latest optimistic state,
    // instead of a stale render closure.
    const liked = likedProductsRef.current.includes(product.id)
    const nextLikes = liked
      ? likedProductsRef.current.filter((id) => id !== product.id)
      : [...likedProductsRef.current, product.id]
    likedProductsRef.current = nextLikes
    setLikedProducts(nextLikes)

    // Fire-and-forget server persistence. The wishlist is already persisted
    // locally, so a failed sync must not disturb the optimistic UI. A success
    // response carries the persisted count, which we mirror into catalog state
    // so the displayed number updates without a full refetch.
    // ponytail: server writes an absolute value computed from the client's
    // snapshot — two rapid toggles can race; switch to a DB-side increment
    // if real users ever contend on the same counter.
    void toggleProductLikeAction(product.id, product.likes, liked)
      .then((res) => {
        if (res.ok) setProductLikes(product.id, res.data.likes)
      })
      .catch(() => {})
  }, [setProductLikes])

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
