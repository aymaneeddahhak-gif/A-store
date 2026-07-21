"use client"

import { useState } from "react"
import { Bell, Search, Menu, ShoppingBag, Sun, Moon, LogOut } from "lucide-react"
import { useShop } from "@/contexts/shop-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { VideoLogo } from "@/components/video-logo"
import { MobileNav } from "@/components/mobile-nav"

export function TopNav() {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const {
    user,
    signOut,
    toggleCart,
    cart,
    toggleTheme,
    isDarkMode,
    searchQuery,
    setSearchQuery,
    toggleNotifications,
    unreadCount,
    selectedCategory,
    setCategory,
  } = useShop()

  return (
    <>
      <nav
        className="fixed top-0 left-0 w-full p-4 z-40 flex justify-between items-center pointer-events-none"
        aria-label="Main"
      >
        <div className="pointer-events-auto pl-2 sm:pl-4">
          <VideoLogo />
        </div>

        <div className="pointer-events-auto flex items-center gap-2 sm:gap-4 pr-2 sm:pr-4">
          <div className="flex items-center gap-2">
            <div className="relative group hidden sm:block">
              <label htmlFor="global-search" className="sr-only">
                Search products
              </label>
              <input
                id="global-search"
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[var(--glass-bg)] border border-[var(--border-color)] rounded-full px-4 py-2 pl-10 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] hover:bg-[var(--glass-highlight)] transition-all w-32 focus:w-48 lg:w-40 lg:focus:w-56"
              />
              <Search
                className="absolute left-3 top-2.5 text-[var(--muted-foreground)] w-4 h-4"
                aria-hidden
              />
            </div>

            <label htmlFor="nav-category" className="sr-only">
              Filter by category
            </label>
            <select
              id="nav-category"
              value={selectedCategory}
              onChange={(e) => setCategory(e.target.value)}
              className="hidden md:block bg-[var(--glass-bg)] border border-[var(--border-color)] rounded-full px-3 py-2 text-xs font-semibold text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] hover:bg-[var(--glass-highlight)] cursor-pointer transition-all"
            >
              <option value="All">All</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Food">Food</option>
            </select>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] opacity-70 hover:opacity-100 transition-all"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            type="button"
            onClick={toggleNotifications}
            data-notification-trigger
            className="p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] opacity-70 hover:opacity-100 transition-all relative"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-[var(--accent)] text-[var(--background)] text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={toggleCart}
            className="p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] opacity-70 hover:opacity-100 transition-all relative"
            aria-label={`Shopping cart, ${cart.length} items`}
          >
            <ShoppingBag size={20} />
            {cart.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-2 border-l border-[var(--border-color)] pl-4 ml-2">
              <div className="hidden lg:flex flex-col items-end mr-2">
                <span className="text-xs font-semibold text-[var(--foreground)]">
                  {user.user_metadata?.full_name || user.user_metadata?.name || user.email}
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)]">Signed in</span>
              </div>
              <div className="relative group">
                {user.user_metadata?.avatar_url ? (
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--border-color)] hover:border-[var(--foreground)] transition-all"
                    aria-label="Account menu"
                  >
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center hover:opacity-90 transition-all text-xs font-bold"
                    aria-label="Account menu"
                  >
                    {(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}
                  </button>
                )}
                <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--card)] border border-[var(--border-color)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all flex flex-col overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border-color)]">
                    <p className="text-xs font-bold text-[var(--foreground)] truncate">
                      {user.user_metadata?.full_name || user.user_metadata?.name || "User"}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/orders"
                    className="px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--glass-bg)] font-medium flex items-center gap-2"
                  >
                    <ShoppingBag size={14} /> My Orders
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="px-4 py-3 text-sm text-rose-500 hover:bg-[var(--glass-bg)] font-medium text-left border-t border-[var(--border-color)] flex items-center gap-2 w-full"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center border-l border-[var(--border-color)] pl-4 ml-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
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
      </nav>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
