import type { Product } from "@/lib/types"

/**
 * Isolated demo products for Demo Seller (`seller@a-store.shop`).
 *
 * Guaranteed isolation: Editing, adding, or deleting products in the Demo Seller
 * dashboard operates exclusively on this isolated dataset (persisted in client
 * localStorage), completely preventing any mutations to the main website catalog.
 */
export const INITIAL_DEMO_SELLER_PRODUCTS: Product[] = [
  {
    id: 9101,
    name: "Real Madrid Home Kit 26/27",
    price: 120,
    original_price: 140,
    category: "clothes",
    image: "/images/product/RMADRIDKIT.png",
    images: ["/images/product/RMADRIDKIT.png"],
    video: "/videos/product/RMJERSY.mp4",
    description:
      "Official match-day performance jersey featuring breathable micro-perforated fabric, metallic gold trim, and woven club crest.",
    stock: 85,
    is_published: true,
    featured: true,
    user_id: "demo-seller-role-id",
    likes: 240,
    rating: 4.9,
    reviews: [],
  },
  {
    id: 9102,
    name: "Neon Force Sneakers",
    price: 189.99,
    original_price: 224,
    category: "sneakers",
    image: "/images/product/sneakers.png",
    images: ["/images/product/sneakers.png"],
    video: "/videos/product/sneakersvideo.mp4",
    description:
      "Ultra-lightweight street and running silhouette engineered with a responsive carbon-fiber plate and dual-density foam midsole.",
    stock: 60,
    is_published: true,
    featured: true,
    user_id: "demo-seller-role-id",
    likes: 185,
    rating: 4.8,
    reviews: [],
  },
  {
    id: 9103,
    name: "Silk Organza Wedding Dress",
    price: 450,
    original_price: 550,
    category: "clothes",
    image: "/images/product/weddg.png",
    images: ["/images/product/weddg.png"],
    video: "/videos/product/weddgdress.mp4",
    description:
      "Hand-draped silk organza silhouette with structured corset boning, delicate tonal beadwork, and a sweeping cathedral train.",
    stock: 12,
    is_published: true,
    featured: false,
    user_id: "demo-seller-role-id",
    likes: 95,
    rating: 5.0,
    reviews: [],
  },
]

const STORAGE_KEY = "demo_seller_products_v2"

export function isDemoSellerUser(email?: string | null): boolean {
  if (!email) return false
  const lower = email.trim().toLowerCase()
  return (
    lower === "seller@a-store.shop" ||
    lower === "demo-seller@a-store.shop" ||
    lower === "demo-admin@a-store.shop" ||
    lower.includes("seller")
  )
}

export function getDemoSellerProducts(): Product[] {
  if (typeof window === "undefined") {
    return INITIAL_DEMO_SELLER_PRODUCTS.map((p) => ({ ...p }))
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Product[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
    // Seed initial copies
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(INITIAL_DEMO_SELLER_PRODUCTS)
    )
    return INITIAL_DEMO_SELLER_PRODUCTS.map((p) => ({ ...p }))
  } catch {
    return INITIAL_DEMO_SELLER_PRODUCTS.map((p) => ({ ...p }))
  }
}

export function saveDemoSellerProducts(products: Product[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  } catch {
    // ignore quota/storage issues
  }
}
