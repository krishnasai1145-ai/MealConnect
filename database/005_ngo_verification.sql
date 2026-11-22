-- =============================================================================
-- 005_ngo_verification.sql
-- NGO verification and trust score inputs on ngo_profiles.
--
-- Run AFTER 004_smart_matching.sql.
--
-- verified is set by a Meal Connect admin in the Supabase dashboard. The
-- counters are maintained by the server when a claim is completed or a proof
-- is recorded (not implemented here). delivered_kg feeds meals distributed.
--
-- How to run:
--   1. Open your Supabase project dashboard and go to SQL Editor.
--   2. Click "New query", paste the entire contents of this file.
--   3. Click "Run". Safe to re-run: every column add is idempotent.
--   4. Confirm under Table Editor that "ngo_profiles" has the new columns.
-- =============================================================================

alter table public.ngo_profiles
  add column if not exists verified boolean not null default false,
  add column if not exists claimed_count integer not null default 0,
  add column if not exists delivered_count integer not null default 0,
  add column if not exists timely_pickups integer not null default 0,
  add column if not exists proof_uploads integer not null default 0,
  add column if not exists delivered_kg numeric not null default 0;
