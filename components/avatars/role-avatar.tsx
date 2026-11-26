"use client"

import Image from "next/image"

export type AvatarVariant = "demo_seller" | "customer" | "default"

/**
 * Option C: Dual-Tone Rounded Brand Badge SVGs.
 * Replaces all single-letter ("A", "V") avatar placeholders and demo-card icons.
 */
export function VectorAvatar({
  variant = "default",
  sizeClass = "w-9 h-9",
}: {
  variant?: AvatarVariant
  sizeClass?: string
}) {
  if (variant === "demo_seller") {
    return (
      <svg
        viewBox="0 0 40 40"
        aria-hidden
        className={`${sizeClass} rounded-full shrink-0 bg-zinc-900`}
      >
        <circle cx="20" cy="14" r="5.5" fill="#f4f4f5" />
        <path d="M9.5 34c1.5-6.2 5.2-9.5 10.5-9.5s9 3.3 10.5 9.5" fill="#a1a1aa" />
        <path d="M16 25l4 3.5 4-3.5" fill="#f4f4f5" />
      </svg>
    )
  }

  if (variant === "customer") {
    return (
      <svg
        viewBox="0 0 40 40"
        aria-hidden
        className={`${sizeClass} rounded-full shrink-0 bg-emerald-600`}
      >
        <circle cx="20" cy="14" r="5.5" fill="#ffffff" />
        <path d="M9.5 34c1.5-6.2 5.2-9.5 10.5-9.5s9 3.3 10.5 9.5" fill="#a7f3d0" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden
      className={`${sizeClass} rounded-full shrink-0 bg-zinc-200 dark:bg-zinc-700`}
    >
      <circle cx="20" cy="14" r="5.5" fill="#52525b" className="dark:fill-zinc-200" />
      <path
        d="M9.5 34c1.5-6.2 5.2-9.5 10.5-9.5s9 3.3 10.5 9.5"
        fill="#71717a"
        className="dark:fill-zinc-400"
      />
    </svg>
  )
}

export function avatarVariantForEmail(email?: string | null): AvatarVariant {
  if (!email) return "default"
  const lower = email.trim().toLowerCase()
  if (
    lower === "seller@a-store.shop" ||
    lower === "demo-seller@a-store.shop" ||
    lower === "admin@a-store.shop" ||
    (lower.startsWith("demo-seller-") && lower.endsWith("@demo.a-store.shop"))
  ) {
    return "demo_seller"
  }
  if (
    lower === "customer@a-store.shop" ||
    (lower.startsWith("demo-client-") && lower.endsWith("@demo.a-store.shop"))
  ) {
    return "customer"
  }
  return "default"
}

export function UserAvatar({
  src,
  alt,
  email,
  size = 36,
  sizeClass = "w-9 h-9",
}: {
  src?: string | null
  alt: string
  email?: string | null
  size?: number
  sizeClass?: string
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        unoptimized
        referrerPolicy="no-referrer"
        className={`${sizeClass} rounded-full object-cover shrink-0`}
      />
    )
  }
  return <VectorAvatar variant={avatarVariantForEmail(email)} sizeClass={sizeClass} />
}
