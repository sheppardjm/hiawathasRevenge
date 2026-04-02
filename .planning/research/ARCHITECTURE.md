# Architecture Research: v1.3 Map Interactivity

**Domain:** Sector labels, click handlers, and slide-out/bottom-sheet panels on an existing Leaflet + Astro 6 static site
**Researched:** 2026-04-02
**Confidence:** HIGH — based on direct analysis of all source files, verified Leaflet 1.9.4 docs, and first-principles reasoning from the shipped v1.2 architecture

---

## Executive Summary

v1.3 "Map Interactivity" adds three tightly coupled UI capabilities to the existing map: permanent sector labels on the map surface, click handlers that fire when a user clicks any sector polyline, and a responsive detail panel (right slide-out on desktop, bottom sheet on mobile) that shows sector content.

The critical architectural question is how to get build-time content (sector descriptions from RouteExplainer, star ratings, surface types) into a purely client-side panel that is assembled after lazy-init. The answer: **bake sector data into a JSON file at build time, fetch it client-side in initMap() alongside the existing annotations.json fetch, and render panel HTML from that data using the same module-scope pattern already used for bikeMarker and routePoints.**

Nothing in v1.3 requires SSR, a new build step, or touching the CustomEvent bus wiring for elevation sync. The feature is implemented as:

1. A new build-time JSON (`sector-details.json`) carrying all panel content
2. New markup in RouteMap.astro's HTML template (panel overlay, not a separate Astro component)
3. Extensions to the existing `initMap()` function to register L.tooltip labels and polyline click handlers
4. Pure CSS panel transitions (translate + opacity) using the existing Tailwind token system
5. One new CustomEvent (`map:sectorClick`) to allow future cross-component coordination

The most important constraint: **all code that touches Leaflet must live inside `initMap()`**, because `window.L` and the map instance are only available after lazy-init completes. Sector labels and click handlers cannot be registered at module scope.

---

## System Overview

### ASCII Data and Event Flow

```
BUILD TIME
──────────────────────────────────────────────────────────────────────
scripts/resolve-annotations.js
  (unchanged — produces annotations.json with sector coords/indices)

scripts/compute-sector-elevations.js
  (unchanged — produces sector-elevations.json)

[NEW] scripts/generate-sector-details.js
  Reads: RouteExplainer.astro SEGMENTS array (or a new sectors-source.json)
  Writes: public/data/sector-details.json
  Shape: [ { id, name, difficulty, stars, startMile, endMile,
             lengthMiles, description, stravaId, surfaceType } ]

pipeline.js
  Step N+1: generate-sector-details  ← NEW step added to pipeline


RUNTIME — initMap() execution (after lazy-init triggers)
──────────────────────────────────────────────────────────────────────

      fetch('/data/annotations.json')   fetch('/data/sector-details.json')
               │                                    │
               ▼                                    ▼
        sectors[]                           sectorDetails{}
     (coords, difficulty)              (description, stars, etc.)
               │                                    │
               └─────────────┬──────────────────────┘
                             ▼
                   for each sector:
                     L.polyline(sectorPts) ──► .on('click', handler)
                                          ──► .on('mouseover', highlight)
                                          ──► .on('mouseout', unhighlight)
                     L.tooltip(midpointLatLng, {permanent:true})
                       .setContent(labelHTML)
                       .addTo(map)


USER ACTION — click on sector polyline
──────────────────────────────────────────────────────────────────────

  polyline.on('click')
       │
       ▼
  openSectorPanel(sectorId)
       │
       ├── Looks up sectorDetails[sectorId]
       ├── Looks up sectorElevData[sectorId]  (from sector-elevations.json)
       ├── Renders panel HTML (name, stars, description, sparkline SVG URL)
       ├── Sets panel visibility class → CSS transition plays
       ├── window.dispatchEvent(new CustomEvent('map:sectorClick',
       │     { detail: { sectorId } }))
       └── Traps focus inside panel (a11y)


USER ACTION — close panel (X button or Escape key)
──────────────────────────────────────────────────────────────────────

  closeSectorPanel()
       │
       ├── Removes visibility class → CSS reverse transition
       └── Returns focus to map (a11y)


EXISTING EVENT BUS — UNCHANGED
──────────────────────────────────────────────────────────────────────

  ElevationProfile ──elevation:hover──► RouteMap (bikeMarker)
  ElevationProfile ──elevation:leave──► RouteMap (bikeMarker hide)
  RouteMap         ──map:photoClick──► PhotoGallery (lightbox open)
  RouteMap         ──map:sectorClick──► (new, no current listener)
```

