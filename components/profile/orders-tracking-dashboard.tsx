'use client';

import React, { useMemo, useState } from 'react';
import {
  Package,
  Truck,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Copy,
  Check,
  MapPin,
  Calendar,
  Layers,
  LayoutList,
  Search,
} from 'lucide-react';
import type { Order } from '@/lib/types';
import { orderStatusBadgeClass } from '@/components/orders/order-status';

/** App statuses mapped onto the design's status vocabulary. */
function toDesignStatus(status: string): OrderStatus {
  switch (status) {
    case 'Delivered': return 'Delivered';
    case 'Shipped': return 'Shipped';
    case 'Confirmed': return 'Order Confirmed';
    case 'Pending': return 'Pending';
    case 'Cancelled': return 'Cancel Order';
    default: return 'In Transit'; // Processing and anything else
  }
}

export type OrderStatus =
  | 'In Transit'
  | 'Delivered'
  | 'Shipped'
  | 'Order Confirmed'
  | 'Pending'
  | 'Cancel Order';

export interface TrackingStep {
  id: string;
  title: string;
  subtitle: string;
  status: 'completed' | 'active' | 'upcoming';
  hasDropdown?: boolean;
  isExpanded?: boolean;
  events?: { time: string; text: string }[];
}

type ViewMode = 'combined' | 'orders-only' | 'tracking-only';

/** Tracking steps derived from the order's live status + timestamps. */
function buildTrackingSteps(order: Order): TrackingStep[] {
  const status = toDesignStatus(order.status);
  const cancelled = status === 'Cancel Order';
  const stageIdx: Record<string, number> = {
    Pending: 0, 'Order Confirmed': 1, 'In Transit': 2, Shipped: 3, Delivered: 4,
  };
  const idx = status === 'Cancel Order' ? 1 : (stageIdx[status] ?? 2);
  const stages = [
    { title: 'Order Placed', subtitle: 'We received your order.' },
    { title: 'Confirmed', subtitle: 'Payment authorized.' },
    { title: 'Processing', subtitle: 'Packing your items.' },
    { title: 'Shipped', subtitle: 'Handed to the carrier.' },
    { title: 'Delivered', subtitle: 'Package received.' },
  ];
  const fmt = (iso: string | null | undefined) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  return stages.map((s, i) => {
    const st: TrackingStep['status'] = cancelled
      ? (i < 1 ? 'completed' : i === 1 ? 'active' : 'upcoming')
      : i < idx ? 'completed' : i === idx ? 'active' : 'upcoming';
    return {
      id: `step-${i + 1}`,
      title: s.title,
      subtitle: cancelled && i === 1 ? 'Cancellation requested — refund in progress.' : s.subtitle,
      status: st,
      hasDropdown: i === idx && (i === 2 || i === 3),
      isExpanded: i === idx,
      events: i <= idx && (order.status_updated_at || order.created_at)
        ? [{ time: fmt(i === 0 ? order.created_at : order.status_updated_at) || '—', text: `${s.title} — ${s.subtitle}` }]
        : undefined,
    };
  });
}

