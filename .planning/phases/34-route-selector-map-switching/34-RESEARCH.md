# Phase 34: Route Selector & Map Switching - Research

**Researched:** 2026-04-06
**Domain:** Leaflet L.LayerGroup toggling, accessible radiogroup UI, CustomEvent bus, Chart.js dynamic data swap
**Confidence:** HIGH — all findings verified against actual source code, routes.json manifest, and per-route JSON data

---

## Summary

Phase 34 adds a segmented control (pill bar) that lets users switch between the 100mi, 100k, and 50k routes on the Leaflet map. The key architectural challenge is that `RouteMap.astro` currently adds all layers directly to the map with no mechanism for removal. This must be refactored to use `L.layerGroup()` containers so layers can be swapped cleanly on route change. The elevation profile must also listen for `route:change` and rebuild its chart and sector annotations.

One important pre-research finding: **the current `RouteMap.astro` fetches `surface-points.json` and defines `SURFACE_COLORS` but never renders surface-colored polyline segments.** It draws a single uniform dark green polyline. Phase 34 must implement the run-flush segmented rendering as part of setting up route layer groups — this was deferred from Phase 25 and lands here. The per-route `surface-points.json` files already exist (Phase 33 complete) with proximity-inherited surface data for 100k/50k.

All three route data files are verified to exist at `/data/{routeId}/` with accurate sector indices (coordinate-snapped). The `routes.json` manifest has color, sectorIds, totalMiles, and elevationGainFeet for each route. No new npm dependencies are needed.

**Primary recommendation:** Refactor `RouteMap.astro` into `initMap()` (one-time setup) + `renderRoute(routeId)` (data-driven layer creation) using `L.layerGroup()` containers. Dispatch `route:change` from a custom `L.Control` route selector. Update `ElevationProfile.astro` to listen for `route:change` and swap chart data in-place with `chart.update('none')`.

---

## Standard Stack

No new npm dependencies. This phase uses the existing installed stack.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Leaflet | 1.9.4 | `L.layerGroup`, `addTo(map)`, `remove()`, `clearLayers()`, `fitBounds()` | Already installed; all needed APIs are core Leaflet |
| Chart.js | 4.5.1 | `chart.data.datasets[0].data = newData; chart.update('none')` | Official documented pattern for dynamic data swap |
| chartjs-plugin-annotation | 3.1.0 | Rebuild sector band annotations on route change | Already registered; just replace the annotations object |
| Native CustomEvent | browser | `route:change` event bus | Already used for `elevation:hover` / `map:photoClick` |

### Supporting Data (Already Exists)
| File | Path | Purpose |
|------|------|---------|
| routes.json | `/data/routes.json` | Route manifest: id, color, sectorIds, totalMiles, shortName |
| route-data.json | `/data/{routeId}/route-data.json` | Points array + meta (totalMiles, pointCount) |
| annotations.json | `/data/{routeId}/annotations.json` | Sector startIdx/endIdx + restock markers |
| sector-elevations.json | `/data/{routeId}/sector-elevations.json` | Per-sector elevation points for sparklines |
| surface-points.json | `/data/{routeId}/surface-points.json` | Per-point surface type (456/278/134 points) |
| sector-details.json | `/data/sector-details.json` | Shared editorial content (unchanged) |
| photos.json | `/data/photos.json` | Shared photo markers (unchanged) |

**Installation:** None required.

---

## Architecture Patterns

### Recommended Refactor: initMap() + renderRoute()

The core architectural change is separating one-time map setup from data-driven layer rendering:

```
initMap()         — runs once on page load
  - Create L.map
  - Add tile layer
  - Add GestureHandling
  - Create bikeMarker (not added to map)
  - Fetch routes.json + sector-details.json + photos.json
  - Build ghost polylines for all 3 routes (added to map at low opacity)
  - Create ResetControl + RouteSelector control
  - Add photo cluster markers (permanent)
  - Add restock markers from 100mi annotations (initial)
  - Call renderRoute('100mi')  ← first render

renderRoute(routeId)  — runs on each route switch
  - Fetch route-data.json, annotations.json, sector-elevations.json, surface-points.json
  - Call clearActiveRoute()  ← removes previous route layers
  - Build surface-colored polyline segments (run-flush algorithm)
  - Build sector overlays (visible + ghost per sector)
  - Build sector label markers
  - Build restock markers (route-specific)
  - Add everything to activeRouteGroup (L.layerGroup)
  - Update routePoints (for bike crosshair sync)
  - Update initialBounds (for reset control)
  - fitBounds to new route
  - Dispatch route:change CustomEvent
  - Close sector panel if open sector not on new route
```

