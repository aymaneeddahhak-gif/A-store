"use client"

import { useShop } from "@/contexts/shop-context"
import { X, Package, Tag, Truck, Star, Bell, Check, Trash2 } from "lucide-react"
import { useEffect, useRef } from "react"

const iconMap: Record<string, React.ReactNode> = {
    order: <Package size={18} className="text-blue-400" />,
    promo: <Tag size={18} className="text-emerald-400" />,
    shipping: <Truck size={18} className="text-amber-400" />,
    review: <Star size={18} className="text-yellow-400" />,
    system: <Bell size={18} className="text-purple-400" />,
}

export function NotificationPanel() {
    const {
        notifications,
        isNotificationOpen,
        toggleNotifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
        unreadCount,
    } = useShop()

    const panelRef = useRef<HTMLDivElement>(null)

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target as Node) &&
                !(e.target as HTMLElement).closest("[data-notification-trigger]")
            ) {
                if (isNotificationOpen) toggleNotifications()
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isNotificationOpen, toggleNotifications])

    // Close on Escape
    useEffect(() => {
        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape" && isNotificationOpen) toggleNotifications()
        }
        document.addEventListener("keydown", handleEscape)
        return () => document.removeEventListener("keydown", handleEscape)
    }, [isNotificationOpen, toggleNotifications])

    return (
        <div
            ref={panelRef}
            className={`
                fixed top-[64px] right-[80px] w-[380px] max-h-[520px] z-[70]
                bg-[var(--drawer-bg)] border border-[var(--border-color)]
                rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)]
                backdrop-blur-md overflow-hidden
                transform transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                ${isNotificationOpen
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 -translate-y-3 scale-95 pointer-events-none"
                }
            `}
            role="dialog"
            aria-label="Notifications"
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight">
                        Notifications
                    </h3>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {unreadCount} new
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="p-1.5 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--muted-foreground)] hover:text-emerald-400 transition-all"
                            title="Mark all as read"
                        >
                            <Check size={16} />
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={clearAllNotifications}
                            className="p-1.5 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--muted-foreground)] hover:text-rose-400 transition-all"
                            title="Clear all"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <button
                        onClick={toggleNotifications}
                        className="p-1.5 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[400px] scrollbar-thin">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-[var(--glass-bg)] border border-[var(--border-color)] flex items-center justify-center mb-4">
                            <Bell size={24} className="text-[var(--muted-foreground)] opacity-50" />
                        </div>
                        <p className="text-sm text-[var(--foreground)] font-medium mb-1">All caught up!</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                            You have no notifications right now.
                        </p>
                    </div>
                ) : (
                    notifications.map((notif, i) => (
                        <div
                            key={notif.id}
                            onClick={() => !notif.read && markAsRead(notif.id)}
                            className={`
                                group relative px-5 py-4 flex items-start gap-3 cursor-pointer
                                transition-all duration-200 hover:bg-[var(--glass-bg)]
                                ${!notif.read ? "bg-[var(--glass-bg)]/50" : ""}
                                ${i < notifications.length - 1 ? "border-b border-[var(--border-color)]/50" : ""}
                            `}
                        >
                            {/* Unread indicator */}
                            {!notif.read && (
                                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                            )}

                            {/* Icon */}
                            <div className="w-9 h-9 rounded-xl bg-[var(--glass-bg)] border border-[var(--border-color)] flex items-center justify-center shrink-0 mt-0.5">
                                {iconMap[notif.type] || iconMap.system}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${!notif.read ? "text-[var(--foreground)] font-semibold" : "text-[var(--foreground)] opacity-80"}`}>
                                    {notif.title}
                                </p>
                                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-2">
                                    {notif.message}
                                </p>
                                <span className="text-[10px] text-[var(--muted-foreground)] opacity-60 mt-1 block">
                                    {notif.time}
                                </span>
                            </div>

                            {/* Delete */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removeNotification(notif.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--muted-foreground)] hover:text-rose-400 transition-all shrink-0"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="px-5 py-3 border-t border-[var(--border-color)] bg-[var(--glass-bg)]/30">
                    <button
                        onClick={toggleNotifications}
                        className="w-full text-center text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    )
}
