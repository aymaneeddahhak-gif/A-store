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

const COLORS_BY_CATEGORY: Record<string, { name: string; hex: string }[]> = {
  phones: [
    { name: "Desert Titanium", hex: "#cbb69d" },
    { name: "Natural Titanium", hex: "#9e978e" },
    { name: "Black Titanium", hex: "#2b2b2d" },
  ],
  gaming: [
    { name: "Silver", hex: "#d4d4d8" },
    { name: "Midnight Blue", hex: "#1e293b" },
    { name: "Matte Black", hex: "#18181b" },
  ],
  sneakers: [
    { name: "Cyan Blue", hex: "#00b4d8" },
    { name: "Lavender", hex: "#b5a6c9" },
    { name: "Midnight Navy", hex: "#1d3557" },
  ],
  clothes: [
    { name: "Midnight", hex: "#1d3557" },
    { name: "Stone", hex: "#a8a29e" },
    { name: "Ivory", hex: "#f1f5f9" },
  ],
  food: [
    { name: "Golden", hex: "#d4af37" },
    { name: "Cocoa", hex: "#78350f" },
  ],
}

export function toStorefrontProduct(product: Product, isLiked: boolean): EcommerceProduct {
  const category = storefrontCategory(product)
  const specs = SPECS_BY_CATEGORY[category] ?? SPECS_BY_CATEGORY.clothes
  // Seller-defined swatches win; otherwise the category defaults apply.
  const colors =
    product.custom_colors && product.custom_colors.length > 0
      ? product.custom_colors.map((c) => ({ name: c.name, hex: c.hex }))
      : (COLORS_BY_CATEGORY[category] ?? COLORS_BY_CATEGORY.clothes)

  // Offers are merchant-controlled: only rows with a valid original_price
  // carry a compare-at price and discount badge. No fallback derivation —
  // without a stored offer there is no discount, period.
  const ordersCount = product.sold_count ?? Math.max(1, product.likes) * 25
  const freeShipping = product.price >= 50
  const badge = product.likes >= 80 ? "SuperDeal" : undefined
  const originalPrice =
    product.original_price && product.original_price > product.price
      ? product.original_price
      : undefined
  const discountPercent =
    originalPrice && originalPrice > product.price
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

  return {
    id: String(product.id),
    name: product.name.toUpperCase(),
    price: `$${formatPrice(product.price)}`,
    originalPrice:
      originalPrice && originalPrice > product.price ? `$${formatPrice(originalPrice)}` : undefined,
    discountBadge: badge,
    shipping: product.price >= 50 ? "FREE SHIPPING" : "FAST SHIPPING",
    mainImage: product.image,
    video: getProductVideo(product),
  }
}