---

## Component Responsibilities

### Modified Components

| Component | Modification | Why |
|-----------|-------------|-----|
| `RouteMap.astro` | Add panel HTML template to the component's HTML block; extend `initMap()` with label + click handler registration | All Leaflet code must be co-located with `initMap()` due to lazy-init; panel DOM must be in page before JS runs |
| `pipeline.js` | Add `generate-sector-details` as a new pipeline step before `build` | Sector detail JSON must exist before Astro build reads it |

### New Files

| File | Type | Purpose |
|------|------|---------|
| `scripts/generate-sector-details.js` | Build script | Reads sector content from a source (see below), writes `public/data/sector-details.json` |
| `public/data/sector-details.json` | Data | Panel content keyed by sector id, consumed by `initMap()` at runtime |

### Unchanged Components

| Component | Reason |
|-----------|--------|
| `ElevationProfile.astro` | No changes to chart; elevation sync not affected by panel |
| `PhotoGallery.astro` | No changes; `map:photoClick` event flow unchanged |
| `content.config.ts` | No new Astro content collections needed (sector-details.json is fetch-only) |
| `ElevationSparkline.astro` | Build-time SVGs already exist; panel uses inline SVG strings from sector-elevations.json data, not the Astro component |
| `BaseLayout.astro` | No structural changes needed |
| `index.astro` | No changes; panel overlay is scoped to RouteMap.astro |

---

## Recommended Project Structure

```
src/components/
  RouteMap.astro          ← MODIFY: add panel HTML + extend initMap()

scripts/
  generate-sector-details.js   ← NEW: build-time sector content generator
  resolve-annotations.js       (unchanged)
  compute-sector-elevations.js (unchanged)
  pipeline.js                  ← MODIFY: add generate-sector-details step

public/data/
  sector-details.json     ← NEW: generated panel content
  annotations.json        (unchanged)
  sector-elevations.json  (unchanged)
  route-data.json         (unchanged)
```

**No new Astro components.** The panel is HTML inside RouteMap.astro's template, styled with scoped `<style>` and driven by JavaScript inside the component's `<script>` block. This matches the existing pattern for the map reset button control and the photo cluster group — both live inside RouteMap.astro rather than as separate components.

---

## Architectural Patterns

### Pattern 1: Sector Details JSON (Build-Time Data Pipeline)

**What:** A new script `generate-sector-details.js` exports sector content as a static JSON file fetched at runtime.

**Why:** The panel needs detailed descriptions, star ratings, surface types, and Strava IDs. This content currently lives in RouteExplainer.astro as a hardcoded `SEGMENTS` array. Duplicating it inside `initMap()` creates two sources of truth. The correct solution is to extract the content into a shared source: a `sectors-source.json` config file that both `generate-sector-details.js` and RouteExplainer.astro read at build time.

**Shape of `sector-details.json`:**
```json
[
  {
    "id": "sector-nf2266",
    "name": "NF2266",
    "difficulty": "moderate",
    "stars": 5,
    "startMile": 6.7,
    "endMile": 9.9,
    "lengthMiles": 3.2,
    "description": "The route's crucible...",
    "stravaId": "28533671",
    "surfaceType": "deteriorating sand and gravel two-track"
  }
]
```

**Confidence:** HIGH — matches the established pattern of annotations.json and sector-elevations.json (build-time scripts producing fetch-time JSON).

### Pattern 2: Permanent Tooltip Labels via Standalone L.tooltip()

**What:** For each sector, create a standalone `L.tooltip()` positioned at the geographic midpoint of the sector polyline with `{ permanent: true, direction: 'center', className: 'sector-label' }`.

**Why not `bindTooltip()` on the polyline:** `bindTooltip()` positions the tooltip at the mouse cursor by default (or at a fixed offset from the polyline), which is unsuitable for permanent labels that should float above the midpoint. Standalone tooltips with `setLatLng()` allow precise placement at a computed midpoint.

