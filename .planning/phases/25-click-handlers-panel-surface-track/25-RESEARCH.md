# Phase 25: Click Handlers, Panel Logic, and Surface-Colored Track - Research

**Researched:** 2026-04-02
**Domain:** Leaflet polyline events, HTML `<dialog>` API, CSS positioning, SVG generation, multi-source data joining
**Confidence:** HIGH

## Summary

Phase 25 adds sector click interaction, a fully-populated detail panel, and surface-colored route polylines to the existing Leaflet map in `RouteMap.astro`. Phase 24 delivered the panel `<dialog>` DOM scaffold with all CSS — Phase 25 wires everything up.

The implementation requires three parallel concerns: (1) replacing the single `routeLine` polyline with 51 surface-typed segments using `surface-points.json`; (2) refactoring the sector overlay loop to use a ghost+visible polyline pair per sector with click/hover event handlers; and (3) implementing `openPanel()` / `closePanel()` functions that populate the panel body with data from `sector-details.json` and `sector-elevations.json`.

A critical architecture finding: the `<dialog>` element's default `position: absolute` does NOT respect `position: relative` parent containers — it uses the viewport (initial containing block) as its containing block. The existing Phase 24 CSS sets `position: absolute` on `.sector-panel`; this must be changed to `position: fixed` so the panel is viewport-anchored and stays visible during page scroll. The planned approach of `dialog.show()` (non-modal, keeps map interactive) requires manual Escape key handling and manual focus management, but is the correct call since the map should remain interactive while the panel is open. Backdrop click-to-close is handled via a `click` listener on the dialog element itself.

**Primary recommendation:** Use `dialog.show()` / `dialog.close()` (not `showModal()`) to keep the map interactive. Fix CSS `position: absolute` → `position: fixed`. Add 2 new JSON fetches (`sector-details.json`, `sector-elevations.json`) and modify the sector polyline loop to ghost+visible pattern. Generate sparkline SVG inline in JS from elevation data.

---

## Standard Stack

No new packages. This phase uses what the project already has.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Leaflet | 1.9.4 | `L.polyline`, `setStyle()`, event handlers | Already installed; established pattern |
| HTML `<dialog>` | native | Panel open/close, Escape key, focus management | Phase 24 scaffold already in place |

### Supporting
| Tool | Purpose | When to Use |
|---------|---------|-------------|
| `sector-details.json` | Panel content (description, surface, stars, stravaLink) | Fetch in initMap() |
| `sector-elevations.json` | Sparkline data (elevationPoints, difficulty) | Fetch in initMap() |
| `surface-points.json` | Per-point surface type for route coloring | Fetch in initMap() |
| `annotations.json` | Sector geometry (startIdx/endIdx) | Already fetched |

**Installation:** None required.

---

## Architecture Patterns

### Critical: dialog Element Positioning Behavior

**MUST KNOW:** The HTML `<dialog>` element does NOT respect `position: relative` parent containers. Its `position: absolute` uses the **viewport/initial containing block** as its containing block, regardless of the parent's `position: relative`. This is spec-compliant behavior confirmed in the CSS Working Group resolution (w3c/csswg-drafts#4645).

- `dialog.show()` / `dialog[open]` → `position: absolute` relative to **viewport** (NOT `.route-map` wrapper)
- `dialog.showModal()` → `position: fixed` relative to viewport (top layer promotion)

**Fix required:** The Phase 24 CSS sets `.sector-panel { position: absolute; }`. Since this resolves to viewport-relative anyway, it's functionally correct for `top: 0; right: 0` on desktop and `bottom: 0; left: 0` on mobile. HOWEVER, `position: absolute` will scroll with the page. **Change to `position: fixed`** so the panel stays anchored to the viewport edge while the user scrolls.

```css
/* Before (Phase 24): */
.sector-panel {
  position: absolute;
  ...
}

/* After (Phase 25): */
.sector-panel {
  position: fixed;
  ...
}
```

### dialog.show() vs dialog.showModal() — Which to Use

