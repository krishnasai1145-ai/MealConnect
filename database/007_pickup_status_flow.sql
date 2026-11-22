-- =============================================================================
-- 007_pickup_status_flow.sql
-- Pickup coordination status flow: Posted -> Claimed -> Collected -> Delivered.
--
-- Run AFTER 006 (driver assignment). Touches only the status column, the
-- claim_food_listing() function and the new advance_food_status() function.
--
-- Like claim_food_listing(), status changes go through SECURITY DEFINER functions
-- because RLS on update only lets donors edit their own rows. The NGO that claimed
-- a listing advances it with advance_food_status(), which checks claimed_by = auth.uid().
--
-- How to run:
--   1. Open your Supabase project dashboard and go to SQL Editor.
--   2. Click "New query", paste the entire contents of this file.
--   3. Click "Run". Safe to re-run: the mapping, constraint swap, column add and
--      function replace are all idempotent.
--   4. Confirm under Database > Functions that advance_food_status exists.
-- =============================================================================

-- Map existing rows to the new status names before the check constraint changes.
update public.food_listings set status = 'Posted' where status = 'Available';
update public.food_listings set status = 'Claimed' where status = 'DriverAssigned';
update public.food_listings set status = 'Collected' where status in ('PickedUp', 'InTransit');
update public.food_listings set status = 'Delivered' where status = 'Completed';

-- Drop whichever status check constraint exists from earlier files.
do $$
declare
  c record;
begin
  for c in
    select conname
      from pg_constraint
     where conrelid = 'public.food_listings'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute 'alter table public.food_listings drop constraint ' || quote_ident(c.conname);
  end loop;
end
$$;

alter table public.food_listings
  add constraint food_listings_status_check
  check (status in ('Posted', 'Claimed', 'Collected', 'Delivered'));

alter table public.food_listings
  add column if not exists status_updated_at timestamptz;

-- Atomically moves a Posted listing to Claimed and records the claimant.
-- Returns a NULL row when no listing matched (missing, not Posted, or the caller's own).
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
     and status = 'Posted'
     and donor_id <> auth.uid()
  returning * into r;

  return r;
end;
$$;

revoke execute on function public.claim_food_listing(uuid) from public;
grant execute on function public.claim_food_listing(uuid) to authenticated;

-- Moves a listing the caller has claimed one step forward:
-- Claimed -> Collected, or Collected -> Delivered. Any other move is rejected.
create or replace function public.advance_food_status(p_id uuid, p_to text)
returns public.food_listings
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.food_listings;
begin
  select * into r
    from public.food_listings
   where id = p_id
     and claimed_by = auth.uid()
   for update;

  if not found then
    raise exception 'Listing not found or not claimed by you';
  end if;

  if not (
       (r.status = 'Claimed' and p_to = 'Collected')
    or (r.status = 'Collected' and p_to = 'Delivered')
  ) then
    raise exception 'Illegal status transition';
  end if;

  update public.food_listings
     set status = p_to,
         status_updated_at = now(),
         updated_at = now()
   where id = p_id
  returning * into r;

  return r;
end;
$$;

revoke execute on function public.advance_food_status(uuid, text) from public;
grant execute on function public.advance_food_status(uuid, text) to authenticated;
