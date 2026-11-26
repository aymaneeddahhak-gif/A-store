"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
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
 * Orders — strictly backed by Supabase for the signed-in user (`user.id`).
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
  const [ordersLoading, setOrdersLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setOrders([])
      setOrdersLoading(false)
      return
    }

    let active = true
    const syncMyOrders = (showLoader: boolean) => {
      if (showLoader) setOrdersLoading(true)
      void fetchMyOrdersAction()
        .then((res) => {
          if (!active) return
          if (res.ok) setOrders(res.data)
          else if (showLoader) setOrders([])
        })
        .finally(() => {
          if (active && showLoader) setOrdersLoading(false)
        })
    }

    syncMyOrders(true)

    const onFocusOrVisible = () => {
      if (!document.hidden) syncMyOrders(false)
    }
    window.addEventListener("focus", onFocusOrVisible)
    document.addEventListener("visibilitychange", onFocusOrVisible)

    return () => {
      active = false
      window.removeEventListener("focus", onFocusOrVisible)
      document.removeEventListener("visibilitychange", onFocusOrVisible)
    }
  }, [user])

  const placeOrder = useCallback(
    async (
      cart: CartItem[],
      promoCode?: string,
      shipping?: ShippingAddress
    ): Promise<{ order: Order | null; field?: string }> => {
      if (!user || cart.length === 0) return { order: null }

      try {
        const res = await placeOrderAction({
          items: cart.map(({ id, quantity }) => ({ id, quantity })),
          promoCode,
          shipping,
        })
        if (!res.ok || !res.data) {
          if (!res.ok && !res.field) showToast(res.error || "Could not place the order.", "error")
          return { order: null, field: !res.ok ? res.field : undefined }
        }

        const order = res.data
        setOrders((prev) => [order, ...prev])

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
      } catch {
        showToast("Could not place the order — please try again.", "error")
        return { order: null }
      }
    },
    [user, showToast, pushNotification, router]
  )

  const applyStatus = useCallback((orderId: string, status: string) => {
    setOrders((list) => list.map((o) => (o.id === orderId ? { ...o, status } : o)))
  }, [])

  const updateOrderStatus = useCallback(
    async (orderId: string, status: string) => {
      const res = await updateOrderStatusAction(orderId, status)
      if (res.ok) {
        applyStatus(orderId, status)
        showToast("Order status updated.", "success")
      } else {
        showToast(res.error || "Could not update the order status.", "error")
      }
    },
    [applyStatus, showToast]
  )

  const cancelOrder = useCallback(
    async (orderId: string) => {
      const res = await cancelOrderAction(orderId)
      if (res.ok) {
        applyStatus(orderId, "Cancelled")
        showToast("Order cancelled.", "info")
      } else {
        showToast(res.error || "Could not cancel the order.", "error")
      }
    },
    [applyStatus, showToast]
  )

  const value = useMemo(
    () => ({
      orders,
      ordersLoading,
      placeOrder,
      updateOrderStatus,
      cancelOrder,
    }),
    [orders, ordersLoading, placeOrder, updateOrderStatus, cancelOrder]
  )

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
}

export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (ctx === undefined) throw new Error("useOrders must be used within OrdersProvider")
  return ctx
}