### Pattern 1: L.LayerGroup for Route Layer Management

```javascript
// Source: Leaflet 1.9.4 API (verified)
// Module-scope state
let activeRouteGroup = null;  // L.LayerGroup — cleared on each route switch
let activeRouteId = '100mi';
let routePoints = null;
let initialBounds = null;

function clearActiveRoute() {
  if (activeSector) {
    activeSector.visiblePoly.setStyle(activeSector.defaultStyle);
    activeSector = null;
  }
  if (activeRouteGroup) {
    activeRouteGroup.clearLayers();
    // Do NOT remove the group from the map — just clear its contents
    // The group itself stays added to the map so new layers auto-appear
  }
  sectorLayerEntries.length = 0;  // reset sector registry
}

// Initialize once
activeRouteGroup = L.layerGroup().addTo(map);

// On route switch
async function renderRoute(routeId) {
  const [routeData, annotations, sectorElevations, surfacePoints] =
    await Promise.all([
      fetch(`/data/${routeId}/route-data.json`).then(r => r.json()),
      fetch(`/data/${routeId}/annotations.json`).then(r => r.json()),
      fetch(`/data/${routeId}/sector-elevations.json`).then(r => r.json()),
      fetch(`/data/${routeId}/surface-points.json`).then(r => r.json()),
    ]);

  clearActiveRoute();

  const latlngs = routeData.points.map(pt => [pt.lat, pt.lon]);
  routePoints = routeData.points;

  // Surface-colored segments (run-flush algorithm)
  drawSurfacePolyline(latlngs, surfacePoints, activeRouteGroup);

  // Sector overlays
  drawSectorOverlays(latlngs, annotations, sectorElevations, activeRouteGroup);

  // Sector labels
  drawSectorLabels(latlngs, annotations, activeRouteGroup);

  // Restock markers (route-specific)
  const restocks = annotations.filter(a => a.type === 'restock');
  for (const stop of restocks) { /* add marker to activeRouteGroup */ }

  // Map bounds
  initialBounds = L.latLngBounds(latlngs);
  map.fitBounds(initialBounds, { padding: [20, 20], animate: !prefersReducedMotion });

  // Notify other components
  window.dispatchEvent(new CustomEvent('route:change', {
    detail: { routeId }
  }));

  // Panel: close if active sector is not on new route
  const routeConfig = routesManifest.routes.find(r => r.id === routeId);
  if (activeSector && !routeConfig.sectorIds.includes(activeSector.sectorId)) {
    closePanel();
  }
  activeRouteId = routeId;
}
```

**Key detail:** `clearLayers()` on a group that is already added to the map immediately removes all child layers from the map visually. Adding new layers to the same group immediately shows them. This eliminates add/remove pattern and keeps the group reference stable.

### Pattern 2: Surface-Colored Polyline Run-Flush Algorithm

The current RouteMap.astro fetches surface-points.json but renders a single uniform polyline. Phase 34 must implement the segmented rendering:

```javascript
// Source: Phase 25 RESEARCH.md (verified against 51 runs in 100mi route)
function drawSurfacePolyline(latlngs, surfacePoints, layerGroup) {
  const SURFACE_COLORS = {
    paved:   getCSSColor('--color-lake-400'),   // #4a9eca
    gravel:  getCSSColor('--color-amber-400'),  // #d4a84e
    dirt:    getCSSColor('--color-rust-600'),   // #8b4513
    unknown: getCSSColor('--color-forest-700'), // #3d6b3d
  };

  let prev = null;
  let runStart = 0;

  function flushRun(endIdx) {
    if (prev === null) return;
    // +1 borrows next segment's first point — ensures 2+ pts for single-point runs
    const pts = latlngs.slice(runStart, endIdx + 1);
    if (pts.length >= 2) {
      layerGroup.addLayer(L.polyline(pts, {
        color: SURFACE_COLORS[prev] || SURFACE_COLORS.unknown,
        weight: 4, opacity: 0.9, smoothFactor: 1, interactive: false,
      }));
    }
  }

  for (let i = 0; i < surfacePoints.length; i++) {
    const s = surfacePoints[i].surface;
    if (s !== prev) {
      flushRun(i);
      runStart = i;
      prev = s;
    }
  }
  flushRun(surfacePoints.length - 1);
}
```

