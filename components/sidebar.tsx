"use client"

import { useState } from "react"
import { LayoutDashboard, Zap, Shirt, Coffee, ChevronLeft, ChevronRight, User, Store, ShoppingBag } from "lucide-react"
import { useShop } from "@/contexts/shop-context"
import Link from "next/link"

import { useRouter, usePathname } from "next/navigation"

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(true)
    const { selectedCategory, setCategory, user } = useShop()
    const router = useRouter()
    const pathname = usePathname()

    const handleCategoryClick = (id: string) => {
        setCategory(id)
        if (pathname !== "/") {
            router.push("/")
        }
    }

    const categories = [
        { id: "All", icon: <LayoutDashboard size={24} />, label: "All Products" },
        { id: "Electronics", icon: <Zap size={24} />, label: "Electronics" },
        { id: "Fashion", icon: <Shirt size={24} />, label: "Fashion" },
        { id: "Food", icon: <Coffee size={24} />, label: "Food" },
    ]

    return (
        <aside
            className={`
        floating-sidebar flex flex-col items-center py-6 gap-4
        transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        ${collapsed ? "w-[80px]" : "w-[240px]"}
      `}
        >
            <div className="flex flex-col gap-3 w-full px-3">
                {categories.map((cat) => (
                    <SidebarItem
                        key={cat.id}
                        icon={cat.icon}
                        label={cat.label}
                        collapsed={collapsed}
                        active={selectedCategory === cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                    />
                ))}

                <div className="h-px w-full bg-[var(--border-color)] my-2 opacity-50" />
                
                <SidebarItem 
                    icon={<Store size={24} />} 
                    label="Seller" 
                    collapsed={collapsed} 
                    active={pathname === "/seller"}
                    onClick={() => router.push("/seller")}
                />

                {user ? (
                    <SidebarItem 
                        icon={<ShoppingBag size={24} />} 
                        label="My Orders" 
                        collapsed={collapsed} 
                        active={pathname === "/orders"}
                        onClick={() => router.push("/orders")}
                    />
                ) : (
                    <SidebarItem 
                        icon={<User size={24} />} 
                        label="Sign In" 
                        collapsed={collapsed} 
                        active={pathname === "/login"}
                        onClick={() => router.push("/login")}
                    />
                )}
            </div>

            <div className="mt-auto mb-4">
                <button
                    type="button"
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="p-3 rounded-full text-[var(--text-main)] hover:bg-[var(--glass-bg)] border border-transparent hover:border-[var(--border-color)] transition-all"
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>
        </aside>
    )
}

function SidebarItem({
    icon,
    label,
    collapsed,
    active,
    onClick
}: {
    icon: React.ReactNode,
    label: string,
    collapsed: boolean,
    active?: boolean,
    onClick?: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
        flex items-center gap-4 p-3 text-[var(--text-main)] rounded-xl cursor-pointer w-full text-left
        transition-all duration-200 group relative
        ${collapsed ? "justify-center" : "px-4"}
        ${active ? "bg-[var(--glass-highlight)] border border-[var(--glass-border)]" : "hover:bg-[var(--glass-bg)]"}
      `}
        >
            <span className={`relative z-10 shrink-0 transition-transform duration-200 ${active ? "text-[var(--electric-light-color)]" : ""}`}>
                {icon}
            </span>

            <span className={`
        whitespace-nowrap font-medium relative z-10
        transition-all duration-200 origin-left
        ${collapsed ? "w-0 opacity-0 scale-0" : "w-auto opacity-100 scale-100"}
        ${active ? "text-[var(--foreground)] font-bold" : ""}
      `}>
                {label}
            </span>
        </button>
    )
}
