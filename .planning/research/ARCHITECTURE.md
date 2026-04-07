# Architecture Research: v1.5 Multi-Route Support

**Domain:** Multi-route GPX processing, route-keyed JSON data, and client-side route switching for an existing Astro 6 + Leaflet + Chart.js showcase site
**Researched:** 2026-04-06
**Confidence:** HIGH -- based on direct analysis of all 12 pipeline scripts, both frontend components (RouteMap.astro, ElevationProfile.astro), all 3 GPX files, existing JSON output schemas, and Astro content collection configuration

---

## Executive Summary

The v1.5 milestone adds 100k (~62 miles) and 50k (~31 miles) route variants alongside the existing 100-mile route. All three routes start and end in Munising (within ~500 ft of each other) but take different paths through the Hiawatha National Forest. The 100-mile route passes through all 7 gravel sectors; the 100k and 50k routes share a shorter loop that passes through only 4 sectors (520, NF2266, Doe Lake, Rapid River Truck Trail), skipping the interior sectors (Bass Lake Rd, NF2217-2218, ND2225).

The central architectural decision is **separate JSON files per route** (not a combined file with route keys). This recommendation is driven by four factors:

1. **Index coupling** -- Sector annotations use `startIdx`/`endIdx` referencing the route's point array. These indices are completely different per route (Doe Lake is at index ~379 on the 100-mile route but at a completely different index on the 100k). Combining routes into one file would require namespaced indices that add complexity for zero benefit.
2. **Fetch efficiency** -- Only the active route's data is needed at any time. Separate files allow fetching only the selected route's data (~46KB for 100mi, likely ~28KB for 100k, ~14KB for 50k). A combined file would always transfer all three.
3. **Pipeline simplicity** -- The existing pipeline scripts produce flat files from a single GPX. Running the pipeline in a loop over 3 routes, writing to `public/data/{routeId}/`, requires minimal script changes compared to merging outputs into combined structures.
4. **Component simplicity** -- The existing `fetch('/data/route-data.json')` pattern changes to `fetch(\`/data/${routeId}/route-data.json\`)`. No JSON key navigation, no data reshaping at runtime.

The pipeline runs 3 times (once per route) writing to route-specific subdirectories. Frontend components add a route selector that re-fetches data and rebuilds visualizations. The CustomEvent bus gains route context. Shared content (sector editorial, photos) remains in the existing flat files.

---

## System Overview

### Current Data Flow (Single Route)

```
Munising_Hiawatha_s_Revenge.gpx
         |
    pipeline.js (12 steps, sequential)
         |
    public/data/
    +-- route-data.json        (456 points + meta)
    +-- annotations.json       (7 sectors + 2 restocks, with startIdx/endIdx)
    +-- sector-details.json    (7 sectors with editorial content)
    +-- sector-elevations.json (7 sectors with elevation point arrays)
    +-- surface-points.json    (456 entries, mile -> surface type)
    +-- photos.json            (shared, not route-specific)
    +-- historical-photos.json (shared)
    +-- photos-manifest.json   (shared)
```

### Proposed Data Flow (Multi-Route)

```
GPX files (3):
  Munising_Hiawatha_s_Revenge.gpx  (100mi, 1927 pts)
  Hiawatha_s_Revenge_100k.gpx       (100k,  2780 pts)
  Hiawatha_s_Revenge_50K_.gpx       (50k,    954 pts)
         |
    pipeline.js (runs route-specific steps for each of 3 routes)
         |
    public/data/
    +-- routes.json                  (NEW: route manifest)
    +-- 100mi/
    |   +-- route-data.json          (456 points + meta, SAME as current)
    |   +-- annotations.json         (7 sectors + 2 restocks)
    |   +-- sector-elevations.json   (7 sectors)
    |   +-- surface-points.json      (456 entries)
    +-- 100k/
    |   +-- route-data.json          (~300 points + meta)
    |   +-- annotations.json         (4 sectors, route-specific mile/idx)
    |   +-- sector-elevations.json   (4 sectors)
    |   +-- surface-points.json      (~300 entries)
    +-- 50k/
    |   +-- route-data.json          (~200 points + meta)
    |   +-- annotations.json         (4 sectors, route-specific mile/idx)
    |   +-- sector-elevations.json   (4 sectors)
    |   +-- surface-points.json      (~200 entries)
    +-- sector-details.json          (SHARED: 7 sectors, editorial content)
    +-- photos.json                  (SHARED: not route-specific)
    +-- historical-photos.json       (SHARED)
    +-- photos-manifest.json         (SHARED)
```

### Route Manifest (routes.json)

```json
{
  "defaultRoute": "100mi",
  "routes": [
    {
      "id": "100mi",
      "name": "100 Mile",
      "shortName": "100mi",
      "gpxFile": "Munising_Hiawatha_s_Revenge.gpx",
      "color": "#c8973e",
      "sectors": ["sector-520", "sector-nf2266", "sector-bass-lake", "sector-nf2217", "sector-nd2225", "sector-doe-lake", "sector-rapid-river"]
    },
    {
      "id": "100k",
      "name": "100k",
      "shortName": "100k",
      "gpxFile": "Hiawatha_s_Revenge_100k.gpx",
      "color": "#5b9279",
      "sectors": ["sector-520", "sector-nf2266", "sector-doe-lake", "sector-rapid-river"]
    },
    {
      "id": "50k",
      "name": "50k",
      "shortName": "50k",
      "gpxFile": "Hiawatha_s_Revenge_50K_.gpx",
      "color": "#4a90c4",
      "sectors": ["sector-520", "sector-nf2266", "sector-doe-lake", "sector-rapid-river"]
    }
  ]
}
```