Use `dialog.show()` (non-modal):

| Feature | `show()` | `showModal()` |
|---------|---------|--------------|
| Map interactive while panel open | YES | NO (inert) |
| `::backdrop` pseudo-element | NO | YES |
| Escape key auto-close | NO | YES |
| `position: fixed` forced | NO | YES (top layer) |
| `[open]` attribute set | YES | YES |

**Chosen: `dialog.show()`** because the map must remain interactive while reading sector details. The sector panel is a detail view, not a blocking modal. The existing `::backdrop` CSS in Phase 24 will be inert with `show()` (dead code, harmless). Manual Escape and backdrop handling are required (simple to add).

### Opening the Panel

```javascript
// Source: HTML Living Standard, MDN dialog element
let previousFocus = null;

function openPanel(sectorData) {
  previousFocus = document.activeElement;
  
  // Populate panel title
  panel.querySelector('.sector-panel__title').textContent = sectorData.name;
  
  // Build and inject panel body HTML
  panel.querySelector('.sector-panel__body').innerHTML = buildPanelBody(sectorData);
  
  // Open (non-modal — map stays interactive)
  panel.show();
  
  // Focus the close button (accessibility: keyboard users can immediately close)
  panel.querySelector('.sector-panel__close').focus();
}
```

### Closing the Panel

```javascript
function closePanel() {
  panel.close();
  previousFocus?.focus();
  // Reset active sector highlight
  if (activeSector) {
    activeSector.visiblePoly.setStyle(activeSector.defaultStyle);
    activeSector = null;
  }
}
```

### Manual Escape Key and Backdrop Click

```javascript
// Escape key (only works automatically with showModal())
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && panel.open) {
    e.preventDefault();
    closePanel();
  }
});

// Backdrop click: when dialog is open via show(), the dialog element
// does NOT have a ::backdrop, so clicking outside the panel content
// requires a click listener on the dialog itself.
// e.target === panel means click landed on the dialog background (not a child element).
panel.addEventListener('click', (e) => {
  if (e.target === panel) closePanel();
});

// Close button
panel.querySelector('.sector-panel__close').addEventListener('click', closePanel);
```

**Note on backdrop with `show()`:** The Phase 24 CSS has `::backdrop { background: rgba(0,0,0,0.3); }` which only renders with `showModal()`. With `show()`, there is no backdrop overlay. The click-outside detection above still works (clicking the panel element background). If a visible dark overlay is desired, a separate `<div id="panel-backdrop">` must be added to the DOM and managed manually. Given the panel is a right-side slide-out (not full-screen), a dark overlay is less critical.

### Ghost Hit Layer Pattern for Sector Polylines

**What:** Two polylines per sector — one invisible ghost (handles events), one visible (handles styling).
**Why:** 5px-wide visible polylines are too narrow for reliable mobile touch. Ghost at 20px weight gives adequate touch target without visual weight increase.