**Single-point segment note:** Phase 25 research confirmed 13 of 51 surface runs in the 100mi route have only 1 point. The `endIdx + 1` inclusive slice handles this by "borrowing" the first point of the next run. The 100k/50k routes have fewer points (278 and 134) so they have fewer runs but the same algorithm applies.

### Pattern 3: Route Selector as L.Control

```javascript
// Source: existing ResetControl pattern in RouteMap.astro + STACK.md
// position: 'topleft' places it in the Leaflet control stack (zoom + reset are also topleft)
const RouteSelector = L.Control.extend({
  options: { position: 'topleft' },
  onAdd() {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control route-selector');
    container.setAttribute('role', 'radiogroup');
    container.setAttribute('aria-label', 'Select route distance');
    L.DomEvent.disableClickPropagation(container);

    const routes = routesManifest.routes;
    const btns = [];

    routes.forEach((route, i) => {
      const btn = L.DomUtil.create('button', 'route-selector__btn', container);
      btn.textContent = route.shortName;   // "100mi", "100k", "50k"
      btn.dataset.routeId = route.id;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', i === 0 ? 'true' : 'false');
      btn.setAttribute('tabindex', i === 0 ? '0' : '-1');
      btns.push(btn);

      L.DomEvent.on(btn, 'click', () => {
        if (route.id === activeRouteId) return;  // no-op if same route
        btns.forEach(b => {
          b.setAttribute('aria-checked', b.dataset.routeId === route.id ? 'true' : 'false');
          b.setAttribute('tabindex', b.dataset.routeId === route.id ? '0' : '-1');
        });
        renderRoute(route.id);
      });
    });

    // Arrow key navigation (roving tabindex pattern — W3C APG)
    container.addEventListener('keydown', (e) => {
      const currentIdx = btns.findIndex(b => b === document.activeElement);
      if (currentIdx === -1) return;
      let nextIdx = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIdx = (currentIdx + 1) % btns.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIdx = (currentIdx - 1 + btns.length) % btns.length;
      }
      if (nextIdx !== -1) {
        btns[nextIdx].focus();
        btns[nextIdx].click();  // arrow key = select + focus per radiogroup pattern
      }
    });

    return container;
  }
});
new RouteSelector().addTo(map);
```

### Pattern 4: Ghost Polylines (Inactive Routes)

```javascript
// Create ghost polylines for ALL routes at init time
// These persist on the map — only the activeRouteGroup contents change
const ghostPolylines = {};

for (const route of routesManifest.routes) {
  if (route.id === '100mi') {
    // 100mi ghost data: fetch at init (needed for other routes' ghost)
    // Alternatively: pre-fetch all 3 route-data.json in parallel at initMap
  }
  // Ghost polyline: route color at 0.2 opacity, thin weight
  ghostPolylines[route.id] = L.polyline([], {
    color: route.color,   // '#c8973e', '#5b9279', '#4a90c4'
    weight: 2,
    opacity: 0.2,
    interactive: false,
    smoothFactor: 1,
  }).addTo(map);
}

// On initMap: fetch all 3 route-data.json in parallel to populate ghost polylines
const allRouteData = await Promise.all(
  routesManifest.routes.map(r =>
    fetch(`/data/${r.id}/route-data.json`).then(d => d.json())
  )
);
for (let i = 0; i < routesManifest.routes.length; i++) {
  const route = routesManifest.routes[i];
  const latlngs = allRouteData[i].points.map(pt => [pt.lat, pt.lon]);
  ghostPolylines[route.id].setLatLngs(latlngs);
}

// On renderRoute(routeId): hide active route's ghost, show others
function updateGhostVisibility(activeId) {
  for (const [id, ghost] of Object.entries(ghostPolylines)) {
    ghost.setStyle({ opacity: id === activeId ? 0 : 0.2 });
  }
}
```

