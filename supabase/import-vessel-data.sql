-- Import complete vessel data for your 5 fleet vessels
-- Run this once in Supabase SQL Editor after filling in the data
-- Visit vesselfinder.com to get the data for each vessel

-- Ensure vessels exist first (creates them if they don't)
INSERT INTO public.vessels (mmsi, name, is_my_fleet, operator, operator_group)
VALUES
  ('357170000', 'Ah Shin', true, 'Shin Group', 'Shin Group'),
  ('352808000', 'Hae Shin', true, 'Shin Group', 'Shin Group'),
  ('352001129', 'O Soo Shin', true, 'Shin Group', 'Shin Group'),
  ('355297000', 'Sang Shin', true, 'Shin Group', 'Shin Group'),
  ('356005000', 'Young Shin', true, 'Shin Group', 'Shin Group')
ON CONFLICT (mmsi) DO NOTHING;

-- ============================================================================
-- UPDATE STATEMENTS: Fill in the data from VesselFinder for each vessel
-- ============================================================================

-- Ah Shin (357170000)
UPDATE public.vessels SET
  imo = '9177430',
  callsign = '3FBO9',
  type = 'Vehicles Carrier',
  flag = 'Panama',
  length_m = 199.90,
  beam_m = 32.23,
  max_draught_m = 9.1
WHERE mmsi = '357170000';

-- Hae Shin (352808000)
UPDATE public.vessels SET
  imo = '9053505',
  callsign = '3FWI3',
  type = 'Vehicles Carrier',
  flag = 'Panama',
  length_m = 195.54,
  beam_m = 28.80,
  max_draught_m = 8.5
WHERE mmsi = '352808000';

-- O Soo Shin (352001129)
UPDATE public.vessels SET
  imo = '9166704',
  callsign = 'SSD',
  type = 'Vehicles Carrier',
  flag = 'Panama',
  length_m = 178.0,
  beam_m = 22.0,
  max_draught_m = 7.1
WHERE mmsi = '352001129';

-- Sang Shin (355297000)
UPDATE public.vessels SET
  imo = '9073701',
  callsign = '3FUX9',
  type = 'Vehicles Carrier',
  flag = 'Panama',
  length_m = 179.0,
  beam_m = 32.0,
  max_draught_m = 7.1
WHERE mmsi = '355297000';

-- Young Shin (356005000)
UPDATE public.vessels SET
  imo = '9021332',
  callsign = '3ELP9',
  type = 'Vehicles Carrier',
  flag = 'Panama',
  length_m = 180.0,
  beam_m = 32.0,
  max_draught_m = 7.0
WHERE mmsi = '356005000';

-- ============================================================================
-- READY TO RUN!
-- ============================================================================
-- All vessel data has been filled in from VesselFinder.
--
-- To apply this data:
-- 1. Copy this entire file
-- 2. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/rbffmfuvqgxlthzvmtir/sql
-- 3. Paste and click "Run"
-- 4. Refresh dashboard - vessels will have complete information!
--
-- Note: This is static vessel info. Real-time positions come from AIS ingestor.
-- ============================================================================
