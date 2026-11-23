"use client"

import dynamic from "next/dynamic"

const QuickViewModal = dynamic(
  () => import("@/components/quick-view-modal").then((m) => m.QuickViewModal),
  { ssr: false }
)

const CartDrawer = dynamic(
  () => import("@/components/cart-drawer").then((m) => m.CartDrawer),
  { ssr: false }
)

const Chatbot = dynamic(() => import("@/components/chatbot"), { ssr: false })
const DeliveryLoaderOverlay = dynamic(
  () => import("@/components/delivery-loader-overlay").then((m) => m.DeliveryLoaderOverlay),
  { ssr: false }
)

export function GlobalOverlays() {
  return (
    <>
      <QuickViewModal />
      <CartDrawer />
      <Chatbot />
      <DeliveryLoaderOverlay />
    </>
  )
}