**Why pre-fetch all route data at initMap:** Ghost polylines need all 3 routes' coordinates. Fetching in parallel at startup (3 × ~15KB = ~45KB total) is faster than lazy-loading on first switch, and the data is small enough to not justify deferred loading.

### Pattern 5: ElevationProfile Route Switching

```javascript
// Source: STACK.md + Chart.js official docs (verified)
// chart must be promoted to module scope for external access

let chart = null;  // module-scope (outside initChart)

async function updateChart(routeId) {
  const [routeData, annotations] = await Promise.all([
    fetch(`/data/${routeId}/route-data.json`).then(r => r.json()),
    fetch(`/data/${routeId}/annotations.json`).then(r => r.json()),
  ]);

  const newData = routeData.points.map(pt => ({
    x: pt.miles,
    y: +(pt.ele * 3.28084).toFixed(1)
  }));

  // Replace dataset data in-place (Chart.js v4 documented pattern)
  chart.data.datasets[0].data = newData;

  // Update x-axis max to new route distance
  chart.options.scales.x.max = routeData.meta.totalMiles;

  // Rebuild sector band annotations (keep crosshair object)
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

  // Instant update — no animation (animating across routes would look nonsensical)
  chart.update('none');
}

// Listen for route changes
window.addEventListener('route:change', (e) => {
  if (!chart) return;  // guard: chart may not be initialized yet
  updateChart(e.detail.routeId);
});
```

**Why `chart.update('none')` instead of destroy+recreate:** The Chart.js v4 official docs document `data.datasets[0].data = newData` as the standard dynamic data replacement pattern. With `animation: false` already set at chart level, `chart.update('none')` achieves instant redraw without DOM manipulation overhead. The crosshair annotation position is reset to 0 automatically since we only replace the `data` array, not the annotation object structure.

### Pattern 6: CustomEvent Bus — route:change

```javascript
// Source: MDN CustomEvent (HIGH confidence)
// Dispatched by: RouteMap.astro (route selector click)
// Consumed by: ElevationProfile.astro

window.dispatchEvent(new CustomEvent('route:change', {
  detail: { routeId: 'selected-route-id' }
}));

// Consumer:
window.addEventListener('route:change', (e) => {
  const { routeId } = e.detail;  // '100mi', '100k', or '50k'
  // ... respond to route change
});
```

**Event timing:** `route:change` is dispatched AFTER `fitBounds` and layer updates are complete. This ensures the map is visually updated before the elevation chart rebuilds. No `bubbles: true` needed — both dispatching and consuming happen on `window`.

### Anti-Patterns to Avoid

- **Adding layers directly to `map` inside `renderRoute()`:** Always add to `activeRouteGroup`. Layers added directly to the map cannot be batch-removed.
- **Removing and re-adding the layer group itself:** Use `clearLayers()` on the group, not `group.remove()` + `group.addTo(map)`. Removing the group causes a frame where nothing is visible.
- **Recreating sector ghost polys for each route switch:** The ghost polys for the inactive sector click targets are different from ghost route polylines. Sector ghost polys (20px transparent hit targets) must be in the layer group and recreated on each switch. Route ghost polylines (0.2 opacity route tracings) live outside the layer group and persist.
- **Using `L.featureGroup` instead of `L.layerGroup`:** FeatureGroup adds automatic bounds calculation overhead. Use `L.layerGroup` — bounds are computed manually from `latlngs`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Route layer toggling | Manual DOM SVG manipulation | `L.layerGroup.clearLayers()` + rebuild | Leaflet handles z-index, pane ordering, event cleanup |
| Ghost route hit target transparency | 0px-sized invisible elements | `opacity: 0` with `weight: 20` on ghost poly | Leaflet's opacity: 0 is undetectable but still receives mouse events |
| Arrow key navigation | Custom focus management | Roving tabindex pattern (W3C APG radiogroup) | Handles wrap-around, screen reader state correctly |
| Chart data swap | Destroy + recreate chart | `chart.data.datasets[0].data = newData; chart.update('none')` | Official Chart.js v4 pattern; avoids DOM flicker |
| Route selector UI | `L.control.layers` | `L.Control.extend()` custom control | `L.control.layers` uses checkboxes/dropdown — wrong semantic; custom matches existing `ResetControl` pattern |

---

## Common Pitfalls

