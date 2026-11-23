-- ============================================================
-- Seller dashboard: newsletter + store settings (run once)
-- Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- 1. Newsletter subscribers
create table if not exists public.newsletter_subscribers (
  email      text primary key check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  source     text not null default 'footer',
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "anyone can subscribe" on public.newsletter_subscribers;
create policy "anyone can subscribe"
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (true);

drop policy if exists "signed-in sellers read subscribers" on public.newsletter_subscribers;
create policy "signed-in sellers read subscribers"
  on public.newsletter_subscribers for select
  to authenticated
  using (true);

-- 2. Store settings (single row, id = 1)
create table if not exists public.store_settings (
  id                 integer primary key default 1 check (id = 1),
  store_name         text not null default 'A-store',
  currency           text not null default 'USD' check (currency in ('USD','EUR','GBP')),
  notification_email text not null default '',
  updated_at         timestamptz not null default now()
);

alter table public.store_settings enable row level security;

drop policy if exists "signed-in sellers read settings" on public.store_settings;
create policy "signed-in sellers read settings"
  on public.store_settings for select
  to authenticated
  using (true);

-- Writes go through the server (session or service-role client).
-- Replace the admin email if yours differs (matches lib/admin.ts).
drop policy if exists "authenticated admin writes settings" on public.store_settings;
create policy "authenticated admin writes settings"
  on public.store_settings for all
  to authenticated
  using (auth.jwt() ->> 'email' = 'admin@a-store.shop')
  with check (auth.jwt() ->> 'email' = 'admin@a-store.shop');

insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- Verify:
-- select tablename, policyname, cmd from pg_policies
-- where schemaname='public' and tablename in ('newsletter_subscribers','store_settings');
