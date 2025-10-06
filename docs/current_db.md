
### Tables

#### `public.vessels`
| column            | type                   | notes                                  |
|-------------------|------------------------|----------------------------------------|
| mmsi              | text **PRIMARY KEY**   | required (PK)                          |
| imo               | text                   | optional                               |
| name              | text                   | vessel name                            |
| callsign          | text                   | optional                               |
| type              | text                   | e.g., "Ro-Ro", "Vehicles Carrier"      |
| length_m          | numeric                | derived from AIS dims A+B (optional)   |
| beam_m            | numeric                | derived from AIS dims C+D (optional)   |
| operator          | text                   | manual or filled from AIS static       |
| max_draught_m     | numeric                | optional                               |
| destination       | text                   | last reported (noisy)                  |
| **flag**          | text                   | country (added)                        |
| notes             | text                   |                                         |
| updated_at        | timestamptz default now() |                                        |
| **operator_group**| text                   | added for grouping (e.g., "Shin Group")|
| **is_my_fleet**   | boolean default false  | added for filtering/coloring           |

#### `public.vessel_positions`
| column        | type                     | notes                                   |
|---------------|--------------------------|-----------------------------------------|
| id            | bigserial PK             |                                         |
| mmsi          | text not null            | FK to `vessels.mmsi`                    |
| ts            | timestamptz not null     | from `MetaData.time_utc`                |
| lat           | double precision not null|                                         |
| lon           | double precision not null|                                         |
| sog_knots     | numeric                  | speed over ground                       |
| cog_deg       | numeric                  | course over ground                      |
| heading_deg   | numeric                  | true heading                            |
| nav_status    | text                     | AIS navigational status                 |
| destination   | text                     | optional                                |
| source        | text default 'terrestrial' |                                         |
| geom          | geometry(Point, 4326) generated | ST_SetSRID(ST_Point(lon,lat),4326) |

**Indexes & Realtime**
- `idx_vessel_positions_ts` on `(ts DESC)`
- `idx_vessel_positions_geom` GiST on `(geom)`
- `vessel_positions` is added to `supabase_realtime` publication.
- RLS: **read-only** select policies enabled for PoC (tighten later for embeds).

**Optional view** (may or may not exist):
- `public.vessel_latest` (materialized): most recent point per `mmsi`  
  > If used, remember to refresh or replace with an upserted `latest` table.

---

## 3) Fleet seed (confirmed)

**Mains (Shin Group, is_my_fleet = true):**
357170000 Ah Shin
352808000 Hae Shin
352001129 O Soo Shin
355297000 Sang Shin
356005000 Young Shin


**Competitors (is_my_fleet = false):**


249901000 MV Celine — CLdN Cobelfret
229077000 MV Faustine — CLdN Cobelfret
229076000 MV Seraphine — CLdN Cobelfret
219927000 MV Ark Futura — DFDS / ARK
352001162 MV Silver Queen — Sallaum Lines
355137000 MV Silver Ray — Sallaum Lines
352001920 MV Silver Sky — Sallaum Lines
249904000 MV Tonsberg — Wallenius Wilhelmsen
373817000 GMT Astro — Unclassified (can be moved to Shin Group if desired)