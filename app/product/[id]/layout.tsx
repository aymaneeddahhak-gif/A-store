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
    return { title: { absolute: "A-store" } }
  }

  return {
    // Tab title stays "A-store" on every product page; the product itself is
    // described in the description and link previews instead.
    title: { absolute: "A-store" },
    description: product.description ?? `Shop ${product.name} at A-store.`,
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
