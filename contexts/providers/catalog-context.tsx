"use client"

import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import type { Product } from "@/lib/types"
import { MOCK_PRODUCTS } from "@/lib/mock-data"
import { useToast } from "@/contexts/toast-context"
import { useLikes } from "@/contexts/providers/likes-context"
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/lib/actions/products"
import { addReviewAction } from "@/lib/actions/reviews"

/**
 * Catalog — products + filters (category/search) + seller CRUD + reviews.
 * Products are seeded server-side (layout.tsx) and re-fetched client-side
 * only after a mutation. Likes counts are mirrored here for display so the
 * UI stays in sync without a full refetch.
 */

type CatalogContextValue = {
  products: Product[]
  selectedCategory: string
  searchQuery: string
  setCategory: (category: string) => void
  setSearchQuery: (query: string) => void
  addProduct: (product: Omit<Product, "id" | "likes" | "rating" | "reviews">) => Promise<void>
  updateProduct: (id: number, updates: Partial<Product>) => Promise<void>
  deleteProduct: (id: number) => Promise<void>
  addReview: (productId: number, review: { user: string; rating: number; comment: string; avatar?: string }) => Promise<void>
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined)

export function CatalogProvider({
  children,
  initialProducts = [],
}: {
  children: ReactNode
  initialProducts?: Product[]
}) {
  const { showToast } = useToast()
  const { isLiked } = useLikes()

  const [products, setProducts] = useState<Product[]>(
    initialProducts.length > 0 ? initialProducts : MOCK_PRODUCTS
  )
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQueryState] = useState("")

  const setCategory = useCallback((category: string) => setSelectedCategory(category), [])
  const setSearchQuery = useCallback((query: string) => setSearchQueryState(query), [])

  const addProduct = useCallback(
    async (newProduct: Omit<Product, "id" | "likes" | "rating" | "reviews">) => {
      const res = await createProductAction(newProduct)
      if (res.ok) {
        // Optimistic add to local state (server is source of truth via revalidate).
        setProducts((prev) => [...prev, res.data])
        showToast("Product added.", "success")
      } else {
        showToast(res.error || "Could not add product. Check database permissions.", "error")
      }
    },
    [showToast]
  )

  const updateProduct = useCallback(
    async (id: number, updates: Partial<Product>) => {
      const res = await updateProductAction(id, updates)
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
        )
        showToast("Product updated.", "success")
      } else {
        showToast(res.error || "Could not update product.", "error")
      }
    },
    [showToast]
  )

  const deleteProduct = useCallback(
    async (id: number) => {
      const res = await deleteProductAction(id)
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id))
        showToast("Product removed.", "info")
      } else {
        showToast(res.error || "Could not delete product.", "error")
      }
    },
    [showToast]
  )

  const addReview = useCallback(
    async (
      productId: number,
      review: { user: string; rating: number; comment: string; avatar?: string }
    ) => {
      const product = products.find((p) => p.id === productId)
      if (!product) return

      const res = await addReviewAction(productId, review, product.reviews || [])
      if (res.ok) {
        // Mirror the review locally so the UI updates instantly.
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== productId) return p
            const reviews = [res.data, ...(p.reviews || [])]
            const rating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
            return { ...p, reviews, rating: parseFloat(rating.toFixed(1)) }
          })
        )
        showToast("Review submitted. Thank you!", "success")
      } else {
        showToast(res.error || "Could not submit review.", "error")
      }
    },
    [products, showToast]
  )

  const value = useMemo(
    () => ({
      products,
      selectedCategory,
      searchQuery,
      setCategory,
      setSearchQuery,
      addProduct,
      updateProduct,
      deleteProduct,
      addReview,
    }),
    [products, selectedCategory, searchQuery, setCategory, setSearchQuery, addProduct, updateProduct, deleteProduct, addReview]
  )

  // Silence unused-warning while we keep the hook available for symmetric API.
  void isLiked

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (ctx === undefined) throw new Error("useCatalog must be used within CatalogProvider")
  return ctx
}
