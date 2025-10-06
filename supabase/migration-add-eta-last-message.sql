-- Add ETA and last message tracking to vessels
alter table if exists public.vessels
  add column if not exists eta_utc timestamptz,
  add column if not exists last_message_utc timestamptz;

-- Optional: index for recent activity queries
create index if not exists idx_vessels_last_message_utc
  on public.vessels (last_message_utc desc);
