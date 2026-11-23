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
    all: <LayoutDashboard size={24} />,
    phones: <Smartphone size={24} />,
    sneakers: <Footprints size={24} />,
    gaming: <Gamepad2 size={24} />,
    clothes: <Shirt size={24} />,
    food: <Coffee size={24} />,
}

export function Sidebar() {
    const { selectedCategory, setCategory, categories } = useCatalog()
    const { user } = useAuth()
    const { flyoutOpen, setFlyoutOpen } = useSellerNav()
    const router = useRouter()
    const pathname = usePathname()

    // Close the pinned flyout when switching routes.
    useEffect(() => {
        setFlyoutOpen(false)
    }, [pathname, setFlyoutOpen])

    const handleCategoryClick = (id: string) => {
        setCategory(id)
        if (pathname !== "/") {
            router.push("/")
        }
    }

    return (
        <div className="relative">
            <aside
                className="floating-sidebar flex flex-col items-center py-6 gap-4 overflow-hidden w-[80px]"
            >
                <div className="flex flex-col gap-3 w-full px-3">
                    {categories.map(({ id, label }) => (
                        <SidebarRow
                            key={id}
                            icon={CATEGORY_ICONS[id] ?? <Tag size={24} />}
                            label={id === "all" ? "All Products" : label}
                            active={selectedCategory === id}
                            onClick={() => handleCategoryClick(id)}
                        />
                    ))}

                    <div className="h-px w-full bg-[var(--border-color)] my-2 opacity-50" />

                    <SidebarRow
                        icon={<Store size={24} />}
                        label="Seller"
                        active={pathname === "/seller" || flyoutOpen}
                        dataAttr="seller-trigger"
                        onClick={() => setFlyoutOpen(!flyoutOpen)}
                    />

                    {user ? (
                        <SidebarRow
                            href="/profile"
                            icon={<User size={24} />}
                            label="My Profile"
                            active={pathname === "/profile"}
                        />
                    ) : (
                        <SidebarRow
                            href="/login"
                            icon={<User size={24} />}
                            label="Sign In"
                            active={pathname === "/login"}
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
}: {
    href?: string
    icon: React.ReactNode
    label: string
    active?: boolean
    dataAttr?: string
    onClick?: () => void
}) {
    const className = `flex items-center gap-4 p-3 justify-center text-[var(--text-main)] rounded-xl cursor-pointer w-full text-left transition-colors duration-150 group relative ${
        active
            ? "bg-[var(--glass-highlight)] border border-[var(--glass-border)]"
            : "hover:bg-[var(--glass-bg)]"
    }`

    const content = (
        <>
            <span className={`relative z-10 shrink-0 ${active ? "text-[var(--electric-light-color)]" : ""}`} title={label}>
                {icon}
            </span>
            <span className="sr-only">{label}</span>
        </>
    )

    if (href) {
        return (
            <Link href={href} prefetch onClick={onClick} className={className} aria-current={active ? "page" : undefined}>
                {content}
            </Link>
        )
    }

    return (
        <button
            type="button"
            onClick={onClick}
            data-seller-trigger={dataAttr === "seller-trigger" ? "true" : undefined}
            aria-expanded={dataAttr === "seller-trigger" ? active : undefined}
            className={className}
            aria-current={active ? "true" : undefined}
        >
            {content}
        </button>
    )
}
