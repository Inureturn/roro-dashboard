-- Fix fleet flags: Only Shin Group vessels should be marked as my_fleet
-- Run this in Supabase SQL editor

-- First, reset all flags
UPDATE public.vessels
SET is_my_fleet = false,
    is_competitor = false;

-- Mark the 5 Shin Group vessels as my_fleet
UPDATE public.vessels
SET is_my_fleet = true,
    is_competitor = false,
    operator_group = 'Shin Group'
WHERE mmsi IN (
  '357170000',  -- Ah Shin
  '352808000',  -- Hae Shin
  '352001129',  -- O Soo Shin
  '355297000',  -- Sang Shin
  '356005000'   -- Young Shin
);

-- Mark the remaining 9 vessels as competitors
UPDATE public.vessels
SET is_my_fleet = false,
    is_competitor = true
WHERE mmsi IN (
  '249901000',  -- MV Celine
  '229077000',  -- (competitor vessel)
  '229076000',  -- MV Seraphine
  '219927000',  -- Ark Futura
  '352001162',  -- (competitor vessel)
  '355137000',  -- (competitor vessel)
  '352001920',  -- (competitor vessel)
  '373817000',  -- (competitor vessel)
  '249904000'   -- (competitor vessel)
);

-- Verify the update
SELECT
  mmsi,
  name,
  operator_group,
  is_my_fleet,
  is_competitor
FROM public.vessels
ORDER BY is_my_fleet DESC, name;
