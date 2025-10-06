# RoRo Fleet Dashboard - Web UI

Real-time vessel tracking dashboard with live AIS position updates.

## Features

- 🗺️ **Interactive Map** - MapLibre GL with FREE MapTiler tiles
- 📍 **Real-time Updates** - Live position updates via Supabase Realtime
- 🚢 **Vessel Details** - Click any vessel to view complete information
- 🔍 **Search** - Filter vessels by name or MMSI
- 📊 **Fleet Overview** - Quick stats on total/active vessels
- 🎨 **Modern UI** - Dark theme, responsive design
- 💰 **Cost**: FREE (100k map loads/month on MapTiler free tier)

## Quick Start

### 1. Get a MapTiler API Key (FREE)

1. Sign up at https://cloud.maptiler.com/ (FREE account)
2. Go to **API Keys** tab
3. Copy your API key

### 2. Configure Environment

Create a `.env` file in the `web/` directory:

```bash
cd web
cp .env.example .env
```

Edit `.env` and add your MapTiler API key:

```bash
VITE_MAPTILER_KEY=your_api_key_here
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser!

> **Note**: If you see a warning about missing MapTiler key, make sure you've added `VITE_MAPTILER_KEY` to your `.env` file and restarted the dev server.

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Deployment

### Option 1: Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Option 2: Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
```

### Option 3: GitHub Pages

```bash
npm run build
# Push dist/ to gh-pages branch
```

## Project Structure

```
web/
├── index.html       # Main HTML
├── main.js          # Application logic
├── style.css        # Styles
├── package.json     # Dependencies
└── README.md        # This file
```

## How It Works

1. **Initial Load**
   - Fetches all vessels from `vessels` table
   - Fetches latest positions from `vessel_positions` table
   - Renders vessel list and map markers

2. **Real-time Updates**
   - Subscribes to Supabase Realtime channels
   - Listens for new position inserts
   - Updates markers and vessel list automatically

3. **User Interaction**
   - Click vessel in list → shows details panel
   - Click marker on map → shows popup + details
   - Search vessels by name or MMSI
   - Auto-refreshes positions every 30 seconds

## Customization

### Change Map Style

In `main.js`:

```javascript
style: 'mapbox://styles/mapbox/satellite-v9', // Satellite view
style: 'mapbox://styles/mapbox/streets-v12',  // Streets view
style: 'mapbox://styles/mapbox/dark-v11',     // Dark (default)
```

### Adjust Refresh Interval

In `main.js`:

```javascript
setInterval(fetchPositions, 30000); // 30 seconds (default)
setInterval(fetchPositions, 10000); // 10 seconds
```

### Modify Active Threshold

In `main.js`:

```javascript
const isActive = lastPos && (Date.now() - new Date(lastPos.ts).getTime()) < 3600000; // 1 hour
```

Change `3600000` (1 hour in milliseconds) to your preference.

## Troubleshooting

### Map not loading

- Check Mapbox token is correct
- Check browser console for errors
- Ensure internet connection is active

### No vessels showing

- Check Supabase credentials in `main.js`
- Verify database has data (check Table Editor)
- Check browser console for errors

### Realtime not working

- Verify `vessel_positions` is in realtime publication
- Check Supabase dashboard → Database → Publications
- Ensure RLS policies allow SELECT

## Tech Stack

- **Vite** - Build tool
- **Mapbox GL JS** - Interactive maps
- **Supabase JS** - Database & realtime
- **Vanilla JavaScript** - No framework overhead

## License

MIT
