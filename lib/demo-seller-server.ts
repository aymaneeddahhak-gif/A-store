import "server-only"

import crypto from "node:crypto"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"

const PRODUCTS_TABLE = "products"
const ORDERS_TABLE = "orders"
const DEMO_EMAIL_DOMAIN = "@demo.a-store.shop"
const DEMO_TTL_MS = 24 * 60 * 60 * 1000
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value?: string | null): boolean {
  return Boolean(value && UUID_RE.test(value))
}

export function isDemoVisitorEmail(email?: string | null): boolean {
  return Boolean(email && email.trim().toLowerCase().endsWith(DEMO_EMAIL_DOMAIN))
}

function buildSellerStarterProducts(userId: string) {
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

async function cleanupExpiredVisitorUsers(): Promise<void> {
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
      await admin.from(ORDERS_TABLE).delete().eq("user_id", u.id)
      await admin.auth.admin.deleteUser(u.id)
    }
  } catch {
    // Non-fatal background cleanup
  }
}

/**
 * Finds the visitor's existing per-browser isolated Supabase user (if active
 * and matching the requested role), or provisions a brand-new isolated
 * Supabase Auth user (`demo-seller-<token>@demo.a-store.shop` or
 * `demo-client-<token>@demo.a-store.shop`).
 */
export async function ensureVisitorDemoUser(input: {
  role: "demo_seller" | "customer"
  fullName: string
  existingUserId?: string | null
}): Promise<
  | {
      ok: true
      user: {
        id: string
        email: string
        fullName: string
        metadata: Record<string, unknown>
      }
    }
  | { ok: false; error: string }
> {
  const admin = createSupabaseAdminClient()
  if (!admin) {
    return { ok: false, error: "Supabase service role key is required for quick sign-in." }
  }

  const prefix = input.role === "demo_seller" ? "demo-seller-" : "demo-client-"

  try {
    if (input.existingUserId && isUuid(input.existingUserId)) {
      const { data: existing, error: readErr } = await admin.auth.admin.getUserById(
        input.existingUserId
      )
      const email = (existing?.user?.email ?? "").toLowerCase()
      if (!readErr && existing?.user && email.startsWith(prefix) && email.endsWith(DEMO_EMAIL_DOMAIN)) {
        const meta = (existing.user.user_metadata ?? {}) as Record<string, unknown>
        const resolvedName =
          typeof meta.full_name === "string" && meta.full_name.trim()
            ? meta.full_name.trim()
            : input.fullName
        return {
          ok: true,
          user: {
            id: existing.user.id,
            email,
            fullName: resolvedName,
            metadata: meta,
          },
        }
      }
    }

    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    const internalEmail = `${prefix}${token}${DEMO_EMAIL_DOMAIN}`
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: internalEmail,
      email_confirm: true,
      user_metadata: {
        role: input.role,
        demo_visitor: true,
        full_name: input.fullName,
      },
    })
    if (createErr || !created?.user?.id) {
      return { ok: false, error: createErr?.message || "Could not create Supabase session." }
    }

    if (input.role === "demo_seller") {
      await admin.from(PRODUCTS_TABLE).insert(buildSellerStarterProducts(created.user.id))
    }

    void cleanupExpiredVisitorUsers()

    return {
      ok: true,
      user: {
        id: created.user.id,
        email: internalEmail,
        fullName: input.fullName,
        metadata: (created.user.user_metadata ?? {}) as Record<string, unknown>,
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not connect to Supabase Auth.",
    }
  }
}
