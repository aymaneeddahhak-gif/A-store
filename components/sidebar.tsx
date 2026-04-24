"use client"

import { useState } from "react"
import { LayoutDashboard, Zap, Shirt, Coffee, Headphones, ChevronLeft, ChevronRight, Settings } from "lucide-react"
import { useShop } from "@/contexts/shop-context"

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(true)
    const { selectedCategory, setCategory } = useShop()

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
                        onClick={() => setCategory(cat.id)}
                    />
                ))}

                <div className="h-px w-full bg-[var(--border-color)] my-2 opacity-50" />
                <SidebarItem icon={<Settings size={24} />} label="Settings" collapsed={collapsed} />
            </div>

            <div className="mt-auto mb-4">
                <button
                    onClick={() => setCollapsed(!collapsed)}
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
        <div
            onClick={onClick}
            className={`
        flex items-center gap-4 p-3 text-[var(--text-main)] rounded-xl cursor-pointer
        transition-all duration-300 group relative overflow-hidden
        ${collapsed ? "justify-center" : "px-4"}
        ${active ? "bg-[var(--glass-highlight)] shadow-[0_0_15px_rgba(128,128,128,0.15)] border border-[var(--glass-border)]" : "hover:bg-[var(--glass-bg)] hover:scale-105"}
      `}
        >
            <span className={`relative z-10 shrink-0 transition-transform duration-300 group-hover:scale-110 ${active ? "text-[var(--electric-light-color)]" : ""}`}>
                {icon}
            </span>

            <span className={`
        whitespace-nowrap font-medium relative z-10
        transition-all duration-300 origin-left
        ${collapsed ? "w-0 opacity-0 scale-0" : "w-auto opacity-100 scale-100"}
        ${active ? "text-[var(--foreground)] font-bold" : ""}
      `}>
                {label}
            </span>

            {/* Glow effect on hover */}
            <div className={`absolute inset-0 bg-gradient-to-r from-[var(--glass-highlight)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${active ? "opacity-20" : ""}`} />
        </div>
    )
}
