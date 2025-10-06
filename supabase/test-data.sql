-- Test Data for RoRo Fleet Dashboard
-- Run this in Supabase SQL Editor to immediately see the UI in action
-- This simulates live AIS data for your existing vessels

-- 1. Insert test position for Sang Shin (moving vessel)
INSERT INTO vessel_positions (mmsi, ts, lat, lon, sog_knots, cog_deg, heading_deg, nav_status, destination)
VALUES
  ('355297000', NOW() - INTERVAL '30 seconds', 35.1234, 129.4567, 12.5, 180, 175, 'Under way using engine', 'BUSAN'),
  ('355297000', NOW() - INTERVAL '1 minute', 35.1230, 129.4560, 12.3, 179, 174, 'Under way using engine', 'BUSAN'),
  ('355297000', NOW() - INTERVAL '2 minutes', 35.1225, 129.4555, 12.4, 178, 173, 'Under way using engine', 'BUSAN');

-- 2. Insert test position for Ah Shin (anchored)
INSERT INTO vessel_positions (mmsi, ts, lat, lon, sog_knots, cog_deg, heading_deg, nav_status, destination)
VALUES
  ('357170000', NOW() - INTERVAL '5 minutes', 34.8765, 128.5432, 0.1, 0, 90, 'At anchor', 'ULSAN');

-- 3. Update Sang Shin with ShipStaticData (dimensions, ETA)
UPDATE vessels
SET
  length_m = 200,
  beam_m = 32,
  max_draught_m = 8.5,
  destination = 'BUSAN',
  eta_utc = NOW() + INTERVAL '12 hours',
  last_message_utc = NOW()
WHERE mmsi = '355297000';

-- 4. Update Ah Shin with ShipStaticData
UPDATE vessels
SET
  length_m = 195,
  beam_m = 30,
  max_draught_m = 8.0,
  destination = 'ULSAN',
  eta_utc = NOW() + INTERVAL '24 hours',
  last_message_utc = NOW() - INTERVAL '5 minutes'
WHERE mmsi = '357170000';

-- 5. Refresh materialized view to make data visible
REFRESH MATERIALIZED VIEW CONCURRENTLY vessel_latest;

-- Expected Results:
-- 1. Map will show 2 markers:
--    - Sang Shin at coordinates (35.1234, 129.4567) near Busan, South Korea
--    - Ah Shin at coordinates (34.8765, 128.5432) near Ulsan, South Korea
--
-- 2. Sang Shin popup/details will show:
--    - Speed: 12.5 kn
--    - Course: 180°
--    - Heading: 175°
--    - Status: Under way using engine
--    - Destination: BUSAN
--    - ETA: [12 hours from now]
--    - Length: 200 m
--    - Beam: 32 m
--    - Draught: 8.5 m
--    - Trail: 3 positions
--
-- 3. Ah Shin will show:
--    - Speed: 0.1 kn
--    - Status: At anchor
--    - Destination: ULSAN
--    - ETA: [24 hours from now]
--    - Length: 195 m
--    - Beam: 30 m
--
-- 4. Vessel list will show:
--    - Sang Shin: Active, 12.5 kn, → BUSAN, ETA 12h
--    - Ah Shin: Active, 0.1 kn, → ULSAN, ETA 1d
--
-- 5. Stats will show:
--    - Total Vessels: 5
--    - Active: 2
--    - Last Update: [current time]
--
-- 6. Real-time test:
--    Keep the dashboard open and run this to simulate new position:
--    INSERT INTO vessel_positions (mmsi, ts, lat, lon, sog_knots, cog_deg, heading_deg, nav_status)
--    VALUES ('355297000', NOW(), 35.1240, 129.4570, 12.6, 181, 176, 'Under way using engine');
--    REFRESH MATERIALIZED VIEW CONCURRENTLY vessel_latest;
--
--    You should see the marker move on the map within 1 second!

-- Clean up test data (run this after testing):
-- DELETE FROM vessel_positions WHERE mmsi IN ('355297000', '357170000');
-- UPDATE vessels SET destination = NULL, eta_utc = NULL, length_m = NULL, beam_m = NULL, max_draught_m = NULL WHERE mmsi IN ('355297000', '357170000');
-- REFRESH MATERIALIZED VIEW CONCURRENTLY vessel_latest;
