import 'dotenv/config';
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';

// Environment validation
const REQUIRED_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE', 'AISSTREAM_KEY', 'FLEET_MMSIS', 'BBOX_JSON'];
for (const varName of REQUIRED_VARS) {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const AISSTREAM_KEY = process.env.AISSTREAM_KEY;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const FLEET_MMSIS = process.env.FLEET_MMSIS.split(',').map(m => m.trim());
const BBOX_JSON = process.env.BBOX_JSON.split(';').map(bbox => JSON.parse(bbox));

const HEARTBEAT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MIN_DISTANCE_METERS = 100;
const MIN_TIME_SECONDS = 180;

// Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// In-memory cache: last emitted position per MMSI
const lastEmitted = new Map(); // mmsi -> { lat, lon, ts }

// WebSocket state
let ws = null;
let reconnectDelay = 1000;
let reconnectTimer = null;
let heartbeatTimer = null;
let lastMessageTime = Date.now();
let insertCountThisMinute = 0;
let insertCountTimer = null;

// Haversine distance in meters
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Validate coordinates
function isValidCoord(lat, lon) {
  return lat !== 0 && lon !== 0 &&
         lat >= -90 && lat <= 90 &&
         lon >= -180 && lon <= 180;
}

// Check if position should be emitted
function shouldEmitPosition(mmsi, lat, lon, ts) {
  const last = lastEmitted.get(mmsi);
  if (!last) return true;

  const lastTs = new Date(last.ts).getTime();
  const currentTs = new Date(ts).getTime();

  // Drop stale timestamps
  if (currentTs <= lastTs) {
    if (LOG_LEVEL === 'debug') {
      console.log(`[SKIP] Stale timestamp for ${mmsi}: ${ts} <= ${last.ts}`);
    }
    return false;
  }

  const timeDiffSec = (currentTs - lastTs) / 1000;
  const distanceMeters = haversineDistance(last.lat, last.lon, lat, lon);

  if (LOG_LEVEL === 'debug') {
    console.log(`[CHECK] ${mmsi}: ${distanceMeters.toFixed(1)}m, ${timeDiffSec.toFixed(0)}s`);
  }

  return distanceMeters > MIN_DISTANCE_METERS || timeDiffSec >= MIN_TIME_SECONDS;
}

// Upsert vessel static data
async function upsertVessel(data) {
  const mmsi = String(data.mmsi);
  const payload = {
    mmsi,
    updated_at: new Date().toISOString()
  };

  if (data.name) payload.name = data.name;
  if (data.imo) payload.imo = data.imo;
  if (data.callsign) payload.callsign = data.callsign;
  if (data.type !== undefined) payload.type = String(data.type);
  if (data.destination) payload.destination = data.destination;
  if (data.length_m !== undefined) payload.length_m = data.length_m;
  if (data.beam_m !== undefined) payload.beam_m = data.beam_m;

  const { error } = await supabase
    .from('vessels')
    .upsert(payload, { onConflict: 'mmsi' });

  if (error) {
    console.error(`[DB ERROR] upsert vessel ${mmsi}:`, error.message);
  } else {
    console.log(`[DB] Upserted vessel ${mmsi}`);
  }
}

// Ensure vessel stub exists
async function ensureVessel(mmsi, name = null) {
  const payload = { mmsi };
  if (name) payload.name = name;

  const { error } = await supabase
    .from('vessels')
    .upsert(payload, { onConflict: 'mmsi', ignoreDuplicates: true });

  if (error && LOG_LEVEL === 'debug') {
    console.error(`[DB ERROR] ensure vessel ${mmsi}:`, error.message);
  }
}

// Insert position
async function insertPosition(data) {
  const mmsi = String(data.mmsi);
  const { lat, lon, ts } = data;

  if (!isValidCoord(lat, lon)) {
    if (LOG_LEVEL === 'debug') {
      console.log(`[SKIP] Invalid coords for ${mmsi}: ${lat}, ${lon}`);
    }
    return;
  }

  if (!shouldEmitPosition(mmsi, lat, lon, ts)) {
    return;
  }

  // Ensure vessel exists
  await ensureVessel(mmsi, data.name);

  const payload = {
    mmsi,
    ts,
    lat,
    lon,
    source: 'terrestrial'
  };

  if (data.sog_knots !== undefined) payload.sog_knots = data.sog_knots;
  if (data.cog_deg !== undefined) payload.cog_deg = data.cog_deg;
  if (data.heading_deg !== undefined) payload.heading_deg = data.heading_deg;
  if (data.nav_status) payload.nav_status = data.nav_status;
  if (data.destination) payload.destination = data.destination;

  const { error } = await supabase
    .from('vessel_positions')
    .insert(payload);

  if (error) {
    console.error(`[DB ERROR] insert position ${mmsi}:`, error.message);
  } else {
    lastEmitted.set(mmsi, { lat, lon, ts });
    insertCountThisMinute++;
    if (LOG_LEVEL === 'debug') {
      console.log(`[DB] Inserted position for ${mmsi} at ${ts}`);
    }
  }
}

// Handle AIS message
async function handleMessage(msg) {
  try {
    const data = JSON.parse(msg);
    const meta = data.MetaData;
    if (!meta) return;

    const mmsi = String(meta.MMSI);
    const messageType = data.MessageType;

    lastMessageTime = Date.now();

    if (messageType === 'PositionReport') {
      const pr = data.Message?.PositionReport;
      if (!pr) return;

      await insertPosition({
        mmsi,
        lat: meta.latitude,
        lon: meta.longitude,
        ts: meta.time_utc,
        name: meta.ShipName,
        sog_knots: pr.Sog,
        cog_deg: pr.Cog,
        heading_deg: pr.TrueHeading,
        nav_status: pr.NavigationalStatus
      });
    } else if (messageType === 'ShipStaticData') {
      const ssd = data.Message?.ShipStaticData;
      if (!ssd) return;

      const length_m = (ssd.Dimension?.A ?? 0) + (ssd.Dimension?.B ?? 0);
      const beam_m = (ssd.Dimension?.C ?? 0) + (ssd.Dimension?.D ?? 0);

      await upsertVessel({
        mmsi,
        name: meta.ShipName,
        imo: ssd.ImoNumber ? String(ssd.ImoNumber) : null,
        callsign: ssd.CallSign,
        type: ssd.Type,
        destination: ssd.Destination,
        length_m: length_m > 0 ? length_m : null,
        beam_m: beam_m > 0 ? beam_m : null
      });
    }
  } catch (err) {
    console.error('[PARSE ERROR]', err.message);
  }
}

// Subscribe to AIS stream
function subscribe() {
  const subscription = {
    APIKey: AISSTREAM_KEY,
    BoundingBoxes: BBOX_JSON,
    FiltersShipMMSI: FLEET_MMSIS,
    FilterMessageTypes: ['PositionReport', 'ShipStaticData']
  };

  ws.send(JSON.stringify(subscription));
  console.log('[WS] Subscription sent', {
    bboxes: BBOX_JSON.length,
    mmsis: FLEET_MMSIS.length
  });
}

// Connect to AISStream
function connect() {
  console.log('[WS] Connecting to AISStream...');

  ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

  let subscriptionTimer = null;

  ws.on('open', () => {
    console.log('[WS] Connected');
    reconnectDelay = 1000;
    lastMessageTime = Date.now();

    // Subscribe within 3 seconds
    subscriptionTimer = setTimeout(subscribe, 100);

    // Start heartbeat monitor
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      const idleTime = Date.now() - lastMessageTime;
      if (idleTime > HEARTBEAT_TIMEOUT_MS) {
        console.warn(`[WS] No messages for ${Math.floor(idleTime / 1000)}s, reconnecting...`);
        ws.close();
      }
    }, 60000); // Check every minute
  });

  ws.on('message', (data) => {
    handleMessage(data.toString());
  });

  ws.on('error', (err) => {
    console.error('[WS ERROR]', err.message);
  });

  ws.on('close', () => {
    console.log('[WS] Disconnected');

    if (subscriptionTimer) clearTimeout(subscriptionTimer);
    if (heartbeatTimer) clearInterval(heartbeatTimer);

    // Reconnect with exponential backoff
    console.log(`[WS] Reconnecting in ${reconnectDelay}ms...`);
    reconnectTimer = setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, 10000);
      connect();
    }, reconnectDelay);
  });
}

// Graceful shutdown
function shutdown() {
  console.log('\n[SHUTDOWN] Gracefully closing...');

  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (insertCountTimer) clearInterval(insertCountTimer);

  if (ws) {
    ws.removeAllListeners();
    ws.close();
  }

  console.log('[SHUTDOWN] Goodbye');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Log insert counts every minute
insertCountTimer = setInterval(() => {
  if (insertCountThisMinute > 0) {
    console.log(`[STATS] Inserts in last minute: ${insertCountThisMinute}`);
    insertCountThisMinute = 0;
  }
}, 60000);

// Validate environment and start
console.log('[INIT] AIS Ingestor starting...');
console.log(`[INIT] Fleet MMSIs: ${FLEET_MMSIS.length}`);
console.log(`[INIT] Bounding boxes: ${BBOX_JSON.length}`);
console.log(`[INIT] Log level: ${LOG_LEVEL}`);
console.log(`[INIT] Rate limits: ${MIN_DISTANCE_METERS}m / ${MIN_TIME_SECONDS}s`);

connect();
