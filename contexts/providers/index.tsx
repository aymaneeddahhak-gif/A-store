"use client"

import React, { type ReactNode } from "react"
import { ToastProvider } from "@/contexts/toast-context"
import { ThemeProvider } from "@/contexts/providers/theme-context"
import { AuthProvider } from "@/contexts/providers/auth-context"
import { NotificationsProvider } from "@/contexts/providers/notifications-context"
import { CartProvider } from "@/contexts/providers/cart-context"
import { QuickViewProvider } from "@/contexts/providers/quick-view-context"
import { LikesProvider } from "@/contexts/providers/likes-context"
import { CatalogProvider } from "@/contexts/providers/catalog-context"
import { OrdersProvider } from "@/contexts/providers/orders-context"
import type { Product } from "@/lib/types"

/**
 * Providers — single composition root. Order matters (inner providers
 * may depend on outer ones):
 *
 *   Toast           (no deps)
 *   Theme           (no deps)
 *   Auth            (Toast)
 *   Notifications   (no deps)
 *   Cart            (Toast)
 *   QuickView       (no deps)
 *   Likes           (server actions)
 *   Catalog         (Toast, Likes)
 *   Orders          (Toast, Auth, Notifications)
 *
 * Splitting these lets each slice update independently — typing in the
 * search box no longer re-renders the cart drawer or auth tree.
 */

export function Providers({
  children,
  initialProducts,
}: {
  children: ReactNode
  initialProducts?: Product[]
}) {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationsProvider>
            <CartProvider>
              <QuickViewProvider>
                <LikesProvider>
                  <CatalogProvider initialProducts={initialProducts ?? []}>
                    <OrdersProvider>{children}</OrdersProvider>
                  </CatalogProvider>
                </LikesProvider>
              </QuickViewProvider>
            </CartProvider>
          </NotificationsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  )
}
