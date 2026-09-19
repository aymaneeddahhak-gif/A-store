"use client"

import Image from "next/image"

/**
 * Branded full-route loading state — pulsing logo with an indeterminate
 * progress bar underneath. Used as the route-level loading.tsx skeleton and
 * by auth-gated pages while the session resolves, so waiting on a slow
 * network reads as an intentional loading animation rather than a hang.
 */
export function BrandLoader({ label, minHeight = true }: { label: string; minHeight?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 ${minHeight ? "min-h-[70vh]" : ""}`}
      aria-busy
      aria-label={label}
    >
      <Image
        src="/images/logo/logotrsnprt.png"
        alt=""
        width={896}
        height={1200}
        priority
        className="h-24 w-auto object-contain animate-pulse"
      />
      <div className="h-1 w-36 overflow-hidden rounded-full bg-[var(--glass-bg)]">
        <div className="brand-loader__bar h-full w-2/5 rounded-full bg-[var(--foreground)]" />
      </div>
    </div>
  )
}
