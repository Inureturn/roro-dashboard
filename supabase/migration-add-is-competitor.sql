-- Add is_competitor flag to vessels table
ALTER TABLE public.vessels
ADD COLUMN IF NOT EXISTS is_competitor boolean DEFAULT false;

-- Optional index to query competitors efficiently
CREATE INDEX IF NOT EXISTS idx_vessels_is_competitor ON public.vessels (is_competitor);
