import type { Metadata } from "next"
import { CheckoutExperience } from "@/components/checkout/checkout-experience"

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure two-step checkout with shipping and payment.",
  robots: { index: false },
}

export default function CheckoutPage() {
  return <CheckoutExperience />
}