```javascript
// Source: Leaflet 1.9.4 API (verified) + project pattern

const sectorLayers = []; // { sectorId, visiblePoly, ghostPoly, defaultStyle }
let activeSector = null;

for (const sector of sectors) {
  const sectorPts = latlngs.slice(sector.startIdx, sector.endIdx + 1);
  const colors = SECTOR_COLORS[sector.difficulty] || SECTOR_COLORS.moderate;
  const defaultStyle = { color: colors.line, weight: 5, opacity: 0.85 };

  // Visible polyline — no events, only styling
  const visiblePoly = L.polyline(sectorPts, {
    ...defaultStyle,
    interactive: false,   // MUST be false — ghost handles all events
  }).addTo(map);

  // Ghost polyline — transparent hit layer
  const ghostPoly = L.polyline(sectorPts, {
    color: colors.line,
    weight: 20,       // 20px touch target per MAP-04
    opacity: 0,       // invisible
    interactive: true,
  }).addTo(map);

  const entry = { sectorId: sector.id, visiblePoly, ghostPoly, defaultStyle };
  sectorLayers.push(entry);
  
  // Hover events (desktop only in practice — touch devices don't fire mouseover reliably)
  ghostPoly.on('mouseover', () => {
    if (activeSector?.sectorId !== sector.id) {
      visiblePoly.setStyle({ weight: 7, opacity: 1.0 });
    }
  });
  ghostPoly.on('mouseout', () => {
    if (activeSector?.sectorId !== sector.id) {
      visiblePoly.setStyle(defaultStyle);
    }
  });
  
  // Click event
  ghostPoly.on('click', () => {
    // Reset previous active sector
    if (activeSector && activeSector.sectorId !== sector.id) {
      activeSector.visiblePoly.setStyle(activeSector.defaultStyle);
    }
    // Set active highlight
    activeSector = entry;
    visiblePoly.setStyle({ weight: 8, opacity: 1.0 });
    visiblePoly.bringToFront();
    // Open panel
    const details = sectorDetails.find(d => d.id === sector.id);
    const elevData = sectorElevations.find(e => e.id === sector.id);
    openPanel({ ...sector, details, elevData });
  });
}
```

### Surface-Colored Route Polylines

**What:** Replace single `routeLine` with multiple polylines, one per consecutive same-surface run.
**Data:** `surface-points.json` (456 entries, index-aligned with `route-data.json` points).
**Algorithm:**

```javascript
// Source: project data (verified: 51 runs, 13 single-point runs need bridging)

const SURFACE_COLORS = {
  paved:   getCSSColor('--color-lake-400'),    // #4a9eca — distinctive blue
  gravel:  getCSSColor('--color-amber-400'),   // #d4a84e — warm amber (distinct from amber-500 sectors)
  dirt:    getCSSColor('--color-rust-600'),    // #8b4513 — dark brown/rust
  unknown: getCSSColor('--color-forest-700'),  // #3d6b3d — dark green (neutral fallback)
};

// Fetch surface-points.json (must be done before rendering)
const surfacePoints = await fetch('/data/surface-points.json').then(r => r.json());

// Group consecutive same-surface points into runs
let prev = null;
let runStart = 0;

function flushRun(endIdx) {
  if (prev === null) return;
  // Include one extra point (endIdx) to ensure seamless connection between segments
  // This handles single-point segments (13 of 51 runs have only 1 point)
  const pts = latlngs.slice(runStart, endIdx + 1);
  if (pts.length >= 2) {
    L.polyline(pts, {
      color: SURFACE_COLORS[prev] || SURFACE_COLORS.unknown,
      weight: 4,
      opacity: 0.9,
      smoothFactor: 1,
      interactive: false,
    }).addTo(map);
  }
}

for (let i = 0; i < surfacePoints.length; i++) {
  const s = surfacePoints[i].surface;
  if (s !== prev) {
    flushRun(i); // end previous run at current index (inclusive)
    runStart = i;
    prev = s;
  }
}
flushRun(surfacePoints.length - 1); // flush last run

// Replace routeLine bounds with direct latlngs computation
const initialBounds = L.latLngBounds(latlngs);
```

**Note on single-point segments:** 13 of 51 surface runs contain only 1 point. `L.polyline([singlePoint])` renders nothing. The `flushRun(i)` approach uses `latlngs.slice(runStart, endIdx + 1)` which "borrows" the first point of the next run, ensuring 2+ points per segment. The 1-point overlap between adjacent segments creates a seamless visual connection.

**Remove `routeLine`:** The current `const routeLine = L.polyline(...)` must be deleted. Replace:
- `map.fitBounds(routeLine.getBounds(), ...)` → `map.fitBounds(L.latLngBounds(latlngs), ...)`
- `const initialBounds = routeLine.getBounds()` → `const initialBounds = L.latLngBounds(latlngs)`

### Panel Content (buildPanelBody)

The panel body is built as an HTML string from two data sources:

