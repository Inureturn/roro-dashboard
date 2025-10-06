# Deploying to Vercel

This repository contains a web app in the `web/` folder built with Vite. A `vercel.json` is provided to deploy the site on Vercel using the subdirectory.

## Prerequisites
- Vercel account
- Vercel CLI installed locally (optional)
- MapTiler API key (for maps)
- Optional: Supabase URL and anon key

## One-time setup
1. Commit and push your code to GitHub.
2. Go to vercel.com → New Project → Import your GitHub repo.
3. On the project setup page:
   - Root directory: repository root
   - Build & Output Settings: It will auto-detect `vercel.json`.
   - Environment Variables:
     - `VITE_MAPTILER_KEY` = your MapTiler key
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
4. Deploy.

Vercel will run:
- Install: `cd web && pnpm install`
- Build: `cd web && pnpm run build`
- Output: `web/dist`

## Local deploy via CLI (optional)
If you prefer the CLI:

```powershell
# From repo root
npm i -g vercel
vercel link
vercel env add VITE_MAPTILER_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

## SPA routing
This app is a single-page app with a single `index.html`. Vercel static hosting serves `index.html` at the root by default, no extra rewrites are required.

## Notes
- A `.env.example` is provided under `web/`. Put your prod keys in Vercel Project Settings → Environment Variables.
- The app uses Vite’s `import.meta.env.*` so variables must be prefixed with `VITE_`.
- For larger JS bundles, consider code-splitting in the future.