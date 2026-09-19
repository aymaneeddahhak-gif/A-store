-- Seller "Apply offer" feature: stores the percent picked in the seller
-- Offers tab. NULL = the home popup derives its percent from live catalog
-- deals (previous behavior).
--
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query).

alter table public.deals_popup
  add column if not exists applied_percent smallint
  check (applied_percent is null or (applied_percent >= 1 and applied_percent <= 100));

-- The popup row is upserted with id = 1; make sure RLS allows the server
-- client (service role / authenticated admin) to update the new column.
-- If your RLS policy already covers all columns with `using (true)` style
-- grants for the server role, no extra policy is needed.
