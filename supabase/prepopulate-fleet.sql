-- ⚠️ TEMPORARY FLEET PREPOPULATION - DO NOT USE IN PRODUCTION
--
-- This script populates static vessel data for stakeholder demos.
-- Real-time AIS data from the ingestor will override these values.
--
-- WHY THIS IS TEMPORARY:
-- 1. Static data doesn't update automatically
-- 2. Positions may be outdated
-- 3. Will be replaced once satellite view fixes marker visibility
--
-- Run this ONCE in Supabase SQL Editor, then DELETE this file.
--
-- Generated: 2025-10-06T15:26:03.744Z
-- Vessels: 5
--

-- Ensure vessels exist first (upsert pattern)
INSERT INTO public.vessels (mmsi, name, is_my_fleet, operator_group)
VALUES
  ('357170000', 'Ah Shin', true, 'Shin Group'),
  ('352808000', 'Hae Shin', true, 'Shin Group'),
  ('352001129', 'O Soo Shin', true, 'Shin Group'),
  ('355297000', 'Sang Shin', true, 'Shin Group'),
  ('356005000', 'Young Shin', true, 'Shin Group')
ON CONFLICT (mmsi) DO NOTHING;

-- Update with detailed information


-- Ah Shin (357170000) - FALLBACK DATA
UPDATE public.vessels SET
  name = 'Ah Shin',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  is_my_fleet = true
WHERE mmsi = '357170000';


-- Hae Shin (352808000) - FALLBACK DATA
UPDATE public.vessels SET
  name = 'Hae Shin',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  is_my_fleet = true
WHERE mmsi = '352808000';


-- O Soo Shin (352001129) - FALLBACK DATA
UPDATE public.vessels SET
  name = 'O Soo Shin',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  is_my_fleet = true
WHERE mmsi = '352001129';


-- Sang Shin (355297000) - FALLBACK DATA
UPDATE public.vessels SET
  name = 'Sang Shin',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  is_my_fleet = true
WHERE mmsi = '355297000';


-- Young Shin (356005000) - FALLBACK DATA
UPDATE public.vessels SET
  name = 'Young Shin',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  is_my_fleet = true
WHERE mmsi = '356005000';


-- ⚠️ REMINDER: This is temporary data!
-- Once satellite view is implemented, DELETE this file and rely on real-time AIS.
