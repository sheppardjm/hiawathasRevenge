# Phase 5: Map-Elevation Sync - Research

**Researched:** 2026-03-30
**Domain:** Chart.js ↔ Leaflet cross-component event sync, chartjs-plugin-annotation bands, Leaflet polyline sector overlays
**Confidence:** HIGH

---

## Summary

Phase 5 wires two already-built island components (RouteMap.astro + ElevationProfile.astro) together with three distinct features: (1) a bike icon crosshair on the map that tracks the cursor position on the elevation chart, (2) color-coded gravel sector polyline overlays on the map, and (3) matching color-coded band overlays on the elevation chart.

The standard approach is a `window`-scoped `CustomEvent` bus — ElevationProfile dispatches `elevation:hover` with `detail.miles`, RouteMap listens and converts miles to a GPS coordinate via the route-data.json `points` array, then calls `marker.setLatLng()` to move the bike icon. No third-party pub/sub library is needed; native browser `CustomEvent` is the right tool for Astro multi-script islands. chartjs-plugin-annotation 3.1.0 (already installed, not yet registered) handles the chart sector bands as `box` annotations with `xMin`/`xMax` keyed to the mile values in annotations.json. Leaflet sector polylines are built from `routeData.points.slice(startIdx, endIdx)` using sector `startIdx`/`endIdx` fields already present in annotations.json.

The most important pitfall is init-order: both islands lazy-load independently via different strategies. The event listener in RouteMap must be registered before the chart fires its first `elevation:hover` — accomplished by attaching the listener at the outermost scope of the RouteMap script (not inside `initMap()`).

**Primary recommendation:** Use `window.dispatchEvent` / `window.addEventListener` as the event bus. No shared state object, no framework. Attach the window listener in RouteMap's script at module scope so it survives regardless of whether initMap() has finished.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Browser `CustomEvent` | Native (all browsers) | Cross-component event bus | No dependencies; Astro docs pattern for multi-script communication |
| `chartjs-plugin-annotation` | 3.1.0 (already installed) | Box + line annotations on Chart.js | Already installed; official Chart.js plugin; supports `box` type for sector bands |
| Leaflet `L.polyline` | (Leaflet already installed) | Gravel sector polylines on map | Already imported via dynamic import; slice route points by `startIdx`/`endIdx` |
| Leaflet `L.marker` + `L.divIcon` | (Leaflet already installed) | Bike icon crosshair marker | `divIcon` supports inline SVG or HTML without external image files |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Chart.helpers.getRelativePosition` | chart.js 4.5.1 | Convert mousemove pixel → canvas-relative coords | Required before `chart.scales.x.getValueForPixel()` |
| `chart.scales.x.getValueForPixel` | chart.js 4.5.1 | Canvas pixel → data value (miles) | Called inside the Chart.js `onHover` callback |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `CustomEvent` on `window` | Shared module state / global variable | Global variable is simpler but can't survive Astro script isolation; CustomEvent is idiomatic |
| `box` annotation for sector bands | `line` annotation pair (start + end) | `box` annotation auto-expands to full chart height when yMin/yMax omitted — cleaner |
| `L.divIcon` with inline SVG | `L.icon` with image URL | divIcon requires no `/public` asset; SVG can be embedded directly in `html` string |
| chartjs-plugin-crosshair (npm) | chartjs-plugin-annotation line | crosshair plugin is less maintained; annotation plugin already installed and compatible |

**Installation:** No new packages needed. `chartjs-plugin-annotation@3.1.0` and all Leaflet dependencies are already installed. This phase is pure configuration + event wiring.

---

## Architecture Patterns

### Recommended File Structure
No new files needed. Both existing components are modified:
```
src/components/
├── ElevationProfile.astro   # Add: annotation registration, box bands, onHover dispatch
└── RouteMap.astro            # Add: window listener, bike marker, sector polylines
public/data/
└── annotations.json          # Already exists — 7 sectors (startIdx/endIdx/startMile/endMile) + 2 restock
```

### Pattern 1: Window CustomEvent Bus
**What:** ElevationProfile fires `elevation:hover` with `{miles}` on every mousemove; RouteMap listens on `window` and updates the marker position.
**When to use:** Two Astro script islands on the same page that need to communicate without a shared import.

```javascript
// ElevationProfile.astro — inside the onHover chart option callback:
// Source: MDN CustomEvent API + Astro docs (client-side scripts pattern)
onHover(event, _activeElements, chart) {
  const pos = Chart.helpers.getRelativePosition(event, chart);
  const miles = chart.scales.x.getValueForPixel(pos.x);
  if (miles == null) return;
  window.dispatchEvent(new CustomEvent('elevation:hover', { detail: { miles } }));
}

