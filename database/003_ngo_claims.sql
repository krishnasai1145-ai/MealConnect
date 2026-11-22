-- =============================================================================
-- 003_ngo_claims.sql
-- Adds NGO claiming: claimed_by column and the claim_food_listing() function.
--
-- Run AFTER 002_revise_food_statuses.sql.
--
-- RLS on update only lets donors edit their own rows, so claiming goes through
-- claim_food_listing(), which runs as SECURITY DEFINER and changes only rows that
-- are still Available and not owned by the caller. NGOs can already SELECT all
-- listings via food_select_authenticated (001), so no select policy is changed here.
--
-- How to run:
--   1. Open your Supabase project dashboard and go to SQL Editor.
--   2. Click "New query", paste the entire contents of this file.
--   3. Click "Run". Safe to re-run: the column add and function replace are idempotent.
--   4. Confirm under Database > Functions that claim_food_listing exists.
-- =============================================================================

alter table public.food_listings
  add column if not exists claimed_by uuid references auth.users(id) on delete set null;

-- Atomically moves an Available listing to Claimed and records the claimant.
-- Returns a NULL row when no listing matched (missing, not Available, or the caller's own).
create or replace function public.claim_food_listing(p_id uuid)
returns public.food_listings
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.food_listings;
begin
  update public.food_listings
     set status = 'Claimed',
         claimed_by = auth.uid(),
         updated_at = now()
   where id = p_id
     and status = 'Available'
     and donor_id <> auth.uid()
  returning * into r;

  return r;
end;
$$;

revoke execute on function public.claim_food_listing(uuid) from public;
grant execute on function public.claim_food_listing(uuid) to authenticated;
