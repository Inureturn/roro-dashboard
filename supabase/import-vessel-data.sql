-- Import complete vessel data for your 14 tracked vessels
-- Run this once in Supabase SQL Editor
-- This ensures vessels always show in dashboard even when not transmitting

-- Update your 5 fleet vessels with complete info
UPDATE vessels SET
  imo = '9073701',
  callsign = '3FKQ7',
  type = 'Vehicles Carrier',
  flag = 'Panama',
  operator = 'GMT Group',
  operator_group = 'GMT Group',
  length_m = 190,
  beam_m = 32,
  max_draught_m = 8.8
WHERE mmsi = '373817000'; -- GMT Astro

-- Add more UPDATE statements for your other vessels
-- You can get this data from VesselFinder/Marine Traffic

-- Example template:
-- UPDATE vessels SET
--   imo = 'IMO_NUMBER',
--   callsign = 'CALLSIGN',
--   type = 'Ro-Ro Cargo',
--   flag = 'COUNTRY',
--   operator = 'OPERATOR_NAME',
--   operator_group = 'GROUP_NAME',
--   length_m = LENGTH,
--   beam_m = BEAM,
--   max_draught_m = DRAUGHT
-- WHERE mmsi = 'MMSI_NUMBER';

-- This way:
-- ✅ Vessels always show in dashboard with full details
-- ✅ AISStream updates positions when they transmit
-- ✅ Professional appearance even when vessels idle
-- ✅ $0/month cost
