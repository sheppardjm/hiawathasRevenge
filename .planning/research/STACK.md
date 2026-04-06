# Technology Stack: Multi-Route Support

**Project:** Hiawatha's Revenge v1.5 — Multi-Route Support
**Researched:** 2026-04-06
**Scope:** Stack additions/changes for 100mi / 100k / 50k route switching on map, per-route elevation profiles, per-route sector filtering, GPX downloads
**Overall confidence:** HIGH
**Core constraint:** No new npm dependencies. Everything needed exists in the installed stack.

---

## Executive Summary

No new libraries are needed. The existing stack (Leaflet 1.9.4, Chart.js 4.5.1, fast-xml-parser 5.5.9, simplify-js 1.2.4) has all the primitives required for multi-route display, dataset swapping, and per-route sector filtering. This is a data architecture and pipeline problem, not a dependency problem.

The work divides into two domains:
1. **Pipeline expansion** -- make `parse-gpx.js` and downstream scripts process 3 GPX files, outputting per-route JSON files
2. **Client-side switching** -- use Leaflet's `L.layerGroup` for polyline toggling and Chart.js's `chart.data.datasets[0].data = newData; chart.update('none')` for elevation swapping

---

## Recommended Stack (No Changes)

### Core -- KEEP AS-IS

| Technology | Installed Version | Purpose | Status |
|------------|------------------|---------|--------|
| Leaflet | 1.9.4 | Interactive map, polylines, layer groups | No change needed |
| Chart.js | 4.5.1 | Elevation profile | No change needed |
| chartjs-plugin-annotation | 3.1.0 | Sector bands on elevation chart | No change needed |
| fast-xml-parser | 5.5.9 | GPX parsing in pipeline | No change needed |
| simplify-js | 1.2.4 | RDP simplification of track points | No change needed |
| Astro | 6.x | Static site framework | No change needed |
| Tailwind | 4.x | Styling | No change needed |

### Why No New Libraries

| Capability Needed | How Existing Stack Handles It | Why NOT Add a Library |
|-------------------|-------------------------------|----------------------|
| Multi-polyline toggle | `L.layerGroup` (built into Leaflet core) | Layer groups are a core Leaflet primitive, not a plugin feature |
| Dynamic elevation swap | `chart.data.datasets[0].data = newData; chart.update('none')` | Chart.js v4 natively supports full dataset replacement |
| Per-route sector filtering | JavaScript `.filter()` on sector arrays keyed by route ID | Pure data logic, no library needed |
| Route selector UI | Custom HTML/CSS control added via `L.Control.extend()` | Already using this pattern for the reset button; consistent UX |
| GPX download links | Static `<a href>` tags pointing to `public/*.gpx` | Already implemented for single file in `copy-gpx.js` |
| Multi-file GPX parsing | Loop existing `fast-xml-parser` + `simplify-js` over 3 inputs | Same parsing logic, parameterized |

**Confidence: HIGH** -- Verified against Leaflet official docs (LayerGroup API: `addTo()`, `remove()`, `clearLayers()`), Chart.js official docs (`chart.update('none')` pattern), and existing codebase patterns.

---

## Pipeline Architecture Changes

### Current Pipeline Data Flow (Single Route)

```
Munising_Hiawatha_s_Revenge.gpx
  -> parse-gpx.js              -> public/data/route-data.json
  -> generate-surface-points   -> public/data/surface-points.json
  -> resolve-annotations       -> public/data/annotations.json
  -> generate-sector-details   -> public/data/sector-details.json
  -> compute-sector-elevations -> public/data/sector-elevations.json
  -> copy-gpx.js               -> public/Munising_Hiawatha_s_Revenge.gpx
```

### Recommended Multi-Route Data Flow

**Strategy: Per-route JSON files with a shared route manifest.**

The pipeline should produce route-keyed output files. Two viable patterns:

#### Option A: Keyed Filenames (RECOMMENDED)

