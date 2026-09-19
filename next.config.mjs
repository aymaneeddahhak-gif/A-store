import bundleAnalyzer from "@next/bundle-analyzer"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

// Seller-pasted product photos live in this project's Supabase storage.
// next/image 400s on any remote host not listed here, so derive it from the
// configured project URL (no-op when Supabase is unconfigured).
const supabaseHostname = (() => {
  try {
    const hostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname
    return hostname ? [{ protocol: "https", hostname }] : []
  } catch {
    return []
  }
})()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Avatar/review uploads ride server actions — the 1 MB default rejects
  // phone photos, so allow 5 MB (client code still downscales first).
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...supabaseHostname,
    ],
  },
}

export default withBundleAnalyzer(nextConfig)
