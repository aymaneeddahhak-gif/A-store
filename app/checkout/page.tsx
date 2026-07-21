"use client"

import { useState, useEffect } from "react"
import { useShop } from "@/contexts/shop-context"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, ShoppingBag, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function CheckoutPage() {
    const { cart, user, placeOrder } = useShop()
    const router = useRouter()
    const [isProcessing, setIsProcessing] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (!user) {
            router.push('/login')
        } else if (cart.length === 0 && !success) {
            router.push('/')
        }
    }, [user, cart.length, router, success])

    if (!user) return null

    const subtotal = cart.reduce((sum, item) => sum + item.price, 0)
    const shipping = subtotal > 0 ? 15 : 0
    const total = subtotal + shipping

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsProcessing(true)

        // Simulate payment delay
        setTimeout(async () => {
            await placeOrder()
            setSuccess(true)
            setIsProcessing(false)
            
            // Redirect to orders after 2 seconds
            setTimeout(() => {
                router.push('/orders')
            }, 2000)
        }, 1500)
    }

    if (success) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
                <div className="w-full max-w-md p-8 bg-[var(--card)] border border-emerald-500/30 rounded-[32px] text-center shadow-2xl animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-[var(--foreground)] mb-2 uppercase tracking-tight">Payment Successful!</h2>
                    <p className="text-[var(--muted-foreground)] mb-8">Your order has been placed. Redirecting you to your orders...</p>
                    <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--foreground)] opacity-50 hover:opacity-100 transition-opacity uppercase tracking-widest mb-8">
                <ArrowLeft size={16} /> Back to Store
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Checkout Form */}
                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight mb-2">Checkout</h1>
                        <p className="text-[var(--muted-foreground)]">Please enter your shipping and payment details.</p>
                    </div>

                    <form onSubmit={handleCheckout} className="space-y-8">
                        {/* Shipping Details */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-widest border-b border-[var(--border-color)] pb-2">Shipping Information</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <input required type="text" placeholder="First Name" className="col-span-1 bg-[var(--card)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)]" />
                                <input required type="text" placeholder="Last Name" className="col-span-1 bg-[var(--card)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)]" />
                                <input required type="text" placeholder="Address" className="col-span-2 bg-[var(--card)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)]" />
                                <input required type="text" placeholder="City" className="col-span-1 bg-[var(--card)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)]" />
                                <input required type="text" placeholder="Postal Code" className="col-span-1 bg-[var(--card)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)]" />
                            </div>
                        </div>

                        {/* Payment Details (Mock) */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-widest border-b border-[var(--border-color)] pb-2 flex items-center justify-between">
                                Payment Details
                                <span className="text-[10px] bg-rose-500/20 text-rose-500 px-2 py-1 rounded-full flex items-center gap-1">
                                    <AlertCircle size={10} /> Test Mode
                                </span>
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 relative">
                                    <CreditCard className="absolute left-4 top-3 text-[var(--muted-foreground)]" size={20} />
                                    <input required type="text" placeholder="Card Number" defaultValue="4242 4242 4242 4242" className="w-full bg-[var(--card)] border border-[var(--border-color)] rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] font-mono" />
                                </div>
                                <input required type="text" placeholder="MM/YY" defaultValue="12/25" className="col-span-1 bg-[var(--card)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] font-mono" />
                                <input required type="text" placeholder="CVC" defaultValue="123" className="col-span-1 bg-[var(--card)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] font-mono" />
                            </div>
                        </div>

                        <button 
                            disabled={isProcessing}
                            className="w-full h-14 bg-[var(--foreground)] text-[var(--background)] rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-[var(--background)] border-t-transparent rounded-full animate-spin"></div>
                                    Processing Payment...
                                </>
                            ) : (
                                `Pay $${total.toFixed(2)}`
                            )}
                        </button>
                    </form>
                </div>

                {/* Order Summary */}
                <div className="lg:pl-12">
                    <div className="p-8 bg-[var(--card)] border border-[var(--border-color)] rounded-[32px] sticky top-24">
                        <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-6 flex items-center gap-2">
                            <ShoppingBag size={20} /> Order Summary
                        </h2>
                        
                        <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {cart.map((item, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-[var(--background)] rounded-xl border border-[var(--border-color)] flex items-center justify-center p-2 overflow-hidden flex-shrink-0">
                                        <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm text-[var(--foreground)]">{item.name}</div>
                                        <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest">{item.category}</div>
                                    </div>
                                    <div className="font-black text-[var(--foreground)]">
                                        ${item.price.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 pt-6 border-t border-[var(--border-color)] text-sm">
                            <div className="flex justify-between text-[var(--muted-foreground)] font-medium">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[var(--muted-foreground)] font-medium">
                                <span>Shipping</span>
                                <span>${shipping.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[var(--foreground)] font-black text-xl pt-3 border-t border-[var(--border-color)]">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
