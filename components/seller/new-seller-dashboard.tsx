"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DashboardSkeleton } from "@/components/loading-skeletons"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { useAuth } from "@/contexts/providers/auth-context"
import { useToast } from "@/contexts/toast-context"
import { useThemeContext } from "@/contexts/providers/theme-context"
import { fetchAllOrdersAction, updateOrderStatusAction } from "@/lib/actions/orders"
import { listSellerProductsAction } from "@/lib/actions/products"
import { isAdminEmail } from "@/lib/admin"
import type { Order, Product } from "@/lib/types"
import { SellerRestrictedGate } from "@/components/seller/restricted-gate"
import { OrderManager, shortOrderId } from "@/components/seller/order-manager"
import { useSellerNav } from "@/contexts/providers/seller-nav-context"
import { useNotifications } from "@/contexts/providers/notifications-context"
import { STATUS_CONFIGS, type OrderStatus } from "@/components/orders/order-notification-card"
import { Header } from "./new-design/Header"
import { OverviewView } from "./new-design/OverviewView"
import { ProductsListView } from "./new-design/ProductsListView"
import { AddProductView } from "./new-design/AddProductView"
import { OffersDiscountView } from "./new-design/OffersDiscountView"
import { AnalyticsView, CustomersView, SettingsView } from "./new-design/LiveViews"
import {
  toProductItem,
  toProductPayload,
  buildOverviewProps,
  buildAnalyticsProps,
  buildCustomerRows,
  lastMonths,
} from "./new-design/mapping"
import type { ProductItem } from "./new-design/types"

/**
 * Seller dashboard — the newsellerdahbord design, rendered on the website's
 * own page background (no decorative backdrop). Overview/products/add-form
 * are the design's exact components fed with live Supabase rows; orders use
 * the website's order design; offers use the live discount popup system.
 */
