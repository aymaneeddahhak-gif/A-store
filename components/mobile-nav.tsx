"use client"

import { useEffect, useRef, useState } from "react"
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
  Package,
  BadgePercent,
  Users,
  Mail,
  Sliders,
  ChevronDown,
  type LucideIcon,
} from "lucide-react"
import { useAuth } from "@/contexts/providers/auth-context"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { useSellerNav } from "@/contexts/providers/seller-nav-context"

type MobileNavProps = {
  open: boolean
  onClose: () => void
}

/**
 * The desktop rail reveals this list on hover; a phone has no hover, so the
 * drawer carries the same option bar and jumps straight to the section.
 */
const SELLER_ITEMS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "Dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "Products", label: "Products", Icon: Package },
  { id: "Offers", label: "Offers", Icon: BadgePercent },
  { id: "Orders", label: "Orders", Icon: ShoppingBag },
  { id: "Customer", label: "Customer", Icon: Users },
  { id: "Newsletter", label: "Newsletter", Icon: Mail },
  { id: "Settings", label: "Settings", Icon: Sliders },
]

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
  const { setSellerTab } = useSellerNav()
  const [sellerOpen, setSellerOpen] = useState(false)

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

  const openSellerTab = (id: string) => {
    setSellerTab(id)
    onClose()
    router.push("/seller")
  }

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

          <button
            type="button"
            onClick={() => setSellerOpen((open) => !open)}
            aria-expanded={sellerOpen}
            aria-controls="mobile-seller-menu"
            className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors cursor-pointer
              ${
                pathname === "/seller"
                  ? "bg-[var(--glass-highlight)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--glass-bg)] hover:text-[var(--foreground)]"
              }`}
          >
            <span className="flex items-center gap-3">
              <Store size={20} />
              Seller console
            </span>
            <ChevronDown
              size={18}
              className={`transition-transform ${sellerOpen ? "rotate-180" : ""}`}
            />
          </button>

          {sellerOpen && (
            <div id="mobile-seller-menu" className="space-y-1 pt-0.5">
              {SELLER_ITEMS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => openSellerTab(id)}
                  className="flex w-full items-center gap-3 rounded-xl py-2.5 pl-9 pr-3 text-left text-sm transition-colors cursor-pointer text-[var(--muted-foreground)] hover:bg-[var(--glass-bg)] hover:text-[var(--foreground)]"
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          )}

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
