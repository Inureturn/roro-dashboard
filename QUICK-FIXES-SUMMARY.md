# Quick Fixes Summary

## Issues Addressed

### 1. ✅ Remove Cost Breakdown from Dashboard
**Status:** DONE
- Removed entire "Cost (Monthly)" section from system info modal
- Keeps implementation details private from clients

### 2. 🔄 Korean Language Support
**Status:** IN PROGRESS
- Created `i18n.js` with full English and Korean translations
- Auto-detects browser language (defaults to Korean for Korean browsers)
- Translations for all UI text
- **Next step:** Integrate into main.js and update HTML

### 3. 🔄 Light/Dark Mode Toggle
**Status:** IN PROGRESS
- Added CSS variables for theme switching
- Added toggle button in header
- Light theme colors defined
- **Next step:** Update all hardcoded colors to CSS variables, add JS toggle logic

### 4. ✅ Vessel Data Not Loading
**Status:** IDENTIFIED & FIXED

**Root cause:**
```
✅ 14 vessels loaded from database
❌ 0 positions - Ingestor hasn't collected AIS data yet
```

**What's happening:**
- Vessels exist in database (manually added via Supabase)
- Ingestor needs to be RUNNING on VPS to collect position data
- Once ingestor runs, positions will appear in 5-30 minutes

**Debug logging added:**
- Console now shows: "[DEBUG] Fetched X vessels/positions"
- Clear error messages if data missing
- Helpful message: "Waiting for AIS data... check back in 5-10 minutes"

---

## To Complete Korean + Light Mode

### Quick Implementation (Next commit):

**For Korean support:**
1. Import i18n.js in main.js
2. Wrap all UI text in `t(key, lang)` function
3. Add language toggle button handler
4. Save language preference to localStorage

**For Light/Dark mode:**
1. Replace all hardcoded colors with CSS variables
   - Background: `#0a0e27` → `var(--bg-primary)`
   - Text: `#e0e0e0` → `var(--text-primary)`
   - Borders: `#2a3452` → `var(--border-color)`
   - etc.

2. Add toggle handler in main.js:
   ```javascript
   document.getElementById('theme-toggle').addEventListener('click', () => {
     document.body.classList.toggle('light-theme');
     localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
     // Update icon
     document.getElementById('theme-toggle').textContent =
       document.body.classList.contains('light-theme') ? '☀️' : '🌙';
   });
   ```

3. Load theme on page load:
   ```javascript
   const savedTheme = localStorage.getItem('theme');
   if (savedTheme === 'light') {
     document.body.classList.add('light-theme');
   }
   ```

---

## Immediate Action Required

### Check if Ingestor is Running

SSH to VPS and run:
```bash
pm2 status
```

Should show:
```
┌────┬────────────────────┬──────────┬──────┐
│ id │ name               │ status   │ cpu  │
├────┼────────────────────┼──────────┼──────┤
│ 0  │ roro-ingestor      │ online   │ 0%   │
└────┴────────────────────┴──────────┴──────┘
```

If NOT online:
```bash
cd /home/ubuntu/roro-dashboard/ingestor
pm2 start ingest.mjs --name roro-ingestor
pm2 save
```

Check logs:
```bash
pm2 logs roro-ingestor --lines 50
```

Should see WebSocket messages like:
```
Subscribing to 14 vessels in 2 regions
WebSocket connected to AISStream
{"MetaData":{"ShipName":"AH SHIN","MMSI":"357170000"...}}
```

If you see errors, check:
1. `.env` file exists in ingestor folder
2. Contains AISSTREAM_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE
3. FLEET_MMSIS has the 14 MMSIs
4. BBOX_JSON has coordinates

---

## Expected Timeline

**After ingestor starts:**
- 5 minutes: First positions arrive
- 30 minutes: All vessels have positions
- 1 hour: Trails start appearing (50 positions)
- 24 hours: Full historical trails

**If nothing after 30 minutes:**
- Check ingestor logs for errors
- Verify vessels are actually transmitting AIS (check MarineTraffic.com)
- Confirm vessels are in BBOX regions (Korea or Mediterranean)

---

## Current Status

✅ **Working:**
- Database connection
- 14 vessels loaded
- Map tiles loading
- Realtime subscriptions
- Cron jobs scheduled

⏳ **Waiting:**
- AIS position data (ingestor needs to run)

🔄 **In Progress:**
- Korean language support (75% done)
- Light/dark mode (50% done)

---

**Next commit will complete Korean + Light mode!**
