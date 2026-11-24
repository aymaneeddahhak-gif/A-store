import type { Product } from "@/lib/types"

/**
 * Product media resolution + asset-path migration.
 *
 * The product image files moved from /images to /images/product (some were
 * renamed). Rows seeded before the move keep pointing at the old locations,
 * so paths are rewritten on read. Only the path changes — names, prices and
 * every other field stay authoritative from the database.
 *
 * Showcase clips are keyed by image file rather than product id, so any row
 * reusing a project image automatically gets its clip. When a row carries
 * its own `video` value, that wins.
 */

export type MediaItem =
  | { kind: "image"; src: string }
  | { kind: "video"; src: string }

/** Old asset location → current file. Old paths with no entry have no
 *  project file and their rows are dropped on read. */
const IMAGE_MIGRATION: Record<string, string> = {
  "/images/airpods.png": "/images/product/airpods.png",
  "/images/RMADRIDKIT.png": "/images/product/RMADRIDKIT.png",
  "/images/sneakers.png": "/images/product/sneakers.png",
  "/images/pteitpain.png": "/images/product/Croisant.png",
  "/images/iphone-17-pro-max-naranja-cosmico-5.png": "/images/product/iphone-17.png",
  "/images/10748_2703_00.png": "/images/product/bluejacket.png",
  "/images/ASSET_MP_98772542.png": "/images/product/laptop.png",
  "/images/images.png": "/images/product/umbrella.png",
  "/images/spalding-urban-gold-college-jacket-965623.png": "/images/product/S-kacket.png",
  "/images/weddg.png": "/images/product/weddg.png",
}

/** Showcase clip per product image file (pairs in /videos/product). */
const VIDEO_BY_IMAGE: Record<string, string> = {
  "airpods.png": "/videos/product/earpodsvideos.mp4",
  "RMADRIDKIT.png": "/videos/product/RMJERSY.mp4",
  "sneakers.png": "/videos/product/sneakersvideo.mp4",
  "Croisant.png": "/videos/product/Croisant.mp4",
  "iphone-17.png": "/videos/product/iphonevideo.mp4",
  "bluejacket.png": "/videos/product/bluejacketvideo.mp4",
  "laptop.png": "/videos/product/laptop.mp4",
  "S-kacket.png": "/videos/product/S-jacket.mp4",
  "umbrella.png": "/videos/product/umbrellavideo.mp4",
  "weddg.png": "/videos/product/weddgdress.mp4",
}

function migratePath(path: string): string | null {
  // Blank image fields can't render — treat them as unresolvable so the row
  // is dropped instead of 400ing the image optimizer with an empty url.
  if (!path.trim()) return null
  if (!path.startsWith("/images/")) return path
  if (path.startsWith("/images/product/") || path.startsWith("/images/logo/")) return path
  return IMAGE_MIGRATION[path] ?? null
}

/**
 * Rewrites a row's image paths to their current locations, or returns null
 * when the row's image has no file in the project (leftover dev rows).
 *
 * Also the sanitizer for persisted snapshots (cart lines, order items):
 * localStorage and old order rows predate the asset move and would otherwise
 * 400 the image optimizer on every page that renders them.
 */
export function migrateProductAssetPaths(product: Product): Product | null {
  const image = migratePath(product.image)
  if (image === null) return null

  const images = product.images
    ?.map(migratePath)
    .filter((src): src is string => src !== null)

  return { ...product, image, images: images?.length ? images : product.images }
}

/** The showcase clip for a product, or null when it has none. */
export function getProductVideo(product: Product): string | null {
  if (product.video) return product.video
  const basename = product.image.split("/").pop()
  return (basename && VIDEO_BY_IMAGE[basename]) ?? null
}

/**
 * Full media list for the detail gallery: the primary image, any extra
 * images (including per-color variant images), then the showcase video.
 * Duplicate sources are dropped.
 */
export function getProductMedia(product: Product, extraImages: string[] = []): MediaItem[] {
  const images = [product.image, ...(product.images ?? []), ...extraImages].filter(
    (src, i, all) => Boolean(src) && all.indexOf(src) === i
  )
  const media: MediaItem[] = images.map((src) => ({ kind: "image", src }))

  const video = getProductVideo(product)
  if (video) media.push({ kind: "video", src: video })

  return media
}
