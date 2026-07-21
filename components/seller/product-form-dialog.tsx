"use client"

import { X, Loader2 } from "lucide-react"
import type { Product } from "@/lib/types"

export type ProductFormData = {
  name: string
  price: string
  category: string
  description: string
  image: string
}

export const EMPTY_PRODUCT_FORM: ProductFormData = {
  name: "",
  price: "",
  category: "Fashion",
  description: "",
  image: "/images/airpods.png",
}

export function ProductFormDialog({
  isOpen,
  editingProduct,
  formData,
  isProcessing,
  onClose,
  onChange,
  onSubmit,
}: {
  isOpen: boolean
  editingProduct: Product | null
  formData: ProductFormData
  isProcessing: boolean
  onClose: () => void
  onChange: (data: ProductFormData) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  if (!isOpen) return null

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
                value={formData.price}
                onChange={(e) => onChange({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border-color)] rounded-xl focus:ring-1 focus:ring-[var(--foreground)] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-50">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => onChange({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border-color)] rounded-xl focus:ring-1 focus:ring-[var(--foreground)] outline-none appearance-none"
              >
                <option value="Fashion">Fashion</option>
                <option value="Electronics">Electronics</option>
                <option value="Food">Food</option>
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
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => onChange({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border-color)] rounded-xl focus:ring-1 focus:ring-[var(--foreground)] outline-none resize-none"
            />
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
