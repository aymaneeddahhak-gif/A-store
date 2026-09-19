/**
 * Facebook-style loading skeletons — shimmer placeholders that mirror each
 * page's real geometry so the content swap causes minimal layout shift.
 * The .skeleton-shimmer utility (globals.css) already adapts to the theme.
 */

function Shimmer({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton-shimmer ${className}`} />
}

function SkeletonShell({
  label,
  className = "",
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div aria-busy aria-label={label} className={className}>
      {children}
    </div>
  )
}

/** One catalog card: square media, details block, price row. */
export function ProductCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <article
      aria-busy="true"
      aria-label="Loading product card..."
      className={`w-full max-w-sm sm:max-w-md bg-white rounded-3xl overflow-hidden border border-neutral-200 shadow-sm font-sans ${className}`}
    >
      {/* 1. Image Area with Shimmer */}
      <div className="relative w-full aspect-square bg-neutral-100 overflow-hidden">
        <div className="w-full h-full fb-shimmer" />

        {/* Circular Discount Badge Placeholder */}
        <div className="absolute top-4 right-4 z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/90 shadow-sm p-2 flex flex-col items-center justify-center gap-1.5 border border-neutral-200/60">
          <div className="w-8 h-2 rounded-full fb-shimmer" />
          <div className="w-12 h-6 sm:h-7 rounded-md fb-shimmer" />
          <div className="w-6 h-2 rounded-full fb-shimmer" />
        </div>

        {/* Wishlist Button Placeholder */}
        <div className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center border border-neutral-200/60">
          <div className="w-5 h-5 rounded-full fb-shimmer" />
        </div>

        {/* Bottom Tag Overlay */}
        <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <div className="w-22 h-6 rounded-md bg-white/90 shadow-2xs fb-shimmer" />
          <div className="w-28 h-6 rounded-md bg-white/90 shadow-2xs fb-shimmer" />
        </div>
      </div>

      {/* 2. Details with Shimmer */}
      <div className="p-5 sm:p-6 bg-white space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-24 h-3 rounded-full fb-shimmer" />
            <div className="w-14 h-3 rounded-full fb-shimmer" />
          </div>

          <div className="space-y-2 mb-3">
            <div className="w-4/5 h-5 rounded-md fb-shimmer" />
            <div className="w-3/5 h-5 rounded-md fb-shimmer" />
          </div>

          <div className="space-y-2 mb-4">
            <div className="w-full h-3 rounded-full fb-shimmer" />
            <div className="w-11/12 h-3 rounded-full fb-shimmer" />
            <div className="w-2/3 h-3 rounded-full fb-shimmer" />
          </div>

          <div className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-neutral-200/80 bg-[#FAF7F2]/60">
            <div className="w-7 h-7 rounded-lg fb-shimmer shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="w-24 h-3 rounded-full fb-shimmer" />
              <div className="w-32 h-2.5 rounded-full fb-shimmer" />
            </div>
          </div>
        </div>

        {/* 3. Pricing & Cart Row */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <div className="w-20 h-7 rounded-md fb-shimmer" />
              <div className="w-12 h-4 rounded-md fb-shimmer" />
            </div>
            <div className="w-28 h-2.5 rounded-full fb-shimmer" />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl fb-shimmer shrink-0" />
            <div className="w-28 h-10 rounded-xl fb-shimmer shrink-0" />
          </div>
        </div>
      </div>
    </article>
  );
}

/** Home catalog: hero, filter bar, card grid. */
export function StorefrontSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonShell label="Loading products" className="w-full flex flex-col gap-6">
      <Shimmer className="h-64 w-full rounded-[32px]" />
      <div className="flex items-center gap-3">
        <Shimmer className="h-11 flex-1 rounded-xl" />
        <Shimmer className="h-11 w-36 rounded-xl" />
        <Shimmer className="h-11 w-24 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {Array.from({ length: count }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </SkeletonShell>
  )
}

/** Seller console: header, stat cards, orders + inventory tables. */
export function DashboardSkeleton() {
  return (
    <SkeletonShell
      label="Loading seller console"
      className="w-full max-w-7xl mx-auto p-4 md:p-8 min-h-screen"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <Shimmer className="h-9 w-64 rounded-xl mb-2" />
          <Shimmer className="h-4 w-80 max-w-full rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Shimmer className="h-12 w-28 rounded-2xl" />
          <Shimmer className="h-12 w-32 rounded-2xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }, (_, i) => (
          <Shimmer key={i} className="h-28 rounded-[24px]" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-[40px] border border-[var(--border-color)] bg-[var(--card)] p-8 space-y-4">
          <Shimmer className="h-7 w-48 rounded-lg" />
          {Array.from({ length: 4 }, (_, i) => (
            <Shimmer key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
        <div className="rounded-[40px] border border-[var(--border-color)] bg-[var(--card)] p-8 space-y-4">
          <Shimmer className="h-7 w-32 rounded-lg" />
          {Array.from({ length: 3 }, (_, i) => (
            <Shimmer key={i} className="h-12 rounded-2xl" />
          ))}
        </div>
        <div className="lg:col-span-3 rounded-[40px] border border-[var(--border-color)] bg-[var(--card)] p-8 space-y-4">
          <Shimmer className="h-7 w-56 rounded-lg" />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Shimmer className="w-14 h-14 rounded-2xl shrink-0" />
              <Shimmer className="h-5 flex-1 rounded-lg" />
              <Shimmer className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonShell>
  )
}

/** Orders list: header plus order cards. */
export function OrdersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <SkeletonShell
      label="Loading orders"
      className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <Shimmer className="h-9 w-56 rounded-xl mb-2" />
          <Shimmer className="h-4 w-72 max-w-full rounded" />
        </div>
        <Shimmer className="h-9 w-44 rounded-full" />
      </div>
      <div className="space-y-6">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="p-6 sm:p-8 bg-[var(--card)] border border-[var(--border-color)] rounded-[32px] space-y-4"
          >
            <div className="flex items-center justify-between">
              <Shimmer className="h-4 w-40 rounded-md" />
              <Shimmer className="h-7 w-24 rounded-full" />
            </div>
            <Shimmer className="h-14 w-full rounded-2xl" />
            <Shimmer className="h-14 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    </SkeletonShell>
  )
}

/** Checkout: showcase panel plus steps panel. */
export function CheckoutSkeleton() {
  return (
    <SkeletonShell
      label="Loading checkout"
      className="pt-28 sm:pt-32 pb-12 px-4 max-w-6xl mx-auto"
    >
      <div className="w-full bg-white dark:bg-[var(--card)] rounded-[26px] md:rounded-[32px] p-5 sm:p-7 md:p-9">
        <Shimmer className="h-4 w-64 rounded-md mb-5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div>
            <Shimmer className="w-full aspect-[4/3] rounded-2xl md:rounded-[22px]" />
            <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5 mt-3.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Shimmer key={i} className="aspect-[4/3] rounded-xl" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-100 dark:border-white/10 p-5 space-y-4">
            <Shimmer className="h-6 w-40 rounded-lg" />
            <Shimmer className="h-16 w-full rounded-xl" />
            <Shimmer className="h-16 w-full rounded-xl" />
            <Shimmer className="h-10 w-full rounded-lg" />
            <Shimmer className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </SkeletonShell>
  )
}

/** Profile: header, avatar card, detail cards. */
export function ProfileSkeleton() {
  return (
    <SkeletonShell
      label="Loading your profile"
      className="w-full max-w-4xl mx-auto p-4 md:p-8"
    >
      <div className="mb-10">
        <Shimmer className="h-9 w-72 max-w-full rounded-xl mb-2" />
        <Shimmer className="h-4 w-96 max-w-full rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 p-6 bg-[var(--card)] border border-[var(--border-color)] rounded-[32px] flex flex-col items-center">
          <Shimmer className="w-24 h-24 rounded-full mb-4" />
          <Shimmer className="h-5 w-32 rounded-lg mb-2" />
          <Shimmer className="h-3 w-40 rounded mb-6" />
          <Shimmer className="h-11 w-full rounded-2xl" />
        </div>
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 bg-[var(--card)] border border-[var(--border-color)] rounded-[32px] space-y-4">
            <Shimmer className="h-4 w-40 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Shimmer className="h-16 rounded-2xl" />
              <Shimmer className="h-16 rounded-2xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Shimmer className="h-32 rounded-[32px]" />
            <Shimmer className="h-32 rounded-[32px]" />
          </div>
        </div>
      </div>
    </SkeletonShell>
  )
}

/** Sign-in gate: centered auth card. */
export function AuthSkeleton() {
  return (
    <SkeletonShell
      label="Loading sign in"
      className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-[var(--background)]"
    >
      <div className="hidden lg:block lg:col-span-7 p-10">
        <Shimmer className="h-full w-full rounded-[32px]" />
      </div>
      <div className="col-span-12 lg:col-span-5 flex flex-col items-center justify-center px-5 py-12 sm:px-10 min-h-screen">
        <div className="w-full max-w-[420px] rounded-3xl p-7 sm:p-8 flex flex-col gap-4 border border-[var(--border-color)] bg-[var(--card)]">
          <Shimmer className="h-8 w-48 rounded-xl" />
          <Shimmer className="h-3 w-64 max-w-full rounded mb-2" />
          <Shimmer className="h-11 w-full rounded-xl" />
          <Shimmer className="h-11 w-full rounded-xl" />
          <Shimmer className="h-11 w-full rounded-xl" />
          <Shimmer className="h-11 w-full rounded-xl" />
          <div className="flex gap-2 mt-2">
            <Shimmer className="h-14 flex-1 rounded-xl" />
            <Shimmer className="h-14 flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    </SkeletonShell>
  )
}
