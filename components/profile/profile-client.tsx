"use client"

import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Camera,
  Heart,
  CreditCard,
  Check,
  Eye,
  EyeOff,
  ChevronDown,
  User,
  X,
} from "lucide-react"
import { useAuth } from "@/contexts/providers/auth-context"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { useLikes } from "@/contexts/providers/likes-context"
import { useOrders } from "@/contexts/providers/orders-context"
import { useToast } from "@/contexts/toast-context"
import ProfileAccountMenu, { type ProfileTab as MenuTab } from "@/components/profile/profile-account-menu"
import OrdersTrackingDashboard from "@/components/profile/orders-tracking-dashboard"
import { UserAvatar } from "@/components/avatars/role-avatar"
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

export function ProfileClient() {
  const { user, authLoading, signOut, updateProfileMetadata } = useAuth()
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
      const { error } = await updateProfileMetadata(
        {
          full_name: name.trim(),
          username: username.trim(),
          phone_code: phoneCode.trim(),
          phone_number: phoneNumber.trim(),
        },
        newPassword ? { password: newPassword } : undefined
      )
      if (error) {
        showToast(error, "error")
        return
      }
      setNewPassword("")
      showToast("Your account details have been updated.", "success", undefined, {
        title: "Profile saved",
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
      let nextUrl = res.ok ? res.data.url : ""
      if (!nextUrl) {
        nextUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "")
          reader.onerror = () => resolve("")
          reader.readAsDataURL(scaled)
        })
      }
      if (!nextUrl) {
        showToast(!res.ok ? res.error : "Could not save profile photo.", "error")
        return
      }
      const { error } = await updateProfileMetadata({ avatar_url: nextUrl })
      if (error) showToast(error, "error")
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
      const { error } = await updateProfileMetadata({ address: addressForm })
      if (error) {
        showToast(error, "error")
        return
      }
      showToast("Delivery address saved.", "success", undefined, {
        title: "Address saved",
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
    const { error } = await updateProfileMetadata({ language: id })
    if (error) showToast(error, "error")
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
      const { error } = await updateProfileMetadata({ payment_cards: next })
      if (error) {
        showToast(error, "error")
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
    const { error } = await updateProfileMetadata({ payment_cards: next })
    if (error) {
      showToast(error, "error")
      return
    }
    setCards(next)
    showToast("Card removed.", "success")
  }

  return (
    <div className="relative w-full">
      {/* The restored ProfileAccountMenu sidebar — the user's exact design,
          shown beside the content (stacks on top on mobile). */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        <div className="w-full lg:w-80 shrink-0">
          <ProfileAccountMenu
            user={{
              name: name || "Valued Customer",
              email: email,
              avatarUrl: avatarUrl,
              role: "Verified Member",
              language: language === "ar" ? "العربية" : language === "fr" ? "Français" : "English (US)",
            }}
            activeTab={activeTab as MenuTab}
            ordersCount={orders.length}
            favouritesCount={favouriteItems.length}
            onTabSelect={(tab) => setActiveTab(tab)}
            onLogout={handleLogout}
            onAvatarChange={() => fileRef.current?.click()}
          />
        </div>

          {/* ================= Content ================= */}
          <div className="min-w-0 flex-1">
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
                      <UserAvatar
                        src={avatarUrl}
                        alt={name || "Profile photo"}
                        email={email}
                        size={64}
                        sizeClass="w-16 h-16"
                      />
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
              <OrdersTrackingDashboard orders={orders} />

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
    </div>
  )
}
