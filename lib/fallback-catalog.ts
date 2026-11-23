import type { Order, Product } from "@/lib/types"

/**
 * Built-in fallback catalog & demo store state used when the configured
 * Supabase project is paused or unreachable (e.g., free-tier inactivity pause).
 *
 * Every product references real image and video assets shipped in `public/`,
 * so the storefront, hero showcase, product detail pages, cart, checkout, and
 * seller console stay 100% functional offline.
 */
export const INITIAL_FALLBACK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Stealth Earbuds Pro",
    price: 199,
    original_price: 249,
    category: "gaming",
    image: "/images/product/airpods.png",
    images: ["/images/product/airpods.png"],
    video: "/videos/product/earpodsvideos.mp4",
    description:
      "Studio-grade wireless earbuds with adaptive active noise cancellation, spatial audio head-tracking, and a 48-hour MagSafe charging case.",
    stock: 45,
    is_published: true,
    featured: true,
    user_id: null,
    likes: 128,
    rating: 4.8,
    reviews: [
      {
        id: "rev-1",
        user: "Alex M.",
        rating: 5,
        comment: "Incredible noise cancellation and battery life. Easily beats anything else at this price.",
        date: "2026-09-12",
      },
    ],
  },
  {
    id: 2,
    name: "Real Madrid Home Kit 26/27",
    price: 120,
    category: "clothes",
    image: "/images/product/RMADRIDKIT.png",
    images: ["/images/product/RMADRIDKIT.png"],
    video: "/videos/product/RMJERSY.mp4",
    description:
      "Official match-day performance jersey featuring breathable micro-perforated fabric, metallic gold trim, and woven club crest.",
    stock: 85,
    is_published: true,
    featured: true,
    user_id: null,
    likes: 215,
    rating: 4.9,
    reviews: [
      {
        id: "rev-2",
        user: "Karim B.",
        rating: 5,
        comment: "Authentic fit and premium fabric feel. Arrived in 2 days!",
        date: "2026-09-14",
      },
    ],
  },
  {
    id: 3,
    name: "Aero Carbon Pro Sneakers",
    price: 180,
    original_price: 240,
    category: "sneakers",
    image: "/images/product/sneakers.png",
    images: ["/images/product/sneakers.png"],
    video: "/videos/product/sneakersvideo.mp4",
    description:
      "Ultra-lightweight street and running silhouette engineered with a responsive carbon-fiber plate and dual-density foam midsole.",
    stock: 60,
    is_published: true,
    featured: true,
    user_id: null,
    likes: 96,
    rating: 4.8,
    reviews: [],
  },
  {
    id: 4,
    name: "Artisan Butter Croissant",
    price: 4.5,
    original_price: 6.0,
    category: "food",
    image: "/images/product/Croisant.png",
    images: ["/images/product/Croisant.png"],
    video: "/videos/product/Croisant.mp4",
    description:
      "Traditionally laminated French pastry crafted with 84% cultured Normandy butter, slow-fermented for 72 hours and baked fresh daily.",
    stock: 30,
    is_published: true,
    featured: false,
    user_id: null,
    likes: 142,
    rating: 5.0,
    reviews: [],
  },
  {
    id: 5,
    name: "iPhone 17 Pro Max Titanium",
    price: 1099,
    original_price: 1299,
    category: "phones",
    image: "/images/product/iphone-17.png",
    images: ["/images/product/iphone-17.png"],
    video: "/videos/product/iphonevideo.mp4",
    description:
      "Aerospace-grade titanium enclosure, A19 Pro silicon, 120Hz ProMotion Always-On OLED display, and 5x tetraprism optical zoom system.",
    stock: 40,
    is_published: true,
    featured: true,
    user_id: null,
    likes: 310,
    rating: 4.9,
    reviews: [
      {
        id: "rev-5",
        user: "Sarah K.",
        rating: 5,
        comment: "The camera and battery life are on another level. Worth every penny.",
        date: "2026-09-18",
      },
    ],
  },
  {
    id: 6,
    name: "Nordwind Insulated Parka",
    price: 249,
    original_price: 320,
    category: "clothes",
    image: "/images/product/bluejacket.png",
    images: ["/images/product/bluejacket.png"],
    video: "/videos/product/bluejacketvideo.mp4",
    description:
      "All-weather technical down jacket with seam-sealed ripstop shell, thermal-reflective lining, and adjustable storm hood.",
    stock: 25,
    is_published: true,
    featured: false,
    user_id: null,
    likes: 74,
    rating: 4.7,
    reviews: [],
  },
  {
    id: 7,
    name: "Varsity Urban Gold Bomber",
    price: 150,
    original_price: 195,
    category: "clothes",
    image: "/images/product/S-kacket.png",
    images: ["/images/product/S-kacket.png"],
    video: "/videos/product/S-jacket.mp4",
    description:
      "Heavyweight wool-blend collegiate bomber jacket finished with grained leather sleeves, quilted satin lining, and chenille embroidery.",
    stock: 35,
    is_published: true,
    featured: false,
    user_id: null,
    likes: 62,
    rating: 4.6,
    reviews: [],
  },
  {
    id: 8,
    name: "Studio Pro 16 Workstation",
    price: 1699,
    original_price: 1999,
    category: "phones",
    image: "/images/product/laptop.png",
    images: ["/images/product/laptop.png"],
    video: "/videos/product/laptop.mp4",
    description:
      "16-inch 4K OLED InfinityEdge display, 32GB unified memory, 1TB NVMe SSD, and CNC-machined aluminum chassis for creators and engineers.",
    stock: 20,
    is_published: true,
    featured: true,
    user_id: null,
    likes: 118,
    rating: 4.9,
    reviews: [],
  },
  {
    id: 9,
    name: "StormShield Carbon Umbrella",
    price: 45,
    original_price: 65,
    category: "clothes",
    image: "/images/product/umbrella.png",
    images: ["/images/product/umbrella.png"],
    video: "/videos/product/umbrellavideo.mp4",
    description:
      "Wind-tunnel tested to 70 mph with flexible carbon-fiber ribs, hydrophobic Teflon canopy coating, and one-touch auto deployment.",
    stock: 50,
    is_published: true,
    featured: false,
    user_id: null,
    likes: 48,
    rating: 4.5,
    reviews: [],
  },
  {
    id: 10,
    name: "Atelier Couture Evening Gown",
    price: 420,
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
    user_id: null,
    likes: 89,
    rating: 4.9,
    reviews: [],
  },
]

