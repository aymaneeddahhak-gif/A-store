/**
 * Public One-Click portfolio demo accounts shown on `/login`.
 *
 * Official admin (`admin@a-store.shop`) is intentionally excluded from `/login`
 * and stays private behind direct email/password credentials.
 */
export type DemoAccountId = "demo_seller" | "customer" | "demo_admin"

export interface DemoAccount {
  id: DemoAccountId
  label: string
  description: string
  email: string
  password: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "demo_seller",
    label: "Demo Seller",
    description: "Explore Seller Console, manage products & orders",
    email: "seller@a-store.shop",
    password: "",
  },
  {
    id: "customer",
    label: "Normal User",
    description: "Shop, place orders & manage profile",
    email: "customer@a-store.shop",
    password: "Astore-Customer-2026!",
  },
]
