# Testing Native Markers - Simple Circle Approach

Quick test to see if native GeoJSON layers eliminate warping.

## Changes Made:
- Convert from DOM markers to native circle layers
- Circles will move smoothly with map (no warping)
- If this works, we'll add arrow symbols later

## To test:
1. Refresh page
2. Pan/zoom map
3. Check if circles move smoothly (no lag/snap)

If smooth → proceed with arrow implementation
If still warping → deeper investigation needed
