# Frequently Asked Questions & Roadmap

## API & Data Source

### Q: Can we substitute AISStream with satellite tracking?

**Yes, relatively easy!** Estimated effort: **2-4 hours**

**Current setup:**
- **AISStream.io** - Terrestrial AIS (free tier: 50 vessels)
- Coverage: Coastal areas + major shipping routes
- Update frequency: 2-10 seconds (when in AIS range)

**Satellite alternatives:**

| Provider | Coverage | Cost | Update Frequency |
|----------|----------|------|------------------|
| **Spire Maritime** | Global | $500-2000/mo | 1-5 minutes |
| **ExactEarth** | Global | Enterprise pricing | 1-2 minutes |
| **Orbcomm** | Global | $1000+/mo | 2-5 minutes |
| **MarineTraffic API** | Global (hybrid) | $50-500/mo | 30-60 seconds |

**What needs to change:**
1. **WebSocket connection** in `ingestor/ingest.mjs` (lines 393-450)
2. **Data mapping** - Convert satellite API format to our schema
3. **Authentication** - Different API key mechanism
4. **Database schema** - Already compatible! ✅

**Migration steps:**
```javascript
// Current (AISStream)
const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

// Future (Spire example)
const ws = new WebSocket('wss://ais.spire.com/v2/streams');
```

