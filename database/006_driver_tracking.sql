-- =============================================================================
-- 006_driver_tracking.sql
-- Adds driver assignment and delivery tracking for claimed food listings.
--
-- Run AFTER 003_ngo_claims.sql (claimed_by must exist).
--
-- Status flow:
--   Claimed -> DriverAssigned -> PickedUp -> InTransit -> Delivered
--
-- Like claim_food_listing() in 003, both functions run as SECURITY DEFINER and
-- only touch rows where claimed_by = auth.uid(), so RLS on update stays unchanged.
--
-- How to run:
--   1. Open your Supabase project dashboard and go to SQL Editor.
--   2. Click "New query", paste the entire contents of this file.
--   3. Click "Run". Re-running is safe: the constraint swap is wrapped in a DO block
--      and the column adds and function replaces are idempotent.
--   4. Confirm under Database > Functions that assign_driver and
--      advance_food_status exist.
-- =============================================================================

-- Drop whatever status check constraint currently exists on food_listings
-- (its name is not known in advance), so the expanded status list can be added.
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
  check (status in ('Available', 'Claimed', 'Completed', 'DriverAssigned', 'PickedUp', 'InTransit', 'Delivered'));

alter table public.food_listings
  add column if not exists driver_name text,
  add column if not exists driver_phone text,
  add column if not exists driver_assigned_at timestamptz,
  add column if not exists status_updated_at timestamptz;

-- Assigns a driver to a listing the caller has claimed. Moves Claimed -> DriverAssigned.
create or replace function public.assign_driver(
  p_id uuid,
  p_driver_name text,
  p_driver_phone text
)
returns public.food_listings
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.food_listings;
begin
  update public.food_listings
     set status = 'DriverAssigned',
         driver_name = p_driver_name,
         driver_phone = p_driver_phone,
         driver_assigned_at = now(),
         status_updated_at = now()
   where id = p_id
     and claimed_by = auth.uid()
     and status = 'Claimed'
  returning * into r;

  if not found then
    raise exception 'Listing is not claimed by you or is not in Claimed status';
  end if;

  return r;
end;
$$;

revoke execute on function public.assign_driver(uuid, text, text) from public;
grant execute on function public.assign_driver(uuid, text, text) to authenticated;

-- Moves a claimed listing along the delivery path. Only the allowed pairs are accepted:
-- DriverAssigned -> PickedUp, PickedUp -> InTransit, InTransit -> Delivered.
create or replace function public.advance_food_status(p_id uuid, p_to text)
returns public.food_listings
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.food_listings;
  allowed boolean;
begin
  select * into r
    from public.food_listings
   where id = p_id
     and claimed_by = auth.uid()
   for update;

  if not found then
    raise exception 'Listing is not claimed by you';
  end if;

  allowed := (r.status = 'DriverAssigned' and p_to = 'PickedUp')
          or (r.status = 'PickedUp'       and p_to = 'InTransit')
          or (r.status = 'InTransit'      and p_to = 'Delivered');

  if not allowed then
    raise exception 'Illegal status transition';
  end if;

  update public.food_listings
     set status = p_to,
         status_updated_at = now()
   where id = p_id
  returning * into r;

  return r;
end;
$$;

revoke execute on function public.advance_food_status(uuid, text) from public;
grant execute on function public.advance_food_status(uuid, text) to authenticated;
