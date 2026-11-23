import type { MetadataRoute } from "next"
import { listProducts } from "@/lib/queries/products"
import { SITE_URL } from "@/lib/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listProducts()

  const productUrls = products.map((p) => ({
    url: `${SITE_URL}/product/${p.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...productUrls,
  ]
}
