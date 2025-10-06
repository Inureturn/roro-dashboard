import './style.css';
import mapboxgl from 'mapbox-gl';
import { createClient } from '@supabase/supabase-js';

// Configuration from environment variables
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rbffmfuvqgxlthzvmtir.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiZmZtZnV2cWd4bHRoenZtdGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjU5MTAsImV4cCI6MjA3NTI0MTkxMH0.iJ4N1s6r4P9Uw1Ifzfd6PQSX5p1mH5VWeCIIRFSnL2k';

// Check for Mapbox token
if (!MAPBOX_TOKEN) {
  document.getElementById('map').innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ff9800; text-align: center; padding: 2rem;">
      <div>
        <h2>⚠️ Mapbox Token Required</h2>
        <p>Please add your Mapbox token to <code>.env</code> file:</p>
        <ol style="text-align: left; display: inline-block; margin-top: 1rem;">
          <li>Sign up at <a href="https://account.mapbox.com/" target="_blank">account.mapbox.com</a></li>
          <li>Copy your default public token</li>
          <li>Add to <code>web/.env</code>: <code>VITE_MAPBOX_TOKEN=your_token_here</code></li>
          <li>Restart: <code>npm run dev</code></li>
        </ol>
      </div>
    </div>
  `;
  throw new Error('Mapbox token not configured');
}

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize Mapbox
mapboxgl.accessToken = MAPBOX_TOKEN;
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [128, 36], // Center between Korea and Mediterranean
  zoom: 3
});

// State
let vessels = new Map(); // mmsi -> vessel data
let markers = new Map(); // mmsi -> marker
let selectedVessel = null;

// DOM Elements
const vesselListEl = document.getElementById('vessel-list');
const vesselDetailsEl = document.getElementById('vessel-details');
const detailsContentEl = document.getElementById('details-content');
const closeDetailsBtn = document.getElementById('close-details');
const vesselSearchEl = document.getElementById('vessel-search');
const totalVesselsEl = document.getElementById('total-vessels');
const activeVesselsEl = document.getElementById('active-vessels');
const lastUpdateEl = document.getElementById('last-update');

// Fetch initial vessel data
async function fetchVessels() {
  const { data, error } = await supabase
    .from('vessels')
    .select('*');

  if (error) {
    console.error('Error fetching vessels:', error);
    return;
  }

  data.forEach(vessel => {
    vessels.set(vessel.mmsi, vessel);
  });

  renderVesselList();
  updateStats();
}

// Fetch latest positions
async function fetchPositions() {
  const { data, error } = await supabase
    .from('vessel_positions')
    .select('*')
    .order('ts', { ascending: false })
    .limit(1000);

  if (error) {
    console.error('Error fetching positions:', error);
    return;
  }

  // Get latest position for each vessel
  const latestPositions = new Map();
  data.forEach(pos => {
    if (!latestPositions.has(pos.mmsi)) {
      latestPositions.set(pos.mmsi, pos);
    }
  });

  // Update markers
  latestPositions.forEach((pos, mmsi) => {
    updateVesselMarker(mmsi, pos);
  });

  updateLastUpdate();
}

// Update vessel marker on map
function updateVesselMarker(mmsi, position) {
  const vessel = vessels.get(mmsi);
  if (!vessel) return;

  // Remove old marker if exists
  if (markers.has(mmsi)) {
    markers.get(mmsi).remove();
  }

  // Create marker element
  const el = document.createElement('div');
  el.className = 'vessel-marker';
  el.style.cssText = `
    width: 20px;
    height: 20px;
    background: #4a7fc9;
    border: 2px solid #fff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;

  // Create popup
  const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
    <div class="popup-vessel-name">${vessel.name || mmsi}</div>
    <div class="popup-details">
      <div>MMSI: ${mmsi}</div>
      <div>Speed: ${position.sog_knots?.toFixed(1) || 'N/A'} knots</div>
      <div>Course: ${position.cog_deg?.toFixed(0) || 'N/A'}°</div>
      <div>${new Date(position.ts).toLocaleString()}</div>
    </div>
  `);

  // Create and add marker
  const marker = new mapboxgl.Marker(el)
    .setLngLat([position.lon, position.lat])
    .setPopup(popup)
    .addTo(map);

  el.addEventListener('click', () => {
    showVesselDetails(mmsi);
  });

  markers.set(mmsi, marker);

  // Update vessel data with latest position
  vessels.set(mmsi, { ...vessel, lastPosition: position });
}

// Render vessel list
function renderVesselList() {
  const searchTerm = vesselSearchEl.value.toLowerCase();
  const vesselArray = Array.from(vessels.values());

  const filtered = vesselArray.filter(vessel => {
    const name = (vessel.name || '').toLowerCase();
    const mmsi = vessel.mmsi.toLowerCase();
    return name.includes(searchTerm) || mmsi.includes(searchTerm);
  });

  if (filtered.length === 0) {
    vesselListEl.innerHTML = '<div class="loading">No vessels found</div>';
    return;
  }

  vesselListEl.innerHTML = filtered.map(vessel => {
    const lastPos = vessel.lastPosition;
    const isActive = lastPos && (Date.now() - new Date(lastPos.ts).getTime()) < 3600000; // Active if < 1 hour
    const statusClass = !lastPos ? 'offline' : isActive ? '' : 'stale';

    return `
      <div class="vessel-item ${selectedVessel === vessel.mmsi ? 'active' : ''}"
           data-mmsi="${vessel.mmsi}">
        <div class="vessel-name">${vessel.name || 'Unknown Vessel'}</div>
        <div class="vessel-mmsi">MMSI: ${vessel.mmsi}</div>
        <div class="vessel-status">
          <span class="status-indicator">
            <span class="status-dot ${statusClass}"></span>
            ${!lastPos ? 'No Data' : isActive ? 'Active' : 'Last seen > 1h'}
          </span>
          ${lastPos ? `<span>${lastPos.sog_knots?.toFixed(1) || '0.0'} kn</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Add click handlers
  vesselListEl.querySelectorAll('.vessel-item').forEach(item => {
    item.addEventListener('click', () => {
      const mmsi = item.dataset.mmsi;
      showVesselDetails(mmsi);
    });
  });
}

// Show vessel details panel
function showVesselDetails(mmsi) {
  selectedVessel = mmsi;
  const vessel = vessels.get(mmsi);
  if (!vessel) return;

  const pos = vessel.lastPosition;

  detailsContentEl.innerHTML = `
    <div class="detail-section">
      <h3>Vessel Information</h3>
      <div class="detail-row">
        <span class="detail-label">Name</span>
        <span class="detail-value">${vessel.name || 'Unknown'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">MMSI</span>
        <span class="detail-value">${vessel.mmsi}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">IMO</span>
        <span class="detail-value">${vessel.imo || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Call Sign</span>
        <span class="detail-value">${vessel.callsign || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Type</span>
        <span class="detail-value">${vessel.type || 'N/A'}</span>
      </div>
    </div>

    <div class="detail-section">
      <h3>Dimensions</h3>
      <div class="detail-row">
        <span class="detail-label">Length</span>
        <span class="detail-value">${vessel.length_m ? vessel.length_m + ' m' : 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Beam</span>
        <span class="detail-value">${vessel.beam_m ? vessel.beam_m + ' m' : 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Draught</span>
        <span class="detail-value">${vessel.max_draught_m ? vessel.max_draught_m + ' m' : 'N/A'}</span>
      </div>
    </div>

    ${pos ? `
      <div class="detail-section">
        <h3>Current Position</h3>
        <div class="detail-row">
          <span class="detail-label">Latitude</span>
          <span class="detail-value">${pos.lat.toFixed(5)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Longitude</span>
          <span class="detail-value">${pos.lon.toFixed(5)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Speed</span>
          <span class="detail-value">${pos.sog_knots?.toFixed(1) || 'N/A'} knots</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Course</span>
          <span class="detail-value">${pos.cog_deg?.toFixed(0) || 'N/A'}°</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Heading</span>
          <span class="detail-value">${pos.heading_deg || 'N/A'}°</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="detail-value">${pos.nav_status || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Last Update</span>
          <span class="detail-value">${new Date(pos.ts).toLocaleString()}</span>
        </div>
      </div>
    ` : '<div class="loading">No position data available</div>'}

    <div class="detail-section">
      <h3>Voyage</h3>
      <div class="detail-row">
        <span class="detail-label">Destination</span>
        <span class="detail-value">${vessel.destination || pos?.destination || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Operator</span>
        <span class="detail-value">${vessel.operator || 'N/A'}</span>
      </div>
    </div>
  `;

  vesselDetailsEl.classList.remove('hidden');
  renderVesselList(); // Update active state

  // Fly to vessel on map
  if (pos) {
    map.flyTo({
      center: [pos.lon, pos.lat],
      zoom: 10,
      duration: 2000
    });
  }
}

// Close details panel
function closeDetails() {
  selectedVessel = null;
  vesselDetailsEl.classList.add('hidden');
  renderVesselList();
}

// Update stats
function updateStats() {
  totalVesselsEl.textContent = vessels.size;

  const activeCount = Array.from(vessels.values()).filter(vessel => {
    const pos = vessel.lastPosition;
    return pos && (Date.now() - new Date(pos.ts).getTime()) < 3600000;
  }).length;

  activeVesselsEl.textContent = activeCount;
}

// Update last update time
function updateLastUpdate() {
  lastUpdateEl.textContent = new Date().toLocaleTimeString();
}

// Subscribe to realtime updates
function subscribeToUpdates() {
  // Subscribe to new positions
  supabase
    .channel('vessel_positions')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'vessel_positions' },
      (payload) => {
        console.log('New position:', payload.new);
        updateVesselMarker(payload.new.mmsi, payload.new);
        renderVesselList();
        updateStats();
        updateLastUpdate();
      }
    )
    .subscribe();

  // Subscribe to vessel updates
  supabase
    .channel('vessels')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'vessels' },
      (payload) => {
        console.log('Vessel update:', payload.new);
        vessels.set(payload.new.mmsi, { ...vessels.get(payload.new.mmsi), ...payload.new });
        renderVesselList();
      }
    )
    .subscribe();
}

// Initialize
async function init() {
  await fetchVessels();
  await fetchPositions();
  subscribeToUpdates();

  // Set up event listeners
  closeDetailsBtn.addEventListener('click', closeDetails);
  vesselSearchEl.addEventListener('input', renderVesselList);

  // Refresh positions every 30 seconds
  setInterval(fetchPositions, 30000);
}

// Wait for map to load
map.on('load', init);
