import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://justshop.example.com"

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/seller", "/checkout", "/orders"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
