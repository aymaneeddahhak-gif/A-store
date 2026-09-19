import type { Metadata } from "next"
import { NewSellerDashboard } from "@/components/seller/new-seller-dashboard"

export const metadata: Metadata = {
  title: "Seller Console",
  description: "Manage products, orders, and store activity.",
  robots: { index: false },
}

export default function SellerPage() {
  return <NewSellerDashboard />
}
