import './style.css';
import maplibregl from 'maplibre-gl';
import { createClient } from '@supabase/supabase-js';
import { t, getCurrentLanguage, setLanguage, SUPPORTED_LANGUAGES } from './i18n.js';

// Version for cache busting
const APP_VERSION = '2.0.1';
console.log(`[APP] RoRo Dashboard v${APP_VERSION}`);

// Configuration from environment variables
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rbffmfuvqgxlthzvmtir.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiZmZtZnV2cWd4bHRoenZtdGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjU5MTAsImV4cCI6MjA3NTI0MTkxMH0.iJ4N1s6r4P9Uw1Ifzfd6PQSX5p1mH5VWeCIIRFSnL2k';
const THEMES = { DARK: 'dark', LIGHT: 'light' };
const THEME_STORAGE_KEY = 'dashboard-theme';
const MAP_STYLES = {
  [THEMES.DARK]: 'https://api.maptiler.com/maps/dataviz-dark/style.json?key=' + MAPTILER_KEY,
  [THEMES.LIGHT]: 'https://api.maptiler.com/maps/dataviz/style.json?key=' + MAPTILER_KEY
};
const LOCALE_MAP = { en: 'en-US', ko: 'ko-KR' };

let currentLanguage = getInitialLanguage();
let currentTheme = detectInitialTheme();
let currentMapStyle = MAP_STYLES[currentTheme];
let mapLoaded = false;

if (document?.documentElement) {
  document.documentElement.lang = currentLanguage;
}

if (document?.body) {
  document.body.classList.toggle('light-theme', currentTheme === THEMES.LIGHT);
}