**Data available at click time:**
- `sector` from `annotations.json` (already loaded): `name`, `difficulty`, `stars`, `startMile`, `endMile`, `startIdx`, `endIdx`
- `details` from `sector-details.json` (new fetch): `description`, `surface`, `stravaLink`
- `elevData` from `sector-elevations.json` (new fetch): `elevationPoints`, `eleMin`, `eleMax`, `difficulty`

**Panel HTML structure:**
```javascript
function buildPanelBody({ sector, details, elevData }) {
  const stars = '★'.repeat(sector.stars) + '☆'.repeat(5 - sector.stars);
  const milesRange = `${details.startMile}–${details.endMile} mi`;
  const stravaBadge = details.stravaLink
    ? `<a href="${details.stravaLink}" target="_blank" rel="noopener noreferrer" class="panel-strava-link">View on Strava ↗</a>`
    : '';
  const jumpLink = `<a href="#${details.id}" class="panel-jump-link">View in route guide</a>`;
  const sparklineSvg = generateSparklineSvg(elevData);
  
  return `
    <div class="panel-stars" aria-label="Difficulty: ${sector.stars} of 5 stars">${stars}</div>
    <div class="panel-meta">${milesRange} · ${details.surface}</div>
    <p class="panel-description">${details.description}</p>
    ${sparklineSvg}
    ${stravaBadge}
    ${jumpLink}
  `;
}
```

**Note on jump link:** The `href="#${details.id}"` uses the sector ID (e.g., `#sector-nf2266`). `RouteExplainer.astro` segment cards must have matching `id` attributes added (e.g., `<article id="sector-nf2266" class="segment-card-container">`). `SECTOR_IDS` already exists in `RouteExplainer.astro` and maps all 7 segment names to their IDs.

**Note on page order:** `RouteExplainer` renders ABOVE `RouteMap` in `index.astro`. The jump link scrolls UP the page to the segment card.

### SVG Sparkline Generation in JavaScript

Replicates `ElevationSparkline.astro` algorithm client-side:

```javascript
// Source: adapted from ElevationSparkline.astro
function generateSparklineSvg(elevData) {
  if (!elevData || !elevData.elevationPoints.length) return '';
  
  const W = 100, H = 50, padding = 4;
  const points = elevData.elevationPoints;
  const eles = points.map(p => p.ele);
  const miles = points.map(p => p.miles);
  const eleMin = Math.min(...eles);
  const eleMax = Math.max(...eles);
  const eleRange = eleMax - eleMin;
  const milesRange = miles[miles.length - 1] - miles[0];
  const drawH = H - 2 * padding;
  
  const DIFFICULTY_COLORS = {
    easy:     '#7d9448',  // --color-moss-500
    moderate: '#c8973e',  // --color-amber-500
    hard:     '#f87171',  // --color-scarlet-400
  };
  const strokeColor = DIFFICULTY_COLORS[elevData.difficulty] ?? '#c8973e';
  
  const computed = points.map((p, i) => ({
    x: milesRange > 0 ? (p.miles - miles[0]) / milesRange * W : i / Math.max(points.length - 1, 1) * W,
    y: eleRange > 0 ? (H - padding) - ((p.ele - eleMin) / eleRange * drawH) : H / 2,
  }));
  
  const polylinePoints = computed.map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
  const last = computed[computed.length - 1];
  const areaPoints = [...computed.map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`), `${last.x.toFixed(1)},${H}`, `0,${H}`].join(' ');
  const gradId = `elev-fill-${elevData.id}`;
  
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" aria-hidden="true" role="presentation" focusable="false">
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.05"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${W}" height="${H}" rx="3" fill="#1a2e1a" opacity="0.6"/>
    <polygon points="${areaPoints}" fill="url(#${gradId})"/>
    <polyline points="${polylinePoints}" stroke="${strokeColor}" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${computed[0].x.toFixed(1)}" cy="${computed[0].y.toFixed(1)}" r="2" fill="${strokeColor}"/>
    <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="2" fill="${strokeColor}"/>
  </svg>`;
}
```

### Data Fetching

Three new fetches required, plus existing ones:

