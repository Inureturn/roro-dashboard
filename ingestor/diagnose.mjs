import 'dotenv/config';
import WebSocket from 'ws';

// Quick AISStream diagnose tool
// - Prints connection open/close with codes and reasons
// - Subscribes with current .env config
// - Logs first few messages then exits, or exits after timeout

const AISSTREAM_KEY = process.env.AISSTREAM_KEY;
const FLEET_MMSIS = (process.env.FLEET_MMSIS || '').split(',').map(m => m.trim()).filter(Boolean);
const BBOX_JSON = (process.env.BBOX_JSON || '')
  .split(';')
  .map(s => s.trim())
  .filter(Boolean)
  .map(s => JSON.parse(s));

if (!AISSTREAM_KEY) {
  console.error('Missing AISSTREAM_KEY in .env');
  process.exit(1);
}

console.log('[DIAG] Starting AISStream diagnose...');
console.log('[DIAG] MMSIs:', FLEET_MMSIS.length);
console.log('[DIAG] BBoxes:', BBOX_JSON.length);

const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

let msgCount = 0;
let keepAliveTimer = null;
let timeoutTimer = null;

function subscribe() {
  const sub = {
    APIKey: AISSTREAM_KEY,
    BoundingBoxes: BBOX_JSON.length > 0 ? BBOX_JSON : undefined,
    FiltersShipMMSI: FLEET_MMSIS.length > 0 ? FLEET_MMSIS : undefined,
    FilterMessageTypes: ['PositionReport', 'ShipStaticData']
  };
  // Remove undefined keys to avoid server-side validation issues
  Object.keys(sub).forEach(k => sub[k] === undefined && delete sub[k]);
  ws.send(JSON.stringify(sub));
  console.log('[DIAG] Subscription sent', { bboxes: BBOX_JSON.length, mmsis: FLEET_MMSIS.length });
}

ws.on('open', () => {
  console.log('[DIAG] WS open');
  subscribe();
  // keep-alive ping every 30s
  keepAliveTimer = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.ping(); } catch (e) { console.warn('[DIAG] ping error:', e.message); }
    }
  }, 30000);
  // hard timeout after 2 minutes
  timeoutTimer = setTimeout(() => {
    console.log(`[DIAG] Timeout — received ${msgCount} messages.`);
    try { ws.close(); } catch {}
    process.exit(0);
  }, 120000);
});

ws.on('message', (data) => {
  msgCount++;
  if (msgCount <= 3) {
    try {
      const obj = JSON.parse(data.toString());
      console.log('[DIAG] msg', msgCount, obj?.MessageType || typeof obj);
    } catch (e) {
      console.log('[DIAG] msg raw', msgCount, String(data).slice(0, 200));
    }
  }
});

ws.on('pong', () => {
  // no-op, just confirms server responsiveness
});

ws.on('error', (err) => {
  console.error('[DIAG] WS error:', err?.message || err);
});

ws.on('close', (code, reason) => {
  const reasonText = (() => {
    if (!reason) return '';
    try { return reason.toString(); } catch { return ''; }
  })();
  console.log('[DIAG] WS close', code !== undefined ? `code=${code}` : '', reasonText ? `reason=${reasonText}` : '');
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  if (timeoutTimer) clearTimeout(timeoutTimer);
  setTimeout(() => process.exit(0), 50);
});
