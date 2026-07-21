"use client"

/**
 * Backwards-compatible facade.
 *
 * The old `ShopContext` (530 lines) has been decomposed into focused
 * providers in `contexts/providers/`. To avoid a single massive rewrite,
 * this file re-exports the new `useShop` hook that aggregates them —
 * preserving the exact same shape the rest of the app already uses.
 *
 * Migration path: components should gradually switch from `useShop()`
 * to the specific focused hooks (useCart, useAuth, useCatalog, …) so
 * they only subscribe to the slices they actually need.
 */

export { Providers as ShopProvider } from "@/contexts/providers"
export type { Product, Review, Order, Notification } from "@/lib/types"

import { useAuth } from "@/contexts/providers/auth-context"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { useCart } from "@/contexts/providers/cart-context"
import { useQuickView } from "@/contexts/providers/quick-view-context"
import { useLikes } from "@/contexts/providers/likes-context"
import { useOrders } from "@/contexts/providers/orders-context"
import { useThemeContext } from "@/contexts/providers/theme-context"
import { useNotifications } from "@/contexts/providers/notifications-context"
import { useCallback, useMemo } from "react"

type ReviewInput = { user: string; rating: number; comment: string; avatar?: string }

/**
 * Aggregate hook — returns the same surface as the legacy ShopContext.
 * Prefer the focused hooks for new code.
 */
export function useShop() {
  const auth = useAuth()
  const catalog = useCatalog()
  const cart = useCart()
  const quickView = useQuickView()
  const likes = useLikes()
  const orders = useOrders()
  const theme = useThemeContext()
  const notifications = useNotifications()

  // Bridge: old API expected toggleLike(productId). New API takes a product.
  const toggleLike = useCallback(
    (productId: number) => {
      const product = catalog.products.find((p) => p.id === productId)
      if (product) likes.toggleLike(product)
    },
    [catalog.products, likes]
  )

  // Bridge: old API expected addToCart took a product and opened the cart.
  const addToCart = cart.addToCart

  // Bridge: old placeOrder read cart + user from inside the context.
  const placeOrder = useCallback(
    (shippingFee?: number) => orders.placeOrder(cart.cart, shippingFee),
    [orders, cart.cart]
  )

  return useMemo(
    () => ({
      // auth
      user: auth.user,
      authLoading: auth.authLoading,
      signOut: auth.signOut,
      signInDemo: auth.signInDemo,

      // catalog
      products: catalog.products,
      addProduct: catalog.addProduct,
      updateProduct: catalog.updateProduct,
      deleteProduct: catalog.deleteProduct,
      addReview: (productId: number, review: ReviewInput) =>
        catalog.addReview(productId, review),
      selectedCategory: catalog.selectedCategory,
      setCategory: catalog.setCategory,
      searchQuery: catalog.searchQuery,
      setSearchQuery: catalog.setSearchQuery,

      // cart
      cart: cart.cart,
      isCartOpen: cart.isCartOpen,
      addToCart,
      removeFromCart: cart.removeFromCart,
      toggleCart: cart.toggleCart,
      clearCart: cart.clearCart,

      // quick view
      quickViewProduct: quickView.quickViewProduct,
      openQuickView: quickView.openQuickView,
      closeQuickView: quickView.closeQuickView,

      // likes
      likedProducts: likes.likedProducts,
      toggleLike,

      // orders
      orders: orders.orders,
      placeOrder,
      updateOrderStatus: orders.updateOrderStatus,
      cancelOrder: orders.cancelOrder,

      // theme
      isDarkMode: theme.isDarkMode,
      toggleTheme: theme.toggleTheme,

      // notifications
      notifications: notifications.notifications,
      isNotificationOpen: notifications.isNotificationOpen,
      unreadCount: notifications.unreadCount,
      toggleNotifications: notifications.toggleNotifications,
      markAsRead: notifications.markAsRead,
      markAllAsRead: notifications.markAllAsRead,
      removeNotification: notifications.removeNotification,
      clearAllNotifications: notifications.clearAllNotifications,
    }),
    [
      auth,
      catalog,
      cart,
      quickView,
      likes,
      orders,
      theme,
      notifications,
      toggleLike,
      addToCart,
      placeOrder,
    ]
  )
}