// Check for MapTiler API key
if (!MAPTILER_KEY) {
  document.getElementById('map').innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ff9800; text-align: center; padding: 2rem;">
      <div>
        <h2>Ã¢Å¡Â Ã¯Â¸Â MapTiler API Key Required</h2>
        <p>Please add your MapTiler API key to <code>.env</code> file:</p>
        <ol style="text-align: left; display: inline-block; margin-top: 1rem;">
          <li>Sign up at <a href="https://cloud.maptiler.com/account/keys/" target="_blank">cloud.maptiler.com</a> (FREE)</li>
          <li>Copy your API key</li>
          <li>Add to <code>web/.env</code>: <code>VITE_MAPTILER_KEY=your_key_here</code></li>
          <li>Restart: <code>npm run dev</code></li>
        </ol>
        <p style="margin-top: 1rem; color: #4caf50;">Ã¢Å“â€¦ Free tier: 100,000 map loads/month</p>
      </div>
    </div>
  `;
  throw new Error('MapTiler key not configured');
}

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize MapLibre with MapTiler tiles (PRD compliant)
const map = new maplibregl.Map({
  container: 'map',
  style: currentMapStyle,
  center: [30, 40], // Mediterranean Sea - where most vessels are
  zoom: 2.5 // Lower zoom to see more area
});

// State
let vessels = new Map(); // mmsi -> vessel data
let markers = new Map(); // mmsi -> marker
let selectedVessel = null;
let currentFilter = 'my-fleet'; // default to my fleet only
let lastDataUpdate = null; // Track last AIS data update
let currentRoute = null; // Current route for navigation

// DOM Elements
const vesselListEl = document.getElementById('vessel-list');
const vesselDetailsEl = document.getElementById('vessel-details');
const detailsContentEl = document.getElementById('details-content');
const closeDetailsBtn = document.getElementById('close-details');
const vesselSearchEl = document.getElementById('vessel-search');
const totalVesselsEl = document.getElementById('total-vessels');
const myFleetCountEl = document.getElementById('my-fleet-count');
const activeVesselsEl = document.getElementById('active-vessels');
const lastUpdateEl = document.getElementById('last-update');
const staleDataWarningEl = document.getElementById('stale-data-warning');
const systemInfoBtn = document.getElementById('system-info-btn');
const systemInfoModal = document.getElementById('system-info-modal');
const closeInfoModalBtn = document.getElementById('close-info-modal');

const themeToggleBtn = document.getElementById('theme-toggle');
const themeToggleBtnMobile = document.getElementById('theme-toggle-mobile');
const languageToggleBtn = document.getElementById('lang-toggle');
const languageToggleBtnMobile = document.getElementById('lang-toggle-mobile');
const backdropEl = document.getElementById('backdrop');
const systemInfoBtnMobile = document.getElementById('system-info-btn-mobile');


function getInitialLanguage() {
  const lang = getCurrentLanguage();
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
}

function detectInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === THEMES.DARK || stored === THEMES.LIGHT) {
      return stored;
    }
  } catch (error) {
    console.warn('[THEME] Unable to read stored theme preference', error);
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return THEMES.LIGHT;
  }
  return THEMES.DARK;
}

function getLocale() {
  return LOCALE_MAP[currentLanguage] || 'en-US';
}

function formatDateTime(value) {
  if (!value) return t('na', currentLanguage);
  try {
    return new Date(value).toLocaleString(getLocale(), { hour12: currentLanguage === 'en' });
  } catch (error) {
    console.warn('[FORMAT] Unable to format date', error);
    return new Date(value).toString();
  }
}

function formatEtaCountdown(hours) {
  if (!Number.isFinite(hours) || hours <= 0) return '';
  if (hours < 24) {
    return t('etaInHours', currentLanguage).replace('{hours}', Math.round(hours));
  }
  return t('etaInDays', currentLanguage).replace('{days}', Math.round(hours / 24));
}

// Format relative time (e.g., "2 mins ago", "3 hours ago", "5 days ago")
function formatRelativeTime(timestamp) {
  if (!timestamp) return t('na', currentLanguage);

  try {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;

    if (diffMs < 0) return t('justNow', currentLanguage) || 'just now'; // Future time

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return t('justNow', currentLanguage) || 'just now';
    if (minutes < 60) return `${minutes} ${minutes === 1 ? (t('minuteAgo', currentLanguage) || 'min ago') : (t('minutesAgo', currentLanguage) || 'mins ago')}`;
    if (hours < 24) return `${hours} ${hours === 1 ? (t('hourAgo', currentLanguage) || 'hour ago') : (t('hoursAgo', currentLanguage) || 'hours ago')}`;
    if (days < 30) return `${days} ${days === 1 ? (t('dayAgo', currentLanguage) || 'day ago') : (t('daysAgo', currentLanguage) || 'days ago')}`;
    if (months < 12) return `${months} ${months === 1 ? (t('monthAgo', currentLanguage) || 'month ago') : (t('monthsAgo', currentLanguage) || 'months ago')}`;
    return `${years} ${years === 1 ? (t('yearAgo', currentLanguage) || 'year ago') : (t('yearsAgo', currentLanguage) || 'years ago')}`;
  } catch (error) {
    console.warn('[FORMAT] Unable to format relative time', error);
    return t('na', currentLanguage);
  }
}

// Get country flag emoji from country name or code
function getCountryFlag(countryName) {
  if (!countryName) return '';

  const flagMap = {
    // Common maritime flags
    'panama': '🇵🇦',
    'liberia': '🇱🇷',
    'marshall islands': '🇲🇭',
    'malta': '🇲🇹',
    'bahamas': '🇧🇸',
    'singapore': '🇸🇬',
    'hong kong': '🇭🇰',
    'cyprus': '🇨🇾',
    'china': '🇨🇳',
    'japan': '🇯🇵',
    'south korea': '🇰🇷',
    'korea': '🇰🇷',
    'republic of korea': '🇰🇷',
    'turkey': '🇹🇷',
    'greece': '🇬🇷',
    'italy': '🇮🇹',
    'norway': '🇳🇴',
    'denmark': '🇩🇰',
    'sweden': '🇸🇪',
    'finland': '🇫🇮',
    'netherlands': '🇳🇱',
    'germany': '🇩🇪',
    'france': '🇫🇷',
    'spain': '🇪🇸',
    'uk': '🇬🇧',
    'united kingdom': '🇬🇧',
    'great britain': '🇬🇧',
    'usa': '🇺🇸',
    'united states': '🇺🇸',
    'canada': '🇨🇦',
    'australia': '🇦🇺',
    'new zealand': '🇳🇿',
    'india': '🇮🇳',
    'uae': '🇦🇪',
    'saudi arabia': '🇸🇦',
    'egypt': '🇪🇬',
    'south africa': '🇿🇦',
    'brazil': '🇧🇷',
    'argentina': '🇦🇷',
    'mexico': '🇲🇽',
    'chile': '🇨🇱',
    'portugal': '🇵🇹',
    'belgium': '🇧🇪',
    'poland': '🇵🇱',
    'russia': '🇷🇺',
    'ukraine': '🇺🇦',
    'israel': '🇮🇱',
    'jordan': '🇯🇴',
    'iran': '🇮🇷',
    'iraq': '🇮🇶',
    'vietnam': '🇻🇳',
    'thailand': '🇹🇭',
    'malaysia': '🇲🇾',
    'indonesia': '🇮🇩',
    'philippines': '🇵🇭'
  };

  const normalized = countryName.toLowerCase().trim();

  // Try exact match first
  if (flagMap[normalized]) {
    console.log(`[FLAG] Exact match for "${countryName}": ${flagMap[normalized]}`);
    return flagMap[normalized];
  }

  // Try partial match (e.g., "Korea" in "Republic of Korea")
  for (const [key, flag] of Object.entries(flagMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      console.log(`[FLAG] Partial match for "${countryName}" -> "${key}": ${flag}`);
      return flag;
    }
  }

  console.log(`[FLAG] No match found for "${countryName}"`);
  return '';
}

function applyStaticTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key, currentLanguage);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (key) el.setAttribute('placeholder', t(key, currentLanguage));
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    if (key) {
      const value = t(key, currentLanguage);
      el.setAttribute('title', value);
      el.setAttribute('aria-label', value);
    }
  });
}

function updateThemeControl() {
  if (!themeToggleBtn) return;
  const icon = currentTheme === THEMES.DARK ? '🌙' : '☀️';
  const nextThemeTitle = currentTheme === THEMES.DARK ? t('themeToLight', currentLanguage) : t('themeToDark', currentLanguage);
  themeToggleBtn.textContent = icon;
  themeToggleBtn.setAttribute('title', nextThemeTitle);
  themeToggleBtn.setAttribute('aria-label', nextThemeTitle);
}


function updateLanguageToggle() {
  if (!languageToggleBtn) return;
  const nextLang = currentLanguage === 'en' ? 'ko' : 'en';
  const titleKey = nextLang === 'ko' ? 'switchLanguageToKorean' : 'switchLanguageToEnglish';
  const title = t(titleKey, currentLanguage);
  languageToggleBtn.textContent = nextLang === 'ko' ? 'KR' : 'EN';
  languageToggleBtn.setAttribute('title', title);
  languageToggleBtn.setAttribute('aria-label', title);
}

function applyTheme(theme, { persist = true, updateMapStyle = true } = {}) {
  if (theme !== THEMES.DARK && theme !== THEMES.LIGHT) {
    theme = THEMES.DARK;
  }

  currentTheme = theme;

  if (document?.body) {
    document.body.classList.toggle('light-theme', theme === THEMES.LIGHT);
  }

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn('[THEME] Unable to persist theme preference', error);
    }
  }

  updateThemeControl();

  if (updateMapStyle && mapLoaded) {
    const targetStyle = MAP_STYLES[theme];
    if (targetStyle && targetStyle !== currentMapStyle) {
      currentMapStyle = targetStyle;
      map.setStyle(targetStyle);
    }
  }
}

function applyLanguage(lang, { persist = true, reRender = true } = {}) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    lang = 'en';
  }

  currentLanguage = lang;

  if (persist) {
    setLanguage(lang);
  }

  if (document?.documentElement) {
    document.documentElement.lang = lang;
  }

  applyStaticTranslations();
  updateLanguageToggle();
  updateThemeControl();
  document.title = `${t('title', currentLanguage)} v${APP_VERSION}`;

  if (!lastDataUpdate) {
    lastUpdateEl.textContent = t('never', currentLanguage);
  }

  if (selectedVessel) {
    showVesselDetails(selectedVessel);
  } else {
    resetDetailsPanel();
  }

  // Close all open popups to force refresh with new language
  const popups = document.getElementsByClassName('maplibregl-popup');
  Array.from(popups).forEach(popup => popup.remove());

  if (reRender) {
    renderVesselList();
    updateStats();
    updateAllMarkerVisibility();
  }
}

function formatSpeed(value) {
  if (value === undefined || value === null) return t('na', currentLanguage);
  return `${Number(value).toFixed(1)} ${t('knotsAbbr', currentLanguage)}`;
}

function resetDetailsPanel() {
  if (detailsContentEl) {
    detailsContentEl.innerHTML = `<div class="loading">${t('selectVessel', currentLanguage)}</div>`;
  }
}

function refreshMapAfterStyleChange() {
  fetchPositions();
  updateAllMarkerVisibility();
}

applyLanguage(currentLanguage, { persist: false, reRender: false });
applyTheme(currentTheme, { persist: false, updateMapStyle: false });


// Fetch initial vessel data (my fleet + competitors)


async function fetchVessels() {
  console.log('[DEBUG] Fetching vessels from Supabase...');
  const { data, error } = await supabase
    .from('vessels')
    .select('*')
    .or('is_my_fleet.eq.true,is_competitor.eq.true');

  if (error) {
    console.error('[ERROR] Error fetching vessels:', error);
    vesselListEl.innerHTML = `
      <div class="loading" style="color: #ff9800;">
        âš ï¸ ${t('errorLoading', currentLanguage)}
      </div>
    `;
    return;
  }

  console.log(`[DEBUG] Fetched ${data?.length || 0} vessels from database`);

  if (!data || data.length === 0) {
    vesselListEl.innerHTML = `
      <div class="loading">
        ${t('noVesselsYet', currentLanguage)}<br>
        <small style="color: #8090b0; margin-top: 0.5rem;">${t('checkBack', currentLanguage)}</small>
      </div>
    `;
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
  console.log('[DEBUG] Fetching latest positions...');

  // Fetch ALL position data (we'll group by mmsi to get latest + trail)
  const { data: allPositions, error } = await supabase
    .from('vessel_positions')
    .select('mmsi, ts, lat, lon, sog_knots, cog_deg, heading_deg, nav_status, destination, source')
    .order('ts', { ascending: false })
    .limit(2000); // Get enough for latest + trails

  if (error) {
    console.error('[ERROR] Error fetching positions:', error);
    return;
  }

  if (!allPositions || allPositions.length === 0) {
    console.warn('[WARN] No position data available yet');
    return;
  }

  console.log(`[DEBUG] Fetched ${allPositions.length} positions from database`);

  // Group by vessel - first position is latest, rest is trail
  const vesselData = new Map(); // mmsi -> { latest, trail }
  allPositions.forEach(pos => {
    if (!vesselData.has(pos.mmsi)) {
      vesselData.set(pos.mmsi, { latest: pos, trail: [] });
    } else {
      const data = vesselData.get(pos.mmsi);
      if (data.trail.length < 50) {
        data.trail.push(pos);
      }
    }
  });

  console.log(`[DEBUG] Found positions for ${vesselData.size} vessels`);

  // Check if any position is "pulled" data and show banner
  checkForPulledData(allPositions);

  // Update markers
  vesselData.forEach((data, mmsi) => {
    updateVesselMarker(mmsi, data.latest, data.trail);
  });

  updateLastUpdate();
}

// Check if data is pulled (not real-time) and show banner
function checkForPulledData(positions) {
  const pulledData = positions.find(p => p.source === 'pulled');

  const banner = document.getElementById('demo-data-banner');
  const dateEl = document.getElementById('demo-data-date');

  if (pulledData && banner && dateEl) {
    // Extract date from pulled position
    const fetchDate = new Date(pulledData.ts).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    dateEl.textContent = fetchDate;
    banner.classList.remove('hidden');
    console.log('[INFO] Demo data detected - showing banner');
  } else if (banner) {
    banner.classList.add('hidden');
  }

  // Check for manually fetched data in MY FLEET
  const myFleetManualData = positions.find(p => {
    const vessel = vessels.get(p.mmsi);
    return vessel && vessel.is_my_fleet && p.source && p.source.startsWith('manual_fetch');
  });

  // Store whether manual data exists (but don't show yet - wait for filter check)
  window.hasManualFleetData = !!myFleetManualData;
  updateManualDataWarningVisibility();
}

// Update manual data warning visibility based on current filter
function updateManualDataWarningVisibility() {
  const manualWarning = document.getElementById('manual-data-warning');
  if (!manualWarning) return;

  // Only show warning when viewing "My Fleet" tab AND manual data exists
  const shouldShow = window.hasManualFleetData && currentFilter === 'my-fleet';

  if (shouldShow) {
    manualWarning.classList.remove('hidden');
    console.log('[INFO] Showing manual data warning (My Fleet tab active)');
  } else {
    manualWarning.classList.add('hidden');
  }
}

// Helper function to generate popup HTML with manual data warning
function createPopupHTML(vessel, position, mmsi) {
  const isManualData = position.source && position.source.startsWith('manual_fetch');
  const manualWarning = isManualData ? `
    <div style="background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%); color: #000; padding: 8px 12px; margin-top: 8px; border-radius: 6px; border-left: 3px solid #ff9800; font-size: 0.75rem;">
      <strong style="display: block; margin-bottom: 2px;">⚠️ ${t('manualDataTitle', currentLanguage)}</strong>
      <span style="opacity: 0.9;">${t('manualDataShort', currentLanguage)}</span>
    </div>
  ` : '';

  // Format destination with flag emoji
  const rawDestination = vessel.destination || position?.destination || '';
  const destinationText = (() => {
    if (!rawDestination) return t('na', currentLanguage);
    const destParts = rawDestination.split(',').map(p => p.trim());
    const country = destParts[destParts.length - 1];
    const flag = getCountryFlag(country);
    return flag ? `${flag} ${rawDestination}` : rawDestination;
  })();

  // Add status with color coding
  const timeSinceUpdate = Date.now() - new Date(position.ts).getTime();
  const isRecent = timeSinceUpdate < 3600000; // Less than 1 hour
  const statusColor = isRecent ? '#4caf50' : '#4fc3f7';
  const statusIcon = !isRecent ? '⏳ ' : '';
  const lastSeenText = formatDateTime(position?.ts);

  return `
    <div class="popup-vessel-name">${vessel.name || mmsi}</div>
    <div class="popup-details">
      <div><strong>${t('mmsi', currentLanguage)}:</strong> ${mmsi}</div>
      <div><strong>${t('speed', currentLanguage)}:</strong> ${formatSpeed(position?.sog_knots ?? 0)}</div>
      <div><strong>${t('status', currentLanguage)}:</strong> ${position?.nav_status || t('na', currentLanguage)}</div>
      <div><strong>${t('destination', currentLanguage)}:</strong> ${destinationText}</div>
      <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
        <div style="font-size: 0.8rem; font-weight: ${isRecent ? '600' : '500'}; color: ${statusColor};">${statusIcon}${t('lastSeen', currentLanguage)} ${lastSeenText}</div>
      </div>
      <div style="margin-top: 0.6rem; display: flex; justify-content: flex-end;">
        <button class="popup-see-details" data-mmsi="${mmsi}" style="background: var(--accent-primary); color: #fff; border: 1px solid var(--accent-hover); border-radius: 6px; padding: 6px 10px; font-size: 0.8rem; cursor: pointer;">${t('seeDetails', currentLanguage) || 'See details'}</button>
      </div>
      ${manualWarning}
    </div>
  `;
}

// Update vessel marker on map

function updateVesselMarker(mmsi, position, trail = []) {
  const vessel = vessels.get(mmsi);
  if (!vessel) return;

  const markerCircleLayerId = `marker-${mmsi}-circle`;
  const markerArrowLayerId = `marker-${mmsi}-arrow`;
  const markerSourceId = `marker-source-${mmsi}`;
  const trailSourceId = `trail-${mmsi}`;
  const trailLayerId = `trail-line-${mmsi}`;

  const markerColor = vessel.is_my_fleet ? '#4a7fc9' : (vessel.is_competitor ? '#ff9800' : '#8090b0');
  const speed = position.sog_knots ?? 0;
  const isMoving = speed > 0.5;
  const direction = position.heading_deg ?? position.cog_deg ?? 0;

  const markerFeature = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [position.lon, position.lat] },
    properties: { mmsi, name: vessel.name || mmsi, speed, isMoving, direction, markerColor }
  };

  // Source: create once, then setData on updates
  if (map.getSource(markerSourceId)) {
    map.getSource(markerSourceId).setData(markerFeature);
  } else {
    map.addSource(markerSourceId, { type: 'geojson', data: markerFeature });

    // Circle layer (stationary vessels)
    if (!map.getLayer(markerCircleLayerId)) {
      map.addLayer({
        id: markerCircleLayerId,
        type: 'circle',
        source: markerSourceId,
        filter: ['==', ['get', 'isMoving'], false],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            2, 2.5,
            4, 3.0,
            6, 4.0,
            8, 5.0,
            10, 6.0,
            12, 7.0,
            14, 8.0
          ],
          'circle-color': ['get', 'markerColor'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.5
        }
      });

      // Click handler for circles: show popup only (no details panel)
      map.on('click', markerCircleLayerId, (e) => {
        if (e.features.length === 0) return;
        const clickedMmsi = e.features[0].properties.mmsi;
        const coords = e.features[0].geometry.coordinates.slice();
        const v = vessels.get(clickedMmsi);
        if (!v) return;
        const pos = v.lastPosition;
        new maplibregl.Popup()
          .setLngLat(coords)
          .setHTML(createPopupHTML(v, pos, clickedMmsi))
          .addTo(map);
      });
      map.on('mouseenter', markerCircleLayerId, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', markerCircleLayerId, () => (map.getCanvas().style.cursor = ''));
    }

    // Arrow layer (moving vessels) - create once arrow icon is loaded
    if (!map.getLayer(markerArrowLayerId) && map.hasImage('vessel-arrow')) {
      map.addLayer({
        id: markerArrowLayerId,
        type: 'symbol',
        source: markerSourceId,
        layout: {
          'icon-image': 'vessel-arrow',
          'icon-size': [
            'interpolate', ['linear'], ['zoom'],
            2, 0.20,
            4, 0.28,
            6, 0.36,
            8, 0.50,
            10, 0.66,
            12, 0.84,
            14, 1.0
          ],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-anchor': 'center',
          'icon-rotation-alignment': 'map',
          'icon-rotate': ['get', 'direction']
        },
        filter: ['==', ['get', 'isMoving'], true],
        paint: {
          'icon-opacity': 0.95,
          'icon-color': ['get', 'markerColor']
        }
      });
      map.on('mouseenter', markerArrowLayerId, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', markerArrowLayerId, () => (map.getCanvas().style.cursor = ''));
      map.on('click', markerArrowLayerId, (e) => {
        if (e.features.length === 0) return;
        const clickedMmsi = e.features[0].properties.mmsi;
        const coords = e.features[0].geometry.coordinates.slice();
        const v = vessels.get(clickedMmsi);
        if (!v) return;
        const pos = v.lastPosition;
        new maplibregl.Popup()
          .setLngLat(coords)
          .setHTML(createPopupHTML(v, pos, clickedMmsi))
          .addTo(map);
      });
    }
  }

  // Toggle visibility: circles show when stationary, arrows when moving
  if (map.getLayer(markerCircleLayerId)) {
    map.setLayoutProperty(markerCircleLayerId, 'visibility', !isMoving ? 'visible' : 'none');
  }
  if (map.getLayer(markerArrowLayerId)) {
    map.setLayoutProperty(markerArrowLayerId, 'visibility', isMoving ? 'visible' : 'none');
  } else if (isMoving && map.hasImage('vessel-arrow')) {
    // If moving and arrow layer doesn't exist yet but icon is ready, create it now
    try {
      map.addLayer({
        id: markerArrowLayerId,
        type: 'symbol',
        source: markerSourceId,
        layout: {
          'icon-image': 'vessel-arrow',
          'icon-size': [
            'interpolate', ['linear'], ['zoom'],
            2, 0.20,
            4, 0.28,
            6, 0.36,
            8, 0.50,
            10, 0.66,
            12, 0.84,
            14, 1.0
          ],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-anchor': 'center',
          'icon-rotation-alignment': 'map',
          'icon-rotate': ['get', 'direction']
        },
        filter: ['==', ['get', 'isMoving'], true],
        paint: {
          'icon-opacity': 0.95,
          'icon-color': ['get', 'markerColor']
        }
      });
      map.setLayoutProperty(markerArrowLayerId, 'visibility', 'visible');
      map.on('mouseenter', markerArrowLayerId, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', markerArrowLayerId, () => (map.getCanvas().style.cursor = ''));
      map.on('click', markerArrowLayerId, (e) => {
        if (e.features.length === 0) return;
        const clickedMmsi = e.features[0].properties.mmsi;
        const coords = e.features[0].geometry.coordinates.slice();
        const v = vessels.get(clickedMmsi);
        if (!v) return;
        const pos = v.lastPosition;
        new maplibregl.Popup()
          .setLngLat(coords)
          .setHTML(createPopupHTML(v, pos, clickedMmsi))
          .addTo(map);
      });
    } catch (e) {
      console.warn('[WARN] Could not create arrow layer:', e);
    }
  }

  // Trail: create once, then update
  if (trail.length > 1) {
    const coordinates = trail.map(pos => [pos.lon, pos.lat]).reverse();
    const trailData = { type: 'Feature', geometry: { type: 'LineString', coordinates } };
    if (map.getSource(trailSourceId)) {
      map.getSource(trailSourceId).setData(trailData);
    } else {
      map.addSource(trailSourceId, { type: 'geojson', data: trailData });
      map.addLayer({
        id: trailLayerId,
        type: 'line',
        source: trailSourceId,
        paint: {
          'line-color': markerColor,
          'line-width': 2,
          'line-opacity': 0.6
        }
      });
    }
  }

  console.log(`[NATIVE MARKER] ${isMoving ? 'Arrow' : 'Dot'} for ${vessel.name} at [${position.lat}, ${position.lon}] (${speed.toFixed(1)} kn)`);

  markers.set(mmsi, { markerLayer: markerCircleLayerId, arrowLayer: markerArrowLayerId, trail: trailLayerId });
  vessels.set(mmsi, { ...vessel, lastPosition: position });
  updateMarkerVisibility(mmsi);
}


// Update marker visibility based on current filter
function updateMarkerVisibility(mmsi) {
  const markerData = markers.get(mmsi);
  const vessel = vessels.get(mmsi);

  if (!markerData || !vessel) return;

  const shouldShow =
    currentFilter === 'tracked' ? true : // show all in tracked view
    currentFilter === 'my-fleet' ? vessel.is_my_fleet :
    currentFilter === 'competitors' ? vessel.is_competitor :
    true;

  // Hide/show circle marker layer (stationary vessels)
  if (markerData.markerLayer && map.getLayer(markerData.markerLayer)) {
    map.setLayoutProperty(markerData.markerLayer, 'visibility', shouldShow ? 'visible' : 'none');
  }

  // Hide/show arrow marker layer (moving vessels)
  if (markerData.arrowLayer && map.getLayer(markerData.arrowLayer)) {
    map.setLayoutProperty(markerData.arrowLayer, 'visibility', shouldShow ? 'visible' : 'none');
  }

  // Hide/show trail
  if (markerData.trail && map.getLayer(markerData.trail)) {
    map.setLayoutProperty(markerData.trail, 'visibility', shouldShow ? 'visible' : 'none');
  }

  console.log(`[FILTER] ${vessel.name}: ${shouldShow ? 'SHOW' : 'HIDE'} (filter: ${currentFilter}, is_my_fleet: ${vessel.is_my_fleet}, is_competitor: ${vessel.is_competitor})`);
}

// Update all marker visibility
function updateAllMarkerVisibility() {
  markers.forEach((_, mmsi) => updateMarkerVisibility(mmsi));
}

// Render vessel list

function renderVesselList() {
  const searchTerm = (vesselSearchEl.value || '').toLowerCase();
  const vesselArray = Array.from(vessels.values());

  const filtered = vesselArray.filter(vessel => {
    if (currentFilter === 'my-fleet' && !vessel.is_my_fleet) return false;
    if (currentFilter === 'competitors' && !vessel.is_competitor) return false;

    const name = (vessel.name || '').toLowerCase();
    const mmsi = vessel.mmsi.toLowerCase();
    return name.includes(searchTerm) || mmsi.includes(searchTerm);
  });

  if (filtered.length === 0) {
    vesselListEl.innerHTML = `<div class="loading">${t('noVessels', currentLanguage)}</div>`;
    return;
  }

  vesselListEl.innerHTML = filtered.map(vessel => {
    const lastPos = vessel.lastPosition;
    const isActive = !!(lastPos && (Date.now() - new Date(lastPos.ts).getTime()) < 3600000);
    const statusClass = !lastPos ? 'offline' : (isActive ? '' : 'stale');

    // Show relative time for "Last seen"
    let statusText;
    let statusIcon = '';
    if (!lastPos) {
      const neverTrackedText = 'NEVER TRACKED';
      statusText = neverTrackedText;
      statusIcon = '❓'; // Never tracked
    } else if (isActive) {
      statusText = `<span style="color: #4caf50; font-weight: 600;">${t('activeStatus', currentLanguage)}</span>`;
      statusIcon = '';
    } else {
      statusText = `${t('lastSeen', currentLanguage)} ${formatRelativeTime(lastPos.ts)}`;
      statusIcon = '⏳'; // Lost connection icon
    }

    const rawDest = vessel.destination || lastPos?.destination || '';
    const destination = rawDest.slice(0, 30).trim();
    let destDisplay = '';
    if (destination) {
      const destParts = destination.split(',').map(p => p.trim());
      const country = destParts[destParts.length - 1];
      const flag = getCountryFlag(country);
      const flagPrefix = flag ? `${flag} ` : '';
      destDisplay = `&rarr; ${flagPrefix}${destination}`;
    }

    let etaDisplay = '';
    if (vessel.eta_utc) {
      const etaTime = new Date(vessel.eta_utc).getTime();
      const now = Date.now();
      const hoursUntil = Math.round((etaTime - now) / (1000 * 60 * 60));
      if (hoursUntil > 0 && hoursUntil < 168) {
        etaDisplay = formatEtaCountdown(hoursUntil);
      }
    }

    const speedDisplay = lastPos ? formatSpeed(lastPos.sog_knots ?? 0) : '';
    const vesselName = vessel.name || t('unknownVessel', currentLanguage);
    const mmsiLabel = t('mmsi', currentLanguage);

    // Check if this vessel has manually fetched data
    const isManualData = lastPos && lastPos.source && lastPos.source.startsWith('manual_fetch');
    const manualWarningBadge = isManualData ? `<span class="manual-data-badge" title="${t('manualDataShort', currentLanguage)}">⚠</span>` : '';

    return `
      <div class="vessel-item ${selectedVessel === vessel.mmsi ? 'active' : ''}"
           data-mmsi="${vessel.mmsi}">
        <div class="vessel-name">
          ${vesselName}
          ${manualWarningBadge}
        </div>
        <div class="vessel-mmsi">${mmsiLabel}: ${vessel.mmsi}</div>
        ${destDisplay ? `<div class="vessel-destination" style="font-size: 0.75rem; color: #8090b0; margin-top: 0.25rem;">${destDisplay}</div>` : ''}
        <div class="vessel-status">
          <span class="status-indicator">
            <span class="status-dot ${statusClass}"></span>
            ${statusIcon ? `<span class="status-icon">${statusIcon}</span>` : ''}
            ${statusText}
          </span>
          ${speedDisplay ? `<span>${speedDisplay}</span>` : ''}
          ${etaDisplay ? `<span style="color: #4caf50; font-size: 0.7rem;">${etaDisplay}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  vesselListEl.querySelectorAll('.vessel-item').forEach(item => {
    item.addEventListener('click', () => {
      const mmsi = item.dataset.mmsi;
      showVesselDetails(mmsi);

      // Close sidebar on mobile after selection
      const vesselSidebar = document.getElementById('vessel-sidebar');
      if (vesselSidebar && window.innerWidth <= 768) {
        vesselSidebar.classList.remove('open');
        // Show backdrop since details opens as bottom sheet
        backdropEl?.classList.add('show');
        backdropEl?.classList.remove('hidden');
      }
    });
  });
}


// Show vessel details panel

function showVesselDetails(mmsi) {
  const wasVesselAlreadySelected = selectedVessel !== null && selectedVessel !== mmsi;
  selectedVessel = mmsi;
  const vessel = vessels.get(mmsi);
  if (!vessel) return;

  if (currentRoute !== 'vessel' || window.location.hash !== `#/vessel/${mmsi}`) {
    window.location.hash = `/vessel/${mmsi}`;
  }

  const pos = vessel.lastPosition;
  const lengthText = vessel.length_m ? `${vessel.length_m} ${t('meters', currentLanguage)}` : t('na', currentLanguage);
  const beamText = vessel.beam_m ? `${vessel.beam_m} ${t('meters', currentLanguage)}` : t('na', currentLanguage);
  const draughtText = vessel.max_draught_m ? `${vessel.max_draught_m} ${t('meters', currentLanguage)}` : t('na', currentLanguage);
  const rawDestination = vessel.destination || pos?.destination || '';
  const destinationText = (() => {
    if (!rawDestination) return t('na', currentLanguage);
    const destParts = rawDestination.split(',').map(p => p.trim());
    const country = destParts[destParts.length - 1];
    const flag = getCountryFlag(country);
    return flag ? `${flag} ${rawDestination}` : rawDestination;
  })();
  const etaText = vessel.eta_utc ? formatDateTime(vessel.eta_utc) : t('na', currentLanguage);

  const speedText = pos ? formatSpeed(pos.sog_knots ?? 0) : t('na', currentLanguage);
  const courseText = pos?.cog_deg !== undefined && pos?.cog_deg !== null
    ? `${Math.round(pos.cog_deg)}\u00B0`
    : t('na', currentLanguage);
  const headingText = pos?.heading_deg !== undefined && pos?.heading_deg !== null
    ? `${pos.heading_deg}\u00B0`
    : t('na', currentLanguage);
  const statusText = pos?.nav_status || t('na', currentLanguage);

  detailsContentEl.innerHTML = `
    <div class="detail-section">
      <h3>${t('vesselInformation', currentLanguage)}</h3>
      <div class="detail-row">
        <span class="detail-label">${t('name', currentLanguage)}</span>
        <span class="detail-value">${vessel.name || t('unknown', currentLanguage)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${t('mmsi', currentLanguage)}</span>
        <span class="detail-value">${vessel.mmsi}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${t('imo', currentLanguage)}</span>
        <span class="detail-value">${vessel.imo || t('na', currentLanguage)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${t('callSign', currentLanguage)}</span>
        <span class="detail-value">${vessel.callsign || t('na', currentLanguage)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${t('type', currentLanguage)}</span>
        <span class="detail-value">${vessel.type || t('na', currentLanguage)}</span>
      </div>
      ${vessel.flag ? `
      <div class="detail-row">
        <span class="detail-label">${t('flag', currentLanguage)}</span>
        <span class="detail-value">${getCountryFlag(vessel.flag)} ${vessel.flag}</span>
      </div>
      ` : ''}
      ${vessel.operator ? `
      <div class="detail-row">
        <span class="detail-label">${t('operator', currentLanguage)}</span>
        <span class="detail-value">${vessel.operator}</span>
      </div>
      ` : ''}
      ${vessel.operator_group ? `
      <div class="detail-row">
        <span class="detail-label">${t('operatorGroup', currentLanguage)}</span>
        <span class="detail-value">${vessel.operator_group}</span>
      </div>
      ` : ''}
    </div>

    <div class="detail-section">
      <h3>${t('dimensions', currentLanguage)}</h3>
      <div class="detail-row">
        <span class="detail-label">${t('length', currentLanguage)}</span>
        <span class="detail-value">${lengthText}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${t('beam', currentLanguage)}</span>
        <span class="detail-value">${beamText}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${t('draught', currentLanguage)}</span>
        <span class="detail-value">${draughtText}</span>
      </div>
    </div>

    ${pos ? `
      <div class="detail-section">
        <h3>${t('currentPosition', currentLanguage)}</h3>
        <div class="detail-row">
          <span class="detail-label">${t('latitude', currentLanguage)}</span>
          <span class="detail-value">${pos.lat.toFixed(5)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t('longitude', currentLanguage)}</span>
          <span class="detail-value">${pos.lon.toFixed(5)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t('speed', currentLanguage)}</span>
          <span class="detail-value">${speedText}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t('course', currentLanguage)}</span>
          <span class="detail-value">${courseText}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t('heading', currentLanguage)}</span>
          <span class="detail-value">${headingText}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t('status', currentLanguage)}</span>
          <span class="detail-value">${statusText}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t('lastUpdateLabel', currentLanguage)}</span>
          <span class="detail-value">
            ${(() => {
              const timeSinceUpdate = Date.now() - new Date(pos.ts).getTime();
              const isRecent = timeSinceUpdate < 3600000; // Less than 1 hour
              const relativeTime = formatRelativeTime(pos.ts);
              const icon = !isRecent ? '⏳ ' : '';
              const color = isRecent ? '#4caf50' : 'inherit';
              return `<span style="color: ${color}; font-weight: ${isRecent ? '600' : 'inherit'};">${icon}${relativeTime}</span>`;
            })()}
            <br><small style="color: var(--text-muted); font-size: 0.85em;">${formatDateTime(pos.ts)}</small>
          </span>
        </div>
      </div>
    ` : `
      <div class="detail-section">
        <h3>${t('currentPosition', currentLanguage)}</h3>
        <div class="detail-row">
          <span class="detail-label">${t('status', currentLanguage)}</span>
          <span class="detail-value"><span class="status-icon">❓</span> NEVER TRACKED</span>
        </div>
      </div>
    `}

    <div class="detail-section">
      <h3>${t('voyage', currentLanguage)}</h3>
      ${vessel.last_port ? `
      <div class="detail-row">
        <span class="detail-label">${t('lastPort', currentLanguage) || 'Last Port'}</span>
        <span class="detail-value">
          ${(() => {
            const portParts = vessel.last_port.split(',').map(p => p.trim());
            const country = portParts[portParts.length - 1];
            const flag = getCountryFlag(country);
            return flag ? `${flag} ${vessel.last_port}` : vessel.last_port;
          })()}
          ${vessel.last_port_arrival_utc ? `<br><small style="color: var(--text-muted); font-size: 0.85em;">${formatRelativeTime(vessel.last_port_arrival_utc)}</small>` : ''}
        </span>
      </div>
      ` : ''}
      <div class="detail-row">
        <span class="detail-label">${t('destination', currentLanguage)}</span>
        <span class="detail-value">${destinationText}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${t('eta', currentLanguage)}</span>
        <span class="detail-value">${etaText}</span>
      </div>
      
    </div>

    ${vessel.notes ? `
    <div class="detail-section">
      <h3>${t('notes', currentLanguage)}</h3>
      <div class="detail-row">
        <span class="detail-value" style="font-style: italic; color: #8090b0;">${vessel.notes}</span>
      </div>
    </div>
    ` : ''}

    ${pos && pos.source && pos.source.startsWith('manual_fetch') ? `
    <div class="detail-section" style="background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%); color: #000; padding: 16px; border-radius: 8px; border-left: 4px solid #ff9800; margin-top: 16px;">
      <div style="display: flex; gap: 12px; align-items: flex-start;">
        <div style="font-size: 1.5rem; flex-shrink: 0;">⚠️</div>
        <div>
          <h3 style="margin: 0 0 8px 0; font-size: 1rem; color: #000;">${t('manualDataTitle', currentLanguage)}</h3>
          <p style="margin: 0; font-size: 0.85rem; line-height: 1.5; color: rgba(0,0,0,0.85);">
            ${t('manualDataMessage', currentLanguage)}
          </p>
        </div>
      </div>
    </div>
    ` : ''}
  `;

  vesselDetailsEl.classList.remove('hidden');
  renderVesselList();

  if (pos) {
    if (wasVesselAlreadySelected) {
      // Switching between vessels - keep current zoom, fast pan only
      map.panTo([pos.lon, pos.lat], {
        duration: 400 // Fast smooth pan, no zoom change
      });
    } else {
      // First selection or same vessel - zoom in with slower animation
      map.flyTo({
        center: [pos.lon, pos.lat],
        zoom: Math.max(8.5, map.getZoom()), // Zoom in if needed, but don't zoom out
        duration: 1000
      });
    }
  }

  // Show backdrop on mobile when details are open
  if (window.innerWidth <= 768) {
    backdropEl?.classList.add('show');
    backdropEl?.classList.remove('hidden');
  }
}


