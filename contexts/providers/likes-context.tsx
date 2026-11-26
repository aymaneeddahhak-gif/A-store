"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { Product } from "@/lib/types"
import { useAuth } from "@/contexts/providers/auth-context"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { useToast } from "@/contexts/toast-context"
import { getMyLikedProductIdsAction, toggleProductLikeAction } from "@/lib/actions/products"

/**
 * Per-user Likes / Wishlist — strictly backed by Supabase for the currently
 * authenticated user (`user.id`). Clears on logout and reloads on account switch.
 */

type LikesContextValue = {
  likedProducts: number[]
  toggleLike: (product: Product) => void
  isLiked: (productId: number) => boolean
}

const LikesContext = createContext<LikesContextValue | undefined>(undefined)

export function LikesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { setProductLikes } = useCatalog()
  const { showToast } = useToast()
  const [likedProducts, setLikedProducts] = useState<number[]>([])
  const likedProductsRef = useRef<number[]>([])
  const userId = user?.id ?? null

  useEffect(() => {
    likedProductsRef.current = []
    setLikedProducts([])

    if (!userId) return

    let active = true
    void getMyLikedProductIdsAction().then((res) => {
      if (!active || !res.ok) return
      likedProductsRef.current = res.data
      setLikedProducts(res.data)
    })

    return () => {
      active = false
    }
  }, [userId])

  const isLiked = useCallback((productId: number) => likedProducts.includes(productId), [likedProducts])

  const toggleLike = useCallback(
    (product: Product) => {
      if (!userId) {
        showToast("Please sign in to save favourites.", "info")
        return
      }

      const prevLikes = likedProductsRef.current
      const currentlyLiked = prevLikes.includes(product.id)
      const nextLikes = currentlyLiked
        ? prevLikes.filter((id) => id !== product.id)
        : [...prevLikes, product.id]

      likedProductsRef.current = nextLikes
      setLikedProducts(nextLikes)

      void toggleProductLikeAction(product.id, product.likes, currentlyLiked)
        .then((res) => {
          if (res.ok) {
            setProductLikes(product.id, res.data.likes)
            if (Array.isArray(res.data.likedIds)) {
              likedProductsRef.current = res.data.likedIds
              setLikedProducts(res.data.likedIds)
            }
          } else {
            likedProductsRef.current = prevLikes
            setLikedProducts(prevLikes)
            showToast(res.error || "Could not update favourites.", "error")
          }
        })
        .catch(() => {
          likedProductsRef.current = prevLikes
          setLikedProducts(prevLikes)
          showToast("Could not update favourites.", "error")
        })
    },
    [userId, setProductLikes, showToast]
  )

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
