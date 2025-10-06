#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

/**
 * 90-Day Data Retention Cleanup Script
 *
 * Deletes vessel_positions older than 90 days to:
 * - Keep database under 500MB Supabase limit
 * - Maintain query performance
 * - Prevent unbounded growth (2.5M rows/year → ~685K rows/90d)
 *
 * Run via cron: 0 2 * * * (daily at 2am)
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RETENTION_DAYS = 90;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function cleanup() {
  console.log(`[${new Date().toISOString()}] Starting 90-day retention cleanup...`);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  console.log(`Deleting positions older than: ${cutoffDate.toISOString()}`);

  // Count rows before deletion
  const { count: beforeCount, error: countError } = await supabase
    .from('vessel_positions')
    .select('*', { count: 'exact', head: true })
    .lt('ts', cutoffDate.toISOString());

  if (countError) {
    console.error('Error counting rows:', countError);
    process.exit(1);
  }

  console.log(`Found ${beforeCount} rows to delete`);

  if (beforeCount === 0) {
    console.log('No rows to delete. Exiting.');
    return;
  }

  // Delete in batches to avoid timeout (1000 rows per batch)
  const BATCH_SIZE = 1000;
  let deletedTotal = 0;

  while (deletedTotal < beforeCount) {
    const { error: deleteError } = await supabase
      .from('vessel_positions')
      .delete()
      .lt('ts', cutoffDate.toISOString())
      .limit(BATCH_SIZE);

    if (deleteError) {
      console.error('Error deleting batch:', deleteError);
      process.exit(1);
    }

    deletedTotal += BATCH_SIZE;
    console.log(`Deleted ${Math.min(deletedTotal, beforeCount)}/${beforeCount} rows...`);

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Count rows after deletion
  const { count: afterCount } = await supabase
    .from('vessel_positions')
    .select('*', { count: 'exact', head: true });

  console.log(`Cleanup complete. Rows remaining: ${afterCount}`);
  console.log(`[${new Date().toISOString()}] Done.`);
}

cleanup().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
