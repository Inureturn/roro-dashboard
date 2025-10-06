# 🚨 URGENT FIXES REQUIRED

## Issues Identified

### 1. ❌ Arrows Still Showing as Pins
**Problem:** Browser is loading cached JavaScript
**Solution:** See [Cache Clearing Steps](#cache-clearing-steps) below

### 2. ❌ Ah Shin Not Appearing (Despite Transmitting)
**Problem:** VPS ingestor has OLD .env file (tracking all 14 as fleet)
**Solution:** Update VPS .env and restart PM2 - See [Update VPS](#update-vps)

### 3. ⚠️ Trail Colors Wrong
**Problem:** Database still has wrong fleet flags (because VPS keeps overwriting them)
**Solution:** Fix after updating VPS .env

---

## 🔧 Fix Steps (IN ORDER!)

### Step 1: Update VPS .env

**On your local machine:**
```bash
# Copy the CORRECT .env to VPS
scp ingestor/.env deploy@YOUR_VPS_IP:~/ais-ingestor/.env
```

**Or manually edit on VPS:**
```bash
ssh deploy@YOUR_VPS_IP
cd ais-ingestor
nano .env

# Change this line:
# OLD: FLEET_MMSIS=357170000,352808000,352001129,355297000,356005000,249901000,229077000,229076000,219927000,352001162,355137000,352001920,373817000,249904000

# TO THIS:
FLEET_MMSIS=357170000,352808000,352001129,355297000,356005000
COMPETITOR_MMSIS=249901000,229077000,229076000,219927000,352001162,355137000,352001920,373817000,249904000

# Save: Ctrl+X, Y, Enter
```

**Restart PM2:**
```bash
pm2 restart ais-ingestor
pm2 logs ais-ingestor --lines 20
```

**Verify in logs - should see:**
```
mmsis: 14  ← Should now track all 14 vessels
```

**IMPORTANT:** After this, Ah Shin should start appearing within 5-10 minutes!

---

### Step 2: Fix Database Fleet Flags (AGAIN)

The VPS was overwriting the flags. Now that we fixed the .env, run this ONE MORE TIME:

```bash
# On your local machine
cd c:/Users/Bilel/Downloads/cig-dashboard/ingestor

node -e "
import('dotenv/config');
import('@supabase/supabase-js').then(async ({ createClient }) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  );

  console.log('Resetting fleet flags...');

  // Reset all
  await supabase.from('vessels').update({ is_my_fleet: false, is_competitor: false }).neq('mmsi', '');

  // Set fleet
  await supabase.from('vessels').update({ is_my_fleet: true, is_competitor: false })
    .in('mmsi', ['357170000', '352808000', '352001129', '355297000', '356005000']);

  // Set competitors
  await supabase.from('vessels').update({ is_my_fleet: false, is_competitor: true })
    .in('mmsi', ['249901000', '229077000', '229076000', '219927000', '352001162', '355137000', '352001920', '373817000', '249904000']);

  console.log('✅ Done!');
  process.exit(0);
});
"
```

---

### Step 3: Cache Clearing Steps

**CRITICAL:** You MUST clear browser cache to see arrows instead of pins!

#### Option A: Hard Refresh (Fastest)
1. Press **Ctrl+F5** (Windows) or **Cmd+Shift+R** (Mac)
2. This forces reload of all resources

#### Option B: Clear Cache Completely
**Chrome/Edge:**
1. Press **Ctrl+Shift+Delete**
2. Select "Cached images and files"
3. Time range: "All time"
4. Click "Clear data"
5. Refresh page (F5)

**Firefox:**
1. Press **Ctrl+Shift+Delete**
2. Select "Cache"
3. Time range: "Everything"
4. Click "Clear Now"
5. Refresh page (F5)

#### Option C: Incognito/Private Mode (Testing)
1. Press **Ctrl+Shift+N** (Chrome) or **Ctrl+Shift+P** (Firefox)
2. Open http://localhost:5173
3. Should see arrows immediately

#### Option D: Close All Tabs + Restart Browser
1. Close ALL browser tabs and windows
2. Completely quit browser
3. Reopen and go to dashboard
4. Cache should be cleared

---

### Step 4: Verify Everything Works

After completing Steps 1-3:

**Check Console (F12):**
```
[APP] RoRo Dashboard v2.0.1  ← Should see this
```

**Check Database:**
```sql
-- In Supabase SQL Editor
SELECT mmsi, name, is_my_fleet, is_competitor
FROM vessels
ORDER BY is_my_fleet DESC, name;

-- Should show:
-- 5 with is_my_fleet = true (Shin vessels)
-- 9 with is_competitor = true (others)
```

**Check Map:**
- Should see **ARROWS** not pins
- Fleet vessels (when transmitting): **Blue arrows**
- Competitor vessels: **Orange arrows**
- Trails should match arrow color

**Check Ah Shin:**
- Wait 5-10 minutes after VPS restart
- Should appear on map (if currently transmitting)
- Check database:
  ```sql
  SELECT COUNT(*) FROM vessel_positions WHERE mmsi = '357170000';
  -- Should be > 0 once data arrives
  ```

---

## 🎯 Why Ah Shin Wasn't Appearing

**Root cause:** Coverage + Configuration

### Issue 1: VPS Configuration
- VPS .env had old config (all 14 in FLEET_MMSIS)
- Ingestor was subscribing correctly BUT
- Database flags were being overwritten on every message
- This caused UI confusion

### Issue 2: Coverage Gap (Possible)
**AISStream vs VesselFinder:**

| Feature | AISStream (Free) | VesselFinder |
|---------|------------------|--------------|
| Coverage | Terrestrial only | Terrestrial + Satellite |
| Marmara Sea | Limited | Good |
| Cost | Free | Paid |

**Why VesselFinder shows "2 mins ago" but we don't:**
- VesselFinder uses satellite AIS (better coverage)
- AISStream free tier = terrestrial only (gaps in some regions)
- Marmara Sea might have limited terrestrial coverage

**Solutions:**

**Short-term:**
- Wait for Ah Shin to move to better coverage area
- When moving, updates will arrive more frequently

**Long-term:**
- Upgrade to AISStream satellite tier ($)
- Or switch to Spire Maritime / MarineTraffic API
- See [docs/FAQ-AND-ROADMAP.md](docs/FAQ-AND-ROADMAP.md) for alternatives

---

## 📊 Expected Behavior After Fixes

### My Fleet Tab
Should show ONLY when transmitting:
- ✅ Ah Shin (357170000) - Blue arrow
- ✅ Hae Shin (352808000) - Blue arrow
- ✅ O Soo Shin (352001129) - Blue arrow
- ✅ Sang Shin (355297000) - Blue arrow
- ✅ Young Shin (356005000) - Blue arrow

### All Tracked Tab
Currently transmitting (Competitors):
- 🟧 ARK FUTURA (219927000) - Orange arrow
- 🟧 CELINE (249901000) - Orange arrow
- 🟧 SERAPHINE (229076000) - Orange arrow

Plus others when they start transmitting

### Trail Colors
- **Blue trails** = Fleet vessels
- **Orange trails** = Competitors

---

## 🐛 Troubleshooting

### "Still seeing pins, not arrows"
**Cause:** Browser cache
**Fix:** Try Option C (Incognito mode) to test

### "Trails are still wrong colors"
**Cause:** Database flags not updated
**Fix:** Run Step 2 again after fixing VPS

### "Ah Shin still doesn't appear after 30 mins"
**Possible causes:**
1. AIS coverage gap in Marmara Sea
2. Vessel transmitter might be off (unlikely)
3. VPS not restarted properly

**Check:**
```bash
ssh deploy@YOUR_VPS_IP
pm2 logs ais-ingestor | grep "357170000"
# Should see messages if receiving AIS data
```

### "Database flags keep reverting"
**Cause:** VPS .env not updated
**Fix:** Complete Step 1 first!

---

## ✅ Success Checklist

After completing all steps:

- [ ] VPS .env updated with FLEET_MMSIS + COMPETITOR_MMSIS split
- [ ] PM2 restarted on VPS
- [ ] Database fleet flags corrected
- [ ] Browser cache cleared (Ctrl+F5 or Incognito mode)
- [ ] Console shows "v2.0.1"
- [ ] Map shows **arrows** not pins
- [ ] Fleet vessels (if transmitting) show **blue arrows**
- [ ] Competitor vessels show **orange arrows**
- [ ] Trail colors match arrow colors
- [ ] Ah Shin appears within 10-30 minutes (if in coverage)

---

## 📞 Still Having Issues?

1. **Check browser console** (F12) for errors
2. **Check PM2 logs** on VPS for AIS messages
3. **Verify database** with SQL queries above
4. **Try Incognito mode** to rule out cache
5. **Take screenshots** of console + map + database query results
6. **Share in GitHub issues** with details

---

## 🚀 Once Everything Works

1. ✅ Test for 24 hours to ensure stability
2. ✅ Monitor PM2 logs for any errors
3. ✅ Check database growth (should be ~100-500 positions/day)
4. ✅ Deploy frontend to Vercel (when ready for production)
5. ✅ Document any custom vessel data (last_port, notes, etc.)

See [DEPLOYMENT-STEPS.md](DEPLOYMENT-STEPS.md) for production deployment.
