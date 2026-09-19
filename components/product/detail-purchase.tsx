"use client"

import { Star, ShoppingBag, Heart, Truck } from "lucide-react"
import Image from "next/image"
import type { Product } from "@/lib/types"
import { SHIPPING_FEE } from "@/lib/types"
import { useCart } from "@/contexts/providers/cart-context"
import { useLikes } from "@/contexts/providers/likes-context"
import { useCatalog } from "@/contexts/providers/catalog-context"

/** EU sizes — shown only for sneakers, the one category sized like footwear. */
const SNEAKER_SIZES = ["40.5", "41", "42", "43", "43.5", "44", "44.5", "45", "46"]

/**
 * Purchase column — category/SKU header, title, rating, price, color + size
 * pickers, add-to-cart and wishlist, free-delivery note. Color/size live in
 * the page experience so the reviews form can reference the selection.
 */
export function DetailPurchase({
  product: initialProduct,
  categoryLabel,
  colors,
  showSizes,
  customSizes,
  selectedColor,
  onSelectColor,
  onSelectImage,
  selectedSize,
  onSelectSize,
  onOpenSizeGuide,
  isEditing = false,
  onUpdateItem,
}: {
  product: Product
  categoryLabel: string
  colors: { name: string; hex: string }[]
  showSizes: boolean
  customSizes: string[]
  selectedColor: string
  onSelectColor: (color: string) => void
  onSelectImage: () => void
  selectedSize: string
  onSelectSize: (size: string) => void
  onOpenSizeGuide: () => void
  /** True when opened from the checkout "Edit" badge — button updates the line. */
  isEditing?: boolean
  onUpdateItem?: () => void
}) {
  const { addToCart } = useCart()
  const { isLiked, toggleLike } = useLikes()
  const { products } = useCatalog()
  // Live row so the rating reflects newly posted reviews without a reload.
  const product = products.find((p) => p.id === initialProduct.id) ?? initialProduct
  const liked = isLiked(product.id)

  const reviewCount = product.reviews?.length ?? 0
  const rating = product.rating || 0
  const soldCount = product.sold_count ?? Math.max(1, product.likes) * 25
  const soldLabel =
    soldCount >= 1000
      ? `${parseFloat((soldCount / 1000).toFixed(1))}k`
      : `${soldCount}`
  // Compare-at price only exists on SuperDeal rows — same rule as the cards.
  // Compare-at price follows the same merchant rule as the cards.
  const compareAt =
    product.original_price && product.original_price > product.price
      ? product.original_price
      : 0
  const freeShipping = product.price >= 50
  const soldOut = product.stock !== undefined && product.stock <= 0

  return (
    <div className="flex flex-col justify-between w-full h-full pt-1 sm:pt-2">
      <div>
        {/* Category & SKU Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-tight text-neutral-900 uppercase dark:text-[var(--foreground)]">
            {categoryLabel}
          </span>
          <span className="text-[11px] font-mono tracking-wider text-neutral-300 dark:text-[var(--muted-foreground)] select-none">
            SKU-{product.id}
          </span>
        </div>

        {/* Product Title */}
        <h1 className="text-2xl sm:text-[28px] lg:text-[30px] font-bold text-neutral-900 tracking-tight leading-snug mt-3 dark:text-[var(--foreground)]">
          {product.name}
        </h1>

        {/* Star Rating */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex items-center gap-0.5 text-[#f5be38]" role="img" aria-label={`Rated ${rating} out of 5`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= Math.round(rating)
                    ? "fill-[#f5be38] text-[#f5be38]"
                    : "fill-[#e8e4db] text-[#e8e4db] dark:fill-white/10 dark:text-white/10"
                }`}
                aria-hidden
              />
            ))}
          </div>
          <span className="text-xs text-neutral-400 font-normal dark:text-[var(--muted-foreground)]">
            {rating ? `${rating} · ` : ""}{reviewCount} review{reviewCount === 1 ? "" : "s"}
            {soldCount > 0 ? ` · ${soldLabel} sold` : ""}
          </span>
        </div>

        {/* Price */}
        <div className="mt-5 mb-5 flex items-baseline gap-3">
          <span className="text-3xl sm:text-[34px] font-bold text-neutral-900 tracking-tight dark:text-[var(--foreground)]">
            ${product.price.toFixed(2)}
          </span>
          {compareAt > product.price && (
            <span className="text-lg font-medium text-neutral-400 line-through dark:text-[var(--muted-foreground)]">
              ${compareAt.toFixed(2)}
            </span>
          )}
        </div>

        {/* Color Picker */}
        {colors.length > 0 && (
          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-800 font-medium dark:text-[var(--foreground)]">Color</span>
              <span className="text-neutral-400">•</span>
              <span className="text-neutral-400 font-normal dark:text-[var(--muted-foreground)]">{selectedColor}</span>
            </div>
            <div className="flex items-center gap-3">
              {colors.map((c) => {
                const isSelected = selectedColor === c.name
                return (
                  <div key={c.name} className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectColor(c.name)
                        onSelectImage()
                      }}
                      title={c.name}
                      aria-label={`Color ${c.name}`}
                      aria-pressed={isSelected}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden p-1 bg-[#f4f3f0] dark:bg-white/10 flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? "ring-2 ring-neutral-800 ring-offset-1 dark:ring-white dark:ring-offset-[var(--card)]"
                          : "border border-neutral-200 hover:border-neutral-400 dark:border-white/10 dark:hover:border-white/40"
                      }`}
                    >
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover rounded-lg pointer-events-none"
                      />
                    </button>
                    <span
                      className="block h-1 w-10 rounded-full"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Size Picker (footwear EU sizes, or the seller's custom list) */}
        {(showSizes || customSizes.length > 0) && (
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-800 font-medium dark:text-[var(--foreground)]">Size</span>
              <span className="text-neutral-400">•</span>
              <span className="text-neutral-400 font-normal dark:text-[var(--muted-foreground)]">
                {showSizes ? "EU Men" : selectedSize || "Select"}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {(customSizes.length > 0 ? customSizes : SNEAKER_SIZES).map((s) => {
                const isSelected = selectedSize === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSelectSize(s)}
                    aria-pressed={isSelected}
                    className={`py-2 px-1 text-center text-xs font-medium rounded-md transition-all cursor-pointer ${
                      isSelected
                        ? "bg-black text-white shadow-xs font-semibold dark:bg-white dark:text-black"
                        : "bg-white border border-neutral-200/90 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 dark:bg-white/5 dark:border-white/10 dark:text-[var(--foreground)] dark:hover:bg-white/10"
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>

            {/* Size Guide Link (EU footwear table only) */}
            {showSizes && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onOpenSizeGuide}
                  className="text-[11.5px] text-neutral-400 hover:text-neutral-700 underline underline-offset-2 transition-colors cursor-pointer dark:text-[var(--muted-foreground)] dark:hover:text-[var(--foreground)]"
                >
                  Size guide
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Purchase Actions */}
      <div className="space-y-3 pt-2">
        {isEditing && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11.5px] text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
            Editing your cart item — pick the color and size, then update.
          </div>
        )}
        <div className="flex items-center gap-2.5">
          {/* Add to Cart / Update cart item */}
          <button
            type="button"
            onClick={() => (isEditing && onUpdateItem ? onUpdateItem() : addToCart(product, 1, { color: selectedColor, size: showSizes ? selectedSize : undefined }))}
            disabled={soldOut}
            className="flex-1 bg-black hover:bg-neutral-800 active:scale-[0.99] text-white py-3 px-6 rounded-xl font-medium text-[13.5px] flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer select-none dark:bg-white dark:text-black dark:hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={1.8} aria-hidden />
            <span>{soldOut ? "Sold out" : isEditing ? "Update cart item" : "Add to cart"}</span>
          </button>

          {/* Wishlist Heart Button */}
          <button
            type="button"
            onClick={() => toggleLike(product)}
            aria-pressed={liked}
            className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center border ${
              liked
                ? "bg-red-50 border-red-200 text-red-500"
                : "bg-[#f7f6f2] hover:bg-[#edece7] border-transparent text-neutral-700 hover:text-black dark:bg-white/5 dark:hover:bg-white/10 dark:text-[var(--foreground)]"
            }`}
            title={liked ? "Remove from favorites" : "Save to favorites"}
          >
            <Heart
              className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : ""}`}
              strokeWidth={1.8}
              aria-hidden
            />
          </button>
        </div>

        {/* Free Delivery Banner */}
        <div className="flex items-center gap-2 text-neutral-700 text-xs font-medium pt-1 dark:text-[var(--muted-foreground)]">
          <Truck className="w-4 h-4 text-neutral-800 shrink-0 dark:text-[var(--foreground)]" strokeWidth={1.8} aria-hidden />
          <span>
            {freeShipping
              ? "Free delivery on orders over $50"
              : `Fast delivery · $${SHIPPING_FEE.toFixed(0)} flat shipping`}
          </span>
        </div>

        {/* Stock Note */}
        {soldOut ? (
          <p className="text-xs font-bold text-rose-500">Sold out</p>
        ) : (
          product.stock !== undefined &&
          product.stock <= 5 && (
            <p className="text-xs font-semibold text-amber-500">
              Only {product.stock} left in stock
            </p>
          )
        )}
      </div>
    </div>
  )
}
