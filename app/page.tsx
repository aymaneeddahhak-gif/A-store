import { StoreFront } from "@/components/storefront/store-front"
import { listCategoriesAction } from "@/lib/actions/categories"
import { getDealsPopupAction } from "@/lib/actions/deals-popup"
import { listStoreProducts } from "@/lib/queries/products"

export const revalidate = 300

export default async function HomePage() {
  // Fetch storefront catalog, categories, and deals config in parallel on `/`
  // (cached on globalThis) instead of RootLayout, so /login, /seller, /profile,
  // /checkout, and /orders stay statically buildable and prefetch instantly.
  const [products, categoriesRes, deals] = await Promise.all([
    listStoreProducts(),
    listCategoriesAction().catch(() => ({ ok: false as const, error: "unavailable" })),
    getDealsPopupAction(),
  ])

  return (
    <StoreFront
      initialProducts={products}
      initialCategories={categoriesRes.ok ? categoriesRes.data : []}
      initialDealsConfig={
        deals.ok
          ? deals.data
          : { enabled: true, title: "Discount", subtitle: "Up to", button_label: "Shop now" }
      }
    />
  )
}
