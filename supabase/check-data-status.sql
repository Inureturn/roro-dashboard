-- Quick check of your database status
-- Run this in Supabase SQL Editor to see what data you have

-- 1. Count total positions
SELECT
  'Total positions' AS metric,
  COUNT(*) AS count,
  MIN(ts) AS oldest,
  MAX(ts) AS newest,
  (MAX(ts) - MIN(ts)) AS time_span
FROM vessel_positions;

-- 2. Positions per vessel
SELECT
  v.mmsi,
  v.name,
  v.is_my_fleet,
  v.is_competitor,
  COUNT(vp.id) AS position_count,
  MIN(vp.ts) AS oldest_position,
  MAX(vp.ts) AS newest_position,
  ROUND(EXTRACT(EPOCH FROM (MAX(vp.ts) - MIN(vp.ts)))/86400, 1) AS days_of_data
FROM vessels v
LEFT JOIN vessel_positions vp ON v.mmsi = vp.mmsi
GROUP BY v.mmsi, v.name, v.is_my_fleet, v.is_competitor
ORDER BY position_count DESC NULLS LAST;

-- 3. Check MY_FLEET specifically
SELECT
  v.mmsi,
  v.name,
  COUNT(vp.id) AS position_count,
  MAX(vp.ts) AS last_position_time,
  CASE
    WHEN MAX(vp.ts) IS NULL THEN 'NEVER TRACKED'
    WHEN MAX(vp.ts) < NOW() - INTERVAL '24 hours' THEN 'STALE (>24h old)'
    ELSE 'RECENT'
  END AS status
FROM vessels v
LEFT JOIN vessel_positions vp ON v.mmsi = vp.mmsi
WHERE v.is_my_fleet = true
GROUP BY v.mmsi, v.name
ORDER BY v.name;

-- 4. Check if insert-last-positions.sql was run
SELECT
  COUNT(*) AS manual_positions,
  MIN(ts) AS oldest,
  MAX(ts) AS newest
FROM vessel_positions
WHERE source LIKE '%manual%';

-- Expected results:
-- - If insert-last-positions.sql was run: You'll see 5 positions with source='manual_fetch_2025-10-06'
-- - If ingestor is running: You'll see positions with source='terrestrial' or source='satellite'
-- - If neither: position_count will be 0 for MY_FLEET vessels
