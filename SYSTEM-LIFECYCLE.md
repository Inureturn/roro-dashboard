# RoRo Dashboard System Lifecycle

This document explains how the entire RoRo Dashboard system works, from data ingestion to user display.

## 🔄 Complete Data Flow

```
AISStream API → Ingestor (VPS) → Supabase → Web Dashboard → User Browser
     ↓              ↓                ↓           ↓
  WebSocket    Rate Limit      PostgreSQL    Real-time
  3-second     100m/180s       + PostGIS     Updates
  ping         dedup
```

---

## 📦 System Components

### 1. **AIS Ingestor** (24/7 on VPS)
**Location:** `ingestor/ingest.mjs`
**Purpose:** Fetch live AIS data and write to database

**How it works:**
1. Connects to AISStream.io WebSocket API
2. Subscribes to specific vessels (by MMSI) in geographic regions (BBOX)
3. Receives position updates every few seconds
4. **Rate limiting:** Only saves if vessel moved 100m OR 180 seconds passed
5. Upserts vessel static data (name, IMO, dimensions)
6. Inserts position data (lat/lon, speed, course, timestamp)

**Running:**
```bash
pm2 start ingest.mjs --name roro-ingestor
pm2 logs roro-ingestor  # Check it's working
```

**Auto-restart:** PM2 ensures it runs 24/7, even after VPS reboot

---

### 2. **Supabase Database** (Cloud PostgreSQL)
**Purpose:** Store vessel data and serve to frontend

**Tables:**
- `vessels` - Static vessel info (name, MMSI, IMO, operator, is_my_fleet flag)
- `vessel_positions` - Position history (lat, lon, speed, course, timestamp)

**Special features:**
- **PostGIS extension** - Geographic queries and geometry
- **Materialized view** (`vessel_latest`) - Fast "latest position per vessel" queries
- **Realtime subscriptions** - Push new positions to web dashboard instantly

**Indexes:**
- Fast lookup by MMSI + timestamp
- Geographic search by location (PostGIS GIST index)

---

### 3. **Web Dashboard** (Vite + Vanilla JS)
**Location:** `web/main.js`, `web/index.html`
**Purpose:** Interactive map showing live vessel positions

**How it works:**
1. **On load:**
   - Fetch all vessels from `vessels` table
   - Fetch latest 1000 positions from `vessel_positions`
   - Group positions by vessel (keep last 50 for trails)
   - Render vessels on MapLibre map

2. **Real-time updates:**
   - Subscribe to Supabase Realtime channel
   - When new position inserted → update marker instantly
   - No page refresh needed

3. **Features:**
   - Fleet filtering (All / My Fleet / Competitors)
   - Search by name or MMSI
   - Click vessel → show details panel
   - Rolling trails (last 50 positions)
   - Stale data warning (if no update in 5+ minutes)

4. **Routing:**
   - `/#/` - Dashboard (default)
   - `/#/vessel/:mmsi` - Vessel detail view
   - `/#/embed/v1` - Embeddable widget (map only)

**Running locally:**
```bash
cd web
pnpm install
pnpm run dev  # http://localhost:5173
```

**Production build:**
```bash
pnpm run build  # Creates dist/ folder
```

---

## ⏰ Automated Maintenance (Cron Jobs)

### Job 1: **90-Day Cleanup** (Daily at 2am)
**Script:** `ingestor/cleanup.mjs`
**Purpose:** Delete old position data to save space

**Why?**
- Without cleanup: 2.5M rows/year → 1.5GB database
- With cleanup: ~685K rows max → <500MB (stays in Supabase free tier)

**What it does:**
1. Finds all positions older than 90 days
2. Deletes in batches (1000 rows at a time)
3. Logs progress to `/tmp/roro-cleanup.log`

**Cron setup:**
```cron
0 2 * * * cd /path/to/ingestor && node cleanup.mjs >> /tmp/roro-cleanup.log 2>&1
```

### Job 2: **View Refresh** (Every 5 minutes)
**Script:** `ingestor/refresh-view.mjs`
**Purpose:** Update materialized view for fast queries

**Why?**
- Materialized view (`vessel_latest`) caches "latest position per vessel"
- Queries are 10x faster than scanning full `vessel_positions` table
- Must refresh periodically to stay current

**What it does:**
1. Calls `refresh_vessel_latest()` RPC function
2. PostgreSQL rebuilds the view with latest data
3. Logs success to `/tmp/roro-refresh.log`

**Cron setup:**
```cron
*/5 * * * * cd /path/to/ingestor && node refresh-view.mjs >> /tmp/roro-refresh.log 2>&1
```

---

## 🚀 Complete Lifecycle Timeline

### **Second 0: User Opens Dashboard**
1. Browser loads `index.html` + `main.js`
2. MapLibre initializes map (MapTiler tiles)
3. Fetch vessels from Supabase `vessels` table
4. Fetch latest 1000 positions
5. Render markers + trails on map
6. Subscribe to Realtime channel

### **Second 3: AIS Data Arrives**
1. AISStream sends position update via WebSocket
2. Ingestor checks rate limit (100m or 180s)
3. If passed → upsert to Supabase

### **Second 3.5: Database Write**
1. Supabase receives INSERT
2. Triggers Realtime notification
3. Pushes to all subscribed clients

### **Second 4: User Sees Update**
1. Browser receives Realtime event
2. `main.js` updates marker position
3. Map animates to new location
4. "Last Update" time refreshed

### **Every 30 seconds:**
- Dashboard re-fetches positions (backup if Realtime missed)
- Checks for stale data warning

### **Every 5 minutes:**
- Cron job refreshes `vessel_latest` view

