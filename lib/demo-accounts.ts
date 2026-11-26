/**
 * Public One-Click portfolio demo accounts shown on `/login`.
 *
 * Official admin (`admin@a-store.shop`) is intentionally excluded from `/login`
 * and stays private behind direct email/password credentials.
 */
export type DemoAccountId = "demo_seller" | "customer"

export interface DemoAccount {
  id: DemoAccountId
  label: string
  description: string
  email: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "demo_seller",
    label: "Seller",
    description: "Explore Seller Console, manage products & orders",
    email: "seller@a-store.shop",
  },
  {
    id: "customer",
    label: "Client",
    description: "Shop, place orders & manage profile",
    email: "customer@a-store.shop",
  },
]

/** Exact-timestamp default visitor name, e.g. `Visit-(2026-11-26 21:45:12)`. */
export function formatVisitTimestampName(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  const yyyy = date.getUTCFullYear()
  const mm = pad(date.getUTCMonth() + 1)
  const dd = pad(date.getUTCDate())
  const hh = pad(date.getUTCHours())
  const min = pad(date.getUTCMinutes())
  const ss = pad(date.getUTCSeconds())
  return `Visit-(${yyyy}-${mm}-${dd} ${hh}:${min}:${ss})`
}
