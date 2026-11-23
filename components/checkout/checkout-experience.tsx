"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronRight,
  Minus,
  Plus,
  Trash2,
  Pencil,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useToast } from "@/contexts/toast-context"
import { useCart } from "@/contexts/providers/cart-context"
import { useAuth } from "@/contexts/providers/auth-context"
import { useOrders } from "@/contexts/providers/orders-context"
import { validatePromoAction } from "@/lib/actions/promos"
import { SHIPPING_FEE, type Order } from "@/lib/types"

/**
 * New checkout experience — white canvas card with the brand mascot video
 * on the left and a multi-step cart → shipping → payment → success flow on
 * the right.
 */

type Step = "cart" | "shipping" | "payment" | "success"

function FieldError({ message }: { message: string }) {
  if (!message) return null
  return <p className="text-[11px] text-red-500 font-medium mt-1">{message}</p>
}

export function CheckoutExperience() {
  const { selectedItems, selectedSubtotal, updateQuantity, removeFromCart, removeSelected, setCartOpen } =
    useCart()
  const { user, authLoading, updateProfileMetadata } = useAuth()
  const { placeOrder } = useOrders()
  const { showToast } = useToast()
  const reducedMotion = useReducedMotion()
  const router = useRouter()

  const [step, setStep] = useState<Step>("cart")
  const [isProcessing, setIsProcessing] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoPercent, setPromoPercent] = useState(0)
  const [promoError, setPromoError] = useState("")
  const [promoChecking, setPromoChecking] = useState(false)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Morocco",
    paymentMethod: "card",
    cardNumber: "",
    cardExp: "",
    cardCvc: "",
  })
  // Tracks visited fields so validation messages explain themselves.
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const markTouched = (field: string) =>
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }))

  useEffect(() => {
    if (authLoading) return
    if (!user) router.replace("/login?next=/checkout")
  }, [user, authLoading, router])

  // One-time autofill from the account + saved delivery address. Only fills
  // fields the shopper hasn't touched yet.
  const prefilledRef = useRef(false)
  useEffect(() => {
    if (prefilledRef.current || !user) return
    prefilledRef.current = true
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>
    const saved = (meta.address ?? {}) as Record<string, string>
    const fullName = typeof meta.full_name === "string" ? meta.full_name : ""
    const [first = "", ...rest] = fullName.split(" ")
    setFormData((prev) => ({
      ...prev,
      firstName: prev.firstName || saved.firstName || first,
      lastName: prev.lastName || saved.lastName || rest.join(" "),
      email: prev.email || user.email || "",
      address: prev.address || saved.address || "",
      city: prev.city || saved.city || "",
      postalCode: prev.postalCode || saved.postalCode || "",
      country: saved.country || prev.country,
    }))
  }, [user])

  const subtotal = selectedSubtotal
  const shipping = subtotal > 0 ? SHIPPING_FEE : 0
  // Derived so the discount tracks cart edits after the code is applied.
  const discount = promoApplied ? subtotal * (promoPercent / 100) : 0
  const total = Math.max(0, subtotal - discount + shipping)

  const emailValid = /.+@.+\..+/.test(formData.email.trim())
  // Per-field reasons shown under each input once visited.
  const fieldErrors: Record<string, string> = {
    firstName: formData.firstName.trim() ? "" : "First name is required.",
    lastName: formData.lastName.trim() ? "" : "Last name is required.",
    email: !formData.email.trim()
      ? "Email address is required."
      : !emailValid
        ? "Enter a valid email address (e.g. you@example.com)."
        : "",
    address: formData.address.trim() ? "" : "Street address is required.",
    city: formData.city.trim() ? "" : "City is required.",
    postalCode: formData.postalCode.trim() ? "" : "Postal code is required.",
  }
  const shippingValid =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    /.+@.+\..+/.test(formData.email.trim()) &&
    formData.address.trim() !== "" &&
    formData.city.trim() !== "" &&
    formData.postalCode.trim() !== ""
  const paymentValid =
    formData.paymentMethod !== "card" ||
    (formData.cardNumber.replace(/\D/g, "").length >= 12 &&
      formData.cardExp.trim().length >= 4 &&
      formData.cardCvc.trim().length >= 3)

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || promoChecking) return
    setPromoChecking(true)
    setPromoError("")
    try {
      const res = await validatePromoAction(promoCode)
      if (res.ok) {
        setPromoPercent(res.data.percent_off)
        setPromoApplied(true)
      } else {
        setPromoApplied(false)
        setPromoPercent(0)
        setPromoError(res.error)
      }
    } finally {
      setPromoChecking(false)
    }
  }

  const handleUpdateQuantity = (id: number, delta: number) => {
    const item = selectedItems.find((i) => i.id === id)
    if (!item) return
    updateQuantity(id, item.quantity + delta)
  }

  // Continue is always clickable: with missing details it marks every
  // field and names the first problem instead of sitting dead.
  const handleContinueToPayment = () => {
    const keys = ["firstName", "lastName", "email", "address", "city", "postalCode"] as const
    setTouched((prev) => {
      const next = { ...prev }
      for (const key of keys) next[key] = true
      return next
    })
    const firstBad = keys.find((key) => fieldErrors[key])
    if (firstBad) {
      showToast(fieldErrors[firstBad], "error")
      return
    }
    setStep("payment")
  }

  // Portfolio demo card — payment is simulated, nothing is charged.
  const fillDemoCard = () => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: "card",
      cardNumber: "4242 4242 4242 4242",
      cardExp: "08/28",
      cardCvc: "123",
    }))
  }

  const handlePlaceOrder = async () => {
    if (isProcessing || selectedItems.length === 0 || !shippingValid || !paymentValid) return
    setIsProcessing(true)
    window.dispatchEvent(new CustomEvent("start-delivery-loading", { detail: { message: "Processing Order" } }))
    const { order, field } = await placeOrder(
      selectedItems,
      promoApplied ? promoCode : undefined,
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
      }
    )
    setIsProcessing(false)
    window.dispatchEvent(new CustomEvent("stop-delivery-loading"))
    if (!order) {
      // Server-named field problem: jump back to shipping and highlight it
      // instead of dying on a cryptic error at the last step.
      if (field) {
        setStep("shipping")
        markTouched(field)
        showToast("Please fix your shipping details to continue.", "error")
      }
      return
    }
    // Snapshot the server order for the receipt BEFORE clearing the cart —
    // removeSelected() empties selectedItems, which must not bounce the user
    // home from the success step.
    setPlacedOrder(order)
    removeSelected()
    setStep("success")
    // Remember the delivery address on the profile for next checkout.
    // Best effort — the order already succeeded.
    void updateProfileMetadata({
      address: {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country,
      },
    }).catch(() => undefined)
    setTimeout(() => router.push("/profile?tab=orders"), 4000)
  }

  if (!authLoading && !user) {
    return (
      <div className="pt-2 pb-12 px-4 max-w-3xl mx-auto">
        <div className="bg-white rounded-[26px] shadow-2xl shadow-neutral-900/10 p-10 text-center space-y-4">
          <h2 className="text-lg font-bold text-neutral-900">Sign in to complete checkout</h2>
          <p className="text-xs text-neutral-500">
            Redirecting you to the login page so your order links to your account.
          </p>
          <Link
            href="/login?next=/checkout"
            prefetch
            className="inline-flex items-center justify-center bg-black hover:bg-neutral-800 text-white font-medium py-3 px-8 rounded-xl text-xs transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (step === "success" && placedOrder) {
    return (
      <div className="pt-0 pb-12 px-4 max-w-5xl mx-auto">
        <div className="w-full max-w-5xl mx-auto bg-white rounded-[26px] md:rounded-[32px] shadow-2xl shadow-neutral-900/10 p-8 md:p-12">
          <div className="text-center py-8 space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Thank you for your order!</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Order <span className="font-mono">{placedOrder.id}</span> is confirmed. A receipt
              has been sent to {formData.email || "your email"}. Taking you to your orders…
            </p>
            <div className="p-4 rounded-xl bg-[#f9f8f5] border border-neutral-100 text-left text-xs space-y-1.5 mt-4">
              <div className="flex justify-between">
                <span className="text-neutral-500">Estimated Delivery:</span>
                <span className="font-semibold text-neutral-900">2–4 business days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Shipping to:</span>
                <span className="font-semibold text-neutral-900">
                  {formData.city || "—"}, {formData.postalCode || "—"}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-neutral-200/60 font-bold text-neutral-900">
                <span>Total Paid:</span>
                <span>${placedOrder.total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => router.push("/profile?tab=orders")}
              className="w-full bg-black hover:bg-neutral-800 text-white font-medium py-3 rounded-xl text-xs transition-colors cursor-pointer"
            >
              View My Orders
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (selectedItems.length === 0) {
    return (
      <div className="pt-0 pb-12 px-4 max-w-5xl mx-auto">
        <div className="bg-white rounded-[26px] md:rounded-[32px] shadow-2xl shadow-neutral-900/10 p-12 text-center">
          <p className="text-sm text-neutral-500">Your bag is empty.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 bg-black hover:bg-neutral-800 text-white font-medium py-3 px-8 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="-mt-4 sm:-mt-6 lg:-mt-8 pb-10 px-4 max-w-[92rem] mx-auto">
      <div className="w-full bg-white rounded-[26px] md:rounded-[32px] shadow-2xl shadow-neutral-900/10 p-5 sm:p-7 md:p-8 relative">
        {/* Breadcrumb path */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm font-medium text-neutral-400 mb-3"
        >
          <Link href="/" className="hover:text-neutral-600 cursor-pointer transition-colors">
            Store
          </Link>
          <ChevronRight className="w-4 h-4 text-neutral-300" aria-hidden />
          <span className="text-neutral-500 font-medium">Checkout</span>
          <ChevronRight className="w-4 h-4 text-neutral-300" aria-hidden />
          <span className="text-neutral-500 font-medium capitalize">
            {step === "cart" ? "Bag" : step}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* ================= LEFT: MASCOT (larger, zero wasted top space) ================= */}
          <div className="w-full lg:col-span-7">
            <div className="relative flex w-full items-center justify-center select-none">
              <video
                src="/videos/mascot/checkoutcartvideotrsprnt.webm"
                autoPlay={!reducedMotion}
                muted
                loop
                playsInline
                preload="auto"
                aria-label="Store mascot with shopping cart"
                className="w-full h-auto max-h-[700px] object-contain"
              />
            </div>
            <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-widest text-neutral-400">
              Secure checkout
            </p>
          </div>

          {/* ================= RIGHT: MULTI-STEP CHECKOUT ================= */}
          <div className="w-full lg:col-span-5 flex flex-col rounded-2xl border border-neutral-100 bg-[#fbfaf8] overflow-hidden">
            {/* Step header */}
            <div className="px-6 sm:px-8 py-5 border-b border-neutral-100 flex items-center justify-between bg-white">
              <div>
                  <h2 className="text-lg font-bold text-neutral-900">
                    {step === "cart" && "Shopping Bag"}
                    {step === "shipping" && "Delivery Address"}
                    {step === "payment" && "Payment & Review"}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    {step === "cart" && `${selectedItems.length} item${selectedItems.length === 1 ? "" : "s"} in your bag`}
                    {step === "shipping" && "Step 2 of 3 • Shipping details"}
                    {step === "payment" && "Step 3 of 3 • Secure payment"}
                  </p>
                </div>
              <Link
                href="/"
                className="p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
                aria-label="Close checkout"
              >
                ✕
              </Link>
            </div>

            {/* Step body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {step === "cart" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                      {selectedItems.length} item{selectedItems.length === 1 ? "" : "s"} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setCartOpen(true)}
                      className="text-[11px] font-bold uppercase tracking-widest text-neutral-900 hover:text-black transition-colors cursor-pointer dark:text-white"
                    >
                      Edit bag
                    </button>
                  </div>
                  <div className="space-y-3.5">
                    {selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3.5 p-3 rounded-xl bg-[#f9f8f5] border border-neutral-100"
                      >
                        <div className="w-16 h-16 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 border border-neutral-200/60">
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-neutral-900 truncate">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-neutral-500 mt-0.5 capitalize">
                            {item.category}
                            {item.color ? ` · ${item.color}` : ""}
                            {item.size ? ` · Size ${item.size}` : ""}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-bold text-neutral-900">
                              ${item.price.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-md px-1.5 py-0.5">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                className="p-0.5 text-neutral-500 hover:text-black cursor-pointer"
                                aria-label={`Decrease quantity of ${item.name}`}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-medium px-1 select-none">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                className="p-0.5 text-neutral-500 hover:text-black cursor-pointer"
                                aria-label={`Increase quantity of ${item.name}`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                          {/* Edit badge — opens the product's color/size picker in edit mode */}
                          <button
                            onClick={() => router.push(`/product/${item.id}?edit=1`)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
                            aria-label={`Edit ${item.name} options`}
                            title="Edit color / size"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Promo code */}
                  <div className="pt-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1 text-xs bg-[#f4f5f7] rounded-lg px-3.5 py-2.5 outline-none border border-transparent focus:border-neutral-300"
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={promoChecking}
                        className="text-xs font-medium bg-neutral-900 text-white px-4 py-2.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {promoChecking ? "…" : "Apply"}
                      </button>
                    </div>
                    {promoApplied && (
                      <p className="text-[11px] text-emerald-600 mt-1.5 font-medium">
                        ✓ {promoPercent}% off applied! You saved ${discount.toFixed(2)}.
                      </p>
                    )}
                    {!promoApplied && promoError && (
                      <p className="text-[11px] text-red-500 mt-1.5 font-medium">{promoError}</p>
                    )}
                  </div>
                </>
              )}

              {step === "shipping" && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">First Name</label>
                      <input
                        required
                        autoComplete="given-name"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        onBlur={() => markTouched("firstName")}
                        className="w-full bg-[#f4f5f7] rounded-lg px-3.5 py-3 text-sm outline-none border border-transparent focus:border-neutral-300"
                      />
                      {touched.firstName && <FieldError message={fieldErrors.firstName} />}
                    </div>
                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">Last Name</label>
                      <input
                        required
                        autoComplete="family-name"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        onBlur={() => markTouched("lastName")}
                        className="w-full bg-[#f4f5f7] rounded-lg px-3.5 py-3 text-sm outline-none border border-transparent focus:border-neutral-300"
                      />
                      {touched.lastName && <FieldError message={fieldErrors.lastName} />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1 font-medium">Email Address</label>
                      <input
                        required
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onBlur={() => markTouched("email")}
                        className="w-full bg-[#f4f5f7] rounded-lg px-3.5 py-3 text-sm outline-none border border-transparent focus:border-neutral-300"
                      />
                      {touched.email && <FieldError message={fieldErrors.email} />}
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1 font-medium">Street Address</label>
                      <input
                        required
                        autoComplete="street-address"
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        onBlur={() => markTouched("address")}
                        className="w-full bg-[#f4f5f7] rounded-lg px-3.5 py-3 text-sm outline-none border border-transparent focus:border-neutral-300"
                      />
                      {touched.address && <FieldError message={fieldErrors.address} />}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">City</label>
                      <input
                        required
                        autoComplete="address-level2"
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        onBlur={() => markTouched("city")}
                        className="w-full bg-[#f4f5f7] rounded-lg px-3.5 py-3 text-sm outline-none border border-transparent focus:border-neutral-300"
                      />
                      {touched.city && <FieldError message={fieldErrors.city} />}
                    </div>
                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">Postal Code</label>
                      <input
                        required
                        autoComplete="postal-code"
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        onBlur={() => markTouched("postalCode")}
                        className="w-full bg-[#f4f5f7] rounded-lg px-3.5 py-3 text-sm outline-none border border-transparent focus:border-neutral-300"
                      />
                      {touched.postalCode && <FieldError message={fieldErrors.postalCode} />}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-black bg-[#fdfcf9] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-neutral-900">Express Delivery</p>
                      <p className="text-[11px] text-neutral-500">Delivered in 2–4 business days</p>
                    </div>
                    <span className="font-bold text-neutral-900">${SHIPPING_FEE.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {step === "payment" && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    {(["card", "apple", "paypal"] as const).map((method) => (
                      <button
                        key={method}
                        onClick={() => setFormData({ ...formData, paymentMethod: method })}
                        className={`py-2 px-3 rounded-lg border text-center font-medium cursor-pointer transition-colors ${
                          formData.paymentMethod === method
                            ? "border-black bg-black text-white"
                            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                        }`}
                      >
                        {method === "card" ? "Card" : method === "apple" ? "Pay" : "PayPal"}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500 font-medium">
                      Demo checkout — no real charge.
                    </span>
                    <button
                      type="button"
                      onClick={fillDemoCard}
                      className="text-[11px] font-bold text-neutral-900 underline underline-offset-2 hover:text-black transition-colors cursor-pointer"
                    >
                      Use demo card
                    </button>
                  </div>

                  {formData.paymentMethod === "card" && (
                    <div className="space-y-3 pt-1">
                      {Array.isArray(user?.user_metadata?.payment_cards) &&
                        (user.user_metadata.payment_cards as Array<{ id: string; brand: string; last4: string; exp: string }>).length > 0 && (
                          <div className="space-y-1.5">
                            <span className="block text-[11px] font-medium text-neutral-500">
                              Saved Profile Cards
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(user.user_metadata.payment_cards as Array<{ id: string; brand: string; last4: string; exp: string }>).map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      cardNumber: `4242 4242 4242 ${c.last4}`,
                                      cardExp: c.exp,
                                      cardCvc: "123",
                                    }))
                                  }
                                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:border-black text-[11px] font-semibold text-neutral-800 cursor-pointer transition-colors"
                                >
                                  {c.brand} •••• {c.last4} ({c.exp})
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      <div>
                        <label className="block text-neutral-600 mb-1 font-medium">
                          Card Number
                        </label>
                        <input
                          required
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="•••• •••• •••• 4242"
                          value={formData.cardNumber}
                          onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                          className="w-full bg-[#f4f5f7] rounded-lg px-3.5 py-3 text-sm outline-none border border-transparent focus:border-neutral-300 font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-neutral-600 mb-1 font-medium">Expires</label>
                          <input
                            required
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            placeholder="08/28"
                            value={formData.cardExp}
                            onChange={(e) => setFormData({ ...formData, cardExp: e.target.value })}
                            className="w-full bg-[#f4f5f7] rounded-lg px-3.5 py-3 text-sm outline-none border border-transparent focus:border-neutral-300 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-neutral-600 mb-1 font-medium">CVC</label>
                          <input
                            required
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            placeholder="•••"
                            value={formData.cardCvc}
                            onChange={(e) => setFormData({ ...formData, cardCvc: e.target.value })}
                            className="w-full bg-[#f4f5f7] rounded-lg px-3.5 py-3 text-sm outline-none border border-transparent focus:border-neutral-300 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-neutral-500 pt-1 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>256-bit encrypted secure checkout — payment is simulated, no card is charged.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer calculations & step action */}
            <div className="px-6 sm:px-8 py-5 border-t border-neutral-100 bg-[#fbfaf8] space-y-3.5">
              <div className="space-y-2 text-sm text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-900">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-neutral-900">
                    {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-200 text-base font-bold text-neutral-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {step === "cart" && (
                <button
                  onClick={() => setStep("shipping")}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-medium py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {step === "shipping" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep("cart")}
                    className="px-4 py-3 border border-neutral-200 bg-white text-neutral-800 rounded-xl text-xs font-medium hover:bg-neutral-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleContinueToPayment}
                    className="flex-1 bg-black hover:bg-neutral-800 text-white font-medium py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {step === "payment" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep("shipping")}
                    className="px-4 py-3 border border-neutral-200 bg-white text-neutral-800 rounded-xl text-xs font-medium hover:bg-neutral-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing || !shippingValid || !paymentValid}
                    title={!paymentValid ? "Enter your card details" : undefined}
                    className="flex-1 bg-black hover:bg-neutral-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing…</span>
                      </>
                    ) : (
                      <span>Pay ${total.toFixed(2)}</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
