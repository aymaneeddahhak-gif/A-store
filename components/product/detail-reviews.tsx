"use client"

import { Fragment, useState } from "react"
import Image from "next/image"
import { Star, CheckCircle2, PenLine, X, ThumbsUp, Camera } from "lucide-react"
import type { Product } from "@/lib/types"
import { useCatalog } from "@/contexts/providers/catalog-context"
import { useAuth } from "@/contexts/providers/auth-context"
import { uploadMediaAction } from "@/lib/actions/media"

const MAX_REVIEW_PHOTOS = 4

const MAX_COMMENT_LENGTH = 1000

function formatReviewDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Reviews — summary banner, write-a-review form, and stacked review cards.
 * Posting goes through the catalog action so reviews persist; helpful votes
 * are local.
 */
const STAR_POINTS =
  "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"

/**
 * Uiverse 3D star rating input (Lu2ovic). Row-reverse radios so
 * `input:checked ~ label` and `label:hover ~ label` fill the hovered star
 * and every star below it. Keyframes live in this co-located <style> block
 * so no global CSS is touched.
 */
function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <>
      <style>{`
.uiverse-rating{display:flex;flex-direction:row-reverse;gap:.3rem;justify-content:center;transform-style:preserve-3d;perspective:1000px}
.uiverse-rating input{display:none}
.uiverse-rating label{position:relative;cursor:pointer;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:3px;transition:all .5s ease}
.uiverse-rating .svgOne{stroke:#ccc;fill:rgba(255,217,0,0);transition:stroke .5s ease,fill .5s ease}
.uiverse-rating .svgTwo{position:absolute;top:-1px;fill:gold;stroke:rgba(255,217,0,0);opacity:0;transition:stroke .5s ease,fill .5s ease,opacity .5s ease}
.uiverse-rating label:hover .svgOne,.uiverse-rating label:hover ~ label .svgOne{stroke:gold}
.uiverse-rating input:checked ~ label .svgOne{stroke:#cccccc00}
.uiverse-rating input:checked ~ label .svgTwo{transform:rotateX(0deg) rotateY(0deg) translateY(0px);opacity:1;animation:uiverse-display-star .5s cubic-bezier(.75,.41,.82,1.2)}
@keyframes uiverse-display-star{0%{transform:rotateX(100deg) rotateY(100deg) translateY(10px)}100%{transform:rotateX(0deg) rotateY(0deg) translateY(0px)}}
.uiverse-rating .ombre{background:radial-gradient(ellipse closest-side,rgba(0,0,0,.24),rgba(0,0,0,0));width:30px;height:8px;opacity:0;transition:opacity .6s ease .2s}
.uiverse-rating label:hover .ombre,.uiverse-rating label:hover ~ label .ombre{opacity:.3}
.uiverse-rating input:checked ~ label .ombre{opacity:1}
.uiverse-rating label:hover .svgTwo:hover{animation:uiverse-shake-star .6s ease-out}
@keyframes uiverse-shake-star{0%{transform:rotate(0deg)}20%{transform:rotate(-20deg)}50%{transform:rotate(20deg)}80%{transform:rotate(-20deg)}100%{transform:rotate(0deg)}}
.uiverse-rating input:focus-visible + label{outline:2px solid currentColor;outline-offset:4px;border-radius:6px}
      `}</style>
      <div className="uiverse-rating" role="radiogroup" aria-label="Your rating">
        {[5, 4, 3, 2, 1].map((star) => (
          <Fragment key={star}>
            <input
              value={star}
              name="review-rating"
              id={`review-star${star}`}
              type="radio"
              checked={value === star}
              onChange={() => onChange(star)}
            />
            <label title={star === 1 ? "1 star" : `${star} stars`} htmlFor={`review-star${star}`}>
              <svg
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2"
                fill="none"
                viewBox="0 0 24 24"
                height="35"
                width="35"
                aria-hidden
                className="svgOne"
              >
                <polygon points={STAR_POINTS} />
              </svg>
              <svg
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2"
                fill="none"
                viewBox="0 0 24 24"
                height="35"
                width="35"
                aria-hidden
                className="svgTwo"
              >
                <polygon points={STAR_POINTS} />
              </svg>
              <div className="ombre" />
            </label>
          </Fragment>
        ))}
      </div>
    </>
  )
}
export function DetailReviews({
  product: initialProduct,
  selectedSize,
  selectedColorName,
  showSizes,
}: {
  product: Product
  selectedSize: string
  selectedColorName: string
  showSizes: boolean
}) {
  const { addReview, products } = useCatalog()
  const { user } = useAuth()
  const product = products.find((p) => p.id === initialProduct.id) ?? initialProduct
  const reviews = product.reviews || []
  // The author always comes from the signed-in account (the server action
  // attributes it the same way) — no name input needed.
  const authorName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Guest"

  const [isWritingReview, setIsWritingReview] = useState(false)
  const [formRating, setFormRating] = useState(5)
  const [comment, setComment] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({})
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null)

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || uploadingPhotos) return
    const remaining = MAX_REVIEW_PHOTOS - photos.length
    if (remaining <= 0) {
      setErrorMessage(`Up to ${MAX_REVIEW_PHOTOS} photos per review.`)
      return
    }
    setUploadingPhotos(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files).slice(0, remaining)) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await uploadMediaAction(fd)
        if (res.ok) uploaded.push(res.data.url)
        else {
          setErrorMessage(res.error)
          break
        }
      }
      if (uploaded.length > 0) {
        setPhotos((prev) => [...prev, ...uploaded])
        setErrorMessage("")
      }
    } finally {
      setUploadingPhotos(false)
    }
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : product.rating || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || submitted) return
    if (comment.trim().length < 3) {
      setErrorMessage("Please enter your review comments.")
      return
    }
    setSubmitting(true)
    const result = await addReview(product.id, {
      rating: formRating,
      comment: comment.trim(),
      photos,
    })
    setSubmitting(false)
    if (!result.ok) {
      setErrorMessage(result.error || "Could not post your review.")
      return
    }
    setErrorMessage("")
    setSubmitted(true)
    setTimeout(() => {
      setComment("")
      setPhotos([])
      setFormRating(5)
      setSubmitted(false)
      setIsWritingReview(false)
    }, 1200)
  }

  return (
    <div className="w-full font-sans" id="product-reviews">
      {/* Container Card */}
      <div className="w-full bg-[#f7f7f6] dark:bg-white/5 rounded-[28px] p-4 sm:p-6 border border-neutral-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-2 mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-semibold tracking-tight text-neutral-900 dark:text-[var(--foreground)] uppercase">
              Customer Reviews
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-200/80 text-neutral-800 dark:bg-white/10 dark:text-[var(--foreground)]">
              {reviews.length}
            </span>
          </div>
        </div>

        {/* Rating Summary Banner */}
        <div className="bg-white dark:bg-[var(--card)] p-4 sm:p-5 rounded-2xl border border-neutral-200/70 dark:border-white/10 flex items-center justify-between shadow-xs mb-3.5">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#f4f3f0] dark:bg-white/10 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-[#f5be38] text-[#f5be38]" aria-hidden />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-[var(--foreground)] tracking-tight">
                  {averageRating > 0 ? averageRating.toFixed(1) : "—"}
                </span>
                <span className="text-xs text-neutral-400 font-normal dark:text-[var(--muted-foreground)]">out of 5</span>
              </div>
              <p className="text-[11.5px] sm:text-xs text-neutral-400 font-normal dark:text-[var(--muted-foreground)]">
                Based on {reviews.length} verified customer review{reviews.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {!isWritingReview && (
            <button
              type="button"
              onClick={() => setIsWritingReview(true)}
              className="text-xs font-medium px-3.5 sm:px-4 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              <PenLine className="w-3.5 h-3.5" aria-hidden />
              <span>Write a review</span>
            </button>
          )}
        </div>

        {/* Write Review Form */}
        {isWritingReview && (
          <div className="bg-white dark:bg-[var(--card)] rounded-[24px] overflow-hidden shadow-xs border border-neutral-200/70 dark:border-white/10 transition-all mb-3">
            <div className="p-4 sm:p-6 space-y-4">
              {/* Product Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-[var(--foreground)] tracking-tight leading-snug">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex items-center gap-0.5 text-[#f5be38]" aria-hidden>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= Math.round(averageRating)
                              ? "fill-[#f5be38] text-[#f5be38]"
                              : "fill-[#e8e4db] text-[#e8e4db] dark:fill-white/10 dark:text-white/10"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-neutral-400 font-normal dark:text-[var(--muted-foreground)]">
                      {reviews.length} reviews
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-mono tracking-wider text-neutral-400 dark:text-[var(--muted-foreground)] select-none">
                    SKU-{product.id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsWritingReview(false)
                    setErrorMessage("")
                  }}
                  aria-label="Close review form"
                  className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer dark:bg-white/10 dark:hover:bg-white/20 dark:text-[var(--foreground)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Rating Prompt */}
              <div className="pt-2 pb-2 text-center border-y border-neutral-100 dark:border-white/10">
                <div className="flex items-center justify-center gap-1.5 text-xs mb-2.5">
                  <span className="text-neutral-800 font-medium dark:text-[var(--foreground)]">Your overall rating</span>
                  <span className="text-neutral-400">•</span>
                  <span className="text-neutral-400 font-normal dark:text-[var(--muted-foreground)]">Select 1 to 5 stars</span>
                </div>
                <StarRatingInput value={formRating} onChange={setFormRating} />
              </div>

              {/* Review Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-neutral-800 font-medium dark:text-[var(--foreground)]">Reviewing as</span>
                  <span className="text-neutral-900 font-bold dark:text-[var(--foreground)]">{authorName}</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-800 font-medium dark:text-[var(--foreground)]">Add detailed review</span>
                      <span className="text-neutral-400">•</span>
                      <span className="text-neutral-400 font-normal dark:text-[var(--muted-foreground)]">Fit & comfort</span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-normal dark:text-[var(--muted-foreground)]">
                      {showSizes ? `Size: ${selectedSize} • ` : ""}{selectedColorName}
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={MAX_COMMENT_LENGTH}
                    placeholder="Enter here"
                    className="w-full bg-white dark:bg-white/5 text-xs text-neutral-900 dark:text-[var(--foreground)] rounded-xl p-3.5 border border-neutral-200/90 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all resize-none placeholder:text-neutral-400"
                  />
                </div>

                {/* Review photos (uploaded to storage, persisted with the review) */}
                <div>
                  <div className="flex items-center gap-3">
                    <label
                      className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                        uploadingPhotos || photos.length >= MAX_REVIEW_PHOTOS
                          ? "text-neutral-400 pointer-events-none"
                          : "text-neutral-800 hover:text-black dark:text-[var(--foreground)] cursor-pointer"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={uploadingPhotos || photos.length >= MAX_REVIEW_PHOTOS}
                        onChange={(e) => {
                          void handlePhotoFiles(e.target.files)
                          e.target.value = ""
                        }}
                      />
                      <Camera className="w-4 h-4 text-neutral-500" aria-hidden />
                      <span>{uploadingPhotos ? "Uploading…" : "Add photos"}</span>
                    </label>
                    {photos.length > 0 && (
                      <span className="text-[11px] text-neutral-400 font-normal">
                        {photos.length} of {MAX_REVIEW_PHOTOS}
                      </span>
                    )}
                  </div>
                  {photos.length > 0 && (
                    <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1">
                      {photos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="relative w-14 h-14 rounded-xl overflow-hidden border border-neutral-200 dark:border-white/10 group shrink-0 bg-[#f4f3f0] dark:bg-white/5"
                        >
                          <img
                            src={photo}
                            alt={`Review photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                            aria-label={`Remove photo ${idx + 1}`}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/80 text-white rounded-full flex items-center justify-center opacity-90 hover:opacity-100 cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {errorMessage && <p className="text-xs text-red-500 font-medium">{errorMessage}</p>}

                {submitted && (
                  <div className="p-3 bg-neutral-100 dark:bg-emerald-500/10 text-neutral-900 dark:text-emerald-300 rounded-xl text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden />
                    <span>Thank you! Your review has been submitted.</span>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="submit"
                    disabled={submitted || submitting}
                    className="flex-1 bg-black hover:bg-neutral-800 active:scale-[0.99] text-white py-3 rounded-xl text-xs sm:text-[13.5px] font-medium transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 tracking-tight dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                  >
                    <span>{submitting ? "Posting…" : "Submit"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWritingReview(false)
                      setErrorMessage("")
                    }}
                    className="px-4 py-3 rounded-xl text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer border border-neutral-200 dark:text-[var(--muted-foreground)] dark:hover:text-[var(--foreground)] dark:hover:bg-white/10 dark:border-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Review List */}
        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 pb-2">
            {reviews.map((rev) => {
              const isVoted = helpfulVotes[rev.id]
              return (
                <div key={rev.id} className="relative group">
                  {/* Stacked bottom card layers */}
                  <div className="absolute inset-x-5 -bottom-2 h-6 bg-white/70 dark:bg-white/5 rounded-[18px] border border-neutral-200/50 dark:border-white/10 shadow-xs pointer-events-none" />
                  <div className="absolute inset-x-2.5 -bottom-1 h-5 bg-white/90 dark:bg-white/10 rounded-[19px] border border-neutral-200/70 dark:border-white/10 shadow-xs pointer-events-none" />

                  {/* Main Card */}
                  <div className="relative bg-white dark:bg-[var(--card)] rounded-[20px] p-6 sm:p-7 border border-neutral-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-0.5" role="img" aria-label={`${rev.rating} out of 5 stars`}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= rev.rating
                                  ? "fill-[#f5be38] text-[#f5be38]"
                                  : "fill-[#e5e5e5] text-[#e5e5e5] dark:fill-white/10 dark:text-white/10"
                              }`}
                              aria-hidden
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-neutral-800 dark:text-[var(--foreground)]">
                          {rev.rating}.0
                        </span>
                      </div>

                      <p className="text-[13.5px] sm:text-[14px] text-neutral-800 dark:text-[var(--foreground)] leading-[1.65] font-normal tracking-normal">
                        {rev.comment}
                      </p>

                      {rev.photos && rev.photos.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2.5 mt-4">
                          {rev.photos.map((pic, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => setEnlargedPhoto(pic)}
                              className="w-16 h-16 rounded-xl overflow-hidden border border-neutral-200/80 dark:border-white/10 bg-neutral-100 dark:bg-white/5 shrink-0 cursor-pointer hover:opacity-90 hover:scale-[1.03] transition-all shadow-2xs"
                              title="Click to view image"
                            >
                              <img
                                src={pic}
                                alt={`${rev.user} review photo ${pIdx + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Author row */}
                    <div className="mt-6 sm:mt-7 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {rev.avatar ? (
                            <Image
                              src={rev.avatar}
                              alt={rev.user}
                              width={40}
                              height={40}
                              unoptimized
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#f06400] text-white flex items-center justify-center font-bold text-sm shrink-0 select-none">
                              {initials(rev.user)}
                            </div>
                          )}
                          <div className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white dark:border-[var(--card)] bg-emerald-600 text-white">
                            <CheckCircle2 className="h-2.5 w-2.5" aria-hidden />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[14.5px] font-bold text-neutral-900 dark:text-[var(--foreground)] leading-tight">
                            {rev.user}
                          </h4>
                          <div className="text-xs text-neutral-500 font-normal mt-0.5 dark:text-[var(--muted-foreground)]">
                            {formatReviewDate(rev.date)}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHelpfulVotes((prev) => ({ ...prev, [rev.id]: !prev[rev.id] }))}
                        aria-pressed={!!isVoted}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] transition-colors ${
                          isVoted
                            ? "bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-300"
                            : "text-[var(--muted-foreground)] hover:bg-black/5 dark:hover:bg-white/10"
                        }`}
                      >
                        <ThumbsUp className={`h-3 w-3 ${isVoted ? "fill-emerald-700 dark:fill-emerald-300" : ""}`} aria-hidden />
                        <span>Helpful{isVoted ? " (1)" : ""}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          !isWritingReview && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200/70 dark:border-white/10 bg-white dark:bg-[var(--card)] p-12">
              <Star size={40} className="mb-4 text-neutral-900 dark:text-[var(--foreground)] opacity-10" aria-hidden />
              <p className="font-black tracking-widest text-neutral-900 dark:text-[var(--foreground)] uppercase opacity-30 text-center">
                No reviews yet. Be the first!
              </p>
            </div>
          )
        )}
      </div>

      {/* Enlarged photo lightbox */}
      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div
            className="relative max-w-xl max-h-[85vh] bg-white dark:bg-[var(--card)] rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setEnlargedPhoto(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer z-10"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={enlargedPhoto}
              alt="Review attachment enlarged"
              className="w-full h-auto max-h-[78vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
