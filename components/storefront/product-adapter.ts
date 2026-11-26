import type { Product } from "@/lib/types"
import type { EcommerceProduct, HeroProductItem, ProductSpec } from "@/lib/storefront/types"
import { getProductVideo } from "@/lib/product-media"
import { isCategoryId } from "@/lib/categories"

/**
 * Adapts store products to the storefront card data shape.
 *
 * The storefront design expects merchandising fields (specs, swatches,
 * compare-at price, badges, sold count) the product table doesn't carry, so
 * they are derived deterministically per category — presentation enrichment
 * over the demo catalog, not user data.
 */

/** Seed rows whose storefront category differs from the legacy fallback. */
const CATEGORY_BY_STORE_ID: Record<number, string> = {
  1: "gaming", // Stealth Earbuds Pro — audio
  3: "sneakers", // Stealth Urban Sneakers
}

/** Legacy taxonomy → storefront taxonomy (seller rows may already use new ids). */
export const LEGACY_CATEGORY: Record<string, string> = {
  Electronics: "phones",
  Fashion: "clothes",
  Food: "food",
}

function storefrontCategory(product: Product): string {
  if (isCategoryId(product.category) && product.category !== "all") return product.category
  const legacy = CATEGORY_BY_STORE_ID[product.id] ?? LEGACY_CATEGORY[product.category]
  if (legacy) return legacy
  // Admin-added categories arrive as slugs and pass through untouched.
  if (/^[a-z0-9-]+$/.test(product.category)) return product.category
  return "clothes"
}

const SPECS_BY_CATEGORY: Record<string, [ProductSpec, ProductSpec, ProductSpec]> = {
  phones: [
    { label: "Storage", value: "256GB", iconType: "cpu" },
    { label: "Display", value: '6.7" OLED', iconType: "zap" },
    { label: "Battery", value: "All-Day", iconType: "shield" },
  ],
  gaming: [
    { label: "Battery", value: "30h Playtime", iconType: "zap" },
    { label: "Drivers", value: "Hi-Res Audio", iconType: "cpu" },
    { label: "Weight", value: "Lightweight", iconType: "scale" },
  ],
  sneakers: [
    { label: "Size", value: "EU 42", iconType: "box" },
    { label: "Sole", value: "Cushioned", iconType: "feather" },
    { label: "Fit", value: "True to Size", iconType: "tag" },
  ],
  clothes: [
    { label: "Material", value: "Premium", iconType: "feather" },
    { label: "Fit", value: "Tailored", iconType: "tag" },
    { label: "Care", value: "Easy Care", iconType: "check" },
  ],
  food: [
    { label: "Freshness", value: "Daily Baked", iconType: "flame" },
    { label: "Source", value: "Local", iconType: "box" },
    { label: "Quality", value: "Checked", iconType: "check" },
  ],
}

const COLORS_BY_CATEGORY: Record<string, { name: string; hex: string; image?: string }[]> = {
  phones: [
    { name: "Desert Titanium", hex: "#cbb69d" },
    { name: "Black Titanium", hex: "#2b2b2d" },
  ],
  gaming: [
    { name: "Pearl White", hex: "#e4e4e7" },
    { name: "Matte Black", hex: "#18181b" },
  ],
  sneakers: [
    { name: "Cloud White", hex: "#f4f4f5" },
    { name: "Midnight Black", hex: "#1e293b" },
  ],
  clothes: [
    { name: "Midnight", hex: "#1d3557" },
    { name: "Stone", hex: "#a8a29e" },
  ],
  food: [
    { name: "Golden Butter", hex: "#d4af37" },
    { name: "Dark Cocoa", hex: "#4a2c1d" },
  ],
}

export interface ProductVariantConfig {
  colors: { name: string; hex: string; image?: string }[]
  variantLabel: string
  variantOptions: string[]
}

/**
 * Per-product color + type configuration keyed by primary image filename so
 * both live Supabase rows and offline fallback rows get tailored swatches,
 * real color-variant photos, and product-appropriate type/size options.
 */
