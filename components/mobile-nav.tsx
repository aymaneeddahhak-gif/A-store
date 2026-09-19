"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Smartphone,
  Footprints,
  Gamepad2,
  Shirt,
  Coffee,
  Store,
  ShoppingBag,
  User,
  X,
  LogOut,
  Tag,
} from "lucide-react"
import { useAuth } from "@/contexts/providers/auth-context"
import { useCatalog } from "@/contexts/providers/catalog-context"

type MobileNavProps = {
  open: boolean
  onClose: () => void
}

const CATEGORY_ICONS = {
  all: LayoutDashboard,
  phones: Smartphone,
  sneakers: Footprints,
  gaming: Gamepad2,
  clothes: Shirt,
  food: Coffee,
} as const

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { selectedCategory, setCategory, categories } = useCatalog()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      document.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus()
    }
  }, [open])

  const pickCategory = (id: string) => {
    setCategory(id)
    onClose()
    if (pathname !== "/") router.push("/")
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <nav
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        className="fixed inset-y-0 left-0 z-[90] w-[min(100%,320px)] flex flex-col border-r border-[var(--border-color)] bg-[var(--sidebar-bg)] shadow-2xl md:hidden outline-none"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] p-4">
          <span className="text-sm font-bold uppercase tracking-widest text-[var(--foreground)]">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-[var(--glass-bg)] transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
            Categories
          </p>
          {categories.map(({ id, label }) => {
            const Icon = CATEGORY_ICONS[id as keyof typeof CATEGORY_ICONS] ?? Tag
            return (
              <button
                key={id}
                type="button"
                onClick={() => pickCategory(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors
                  ${selectedCategory === id
                    ? "bg-[var(--glass-highlight)] text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--glass-bg)] hover:text-[var(--foreground)]"
                  }`}
              >
                <Icon size={20} />
                {id === "all" ? "All Products" : label}
              </button>
            )
          })}

          <div className="my-3 h-px bg-[var(--border-color)]" />

          <Link
            href="/seller"
            onClick={onClose}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors
              ${pathname === "/seller" ? "bg-[var(--glass-highlight)] text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--glass-bg)]"}`}
          >
            <Store size={20} />
            Seller dashboard
          </Link>

          {user ? (
            <>
              <Link
                href="/orders"
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors
                  ${pathname === "/orders" ? "bg-[var(--glass-highlight)] text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--glass-bg)]"}`}
              >
                <ShoppingBag size={20} />
                My orders
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await signOut()
                  onClose()
                  router.push("/")
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut size={20} />
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--glass-bg)] transition-colors"
            >
              <User size={20} />
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </>
  )
}