```javascript
// Load in parallel alongside route-data.json for efficiency
const [routeData, annotations, sectorDetails, sectorElevations, surfacePoints, photosData] =
  await Promise.all([
    fetch('/data/route-data.json').then(r => r.json()),
    fetch('/data/annotations.json').then(r => r.json()),
    fetch('/data/sector-details.json').then(r => r.json()),
    fetch('/data/sector-elevations.json').then(r => r.json()),
    fetch('/data/surface-points.json').then(r => r.json()),
    fetch('/data/photos.json').then(r => r.json()),
  ]);
```

**NOTE:** The current code fetches `annotations.json` and `photos.json` in separate sequential awaits mid-function. Consolidating to a single `Promise.all()` at the top of `initMap()` improves startup time but is optional for Phase 25. The planner can choose sequential or parallel approach.

### Jump Link — RouteExplainer.astro Change

```astro
<!-- Before (Phase 24): -->
<article class="segment-card-container">

<!-- After (Phase 25): -->
<article id={SECTOR_IDS[seg.name] ?? ''} class="segment-card-container">
```

This requires exactly one character change per article element — adding `id={SECTOR_IDS[seg.name] ?? ''}`. `SECTOR_IDS` already exists in `RouteExplainer.astro` lines 35-43 and covers all 7 segments.

**Note on `NF2217-2218`:** `SECTOR_IDS['NF2217-2218'] = 'sector-nf2217'`. The article with name `NF2217-2218` will get `id="sector-nf2217"`. The panel jump link uses `sector-details.json` `id` field which is `sector-nf2217`. These match correctly.

### Active Sector State Management

```javascript
// Module-scope state (alongside existing bikeMarker, routePoints, leafletMap)
let activeSector = null; // { sectorId, visiblePoly, ghostPoly, defaultStyle }

// When panel closes (via any mechanism):
function onPanelClose() {
  if (activeSector) {
    activeSector.visiblePoly.setStyle(activeSector.defaultStyle);
    activeSector = null;
  }
  previousFocus?.focus();
}

// Add 'close' event listener ONCE (not inside loop):
panel.addEventListener('close', onPanelClose);
```

### Anti-Patterns to Avoid

- **Using `showModal()`:** Correct for full blocking modals. Wrong here — the map becomes inert (not interactive) while panel is open. Use `dialog.show()`.
- **Not changing `position: absolute` to `position: fixed`:** `position: absolute` on `<dialog>` resolves to viewport-relative anyway (initial containing block), but does NOT stay fixed during scroll. Panel will scroll out of view.
- **Using innerHTML with unsanitized data:** `sector-details.json` content (descriptions, surface labels) is controlled content. No user input. Safe to use innerHTML for panel body generation.
- **Storing `sectorDetails` inside the polyline click closure:** Use module-scope arrays (`sectorDetails`, `sectorElevations`) fetched once at initMap() time, looked up by id inside click handlers.
- **Forgetting to handle `dialog.open` check:** If user clicks sector B while panel is already open, avoid calling `dialog.show()` twice (throws error in older Safari 16). Check `if (!panel.open)` before calling `.show()`.
- **Using routeLine.getBounds() after removing routeLine:** Delete routeLine, replace with `L.latLngBounds(latlngs)`.
- **Single-point surface segments:** 13 of 51 surface runs have 1 point. `L.polyline([singlePoint])` is valid but invisible. The run-flush algorithm with `endIdx + 1` inclusion handles this by borrowing the next segment's first point.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Ghost polyline hit detection | Custom SVG overlay | `L.polyline` with `weight: 20, opacity: 0` | Leaflet handles all SVG hit testing natively |
| Escape key modal behavior | Complex keydown handler | Manual keydown on `window` for `'Escape'` key | Simple and reliable; `showModal()` auto-Escape rejected since it makes map inert |
| Focus trap inside panel | Tab key loop | `dialog.show()` — no focus trap needed (non-modal) | Non-modal dialog intentionally allows tab to leave |
| Elevation sparkline | Chart.js (rejected per prior decisions) | Inline SVG string generation | Zero dependencies, identical visual output to build-time version |
| Bounds computation | routeLine.getBounds() | `L.latLngBounds(latlngs)` | Direct computation from array avoids keeping routeLine around |

