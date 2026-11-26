-- ============================================================================
-- RLS LOCKDOWN — run this ONCE in the Supabase Dashboard → SQL Editor
--
-- Why: Ensures strict Row-Level Security across the catalog and orders.
--
--   products : public READ, owner/store-team INSERT/UPDATE/DELETE
--   orders   : owner + store-team SELECT,
--              authenticated INSERT (forced to Pending),
--              store-team ONLY for UPDATE (buyers cannot forge status/total),
--              NO delete for anyone (orders must be preserved for audit)
-- ============================================================================

-- 1. Helper function for store team authorization
CREATE OR REPLACE FUNCTION public.is_store_team()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    'admin@a-store.shop',
    'seller@a-store.shop'
  );
$$;

-- 2. Drop existing policies on products and orders
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('products', 'orders')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 3. Make sure RLS is ON for both tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders   ENABLE ROW LEVEL SECURITY;

-- 4. PRODUCTS
CREATE POLICY "products_select_public"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "products_insert_authorized"
  ON public.products FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_store_team());

CREATE POLICY "products_update_authorized"
  ON public.products FOR UPDATE
  USING (user_id = auth.uid() OR public.is_store_team())
  WITH CHECK (user_id = auth.uid() OR public.is_store_team());

CREATE POLICY "products_delete_authorized"
  ON public.products FOR DELETE
  USING (user_id = auth.uid() OR public.is_store_team());

-- 5. ORDERS
CREATE POLICY "orders_select_own_or_team"
  ON public.orders FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_store_team()
  );

CREATE POLICY "orders_insert_authenticated"
  ON public.orders FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'Pending'
  );

CREATE POLICY "orders_update_team_only"
  ON public.orders FOR UPDATE
  USING (public.is_store_team())
  WITH CHECK (public.is_store_team());

-- (No DELETE policy on orders — deletes are denied for all non-service roles)
