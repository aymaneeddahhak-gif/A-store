/** Skeleton for the server-rendered product detail route — mirrors the real
 * page geometry (centered canvas card, breadcrumb, two-column detail) so the
 * swap causes minimal layout shift. */
export default function ProductLoading() {
  return (
    <div className="w-full px-3 sm:px-6 md:px-8" aria-busy aria-label="Loading product">
      <div className="w-full rounded-[26px] border border-[var(--border-color)] bg-[var(--card)] p-5 shadow-xl shadow-black/5 sm:p-7 md:rounded-[32px] md:p-9 dark:shadow-black/30">
        {/* Breadcrumb */}
        <div className="skeleton-shimmer mb-5 h-3.5 w-64 rounded-md" />

        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 lg:gap-12">
          {/* Media column */}
          <div className="skeleton-shimmer aspect-square w-full rounded-[32px]" />

          {/* Details column */}
          <div className="flex flex-col gap-4">
            <div className="skeleton-shimmer h-4 w-24 rounded-md" />
            <div className="skeleton-shimmer h-9 w-4/5 rounded-lg" />
            <div className="skeleton-shimmer h-6 w-28 rounded-md" />
            <div className="skeleton-shimmer h-24 w-full rounded-2xl" />
            <div className="flex gap-3">
              <div className="skeleton-shimmer h-12 w-36 rounded-full" />
              <div className="skeleton-shimmer h-12 flex-1 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