// RouteMap.astro — at module scope (OUTSIDE initMap()), registered immediately:
window.addEventListener('elevation:hover', (e) => {
  const { miles } = e.detail;
  if (!bikeMarker || !routePoints) return;
  const nearest = snapByMiles(routePoints, miles);
  bikeMarker.setLatLng([nearest.lat, nearest.lon]);
  if (!bikeMarker._map) bikeMarker.addTo(map);
});
```

**Critical detail:** The listener must be registered at module scope (not inside `initMap()`). `initMap()` runs asynchronously after the first scroll event. If the user mouses over the chart before scrolling the map into view, the event fires but no listener exists yet. Attaching at module scope ensures the listener is always live, but the handler guards with `if (!bikeMarker)` for the pre-init window.

### Pattern 2: snapByMiles Helper (Reuse from Phase 2 Pattern)
**What:** Given a target `miles` value and the `routeData.points` array, find the point with the minimum absolute difference in `miles`.
**When to use:** Both for the crosshair sync and for sector snapping verification.

```javascript
// Source: annotations.json generation pattern (02-02-PLAN.md)
function snapByMiles(points, targetMiles) {
  let best = points[0];
  let bestDiff = Math.abs(points[0].miles - targetMiles);
  for (const pt of points) {
    const diff = Math.abs(pt.miles - targetMiles);
    if (diff < bestDiff) { bestDiff = diff; best = pt; }
  }
  return best;
}
```

This is O(n) over 456 points — fast enough for mousemove (no need to binary search).

### Pattern 3: Bike Icon Crosshair via L.divIcon
**What:** Create an inline-SVG marker for the bike crosshair. Use `L.marker` + `L.divIcon`. Keep the marker hidden initially (not added to map), add it on first hover.
**When to use:** When the crosshair should appear only during active hover, not on map load.

```javascript
// Source: Leaflet docs L.divIcon + L.marker API
const bikeIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <!-- bike/cycle SVG path here -->
  </svg>`,
  className: '',          // '' removes default leaflet-div-icon white box
  iconSize: [24, 24],
  iconAnchor: [12, 12]    // center the icon on the coordinate
});

// Create but don't add to map yet
let bikeMarker = L.marker([0, 0], {
  icon: bikeIcon,
  interactive: false,   // no click events on the crosshair
  keyboard: false,
  zIndexOffset: 1000    // draw above route polyline
});
let routePoints = null; // set after fetch in initMap()
```

### Pattern 4: Gravel Sector Polylines on Map
**What:** For each sector annotation, create a `L.polyline` from `routeData.points.slice(startIdx, endIdx + 1)`, styled with a sector color.
**When to use:** Inside `initMap()` after route data is fetched — sectors are drawn on top of the main route polyline.

```javascript
// Source: Leaflet docs L.polyline, annotations.json schema
const SECTOR_COLORS = {
  'sector-520':          '#e67e22',   // orange
  'sector-nf2266':       '#e74c3c',   // red
  'sector-bass-lake':    '#9b59b6',   // purple
  'sector-nf2217':       '#e74c3c',   // red
  'sector-nd2225':       '#e67e22',   // orange
  'sector-doe-lake':     '#9b59b6',   // purple
  'sector-rapid-river':  '#e74c3c',   // red
};

const annotations = await fetch('/data/annotations.json').then(r => r.json());
const sectors = annotations.filter(a => a.type === 'sector');

for (const sector of sectors) {
  const pts = latlngs.slice(sector.startIdx, sector.endIdx + 1);
  L.polyline(pts, {
    color: SECTOR_COLORS[sector.id] || '#e67e22',
    weight: 5,
    opacity: 0.85
  }).addTo(map);
}
```

