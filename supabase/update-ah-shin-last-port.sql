-- Update Ah Shin with last port information from VesselFinder
-- Based on: "Last Port: Korfez, Turkey, ATA: Oct 6, 05:46 UTC"

-- First, run the migration to add the columns
-- (Make sure add-last-port.sql has been run first)

-- Update Ah Shin with last port data
UPDATE public.vessels
SET
  last_port = 'Korfez, Turkey',
  last_port_arrival_utc = '2025-10-06T05:46:00Z'
WHERE mmsi = '357170000';

-- Verify the update
SELECT
  mmsi,
  name,
  last_port,
  last_port_arrival_utc,
  destination,
  eta_utc
FROM public.vessels
WHERE mmsi = '357170000';
