"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import type { Product } from "@/lib/types"
import { useCatalog } from "@/contexts/providers/catalog-context"

/**
 * Reviews section — client island for the review form + list.
 * Reads live product data from catalog so new reviews appear immediately.
 */
export function ReviewSection({ product: initialProduct }: { product: Product }) {
  const { addReview, products } = useCatalog()
  const product = products.find((p) => p.id === initialProduct.id) ?? initialProduct
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" })
  const reviews = product.reviews || []

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault()
    addReview(product.id, {
      user: "Guest User",
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
    })
    setReviewForm({ rating: 5, comment: "" })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mt-20">
      <div className="lg:col-span-1">
        <h2 className="text-3xl font-black text-[var(--foreground)] mb-6 uppercase">Customer Reviews</h2>
        <div className="p-8 bg-[var(--card)] border border-[var(--border-color)] rounded-[40px] mb-8">
          <div className="text-6xl font-black text-[var(--foreground)] mb-2">
            {product.rating || "5.0"}
          </div>
          <div className="flex gap-1 text-amber-500 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} fill="currentColor" />
            ))}
          </div>
          <p className="text-xs font-bold text-[var(--foreground)] opacity-40 uppercase tracking-widest">
            Average rating based on {reviews.length} reviews
          </p>
        </div>

        <form onSubmit={handleAddReview} className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-[var(--foreground)] opacity-50">
            Share your thoughts
          </label>
          <textarea
            required
            value={reviewForm.comment}
            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
            className="w-full bg-[var(--card)] border border-[var(--border-color)] rounded-3xl p-5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--foreground)] min-h-[120px]"
            placeholder="What did you think about this product?"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                  className={`w-8 h-8 rounded-full border border-[var(--border-color)] flex items-center justify-center transition-all ${
                    reviewForm.rating >= s
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "text-[var(--foreground)] opacity-30"
                  }`}
                  aria-label={`Rate ${s} stars`}
                >
                  <Star size={12} fill={reviewForm.rating >= s ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90"
            >
              Post Review
            </button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-2 space-y-8">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div
              key={review.id}
              className="p-8 bg-[var(--card)] border border-[var(--border-color)] rounded-[40px] animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={review.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user}`}
                    alt=""
                    className="w-12 h-12 rounded-2xl border border-[var(--border-color)]"
                  />
                  <div>
                    <div className="font-black text-[var(--foreground)]">{review.user}</div>
                    <div className="text-[10px] font-bold text-[var(--foreground)] opacity-30 uppercase tracking-widest">
                      {review.date}
                    </div>
                  </div>
                </div>
                <div className="flex gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < review.rating ? "currentColor" : "none"}
                      className={i >= review.rating ? "opacity-20" : ""}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[var(--foreground)] opacity-70 leading-relaxed italic">
                &ldquo;{review.comment}&rdquo;
              </p>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-[var(--border-color)] rounded-[40px]">
            <Star size={40} className="text-[var(--foreground)] opacity-10 mb-4" />
            <p className="text-[var(--foreground)] opacity-30 font-black uppercase tracking-widest">
              No reviews yet. Be the first!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
