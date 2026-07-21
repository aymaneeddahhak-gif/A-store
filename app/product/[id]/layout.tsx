import type { Metadata } from "next"
import { getProductById } from "@/lib/queries/products"

type Props = {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await getProductById(Number(id))

  if (!product) {
    return { title: "Product not found | JUST SHOP" }
  }

  return {
    title: `${product.name} | JUST SHOP`,
    description: product.description ?? `Shop ${product.name} at JUST SHOP.`,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image, alt: product.name }],
      type: "website",
    },
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children
}
