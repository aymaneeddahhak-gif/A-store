import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import ElectricBorderCard from "@/components/electric-border-card"
import { DetailExperience } from "@/components/product/detail-experience"
import { toStorefrontProduct } from "@/components/storefront/product-adapter"
import { CATEGORIES } from "@/lib/categories"
import { getProductById, getRelatedProducts } from "@/lib/queries/products"

type Props = {
  params: Promise<{ id: string }>
  /** ?edit=1 opens the page in "edit cart item" mode (variant swap, no add). */
  searchParams: Promise<{ edit?: string }>
}

export default async function ProductDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { edit } = await searchParams
  const productId = Number(id)

  if (Number.isNaN(productId)) notFound()

  const product = await getProductById(productId)
  if (!product) notFound()

  const relatedProducts = await getRelatedProducts(product)

  // Merchandising enrichment (swatches, storefront category) shared with cards.
  const storefront = toStorefrontProduct(product, false)
  const categoryLabel =
    CATEGORIES.find((c) => c.id === storefront.category)?.label ?? product.category

  return (
    <div className="w-full selection:bg-[var(--foreground)] selection:text-[var(--background)]">
      <div className="mx-auto w-full p-3 sm:p-6 md:p-8">
        {/* Centered canvas card */}
        <div className="w-full rounded-[26px] border border-[var(--border-color)] bg-[var(--card)] p-5 shadow-xl shadow-black/5 sm:p-7 md:rounded-[32px] md:p-9 dark:shadow-black/30">
          {/* Breadcrumb: Store > Category > Product */}
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex items-center gap-1.5 text-[11.5px] text-[var(--muted-foreground)]"
          >
            <Link href="/" className="transition-colors hover:text-[var(--foreground)]">
              Store
            </Link>
            <span className="select-none opacity-50" aria-hidden>›</span>
            <Link href="/" className="transition-colors hover:text-[var(--foreground)]">
              {categoryLabel}
            </Link>
            <span className="select-none opacity-50" aria-hidden>›</span>
            <span className="font-medium text-[var(--foreground)]">{product.name}</span>
          </nav>

          <DetailExperience
            product={product}
            categoryLabel={categoryLabel}
            colors={storefront.colors ?? []}
            showSizes={storefront.category === "sneakers"}
            editItemId={edit ? product.id : undefined}
          />
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-16 md:mt-24" aria-labelledby="related-heading">
            <div className="mb-8 flex items-center justify-between md:mb-12">
              <h2
                id="related-heading"
                className="text-2xl font-black tracking-tighter text-[var(--foreground)] uppercase md:text-4xl"
              >
                You may also like
              </h2>
              <Link
                href="/"
                className="flex items-center gap-2 text-xs font-bold tracking-widest text-[var(--foreground)] uppercase opacity-40 transition-opacity hover:opacity-100"
              >
                View Collection <ChevronRight size={14} aria-hidden />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8">
              {relatedProducts.map((p) => (
                <ElectricBorderCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