**Midpoint calculation:**
```javascript
// Inside initMap(), after creating the sector polyline:
const midIdx = Math.floor(sectorPts.length / 2);
const midLatLng = sectorPts[midIdx]; // already [lat, lon] array

const label = L.tooltip({
  permanent: true,
  direction: 'center',
  className: 'sector-label',
  interactive: false,
  offset: [0, 0]
})
  .setLatLng(midLatLng)
  .setContent(labelHTML(sector, detail))
  .addTo(map);
```

**Label HTML:** A small `<div>` with the sector name and a star rating bar, rendered as an HTML string. Use inline style referencing CSS custom properties (which work in Leaflet tooltip DOM since it is in-document). Example:
```javascript
function labelHTML(sector, detail) {
  const stars = '★'.repeat(detail.stars) + '☆'.repeat(5 - detail.stars);
  return `<span class="sector-label-name">${sector.name}</span>
          <span class="sector-label-stars" data-diff="${sector.difficulty}">${stars}</span>`;
}
```

**Confidence:** HIGH — confirmed via Leaflet 1.9.4 official docs that `L.tooltip` accepts `latlng` constructor signature and has `setLatLng()` from DivOverlay inheritance.

### Pattern 3: Polyline Click Handlers

**What:** Each sector `L.polyline` registers `click`, `mouseover`, and `mouseout` handlers directly on the Leaflet layer, matching the pattern already used for photo markers.

```javascript
// Inside the sector loop in initMap():
const polyline = L.polyline(sectorPts, { ... }).addTo(map);

polyline.on('click', () => {
  openSectorPanel(sector.id, sectorDetailsMap, sectorElevMap);
});
polyline.on('mouseover', () => {
  polyline.setStyle({ weight: 7, opacity: 1 });
});
polyline.on('mouseout', () => {
  polyline.setStyle({ weight: 5, opacity: 0.85 });
});
```

**Interactive polylines require `interactive: true`** (Leaflet default). Do not set `interactive: false` on sector polylines (currently they have no interactive option set, which defaults to true — this is already correct).

**Confidence:** HIGH — matches existing photo marker `.on('click', ...)` pattern in RouteMap.astro.

### Pattern 4: Panel Overlay in RouteMap.astro HTML Block

**What:** The panel is a `<div>` rendered directly in RouteMap.astro's HTML template, positioned absolutely relative to the map container. The map container needs `position: relative` (already set via `.route-map { position: relative; }`).

```html
<!-- In RouteMap.astro HTML block, after <div id="map"> -->
<div id="sector-panel" class="sector-panel" aria-hidden="true" role="dialog" 
     aria-modal="true" aria-label="Sector details">
  <button id="sector-panel-close" class="sector-panel-close" 
          aria-label="Close sector details">&#x2715;</button>
  <div id="sector-panel-content" class="sector-panel-content"></div>
</div>
```

**Why not a separate Astro component:** The panel must be in the same component as the `initMap()` script because `openSectorPanel()` directly manipulates panel DOM. Astro component isolation makes cross-component DOM manipulation brittle (Astro scoped class names). Keeping the panel co-located with the map is the correct pattern — it mirrors how ResetControl HTML is defined inside the same component.

### Pattern 5: CSS-Only Panel Transitions

**What:** Panel visibility is controlled by toggling a CSS class on the panel element. No inline style manipulation from JavaScript.

```css
/* In RouteMap.astro <style> block */
.sector-panel {
  position: absolute;
  z-index: 1000;      /* above map tiles but below Leaflet controls (1001) */
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background: var(--color-forest-900);
  border-left: 1px solid var(--color-forest-700);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
}

.sector-panel.is-open {
  transform: translateX(0);
}

/* Mobile: bottom sheet */
@media (max-width: 640px) {
  .sector-panel {
    top: auto;
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    height: 60%;
    border-left: none;
    border-top: 1px solid var(--color-forest-700);
    transform: translateY(100%);
  }
  .sector-panel.is-open {
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sector-panel { transition: none; }
}
```

