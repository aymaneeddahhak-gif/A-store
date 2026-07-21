"use client"

import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import type { Notification } from "@/lib/types"

/**
 * UI Notifications — the in-app bell panel (order/promo/shipping/system).
 * Client-only; split out so toast/cart activity doesn't re-render the bell.
 */

type NotificationsContextValue = {
  notifications: Notification[]
  isNotificationOpen: boolean
  unreadCount: number
  toggleNotifications: () => void
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
  pushNotification: (n: Omit<Notification, "id" | "time" | "read">) => void
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const toggleNotifications = useCallback(() => setIsNotificationOpen((prev) => !prev), [])
  const markAsRead = useCallback(
    (id: string) =>
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))),
    []
  )
  const markAllAsRead = useCallback(
    () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    []
  )
  const removeNotification = useCallback(
    (id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id)),
    []
  )
  const clearAllNotifications = useCallback(() => setNotifications([]), [])

  const pushNotification = useCallback(
    (n: Omit<Notification, "id" | "time" | "read">) => {
      setNotifications((prev) => [
        { ...n, id: Date.now().toString(), time: "Just now", read: false },
        ...prev,
      ])
    },
    []
  )

  const value = useMemo(
    () => ({
      notifications,
      isNotificationOpen,
      unreadCount,
      toggleNotifications,
      setNotifications,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAllNotifications,
      pushNotification,
    }),
    [
      notifications,
      isNotificationOpen,
      unreadCount,
      toggleNotifications,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAllNotifications,
      pushNotification,
    ]
  )

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (ctx === undefined)
    throw new Error("useNotifications must be used within NotificationsProvider")
  return ctx
}
