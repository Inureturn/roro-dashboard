# Scripts - RoRo Dashboard

## ⚠️ TEMPORARY UTILITIES - FOR DEMO PURPOSES ONLY

This folder contains temporary scripts used to prepopulate the dashboard for stakeholder demonstrations. **These scripts should be deleted once satellite view is implemented.**

---

## Files

### `fetch-vessel-data.js`
**Status:** Optional utility
**Purpose:** Fetch vessel data from VesselFinder API

**Usage:**
```bash
node scripts/fetch-vessel-data.js
```

**Output:** Generates `supabase/prepopulate-fleet.sql`

**Note:** This requires internet access and may fail if VesselFinder changes their API. The manually created SQL file (below) is more reliable.

---

## SQL Files (Supabase Folder)

### `supabase/prepopulate-fleet-TEMPORARY.sql` ⭐
**Status:** Ready to use
**Purpose:** Manually curated vessel data for demo

**What it does:**
1. ✅ Inserts 5 fleet vessels into database
2. ✅ Adds IMO, flag, dimensions, operator info
3. ✅ Creates placeholder positions (20 hours old) so vessels appear on map
4. ✅ Safe to run multiple times (uses ON CONFLICT)

**How to use:**
1. Open Supabase SQL Editor
2. Copy entire contents of the file
3. Run the SQL
4. Refresh dashboard → Fleet vessels appear!

**⚠️ CRITICAL WARNINGS:**
- Positions are FAKE - 20 hours old, won't update
- This is NOT real-time tracking
- Explain to stakeholders: "This is demo data to show the interface"
- DELETE this file after satellite view is ready

---

## Why This is Temporary

### The Problem
- Real-time AIS data exists but markers are invisible on vector map
- Stakeholders need to see populated dashboard for demos
- Waiting for satellite view fix (3-4 hours dev time)

### The Workaround
- Manually insert static vessel data
- Add old positions to make vessels visible
- Clear disclaimer: "This is temporary demo data"

### The Proper Solution (Coming Soon)
- ✅ Satellite map view → Markers become visible
- ✅ AIS ingestor → Real-time updates every 5-10 mins
- ✅ No manual intervention needed
- ✅ DELETE all these scripts

---

## Timeline

1. **Now (Demo Phase):**
   - Run `prepopulate-fleet-TEMPORARY.sql`
   - Show stakeholders populated dashboard
   - Explain: "Real positions coming with satellite view"

2. **After Satellite View (3-4 hours):**
   - Real-time markers visible on map
   - AIS data updates automatically
   - **DELETE this entire scripts folder**

3. **Production (Long-term):**
   - No manual data entry needed
   - Pure real-time AIS tracking
   - Professional, automated system

---

## Important Reminders

### ✅ DO:
- Use this for stakeholder demos to show UI/UX
- Explain it's temporary demo data
- Delete scripts after satellite view is ready

### ❌ DON'T:
- Present this as real-time tracking
- Use in production environment
- Keep these scripts long-term
- Forget to explain limitations to stakeholders

---

## Questions?

See [STAKEHOLDER-BRIEFING.md](../STAKEHOLDER-BRIEFING.md) for full context on the marker visibility issue and planned solutions.