// Close details panel

function closeDetails() {
  selectedVessel = null;
  vesselDetailsEl.classList.add('hidden');
  resetDetailsPanel();
  renderVesselList();

  // Hide backdrop when details close (mobile)
  if (window.innerWidth <= 768) {
    backdropEl?.classList.remove('show');
    setTimeout(() => backdropEl?.classList.add('hidden'), 200);
  }

  if (currentRoute === 'vessel') {
    window.location.hash = '/';
  }
}


// Update stats
function updateStats() {
  // Always show totals across ALL vessels, regardless of current filter
  const allVessels = Array.from(vessels.values());

  // Total tracked vessels (my fleet + competitors)
  const totalTracked = allVessels.filter(v => v.is_my_fleet || v.is_competitor).length;
  totalVesselsEl.textContent = totalTracked;

  // My fleet count
  const myFleetCount = allVessels.filter(v => v.is_my_fleet).length;
  myFleetCountEl.textContent = myFleetCount;

  // Active vessels (any vessel with position < 1 hour old)
  const activeCount = allVessels.filter(vessel => {
    const pos = vessel.lastPosition;
    return pos && (Date.now() - new Date(pos.ts).getTime()) < 3600000;
  }).length;
  activeVesselsEl.textContent = activeCount;
}

// Update last update time

