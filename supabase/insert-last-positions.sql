-- ⚠️ TEMPORARY: Manual Position Data for Demo
--
-- This file inserts approximate last known positions for your fleet vessels.
-- Data sourced from VesselFinder on Oct 6, 2025.
--
-- WHY THIS IS TEMPORARY:
-- - These positions are manually fetched and will become outdated quickly
-- - AIS data is delayed or unavailable for these vessels
-- - Once satellite view is implemented, this data will be automatically replaced
--   with real-time positions from satellite tracking
--
-- IMPORTANT: These vessels have NEVER transmitted AIS to your ingestor.
-- The 'source' field is marked 'manual_fetch_2025-10-06' so you can identify
-- and replace this data once satellite view goes live.
--
-- Run this in Supabase SQL Editor AFTER running import-vessel-data.sql
--
-- ============================================================================

-- Ah Shin (357170000)
-- Location: Yarimca, Turkey (Moored at port)
-- Fetched: Oct 6, 2025 (position 3 min old at fetch time)
-- ⚠️ NEVER transmitted AIS - manually fetched from VesselFinder
INSERT INTO public.vessel_positions (mmsi, ts, lat, lon, sog_knots, cog_deg, heading_deg, nav_status, destination, source)
VALUES (
  '357170000',
  NOW() - INTERVAL '3 minutes',
  40.76667,  -- Yarimca port area, Marmara Sea
  29.91667,
  0.0,
  260.2,
  NULL,
  'Moored',
  'Yarimca, Turkey',
  'manual_fetch_2025-10-06'  -- ⚠️ DELETE when satellite view live
);

-- Hae Shin (352808000)
-- Location: South East Asia (en route to Aqaba, Jordan)
-- Fetched: Oct 6, 2025 (position 4 days old at fetch time)
-- ⚠️ NEVER transmitted AIS - manually fetched from VesselFinder
INSERT INTO public.vessel_positions (mmsi, ts, lat, lon, sog_knots, cog_deg, heading_deg, nav_status, destination, source)
VALUES (
  '352808000',
  NOW() - INTERVAL '4 days',
  10.0,      -- South East Asia approximate
  105.0,
  13.7,
  310.7,
  NULL,
  'Under way using engine',
  'Aqaba, Jordan',
  'manual_fetch_2025-10-06'  -- ⚠️ DELETE when satellite view live
);

-- O Soo Shin (352001129)
-- Location: North Pacific (en route to Tianjin Xingang, China)
-- Fetched: Oct 6, 2025 (position 18 days old at fetch time)
-- ⚠️ NEVER transmitted AIS - manually fetched from VesselFinder
INSERT INTO public.vessel_positions (mmsi, ts, lat, lon, sog_knots, cog_deg, heading_deg, nav_status, destination, source)
VALUES (
  '352001129',
  NOW() - INTERVAL '18 days',
  35.0,      -- North Pacific crossing approximate
  -145.0,
  10.9,
  318.4,
  NULL,
  'Under way using engine',
  'Tianjin Xingang, China',
  'manual_fetch_2025-10-06'  -- ⚠️ DELETE when satellite view live
);

-- Sang Shin (355297000)
-- Location: South China Sea (en route to Korea MSN)
-- Fetched: Oct 6, 2025 (position 6 days old at fetch time)
-- ⚠️ NEVER transmitted AIS - manually fetched from VesselFinder
INSERT INTO public.vessel_positions (mmsi, ts, lat, lon, sog_knots, cog_deg, heading_deg, nav_status, destination, source)
VALUES (
  '355297000',
  NOW() - INTERVAL '6 days',
  5.0,       -- Near Singapore approximate
  105.0,
  16.3,
  47.9,
  NULL,
  'Under way using engine',
  'KR MSN',
  'manual_fetch_2025-10-06'  -- ⚠️ DELETE when satellite view live
);

-- Young Shin (356005000)
-- Location: Red Sea (en route to Israel)
-- Fetched: Oct 6, 2025 (position 28 hours old at fetch time)
-- ⚠️ NEVER transmitted AIS - manually fetched from VesselFinder
INSERT INTO public.vessel_positions (mmsi, ts, lat, lon, sog_knots, cog_deg, heading_deg, nav_status, destination, source)
VALUES (
  '356005000',
  NOW() - INTERVAL '28 hours',
  26.0,      -- Red Sea approximate
  34.0,
  12.0,
  328.6,
  NULL,
  'Under way using engine',
  'NO CONTACT ISRAEL',
  'manual_fetch_2025-10-06'  -- ⚠️ DELETE when satellite view live
);

-- ============================================================================
-- CLEANUP INSTRUCTIONS (for when satellite view goes live)
-- ============================================================================
-- Once satellite view is implemented, delete this manually-fetched data:
--
-- DELETE FROM vessel_positions WHERE source = 'manual_fetch_2025-10-06';
--
-- This will remove all manually-fetched positions and let satellite data
-- populate automatically with real-time positions.
-- ============================================================================

-- ============================================================================
-- READY TO RUN
-- ============================================================================
-- After running this SQL in Supabase:
-- 1. Refresh your dashboard at localhost:5173
-- 2. All 5 vessels should now show on the map with arrows/dots
-- 3. Click markers to see vessel details
-- 4. Note: The "Last seen" times reflect when position was fetched (not real-time)
--
-- Next steps:
-- - Positions are good enough for stakeholder demos
-- - Implement satellite view for automatic real-time tracking
-- - Then run cleanup SQL above to remove manual data
-- ============================================================================
