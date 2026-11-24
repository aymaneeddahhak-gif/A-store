"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { DashboardSkeleton } from "@/components/loading-skeletons"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { useAuth } from "@/contexts/providers/auth-context"
import { useToast } from "@/contexts/toast-context"
import { useThemeContext } from "@/contexts/providers/theme-context"
import {
  fetchAllOrdersAction,
  updateOrderStatusAction,
  updateOrderShipmentAction,
} from "@/lib/actions/orders"
import {
  listSellerProductsAction,
  resetDemoSellerProductsAction,
  toggleFeaturedAction,
} from "@/lib/actions/products"
import { isAdminEmail } from "@/lib/admin"
import { isSellerEmail } from "@/lib/seller"
import {
  isDemoSellerUser,
  getDemoSellerProducts,
  saveDemoSellerProducts,
  INITIAL_DEMO_SELLER_PRODUCTS,
} from "@/lib/demo-seller-products"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
import type { Order, Product } from "@/lib/types"
import { SellerRestrictedGate } from "@/components/seller/restricted-gate"
import { useSellerNav } from "@/contexts/providers/seller-nav-context"
import { useNotifications } from "@/contexts/providers/notifications-context"
import { STATUS_CONFIGS, type OrderStatus } from "@/components/orders/order-notification-card"
import { Header } from "./new-design/Header"
import {
  CustomersView,
  SettingsView,
  NewsletterView,
  type ShowcaseProduct,
} from "./new-design/LiveViews"

const OverviewView = dynamic(
  () => import("./new-design/OverviewView").then((m) => m.OverviewView),
  { ssr: false }
)
const ProductsListView = dynamic(
  () => import("./new-design/ProductsListView").then((m) => m.ProductsListView),
  { ssr: false }
)
const AddProductView = dynamic(
  () => import("./new-design/AddProductView").then((m) => m.AddProductView),
  { ssr: false }
)
const OffersDiscountView = dynamic(
  () => import("./new-design/OffersDiscountView").then((m) => m.OffersDiscountView),
  { ssr: false }
)
const OrdersView = dynamic(
  () => import("./new-design/OrdersView").then((m) => m.OrdersView),
  { ssr: false }
)

