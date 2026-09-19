/**
 * Portfolio demo accounts — real Supabase users, one click to sign in.
 *
 * Admin manages the catalog; Tester explores the same seller dashboard
 * (the app has no separate roles — both logins open every seller tool).
 * Credentials live here so the login page can sign in directly; they are
 * low-privilege demo logins and RLS still applies to everything they do.
 */
export type DemoAccountId = "admin" | "tester"

export interface DemoAccount {
  id: DemoAccountId
  label: string
  description: string
  email: string
  password: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "admin",
    label: "Continue as Admin",
    description: "Manage products, orders & reviews",
    email: "admin@a-store.shop",
    // SECURITY: the admin password is NOT in the source (it used to be, which
    // handed every repo visitor full admin access). It lives in the server's
    // ADMIN_DEMO_PASSWORD env var and signs in through demoAdminLoginAction.
    password: "",
  },
  {
    id: "tester",
    label: "Continue as Tester",
    description: "Explore the seller dashboard",
    email: "tester@a-store.shop",
    password: "Astore-Test-2026!",
  },
]
