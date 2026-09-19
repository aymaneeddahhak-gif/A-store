"use client"

import { useCallback, useEffect, useState } from "react"
import { Tags, Trash2, Plus, Lock } from "lucide-react"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { useToast } from "@/contexts/toast-context"
import {
  listCategoriesAction,
  createCategoryAction,
  deleteCategoryAction,
  type CategoryRow,
} from "@/lib/actions/categories"
import { CATEGORIES as BUILTIN_CATEGORIES } from "@/lib/categories"

const BUILTIN_IDS: Set<string> = new Set(BUILTIN_CATEGORIES.map((c) => c.id))

/**
 * Admin category management — built-ins are locked, DB rows can be added
 * and (when unused) deleted. The storefront picks new ids up automatically.
 */
export function CategoryManager() {
  const { categories, refreshCategories } = useCatalog()
  const { showToast } = useToast()
  const [custom, setCustom] = useState<CategoryRow[] | null>(null)
  const [label, setLabel] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await listCategoriesAction()
    setCustom(res.ok ? res.data : [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim() || busy) return
    setBusy(true)
    try {
      const res = await createCategoryAction(label)
      if (res.ok) {
        setLabel("")
        await Promise.all([load(), refreshCategories()])
        showToast(`Category "${res.data.label}" added.`, "success")
      } else {
        showToast(res.error, "error")
      }
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (row: CategoryRow) => {
    if (!confirm(`Delete category "${row.label}"?`)) return
    const res = await deleteCategoryAction(row.id)
    if (res.ok) {
      await Promise.all([load(), refreshCategories()])
      showToast("Category deleted.", "info")
    } else {
      showToast(res.error, "error")
    }
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[40px] overflow-hidden">
      <div className="p-8 border-b border-[var(--border-color)]">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Tags className="text-purple-500" /> Categories
        </h2>
      </div>
      <div className="p-8 pt-6 space-y-5">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const locked = BUILTIN_IDS.has(c.id)
            return (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] rounded-full"
              >
                {locked && <Lock size={11} className="opacity-50" aria-hidden />}
                {c.label}
                {!locked && (
                  <button
                    type="button"
                    onClick={() => {
                      const row = custom?.find((r) => r.id === c.id)
                      if (row) void handleDelete(row)
                    }}
                    aria-label={`Delete category ${c.label}`}
                    className="text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </span>
            )
          })}
        </div>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="New category name, e.g. Watches"
            aria-label="New category name"
            className="flex-1 px-4 py-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-sm outline-none focus:ring-1 focus:ring-[var(--foreground)]"
          />
          <button
            type="submit"
            disabled={busy || !label.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--foreground)] text-[var(--background)] rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Plus size={14} aria-hidden /> Add
          </button>
        </form>
      </div>
    </div>
  )
}
