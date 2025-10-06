# 🚀 Deployment Steps for Latest Changes

## What Was Fixed

1. ✅ **Fleet flags** - Database now correctly shows 5 fleet + 9 competitors
2. ✅ **Relative time** - "5 mins ago" format throughout UI
3. ✅ **Last updated timestamps** - Shows in vessel details
4. ✅ **Mobile responsiveness** - Touch-friendly, sliding panels
5. ✅ **Last port field** - Added to schema and UI
6. ✅ **.env configuration** - Split FLEET_MMSIS and COMPETITOR_MMSIS

## Steps to Deploy

### 1. Commit All Changes

```bash
git add -A
git status
git commit -m "Add relative time, mobile support, last port field, fix fleet flags"
git push
```

### 2. Update VPS Ingestor

**On your local machine:**
```bash
# Copy new .env to VPS
scp ingestor/.env deploy@YOUR_VPS_IP:~/ais-ingestor/.env
```

**Then SSH to VPS:**
```bash
ssh deploy@YOUR_VPS_IP
cd ais-ingestor

# Pull latest code
git pull

# Restart PM2
pm2 restart ais-ingestor

# Check logs
pm2 logs ais-ingestor --lines 50
```

**Verify in logs:**
- Should see: `mmsis: 5` (not 14!)
- Fleet and competitors should be separate

### 3. Update Database (Run SQL)

**In Supabase SQL Editor:**

```sql
-- Add last_port columns
ALTER TABLE public.vessels
ADD COLUMN IF NOT EXISTS last_port text,
ADD COLUMN IF NOT EXISTS last_port_arrival_utc timestamptz;

-- Update Ah Shin with last port (example)
UPDATE public.vessels
SET
  last_port = 'Korfez, Turkey',
  last_port_arrival_utc = '2025-10-06T05:46:00Z'
WHERE mmsi = '357170000';
```

### 4. Deploy Frontend

**Option A: Keep using localhost for now**
```bash
cd web
npm run dev
```

**Option B: Deploy to Vercel (Production)**
```bash
cd web
vercel

# Follow prompts:
# - Build command: npm run build
# - Output directory: dist
# - Add environment variables in Vercel dashboard
```

### 5. Clear Browser Cache

**CRITICAL:**
1. Open your dashboard in browser
2. Press **Ctrl+Shift+Delete**
3. Select "Cached images and files"
4. Click "Clear data"
5. Or just **Ctrl+F5** (hard refresh)

### 6. Verify Everything Works

**Check database:**
- My Fleet tab: Should show ONLY 5 vessels (Ah Shin, Hae Shin, O Soo Shin, Sang Shin, Young Shin)
- All Tracked tab: Should show all 14 vessels

**Check relative time:**
- Vessel list: "Last seen 5 mins ago"
- Vessel details: "5 mins ago" with full timestamp below

**Check mobile:**
- Open on phone or resize browser to <768px
- Sidebars should slide in/out
- Buttons should be touch-friendly (44px minimum)

**Check last port:**
- Click on Ah Shin
- Should show "Last Port: Korfez, Turkey (X hours ago)"

---

## If Fleet Flags Revert Again

The ingestor was overwriting `is_my_fleet` on every message! This is now fixed by:

1. **Splitting .env:**
   - `FLEET_MMSIS` = only your 5 vessels
   - `COMPETITOR_MMSIS` = the other 9 vessels

2. **Ingestor already handles this correctly** (line 403 combines both lists)

3. **After VPS restart:**
   - Ingestor will use new .env
   - Won't overwrite flags anymore

**If it still happens:**
```bash
# Check VPS .env
ssh deploy@YOUR_VPS_IP
cd ais-ingestor
cat .env | grep MMSIS

# Should show:
# FLEET_MMSIS=357170000,352808000,352001129,355297000,356005000
# COMPETITOR_MMSIS=249901000,229077000,229076000,219927000,...
```

---

## Troubleshooting

### "Last seen" shows wrong time

**Problem:** Time calculation is off
**Fix:** Check if timestamps are in correct timezone (should be UTC)

### Arrows still not showing

**Problem:** Browser cache
**Fix:**
1. Close ALL browser tabs
2. Clear cache completely
3. Reopen browser
4. Or use Incognito mode to test

### Mobile sidebars not sliding

**Problem:** CSS media query not loading
**Fix:**
1. Check browser console for CSS errors
2. Verify `style.css?v=2.0.1` is loading (not cached old version)
3. Hard refresh (Ctrl+F5)

### Last port doesn't appear

**Problem:** Database migration not run
**Fix:**
1. Run `supabase/add-last-port.sql` in Supabase SQL Editor
2. Verify columns exist:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'vessels' AND column_name LIKE 'last_port%';
   ```

---

## Next Steps

1. ✅ Test everything locally
2. ✅ Deploy to VPS
3. ✅ Clear browser cache
4. ⏳ Monitor for 24 hours to ensure flags don't revert
5. ⏳ Deploy frontend to Vercel (optional, when ready for production)

---

## Quick Reference

**VPS SSH:**
```bash
ssh deploy@YOUR_VPS_IP
```

**PM2 Commands:**
```bash
pm2 status
pm2 logs ais-ingestor --lines 100
pm2 restart ais-ingestor
pm2 monit
```

**Database Query:**
```sql
-- Check fleet flags
SELECT mmsi, name, is_my_fleet, is_competitor
FROM vessels
ORDER BY is_my_fleet DESC, name;
```

**Git Commands:**
```bash
git status
git add -A
git commit -m "message"
git push
git pull  # On VPS
```