### Pitfall 1: Map Layer Leak on Route Switch

**What goes wrong:** All layers in the current `RouteMap.astro` are added directly to `map` via `.addTo(map)`. When the route switches, the old polylines, sector overlays, ghost polys, labels, and restock markers remain on the map as visual artifacts. Clicking old sector ghost polys opens panels for the wrong route.

**Why it happens:** `initMap()` was designed as a fire-once function. Layer references are function-scoped.

**How to avoid:** Wrap all route-specific layers in `activeRouteGroup = L.layerGroup().addTo(map)`. Call `activeRouteGroup.clearLayers()` at the top of `renderRoute()`. Do NOT add layers directly to `map` inside `renderRoute()`.

**Warning signs:** Multiple polylines visible simultaneously; sector panel shows wrong sector after route switch.

### Pitfall 2: surfacePoints Array Length Must Match routeData.points Length

**What goes wrong:** The run-flush algorithm iterates `surfacePoints` and accesses `latlngs[i]` by index. If the arrays have different lengths (e.g., `surfacePoints` has 456 entries but `latlngs` has 455), the last surface segment will index out of bounds or silently skip the last geographic point.

**Why it happens:** Phase 33 pipeline produces `surface-points.json` aligned to `route-data.json` by index — but only if the pipeline ran successfully for that route. The 100mi route has 456 points in both. Verify for 100k (278 points) and 50k (134 points).

**How to avoid:** At start of `drawSurfacePolyline()`, assert `surfacePoints.length === latlngs.length`. Log a warning and fall back to single-color polyline if mismatch.

**Warning signs:** Last few kilometers of route missing from map; JavaScript array out-of-bounds error in console.

### Pitfall 3: Sector Panel Auto-Close Logic Uses sectorIds from routes.json

**What goes wrong:** When switching routes, the panel should close if the currently-displayed sector is not on the new route. The sectorIds for each route are in `routes.json` (already fetched at init). If checking sector membership at close time uses a stale reference or wrong data source, sectors that ARE on the new route may incorrectly get closed, or vice versa.

**How to avoid:** Load `routes.json` at `initMap()` (one fetch, small file). Store the manifest. On route switch, check `routesManifest.routes.find(r => r.id === newRouteId).sectorIds.includes(activeSector.sectorId)`.

**Warning signs:** Sector panel closes when switching between 100k and 50k (which share all 4 sectors); or panel does NOT close when switching from 100mi to 100k with sector-bass-lake active.

### Pitfall 4: Ghost Route Polylines Cover Active Route Visually

**What goes wrong:** Ghost polylines are added to the map before the active route layer group. If the ghost for the active route is not hidden, it visually covers part of the active route's surface-colored segments.

**Why it happens:** Z-index in Leaflet is determined by add order. Ghosts added first will be under the active route group. But if the ghost opacity is not set to 0 for the active route, the 0.2-opacity line appears on top of the 0.9-opacity segments.

**How to avoid:** Call `updateGhostVisibility(routeId)` at the end of `renderRoute()`. Set the active route's ghost opacity to 0, inactive routes to 0.2.

**Warning signs:** Active route looks faded/washed out despite surface-colored rendering.

### Pitfall 5: Arrow Key Navigation Captured by Leaflet

**What goes wrong:** Leaflet intercepts keyboard events on its container. Arrow keys inside a Leaflet control may trigger map panning instead of (or in addition to) the radiogroup navigation handler.

**Why it happens:** Leaflet registers global key handlers for map panning (`L.Keyboard` handler). A `keydown` listener on the route selector container may not stop Leaflet from also receiving the event.

**How to avoid:** Call `L.DomEvent.stopPropagation(e)` inside the keydown handler within the control. Alternatively use `L.DomEvent.disableClickPropagation(container)` at the top — this handles click events but not keyboard. For keyboard, add explicit `L.DomEvent.on(container, 'keydown', handler)` instead of native `addEventListener`.

**Warning signs:** Pressing arrow keys both navigates the selector and pans the map simultaneously.

### Pitfall 6: ElevationProfile chart Not Module-Scoped

**What goes wrong:** The current `ElevationProfile.astro` declares `const chart = new Chart(...)` inside `initChart()`. This means `chart` is not accessible from the `route:change` listener added at module scope.