```
parse-gpx.js processes 3 GPX files:
  -> public/data/route-data-100mi.json
  -> public/data/route-data-100k.json
  -> public/data/route-data-50k.json

resolve-annotations.js produces per-route annotations:
  -> public/data/annotations-100mi.json
  -> public/data/annotations-100k.json
  -> public/data/annotations-50k.json

compute-sector-elevations.js produces per-route sector elevations:
  -> public/data/sector-elevations-100mi.json
  -> public/data/sector-elevations-100k.json
  -> public/data/sector-elevations-50k.json

NEW: generate-route-manifest.js produces:
  -> public/data/route-manifest.json
```

**Why keyed filenames over a single combined file:**
- Each route's data is ~15-50KB. A combined file forces downloading all three routes upfront (~100KB) even though the user views one route at a time.
- Per-file approach enables lazy fetching: load the default route immediately, fetch other routes on demand when user switches.
- Simpler cache invalidation: changing one route does not bust the cache for others.
- Mirrors the existing single-file pattern -- minimal conceptual change to the pipeline.

#### Option B: Combined File (NOT RECOMMENDED)

A single `routes.json` containing all three routes. Rejected because:
- Forces downloading all route data upfront (~100KB+ vs ~30KB for one route)
- Breaks the existing `fetch('/data/route-data.json')` pattern
- Makes Astro content collections harder to schema (nested route objects vs flat entries)

### Route Manifest Schema

A new `route-manifest.json` provides the selector UI with metadata without loading full route data:

```json
{
  "routes": [
    {
      "id": "100mi",
      "name": "100 Mile",
      "shortName": "100mi",
      "gpxFile": "Munising_Hiawatha_s_Revenge.gpx",
      "totalMiles": 100.9,
      "elevationGainFeet": 2258,
      "sectorIds": [
        "sector-520", "sector-nf2266", "sector-bass-lake",
        "sector-nf2217", "sector-nd2225", "sector-doe-lake",
        "sector-rapid-river"
      ],
      "default": true
    },
    {
      "id": "100k",
      "name": "100K",
      "shortName": "100k",
      "gpxFile": "Hiawatha_s_Revenge_100k.gpx",
      "totalMiles": 0,
      "elevationGainFeet": 0,
      "sectorIds": [],
      "default": false
    },
    {
      "id": "50k",
      "name": "50K",
      "shortName": "50k",
      "gpxFile": "Hiawatha_s_Revenge_50K_.gpx",
      "totalMiles": 0,
      "elevationGainFeet": 0,
      "sectorIds": [],
      "default": false
    }
  ],
  "defaultRoute": "100mi"
}
```

Notes:
- `totalMiles`, `elevationGainFeet` are populated by the pipeline after processing each GPX file.
- `sectorIds` defines which of the 7 sectors appear on each route (determined by geographic overlap -- see "Sector-Route Membership" below).
- The manifest is small (~500B) and fetched first to populate the route selector UI before loading any route data.

### GPX File Assessment

All three GPX files are present in the project root and use standard GPX 1.1 format with `<trkpt lat="" lon=""><ele></ele></trkpt>` structure:

| File | Lines | Est. Track Points | Source | Notes |
|------|-------|-------------------|--------|-------|
| `Munising_Hiawatha_s_Revenge.gpx` | 5,796 | ~1,927 | RidewithGPS | Currently used for 100mi route |
| `Hiawatha_s_Revenge_100k.gpx` | 8,349 | ~2,770 | Strava (StravaGPX creator) | No metadata block, just trk/trkseg |
| `Hiawatha_s_Revenge_50K_.gpx` | 2,877 | ~950 | RidewithGPS | Has metadata block with name and link |
| `Hiawatha_100.gpx` | 252,923 | ~84,000 | Unknown | Very large, likely raw Garmin/device recording. NOT for web display. |

**GPX parsing compatibility:** The 100k file uses a slightly different XML structure (Strava creator, no `<metadata>` block), but `fast-xml-parser` handles both formats identically since it just needs `gpx.trk.trkseg.trkpt` with `@_lat`, `@_lon`, and `ele` fields. The current `parse-gpx.js` code accesses exactly these paths. Verified: both 100k and 50k files use the same `trkpt` structure.