---

## Data Architecture Decision: Separate Files Per Route

### Why Not a Combined File?

The strongest argument against a combined file is the **index coupling problem**.

Currently, `annotations.json` contains sector entries like:
```json
{
  "id": "sector-doe-lake",
  "startIdx": 379,
  "endIdx": 389,
  "startMile": 84.8,
  "endMile": 87.9
}
```

These `startIdx`/`endIdx` values index into `route-data.json`'s `points` array. RouteMap.astro uses them directly:
```javascript
const sectorPts = latlngs.slice(sector.startIdx, sector.endIdx + 1);
```

On the 100k route, Doe Lake appears at a completely different mileage (~44.3 miles) and a completely different array index. A combined file would need either:
- **Namespaced indices** like `startIdx_100mi`, `startIdx_100k`, `startIdx_50k` -- ugly and fragile
- **Nested route objects** like `routes.100mi.annotations[...]` -- requires restructuring all consumer code

Separate files per route avoid this entirely. Each route's `annotations.json` contains indices that match its own `route-data.json` point array.

### What Stays Shared

Two files are NOT route-specific:

1. **`sector-details.json`** -- Editorial content (descriptions, surface labels, Strava links) is the same regardless of which route you're viewing. The sector names, descriptions, and star ratings don't change. This file stays at `public/data/sector-details.json`.

2. **`photos.json`** -- Photos are geotagged by mile on the 100-mile route. For shorter routes, photo display could be filtered by proximity, but the photo data itself doesn't change. Stays shared.

### File Size Impact

Current single-route totals (~97KB across 5 files). Per-route estimates:

| File | 100mi | 100k (est.) | 50k (est.) |
|------|-------|-------------|------------|
| route-data.json | 46KB | ~28KB | ~14KB |
| annotations.json | 2.7KB | ~1.5KB | ~1.5KB |
| sector-elevations.json | 10.5KB | ~6KB | ~6KB |
| surface-points.json | 23.7KB | ~14KB | ~7KB |
| **Total per route** | **83KB** | **~50KB** | **~29KB** |

Initial page load fetches only the default route (100mi, 83KB -- same as today). Route switching fetches ~29-50KB per switch. This is excellent for a static site.

---

## Pipeline Changes

### Route Configuration

A new configuration file defines the three routes and their sector membership:

**`scripts/route-config.js`** (NEW)

```javascript
export const ROUTES = [
  {
    id: '100mi',
    name: '100 Mile',
    gpxFile: 'Munising_Hiawatha_s_Revenge.gpx',
    rwgpsJson: 'hiawathasRevenge.json',    // RidewithGPS surface data
    sectors: [
      'sector-520', 'sector-nf2266', 'sector-bass-lake',
      'sector-nf2217', 'sector-nd2225', 'sector-doe-lake',
      'sector-rapid-river'
    ],
    restocks: ['restock-camp7', 'restock-midway'],
    elevationTargetRange: [2123, 2411],  // ft, for noise filter calibration
  },
  {
    id: '100k',
    name: '100k',
    gpxFile: 'Hiawatha_s_Revenge_100k.gpx',
    rwgpsJson: null,  // No RidewithGPS export (Strava GPX)
    sectors: ['sector-520', 'sector-nf2266', 'sector-doe-lake', 'sector-rapid-river'],
    restocks: [],  // No restock points on 100k route
    elevationTargetRange: null,  // No verified target
  },
  {
    id: '50k',
    name: '50k',
    gpxFile: 'Hiawatha_s_Revenge_50K_.gpx',
    rwgpsJson: null,  // RidewithGPS GPX but no JSON export with S-field
    sectors: ['sector-520', 'sector-nf2266', 'sector-doe-lake', 'sector-rapid-river'],
    restocks: [],
    elevationTargetRange: null,
  },
];

export const DEFAULT_ROUTE = '100mi';
```

### Script-by-Script Changes

#### 1. pipeline.js -- Orchestrator (MODIFY)

**Current:** Runs 12 steps sequentially, each operating on a single implicit route.
**Change:** Add a route loop around the 5 route-specific steps. Non-route steps run once.

```
ROUTE-SPECIFIC steps (run per route):
  1. parse-gpx          -- reads GPX, writes route-data.json
  2. generate-surface-points -- maps surface types
  3. resolve-annotations -- snaps sectors to route points
  4. compute-sector-elevations -- extracts per-sector elevation arrays

SHARED steps (run once):
  5. generate-sector-details -- editorial content, reads from 100mi annotations
  6. generate-thumbnails
  7. copy-images
  8. generate-webp
  9. process-historical
  10. match-photos
  11. copy-gpx  (expanded to copy all 3 GPX files)
  12. generate-og-image
  13. generate-routes-manifest (NEW)
```

The pipeline passes the route ID as a command-line argument to route-specific scripts:
```javascript
for (const route of ROUTES) {
  for (const step of routeSpecificSteps) {
    execFileSync(process.execPath, [step.script, route.id], { ... });
  }
}
```

#### 2. parse-gpx.js (MODIFY)

