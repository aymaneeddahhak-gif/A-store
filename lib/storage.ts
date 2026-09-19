import type { CartItem, Product } from "@/lib/types"
import { migrateProductAssetPaths } from "@/lib/product-media"

const CART_KEY = "justshop_cart_v1"
const LIKES_KEY = "justshop_likes"
const THEME_KEY = "theme"

export function readCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item): CartItem[] => {
      // Older carts stored products without a quantity, and pre-selection carts
      // without a `selected` flag. Migrate both on read so existing customer
      // carts remain usable — legacy lines default to selected.
      if (
        typeof item !== "object" ||
        item === null ||
        typeof (item as Product).id !== "number" ||
        typeof (item as Product).name !== "string"
      )
        return []
      // Heal pre-move image paths the same way catalog reads do, and drop
      // lines whose image no longer ships — otherwise a stale cart 400s the
      // image optimizer on every page that renders the drawer.
      const migrated = migrateProductAssetPaths(item as Product)
      if (!migrated) return []
      return [
        {
          ...migrated,
          quantity: Math.max(1, Number((item as CartItem).quantity) || 1),
          selected: (item as CartItem).selected !== false,
        },
      ]
    })
  } catch {
    return []
  }
}

export function writeCartToStorage(items: CartItem[]) {
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
