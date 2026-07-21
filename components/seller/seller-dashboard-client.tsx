"use client"

import { useState, useMemo } from "react"
import { Download, Plus, Loader2 } from "lucide-react"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { useOrders } from "@/contexts/providers/orders-context"
import { useAuth } from "@/contexts/providers/auth-context"
import type { Product } from "@/lib/types"
import { StatCards, buildSellerStats } from "@/components/seller/stat-cards"
import { ActivityFeed, buildActivities } from "@/components/seller/activity-feed"
import { OrderManager } from "@/components/seller/order-manager"
import { ProductTable } from "@/components/seller/product-table"
import {
  ProductFormDialog,
  EMPTY_PRODUCT_FORM,
  type ProductFormData,
} from "@/components/seller/product-form-dialog"
import { SellerRestrictedGate } from "@/components/seller/restricted-gate"

export function SellerDashboardClient() {
  const { products, addProduct, updateProduct, deleteProduct } = useCatalog()
  const { orders, updateOrderStatus } = useOrders()
  const { user, authLoading } = useAuth()

  const [searchQuery, setSearchQuery] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>(EMPTY_PRODUCT_FORM)

  const stats = useMemo(() => buildSellerStats(orders, products.length), [orders, products.length])
  const activities = useMemo(() => buildActivities(orders), [orders])

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => o.id.toLowerCase().includes(searchQuery.toLowerCase())),
    [orders, searchQuery]
  )

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [products, searchQuery]
  )

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
        <Loader2 className="animate-spin text-[var(--foreground)]" />
      </div>
    )
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
      const productPayload = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        description: formData.description,
        image: formData.image,
        images: [formData.image],
      }
      if (editingProduct) {
        await updateProduct(editingProduct.id, productPayload)
      } else {
        await addProduct(productPayload)
      }
      closeModal()
    } finally {
      setIsProcessing(false)
    }
  }

  const startEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      description: product.description || "",
      image: product.image,
    })
  }

  const downloadReport = () => {
    const headers = ["Order ID,Date,Customer ID,Total,Status"]
    const rows = orders.map(
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
            Operational control & real-time inventory management.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <OrderManager
          orders={filteredOrders}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onStatusChange={updateOrderStatus}
        />
        <ActivityFeed activities={activities} />
        <ProductTable
          products={filteredProducts}
          onEdit={startEdit}
          onDelete={deleteProduct}
        />
      </div>
    </div>
  )
}