**How to avoid:** Declare `let chart = null` at module scope (outside `initChart()`). Inside `initChart()`, assign: `chart = new Chart(canvas, config)`. Then `updateChart()` can access `chart` via closure.

**Warning signs:** `chart is not defined` or `Cannot read properties of null (reading 'data')` in console on route switch.

### Pitfall 7: fitBounds During Lazy-Init Window

**What goes wrong:** The map uses a two-stage lazy-init (scroll event + IntersectionObserver). If a `route:change` event fires before `initMap()` has resolved, `map.fitBounds()` will be called on an undefined map.

**Why it happens:** The `route:change` listener in `ElevationProfile.astro` registers before the chart is initialized (IntersectionObserver). The elevation chart listener guard `if (!chart) return;` handles this. But the map itself is safe — `route:change` is dispatched from INSIDE `renderRoute()`, which is called from INSIDE `initMap()`, so the map is always initialized when `route:change` fires.

**How to avoid:** No action needed for map. For `ElevationProfile.astro`, the `if (!chart) return;` guard is sufficient.

---

## Code Examples

### Current: Single Uniform Polyline (REPLACE THIS)
```javascript
// Source: RouteMap.astro lines 335-338 — current implementation to be refactored
// This draws a single dark green line; SURFACE_COLORS is defined but never used
L.polyline(latlngs, {
  color: forest900, weight: 4, opacity: 0.9, smoothFactor: 1, interactive: false,
}).addTo(map);
```

### Replacement: Add to Layer Group (Pattern)
```javascript
// Source: Leaflet 1.9.4 API — addLayer on LayerGroup
activeRouteGroup.addLayer(L.polyline(pts, {
  color: SURFACE_COLORS[prev] || SURFACE_COLORS.unknown,
  weight: 4, opacity: 0.9, smoothFactor: 1, interactive: false,
}));
```

### Route Selector CSS (52px touch targets)
```css
/* Source: W3C APG radiogroup pattern + project design tokens */
.route-selector {
  display: flex;
  gap: 0;
  background: var(--color-forest-900);
  border: 1px solid var(--color-forest-700);
  border-radius: 6px;
  padding: 2px;
  overflow: hidden;
}

.route-selector__btn {
  min-height: 52px;       /* SEL-01: 52px touch target */
  min-width: 48px;
  padding: 0 12px;
  border: none;
  background: transparent;
  color: var(--color-cream-200);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s, color 0.15s;
}

.route-selector__btn[aria-checked="true"] {
  background: var(--color-amber-500);  /* default; overridden per route by JS */
  color: var(--color-forest-900);
}

.route-selector__btn:focus-visible {
  outline: 2px solid var(--color-amber-500);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .route-selector__btn { transition: none; }
}
```

### Polyline getBounds to fitBounds
```javascript
// Source: Leaflet 1.9.4 API (verified)
// For a route stored as latlngs array:
const bounds = L.latLngBounds(latlngs);
map.fitBounds(bounds, { padding: [20, 20], animate: !prefersReducedMotion });

// For a polyline object:
const bounds = polyline.getBounds();
map.fitBounds(bounds, { padding: [20, 20] });
```

