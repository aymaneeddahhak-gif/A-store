import type { Metadata } from "next"
import { LoginPageClient } from "@/components/login/login-page-client"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to A-store with email or Google to track orders and manage your store.",
  robots: { index: false },
}

export default function LoginPage() {
  return <LoginPageClient />
}
