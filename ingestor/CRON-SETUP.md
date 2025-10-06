# Cron Setup Guide

This guide shows how to set up automated tasks for the RoRo Dashboard ingestor.

## Scripts Overview

1. **cleanup.mjs** - Deletes vessel_positions older than 90 days (daily)
2. **refresh-view.mjs** - Refreshes materialized view for fast queries (every 5 min)

## Prerequisites

- Node.js 20+ installed on VPS
- PM2 installed globally
- `.env` file configured with `SUPABASE_SERVICE_ROLE_KEY`

## Option 1: Using Cron (Linux/macOS)

### Edit Crontab

```bash
crontab -e
```

### Add These Lines

```cron
# RoRo Dashboard - 90-day cleanup (daily at 2am)
0 2 * * * cd /home/ubuntu/roro-dashboard/ingestor && /usr/bin/node cleanup.mjs >> /tmp/roro-cleanup.log 2>&1

# RoRo Dashboard - Refresh materialized view (every 5 minutes)
*/5 * * * * cd /home/ubuntu/roro-dashboard/ingestor && /usr/bin/node refresh-view.mjs >> /tmp/roro-refresh.log 2>&1
```

### Verify Cron Jobs

```bash
crontab -l
```

### Check Logs

```bash
tail -f /tmp/roro-cleanup.log
tail -f /tmp/roro-refresh.log
```

## Option 2: Using PM2 Cron Module

PM2 can also run scheduled tasks:

```bash
# Install PM2 if not already
npm install -g pm2

# Add cleanup task (daily at 2am)
pm2 start cleanup.mjs --name roro-cleanup --cron "0 2 * * *" --no-autorestart

# Add refresh task (every 5 minutes)
pm2 start refresh-view.mjs --name roro-refresh --cron "*/5 * * * *" --no-autorestart

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

### PM2 Management

```bash
# List all tasks
pm2 list

# View logs
pm2 logs roro-cleanup
pm2 logs roro-refresh

# Stop a task
pm2 stop roro-cleanup
pm2 delete roro-cleanup
```

## Option 3: Manual Execution

You can also run the scripts manually for testing:

```bash
cd /path/to/ingestor

# Run cleanup
node cleanup.mjs

# Run refresh
node refresh-view.mjs
```

## Environment Variables

Both scripts require these environment variables in `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Monitoring

### Check Database Size

```sql
-- In Supabase SQL Editor
SELECT
  pg_size_pretty(pg_total_relation_size('vessel_positions')) as positions_size,
  COUNT(*) as row_count,
  MIN(ts) as oldest,
  MAX(ts) as newest
FROM vessel_positions;
```

### Expected Retention Behavior

- **Without cleanup**: ~2.5M rows/year, ~1.5GB/year
- **With 90-day cleanup**: ~685K rows max, <500MB
- **Cleanup frequency**: Daily keeps database lean
- **View refresh**: Every 5 min ensures fast map queries

### Alerts

Set up monitoring for:
1. Database size approaching 500MB (Supabase free tier limit)
2. Cleanup script failures
3. View refresh failures

## Troubleshooting

### Cleanup fails with timeout

If you have millions of rows, increase batch size in cleanup.mjs or run multiple times.

### View refresh fails

```bash
# Check if view exists
psql -h your-db.supabase.co -U postgres -c "\d+ vessel_latest"

# Manually refresh
psql -h your-db.supabase.co -U postgres -c "REFRESH MATERIALIZED VIEW CONCURRENTLY vessel_latest;"
```

### Cron job not running

```bash
# Check cron service is running
sudo service cron status

# Check cron logs
grep CRON /var/log/syslog

# Verify paths are absolute in crontab
which node  # Use this path in crontab
```

## Windows Task Scheduler (for Windows VPS)

If using Windows Server:

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (Daily at 2am for cleanup, Every 5 minutes for refresh)
4. Action: Start a program
   - Program: `node.exe`
   - Arguments: `cleanup.mjs` (or `refresh-view.mjs`)
   - Start in: `C:\path\to\ingestor`
5. Save and test

## Recommended Setup

For most users, **Option 1 (Cron)** is recommended for simplicity and reliability.

For complex deployments with multiple services, **Option 2 (PM2)** provides better log management and monitoring.
