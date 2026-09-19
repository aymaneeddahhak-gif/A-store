"use client"

import { useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { useCart } from "@/contexts/providers/cart-context"
import { X, Trash2, ArrowRight, ShoppingBag, Minus, Plus, Check } from "lucide-react"
import { useRouter } from "next/navigation"

export function CartDrawer() {
    const {
        cart,
        selectedItems,
        selectedCount,
        selectedSubtotal,
        allSelected,
        isCartOpen,
        setCartOpen,
        removeFromCart,
        updateQuantity,
        toggleSelected,
        setAllSelected,
    } = useCart()
    const router = useRouter()
    const panelRef = useRef<HTMLDivElement>(null)

    const closeCart = useCallback(() => setCartOpen(false), [setCartOpen])

    // Escape closes the drawer — expected of any overlay surface.
    useEffect(() => {
        if (!isCartOpen) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeCart()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [isCartOpen, closeCart])

    return (
        <>
            {/* Backdrop */}
            {isCartOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
                    onClick={closeCart}
                />
            )}

            {/* Drawer */}
            <div
                ref={panelRef}
                role="dialog"
                aria-modal={isCartOpen}
                aria-label="Shopping cart"
                aria-hidden={!isCartOpen}
                className={`
          fixed top-0 right-0 h-full w-full max-w-[min(100%,420px)] z-[60]
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
                            ({selectedCount} selected)
                        </span>
                    </h2>
                    <button
                        type="button"
                        onClick={closeCart}
                        aria-label="Close cart"
                        className="p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Select all */}
                {cart.length > 0 && (
                    <div className="px-6 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer select-none group/all">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={allSelected}
                                onChange={(e) => setAllSelected(e.target.checked)}
                            />
                            <span
                                aria-hidden
                                className="w-5 h-5 rounded-md border border-[var(--border-color)] bg-[var(--glass-bg)] flex items-center justify-center transition-all peer-checked:bg-[var(--foreground)] peer-checked:border-[var(--foreground)] peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--foreground)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--drawer-bg)] group-hover/all:border-[var(--foreground)]"
                            >
                                <Check
                                    size={13}
                                    strokeWidth={3}
                                    className="text-[var(--background)] opacity-0 transition-opacity"
                                />
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                                Select all ({cart.length})
                            </span>
                        </label>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                            {selectedItems.length}/{cart.length}
                        </span>
                    </div>
                )}

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 gap-3">
                            <ShoppingBag size={40} className="opacity-30" aria-hidden />
                            <p className="text-[var(--foreground)]">Your cart is empty.</p>
                            <p className="text-sm text-[var(--muted-foreground)]">Start adding some premium gear.</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div
                                key={item.id}
                                className={`flex gap-3 p-4 rounded-2xl border transition-all group ${
                                    item.selected
                                        ? "bg-[var(--glass-bg)] border-[var(--border-color)]"
                                        : "bg-transparent border-dashed border-[var(--border-color)] opacity-60"
                                }`}
                            >
                                <label className="flex items-start pt-1 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={item.selected}
                                        onChange={() => toggleSelected(item.id)}
                                        aria-label={`Include ${item.name} in checkout`}
                                    />
                                    <span
                                        aria-hidden
                                        className="w-5 h-5 rounded-md border border-[var(--border-color)] bg-[var(--glass-bg)] flex items-center justify-center transition-all peer-checked:bg-[var(--foreground)] peer-checked:border-[var(--foreground)] peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--foreground)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--drawer-bg)] hover:border-[var(--foreground)]"
                                    >
                                        <Check
                                            size={13}
                                            strokeWidth={3}
                                            className="text-[var(--background)] opacity-0 transition-opacity"
                                        />
                                    </span>
                                </label>
                                <div className="w-20 h-20 rounded-xl bg-[var(--glass-bg)] overflow-hidden relative shrink-0">
                                    <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h3 className="font-bold text-[var(--foreground)] leading-tight truncate">{item.name}</h3>
                                    <p className="text-[var(--silver-medium)] text-sm truncate capitalize">{item.category} · ${item.price.toFixed(2)} each</p>
                                    <div className="flex items-center justify-between mt-2 gap-2">
                                        <div className="flex items-center rounded-lg border border-[var(--border-color)]">
                                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`} className="p-1.5 hover:bg-[var(--glass-highlight)] rounded-l-lg"><Minus size={13} /></button>
                                            <span className="w-7 text-center text-xs font-bold">{item.quantity}</span>
                                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`} className="p-1.5 hover:bg-[var(--glass-highlight)] rounded-r-lg"><Plus size={13} /></button>
                                        </div>
                                        <span className="text-[var(--electric-light-color)] font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFromCart(item.id)}
                                            aria-label={`Remove ${item.name} from cart`}
                                            className="text-[var(--muted-foreground)] hover:text-[var(--destructive-foreground)] transition-colors"
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
                        <span className="text-[var(--muted-foreground)]">
                            Total
                            <span className="ml-2 text-[11px] font-bold uppercase tracking-widest opacity-60">
                                {selectedCount} item{selectedCount === 1 ? "" : "s"}
                            </span>
                        </span>
                        <span className="text-2xl font-bold text-[var(--foreground)]">
                            ${selectedSubtotal.toFixed(2)}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (selectedItems.length > 0) {
                                closeCart()
                                router.push("/checkout")
                            }
                        }}
                        disabled={selectedItems.length === 0}
                        className="w-full py-4 bg-[var(--hero-btn-bg)] text-[var(--hero-btn-text)] font-bold rounded-xl hover:bg-[var(--hero-btn-hover)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {selectedItems.length === 0 ? "Select items to checkout" : "Checkout"}
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </div>
        </>
    )
}
