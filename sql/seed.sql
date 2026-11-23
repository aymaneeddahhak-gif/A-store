-- ============================================================================
-- A-STORE: Seed Data
--
-- Run this in Supabase SQL Editor after running sql/schema.sql to populate
-- initial products, active promo codes, and demo content.
-- ============================================================================

-- 1. PROMO CODES
INSERT INTO public.promo_codes (code, percent_off, active)
VALUES
  ('WELCOME10', 10, true),
  ('SAVE20',    20, true),
  ('VIP50',     50, true)
ON CONFLICT (code) DO UPDATE
SET percent_off = EXCLUDED.percent_off, active = EXCLUDED.active;

-- 2. PRODUCTS (Matches public/images/product/* and public/videos/product/*)
INSERT INTO public.products (
  id, name, price, original_price, description, category, rating, reviews,
  image, images, video, stock, is_published, featured, likes, user_id
)
VALUES
(
  1,
  'Stealth Earbuds Pro',
  199.00,
  249.00,
  'Studio-grade wireless earbuds with adaptive active noise cancellation, spatial audio head-tracking, and a 48-hour MagSafe charging case.',
  'gaming',
  4.8,
  '[{"id":"rev-1","user":"Alex M.","rating":5,"comment":"Incredible noise cancellation and battery life.","date":"2026-09-12"}]'::jsonb,
  '/images/product/airpods.png',
  '["/images/product/airpods.png"]'::jsonb,
  '/videos/product/earpodsvideos.mp4',
  45,
  true,
  true,
  128,
  NULL
),
(
  2,
  'Real Madrid Home Kit 26/27',
  120.00,
  160.00,
  'Official match-day performance jersey featuring breathable micro-perforated fabric, metallic gold trim, and woven club crest.',
  'clothes',
  4.9,
  '[{"id":"rev-2","user":"Karim B.","rating":5,"comment":"Authentic fit and premium fabric feel.","date":"2026-09-14"}]'::jsonb,
  '/images/product/RMADRIDKIT.png',
  '["/images/product/RMADRIDKIT.png"]'::jsonb,
  '/videos/product/RMJERSY.mp4',
  85,
  true,
  true,
  215,
  NULL
),
(
  3,
  'Aero Carbon Pro Sneakers',
  180.00,
  240.00,
  'Ultra-lightweight street and running silhouette engineered with a responsive carbon-fiber plate and dual-density foam midsole.',
  'sneakers',
  4.8,
  '[]'::jsonb,
  '/images/product/sneakers.png',
  '["/images/product/sneakers.png"]'::jsonb,
  '/videos/product/sneakersvideo.mp4',
  60,
  true,
  true,
  96,
  NULL
),
(
  4,
  'Artisan Butter Croissant',
  4.50,
  6.00,
  'Traditionally laminated French pastry crafted with 84% cultured Normandy butter, slow-fermented for 72 hours and baked fresh daily.',
  'food',
  5.0,
  '[]'::jsonb,
  '/images/product/Croisant.png',
  '["/images/product/Croisant.png"]'::jsonb,
  '/videos/product/Croisant.mp4',
  30,
  true,
  false,
  142,
  NULL
),
(
  5,
  'iPhone 17 Pro Max Titanium',
  1099.00,
  1299.00,
  'Aerospace-grade titanium enclosure, A19 Pro silicon, 120Hz ProMotion Always-On OLED display, and 5x tetraprism optical zoom system.',
  'phones',
  4.9,
  '[{"id":"rev-5","user":"Sarah K.","rating":5,"comment":"The camera and battery life are on another level.","date":"2026-09-18"}]'::jsonb,
  '/images/product/iphone-17.png',
  '["/images/product/iphone-17.png"]'::jsonb,
  '/videos/product/iphonevideo.mp4',
  40,
  true,
  true,
  310,
  NULL
),
(
  6,
  'Nordwind Insulated Parka',
  249.00,
  320.00,
  'All-weather technical down jacket with seam-sealed ripstop shell, thermal-reflective lining, and adjustable storm hood.',
  'clothes',
  4.7,
  '[]'::jsonb,
  '/images/product/bluejacket.png',
  '["/images/product/bluejacket.png"]'::jsonb,
  '/videos/product/bluejacketvideo.mp4',
  25,
  true,
  false,
  74,
  NULL
),
(
  7,
  'Varsity Urban Gold Bomber',
  150.00,
  195.00,
  'Heavyweight wool-blend collegiate bomber jacket finished with grained leather sleeves, quilted satin lining, and chenille embroidery.',
  'clothes',
  4.6,
  '[]'::jsonb,
  '/images/product/S-kacket.png',
  '["/images/product/S-kacket.png"]'::jsonb,
  '/videos/product/S-jacket.mp4',
  35,
  true,
  false,
  62,
  NULL
),
(
  8,
  'Studio Pro 16 Workstation',
  1699.00,
  1999.00,
  '16-inch 4K OLED InfinityEdge display, 32GB unified memory, 1TB NVMe SSD, and CNC-machined aluminum chassis for creators and engineers.',
  'phones',
  4.9,
  '[]'::jsonb,
  '/images/product/laptop.png',
  '["/images/product/laptop.png"]'::jsonb,
  '/videos/product/laptop.mp4',
  20,
  true,
  true,
  118,
  NULL
),
(
  9,
  'StormShield Carbon Umbrella',
  45.00,
  65.00,
  'Wind-tunnel tested to 70 mph with flexible carbon-fiber ribs, hydrophobic Teflon canopy coating, and one-touch auto deployment.',
  'clothes',
  4.5,
  '[]'::jsonb,
  '/images/product/umbrella.png',
  '["/images/product/umbrella.png"]'::jsonb,
  '/videos/product/umbrellavideo.mp4',
  50,
  true,
  false,
  48,
  NULL
),
(
  10,
  'Atelier Couture Evening Gown',
  420.00,
  550.00,
  'Hand-draped silk organza silhouette with structured corset boning, delicate tonal beadwork, and a sweeping cathedral train.',
  'clothes',
  4.9,
  '[]'::jsonb,
  '/images/product/weddg.png',
  '["/images/product/weddg.png"]'::jsonb,
  '/videos/product/weddgdress.mp4',
  12,
  true,
  false,
  89,
  NULL
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image = EXCLUDED.image,
  images = EXCLUDED.images,
  video = EXCLUDED.video,
  stock = EXCLUDED.stock,
  is_published = EXCLUDED.is_published,
  featured = EXCLUDED.featured;

SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.products));
