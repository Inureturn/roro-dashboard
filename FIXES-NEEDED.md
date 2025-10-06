# Critical Fixes Needed

## Issues Found (Oct 6, 2025)

### 1. ❌ Missing Database Column
**Error:** `column vessels.is_competitor does not exist`

**Fix:** Run in Supabase SQL Editor:
```sql
ALTER TABLE vessels
ADD COLUMN IF NOT EXISTS is_competitor boolean DEFAULT false;

UPDATE vessels
SET is_competitor = false
WHERE is_competitor IS NULL;
```

### 2. ❌ Too Many Vessels (137 instead of 14)
**Problem:** Database has 137 vessels, should only have 14

**Fix:** Run in Supabase SQL Editor:
```sql
DELETE FROM vessels
WHERE mmsi NOT IN (
  '357170000','352808000','352001129','355297000','356005000',
  '249901000','229077000','229076000','219927000','352001162',
  '355137000','352001920','373817000','249904000'
);

SELECT COUNT(*) FROM vessels; -- Should show 14
```

### 3. ❌ Ingestor Skipping Fleet Vessels
**Problem:** Logs show `[SKIP] Non-fleet MMSI` for your vessels

**Root cause:** `ALLOW_NON_FLEET=false` + `STREAM_MODE=bbox` means it only saves vessels that are BOTH:
- In BBOX regions (Korea/Med)
- In FLEET_MMSIS list

**Fix:** The ingestor code needs to check if vessel is in FLEET_MMSIS before skipping.

**Line 259 in ingest.mjs:**
```javascript
// CURRENT (WRONG):
if (getEffectiveMode() !== 'mmsi' && !ALLOW_NON_FLEET && (FLEET_MMSIS.length || knownCompetitorMMSI.size) && !(isMyFleet || isCompetitor)) {
  console.log(`[SKIP] Non-fleet MMSI ${mmsi}`);
  return;
}

// SHOULD BE:
// In bbox mode, ONLY save vessels in FLEET_MMSIS or COMPETITOR lists
const isTrackedVessel = isMyFleet || isCompetitor;
if (!isTrackedVessel) {
  if (LOG_LEVEL === 'debug') {
    console.log(`[SKIP] Non-tracked MMSI ${mmsi}`);
  }
  return;
}
```

The issue is that `isMyFleet` check uses `FLEET_MMSIS.includes(mmsi)` but the comparison might be failing due to type mismatch (string vs number).

### 4. ❌ No Position Data
**Problem:** 0 rows in `vessel_positions` table

**Root cause:** Ingestor is skipping all position inserts because of issue #3

**Fix:** Once issue #3 is fixed, positions will start appearing

---

## Quick Fixes to Apply Now

### A. Supabase SQL Editor

```sql
-- 1. Add missing column
ALTER TABLE vessels
ADD COLUMN IF NOT EXISTS is_competitor boolean DEFAULT false;

-- 2. Clean up excess vessels
DELETE FROM vessels
WHERE mmsi NOT IN (
  '357170000','352808000','352001129','355297000','356005000',
  '249901000','229077000','229076000','219927000','352001162',
  '355137000','352001920','373817000','249904000'
);

-- 3. Verify
SELECT mmsi, name, is_my_fleet FROM vessels ORDER BY mmsi;
-- Should show exactly 14 rows
```

### B. VPS (SSH)

```bash
# Check current .env
cat /home/ubuntu/roro-dashboard/ingestor/.env

# Should have these exact lines:
FLEET_MMSIS=357170000,352808000,352001129,355297000,356005000,249901000,229077000,229076000,219927000,352001162,355137000,352001920,373817000,249904000
BBOX_JSON=[[124,33],[132,39]];[[-6,30],[36,46]]
STREAM_MODE=bbox
ALLOW_NON_FLEET=false

# Restart
pm2 restart ais-ingestor

# Watch logs (Ctrl+C to exit)
pm2 logs ais-ingestor --nostream --lines 100
```

### C. Browser Dashboard

Refresh after fixes:
```
http://localhost:5173
```

Should see:
- ✅ 14 vessels loaded
- ✅ Positions starting to appear (wait 5-10 min)

---

## Why Ingestor is Failing

Looking at the logs:
```
[SKIP] Non-fleet MMSI 636019744 (STREAM_MODE=bbox)
[SKIP] Non-fleet MMSI 319251700 (STREAM_MODE=bbox)
```

It's receiving AIS data from the BBOX regions, but skipping everything because:

1. `STREAM_MODE=bbox` means "subscribe to all vessels in Korea + Med regions"
2. `ALLOW_NON_FLEET=false` means "only save vessels in FLEET_MMSIS list"
3. But the code at line 259 might not be correctly checking if MMSI is in the list

**The fix:** Update ingest.mjs line 257-264 to properly check FLEET_MMSIS.

---

## Expected Behavior After Fixes

**Immediate (after SQL fixes):**
- ✅ Dashboard loads 14 vessels
- ✅ No database errors
- ❌ Still 0 positions (ingestor needs code fix)

**After ingestor fix:**
- ✅ Logs show: `[DB] Inserted position for 357170000`
- ✅ Positions table starts filling
- ✅ Dashboard shows vessels on map (5-10 min)

---

## Recommended Fix Order

1. **SQL fixes** (2 min) - Add column, clean vessels
2. **Test dashboard** - Should load 14 vessels cleanly
3. **Fix ingest.mjs** (5 min) - Update MMSI checking logic
4. **Restart ingestor** - Start collecting positions
5. **Wait 10 min** - Let data accumulate
6. **Refresh dashboard** - See vessels on map! 🎉

---

## Notes on Your Work

You did some work alone - looks like you:
- ✅ Added `is_competitor` support to ingestor
- ✅ Set up BBOX streaming
- ✅ Configured rate limiting
- ❌ But schema is missing `is_competitor` column
- ❌ And MMSI filtering logic needs adjustment

Great progress! Just needs these small tweaks.
