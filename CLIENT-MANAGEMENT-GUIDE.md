# Client Management Guide
## For External Companies Using the RoRo Dashboard

This guide explains how to manage vessels, configure tracking, and maintain the system without technical knowledge.

---

## 📋 Table of Contents

1. [Adding New Vessels](#adding-new-vessels)
2. [Removing Vessels](#removing-vessels)
3. [Marking Vessels as "My Fleet"](#marking-vessels-as-my-fleet)
4. [Changing Tracking Regions](#changing-tracking-regions)
5. [Updating Vessel Information](#updating-vessel-information)
6. [Troubleshooting](#troubleshooting)
7. [Getting Support](#getting-support)

---

## 1. Adding New Vessels

### What You Need:
- **MMSI number** (9-digit vessel identifier, found on MarineTraffic or ship documents)
- Vessel name (optional, will auto-populate from AIS data)
- Whether it's your fleet or competitor

### Steps:

#### A. Add to Tracking List (Ingestor)

**Option 1: Via SSH (Technical)**
```bash
# SSH to VPS
ssh ubuntu@43.200.220.234

# Edit environment file
cd roro-dashboard/ingestor
nano .env

# Find this line:
# FLEET_MMSIS=357170000,352808000,352001129,...

# Add your new MMSI at the end (comma-separated):
# FLEET_MMSIS=357170000,352808000,352001129,999999999

# Save: Ctrl+X, Y, Enter

# Restart ingestor
pm2 restart roro-ingestor

# Verify
pm2 logs roro-ingestor --lines 20
# Should show "Subscribing to 15 vessels" (or your new count)
```

**Option 2: Ask Developer** (Recommended)
Send email to your developer with:
- MMSI: 999999999
- Vessel Name: MV Example Ship
- Type: My Fleet / Competitor
- Action: Add to tracking

---

#### B. Add to Database

**Via Supabase Dashboard:**

1. Go to https://supabase.com/dashboard
2. Click your project
3. Table Editor → `vessels` table
4. Click "+ Insert row"
5. Fill in:
   - `mmsi`: 999999999 (required)
   - `name`: MV Example Ship
   - `is_my_fleet`: true (for your fleet) or false (competitor)
   - `operator`: Company name (optional)
   - `type`: "Ro-Ro" or "Vehicles Carrier" (optional)
6. Click "Save"

**Via SQL Editor:**

```sql
INSERT INTO vessels (mmsi, name, is_my_fleet, operator, type)
VALUES ('999999999', 'MV Example Ship', true, 'My Company', 'Ro-Ro');
```

---

#### C. Expected Timeline

- **Ingestor starts tracking:** Immediate (after PM2 restart)
- **First AIS data:** 5-30 minutes (if vessel is transmitting)
- **Shows on map:** As soon as first position received
- **Historical trail:** Builds over time (50 positions = ~1-2 hours)

---

## 2. Removing Vessels

### Steps:

#### A. Stop Tracking (Ingestor)

```bash
# SSH to VPS
ssh ubuntu@43.200.220.234

# Edit .env
cd roro-dashboard/ingestor
nano .env

# Remove MMSI from FLEET_MMSIS line
# Before: FLEET_MMSIS=357170000,999999999,352808000
# After:  FLEET_MMSIS=357170000,352808000

# Save and restart
pm2 restart roro-ingestor
```

#### B. Remove from Database (Optional)

**Keep Data (Recommended):**
Just mark as inactive:
```sql
UPDATE vessels
SET is_my_fleet = false,
    notes = 'Removed from tracking'
WHERE mmsi = '999999999';
```

**Permanently Delete:**
```sql
DELETE FROM vessels WHERE mmsi = '999999999';
-- This also deletes all position history (CASCADE)
```

---

## 3. Marking Vessels as "My Fleet"

Use this to filter vessels in the dashboard ("My Fleet" vs "Competitors").

### Update Single Vessel:

```sql
-- Mark as MY fleet
UPDATE vessels
SET is_my_fleet = true
WHERE mmsi = '357170000';

-- Mark as COMPETITOR
UPDATE vessels
SET is_my_fleet = false
WHERE mmsi = '249901000';
```

### Update Multiple Vessels (Bulk):

```sql
-- Mark all Shin Group vessels as "My Fleet"
UPDATE vessels
SET is_my_fleet = true
WHERE operator_group = 'Shin Group';

-- Mark all CLdN Cobelfret as "Competitors"
UPDATE vessels
SET is_my_fleet = false
WHERE operator_group = 'CLdN Cobelfret';
```

### Via Supabase Dashboard:

1. Table Editor → `vessels`
2. Click the row you want to edit
3. Change `is_my_fleet` to `true` or `false`
4. Click "Save"

---

## 4. Changing Tracking Regions

By default, tracks vessels in **Korea** and **Mediterranean**.

### To Add New Region:

```bash
# Example: Add Gulf of Mexico
# Current: BBOX_JSON=[[124,33],[132,39]];[[-6,30],[36,46]]
# New:     BBOX_JSON=[[124,33],[132,39]];[[-6,30],[36,46]];[[-98,18],[-80,31]]

# Format: [[minLon,minLat],[maxLon,maxLat]]
```

**Common Regions:**

| Region | BBOX Coordinates |
|--------|------------------|
| Korea | `[[124,33],[132,39]]` |
| Mediterranean | `[[-6,30],[36,46]]` |
| Gulf of Mexico | `[[-98,18],[-80,31]]` |
| North Sea | `[[-4,50],[10,60]]` |
| East Coast USA | `[[-80,25],[-65,45]]` |
| West Coast USA | `[[-130,30],[-115,50]]` |
| Singapore | `[[103,1],[105,3]]` |

**Find Your Own Region:**
1. Go to https://boundingbox.klokantech.com/
2. Draw box on map
3. Select "CSV" format
4. Copy the 4 numbers: `minLon,minLat,maxLon,maxLat`
5. Format as: `[[minLon,minLat],[maxLon,maxLat]]`

### Apply Changes:

```bash
# SSH to VPS
cd roro-dashboard/ingestor
nano .env

# Edit BBOX_JSON line (add semicolon ; between regions)
# BBOX_JSON=[[124,33],[132,39]];[[-6,30],[36,46]];[[103,1],[105,3]]

# Save and restart
pm2 restart roro-ingestor
```

---

## 5. Updating Vessel Information

### Update Name, Operator, Type, etc.:

**Via SQL:**

```sql
UPDATE vessels
SET
  name = 'New Vessel Name',
  operator = 'New Company Ltd',
  type = 'Ro-Ro',
  flag = 'South Korea',
  operator_group = 'Shin Group',
  notes = 'Primary Korea-Japan route'
WHERE mmsi = '357170000';
```

**Via Supabase Dashboard:**
1. Table Editor → `vessels`
2. Click row
3. Edit any field
4. Click "Save"

### Bulk Update Example:

```sql
-- Update all Shin Group vessels with operator info
UPDATE vessels
SET
  operator = 'Shin Shipping Co., Ltd',
  operator_group = 'Shin Group',
  flag = 'South Korea'
WHERE mmsi IN ('357170000', '352808000', '352001129', '355297000', '356005000');
```

---

## 6. Troubleshooting

### Vessel Not Showing on Map

**Check 1: Is it in the tracking list?**
```bash
ssh ubuntu@43.200.220.234
cd roro-dashboard/ingestor
cat .env | grep FLEET_MMSIS
# Should include your vessel's MMSI
```

**Check 2: Is ingestor running?**
```bash
pm2 status
# Should show "online" for roro-ingestor

pm2 logs roro-ingestor --lines 50
# Should show recent WebSocket messages
```

**Check 3: Is vessel in database?**
```sql
SELECT * FROM vessels WHERE mmsi = '999999999';
-- Should return 1 row
```

**Check 4: Has vessel transmitted AIS?**
- Vessel must be powered on and transmitting
- Must be in one of your BBOX regions
- Check on MarineTraffic.com if vessel is visible there
- AIS updates every 3-10 seconds when transmitting

**Check 5: Check for position data**
```sql
SELECT COUNT(*) FROM vessel_positions WHERE mmsi = '999999999';
-- Should be > 0 if vessel has transmitted
```

---

### Vessel Shows "Stale Data" Warning

**Meaning:** No AIS update in 5+ minutes

**Common Reasons:**
1. Vessel powered off / not transmitting
2. Vessel outside your BBOX regions
3. Ingestor stopped (check `pm2 status`)
4. AISStream API issue (check https://aisstream.io/status)

**Fix:**
```bash
# Restart ingestor
pm2 restart roro-ingestor

# Check logs
pm2 logs roro-ingestor --lines 100
```

---

### Too Many Vessels (Approaching Limits)

**Current Limits (Free Tier):**
- Supabase: 500 MB database
- AISStream: Unlimited vessels (100 msg/sec limit)
- MapTiler: 100k map loads/month

**With 90-day cleanup:**
- 14 vessels = ~50 MB ✅
- 50 vessels = ~180 MB ✅
- 100 vessels = ~360 MB ✅
- 200 vessels = ~720 MB ❌ (need Supabase Pro)

**If approaching 500 MB:**
1. Run cleanup manually: `node cleanup.mjs`
2. Reduce retention: Edit `cleanup.mjs`, change `RETENTION_DAYS = 90` to `60`
3. Increase rate limit: Edit `ingest.mjs`, change `100` to `200` (less frequent updates)
4. Upgrade to Supabase Pro ($25/mo for 8GB)

---

## 7. Getting Support

### Self-Service Resources

1. **Documentation:** All `.md` files in the repository
   - FINAL-CHECKLIST.md - Complete guide
   - SYSTEM-LIFECYCLE.md - How it works
   - COST-MONITORING.md - Track expenses
   - RATE-LIMITING-EXPLAINED.md - Data collection

2. **Logs:**
   ```bash
   # Ingestor logs
   pm2 logs roro-ingestor

   # Cleanup logs
   tail -f /tmp/roro-cleanup.log

   # Refresh logs
   tail -f /tmp/roro-refresh.log
   ```

3. **Database:**
   - Supabase Dashboard: https://supabase.com/dashboard
   - Table Editor: View/edit vessels and positions
   - SQL Editor: Run queries

### Contact Developer

**For complex changes or issues:**

**Include in your request:**
1. What you're trying to do
2. What you've tried
3. Any error messages (copy/paste)
4. Screenshots if applicable

**Response time:** 24-48 hours for non-urgent, 2-4 hours for urgent

---

## 📝 Quick Reference Commands

```bash
# SSH to VPS
ssh ubuntu@43.200.220.234

# Check ingestor status
pm2 status

# View logs
pm2 logs roro-ingestor

# Restart ingestor (after .env changes)
pm2 restart roro-ingestor

# Edit vessel list
nano /home/ubuntu/roro-dashboard/ingestor/.env

# Manual cleanup
cd /home/ubuntu/roro-dashboard/ingestor && node cleanup.mjs

# Manual refresh
cd /home/ubuntu/roro-dashboard/ingestor && node refresh-view.mjs

# Check cron jobs
crontab -l

# View cleanup logs
tail -20 /tmp/roro-cleanup.log
```

---

## 🎯 Common Tasks Cheat Sheet

| Task | Method | Time |
|------|--------|------|
| Add 1 vessel | Edit .env + Insert to DB | 5 min |
| Remove 1 vessel | Edit .env + Update DB | 5 min |
| Mark fleet vs competitor | Update DB `is_my_fleet` | 2 min |
| Add tracking region | Edit BBOX_JSON in .env | 5 min |
| Update vessel info | Supabase Table Editor | 2 min |
| Check vessel status | SQL query or dashboard | 1 min |
| Restart system | `pm2 restart roro-ingestor` | 30 sec |

---

## 💰 Cost Guidelines

**Current Setup (14 vessels):**
- **$5/month** (AWS Lightsail)
- **$0/month** (all other services - free tier)

**Scaling:**
- Up to 50 vessels: Still $5/month ✅
- 50-100 vessels: $5/month (tight, watch DB size)
- 100-200 vessels: $35/month (need Supabase Pro)
- 200+ vessels: $50-100/month (need bigger VPS + Pro tier)

**To stay under budget:**
1. Monitor Supabase usage weekly
2. Run cleanup daily (already automated)
3. Don't add >50 vessels without checking DB size
4. Remove vessels you no longer need

---

## ✅ Best Practices

1. **Before adding many vessels:**
   - Check current DB size (Supabase dashboard)
   - Estimate: ~3.5 MB per vessel (90-day retention)
   - Leave 20% headroom for safety

2. **Keep vessel data updated:**
   - Update names, operators as they change
   - Mark sold/scrapped vessels as inactive
   - Clean up test vessels

3. **Monitor regularly:**
   - Check dashboard weekly
   - Review Supabase usage monthly
   - Verify cron jobs are running

4. **Document changes:**
   - Keep a log of vessels added/removed
   - Note why vessels were added (customer request, new route, etc.)
   - Track who has dashboard access

---

**Questions?** See [FINAL-CHECKLIST.md](FINAL-CHECKLIST.md) or contact your developer.

**Last Updated:** 2025-10-06
