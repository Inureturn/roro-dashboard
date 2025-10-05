# RoRo Dashboard

Real-time vessel tracking dashboard for RoRo (Roll-on/Roll-off) fleet operations.

## Overview

Live tracking system for ~20-30 vessels across multiple regions (Korea Strait + Mediterranean) with minute-level position updates from AIS (Automatic Identification System).

**Stack:**
- **Backend**: Node.js 20 ESM ingestor connected to AISStream.io
- **Database**: Supabase (PostgreSQL + Realtime)
- **Frontend**: Vite + React SPA (coming soon)
- **Deployment**: VPS with PM2

## Project Structure

```
cig-dashboard/
├── supabase/          # Database schema and migrations
│   └── schema.sql     # PostgreSQL schema (vessels, positions, realtime)
├── ingestor/          # 24/7 AIS position ingestor
│   ├── ingest.mjs     # Main WebSocket→Supabase ingestor
│   ├── deploy.sh      # VPS deployment script
│   ├── VPS-DEPLOYMENT.md
│   └── README-ingestor.md
└── web/               # Frontend dashboard (TBD)
```

## Quick Start

### 1. Database Setup

Create Supabase project and run schema:

```bash
# Via Supabase dashboard SQL editor
psql -h db.xxx.supabase.co -U postgres -d postgres < supabase/schema.sql

# Or through Supabase dashboard:
# Project Settings → Database → SQL Editor → paste schema.sql
```

### 2. Ingestor Deployment

**Option A: Quick VPS Deploy (Recommended)**

```bash
cd ingestor
./upload-to-vps.sh deploy@your-vps-ip

# Then on VPS:
ssh deploy@your-vps-ip
cd ais-ingestor
./deploy.sh
```

**Option B: GitHub Clone (Clean)**

```bash
# On VPS
git clone https://github.com/YOUR_USERNAME/roro-dashboard.git
cd roro-dashboard/ingestor
cp .env.example .env
nano .env  # Add credentials
./deploy.sh
```

See [ingestor/VPS-DEPLOYMENT.md](ingestor/VPS-DEPLOYMENT.md) for complete guide.

### 3. Configure Environment

Required credentials (add to `ingestor/.env`):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key
AISSTREAM_KEY=your-aisstream-api-key
FLEET_MMSIS=357170000,352808000,...
BBOX_JSON=[[124,33],[132,39]];[[-6,30],[36,46]]
```

## Features

### Ingestor

- ✅ Real-time AIS streaming from AISStream.io
- ✅ Intelligent rate limiting (100m / 180s)
- ✅ Auto-reconnect with exponential backoff
- ✅ Vessel metadata enrichment
- ✅ Duplicate prevention
- ✅ 24/7 operation with PM2

### Database

- ✅ Optimized PostgreSQL schema
- ✅ PostGIS spatial indexing
- ✅ Realtime subscriptions ready
- ✅ RLS policies for secure access

### Dashboard (Coming Soon)

- [ ] Interactive map with vessel positions
- [ ] Real-time updates via Supabase Realtime
- [ ] Vessel details and metadata
- [ ] Historical track playback
- [ ] Fleet overview and statistics

## Deployment

**Recommended VPS**: Hetzner Cloud (~$4.50/month)
- 2GB RAM, 1 vCPU, 20GB SSD
- Ubuntu 22.04 LTS
- Node.js 20 + PM2

**Total cost**: ~$5/month
- VPS: $4-6/month
- Supabase: Free tier (500MB DB, 2GB bandwidth)
- AISStream: Free tier (up to 50 vessels)

## Monitoring

```bash
# PM2 commands
pm2 status
pm2 logs ais-ingestor
pm2 monit

# Check database
# Via Supabase dashboard → Table Editor → vessel_positions
```

## Documentation

- [Ingestor README](ingestor/README-ingestor.md)
- [VPS Deployment Guide](ingestor/VPS-DEPLOYMENT.md)
- [Database Schema](supabase/schema.sql)

## License

MIT

## Support

For issues or questions, check the documentation or open an issue.
