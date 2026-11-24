"use client"

import { useEffect, useRef } from "react"
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

function triggerLoader(message: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent("start-delivery-loading", {
      detail: { message },
    })
  )
}

function stopLoader() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent("stop-delivery-loading"))
}

export function Sidebar() {
  const { selectedCategory, setCategory, categories } = useCatalog()
  const { user } = useAuth()
  const { flyoutOpen, setFlyoutOpen, openFlyout, scheduleCloseFlyout } = useSellerNav()
  const router = useRouter()
  const pathname = usePathname()
  const categoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close the flyout when switching routes.
  useEffect(() => {
    setFlyoutOpen(false)
  }, [pathname, setFlyoutOpen])

  useEffect(() => {
    return () => {
      if (categoryTimerRef.current) clearTimeout(categoryTimerRef.current)
    }
  }, [])

  const handleCategoryClick = (id: string, label: string) => {
    setFlyoutOpen(false)
    triggerLoader(id === "all" ? "Loading All Products" : `Loading ${label}`)
    setCategory(id)

    if (pathname !== "/") {
      router.push("/")
      return
    }

    if (categoryTimerRef.current) clearTimeout(categoryTimerRef.current)
    categoryTimerRef.current = setTimeout(() => {
      const catalogSection = document.getElementById("catalog")
      if (catalogSection) {
        catalogSection.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      stopLoader()
      categoryTimerRef.current = null
    }, 320)
  }

  const handleSellerClick = () => {
    setFlyoutOpen(false)
    if (pathname === "/seller") {
      triggerLoader("Loading Seller Console")
      setTimeout(stopLoader, 240)
      return
    }
    triggerLoader("Opening Seller Console")
    router.push("/seller")
  }

  const handleAccountLinkClick = (targetPath: string, message: string) => {
    setFlyoutOpen(false)
    triggerLoader(message)
    if (pathname === targetPath) {
      setTimeout(stopLoader, 240)
    }
  }

  return (
    <div className="relative pl-2">
      <aside
        aria-label="Store categories and navigation"
        className="floating-sidebar flex flex-col items-center py-3 px-2 gap-1.5 rounded-full bg-white/95 dark:bg-[#15181e]/95 backdrop-blur-md border border-gray-200/80 dark:border-white/10 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.08)] dark:shadow-[0_14px_40px_-6px_rgba(0,0,0,0.55)] w-[60px]"
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
                onClick={() => handleCategoryClick(id, displayLabel)}
              />
            )
          })}

          <div className="h-px w-7 bg-[var(--border-color)] my-1 opacity-70" />

          <SidebarRow
            icon={<Store size={19} />}
            label="Seller Dashboard"
            active={pathname === "/seller" || flyoutOpen}
            dataAttr="seller-trigger"
            onClick={handleSellerClick}
            onMouseEnter={openFlyout}
            onMouseLeave={scheduleCloseFlyout}
          />

          {user ? (
            <SidebarRow
              href="/profile"
              icon={<User size={19} />}
              label="My Profile"
              active={pathname === "/profile"}
              onClick={() => handleAccountLinkClick("/profile", "Loading Profile")}
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
