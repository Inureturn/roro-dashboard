-- =========================================================
-- Migration: Add refresh_vessel_latest() function + unique index
-- Run this ONLY if you already have the base schema
-- =========================================================

-- Step 1: Add unique index (required for CONCURRENTLY refresh)
-- This fixes: "cannot refresh materialized view concurrently" error
create unique index if not exists idx_vessel_latest_mmsi
  on public.vessel_latest (mmsi);

-- Step 2: Create refresh function
create or replace function public.refresh_vessel_latest()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.vessel_latest;
end;
$$;

-- Step 3: Verify it works
-- select public.refresh_vessel_latest();
-- Should succeed! ✅