**No changes needed:**
- ✅ Database schema (already generic)
- ✅ Frontend code (doesn't care about data source)
- ✅ Real-time subscriptions (works with any WebSocket)

---

## Hosting & Deployment

### Q: Where should we host this in production?

**Recommended Production Stack:**

| Component | Service | Cost | Why |
|-----------|---------|------|-----|
| **Frontend** | Vercel | FREE | Auto-deploy from GitHub, CDN, SSL |
| **Ingestor** | Railway.app or VPS | $5-10/mo | Docker support, easy deployment |
| **Database** | Supabase Pro | $25/mo | Includes backups, better performance |
| **Total** | - | **$30-35/month** | - |

### Current vs Production Setup

**Current (Development):**
```
Frontend: Local Vite dev server (localhost:5173)
Ingestor: Hetzner VPS ($4.50/mo) with PM2
Database: Supabase Free tier
```

**Production (Recommended):**
```
Frontend: Vercel
  ├─ Auto-deploy on git push
  ├─ Global CDN (fast loading worldwide)
  ├─ Automatic HTTPS
  └─ Custom domain support

Ingestor: Railway.app ($5/mo) OR keep current VPS
  ├─ Docker container deployment
  ├─ Auto-restart on crash
  ├─ Easy log viewing
  └─ Or stick with PM2 on VPS (works great!)

Database: Supabase Pro ($25/mo)
  ├─ Daily backups
  ├─ Point-in-time recovery
  ├─ Better performance (dedicated CPU)
  └─ Email support
```

### Deployment Steps (Vercel)

1. **Push frontend to GitHub**
   ```bash
   # Already done - your code is on GitHub
   ```

2. **Deploy to Vercel** (5 minutes)
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # In web/ directory
   cd web
   vercel

   # Follow prompts:
   # - Link to GitHub repo
   # - Set build command: npm run build
   # - Set output directory: dist
   # - Add env vars: VITE_MAPTILER_KEY, VITE_SUPABASE_URL, etc.
   ```

3. **Configure environment variables**
   - Vercel Dashboard → Project Settings → Environment Variables
   - Add: `VITE_MAPTILER_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

4. **Done!** Your dashboard is now live at `https://your-project.vercel.app`

**Ingestor stays on VPS** - No changes needed, already running with PM2!

---

## Features & Improvements

### Q: Can we have more accurate "Last seen" times?

**✅ IMPLEMENTED!**

Now shows:
- **"just now"** - Less than 60 seconds
- **"2 mins ago"** - Less than 1 hour
- **"3 hours ago"** - Less than 24 hours
- **"5 days ago"** - Less than 30 days
- **"2 months ago"** - More than 30 days

**Where it appears:**
1. Vessel list sidebar - "Last seen 5 mins ago"
2. Vessel details panel - Shows both relative time AND exact timestamp
3. Position updates - "2 hours ago (2025-10-06 14:23:45)"

**Example:**
```
Last Update: 5 mins ago
             2025-10-06 14:23:45 UTC
```

---

### Q: Can we add "Last updated" timestamps everywhere?

**✅ IMPLEMENTED!**

Added timestamps to:

1. **Vessel List** - Shows relative time for each vessel
2. **Vessel Details Panel:**
   - Position last updated: "5 mins ago"
   - Data last updated: "3 hours ago"
   - Last port arrival: "4 hours ago"
3. **Header** - Global "Last Update" shows when dashboard last received data

**Format:** Shows BOTH relative time and exact timestamp for clarity.

---

### Q: Does it work on mobile?

**✅ ENHANCED!**

Mobile improvements made:

**Responsive Design:**
- ✅ Viewport optimized for mobile devices
- ✅ Touch-friendly buttons (44px minimum tap targets)
- ✅ Sliding sidebars for vessel list and details
- ✅ Stacked header for narrow screens
- ✅ Larger text and icons for readability

**Mobile breakpoints:**
- **1024px:** Narrower sidebars
- **768px:** Full mobile layout with slide-out panels

**Touch gestures:**
- Tap vessel → Opens details panel (slides in from right)
- Tap close → Details slide out
- Pinch to zoom on map ✅ (built into MapLibre)
- Pan map with finger ✅

**Tested on:**
- Mobile Chrome ✅
- Mobile Safari ✅
- Tablet landscape/portrait ✅

**Known limitations:**
- Very small screens (<360px) - some text may wrap
- No swipe gestures (tap to open/close only)

**Future improvements:**
- Swipe to close panels
- Bottom sheet for vessel details
- Pull to refresh

---

### Q: Is there a departure/last port field?

**✅ IMPLEMENTED!**

**Important:** AIS doesn't broadcast "departure port" - only **destination**!

**What we added:**
- `last_port` field - Last port visited
- `last_port_arrival_utc` - When vessel arrived there

**How to populate:**

1. **Manual entry** (Supabase dashboard or SQL)
   ```sql
   UPDATE vessels
   SET last_port = 'Korfez, Turkey',
       last_port_arrival_utc = '2025-10-06T05:46:00Z'
   WHERE mmsi = '357170000';
   ```

2. **Automatic detection** (future)
   - Monitor when vessel speed drops to 0
   - Reverse geocode coordinates to nearest port
   - Auto-populate `last_port` field

**Display:**
- Shows in Voyage section of vessel details
- Format: "Korfez, Turkey (4 hours ago)"

**Migration SQL:**
- Run: `supabase/add-last-port.sql` to add columns
- Run: `supabase/update-ah-shin-last-port.sql` for example data

---

## Roadmap

### Immediate (This Week)
- [x] Relative time display ("5 mins ago")
- [x] Last updated timestamps
- [x] Mobile responsiveness
- [x] Last port field
- [ ] Fix browser cache issues (arrows not showing)
- [ ] Add Ah Shin position data when available

### Short-term (Next 2 Weeks)
- [ ] Deploy frontend to Vercel
- [ ] Auto-detect last port (speed-based)
- [ ] Email/SMS alerts for vessel events
- [ ] Export vessel data (CSV/Excel)
- [ ] Historical playback (replay vessel track)

### Medium-term (Next Month)
- [ ] Weather overlay on map
- [ ] Port information database
- [ ] Vessel comparison (side-by-side)
- [ ] Custom geofences (alerts when entering/leaving areas)
- [ ] API for external integrations

### Long-term (Next Quarter)
- [ ] Satellite AIS integration
- [ ] Predictive ETA (ML-based)
- [ ] Fuel consumption tracking
- [ ] Automated port call reporting
- [ ] Multi-user accounts with roles

---

## Technical Limitations

### AIS Data Gaps

**Why some vessels don't appear:**
1. **Out of range** - Terrestrial AIS only covers coastal areas
2. **Transponder off** - Vessel turned off AIS (rare, but happens)
3. **No recent transmission** - Vessel in port (static)
4. **Signal interference** - Bad weather, obstacles

**Solution:** Upgrade to satellite AIS for global coverage

### Update Frequency

**Position Reports:**
- Moving vessels: Every 2-10 seconds
- Anchored vessels: Every 3 minutes
- Not moving: Every 6 minutes

**ShipStaticData:**
- Every 6 minutes
- Includes: Destination, ETA, dimensions, name

**Why destination/ETA shows N/A:**
- ShipStaticData hasn't been received yet
- Wait 6-10 minutes after vessel starts transmitting
- Or vessel hasn't set destination in their AIS system

### Data Accuracy

**Position accuracy:** ±100 meters (1 football field)
**Heading accuracy:** ±5 degrees
**Speed accuracy:** ±0.1 knots
**ETA accuracy:** Depends on captain's input (often inaccurate!)

**Destination field issues:**
- Often abbreviated ("SEGOT" = Port of Segot)
- Sometimes wrong (captain didn't update)
- Max 20 characters (truncated)

---

## Cost Optimization

### Free Tier Limits

**Current usage:**

| Service | Free Tier | Our Usage | Upgrade Needed? |
|---------|-----------|-----------|-----------------|
| Supabase | 500MB DB | ~50MB | No |
| AISStream | 50 vessels | 14 vessels | No |
| MapTiler | 100k loads/month | ~1k/month | No |
| VPS | N/A | $4.50/mo | Already paid |

**Total current cost:** $4.50/month

**When to upgrade:**

1. **Supabase → Pro ($25/mo)**
   - When DB > 500MB (after ~6 months of position data)
   - When you need backups
   - When you add more users

2. **AISStream → Paid**
   - When tracking > 50 vessels
   - Or switch to satellite for global coverage

3. **MapTiler**
   - Unlikely to exceed 100k loads/month
   - Would need 3,000+ users/day

---

## Security & Privacy

### Data Access

**Public (no login required):**
- ✅ View vessel positions
- ✅ View vessel details
- ✅ Real-time updates

**Why no authentication?**
- AIS data is public by international maritime law
- No sensitive information displayed
- Faster loading (no login flow)

**Future:** Add optional login for:
- Custom alerts
- Saved filters
- Notes on vessels
- Historical data export

### API Keys

**Exposed (safe):**
- ✅ Supabase Anon Key - Public, read-only
- ✅ MapTiler Key - Public, usage-limited

**Hidden (server-only):**
- 🔒 Supabase Service Role - Never exposed to browser
- 🔒 AISStream Key - Server-side only

---

## Questions?

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- See [README.md](../README.md) for setup instructions
- Open GitHub issue for bugs/feature requests
