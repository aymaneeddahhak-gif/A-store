"use client"

import { useEffect } from "react"
import {
  LayoutDashboard,
  Smartphone,
  Footprints,
  Gamepad2,
  Shirt,
  Coffee,
  Tag,
  User,
  Store,
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { useAuth } from "@/contexts/providers/auth-context"
import { useSellerNav } from "@/contexts/providers/seller-nav-context"
import { SellerFlyout } from "@/components/seller/seller-flyout"

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <LayoutDashboard size={19} />,
  phones: <Smartphone size={19} />,
  sneakers: <Footprints size={19} />,
  gaming: <Gamepad2 size={19} />,
  clothes: <Shirt size={19} />,
  food: <Coffee size={19} />,
}

export function Sidebar() {
  const { selectedCategory, setCategory, categories } = useCatalog()
  const { user } = useAuth()
  const { flyoutOpen, setFlyoutOpen, openFlyout, scheduleCloseFlyout } = useSellerNav()
  const router = useRouter()
  const pathname = usePathname()

  // Close the flyout when switching routes.
  useEffect(() => {
    setFlyoutOpen(false)
  }, [pathname, setFlyoutOpen])

  // Warm the client Router Cache for the primary rail destinations so clicks open immediately.
  useEffect(() => {
    router.prefetch("/login")
    router.prefetch("/seller")
    if (user) router.prefetch("/profile")
  }, [router, user])

  const handleCategoryClick = (id: string) => {
    setFlyoutOpen(false)
    setCategory(id)

    if (pathname !== "/") {
      router.push("/")
      return
    }

    const catalogSection = document.getElementById("storefront-catalog-start")
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="relative pl-2">
      <aside
        aria-label="Store categories and navigation"
        className="floating-sidebar flex flex-col items-center py-3 px-2 gap-1.5 rounded-full bg-white/98 dark:bg-[#15181e]/98 border border-gray-200/80 dark:border-white/10 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.08)] dark:shadow-[0_14px_40px_-6px_rgba(0,0,0,0.55)] w-[60px]"
      >
        <div className="flex flex-col items-center gap-1.5 w-full">
          {categories.map(({ id, label }) => {
            const displayLabel = id === "all" ? "All Products" : label
            return (
              <SidebarRow
                key={id}
                icon={CATEGORY_ICONS[id] ?? <Tag size={19} />}
                label={displayLabel}
                active={pathname === "/" && selectedCategory === id}
                onClick={() => handleCategoryClick(id)}
              />
            )
          })}

          <div className="h-px w-7 bg-[var(--border-color)] my-1 opacity-70" />

          <SidebarRow
            href="/seller"
            icon={<Store size={19} />}
            label="Seller Dashboard"
            active={pathname === "/seller" || flyoutOpen}
            dataAttr="seller-trigger"
            onClick={() => setFlyoutOpen(false)}
            onMouseEnter={openFlyout}
            onMouseLeave={scheduleCloseFlyout}
          />

          {user ? (
            <SidebarRow
              href="/profile"
              icon={<User size={19} />}
              label="My Profile"
              active={pathname === "/profile"}
              onClick={() => setFlyoutOpen(false)}
            />
          ) : (
            <SidebarRow
              href="/login"
              icon={<User size={19} />}
              label="Sign In"
              active={pathname === "/login"}
              onClick={() => setFlyoutOpen(false)}
            />
          )}
        </div>
      </aside>
      <SellerFlyout />
    </div>
  )
}

function SidebarRow({
  href,
  icon,
  label,
  active,
  dataAttr,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  href?: string
  icon: React.ReactNode
  label: string
  active?: boolean
  dataAttr?: string
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  const className = `w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-all duration-150 shrink-0 relative ${
    active
      ? "bg-neutral-900/10 dark:bg-white/15 text-[var(--foreground)] opacity-100 ring-1 ring-black/10 dark:ring-white/15"
      : "text-[var(--foreground)] opacity-70 hover:opacity-100 hover:bg-[var(--glass-bg)]"
  }`

  const content = (
    <>
      <span className="relative z-10 shrink-0" aria-hidden>
        {icon}
      </span>
      <span className="sr-only">{label}</span>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        prefetch
        title={label}
        aria-label={label}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        data-seller-trigger={dataAttr === "seller-trigger" ? "true" : undefined}
        className={className}
        aria-current={active ? "page" : undefined}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-seller-trigger={dataAttr === "seller-trigger" ? "true" : undefined}
      aria-expanded={dataAttr === "seller-trigger" ? active : undefined}
      className={className}
      aria-current={active ? "true" : undefined}
    >
      {content}
    </button>
  )
}
