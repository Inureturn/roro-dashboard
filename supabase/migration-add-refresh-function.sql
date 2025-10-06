-- =========================================================
-- Migration: Add refresh_vessel_latest() function
-- Run this ONLY if you already have the base schema
-- =========================================================

-- Check if materialized view exists (if not, run full schema.sql first)
-- This function allows the refresh-view.mjs script to work

create or replace function public.refresh_vessel_latest()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.vessel_latest;
end;
$$;

-- Verify it works:
-- select public.refresh_vessel_latest();
