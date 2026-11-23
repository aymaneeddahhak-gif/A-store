import Link from "next/link"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        <span className="text-4xl font-black tracking-tighter text-sky-400">404</span>
      </div>
      <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-sm text-foreground/60 leading-relaxed">
        The page or product you are looking for does not exist, has been removed, or is temporarily unavailable.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400 active:scale-95"
        >
          <Home className="h-4 w-4" />
          Back to Store
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-foreground/80 backdrop-blur-sm transition-all hover:bg-white/10 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Explore Catalog
        </Link>
      </div>
    </div>
  )
}
