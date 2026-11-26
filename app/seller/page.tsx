import type { Metadata } from "next"
import { SellerPageShell } from "@/components/seller/seller-page-shell"

export const metadata: Metadata = {
  title: "Seller Console",
  description: "Manage products, orders, and store activity.",
  robots: { index: false },
}

export default function SellerPage() {
  return <SellerPageShell />
}
