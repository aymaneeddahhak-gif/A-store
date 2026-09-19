import { DEMO_ACCOUNTS } from "@/lib/demo-accounts"

/**
 * Portfolio admin — full catalog scope plus user management. There is no
 * roles table; the admin is simply the admin demo login. Every other
 * signed-in seller is sandboxed to their own rows.
 */
const ADMIN_EMAILS = [DEMO_ACCOUNTS.find((a) => a.id === "admin")?.email].filter(
  (email): email is string => Boolean(email)
)

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}
