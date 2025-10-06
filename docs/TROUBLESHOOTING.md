# Troubleshooting Guide

## Quick Fix: Clear Browser Cache

If you don't see arrow markers, or see wrong vessels in "My Fleet":

### Chrome/Edge
1. Press `Ctrl+Shift+Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Or use **Hard Refresh**: `Ctrl+F5` or `Ctrl+Shift+R`

### Firefox
1. Press `Ctrl+Shift+Delete`
2. Select "Cache"
3. Click "Clear Now"
4. Or use **Hard Refresh**: `Ctrl+F5` or `Ctrl+Shift+R`

### Safari
1. `⌘+Option+E` to clear cache
2. Or hold `Shift` and click Refresh

## Common Issues

### 1. Pins/Arrows Not Appearing

**Symptoms:**
- Map loads but no vessel markers appear
- Console shows "No position data available yet"

**Causes:**
- No vessels are currently transmitting AIS data
- Materialized view `vessel_latest` is empty (fixed in v2.0.0)
- Browser cache showing old version

**Fix:**
1. **Hard refresh browser** (Ctrl+F5)
2. Check console for version: Should say `[APP] RoRo Dashboard v2.0.0`
3. If version is wrong, clear cache completely
4. Check if vessels are transmitting:
   ```sql
   SELECT mmsi, name, COUNT(*) as positions
   FROM vessel_positions
   GROUP BY mmsi, name
   ORDER BY positions DESC;
   ```

### 2. Wrong Vessels in "My Fleet"

**Symptoms:**
- ARK FUTURA, CELINE, or SERAPHINE appear in "My Fleet" tab
- Should only show 5 Shin Group vessels

**Causes:**
- Database `is_my_fleet` flags were incorrect
- Browser cache showing old data

**Fix:**
1. **Clear browser cache** (Ctrl+Shift+Delete)
2. Verify database is correct:
   ```sql
   SELECT mmsi, name, is_my_fleet, is_competitor
   FROM vessels
   WHERE is_my_fleet = true;
   ```
   Should return ONLY: Ah Shin, Hae Shin, O Soo Shin, Sang Shin, Young Shin

3. If database is wrong, run:
   ```sql
   -- Fix the flags
   UPDATE vessels SET is_my_fleet = false, is_competitor = true
   WHERE mmsi IN ('219927000', '249901000', '229076000');
   ```

### 3. Vessel Trails/Paths Not Showing

**Symptoms:**
- Arrows appear but no trail lines behind them
- Only see current position

**Causes:**
- Not enough position data yet (need at least 2 positions)
- Trail data not being fetched

**Fix:**
1. Wait for vessels to transmit more positions (AIS updates every 2-10 minutes)
2. Check position count:
   ```sql
   SELECT mmsi, COUNT(*) as pos_count
   FROM vessel_positions
   GROUP BY mmsi;
   ```
3. Trails appear when vessel has 2+ positions

### 4. Data Shows "N/A"

**Symptoms:**
- Destination shows "N/A"
- ETA shows "N/A"
- Nav Status shows "N/A"

**Causes:**
- **ShipStaticData not received yet**
  - Position Reports (every 2-10 seconds) don't include destination/ETA
  - ShipStaticData (every 6 minutes) includes destination/ETA
- Vessel hasn't set destination in their AIS system

**Fix:**
1. **Wait 6-10 minutes** after vessel starts transmitting
2. ShipStaticData will auto-populate when received
3. Some vessels don't set destination - this is normal
4. Check if data exists:
   ```sql
   SELECT mmsi, name, destination, eta_utc, last_message_utc
   FROM vessels
   WHERE destination IS NOT NULL;
   ```

### 5. Slow Loading / Markers Appear Slowly

**Symptoms:**
- Page loads but markers take 5-10 seconds to appear
- "Loading vessels..." message stays too long

**Causes:**
- Large number of positions in database (2000+ positions)
- Network latency to Supabase
- Browser cache issues

**Fix:**
1. **v2.0.0 optimization**: Queries are now optimized, should load in 1-2 seconds
2. Check browser console for slow queries
3. If still slow, reduce LIMIT in main.js line 110 from 2000 to 500

### 6. Active Vessels Without Pins

**Symptoms:**
- Vessel list shows vessel as "Active" with green dot
- But no marker appears on map

**Causes:**
- Position data exists in `vessels` table but not in `vessel_positions`
- Materialized view out of sync (fixed in v2.0.0)
- Filter hiding the marker (check "All Tracked" tab)

**Fix:**
1. Click **"All Tracked"** tab to see all vessels
2. Check if position exists:
   ```sql
   SELECT * FROM vessel_positions WHERE mmsi = 'YOUR_MMSI' ORDER BY ts DESC LIMIT 1;
   ```
3. If no positions, vessel hasn't transmitted yet - wait 5-10 minutes

### 7. Arrows Not Pointing Correctly

**Symptoms:**
- Arrows appear but don't point in vessel direction
- All arrows point the same way

**Causes:**
- Vessel not transmitting heading data
- Using COG (Course Over Ground) fallback
- Vessel is stationary (heading = 0)

**Fix:**
- **This is normal behavior**
- When vessel is moving, heading will update
- Arrows use `heading_deg` (compass) or `cog_deg` (GPS track) as fallback

## Checking System Health

### Database Connection
```javascript
// Run in browser console
console.log('Supabase URL:', supabase.supabaseUrl);
```

### Position Data
```sql
-- In Supabase SQL Editor
SELECT
  COUNT(*) as total_positions,
  COUNT(DISTINCT mmsi) as vessels_with_data,
  MAX(ts) as latest_position_time
FROM vessel_positions;
```

### Ingestor Status (on VPS)
```bash
pm2 logs ais-ingestor --lines 50
pm2 status
```

## Version History

- **v2.0.0** (2025-10-06): Fixed vessel_latest query, optimized loading, cache busting
- **v1.0.0** (2025-10-05): Initial release with arrow markers

## Still Having Issues?

1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Share screenshot with errors in GitHub Issues