---

## Common Pitfalls

### Pitfall 1: dialog.show() Called Twice Without Guard
**What goes wrong:** Safari 16 throws `InvalidStateError` when `showModal()` is called on an already-open dialog. `show()` behavior may vary.
**How to avoid:** Guard: `if (!panel.open) { panel.show(); }` before calling `.show()`. When panel is already open and user clicks another sector, update content without re-calling `.show()`.

### Pitfall 2: position: absolute Scrolls Away
**What goes wrong:** Panel slides in correctly but disappears when user scrolls the page.
**Why:** `position: absolute` on `<dialog>` uses viewport as containing block but is NOT fixed — it scrolls with content.
**How to avoid:** Change `.sector-panel { position: absolute }` to `position: fixed` in Phase 24 CSS.

### Pitfall 3: mouseover Fires on Ghost Poly When Active
**What goes wrong:** User hovers over an active (clicked) sector → mouseover fires → setStyle resets to hover weight, then mouseout fires → setStyle resets to default weight (erasing active highlight).
**How to avoid:** In mouseover/mouseout handlers, check `activeSector?.sectorId !== sector.id` before applying styles. If sector is active, skip style changes from hover.

### Pitfall 4: showModal() vs show() Inert Behavior
**What goes wrong:** Using `showModal()` makes all page content outside the dialog inert (including the Leaflet map). Clicking on the map while panel is open does nothing.
**How to avoid:** Use `dialog.show()`. The map remains fully interactive. The "backdrop" click detection uses the `click` event on the dialog element itself.

### Pitfall 5: surface-points.json Not Index-Aligned
**What goes wrong:** Assuming `surface-points[i]` corresponds to the coordinate at a specific mile marker, when it actually corresponds to `route-data.points[i]` by array index.
**Reality:** `surface-points.json` is 456 entries, index-aligned with `route-data.json` points. It is NOT mile-aligned or coordinate-aligned for lookup — use array index directly.

### Pitfall 6: routeLine Not Removed
**What goes wrong:** Both routeLine (dark green) and surface-colored segments render simultaneously. The dark green line covers the surface coloring.
**How to avoid:** Delete the `const routeLine = L.polyline(latlngs, {...}).addTo(map);` block entirely. Update fitBounds and initialBounds to use `L.latLngBounds(latlngs)`.

### Pitfall 7: `::backdrop` Dead Code
**What goes wrong:** Expecting `::backdrop { background: rgba(0, 0, 0, 0.3); }` to create a dark overlay with `dialog.show()`. It won't — `::backdrop` only renders with `showModal()`.
**How to avoid:** The Phase 24 `::backdrop` CSS is harmless dead code when using `show()`. Do not add a backdrop div unless the dark overlay is explicitly required for design.

### Pitfall 8: iOS Safari Panel Scrolling
**What goes wrong:** On iOS, `overflow-y: auto` on a `<dialog>` may not scroll on older iOS versions without `-webkit-overflow-scrolling: touch`.
**Status:** iOS 15+ supports `overflow-y: auto` without vendor prefix. iOS 13/14 may need workaround but iOS 15+ is safe assumption for 2026.
**Confidence:** MEDIUM — iOS Safari behavior should be tested on device per the blocker note in STATE.md.

---

## Code Examples

### Complete Phase 25 Sector Loop (replaces current sector loop)

