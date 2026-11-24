/** Storefront section types — filter bar, drawer, hero showcase, product card. */

export type SpecIconType =
  | "tag"
  | "box"
  | "shield"
  | "star"
  | "cpu"
  | "zap"
  | "sparkles"
  | "feather"
  | "flame"
  | "clock"
  | "scale"
  | "check"
  | "truck"

export interface ProductSpec {
  label: string
  value: string
  iconType: SpecIconType
}

export interface EcommerceProduct {
  id: string
  title: string
  subtitle: string
  price: number
  originalPrice?: number
  discountPercent?: number
  ordersCount?: number
  freeShipping?: boolean
  unit?: string
  category: string
  imageUrl: string
  /** Showcase clip that auto-plays while the card is hovered. */
  video?: string | null
  rating?: number
  reviewsCount?: number
  badge?: string
  isPremium?: boolean
  /** Units available. Undefined means unlimited. */
  stock?: number
  specs: [ProductSpec, ProductSpec, ProductSpec]
  isLiked?: boolean
  colors?: { name: string; hex: string; image?: string }[]
}

export interface CategoryCapsule {
  id: string
  name: string
  imageUrl: string
}

export type SortBy = "featured" | "price-asc" | "price-desc" | "top-rated" | "orders"

export interface FilterState {
  category: string
  maxPrice: number
  minPrice?: number
  freeShippingOnly?: boolean
  topOrdersOnly?: boolean
  dealsOnly?: boolean
  badgeOnly: boolean
  searchQuery: string
  sortBy: SortBy
}

export interface HeroProductItem {
  id: string
  name: string
  subtitle: string
  category: string
  price: string
  originalPrice?: string
  discountBadge?: string
  shipping: string
  mainImage: string
  cutoutImage?: string
  video: string | null
}
