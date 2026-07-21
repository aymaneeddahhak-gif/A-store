import Link from "next/link"
import { Package } from "lucide-react"

export default function ProductNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <Package size={48} className="text-[var(--foreground)] opacity-20" aria-hidden />
      <h1 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight">
        Product not found
      </h1>
      <p className="text-[var(--muted-foreground)] max-w-md">
        This item may have been removed or the link is incorrect.
      </p>
      <Link
        href="/"
        className="mt-4 px-8 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
      >
        Back to Store
      </Link>
    </div>
  )
}