**Simplification estimates:** The existing RDP tolerance (0.0002 decimal degrees) produces ~456 points from 1,927 inputs (76% reduction). Expected outputs:
- 100k (~2,770 pts): ~300-450 simplified points
- 50k (~950 pts): ~150-250 simplified points
Both are well within the existing performance envelope. No tolerance adjustment needed.

### Pipeline Script Modifications

#### parse-gpx.js -- Parameterize for Multiple GPX Files

```javascript
// Current: hardcoded single GPX file
const gpxContent = readFileSync(join(ROOT, 'Munising_Hiawatha_s_Revenge.gpx'), 'utf-8');

// New: route config table, loop over all routes
const ROUTES = [
  { id: '100mi', gpx: 'Munising_Hiawatha_s_Revenge.gpx' },
  { id: '100k',  gpx: 'Hiawatha_s_Revenge_100k.gpx' },
  { id: '50k',   gpx: 'Hiawatha_s_Revenge_50K_.gpx' },
];

for (const route of ROUTES) {
  const gpxContent = readFileSync(join(ROOT, route.gpx), 'utf-8');
  // ... same parsing, simplification, elevation gain logic ...
  writeFileSync(join(outDir, `route-data-${route.id}.json`), JSON.stringify(output, null, 2));
}
```

The haversine, simplify-js, and elevation gain computation are all stateless functions. They can process any GPX input identically.

**Elevation gain thresholds:** The current code calibrates the noise-filter threshold against a known target range (2,123-2,411 ft) specific to the 100mi route. For the 100k and 50k routes, no such reference values exist yet. Options:
1. Use the 100mi's calibrated threshold (2m) as default for all routes (RECOMMENDED to start)
2. Research reference values from Strava/RidewithGPS for the shorter routes and calibrate individually

#### resolve-annotations.js -- Per-Route Sector Membership

**Sector-to-route membership** is the key data architecture question. Which of the 7 gravel sectors fall on each shorter route?

**Recommended approach: Hardcode membership with a lookup table.**

The routes are known and fixed. A lookup table is simpler and more reliable than geometric overlap analysis:

```javascript
const ROUTE_SECTORS = {
  '100mi': [
    'sector-520', 'sector-nf2266', 'sector-bass-lake',
    'sector-nf2217', 'sector-nd2225', 'sector-doe-lake',
    'sector-rapid-river'
  ],
  '100k': ['sector-520', 'sector-nf2266', 'sector-bass-lake', 'sector-nf2217'],
  '50k':  ['sector-520', 'sector-nf2266'],
};
// NOTE: 100k and 50k sector lists are ESTIMATES. Must verify against actual
// GPX tracks before finalizing. Ride the tracks on RidewithGPS map overlay
// to confirm which sectors each shorter route passes through.
```

**Critical implementation detail:** Sector `startIdx` and `endIdx` are point indices into a specific route's simplified point array. These indices differ per route because each GPX produces a different simplified point set. `resolve-annotations.js` must run independently for each route, snapping sector start/end mile markers against that route's own point array.

The existing `snapByMileage()` function works correctly for this -- it finds the nearest point by mile value, which is route-independent. The challenge is that sector mile markers (e.g., "sector starts at mile 6.7") are defined relative to the 100mi route. For shorter routes, the same geographic point may be at a different mile value.

**Better approach for shorter routes:** Snap sectors by geographic coordinates (lat/lon proximity) rather than mile markers. The sector start/end coordinates from the 100mi annotations can be used to find the nearest point in each route's point array.

#### generate-surface-points.js -- Surface Coloring Strategy

This script depends on `hiawathasRevenge.json` (RidewithGPS export with S-field surface type data). The 100k GPX is from Strava (no S-field equivalent). The 50k GPX is from RidewithGPS but there is no corresponding JSON export in the repo.

**Options for surface coloring on shorter routes:**

1. **Skip surface coloring for 100k/50k** (RECOMMENDED) -- Show single-color polylines for shorter routes. The 100mi flagship route retains full surface coloring. This is the simplest approach and avoids fragile coordinate-matching across different GPS recordings.

