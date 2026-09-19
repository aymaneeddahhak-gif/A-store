"use client"

import { X } from "lucide-react"

const SIZE_CHART = [
  { eu: "40.5", us: "7.5", uk: "6.5", cm: "25.5" },
  { eu: "41", us: "8.0", uk: "7.0", cm: "26.0" },
  { eu: "42", us: "8.5", uk: "7.5", cm: "26.5" },
  { eu: "43", us: "9.5", uk: "8.5", cm: "27.5" },
  { eu: "43.5", us: "10.0", uk: "9.0", cm: "28.0" },
  { eu: "44", us: "10.5", uk: "9.5", cm: "28.5" },
  { eu: "44.5", us: "11.0", uk: "10.0", cm: "29.0" },
  { eu: "45", us: "11.5", uk: "10.5", cm: "29.5" },
  { eu: "46", us: "12.0", uk: "11.0", cm: "30.0" },
]

/** Footwear size chart — pick a row to apply it to the page selection. */
export function SizeGuideModal({
  productTitle,
  selectedSize,
  onSelectSize,
  onClose,
}: {
  productTitle: string
  selectedSize: string
  onSelectSize: (size: string) => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Size guide"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[var(--card)] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-transparent dark:border-[var(--border-color)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/10">
          <h3 className="text-base font-bold text-neutral-900 dark:text-[var(--foreground)]">
            Men&apos;s Shoe Sizing Guide
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer dark:hover:text-[var(--foreground)] dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-neutral-500 mt-3 mb-4 leading-relaxed dark:text-[var(--muted-foreground)]">
          The {productTitle} fits true to size. If you are between sizes, we recommend selecting
          a half size up for enhanced toe comfort during athletic movement.
        </p>

        <div className="overflow-x-auto border border-neutral-200 dark:border-white/10 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8f7f4] dark:bg-white/5 text-neutral-600 dark:text-[var(--muted-foreground)] font-semibold border-b border-neutral-200 dark:border-white/10">
              <tr>
                <th className="py-2.5 px-3">EU Men</th>
                <th className="py-2.5 px-3">US Men</th>
                <th className="py-2.5 px-3">UK</th>
                <th className="py-2.5 px-3">CM</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-white/10">
              {SIZE_CHART.map((row) => {
                const isSelected = selectedSize === row.eu
                return (
                  <tr
                    key={row.eu}
                    className={isSelected ? "bg-neutral-50 dark:bg-white/5 font-medium" : "hover:bg-neutral-50/60 dark:hover:bg-white/5"}
                  >
                    <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-[var(--foreground)]">{row.eu}</td>
                    <td className="py-2 px-3 text-neutral-600 dark:text-[var(--muted-foreground)]">{row.us}</td>
                    <td className="py-2 px-3 text-neutral-600 dark:text-[var(--muted-foreground)]">{row.uk}</td>
                    <td className="py-2 px-3 text-neutral-600 dark:text-[var(--muted-foreground)]">{row.cm}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSize(row.eu)
                          onClose()
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-black text-white dark:bg-white dark:text-black"
                            : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-white/20 dark:text-[var(--foreground)] dark:hover:bg-white/10"
                        }`}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
