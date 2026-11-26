-- ============================================================================
-- A-STORE: Sync Missing Schema, Promo Seed, Realtime & Asset Paths
--
-- Checked against live Supabase:
--   1. Creates missing table `public.product_likes` + RLS policies
--   2. Ensures optional `deals_popup` columns exist
--   3. Seeds missing promo code `VIP50` (50% off) alongside existing codes
--   4. Enables Supabase Realtime on `orders`, `products`, and `store_settings`
--   5. Updates legacy `/images/...` paths & missing `video` links on official
--      catalog rows (`user_id IS NULL`) WITHOUT changing names, prices, or IDs
--
-- Safe to re-run in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- NOTE: Do NOT re-run sql/seed.sql if you want to keep your custom product
--       names/prices/IDs (1..9, 15) as they currently are.
-- ============================================================================

-- 1. MISSING TABLE: public.product_likes (per-user wishlist rows)
CREATE TABLE IF NOT EXISTS public.product_likes (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_likes_select_own" ON public.product_likes;
CREATE POLICY "product_likes_select_own"
  ON public.product_likes FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "product_likes_manage_own" ON public.product_likes;
CREATE POLICY "product_likes_manage_own"
  ON public.product_likes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. ENSURE ALL deals_popup COLUMNS EXIST
ALTER TABLE public.deals_popup ADD COLUMN IF NOT EXISTS previous_prices jsonb;
ALTER TABLE public.deals_popup ADD COLUMN IF NOT EXISTS image_url       text;
ALTER TABLE public.deals_popup ADD COLUMN IF NOT EXISTS updated_at      timestamptz NOT NULL DEFAULT now();

-- 3. SEED MISSING PROMO CODE (`WELCOME10` and `SAVE20` already exist)
INSERT INTO public.promo_codes (code, percent_off, active)
VALUES
  ('WELCOME10', 10, true),
  ('SAVE20',    20, true),
  ('VIP50',     50, true)
ON CONFLICT (code) DO NOTHING;

-- 4. ENSURE REALTIME PUBLICATION INCLUDES orders, products, store_settings
DO $$
DECLARE
  t text;
BEGIN
  ALTER TABLE public.orders         REPLICA IDENTITY FULL;
  ALTER TABLE public.products       REPLICA IDENTITY FULL;
  ALTER TABLE public.store_settings REPLICA IDENTITY FULL;

  FOREACH t IN ARRAY ARRAY['orders', 'products', 'store_settings'] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- 5. OPTIONAL CLEANUP: Update legacy `/images/...` paths & null `video` columns
--    on existing official products (`user_id IS NULL`), preserving names/prices.
UPDATE public.products
SET
  image = CASE image
    WHEN '/images/airpods.png'                                   THEN '/images/product/airpods.png'
    WHEN '/images/RMADRIDKIT.png'                                THEN '/images/product/RMADRIDKIT.png'
    WHEN '/images/sneakers.png'                                  THEN '/images/product/sneakers.png'
    WHEN '/images/pteitpain.png'                                 THEN '/images/product/Croisant.png'
    WHEN '/images/iphone-17-pro-max-naranja-cosmico-5.png'       THEN '/images/product/iphone-17.png'
    WHEN '/images/10748_2703_00.png'                             THEN '/images/product/bluejacket.png'
    WHEN '/images/ASSET_MP_98772542.png'                         THEN '/images/product/laptop.png'
    WHEN '/images/images.png'                                    THEN '/images/product/umbrella.png'
    WHEN '/images/spalding-urban-gold-college-jacket-965623.png' THEN '/images/product/S-kacket.png'
    ELSE image
  END,
  images = CASE image
    WHEN '/images/airpods.png'                                   THEN '["/images/product/airpods.png"]'::jsonb
    WHEN '/images/RMADRIDKIT.png'                                THEN '["/images/product/RMADRIDKIT.png"]'::jsonb
    WHEN '/images/sneakers.png'                                  THEN '["/images/product/sneakers.png"]'::jsonb
    WHEN '/images/pteitpain.png'                                 THEN '["/images/product/Croisant.png"]'::jsonb
    WHEN '/images/iphone-17-pro-max-naranja-cosmico-5.png'       THEN '["/images/product/iphone-17.png"]'::jsonb
    WHEN '/images/10748_2703_00.png'                             THEN '["/images/product/bluejacket.png"]'::jsonb
    WHEN '/images/ASSET_MP_98772542.png'                         THEN '["/images/product/laptop.png"]'::jsonb
    WHEN '/images/images.png'                                    THEN '["/images/product/umbrella.png"]'::jsonb
    WHEN '/images/spalding-urban-gold-college-jacket-965623.png' THEN '["/images/product/S-kacket.png"]'::jsonb
    ELSE images
  END,
  video = COALESCE(
    video,
    CASE image
      WHEN '/images/airpods.png'                                   THEN '/videos/product/earpodsvideos.mp4'
      WHEN '/images/product/airpods.png'                           THEN '/videos/product/earpodsvideos.mp4'
      WHEN '/images/RMADRIDKIT.png'                                THEN '/videos/product/RMJERSY.mp4'
      WHEN '/images/product/RMADRIDKIT.png'                        THEN '/videos/product/RMJERSY.mp4'
      WHEN '/images/sneakers.png'                                  THEN '/videos/product/sneakersvideo.mp4'
      WHEN '/images/product/sneakers.png'                          THEN '/videos/product/sneakersvideo.mp4'
      WHEN '/images/pteitpain.png'                                 THEN '/videos/product/Croisant.mp4'
      WHEN '/images/product/Croisant.png'                          THEN '/videos/product/Croisant.mp4'
      WHEN '/images/iphone-17-pro-max-naranja-cosmico-5.png'       THEN '/videos/product/iphonevideo.mp4'
      WHEN '/images/product/iphone-17.png'                         THEN '/videos/product/iphonevideo.mp4'
      WHEN '/images/10748_2703_00.png'                             THEN '/videos/product/bluejacketvideo.mp4'
      WHEN '/images/product/bluejacket.png'                        THEN '/videos/product/bluejacketvideo.mp4'
      WHEN '/images/ASSET_MP_98772542.png'                         THEN '/videos/product/laptop.mp4'
      WHEN '/images/product/laptop.png'                            THEN '/videos/product/laptop.mp4'
      WHEN '/images/images.png'                                    THEN '/videos/product/umbrellavideo.mp4'
      WHEN '/images/product/umbrella.png'                          THEN '/videos/product/umbrellavideo.mp4'
      WHEN '/images/spalding-urban-gold-college-jacket-965623.png' THEN '/videos/product/S-jacket.mp4'
      WHEN '/images/product/S-kacket.png'                          THEN '/videos/product/S-jacket.mp4'
      WHEN '/images/product/weddg.png'                             THEN '/videos/product/weddgdress.mp4'
      ELSE NULL
    END
  )
WHERE user_id IS NULL;

-- 6. Ensure identity sequence stays ahead of MAX(id)
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.products));

-- 7. Verify results
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
SELECT code, percent_off, active FROM public.promo_codes ORDER BY percent_off;
SELECT id, name, image, video FROM public.products WHERE user_id IS NULL ORDER BY id;
