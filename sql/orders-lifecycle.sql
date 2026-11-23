-- ============================================================================
-- ORDER LIFECYCLE — run this ONCE in Supabase Dashboard → SQL Editor
--
-- Why: the store console now runs a real fulfilment flow
--      (Pending → Confirmed → Processing → Shipped → Delivered, plus Cancelled)
--      and captures the carrier + tracking number when an order ships. That
--      needs three optional columns and an orders policy that lets the store
--      team — not only the buyer — see and fulfil the whole queue.
--
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS everywhere).
-- Run it AFTER sql/rls-lockdown.sql — it recreates the orders policies on top.
-- Until this runs, each seller still sees and fulfils their own orders.
-- ============================================================================

-- 1. Lifecycle columns (the app degrades gracefully without them).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status_updated_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier           text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number   text;

CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_user_idx   ON public.orders (user_id);

-- 2. Only the six statuses the app knows about.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check') THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_status_check
      CHECK (status IN ('Pending','Confirmed','Processing','Shipped','Delivered','Cancelled'));
  END IF;
END $$;

-- 3. Orders are private to the buyer — and the store team runs the queue.
--    (Store team = the admin plus the seller logins; add more emails here if
--     you later invite another operator.)
CREATE OR REPLACE FUNCTION public.is_store_team()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    'admin@a-store.shop',
    'tester@a-store.shop'
  );
$$;

DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
CREATE POLICY "orders_select_own_or_admin"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid() OR public.is_store_team());

DROP POLICY IF EXISTS "orders_update_own_or_admin" ON public.orders;
CREATE POLICY "orders_update_own_or_admin"
  ON public.orders FOR UPDATE
  USING (user_id = auth.uid() OR public.is_store_team())
  WITH CHECK (user_id = auth.uid() OR public.is_store_team());

-- 4. Verify from the SQL editor:
--    SELECT policyname, cmd FROM pg_policies WHERE tablename = 'orders';
--    SELECT status, count(*) FROM public.orders GROUP BY status ORDER BY 1;
