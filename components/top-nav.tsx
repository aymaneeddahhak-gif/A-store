"use client"

import { Bell, Search, Menu, ShoppingBag, Sun, Moon } from "lucide-react"
import { useShop } from "@/contexts/shop-context"

export function TopNav() {
    const { toggleCart, cart, toggleTheme, isDarkMode, searchQuery, setSearchQuery } = useShop()

    return (
        <nav className="fixed top-0 left-0 w-full p-4 z-40 flex justify-between items-center pointer-events-none">
            {/* Brand */}
            <div className="pointer-events-auto pl-4">
                <h1 className="text-xl font-bold text-[var(--foreground)] tracking-widest drop-shadow-[0_0_10px_rgba(128,128,128,0.3)]">
                    FIKRA<span className="text-[var(--silver-dark)]">.LABS</span>
                </h1>
            </div>

            {/* Actions */}
            <div className="pointer-events-auto flex items-center gap-4 pr-4">
                {/* Search Bar */}
                <div className="relative group hidden sm:block">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[var(--glass-bg)] border border-[var(--border-color)] rounded-full px-4 py-2 pl-10 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--electric-border-color)] hover:bg-[var(--glass-highlight)] transition-all w-40 focus:w-56"
                    />
                    <Search className="absolute left-3 top-2.5 text-[var(--muted-foreground)] w-4 h-4" />
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] opacity-70 hover:opacity-100 transition-all"
                    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button className="p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] opacity-70 hover:opacity-100 transition-all">
                    <Bell size={20} />
                </button>

                {/* Cart Button */}
                <button
                    onClick={toggleCart}
                    className="p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] opacity-70 hover:opacity-100 transition-all relative"
                >
                    <ShoppingBag size={20} />
                    {cart.length > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                            {cart.length}
                        </span>
                    )}
                </button>

                <button className="p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] opacity-70 hover:opacity-100 transition-all sm:hidden">
                    <Menu size={20} />
                </button>
            </div>
        </nav>
    )
}
