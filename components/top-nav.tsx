"use client"

import { useEffect, useRef, useState } from "react"
import {
  Bell,
  Search,
  Home,
  X,
  Menu,
  ShoppingBag,
  LogOut,
  Heart,
  Globe,
  MapPin,
  CreditCard,
} from "lucide-react"
import { useAuth } from "@/contexts/providers/auth-context"
import { useCart } from "@/contexts/providers/cart-context"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { useNotifications } from "@/contexts/providers/notifications-context"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { VideoLogo } from "@/components/video-logo"
import { MobileNav } from "@/components/mobile-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserAvatar } from "@/components/avatars/role-avatar"
import { NotificationPanel } from "@/components/notification-panel"

export function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { user, signOut } = useAuth()
  const { cart, toggleCart } = useCart()
  const { searchQuery, setSearchQuery } = useCatalog()
  const { toggleNotifications, unreadCount, isNotificationOpen } = useNotifications()

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)

  const handleAccountEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    if (isNotificationOpen) toggleNotifications()
    setAccountOpen(true)
  }

  const handleAccountLeave = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => {
      setAccountOpen(false)
    }, 280)
  }

  // Click-outside / Escape for the search input
  useEffect(() => {
    if (!searchOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false)
    }
    const onPointerDown = (e: PointerEvent) => {
      if (!searchContainerRef.current?.contains(e.target as Node)) {
        if (!searchQuery) setSearchOpen(false)
      }
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointerDown)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [searchOpen, searchQuery])
  useEffect(() => {
    if (!accountOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false)
    }
    const onPointerDown = (e: PointerEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointerDown)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointerDown)
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [accountOpen])

  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "Account"

  return (
    <>
      <nav
        className="fixed top-0 left-0 w-full z-[95] pointer-events-none"
        aria-label="Main"
      >
        {/* Keep outer row pointer-events-none so transparent space beside
            the 112px logo never blocks clicks on buttons directly underneath. */}
        <div className="relative flex w-full items-start justify-between gap-2 sm:gap-4 px-3 sm:px-5">
          <div className="pointer-events-auto">
            <VideoLogo videoClassName="h-20 sm:h-24 lg:h-28" />
          </div>

          {/* Centered Floating Navigation Capsule */}
          <div className="pointer-events-auto fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-[95] max-w-[calc(100vw-24px)]">
            <div className="flex items-center gap-1 sm:gap-2 rounded-full bg-white/98 dark:bg-[#15181e]/98 border border-gray-200/80 dark:border-white/10 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.08)] dark:shadow-[0_14px_40px_-6px_rgba(0,0,0,0.55)] px-3 sm:px-4 py-1.5 sm:py-2">
              {/* 1. Home Icon Link */}
              <Link
                href="/"
                onClick={() => {
                  if (pathname === "/") {
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                }}
                className={`p-1.5 sm:p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] transition-all shrink-0 cursor-pointer active:scale-95 ${
                  pathname === "/" ? "opacity-100 text-[var(--foreground)]" : "opacity-70 hover:opacity-100"
                }`}
                aria-label="Home"
              >
                <Home size={19} />
              </Link>

              {/* 2. Collapsible Search (Icon by default, expands on click) */}
              {searchOpen ? (
                <div
                  ref={searchContainerRef}
                  className="relative flex items-center w-[130px] sm:w-[190px] animate-in fade-in zoom-in-95 duration-200"
                >
                  <label htmlFor="global-search" className="sr-only">
                    Search products
                  </label>
                  <input
                    id="global-search"
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    autoFocus
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      if (pathname !== "/" && e.target.value.length > 0) router.push("/")
                    }}
                    className="w-full bg-[var(--glass-bg)] border border-[var(--border-color)] rounded-full px-3 py-1.5 pl-8 pr-7 text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] hover:bg-[var(--glass-highlight)] transition-all"
                  />
                  <Search
                    className="absolute left-2.5 text-[var(--muted-foreground)] w-3.5 h-3.5"
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("")
                      setSearchOpen(false)
                    }}
                    className="absolute right-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-0.5 rounded-full cursor-pointer active:scale-95"
                    aria-label="Close search"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (isNotificationOpen) toggleNotifications()
                    setSearchOpen(true)
                  }}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] opacity-70 hover:opacity-100 transition-all shrink-0 cursor-pointer active:scale-95"
                  aria-label="Open search"
                >
                  <Search size={19} />
                </button>
              )}

              {/* 2. Shopping Bag / Cart */}
              <button
                type="button"
                onClick={toggleCart}
                className="p-1.5 sm:p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] opacity-70 hover:opacity-100 transition-all relative shrink-0 cursor-pointer active:scale-95"
                aria-label={`Shopping cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
              >
                <ShoppingBag size={19} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-[var(--foreground)] text-[var(--background)] text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* 3. CENTERPIECE: Uiverse 3D Mode Switcher (Option 4) */}
              <ThemeToggle />

              {/* 4. Notifications */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen(false)
                    toggleNotifications()
                  }}
                  data-notification-trigger
                  aria-expanded={isNotificationOpen}
                  aria-haspopup="dialog"
                  className={`p-1.5 sm:p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] transition-all relative shrink-0 cursor-pointer active:scale-95 ${
                    isNotificationOpen ? "opacity-100 bg-[var(--glass-bg)]" : "opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                >
                  <Bell size={19} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-[var(--accent)] text-[var(--background)] text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <NotificationPanel />
              </div>

              {/* 5. User Profile / Sign In */}
              {user ? (
                <div className="flex items-center border-l border-[var(--border-color)] pl-1.5 sm:pl-2.5 ml-0.5">
                  <div
                    ref={accountRef}
                    className="relative"
                    onMouseEnter={handleAccountEnter}
                    onMouseLeave={handleAccountLeave}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!accountOpen && isNotificationOpen) toggleNotifications()
                        setAccountOpen((v) => !v)
                      }}
                      aria-label="Account menu"
                      aria-expanded={accountOpen}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-[var(--border-color)] hover:border-[var(--foreground)] transition-all flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <UserAvatar
                        src={user.user_metadata?.avatar_url}
                        alt={displayName}
                        email={user.email}
                        size={32}
                        sizeClass="w-7 h-7 sm:w-8 sm:h-8"
                      />
                    </button>

                    {accountOpen && (
                      // Transparent pt-2 bridges the gap so the mouse can travel
                      // from the avatar to the panel without it closing.
                      <div className="absolute right-0 top-full z-50 pt-2">
                        <div
                          role="menu"
                          aria-label="Account"
                          className="w-64 bg-[var(--popover)] border border-[var(--border-color)] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                        >
                          <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center gap-3">
                            <UserAvatar
                              src={user.user_metadata?.avatar_url}
                              alt={displayName}
                              email={user.email}
                              size={36}
                              sizeClass="w-9 h-9"
                            />
                            <span className="min-w-0">
                              <span className="block text-xs font-bold text-[var(--foreground)] truncate">{displayName}</span>
                              <span className="block text-[10px] text-[var(--muted-foreground)] truncate">{user.email}</span>
                            </span>
                          </div>
                          <div className="p-1.5">
                          {(
                            [
                              { href: "/profile?tab=orders", label: "Orders", Icon: ShoppingBag },
                              { href: "/profile?tab=favourites", label: "Favourites", Icon: Heart },
                              { href: "/profile?tab=language", label: "Language", Icon: Globe },
                              { href: "/profile?tab=address", label: "Address", Icon: MapPin },
                              { href: "/profile?tab=payment", label: "Payment", Icon: CreditCard },
                            ] as const
                          ).map(({ href, label, Icon }) => (
                            <Link
                              key={href}
                              role="menuitem"
                              href={href}
                              onClick={() => setAccountOpen(false)}
                              className="px-3 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--glass-bg)] rounded-lg font-medium flex items-center gap-2.5 cursor-pointer"
                            >
                              <Icon size={15} aria-hidden /> {label}
                            </Link>
                          ))}
                          </div>
                          <button
                            role="menuitem"
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={async (e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setAccountOpen(false)
                              await signOut()
                              router.push("/")
                              router.refresh()
                            }}
                            className="px-4 py-3 text-sm text-[var(--toast-error)] hover:bg-[var(--glass-bg)] font-medium text-left border-t border-[var(--border-color)] flex items-center gap-2 w-full cursor-pointer transition-colors"
                          >
                            <LogOut size={14} aria-hidden /> Log out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center border-l border-[var(--border-color)] pl-1.5 sm:pl-2.5 ml-0.5">
                  <Link
                    href="/login"
                    prefetch
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--foreground)] text-[var(--background)] rounded-full text-xs font-bold hover:opacity-90 transition-all cursor-pointer inline-flex items-center"
                  >
                    Sign In
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="p-1.5 sm:p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] md:hidden shrink-0 cursor-pointer active:scale-95"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
              >
                <Menu size={19} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