### Pattern 5: chartjs-plugin-annotation Box Bands on Chart
**What:** Register the annotation plugin in ElevationProfile's `initChart()` and add a `box` annotation for each sector. `xMin`/`xMax` are sector `startMile`/`endMile`. Omit `yMin`/`yMax` for full-height bands.
**When to use:** Inside `initChart()` after annotations.json is fetched.

```javascript
// Source: chartjs-plugin-annotation 3.1.0 docs — integration + box type
import annotationPlugin from 'chartjs-plugin-annotation';
Chart.register(/* existing imports */ annotationPlugin);

// Build annotations object from sectors
const annotations = await fetch('/data/annotations.json').then(r => r.json());
const sectors = annotations.filter(a => a.type === 'sector');
const sectorAnnotations = {};
for (const sector of sectors) {
  sectorAnnotations[sector.id] = {
    type: 'box',
    xMin: sector.startMile,
    xMax: sector.endMile,
    // yMin/yMax omitted → expands to full chart height automatically
    backgroundColor: `${SECTOR_COLORS[sector.id]}26`,  // color at 15% opacity
    borderWidth: 0,
    drawTime: 'beforeDatasetsDraw'   // render behind the line
  };
}

// Chart config:
options: {
  plugins: {
    annotation: { annotations: sectorAnnotations }
  }
}
```

**Registration:** `import annotationPlugin from 'chartjs-plugin-annotation'` inside the dynamic import block, added to `Chart.register(...)`. This plugin was installed in Phase 4 specifically for this phase.

### Pattern 6: Crosshair Line Annotation on Chart (Optional Enhancement)
**What:** A vertical `line` annotation that moves with the mouse to provide a visual cursor on the chart itself (in addition to moving the map marker).
**When to use:** If ELEV-03 requires a visual cursor on the chart, not just map sync.

```javascript
// Dynamic crosshair line annotation — starts hidden, display toggled on hover
crosshair: {
  type: 'line',
  xMin: 0,
  xMax: 0,
  display: false,       // hidden until first hover
  borderColor: 'rgba(200,151,62,0.6)',
  borderWidth: 1,
  borderDash: [4, 4]
}

// Inside onHover:
chart.options.plugins.annotation.annotations.crosshair.xMin = miles;
chart.options.plugins.annotation.annotations.crosshair.xMax = miles;
chart.options.plugins.annotation.annotations.crosshair.display = true;
chart.update('none');   // 'none' = no animation, instant redraw
```

### Anti-Patterns to Avoid
- **Listening for `elevation:hover` inside `initMap()`:** initMap runs async on first scroll. If the user hovers the chart first, the listener doesn't exist yet. Register listeners at module scope.
- **Using array index for crosshair lookup instead of miles:** If the elevation chart's LTTB decimation changes the displayed point count, array-index sync breaks. Always use `miles` as the sync key.
- **Calling `chart.update()` without mode `'none'` on every mousemove:** Without `'none'`, Chart.js animates each update, causing visual judder on rapid mouse movement. Always pass `'none'` for crosshair updates.
- **Setting `className: 'leaflet-div-icon'` on divIcon:** The default class adds a white box background with a border. Pass `className: ''` to strip all default styling.
- **Creating bikeMarker inside `initMap()` and referencing from window listener:** The window listener fires before `initMap()` completes. Guard with `if (!bikeMarker || !routePoints) return;` in the listener.
- **Re-registering Chart.js plugins:** `Chart.register()` is global and idempotent, but calling it multiple times in fast succession can produce console warnings. Register once per `initChart()` call.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pixel-to-miles conversion | Custom canvas measurement math | `Chart.helpers.getRelativePosition` + `chart.scales.x.getValueForPixel` | Chart.js accounts for chart padding, device pixel ratio, and scale margins |
| Sector band overlays on chart | Manual canvas `fillRect` drawing | `chartjs-plugin-annotation` `box` type | Plugin handles redraw on resize, animation, and z-ordering |
| Route nearest-point lookup | Geospatial distance formula (Haversine) | Linear scan over `pt.miles` | Data is already indexed by cumulative mileage; no need for GPS distance math |
| Cross-component state | Shared JS module or global object | `CustomEvent` on `window` | Astro script isolation means modules don't share state across component scripts |

