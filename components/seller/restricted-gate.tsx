"use client"

import Link from "next/link"
import { Lock, ArrowRight } from "lucide-react"

export function SellerRestrictedGate() {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center text-center p-8">
      <div className="w-14 h-14 border border-[var(--border-color)] bg-[var(--card)] rounded-2xl flex items-center justify-center mb-5">
        <Lock size={24} className="text-[var(--foreground)]" aria-hidden />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2 text-[var(--foreground)]">
        Sign In Required
      </h1>
      <p className="text-sm text-[var(--muted-foreground)] max-w-md mb-6 leading-relaxed">
        You need to log in first to open the Seller Console and manage store products or orders.
        Use the One-Click <strong>Demo Seller</strong> account on the login page to explore it right away.
      </p>
      <Link
        href="/login?next=/seller"
        prefetch
        className="px-7 py-3.5 bg-[var(--foreground)] text-[var(--background)] rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity inline-flex items-center gap-2"
      >
        <span>Go to Login Page</span>
        <ArrowRight size={16} aria-hidden />
      </Link>
    </div>
  )
}
