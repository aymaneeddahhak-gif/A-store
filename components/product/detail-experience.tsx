"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import type { Product } from "@/lib/types"
import { getProductMedia } from "@/lib/product-media"
import { useCart } from "@/contexts/providers/cart-context"
import { DetailGallery } from "@/components/product/detail-gallery"
import { DetailPurchase } from "@/components/product/detail-purchase"

const DetailReviews = dynamic(
  () => import("@/components/product/detail-reviews").then((m) => m.DetailReviews),
  { ssr: false }
)

const SizeGuideModal = dynamic(
  () => import("@/components/product/size-guide-modal").then((m) => m.SizeGuideModal),
  { ssr: false }
)

/**
 * Detail experience — gallery + purchase column + full-width reviews.
 * Color/size selection lives here so the reviews form can reference it.
 *
 * When the page is opened with ?edit=1 (the checkout "Edit" badge), the
 * pickers start on the cart line's saved variant and the primary button
 * updates that line instead of adding a new one.
 */
function CartEditSync({
  productId,
  cart,
  cartHydrated,
  onSyncEdit,
}: {
  productId: number
  cart: ReturnType<typeof useCart>["cart"]
  cartHydrated: boolean
  onSyncEdit: (editing: boolean, color?: string, size?: string) => void
}) {
  const searchParams = useSearchParams()
  const isEditParam = Boolean(searchParams.get("edit"))
  const editingItem = isEditParam ? cart.find((item) => item.id === productId) : undefined
  const appliedRef = useRef(false)

  useEffect(() => {
    if (appliedRef.current || !cartHydrated || !editingItem) return
    appliedRef.current = true
    onSyncEdit(true, editingItem.color, editingItem.size)
  }, [cartHydrated, editingItem, onSyncEdit])

  return null
}

export function DetailExperience({
  product,
  categoryLabel,
  colors,
  variantLabel = "Size",
  variantOptions = [],
  showSizes,
}: {
  product: Product
  categoryLabel: string
  colors: { name: string; hex: string; image?: string }[]
  variantLabel?: string
  variantOptions?: string[]
  showSizes: boolean
}) {
  const { cart, cartHydrated, updateCartItem } = useCart()
  const router = useRouter()

  const defaultOption = variantOptions[0] ?? (showSizes ? "42" : "")
  const [selectedColor, setSelectedColor] = useState(colors[0]?.name ?? "")
  const [selectedSize, setSelectedSize] = useState(defaultOption)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const handleSyncEdit = useCallback((editing: boolean, color?: string, size?: string) => {
    setIsEditing(editing)
    if (color) setSelectedColor(color)
    if (size) setSelectedSize(size)
  }, [])

  const colorImages = useMemo(
    () => colors.map((c) => c.image).filter((src): src is string => Boolean(src)),
    [colors]
  )
  const media = useMemo(() => getProductMedia(product, colorImages), [product, colorImages])

  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName)
    const matchedColor = colors.find((c) => c.name === colorName)
    if (matchedColor?.image) {
      const idx = media.findIndex((m) => m.kind === "image" && m.src === matchedColor.image)
      setSelectedIndex(idx >= 0 ? idx : 0)
    } else {
      setSelectedIndex(0)
    }
  }

  const handleUpdateItem = () => {
    if (!isEditing) return
    updateCartItem(product.id, { color: selectedColor, size: selectedSize })
    router.push("/checkout")
  }

  return (
    <>
      <Suspense fallback={null}>
        <CartEditSync
          productId={product.id}
          cart={cart}
          cartHydrated={cartHydrated}
          onSyncEdit={handleSyncEdit}
        />
      </Suspense>
      {/* Main 2-Column Product Layout */}
      <div className="mt-2 grid grid-cols-1 items-start gap-8 md:grid-cols-2 lg:gap-12">
        <div className="w-full">
          <DetailGallery
            media={media}
            title={product.name}
            selectedIndex={selectedIndex}
            onSelectIndex={setSelectedIndex}
          />
        </div>
        <div className="h-full w-full md:sticky md:top-6">
          <DetailPurchase
            product={product}
            categoryLabel={categoryLabel}
            colors={colors}
            variantLabel={variantLabel}
            showSizes={showSizes}
            customSizes={variantOptions.length > 0 ? variantOptions : (product.custom_sizes ?? [])}
            selectedColor={selectedColor}
            onSelectColor={handleSelectColor}
            onSelectImage={() => {}}
            selectedSize={selectedSize}
            onSelectSize={setSelectedSize}
            onOpenSizeGuide={() => setSizeGuideOpen(true)}
            isEditing={isEditing}
            onUpdateItem={handleUpdateItem}
          />
        </div>
      </div>

      {/* Full-width Reviews Section */}
      <div className="mt-10 w-full border-t border-neutral-200/80 pt-8 dark:border-white/10">
        <DetailReviews
          product={product}
          selectedSize={selectedSize}
          selectedColorName={selectedColor}
          showSizes={showSizes}
        />
      </div>

      {sizeGuideOpen && (
        <SizeGuideModal
          productTitle={product.name}
          selectedSize={selectedSize}
          onSelectSize={setSelectedSize}
          onClose={() => setSizeGuideOpen(false)}
        />
      )}
    </>
  )
}