**Why CSS transitions, not JS animation:** Matches the existing animation philosophy (AnimatedDivider, ScrollReveal all use CSS transitions). Respects `prefers-reduced-motion` with a single media query.

### Pattern 6: Panel Content Rendering (Inline SVG Sparkline)

**What:** The panel content function receives a merged `detail` object (from sector-details.json) and `elevData` object (from sector-elevations.json, already fetched in a potential initMap() addition). It renders an HTML string using the same data used by `ElevationSparkline.astro` at build time.

**The sparkline problem:** `ElevationSparkline.astro` is a build-time Astro component; it cannot be invoked at runtime. The panel must replicate a simplified version of the sparkline SVG path computation in JavaScript, or fetch a pre-rendered SVG string.

**Recommended approach:** Replicate the sparkline math in a small `buildSparklineSVG(elevData)` helper function inside initMap(). The math is ~20 lines and is already fully documented in `ElevationSparkline.astro`. This avoids any new fetch or build complexity.

```javascript
function buildSparklineSVG(elevData, strokeColor) {
  const pts = elevData.elevationPoints;
  const eles = pts.map(p => p.ele);
  const miles = pts.map(p => p.miles);
  const eleMin = Math.min(...eles), eleMax = Math.max(...eles);
  const eleRange = eleMax - eleMin || 1;
  const milesRange = (miles[miles.length-1] - miles[0]) || 1;
  const W = 100, H = 50, pad = 4, drawH = H - 2 * pad;
  const computed = pts.map(p => ({
    x: +((p.miles - miles[0]) / milesRange * W).toFixed(1),
    y: +((H - pad) - ((p.ele - eleMin) / eleRange * drawH)).toFixed(1)
  }));
  const polyPts = computed.map(p => `${p.x},${p.y}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" aria-hidden="true">
    <rect x="0" y="0" width="${W}" height="${H}" rx="3" fill="var(--color-forest-900)" opacity="0.6"/>
    <polyline points="${polyPts}" stroke="${strokeColor}" stroke-width="2.5" fill="none"
      stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}
```

**Confidence:** HIGH — this is a direct port of ElevationSparkline.astro logic, already verified in production.

### Pattern 7: module-scope sectorDetailsMap (parallel to routePoints)

**What:** sector-details.json is fetched in initMap() and stored in a module-scope Map for O(1) lookup by id. Mirrors the existing `routePoints` module-scope variable.

```javascript
// Module scope
let sectorDetailsMap = null;  // Map<id, detail>
let sectorElevMap = null;     // Map<id, elevData>

// Inside initMap(), after fetches:
const detailsData = await fetch('/data/sector-details.json').then(r => r.json());
const elevData = await fetch('/data/sector-elevations.json').then(r => r.json());
sectorDetailsMap = new Map(detailsData.map(d => [d.id, d]));
sectorElevMap = new Map(elevData.map(e => [e.id, e]));
```

**Note:** `sector-elevations.json` is already fetched by `ElevationSparkline.astro` at build time. It is NOT currently fetched at runtime in initMap(). The panel requires it at runtime for sparkline rendering, so initMap() must add this fetch.

---

## Data Flow: Sector Click → Panel Open → Panel Content

```
1. USER clicks sector polyline on map

2. polyline.on('click') fires
   └─► openSectorPanel(sector.id)

3. openSectorPanel(id):
   a. detail = sectorDetailsMap.get(id)
      elevData = sectorElevMap.get(id)
   b. strokeColor = SECTOR_COLORS[detail.difficulty].line
   c. sparklineSVG = buildSparklineSVG(elevData, strokeColor)
   d. panelContent.innerHTML = `
        <h3>${detail.name}</h3>
        <div class="stars" ...>${stars}</div>
        <div class="meta">Mile ${detail.startMile}–${detail.endMile} · ${detail.lengthMiles}mi</div>
        <div class="surface">${detail.surfaceType}</div>
        ${sparklineSVG}
        <p class="description">${detail.description}</p>
        ${detail.stravaId ? stravaLink(detail.stravaId) : ''}
      `
   e. panel.setAttribute('aria-hidden', 'false')
   f. panel.classList.add('is-open')   → CSS transition slides in
   g. window.dispatchEvent(new CustomEvent('map:sectorClick', { detail: { sectorId: id } }))
   h. panelCloseBtn.focus()            → a11y focus trap