**Key insight:** The route data already has `miles` as a denormalized cumulative field and sectors already have `startIdx`/`endIdx`. There's no need to compute any distances or coordinates at runtime — just index into the existing arrays.

---

## Common Pitfalls

### Pitfall 1: Listener Registered Inside Async Init
**What goes wrong:** The `window.addEventListener('elevation:hover', ...)` call is placed inside the `async initMap()` function, which only executes after the user scrolls. If the user hovers the chart before scrolling, events fire to no listener.
**Why it happens:** Natural tendency to put all map-related code inside `initMap()`.
**How to avoid:** Register the listener at module scope (outside `initMap()`). Guard the handler body: `if (!bikeMarker || !routePoints) return;`.
**Warning signs:** Crosshair works only after scrolling past the map, not on first hover.

### Pitfall 2: chart.update() Animation Lag on Mousemove
**What goes wrong:** The crosshair line annotation jumps or jitters during fast mouse movement because Chart.js default update mode plays a transition animation per update.
**Why it happens:** `chart.update()` with no mode argument uses the configured animation.
**How to avoid:** Always call `chart.update('none')` for hover-driven updates.
**Warning signs:** Visual lag or stuttering of the crosshair line as the mouse moves.

### Pitfall 3: divIcon White Box Appearance
**What goes wrong:** The bike marker appears inside a white rectangle with a border.
**Why it happens:** Leaflet's `L.divIcon` adds `leaflet-div-icon` class by default which has white background and border in leaflet.css.
**How to avoid:** Set `className: ''` (empty string) in the `L.divIcon` options.
**Warning signs:** White box visible around the bike icon on the map.

### Pitfall 4: Sector Polyline Index Off-By-One
**What goes wrong:** The sector polyline ends one point short of the sector endpoint, leaving a gap between the sector overlay and the main route.
**Why it happens:** `slice(startIdx, endIdx)` excludes `endIdx`. The polyline needs the point AT `endIdx`.
**How to avoid:** Use `slice(startIdx, endIdx + 1)` when building sector point arrays.
**Warning signs:** Visible gaps at sector boundaries between the colored sector line and the grey route line.

### Pitfall 5: annotationPlugin Not Registered Before Chart Init
**What goes wrong:** `TypeError: Cannot read properties of undefined (reading 'annotations')` or annotations silently absent.
**Why it happens:** chartjs-plugin-annotation was installed in Phase 4 but registration was explicitly deferred. It is not registered in ElevationProfile.astro yet.
**How to avoid:** Add `import annotationPlugin from 'chartjs-plugin-annotation'` to the dynamic import block and include it in `Chart.register(...)` before creating the Chart instance.
**Warning signs:** No sector bands on the chart; no error (Chart.js silently ignores unregistered plugin options).

### Pitfall 6: miles Out-of-Range from getValueForPixel
**What goes wrong:** Near the chart edges, `getValueForPixel` can return values outside `[0, totalMiles]` range (e.g., negative or above 101.98). The `snapByMiles` scan then returns the first or last point, causing the bike marker to snap to the route start/end unexpectedly.
**Why it happens:** Mouse events fire slightly outside the data domain near axis labels.
**How to avoid:** Clamp: `const clamped = Math.max(0, Math.min(101.98, miles))` before dispatch. Or omit dispatch entirely when miles is outside `[0, totalMiles]`.
**Warning signs:** Bike icon snaps to the route start or end when hovering over chart axis labels.

---

## Code Examples

Verified patterns from official sources:

### CustomEvent Dispatch (ElevationProfile → Window)
```javascript
// Source: MDN CustomEvent API https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
// Inside Chart.js onHover callback:
onHover(event, _activeElements, chart) {
  const pos = Chart.helpers.getRelativePosition(event, chart);
  const miles = chart.scales.x.getValueForPixel(pos.x);
  if (miles == null) return;
  window.dispatchEvent(new CustomEvent('elevation:hover', {
    detail: { miles: Math.max(0, Math.min(101.98, miles)) }
  }));
}
```

