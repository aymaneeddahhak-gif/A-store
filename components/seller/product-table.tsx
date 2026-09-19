"use client"

import Image from "next/image"
import { Package, Edit, Trash2, Eye, EyeOff, Star } from "lucide-react"
import type { Product } from "@/lib/types"

export function ProductTable({
  products,
  onEdit,
  onDelete,
  onTogglePublish,
  onToggleFeatured,
  canFeature = false,
  showOwnerBadge = false,
}: {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: number) => void
  onTogglePublish: (product: Product) => void
  onToggleFeatured?: (product: Product) => void
  canFeature?: boolean
  showOwnerBadge?: boolean
}) {
  return (
    <div className="lg:col-span-3 bg-[var(--card)] border border-[var(--border-color)] rounded-[40px] overflow-hidden mt-8">
      <div className="p-8 border-b border-[var(--border-color)] flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Package className="text-purple-500" /> Inventory Assets
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
              <tr className="text-[10px] uppercase tracking-widest opacity-40 font-black border-b border-[var(--border-color)]">
                <th className="px-8 py-5 text-left">Item</th>
                <th className="px-8 py-5 text-left">Category</th>
                <th className="px-8 py-5 text-left">Value</th>
                <th className="px-8 py-5 text-left">Stock</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-sm text-[var(--muted-foreground)]">
                    No products match your search.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const stock = product.stock
                  const published = product.is_published ?? true
                  return (
                  <tr key={product.id} className="hover:bg-[var(--glass-bg)] transition-all group">
                  <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 bg-[var(--background)] border border-[var(--border-color)] rounded-2xl overflow-hidden p-2 group-hover:scale-105 transition-transform">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-contain"
                            sizes="56px"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-sm">{product.name}</div>
                          <div className="mt-1 flex items-center gap-1.5">
                            {showOwnerBadge && product.user_id && (
                              <span className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-purple-500/10 text-purple-500 border border-purple-500/30 rounded-full">
                                Sandbox
                              </span>
                            )}
                            {!published && (
                              <span className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-full">
                                Draft
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] rounded-full opacity-60">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-black text-sm">
                      ${product.price.toFixed(2)}
                      {product.original_price && product.original_price > product.price && (
                        <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F05423]/10 text-[#F05423] border border-[#F05423]/30">
                          -{Math.round((1 - product.price / product.original_price) * 100)}%
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {stock === undefined ? (
                        <span className="text-sm text-[var(--muted-foreground)]">—</span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className="font-black text-sm">{stock}</span>
                          {stock === 0 ? (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded-full">
                              Out
                            </span>
                          ) : stock <= 5 ? (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-full">
                              Low
                            </span>
                          ) : null}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2">
                        {canFeature && !product.user_id && onToggleFeatured && (
                          <button
                            type="button"
                            onClick={() => onToggleFeatured(product)}
                            aria-label={product.featured ? `Remove ${product.name} from hero` : `Feature ${product.name} on hero`}
                            aria-pressed={!!product.featured}
                            title={product.featured ? "Remove from hero" : "Feature on hero"}
                            className={`p-3 rounded-2xl transition-all ${
                              product.featured
                                ? "bg-amber-500/10 text-amber-500"
                                : "hover:bg-[var(--glass-bg)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            }`}
                          >
                            <Star
                              size={18}
                              className={product.featured ? "fill-amber-500" : ""}
                            />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onTogglePublish(product)}
                          aria-label={published ? `Unpublish ${product.name}` : `Publish ${product.name}`}
                          aria-pressed={published}
                          title={published ? "Unpublish" : "Publish"}
                          className="p-3 hover:bg-[var(--glass-bg)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-2xl transition-all"
                        >
                          {published ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(product)}
                          aria-label={`Edit ${product.name}`}
                          className="p-3 hover:bg-blue-500/10 text-blue-500 rounded-2xl transition-all"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Permanently delete this asset?")) onDelete(product.id)
                          }}
                          aria-label={`Delete ${product.name}`}
                          className="p-3 hover:bg-rose-500/10 text-rose-500 rounded-2xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
