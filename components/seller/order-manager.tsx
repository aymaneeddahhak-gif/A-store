"use client"

import { ShoppingBag, Search } from "lucide-react"
import type { Order } from "@/lib/types"

function getStatusStyle(status: string) {
  switch (status) {
    case "Delivered":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    case "Shipped":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    case "Processing":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    case "Pending":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20"
    case "Cancelled":
      return "bg-rose-500/10 text-rose-500 border-rose-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }
}

export function OrderManager({
  orders,
  searchQuery,
  onSearchChange,
  onStatusChange,
}: {
  orders: Order[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onStatusChange: (orderId: string, status: string) => void
}) {
  return (
    <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border-color)] rounded-[40px] overflow-hidden">
      <div className="p-8 border-b border-[var(--border-color)] flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <ShoppingBag className="text-blue-500" /> Recent Commands
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
                    #{order.id.split("-")[0]}
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
                      aria-label={`Update status for order ${order.id.split("-")[0]}`}
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-transparent outline-none cursor-pointer transition-all ${getStatusStyle(order.status)}`}
                    >
                      <option value="Pending">Pending</option>
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
