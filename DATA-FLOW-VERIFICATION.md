# Data Flow Verification Report

## Executive Summary
✅ **Database schema is complete**
✅ **Ingestor → Database wiring is correct**
⚠️ **Frontend → Database wiring has gaps** (missing fields)
⚠️ **AISStream integration has minor gaps** (not subscribing to ShipStaticData)

---

## 1. AISStream API → Ingestor

### What AISStream Provides
According to [AISStream docs](https://aisstream.io/documentation):

**PositionReport Fields Available:**
- `MessageID`
- `UserID` (MMSI)
- `Latitude`, `Longitude`
- `Cog` (Course over Ground)
- `Sog` (Speed over Ground)
- `NavigationalStatus`
- `TrueHeading`
- `Timestamp`
- `RateOfTurn` ⚠️ NOT CAPTURED
- `PositionAccuracy` ⚠️ NOT CAPTURED
- `Raim` ⚠️ NOT CAPTURED

**ShipStaticData Fields Available:**
- `Name`, `CallSign`
- `Type` (vessel type code)
- `ImoNumber`
- `Dimensions` (A, B, C, D)
- `Destination`
- `ETA`
- `MaximumStaticDraught` ⚠️ NOT CAPTURED
- `TypeAndCargoType` ⚠️ NOT CAPTURED

### What Ingestor is Subscribing To
**Current subscription** (`ingestor/ingest.mjs` line 395):
```javascript
FilterMessageTypes: SUB_TYPES_ENV === 'pos' ? ['PositionReport'] : ['PositionReport', 'ShipStaticData']
```

**Environment setting** (`.env` line 19):
```
SUB_TYPES=pos
```

⚠️ **ISSUE:** Only subscribing to `PositionReport`, NOT `ShipStaticData`!

**Impact:**
- Missing: IMO numbers, vessel type, callsign, dimensions, destination, ETA
- These fields will remain NULL in database unless you change `SUB_TYPES=pos+static`

### What Ingestor Captures from PositionReport
**File:** `ingestor/ingest.mjs` lines 347-357

✅ Captured:
- `mmsi` ← `meta.MMSI`
- `lat` ← `meta.latitude`
- `lon` ← `meta.longitude`
- `ts` ← `meta.time_utc` (converted via parseTimestamp)
- `sog_knots` ← `pr.Sog`
- `cog_deg` ← `pr.Cog`
- `heading_deg` ← `pr.TrueHeading`
- `nav_status` ← `pr.NavigationalStatus`

❌ NOT Captured:
- `RateOfTurn` (pr.Rot)
- `PositionAccuracy` (pr.PositionAccuracy)
- `Raim` (pr.Raim)
- `ManeuverIndicator` (pr.ManeuverIndicator)

### What Ingestor Captures from ShipStaticData
**File:** `ingestor/ingest.mjs` lines 358-378

✅ Captured (when `SUB_TYPES=pos+static`):
- `name` ← `meta.ShipName`
- `imo` ← `ssd.ImoNumber`
- `callsign` ← `ssd.CallSign`
- `type` ← `ssd.Type`
- `destination` ← `ssd.Destination`
- `length_m` ← `ssd.Dimension.A + ssd.Dimension.B`
- `beam_m` ← `ssd.Dimension.C + ssd.Dimension.D`
- `eta_utc` ← `ssd.ETA` (parsed)

❌ NOT Captured:
- `max_draught_m` (ssd.MaximumStaticDraught)
- Full vessel type description (ssd.TypeAndCargoType)

---

## 2. Ingestor → Database

### Vessels Table Write Operations

**Function:** `upsertVessel()` (lines 225-243)

✅ Fields Written:
- `mmsi` (PK)
- `name`
- `imo`
- `callsign`
- `type`
- `length_m`
- `beam_m`
- `destination`
- `eta_utc`
- `last_message_utc`
- `updated_at`
- `is_my_fleet` (from FLEET_MMSIS env)
- `is_competitor` (from COMPETITOR_MMSIS env)

❌ Schema Fields NOT Written by Ingestor:
- `operator` (manual entry only)
- `max_draught_m` (not captured from AIS)
- `flag` (not in AIS messages)
- `notes` (manual entry only)
- `operator_group` (manual entry only)

**Verification:** ✅ All AIS-available fields are being written

### Vessel Positions Table Write Operations

**Function:** `insertPosition()` (lines 262-318)

✅ Fields Written:
- `mmsi` (FK)
- `ts`
- `lat`
- `lon`
- `sog_knots`
- `cog_deg`
- `heading_deg`
- `nav_status`
- `destination` (from position message)
- `source` (defaults to 'terrestrial')
- `geom` (auto-generated from lat/lon)

❌ Schema Fields NOT Written:
- None (all fields either written or auto-generated)

**Verification:** ✅ Complete

---

## 3. Database → Frontend

### Vessels Table Read Operations

**File:** `web/main.js` lines 64-99

**Query:**
```javascript
const { data, error } = await supabase
  .from('vessels')
  .select('*')
  .eq('is_my_fleet', true);
```

✅ Fetches: ALL vessel fields
✅ Filter: Only fleet vessels (`is_my_fleet = true`)

### Vessel Positions Table Read Operations

**File:** `web/main.js` lines 102-148

**Query:**
```javascript
const { data, error } = await supabase
  .from('vessel_positions')
  .select('*')
  .order('ts', { ascending: false })
  .limit(1000);
```

✅ Fetches: Last 1000 positions (should cover all recent data)
✅ Orders: By timestamp descending

### Frontend Display Fields

**Vessel List** (lines 260-289):
- ✅ `name`
- ✅ `mmsi`
- ✅ `lastPosition.sog_knots`
- ✅ `last_message_utc` (for status)

**Vessel Details Panel** (lines 304-402):
- ✅ `name`, `mmsi`, `imo`, `callsign`, `type`
- ✅ `length_m`, `beam_m`, `max_draught_m`
- ✅ `destination`, `eta_utc`, `operator`
- ✅ Position: `lat`, `lon`, `sog_knots`, `cog_deg`, `heading_deg`, `nav_status`
- ✅ `last_message_utc`

**Map Markers** (lines 151-236):
- ✅ Position: `lat`, `lon`
- ✅ Vessel trail (last 50 positions)
- ✅ Color coding: `is_my_fleet` vs `is_competitor`
- ✅ Popup: `name`, `mmsi`, `sog_knots`, `cog_deg`, `ts`

❌ **NOT Displayed Anywhere:**
- `flag` (country flag)
- `notes`
- `operator_group`
- `nav_status` in list view (only in details)
- `heading_deg` in popup (only in details)

---

## 4. Missing Data Points & Opportunities

### Available but NOT Captured

1. **Rate of Turn** (`pr.Rot`)
   - Shows if vessel is turning
   - Useful for collision detection
   - **Fix:** Add to `insertPosition()` payload

2. **Position Accuracy** (`pr.PositionAccuracy`)
   - GPS accuracy indicator
   - **Fix:** Add boolean field to schema

3. **Maximum Draught** (`ssd.MaximumStaticDraught`)
   - Important for port clearance
   - **Fix:** Capture in `upsertVessel()` from ShipStaticData

4. **Type and Cargo Type** (`ssd.TypeAndCargoType`)
   - More detailed than Type field
   - **Fix:** Add to vessels table

### Available but NOT Displayed

1. **Flag** (already in schema)
   - **Fix:** Add to vessel details panel
   - Requires manual data entry or external API

2. **Operator Group** (already in schema)
   - **Fix:** Add to vessel details panel
   - Good for grouping fleet operators

3. **Notes** (already in schema)
   - **Fix:** Add to vessel details panel
   - Allow manual annotations

4. **Destination** in vessel list
   - **Fix:** Show in vessel-item as secondary info

5. **ETA** countdown
   - **Fix:** Calculate and show "Arriving in X hours"

---

## 5. Database Schema Verification

**File:** `supabase/schema.sql`

### Vessels Table
```sql
mmsi              text primary key          ✅
imo               text                      ✅
name              text                      ✅
callsign          text                      ✅
type              text                      ✅
length_m          numeric                   ✅
beam_m            numeric                   ✅
operator          text                      ✅ (manual only)
max_draught_m     numeric                   ⚠️ (not from AIS)
destination       text                      ✅
flag              text                      ✅ (manual only)
notes             text                      ✅ (manual only)
updated_at        timestamptz               ✅
operator_group    text                      ✅ (manual only)
is_my_fleet       boolean                   ✅
is_competitor     boolean                   ✅ (added manually)
eta_utc           timestamptz               ✅ (missing from schema!)
last_message_utc  timestamptz               ✅ (missing from schema!)
```

⚠️ **SCHEMA DRIFT DETECTED!**

**Missing columns in `schema.sql`:**
1. `eta_utc timestamptz`
2. `last_message_utc timestamptz`
3. `is_competitor boolean`

These exist in production database but not in schema file.

### Vessel Positions Table
```sql
id             bigserial primary key      ✅
mmsi           text not null (FK)         ✅
ts             timestamptz not null       ✅
lat            double precision           ✅
lon            double precision           ✅
sog_knots      numeric                    ✅
cog_deg        numeric                    ✅
heading_deg    numeric                    ✅
nav_status     text                       ✅
destination    text                       ✅
source         text default 'terrestrial' ✅
geom           geometry(Point, 4326)      ✅
```

✅ **Complete**

### Materialized View: vessel_latest
```sql
select distinct on (vp.mmsi)
  vp.mmsi,
  vp.ts,
  vp.lat,
  vp.lon,
  vp.sog_knots,
  vp.cog_deg,
  vp.heading_deg,
  vp.destination,
  vp.nav_status,
  vp.geom
```

⚠️ **NOT BEING USED BY FRONTEND!**

Frontend queries `vessel_positions` directly (line 105).
Should query `vessel_latest` for better performance.

---

## 6. Realtime Subscriptions

**Frontend subscriptions** (`web/main.js` lines 606-635):

✅ **Subscribed to:**
1. `vessel_positions` table (INSERT events)
2. `vessels` table (all events)

✅ **Handlers:**
- New position → Update marker, trail, stats
- Vessel update → Update vessel data in memory

⚠️ **Missing:**
- No subscription to `vessel_latest` (view isn't supported by Realtime)

---

## 7. Recommendations

### Critical Fixes

1. **Enable ShipStaticData subscription**
   ```bash
   # In VPS .env file
   SUB_TYPES=pos+static
   ```
   This will populate: IMO, callsign, type, dimensions, destination, ETA

2. **Update schema.sql** to match production
   ```sql
   ALTER TABLE vessels
   ADD COLUMN IF NOT EXISTS eta_utc timestamptz,
   ADD COLUMN IF NOT EXISTS last_message_utc timestamptz,
   ADD COLUMN IF NOT EXISTS is_competitor boolean DEFAULT false;
   ```

3. **Use materialized view** for better performance
   ```javascript
   // Change line 105 in main.js
   .from('vessel_latest')  // instead of vessel_positions
   ```

### Optional Enhancements

4. **Capture max_draught_m** from AIS
   ```javascript
   // In upsertVessel(), add:
   max_draught_m: ssd.MaximumStaticDraught ? ssd.MaximumStaticDraught / 10 : null
   ```

5. **Display missing fields** in UI
   - Add flag emoji to vessel list
   - Show operator_group in details
   - Add notes field (editable)
   - Show destination in vessel list

6. **Add Rate of Turn**
   ```sql
   ALTER TABLE vessel_positions ADD COLUMN rot_deg_min numeric;
   ```
   ```javascript
   // In insertPosition()
   rot_deg_min: pr.Rot
   ```

---

## 8. Data Flow Diagram

```
AISStream WebSocket
    ↓
    ├─ PositionReport ✅
    │   ├─ lat, lon, sog, cog, heading, nav_status ✅
    │   ├─ Rate of Turn ❌ NOT CAPTURED
    │   └─ Position Accuracy ❌ NOT CAPTURED
    │
    └─ ShipStaticData ⚠️ NOT SUBSCRIBED (SUB_TYPES=pos)
        ├─ name, imo, callsign, type ⚠️
        ├─ dimensions (length, beam) ⚠️
        ├─ destination, ETA ⚠️
        └─ max_draught ❌ NOT CAPTURED

        ↓

Ingestor (ingest.mjs)
    ├─ updateVesselActivity() ✅
    ├─ insertPosition() ✅
    └─ upsertVessel() ⚠️ (only if SUB_TYPES=pos+static)

        ↓

Supabase PostgreSQL + PostGIS
    ├─ vessels table ✅
    │   ├─ Manual fields: operator, flag, notes ✅
    │   └─ AIS fields: name, imo, type, etc. ⚠️
    │
    ├─ vessel_positions table ✅
    │   └─ Fully populated ✅
    │
    └─ vessel_latest view ⚠️ NOT USED BY FRONTEND

        ↓

Frontend (main.js)
    ├─ fetchVessels() ✅
    ├─ fetchPositions() ⚠️ (should use vessel_latest)
    ├─ subscribeToUpdates() ✅
    │
    ├─ Vessel List ✅
    │   └─ Shows: name, mmsi, status, speed ✅
    │
    ├─ Vessel Details ✅
    │   ├─ Shows: all vessel info ✅
    │   └─ Missing: flag, operator_group, notes ❌
    │
    └─ Map Markers + Trails ✅
        └─ Color-coded by fleet/competitor ✅
```

---

## 9. Test Checklist

- [ ] Change `SUB_TYPES=pos+static` on VPS
- [ ] Restart ingestor: `pm2 restart ais-ingestor`
- [ ] Wait 5-10 minutes for AIS data
- [ ] Verify IMO/callsign populated in vessels table
- [ ] Check frontend displays vessel type, dimensions
- [ ] Verify ETA shows in vessel details
- [ ] Update schema.sql with missing columns
- [ ] Test materialized view query performance
- [ ] Add flag/operator_group to UI
- [ ] Test realtime updates work correctly

---

**Generated:** 2025-10-06
**Status:** Ingestor online (MMSI mode), waiting for vessel data
**Next Action:** Enable ShipStaticData subscription