function updateLastUpdate() {
  lastUpdateEl.textContent = new Date().toLocaleTimeString(getLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: currentLanguage === 'en'
  });
  lastDataUpdate = Date.now();
  checkStaleData();
}


// Check for stale data (> 5 minutes old)
function checkStaleData() {
  if (!lastDataUpdate) return;

  const timeSinceUpdate = Date.now() - lastDataUpdate;
  const isStale = timeSinceUpdate > 5 * 60 * 1000; // 5 minutes

  if (isStale) {
    staleDataWarningEl.classList.remove('hidden');
  } else {
    staleDataWarningEl.classList.add('hidden');
  }
}

// Routing: Parse hash and handle navigation
function parseRoute() {
  const hash = window.location.hash.slice(1) || '/'; // Remove '#' prefix
  const parts = hash.split('/').filter(p => p);

  if (parts.length === 0) {
    return { route: 'dashboard', params: {} };
  }

  if (parts[0] === 'vessel' && parts[1]) {
    return { route: 'vessel', params: { mmsi: parts[1] } };
  }

  if (parts[0] === 'embed' && parts[1] === 'v1') {
    return { route: 'embed', params: {} };
  }

  return { route: 'dashboard', params: {} };
}

function handleRoute() {
  const { route, params } = parseRoute();
  currentRoute = route;

  if (route === 'embed') {
    // Switch to embed mode
    document.body.classList.add('embed-mode');
    return;
  }

  if (route === 'vessel' && params.mmsi) {
    // Navigate to vessel detail
    showVesselDetails(params.mmsi);
  } else if (route === 'dashboard') {
    // Show dashboard (default view)
    closeDetails();
  }
}