2. **Snap-match from 100mi surface data** -- For shared route segments, match 100k/50k coordinates to the nearest 100mi point and inherit its surface type. Works for shared segments; divergent segments get `unknown`. Adds complexity for marginal visual benefit.

3. **Obtain RidewithGPS JSON exports for 100k/50k** -- If available, process them identically. Cleanest but requires data files that may not exist.

Recommendation: Start with option 1. Upgrade to option 2 if the single-color appearance looks visually inconsistent. Surface coloring is a nice-to-have for alternate routes, not a table stakes feature for route switching.

#### generate-sector-details.js -- No Per-Route Changes Needed

Sector editorial content (descriptions, surface labels, Strava links) is shared across routes. A sector's description does not change based on which route it appears on. This script continues to produce a single `sector-details.json`. The client-side filtering handles which sectors to display per route.

#### copy-gpx.js -- Trivial Expansion

```javascript
// Current: single file copy
copyFileSync(srcFile, destFile);

// New: loop over all GPX files
const GPX_FILES = [
  'Munising_Hiawatha_s_Revenge.gpx',
  'Hiawatha_s_Revenge_100k.gpx',
  'Hiawatha_s_Revenge_50K_.gpx',
];
for (const filename of GPX_FILES) { ... }
```

Do NOT copy `Hiawatha_100.gpx` (252K lines, ~10MB). It is a raw device recording not suitable for web download.

#### New Pipeline Step: generate-route-manifest.js

Runs after all per-route `parse-gpx` calls complete. Reads the `meta` section from each `route-data-{id}.json` and the sector membership config to produce `route-manifest.json`.

### Revised Pipeline Order

```
Step 1:  parse-gpx (all 3 routes in loop)
Step 2:  generate-route-manifest (reads all route-data-*.json meta)
Step 3:  generate-surface-points (100mi only)
Step 4:  resolve-annotations (per-route loop)
Step 5:  generate-sector-details (unchanged -- shared editorial)
Step 6:  compute-sector-elevations (per-route loop)
Step 7:  generate-thumbnails
Step 8:  copy-images
Step 9:  generate-webp
Step 10: process-historical
Step 11: match-photos
Step 12: copy-gpx (all 3 routes)
Step 13: generate-og-image
```

The pipeline remains a single `pipeline.js` orchestrator. Steps 1, 4, 6, and 12 run their internal loops over all routes. No new `execFileSync` calls needed -- the existing scripts get parameterized internally.

---

## Client-Side Patterns

### Leaflet: Multi-Route Polyline Toggling

**Pattern: One `L.layerGroup` per route containing that route's polyline, sector overlays, and sector labels. Swap via `addTo(map)` / `remove()`.**

```javascript
// Structure for each route's map layers
const routeLayers = {};

for (const route of manifest.routes) {
  const routeData = await fetch(`/data/route-data-${route.id}.json`).then(r => r.json());
  const latlngs = routeData.points.map(pt => [pt.lat, pt.lon]);

  // Route polyline
  const polyline = L.polyline(latlngs, {
    color: getCSSColor(route.color || '--color-forest-900'),
    weight: 4, opacity: 0.9, interactive: false,
  });

  // Sector overlays for this route (visible + ghost + labels)
  const sectorLayers = buildSectorLayers(route, latlngs, annotations);

  routeLayers[route.id] = {
    group: L.layerGroup([polyline, ...sectorLayers]),
    data: routeData,
    latlngs,
  };
}

// Show default route
routeLayers['100mi'].group.addTo(map);
let activeRouteId = '100mi';
```

**Switching logic:**

```javascript
function switchRoute(newRouteId) {
  // Remove current route's layers
  routeLayers[activeRouteId].group.remove();

  // Add new route's layers
  routeLayers[newRouteId].group.addTo(map);

  // Refit map bounds to new route extent
  const bounds = L.latLngBounds(routeLayers[newRouteId].latlngs);
  map.fitBounds(bounds, { padding: [20, 20], animate: !prefersReducedMotion });

  // Update module-scope routePoints for bike crosshair sync
  routePoints = routeLayers[newRouteId].data.points;

  // Update active route tracker
  activeRouteId = newRouteId;

  // Notify other components
  window.dispatchEvent(new CustomEvent('route:change', {
    detail: { routeId: newRouteId }
  }));
}
```

