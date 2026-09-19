"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, Search, Menu, ShoppingBag, LogOut, User as UserIcon } from "lucide-react"
import { useAuth } from "@/contexts/providers/auth-context"
import { useCart } from "@/contexts/providers/cart-context"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { useNotifications } from "@/contexts/providers/notifications-context"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { VideoLogo } from "@/components/video-logo"
import { MobileNav } from "@/components/mobile-nav"
import { ThemeToggle } from "@/components/theme-toggle"

export function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  const { user, signOut } = useAuth()
  const { cart, toggleCart } = useCart()
  const { searchQuery, setSearchQuery } = useCatalog()
  const { toggleNotifications, unreadCount } = useNotifications()

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)

  // Click-outside / Escape for the account menu — hover opens it, but it
  // must still close for keyboard and touch users.
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
        {/* Reverted layout: logo alone, no background, at the top-left of the
            site; the white band exists ONLY behind the search + actions
            cluster on the top-right and stops at the search bar. The middle
            of the header stays transparent so the page shows through. */}
        <div className="pointer-events-auto flex w-full items-start justify-between gap-2 sm:gap-4 px-3 sm:px-5">
          <VideoLogo videoClassName="h-20 sm:h-24 lg:h-28" />

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5 rounded-[22px] bg-white dark:bg-[#181a1b] backdrop-blur-md border border-gray-100 dark:border-gray-800 shadow-[0_10px_40px_rgba(0,0,0,0.06)] px-3 sm:px-4 py-2.5">
            {/* Compact search — ends the band on the right. */}
            <div className="relative mr-1 w-[130px] sm:w-[170px] lg:w-[200px]">
              <label htmlFor="global-search" className="sr-only">
                Search products
              </label>
              <input
                id="global-search"
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  // Typing a search from any other route should land the user
                  // on the results. A single push per value keeps history from
                  // stacking one entry per keystroke.
                  if (pathname !== "/" && e.target.value.length > 0) router.push("/")
                }}
                className="w-full bg-[var(--glass-bg)] border border-[var(--border-color)] rounded-full px-3 py-1.5 pl-9 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] hover:bg-[var(--glass-highlight)] transition-all"
              />
              <Search
                className="absolute left-3 top-2.5 text-[var(--muted-foreground)] w-4 h-4"
                aria-hidden
              />
            </div>

            <ThemeToggle />

            <button
              type="button"
              onClick={toggleNotifications}
              data-notification-trigger
              className="p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] opacity-70 hover:opacity-100 transition-all relative"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-[var(--accent)] text-[var(--background)] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={toggleCart}
              className="p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] opacity-70 hover:opacity-100 transition-all relative"
              aria-label={`Shopping cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-[var(--foreground)] text-[var(--background)] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="hidden sm:flex items-center border-l border-[var(--border-color)] pl-2 sm:pl-3 ml-1">
                <div
                  ref={accountRef}
                  className="relative"
                  onMouseEnter={() => setAccountOpen(true)}
                  onMouseLeave={() => setAccountOpen(false)}
                >
                  <Link
                    href="/profile"
                    onMouseEnter={() => router.prefetch("/profile")}
                    aria-label="Go to my profile"
                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--border-color)] hover:border-[var(--foreground)] transition-all flex items-center justify-center bg-[var(--foreground)] text-[var(--background)] text-xs font-bold"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt=""
                        width={32}
                        height={32}
                        unoptimized
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      displayName[0]?.toUpperCase() ?? "A"
                    )}
                  </Link>

                  {accountOpen && (
                    // Transparent pt-2 bridges the gap so the mouse can travel
                    // from the avatar to the panel without it closing.
                    <div className="absolute right-0 top-full z-50 pt-2">
                      <div
                        role="menu"
                        aria-label="Account"
                        className="w-52 bg-[var(--popover)] border border-[var(--border-color)] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                      >
                        <div className="px-4 py-3 border-b border-[var(--border-color)]">
                          <p className="text-xs font-bold text-[var(--foreground)] truncate">{displayName}</p>
                          <p className="text-[10px] text-[var(--muted-foreground)] truncate">{user.email}</p>
                        </div>
                        <Link
                          role="menuitem"
                          href="/profile"
                          onClick={() => setAccountOpen(false)}
                          className="px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--glass-bg)] font-medium flex items-center gap-2"
                        >
                          <UserIcon size={14} aria-hidden /> My Profile
                        </Link>
                        <Link
                          role="menuitem"
                          href="/profile?tab=orders"
                          onClick={() => setAccountOpen(false)}
                          className="px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--glass-bg)] font-medium flex items-center gap-2"
                        >
                          <ShoppingBag size={14} aria-hidden /> My Orders
                        </Link>
                        <button
                          role="menuitem"
                          type="button"
                          onClick={() => {
                            setAccountOpen(false)
                            void signOut()
                          }}
                          className="px-4 py-3 text-sm text-[var(--toast-error)] hover:bg-[var(--glass-bg)] font-medium text-left border-t border-[var(--border-color)] flex items-center gap-2 w-full"
                        >
                          <LogOut size={14} aria-hidden /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center border-l border-[var(--border-color)] pl-2 sm:pl-3 ml-1">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  // Prefetch on hover so the sign-in page opens without lag.
                  onMouseEnter={() => router.prefetch("/login")}
                  className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-full text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] md:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
