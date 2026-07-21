"use client"

import { useEffect, useState } from "react"
import { useShop, Order } from "@/contexts/shop-context"
import { useRouter } from "next/navigation"
import { Package, Clock, XCircle, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function OrdersPage() {
    const { user, orders, cancelOrder } = useShop()
    const router = useRouter()
    const [cancellingId, setCancellingId] = useState<string | null>(null)

    useEffect(() => {
        if (!user) {
            router.push('/login')
        }
    }, [user, router])

    if (!user) return null

    const handleCancel = async (orderId: string) => {
        setCancellingId(orderId)
        await cancelOrder(orderId)
        setCancellingId(null)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/30'
            case 'Confirmed': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
            case 'Cancelled': return 'text-rose-500 bg-rose-500/10 border-rose-500/30'
            default: return 'text-[var(--muted-foreground)] bg-[var(--glass-bg)] border-[var(--border-color)]'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pending': return <Clock size={14} />
            case 'Confirmed': return <CheckCircle2 size={14} />
            case 'Cancelled': return <XCircle size={14} />
            default: return <Package size={14} />
        }
    }

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

            {orders.length === 0 ? (
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
                                        <span className="text-sm font-mono text-[var(--foreground)]">{order.id.split('-')[0]}</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">
                                        Placed on {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                                        {getStatusIcon(order.status)}
                                        {order.status}
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-4">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-[var(--background)] rounded-2xl border border-[var(--border-color)] flex items-center justify-center p-2 overflow-hidden flex-shrink-0">
                                            <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="flex-1">
                                            <Link href={`/product/${item.id}`} className="font-bold text-sm text-[var(--foreground)] hover:underline">
                                                {item.name}
                                            </Link>
                                            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest mt-0.5">{item.category}</div>
                                        </div>
                                        <div className="font-black text-[var(--foreground)]">
                                            ${item.price.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Footer */}
                            <div className="mt-6 pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-rose-500 text-xs">
                                    {order.status === 'Pending' && (
                                        <>
                                            <AlertCircle size={14} />
                                            <span>You can cancel this order before it is confirmed.</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                    {order.status === 'Pending' && (
                                        <button 
                                            onClick={() => handleCancel(order.id)}
                                            disabled={cancellingId === order.id}
                                            className="text-xs font-bold text-rose-500 hover:text-rose-400 uppercase tracking-widest disabled:opacity-50"
                                        >
                                            {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                                        </button>
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