const VARIANT_CONFIG_BY_IMAGE: Record<string, ProductVariantConfig> = {
  "airpods.png": {
    colors: [
      { name: "Pearl White", hex: "#e4e4e7", image: "/images/product/airpods.png" },
      { name: "Matte Black", hex: "#1f232b", image: "/images/product/variants/airpods-dark.webp" },
    ],
    variantLabel: "Edition",
    variantOptions: ["Standard ANC", "Studio Pro"],
  },
  "RMADRIDKIT.png": {
    colors: [
      { name: "Home White", hex: "#f3f4f6", image: "/images/product/RMADRIDKIT.png" },
      { name: "Away Obsidian", hex: "#1e293b", image: "/images/product/variants/RMADRIDKIT-dark.webp" },
    ],
    variantLabel: "Size",
    variantOptions: ["S", "M", "L", "XL", "XXL"],
  },
  "sneakers.png": {
    colors: [
      { name: "Cloud White", hex: "#f4f4f5", image: "/images/product/sneakers.png" },
      { name: "Solar Gold", hex: "#eab308", image: "/images/product/variants/sneakers-gold.webp" },
    ],
    variantLabel: "Size",
    variantOptions: ["40.5", "41", "42", "43", "44", "45"],
  },
  "Croisant.png": {
    colors: [
      { name: "Golden Butter", hex: "#d4883a", image: "/images/product/Croisant.png" },
      { name: "Dark Cocoa", hex: "#4a2614", image: "/images/product/variants/Croisant-choco.webp" },
    ],
    variantLabel: "Pack",
    variantOptions: ["Single", "Box of 4", "Box of 8"],
  },
  "iphone-17.png": {
    colors: [
      { name: "Cosmic Orange", hex: "#e57034", image: "/images/product/iphone-17.png" },
      { name: "Black Titanium", hex: "#26282c", image: "/images/product/variants/iphone-17-black.webp" },
    ],
    variantLabel: "Storage",
    variantOptions: ["256GB", "512GB", "1TB"],
  },
  "bluejacket.png": {
    colors: [
      { name: "Cobalt Blue", hex: "#0b75b8", image: "/images/product/bluejacket.png" },
      { name: "Obsidian Charcoal", hex: "#26292e", image: "/images/product/variants/bluejacket-dark.webp" },
    ],
    variantLabel: "Size",
    variantOptions: ["S", "M", "L", "XL"],
  },
  "S-kacket.png": {
    colors: [
      { name: "Camel Gold", hex: "#b88a4a", image: "/images/product/S-kacket.png" },
      { name: "Black & Gold", hex: "#1c1917", image: "/images/product/variants/S-kacket-dark.webp" },
    ],
    variantLabel: "Size",
    variantOptions: ["S", "M", "L", "XL"],
  },
  "laptop.png": {
    colors: [
      { name: "Space Gray", hex: "#4b5563", image: "/images/product/laptop.png" },
    ],
    variantLabel: "Memory / SSD",
    variantOptions: ["16GB · 512GB", "32GB · 1TB", "64GB · 2TB"],
  },
  "umbrella.png": {
    colors: [
      { name: "Crimson Red", hex: "#e63946", image: "/images/product/umbrella.png" },
      { name: "Midnight Black", hex: "#1f242d", image: "/images/product/variants/umbrella-black.webp" },
    ],
    variantLabel: "Canopy",
    variantOptions: ['Compact 42"', 'Full 48"'],
  },
  "weddg.png": {
    colors: [
      { name: "Ivory Lace", hex: "#f4efe6", image: "/images/product/weddg.png" },
      { name: "Rose Blush", hex: "#e8b4be", image: "/images/product/variants/weddg-blush.webp" },
    ],
    variantLabel: "Size",
    variantOptions: ["XS", "S", "M", "L", "XL"],
  },
}

export function getProductVariantConfig(product: Product): ProductVariantConfig {
  const category = storefrontCategory(product)
  const basename = product.image.split("/").pop() ?? ""
  const preset = VARIANT_CONFIG_BY_IMAGE[basename]

  const colors =
    product.custom_colors && product.custom_colors.length > 0
      ? product.custom_colors.map((c, idx) => ({
          name: c.name,
          hex: c.hex,
          image: c.image ?? product.images?.[idx] ?? (idx === 0 ? product.image : undefined),
        }))
      : preset?.colors ?? (COLORS_BY_CATEGORY[category] ?? COLORS_BY_CATEGORY.clothes)

  const variantOptions =
    product.custom_sizes && product.custom_sizes.length > 0
      ? product.custom_sizes
      : preset?.variantOptions ?? []

  const variantLabel = preset?.variantLabel ?? (category === "sneakers" ? "Size" : "Option")

  return { colors, variantLabel, variantOptions }
}

