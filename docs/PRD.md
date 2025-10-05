# RoRo Fleet Live Dashboard — Product Requirements Document (PRD)

## 1. Goals

**Objective:**  
Build a real-time dashboard for ~20–30 RoRo vessels (own fleet + competitors) showing live positions, voyage data, and static vessel info.

**Success Criteria**
- Live map view with minutes-level freshness.
- Vessel detail pages with static and dynamic data.
- Self-contained stack (VPS + Supabase + SPA).
- Free/cheap to start, scalable without rewrites.
- Future-proof for embedding into proprietary websites.

**Non-Goals:**  
Alerts/notifications, advanced analytics, satellite AIS integration, or mobile optimization (for now).

---

## 2. Users & Jobs-To-Be-Done

| User | Job | Goal |
|------|-----|------|
| Operations / Analyst | See live positions of own and competitor vessels | Monitor movement and timing |
| Manager | Quick overview of fleet status | Verify operations at a glance |
| Partner (future embed) | Display subset of vessels on external site | Integrate visualization without exposing backend |

---

## 3. Core Features & Routes

### `/` — Fleet Map
- Live map showing last known position, age, SOG, COG, and destination.
- Filters: “My Fleet” / “Competitors”.
- Rolling trails (last N points per vessel, e.g., 30–50).
- Marker tooltip → vessel summary → link to detail page.

### `/vessel/:mmsi` — Vessel Detail
- Static data: name, IMO, callsign, type, dimensions, operator.
- Live data: timestamp, lat/lon, SOG, COG, heading, destination, nav status.
- Recent track (last 100–200 positions).

### `/embed/v1` — Embeddable Widget
- Chrome-less map + minimal info panel.
- URL params: `fleet`, `bbox`, `theme`.
- postMessage API:
  - `setFleet([...])`
  - `setBounds(...)`
  - emits `vesselClick`, `loaded`
- CSP `frame-ancestors` to whitelist host domains.

*(No `/health` route.)*

---

## 4. Data & Freshness

- **Target freshness:** ≤ 2–5 minutes delay from AIS transmission  
- **Retention:** rolling 90 days  
- **Write policy:** record only meaningful moves (distance > 50–100 m) or every 2–5 minutes  
- **Realtime updates:** Supabase Realtime subscription on `vessel_positions`

---

## 5. Architecture

| Component | Purpose | Hosting | Cost |
|------------|----------|----------|------|
| **Ingestor (VPS)** | Always-on WebSocket listener to AISStream | Tiny VPS / container | ≈ $5 / mo |
| **Database** | Static + dynamic vessel data | Supabase (Postgres + Realtime) | Free |
| **Frontend** | SPA (Svelte + MapLibre) | Cloudflare Pages | Free |
| **Map tiles** | Base map | MapTiler / Stadia (keyed free tier) | Free tier |

---

## 6. Security & Privacy

- AISStream API key stored **only on VPS** (never client-side).  
- Browser does **not** connect directly to AISStream (CORS blocked).  
- Supabase policies:  
  - Row-Level Security (RLS) for read-only public data.  
  - Optional short-lived JWT for partner/tenant embeds.  
- `/embed/v1` protected with `frame-ancestors` CSP.

---

## 7. AISStream Integration

**Endpoint:** `wss://stream.aisstream.io/v0/stream`

