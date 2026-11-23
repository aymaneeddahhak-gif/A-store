import type { Metadata } from "next"
import { ProfileClient } from "@/components/profile/profile-client"

export const metadata: Metadata = {
  title: "My Account",
  description: "Your A-store account details, order history, and session.",
  robots: { index: false },
}

export default function ProfilePage() {
  return <ProfileClient />
}
