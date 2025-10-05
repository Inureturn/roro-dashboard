create extension if not exists postgis;

create table if not exists public.vessels (
  mmsi text primary key,
  imo text,
  name text,
  callsign text,
  type text,
  length_m numeric,
  beam_m numeric,
  operator text,
  max_draught_m numeric,
  destination text,
  notes text,
  updated_at timestamptz default now()
);

create table if not exists public.vessel_positions (
  id bigserial primary key,
  mmsi text not null references public.vessels(mmsi),
  ts timestamptz not null,
  lat double precision not null,
  lon double precision not null,
  sog_knots numeric,
  cog_deg numeric,
  heading_deg numeric,
  nav_status text,
  destination text,
  source text default 'terrestrial',
  geom geometry(Point, 4326) generated always as (ST_SetSRID(ST_Point(lon, lat), 4326)) stored
);

create materialized view if not exists public.vessel_latest as
select distinct on (mmsi)
  mmsi, ts, lat, lon, sog_knots, cog_deg, heading_deg, destination, nav_status, geom
from public.vessel_positions
order by mmsi, ts desc;

create index if not exists idx_vessel_positions_ts on public.vessel_positions(ts desc);
create index if not exists idx_vessel_positions_geom on public.vessel_positions using gist (geom);

alter publication supabase_realtime add table public.vessel_positions;