```javascript
// Source: derived from project patterns + Leaflet 1.9.4 API

const sectorLayers = [];
let activeSector = null;

for (const sector of sectors) {
  const sectorPts = latlngs.slice(sector.startIdx, sector.endIdx + 1);
  const colors = SECTOR_COLORS[sector.difficulty] || SECTOR_COLORS.moderate;
  const defaultStyle = { color: colors.line, weight: 5, opacity: 0.85 };

  const visiblePoly = L.polyline(sectorPts, { ...defaultStyle, interactive: false }).addTo(map);
  const ghostPoly = L.polyline(sectorPts, { color: colors.line, weight: 20, opacity: 0, interactive: true }).addTo(map);

  const entry = { sectorId: sector.id, visiblePoly, ghostPoly, defaultStyle };
  sectorLayers.push(entry);

  ghostPoly.on('mouseover', () => {
    if (activeSector?.sectorId !== sector.id) visiblePoly.setStyle({ weight: 7, opacity: 1.0 });
  });
  ghostPoly.on('mouseout', () => {
    if (activeSector?.sectorId !== sector.id) visiblePoly.setStyle(defaultStyle);
  });
  ghostPoly.on('click', () => {
    if (activeSector && activeSector.sectorId !== sector.id) {
      activeSector.visiblePoly.setStyle(activeSector.defaultStyle);
    }
    activeSector = entry;
    visiblePoly.setStyle({ weight: 8, opacity: 1.0 });
    visiblePoly.bringToFront();
    const details = sectorDetails.find(d => d.id === sector.id);
    const elevData = sectorElevations.find(e => e.id === sector.id);
    openPanel({ sector, details, elevData });
  });
}
```

### openPanel() and closePanel()

```javascript
// Source: HTML Living Standard dialog element API
let previousFocus = null;
const panel = document.getElementById('sector-panel');

function openPanel({ sector, details, elevData }) {
  previousFocus = document.activeElement;
  panel.querySelector('.sector-panel__title').textContent = sector.name;
  panel.querySelector('.sector-panel__body').innerHTML = buildPanelBody({ sector, details, elevData });
  
  // Add jump link close behavior
  const jumpLink = panel.querySelector('.panel-jump-link');
  if (jumpLink) jumpLink.addEventListener('click', () => panel.close(), { once: true });
  
  if (!panel.open) panel.show();
  panel.querySelector('.sector-panel__close').focus();
}

function closePanel() {
  // panel 'close' event handles focus restoration and active reset
  panel.close();
}

// Wire up close mechanisms (called ONCE after panel is in DOM)
panel.querySelector('.sector-panel__close').addEventListener('click', closePanel);
panel.addEventListener('click', (e) => { if (e.target === panel) closePanel(); });
panel.addEventListener('close', () => {
  if (activeSector) {
    activeSector.visiblePoly.setStyle(activeSector.defaultStyle);
    activeSector = null;
  }
  previousFocus?.focus();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && panel.open) { e.preventDefault(); closePanel(); }
});
```

### CSS Fix: position: absolute → fixed

```css
/* In RouteMap.astro <style> block */
/* Before (Phase 24): */
.sector-panel {
  position: absolute;
  ...
}

/* After (Phase 25): */
.sector-panel {
  position: fixed;
  ...
}
```

### RouteExplainer.astro ID Addition

