-- ============================================================================
-- CATALOG REALTIME — run this ONCE in Supabase Dashboard → SQL Editor
--
-- Why: the store console and the storefront both subscribe to Postgres changes
--      on `products` and `store_settings`, so an admin edit (a product already
--      streams to every open tab), a pin/unpin on the homepage showcase, and a
--      stock change land live — no page reload.
--
-- Safe to re-run: the DO block only adds a table when it is missing, and
-- Supabase drops a table from the publication with a NOTICE if it is already in.
-- Until this runs, nothing breaks: the acting tab still updates itself, and the
-- subscription is simply quiet.
-- ============================================================================

DO $$
DECLARE
  t text;
BEGIN
  -- Realtime needs a full row image for updates to carry the new values.
  ALTER TABLE public.products       REPLICA IDENTITY FULL;
  ALTER TABLE public.store_settings REPLICA IDENTITY FULL;

  FOREACH t IN ARRAY ARRAY['products', 'store_settings'] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      RAISE NOTICE 'Added public.% to supabase_realtime', t;
    ELSE
      RAISE NOTICE 'public.% is already published', t;
    END IF;
  END LOOP;
END $$;

-- Sanity check — both rows should be listed.
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('products', 'store_settings')
ORDER BY tablename;
