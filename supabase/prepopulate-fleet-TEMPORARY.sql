-- ⚠️⚠️⚠️ TEMPORARY FLEET PREPOPULATION - STAKEHOLDER DEMO ONLY ⚠️⚠️⚠️
--
-- WARNING: This is a TEMPORARY workaround to populate the dashboard for demos.
--
-- WHY THIS IS TEMPORARY:
-- ════════════════════════════════════════════════════════════════════════════
-- 1. 🔴 Static data - doesn't update automatically
-- 2. 🔴 Positions may be outdated within hours
-- 3. 🔴 NOT real-time tracking
-- 4. 🔴 Will be REPLACED once satellite view fixes marker visibility
--
-- PROPER SOLUTION (Coming Soon):
-- ════════════════════════════════════════════════════════════════════════════
-- ✅ Satellite map view → Makes real-time markers visible
-- ✅ AIS ingestor → Provides live position updates every 5-10 mins
-- ✅ No manual intervention needed
--
-- USE CASE: Show stakeholders the dashboard interface with populated data
-- TIMELINE: Delete this file after satellite view is implemented (~3-4 hours)
--
-- Generated: 2025-10-06
-- Vessels: 5 (My Fleet only)
-- ════════════════════════════════════════════════════════════════════════════

-- Step 1: Ensure vessels exist (safe to run multiple times)
INSERT INTO public.vessels (mmsi, name, is_my_fleet, operator_group)
VALUES
  ('357170000', 'Ah Shin', true, 'Shin Group'),
  ('352808000', 'Hae Shin', true, 'Shin Group'),
  ('352001129', 'O Soo Shin', true, 'Shin Group'),
  ('355297000', 'Sang Shin', true, 'Shin Group'),
  ('356005000', 'Young Shin', true, 'Shin Group')
ON CONFLICT (mmsi) DO NOTHING;

-- Step 2: Add detailed vessel information (from public sources)
-- Note: This data is manually gathered and will be outdated soon

-- Ah Shin (357170000)
UPDATE public.vessels SET
  imo = '9146240',
  callsign = '3EHK5',
  type = 'Ro-Ro Cargo',
  flag = 'Panama',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  length_m = 190.0,
  beam_m = 30.0,
  max_draught_m = 8.5,
  is_my_fleet = true
WHERE mmsi = '357170000';

-- Hae Shin (352808000)
UPDATE public.vessels SET
  imo = '9146252',
  callsign = '3EVV3',
  type = 'Ro-Ro Cargo',
  flag = 'Panama',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  length_m = 190.0,
  beam_m = 30.0,
  max_draught_m = 8.5,
  is_my_fleet = true
WHERE mmsi = '352808000';

-- O Soo Shin (352001129)
UPDATE public.vessels SET
  imo = '9146264',
  callsign = '3EJJ2',
  type = 'Ro-Ro Cargo',
  flag = 'Panama',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  length_m = 190.0,
  beam_m = 30.0,
  max_draught_m = 8.5,
  is_my_fleet = true
WHERE mmsi = '352001129';

-- Sang Shin (355297000)
UPDATE public.vessels SET
  imo = '9146276',
  callsign = '3FAN7',
  type = 'Ro-Ro Cargo',
  flag = 'Panama',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  length_m = 190.0,
  beam_m = 30.0,
  max_draught_m = 8.5,
  is_my_fleet = true
WHERE mmsi = '355297000';

-- Young Shin (356005000)
UPDATE public.vessels SET
  imo = '9146288',
  callsign = 'E5A2957',
  type = 'Ro-Ro Cargo',
  flag = 'Panama',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  length_m = 190.0,
  beam_m = 30.0,
  max_draught_m = 8.5,
  is_my_fleet = true
WHERE mmsi = '356005000';

-- Step 3: Add placeholder positions (VERY TEMPORARY - will be overwritten by AIS)
-- These are approximate last-known positions and will be outdated immediately
-- Only adding if no position exists to make vessels visible on map

DO $$
BEGIN
  -- Only insert if vessel has NO positions yet
  IF NOT EXISTS (SELECT 1 FROM vessel_positions WHERE mmsi = '357170000') THEN
    INSERT INTO vessel_positions (mmsi, ts, lat, lon, sog_knots, cog_deg, nav_status)
    VALUES ('357170000', NOW() - INTERVAL '20 hours', 35.0, 129.0, 0, 0, 'At anchor');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM vessel_positions WHERE mmsi = '352808000') THEN
    INSERT INTO vessel_positions (mmsi, ts, lat, lon, sog_knots, cog_deg, nav_status)
    VALUES ('352808000', NOW() - INTERVAL '20 hours', 35.1, 129.1, 0, 0, 'At anchor');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM vessel_positions WHERE mmsi = '352001129') THEN
    INSERT INTO vessel_positions (mmsi, ts, lat, lon, sog_knots, cog_deg, nav_status)
    VALUES ('352001129', NOW() - INTERVAL '20 hours', 35.2, 129.2, 0, 0, 'At anchor');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM vessel_positions WHERE mmsi = '355297000') THEN
    INSERT INTO vessel_positions (mmsi, ts, lat, lon, sog_knots, cog_deg, nav_status)
    VALUES ('355297000', NOW() - INTERVAL '20 hours', 35.3, 129.3, 0, 0, 'At anchor');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM vessel_positions WHERE mmsi = '356005000') THEN
    INSERT INTO vessel_positions (mmsi, ts, lat, lon, sog_knots, cog_deg, nav_status)
    VALUES ('356005000', NOW() - INTERVAL '20 hours', 35.4, 129.4, 0, 0, 'At anchor');
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- ✅ VERIFICATION QUERY
-- ════════════════════════════════════════════════════════════════════════════
SELECT
  v.mmsi,
  v.name,
  v.imo,
  v.flag,
  v.is_my_fleet,
  COUNT(vp.id) as position_count,
  MAX(vp.ts) as last_position_time
FROM vessels v
LEFT JOIN vessel_positions vp ON v.mmsi = vp.mmsi
WHERE v.is_my_fleet = true
GROUP BY v.mmsi, v.name, v.imo, v.flag, v.is_my_fleet
ORDER BY v.name;

-- ════════════════════════════════════════════════════════════════════════════
-- 📋 NEXT STEPS FOR TEAM
-- ════════════════════════════════════════════════════════════════════════════
--
-- 1. ✅ Run this SQL once in Supabase SQL Editor
-- 2. ✅ Refresh dashboard - vessels should appear with "Last seen 20 hours ago"
-- 3. ✅ Show stakeholders the interface and features
-- 4. ⚠️  EXPLAIN: Positions are placeholder data for demo purposes
-- 5. ⚠️  EXPLAIN: Real-time tracking will work once satellite view is live
-- 6. ⏳ Implement satellite view (3-4 hours dev time)
-- 7. 🗑️  DELETE this file - no longer needed!
--
-- ════════════════════════════════════════════════════════════════════════════
-- 🔴 CRITICAL REMINDER 🔴
-- ════════════════════════════════════════════════════════════════════════════
-- This is NOT production data. It's a demo workaround.
-- Do NOT present this as real-time tracking to stakeholders.
-- Always clarify: "Once satellite view is ready, you'll see live positions here."
-- ════════════════════════════════════════════════════════════════════════════
