/**
 * Storefront categories — single source of truth for the filter capsules,
 * the filter drawer, the sidebar, the mobile nav, the top-nav select, and
 * the seller product form. Ids match the storefront design's taxonomy
 * (minus Watches — the project catalog has no watch products).
 */
export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "phones", label: "Phones & IT" },
  { id: "sneakers", label: "Sneakers" },
  { id: "gaming", label: "Gaming & Audio" },
  { id: "clothes", label: "Clothes" },
  { id: "food", label: "Food" },
] as const

export type CategoryId = (typeof CATEGORIES)[number]["id"]

export const isCategoryId = (value: string): value is CategoryId =>
  CATEGORIES.some(({ id }) => id === value)

/** Merges DB-defined categories over the built-ins (DB wins on id clash). */
export function mergeCategories(
  base: readonly { id: string; label: string }[],
  extra: { id: string; label: string }[]
): { id: string; label: string }[] {
  const merged = base.map((c) => ({ ...c }))
  for (const c of extra) {
    const existing = merged.find((m) => m.id === c.id)
    if (existing) existing.label = c.label
    else merged.push({ id: c.id, label: c.label })
  }
  return merged
}
