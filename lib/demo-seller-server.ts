import "server-only"

import crypto from "node:crypto"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { migrateProductAssetPaths } from "@/lib/product-media"
import { resetSupabaseCircuit } from "@/lib/supabase-circuit"
import type { Product } from "@/lib/types"

const PRODUCTS_TABLE = "products"
const DEMO_EMAIL_DOMAIN = "@demo.a-store.shop"
const DEMO_TTL_MS = 24 * 60 * 60 * 1000
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value?: string | null): boolean {
  return Boolean(value && UUID_RE.test(value))
}

export function buildDemoSellerSeedRows(userId: string) {
  return [
    {
      name: "Real Madrid Home Kit 26/27",
      price: 120,
      original_price: 140,
      category: "clothes",
      image: "/images/product/RMADRIDKIT.png",
      images: ["/images/product/RMADRIDKIT.png"],
      video: "/videos/product/RMJERSY.mp4",
      description:
        "Official match-day performance jersey featuring breathable micro-perforated fabric, metallic gold trim, and woven club crest.",
      stock: 85,
      sold_count: 18,
      is_published: false,
      featured: false,
      user_id: userId,
      likes: 240,
      rating: 4.9,
      reviews: [],
      custom_colors: [],
      custom_sizes: ["S", "M", "L", "XL"],
    },
    {
      name: "Neon Force Sneakers",
      price: 189.99,
      original_price: 224,
      category: "sneakers",
      image: "/images/product/sneakers.png",
      images: ["/images/product/sneakers.png"],
      video: "/videos/product/sneakersvideo.mp4",
      description:
        "Ultra-lightweight street and running silhouette engineered with a responsive carbon-fiber plate and dual-density foam midsole.",
      stock: 60,
      sold_count: 24,
      is_published: false,
      featured: false,
      user_id: userId,
      likes: 185,
      rating: 4.8,
      reviews: [],
      custom_colors: [],
      custom_sizes: ["40", "41", "42", "43", "44"],
    },
    {
      name: "Silk Organza Wedding Dress",
      price: 450,
      original_price: 550,
      category: "clothes",
      image: "/images/product/weddg.png",
      images: ["/images/product/weddg.png"],
      video: "/videos/product/weddgdress.mp4",
      description:
        "Hand-draped silk organza silhouette with structured corset boning, delicate tonal beadwork, and a sweeping cathedral train.",
      stock: 12,
      sold_count: 6,
      is_published: false,
      featured: false,
      user_id: userId,
      likes: 95,
      rating: 5.0,
      reviews: [],
      custom_colors: [],
      custom_sizes: ["XS", "S", "M", "L"],
    },
  ]
}

async function cleanupExpiredDemoSessions(): Promise<void> {
  const admin = createSupabaseAdminClient()
  if (!admin) return
  try {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    const users = data?.users ?? []
    const cutoff = Date.now() - DEMO_TTL_MS
    const expired = users.filter((u) => {
      const email = (u.email ?? "").toLowerCase()
      if (!email.endsWith(DEMO_EMAIL_DOMAIN)) return false
      const createdAt = Date.parse(u.created_at ?? "")
      return Number.isFinite(createdAt) && createdAt < cutoff
    })
    for (const u of expired.slice(0, 20)) {
      await admin.from(PRODUCTS_TABLE).delete().eq("user_id", u.id)
      await admin.auth.admin.deleteUser(u.id)
    }
  } catch {
    // Non-fatal background sweep
  }
}

export async function isActiveDemoSandboxUser(userId: string): Promise<boolean> {
  if (!isUuid(userId)) return false
  const admin = createSupabaseAdminClient()
  if (!admin) return false
  try {
    const { data, error } = await admin.auth.admin.getUserById(userId)
    if (error || !data?.user) return false
    return (data.user.email ?? "").toLowerCase().endsWith(DEMO_EMAIL_DOMAIN)
  } catch {
    return false
  }
}

/**
 * Provisions a dedicated ephemeral Supabase Auth user for this visitor's
 * Demo Seller session and seeds 3 isolated example products under their UUID.
 * Public storefront queries filter `user_id IS NULL AND is_published = true`,
 * so visitor CRUD mutations never affect the main store or other visitors.
 */
export async function provisionDemoSellerSession(): Promise<{
  id: string
  email: string
  fullName: string
  persistedInSupabase: boolean
}> {
  const fallback = {
    id: "demo-seller-role-id",
    email: "seller@a-store.shop",
    fullName: "Demo Seller",
    persistedInSupabase: false,
  }

  resetSupabaseCircuit()
  const admin = createSupabaseAdminClient()
  if (!admin) return fallback

  try {
    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    const internalEmail = `demo-seller-${token}${DEMO_EMAIL_DOMAIN}`
    const { data: created, error: userErr } = await admin.auth.admin.createUser({
      email: internalEmail,
      email_confirm: true,
      user_metadata: {
        demo_sandbox: true,
        role: "demo_seller",
        display_email: "seller@a-store.shop",
        full_name: "Demo Seller",
      },
    })
    if (userErr || !created?.user?.id) return fallback

    const sessionUserId = created.user.id
    const seedRows = buildDemoSellerSeedRows(sessionUserId)
    const { error: seedErr } = await admin.from(PRODUCTS_TABLE).insert(seedRows)
    if (seedErr) {
      await admin.auth.admin.deleteUser(sessionUserId).catch(() => {})
      return fallback
    }

    // Opportunistically clean up expired (>24h) demo sessions without blocking login.
    void cleanupExpiredDemoSessions()

    return {
      id: sessionUserId,
      email: "seller@a-store.shop",
      fullName: "Demo Seller",
      persistedInSupabase: true,
    }
  } catch {
    return fallback
  }
}

/**
 * Wipes all rows owned by this ephemeral demo sandbox user and re-inserts
 * the 3 pristine seed example products in Supabase.
 */
export async function resetDemoSellerRows(userId: string): Promise<Product[] | null> {
  if (!isUuid(userId)) return null
  resetSupabaseCircuit()
  const admin = createSupabaseAdminClient()
  if (!admin) return null

  const verifiedSandbox = await isActiveDemoSandboxUser(userId)
  if (!verifiedSandbox) return null

  await admin.from(PRODUCTS_TABLE).delete().eq("user_id", userId)
  const { data, error } = await admin
    .from(PRODUCTS_TABLE)
    .insert(buildDemoSellerSeedRows(userId))
    .select("*")
    .order("id", { ascending: true })

  if (error || !data) return null
  return (data as Product[])
    .map(migrateProductAssetPaths)
    .filter((p): p is Product => p !== null)
}

/** Cleans up an ephemeral Demo Seller sandbox when the visitor signs out. */
export async function destroyDemoSellerSession(userId: string): Promise<void> {
  if (!isUuid(userId)) return
  const admin = createSupabaseAdminClient()
  if (!admin) return
  try {
    const verifiedSandbox = await isActiveDemoSandboxUser(userId)
    if (!verifiedSandbox) return
    await admin.from(PRODUCTS_TABLE).delete().eq("user_id", userId)
    await admin.auth.admin.deleteUser(userId)
  } catch {
    // Non-fatal cleanup
  }
}
