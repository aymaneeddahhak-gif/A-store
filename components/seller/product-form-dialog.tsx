"use client"

import { useRef, useState } from "react"
import { X, Loader2, Sparkles, Upload } from "lucide-react"
import type { Product } from "@/lib/types"
import { randomSuggestion } from "@/lib/suggested-products"
import { uploadMediaAction } from "@/lib/actions/media"

export type ProductFormData = {
  name: string
  price: string
  original_price: string
  category: string
  description: string
  image: string
  video: string
  stock: string
  is_published: boolean
  custom_colors: { name: string; hex: string }[]
  custom_sizes: string[]
  images: string[]
}

export const EMPTY_PRODUCT_FORM: ProductFormData = {
  name: "",
  price: "",
  original_price: "",
  category: "clothes",
  description: "",
  image: "/images/product/S-kacket.png",
  video: "",
  stock: "",
  is_published: true,
  custom_colors: [],
  custom_sizes: [],
  images: [],
}

export function ProductFormDialog({
  isOpen,
  editingProduct,
  formData,
  categories,
  isProcessing,
  onClose,
  onChange,
  onSubmit,
}: {
  isOpen: boolean
  editingProduct: Product | null
  formData: ProductFormData
  categories: { id: string; label: string }[]
  isProcessing: boolean
  onClose: () => void
  onChange: (data: ProductFormData) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  const [uploading, setUploading] = useState<"image" | "video" | null>(null)
  const [uploadError, setUploadError] = useState("")
  // Mirror of the latest form values for the async upload callback, which
  // would otherwise close over a stale render.
  const formRef = useRef(formData)
  formRef.current = formData

  if (!isOpen) return null

  async function handleFile(kind: "image" | "video", file: File | undefined) {
    if (!file || uploading) return
    setUploading(kind)
    setUploadError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await uploadMediaAction(fd)
      if (res.ok) {
        onChange({ ...formRef.current, [kind]: res.data.url })
      } else {
        setUploadError(res.error)
      }
    } finally {
      setUploading(null)
    }
  }

  async function handleExtraImageUpload(file: File | undefined) {
    if (!file || uploading) return
    setUploading("image")
    setUploadError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await uploadMediaAction(fd)
      if (res.ok) {
        const current = formRef.current
        if (!current.images.includes(res.data.url)) {
          onChange({ ...current, images: [...current.images, res.data.url] })
        }
      } else {
        setUploadError(res.error)
      }
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm border-0 cursor-default"
        onClick={onClose}
        aria-label="Close product form"
      />
      <div className="relative w-full max-w-md bg-[var(--background)] border-l border-[var(--border-color)] p-8 overflow-y-auto animate-in slide-in-from-right duration-500 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">
            {editingProduct ? "Edit Product" : "New Product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:bg-[var(--glass-bg)] rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {!editingProduct && (
          <button
            type="button"
            onClick={() => {
              const s = randomSuggestion(formData.name)
              onChange({
                ...formData,
                name: s.name,
                price: s.price,
                category: s.category,
                description: s.description,
                image: s.image,
                video: s.video,
              })
            }}
            className="w-full mb-6 py-3 px-4 bg-[var(--accent-muted)] border border-[var(--border-color)] rounded-xl text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles size={15} aria-hidden />
            Fill with a suggested product
          </button>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider opacity-50">Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border-color)] rounded-xl focus:ring-1 focus:ring-[var(--foreground)] outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-50">
                Price ($)
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => onChange({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border-color)] rounded-xl focus:ring-1 focus:ring-[var(--foreground)] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-50">
                Compare-at $ <span className="normal-case font-medium">(empty = no sale)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 199.99"
                value={formData.original_price}
                onChange={(e) => onChange({ ...formData, original_price: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border-color)] rounded-xl focus:ring-1 focus:ring-[var(--foreground)] outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-50">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => onChange({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border-color)] rounded-xl focus:ring-1 focus:ring-[var(--foreground)] outline-none appearance-none"
              >
                {categories.filter(({ id }) => id !== "all").map(({ id, label }) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
                {!categories.some(({ id }) => id === formData.category) &&
                  formData.category !== "" && (
                    <option value={formData.category}>
                      {formData.category} (legacy)
                    </option>
                  )}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider opacity-50">
              Image Path
            </label>
            <input
              required
              type="text"
              value={formData.image}
              onChange={(e) => onChange({ ...formData, image: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border-color)] rounded-xl focus:ring-1 focus:ring-[var(--foreground)] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider opacity-50">
              Video Path <span className="normal-case font-medium">(optional showcase clip)</span>
            </label>
            <input
              type="text"
              value={formData.video}
              placeholder="/videos/product/sneakersvideo.mp4"
              onChange={(e) => onChange({ ...formData, video: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border-color)] rounded-xl focus:ring-1 focus:ring-[var(--foreground)] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider opacity-50">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => onChange({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border-color)] rounded-xl focus:ring-1 focus:ring-[var(--foreground)] outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(["image", "video"] as const).map((kind) => (
              <label
                key={kind}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-[var(--border-color)] text-[11px] font-bold uppercase tracking-wider opacity-70 hover:opacity-100 transition-all ${
                  uploading ? "pointer-events-none opacity-40" : "cursor-pointer"
                }`}
              >
                <input
                  type="file"
                  accept={kind === "image" ? "image/*" : "video/*"}
                  className="hidden"
                  disabled={uploading !== null}
                  onChange={(e) => {
                    void handleFile(kind, e.target.files?.[0])
                    e.target.value = ""
                  }}
                />
                <Upload size={13} aria-hidden />
                {uploading === kind ? "Uploading…" : `Upload ${kind}`}
              </label>
            ))}
          </div>
          {uploadError && <p className="-mt-3 text-xs text-red-500 font-medium">{uploadError}</p>}
          {formData.image !== "" && (
            <img
              src={formData.image}
              alt="Product preview"
              className="h-20 w-auto rounded-xl object-cover border border-[var(--border-color)]"
            />
          )}

          {/* Extra images (optional gallery angles, same file allowed) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider opacity-50">
                Extra Images
              </label>
              <div className="flex items-center gap-2">
                <label
                  className={`text-[11px] font-bold uppercase tracking-wider opacity-70 hover:opacity-100 transition-all cursor-pointer inline-flex items-center gap-1 ${
                    uploading ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading !== null}
                    onChange={(e) => {
                      void handleExtraImageUpload(e.target.files?.[0])
                      e.target.value = ""
                    }}
                  />
                  <Upload size={12} aria-hidden /> Upload
                </label>
                <button
                  type="button"
                  onClick={() => onChange({ ...formData, images: [...formData.images, ""] })}
                  className="text-[11px] font-bold uppercase tracking-wider opacity-70 hover:opacity-100 transition-all cursor-pointer"
                >
                  + Add row
                </button>
              </div>
            </div>
            {formData.images.map((src, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={src}
                  placeholder="/images/product/…"
                  onChange={(e) => {
                    const images = [...formData.images]
                    images[i] = e.target.value
                    onChange({ ...formData, images })
                  }}
                  className="flex-1 px-4 py-2.5 bg-[var(--card)] border border-[var(--border-color)] rounded-xl focus:ring-1 focus:ring-[var(--foreground)] outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...formData, images: formData.images.filter((_, j) => j !== i) })
                  }
                  aria-label={`Remove extra image ${i + 1}`}
                  className="p-2 text-[var(--muted-foreground)] hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Custom colors (name shown, swatch painted) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider opacity-50">
                Custom Colors
              </label>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...formData,
                    custom_colors: [...formData.custom_colors, { name: "", hex: "#888888" }],
                  })
                }
                className="text-[11px] font-bold uppercase tracking-wider opacity-70 hover:opacity-100 transition-all cursor-pointer"
              >
                + Add color
              </button>
            </div>
            {formData.custom_colors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#888888"}
                  onChange={(e) => {
                    const custom_colors = [...formData.custom_colors]
                    custom_colors[i] = { ...custom_colors[i], hex: e.target.value }
                    onChange({ ...formData, custom_colors })
                  }}
                  aria-label={`Color ${i + 1} swatch`}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-[var(--border-color)] p-1 shrink-0"
                />
                <input
                  type="text"
                  value={c.name}
                  placeholder="e.g. Dark Purple"
                  onChange={(e) => {
                    const custom_colors = [...formData.custom_colors]
                    custom_colors[i] = { ...custom_colors[i], name: e.target.value }
                    onChange({ ...formData, custom_colors })
                  }}
                  aria-label={`Color ${i + 1} name`}
                  className="flex-1 px-4 py-2.5 bg-[var(--card)] border border-[var(--border-color)] rounded-xl focus:ring-1 focus:ring-[var(--foreground)] outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...formData,
                      custom_colors: formData.custom_colors.filter((_, j) => j !== i),
                    })
                  }
                  aria-label={`Remove color ${i + 1}`}
                  className="p-2 text-[var(--muted-foreground)] hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Custom sizes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider opacity-50">
                Custom Sizes
              </label>
              <button
                type="button"
                onClick={() => onChange({ ...formData, custom_sizes: [...formData.custom_sizes, ""] })}
                className="text-[11px] font-bold uppercase tracking-wider opacity-70 hover:opacity-100 transition-all cursor-pointer"
              >
                + Add size
              </button>
            </div>
            {formData.custom_sizes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.custom_sizes.map((s, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={s}
                      placeholder="e.g. XL"
                      onChange={(e) => {
                        const custom_sizes = [...formData.custom_sizes]
                        custom_sizes[i] = e.target.value
                        onChange({ ...formData, custom_sizes })
                      }}
                      aria-label={`Size ${i + 1}`}
                      className="w-20 px-3 py-2 bg-[var(--card)] border border-[var(--border-color)] rounded-xl focus:ring-1 focus:ring-[var(--foreground)] outline-none text-sm text-center"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...formData,
                          custom_sizes: formData.custom_sizes.filter((_, j) => j !== i),
                        })
                      }
                      aria-label={`Remove size ${i + 1}`}
                      className="p-1.5 text-[var(--muted-foreground)] hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-50">
                Stock
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.stock}
                placeholder="0 = sold out"
                onChange={(e) => onChange({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border-color)] rounded-xl focus:ring-1 focus:ring-[var(--foreground)] outline-none"
              />
            </div>
            <label className="flex items-center gap-2.5 pb-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => onChange({ ...formData, is_published: e.target.checked })}
                className="w-4 h-4 accent-current"
              />
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                Published
              </span>
            </label>
          </div>
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-4 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing && <Loader2 size={18} className="animate-spin" />}
            {editingProduct ? "Save Changes" : "Create Product"}
          </button>
        </form>
      </div>
    </div>
  )
}
