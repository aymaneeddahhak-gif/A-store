"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, ShoppingBag, User as UserIcon } from "lucide-react"
import { RailFlyoutPortal, useRailAnchoredFlyout } from "@/components/rail-flyout-portal"
import { useAuth } from "@/contexts/providers/auth-context"

/**
 * Profile flyout for the site rail — the same actions as the top-nav account
 * menu (My Profile / My Orders / Sign Out), revealed on hover of the rail's
 * profile row. Portaled to the body and anchored next to the rail so it
 * paints above the nav and page content; the rail owns the delayed close
 * (see components/sidebar.tsx).
 */
export function ProfileFlyout() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const position = useRailAnchoredFlyout(Boolean(user))

  if (!user) return null

  const displayName =
    user.user_metadata?.full_name || user.user_metadata?.name || user.email || "Account"

  return (
    <RailFlyoutPortal
      open={Boolean(user)}
      top={position?.top ?? null}
      left={position?.left ?? null}
      label="profile"
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
    >
      <div
        role="menu"
        aria-label="Account"
        className="w-56 bg-[var(--popover)] border border-[var(--border-color)] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-2 duration-150"
      >
        <div className="px-4 py-3 border-b border-[var(--border-color)]">
          <p className="text-xs font-bold text-[var(--foreground)] truncate">{displayName}</p>
          <p className="text-[10px] text-[var(--muted-foreground)] truncate">{user.email}</p>
        </div>
        <Link
          role="menuitem"
          href="/profile"
          className="px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--glass-bg)] font-medium flex items-center gap-2"
        >
          <UserIcon size={14} aria-hidden /> My Profile
        </Link>
        <Link
          role="menuitem"
          href="/profile?tab=orders"
          className="px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--glass-bg)] font-medium flex items-center gap-2"
        >
          <ShoppingBag size={14} aria-hidden /> My Orders
        </Link>
        <button
          role="menuitem"
          type="button"
          onClick={() => {
            void signOut()
            router.push("/")
          }}
          className="px-4 py-3 text-sm text-[var(--toast-error)] hover:bg-[var(--glass-bg)] font-medium text-left border-t border-[var(--border-color)] flex items-center gap-2 w-full cursor-pointer"
        >
          <LogOut size={14} aria-hidden /> Sign Out
        </button>
      </div>
    </RailFlyoutPortal>
  )
}
