"use client"

import { ShoppingBag, Search } from "lucide-react"
import type { Order } from "@/lib/types"

/** Short display id — works for legacy ord_<ts>_<rand> and plain UUIDs. */
export function shortOrderId(id: string) {
  const parts = id.split("_")
  const raw = parts.length > 1 ? parts[parts.length - 1] : id
  return raw.slice(0, 8).toUpperCase()
}

export function getStatusStyle(status: string) {  switch (status) {
    case "Delivered":
      return "bg-[#10b981] text-white shadow-[0_2px_12px_rgba(16,185,129,0.45)]"
    case "Shipped":
      return "bg-[#8b5cf6] text-white shadow-[0_2px_12px_rgba(139,92,246,0.45)]"
    case "Processing":
      return "bg-[#3b82f6] text-white shadow-[0_2px_12px_rgba(59,130,246,0.45)]"
    case "Confirmed":
      return "bg-[#00ffaa] text-black shadow-[0_2px_12px_rgba(0,255,170,0.45)]"
    case "Pending":
      return "bg-[#fbb034] text-black shadow-[0_2px_12px_rgba(251,176,52,0.45)]"
    case "Cancelled":
      return "bg-[#f43f5e] text-white shadow-[0_2px_12px_rgba(244,63,94,0.45)]"
    default:
      return "bg-neutral-500 text-white shadow-[0_2px_12px_rgba(115,115,115,0.45)]"
  }
}

export function OrderManager({
  orders,
  searchQuery,
  onSearchChange,
  onStatusChange,
  readOnly = false,
}: {
  orders: Order[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onStatusChange: (orderId: string, status: string) => void
  readOnly?: boolean
}) {
  return (
    <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border-color)] rounded-[40px] overflow-hidden">
      <div className="p-8 border-b border-[var(--border-color)] flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <ShoppingBag className="text-blue-500" /> Recent Orders
        </h2>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" aria-hidden />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter orders..."
            aria-label="Filter orders"
            className="pl-11 pr-4 py-2.5 bg-[var(--background)] border border-[var(--border-color)] rounded-full text-xs outline-none focus:ring-1 focus:ring-[var(--foreground)]"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest opacity-40 font-black border-b border-[var(--border-color)]">
              <th className="px-8 py-5 text-left">ID</th>
              <th className="px-8 py-5 text-left">Buyer</th>
              <th className="px-8 py-5 text-left">Total</th>
              <th className="px-8 py-5 text-right">Fulfillment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-12 text-center text-sm text-[var(--muted-foreground)]">
                  No orders match your filter.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-[var(--glass-bg)] transition-all">
                    <td className="px-8 py-6 font-mono text-xs opacity-60">
                      #{shortOrderId(order.id)}
                    </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--background)] border border-[var(--border-color)] flex items-center justify-center text-[10px] font-bold">
                        {order.user_id[0]?.toUpperCase() ?? "?"}
                      </div>
                      <span className="text-xs font-semibold">
                        User...{order.user_id.slice(-6)}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-bold text-sm">${order.total.toFixed(2)}</td>
                  <td className="px-8 py-6 text-right">
                    <select
                      value={order.status}
                      onChange={(e) => onStatusChange(order.id, e.target.value)}
                      disabled={readOnly}
                      aria-label={`Update status for order ${shortOrderId(order.id)}`}
                      title={readOnly ? "Restricted to the store admin" : undefined}
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-transparent outline-none transition-all ${getStatusStyle(order.status)} ${
                        readOnly ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
