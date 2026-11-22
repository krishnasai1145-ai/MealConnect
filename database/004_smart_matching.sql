-- =============================================================================
-- 004_smart_matching.sql
-- Smart food matching: listing coordinates and the ngo_profiles table.
--
-- Run AFTER 003_ngo_claims.sql.
--
-- NGOs maintain their own profile row via the Supabase dashboard or a future
-- profile screen. need_kg is the NGO's weekly intake capacity in kg.
--
-- How to run:
--   1. Open your Supabase project dashboard and go to SQL Editor.
--   2. Click "New query", paste the entire contents of this file.
--   3. Click "Run". Safe to re-run: the column add and table create are idempotent.
--      The create policy is not idempotent, so drop it first if you re-run this file.
--   4. Confirm under Table Editor that "ngo_profiles" exists with RLS enabled.
-- =============================================================================

alter table public.food_listings
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

-- NGOs maintain their own profile row via the Supabase dashboard or a future
-- profile screen. need_kg is the NGO's weekly intake capacity in kg.
create table if not exists public.ngo_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  latitude    double precision not null,
  longitude   double precision not null,
  need_kg     numeric not null check (need_kg > 0)
);

alter table public.ngo_profiles enable row level security;

create policy "ngo_profiles_select_authenticated"
  on public.ngo_profiles
  for select
  to authenticated
  using (true);