4. CSS transition: translateX(100%) → translateX(0) in 300ms
   On mobile: translateY(100%) → translateY(0)
```

---

## Event Bus Extensions

### New event: `map:sectorClick`

| Field | Value |
|-------|-------|
| Event name | `map:sectorClick` |
| Dispatched by | `RouteMap.astro` initMap() |
| Payload | `{ detail: { sectorId: string } }` |
| Current listener | None (dispatched for future use) |
| Example use case | ElevationProfile could highlight the corresponding sector band when a sector is clicked on the map |

**Rationale:** Dispatching the event even with no current listener costs nothing and maintains the established pattern (map:photoClick was wired before PhotoGallery consumed it). Future milestones may want to sync the elevation chart when a sector is clicked.

### Existing events — no changes

| Event | Status |
|-------|--------|
| `elevation:hover` | Unchanged — panel open state does not affect bike marker sync |
| `elevation:leave` | Unchanged |
| `map:photoClick` | Unchanged |

---

## Build Order

```
Phase 1: Data pipeline extension
  1a. Create scripts/generate-sector-details.js
      - Define SECTORS array (or read from sectors-source.json)
      - Output public/data/sector-details.json
  1b. Add generate-sector-details to pipeline.js (before astro build)
  1c. Verify sector-details.json is correct

Phase 2: Panel HTML and CSS
  2a. Add panel overlay HTML to RouteMap.astro template
  2b. Add CSS panel styles to RouteMap.astro <style> block
      (slide-out, bottom sheet breakpoint, reduced-motion)
  2c. Verify panel renders in DOM (before JS wires it)

Phase 3: Leaflet labels
  3a. Add sector-details.json + sector-elevations.json fetches to initMap()
  3b. Populate sectorDetailsMap and sectorElevMap
  3c. Add L.tooltip() label creation to sector loop
  3d. Style .sector-label via :global() in RouteMap.astro <style>
  3e. Verify labels appear at sector midpoints

Phase 4: Click handlers + panel logic
  4a. Add .on('click') to sector polylines
  4b. Implement openSectorPanel() / closeSectorPanel()
  4c. Implement buildSparklineSVG() helper
  4d. Wire close button and Escape key
  4e. Dispatch map:sectorClick event
  4f. Focus management (panelCloseBtn.focus() on open, map focus on close)

Phase 5: Responsive + accessibility polish
  5a. Test bottom-sheet behavior at 375px
  5b. Test keyboard navigation (Tab trap inside panel, Escape closes)
  5c. Test prefers-reduced-motion
  5d. Verify z-index layering: tiles < polylines < labels < panel < Leaflet controls
```

**Why this order matters:**
- Phase 1 must precede Phase 3 (initMap() fetches the JSON)
- Phase 2 can run in parallel with Phase 1 (HTML/CSS doesn't need data)
- Phase 3 must precede Phase 4 (handlers attach to polylines created in Phase 3)
- Phase 5 requires all prior phases complete

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Putting Leaflet Code at Module Scope

**What goes wrong:** Moving L.tooltip() creation or polyline.on() registration outside of `initMap()` fails silently because `window.L` is undefined until the dynamic import in initMap() resolves. The existing event listeners at module scope (elevation:hover, elevation:leave) survive this because they guard with `if (!bikeMarker || !routePoints || !leafletMap) return` — they do not call Leaflet APIs directly.

**Instead:** All L.* calls must be inside `initMap()`. The module-scope variables (sectorDetailsMap, sectorElevMap) are set during initMap() and are safe to read afterward.

### Anti-Pattern 2: A Separate Astro Component for the Panel

**What goes wrong:** Creating `SectorPanel.astro` and importing it into RouteMap.astro creates a scoped-style boundary. Astro scoped styles add a unique class hash to elements, making it impossible for RouteMap's script block to target `#sector-panel-content` reliably. Additionally, the panel's open/close state is driven by JavaScript in initMap(), not by Astro props, so there is no actual component benefit.

**Instead:** Keep the panel HTML inside RouteMap.astro's template and the CSS in the same component's `<style>` block. This is explicitly how the ResetControl is handled.