**Current:** Hardcodes `Munising_Hiawatha_s_Revenge.gpx`, writes to `public/data/route-data.json`.
**Change:**
- Accept route ID from `process.argv[2]`
- Look up GPX filename from route-config.js
- Write to `public/data/{routeId}/route-data.json`
- Make elevation threshold configurable per route (100mi has calibrated range, others use default 2m)

Key change:
```javascript
const routeId = process.argv[2] || '100mi';
const routeConfig = ROUTES.find(r => r.id === routeId);
const gpxContent = readFileSync(join(ROOT, routeConfig.gpxFile), 'utf-8');
const outDir = join(ROOT, 'public', 'data', routeId);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'route-data.json'), JSON.stringify(output, null, 2));
```

#### 3. generate-surface-points.js (MODIFY)

**Current:** Reads `hiawathasRevenge.json` (RidewithGPS JSON with S-field), maps to surface types.
**Change:**
- Accept route ID from `process.argv[2]`
- For 100mi: use existing `hiawathasRevenge.json` lookup (unchanged behavior)
- For 100k and 50k: **derive surface from proximity to 100-mile surface data** since no RidewithGPS JSON exists for these routes

**Surface data challenge:** The 100k GPX is from Strava (no surface data). The 50k GPX is from RidewithGPS but we don't have the JSON export with S-field values. The pragmatic approach:

**Proximity-based surface inheritance:** For each point on the 100k/50k route, find the nearest point on the 100-mile route (by geographic distance) and inherit its surface type. Since all three routes share significant road segments, this produces accurate surface coloring on shared sections. For divergent sections, the nearest 100-mile point will typically be on a parallel or nearby road with similar surface characteristics.

This is medium confidence -- accuracy degrades on route sections that diverge significantly from the 100-mile route. An alternative is to source RidewithGPS JSON exports for the 100k and 50k routes if available. Flag this for validation during implementation.

#### 4. resolve-annotations.js (MODIFY)

**Current:** Hardcodes all 7 sectors and 2 restock points, snaps to `route-data.json` points.
**Change:**
- Accept route ID from `process.argv[2]`
- Filter `GRAVEL_SECTORS` and `RESTOCK_POINTS` to only those in the route's config
- Read from `public/data/{routeId}/route-data.json`
- Write to `public/data/{routeId}/annotations.json`

The sector definitions (startMile, lengthMiles) in the current hardcoded array are **100-mile specific**. For the 100k and 50k routes, the same physical sectors exist at different mile markers. The script must:
1. Find each sector's geographic start/end coordinates (lat/lon -- already in the sector definition via the 100mi annotations)
2. For each route: snap those geographic coordinates to the nearest point on that route's point array
3. Compute route-specific `startMile`, `endMile`, `startIdx`, `endIdx`

This means changing from mile-based snapping to **coordinate-based snapping** for the shorter routes:

```javascript
// Instead of snapByMileage(sector.startMile, routePoints)
// Use snapByCoordinate(sector.startLat, sector.startLon, routePoints)
function snapByCoordinate(targetLat, targetLon, points) {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const dist = haversineMeters(
      { latitude: targetLat, longitude: targetLon },
      { latitude: points[i].lat, longitude: points[i].lon }
    );
    if (dist < bestDist) { bestDist = dist; bestIdx = i; }
  }
  return { ...points[bestIdx], snapIdx: bestIdx, snapDist: bestDist };
}
```

The sector start/end coordinates come from the master sector definition (which can be extracted from the current 100mi annotations or defined in route-config.js by lat/lon).

#### 5. compute-sector-elevations.js (MODIFY)

**Current:** Reads `route-data.json` and `annotations.json`, extracts per-sector elevation arrays.
**Change:** Read from `public/data/{routeId}/` paths. Otherwise unchanged -- the logic is already generic.

#### 6. generate-sector-details.js (NO CHANGE)

Editorial content is route-independent. The current script merges hardcoded descriptions with annotation geometry from the 100mi route. The output stays at `public/data/sector-details.json` (shared).

Note: The panel display logic in RouteMap.astro already does a `sectorDetails.find(d => d.id === sector.id)` lookup, so it naturally shows details only for sectors present in the active route's annotations.

#### 7. copy-gpx.js (MODIFY)

**Current:** Copies single GPX to `public/`.
**Change:** Copy all 3 GPX files.

#### 8. generate-routes-manifest.js (NEW)

Writes `public/data/routes.json` from route-config.js with computed metadata (totalMiles, elevationGainFeet) pulled from each route's generated `route-data.json`.

---

## Component Changes

### RouteMap.astro

**Current state:** Fetches 6 JSON files at init, renders one route polyline, one set of sector overlays, one set of labels, one set of restock markers.

**Changes needed:**

#### 1. Route Selector UI

Add a control to the Leaflet map (custom L.Control, same pattern as the existing ResetControl):

```
+-----------------------------------+
| [100mi] [100k] [50k]   [Reset]   |  <- top-left controls
|                                   |
|          Map canvas               |
|                                   |
+-----------------------------------+
```

Three pill-shaped buttons. Active route gets filled background; inactive routes get outline-only. Position: `topleft`, below zoom controls and above reset button.

Implementation: L.Control subclass with three `<button>` elements. Click handlers dispatch `route:change` CustomEvent and call `switchRoute(routeId)`.

#### 2. switchRoute() Function

The core addition. When a new route is selected:

```javascript
async function switchRoute(routeId) {
  // 1. Fetch new route data (parallel)
  const [newRouteData, newAnnotations, newSectorElevations, newSurfacePoints] =
    await Promise.all([
      fetch(`/data/${routeId}/route-data.json`).then(r => r.json()),
      fetch(`/data/${routeId}/annotations.json`).then(r => r.json()),
      fetch(`/data/${routeId}/sector-elevations.json`).then(r => r.json()),
      fetch(`/data/${routeId}/surface-points.json`).then(r => r.json()),
    ]);

  // 2. Remove existing route layers
  clearRouteLayers();  // removes polyline, sector overlays, ghost polys, labels

  // 3. Draw new route
  const newLatlngs = newRouteData.points.map(pt => [pt.lat, pt.lon]);
  drawRoutePolyline(newLatlngs);
  drawSectorOverlays(newLatlngs, newAnnotations, newSectorElevations);
  drawSectorLabels(newLatlngs, newAnnotations);

  // 4. Update module-scope state
  routePoints = newRouteData.points;
  currentRouteId = routeId;

  // 5. Refit map bounds
  const newBounds = L.latLngBounds(newLatlngs);
  map.fitBounds(newBounds, { padding: [20, 20], animate: !prefersReducedMotion });

  // 6. Notify other components
  window.dispatchEvent(new CustomEvent('route:change', {
    detail: { routeId, routeData: newRouteData }
  }));

  // 7. Close any open sector panel
  closePanel();
}
```

#### 3. Layer Management

Currently, layers are created once and never removed. Multi-route requires tracking and removing layers:

```javascript
// Module-scope layer groups
let routeLayerGroup = null;  // L.LayerGroup for polyline + surface segments
let sectorLayerGroup = null; // L.LayerGroup for sector overlays + ghosts
let labelLayerGroup = null;  // L.LayerGroup for sector labels

function clearRouteLayers() {
  if (routeLayerGroup) routeLayerGroup.clearLayers();
  if (sectorLayerGroup) sectorLayerGroup.clearLayers();
  if (labelLayerGroup) labelLayerGroup.clearLayers();
  sectorLayers.length = 0;
  sectorLabels.length = 0;
}
```

This requires refactoring the current initMap() to use LayerGroups instead of directly adding layers to the map. Not complex but touches most of the layer creation code.

#### 4. Restock Marker Filtering

Restock points are in the route's annotations.json (only routes that pass through Camp 7 / Midway will have them). The existing `annotations.filter(a => a.type === 'restock')` pattern works unchanged -- the 100k/50k annotations files simply won't contain restock entries.

However, restock markers also need layer management (remove old, add new on route switch). Add to the layer group pattern.

#### 5. Photo Markers

Photos are shared across routes and are not route-specific. Two options:
- **Keep as-is:** Photo markers always visible regardless of route. Simple, no change.
- **Filter by proximity:** Only show photos near the active route. More polished but adds complexity.

Recommendation: Keep as-is for v1.5. Photos are geolocated to the 100-mile route; they add context regardless of which route is active.

### ElevationProfile.astro

**Current state:** Fetches `route-data.json` and `annotations.json`, builds one Chart.js chart.

**Changes needed:**

#### 1. Listen for route:change Event

```javascript
window.addEventListener('route:change', async (e) => {
  const { routeId } = e.detail;
  await rebuildChart(routeId);
});
```

#### 2. rebuildChart() Function

Chart.js does not support swapping data arrays cleanly on a line chart with LTTB decimation. The most reliable approach is to **destroy and recreate** the chart:

```javascript
async function rebuildChart(routeId) {
  // Fetch new route data
  const [routeData, annotations] = await Promise.all([
    fetch(`/data/${routeId}/route-data.json`).then(r => r.json()),
    fetch(`/data/${routeId}/annotations.json`).then(r => r.json()),
  ]);

  // Destroy old chart
  if (chart) chart.destroy();

  // Build new data and annotations
  const data = routeData.points.map(pt => ({
    x: pt.miles,
    y: +(pt.ele * 3.28084).toFixed(1)
  }));

  const sectors = annotations.filter(a => a.type === 'sector');
  // ... rebuild chart config ...

  chart = new Chart(canvas, newConfig);
}
```

The destroy+recreate pattern is standard for Chart.js when the entire dataset changes. It avoids edge cases with LTTB decimation state, annotation plugin state, and scale ranges.

#### 3. Scale Range Update

The x-axis `max` is currently set to `routeData.meta.totalMiles`. This MUST update when switching routes (101.98 for 100mi, ~61.7 for 100k, ~31.2 for 50k). The destroy+recreate approach handles this naturally.

### RouteStats.astro

**Current state:** Uses Astro content collection to read `route-data.json` at build time. Renders static stats (miles, elevation gain).

**Change:** This component needs to become dynamic (client-side JavaScript) to update when the route changes. Two approaches:

**Option A: Render all three, show/hide with CSS**
Build-time: render three stat blocks with `data-route` attributes. Client-side: toggle visibility on `route:change`. Pros: No JS fetch, instant switching, works with Astro static. Cons: Requires pipeline to pre-compute all route metas.

**Option B: Client-side fetch on route change**
Build-time: render 100mi stats (default). Client-side: listen for `route:change`, fetch new route meta, update text content. Pros: Single render path. Cons: Flash of old content during fetch.

Recommendation: **Option A** -- pre-render all three and toggle visibility. Aligns with Astro's static-first philosophy. The route manifest (routes.json) or individual route-data.json files provide the meta at build time via content collections.

