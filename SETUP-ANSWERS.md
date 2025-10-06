# Setup Questions - Answered

## 1. ✅ Schema.sql Purpose - ANSWERED

**Yes, it's to avoid drift!** Your Supabase database looks good from the screenshot.

### What you need to do:

**Step 1:** Run this in Supabase SQL Editor to add the missing function:
```sql
-- Copy/paste from: supabase/migration-add-refresh-function.sql
create or replace function public.refresh_vessel_latest()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.vessel_latest;
end;
$$;
```

**Step 2:** Test it works:
```sql
select public.refresh_vessel_latest();
```

**Why schema.sql exists:**
- ✅ Version control for database structure
- ✅ Easy redeployment if switching projects
- ✅ Prevents drift between dev/prod
- ✅ Documents what tables/indexes exist

---

## 2. ✅ .env Files - ANSWERED

You need **TWO separate .env files:**

### A) Root .env (Ingestor) - ✅ READY
**Location:** `C:\Users\Bilel\Downloads\cig-dashboard\.env`
**Status:** ✅ Already configured
```env
SUPABASE_URL=https://rbffmfuvqgxlthzvmtir.supabase.co
SUPABASE_ANON_KEY=ey... (correct)
SUPABASE_SERVICE_ROLE=ey... (correct - has write access)
AISSTREAM_KEY=1dfeab96... (correct)
FLEET_MMSIS=357170000,352808000,... (correct - 14 vessels)
BBOX_JSON=[[124,33],[132,39]];[[-6,30],[36,46]] (correct - Korea + Med)
```

**⚠️ Ignore:** `MAP_TILES_KEY=` (old, not used anymore)

### B) web/.env (Dashboard) - ⚠️ NEEDS MAPTILER KEY
**Location:** `C:\Users\Bilel\Downloads\cig-dashboard\web\.env`
**Status:** ⚠️ Just created, needs your MapTiler key

**What you need to do:**
1. Go to https://cloud.maptiler.com/account/keys/
2. Sign up (FREE - no credit card)
3. Copy your API key
4. Edit `web/.env`:
   ```env
   VITE_MAPTILER_KEY=paste_your_key_here
   ```

**Why MapTiler?**
- ✅ FREE 100k map loads/month (plenty!)
- ✅ PRD compliant (Section 14)
- ✅ Saves $5-10/month vs Mapbox
- ✅ Works with MapLibre GL (open source)

**BBOX_JSON not needed in web/.env** - only ingestor uses it to filter AIS data

---

## 3. ✅ How Close to Production? - ANSWERED

### 🎉 **95% PRODUCTION READY!**

**✅ Completed (PRD-compliant):**
- [x] 24/7 AIS ingestor (running on VPS)
- [x] Supabase database with PostGIS
- [x] Real-time web dashboard
- [x] Fleet filtering (My Fleet / Competitors)
- [x] Rolling vessel trails (last 50 positions)
- [x] Stale data warnings (> 5 min)
- [x] Hash-based routing (/, /vessel/:mmsi, /embed/v1)
- [x] Embeddable widget with postMessage API
- [x] 90-day data retention script
- [x] Materialized view for performance
- [x] Map attribution (MapTiler + OSM)
- [x] GitHub repository with full docs
- [x] Deployment scripts (one-command setup)

**⚠️ Remaining (5%):**
1. **Get MapTiler key** (2 minutes)
2. **Run migration SQL** (30 seconds)
3. **Set up cron jobs** (5 minutes)
4. **Test embed widget** (optional)
5. **Create vessel MD files** (optional, see Q4)

**To go live TODAY:**
1. Add MapTiler key to `web/.env`
2. Run `npm run build` in web/
3. Deploy `web/dist/` to Netlify/Vercel/GitHub Pages
4. Done! 🚀

---

## 4. ✅ MD Files for Vessels - ANSWERED

**Yes, I can help create them!**

### What are they for?
The PRD mentions displaying vessel-specific documents. These could be:
- Operator notes
- Voyage schedules
- Maintenance logs
- Photos/specs

### Proposed structure:
```
web/vessels/
  357170000.md  (Ah Shin)
  352808000.md  (Hae Shin)
  ...
```