export function toStorefrontProduct(product: Product, isLiked: boolean): EcommerceProduct {
  const category = storefrontCategory(product)
  const specs = SPECS_BY_CATEGORY[category] ?? SPECS_BY_CATEGORY.clothes
  const { colors } = getProductVariantConfig(product)

  // Offers are merchant-controlled: only rows with a valid original_price
  // carry a compare-at price and discount badge. No fallback derivation —
  // without a stored offer there is no discount, period.
  const lowerName = product.name.toLowerCase()
  const isRealMadridKit = product.id === 2 || lowerName.includes("real madrid")
  const isPremium =
    isRealMadridKit ||
    product.id === 5 ||
    lowerName.includes("iphone 17 pro max") ||
    product.id === 7 ||
    lowerName.includes("varsity urban")

  const ordersCount = product.sold_count ?? Math.max(1, product.likes) * 25
  const freeShipping = product.price >= 50
  const badge = product.likes >= 80 ? "SuperDeal" : undefined
  const originalPrice =
    !isRealMadridKit && product.original_price && product.original_price > product.price
      ? product.original_price
      : undefined
  const discountPercent =
    !isRealMadridKit && originalPrice && originalPrice > product.price
      ? Math.round((1 - product.price / originalPrice) * 100)
      : undefined

  return {
    id: String(product.id),
    title: product.name,
    subtitle: product.description ?? "",
    price: product.price,
    originalPrice,
    discountPercent,
    ordersCount,
    freeShipping,
    category,
    imageUrl: product.image,
    video: getProductVideo(product),
    rating: product.rating,
    reviewsCount: product.reviews?.length ?? 0,
    badge,
    isPremium,
    stock: product.stock,
    specs,
    colors,
    isLiked,
  }
}

/** en-US formatting so prices don't shift with the server's locale. */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)
}

/** Clean transparent floating cutouts used by the editorial HeroShowcase. */
const HERO_CUTOUT_BY_IMAGE: Record<string, string> = {
  "airpods.png": "/images/product/cutouts/airpods.png",
  "bluejacket.png": "/images/product/cutouts/bluejacket.png",
  "iphone-17.png": "/images/product/cutouts/iphone-17.png",
  "laptop.png": "/images/product/cutouts/laptop.png",
  "S-kacket.png": "/images/product/cutouts/S-kacket.png",
  "sneakers.png": "/images/product/cutouts/sneakers.png",
  "umbrella.png": "/images/product/cutouts/umbrella.png",
}

function buildHeroSubtitle(description: string | undefined, category: string): string {
  const clean = (description ?? "").replace(/\s+/g, " ").trim()
  if (clean) {
    const firstSentence = clean.split(/[.!?]/)[0]?.trim() || clean
    if (firstSentence.length <= 64) return firstSentence
    const sliced = firstSentence.slice(0, 62)
    const lastSpace = sliced.lastIndexOf(" ")
    return `${(lastSpace > 24 ? sliced.slice(0, lastSpace) : sliced).trim()}…`
  }
  const labels: Record<string, string> = {
    phones: "Phones & IT",
    gaming: "Audio & Gaming",
    sneakers: "Footwear",
    clothes: "Apparel",
    food: "Gourmet Food",
  }
  return labels[category] ?? "Curated Selection"
}

/** Maps a store product onto the moving hero showcase card. */
export function toHeroItem(product: Product): HeroProductItem {
  const originalPrice =
    product.original_price && product.original_price > product.price
      ? product.original_price
      : undefined
  const discountPercent =
    originalPrice && originalPrice > product.price
      ? Math.round((1 - product.price / originalPrice) * 100)
      : undefined
  const badge =
    discountPercent && discountPercent > 0 ? `-${discountPercent}% OFF` : undefined
  const category = storefrontCategory(product)
  const basename = product.image.split("/").pop() ?? ""

  return {
    id: String(product.id),
    name: product.name,
    subtitle: buildHeroSubtitle(product.description, category),
    category,
    price: `$${formatPrice(product.price)}`,
    originalPrice:
      originalPrice && originalPrice > product.price ? `$${formatPrice(originalPrice)}` : undefined,
    discountBadge: badge,
    shipping: product.price >= 50 ? "FREE SHIPPING" : "FAST SHIPPING",
    mainImage: product.image,
    cutoutImage: HERO_CUTOUT_BY_IMAGE[basename],
    video: getProductVideo(product),
  }
}
