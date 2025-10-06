# RoRo Fleet Dashboard

Real-time map + vessel tracker for ~30 RoRo ships (own + competitor) using AISStream + Supabase.

## Quick start
1. Clone repo
2. `pnpm install` (or `pnpm i`)
3. Create `.env.local` with Supabase keys
4. Run: `npm run dev`
5. Visit http://localhost:5173

## Architecture
- Ingestor: VPS → AISStream → Supabase
- DB: Supabase (Postgres + Realtime)
- UI: Vite SPA (Svelte/React + MapLibre)
- Map tiles: MapTiler or Stadia (free key)

See [`docs/PRD.md`](docs/PRD.md) for full product spec.
