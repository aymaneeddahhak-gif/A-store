"use client"

import { useNotifications } from "@/contexts/providers/notifications-context"
import { X, Check, Trash2, Bell } from "lucide-react"
import { useEffect, useRef } from "react"
import {
  NotificationCard,
  STYLE_FOR_TYPE,
} from "@/components/notifications/notification-card"

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
    } = useNotifications()

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
                absolute top-full mt-2.5 z-50
                left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-[-60px] md:right-[-70px]
                w-[calc(100vw-32px)] sm:w-[380px] max-h-[520px]
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
            aria-hidden={!isNotificationOpen}
            inert={!isNotificationOpen ? true : undefined}
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight">
                    Notifications
                </h3>
                <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="p-1.5 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--muted-foreground)] hover:text-emerald-400 transition-all cursor-pointer"
                            title="Mark all as read"
                            aria-label="Mark all notifications as read"
                        >
                            <Check size={16} />
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={clearAllNotifications}
                            className="p-1.5 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--muted-foreground)] hover:text-rose-400 transition-all cursor-pointer"
                            title="Clear all"
                            aria-label="Clear all notifications"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <button
                        onClick={toggleNotifications}
                        className="p-1.5 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all cursor-pointer"
                        aria-label="Close notifications"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[400px]">
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
                    notifications.map((notif, i) => {
                        const style = STYLE_FOR_TYPE[notif.type] ?? STYLE_FOR_TYPE.system
                        return (
                        <div
                            key={notif.id}
                            onClick={() => !notif.read && markAsRead(notif.id)}
                            onKeyDown={(e) => {
                                if (!notif.read && (e.key === "Enter" || e.key === " ")) {
                                    e.preventDefault()
                                    markAsRead(notif.id)
                                }
                            }}
                            role={notif.read ? undefined : "button"}
                            tabIndex={notif.read ? undefined : 0}
                            aria-label={notif.read ? undefined : `Mark "${notif.title}" as read`}
                            className={`
                                relative px-3 py-2.5 cursor-pointer
                                transition-all duration-200 hover:bg-[var(--glass-bg)]
                                ${!notif.read ? "bg-[var(--glass-bg)]/50" : ""}
                                ${i < notifications.length - 1 ? "border-b border-[var(--border-color)]/50" : ""}
                            `}
                        >
                            <NotificationCard
                                title={notif.title}
                                message={notif.message}
                                footnote={notif.time}
                                icon={style.icon}
                                accent={style.accent}
                                onClose={() => removeNotification(notif.id)}
                            />
                        </div>
                        )
                    })
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="px-5 py-3 border-t border-[var(--border-color)] bg-[var(--glass-bg)]/30">
                    <button
                        onClick={toggleNotifications}
                        className="w-full text-center text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    )
}
