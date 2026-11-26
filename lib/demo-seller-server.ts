import "server-only"

import { createSupabaseAdminClient } from "@/lib/supabase-admin"

const PRODUCTS_TABLE = "products"
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value?: string | null): boolean {
  return Boolean(value && UUID_RE.test(value))
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
      is_published: true,
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
      is_published: true,
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
      is_published: true,
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

async function findUserByEmail(email: string) {
  const admin = createSupabaseAdminClient()
  if (!admin) return null
  const target = email.trim().toLowerCase()
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
    if (error || !data?.users?.length) break
    const match = data.users.find((u) => (u.email ?? "").toLowerCase() === target)
    if (match) return match
    if (data.users.length < 100) break
  }
  return null
}

/**
 * Finds or creates a persistent Supabase Auth user for a quick-login role
 * (`seller@a-store.shop` or `customer@a-store.shop`). All products, likes,
 * profile settings, and orders persist in Supabase under their real UUID.
 */
export async function ensurePersistentDemoUser(input: {
  email: string
  fullName: string
  role: "demo_seller" | "customer"
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

  try {
    const cleanEmail = input.email.trim().toLowerCase()
    const existing = await findUserByEmail(cleanEmail)
    if (existing) {
      const meta = (existing.user_metadata ?? {}) as Record<string, unknown>
      const resolvedName =
        typeof meta.full_name === "string" && meta.full_name.trim()
          ? meta.full_name.trim()
          : input.fullName
      return {
        ok: true,
        user: {
          id: existing.id,
          email: existing.email ?? cleanEmail,
          fullName: resolvedName,
          metadata: meta,
        },
      }
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: cleanEmail,
      email_confirm: true,
      user_metadata: {
        role: input.role,
        full_name: input.fullName,
      },
    })
    if (createErr || !created?.user?.id) {
      return { ok: false, error: createErr?.message || "Could not create Supabase user." }
    }

    // On first creation of the Seller account, seed starter rows directly in Supabase.
    if (input.role === "demo_seller") {
      await admin.from(PRODUCTS_TABLE).insert(buildSellerStarterProducts(created.user.id))
    }

    return {
      ok: true,
      user: {
        id: created.user.id,
        email: created.user.email ?? cleanEmail,
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
