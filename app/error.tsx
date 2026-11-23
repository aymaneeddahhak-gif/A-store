"use client"

import { useEffect } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Application Error]:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl shadow-2xl">
        <AlertCircle className="h-10 w-10 text-red-400" />
      </div>
      <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-foreground/60 leading-relaxed">
        An unexpected error occurred while loading this view. You can try refreshing or returning to the home catalog.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400 active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  )
}
