"use client"

import { useEffect, useState, useRef, useCallback } from "react"
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
import { ProfileFlyout } from "@/components/profile/profile-flyout"

/** Hover grace period before a flyout closes — long enough to cross the
 * portal gap between the rail and its anchored panel, short enough to feel
 * snappy. Both sides (rail + panel) cancel the pending close on re-entry. */
const FLYOUT_CLOSE_DELAY_MS = 140

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    all: <LayoutDashboard size={24} />,
    phones: <Smartphone size={24} />,
    sneakers: <Footprints size={24} />,
    gaming: <Gamepad2 size={24} />,
    clothes: <Shirt size={24} />,
    food: <Coffee size={24} />,
}

export function Sidebar() {
    // The rail is permanently slim — its flyouts (seller sidebar, profile
    // menu) are the expansion, so there is no collapse toggle anymore.
    const [profileOpen, setProfileOpen] = useState(false)
    const { selectedCategory, setCategory, categories } = useCatalog()
    const { user } = useAuth()
    const { setFlyoutOpen } = useSellerNav()
    const router = useRouter()
    const pathname = usePathname()
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const scheduleFlyoutClose = useCallback(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current)
        closeTimer.current = setTimeout(() => {
            setFlyoutOpen(false)
            setProfileOpen(false)
        }, FLYOUT_CLOSE_DELAY_MS)
    }, [setFlyoutOpen])

    const cancelFlyoutClose = useCallback(() => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current)
            closeTimer.current = null
        }
    }, [])

    // A hovered flyout never outlives its route.
    useEffect(() => {
        setFlyoutOpen(false)
        setProfileOpen(false)
    }, [pathname, setFlyoutOpen])

    const handleCategoryClick = (id: string) => {
        setCategory(id)
        if (pathname !== "/") {
            router.push("/")
        }
    }

    return (
        <div
            className="relative"
            onMouseLeave={scheduleFlyoutClose}
            onMouseEnter={cancelFlyoutClose}
        >
            <aside
                className={`
        floating-sidebar flex flex-col items-center py-6 gap-4 overflow-hidden
        w-[80px]
      `}
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
                    href="/seller"
                    icon={<Store size={24} />}
                    label="Seller"
                    active={pathname === "/seller"}
                    onMouseEnter={() => {
                        cancelFlyoutClose()
                        setFlyoutOpen(true)
                    }}
                    onClick={() => setFlyoutOpen(false)}
                />

                {user ? (
                    <SidebarRow
                        href="/profile"
                        icon={<User size={24} />}
                        label="My Profile"
                        active={pathname === "/profile"}
                        onMouseEnter={() => {
                            cancelFlyoutClose()
                            setProfileOpen(true)
                        }}
                        onClick={() => setProfileOpen(false)}
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
            {profileOpen && <ProfileFlyout />}
        </div>
    )
}

/**
 * One row, two shapes: renders as a <Link> when href is set (navigation) or a
 * <button> otherwise (category filter). Previously these were two ~50-line
 * copies of the same markup.
 */
function SidebarRow({
    href,
    icon,
    label,
    active,
    onClick,
    onMouseEnter,
}: {
    href?: string
    icon: React.ReactNode
    label: string
    active?: boolean
    onClick?: () => void
    onMouseEnter?: () => void
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
            <Link href={href} prefetch onClick={onClick} onMouseEnter={onMouseEnter} className={className} aria-current={active ? "page" : undefined}>
                {content}
            </Link>
        )
    }

    return (
        <button type="button" onClick={onClick} onMouseEnter={onMouseEnter} className={className} aria-current={active ? "true" : undefined}>
            {content}
        </button>
    )
}