### CustomEvent Listener (Window → RouteMap)
```javascript
// Source: MDN CustomEvent API, Leaflet marker.setLatLng docs
// At module scope in RouteMap script block (outside initMap):
let bikeMarker = null;
let routePoints = null;
let leafletMap = null;

window.addEventListener('elevation:hover', (e) => {
  if (!bikeMarker || !routePoints || !leafletMap) return;
  const { miles } = e.detail;
  const pt = snapByMiles(routePoints, miles);
  bikeMarker.setLatLng([pt.lat, pt.lon]);
  if (!bikeMarker._map) bikeMarker.addTo(leafletMap);
});
```

### chartjs-plugin-annotation Registration
```javascript
// Source: chartjs-plugin-annotation 3.1.0 docs https://www.chartjs.org/chartjs-plugin-annotation/3.1.0/guide/integration.html
// Inside initChart() dynamic import block:
const {
  Chart,
  LineController,
  // ... existing imports ...
} = await import('chart.js');
const { default: annotationPlugin } = await import('chartjs-plugin-annotation');

Chart.register(LineController, LineElement, PointElement, LinearScale, Filler, Tooltip, Decimation, annotationPlugin);
```

### Box Annotation (Full-Height Sector Band)
```javascript
// Source: chartjs-plugin-annotation 3.1.0 docs https://www.chartjs.org/chartjs-plugin-annotation/3.1.0/guide/types/box.html
// Omitting yMin/yMax expands band to full chart height
{
  type: 'box',
  xMin: sector.startMile,   // e.g., 1.1
  xMax: sector.endMile,     // e.g., 2.4
  // yMin and yMax intentionally omitted — auto-expands to full height
  backgroundColor: 'rgba(230, 126, 34, 0.15)',
  borderWidth: 0,
  drawTime: 'beforeDatasetsDraw'
}
```

### Dynamic Crosshair Line Update
```javascript
// Source: chartjs-plugin-annotation 3.1.0 + Chart.js 4 update API
// Modify annotation directly and call chart.update('none') — no animation
chart.options.plugins.annotation.annotations.crosshair.xMin = miles;
chart.options.plugins.annotation.annotations.crosshair.xMax = miles;
chart.options.plugins.annotation.annotations.crosshair.display = true;
chart.update('none');   // REQUIRED: 'none' prevents animation lag on rapid mousemove
```

### Leaflet Sector Polyline from Index Slice
```javascript
// Source: Leaflet L.polyline docs https://leafletjs.com/reference.html#polyline
const latlngs = routeData.points.map(pt => [pt.lat, pt.lon]);
// sector.startIdx and sector.endIdx come from annotations.json
const sectorPts = latlngs.slice(sector.startIdx, sector.endIdx + 1); // +1: slice end is exclusive
L.polyline(sectorPts, { color: '#e67e22', weight: 5, opacity: 0.85 }).addTo(map);
```

