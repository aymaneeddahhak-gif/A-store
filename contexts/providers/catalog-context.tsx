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
import { usePathname } from "next/navigation"
import type { Product } from "@/lib/types"
import { useToast } from "@/contexts/toast-context"
import {
  createProductAction,
  deleteProductAction,
  refreshCatalogAction,
  updateProductAction,
} from "@/lib/actions/products"
import { supabase as browserSupabase } from "@/lib/supabase"
import { addReviewAction } from "@/lib/actions/reviews"
import { listCategoriesAction, createCategoryAction } from "@/lib/actions/categories"
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
  seedCatalog: (rows: Product[], dbCategories?: { id: string; label: string }[]) => void
  refreshCategories: () => Promise<void>
  createCategory: (label: string) => Promise<{ ok: boolean; error?: string }>
  selectedCategory: string
  searchQuery: string
  setCategory: (category: string) => void
  setSearchQuery: (query: string) => void
  setProductLikes: (id: number, likes: number) => void
  /** Local-only patch (no server roundtrip) for flag flips like featuring. */
  patchProductLocal: (id: number, patch: Partial<Product>) => void
  /** Re-read the public catalog (after a mutation, or on a live change). */
  refreshProducts: () => Promise<void>
  addProduct: (product: Omit<Product, "id" | "likes" | "rating" | "reviews">) => Promise<Product | null>
  updateProduct: (id: number, updates: Partial<Product>) => Promise<boolean>
  deleteProduct: (id: number) => Promise<boolean>
  addReview: (
    productId: number,
    review: { rating: number; comment: string; photos?: string[] }
  ) => Promise<{ ok: boolean; error?: string }>
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const pathname = usePathname()
  const skipSupabaseBackground = pathname === "/login" || pathname === "/seller"

  const [products, setProducts] = useState<Product[]>([])
  // Category taxonomy: built-ins instantly, DB-added merged in when seeded from HomePage.
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([
    ...DEFAULT_CATEGORIES,
  ])

  /**
   * Seed from HomePage's server-fetched catalog without clobbering newer client
   * mutations (an admin saving a product, a stock move, or a pin).
   */
  const seedCatalog = useCallback(
    (rows: Product[], dbCategories?: { id: string; label: string }[]) => {
      if (rows.length > 0) {
        setProducts((prev) => (prev.length > 0 ? prev : rows))
      }
      if (dbCategories && dbCategories.length > 0) {
        setCategories(mergeCategories(DEFAULT_CATEGORIES, dbCategories))
      }
    },
    []
  )

  const refreshCategories = useCallback(async () => {
    const res = await listCategoriesAction()
    if (res.ok && res.data.length > 0) {
      setCategories(mergeCategories(DEFAULT_CATEGORIES, res.data))
    }
  }, [])

  /** Persist a new DB category (admin-gated server-side) and refresh the taxonomy. */
  const createCategory = useCallback(
    async (label: string): Promise<{ ok: boolean; error?: string }> => {
      const res = await createCategoryAction(label)
      if (res.ok) {
        await refreshCategories()
        return { ok: true }
      }
      return { ok: false, error: res.error }
    },
    [refreshCategories]
  )

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

  /**
   * Pull the catalog again from the server. Called after a mutation and when
   * realtime reports a change, so a saved edit shows up without a reload.
   */
  const refreshProducts = useCallback(async () => {
    const res = await refreshCatalogAction()
    if (res.ok) setProducts(res.data)
  }, [])

  // Ensure pages landed on directly (such as /profile or /checkout) hydrate
  // live products from Supabase when HomePage hasn't seeded the context yet.
  useEffect(() => {
    if (skipSupabaseBackground || products.length > 0) return
    void refreshProducts()
  }, [skipSupabaseBackground, products.length, refreshProducts])

  useEffect(() => {
    if (skipSupabaseBackground) return
    const channel = browserSupabase
      .channel("catalog-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          void refreshProducts()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "store_settings" },
        () => {
          void refreshProducts()
        }
      )
      .subscribe()

    return () => {
      void browserSupabase.removeChannel(channel)
    }
  }, [refreshProducts, skipSupabaseBackground])

  const addProduct = useCallback(
    async (newProduct: Omit<Product, "id" | "likes" | "rating" | "reviews">) => {
      const res = await createProductAction(newProduct)
      if (res.ok) {
        // The storefront context only carries the public catalog — sandbox
        // rows (owned by another seller) never merge here.
        if (res.data.user_id == null) {
          setProducts((prev) => [...prev, res.data])
        }
        void refreshProducts()
        showToast("Product added.", "success")
        return res.data
      } else {
        showToast(res.error || "Could not add product. Check database permissions.", "error")
        return null
      }
    },
    [showToast, refreshProducts]
  )

  const updateProduct = useCallback(
    async (id: number, updates: Partial<Product>) => {
      const res = await updateProductAction(id, updates)
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
        )
        void refreshProducts()
        showToast("Product updated.", "success")
        return true
      } else {
        showToast(res.error || "Could not update product.", "error")
        return false
      }
    },
    [showToast, refreshProducts]
  )

  const deleteProduct = useCallback(
    async (id: number) => {
      const res = await deleteProductAction(id)
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id))
        void refreshProducts()
        showToast("Product removed.", "info")
        return true
      } else {
        showToast(res.error || "Could not delete product.", "error")
        return false
      }
    },
    [showToast, refreshProducts]
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
      seedCatalog,
      refreshCategories,
      createCategory,
      selectedCategory,
      searchQuery,
      setCategory,
      setSearchQuery,
      setProductLikes,
      patchProductLocal,
      refreshProducts,
      addProduct,
      updateProduct,
      deleteProduct,
      addReview,
    }),
    [products, categories, seedCatalog, refreshCategories, createCategory, selectedCategory, searchQuery, setCategory, setSearchQuery, setProductLikes, patchProductLocal, refreshProducts, addProduct, updateProduct, deleteProduct, addReview]
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (ctx === undefined) throw new Error("useCatalog must be used within CatalogProvider")
  return ctx
}