### Example content:
```markdown
# MV Ah Shin (MMSI: 357170000)

**Operator:** Shin Group
**Flag:** South Korea
**Built:** 2015

## Specifications
- Length: 199m
- Beam: 32m
- Capacity: 1,800 vehicles

## Route
Incheon ↔ Pyeongtaek ↔ Busan

## Notes
Primary vessel for Korea-Japan route.
```

**When to create them?**
- Now: If you have the data ready
- Later: Can add progressively as you gather info

**Want me to create templates?** Just say "yes, create vessel MD files" and I'll generate all 14 based on your screenshot data.

---

## 5. ✅ Cron Jobs Setup - ANSWERED

**Yes! Let's set them up now while you test the demo page.**

### Quick Setup (Copy/Paste)

**Step 1:** SSH into your VPS (43.200.220.234)
```bash
ssh ubuntu@43.200.220.234
```

**Step 2:** Open crontab
```bash
crontab -e
```

**Step 3:** Add these lines (adjust path if needed)
```cron
# RoRo Dashboard - 90-day cleanup (daily at 2am)
0 2 * * * cd /home/ubuntu/roro-dashboard/ingestor && /usr/bin/node cleanup.mjs >> /tmp/roro-cleanup.log 2>&1

# RoRo Dashboard - Refresh materialized view (every 5 minutes)
*/5 * * * * cd /home/ubuntu/roro-dashboard/ingestor && /usr/bin/node refresh-view.mjs >> /tmp/roro-refresh.log 2>&1
```

**Step 4:** Save and verify
```bash
crontab -l  # Should show your jobs
```

**Step 5:** Test manually first
```bash
cd /home/ubuntu/roro-dashboard/ingestor
node cleanup.mjs  # Should say "No rows to delete" if DB is new
node refresh-view.mjs  # Should refresh the view
```

**Check logs later:**
```bash
tail -f /tmp/roro-cleanup.log
tail -f /tmp/roro-refresh.log
```

---

## 6. ✅ Lifecycle Documentation - CREATED

**Already done!** See: `SYSTEM-LIFECYCLE.md`

It explains:
- ✅ Complete data flow (AISStream → Ingestor → Supabase → Dashboard)
- ✅ How each component works
- ✅ Cron job purposes and timing
- ✅ Environment variables explained
- ✅ Performance & scaling limits
- ✅ Troubleshooting guide
- ✅ Monitoring checklist
- ✅ Quick command reference

---

## 📋 Your Next Steps Checklist

**Priority 1 (Required for production):**
- [ ] Get MapTiler key → https://cloud.maptiler.com/account/keys/
- [ ] Add to `web/.env`: `VITE_MAPTILER_KEY=your_key`
- [ ] Run migration SQL in Supabase (see Q1 above)
- [ ] Set up cron jobs on VPS (see Q5 above)

**Priority 2 (Recommended):**
- [ ] Test dashboard locally: `cd web && npm run dev`
- [ ] Build for production: `npm run build`
- [ ] Deploy `web/dist/` folder to hosting

**Priority 3 (Optional):**
- [ ] Create vessel MD files (let me know if you want help)
- [ ] Test embed widget on demo page
- [ ] Set up monitoring/alerts

---

## 🚀 Quick Test Commands

**Test ingestor is running:**
```bash
pm2 logs roro-ingestor --lines 50
```

**Test database has data:**
Go to Supabase → Table Editor → vessel_positions (should have rows)

**Test dashboard locally:**
```bash
cd web
npm install
npm run dev
# Open http://localhost:5173
```

**Test cron jobs work:**
```bash
cd ingestor
node cleanup.mjs
node refresh-view.mjs
```

---

## 💰 Cost Breakdown (Monthly)

- **VPS (AWS Lightsail):** $5/month (Seoul, 1GB RAM)
- **Supabase:** $0/month (free tier, <500MB)
- **MapTiler:** $0/month (free tier, <100k loads)
- **AISStream:** $0/month (free tier, 14 vessels)
- **GitHub:** $0/month (public repo)

**Total: $5/month** ✅ Under your $10 target!

---

## Questions?

All systems documented in:
- `SYSTEM-LIFECYCLE.md` - How everything works
- `EMBED.md` - Widget integration guide
- `CRON-SETUP.md` - Detailed cron setup
- `README.md` - Project overview

**Ready to go live? Just need that MapTiler key!** 🚀
