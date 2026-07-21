import Link from "next/link"
import { AlertCircle, User } from "lucide-react"

export function SellerRestrictedGate() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
        <AlertCircle size={40} className="text-amber-500" />
      </div>
      <h1 className="text-3xl font-black uppercase tracking-tight mb-2 text-[var(--foreground)]">
        Restricted Area
      </h1>
      <p className="text-[var(--foreground)] opacity-60 max-w-md mb-8">
        You must be signed in to access the seller console and manage store inventory.
      </p>
      <Link
        href="/login"
        className="px-8 py-4 bg-[var(--foreground)] text-[var(--background)] rounded-2xl font-bold hover:opacity-90 transition-all flex items-center gap-2"
      >
        <User size={18} />
        Sign In to Continue
      </Link>
    </div>
  )
}