### GPX Download Section

**Current state:** Single hardcoded download link.
**Change:** Three download links, or a dynamic link that changes with route selection.

Recommendation: Show all three download links always visible (users may want to download all routes). Each link serves the respective GPX file from `public/`.

### RouteExplainer.astro (Sector-by-Segment Editorial)

**Current state:** Static build-time render of all 7 sectors.
**Change for v1.5:** Two options:

**Option A: Show all 7 sectors always.** The editorial content is interesting regardless of which route the user is viewing. Add a small badge or note to sectors not on the current route: "This sector is on the 100-mile route only."

**Option B: Filter sectors by active route.** Requires making the static section dynamic, which conflicts with Astro's SSG model.

Recommendation: **Option A** -- keep all sectors visible. The editorial content is the site's primary value. Add a subtle visual indicator (e.g., a badge or reduced opacity) for sectors not on the selected route. This avoids making a static component dynamic.

---

## Event Bus Changes

### Current Events

| Event | Dispatched By | Consumed By | Detail |
|-------|--------------|-------------|--------|
| `elevation:hover` | ElevationProfile | RouteMap | `{ miles }` |
| `elevation:leave` | ElevationProfile | RouteMap | (none) |
| `map:photoClick` | RouteMap | PhotoGallery | `{ photoIndex }` |
| `map:sectorClick` | RouteMap | (unused) | `{ sectorId }` |

### New Events for v1.5

| Event | Dispatched By | Consumed By | Detail |
|-------|--------------|-------------|--------|
| `route:change` | RouteMap (selector) | ElevationProfile, RouteStats | `{ routeId, routeData }` |

The `elevation:hover` and `elevation:leave` events already work correctly without route context because:
- `elevation:hover` sends `{ miles }` which is a distance-along-current-route value
- `snapByMiles()` in RouteMap searches the module-scope `routePoints` array
- When `switchRoute()` updates `routePoints`, the snap function automatically uses the new route's points

No changes needed to the elevation sync events. The bike marker will correctly track the active route's polyline.

---

## Critical Integration Points

### 1. Sector Coordinate Snapping (HIGHEST RISK)

The current pipeline snaps sectors by **mileage** (`snapByMileage(sector.startMile, routePoints)`). This works because sector mile markers are defined on the 100-mile route.

For 100k and 50k routes, the same physical road segment appears at a different mileage. The pipeline must snap by **geographic coordinates** instead.

