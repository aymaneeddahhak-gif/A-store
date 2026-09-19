import { StoreFront } from "@/components/storefront/store-front"
import { getDealsPopupAction } from "@/lib/actions/deals-popup"

export default async function HomePage() {
  // Popup copy comes from the server so the client never fetches on mount
  // (a server action called from a client effect broke the static build).
  const deals = await getDealsPopupAction()
  return (
    <StoreFront
      initialDealsConfig={
        deals.ok
          ? deals.data
          : { enabled: true, title: "Discount", subtitle: "Up to", button_label: "Shop now" }
      }
    />
  )
}
