import type { Metadata } from "next"
import { OrdersPageClient } from "@/components/orders/orders-page-client"

export const metadata: Metadata = {
  title: "My Orders",
  description: "View and track your A-store orders.",
  robots: { index: false },
}

export default function OrdersPage() {
  return <OrdersPageClient />
}
