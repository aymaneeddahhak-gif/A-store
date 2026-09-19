"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Download, Plus } from "lucide-react"
import { DashboardSkeleton } from "@/components/loading-skeletons"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { useAuth } from "@/contexts/providers/auth-context"
import { useToast } from "@/contexts/toast-context"
import {
  fetchAllOrdersAction,
  updateOrderStatusAction,
} from "@/lib/actions/orders"
import { listSellerProductsAction } from "@/lib/actions/products"
import { isAdminEmail } from "@/lib/admin"
import type { Order, Product } from "@/lib/types"
import { StatCards, buildSellerStats } from "@/components/seller/stat-cards"
import { ActivityFeed, buildActivities } from "@/components/seller/activity-feed"
import { OrderManager } from "@/components/seller/order-manager"
import { ProductTable } from "@/components/seller/product-table"
import { UserManager } from "@/components/seller/user-manager"
import { toggleFeaturedAction } from "@/lib/actions/products"
import { CategoryManager } from "@/components/seller/category-manager"
import { PromoManager } from "@/components/seller/promo-manager"
import { DealsPopupManager } from "@/components/seller/deals-popup-manager"
import { AuditLog } from "@/components/seller/audit-log"
import {
  ProductFormDialog,
  EMPTY_PRODUCT_FORM,
  type ProductFormData,
} from "@/components/seller/product-form-dialog"
import { SellerRestrictedGate } from "@/components/seller/restricted-gate"