function navigateTo(path) {
  window.location.hash = path;
}

// Embed widget postMessage API
function setupEmbedAPI() {
  if (currentRoute !== 'embed') return;

  // Listen for messages from parent window
  window.addEventListener('message', (event) => {
    const { type, payload } = event.data;

    switch (type) {
      case 'EMBED_SET_FILTER':
        // Set fleet filter (all, my-fleet, competitors)
        if (['all', 'my-fleet', 'competitors'].includes(payload.filter)) {
          currentFilter = payload.filter;
          renderVesselList();
          updateStats();
        }
        break;

      case 'EMBED_FOCUS_VESSEL':
        // Focus on specific vessel by MMSI
        if (payload.mmsi) {
          const vessel = vessels.get(payload.mmsi);
          if (vessel && vessel.lastPosition) {
            map.flyTo({
              center: [vessel.lastPosition.lon, vessel.lastPosition.lat],
              zoom: 9.5,
              duration: 2000
            });
          }
        }
        break;

      case 'EMBED_SET_BOUNDS':
        // Set map bounds
        if (payload.bounds && payload.bounds.length === 4) {
          map.fitBounds([
            [payload.bounds[0], payload.bounds[1]], // SW
            [payload.bounds[2], payload.bounds[3]]  // NE
          ]);
        }
        break;

      case 'EMBED_GET_STATE':
        // Send current state to parent
        sendEmbedState();
        break;
    }
  });

  // Send ready message to parent
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'EMBED_READY',
      payload: {
        version: 'v1',
        vesselCount: vessels.size
      }
    }, '*');
  }
}