### L.divIcon Bike Marker (No White Box)
```javascript
// Source: Leaflet L.divIcon docs https://leafletjs.com/reference.html#divicon
const bikeIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
    fill="none" stroke="#c8973e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- bike SVG paths -->
  </svg>`,
  className: '',         // REQUIRED: '' removes default white box + border from leaflet.css
  iconSize: [28, 28],
  iconAnchor: [14, 14]   // center of the icon sits on the coordinate
});
```

---

## Data Shape Reference

Already-verified from codebase:

**route-data.json points shape:**
```json
{ "lat": 46.36447, "lon": -86.71411, "ele": 261.9, "miles": 0 }
```
456 points total, miles range 0–101.98.

**annotations.json sector shape:**
```json
{
  "id": "sector-520", "type": "sector", "name": "520",
  "startMile": 1.1, "endMile": 2.4, "lengthMiles": 1.3,
  "startLat": 46.35686, "startLon": -86.73175,
  "endLat": 46.34027, "endLon": -86.74124,
  "startIdx": 5, "endIdx": 14
}
```
7 sectors, indices valid (startIdx < endIdx verified).

**Key implication:** `startIdx`/`endIdx` directly index `routeData.points` — no lookup needed, just `slice`.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| chartjs-plugin-annotation array syntax | Object with named keys | v2.0 (annotation plugin) | Enables direct property mutation: `annotations.crosshair.xMin = value` |
| Calling `chart.update()` | `chart.update('none')` for programmatic updates | Chart.js 3+ | 'none' mode skips animation — critical for 60fps mousemove performance |
| `L.icon` with image file | `L.divIcon` with inline SVG/HTML | Leaflet 1.x+ | No asset needed; SVG can be themed with CSS vars or inline style |

**Deprecated/outdated:**
- chartjs-plugin-annotation annotation array format: Pre-v2 syntax. v3.1.0 requires object with named keys (object approach).

---

## Open Questions

1. **Bike icon SVG source**
   - What we know: `L.divIcon` accepts inline SVG string. The project uses an amber/forest color palette.
   - What's unclear: Which specific bicycle SVG icon to use — Heroicons, Lucide, or custom. A simple circle (as "you are here" dot) would also work for crosshair.
   - Recommendation: Use a simple circle dot (4 lines of SVG) as the crosshair. Avoids bike SVG licensing questions and is visually cleaner. The roadmap says "bike icon" but a styled circle dot is equivalent functionally. Planner should decide.

2. **Number of sector difficulty tiers vs. individual sector colors**
   - What we know: The 7 sectors are named (520, NF2266, Bass Lake, etc.) but annotations.json has no `difficulty` field — just `type: "sector"`.
   - What's unclear: Whether color should map to difficulty (easy/medium/hard) or just use a single accent color for all gravel sectors.
   - Recommendation: Use a single gravel-sector color (e.g., amber-500 `#c8973e`) for all sectors to match the project's existing design tokens. This keeps the color palette consistent and avoids inventing difficulty data that doesn't exist in annotations.json.

3. **map:reset event for clearing the bike marker**
   - What we know: The roadmap plans list `map:reset` as a custom event alongside `elevation:hover`.
   - What's unclear: What exactly triggers `map:reset` — does it mean "mouse leaves the chart" (remove marker) or "reset button clicked"?
   - Recommendation: Listen for `mouseleave` on the chart canvas and dispatch `elevation:leave` (or use the chart's `onLeave` option). RouteMap listens and calls `bikeMarker.remove()`. The map reset button already resets the view — no need to use `map:reset` for that. Planner should clarify if `map:reset` is a separate event.

---

## Sources

### Primary (HIGH confidence)
- Leaflet reference docs `https://leafletjs.com/reference.html` — Marker, Polyline, divIcon APIs
- chartjs-plugin-annotation 3.1.0 docs `https://www.chartjs.org/chartjs-plugin-annotation/3.1.0/guide/` — box type, line type, integration, configuration
- Chart.js 4.4.0 interactions docs `https://www.chartjs.org/docs/4.4.0/configuration/interactions.html` — onHover callback, getRelativePosition, getValueForPixel
- MDN CustomEvent API `https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent` — constructor, detail, dispatch pattern
- Codebase (read directly) — annotations.json schema (7 sectors with startIdx/endIdx), route-data.json shape (456 pts), ElevationProfile.astro, RouteMap.astro

### Secondary (MEDIUM confidence)
- chartjs-plugin-annotation GitHub issues #423 (verified): Direct mutation of `chart.options.plugins.annotation.annotations[key].xMin` + `chart.update('none')` is the documented runtime update pattern
- chartjs-plugin-annotation 3.1.0 configuration page: `enter`/`leave` event callbacks on annotations + auto-rerender with explicit `return true`

### Tertiary (LOW confidence)
- WebSearch results on Astro CustomEvent patterns — consistent with MDN docs, treating as MEDIUM confidence
- WebSearch on Leaflet divIcon className stripping — consistent with Leaflet docs, treating as HIGH confidence

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries verified via official docs; no new installs needed
- Architecture: HIGH — CustomEvent pattern verified against MDN + Astro docs; annotation API verified against v3.1.0 docs
- Pitfalls: HIGH — init-order and animation-mode pitfalls verified against Chart.js + Leaflet APIs; divIcon className verified against Leaflet CSS behavior
- Data shapes: HIGH — Read directly from codebase

**Research date:** 2026-03-30
**Valid until:** 2026-09-30 (stable libraries, annotation API unlikely to change in minor versions)
