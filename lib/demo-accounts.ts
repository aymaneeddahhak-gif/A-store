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