function sendEmbedState() {
  if (currentRoute !== 'embed' || window.parent === window) return;

  const vesselArray = Array.from(vessels.values());
  const activeCount = vesselArray.filter(v => {
    const pos = v.lastPosition;
    return pos && (Date.now() - new Date(pos.ts).getTime()) < 3600000;
  }).length;

  window.parent.postMessage({
    type: 'EMBED_STATE',
    payload: {
      totalVessels: vessels.size,
      activeVessels: activeCount,
      filter: currentFilter,
      lastUpdate: lastDataUpdate,
      vessels: vesselArray.map(v => ({
        mmsi: v.mmsi,
        name: v.name,
        isMyFleet: v.is_my_fleet,
        lastPosition: v.lastPosition ? {
          lat: v.lastPosition.lat,
          lon: v.lastPosition.lon,
          sog: v.lastPosition.sog_knots,
          cog: v.lastPosition.cog_deg,
          ts: v.lastPosition.ts
        } : null
      }))
    }
  }, '*');
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

  if (closeDetailsBtn) {
    closeDetailsBtn.addEventListener('click', closeDetails);
  }
  if (vesselSearchEl) {
    vesselSearchEl.addEventListener('input', renderVesselList);
  }
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const nextTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
      applyTheme(nextTheme);
    });
  }
  if (themeToggleBtnMobile) {
    themeToggleBtnMobile.addEventListener('click', () => {
      const nextTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
      applyTheme(nextTheme);
    });
  }
  if (languageToggleBtn) {
    languageToggleBtn.addEventListener('click', () => {
      const nextLang = currentLanguage === 'en' ? 'ko' : 'en';
      applyLanguage(nextLang);
    });
  }
  if (languageToggleBtnMobile) {
    languageToggleBtnMobile.addEventListener('click', () => {
      const nextLang = currentLanguage === 'en' ? 'ko' : 'en';
      applyLanguage(nextLang);
    });
  }

  if (systemInfoBtn && systemInfoModal) {
    systemInfoBtn.addEventListener('click', () => {
      systemInfoModal.classList.remove('hidden');
    });
  }
  if (systemInfoBtnMobile && systemInfoModal) {
    systemInfoBtnMobile.addEventListener('click', () => {
      systemInfoModal.classList.remove('hidden');
    });
  }
  if (closeInfoModalBtn && systemInfoModal) {
    closeInfoModalBtn.addEventListener('click', () => {
      systemInfoModal.classList.add('hidden');
      // Make sure the map backdrop is hidden if it was shown
      backdropEl?.classList.remove('show');
      backdropEl?.classList.add('hidden');
    });
  }
  if (systemInfoModal) {
    systemInfoModal.addEventListener('click', (e) => {
      if (e.target === systemInfoModal) {
        systemInfoModal.classList.add('hidden');
        backdropEl?.classList.remove('show');
        backdropEl?.classList.add('hidden');
      }
    });
  }

  // Mobile menu toggles
  const mobileLeftToggle = document.getElementById('mobile-left-toggle');
  const mobileRightToggle = document.getElementById('mobile-right-toggle');
  const vesselSidebar = document.getElementById('vessel-sidebar');

  if (mobileLeftToggle && vesselSidebar) {
    mobileLeftToggle.addEventListener('click', () => {
      vesselSidebar.classList.toggle('open');
      if (vesselSidebar.classList.contains('open')) {
        backdropEl?.classList.add('show');
        backdropEl?.classList.remove('hidden');
      } else {
        backdropEl?.classList.remove('show');
        setTimeout(() => backdropEl?.classList.add('hidden'), 200);
      }
    });

    // Close sidebar when clicking outside
    // Close sidebar on backdrop tap
    backdropEl?.addEventListener('click', () => {
      if (vesselSidebar.classList.contains('open')) {
        vesselSidebar.classList.remove('open');
      }
      if (!vesselDetailsEl.classList.contains('hidden')) {
        vesselDetailsEl.classList.add('hidden');
      }
      backdropEl.classList.remove('show');
      setTimeout(() => backdropEl.classList.add('hidden'), 200);
    });
  }

  if (mobileRightToggle && vesselDetailsEl) {
    mobileRightToggle.addEventListener('click', () => {
      // Toggle System Info modal instead of details when on mobile
      if (systemInfoModal) {
        systemInfoModal.classList.remove('hidden');
        return;
      }
      // Fallback: open details if modal isn't present
      if (selectedVessel) showVesselDetails(selectedVessel);
      backdropEl?.classList.add('show');
      backdropEl?.classList.remove('hidden');
    });
  }

  const tabs = document.querySelectorAll('.filter-tab');
  if (tabs && tabs.length) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        renderVesselList();
        updateStats();
        updateAllMarkerVisibility();
        updateManualDataWarningVisibility();
      });
    });
    tabs.forEach(t => {
      if (t.dataset.filter === currentFilter) t.classList.add('active');
      else t.classList.remove('active');
    });
  }

  setInterval(fetchPositions, 30000);
  setInterval(checkStaleData, 30000);

  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  setupEmbedAPI();

  // Delegate click from popup "See details" button
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.popup-see-details');
    if (!btn) return;
    const mmsi = btn.getAttribute('data-mmsi');
    if (!mmsi) return;
    showVesselDetails(mmsi);
    // On mobile, ensure backdrop is visible when opening the bottom sheet
    if (window.innerWidth <= 768) {
      backdropEl?.classList.add('show');
      backdropEl?.classList.remove('hidden');
    }
  });
}



