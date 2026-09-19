import { ProfileClient } from "@/components/profile/profile-client"

export const metadata = {
  title: "My Account",
  description: "Your A-store account details, order history, and session.",
}

export default function ProfilePage() {
  return <ProfileClient />
}
