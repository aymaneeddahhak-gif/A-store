-- ============================================================================
-- RLS LOCKDOWN — run this ONCE in the Supabase Dashboard → SQL Editor
--
-- Why: an audit (check-rls-anon.mjs) proved that the ANON key can UPDATE and
-- DELETE rows in `products` and `orders`. Anyone on the internet could wipe
-- the catalog and all customer orders with one curl command. This script
-- drops the permissive write policies and recreates strict ones:
--
--   products : public READ, owner-only INSERT/UPDATE/DELETE
--   orders   : owner SELECT/INSERT/UPDATE (admin email may read+update all),
--              NO delete for anyone (the app never deletes orders)
--
-- The server's SUPABASE_SERVICE_ROLE_KEY bypasses RLS entirely, so the
-- admin's seller-dashboard actions (status updates) keep working unchanged.
-- ============================================================================

-- 1. Drop every existing policy on the two tables (fresh, known state).
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('products', 'orders')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', r.policyname);
  END LOOP;
END $$;

-- 2. Make sure RLS is ON for both tables.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders   ENABLE ROW LEVEL SECURITY;

-- 3. PRODUCTS — the public catalog.
CREATE POLICY "products_select_public"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "products_insert_own"
  ON public.products FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "products_update_own"
  ON public.products FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "products_delete_own"
  ON public.products FOR DELETE
  USING (user_id = auth.uid());

-- 4. ORDERS — private to the buyer; the store admin may read + fulfill all.
--    The admin is matched by JWT email so no extra table is needed.
CREATE POLICY "orders_select_own_or_admin"
  ON public.orders FOR SELECT
  USING (
    user_id = auth.uid()
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@a-store.shop'
  );

CREATE POLICY "orders_insert_own"
  ON public.orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_update_own_or_admin"
  ON public.orders FOR UPDATE
  USING (
    user_id = auth.uid()
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@a-store.shop'
  )
  WITH CHECK (
    user_id = auth.uid()
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@a-store.shop'
  );

-- (No DELETE policy on orders on purpose — deletes are denied for everyone;
--  the service-role admin path bypasses RLS if ever needed.)

-- 5. Verify from the SQL editor:
--    SELECT tablename, policyname, cmd FROM pg_policies
--    WHERE schemaname='public' AND tablename IN ('products','orders');
