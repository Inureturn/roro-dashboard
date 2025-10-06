#!/usr/bin/env node

/**
 * Vessel Data Fetcher for RoRo Dashboard
 *
 * ⚠️ TEMPORARY SOLUTION - For stakeholder demos only
 *
 * This script fetches vessel static data from public sources to prepopulate
 * the dashboard. Once satellite view is implemented, real-time AIS data will
 * replace this static data automatically.
 *
 * Usage: node fetch-vessel-data.js
 * Output: prepopulate-fleet.sql (ready to run in Supabase)
 */

import https from 'https';
import fs from 'fs';

// Your 5 fleet vessels
const FLEET_MMSIS = [
  { mmsi: '357170000', name: 'Ah Shin' },
  { mmsi: '352808000', name: 'Hae Shin' },
  { mmsi: '352001129', name: 'O Soo Shin' },
  { mmsi: '355297000', name: 'Sang Shin' },
  { mmsi: '356005000', name: 'Young Shin' }
];

console.log('🚢 RoRo Dashboard - Fleet Data Fetcher\n');
console.log('⚠️  TEMPORARY SOLUTION: This data will be replaced by real-time AIS\n');

/**
 * Fetch vessel data from VesselFinder API (public endpoint)
 */
async function fetchVesselData(mmsi) {
  return new Promise((resolve, reject) => {
    // Using VesselFinder's public JSON endpoint
    const url = `https://www.vesselfinder.com/api/pub/vesseldetails/${mmsi}`;

    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';

      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const vessel = JSON.parse(data);
          resolve(vessel);
        } catch (err) {
          reject(new Error(`Failed to parse data for MMSI ${mmsi}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Generate SQL UPDATE statement
 */
function generateSQL(vesselData, vesselInfo) {
  const {
    imo = 'NULL',
    name = vesselInfo.name,
    callsign = 'NULL',
    type = 'Ro-Ro Cargo',
    flag = 'Unknown',
    length = 0,
    width = 0,
    draught = 0
  } = vesselData;

  const sql = `
-- ${name} (${vesselInfo.mmsi})
UPDATE public.vessels SET
  imo = ${imo ? `'${imo}'` : 'NULL'},
  name = '${name}',
  callsign = ${callsign ? `'${callsign}'` : 'NULL'},
  type = '${type}',
  flag = '${flag}',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  length_m = ${length || 'NULL'},
  beam_m = ${width || 'NULL'},
  max_draught_m = ${draught || 'NULL'},
  is_my_fleet = true
WHERE mmsi = '${vesselInfo.mmsi}';
`;

  return sql;
}

/**
 * Main execution
 */
async function main() {
  const sqlStatements = [];

  sqlStatements.push(`-- ⚠️ TEMPORARY FLEET PREPOPULATION - DO NOT USE IN PRODUCTION
--
-- This script populates static vessel data for stakeholder demos.
-- Real-time AIS data from the ingestor will override these values.
--
-- WHY THIS IS TEMPORARY:
-- 1. Static data doesn't update automatically
-- 2. Positions may be outdated
-- 3. Will be replaced once satellite view fixes marker visibility
--
-- Run this ONCE in Supabase SQL Editor, then DELETE this file.
--
-- Generated: ${new Date().toISOString()}
-- Vessels: ${FLEET_MMSIS.length}
--

-- Ensure vessels exist first (upsert pattern)
INSERT INTO public.vessels (mmsi, name, is_my_fleet, operator_group)
VALUES
  ('357170000', 'Ah Shin', true, 'Shin Group'),
  ('352808000', 'Hae Shin', true, 'Shin Group'),
  ('352001129', 'O Soo Shin', true, 'Shin Group'),
  ('355297000', 'Sang Shin', true, 'Shin Group'),
  ('356005000', 'Young Shin', true, 'Shin Group')
ON CONFLICT (mmsi) DO NOTHING;

-- Update with detailed information
`);

  for (const vessel of FLEET_MMSIS) {
    console.log(`Fetching data for ${vessel.name} (${vessel.mmsi})...`);

    try {
      const data = await fetchVesselData(vessel.mmsi);
      const sql = generateSQL(data, vessel);
      sqlStatements.push(sql);
      console.log(`✅ ${vessel.name} - Success`);

      // Rate limiting (be nice to VesselFinder)
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`❌ ${vessel.name} - ${err.message}`);

      // Fallback: Create basic entry
      sqlStatements.push(`
-- ${vessel.name} (${vessel.mmsi}) - FALLBACK DATA
UPDATE public.vessels SET
  name = '${vessel.name}',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  is_my_fleet = true
WHERE mmsi = '${vessel.mmsi}';
`);
    }
  }

  sqlStatements.push(`
-- ⚠️ REMINDER: This is temporary data!
-- Once satellite view is implemented, DELETE this file and rely on real-time AIS.
`);

  // Write SQL file
  const outputPath = 'supabase/prepopulate-fleet.sql';
  fs.writeFileSync(outputPath, sqlStatements.join('\n'));

  console.log(`\n✅ SQL generated: ${outputPath}`);
  console.log('\n📋 Next steps:');
  console.log('1. Open Supabase SQL Editor');
  console.log('2. Copy contents of prepopulate-fleet.sql');
  console.log('3. Run the SQL');
  console.log('4. Refresh dashboard - vessels should appear!');
  console.log('\n⚠️  Remember: This is temporary until satellite view is ready\n');
}

main().catch(console.error);