### **Every 24 hours (2am):**
- Cron job deletes positions older than 90 days
- Keeps database lean

---

## 📊 Performance & Scaling

### Current Capacity
- **Vessels tracked:** ~14 (configurable via FLEET_MMSIS)
- **Position updates/day:** ~10,000 (after rate limiting)
- **Database size:** ~50MB (with 90-day retention)
- **Map loads/month:** Unlimited (MapTiler free tier: 100k)

### Bottlenecks
1. **AISStream rate limit:** 100 messages/second (we use ~0.1/sec)
2. **Supabase free tier:** 500MB database, 2GB bandwidth/month
3. **Real-time connections:** 200 concurrent users (Supabase free tier)

### Scaling Up
If you need more:
- **More vessels:** Add MMSIs to `FLEET_MMSIS` env var
- **More regions:** Add bounding boxes to `BBOX_JSON`
- **More users:** Upgrade Supabase plan ($25/mo for Pro)
- **Faster updates:** Reduce rate limiting (but increases DB writes)

---

## 🔧 Environment Variables Explained

### **Ingestor (.env in root)**
```env
# Where to save data
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=secret_key_here  # NEVER commit to git!

# Where to get AIS data
AISSTREAM_KEY=your_aisstream_api_key

# Which vessels to track (comma-separated MMSIs)
FLEET_MMSIS=357170000,352808000,...

# Where to track them (geographic bounding boxes)
# Format: [[minLon,minLat],[maxLon,maxLat]];[[box2]]
BBOX_JSON=[[124,33],[132,39]];[[-6,30],[36,46]]
# Korea region ^^^^        Mediterranean ^^^^
```

### **Web Dashboard (web/.env)**
```env
# Map tiles (FREE - get key from MapTiler)
VITE_MAPTILER_KEY=your_key_here

# Database (read-only access for browser)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=public_anon_key  # Safe to expose
```

**Why separate keys?**
- `SERVICE_ROLE` = Full database access (ingestor only, server-side)
- `ANON_KEY` = Read-only access (web dashboard, client-side)

---

## 🛠️ Troubleshooting

### Problem: No vessels showing on map
**Check:**
1. Is ingestor running? `pm2 list`
2. Is data in database? Check Supabase Table Editor
3. Is web dashboard connected? Check browser console for errors
4. Is MapTiler key valid? Should see map tiles, not gray

### Problem: Stale data warning
**Means:** No new positions in 5+ minutes
**Check:**
1. Ingestor logs: `pm2 logs roro-ingestor`
2. Are vessels in BBOX regions? They might have left the area
3. Is AISStream API down? Check their status page

### Problem: Database full (500MB limit)
**Fix:**
1. Run cleanup manually: `node cleanup.mjs`
2. Check cron job is running: `crontab -l`
3. Reduce FLEET_MMSIS to fewer vessels

### Problem: Map tiles not loading
**Fix:**
1. Get free MapTiler key: https://cloud.maptiler.com/account/keys/
2. Add to `web/.env`: `VITE_MAPTILER_KEY=your_key`
3. Restart dev server: `npm run dev`

---

## 📈 Monitoring Checklist

**Daily:**
- [ ] Ingestor running? `pm2 status`
- [ ] Recent positions? Check dashboard "Last Update" time

**Weekly:**
- [ ] Database size? Check Supabase dashboard
- [ ] Cron logs? `tail -f /tmp/roro-cleanup.log`

**Monthly:**
- [ ] MapTiler usage? Should be <100k (free tier)
- [ ] Supabase bandwidth? Should be <2GB (free tier)

---

## 🎯 Quick Commands Reference

```bash
# Start ingestor
pm2 start ingestor/ingest.mjs --name roro-ingestor

# Check status
pm2 list
pm2 logs roro-ingestor

# Restart if needed
pm2 restart roro-ingestor

# Run cleanup manually
cd ingestor && node cleanup.mjs

# Run view refresh manually
cd ingestor && node refresh-view.mjs

# Test web dashboard locally
cd web && npm run dev

# Build for production
cd web && npm run build
```

---

## 💡 Key Concepts

**Rate Limiting (100m/180s):**
- Only save position if vessel moved 100 meters OR 180 seconds passed
- Reduces database writes by ~90%
- Vessels moving fast → more updates (every 100m)
- Vessels anchored → fewer updates (every 180s)

**Materialized View:**
- Pre-computed "latest position per vessel" table
- Fast queries (no need to scan millions of rows)
- Trade-off: Must refresh periodically (every 5 min)

**Realtime Subscriptions:**
- WebSocket connection from browser to Supabase
- Pushes new data instantly (no polling)
- More efficient than checking every X seconds

**Hash Routing:**
- URLs like `/#/vessel/123` work without server-side routing
- Good for static hosting (GitHub Pages, Netlify, etc.)
- Enables deep linking and browser back/forward

---

## 🎨 Customization

**Change map style:**
- Edit `main.js` line 36: Change `dataviz-dark` to `basic-v2`, `streets-v2`, etc.
- See options: https://cloud.maptiler.com/maps/

**Add more vessel data:**
- Edit `vessels` table in Supabase
- Add columns like `photo_url`, `operator_website`, etc.
- Update `main.js` detail panel to show new fields

**Change retention period:**
- Edit `cleanup.mjs` line 15: Change `RETENTION_DAYS = 90` to your preference
- More days = larger database, but more history

---

## 📞 Support

- GitHub: https://github.com/Inureturn/roro-dashboard
- AISStream Docs: https://aisstream.io/documentation
- Supabase Docs: https://supabase.com/docs
- MapTiler Docs: https://docs.maptiler.com/

---

**Last Updated:** 2025-10-06
**System Version:** 1.0 (PRD Complete)
