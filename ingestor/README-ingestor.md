# AIS Ingestor

24/7 AIS position ingestor for RoRo vessel tracking dashboard.

## Overview

This service connects to AISStream.io via WebSocket and writes vessel positions to Supabase in real-time. It tracks ~20–30 vessels across two bounding boxes (Korea + Mediterranean) with intelligent rate limiting to minimize database writes while maintaining accurate tracking.

## Features

- **Real-time AIS streaming** from AISStream.io
- **Intelligent rate limiting**: Only writes positions when vessel moves >100m OR >180s elapsed
- **Auto-reconnect** with exponential backoff
- **Heartbeat monitoring**: Forces reconnect if no messages for 5 minutes
- **Duplicate prevention**: In-memory cache prevents duplicate timestamps
- **Static data enrichment**: Updates vessel metadata from ShipStaticData messages
- **Graceful shutdown**: Handles SIGINT/SIGTERM properly

## Requirements

- Node.js 20+
- Supabase project with schema configured
- AISStream.io API key

## Quick Start - VPS Deployment

**Fastest way to deploy to production:**

```bash
# On your local machine
cd ingestor
./upload-to-vps.sh deploy@your-vps-ip

# Then SSH to VPS
ssh deploy@your-vps-ip
cd ais-ingestor
./deploy.sh
```

See [VPS-DEPLOYMENT.md](VPS-DEPLOYMENT.md) for complete setup guide.

## Local Development

### Installation

```bash
cd ingestor
npm install
```

### Configuration

Create a `.env` file (or set environment variables):

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGc...your-service-role-key

# AISStream
AISSTREAM_KEY=your-aisstream-api-key

# Fleet tracking
FLEET_MMSIS=357170000,352808000,352001129,355297000,356005000,249901000,229077000,229076000,219927000,352001162,355137000,352001920,373817000,249904000

# Bounding boxes (semicolon-separated; each is [[lon_min,lat_min],[lon_max,lat_max]])
BBOX_JSON=[[124,33],[132,39]];[[-6,30],[36,46]]

# Optional
LOG_LEVEL=info  # or 'debug' for verbose output
```

## Running Locally

```bash
npm start
```

You should see:

```
[INIT] AIS Ingestor starting...
[INIT] Fleet MMSIs: 14
[INIT] Bounding boxes: 2
[INIT] Log level: info
[INIT] Rate limits: 100m / 180s
[WS] Connecting to AISStream...
[WS] Connected
[WS] Subscription sent { bboxes: 2, mmsis: 14 }
[DB] Upserted vessel 357170000
[DB] Inserted position for 357170000 at 2025-01-15T10:23:45.000Z
[STATS] Inserts in last minute: 3
```

## Running with PM2

For production 24/7 operation:

```bash
pm2 start ingest.mjs --name ais-ingestor --time
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

Monitor logs:

```bash
pm2 logs ais-ingestor
pm2 monit
```

## Running with Docker

Build:

```bash
docker build -t ais-ingestor .
```

Run:

```bash
docker run -d \
  --name ais-ingestor \
  --restart unless-stopped \
  --env-file .env \
  ais-ingestor
```

View logs:

```bash
docker logs -f ais-ingestor
```

## Rate Limiting Logic

Positions are written to the database only when:

- Vessel has moved **>100 meters** from last stored position, OR
- **≥180 seconds** have elapsed since last stored position

This reduces database writes by ~90% while maintaining smooth vessel tracks.

## Reconnection Behavior

- **Initial delay**: 1 second
- **Backoff**: Doubles on each failure (1s → 2s → 4s → 8s → 10s max)
- **Heartbeat**: If no messages for 5 minutes, forces reconnect
- **Graceful shutdown**: Cleans up timers and closes WebSocket properly

## Logs

All logs go to stdout. Important events:

- `[INIT]` - Startup validation
- `[WS]` - WebSocket connect/disconnect/subscription
- `[DB]` - Database operations (inserts/upserts)
- `[STATS]` - Per-minute insert counts
- `[ERROR]` - Any errors encountered

Set `LOG_LEVEL=debug` for verbose output including skip decisions and distance calculations.

## Security Notes

- Uses **service_role** key for database writes (bypasses RLS)
- Never logs API keys or secrets
- Runs as non-root user in Docker
- No HTTP endpoints exposed (logs only)

## Database Schema

Writes to two tables:

- `public.vessels` - Static vessel metadata (upserted on ShipStaticData messages)
- `public.vessel_positions` - Time-series position data (inserted on PositionReport)

Foreign key: `vessel_positions.mmsi` → `vessels.mmsi`

Automatic stub vessel rows are created if position received for unknown MMSI.

## Troubleshooting

**No positions being written:**
- Check `FLEET_MMSIS` includes target vessels
- Verify `BBOX_JSON` covers vessel locations
- Enable `LOG_LEVEL=debug` to see skip reasons

**WebSocket keeps reconnecting:**
- Verify `AISSTREAM_KEY` is valid
- Check AISStream.io subscription status/quota
- Review firewall/proxy settings

**Database errors:**
- Confirm `SUPABASE_SERVICE_ROLE` key has write access
- Verify schema matches expected structure
- Check Supabase dashboard for RLS issues

**High memory usage:**
- Cache size grows with MMSI count (minimal impact for <100 vessels)
- Consider restarting periodically if tracking thousands of vessels
