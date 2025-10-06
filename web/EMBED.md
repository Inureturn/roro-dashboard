# Embeddable Widget Documentation

The RoRo Fleet Dashboard includes an embeddable widget mode that allows you to integrate the live vessel map into your own website or application.

## Quick Start

Add this iframe to your HTML:

```html
<iframe
  src="https://your-domain.com/#/embed/v1"
  width="800"
  height="600"
  frameborder="0"
  allow="geolocation"
  id="roro-widget">
</iframe>
```

## Features

The embed widget displays:
- ✅ Live vessel positions with real-time updates
- ✅ Rolling vessel trails (last 50 positions)
- ✅ Fleet differentiation (your fleet vs competitors)
- ✅ Stale data warnings
- ✅ Interactive map controls
- ❌ No sidebar or vessel list (map-only view)
- ❌ No header or stats

## PostMessage API

Communicate with the widget using the `postMessage` API:

### 1. Wait for Widget Ready

```javascript
const iframe = document.getElementById('roro-widget');

window.addEventListener('message', (event) => {
  if (event.data.type === 'EMBED_READY') {
    console.log('Widget ready:', event.data.payload);
    // { version: 'v1', vesselCount: 42 }
  }
});
```

### 2. Set Fleet Filter

```javascript
// Show only your fleet vessels
iframe.contentWindow.postMessage({
  type: 'EMBED_SET_FILTER',
  payload: { filter: 'my-fleet' } // 'all' | 'my-fleet' | 'competitors'
}, '*');
```

### 3. Focus on Specific Vessel

```javascript
// Zoom to a specific vessel by MMSI
iframe.contentWindow.postMessage({
  type: 'EMBED_FOCUS_VESSEL',
  payload: { mmsi: '123456789' }
}, '*');
```

### 4. Set Map Bounds

```javascript
// Set geographic bounds [minLon, minLat, maxLon, maxLat]
iframe.contentWindow.postMessage({
  type: 'EMBED_SET_BOUNDS',
  payload: { bounds: [124, 33, 132, 39] } // Korea region
}, '*');
```

### 5. Get Current State

```javascript
// Request current widget state
iframe.contentWindow.postMessage({
  type: 'EMBED_GET_STATE',
  payload: {}
}, '*');

// Listen for state response
window.addEventListener('message', (event) => {
  if (event.data.type === 'EMBED_STATE') {
    console.log('Current state:', event.data.payload);
    /*
    {
      totalVessels: 42,
      activeVessels: 38,
      filter: 'all',
      lastUpdate: 1699564800000,
      vessels: [
        {
          mmsi: '123456789',
          name: 'VESSEL NAME',
          isMyFleet: true,
          lastPosition: {
            lat: 36.5,
            lon: 128.3,
            sog: 12.5,
            cog: 180,
            ts: '2024-11-09T12:00:00Z'
          }
        },
        // ...more vessels
      ]
    }
    */
  }
});
```

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Fleet Tracker</title>
  <style>
    #roro-widget {
      width: 100%;
      height: 600px;
      border: 1px solid #ccc;
      border-radius: 8px;
    }
    .controls {
      margin: 1rem 0;
      display: flex;
      gap: 1rem;
    }
  </style>
</head>
<body>
  <h1>My Fleet Dashboard</h1>

  <div class="controls">
    <button onclick="setFilter('all')">All Vessels</button>
    <button onclick="setFilter('my-fleet')">My Fleet</button>
    <button onclick="setFilter('competitors')">Competitors</button>
    <button onclick="focusKorea()">Focus Korea</button>
  </div>

  <iframe
    src="https://your-domain.com/#/embed/v1"
    id="roro-widget">
  </iframe>

  <script>
    const iframe = document.getElementById('roro-widget');

    // Wait for widget to be ready
    window.addEventListener('message', (event) => {
      if (event.data.type === 'EMBED_READY') {
        console.log('Widget loaded:', event.data.payload.vesselCount, 'vessels');
      }

      if (event.data.type === 'EMBED_STATE') {
        console.log('Active vessels:', event.data.payload.activeVessels);
      }
    });

    function setFilter(filter) {
      iframe.contentWindow.postMessage({
        type: 'EMBED_SET_FILTER',
        payload: { filter }
      }, '*');
    }

    function focusKorea() {
      iframe.contentWindow.postMessage({
        type: 'EMBED_SET_BOUNDS',
        payload: { bounds: [124, 33, 132, 39] }
      }, '*');
    }
  </script>
</body>
</html>
```

## Security Notes

- The widget uses `postMessage` with origin `'*'` for simplicity
- For production, restrict origins in both parent and iframe
- The widget inherits RLS policies from Supabase (public read access)
- No authentication required for read-only access

## URL Routes

- `/#/` - Full dashboard (default)
- `/#/vessel/:mmsi` - Vessel detail view
- `/#/embed/v1` - Embeddable widget mode (map only)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Proprietary - RoRo Fleet Dashboard © 2024
