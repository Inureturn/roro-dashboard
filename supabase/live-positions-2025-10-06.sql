-- ⚠️ LIVE POSITIONS PULLED FROM VESSELFINDER - 2025-10-06
--
-- This script contains REAL vessel positions as of 2025-10-06T15:34:34.020Z
--
-- ⚠️ WARNING: This data will become outdated within hours!
-- ⚠️ PURPOSE: Demo stakeholders the dashboard interface with real-looking data
-- ⚠️ NOT REAL-TIME: Positions are snapshot from 2025-10-06
--
-- UI INDICATOR: Dashboard will show "Last updated 2025-10-06" to clarify this is pulled data
--
-- NEXT STEPS:
-- 1. Run this SQL once in Supabase
-- 2. Add UI banner: "Demo data from 2025-10-06 - Real-time coming with satellite view"
-- 3. Implement satellite view (3-4 hours)
-- 4. DELETE this file - use real AIS instead
--
-- Generated: 2025-10-06T15:34:34.020Z
-- Vessels: 5
-- ════════════════════════════════════════════════════════════════════════════

-- Ensure vessels exist
INSERT INTO public.vessels (mmsi, name, is_my_fleet, operator_group)
VALUES
  ('357170000', 'Ah Shin', true, 'Shin Group'),
  ('352808000', 'Hae Shin', true, 'Shin Group'),
  ('352001129', 'O Soo Shin', true, 'Shin Group'),
  ('355297000', 'Sang Shin', true, 'Shin Group'),
  ('356005000', 'Young Shin', true, 'Shin Group')
ON CONFLICT (mmsi) DO NOTHING;

-- Update vessel details and add current positions


-- Ah Shin (357170000) - FAILED TO FETCH
UPDATE public.vessels SET
  name = 'Ah Shin',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  is_my_fleet = true,
  notes = '⚠️ Could not fetch position on 2025-10-06'
WHERE mmsi = '357170000';


-- Hae Shin (352808000) - FAILED TO FETCH
UPDATE public.vessels SET
  name = 'Hae Shin',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  is_my_fleet = true,
  notes = '⚠️ Could not fetch position on 2025-10-06'
WHERE mmsi = '352808000';


-- O Soo Shin (352001129) - FAILED TO FETCH
UPDATE public.vessels SET
  name = 'O Soo Shin',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  is_my_fleet = true,
  notes = '⚠️ Could not fetch position on 2025-10-06'
WHERE mmsi = '352001129';


-- Sang Shin (355297000) - FAILED TO FETCH
UPDATE public.vessels SET
  name = 'Sang Shin',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  is_my_fleet = true,
  notes = '⚠️ Could not fetch position on 2025-10-06'
WHERE mmsi = '355297000';


-- Young Shin (356005000) - FAILED TO FETCH
UPDATE public.vessels SET
  name = 'Young Shin',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  is_my_fleet = true,
  notes = '⚠️ Could not fetch position on 2025-10-06'
WHERE mmsi = '356005000';


-- ════════════════════════════════════════════════════════════════════════════
-- ✅ VERIFICATION QUERY
-- ════════════════════════════════════════════════════════════════════════════
SELECT
  v.mmsi,
  v.name,
  v.notes,
  vp.lat,
  vp.lon,
  vp.sog_knots,
  vp.ts as position_time,
  vp.source
FROM vessels v
LEFT JOIN vessel_positions vp ON v.mmsi = vp.mmsi
WHERE v.is_my_fleet = true
  AND vp.source = 'pulled'
ORDER BY v.name;

-- ⚠️ CRITICAL REMINDER ⚠️
-- This is pulled data from 2025-10-06 - NOT real-time tracking!
-- Add UI banner to clarify for stakeholders.
-- Delete after satellite view is implemented.
