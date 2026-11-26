import { isAdminEmail } from "@/lib/admin"
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts"

/**
 * The store team — who may operate the seller console (fulfilment, orders,
 * inventory). Includes official admin, configured SELLER_EMAILS, and
 * per-visitor isolated seller sessions (`demo-seller-*@demo.a-store.shop`),
 * while keeping normal/demo customer accounts restricted to shopping and
 * their own profile/orders.
 */
const DEMO_SELLER_EMAILS = [
  ...DEMO_ACCOUNTS.filter((a) => a.id === "demo_seller").map((a) =>
    a.email.toLowerCase()
  ),
  "seller@a-store.shop",
  "demo-seller@a-store.shop",
]

export const SELLER_EMAILS: string[] = Array.from(
  new Set(
    [...DEMO_SELLER_EMAILS, ...(process.env.SELLER_EMAILS ?? "").split(",")]
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )
)

export function isSellerEmail(email: string | null | undefined): boolean {
  if (isAdminEmail(email)) return true
  if (!email) return false
  const lower = email.trim().toLowerCase()
  if (lower.startsWith("demo-seller-") && lower.endsWith("@demo.a-store.shop")) {
    return true
  }
  return SELLER_EMAILS.includes(lower)
}
