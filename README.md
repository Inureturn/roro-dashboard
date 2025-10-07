# RoRo Dashboard

Real-time vessel tracking dashboard for RoRo (Roll-on/Roll-off) fleet operations with 30-day historical trails and voyage detection.

## Stack

- **Frontend**: Vite + Vanilla JS + MapLibre GL
- **Backend**: Node.js AIS ingestor (AISStream.io)
- **Database**: Supabase (PostgreSQL + PostGIS + Realtime)
- **Deployment**: VPS with PM2

## Features

✅ **Real-time tracking** - Live vessel positions with Supabase Realtime
✅ **30-day historical trails** - Full voyage paths (2,000 points per vessel)
✅ **Voyage detection** - Auto-detect port arrivals/departures (satellite AIS gap-safe)
✅ **Multi-region support** - Korea Strait + Mediterranean bounding boxes
✅ **Responsive UI** - Desktop & mobile optimized
✅ **Internationalization** - English/Korean toggle

## Quick Start

### 1. Database Setup

Create Supabase project and run:
```sql
-- In Supabase SQL Editor
\i supabase/schema.sql
```

### 2. Web Dashboard

```bash
cd web
npm install
cp .env.example .env
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Open http://localhost:5173

### 3. AIS Ingestor (VPS)

```bash
cd ingestor
cp .env.example .env
# Add SUPABASE_URL, SUPABASE_SERVICE_ROLE, AISSTREAM_KEY, FLEET_MMSIS, BBOX_JSON
./deploy.sh
```

See [ingestor/VPS-DEPLOYMENT.md](ingestor/VPS-DEPLOYMENT.md) for details.

## Project Structure

```
cig-dashboard/
├── web/                    # Frontend dashboard
│   ├── index.html         # Main UI
│   ├── main.js            # App logic + voyage detection
│   └── style.css          # Responsive styles
├── ingestor/              # AIS data collector
│   ├── ingest.mjs         # WebSocket→Supabase
│   └── deploy.sh          # PM2 deployment
└── supabase/              # Database
    ├── schema.sql         # PostgreSQL schema
    └── check-*.sql        # Monitoring queries
```

## Configuration

**Fleet Vessels** (always visible):
```javascript
// web/main.js
const MY_FLEET_MMSIS = [
  '357170000', // Ah Shin
  '352808000', // Hae Shin
  '352001129', // O Soo Shin
  '355297000', // Sang Shin
  '356005000'  // Young Shin
];
```

**Trail Settings**:
- Max points: 2,000 per vessel
- Time window: 30 days
- Speed filter: >0.5 knots (excludes port stays)

**Voyage Detection**:
- Port arrival: Speed <0.5kn for 8+ hours
- Port departure: Speed >3kn sustained
- Gap protection: Max 2-hour AIS gap tolerance

## Performance

| Metric | Value |
|--------|-------|
| Vessels supported | 30+ |
| Trail points per vessel | 2,000 |
| Database fetch | ~3-5s (30K positions) |
| Memory usage | ~30 MB |
| Rendering | GPU accelerated (MapLibre) |

## Deployment

**Recommended VPS**: Hetzner Cloud ($4-6/month)
- 2GB RAM, 1 vCPU
- Ubuntu 22.04 LTS
- Node.js 20 + PM2

**Total Cost**: ~$5/month
- VPS: $4-6/month
- Supabase: Free tier (500MB DB)
- AISStream: Free tier (50 vessels)

## Monitoring

**Dashboard health**:
```bash
# Check vessel data
open http://localhost:5173

# Browser console should show:
# [DEBUG] Fetched 1750 positions from database
# [DEBUG] Found positions for 4 vessels
```

**Ingestor health** (VPS):
```bash
pm2 status
pm2 logs ais-ingestor --lines 50
```

**Database queries**:
```sql
-- Check data status
\i supabase/check-data-status.sql

-- Per-vessel breakdown
\i supabase/check-per-vessel.sql
```

## Documentation

- [Voyage Visualization Guide](VOYAGE-VISUALIZATION-GUIDE.md) - Industry best practices
- [Voyage Detection (Satellite AIS)](VOYAGE-DETECTION-SATELLITE-AIS.md) - Gap-safe algorithm
- [Fleet Rules](FLEET-EXCLUSIVE-RULES.md) - Priority vessel handling
- [VPS Deployment](ingestor/VPS-DEPLOYMENT.md) - Production setup

## Key Technical Details

**Pagination**: Fetches all positions in 1K batches (bypasses Supabase limit)
```javascript
// web/main.js
while (hasMore && offset < 10000) {
  const { data } = await supabase
    .from('vessel_positions')
    .range(offset, offset + 999);
  // ...
}
```

**Per-vessel limiting**: Displays max 2K points per vessel for performance
```javascript
if (data.trail.length < 2000 && posTime > cutoffTime && includePosition) {
  data.trail.push(pos);
}
```

## License

MIT

---

**Built with** [Claude Code](https://claude.com/claude-code)
