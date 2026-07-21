import type { Product } from "@/lib/types"

const CART_KEY = "justshop_cart_v1"
const LIKES_KEY = "justshop_likes"
const THEME_KEY = "theme"

export function readCartFromStorage(): Product[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is Product =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Product).id === "number" &&
        typeof (item as Product).name === "string"
    )
  } catch {
    return []
  }
}

export function writeCartToStorage(items: Product[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function readLikesFromStorage(): number[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LIKES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is number => typeof id === "number")
  } catch {
    return []
  }
}

export function writeLikesToStorage(productIds: number[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(LIKES_KEY, JSON.stringify(productIds))
}

export function readThemeFromStorage(): "light" | "dark" | null {
  if (typeof window === "undefined") return null
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === "light" || saved === "dark") return saved
  return null
}

export function writeThemeToStorage(theme: "light" | "dark") {
  if (typeof window === "undefined") return
  localStorage.setItem(THEME_KEY, theme)
}
