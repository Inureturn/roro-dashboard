# Native Markers Solution - No Warping

## The Problem
DOM markers (current approach) lag during pan/zoom because they're positioned via JavaScript AFTER the map transforms.

## The Solution
Use native MapLibre GL circle layers that render with the map's WebGL engine.

## Quick Test
I recommend testing with circles first. If they don't warp, we'll add arrows.

Replace the `updateVesselMarker` function (starting around line 477) with this simpler version:

```javascript
function updateVesselMarker(mmsi, position, trail = []) {
  const vessel = vessels.get(mmsi);
  if (!vessel) return;

  // Clean up old markers
  const markerLayerId = `marker-${mmsi}`;
  const markerSourceId = `marker-source-${mmsi}`;

  if (map.getLayer(markerLayerId)) map.removeLayer(markerLayerId);
  if (map.getSource(markerSourceId)) map.removeSource(markerSourceId);

  // Handle trails (keep existing code)
  const trailSourceId = `trail-${mmsi}`;
  const trailLayerId = `trail-line-${mmsi}`;
  if (map.getLayer(trailLayerId)) map.removeLayer(trailLayerId);
  if (map.getSource(trailSourceId)) map.removeSource(trailSourceId);

  if (trail.length > 1) {
    const coordinates = trail.map(pos => [pos.lon, pos.lat]).reverse();
    map.addSource(trailSourceId, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates } }
    });
    map.addLayer({
      id: trailLayerId,
      type: 'line',
      source: trailSourceId,
      paint: {
        'line-color': vessel.is_my_fleet ? '#4a7fc9' : '#ff9800',
        'line-width': 2,
        'line-opacity': 0.6
      }
    });
  }

  // Create NATIVE circle marker (no warping!)
  const markerColor = vessel.is_my_fleet ? '#4a7fc9' : '#ff9800';
  const speed = position.sog_knots ?? 0;
  const isMoving = speed > 0.5;

  map.addSource(markerSourceId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [position.lon, position.lat] },
      properties: { mmsi, name: vessel.name, speed }
    }
  });

  map.addLayer({
    id: markerLayerId,
    type: 'circle',
    source: markerSourceId,
    paint: {
      'circle-radius': isMoving ? 12 : 8,
      'circle-color': markerColor,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2.5
    }
  });

  // Click handler
  map.on('click', markerLayerId, () => showVesselDetails(mmsi));
  map.on('mouseenter', markerLayerId, () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', markerLayerId, () => map.getCanvas().style.cursor = '');

  markers.set(mmsi, { markerLayer: markerLayerId, trail: trailLayerId });
  vessels.set(mmsi, { ...vessel, lastPosition: position });
  updateMarkerVisibility(mmsi);
}
```

## Next Steps
1. Test if circles don't warp
2. If smooth → add arrow rotation
3. If still warping → investigate further

Would you like me to implement this?