### Anti-Pattern 3: Fetching sector-elevations.json Again at Build Time

**What goes wrong:** sector-elevations.json is already consumed by ElevationSparkline.astro via Astro content collections at build time. Adding a second `getCollection()` call in a panel component creates a redundant pipeline dependency. The runtime fetch approach (Pattern 6) is lighter and consistent with how annotations.json and route-data.json are consumed in initMap().

**Instead:** Fetch sector-elevations.json inside initMap() alongside the other data files. One fetch, stored in sectorElevMap.

### Anti-Pattern 4: Using Leaflet Popups for Sector Details

**What goes wrong:** L.Popup has several characteristics that conflict with the panel UX: it closes when the user clicks elsewhere on the map (breaking reading flow), it is z-indexed inside the map container (cannot extend beyond map boundaries), it cannot be styled responsively as a bottom sheet, and it competes visually with restock popups that already use L.Popup.

**Instead:** A CSS-positioned panel overlay on the `.route-map` container gives full styling control, proper bottom-sheet behavior on mobile, and does not interfere with existing restock `.bindPopup()` functionality.

### Anti-Pattern 5: Duplicating Segment Content in Two Places

**What goes wrong:** RouteExplainer.astro already has the full sector descriptions, star ratings, and Strava IDs in its hardcoded `SEGMENTS` array. If the panel also hardcodes this data inside initMap(), any content update must be applied in two places.

**Instead:** Extract the canonical sector content into `scripts/generate-sector-details.js` (or a shared `sectors-source.json`) and have both RouteExplainer.astro and the panel consume from that single source. RouteExplainer.astro would import `sectors-source.json` in its frontmatter; the panel fetches `sector-details.json` at runtime.

### Anti-Pattern 6: L.tooltip() for Click Interaction

**What goes wrong:** Setting `interactive: true` on a permanent tooltip and handling clicks inside the tooltip creates awkward UX (tooltip must be clicked precisely) and conflicts with the polyline's own click events, causing double-firing.

**Instead:** Keep labels as `interactive: false` tooltips purely for display. Handle all user interaction via the polyline layer's `.on('click')` handler.

---

## Integration Points with Existing Architecture

| Existing Element | How v1.3 Touches It | Risk |
|-----------------|---------------------|------|
| `sector polylines` in initMap() | Converted from anonymous to named variables (store reference for click handler) | Low — additive change, same L.polyline() call |
| `routePoints` module-scope pattern | Two new module-scope vars added: sectorDetailsMap, sectorElevMap | None — follows established pattern |
| `bikeMarker` event handlers | Completely untouched — sector click does not emit elevation events | None |
| `.route-map { position: relative }` | Panel uses this for absolute positioning — already set | None |
| Leaflet z-index system | Sector labels (z ~600), panel overlay (z 1000), Leaflet controls (z 1001) | Low — verify no overlap |
| `getCSSColor()` inside initMap() | Panel's buildSparklineSVG() uses the same local function | None — already in scope |
| Restock `.bindPopup()` markers | Completely independent — L.Popup and sector panel coexist without conflict | None |
| `map.closePopup()` in ResetControl | ResetControl already calls closePopup() on reset — add `closeSectorPanel()` to the same handler | Low — one-line addition |
| `prefersReducedMotion` flag | Already computed in initMap() — panel CSS handles motion reduction via media query, no JS needed | None |

---

## Sources

- Leaflet 1.9.4 official reference: `L.tooltip` options (permanent, direction, interactive, className), `setLatLng()`, `setContent()` — [https://leafletjs.com/reference.html](https://leafletjs.com/reference.html) — MEDIUM confidence (fetched via WebFetch, confirmed options match current version)
- Direct source analysis: `RouteMap.astro`, `ElevationSparkline.astro`, `ElevationProfile.astro`, `PhotoGallery.astro`, `content.config.ts`, `pipeline.js`, `resolve-annotations.js` — HIGH confidence
- Existing data files: `annotations.json`, `sector-elevations.json` structure verified — HIGH confidence
- CSS slide-out / bottom-sheet pattern: no-framework translate+class-toggle — HIGH confidence (standard CSS, no external source needed)
