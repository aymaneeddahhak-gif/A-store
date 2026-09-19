"use client"

import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Camera,
  Heart,
  Globe,
  MapPin,
  CreditCard,
  LogOut,
  Check,
  Eye,
  EyeOff,
  ChevronDown,
  User,
  X,
  ShoppingBag,
  Truck,
  Copy,
  Package,
} from "lucide-react"
import { useAuth } from "@/contexts/providers/auth-context"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { useLikes } from "@/contexts/providers/likes-context"
import { useOrders } from "@/contexts/providers/orders-context"
import { useToast } from "@/contexts/toast-context"
import { OrderStatusPill } from "@/components/orders/order-status"
import { getStatusStyle, shortOrderId } from "@/components/seller/order-manager"
import { supabase } from "@/lib/supabase"
import { uploadMediaAction } from "@/lib/actions/media"
import { ProfileSkeleton } from "@/components/loading-skeletons"
import type { ShippingAddress } from "@/lib/types"

export type ProfileTab = "edit-profile" | "orders" | "favourites" | "language" | "address" | "payment"

export interface SavedCard {
  id: string
  brand: string
  last4: string
  exp: string
  name: string
}

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "fr", label: "Français" },
  { id: "ar", label: "العربية" },
]

const VALID_TABS: ProfileTab[] = ["edit-profile", "orders", "favourites", "language", "address", "payment"]

/** Shared card + form styles — the profile's design language. */
const cardCls =
  "bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/10 rounded-3xl shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
const labelCls =
  "block text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500 mb-1.5"
const inputCls =
  "w-full bg-[#f8f9fa] hover:bg-[#f3f4f6] focus:bg-white dark:bg-white/5 dark:hover:bg-white/10 dark:focus:bg-white/10 text-[14px] text-[#4b5563] focus:text-[#1c1c1e] dark:text-[var(--foreground)] rounded-xl px-4 py-3 outline-none border border-transparent focus:border-gray-200 dark:focus:border-white/20 focus:ring-3 focus:ring-gray-100 dark:focus:ring-white/10 transition-all"

function detectBrand(digits: string): string {
  if (/^4/.test(digits)) return "Visa"
  if (/^(5|2)/.test(digits)) return "Mastercard"
  if (/^3/.test(digits)) return "Amex"
  return "Card"
}

/** Downscales an image to max 512px JPEG for uploads. */
function downscaleImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, 512 / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("encode failed"))
            return
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }))
        },
        "image/jpeg",
        0.82
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("decode failed"))
    }
    img.src = url
  })
}

/** Fulfillment pipeline — every order moves through these stages in order. */
const TRACK_STAGES = [
  { title: "Order Placed", subtitle: "We received your order." },
  { title: "Confirmed", subtitle: "Payment authorized." },
  { title: "Processing", subtitle: "Packing your items." },
  { title: "Shipped", subtitle: "Handed to the carrier." },
  { title: "Delivered", subtitle: "Package received." },
] as const

const STAGE_INDEX: Record<string, number> = {
  Pending: 0,
  Confirmed: 1,
  Processing: 2,
  Shipped: 3,
  Delivered: 4,
}

function shortDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function ProfileClient() {
  const { user, authLoading, signOut } = useAuth()
  const { products } = useCatalog()
  const { likedProducts, toggleLike } = useLikes()
  const { orders } = useOrders()
  const { showToast } = useToast()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<ProfileTab>("edit-profile")
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [phoneCode, setPhoneCode] = useState("+212")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [ordersFilter, setOrdersFilter] = useState<"all" | "in-transit" | "delivered">("all")
  const [copiedCode, setCopiedCode] = useState(false)
  // Floating profile menu (hover flyout, like the seller rail).
  const [menuOpen, setMenuOpen] = useState(false)
  // Address editor
  const [editingAddress, setEditingAddress] = useState(false)
  const [addressForm, setAddressForm] = useState({ firstName: "", lastName: "", address: "", city: "", postalCode: "", country: "" })
  const [savingAddress, setSavingAddress] = useState(false)
  // Language + saved cards
  const [language, setLanguage] = useState("en")
  const [cards, setCards] = useState<SavedCard[]>([])
  const [addingCard, setAddingCard] = useState(false)
  const [cardForm, setCardForm] = useState({ number: "", exp: "", cvc: "", name: "" })
  const [savingCard, setSavingCard] = useState(false)

  // Seed the form once the account loads (auth resolves after first paint).
  useEffect(() => {
    if (!user) return
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>
    const str = (v: unknown) => (typeof v === "string" ? v : "")
    setName(str(meta.full_name))
    setUsername(str(meta.username) || (user.email ? `@${user.email.split("@")[0]}` : ""))
    setPhoneCode(str(meta.phone_code) || "+212")
    setPhoneNumber(str(meta.phone_number))
    setLanguage(str(meta.language) || localStorage.getItem("locale") || "en")
    const storedCards = Array.isArray(meta.payment_cards) ? (meta.payment_cards as SavedCard[]) : []
    setCards(storedCards.filter((c) => c && typeof c.last4 === "string"))
    // Deep link: /profile?tab=orders lands on the orders tab.
    const tab = new URLSearchParams(window.location.search).get("tab")
    if (tab && (VALID_TABS as string[]).includes(tab)) setActiveTab(tab as ProfileTab)
  }, [user])

  if (authLoading) return <ProfileSkeleton />

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-[var(--card)] border border-[var(--border-color)] rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-[var(--muted-foreground)]" />
        </div>
        <h2 className="text-2xl font-black uppercase text-[var(--foreground)] mb-2">Access Restricted</h2>
        <p className="text-sm text-[var(--muted-foreground)] max-w-md mb-6">
          Please log in to manage your account profile, addresses, and order history.
        </p>
        <Link
          href="/login"
          className="px-6 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          Go to Sign In
        </Link>
      </div>
    )
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const email = user.email || "No email provided"
  const avatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : ""
  const savedAddress = (meta.address ?? {}) as Partial<ShippingAddress>
  const favouriteItems = products.filter((p) => likedProducts.includes(p.id))

  // Real orders only — newest first (the query already sorts desc).
  const transitCount = orders.filter((o) => o.status === "Processing" || o.status === "Shipped").length
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length
  const visibleOrders = orders.filter((o) => {
    if (ordersFilter === "in-transit") return o.status === "Processing" || o.status === "Shipped"
    if (ordersFilter === "delivered") return o.status === "Delivered"
    return true
  })
  const selectedOrder = visibleOrders.find((o) => o.id === selectedOrderId) ?? visibleOrders[0] ?? null
  const selectedIdx = selectedOrder ? (STAGE_INDEX[selectedOrder.status] ?? 0) : 0
  const selectedCancelled = selectedOrder?.status === "Cancelled"
  const selectedTracking = selectedOrder
    ? selectedOrder.tracking_number || `TRK-${selectedOrder.id.slice(0, 8).toUpperCase()}`
    : ""
  const selectedEta = selectedOrder
    ? shortDate(new Date(new Date(selectedOrder.created_at).getTime() + 4 * 86400000).toISOString()) || "—"
    : "—"
  const destinationLine = [savedAddress.address, savedAddress.city, savedAddress.postalCode]
    .filter(Boolean)
    .join(", ")

  const navMenuItems = [
    { id: "orders" as const, label: "My Orders", icon: ShoppingBag, count: String(orders.length), detail: null as string | null },
    { id: "favourites" as const, label: "Favourites", icon: Heart, count: null as string | null, detail: null as string | null },
    { id: "language" as const, label: "Language", icon: Globe, count: null as string | null, detail: "English" },
    { id: "address" as const, label: "Address", icon: MapPin, count: null as string | null, detail: null as string | null },
    { id: "payment" as const, label: "Payment", icon: CreditCard, count: null as string | null, detail: null as string | null },
  ]

  const copyTrackingNumber = async () => {
    if (!selectedTracking) return
    try {
      await navigator.clipboard.writeText(selectedTracking)
      setCopiedCode(true)
      window.setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      showToast("Could not copy the tracking number.", "error")
    }
  }

  const handleSave = async () => {
    if (saving) return
    if (!name.trim()) {
      showToast("Name is required.", "error")
      return
    }
    if (newPassword && newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error")
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        ...(newPassword ? { password: newPassword } : {}),
        data: {
          full_name: name.trim(),
          username: username.trim(),
          phone_code: phoneCode.trim(),
          phone_number: phoneNumber.trim(),
        },
      })
      if (error) {
        showToast(error.message, "error")
        return
      }
      setNewPassword("")
      showToast("Profile changes successfully saved!", "success", undefined, {
        title: "Profile saved!",
        wave: true,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file || uploading) return
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.", "error")
      return
    }
    setUploading(true)
    try {
      // Downscale phone photos to max 512px JPEG before upload — the raw
      // file would blow past the server-action body limit (hence the 500).
      const scaled =
        file.size > 400 * 1024 ? await downscaleImage(file).catch(() => null) : file
      if (!scaled) {
        showToast("Could not read that image.", "error")
        return
      }
      if (scaled.size > 4.5 * 1024 * 1024) {
        showToast("That image is too large even compressed.", "error")
        return
      }
      const fd = new FormData()
      fd.append("file", scaled)
      const res = await uploadMediaAction(fd)
      if (!res.ok) {
        showToast(res.error, "error")
        return
      }
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: res.data.url } })
      if (error) showToast(error.message, "error")
      else showToast("Profile photo updated.", "success")
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  const startEditAddress = () => {
    setAddressForm({
      firstName: typeof savedAddress.firstName === "string" ? savedAddress.firstName : "",
      lastName: typeof savedAddress.lastName === "string" ? savedAddress.lastName : "",
      address: typeof savedAddress.address === "string" ? savedAddress.address : "",
      city: typeof savedAddress.city === "string" ? savedAddress.city : "",
      postalCode: typeof savedAddress.postalCode === "string" ? savedAddress.postalCode : "",
      country: typeof savedAddress.country === "string" ? savedAddress.country : "",
    })
    setEditingAddress(true)
  }

  const saveAddress = async () => {
    if (savingAddress) return
    if (!addressForm.address.trim() || !addressForm.city.trim()) {
      showToast("Street address and city are required.", "error")
      return
    }
    setSavingAddress(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { address: addressForm } })
      if (error) {
        showToast(error.message, "error")
        return
      }
      showToast("Delivery address saved.", "success", undefined, {
        title: "Address saved!",
        wave: true,
      })
      setEditingAddress(false)
    } finally {
      setSavingAddress(false)
    }
  }

  const selectLanguage = async (id: string) => {
    setLanguage(id)
    localStorage.setItem("locale", id)
    document.documentElement.lang = id
    const { error } = await supabase.auth.updateUser({ data: { language: id } })
    if (error) showToast(error.message, "error")
    else showToast("Language preference saved.", "success")
  }

  const saveCard = async () => {
    if (savingCard) return
    const digits = cardForm.number.replace(/\D/g, "")
    const expMatch = cardForm.exp.match(/^(0[1-9]|1[0-2])\/(\d{2})$/)
    const expValid =
      expMatch !== null &&
      new Date(2000 + Number(expMatch[2]), Number(expMatch[1])) > new Date()
    if (digits.length < 15 || digits.length > 16) {
      showToast("Card number must be 15–16 digits.", "error")
      return
    }
    if (!expValid) {
      showToast("Expiry must be MM/YY in the future.", "error")
      return
    }
    if (!/^\d{3,4}$/.test(cardForm.cvc.trim())) {
      showToast("CVC must be 3–4 digits.", "error")
      return
    }
    if (!cardForm.name.trim()) {
      showToast("Name on card is required.", "error")
      return
    }
    if (cards.length >= 4) {
      showToast("You can save up to 4 cards.", "error")
      return
    }
    // Only the last 4 ever leave the form — full numbers are never stored.
    const next: SavedCard[] = [
      ...cards,
      {
        id: crypto.randomUUID(),
        brand: detectBrand(digits),
        last4: digits.slice(-4),
        exp: cardForm.exp,
        name: cardForm.name.trim(),
      },
    ]
    setSavingCard(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { payment_cards: next } })
      if (error) {
        showToast(error.message, "error")
        return
      }
      setCards(next)
      setCardForm({ number: "", exp: "", cvc: "", name: "" })
      setAddingCard(false)
      showToast("Card saved.", "success")
    } finally {
      setSavingCard(false)
    }
  }

  const removeCard = async (id: string) => {
    const next = cards.filter((c) => c.id !== id)
    const { error } = await supabase.auth.updateUser({ data: { payment_cards: next } })
    if (error) {
      showToast(error.message, "error")
      return
    }
    setCards(next)
    showToast("Card removed.", "success")
  }

  return (
    <div className="relative w-full">
      {/* The profile navigation lives in a hover flyout off the floating
          profile icon (same interaction as the seller dashboard rail), so
          the details section gets the full page width. */}
      <div
        className="fixed right-4 sm:right-6 top-24 z-40"
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open profile menu"
              aria-expanded={menuOpen}
              className="w-12 h-12 rounded-full overflow-hidden bg-[#1c1c1e] dark:bg-white text-white dark:text-black border-2 border-white dark:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.15)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5" aria-hidden />
              )}
            </button>

            {menuOpen && (
              // pt-3 bridges the gap so the mouse can travel from the icon
              // into the panel without it closing.
              <div className="absolute right-0 top-full pt-3">
                <div className={`w-72 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${cardCls}`}>
                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt=""
                          width={40}
                          height={40}
                          unoptimized
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1c1c1e] dark:text-[var(--foreground)] truncate">
                        {name || "Valued Customer"}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{username || email}</p>
                    </div>
                  </div>

                  <div className="p-2 flex flex-col space-y-0.5">
                    {navMenuItems.map((item) => {
                      const Icon = item.icon
                      const isActive = activeTab === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl transition-all text-left cursor-pointer group ${
                            isActive
                              ? "bg-[#1c1c1e] dark:bg-white text-white dark:text-black"
                              : "text-[#374151] dark:text-neutral-300 hover:bg-gray-100/70 dark:hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 stroke-[1.8]" />
                            <span className={`text-sm ${isActive ? "font-semibold" : "font-normal"}`}>
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.count !== null && (
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-neutral-300"}`}>
                                {item.count}
                              </span>
                            )}
                            {item.detail && (
                              <span className={`text-xs hidden sm:inline ${isActive ? "text-white/70 dark:text-black/60" : "text-gray-400"}`}>
                                {item.detail}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="p-2 border-t border-gray-100 dark:border-white/10">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-[#374151] dark:text-neutral-300 hover:text-[#eb483f] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left cursor-pointer group"
                    >
                      <LogOut className="w-4 h-4 stroke-[1.8]" />
                      <span className="text-sm font-medium">Log out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ================= Content (full width) ================= */}
          <div className="min-w-0">
            {activeTab === "edit-profile" ? (
              <div className={`${cardCls} p-4 sm:p-5`}>
                {/* Header */}
                <div className="pb-4 mb-5 border-b border-gray-100 dark:border-white/10">
                  <h2 className="text-2xl font-bold text-[#1c1c1e] dark:text-[var(--foreground)] tracking-tight">
                    Edit Profile
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-[var(--muted-foreground)]">
                    Update your account details and contact information
                  </p>
                </div>

                {/* Avatar with Camera badge */}
                <div className="flex flex-col items-center justify-center my-2">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-white/10 ring-2 ring-black/5 shadow-sm flex items-center justify-center">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={name || "Profile photo"}
                          width={64}
                          height={64}
                          unoptimized
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-9 h-9 text-gray-400" aria-hidden />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      aria-label="Change profile photo"
                      className="absolute -bottom-1 -right-1 bg-white dark:bg-white/10 rounded-full p-2 shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-white/10 hover:scale-105 transition-transform cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4 text-[#374151] dark:text-[var(--foreground)] stroke-[2]" />
                    </button>
                    {/* Hidden picker — the camera badge triggers it. */}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        void handleAvatarFile(e.target.files?.[0])
                        e.target.value = ""
                      }}
                    />
                  </div>
                  <span className="text-[12px] text-gray-400 mt-2">
                    {uploading ? "Uploading…" : "Change Profile Photo"}
                  </span>
                </div>

                {/* Form Fields */}
                <div className="mt-2 space-y-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500 mb-3">
                      Personal
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className={inputCls}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>User name</label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="@username"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500 mb-3">
                      Contact & security
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className={labelCls}>E mail address</label>
                    <input type="email" value={email} disabled aria-label="Email address (managed by sign-in)" className={`${inputCls} opacity-60 cursor-not-allowed`} />
                  </div>

                  <div>
                    <label className={labelCls}>New password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        autoComplete="new-password"
                        className="w-full bg-[#f8f9fa] hover:bg-[#f3f4f6] focus:bg-white dark:bg-white/5 dark:hover:bg-white/10 dark:focus:bg-white/10 text-[14px] text-[#4b5563] focus:text-[#1c1c1e] dark:text-[var(--foreground)] rounded-xl pl-4 pr-11 py-3 outline-none border border-transparent focus:border-gray-200 dark:focus:border-white/20 focus:ring-3 focus:ring-gray-100 dark:focus:ring-white/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3.5 p-1 text-[#4b5563] dark:text-neutral-400 hover:text-[#1c1c1e] dark:hover:text-white cursor-pointer"
                      >
                        {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Phone number</label>
                    <div className="flex items-center bg-[#f8f9fa] hover:bg-[#f3f4f6] focus-within:bg-white dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10 rounded-xl px-3.5 py-2.5 border border-transparent focus-within:border-gray-200 dark:focus-within:border-white/20 focus-within:ring-3 focus-within:ring-gray-100 dark:focus-within:ring-white/10 transition-all">
                      <div className="flex items-center gap-1 pr-2 text-[14px] text-[#4b5563] dark:text-[var(--foreground)] select-none">
                        <span>{phoneCode}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-[#6b7280]" />
                      </div>
                      <div className="w-[1px] h-5 bg-gray-200 dark:bg-white/10 mx-1.5" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="600000000"
                        className="w-full bg-transparent text-[14px] text-[#4b5563] focus:text-[#1c1c1e] dark:text-[var(--foreground)] pl-2 outline-none"
                      />
                    </div>
                  </div>
                    </div>
                  </div>
                  </div>

                {/* Save Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13.5px] font-medium text-white bg-[#eb483f] hover:bg-[#d93830] active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{saving ? "Saving…" : "Save Changes"}</span>
                  </button>
                </div>
              </div>
            ) : activeTab === "orders" ? (
              <div className="space-y-6">
                <div className={`${cardCls} p-6`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-[var(--foreground)] rounded-xl">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-[var(--foreground)]">My Orders & Tracking</h2>
                        <p className="text-xs text-gray-500 dark:text-[var(--muted-foreground)]">
                          Select any order to inspect live package logistics
                        </p>
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-white/5 rounded-xl text-xs font-medium">
                      {(
                        [
                          { id: "all" as const, label: `All (${orders.length})` },
                          { id: "in-transit" as const, label: `In Transit (${transitCount})` },
                          { id: "delivered" as const, label: `Delivered (${deliveredCount})` },
                        ]
                      ).map((pill) => (
                        <button
                          key={pill.id}
                          type="button"
                          onClick={() => setOrdersFilter(pill.id)}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            ordersFilter === pill.id
                              ? "bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-2xs font-semibold"
                              : "text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {visibleOrders.length === 0 || !selectedOrder ? (
                    <div className="py-12 text-center">
                      <Package className="w-10 h-10 text-gray-300 dark:text-neutral-600 mx-auto mb-3" aria-hidden />
                      <p className="text-sm font-bold text-gray-900 dark:text-[var(--foreground)]">
                        {orders.length === 0 ? "No orders yet" : "Nothing in this filter"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-[var(--muted-foreground)] mt-1 mb-5">
                        {orders.length === 0
                          ? "Your orders and live tracking will appear here after checkout."
                          : "Try a different filter."}
                      </p>
                      {orders.length === 0 && (
                        <button
                          type="button"
                          onClick={() => router.push("/")}
                          className="px-5 py-2.5 rounded-xl bg-[#eb483f] hover:bg-[#d93830] text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Start Shopping
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="pt-6 space-y-6">
                      {/* Orders table — same style as the seller dashboard */}
                      <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[40px] overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="text-[10px] uppercase tracking-widest opacity-40 font-black border-b border-[var(--border-color)]">
                                <th className="px-8 py-5 text-left">ID</th>
                                <th className="px-8 py-5 text-left">Items</th>
                                <th className="px-8 py-5 text-left">Total</th>
                                <th className="px-8 py-5 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                              {visibleOrders.map((order) => {
                                const first = order.items[0]
                                const count = order.items.reduce((n, i) => n + (i.quantity || 1), 0)
                                const isSelected = selectedOrder?.id === order.id
                                return (
                                  <tr
                                    key={order.id}
                                    onClick={() => setSelectedOrderId(order.id)}
                                    className={`transition-all cursor-pointer ${isSelected ? "bg-[var(--glass-bg)]" : "hover:bg-[var(--glass-bg)]"}`}
                                  >
                                    <td className="px-8 py-6 font-mono text-xs opacity-60">
                                      #{shortOrderId(order.id)}
                                    </td>
                                    <td className="px-8 py-6">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--background)] border border-[var(--border-color)] flex items-center justify-center text-[10px] font-bold shrink-0">
                                          {first?.image ? (
                                            <Image src={first.image} alt={first.name} width={32} height={32} className="w-full h-full object-cover" />
                                          ) : (
                                            "?"
                                          )}
                                        </div>
                                        <span className="text-xs font-semibold truncate max-w-56">
                                          {first?.name ?? "Order"}
                                          {order.items.length > 1 ? ` (+${order.items.length - 1})` : ""} · {count} item{count === 1 ? "" : "s"}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-8 py-6 font-bold text-sm">${order.total.toFixed(2)}</td>
                                    <td className="px-8 py-6 text-right">
                                      <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${getStatusStyle(order.status)}`}>
                                        {order.status}
                                      </span>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Live tracking for the selected order */}
                      <div className="bg-[#fbfcfd] dark:bg-white/[0.03] rounded-2xl border border-gray-200/80 dark:border-white/10 p-5 sm:p-6">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10">
                          <div className="flex items-center gap-2 min-w-0">
                            <Package className="w-4 h-4 text-gray-500 shrink-0" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-neutral-300 truncate">
                              {selectedOrder.carrier || "Standard"} &bull; {selectedTracking}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={copyTrackingNumber}
                            className="p-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                            title="Copy tracking number"
                            aria-label="Copy tracking number"
                          >
                            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-4 pb-3">
                          <div className="flex items-center gap-2.5">
                            <Truck className="w-5 h-5 text-gray-800 dark:text-[var(--foreground)] stroke-[2.2]" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-[var(--foreground)] tracking-tight">Tracking</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 dark:text-[var(--muted-foreground)]">
                              Status :
                            </span>
                            <OrderStatusPill status={selectedOrder.status} large />
                          </div>
                        </div>

                        {selectedCancelled && (
                          <p className="mb-4 text-xs font-medium px-3.5 py-2.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            This order was cancelled — no further tracking updates.
                          </p>
                        )}

                        {/* Vertical Dashed Timeline */}
                        <div className="relative pl-7 pt-4 space-y-5">
                          <div className="absolute top-6 bottom-4 left-[11px] w-[1px] border-l-2 border-dashed border-gray-300 dark:border-white/15" />
                          {TRACK_STAGES.map((stage, i) => {
                            const done = !selectedCancelled && i < selectedIdx
                            const active = !selectedCancelled && i === selectedIdx && selectedOrder.status !== "Delivered"
                            const finished = !selectedCancelled && (i < selectedIdx || selectedOrder.status === "Delivered")
                            const date =
                              i === 0
                                ? shortDate(selectedOrder.created_at)
                                : active
                                  ? shortDate(selectedOrder.status_updated_at)
                                  : null
                            return (
                              <div key={stage.title} className="relative">
                                <div className="absolute -left-[28px] top-1">
                                  {done || finished ? (
                                    <div className="w-3.5 h-3.5 rounded-full bg-[#fbb034] ring-4 ring-[#fbb034]/20" />
                                  ) : active ? (
                                    <div className="relative flex items-center justify-center">
                                      <span className="absolute w-5 h-5 rounded-full bg-[#eb483f]/25 animate-ping" />
                                      <div className="w-3.5 h-3.5 rounded-full bg-[#eb483f] ring-4 ring-[#eb483f]/30" />
                                    </div>
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-full bg-gray-400 dark:bg-neutral-600 ring-4 ring-gray-100 dark:ring-white/5" />
                                  )}
                                </div>
                                <div>
                                  <span className={`text-xs font-medium ${done || active || finished ? "text-gray-500 dark:text-neutral-400" : "text-gray-400 dark:text-neutral-600"}`}>
                                    {stage.title}
                                    {date ? ` (${date})` : ""}
                                  </span>
                                  <p className={`text-sm font-bold mt-0.5 ${done || active || finished ? "text-gray-900 dark:text-[var(--foreground)]" : "text-gray-400 dark:text-neutral-600"}`}>
                                    {stage.subtitle}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Footer ETA Note */}
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-[var(--muted-foreground)]">
                          <span>ETA: {selectedOrder.status === "Delivered" ? shortDate(selectedOrder.status_updated_at) || selectedEta : selectedEta}</span>
                          {destinationLine && <span className="truncate max-w-[200px]">{destinationLine}</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === "favourites" ? (
              <div className={`${cardCls} p-6 sm:p-8`}>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100 dark:border-white/10">
                  <h2 className="text-2xl font-bold text-[#1c1c1e] dark:text-[var(--foreground)]">Favourites</h2>
                  <span className="text-xs text-gray-500 dark:text-[var(--muted-foreground)]">
                    {favouriteItems.length} saved
                  </span>
                </div>
                {favouriteItems.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-[var(--muted-foreground)]">
                    Nothing saved yet — tap the heart on any product to keep it here.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {favouriteItems.map((item) => (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/product/${item.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") router.push(`/product/${item.id}`)
                        }}
                        className="relative rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden bg-[#f8f9fa] dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/25 transition-all cursor-pointer"
                      >
                        <div className="relative aspect-square">
                          <Image src={item.image} alt={item.name} fill sizes="200px" className="object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLike(item)
                          }}
                          aria-label={`Remove ${item.name} from favourites`}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 dark:bg-black/60 shadow-sm cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                        </button>
                        <div className="p-2.5">
                          <p className="text-xs font-bold text-[#1c1c1e] dark:text-[var(--foreground)] truncate">{item.name}</p>
                          <p className="text-xs text-[#eb483f] font-bold mt-0.5">${item.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "address" ? (
              <div className={`${cardCls} p-6 sm:p-8`}>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100 dark:border-white/10">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1c1c1e] dark:text-[var(--foreground)]">Address</h2>
                    <p className="text-xs text-gray-500 dark:text-[var(--muted-foreground)]">
                      Where your orders are delivered
                    </p>
                  </div>
                  {!editingAddress && (
                    <button
                      type="button"
                      onClick={startEditAddress}
                      className="px-4 py-1.5 bg-[#eb483f] text-white text-xs font-medium rounded-xl hover:bg-[#d93830] transition-colors cursor-pointer"
                    >
                      {savedAddress.address ? "Edit" : "Add"}
                    </button>
                  )}
                </div>
                {editingAddress ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>First name</label>
                        <input type="text" value={addressForm.firstName} onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Last name</label>
                        <input type="text" value={addressForm.lastName} onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })} className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Street address</label>
                      <input type="text" value={addressForm.address} onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>City</label>
                        <input type="text" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Postal code</label>
                        <input type="text" value={addressForm.postalCode} onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })} className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Country</label>
                      <input type="text" value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })} className={inputCls} />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button type="button" onClick={() => setEditingAddress(false)} className="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveAddress}
                        disabled={savingAddress}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13.5px] font-medium text-white bg-[#eb483f] hover:bg-[#d93830] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>{savingAddress ? "Saving…" : "Save Address"}</span>
                      </button>
                    </div>
                  </div>
                ) : savedAddress.address ? (
                  <div className="text-sm text-[#1c1c1e] dark:text-[var(--foreground)] space-y-1">
                    <p className="font-bold">
                      {savedAddress.firstName} {savedAddress.lastName}
                    </p>
                    <p className="text-gray-500 dark:text-[var(--muted-foreground)]">{savedAddress.address}</p>
                    <p className="text-gray-500 dark:text-[var(--muted-foreground)]">
                      {savedAddress.city} {savedAddress.postalCode}
                    </p>
                    <p className="text-gray-500 dark:text-[var(--muted-foreground)]">{savedAddress.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-[var(--muted-foreground)]">
                    No saved address yet — add one so checkout fills it in automatically.
                  </p>
                )}
              </div>
            ) : activeTab === "language" ? (
              <div className={`${cardCls} p-6 sm:p-8`}>
                <div className="pb-4 mb-6 border-b border-gray-100 dark:border-white/10">
                  <h2 className="text-2xl font-bold text-[#1c1c1e] dark:text-[var(--foreground)]">Language</h2>
                  <p className="text-xs text-gray-500 dark:text-[var(--muted-foreground)]">
                    Saved on this device and your account
                  </p>
                </div>
                <div className="space-y-2.5">
                  {LANGUAGES.map((l) => {
                    const selected = language === l.id
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          if (!selected) void selectLanguage(l.id)
                        }}
                        aria-pressed={selected}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          selected
                            ? "bg-white dark:bg-white/5 border-gray-900 dark:border-white text-gray-900 dark:text-white shadow-2xs"
                            : "bg-[#f8f9fa] dark:bg-transparent border-transparent hover:border-gray-200 dark:hover:border-white/20 text-gray-600 dark:text-neutral-300"
                        }`}
                      >
                        <span className="text-sm font-medium">{l.label}</span>
                        {selected && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black">
                            Selected
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className={`${cardCls} p-6 sm:p-8`}>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100 dark:border-white/10">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1c1c1e] dark:text-[var(--foreground)]">Payment</h2>
                    <p className="text-xs text-gray-500 dark:text-[var(--muted-foreground)]">
                      {cards.length} of 4 cards saved · only the last 4 digits are stored
                    </p>
                  </div>
                  {!addingCard && cards.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setAddingCard(true)}
                      className="px-4 py-1.5 bg-[#eb483f] text-white text-xs font-medium rounded-xl hover:bg-[#d93830] transition-colors cursor-pointer"
                    >
                      Add Card
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {cards.map((card, i) => (
                    <div key={card.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#f8f9fa] dark:bg-white/5 border border-gray-100 dark:border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-[var(--foreground)] rounded-xl">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-[var(--foreground)]">
                            {card.brand} ending in {card.last4}
                            {i === 0 && (
                              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                                Default
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-[var(--muted-foreground)]">
                            Expires {card.exp} &bull; {card.name}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeCard(card.id)}
                        aria-label={`Remove card ending in ${card.last4}`}
                        className="p-2 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {cards.length === 0 && !addingCard && (
                    <p className="text-sm text-gray-500 dark:text-[var(--muted-foreground)]">
                      No saved cards yet — add one for faster checkout.
                    </p>
                  )}
                  {addingCard && (
                    <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/15 space-y-4">
                      <div>
                        <label className={labelCls}>Card number</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={cardForm.number}
                          onChange={(e) => {
                            const d = e.target.value.replace(/\D/g, "").slice(0, 16)
                            setCardForm({ ...cardForm, number: d.replace(/(\d{4})(?=\d)/g, "$1 ") })
                          }}
                          placeholder="4242 4242 4242 4242"
                          className={`${inputCls} font-mono`}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Name on card</label>
                        <input type="text" value={cardForm.name} onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })} placeholder="Name on card" aria-label="Name on card" className={inputCls} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Expiry</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={cardForm.exp}
                            onChange={(e) => {
                              const d = e.target.value.replace(/\D/g, "").slice(0, 4)
                              setCardForm({ ...cardForm, exp: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d })
                            }}
                            placeholder="MM/YY"
                            className={`${inputCls} font-mono`}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>CVC</label>
                          <input
                            type="password"
                            inputMode="numeric"
                            value={cardForm.cvc}
                            onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                            placeholder="•••"
                            className={`${inputCls} font-mono`}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <button type="button" onClick={() => setAddingCard(false)} className="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveCard}
                          disabled={savingCard}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13.5px] font-medium text-white bg-[#eb483f] hover:bg-[#d93830] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>{savingCard ? "Saving…" : "Save Card"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
    </div>
  )
}
