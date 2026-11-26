/**
 * Identifies quick-login seller accounts (`seller@a-store.shop` or `demo-seller@a-store.shop`).
 */
export function isDemoSellerUser(email?: string | null): boolean {
  if (!email) return false
  const lower = email.trim().toLowerCase()
  return (
    lower === "seller@a-store.shop" ||
    lower === "demo-seller@a-store.shop" ||
    lower.endsWith("@demo.a-store.shop")
  )
}
