# Run Migration SQL in Supabase

## Steps (2 minutes)

### 1. Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Click your project (`rbffmfuvqgxlthzvmtir`)
3. Click "SQL Editor" in left sidebar
4. Click "New query"

### 2. Copy/Paste Migration

Open `supabase/migration-add-refresh-function.sql` and copy this:

```sql
-- Migration: Add refresh_vessel_latest() function
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

### 3. Run the Query

1. Paste into SQL Editor
2. Click "Run" button (or press Ctrl+Enter)
3. Should see: ✅ Success. No rows returned

### 4. Test It Works

Run this test query:

```sql
-- Test the function
select public.refresh_vessel_latest();
```

Should see: ✅ Success. No rows returned (this is correct!)

### 5. Verify Materialized View Exists

```sql
-- Check if view exists
SELECT * FROM vessel_latest LIMIT 5;
```

Should see 5 rows with vessel positions (or "0 rows" if no data yet)

## What This Does

This migration adds a function that allows the `refresh-view.mjs` cron script to refresh the materialized view.

**Without this function:** Cron job will fail with "permission denied"
**With this function:** Cron job can refresh the view every 5 minutes ✅

## Troubleshooting

**Error: "relation vessel_latest does not exist"**
- Your database doesn't have the base schema
- Solution: Run the FULL `supabase/schema.sql` instead

**Error: "permission denied"**
- You're using the anon key instead of dashboard login
- Solution: Make sure you're logged into Supabase dashboard

**Success but no data:**
- Normal if ingestor hasn't written any positions yet
- Check: `SELECT COUNT(*) FROM vessel_positions;`
- Should be >0 if ingestor is running

## Done!

✅ Migration complete
✅ Cron jobs will now work
✅ View will refresh every 5 minutes

Next: Set up cron jobs on VPS (see CRON-SETUP.md)
