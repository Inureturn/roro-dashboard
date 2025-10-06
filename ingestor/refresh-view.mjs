#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

/**
 * Refresh Materialized View Script
 *
 * Refreshes the vessel_latest materialized view for fast map queries.
 * The view caches the latest position per vessel.
 *
 * Run via cron: */5 * * * * (every 5 minutes)
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function refreshView() {
  console.log(`[${new Date().toISOString()}] Refreshing vessel_latest materialized view...`);

  const { error } = await supabase.rpc('refresh_vessel_latest');

  if (error) {
    console.error('Error refreshing view:', error);
    process.exit(1);
  }

  console.log(`[${new Date().toISOString()}] View refreshed successfully.`);
}

refreshView().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
