import type { CategoryCapsule } from "@/lib/storefront/types"

/** Filter capsule bar data — round image + name per category, project assets only. */
export const CATEGORIES: CategoryCapsule[] = [
  { id: "all", name: "All", imageUrl: "/images/logo/logotrsnprt.png" },
  { id: "phones", name: "Phones & IT", imageUrl: "/images/product/iphone-17.png" },
  { id: "sneakers", name: "Sneakers", imageUrl: "/images/product/sneakers.png" },
  { id: "clothes", name: "Clothes", imageUrl: "/images/product/S-kacket.png" },
  { id: "food", name: "Gourmet Food", imageUrl: "/images/product/Croisant.png" },
  { id: "gaming", name: "Gaming & Audio", imageUrl: "/images/product/airpods.png" },
]