export function NewSellerDashboard() {
  const { addProduct, updateProduct, deleteProduct, categories } = useCatalog()
  const { user, authLoading } = useAuth()
  const { showToast } = useToast()
  const { isDarkMode } = useThemeContext()
  const isAdmin = isAdminEmail(user?.email)

  // Tab lives in shared context: the rail flyout and this page drive it.
  const { sellerTab: activeTab, setSellerTab: setActiveTab } = useSellerNav()
  const { pushNotification } = useNotifications()
  const [orderSearch, setOrderSearch] = useState("")
  const [monthKey, setMonthKey] = useState<string | null>(null)
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [sellerProducts, setSellerProducts] = useState<Product[] | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToastMsg = useCallback((msg: string) => {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(null), 3000)
  }, [])

  useEffect(() => {
    if (!user) {
      setAllOrders([])
      setSellerProducts([])
      return
    }
    let active = true
    void fetchAllOrdersAction().then((res) => {
      if (active && res.ok) setAllOrders(res.data)
    })
    void listSellerProductsAction().then((res) => {
      if (active && res.ok) setSellerProducts(res.data)
      else if (active) setSellerProducts([])
    })
    return () => {
      active = false
    }
  }, [user])

  const handleStatusChange = useCallback(
    async (orderId: string, status: string) => {
      const res = await updateOrderStatusAction(orderId, status)
      if (res.ok) {
        setAllOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
        const cfg = STATUS_CONFIGS[status as OrderStatus]
        pushNotification({
          type: "order",
          title: cfg?.messageText ?? `Order ${status}`,
          message: cfg
            ? `${shortOrderId(orderId)} — ${cfg.subText}`
            : `Order ${shortOrderId(orderId)} is now ${status}.`,
        })
        showToast("Order status updated.", "success")
      } else {
        showToast(res.error || "Could not update the order status.", "error")
      }
    },
    [showToast, pushNotification]
  )

  const items: ProductItem[] = useMemo(
    () => (sellerProducts ?? []).map(toProductItem),
    [sellerProducts]
  )
  const editingItem = items.find((p) => p.id === editingProductId) ?? null
  const monthOpts = useMemo(() => lastMonths(allOrders), [allOrders])
  const visibleOrders = useMemo(
    () =>
      monthKey
        ? allOrders.filter((o) => String(o.created_at).slice(0, 7) === monthKey)
        : allOrders,
    [allOrders, monthKey]
  )
  const monthLabel =
    monthKey ? monthOpts.find((m) => m.key === monthKey)?.label ?? "All time" : "All time"
  const overview = useMemo(
    () => buildOverviewProps(visibleOrders, sellerProducts ?? []),
    [visibleOrders, sellerProducts]
  )
  const analytics = useMemo(
    () => buildAnalyticsProps(visibleOrders, sellerProducts ?? []),
    [visibleOrders, sellerProducts]
  )
  const customerRows = useMemo(() => buildCustomerRows(visibleOrders), [visibleOrders])

  const handleOpenAddProduct = useCallback(() => {
    setEditingProductId(null)
    setIsCreatingProduct(true)
  }, [])

  const handleEditProduct = useCallback((prod: ProductItem) => {
    setEditingProductId(prod.id)
    setIsCreatingProduct(true)
  }, [])

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      const ok = await deleteProduct(Number(productId))
      if (ok) setSellerProducts((prev) => (prev ?? []).filter((p) => p.id !== Number(productId)))
    },
    [deleteProduct]
  )

  const handleUpdateStock = useCallback(
    async (productId: string, newStock: string) => {
      const stock = Math.max(0, Math.floor(Number(newStock) || 0))
      const ok = await updateProduct(Number(productId), { stock })
      if (ok) {
        setSellerProducts((prev) =>
          (prev ?? []).map((p) => (p.id === Number(productId) ? { ...p, stock } : p))
        )
      }
    },
    [updateProduct]
  )

  const handleSaved = useCallback(
    async (payload: ReturnType<typeof toProductPayload>, editingId: string | null) => {
      if (editingId) {
        const ok = await updateProduct(Number(editingId), payload)
        if (ok) {
          setSellerProducts((prev) =>
            (prev ?? []).map((p) => (p.id === Number(editingId) ? { ...p, ...payload } : p))
          )
          setEditingProductId(null)
          setIsCreatingProduct(false)
          return true
        }
        return false
      }
      const created = await addProduct(payload)
      if (created) {
        if (isAdmin || created.user_id === user?.id) {
          setSellerProducts((prev) => [...(prev ?? []), created])
        }
        setIsCreatingProduct(false)
        return true
      }
      return false
    },
    [addProduct, updateProduct, isAdmin, user?.id]
  )

  const closeForm = useCallback(() => {
    setIsCreatingProduct(false)
    setEditingProductId(null)
  }, [])

  if (authLoading || (user && sellerProducts === null)) return <DashboardSkeleton />
  if (!user) return <SellerRestrictedGate />

  const showForm = isCreatingProduct

  const getPageTitle = () => {
    switch (activeTab) {
      case "Dashboard":
      case "Overview":
        return "Overview"
      case "Products":
      case "Product":
        return isCreatingProduct ? (editingProductId ? "Edit Product" : "Add Product") : "Products"
      case "Offers":
        return "Offers"
      case "Orders":
        return "Orders"
      case "Sales":
        return "Sales"
      case "Customer":
        return "Customers"
      case "Newsletter":
        return "Newsletter"
      case "Settings":
        return "Settings"
      default:
        return activeTab
    }
  }

  const renderViewContent = () => {
    switch (activeTab) {
      case "Dashboard":
      case "Overview":
        return (
          <OverviewView
            isDarkMode={isDarkMode}
            kpis={overview.kpis}
            weeklyData={overview.weeklyData}
            monthlyData={overview.monthlyData}
            topProducts={overview.topProducts}
            recentOrders={overview.recentOrders}
            categoryShare={overview.categoryShare}
            categoryTotal={overview.categoryTotal}
            avgRevenueLabel={overview.avgRevenueLabel}
            growthLabel={overview.growthLabel}
            onNavigateToAddProduct={() => {
              setActiveTab("Products")
              handleOpenAddProduct()
            }}
            onExportReport={() => showToastMsg("Sales overview report exported successfully")}
          />
        )

      case "Analytics":
      case "Sales":
      case "Newsletter":
        return (
          <AnalyticsView
            isDarkMode={isDarkMode}
            metrics={analytics.metrics}
            channels={analytics.channels}
            onShowToast={showToastMsg}
          />
        )

      case "Orders":
        return (
          <OrderManager
            orders={allOrders.filter((o) =>
              o.id.toLowerCase().includes(orderSearch.toLowerCase())
            )}
            searchQuery={orderSearch}
            onSearchChange={setOrderSearch}
            onStatusChange={(id, s) => void handleStatusChange(id, s)}
            readOnly={!isAdmin}
          />
        )

      case "Offers":
        return (
          <OffersDiscountView
            orders={allOrders}
            products={sellerProducts ?? []}
            isAdmin={isAdmin}
          />
        )

      case "Customer":
        return (
          <CustomersView
            isDarkMode={isDarkMode}
            customers={customerRows}
            tiers={["All Customers", "Platinum VIP", "Gold Member", "Silver Member", "Standard"]}
            onShowToast={showToastMsg}
          />
        )

      case "Settings":
        return (
          <SettingsView
            isDarkMode={isDarkMode}
            notificationEmail={user.email ?? ""}
            onShowToast={showToastMsg}
          />
        )

      case "Products":
      case "Product":
      default:
        if (!isCreatingProduct) {
          return (
            <ProductsListView
              isDarkMode={isDarkMode}
              products={items}
              initialView={activeTab === "Inventory" ? "inventory" : "catalog"}
              onOpenAddProduct={handleOpenAddProduct}
              onEditProduct={handleEditProduct}
              onDeleteProduct={(id) => void handleDeleteProduct(id)}
              onUpdateStock={(id, stock) => void handleUpdateStock(id, stock)}
              onShowToast={showToastMsg}
            />
          )
        }

        return (
          <AddProductView
            initial={editingItem}
            categories={categories.filter((c) => c.id !== "all").map((c) => c.id)}
            onBack={closeForm}
            onSaved={handleSaved}
            onToast={showToastMsg}
          />
        )
    }
  }

  return (
    <div className="w-full">
      <div className="w-full">
        <main className="flex-1 flex flex-col min-w-0">
          <Header
            title={getPageTitle()}
            isDarkMode={isDarkMode}
            selectedMonth={monthLabel}
            months={monthOpts}
            onMonthChange={setMonthKey}
          />

          <div className="md:hidden flex gap-1.5 mb-4 overflow-x-auto">
            {["Dashboard", "Analytics", "Products", "Orders", "Offers", "Sales", "Customer", "Newsletter", "Settings"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setActiveTab(t)
                  closeForm()
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  activeTab === t && !showForm
                    ? "bg-[#98e4af] text-gray-950 font-bold"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="pb-8">{renderViewContent()}</div>
        </main>
      </div>

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#1e2022] text-white px-5 py-3 rounded-2xl shadow-xl border border-gray-700/60 text-sm font-medium flex items-center gap-2.5"
        >
          <div className="w-2 h-2 rounded-full bg-[#98e4af] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
