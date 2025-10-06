-- =========================================================
-- FIX: Add unique index to materialized view
-- Run this in Supabase SQL Editor
-- =========================================================

-- The materialized view needs a unique index to refresh concurrently
-- This fixes the error: "cannot refresh materialized view concurrently"

-- Add unique index on mmsi (which is unique in this view)
create unique index if not exists idx_vessel_latest_mmsi
  on public.vessel_latest (mmsi);

-- Test the refresh function now works:
select public.refresh_vessel_latest();

-- Should succeed! ✅
