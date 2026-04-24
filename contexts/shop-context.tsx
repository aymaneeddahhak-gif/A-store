"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

// Define types
export type Product = {
    id: number
    name: string
    price: number
    category: string
    image: string
}

type ShopContextType = {
    // Filtering
    selectedCategory: string
    setCategory: (category: string) => void

    // Search
    searchQuery: string
    setSearchQuery: (query: string) => void

    // Cart
    cart: Product[]
    isCartOpen: boolean
    addToCart: (product: Product) => void
    removeFromCart: (productId: number) => void
    toggleCart: () => void

    // Quick View
    quickViewProduct: Product | null
    openQuickView: (product: Product) => void
    closeQuickView: () => void

    // Likes
    likedProducts: number[]
    toggleLike: (productId: number) => void

    // Theme
    isDarkMode: boolean
    toggleTheme: () => void
}

const ShopContext = createContext<ShopContextType | undefined>(undefined)

export function ShopProvider({ children }: { children: ReactNode }) {
    // State — default to LIGHT mode
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [searchQuery, setSearchQueryState] = useState("")
    const [cart, setCart] = useState<Product[]>([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
    const [likedProducts, setLikedProducts] = useState<number[]>([])
    const [isDarkMode, setIsDarkMode] = useState(false)

    // Single source of truth: state drives DOM classes
    useEffect(() => {
        const html = document.documentElement
        if (isDarkMode) {
            html.classList.add("dark")
        } else {
            html.classList.remove("dark")
        }
    }, [isDarkMode])

    // Actions
    const setCategory = (category: string) => setSelectedCategory(category)
    const setSearchQuery = (query: string) => setSearchQueryState(query)

    const addToCart = (product: Product) => {
        setCart((prev) => [...prev, product])
        setIsCartOpen(true) // Open cart when adding
    }

    const removeFromCart = (productId: number) => {
        setCart((prev) => prev.filter((item) => item.id !== productId))
    }

    const toggleCart = () => setIsCartOpen((prev) => !prev)

    const openQuickView = (product: Product) => setQuickViewProduct(product)
    const closeQuickView = () => setQuickViewProduct(null)

    const toggleLike = (productId: number) => {
        setLikedProducts((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId]
        )
    }

    // Toggle theme — only update state, useEffect handles the DOM
    const toggleTheme = () => {
        setIsDarkMode(prev => !prev)
    }

    const value = {
        selectedCategory,
        setCategory,
        searchQuery,
        setSearchQuery,
        cart,
        isCartOpen,
        addToCart,
        removeFromCart,
        toggleCart,
        quickViewProduct,
        openQuickView,
        closeQuickView,
        likedProducts,
        toggleLike,
        isDarkMode,
        toggleTheme,
    }

    return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
    const context = useContext(ShopContext)
    if (context === undefined) {
        throw new Error("useShop must be used within a ShopProvider")
    }
    return context
}