function shortOrderId(id: string) {
  const parts = id.split("_")
  const raw = parts.length > 1 ? parts[parts.length - 1] : id
  return raw.slice(0, 8).toUpperCase()
}
import {
  listSubscribersAction,
  getStoreSettingsAction,
  saveStoreSettingsAction,
  listCustomerProfilesAction,
  type Subscriber,
  type StoreSettings,
  type CustomerProfile,
} from "@/lib/actions/seller-dashboard"
import {
  toProductItem,
  toProductPayload,
  buildOverviewProps,
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
  const {
    addProduct,
    updateProduct,
    deleteProduct,
    categories,
    createCategory,
    patchProductLocal,
    refreshProducts,
  } = useCatalog()
  const { user, authLoading } = useAuth()
  const { showToast } = useToast()
  const { isDarkMode } = useThemeContext()
  const isAdmin = isAdminEmail(user?.email)
  // Seller dashboard & fulfilment are restricted strictly to Seller + Admin accounts.
  const canManageOrders = isSellerEmail(user?.email)
  const isDemoSeller = !isAdmin && isDemoSellerUser(user?.email)
  const isOfflineDemoSandbox = isDemoSeller && !UUID_RE.test(user?.id ?? "")
  const [isResettingDemo, setIsResettingDemo] = useState(false)

  // Tab lives in shared context: the rail flyout and this page drive it.
  const { sellerTab: activeTab, setSellerTab: setActiveTab } = useSellerNav()
  const { pushNotification } = useNotifications()
  const [monthKey, setMonthKey] = useState<string | null>(null)
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [sellerProducts, setSellerProducts] = useState<Product[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    store_name: "A-store",
    currency: "USD",
    notification_email: "",
  })
  const [customerProfiles, setCustomerProfiles] = useState<CustomerProfile[] | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToastMsg = useCallback((msg: string) => {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(null), 3000)
  }, [])

  useEffect(() => {
    if (!user || !canManageOrders) {
      setAllOrders([])
      setSellerProducts([])
      return
    }
    let active = true
    void fetchAllOrdersAction().then((res) => {
      if (active && res.ok) setAllOrders(res.data)
    })
    if (isOfflineDemoSandbox) {
      setSellerProducts(getDemoSellerProducts())
    } else {
      void listSellerProductsAction().then((res) => {
        if (active && res.ok) setSellerProducts(res.data)
        else if (active) setSellerProducts([])
      })
    }
    void listSubscribersAction().then((res) => {
      if (active && res.ok) setSubscribers(res.data)
    })
    void getStoreSettingsAction().then((res) => {
      if (active && res.ok) setStoreSettings(res.data)
    })
    if (isAdminEmail(user?.email)) {
      void listCustomerProfilesAction().then((res) => {
        if (active && res.ok) setCustomerProfiles(res.data)
      })
    }
    return () => {
      active = false
    }
  }, [user, canManageOrders, isOfflineDemoSandbox])

  // Pin/unpin a store product from the homepage showcase (admin only, DB-backed).
  const handleToggleFeatured = useCallback(
    async (productId: string, featured: boolean) => {
      if (isOfflineDemoSandbox) {
        const id = Number(productId)
        setSellerProducts((prev) => {
          const updated = (prev ?? []).map((p) => (p.id === id ? { ...p, featured } : p))
          saveDemoSellerProducts(updated)
          return updated
        })
        showToastMsg(
          featured
            ? "Pinned to the showcase (demo seller)."
            : "Removed from the showcase (demo seller)."
        )
        return
      }
      const id = Number(productId)
      const res = await toggleFeaturedAction(id, featured)
      if (!res.ok) {
        showToastMsg(res.error || "Could not update the homepage showcase.")
        return
      }
      // Optimistic patch for the list in front of the admin, then re-read the
      // catalog so the showcase card (and any tab still holding a stale seed)
      // converges on what the database now says.
      setSellerProducts((prev) =>
        prev ? prev.map((p) => (p.id === id ? { ...p, featured } : p)) : prev
      )
      patchProductLocal(id, { featured })
      void refreshProducts()
      showToastMsg(
        featured
          ? "Pinned to the homepage showcase."
          : "Removed from the homepage showcase."
      )
    },
    [patchProductLocal, refreshProducts, showToastMsg, isOfflineDemoSandbox]
  )

  const handleStatusChange = useCallback(
    async (
      orderId: string,
      status: string,
      shipment?: { carrier?: string; trackingNumber?: string }
    ) => {
      const res = await updateOrderStatusAction(orderId, status, shipment)
      if (res.ok) {
        setAllOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status,
                  status_updated_at: new Date().toISOString(),
                  carrier: shipment?.carrier ?? o.carrier,
                  tracking_number: shipment?.trackingNumber ?? o.tracking_number,
                }
              : o
          )
        )
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

  const handleShipmentSave = useCallback(
    async (orderId: string, carrier: string, trackingNumber: string) => {
      const res = await updateOrderShipmentAction(orderId, carrier, trackingNumber)
      if (res.ok) {
        setAllOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, carrier, tracking_number: trackingNumber } : o))
        )
        showToast("Shipment details saved.", "success")
      } else {
        showToast(res.error || "Could not save the shipment details.", "error")
      }
    },
    [showToast]
  )

  const items: ProductItem[] = useMemo(
    () => (sellerProducts ?? []).map(toProductItem),
    [sellerProducts]
  )

  // Store products the admin can pin to the homepage showcase. Built from the
  // seller's own rows (read straight from the database on every load, and
  // patched the moment a pin lands) rather than the storefront catalog seed,
  // which is a streamed snapshot. Sandbox rows owned by a tester are excluded —
  // featuring is a store-level flag.
  const showcaseItems: ShowcaseProduct[] = useMemo(
    () =>
      (sellerProducts ?? [])
        .filter((p) => p.user_id == null)
        .map((p) => ({
          id: String(p.id),
          name: p.name,
          category: p.category,
          image: p.image,
          featured: !!p.featured,
        }))
        .sort((a, b) => Number(b.featured) - Number(a.featured)),
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
  // Real buyer identities (admin only) keyed by user id for the order console.
  const buyerDirectory = useMemo(() => {
    const map: Record<string, { name: string; email: string }> = {}
    for (const profile of customerProfiles ?? []) {
      map[profile.id] = { name: profile.name, email: profile.email }
    }
    return map
  }, [customerProfiles])

  const customerRows = useMemo(() => {
    const rows = buildCustomerRows(visibleOrders)
    if (!customerProfiles?.length) return rows
    const profiles = new Map(customerProfiles.map((p) => [p.id, p]))
    return rows.map((row) => {
      const match = profiles.get(row.userId)
      if (!match) return row
      return { ...row, name: match.name, email: `${match.email} · ${row.email}` }
    })
  }, [visibleOrders, customerProfiles])

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
      if (isOfflineDemoSandbox) {
        const id = Number(productId)
        setSellerProducts((prev) => {
          const updated = (prev ?? []).filter((p) => p.id !== id)
          saveDemoSellerProducts(updated)
          return updated
        })
        showToastMsg("Product deleted from demo seller inventory.")
        return
      }
      const ok = await deleteProduct(Number(productId))
      if (ok) setSellerProducts((prev) => (prev ?? []).filter((p) => p.id !== Number(productId)))
    },
    [deleteProduct, isOfflineDemoSandbox, showToastMsg]
  )

  const handleResetDemo = useCallback(async () => {
    if (!isDemoSeller || isResettingDemo) return
    setIsResettingDemo(true)
    try {
      if (isOfflineDemoSandbox) {
        const fresh = INITIAL_DEMO_SELLER_PRODUCTS.map((p) => ({ ...p }))
        saveDemoSellerProducts(fresh)
        setSellerProducts(fresh)
        showToastMsg("Demo products reset to the 3 starter examples.")
        return
      }
      const res = await resetDemoSellerProductsAction()
      if (res.ok) {
        setSellerProducts(res.data)
        showToastMsg("Demo products reset to the 3 starter examples.")
      } else {
        showToastMsg(res.error || "Could not reset demo products.")
      }
    } finally {
      setIsResettingDemo(false)
    }
  }, [isDemoSeller, isOfflineDemoSandbox, isResettingDemo, showToastMsg])

  const handleUpdateStock = useCallback(
    async (productId: string, newStock: string) => {
      const stock = Math.max(0, Math.floor(Number(newStock) || 0))
      if (isOfflineDemoSandbox) {
        const id = Number(productId)
        setSellerProducts((prev) => {
          const updated = (prev ?? []).map((p) => (p.id === id ? { ...p, stock } : p))
          saveDemoSellerProducts(updated)
          return updated
        })
        showToastMsg("Stock updated in demo seller inventory.")
        return
      }
      const ok = await updateProduct(Number(productId), { stock })
      if (ok) {
        setSellerProducts((prev) =>
          (prev ?? []).map((p) => (p.id === Number(productId) ? { ...p, stock } : p))
        )
      }
    },
    [updateProduct, isOfflineDemoSandbox, showToastMsg]
  )

  const handleSaved = useCallback(
    async (payload: ReturnType<typeof toProductPayload>, editingId: string | null) => {
      if (isOfflineDemoSandbox) {
        if (editingId) {
          const id = Number(editingId)
          setSellerProducts((prev) => {
            const updated = (prev ?? []).map((p) => (p.id === id ? { ...p, ...payload } : p))
            saveDemoSellerProducts(updated)
            return updated
          })
          setEditingProductId(null)
          setIsCreatingProduct(false)
          showToastMsg(`Product "${payload.name}" updated successfully.`)
          return true
        }
        const createdProduct: Product = {
          id: Date.now(),
          name: payload.name,
          price: payload.price,
          original_price: payload.original_price,
          category: payload.category,
          image: payload.image || "/images/product/RMADRIDKIT.png",
          images: payload.images?.length ? payload.images : [payload.image || "/images/product/RMADRIDKIT.png"],
          video: payload.video,
          description: payload.description,
          stock: payload.stock,
          is_published: payload.is_published ?? false,
          featured: false,
          user_id: user?.id || "demo-seller-role-id",
          likes: 0,
          rating: 5,
          reviews: [],
        }
        setSellerProducts((prev) => {
          const updated = [...(prev ?? []), createdProduct]
          saveDemoSellerProducts(updated)
          return updated
        })
        setIsCreatingProduct(false)
        showToastMsg(`Product "${createdProduct.name}" added successfully.`)
        return true
      }
      if (editingId) {
        const ok = await updateProduct(Number(editingId), payload)
        if (ok) {
          setSellerProducts((prev) =>
            (prev ?? []).map((p) => (p.id === Number(editingId) ? { ...p, ...payload } : p))
          )
          setEditingProductId(null)
          setIsCreatingProduct(false)
          showToastMsg(`Product "${payload.name}" updated successfully.`)
          return true
        }
        showToastMsg("Could not update the product — please try again.")
        return false
      }
      const created = await addProduct(payload)
      if (created) {
        if (isAdmin || created.user_id === user?.id) {
          setSellerProducts((prev) => [...(prev ?? []), created])
        }
        setIsCreatingProduct(false)
        showToastMsg(`Product "${created.name}" added successfully.`)
        return true
      }
      showToastMsg("Could not save the product — please try again.")
      return false
    },
    [addProduct, updateProduct, isAdmin, isOfflineDemoSandbox, user?.id, showToastMsg]
  )

  const closeForm = useCallback(() => {
    setIsCreatingProduct(false)
    setEditingProductId(null)
  }, [])

  // Show the full-width Seller Dashboard screenshot showcase with Sign-In CTA
  // right on /seller for logged-out visitors AND normal non-seller customers.
  if (!authLoading && (!user || !canManageOrders)) {
    return <SellerRestrictedGate isSignedInNonSeller={Boolean(user && !canManageOrders)} />
  }
  if (!user) return <DashboardSkeleton />

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

      case "Orders":
        return (
          <OrdersView
            isDarkMode={isDarkMode}
            orders={visibleOrders}
            buyers={buyerDirectory}
            canManage={canManageOrders}
            onStatusChange={(id, status, shipment) => void handleStatusChange(id, status, shipment)}
            onShipmentSave={(id, carrier, trackingNumber) =>
              void handleShipmentSave(id, carrier, trackingNumber)
            }
            onShowToast={showToastMsg}
          />
        )

      case "Offers":
        return (
          <OffersDiscountView
            isDarkMode={isDarkMode}
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

      case "Newsletter":
        return (
          <NewsletterView
            isDarkMode={isDarkMode}
            subscribers={subscribers}
            onShowToast={showToastMsg}
          />
        )

      case "Settings":
        return (
          <SettingsView
            isDarkMode={isDarkMode}
            storeName={storeSettings.store_name}
            currency={storeSettings.currency}
            notificationEmail={storeSettings.notification_email || user.email || ""}
            canSave={isAdmin}
            showcase={showcaseItems}
            canManageShowcase={isAdmin}
            onToggleShowcase={(id, featured) => void handleToggleFeatured(id, featured)}
            onSave={(s) => {
              void saveStoreSettingsAction(s).then((res) => {
                if (res.ok) {
                  setStoreSettings((prev) => ({ ...prev, ...s }))
                  showToastMsg("Store settings saved successfully.")
                } else {
                  showToastMsg(res.error)
                }
              })
            }}
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
              onToggleFeatured={(id, featured) => void handleToggleFeatured(id, featured)}
              canFeature={isAdmin}
              onResetDemo={isDemoSeller ? () => void handleResetDemo() : undefined}
              isResettingDemo={isResettingDemo}
              onShowToast={showToastMsg}
            />
          )
        }

        return (
          <AddProductView
            isDarkMode={isDarkMode}
            initial={editingItem}
            categories={categories.filter((c) => c.id !== "all")}
            onAddCategory={createCategory}
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
            {["Dashboard", "Products", "Orders", "Offers", "Customer", "Newsletter", "Settings"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setActiveTab(t)
                  closeForm()
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer border transition-colors ${
                  activeTab === t && !showForm
                    ? "bg-[#98e4af] text-gray-950 border-[#98e4af] font-bold"
                    : isDarkMode
                    ? "bg-[#1e2022] text-gray-300 border-gray-800 hover:bg-[#272a2e]"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
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
          className="fixed bottom-6 right-6 z-50 bg-[#1e2022] text-white px-5 py-3 rounded-2xl shadow-xl border border-gray-700/60 text-sm font-medium"
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