**Key implementation details:**
- `L.layerGroup` is the correct container. `L.featureGroup` adds bounds calculation overhead that is unnecessary here since we compute bounds from the raw latlngs array.
- Sector overlays (visible polylines + ghost polylines for click targets + label markers) must be in the same layer group as the route polyline. When the route switches, all of its sectors disappear together.
- Restock markers and photo clusters are shared across all routes (same geographic area). They should NOT be in any route-specific layer group -- keep them added directly to the map as they are now.
- The `bikeMarker` (crosshair for elevation hover sync) stays on the map. Only `routePoints` (the reference array for `snapByMiles`) needs to swap.
- `initialBounds` used by the reset control must update to the active route's bounds.

**Confidence: HIGH** -- `L.layerGroup`, `group.addTo(map)`, and `group.remove()` are core Leaflet 1.9.4 APIs documented at [leafletjs.com/reference.html](https://leafletjs.com/reference.html) and confirmed in the [Layer Groups tutorial](https://leafletjs.com/examples/layers-control/).

### Leaflet: Route Selector Control

**Pattern: Custom `L.Control.extend()` matching the existing reset button pattern.**

The site already uses `L.Control.extend()` for the reset-view button in `RouteMap.astro`. Use the same pattern for the route selector:

```javascript
const RouteSelector = L.Control.extend({
  options: { position: 'topright' },
  onAdd() {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control route-selector');
    L.DomEvent.disableClickPropagation(container);

    for (const route of manifest.routes) {
      const btn = L.DomUtil.create('button', 'route-selector__btn', container);
      btn.textContent = route.shortName;
      btn.dataset.routeId = route.id;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', route.default ? 'true' : 'false');

      L.DomEvent.on(btn, 'click', () => {
        switchRoute(route.id);
        // Update aria-checked states
        container.querySelectorAll('.route-selector__btn').forEach(b => {
          b.setAttribute('aria-checked', b.dataset.routeId === route.id ? 'true' : 'false');
        });
      });
    }

    return container;
  }
});
new RouteSelector().addTo(map);
```

**Why custom control instead of `L.control.layers`:**
- `L.control.layers` uses a dropdown menu with checkboxes/radios -- generic UI that does not match the site's forest/amber design language.
- The routes are mutually exclusive (not independent overlays) -- needs radio-button behavior, not checkbox behavior.
- Custom control allows styled buttons matching the amber/forest palette with `aria-checked` for accessibility.
- Consistent with the existing `ResetControl` pattern already in the codebase.

### Chart.js: Dynamic Elevation Profile Swapping

**Pattern: Replace dataset data array, update scale max, rebuild sector band annotations, call `chart.update('none')`.**

```javascript
window.addEventListener('route:change', async (e) => {
  const { routeId } = e.detail;

  // Fetch route data (may be cached from map init)
  const routeData = await fetch(`/data/route-data-${routeId}.json`).then(r => r.json());
  const annotations = await fetch(`/data/annotations-${routeId}.json`).then(r => r.json());

  // Replace elevation dataset
  const newData = routeData.points.map(pt => ({
    x: pt.miles,
    y: +(pt.ele * 3.28084).toFixed(1)
  }));
  chart.data.datasets[0].data = newData;

  // Update x-axis max to new route distance
  chart.options.scales.x.max = routeData.meta.totalMiles;

  // Replace sector band annotations (keep crosshair)
  const crosshair = chart.options.plugins.annotation.annotations.crosshair;
  const newAnnotations = { crosshair };
  const sectors = annotations.filter(a => a.type === 'sector');
  for (const sector of sectors) {
    newAnnotations[sector.id] = {
      type: 'box',
      xMin: sector.startMile,
      xMax: sector.endMile,
      backgroundColor: SECTOR_BAND_FILL,
      borderWidth: 0,
      drawTime: 'beforeDatasetsDraw'
    };
  }
  chart.options.plugins.annotation.annotations = newAnnotations;

  // Instant update -- no animation
  chart.update('none');
});
```

**Why `chart.update('none')` instead of destroying and recreating the chart:**
- Dataset replacement is the officially documented Chart.js v4 pattern for dynamic data changes (see [Updating Charts docs](https://www.chartjs.org/docs/latest/developers/updates.html)).
- Destroying and recreating causes a DOM flicker (canvas element is removed and re-added).
- `'none'` mode skips animation, which is correct UX -- animating from a 100mi elevation profile to a 50k profile would look nonsensical.

**Important: The `parsing: false` flag is preserved.** The existing chart uses `parsing: false` at both dataset and options level for LTTB decimation compatibility. When replacing `data`, the new array must use the same `{x, y}` format. This is already the case in the pattern above.

**Confidence: HIGH** -- `chart.data.datasets[0].data = newData; chart.update('none')` verified against [Chart.js updating docs](https://www.chartjs.org/docs/latest/developers/updates.html).

### CustomEvent Bus: Route Change Coordination

**Pattern: Extend the existing event bus with a `route:change` event.**

The codebase already uses `window.dispatchEvent(new CustomEvent(...))` for cross-component sync. The complete event catalog:

| Event | Dispatched By | Consumed By | Payload |
|-------|---------------|-------------|---------|
| `elevation:hover` | ElevationProfile | RouteMap | `{ miles }` |
| `elevation:leave` | ElevationProfile | RouteMap | (none) |
| `map:photoClick` | RouteMap | PhotoGallery | `{ photoIndex }` |
| **`route:change`** | **RouteMap (selector)** | **ElevationProfile, RouteStats** | **`{ routeId }`** |

This is the cleanest integration pattern because:
- No shared state management library needed.
- Components remain decoupled -- they listen for events, not import each other.
- Consistent with existing architecture.
- Works with Astro's island architecture (each `<script>` block is independent).

### RouteStats: Dynamic Update

The current `RouteStats.astro` uses build-time Astro content collection for static rendering:

```typescript
const routeEntry = await getEntry('routeData', 'route');
const { totalMiles, elevationGainFeet } = routeEntry!.data.meta;
```

For dynamic route switching, two approaches:

**Option 1: Pre-render all three stat sets, toggle visibility (RECOMMENDED)**

```html
<div class="stats-grid" data-route="100mi">
  <div class="stat-card">...</div>
</div>
<div class="stats-grid" data-route="100k" hidden>
  <div class="stat-card">...</div>
</div>
<div class="stats-grid" data-route="50k" hidden>
  <div class="stat-card">...</div>
</div>

<script>
  window.addEventListener('route:change', (e) => {
    document.querySelectorAll('.stats-grid').forEach(el => {
      el.hidden = el.dataset.route !== e.detail.routeId;
    });
  });
</script>
```

This is simpler because there are only 2 stat values (miles, elevation gain) across 3 routes = 6 total values. Pre-rendering all and toggling via `hidden` attribute avoids async data fetching for a trivial amount of content.

**Option 2: Client-side DOM text replacement** -- Better if stats expand beyond 2-3 values. Overkill for now.

---

## Data Loading Strategy

### Eager vs. Lazy Loading of Route Data

**Recommendation: Eager-load the default route (100mi). Lazy-load 100k and 50k on first switch.**

Rationale:
- The 100mi route is the flagship -- most visitors will see it first.
- Route data files are ~15-50KB each. No reason to fetch all three upfront.
- The route selector click gives a natural loading trigger.
- A 50-100ms fetch delay on first switch is imperceptible to users.

```javascript
async function switchRoute(newRouteId) {
  // Lazy-load: fetch and cache on first access
  if (!routeLayers[newRouteId]) {
    const [routeData, annotations] = await Promise.all([
      fetch(`/data/route-data-${newRouteId}.json`).then(r => r.json()),
      fetch(`/data/annotations-${newRouteId}.json`).then(r => r.json()),
    ]);
    const latlngs = routeData.points.map(pt => [pt.lat, pt.lon]);
    // Build polyline + sector layers for this route
    routeLayers[newRouteId] = buildRouteLayers(routeData, annotations, latlngs);
  }

  // Swap displayed route
  routeLayers[activeRouteId].group.remove();
  routeLayers[newRouteId].group.addTo(map);
  activeRouteId = newRouteId;
  // ... dispatch route:change event
}
```

**Alternative considered:** Pre-fetch all routes during idle time via `requestIdleCallback`. Viable but unnecessary complexity for 3 small JSON files.

### Astro Content Collections

The existing `content.config.ts` uses `file()` loaders pointing to `public/data/route-data.json`.

**Recommendation: Keep build-time collections for 100mi default. Client-fetch for alternates.**

The 100mi route continues to use `getEntry('routeData', 'route')` for build-time rendering of `RouteStats.astro`. The 100k and 50k stats can be pre-rendered from their respective JSON files at build time (expanding the content collection schema) OR hardcoded from the route manifest. Since there are only 2 stat values per route, the simplest path is to read all three route-data files at build time in the Astro component frontmatter and render all three stat sets:

```typescript
// RouteStats.astro frontmatter
import { readFileSync } from 'fs';
const routes = ['100mi', '100k', '50k'];
const routeStats = routes.map(id => {
  const data = JSON.parse(readFileSync(`public/data/route-data-${id}.json`, 'utf-8'));
  return { id, ...data.meta };
});
```

This avoids content collection schema changes entirely.

---

## What NOT to Add

| Library/Tool | Why People Suggest It | Why NOT for This Project |
|--------------|----------------------|--------------------------|
| **Leaflet 2.0** | Newer version | Alpha. leaflet.markercluster and leaflet-gesture-handling incompatible. Explicitly out-of-scope in project constraints. |
| **gpx-parser-builder** | Alternative GPX parser | fast-xml-parser already works for GPX. Adding a GPX-specific library is redundant. |
| **Turf.js** | Geospatial analysis for sector overlap detection | Would help with geographic sector-route overlap detection, but hardcoded sector membership is simpler for 3 fixed routes. Turf.js is ~50KB for one calculation we can do manually. |
| **Zustand / Nano Stores** | State management for activeRouteId | Three components listening for one CustomEvent does not warrant a state library. Adding a store for a single string value is over-engineering. |
| **Leaflet.Routing.Machine** | Routing engine | We have pre-defined GPX tracks, not turn-by-turn directions. Solves a different problem. |
| **L.control.layers** | Built-in Leaflet layer control | Generic checkbox/radio UI does not match site design. Custom `L.Control.extend()` (already in use) gives full styling control and mutually-exclusive route behavior. |
| **@astrojs/react or @astrojs/svelte** | UI framework for route selector | A 3-button route selector does not warrant an entire framework island. Vanilla JS in a `<script>` tag is the site's established pattern. |
| **Web Workers for GPX parsing** | Offload parsing to background thread | The 3 GPX files are parsed at build time in the Node.js pipeline, not at runtime. Browser never parses GPX. |

---

## Alternatives Considered (Stack Level)

| Decision | Recommended | Alternative | Why Recommended |
|----------|-------------|-------------|-----------------|
| Data file structure | Keyed filenames (`route-data-100mi.json`) | Combined `routes.json` | Enables lazy loading, simpler caching, mirrors existing pattern |
| Route selector | Custom `L.Control.extend()` | `L.control.layers` | Matches site design, already proven pattern, mutually exclusive routes need radio not checkbox |
| Elevation swap | Direct dataset replacement + `update('none')` | Destroy and recreate chart | Dataset replacement is officially recommended; chart recreation causes DOM flicker |
| Sector filtering | Hardcoded route-sector membership | Geographic overlap detection (Turf.js) | 3 fixed routes, 7 fixed sectors -- hardcode is simpler and zero-dependency |
| Inter-component sync | `route:change` CustomEvent | Shared state store (Nano Stores) | Extends existing event bus pattern, no new dependencies |
| Surface coloring for 100k/50k | Skip (single-color polyline) | Snap-match from 100mi surface data | Start simple, upgrade if needed -- surface coloring is not table stakes for route switching |
| Stats display | Pre-render all 3, toggle `hidden` | Client-fetch on route:change | Only 6 DOM elements total; pre-rendering is simpler than async fetching |
| Pipeline structure | Internal loops within existing scripts | Separate script per route | Avoids multiplying `execFileSync` calls; keeps pipeline.js step count manageable |

---

## Version Verification

All versions verified against installed `node_modules/*/package.json` on 2026-04-06:

| Package | package.json range | Installed version | Notes |
|---------|-------------------|-------------------|-------|
| leaflet | ^1.9.4 | 1.9.4 | Latest stable. 2.0 is alpha -- do not upgrade. |
| chart.js | ^4.5.1 | 4.5.1 | Latest v4 line. |
| chartjs-plugin-annotation | ^3.1.0 | 3.1.0 | Compatible with Chart.js 4.x. |
| fast-xml-parser | ^5.5.9 | 5.5.9 | Handles all 3 GPX file formats. |
| simplify-js | ^1.2.4 | 1.2.4 | Stateless RDP -- works on any point array. |
| astro | ^6.1.1 | 6.x | No changes needed. |
| tailwindcss | ^4.2.2 | 4.x | No changes needed. |

**No version bumps required for multi-route support.**

---

## Installation

No new packages to install. The implementation is purely:
- Pipeline script modifications (Node.js, build time)
- Client-side JavaScript changes (Leaflet + Chart.js runtime APIs)
- HTML/CSS for route selector UI
- Minor Astro component adjustments for multi-route stats

```bash
# Nothing to install. Existing dependencies cover all needs.
```

---

## Sources

### Verified HIGH Confidence (Official Docs / Installed Code)

- [Leaflet Layer Groups and Layers Control tutorial](https://leafletjs.com/examples/layers-control/) -- LayerGroup creation, addTo/remove patterns, base layer vs overlay distinction
- [Leaflet Documentation](https://leafletjs.com/reference.html) -- LayerGroup API: `addLayer()`, `removeLayer()`, `clearLayers()`, `addTo()`, `remove()`
- [Chart.js Updating Charts](https://www.chartjs.org/docs/latest/developers/updates.html) -- dataset replacement, `chart.update('none')` for skip-animation updates
- [Chart.js API Reference](https://www.chartjs.org/docs/latest/developers/api.html) -- `update(mode?)` method signature
- Codebase analysis (2026-04-06): `RouteMap.astro` (660 LOC -- L.Control.extend pattern, CustomEvent bus, sector overlay architecture), `ElevationProfile.astro` (203 LOC -- Chart.js v4 dataset structure, annotation plugin sector bands), `parse-gpx.js` (165 LOC -- fast-xml-parser + simplify-js pipeline), `resolve-annotations.js` (170 LOC -- sector snapping by mileage), `compute-sector-elevations.js` (120 LOC -- per-sector elevation extraction), `content.config.ts` (131 LOC -- Astro collection schemas), `copy-gpx.js` (24 LOC -- single-file copy pattern)

### Verified MEDIUM Confidence (WebSearch cross-referenced)

- [Chart.js GitHub issue #3614](https://github.com/chartjs/Chart.js/issues/3614) -- Community confirmation that full dataset replacement + `update()` is the recommended v4 pattern
- [Leaflet GitHub issue #4](https://github.com/Leaflet/Leaflet/issues/4) -- Hide/show layers discussion confirming `addTo(map)` / `map.removeLayer()` as the standard approach

---

## Summary for Roadmap

1. **Pipeline first** -- Expand parse-gpx and downstream scripts to produce per-route data files and route manifest. This unblocks all client-side work.
2. **Map layer groups second** -- Build multi-polyline display with route switching via L.layerGroup toggling. This is the core visual change.
3. **Elevation + sectors third** -- Wire Chart.js dataset swapping and sector overlay filtering to the `route:change` CustomEvent.
4. **Stats + downloads last** -- RouteStats DOM toggling and GPX download links are trivial once data exists.

No new dependencies. No version bumps. The existing stack handles everything.

---

*Stack research for: Hiawatha's Revenge v1.5 -- Multi-Route Support*
*Researched: 2026-04-06*
*Previous: v1.3 stack research (2026-04-02) -- map interactivity milestone*
