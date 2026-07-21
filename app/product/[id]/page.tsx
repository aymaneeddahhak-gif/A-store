import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ChevronRight,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react"
import ElectricBorderCard from "@/components/electric-border-card"
import { ProductGallery } from "@/components/product/product-gallery"
import { ProductTabs } from "@/components/product/product-tabs"
import { ProductActions } from "@/components/product/product-actions"
import { ReviewSection } from "@/components/product/review-section"
import { getProductById, getRelatedProducts } from "@/lib/queries/products"

type Props = {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const productId = Number(id)

  if (Number.isNaN(productId)) notFound()

  const product = await getProductById(productId)
  if (!product) notFound()

  const relatedProducts = await getRelatedProducts(product)

  return (
    <div className="w-full selection:bg-[var(--foreground)] selection:text-[var(--background)]">
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8 lg:p-12 pb-32">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--foreground)] opacity-40 mb-8"
        >
          <Link href="/" className="hover:opacity-100 transition-opacity">
            Store
          </Link>
          <ChevronRight size={12} aria-hidden />
          <span className="opacity-100">{product.category}</span>
          <ChevronRight size={12} aria-hidden />
          <span className="opacity-100">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-20">
          <ProductGallery product={product} />

          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <span className="px-4 py-1.5 bg-[var(--glass-bg)] border border-[var(--border-color)] rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]">
                In Stock
              </span>
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={14} fill="currentColor" aria-hidden />
                <span className="text-sm font-black text-[var(--foreground)] ml-1">
                  {product.rating || "5.0"}
                </span>
                <span className="text-xs font-bold text-[var(--foreground)] opacity-40 ml-2">
                  ({product.reviews?.length || 0} reviews)
                </span>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-[var(--foreground)] leading-tight mb-6">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-4xl font-black text-[var(--foreground)]">
                ${product.price}
              </span>
              <span className="text-lg text-[var(--foreground)] opacity-30 line-through">
                ${(product.price * 1.2).toFixed(0)}
              </span>
            </div>

            <ProductTabs product={product} />
            <ProductActions product={product} />

            <div className="grid grid-cols-3 gap-4 p-6 bg-[var(--card)] border border-[var(--border-color)] rounded-[32px]">
              <div className="flex flex-col items-center text-center gap-2">
                <ShieldCheck size={20} className="text-[var(--foreground)] opacity-40" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)] opacity-50">
                  2 Year Warranty
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Truck size={20} className="text-[var(--foreground)] opacity-40" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)] opacity-50">
                  Free Shipping
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <RotateCcw size={20} className="text-[var(--foreground)] opacity-40" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)] opacity-50">
                  30 Day Return
                </span>
              </div>
            </div>
          </div>
        </div>

        <ReviewSection product={product} />

        {relatedProducts.length > 0 && (
          <section className="mt-32" aria-labelledby="related-heading">
            <div className="flex items-center justify-between mb-12">
              <h2
                id="related-heading"
                className="text-4xl font-black text-[var(--foreground)] uppercase tracking-tighter"
              >
                You may also like
              </h2>
              <Link
                href="/"
                className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)] opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2"
              >
                View Collection <ChevronRight size={14} aria-hidden />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
