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
import { SellerNavProvider } from "@/contexts/providers/seller-nav-context"

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
 *   Catalog         (Toast)
 *   Likes           (Catalog — syncs server like counts into catalog state)
 *   Orders          (Toast, Auth, Notifications)
 *
 * Splitting these lets each slice update independently — typing in the
 * search box no longer re-renders the cart drawer or auth tree.
 */

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationsProvider>
            <CartProvider>
              <QuickViewProvider>
                <CatalogProvider>
                  <LikesProvider>
                    <OrdersProvider>
                      <SellerNavProvider>{children}</SellerNavProvider>
                    </OrdersProvider>
                  </LikesProvider>
                </CatalogProvider>
              </QuickViewProvider>
            </CartProvider>
          </NotificationsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  )
}
