#!/bin/bash
# Check if any fleet vessels have been detected

echo "=== Fleet Vessel Status ==="
echo ""
echo "Fleet MMSIs configured: 14"
echo "357170000,352808000,352001129,355297000,356005000,249901000,229077000,229076000,219927000,352001162,355137000,352001920,373817000,249904000"
echo ""
echo "=== Database Check ==="

# Check vessels table
psql "$DATABASE_URL" -c "
SELECT
  mmsi,
  name,
  is_my_fleet,
  last_message_utc,
  updated_at
FROM vessels
WHERE is_my_fleet = true
ORDER BY last_message_utc DESC NULLS LAST;
" 2>/dev/null || echo "Run this on VPS with DATABASE_URL set"

echo ""
echo "=== Position Data Check ==="

# Check position data
psql "$DATABASE_URL" -c "
SELECT
  mmsi,
  COUNT(*) as position_count,
  MAX(ts) as latest_position
FROM vessel_positions
WHERE mmsi IN (
  '357170000','352808000','352001129','355297000','356005000',
  '249901000','229077000','229076000','219927000','352001162',
  '355137000','352001920','373817000','249904000'
)
GROUP BY mmsi
ORDER BY latest_position DESC NULLS LAST;
" 2>/dev/null || echo "Run this on VPS with DATABASE_URL set"

echo ""
echo "=== Ingestor Logs (last 20 lines) ==="
pm2 logs ais-ingestor --lines 20 --nostream 2>/dev/null || echo "pm2 not available"

echo ""
echo "=== Instructions ==="
echo "1. Fleet vessels must be within the bounding boxes to be detected"
echo "2. Bounding Box 1 (Korea Strait): 124°E to 132°E, 33°N to 39°N"
echo "3. Bounding Box 2 (Mediterranean): 6°W to 36°E, 30°N to 46°N"
echo "4. Vessels must have AIS transmitter active"
echo "5. Check back in 1-2 hours if no data yet"
