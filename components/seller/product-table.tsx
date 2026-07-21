"use client"

import Image from "next/image"
import { Package, Edit, Trash2 } from "lucide-react"
import type { Product } from "@/lib/types"

export function ProductTable({
  products,
  onEdit,
  onDelete,
}: {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: number) => void
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
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-12 text-center text-sm text-[var(--muted-foreground)]">
                  No products match your search.
                </td>
              </tr>
            ) : (
              products.map((product) => (
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
                      <span className="font-bold text-sm">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] rounded-full opacity-60">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-black text-sm">${product.price.toFixed(2)}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-2">
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
