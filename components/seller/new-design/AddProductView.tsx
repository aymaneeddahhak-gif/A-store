"use client"

import { useState } from "react"
import { GeneralInfoCard } from "./GeneralInfoCard"
import { PricingStockCard } from "./PricingStockCard"
import { UploadImageCard } from "./UploadImageCard"
import { CategoryCard, type CategoryOption } from "./CategoryCard"
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
  isDarkMode = false,
  initial,
  categories,
  onAddCategory,
  onBack,
  onSaved,
  onToast,
}: {
  isDarkMode?: boolean
  initial?: ProductItem | null
  categories: CategoryOption[]
  onAddCategory?: (label: string) => Promise<{ ok: boolean; error?: string }>
  onBack: () => void
  onSaved: (payload: ReturnType<typeof toProductPayload>, editingId: string | null) => Promise<boolean>
  onToast: (msg: string) => void
}) {
  const isEdit = !!initial
  const [name, setName] = useState(initial?.name ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initial?.sizes ?? ["M", "L"])
  const [availableSizes, setAvailableSizes] = useState<string[]>(() => {
    const merged = [...["XS", "S", "M", "L", "XL", "XXL"]]
    for (const s of initial?.sizes ?? []) {
      if (!merged.includes(s)) merged.push(s)
    }
    return merged
  })
  const [availableColors, setAvailableColors] = useState<ColorOption[]>(() => {
    const byName = new Map<string, ColorOption>()
    for (const c of initial?.colorOptions ?? []) {
      byName.set(c.name.toLowerCase(), c)
    }
    for (const d of DEFAULT_COLORS) {
      if (!byName.has(d.name.toLowerCase())) {
        byName.set(d.name.toLowerCase(), d)
      }
    }
    return Array.from(byName.values())
  })
  const [selectedColors, setSelectedColors] = useState<string[]>(initial?.colors ?? [])
  const [gender, setGender] = useState<"Men" | "Woman" | "Unisex">(initial?.gender ?? "Unisex")
  const [sku, setSku] = useState(initial?.sku ?? "")
  const [productType, setProductType] = useState(initial?.productType ?? "")
  const [basePrice, setBasePrice] = useState(initial?.price ?? "")
  const [stock, setStock] = useState(initial?.stock ?? "10")
  const [discount, setDiscount] = useState(initial?.discount ?? "0%")
  const [discountType, setDiscountType] = useState(initial?.discountType ?? "Member Exclusive")
  const [stockStatus, setStockStatus] = useState<ProductItem["status"]>(initial?.status ?? "In Stock")
  const [category, setCategory] = useState(initial?.category ?? categories[0]?.id ?? "")
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [video, setVideo] = useState<string>(initial?.video ?? "")
  const [activeImage, setActiveImage] = useState(0)
  const [busy, setBusy] = useState(false)

  const toggleSize = (s: string) =>
    setSelectedSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  const toggleColor = (c: string) =>
    setSelectedColors((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  const updateColorImage = (colorName: string, image: string | undefined) => {
    setAvailableColors((prev) =>
      prev.map((col) => (col.name.toLowerCase() === colorName.toLowerCase() ? { ...col, image } : col))
    )
  }

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
          const isVid = src.startsWith("data:video")
          const file = dataUrlToFile(src, `product-${Date.now()}-${i}.${isVid ? "mp4" : "png"}`)
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
      // Showcase video: upload the local blob, keep remote URLs as-is.
      let finalVideo = ""
      if (video) {
        if (video.startsWith("data:")) {
          const file = dataUrlToFile(video, `product-video-${Date.now()}.mp4`)
          if (file) {
            const fd = new FormData()
            fd.append("file", file)
            const res = await uploadMediaAction(fd)
            if (res.ok) finalVideo = res.data.url
            else onToast(res.error)
          }
        } else {
          finalVideo = video
        }
      }
      // Upload any new variant color photos stored as data: URLs first.
      const resolvedColors: ColorOption[] = []
      for (let i = 0; i < availableColors.length; i++) {
        const col = availableColors[i]
        if (selectedColors.includes(col.name) && col.image?.startsWith("data:")) {
          const file = dataUrlToFile(col.image, `color-${Date.now()}-${i}.png`)
          if (file) {
            const fd = new FormData()
            fd.append("file", file)
            const res = await uploadMediaAction(fd)
            if (res.ok) {
              resolvedColors.push({ ...col, image: res.data.url })
              continue
            }
          }
        }
        resolvedColors.push(col)
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
        availableColors: resolvedColors,
      })
      if (finalVideo) payload.video = finalVideo
      const ok = await onSaved(payload, initial?.id ?? null)
      if (ok) onBack()
    } finally {
      setBusy(false)
    }
  }

  /** One click fills every field with sample data (images + video included)
      so the whole CRUD flow can be tried instantly in the portfolio demo. */
  const fillDemo = () => {
    setName("Aura Wireless Headphones")
    setDescription(
      "Studio-grade 40mm drivers with adaptive noise cancelling, 40-hour battery life and a featherlight aluminum headband. USB-C fast charge gives 6 hours of playback in 10 minutes."
    )
    setBasePrice("129.99")
    setStock("24")
    setDiscount("20%")
    setCategory(categories.some((c) => c.id === "phones") ? "phones" : categories[0]?.id ?? "")
    setProductType("Audio")
    setSku("SKU-DEMO-001")
    setSelectedSizes(["One Size"])
    if (!availableSizes.includes("One Size")) setAvailableSizes((p) => [...p, "One Size"])
    setSelectedColors(["Black", "Silver"])
    setImages([
      "/images/product/airpods.png",
      "/images/product/iphone-17.png",
      "/videos/product/earpodsvideos.mp4",
    ])
    setVideo("/videos/product/earpodsvideos.mp4")
    setActiveImage(0)
    onToast("Demo product filled — review and press Add Product.")
  }

  return (
    <div>
      <PageHeader
        isDarkMode={isDarkMode}
        isEditMode={isEdit}
        onBack={onBack}
        onSaveDraft={() => onToast("Draft saved locally — publish via Add Product")}
        onAddProduct={handleSave}
        isSubmitting={busy}
        onFillDemo={fillDemo}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <GeneralInfoCard
            isDarkMode={isDarkMode}
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
            onUpdateColorImage={updateColorImage}
            gender={gender}
            onGenderChange={setGender}
            sku={sku}
            onSkuChange={setSku}
            productType={productType}
            onProductTypeChange={setProductType}
          />
          <PricingStockCard
            isDarkMode={isDarkMode}
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
            isDarkMode={isDarkMode}
            images={images}
            activeImageIndex={activeImage}
            onSelectImage={setActiveImage}
            onAddCustomImage={(url) => {
              setImages((p) => {
                setActiveImage(p.length)
                return [...p, url]
              })
            }}
            video={video}
            onAddVideo={(url) => setVideo(url)}
            onRemoveVideo={() => setVideo("")}
          />
          <CategoryCard
            isDarkMode={isDarkMode}
            category={category}
            onCategoryChange={setCategory}
            categories={categories}
            onAddCategory={(c) => {
              void Promise.resolve(onAddCategory?.(c)).then((res) => {
                if (res && !res.ok) onToast(res.error ?? "Could not add the category.")
              })
            }}
          />
        </div>
      </div>
    </div>
  )
}
