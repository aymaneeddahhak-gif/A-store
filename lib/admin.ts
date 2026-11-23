/**
 * Official private store admin — kept off the public `/login` screen.
 * Only direct email/password sign-in as `admin@a-store.shop` (or `ADMIN_EMAILS`)
 * grants full official admin privileges.
 */
const ADMIN_EMAILS = Array.from(
  new Set(
    ["admin@a-store.shop", ...(process.env.ADMIN_EMAILS ?? "").split(",")]
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )
)

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}
