-- Add last_port field to vessels table
-- Run this in Supabase SQL Editor

ALTER TABLE public.vessels
ADD COLUMN IF NOT EXISTS last_port text,
ADD COLUMN IF NOT EXISTS last_port_arrival_utc timestamptz;

COMMENT ON COLUMN public.vessels.last_port IS 'Last port visited (manually added or inferred from position data)';
COMMENT ON COLUMN public.vessels.last_port_arrival_utc IS 'Timestamp when vessel arrived at last port';

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'vessels'
  AND column_name IN ('last_port', 'last_port_arrival_utc');
