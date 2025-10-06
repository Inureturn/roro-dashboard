-- Refresh the vessel_latest materialized view
-- Run this in Supabase SQL Editor

REFRESH MATERIALIZED VIEW CONCURRENTLY vessel_latest;

-- Verify it has data
SELECT COUNT(*) as row_count FROM vessel_latest;

SELECT * FROM vessel_latest ORDER BY ts DESC;
