-- =============================================================================
-- 001_food_listings.sql
-- Food donation module: public.food_listings table, indexes and RLS policies.
--
-- How to run:
--   1. Open your Supabase project dashboard and go to SQL Editor.
--   2. Click "New query", paste the entire contents of this file.
--   3. Click "Run". Run it once on a fresh project (it is not idempotent).
--   4. Confirm under Table Editor that "food_listings" exists with RLS enabled.
-- =============================================================================

create table public.food_listings (
  id              uuid primary key default gen_random_uuid(),
  donor_id        uuid not null references auth.users(id) on delete cascade,
  food_name       text not null check (length(trim(food_name)) > 0),
  category        text not null,
  quantity        numeric not null check (quantity > 0),
  unit            text not null,
  prepared_at     timestamptz,
  pickup_before   timestamptz not null,
  storage_method  text not null,
  allergens       text[] not null default '{}',
  notes           text,
  status          text not null default 'Posted'
                  check (status in ('Posted', 'Claimed', 'PickedUp', 'Delivered', 'Expired')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index food_listings_donor_idx on public.food_listings (donor_id);
create index food_listings_status_pickup_idx on public.food_listings (status, pickup_before);

alter table public.food_listings enable row level security;

create policy "food_select_authenticated"
  on public.food_listings
  for select
  to authenticated
  using (true);

create policy "food_insert_own"
  on public.food_listings
  for insert
  to authenticated
  with check (donor_id = auth.uid());

create policy "food_update_own"
  on public.food_listings
  for update
  to authenticated
  using (donor_id = auth.uid())
  with check (donor_id = auth.uid());

create policy "food_delete_own"
  on public.food_listings
  for delete
  to authenticated
  using (donor_id = auth.uid());
