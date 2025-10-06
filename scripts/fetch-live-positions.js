#!/usr/bin/env node

/**
 * Live Vessel Position Fetcher for RoRo Dashboard
 *
 * ⚠️ TEMPORARY SOLUTION - For stakeholder demos only
 *
 * This script fetches REAL CURRENT vessel positions from VesselFinder
 * and generates SQL to populate the dashboard with actual data.
 *
 * Key Features:
 * - Pulls current positions (lat/lon/course/speed)
 * - Records fetch timestamp for UI display
 * - Adds metadata column to track "pulled" vs "real-time" data
 *
 * Usage: node fetch-live-positions.js
 * Output: supabase/live-positions-[DATE].sql
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

const FETCH_DATE = new Date().toISOString().split('T')[0]; // 2025-10-06

console.log('🚢 RoRo Dashboard - Live Position Fetcher\n');
console.log(`📅 Fetch Date: ${FETCH_DATE}`);
console.log('⚠️  TEMPORARY: This data will age - replace with real-time AIS after satellite view\n');

/**
 * Fetch vessel position from VesselFinder using their public page
 */
async function fetchVesselPosition(mmsi) {
  return new Promise((resolve, reject) => {
    const url = `https://www.vesselfinder.com/vessels/details/${mmsi}`;

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let html = '';

      res.on('data', (chunk) => html += chunk);
      res.on('end', () => {
        try {
          // Extract JSON data embedded in page
          const dataMatch = html.match(/data-lat="([^"]+)"[^>]*data-lon="([^"]+)"/);
          const courseMatch = html.match(/Course[^:]*:\s*([0-9.]+)/i);
          const speedMatch = html.match(/Speed[^:]*:\s*([0-9.]+)/i);
          const headingMatch = html.match(/Heading[^:]*:\s*([0-9.]+)/i);
          const statusMatch = html.match(/Status[^:]*:\s*([^<]+)/i);
          const destMatch = html.match(/Destination[^:]*:\s*([^<]+)/i);
          const imoMatch = html.match(/IMO[^:]*:\s*([0-9]+)/i);
          const flagMatch = html.match(/Flag[^:]*:\s*<[^>]*>([^<]+)/i);
          const typeMatch = html.match(/Type[^:]*:\s*([^<]+)</i);

          if (!dataMatch) {
            throw new Error('Could not find position data');
          }

          const position = {
            lat: parseFloat(dataMatch[1]),
            lon: parseFloat(dataMatch[2]),
            course: courseMatch ? parseFloat(courseMatch[1]) : null,
            speed: speedMatch ? parseFloat(speedMatch[1]) : 0,
            heading: headingMatch ? parseInt(headingMatch[1]) : null,
            nav_status: statusMatch ? statusMatch[1].trim() : 'Unknown',
            destination: destMatch ? destMatch[1].trim() : null,
            imo: imoMatch ? imoMatch[1] : null,
            flag: flagMatch ? flagMatch[1].trim() : null,
            type: typeMatch ? typeMatch[1].trim() : 'Ro-Ro Cargo',
            timestamp: new Date().toISOString()
          };

          resolve(position);
        } catch (err) {
          reject(new Error(`Failed to parse position for MMSI ${mmsi}: ${err.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Generate complete SQL with vessel data + position
 */
function generateSQL(mmsi, vesselName, positionData) {
  const { lat, lon, course, speed, heading, nav_status, destination, imo, flag, type, timestamp } = positionData;

  return `
-- ${vesselName} (${mmsi})
-- Fetched: ${timestamp}
UPDATE public.vessels SET
  ${imo ? `imo = '${imo}',` : ''}
  name = '${vesselName}',
  ${type ? `type = '${type}',` : ''}
  ${flag ? `flag = '${flag}',` : ''}
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  is_my_fleet = true,
  notes = '⚠️ Position pulled from VesselFinder on ${FETCH_DATE} - NOT real-time'
WHERE mmsi = '${mmsi}';

INSERT INTO public.vessel_positions (mmsi, ts, lat, lon, sog_knots, cog_deg, heading_deg, nav_status, destination, source)
VALUES (
  '${mmsi}',
  '${timestamp}'::timestamptz,
  ${lat},
  ${lon},
  ${speed},
  ${course !== null ? course : 'NULL'},
  ${heading !== null ? heading : 'NULL'},
  '${nav_status}',
  ${destination ? `'${destination.replace(/'/g, "''")}'` : 'NULL'},
  'pulled'  -- Mark as pulled data, not real-time
)
ON CONFLICT DO NOTHING;
`;
}

/**
 * Main execution
 */
async function main() {
  const sqlStatements = [];
  const fetchTime = new Date().toISOString();

  sqlStatements.push(`-- ⚠️ LIVE POSITIONS PULLED FROM VESSELFINDER - ${FETCH_DATE}
--
-- This script contains REAL vessel positions as of ${fetchTime}
--
-- ⚠️ WARNING: This data will become outdated within hours!
-- ⚠️ PURPOSE: Demo stakeholders the dashboard interface with real-looking data
-- ⚠️ NOT REAL-TIME: Positions are snapshot from ${FETCH_DATE}
--
-- UI INDICATOR: Dashboard will show "Last updated ${FETCH_DATE}" to clarify this is pulled data
--
-- NEXT STEPS:
-- 1. Run this SQL once in Supabase
-- 2. Add UI banner: "Demo data from ${FETCH_DATE} - Real-time coming with satellite view"
-- 3. Implement satellite view (3-4 hours)
-- 4. DELETE this file - use real AIS instead
--
-- Generated: ${fetchTime}
-- Vessels: ${FLEET_MMSIS.length}
-- ════════════════════════════════════════════════════════════════════════════

-- Ensure vessels exist
INSERT INTO public.vessels (mmsi, name, is_my_fleet, operator_group)
VALUES
  ('357170000', 'Ah Shin', true, 'Shin Group'),
  ('352808000', 'Hae Shin', true, 'Shin Group'),
  ('352001129', 'O Soo Shin', true, 'Shin Group'),
  ('355297000', 'Sang Shin', true, 'Shin Group'),
  ('356005000', 'Young Shin', true, 'Shin Group')
ON CONFLICT (mmsi) DO NOTHING;

-- Update vessel details and add current positions
`);

  const results = [];

  for (const vessel of FLEET_MMSIS) {
    console.log(`Fetching live position for ${vessel.name} (${vessel.mmsi})...`);

    try {
      const position = await fetchVesselPosition(vessel.mmsi);
      const sql = generateSQL(vessel.mmsi, vessel.name, position);
      sqlStatements.push(sql);

      results.push({
        name: vessel.name,
        mmsi: vessel.mmsi,
        lat: position.lat.toFixed(4),
        lon: position.lon.toFixed(4),
        speed: position.speed,
        status: '✅ Success'
      });

      console.log(`✅ ${vessel.name} - Pos: ${position.lat.toFixed(4)}, ${position.lon.toFixed(4)} - Speed: ${position.speed} kn`);

      // Rate limiting (be nice to VesselFinder)
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(`❌ ${vessel.name} - ${err.message}`);

      results.push({
        name: vessel.name,
        mmsi: vessel.mmsi,
        status: '❌ Failed'
      });

      // Fallback: Basic entry
      sqlStatements.push(`
-- ${vessel.name} (${vessel.mmsi}) - FAILED TO FETCH
UPDATE public.vessels SET
  name = '${vessel.name}',
  operator = 'Shin Group',
  operator_group = 'Shin Group',
  is_my_fleet = true,
  notes = '⚠️ Could not fetch position on ${FETCH_DATE}'
WHERE mmsi = '${vessel.mmsi}';
`);
    }
  }

  sqlStatements.push(`
-- ════════════════════════════════════════════════════════════════════════════
-- ✅ VERIFICATION QUERY
-- ════════════════════════════════════════════════════════════════════════════
SELECT
  v.mmsi,
  v.name,
  v.notes,
  vp.lat,
  vp.lon,
  vp.sog_knots,
  vp.ts as position_time,
  vp.source
FROM vessels v
LEFT JOIN vessel_positions vp ON v.mmsi = vp.mmsi
WHERE v.is_my_fleet = true
  AND vp.source = 'pulled'
ORDER BY v.name;

-- ⚠️ CRITICAL REMINDER ⚠️
-- This is pulled data from ${FETCH_DATE} - NOT real-time tracking!
-- Add UI banner to clarify for stakeholders.
-- Delete after satellite view is implemented.
`);

  // Write SQL file
  const outputPath = `supabase/live-positions-${FETCH_DATE}.sql`;
  fs.writeFileSync(outputPath, sqlStatements.join('\n'));

  console.log('\n' + '═'.repeat(80));
  console.log('📊 FETCH SUMMARY');
  console.log('═'.repeat(80));
  console.table(results);
  console.log(`\n✅ SQL generated: ${outputPath}`);
  console.log('\n📋 Next Steps:');
  console.log('1. Open Supabase SQL Editor');
  console.log(`2. Copy contents of ${outputPath}`);
  console.log('3. Run the SQL');
  console.log('4. Add UI banner: "Demo data from ' + FETCH_DATE + ' - Real-time coming soon"');
  console.log('5. Refresh dashboard - vessels appear with current positions!');
  console.log('\n⚠️  Remember: Data will be outdated soon. Implement satellite view ASAP!\n');
}

main().catch(console.error);
