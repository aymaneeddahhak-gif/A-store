"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useAuth } from "@/contexts/providers/auth-context"
import { useOrders } from "@/contexts/providers/orders-context"
import { useRouter } from "next/navigation"
import { Package, AlertCircle } from "lucide-react"
import Link from "next/link"
import { OrderStatusPill, StatusSweepButton } from "@/components/orders/order-status"
import OrderNotificationCard, { type OrderStatus } from "@/components/orders/order-notification-card"

export default function OrdersPage() {
    const { user, authLoading } = useAuth()
    const { orders, cancelOrder, ordersLoading } = useOrders()
    const router = useRouter()
    const [cancellingId, setCancellingId] = useState<string | null>(null)
    // Latest status change surfaces as the Uiverse notification card above the list.
    const latestStatusChange = orders.find((o) => o.status_updated_at) ?? null
    const [dismissedFor, setDismissedFor] = useState<string | null>(null)

    useEffect(() => {
        if (!authLoading && !user) router.replace('/login')
    }, [user, authLoading, router])

    const handleCancel = async (orderId: string) => {
        setCancellingId(orderId)
        await cancelOrder(orderId)
        setCancellingId(null)
    }

    /** Short display id — works for legacy ord_<ts>_<rand> and plain UUIDs. */
    const shortId = (id: string) => {
      const parts = id.split('_')
      const raw = parts.length > 1 ? parts[parts.length - 1] : id
      return raw.slice(0, 8).toUpperCase()
    }

    const showSkeleton = authLoading || (ordersLoading && orders.length === 0)

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight mb-2">My Orders</h1>
                    <p className="text-[var(--muted-foreground)]">View and manage your recent purchases.</p>
                </div>
                <Link href="/" className="px-6 py-2 bg-[var(--glass-bg)] border border-[var(--border-color)] rounded-full text-xs font-bold uppercase tracking-widest text-[var(--foreground)] hover:bg-[var(--glass-highlight)] transition-colors">
                    Continue Shopping
                </Link>
            </div>

            {latestStatusChange && dismissedFor !== latestStatusChange.id && (
                <OrderNotificationCard
                  status={(latestStatusChange.status === "Processing" ? "In Transit" : latestStatusChange.status) as OrderStatus}
                  onStatusClick={() => router.push('/profile?tab=orders')}
                  onDismiss={() => setDismissedFor(latestStatusChange.id)}
                />
            )}

            {showSkeleton ? (
                <div className="space-y-6" aria-busy aria-label="Loading orders">
                    {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="p-6 sm:p-8 bg-[var(--card)] border border-[var(--border-color)] rounded-[32px]">
                            <div className="flex items-center justify-between pb-6 border-b border-[var(--border-color)] mb-6">
                                <div className="flex flex-col gap-2">
                                    <div className="skeleton-shimmer h-4 w-40 rounded-md" />
                                    <div className="skeleton-shimmer h-3 w-56 rounded-md" />
                                </div>
                                <div className="skeleton-shimmer h-7 w-24 rounded-full" />
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="skeleton-shimmer h-14 w-full rounded-2xl" />
                                <div className="skeleton-shimmer h-14 w-full rounded-2xl" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 bg-[var(--card)] border border-[var(--border-color)] rounded-[32px] text-center">
                    <Package size={48} className="text-[var(--foreground)] opacity-20 mb-4" />
                    <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">No orders yet</h3>
                    <p className="text-[var(--muted-foreground)] mb-6">Looks like you haven&apos;t made any purchases.</p>
                    <Link href="/" className="px-8 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order.id} className="p-6 sm:p-8 bg-[var(--card)] border border-[var(--border-color)] rounded-[32px] hover:border-[var(--electric-border-color)] transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 group">
                            
                            {/* Order Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)] mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-xs font-bold text-[var(--foreground)] opacity-50 uppercase tracking-widest">Order ID</span>
                                        <span className="text-sm font-mono text-[var(--foreground)]">{shortId(order.id)}</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">
                                        Placed on {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <OrderStatusPill status={order.status} />
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-[var(--background)] rounded-2xl border border-[var(--border-color)] relative overflow-hidden flex-shrink-0">
                                            <Image src={item.image} alt={item.name} fill sizes="64px" className="object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="flex-1">
                                            <Link href={`/product/${item.id}`} className="font-bold text-sm text-[var(--foreground)] hover:underline">
                                                {item.name}
                                            </Link>
                                            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest mt-0.5">{item.category} · Qty {item.quantity}</div>
                                        </div>
                                        <div className="font-black text-[var(--foreground)]">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Footer */}
                            <div className="mt-6 pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-xs">
                                    {order.status === 'Pending' && (
                                        <>
                                            <AlertCircle size={14} />
                                            <span>You can cancel this order before it is confirmed.</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                    {order.status === 'Pending' && (
                                        <StatusSweepButton
                                            status="Cancelled"
                                            onClick={() => handleCancel(order.id)}
                                            disabled={cancellingId === order.id}
                                            ariaLabel={`Cancel order ${shortId(order.id)}`}
                                        >
                                            {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                                        </StatusSweepButton>
                                    )}
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mr-3">Total Amount</span>
                                        <span className="text-xl font-black text-[var(--foreground)]">${order.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
