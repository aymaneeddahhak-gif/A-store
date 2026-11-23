"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"

/** Site footer — developer credit: logo + mascot. Hidden on /login for single-screen view. */
export function SiteFooter() {
  const pathname = usePathname()
  if (pathname === "/login") return null

  return (
    <footer className="mt-auto border-t border-[var(--border-color)] py-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-3 px-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
          Made by
        </span>
        <Image
          src="/images/logo/devloper.png"
          alt="AED Solutions logo"
          width={180}
          height={60}
          className="h-9 w-auto object-contain dark:invert"
        />
        <Image
          src="/images/logo/devmascot.png"
          alt="AED Developer mascot"
          width={64}
          height={96}
          className="h-14 w-auto object-contain"
        />
      </div>
    </footer>
  )
}