// Load arrow icon as SDF for tinting and rotation
function ensureArrowImage() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (map.hasImage && map.hasImage('vessel-arrow')) {
    console.log('[DEBUG] Arrow image already loaded');
    return Promise.resolve(true);
  }
  console.log('[DEBUG] Loading arrow image...');
  return new Promise((resolve) => {
    try {
      const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><polygon points="32,8 52,48 12,48" fill="white"/></svg>`;
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      const img = new Image(64, 64);
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          if (!map.hasImage('vessel-arrow')) {
            map.addImage('vessel-arrow', img, { sdf: true });
            console.log('[DEBUG] Arrow image added successfully');
          }
          resolve(true);
        } catch (e) {
          console.error('[ERROR] Failed to add arrow image:', e);
          resolve(false);
        }
      };
      img.onerror = (e) => {
        console.error('[ERROR] Failed to load arrow image:', e);
        resolve(false);
      };
      img.src = dataUrl;
    } catch (e) {
      console.error('[ERROR] Exception in ensureArrowImage:', e);
      resolve(false);
    }
  });
}

// Wait for map to load

map.on('load', async () => {
  if (!mapLoaded) {
    mapLoaded = true;
    // Load arrow icon before initializing markers
    await ensureArrowImage();
    // Handle missing images gracefully
    map.on('styleimagemissing', (e) => {
      if (e.id === 'vessel-arrow' && !map.hasImage('vessel-arrow')) {
        ensureArrowImage();
      }
    });
    init();
  } else {
    refreshMapAfterStyleChange();
    // Re-add arrow after style change if missing
    if (!map.hasImage('vessel-arrow')) {
      await ensureArrowImage();
    }
  }
});

















