"use client"

import { useState } from "react"
import { GeneralInfoCard } from "./GeneralInfoCard"
import { PricingStockCard } from "./PricingStockCard"
import { UploadImageCard } from "./UploadImageCard"
import { CategoryCard } from "./CategoryCard"
import { PageHeader } from "./PageHeader"
import type { ColorOption, ProductItem } from "./types"
import { toProductPayload } from "./mapping"
import { uploadMediaAction } from "@/lib/actions/media"

function dataUrlToFile(dataUrl: string, name: string): File | null {
  try {
    const [meta, base64] = dataUrl.split(",")
    if (!base64) return null
    const mime = meta.match(/data:(.*?);/)?.[1] ?? "image/png"
    const bytes = atob(base64)
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    return new File([arr], name, { type: mime })
  } catch {
    return null
  }
}

const DEFAULT_COLORS: ColorOption[] = [
  { name: "Mint", hex: "#98E4AF" },
  { name: "Black", hex: "#1E2022" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Olive", hex: "#65735B" },
  { name: "Slate", hex: "#64748B" },
  { name: "Sand", hex: "#D2C3B2" },
]

/** New-design add/edit form wired to the real catalog. data: URLs upload on save. */
export function AddProductView({
  initial,
  categories,
  onBack,
  onSaved,
  onToast,
}: {
  initial?: ProductItem | null
  categories: string[]
  onBack: () => void
  onSaved: (payload: ReturnType<typeof toProductPayload>, editingId: string | null) => Promise<boolean>
  onToast: (msg: string) => void
}) {
  const isEdit = !!initial
  const [name, setName] = useState(initial?.name ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initial?.sizes ?? ["M", "L"])
  const [availableSizes, setAvailableSizes] = useState<string[]>(["XS", "S", "M", "L", "XL", "XXL"])
  const [availableColors, setAvailableColors] = useState<ColorOption[]>(DEFAULT_COLORS)
  const [selectedColors, setSelectedColors] = useState<string[]>(initial?.colors ?? [])
  const [gender, setGender] = useState<"Men" | "Woman" | "Unisex">(initial?.gender ?? "Unisex")
  const [sku, setSku] = useState(initial?.sku ?? "")
  const [productType, setProductType] = useState(initial?.productType ?? "")
  const [basePrice, setBasePrice] = useState(initial?.price ?? "")
  const [stock, setStock] = useState(initial?.stock ?? "10")
  const [discount, setDiscount] = useState(initial?.discount ?? "0%")
  const [discountType, setDiscountType] = useState(initial?.discountType ?? "Member Exclusive")
  const [stockStatus, setStockStatus] = useState<ProductItem["status"]>(initial?.status ?? "In Stock")
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? "")
  const [localCategories, setLocalCategories] = useState<string[]>(categories)
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [activeImage, setActiveImage] = useState(0)
  const [busy, setBusy] = useState(false)

  const toggleSize = (s: string) =>
    setSelectedSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  const toggleColor = (c: string) =>
    setSelectedColors((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  const handleSave = async () => {
    if (!name.trim()) {
      onToast("Please enter a product name")
      return
    }
    if (images.length === 0) {
      onToast("Upload at least one product image")
      return
    }
    setBusy(true)
    try {
      // Upload any local data: URLs to Supabase storage first.
      const finalImages: string[] = []
      for (let i = 0; i < images.length; i++) {
        const src = images[i]
        if (src.startsWith("data:")) {
          const file = dataUrlToFile(src, `product-${Date.now()}-${i}.png`)
          if (!file) continue
          const fd = new FormData()
          fd.append("file", file)
          const res = await uploadMediaAction(fd)
          if (res.ok) finalImages.push(res.data.url)
          else onToast(res.error)
        } else {
          finalImages.push(src)
        }
      }
      if (finalImages.length === 0) {
        onToast("Image upload failed — product not saved")
        return
      }
      const payload = toProductPayload({
        name,
        basePrice,
        stock,
        discount,
        category,
        description,
        images: finalImages,
        selectedSizes,
        selectedColors,
        availableColors,
      })
      const ok = await onSaved(payload, initial?.id ?? null)
      if (ok) onBack()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        isEditMode={isEdit}
        onBack={onBack}
        onSaveDraft={() => onToast("Draft saved locally — publish via Add Product")}
        onAddProduct={handleSave}
        isSubmitting={busy}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <GeneralInfoCard
            name={name}
            onNameChange={setName}
            description={description}
            onDescriptionChange={setDescription}
            selectedSizes={selectedSizes}
            availableSizes={availableSizes}
            onToggleSize={toggleSize}
            onAddCustomSize={(s) => setAvailableSizes((p) => (p.includes(s) ? p : [...p, s]))}
            selectedColors={selectedColors}
            availableColors={availableColors}
            onToggleColor={toggleColor}
            onAddCustomColor={(c) => setAvailableColors((p) => [...p, c])}
            gender={gender}
            onGenderChange={setGender}
            sku={sku}
            onSkuChange={setSku}
            productType={productType}
            onProductTypeChange={setProductType}
          />
          <PricingStockCard
            basePrice={basePrice}
            onBasePriceChange={setBasePrice}
            stock={stock}
            onStockChange={setStock}
            discount={discount}
            onDiscountChange={setDiscount}
            discountType={discountType}
            onDiscountTypeChange={setDiscountType}
            stockStatus={stockStatus}
            onStockStatusChange={setStockStatus}
          />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <UploadImageCard
            images={images}
            activeImageIndex={activeImage}
            onSelectImage={setActiveImage}
            onAddCustomImage={(url) => {
              setImages((p) => {
                setActiveImage(p.length)
                return [...p, url]
              })
            }}
          />
          <CategoryCard
            category={category}
            onCategoryChange={setCategory}
            categories={localCategories}
            onAddCategory={(c) => setLocalCategories((p) => (p.includes(c) ? p : [...p, c]))}
          />
        </div>
      </div>
    </div>
  )
}
