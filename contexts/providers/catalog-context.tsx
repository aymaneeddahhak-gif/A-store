"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Product } from "@/lib/types"
import { useToast } from "@/contexts/toast-context"
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/lib/actions/products"
import { addReviewAction } from "@/lib/actions/reviews"
import { listCategoriesAction } from "@/lib/actions/categories"
import { CATEGORIES as DEFAULT_CATEGORIES, mergeCategories } from "@/lib/categories"

/**
 * Catalog — products + filters (category/search) + seller CRUD + reviews.
 * Products are seeded server-side (layout.tsx) and re-fetched client-side
 * only after a mutation. Likes counts are mirrored here for display so the
 * UI stays in sync without a full refetch.
 */

type CatalogContextValue = {
  products: Product[]
  categories: { id: string; label: string }[]
  refreshCategories: () => Promise<void>
  selectedCategory: string
  searchQuery: string
  setCategory: (category: string) => void
  setSearchQuery: (query: string) => void
  setProductLikes: (id: number, likes: number) => void
  /** Local-only patch (no server roundtrip) for flag flips like featuring. */
  patchProductLocal: (id: number, patch: Partial<Product>) => void
  addProduct: (product: Omit<Product, "id" | "likes" | "rating" | "reviews">) => Promise<Product | null>
  updateProduct: (id: number, updates: Partial<Product>) => Promise<boolean>
  deleteProduct: (id: number) => Promise<boolean>
  addReview: (
    productId: number,
    review: { rating: number; comment: string; photos?: string[] }
  ) => Promise<{ ok: boolean; error?: string }>
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined)

export function CatalogProvider({
  children,
  productsPromise,
}: {
  children: ReactNode
  /** Server-started catalog read, streamed in — the UI never waits for it. */
  productsPromise?: Promise<Product[]>
}) {
  const { showToast } = useToast()

  // Starts empty — CatalogSeed (below) fills it from the streamed server
  // promise, so the shell renders instantly while Supabase responds.
  const [products, setProducts] = useState<Product[]>([])
  // Category taxonomy: built-ins instantly, DB-added merged in when loaded.
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([
    ...DEFAULT_CATEGORIES,
  ])

  const refreshCategories = useCallback(async () => {
    const res = await listCategoriesAction()
    if (res.ok && res.data.length > 0) {
      setCategories(mergeCategories(DEFAULT_CATEGORIES, res.data))
    }
  }, [])

  useEffect(() => {
    void refreshCategories()
  }, [refreshCategories])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQueryState] = useState("")

  const setCategory = useCallback((category: string) => setSelectedCategory(category), [])
  const setSearchQuery = useCallback((query: string) => setSearchQueryState(query), [])

  /** Mirrors a server-persisted like count into catalog state (called by LikesProvider). */
  const setProductLikes = useCallback((id: number, likes: number) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, likes } : p)))
  }, [])

  const patchProductLocal = useCallback((id: number, patch: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  const addProduct = useCallback(
    async (newProduct: Omit<Product, "id" | "likes" | "rating" | "reviews">) => {
      const res = await createProductAction(newProduct)
      if (res.ok) {
        // The storefront context only carries the public catalog — sandbox
        // rows (owned by another seller) never merge here.
        if (res.data.user_id == null) {
          setProducts((prev) => [...prev, res.data])
        }
        showToast("Product added.", "success")
        return res.data
      } else {
        showToast(res.error || "Could not add product. Check database permissions.", "error")
        return null
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
        return true
      } else {
        showToast(res.error || "Could not update product.", "error")
        return false
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
        return true
      } else {
        showToast(res.error || "Could not delete product.", "error")
        return false
      }
    },
    [showToast]
  )

  const addReview = useCallback(
    async (productId: number, review: { rating: number; comment: string; photos?: string[] }) => {
      const res = await addReviewAction(productId, review)
      if (!res.ok) {
        showToast(res.error, "error")
        return { ok: false, error: res.error }
      }

      // Mirror the review locally so it appears immediately, whether or not the
      // database accepted the write.
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p
          const reviews = [res.data, ...(p.reviews || [])]
          const rating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
          return { ...p, reviews, rating: parseFloat(rating.toFixed(1)) }
        })
      )
      showToast("Review posted. Thank you!", "success")
      return { ok: true }
    },
    [showToast]
  )

  const value = useMemo(
    () => ({
      products,
      categories,
      refreshCategories,
      selectedCategory,
      searchQuery,
      setCategory,
      setSearchQuery,
      setProductLikes,
      patchProductLocal,
      addProduct,
      updateProduct,
      deleteProduct,
      addReview,
    }),
    [products, categories, refreshCategories, selectedCategory, searchQuery, setCategory, setSearchQuery, setProductLikes, patchProductLocal, addProduct, updateProduct, deleteProduct, addReview]
  )

  return (
    <CatalogContext.Provider value={value}>
      {productsPromise && <CatalogSeed promise={productsPromise} onSeed={setProducts} />}
      {children}
    </CatalogContext.Provider>
  )
}

/**
 * Seeds the streamed catalog into state once Supabase responds. Renders null
 * and resolves the server-started promise in an effect, so the storefront
 * never blocks on the database — products simply appear when it lands.
 */
function CatalogSeed({
  promise,
  onSeed,
}: {
  promise: Promise<Product[]>
  onSeed: (products: Product[]) => void
}) {
  useEffect(() => {
    let active = true
    promise.then(
      (rows) => {
        if (active) onSeed(rows)
      },
      () => {
        // A failed read stays empty; mutations trigger client refetches.
      }
    )
    return () => {
      active = false
    }
  }, [promise, onSeed])
  return null
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (ctx === undefined) throw new Error("useCatalog must be used within CatalogProvider")
  return ctx
}