export function SellerDashboardClient() {
  const { addProduct, updateProduct, deleteProduct, categories, patchProductLocal } = useCatalog()
  const { user, authLoading } = useAuth()
  const { showToast } = useToast()
  const isAdmin = isAdminEmail(user?.email)

  const [searchQuery, setSearchQuery] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>(EMPTY_PRODUCT_FORM)
  const [allOrders, setAllOrders] = useState<Order[]>([])
  // Dashboard inventory: the admin sees every row, other sellers only their
  // own sandbox rows (null until loaded). The public storefront never reads
  // this list — it uses the ownerless catalog from context.
  const [sellerProducts, setSellerProducts] = useState<Product[] | null>(null)

  // The seller console sees the whole store's orders, not just the signed-in
  // user's. Session-only orders (demo mode) never reach it because they were
  // never persisted.
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
        showToast("Order status updated.", "success")
      } else {
        showToast(res.error || "Could not update the order status.", "error")
      }
    },
    [showToast]
  )

  const stats = useMemo(
    () => buildSellerStats(allOrders, sellerProducts?.length ?? 0),
    [allOrders, sellerProducts]
  )
  const activities = useMemo(() => buildActivities(allOrders), [allOrders])

  const filteredOrders = useMemo(
    () =>
      allOrders.filter((o) => o.id.toLowerCase().includes(searchQuery.toLowerCase())),
    [allOrders, searchQuery]
  )

  const filteredProducts = useMemo(
    () =>
      (sellerProducts ?? []).filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [sellerProducts, searchQuery]
  )

  if (authLoading || (user && sellerProducts === null)) {
    return <DashboardSkeleton />
  }

  if (!user) return <SellerRestrictedGate />

  const resetForm = () => setFormData(EMPTY_PRODUCT_FORM)

  const closeModal = () => {
    setIsAddModalOpen(false)
    setEditingProduct(null)
    resetForm()
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    try {
      const rawCompare = parseFloat(formData.original_price)
      const price = parseFloat(formData.price)
      // Empty compare-at = no sale. A compare-at at/below price is not an
      // offer — clear it so the card shows no badge instead of 0%.
      const original_price =
        Number.isFinite(rawCompare) && rawCompare > price ? rawCompare : null
      const productPayload = {
        name: formData.name,
        price,
        original_price,
        category: formData.category,
        description: formData.description,
        image: formData.image,
        images: [...new Set([formData.image, ...formData.images.map((s) => s.trim()).filter(Boolean)])],
        video: formData.video || undefined,
        stock: Math.max(0, Math.floor(Number(formData.stock) || 0)),
        is_published: formData.is_published,
        custom_colors: formData.custom_colors
          .map((c) => ({ name: c.name.trim(), hex: c.hex }))
          .filter((c) => c.name !== ""),
        custom_sizes: formData.custom_sizes.map((s) => s.trim()).filter(Boolean),
      }
      if (editingProduct) {
        const ok = await updateProduct(editingProduct.id, productPayload)
        if (ok) {
          setSellerProducts((prev) =>
            (prev ?? []).map((p) => (p.id === editingProduct.id ? { ...p, ...productPayload } : p))
          )
          closeModal()
        }
      } else {
        const created = await addProduct(productPayload)
        // The storefront context skips sandbox rows by itself; mirror the
        // row here when it belongs on this dashboard.
        if (created) {
          if (isAdmin || created.user_id === user?.id) {
            setSellerProducts((prev) => [...(prev ?? []), created])
          }
          closeModal()
        }
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProductDelete = async (id: number) => {
    const ok = await deleteProduct(id)
    if (ok) setSellerProducts((prev) => (prev ?? []).filter((p) => p.id !== id))
  }

  const startEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      original_price:
        product.original_price && product.original_price > product.price
          ? product.original_price.toString()
          : "",
      category: product.category,
      description: product.description || "",
      image: product.image,
      video: product.video || "",
      stock: product.stock?.toString() ?? "",
      is_published: product.is_published ?? true,
      custom_colors: (product.custom_colors ?? []).map((c) => ({ ...c })),
      custom_sizes: [...(product.custom_sizes ?? [])],
      images: (product.images ?? []).filter((src) => src !== product.image),
    })
  }

  const handleTogglePublish = async (product: Product) => {
    const ok = await updateProduct(product.id, { is_published: !(product.is_published ?? true) })
    if (ok) {
      setSellerProducts((prev) =>
        (prev ?? []).map((p) =>
          p.id === product.id ? { ...p, is_published: !(product.is_published ?? true) } : p
        )
      )
    }
  }

  const handleToggleFeatured = async (product: Product) => {
    const res = await toggleFeaturedAction(product.id, !product.featured)
    if (res.ok) {
      setSellerProducts((prev) =>
        (prev ?? []).map((p) => (p.id === product.id ? { ...p, featured: !p.featured } : p))
      )
      patchProductLocal(product.id, { featured: !product.featured })
    } else {
      showToast(res.error || "Could not update hero featuring.", "error")
    }
  }

  const downloadReport = () => {
    const headers = ["Order ID,Date,Customer ID,Total,Status"]
    const rows = allOrders.map(
      (o) => `${o.id},${o.created_at},${o.user_id},${o.total},${o.status}`
    )
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n")
    const link = document.createElement("a")
    link.setAttribute("href", encodeURI(csvContent))
    link.setAttribute("download", `shop_report_${new Date().toLocaleDateString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
      <ProductFormDialog
        isOpen={isAddModalOpen || editingProduct !== null}
        editingProduct={editingProduct}
        formData={formData}
        categories={categories}
        isProcessing={isProcessing}
        onClose={closeModal}
        onChange={setFormData}
        onSubmit={handleProductSubmit}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)] uppercase">
            Store Console
          </h1>
          <p className="text-[var(--foreground)] opacity-50 mt-1">
            {isAdmin
              ? "Full access: catalog, users & orders."
              : "Sandbox — only products you create appear here."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={downloadReport}
            className="flex items-center gap-2 px-5 py-3 bg-[var(--glass-bg)] border border-[var(--border-color)] rounded-2xl text-sm font-bold hover:bg-[var(--glass-highlight)] transition-all"
          >
            <Download size={18} />
            Export
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-2xl text-sm font-bold hover:opacity-90 transition-all"
          >
            <Plus size={18} />
            New Item
          </button>
        </div>
      </div>

      <StatCards stats={stats} />

      {isAdmin && (
        <>
          <UserManager />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <CategoryManager />
            <PromoManager />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <DealsPopupManager />
            <AuditLog />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <OrderManager
          orders={filteredOrders}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onStatusChange={handleStatusChange}
          readOnly={!isAdmin}
        />
        <ActivityFeed activities={activities} />
        <ProductTable
          products={filteredProducts}
          onEdit={startEdit}
          onDelete={handleProductDelete}
          onTogglePublish={handleTogglePublish}
          onToggleFeatured={handleToggleFeatured}
          canFeature={isAdmin}
          showOwnerBadge={isAdmin}
        />
      </div>
    </div>
  )
}
