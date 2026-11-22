-- =============================================================================
-- 002_revise_food_statuses.sql
-- Revises public.food_listings.status to the values Available / Claimed / Completed.
--
-- Run AFTER 001_food_listings.sql.
--
-- How to run:
--   1. Open your Supabase project dashboard and go to SQL Editor.
--   2. Click "New query", paste the entire contents of this file.
--   3. Click "Run". Run it once (it is not idempotent for the constraint add).
--   4. Confirm under Table Editor that the status values are now Available / Claimed / Completed.
-- =============================================================================

-- Drop the old status check first so the remapped values can be written.
alter table public.food_listings drop constraint if exists food_listings_status_check;

-- Remap existing rows to the new status set.
update public.food_listings set status = 'Available' where status = 'Posted';
update public.food_listings set status = 'Claimed'   where status = 'Claimed';
update public.food_listings set status = 'Claimed'   where status = 'PickedUp';
update public.food_listings set status = 'Completed' where status = 'Delivered';
update public.food_listings set status = 'Completed' where status = 'Expired';

alter table public.food_listings
  add constraint food_listings_status_check
  check (status in ('Available', 'Claimed', 'Completed'));

alter table public.food_listings alter column status set default 'Available';
