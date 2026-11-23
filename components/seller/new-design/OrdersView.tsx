"use client"

import React, { useMemo, useState } from "react"
import Image from "next/image"
import {
  ShoppingBag,
  Download,
  Search,
  Clock,
  Truck,
  CheckCircle2,
  ChevronDown,
  Copy,
  Check,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Package,
} from "lucide-react"
import type { Order } from "@/lib/types"
import { TRACKING_REQUIRED_STATUSES, orderNextStatuses } from "@/lib/types"

/** Short display id — works for legacy ord_<ts>_<rand> and plain UUIDs. */
export function shortOrderId(id: string) {
  const parts = id.split("_")
  const raw = parts.length > 1 ? parts[parts.length - 1] : id
  return raw.slice(0, 8).toUpperCase()
}

export interface OrderBuyer {
  name: string
  email: string
}

const STATUS_PILLS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  Confirmed: "bg-[#98e4af]/25 text-gray-900 dark:text-[#98e4af]",
  Processing: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  Shipped: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300",
  Delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  Cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
}

const STATUS_TABS = [
  "All",
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
]

function pillClass(status: string) {
  return STATUS_PILLS[status] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

interface OrdersViewProps {
  isDarkMode?: boolean
  orders: Order[]
  /** Real identities when the viewer may see them (admin), keyed by user id. */
  buyers?: Record<string, OrderBuyer>
  /** Whether this viewer may move orders along the lifecycle. */
  canManage: boolean
  onStatusChange: (
    orderId: string,
    status: string,
    shipment?: { carrier?: string; trackingNumber?: string }
  ) => void
  onShipmentSave: (orderId: string, carrier: string, trackingNumber: string) => void
  onShowToast: (msg: string) => void
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  isDarkMode = false,
  orders,
  buyers = {},
  canManage,
  onStatusChange,
  onShipmentSave,
  onShowToast,
}) => {
  const [statusFilter, setStatusFilter] = useState("All")
  const [searchFilter, setSearchFilter] = useState("")
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [shippingFor, setShippingFor] = useState<string | null>(null)
  const [shipDraft, setShipDraft] = useState<{ carrier: string; tracking: string }>({
    carrier: "",
    tracking: "",
  })
  const [manualFor, setManualFor] = useState<string | null>(null)
  const [manualDraft, setManualDraft] = useState<{ carrier: string; tracking: string }>({
    carrier: "",
    tracking: "",
  })
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const rows = useMemo(
    () =>
      orders.map((order) => {
        const buyer = buyers[order.user_id]
        return {
          order,
          shortId: shortOrderId(order.id),
          placedAt: formatDate(order.created_at),
          buyerName: buyer?.name ?? `Customer …${order.user_id.slice(-6)}`,
          buyerEmail: buyer?.email ?? `Buyer account …${order.user_id.slice(-6)}`,
          itemsCount: order.items.reduce((n, i) => n + (Number(i.quantity) || 1), 0),
          thumbs: order.items.slice(0, 3).map((i) => i.image),
        }
      }),
    [orders, buyers]
  )

  const filtered = rows.filter((row) => {
    const matchesStatus = statusFilter === "All" || row.order.status === statusFilter
    const q = searchFilter.toLowerCase()
    const matchesSearch =
      !q ||
      row.order.id.toLowerCase().includes(q) ||
      row.shortId.toLowerCase().includes(q) ||
      row.buyerName.toLowerCase().includes(q) ||
      row.buyerEmail.toLowerCase().includes(q) ||
      String(row.order.carrier ?? "").toLowerCase().includes(q) ||
      String(row.order.tracking_number ?? "").toLowerCase().includes(q) ||
      row.order.items.some((i) => i.name.toLowerCase().includes(q))
    return matchesStatus && matchesSearch
  })

  const totals = useMemo(() => {
    const pending = orders.filter((o) => o.status === "Pending").length
    const shipped = orders.filter((o) => o.status === "Shipped").length
    const delivered = orders.filter((o) => o.status === "Delivered")
    return {
      count: orders.length,
      pending,
      shipped,
      deliveredCount: delivered.length,
      deliveredRevenue: delivered.reduce((s, o) => s + (Number(o.total) || 0), 0),
      cancelled: orders.filter((o) => o.status === "Cancelled").length,
    }
  }, [orders])


  const secondaryBtn = `h-10 px-4 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer active:scale-98 ${
    isDarkMode
      ? "bg-[#212427] border-gray-700 text-gray-200 hover:bg-[#98e4af] hover:text-gray-950 hover:border-[#98e4af]"
      : "bg-white border-gray-300/80 text-gray-700 hover:bg-[#98e4af] hover:text-gray-950 hover:border-[#98e4af]"
  }`

  const inputClass = `w-full px-3 py-2 rounded-xl text-xs outline-none transition-all ${
    isDarkMode
      ? "bg-[#272a2e] text-gray-100 focus:ring-1 focus:ring-[#98e4af]"
      : "bg-[#F3F4F6] text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#98e4af]"
  }`

  /** Shipping needs a carrier + tracking number — capture them before the move. */
  const startShipping = (order: Order) => {
    setManualFor(null)
    setShippingFor(order.id)
    setShipDraft({ carrier: order.carrier ?? "", tracking: order.tracking_number ?? "" })
  }

  const confirmShipping = (order: Order) => {
    const carrier = shipDraft.carrier.trim()
    const tracking = shipDraft.tracking.trim()
    if (!carrier || !tracking) {
      onShowToast("Add both the carrier and the tracking number.")
      return
    }
    onStatusChange(order.id, "Shipped", { carrier, trackingNumber: tracking })
    setShippingFor(null)
  }

  const openManual = (order: Order) => {
    if (manualFor === order.id) {
      setManualFor(null)
      return
    }
    setShippingFor(null)
    setManualFor(order.id)
    setManualDraft({ carrier: order.carrier ?? "", tracking: order.tracking_number ?? "" })
  }

  const saveManual = (order: Order) => {
    const carrier = manualDraft.carrier.trim()
    const tracking = manualDraft.tracking.trim()
    if (!carrier || !tracking) {
      onShowToast("Add both the carrier and the tracking number.")
      return
    }
    onShipmentSave(order.id, carrier, tracking)
    setManualFor(null)
  }

  const handleStatusPick = (order: Order, next: string) => {
    if (!next || next === order.status) return
    if (TRACKING_REQUIRED_STATUSES.includes(next) && (!order.carrier || !order.tracking_number)) {
      startShipping(order)
      return
    }
    onStatusChange(order.id, next)
  }

  const copyTracking = async (order: Order) => {
    const code = order.tracking_number ?? ""
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Clipboard unavailable (insecure origin) — the code is visible anyway.
    }
    setCopiedId(order.id)
    window.setTimeout(() => setCopiedId(null), 1800)
  }


  const renderShippingForm = (order: Order) => (
    <div
      className={`w-full sm:w-64 p-3 rounded-2xl border space-y-2 text-left ${
        isDarkMode ? "bg-[#272a2e] border-gray-700" : "bg-[#F9FAFB] border-gray-100"
      }`}
    >
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Shipment details</p>
      <input
        type="text"
        value={shipDraft.carrier}
        onChange={(e) => setShipDraft((d) => ({ ...d, carrier: e.target.value }))}
        placeholder="Carrier (e.g. FedEx Priority)"
        aria-label="Carrier"
        className={inputClass}
      />
      <input
        type="text"
        value={shipDraft.tracking}
        onChange={(e) => setShipDraft((d) => ({ ...d, tracking: e.target.value }))}
        placeholder="Tracking number"
        aria-label="Tracking number"
        className={inputClass}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => confirmShipping(order)}
          className="flex-1 px-3 py-2 rounded-xl bg-[#98e4af] hover:bg-[#88deb3] text-gray-950 text-xs font-bold transition cursor-pointer active:scale-98"
        >
          Confirm shipment
        </button>
        <button
          type="button"
          onClick={() => setShippingFor(null)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  )

  const renderManualForm = (order: Order) => (
    <div
      className={`w-full sm:w-64 p-3 rounded-2xl border space-y-2 text-left ${
        isDarkMode ? "bg-[#272a2e] border-gray-700" : "bg-[#F9FAFB] border-gray-100"
      }`}
    >
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Carrier & tracking</p>
      <input
        type="text"
        value={manualDraft.carrier}
        onChange={(e) => setManualDraft((d) => ({ ...d, carrier: e.target.value }))}
        placeholder="Carrier"
        aria-label="Carrier"
        className={inputClass}
      />
      <input
        type="text"
        value={manualDraft.tracking}
        onChange={(e) => setManualDraft((d) => ({ ...d, tracking: e.target.value }))}
        placeholder="Tracking number"
        aria-label="Tracking number"
        className={inputClass}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => saveManual(order)}
          className="flex-1 px-3 py-2 rounded-xl bg-[#98e4af] hover:bg-[#88deb3] text-gray-950 text-xs font-bold transition cursor-pointer active:scale-98"
        >
          Save tracking
        </button>
        <button
          type="button"
          onClick={() => setManualFor(null)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  )

  const renderActions = (order: Order) => {
    if (!canManage) {
      return <span className="text-[11px] text-gray-400">View only</span>
    }
    const nextOptions = orderNextStatuses(order.status)
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 justify-end">
          {nextOptions.length > 0 ? (
            <div className="relative">
              <select
                value=""
                onChange={(e) => handleStatusPick(order, e.target.value)}
                aria-label={`Change the status of order ${shortOrderId(order.id)}`}
                className={`appearance-none pl-3 pr-7 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer outline-none ${pillClass(
                  order.status
                )}`}
              >
                <option value="">Change status…</option>
                {nextOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {order.status === "Cancelled" ? "Closed" : "Completed"}
            </span>
          )}
          <button
            type="button"
            onClick={() => openManual(order)}
            title="Edit carrier and tracking number"
            aria-label={`Edit the shipment for order ${shortOrderId(order.id)}`}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
          </button>
        </div>
        {shippingFor === order.id && renderShippingForm(order)}
        {manualFor === order.id && renderManualForm(order)}
      </div>
    )
  }

  return (
    <div id="orders-console" className="space-y-6">
      <div id="orders-header-bar" className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                isDarkMode ? "bg-[#272a2e] text-[#98e4af]" : "bg-[#98e4af]/20 text-gray-900"
              }`}
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.4]" />
            </div>
            <h2
              className={`text-[22px] font-bold tracking-tight ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Orders Console
            </h2>
          </div>

          <div
            className={`flex items-center p-1 rounded-xl border ${
              isDarkMode ? "bg-[#181a1b] border-gray-800" : "bg-gray-100/80 border-gray-200/70"
            }`}
          >
            <span className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-[#98e4af] text-gray-950 font-bold">
              <Package className="w-3.5 h-3.5" />
              <span>Fulfilment</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-bold">
                {totals.count}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() =>
              onShowToast(
                `Exported ${filtered.length} order${filtered.length === 1 ? "" : "s"} to CSV (demo).`
              )
            }
            className={secondaryBtn}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Orders</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: String(totals.count), note: `${totals.cancelled} cancelled`, Icon: ShoppingBag, tint: "text-gray-400" },
          { label: "Awaiting Confirmation", value: String(totals.pending), note: "Needs store action", Icon: Clock, tint: "text-amber-500" },
          { label: "In Transit", value: String(totals.shipped), note: "With the carrier", Icon: Truck, tint: "text-violet-500" },
          { label: "Delivered Revenue", value: `$${totals.deliveredRevenue.toFixed(2)}`, note: `${totals.deliveredCount} delivered`, Icon: CheckCircle2, tint: "text-emerald-500" },
        ].map(({ label, value, note, Icon, tint }) => (
          <div
            key={label}
            className={`p-4 rounded-2xl border ${
              isDarkMode
                ? "bg-[#1e2022] border-gray-800"
                : "bg-white border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>{label}</span>
              <Icon className={`w-4 h-4 ${tint}`} />
            </div>
            <p className={`text-2xl font-extrabold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {value}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">{note}</p>
          </div>
        ))}
      </div>

      <div
        className={`p-4 sm:p-5 rounded-[22px] border flex flex-col gap-3.5 transition-all ${
          isDarkMode
            ? "bg-[#1e2022] border-gray-800 shadow-sm"
            : "bg-white border-gray-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Status Filter</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {STATUS_TABS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-98 ${
                    statusFilter === st
                      ? "bg-[#98e4af] text-gray-950 font-bold shadow-2xs"
                      : isDarkMode
                      ? "bg-[#272a2e] text-gray-300 hover:bg-[#32363b]"
                      : "bg-[#F3F4F6] text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search order id, buyer, product, tracking..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none transition-all ${
                  isDarkMode
                    ? "bg-[#272a2e] text-gray-100 focus:ring-1 focus:ring-[#98e4af]"
                    : "bg-[#F3F4F6] text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#98e4af]"
                }`}
              />
            </div>

            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Table view"
                aria-label="Table view"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "table" ? "bg-[#98e4af] text-gray-950" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                title="Card view"
                aria-label="Card view"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "cards" ? "bg-[#98e4af] text-gray-950" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
            Showing:
          </span>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {filtered.length} of {rows.length} orders
          </span>
          {(statusFilter !== "All" || searchFilter) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("All")
                setSearchFilter("")
              }}
              className="text-[11px] font-semibold text-gray-400 hover:text-rose-500 ml-auto cursor-pointer transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className={`p-12 text-center rounded-[22px] border ${
            isDarkMode ? "bg-[#1e2022] border-gray-800" : "bg-white border-gray-100"
          }`}
        >
          <ShoppingBag className="w-10 h-10 text-gray-400 mx-auto mb-3 stroke-[1.5]" />
          <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            No orders match these filters
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Try another status or search term — new orders land here the moment a customer checks
            out.
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div
          className={`rounded-[22px] border overflow-hidden transition-all ${
            isDarkMode
              ? "bg-[#1e2022] border-gray-800 shadow-sm"
              : "bg-white border-gray-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Order</th>
                  <th className="py-3.5 px-4">Buyer</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Fulfilment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {filtered.map((row) => (
                  <tr
                    key={row.order.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-[#25282c] transition-colors align-top"
                  >
                    <td className="py-3 px-4">
                      <p className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        #{row.shortId}
                      </p>
                      <p className="text-[11px] text-gray-400">{row.placedAt}</p>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#98e4af]/30 flex items-center justify-center font-bold text-gray-900 dark:text-white text-xs shrink-0">
                          {row.buyerName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`font-bold truncate ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {row.buyerName}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">{row.buyerEmail}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center -space-x-2">
                          {row.thumbs.map((src, i) => (
                            <span
                              key={`${row.order.id}-thumb-${i}`}
                              className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 border border-white dark:border-gray-800 overflow-hidden inline-flex"
                            >
                              <Image src={src} alt="" width={28} height={28} unoptimized className="w-full h-full object-cover" />
                            </span>
                          ))}
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {row.itemsCount} item{row.itemsCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-extrabold text-emerald-600 dark:text-[#98e4af]">
                      ${row.order.total.toFixed(2)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md inline-block ${pillClass(
                          row.order.status
                        )}`}
                      >
                        {row.order.status}
                      </span>
                      {row.order.carrier && (
                        <p className="text-[11px] text-gray-400 mt-1">{row.order.carrier}</p>
                      )}
                      {row.order.tracking_number && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-400">
                          <span className="font-mono">{row.order.tracking_number}</span>
                          <button
                            type="button"
                            onClick={() => void copyTracking(row.order)}
                            aria-label={`Copy the tracking number of order ${row.shortId}`}
                            className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                          >
                            {copiedId === row.order.id ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">{renderActions(row.order)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((row) => (
            <div
              key={row.order.id}
              className={`p-4 rounded-[22px] border transition-all ${
                isDarkMode
                  ? "bg-[#1e2022] border-gray-800 hover:border-gray-700"
                  : "bg-white border-gray-100/90 hover:border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    #{row.shortId}
                  </p>
                  <p className="text-[11px] text-gray-400">{row.placedAt}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${pillClass(
                    row.order.status
                  )}`}
                >
                  {row.order.status}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center -space-x-2">
                  {row.thumbs.map((src, i) => (
                    <span
                      key={`${row.order.id}-card-thumb-${i}`}
                      className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 border border-white dark:border-gray-800 overflow-hidden inline-flex"
                    >
                      <Image src={src} alt="" width={36} height={36} unoptimized className="w-full h-full object-cover" />
                    </span>
                  ))}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold truncate ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {row.buyerName}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{row.buyerEmail}</p>
                </div>
              </div>

              {row.order.tracking_number && (
                <p className="mt-2.5 text-[11px] text-gray-400 font-mono truncate">
                  {row.order.carrier ? `${row.order.carrier} · ` : ""}
                  {row.order.tracking_number}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  {row.itemsCount} item{row.itemsCount === 1 ? "" : "s"}
                </span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-[#98e4af]">
                  ${row.order.total.toFixed(2)}
                </span>
              </div>

              <div className="mt-3">{renderActions(row.order)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
