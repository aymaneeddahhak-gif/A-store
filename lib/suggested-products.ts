/**
 * Suggested filler products for the seller form's fill button. Every entry
 * reuses image + showcase-clip files that actually ship in public/, so a
 * filled form always previews and plays correctly. Sandbox-only content —
 * it never reaches the storefront.
 */
export interface ProductSuggestion {
  name: string
  price: string
  category: string
  description: string
  image: string
  video: string
}

export const SUGGESTED_PRODUCTS: ProductSuggestion[] = [
  {
    name: "Pulse Pods Lite",
    price: "79.99",
    category: "phones",
    description: "Compact wireless earbuds with punchy bass and a 24-hour charging case.",
    image: "/images/product/airpods.png",
    video: "/videos/product/earpodsvideos.mp4",
  },
  {
    name: "Court Classic Sneakers",
    price: "149.99",
    category: "sneakers",
    description: "Clean leather low-tops with a cushioned sole for everyday wear.",
    image: "/images/product/sneakers.png",
    video: "/videos/product/sneakersvideo.mp4",
  },
  {
    name: "Nordwind Parka",
    price: "259",
    category: "clothes",
    description: "Insulated winter parka with storm cuffs and a detachable hood.",
    image: "/images/product/bluejacket.png",
    video: "/videos/product/bluejacketvideo.mp4",
  },
  {
    name: "Maison Butter Croissant",
    price: "5.9",
    category: "food",
    description: "Flaky French croissant with rich butter layers, baked fresh daily.",
    image: "/images/product/Croisant.png",
    video: "/videos/product/Croisant.mp4",
  },
  {
    name: "Orbit Phone 12",
    price: "899",
    category: "phones",
    description: "Flagship smartphone with triple camera and all-day battery life.",
    image: "/images/product/iphone-17.png",
    video: "/videos/product/iphonevideo.mp4",
  },
  {
    name: "City Umbrella Pro",
    price: "39.99",
    category: "clothes",
    description: "Windproof compact umbrella with automatic open and close.",
    image: "/images/product/umbrella.png",
    video: "/videos/product/umbrellavideo.mp4",
  },
]

/** Random suggestion, avoiding an immediate repeat of the current form. */
export function randomSuggestion(currentName?: string): ProductSuggestion {
  const pool = SUGGESTED_PRODUCTS.filter((s) => s.name !== currentName)
  return pool[Math.floor(Math.random() * pool.length)] ?? SUGGESTED_PRODUCTS[0]
}