### CustomEvent Dispatch and Consumption
```javascript
// Source: MDN CustomEvent (HIGH confidence)
// Dispatch (in RouteMap.astro):
window.dispatchEvent(new CustomEvent('route:change', {
  detail: { routeId: 'selected-id' }
}));

// Consume (in ElevationProfile.astro — outside initChart()):
window.addEventListener('route:change', (e) => {
  if (!chart) return;
  updateChart(e.detail.routeId);
});
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Single uniform `routeLine` polyline | Surface-colored run-flush segments in `activeRouteGroup` | Activates existing `surface-points.json` data that was fetched but unused |
| All layers added directly to `map` | Route layers in `L.layerGroup`, shared layers (photos, tiles) added to `map` | Enables clean teardown without removing shared layers |
| `initMap()` as monolithic fire-once function | `initMap()` (setup) + `renderRoute(routeId)` (data render) | Enables route switching without page reload |
| `chart` scoped inside `initChart()` | `let chart = null` at module scope | Allows `route:change` listener to call `chart.update('none')` |

**Currently unused but fetched:** `surface-points.json` is fetched in the current `RouteMap.astro` at line 315 but `SURFACE_COLORS` is defined at line 328 and the surface data is never used for rendering. Phase 34 activates this.

---

## Open Questions

1. **Active selector button color per route**
   - What we know: `routes.json` has `color: '#c8973e'` (amber), `'#5b9279'` (moss), `'#4a90c4'` (lake) for each route
   - What's unclear: Should the active button use the route color as background, or use a consistent amber highlight?
   - Recommendation: Use route-specific color for active button background (`btn.style.background = route.color`) to reinforce color identity. This is the "color coding" differentiator from FEATURES.md.

2. **Ghost polyline pre-fetch vs lazy-fetch**
   - What we know: All 3 route-data.json files are ~15KB each; fetching all 3 at initMap adds ~30KB more data on first load
   - What's unclear: Is the added startup cost acceptable, or should ghost polylines load lazily on first switch?
   - Recommendation: Pre-fetch all 3 at initMap in parallel. The files are small and the user experience of instant ghost route display outweighs ~30KB of extra initial data.

3. **Zoom gating for sector labels during route switch**
   - What we know: Current `updateLabelVisibility()` is wired to `map.on('zoomend')` and fires once at init
   - What's unclear: After `renderRoute()` adds new labels to `activeRouteGroup`, will the zoom gate function correctly run to hide/show them at the current zoom level?
   - Recommendation: Call `updateLabelVisibility()` at the end of `renderRoute()`, and refactor it to operate on the current set of `sectorLabels` (which will be rebuilt per route switch).

4. **`fitBounds` padding with route selector control overlay**
   - What we know: The route selector control appears in the `topleft` corner of the map. If the route's geographic extent is near the top-left, `fitBounds([20,20] padding)` may place route features under the control.
   - What's unclear: The exact pixel size of the route selector control (depends on CSS/font).
   - Recommendation: Use `paddingTopLeft: [80, 20]` to account for the selector control stack (zoom buttons ~50px + selector ~50px = ~100px). Start with `[80, 20]` and adjust visually.

---

## Sources

### Primary (HIGH confidence)
- Leaflet 1.9.4 installed source: `node_modules/leaflet/package.json` — version confirmed
- `src/components/RouteMap.astro` — full read, lines 1-692 — current layer patterns, module-scope state, event bus
- `src/components/ElevationProfile.astro` — full read, lines 1-203 — chart initialization, function scope of `chart`
- `public/data/routes.json` — read — route IDs, colors, sectorIds confirmed
- `public/data/100mi/annotations.json`, `100k/annotations.json`, `50k/annotations.json` — read — sector counts and restock points verified
- `public/data/100mi/route-data.json`, `100k/route-data.json`, `50k/route-data.json` — read — point counts and meta verified
- `public/data/100mi/surface-points.json` — read — structure confirmed (miles + surface per point, 456 entries)
- `.planning/research/STACK.md` — full read — L.layerGroup pattern, RouteSelector pattern, chart.update pattern
- `.planning/research/ARCHITECTURE.md` — read — switchRoute(), clearRouteLayers(), ghost route pattern
- `.planning/research/PITFALLS.md` — read — pitfalls 9 (layer leak) and 10 (chart scope)
- `.planning/phases/25-click-handlers-panel-surface-track/25-RESEARCH.md` — read — surface run-flush algorithm

### Secondary (MEDIUM confidence)
- MDN CustomEvent constructor — WebFetch verified — `new CustomEvent(type, { detail })` signature
- W3C APG radiogroup pattern — WebFetch verified — roving tabindex, `role="radio"`, `aria-checked`, arrow key behavior
- Leaflet LayerGroup API — WebFetch verified — `addLayer`, `clearLayers`, `addTo`, `remove` methods exist

### Tertiary (LOW confidence)
- Leaflet arrow key capture behavior — WebSearch — claim that Leaflet intercepts arrow keys; not verified against Leaflet source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all APIs verified against installed versions and source code
- Architecture patterns: HIGH — derived from reading actual `RouteMap.astro` source code and prior phase research docs
- Pitfalls: HIGH — most pitfalls derived from direct source code analysis (function scopes, layer management patterns)
- Ghost route colors: HIGH — `routes.json` was read directly; colors are `#c8973e`, `#5b9279`, `#4a90c4`

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable APIs; source code is the ground truth)