const globalForFallback = globalThis as unknown as {
  __astoreFallbackProducts?: Product[]
  __astoreFallbackOrders?: Order[]
}

export function getFallbackProducts(): Product[] {
  if (!globalForFallback.__astoreFallbackProducts) {
    globalForFallback.__astoreFallbackProducts = INITIAL_FALLBACK_PRODUCTS.map((p) => ({
      ...p,
      reviews: [...p.reviews],
    }))
  }
  return globalForFallback.__astoreFallbackProducts
}

export function setFallbackProducts(next: Product[]): void {
  globalForFallback.__astoreFallbackProducts = next
}

export function getFallbackOrders(): Order[] {
  if (!globalForFallback.__astoreFallbackOrders) {
    globalForFallback.__astoreFallbackOrders = [
      {
        id: "demo-ord-8f92a1c4",
        user_id: "demo-admin-id",
        items: [
          {
            ...INITIAL_FALLBACK_PRODUCTS[4],
            quantity: 1,
            selected: true,
          },
          {
            ...INITIAL_FALLBACK_PRODUCTS[0],
            quantity: 1,
            selected: true,
          },
        ],
        total: 1313,
        status: "Shipped",
        carrier: "DHL Express",
        tracking_number: "DHL-984120553",
        created_at: new Date(Date.now() - 86_400_000 * 2).toISOString(),
        status_updated_at: new Date(Date.now() - 86_400_000).toISOString(),
      },
      {
        id: "demo-ord-3b71e9d2",
        user_id: "demo-tester-id",
        items: [
          {
            ...INITIAL_FALLBACK_PRODUCTS[2],
            quantity: 1,
            selected: true,
          },
        ],
        total: 195,
        status: "Processing",
        carrier: null,
        tracking_number: null,
        created_at: new Date(Date.now() - 3600_000 * 5).toISOString(),
        status_updated_at: new Date(Date.now() - 3600_000 * 2).toISOString(),
      },
    ]
  }
  return globalForFallback.__astoreFallbackOrders
}

export function setFallbackOrders(next: Order[]): void {
  globalForFallback.__astoreFallbackOrders = next
}
