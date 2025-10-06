-- =========================================================
-- RoRo Dashboard — Supabase schema
-- Fresh install: run this once in Supabase SQL editor.
-- =========================================================

-- 1) Extensions
create extension if not exists postgis;

-- 2) Tables
-- ---------------------------------------------------------

-- VESSELS: static + curated info
create table if not exists public.vessels (
  mmsi              text primary key,                  -- required (PK)
  imo               text,
  name              text,
  callsign          text,
  type              text,                              -- e.g., 'Ro-Ro', 'Vehicles Carrier'
  length_m          numeric,                           -- derived from AIS DimensionA+DimensionB
  beam_m            numeric,                           -- derived from AIS DimensionC+DimensionD
  operator          text,                              -- manual or from ShipStaticData
  max_draught_m     numeric,
  destination       text,                              -- last reported destination (noisy)
  flag              text,                              -- country (added)
  notes             text,
  updated_at        timestamptz default now(),
  operator_group    text,                              -- e.g., 'Shin Group', 'CLdN Cobelfret'
  is_my_fleet       boolean default false              -- quick filter for UI
);

-- POSITIONS: append-only live/history track
create table if not exists public.vessel_positions (
  id             bigserial primary key,
  mmsi           text not null references public.vessels(mmsi) on delete cascade,
  ts             timestamptz not null,                -- from MetaData.time_utc
  lat            double precision not null,
  lon            double precision not null,
  sog_knots      numeric,
  cog_deg        numeric,
  heading_deg    numeric,
  nav_status     text,
  destination    text,
  source         text default 'terrestrial',
  geom           geometry(Point, 4326)
                 generated always as (ST_SetSRID(ST_Point(lon, lat), 4326)) stored
);

-- Optional: latest snapshot per MMSI (fast read for maps)
create materialized view if not exists public.vessel_latest as
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
from public.vessel_positions vp
order by vp.mmsi, vp.ts desc;

-- 3) Indexes
-- ---------------------------------------------------------
create index if not exists idx_vessel_positions_ts
  on public.vessel_positions (ts desc);

create index if not exists idx_vessel_positions_mmsi_ts
  on public.vessel_positions (mmsi, ts desc);

create index if not exists idx_vessel_positions_geom
  on public.vessel_positions using gist (geom);

-- 4) Supabase Realtime
-- ---------------------------------------------------------
-- (Views aren’t part of Realtime; we stream inserts from vessel_positions.)
alter publication supabase_realtime add table public.vessel_positions;

-- 5) Row Level Security (RLS)
-- ---------------------------------------------------------
-- Enable RLS and allow public SELECTs for PoC (tighten later).
alter table public.vessels enable row level security;
alter table public.vessel_positions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vessels' and policyname = 'Public read vessels'
  ) then
    create policy "Public read vessels"
      on public.vessels for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vessel_positions' and policyname = 'Public read positions'
  ) then
    create policy "Public read positions"
      on public.vessel_positions for select
      using (true);
  end if;
end $$;

-- 6) Functions
-- ---------------------------------------------------------
-- RPC function to refresh materialized view (callable from service role)
create or replace function public.refresh_vessel_latest()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.vessel_latest;
end;
$$;

-- 7) Notes
-- ---------------------------------------------------------
-- • Refresh the materialized view when needed:
--   select public.refresh_vessel_latest();
--   OR: refresh materialized view concurrently public.vessel_latest;
-- • For "latest per MMSI" without a view, you can create an RPC or
--   query using a DISTINCT ON or window function.
-- • Inserts should be performed by the backend (service_role key).
-- • Run cleanup.mjs daily to enforce 90-day retention
-- • Run refresh-view.mjs every 5 minutes to update materialized view
