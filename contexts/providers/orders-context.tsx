"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Order, Product } from "@/lib/types"
import { useToast } from "@/contexts/toast-context"
import { useAuth } from "@/contexts/providers/auth-context"
import { useNotifications } from "@/contexts/providers/notifications-context"
import {
  cancelOrderAction,
  placeOrderAction,
  updateOrderStatusAction,
} from "@/lib/actions/orders"

/**
 * Orders — depends on Auth (per-user orders) and pushes a notification
 * when a new order is placed. Falls back to local-only orders if the DB
 * insert fails (keeps the demo functional offline).
 */

type OrdersContextValue = {
  orders: Order[]
  ordersLoading: boolean
  placeOrder: (cart: Product[], shippingFee?: number) => Promise<Order | null>
  updateOrderStatus: (orderId: string, status: string) => Promise<void>
  cancelOrder: (orderId: string) => Promise<void>
}

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined)

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const { user } = useAuth()
  const { pushNotification } = useNotifications()

  const [orders, setOrders] = useState<Order[]>([])
  const [localOrders, setLocalOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // In a fully server-driven model orders are fetched via a query, but for the
  // client demo we keep a lightweight local copy seeded from the server action
  // result + offline fallback. Server-side reads live in lib/queries/orders.ts.
  useEffect(() => {
    if (!user) {
      setOrders([])
      return
    }
    // Hook reserved for future client-side polling/realtime subscription.
  }, [user])

  const mergedOrders = useMemo(() => {
    const dbIds = new Set(orders.map((o) => o.id))
    return [...orders, ...localOrders.filter((o) => !dbIds.has(o.id))]
  }, [orders, localOrders])

  const placeOrder = useCallback(
    async (cart: Product[], shippingFee = 15): Promise<Order | null> => {
      if (!user || cart.length === 0) return null

      const res = await placeOrderAction({ userId: user.id, items: cart, shippingFee })

      // On success the action always returns a concrete Order; narrow it for TS.
      const serverOrder = res.ok && res.data ? res.data : null

      const order: Order = serverOrder
        ? serverOrder
        : // Offline / RLS-denied fallback: keep the order locally so the demo flow works.
          (() => {
            const subtotal = cart.reduce((sum, item) => sum + item.price, 0)
            const total = subtotal + (subtotal > 0 ? shippingFee : 0)
            return {
              id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              user_id: user.id,
              items: cart,
              total,
              status: "Pending",
              created_at: new Date().toISOString(),
            } as Order
          })()

      if (serverOrder) {
        setOrders((prev) => [order, ...prev])
      } else {
        setLocalOrders((prev) => [order, ...prev])
      }

      showToast(`Order placed — $${order.total.toFixed(2)}`, "success")
      pushNotification({
        type: "order",
        title: "Order placed",
        message: `Your order for $${order.total.toFixed(2)} is pending confirmation.`,
      })
      return order
    },
    [user, showToast, pushNotification]
  )

  const updateOrderStatus = useCallback(
    async (orderId: string, status: string) => {
      const res = await updateOrderStatusAction(orderId, status)
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
        showToast("Order status updated.", "success")
      } else {
        showToast("Could not update order status.", "error")
      }
    },
    [showToast]
  )

  const cancelOrder = useCallback(
    async (orderId: string) => {
      const res = await cancelOrderAction(orderId)
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "Cancelled" } : o)))
        showToast("Order cancelled.", "info")
      } else {
        showToast("Could not cancel order.", "error")
      }
    },
    [showToast]
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