```astro
<!-- Line 60 in RouteExplainer.astro — add id attribute -->
<article id={SECTOR_IDS[seg.name] ?? ''} class="segment-card-container">
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Single dark green routeLine | Surface-colored segments per `surface-points.json` | Shows paved/gravel/dirt visually |
| Sector polyline only (no ghost) | Ghost + visible pair | Reliable 20px mobile touch target |
| `showModal()` blocking modal | `dialog.show()` non-modal | Map stays interactive during panel review |

**Note on `position: absolute` vs `fixed` for `<dialog>`:** The HTML spec changed dialog's positioned ancestor to always be the initial containing block (viewport), making `position: absolute` behave differently from regular elements. This is a known pitfall documented in the CSS WG issue tracker (w3c/csswg-drafts#4645).

---

## Open Questions

1. **Backdrop visual — dark overlay or none?**
   - What we know: `dialog.show()` (non-modal) does not render `::backdrop`. The existing Phase 24 `::backdrop` CSS is dead code with this approach.
   - What's unclear: Does the design require a visible dark overlay behind the right-side panel? The requirements say "clicking the backdrop" but don't specify a visible dark background.
   - Recommendation: Proceed without a visible backdrop div. The "clicking the backdrop" requirement is satisfied by the `click` event on the dialog element (clicking outside the panel content closes it). A dark overlay can be added later if design review requires it.

2. **Surface color palette final choice**
   - What we know: Actual data has paved/gravel/dirt/unknown (no sand). Colors must be distinct from sector overlay colors (moss-500, amber-500, rust-500).
   - Recommendation: `paved: --color-lake-400`, `gravel: --color-amber-400`, `dirt: --color-rust-600`, `unknown: --color-forest-700`. The amber-400 for gravel is lighter than amber-500 (sector moderate) — distinguishable but in same family.
   - Alternative if amber-400/amber-500 conflict is too subtle: use `--color-gold-500` (#d4a017) for gravel (more yellow than amber).

3. **Strava link for Rapid River Truck Trail**
   - What we know: `stravaLink: null` in `sector-details.json`. The panel must handle `null` stravaLink gracefully.
   - Resolution: Omit the Strava badge entirely when `details.stravaLink` is null (already handled in `buildPanelBody()` pattern above).

4. **iOS Safari panel overflow scrolling**
   - What we know: STATE.md blocker: "Phase 25 requires iOS Safari device testing." The panel uses `overflow-y: auto`.
   - What's unclear: Whether iOS 15+ handles `overflow-y: auto` on `<dialog>` correctly.
   - Recommendation: Plan for iOS device testing after implementation. The blocker is acknowledged.

---

## Sources

### Primary (HIGH confidence)
- Leaflet 1.9.4 official reference (leafletjs.com/reference.html) — Polyline API, setStyle(), bringToFront(), interactive option, mouseover/mouseout/click events
- MDN Web Docs (`developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog`) — show(), close(), open attribute, focus management, ::backdrop
- HTML Standard Rendering section (`html.spec.whatwg.org/multipage/rendering.html`) — confirmed `dialog { position: absolute }` UA default, `dialog:modal { position: fixed }` for showModal()
- CSS WG issue w3c/csswg-drafts#4645 — confirmed dialog position uses initial containing block regardless of parent `position: relative`
- Project source `RouteMap.astro` (verified) — existing fetch patterns, polyline code, `initMap()` structure
- Project source `surface-points.json` (verified) — 456 entries, 51 runs, 13 single-point runs, surfaces: paved/gravel/dirt/unknown
- Project source `sector-details.json` (verified) — 7 entries, all fields including null stravaLink for Rapid River
- Project source `sector-elevations.json` (verified) — 7 entries with elevationPoints arrays
- Project source `RouteExplainer.astro` (verified) — SECTOR_IDS mapping, article element structure, no existing IDs on articles

### Secondary (MEDIUM confidence)
- Leaflet Choropleth example (leafletjs.com/examples/choropleth/) — confirmed setStyle(), bringToFront(), e.target pattern
- MDN dialog::backdrop documentation — confirmed backdrop only renders with showModal()
- WebSearch: dialog.show() non-modal panel pattern — multiple sources confirm `show()` is correct for non-blocking side panels

### Tertiary (LOW confidence)
- iOS Safari overflow-y behavior on dialog — confirmed iOS 15+ should work, not device-tested

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all APIs verified against docs
- Architecture: HIGH — all patterns verified against project source and HTML/CSS specs
- Dialog positioning: HIGH — confirmed in CSS WG spec resolution and HTML Standard rendering rules
- Ghost polyline pattern: HIGH — verified Leaflet weight/opacity/interactive options
- Surface coloring: HIGH — surface-points.json structure verified, algorithm derived from data analysis
- Panel content: HIGH — all data sources verified, sparkline algorithm derived from ElevationSparkline.astro
- iOS Safari behavior: MEDIUM — device testing required per STATE.md blocker

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (Leaflet 1.9.4 stable; HTML dialog spec stable; project data files stable)
