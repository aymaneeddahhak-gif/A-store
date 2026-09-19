export type Review = {
  id: string
  user: string
  rating: number
  comment: string
  date: string
  avatar?: string
  /** Uploaded review photos (storage URLs). */
  photos?: string[]
}

/** Seller-defined color variant (name shown, hex painted). */
export interface ProductColorOption {
  name: string
  hex: string
}

export type Product = {
  id: number
  name: string
  price: number
  category: string
  image: string
  images?: string[]
  /** Showcase clip. Optional so rows without the column still render. */
  video?: string
  description?: string
  /** Merchant compare-at price. Drives the discount badge; null = no offer. */
  original_price?: number | null
  /** Units sold. Displayed on the detail page; falls back to a like-derived estimate. */
  sold_count?: number
  /**
   * Owner id, or null/undefined for the public store catalog. Sandbox rows
   * (created by non-admin sellers) carry their creator's id and never reach
   * the storefront — only their owner and the admin can see them.
   */
  user_id?: string | null
  /** Units available. Undefined (older rows) means unlimited. */
  stock?: number
  /** False hides the row from the storefront without deleting it. */
  is_published?: boolean
  /** Seller-defined color variants. Empty/undefined falls back to category defaults. */
  custom_colors?: ProductColorOption[] | null
  /** Seller-defined sizes (e.g. dress sizes). Empty/undefined falls back to footwear defaults. */
  custom_sizes?: string[] | null
  /** Admin-pinned for the moving hero showcase. */
  featured?: boolean
  likes: number
  rating: number
  reviews: Review[]
}

export type CartItem = Product & {
  quantity: number
  /** Only selected lines count toward the total and go through checkout. */
  selected: boolean
  /** Variant chosen on the product page — what "Edit" changes on the line. */
  color?: string
  size?: string
}

export type Order = {
  id: string
  user_id: string
  items: CartItem[]
  total: number
  status: string
  created_at: string
  /** Promo code applied at checkout, if any. */
  promo_code?: string | null
  /** Carrier name set by the store (nullable until the SQL migration runs). */
  carrier?: string | null
  /** Tracking code set by the store (nullable until the SQL migration runs). */
  tracking_number?: string | null
  /** Last status change (nullable until the SQL migration runs). */
  status_updated_at?: string | null
}

/** Flat shipping fee — single source of truth for checkout UI and the order action. */
export const SHIPPING_FEE = 15

export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const

export type Notification = {
  id: string
  type: "order" | "promo" | "shipping" | "review" | "system"
  title: string
  message: string
  time: string
  read: boolean
}

export type ToastType = "success" | "error" | "warning" | "info"

export type ToastAction = {
  label: string
  onClick: () => void
}

/** Structured content for the notification card (icon + accent per event). */
export interface ToastDetail {
  title?: string
  productName?: string
  price?: string
  icon?: "cart" | "bag" | "truck" | "star" | "tag" | "bell" | "check" | "alert" | "info"
  accent?: "teal" | "emerald" | "blue" | "amber" | "rose" | "slate"
  /** Render the success wave card instead of the standard card. */
  wave?: boolean
}

export type Toast = {
  id: string
  message: string
  type: ToastType
  actions?: ToastAction[]
  detail?: ToastDetail
}

/** Delivery address saved on the account profile, reused at checkout. */
export interface ShippingAddress {
  firstName: string
  lastName: string
  email: string
  address: string
  city: string
  postalCode: string
  country: string
}