**Implementation approach:**
- Define sector geographic anchors (lat/lon of start and end) in route-config.js
- Extract these from the existing 100mi annotations (they're already computed)
- For each route: find nearest route point to each sector anchor
- Validate: snap distance should be < 200 feet (our proximity analysis showed 0-212 ft for matching sectors)
- Sectors that snap at > 1000 ft are NOT on this route (safety check)

### 2. Surface Points Without RidewithGPS Data (MEDIUM RISK)

The 100k GPX is from Strava (no surface data). The 50k is from RidewithGPS but we lack the JSON export with S-field values.

**Mitigation options (in order of preference):**
1. Source RidewithGPS JSON exports for 100k and 50k if available
2. Use proximity-based surface inheritance from the 100-mile route data
3. Use sector boundaries to infer surface type (within a gravel sector = gravel, outside = paved)
4. Mark all non-100mi surface data as "unknown" and skip surface coloring

Option 2 is the recommended default. Option 1 would be ideal if the data exists.

### 3. Content Collection Schema Update

`src/content.config.ts` currently defines a single `routeData` collection loading from `public/data/route-data.json`. With per-route subdirectories, this needs updating:

```typescript
// Option: Multiple collections
const routeData100mi = defineCollection({
  loader: file('public/data/100mi/route-data.json', { ... }),
  schema: routeDataSchema,
});

// Or: Dynamic loading at build time with a shared parser
```

This only affects `RouteStats.astro` (the only component using content collections for route data). If RouteStats switches to Option A (pre-render all three), it needs build-time access to all three route metas.

### 4. Map Bounds and Zoom

All three routes are in the same geographic region (Munising area). However:
- 100-mile route spans a much larger area (south to ~46.07 lat)
- 100k and 50k routes stay closer to Munising

When switching routes, the map should `fitBounds()` to the new route's extent. The ResetControl should also reset to the active route's bounds.

### 5. Elevation Chart X-Axis Range

The x-axis max must update per route (102mi, 62mi, 31mi). The destroy+recreate approach handles this, but the sector band annotations also need updating (different sectors at different mile ranges per route).

---

## Suggested Build Order

The dependencies between changes dictate a natural build order:

### Phase 1: Pipeline Infrastructure

**Must come first -- all downstream work depends on this.**

1. Create `scripts/route-config.js` with route definitions
2. Modify `pipeline.js` to loop route-specific steps
3. Modify `parse-gpx.js` to accept routeId, write to subdirectory
4. Modify `resolve-annotations.js` with coordinate-based snapping
5. Modify `compute-sector-elevations.js` to read from subdirectory
6. Modify `generate-surface-points.js` with proximity fallback
7. Modify `copy-gpx.js` to copy all 3 GPX files
8. Create `generate-routes-manifest.js`
9. Verify: run pipeline, confirm 3 route subdirectories with valid JSON

**Validation gate:** All JSON files parseable, sector startIdx < endIdx for all routes, surface-points arrays match route-data point counts.

### Phase 2: Route Selector + Map Switching

**Depends on Phase 1 (needs per-route JSON to exist).**

1. Add route selector L.Control to RouteMap.astro
2. Refactor initMap() to use LayerGroups for route/sector/label layers
3. Implement switchRoute() with fetch + layer rebuild
4. Update restock marker handling for layer groups
5. Verify: click selector buttons, map redraws with correct route

### Phase 3: Elevation Profile + Stats Switching

**Depends on Phase 1 (needs per-route JSON). Can partially parallel Phase 2.**

1. Add `route:change` listener to ElevationProfile.astro
2. Implement chart destroy+recreate in rebuildChart()
3. Update RouteStats to pre-render all three routes (content collection update)
4. Add CSS toggle for RouteStats visibility on route change
5. Verify: route switch updates chart, stats, and sector bands correctly

### Phase 4: Polish + Downloads

**Depends on Phases 2-3 being functional.**

1. Update GPX download section with three download links
2. Add route context to RouteExplainer sector badges
3. Test elevation:hover sync after route switch
4. Test sector panel content for shorter routes
5. End-to-end UAT across all three routes

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Monolithic Combined JSON

**What:** Merging all three routes into single JSON files with route keys.
**Why bad:** Forces every consumer to navigate `data.routes[routeId].points` instead of a flat array. Bloats initial fetch. Makes index references ambiguous.
**Instead:** Separate files per route in subdirectories.

### Anti-Pattern 2: Runtime Route Computation

**What:** Shipping all 3 GPX files to the client and parsing them in the browser.
**Why bad:** GPX parsing is expensive (2780 points for 100k). Contradicts the build-time pipeline philosophy. Increases bundle size.
**Instead:** All computation at build time. Client fetches pre-computed JSON.

### Anti-Pattern 3: Chart.js Data Mutation

**What:** Trying to update Chart.js datasets in-place when switching routes.
**Why bad:** LTTB decimation plugin caches internal state. Annotation plugin doesn't reliably update x-ranges. Results in visual artifacts.
**Instead:** Destroy and recreate the chart on route change.

### Anti-Pattern 4: Global State for Active Route

**What:** Using a global variable or localStorage for the active route, with multiple components polling it.
**Why bad:** Race conditions when multiple components react at different speeds. No clear ownership of state transitions.
**Instead:** Single `route:change` CustomEvent dispatched by the route selector. Each consumer handles its own state update.

### Anti-Pattern 5: Hardcoded Mile Ranges for Multi-Route

**What:** Defining sector mile ranges for 100k/50k by manual inspection.
**Why bad:** Fragile. If GPX files are updated, hardcoded miles break silently.
**Instead:** Use coordinate-based snapping. The geographic locations of sectors are fixed; their mile positions are computed dynamically per route.

---

## Scalability Considerations

| Concern | 3 Routes (v1.5) | 5+ Routes (Future) |
|---------|-----------------|---------------------|
| Pipeline runtime | ~3x current (~3s total) | Linear, acceptable |
| JSON file count | 13 per-route + shared | Manageable with manifest |
| Fetch on switch | 4 parallel fetches, ~50KB | Same pattern, similar size |
| Map layer count | ~30 layers (polylines, sectors, labels) | May need lazy sector loading |
| Chart rebuilds | <100ms destroy+recreate | No concern |

The architecture scales cleanly to additional routes. The manifest-driven approach means adding a 4th route requires only:
1. Add GPX file
2. Add entry to route-config.js
3. Re-run pipeline

No component code changes needed.

---

## Sources

- **RouteMap.astro** (692 lines): Direct analysis of layer creation, event handling, panel logic
- **ElevationProfile.astro** (203 lines): Direct analysis of Chart.js configuration, event dispatch
- **pipeline.js + 5 route-specific scripts**: Direct analysis of data flow, file I/O, dependencies
- **content.config.ts**: Direct analysis of Astro content collection schemas
- **GPX file analysis**: Python haversine computation confirming route distances and sector proximity
- **Leaflet 1.9.4 LayerGroup API**: Used L.LayerGroup for layer management pattern (well-established API)
- **Chart.js 4.x destroy/create pattern**: Standard approach for full dataset replacement with LTTB decimation

All findings are based on direct source file analysis of the current codebase. Confidence: HIGH.

---

## Milestone: Map Label Sizing, 520 Photo Fix, and Site URL Update

**Researched:** 2026-04-06
**Scope:** Three targeted fixes identified via codebase analysis. All findings are based on direct file reading with exact line numbers. Confidence: HIGH.

---

### Fix 1: Map Sector Label Sizing

#### Problem

The sector labels are `L.divIcon` pill-shaped markers rendered with inline CSS. With `white-space: nowrap` in effect, the label box width is determined by the longest text content. The current font-size of `11px` and padding of `3px 8px` are too small for names like "NF2217-2218" (11 chars) and "Bass Lake Rd" (11 chars). The stars row uses `9px` which compounds the cramped appearance.

#### Exact Location

**File:** `src/components/RouteMap.astro`

The entire label HTML is built inline at **lines 676–694**:

```
676:        const labelIcon = L.divIcon({
677:          className: 'sector-label',
678:          html: `<div style="
679:            background: ${bgColor};
680:            color: ${labelTextColor};
681:            border: 2px solid ${labelTextColor};
682:            border-radius: 12px;
683:            padding: 3px 8px;          <-- line 683: CHANGE THIS
684:            font-family: var(--font-display);
685:            font-size: 11px;           <-- line 685: CHANGE THIS
686:            font-weight: 700;
687:            white-space: nowrap;
688:            transform: translate(-50%, -50%);
689:            box-shadow: 2px 2px 0px rgba(0,0,0,0.4);
690:            line-height: 1.3;
691:            text-align: center;
692:          ">${sector.name}<br><span style="font-size: 9px; letter-spacing: 1px;">${stars}</span></div>`,
                                         ^^ line 692: stars font-size also CHANGE
```

#### Current Values

| Property | Current | Location |
|----------|---------|----------|
| `padding` | `3px 8px` | line 683 |
| `font-size` (name) | `11px` | line 685 |
| `font-size` (stars) | `9px` | line 692, inline on `<span>` |
| `border-radius` | `12px` | line 682 |
| `letter-spacing` (stars) | `1px` | line 692 |

#### Recommended New Values

| Property | Recommended | Rationale |
|----------|-------------|-----------|
| `padding` | `4px 10px` | More breathing room; matches the 4px 8px used in `.route-selector__btn` area (line 120) |
| `font-size` (name) | `12px` | One step up from 11px; "Bass Lake Rd" at 12px with 10px padding fits comfortably |
| `font-size` (stars) | `10px` | Proportional increase; keeps stars subordinate but readable |
| `border-radius` | `12px` | No change — already appropriate for a pill |
| `letter-spacing` (stars) | `1px` | No change |

The `white-space: nowrap` is correct; labels should not wrap. The fix is purely increasing the font-size and padding so the text has room to breathe at full render size.

#### Why Not CSS Class Instead of Inline?

The label HTML is built dynamically with JavaScript template literals inside an Astro `<script>` block. The Astro scoped CSS (lines 42–45) only applies `background: transparent` and `border: none` to `.sector-label` (the outer Leaflet wrapper div). The inner `<div>` containing the pill styling is generated JavaScript — Astro's scoped CSS cannot reach it. Inline styles are the correct approach here, matching the established pattern in this file.

---

### Fix 2: 520 Segment Missing Photo

#### Problem

The `520` segment is defined in `RouteExplainer.astro` with:
- `startMi: 0`
- `endMi: 5.0`

The photo filter in `RouteExplainer.astro` lines 46–50:

```javascript
const segmentsWithPhotos = SEGMENTS.map(seg => ({
  ...seg,
  photos: (photosData as any[])
    .filter((p: any) => p.mile >= seg.startMi && p.mile < seg.endMi)
    .slice(0, 2),
}));
```

This filters `photos.json` for entries where `mile >= 0 AND mile < 5.0`.

The earliest photo mile in `photos.json` is **5.51** (line 6 of photos.json). No photos fall in the `[0, 5.0)` range. The 520 segment therefore always hits the fallback branch (lines 79–88 of RouteExplainer.astro) which renders a gradient background instead of a photo.

#### Confirmed Gap

All photo mile values from `photos.json` sorted ascending:
- 5.51 (first entry — just outside 520's range)
- 8.25
- 9.09
- 10.84
- 13.39
- 13.63
- 14.38
- (continues above 17.5...)

There are zero photos with `mile < 5.0`. The gap is confirmed.

#### Strategy Options

**Option A: Widen the 520 segment's photo range (code change, no new data)**

Change `endMi: 5.0` to `endMi: 10.0` in the `SEGMENTS` array in `RouteExplainer.astro` (line 18). This would pick up the 5.51-mile photo.

Risk: The 5.51-mile photo is geographically in the NF2266 segment (which starts at 5.0). Showing it under the 520 card is mislabeling — it would show a forest road photo on the "paved warm-up" card.

**Option B: Add a photo with mile < 5.0 to photos.json (data addition)**

Identify an existing image that was taken within the first 5 miles (on or near County Road 520) and add it to `photos.json` with the correct `mile`, `lat`, and `lon`. This is the correct fix but requires sourcing a suitable image.

**Option C: Use the 5.51-mile photo with an adjusted alt text (pragmatic)**

Add a special case: for the 520 segment, look for photos in `[0, 6.0)` with the note in the alt text that the photo is "near the start of NF2266". This is a hack.

**Option D: Accept the fallback (no fix needed)**

The fallback hero (lines 79–88 of RouteExplainer.astro) renders a forest-green gradient with the segment name overlaid. It is intentional and functional. If no suitable photo of the 520 pavement exists, this is acceptable.

#### Recommendation

**Option B is ideal but requires sourcing an image.** The correct architectural fix is to get a photo taken on County Road 520 (or near Munising Falls / Pictured Rocks visitor center, both of which the description mentions as landmarks) and add it to `photos.json` with a mile value between 0 and 5.0.

If no such image is available in the existing `images/` directory, **Option D (accept the fallback)** is the correct short-term answer. The fallback is styled and intentional. Do not widen the mile range (Option A) — it would show the wrong photo for the wrong terrain.

#### How to Add a New Photo (if Option B is chosen)

1. Place the image file in `/images/`
2. Run the existing thumbnail and WebP pipeline steps:
   - `node scripts/generate-thumbnails.js` (creates `/public/thumbs/*.webp`)
   - `node scripts/copy-images.js`
3. Add an entry to `public/data/photos.json`:
   ```json
   {
     "id": "YOUR_FILENAME.jpg",
     "filename": "YOUR_FILENAME.jpg",
     "thumb": "/thumbs/YOUR_FILENAME.webp",
     "mile": 2.5,
     "lat": 46.XXXXX,
     "lon": -86.XXXXX
   }
   ```
4. The `match-photos.js` script (`scripts/match-photos.js`) automates step 3 by geolocating images. Run it if the image has EXIF GPS data.

#### File Locations for 520 Photo Fix

| File | Line | Change |
|------|------|--------|
| `RouteExplainer.astro` | 18 | `endMi` for 520 segment (only if widening range — not recommended) |
| `public/data/photos.json` | end of array | Add new photo entry (if sourcing new image) |
| `scripts/match-photos.js` | — | Run to auto-ingest if image has EXIF GPS |

---

### Fix 3: Site URL in astro.config.ts

#### Exact Location

**File:** `astro.config.ts`

**Line 5:**
```typescript
site: 'https://hiawathasrevenge.com', // TODO: update to actual deployed URL
```

#### Current Value

```typescript
site: 'https://hiawathasrevenge.com', // TODO: update to actual deployed URL
```

The URL `https://hiawathasrevenge.com` is a placeholder with a `// TODO` comment. The comment suggests the actual deployed URL was not known at authoring time.

#### Change Required

1. Determine the actual deployed URL (Vercel, Netlify, GitHub Pages, or custom domain).
2. Replace the placeholder and remove the TODO comment:
   ```typescript
   site: 'https://ACTUAL-DEPLOYED-URL.com',
   ```

This value is used by Astro for:
- Generating canonical `<link rel="canonical">` tags
- Building absolute URLs for sitemap.xml (if `@astrojs/sitemap` is added)
- The `Astro.site` variable in any components that use it

If the site is deployed at `hiawathasrevenge.com` (exactly as written, minus the placeholder comment), then the only change is removing the `// TODO` comment. If the actual domain is different, update accordingly.

---

### Fix 4: Description Authoring Locations

The editorial descriptions for each segment exist in **two files** that must be kept in sync. Both files contain identical description text.

#### File 1: RouteExplainer.astro (Primary Authoring Location)

**File:** `src/components/RouteExplainer.astro`
**Lines:** 18–25 (the `SEGMENTS` const array)

Each segment object has a `description` field. These are the descriptions rendered in the RouteExplainer section cards. Example:

```javascript
// Line 18 — 520 segment
{ name: '520', startMi: 0, endMi: 5.0, ..., description: 'A brief paved warm-up...' }

// Line 19 — NF2266 segment
{ name: 'NF2266', ..., description: "The route's crucible..." }

// Line 20 — Bass Lake Rd
// Line 21 — NF2217-2218
// Line 22 — ND2225
// Line 23 — Doe Lake
// Line 24 — Ridge Rd
```

All 7 descriptions span lines 18–25 of this file.

#### File 2: scripts/generate-sector-details.js (Must Be Kept in Sync)

**File:** `scripts/generate-sector-details.js`
**Lines:** 26–69 (the `SECTOR_DETAILS` const array)

The script header (line 8) explicitly states:
> "Descriptions are extracted verbatim from RouteExplainer.astro SEGMENTS const."

Each sector entry has a `description` field that must match RouteExplainer.astro:

```javascript
// Lines 28–32 — sector-520
{ id: 'sector-520', description: "A brief paved warm-up...", surface: 'smooth asphalt', ... }

// Lines 34–38 — sector-nf2266
// Lines 40–44 — sector-bass-lake
// Lines 46–50 — sector-nf2217
// Lines 52–56 — sector-nd2225
// Lines 58–62 — sector-doe-lake
// Lines 64–68 — sector-rapid-river (Ridge Rd)
```

After editing `generate-sector-details.js`, the build script must be run to regenerate `public/data/sector-details.json`:

```bash
node scripts/generate-sector-details.js
```

This writes to `public/data/sector-details.json`, which is consumed by the map's sector detail panels.

#### Description Sync Protocol

When rewriting any segment description:
1. Edit `src/components/RouteExplainer.astro` lines 18–25 (the display source)
2. Edit `scripts/generate-sector-details.js` lines 26–69 (the panel data source)
3. Run `node scripts/generate-sector-details.js` to regenerate `public/data/sector-details.json`
4. Both files must contain identical text for each segment

The `surface` field in `generate-sector-details.js` is separate from the description — it is a short editorial label (e.g., "smooth asphalt") displayed in the sector panel. Update it if the description rewrite changes how the surface is characterized.

---

### Summary Change Table

| Fix | File | Lines | Change |
|-----|------|-------|--------|
| Label font-size | `src/components/RouteMap.astro` | 685 | `11px` → `12px` |
| Label padding | `src/components/RouteMap.astro` | 683 | `3px 8px` → `4px 10px` |
| Stars font-size | `src/components/RouteMap.astro` | 692 | `9px` → `10px` |
| 520 photo (Option B) | `public/data/photos.json` | append | Add photo entry with `mile < 5.0` |
| 520 photo (Option D) | (no change) | — | Accept fallback gradient |
| Site URL | `astro.config.ts` | 5 | Remove `// TODO` comment; confirm/update URL |
| Descriptions (display) | `src/components/RouteExplainer.astro` | 18–25 | Rewrite 7 `description` fields |
| Descriptions (panel data) | `scripts/generate-sector-details.js` | 26–69 | Mirror description changes; re-run script |