export default function OrdersTrackingDashboard({ orders }: { orders: Order[] }) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(orders[0]?.id ?? null);
  const [viewMode, setViewMode] = useState<ViewMode>('combined');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const ordersWithSteps = useMemo(
    () =>
      orders.map((o) => ({
        ...o,
        designStatus: toDesignStatus(o.status),
        trackingSteps: buildTrackingSteps(o),
        trackingNumber: o.tracking_number || `TRK-${o.id.slice(0, 8).toUpperCase()}`,
        carrierName: o.carrier || 'Standard Delivery',
      })),
    [orders]
  );

  const selectedOrder = ordersWithSteps.find((o) => o.id === selectedOrderId) || ordersWithSteps[0];

  const statusOptions = ['All', 'In Transit', 'Delivered', 'Shipped', 'Order Confirmed', 'Pending', 'Cancel Order'];

  const filteredOrders = ordersWithSteps.filter((order) => {
    const matchesFilter = statusFilter === 'All' || order.designStatus === (statusFilter as OrderStatus);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      order.items.some((i) => i.name.toLowerCase().includes(q)) ||
      order.id.toLowerCase().includes(q) ||
      order.carrierName.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const toggleStep = (stepId: string) => {
    setExpanded((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleCopyTracking = async () => {
    if (!selectedOrder) return;
    try {
      await navigator.clipboard.writeText(selectedOrder.trackingNumber);
    } catch {
      /* clipboard unavailable — still show feedback */
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!selectedOrder) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] p-12 text-center">
        <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" aria-hidden />
        <p className="text-sm font-bold text-gray-900">No orders yet</p>
        <p className="text-xs text-gray-500 mt-1">Your orders and live tracking will appear here after checkout.</p>
      </div>
    );
  }

  const pill = orderStatusBadgeClass(selectedOrder.designStatus);
  const firstItem = selectedOrder.items[0];
  const itemsCount = selectedOrder.items.reduce((n, i) => n + (i.quantity || 1), 0);
  const eta = selectedOrder.status === 'Delivered'
    ? `Delivered ${new Date(selectedOrder.status_updated_at || selectedOrder.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : `Est. ${new Date(new Date(selectedOrder.created_at).getTime() + 5 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 font-sans">
      {/* Top Header Card with View Mode Switcher */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 stroke-[1.8] text-gray-800 shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-[#1c1c1e] tracking-tight">
                My Orders &amp; Live Tracking
              </h2>
              <p className="text-xs text-gray-500">
                Interactive orders list with real-time status tracking in one unified dashboard
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Filter Tabs replacing the Quick Select row */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('combined')}
            className={`pb-2 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 -mb-px ${
              viewMode === 'combined'
                ? 'border-[#1c1c1e] text-[#1c1c1e]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Combined View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('orders-only')}
            className={`pb-2 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 -mb-px ${
              viewMode === 'orders-only'
                ? 'border-[#1c1c1e] text-[#1c1c1e]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Orders List</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tracking-only')}
            className={`pb-2 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 -mb-px ${
              viewMode === 'tracking-only'
                ? 'border-[#1c1c1e] text-[#1c1c1e]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Order Status</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`grid gap-6 items-start ${
          viewMode === 'combined' ? 'grid-cols-1 xl:grid-cols-12' : 'grid-cols-1 max-w-3xl mx-auto'
        }`}
      >
        {/* Left Column: All Orders List */}
        {(viewMode === 'combined' || viewMode === 'orders-only') && (
          <div className={`${viewMode === 'combined' ? 'xl:col-span-5' : 'w-full'} space-y-3.5`}>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-700" />
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    All Orders ({filteredOrders.length})
                  </h3>
                </div>
                <span className="text-xs text-gray-400">Click to track</span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search order ID or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 w-full transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {statusOptions.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      statusFilter === st ? 'bg-[#1c1c1e] text-white shadow-xs' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const isSelected = order.id === selectedOrderId;
                const badgeCls = orderStatusBadgeClass(order.designStatus);
                const thumb = order.items[0]?.image;
                const name = order.items[0]?.name ?? 'Order';
                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      if (viewMode === 'orders-only') setViewMode('tracking-only');
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                      isSelected
                        ? 'border-[#eb483f] ring-2 ring-[#eb483f]/15 shadow-md scale-[1.01]'
                        : 'hover:bg-gray-50/80 border-gray-100 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200/60">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">?</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-gray-900">#{order.id.slice(0, 8)}</span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 text-[10.5px] font-bold rounded-[4px] whitespace-nowrap ${badgeCls}`}
                          >
                            {order.designStatus}
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-gray-800 mt-1 truncate">
                          {name}
                          {order.items.length > 1 ? ` (+${order.items.length - 1})` : ''}
                        </h4>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                          <span>{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="font-bold text-gray-900 text-xs">${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-400 text-[11px]">
                        Carrier: {order.carrierName} • {itemsCount} item{itemsCount === 1 ? '' : 's'}
                      </span>
                      <button
                        type="button"
                        className={`font-semibold flex items-center gap-1 text-[11.5px] cursor-pointer ${
                          isSelected ? 'text-[#eb483f]' : 'text-gray-600 hover:text-[#eb483f]'
                        }`}
                      >
                        <span>{isSelected ? 'Currently Viewing' : 'View Tracking'}</span>
                        <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Right Column: Live Order Status Tracking View */}
        {(viewMode === 'combined' || viewMode === 'tracking-only') && (
          <div className={`${viewMode === 'combined' ? 'xl:col-span-7' : 'w-full'}`}>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden transition-all">
              <div className="px-6 pt-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <Truck className="w-4 h-4 text-gray-700" />
                  <span>Live Tracking</span>
                </div>
              </div>

              <div className="px-6 pt-2 pb-5 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6 stroke-[1.8] text-gray-800 shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-[#1c1c1e] tracking-tight">Tracking</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      ID: {selectedOrder.trackingNumber} • {selectedOrder.carrierName}
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-medium">Status :</span>
                    <span
                      className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-[4px] whitespace-nowrap ${pill}`}
                    >
                      {selectedOrder.designStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">{eta}</p>
                </div>
              </div>

              {/* Package Quick Context Bar with Copy Tracking ID */}
              <div className="bg-[#fafbfc] px-6 py-3 border-b border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-gray-600 truncate mr-2">
                  <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="font-semibold text-gray-900 truncate">
                    {firstItem?.name ?? 'Order'}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="font-bold text-gray-900 shrink-0">${selectedOrder.total.toFixed(2)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyTracking}
                  className="flex items-center gap-1 text-[11px] font-medium text-gray-600 hover:text-gray-900 px-2.5 py-1 rounded-lg bg-white border border-gray-200 cursor-pointer shadow-2xs shrink-0"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Tracking ID</span>
                    </>
                  )}
                </button>
              </div>

              {/* Vertical Dashed Timeline */}
              <div className="p-6 sm:p-7">
                <div className="relative pl-8 space-y-6 sm:space-y-7">
                  <div className="absolute top-2.5 bottom-3 left-[13px] w-[1px] border-l-2 border-dashed border-gray-300" />

                  {selectedOrder.trackingSteps.map((step) => {
                    const isCompleted = step.status === 'completed';
                    const isActive = step.status === 'active';
                    const isUpcoming = step.status === 'upcoming';
                    const isExpanded = expanded[step.id] ?? !!step.isExpanded;

                    return (
                      <div key={step.id} className="relative">
                        <div className="absolute -left-[30px] top-1.5">
                          {isCompleted && (
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          )}
                          {isActive && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#eb483f]" />
                          )}
                          {isUpcoming && (
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className={`text-xs font-semibold ${isActive || isCompleted ? 'text-gray-500' : 'text-gray-400'}`}>
                              {step.title}
                            </h4>
                            <p className={`text-sm font-bold mt-0.5 tracking-tight ${isUpcoming ? 'text-gray-400' : 'text-[#1c1c1e]'}`}>
                              {step.subtitle}
                            </p>
                          </div>

                          {step.hasDropdown && (
                            <button
                              type="button"
                              onClick={() => toggleStep(step.id)}
                              className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4 stroke-[2]" /> : <ChevronDown className="w-4 h-4 stroke-[2]" />}
                            </button>
                          )}
                        </div>

                        {step.hasDropdown && isExpanded && step.events && (
                          <div className="mt-3.5 bg-[#f4f5f7] rounded-2xl p-3.5 border border-gray-200/60 space-y-2 text-xs">
                            {step.events.map((ev, eIdx) => (
                              <div key={eIdx} className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 text-gray-700">
                                <span className="font-semibold text-gray-500 shrink-0">{ev.time}</span>
                                <span className="font-medium text-gray-800">{ev.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-7 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>Destination: your saved address</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>ETA: {eta.replace('Est. ', '')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