**Subscription Message Example**
```json
{
  "APIKey": "YOUR_KEY",
  "BoundingBoxes": [
    [[lon_min, lat_min], [lon_max, lat_max]]
  ],
  "FiltersShipMMSI": [244010000, 244020000],
  "FilterMessageTypes": ["PositionReport", "ShipStaticData"]
}

### Key Notes

- Send subscription message within **3 s** of connection or the socket will close.  
- Update an active subscription by **resending the message** (replaces previous filters).  
- Maximum **50 MMSIs** per filter list.  
- **Bounding boxes** may overlap — duplicates are automatically removed.  
- The service is **BETA**; **no SLA** is guaranteed — implement automatic reconnect and back-off logic.  
- **Browser connections are not supported**; only connect from the backend/VPS (CORS will block).  
- Keep your **read queue clear** to avoid server-side disconnects; reconnect immediately on closure.

---

## 8. AIS Data & Usage

| Field | Source | Purpose |
|:------|:-------|:--------|
| `MetaData.MMSI` | All | Primary vessel identifier |
| `MetaData.ShipName` | All | Vessel name |
| `MetaData.latitude` / `longitude` | All | Position |
| `MetaData.time_utc` | All | Absolute UTC timestamp |
| `Message.PositionReport.SOG` | PositionReport | Speed over ground (knots) |
| `Message.PositionReport.COG` | PositionReport | Course over ground (°) |
| `Message.PositionReport.TrueHeading` | PositionReport | True heading (°) |
| `Message.PositionReport.NavigationalStatus` | PositionReport | Navigational status |
| `Message.ShipStaticData.IMO` | ShipStaticData | IMO number |
| `Message.ShipStaticData.CallSign` | ShipStaticData | Callsign |
| `Message.ShipStaticData.Type` | ShipStaticData | Vessel type |
| `Message.ShipStaticData.DimensionA/B/C/D` | ShipStaticData | Used to derive length & beam |
| `Message.ShipStaticData.Destination` | ShipStaticData | Destination (may be noisy) |
| `Message.ShipStaticData.ETA` | ShipStaticData | Estimated time of arrival (may be noisy) |

---

## 9. Data Model (Supabase)

### Table `vessels`

| Column | Type | Notes |
|:--------|:------|:------|
| `mmsi` | text (PK) | From AIS MetaData |
| `imo` | text | Optional |
| `name` | text | Vessel name |
| `callsign` | text |  |
| `type` | text | AIS type |
| `length_m` | numeric | Derived from A + B |
| `beam_m` | numeric | Derived from C + D |
| `operator` | text | Manually maintained |
| `max_draught_m` | numeric | From AIS or manual |
| `destination` | text | Last reported |
| `notes` | text |  |
| `updated_at` | timestamptz | Default now() |

### Table `vessel_positions`

| Column | Type | Notes |
|:--------|:------|:------|
| `id` | serial | Primary key |
| `mmsi` | text | FK → `vessels.mmsi` |
| `ts` | timestamptz | From `MetaData.time_utc` |
| `lat` | double precision | Latitude |
| `lon` | double precision | Longitude |
| `sog_knots` | numeric | Speed over ground |
| `cog_deg` | numeric | Course over ground |
| `heading_deg` | numeric | True heading |
| `nav_status` | text | Navigation status |
| `destination` | text | Optional |
| `source` | text | e.g. "terrestrial" |
| `geom` | geometry(Point, 4326) | Derived from lat/lon |

*(Optional)* materialized view `vessel_latest` → most recent position per MMSI.

---

## 10. Ingestion (VPS)

- Connect to **AISStream** using your API key.  
- Subscribe to two bounding boxes (KR + MED) and up to 20–30 MMSIs.  
- Write to Supabase only when:  
  - Position change > ≈ 50 m, **or**  
  - ≥ 2–5 min since last write.  
- Validate input: drop invalid (0/0) or out-of-range coords, and stale timestamps.  
- Deduplicate on `(mmsi, ts)`.  
- Heartbeat timer → reconnect if idle.  
- Log connections, writes/minute, and dropped messages.

---

## 11. Edge Cases & Handling

| Issue | Strategy |
|:------|:----------|
| CORS / key exposure | Keep AISStream key on VPS only |
| AISStream BETA (no SLA) | Auto-reconnect; show “last update age” in UI |
| > 50 MMSIs | Use multiple subscriptions or bbox filter |
| Duplicate / invalid points | Validate and ignore |
| Noisy Destination / ETA | Label “reported by vessel” + timestamp |
| Idle socket | Reconnect after timeout |
| Tile provider limits | Use keyed tiles + proper attribution |
| Service crash | Use `systemd` or `pm2` auto-restart |

---

## 12. KPIs

| Metric | Target |
|:--------|:--------|
| Data freshness (P95) | ≤ 5 min |
| Coverage (updates/hour) | ≥ 95 % of fleet |
| Write economy | ≤ 300 points per day per vessel |
| UI load time | Map interactive < 3 s |
| Monthly cost | ≤ $10 total |

---

## 13. Phased Implementation

### Phase 1 — Pilot
- Deploy Supabase schema (`vessels`, `vessel_positions`).
- Run VPS ingester (KR + MED bboxes).
- Build SPA routes `/` and `/vessel/:mmsi`.
- Verify data freshness ≤ 5 min.

### Phase 2 — Embedding
- Add `/embed/v1` chrome-less map.
- Support URL params + postMessage API.
- Optional JWT + RLS for multi-tenant embeds.

### Phase 3 — Ops Polish
- Implement 90-day data retention.
- Add map attribution + stale-data warning UI.
- Optional alerting later.

---

## 14. Stack Summary

| Layer | Technology | Rationale |
|:------|:------------|:-----------|
| Ingestion | Node / Python script on VPS | Persistent WebSocket, simple ops |
| Database | Supabase (Postgres + Realtime) | Free, PostGIS, RLS |
| Frontend | Vite SPA (Svelte) | Lightweight and fast |
| Map | MapLibre GL + MapTiler / Stadia | Open source and stable |
| Hosting | Cloudflare Pages + VPS | Free + cheap combo |

---

## 15. Summary

Lean, product-ready architecture:

- VPS ingester keeps Supabase fresh 24 / 7.  
- Supabase Realtime feeds live data to the map.  
- Vite SPA UI is fast and simple.  
- `/embed/v1` route makes integration easy for partners.  
- Total cost ≈ **$5 / month**, scalable without redesign.
