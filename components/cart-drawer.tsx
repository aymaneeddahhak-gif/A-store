"use client"

import { useShop } from "@/contexts/shop-context"
import { X, Trash2, ArrowRight, ShoppingBag } from "lucide-react"
import { useRouter } from "next/navigation"

export function CartDrawer() {
    const { cart, isCartOpen, toggleCart, removeFromCart } = useShop()
    const router = useRouter()

    return (
        <>
            {/* Backdrop */}
            {isCartOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
                    onClick={toggleCart}
                />
            )}

            {/* Drawer */}
            <div
                className={`
          fixed top-0 right-0 h-full w-full max-w-[min(100%,400px)] z-[60]
          bg-[var(--drawer-bg)] border-l border-[var(--border-color)] 
          shadow-[-20px_0_50px_rgba(0,0,0,0.3)]
          transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
          flex flex-col backdrop-blur-xl
          ${isCartOpen ? "translate-x-0" : "translate-x-full"}
        `}
            >
                {/* Header */}
                <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2">
                        Your Cart
                        <span className="text-[var(--electric-light-color)] text-sm font-normal">
                            ({cart.length} items)
                        </span>
                    </h2>
                    <button
                        type="button"
                        onClick={toggleCart}
                        aria-label="Close cart"
                        className="p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 gap-3">
                            <ShoppingBag size={40} className="opacity-30" aria-hidden />
                            <p className="text-[var(--foreground)]">Your cart is empty.</p>
                            <p className="text-sm text-[var(--muted-foreground)]">Start adding some premium gear.</p>
                        </div>
                    ) : (
                        cart.map((item, index) => (
                            <div
                                key={`${item.id}-${index}`}
                                className="flex gap-4 p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--border-color)] group"
                            >
                                <div className="w-20 h-20 rounded-xl bg-[var(--glass-bg)] overflow-hidden relative shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <h3 className="font-bold text-[var(--foreground)] leading-tight">{item.name}</h3>
                                    <p className="text-[var(--silver-medium)] text-sm">{item.category}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[var(--electric-light-color)] font-medium">${item.price}</span>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-[var(--muted-foreground)] hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Checkout */}
                <div className="p-6 border-t border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[var(--muted-foreground)]">Total</span>
                        <span className="text-2xl font-bold text-[var(--foreground)]">
                            ${cart.reduce((acc, item) => acc + item.price, 0)}
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            if (cart.length > 0) {
                                toggleCart()
                                router.push('/checkout')
                            }
                        }}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-[var(--hero-btn-bg)] text-[var(--hero-btn-text)] font-bold rounded-xl hover:bg-[var(--hero-btn-hover)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Checkout
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </div>
        </>
    )
}
