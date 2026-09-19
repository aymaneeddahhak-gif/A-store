"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { SHIPPING_FEE } from "@/lib/types"
import type { CartItem, Order, ShippingAddress } from "@/lib/types"
import { useToast } from "@/contexts/toast-context"
import { useAuth } from "@/contexts/providers/auth-context"
import { useNotifications } from "@/contexts/providers/notifications-context"
import {
  cancelOrderAction,
  fetchMyOrdersAction,
  placeOrderAction,
  updateOrderStatusAction,
} from "@/lib/actions/orders"

/**
 * Orders — depends on Auth (per-user orders) and pushes a notification
 * when a new order is placed.
 *
 * Two sources are merged: rows loaded from the database, and session-only
 * orders kept when an insert is refused (offline, or RLS denying the write) so
 * the customer still sees a confirmation. Status changes are applied to both.
 */

type OrdersContextValue = {
  orders: Order[]
  ordersLoading: boolean
  placeOrder: (
    cart: CartItem[],
    promoCode?: string,
    shipping?: ShippingAddress
  ) => Promise<{ order: Order | null; field?: string }>
  updateOrderStatus: (orderId: string, status: string) => Promise<void>
  cancelOrder: (orderId: string) => Promise<void>
}

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined)

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const { user } = useAuth()
  const { pushNotification } = useNotifications()
  const router = useRouter()

  const [orders, setOrders] = useState<Order[]>([])
  const [localOrders, setLocalOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // Load the signed-in user's history. Without this the list would only ever
  // contain orders placed during the current session.
  useEffect(() => {
    if (!user) {
      setOrders([])
      setLocalOrders([])
      setOrdersLoading(false)
      return
    }

    let active = true
    setOrdersLoading(true)
    void fetchMyOrdersAction()
      .then((res) => {
        if (!active) return
        if (res.ok) setOrders(res.data)
      })
      .finally(() => {
        if (active) setOrdersLoading(false)
      })

    // Ignore a resolved request for a user who has since signed out.
    return () => {
      active = false
    }
  }, [user])

  const mergedOrders = useMemo(() => {
    const dbIds = new Set(orders.map((o) => o.id))
    return [...orders, ...localOrders.filter((o) => !dbIds.has(o.id))]
  }, [orders, localOrders])

  const placeOrder = useCallback(
    async (
      cart: CartItem[],
      promoCode?: string,
      shipping?: ShippingAddress
    ): Promise<{ order: Order | null; field?: string }> => {
      if (!user || cart.length === 0) return { order: null }

      // A network-level failure must not leave the caller's spinner stuck —
      // placeOrderAction catches its own errors, but a dropped fetch throws here.
      // A server rejection (sold out, bad stock, bad address) returns null WITHOUT the
      // session fallback below — it must not create orders for unsellable items.
      // Field-tagged rejections are returned silently for the caller to highlight.
      let serverOrder: Order | null = null
      try {
        const res = await placeOrderAction({
          items: cart.map(({ id, quantity }) => ({ id, quantity })),
          promoCode,
          shipping,
        })
        if (!res.ok) {
          if (!res.field) showToast(res.error || "Could not place the order.", "error")
          return { order: null, field: res.field }
        }
        serverOrder = res.data
      } catch {
        // Dropped fetch — fall through to the session fallback below.
        serverOrder = null
      }

      const order: Order =
        serverOrder ??
        (() => {
          const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
          const total = subtotal + (subtotal > 0 ? SHIPPING_FEE : 0)
          return {
            id: crypto.randomUUID(),
            user_id: user.id,
            items: cart,
            total,
            status: "Pending",
            created_at: new Date().toISOString(),
          }
        })()

      if (serverOrder) setOrders((prev) => [order, ...prev])
      else setLocalOrders((prev) => [order, ...prev])

      showToast(`Order placed — $${order.total.toFixed(2)}`, "success", [
        { label: "View Detail", onClick: () => router.push("/profile?tab=orders") },
      ], {
        title: "Order placed!",
        price: `$${order.total.toFixed(2)}`,
        icon: "bag",
        accent: "emerald",
      })
      pushNotification({
        type: "order",
        title: "Order placed",
        message: `Your order for $${order.total.toFixed(2)} is pending confirmation.`,
      })
      return { order }
    },
    [user, showToast, pushNotification, router]
  )

  /** Applies a status change to whichever list holds the order. */
  const applyStatus = useCallback((orderId: string, status: string) => {
    const patch = (list: Order[]) =>
      list.map((o) => (o.id === orderId ? { ...o, status } : o))
    setOrders(patch)
    setLocalOrders(patch)
  }, [])

  const updateOrderStatus = useCallback(
    async (orderId: string, status: string) => {
      // Session-only orders were never persisted, so skip the round trip.
      const isLocalOnly = localOrders.some((o) => o.id === orderId)
      if (isLocalOnly) {
        applyStatus(orderId, status)
        showToast("Order status updated.", "success")
        return
      }

      const res = await updateOrderStatusAction(orderId, status)
      if (res.ok) {
        applyStatus(orderId, status)
        showToast("Order status updated.", "success")
      } else {
        showToast("Could not update the order status.", "error")
      }
    },
    [localOrders, applyStatus, showToast]
  )

  const cancelOrder = useCallback(
    async (orderId: string) => {
      const isLocalOnly = localOrders.some((o) => o.id === orderId)
      if (isLocalOnly) {
        applyStatus(orderId, "Cancelled")
        showToast("Order cancelled.", "info")
        return
      }

      const res = await cancelOrderAction(orderId)
      if (res.ok) {
        applyStatus(orderId, "Cancelled")
        showToast("Order cancelled.", "info")
      } else {
        showToast("Could not cancel the order.", "error")
      }
    },
    [localOrders, applyStatus, showToast]
  )

  const value = useMemo(
    () => ({
      orders: mergedOrders,
      ordersLoading,
      placeOrder,
      updateOrderStatus,
      cancelOrder,
    }),
    [mergedOrders, ordersLoading, placeOrder, updateOrderStatus, cancelOrder]
  )

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
}

export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (ctx === undefined) throw new Error("useOrders must be used within OrdersProvider")
  return ctx
}
