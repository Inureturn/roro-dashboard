-- Check position count per vessel
SELECT
  v.mmsi,
  v.name,
  COUNT(vp.id) AS total_positions,
  COUNT(CASE WHEN vp.sog_knots > 0.5 THEN 1 END) AS moving_positions,
  MIN(vp.ts) AS oldest,
  MAX(vp.ts) AS newest,
  ROUND(EXTRACT(EPOCH FROM (MAX(vp.ts) - MIN(vp.ts)))/3600, 1) AS hours_of_data
FROM vessels v
LEFT JOIN vessel_positions vp ON v.mmsi = vp.mmsi
WHERE v.mmsi IN ('229077000', '249901000', '229076000', '219927000') -- The 4 tracked vessels
GROUP BY v.mmsi, v.name
ORDER BY total_positions DESC;
