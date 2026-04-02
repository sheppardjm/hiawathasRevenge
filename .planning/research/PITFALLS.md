# Domain Pitfalls: v1.3 Map Interactivity

**Domain:** Adding interactive sector labels, clickable polylines, slide-out/bottom sheet detail panels to an existing Leaflet map in a static Astro site
**Researched:** 2026-04-02
**Confidence:** HIGH for Leaflet-specific pitfalls (verified via official docs and confirmed GitHub issues), MEDIUM for mobile gesture conflicts (platform-specific variance is real), HIGH for integration pitfalls (based on direct codebase analysis)

---

## Critical Pitfalls

Mistakes that cause rewrites, regressions in existing functionality, or broken experiences on mobile. Recovery cost: HIGH.

---

### Pitfall 1: Sector Polyline Click Targets Are Unreliable on Mobile Without a Wider Hit Layer

**What goes wrong:**
The existing sector polylines are rendered at `weight: 5` (5px SVG stroke). On desktop this is adequately clickable. On mobile, users tap with fingers (contact area 40-60px) against a 5px line — the hit rate is poor. Users get confused when they tap the colored line and nothing happens, or they repeatedly tap until they accidentally hit it. This is especially bad for the shorter sectors (sector-520 at 1.3mi is a short diagonal line on the overview zoom).

**Why it happens:**
Leaflet's SVG renderer uses the visual stroke width as the hit detection area. There is no built-in `touchTolerance` or `weight` equivalent for the invisible interaction zone on SVG paths. The Canvas renderer has better tolerances, but this project uses SVG (the default). This has been a known open issue since Leaflet 0.7 (GitHub issue #1264, opened 2013, closed with the note that the Canvas backend fix was available, but SVG was not fixed).

**Consequences:**
- Mobile users cannot reliably tap into sectors to open the detail panel
- The 52px touch target requirement (stated in PROJECT.md) is violated
- Frustrating UX that undermines the primary v1.3 feature

**Prevention:**
Add a transparent "ghost" polyline on top of each sector polyline with a weight of 20-30px and `opacity: 0`, keeping the same `click` event handler. The visible polyline uses `interactive: false`; the ghost polyline carries all interaction. This is the same approach used by the community library Leaflet.HighlightableLayers (which adds a 20px transparent overlay).

Implementation pattern:
```javascript
// Visible polyline — non-interactive
L.polyline(sectorPts, {
  color: colors.line, weight: 5, opacity: 0.85, interactive: false
}).addTo(map);

// Ghost hit area — interactive, transparent
L.polyline(sectorPts, {
  color: 'transparent', weight: 20, opacity: 0, interactive: true
}).on('click', () => openSectorPanel(sector)).addTo(map);
```

**Warning signs:**
- Single polyline for each sector with no ghost layer
- `weight` value below 20 on touch devices
- No mention of touch testing in implementation plan

**Phase to address:** The sector-clickability phase — establish this ghost-layer pattern before adding click handlers, not after.

**Recovery cost if hit:** MEDIUM — requires refactoring polyline construction loop for all 7 sectors plus retesting touch behavior on iOS and Android.

---

### Pitfall 2: bubblingMouseEvents on Sector Polylines Fires BOTH Sector Handler AND Map Click Handler

**What goes wrong:**
When a click handler is added to each sector polyline and the developer also adds a map-level click handler (e.g., `map.on('click', closePanel)`), clicking a sector fires BOTH the sector click handler (opening the panel) AND the map click handler (immediately closing it). The panel flickers open and instantly closes. This is a confirmed Leaflet behavior change since v1.0.3 (GitHub issue #5313).

**Why it happens:**
In Leaflet 1.x, `bubblingMouseEvents` defaults to `true` for Path layers. This means polyline click events bubble up to the map. A naively implemented "click map to close panel" handler fires on the same event that opened the panel.

**Consequences:**
- Detail panel appears to flash briefly but never stays open
- Developer may spend hours debugging why the panel won't open
- Particularly confusing because the behavior is zoom-level and pointer-position dependent

**Prevention:**
Two options, choose one:

Option A (preferred): Use `bubblingMouseEvents: false` on the interactive polyline:
```javascript
L.polyline(sectorPts, {
  interactive: true, bubblingMouseEvents: false
}).on('click', (e) => {
  L.DomEvent.stopPropagation(e);
  openSectorPanel(sector);
}).addTo(map);
```

Option B: Close the panel on `map.on('click', ...)` but add a guard: check that the click source is not a sector polyline. Less clean.

**Warning signs:**
- Click handler on polyline AND a `map.on('click', ...)` handler in the same code
- Panel flashes open and closes immediately on click
- Problem appears on desktop but not always mobile (touch events have slightly different propagation)

**Phase to address:** Sector click implementation phase — set `bubblingMouseEvents: false` from the start, not as a later fix.

**Recovery cost if hit:** LOW once identified — a one-line fix, but the debugging process can be costly.

---

### Pitfall 3: Panel Open/Close Breaks elevation:hover Sync via the Existing CustomEvent Bus

**What goes wrong:**
The existing `elevation:hover` CustomEvent handler in RouteMap.astro updates `bikeMarker` on every chart mousemove. If the sector detail panel is implemented as a DOM element outside `#map` (correct approach), it may capture pointer events and intercept mousemove from the elevation chart area. Alternatively, when the panel slides open and covers part of the map, the Chart.js canvas loses hover events, leaving the bikeMarker frozen at the last position.

More specifically: the ElevationProfile chart fires `elevation:leave` when the pointer leaves the chart canvas. If the panel slides over the chart area on mobile, `elevation:leave` never fires, the bikeMarker stays visible, and the map looks wrong.

**Why it happens:**
The existing event bus uses `window.dispatchEvent` — a global broadcast that cannot be blocked by UI changes. But the SOURCE of those events (Chart.js canvas mousemove) CAN be interrupted. If a panel overlay receives pointer events, Chart.js stops receiving them and stops dispatching `elevation:hover`. The bikeMarker has no timeout/cleanup mechanism in the current code.

**Consequences:**
- Biome marker stays frozen at wrong position after sector panel opens
- Does not affect map tiles or panning, but creates visual confusion
- Users see a stale "you are here" dot while reading sector details

**Prevention:**
1. Dispatch `elevation:leave` explicitly when opening any sector panel:
   ```javascript
   function openSectorPanel(sector) {
     window.dispatchEvent(new CustomEvent('elevation:leave'));
     // ... show panel
   }
   ```
2. Ensure the panel element uses `pointer-events: auto` only on its own content, not on the surrounding overlay/backdrop if there is one.
3. Use `touch-action: none` only on the map container itself, not on elements that overlap the chart.

**Warning signs:**
- Panel implementation does not dispatch `elevation:leave` on open
- Bikemode marker remains on map after panel opens during testing
- No test step: "open sector panel while chart hover is active"

**Phase to address:** Panel open/close phase, before integration testing.

**Recovery cost if hit:** LOW — single `dispatchEvent` call, but requires recognizing the connection to the existing event bus.

---

### Pitfall 4: Slide-Out Panel Placed Inside #map Breaks z-index Layering

**What goes wrong:**
The developer, for convenience, adds the sector detail panel HTML inside the `<div id="map">` element in RouteMap.astro, expecting CSS `z-index` to layer it above the Leaflet tiles. This does not work reliably. Leaflet creates its own stacking context inside `#map` (`position: relative; z-index: 0`). Elements inside `#map` compete with Leaflet's internal panes (overlay pane z-index 400, marker pane z-index 600, popup pane z-index 700). The panel may appear behind markers or popups, and the Leaflet zoom controls (z-index 1000) will always appear in front of it.

**Why it happens:**
CSS z-index only works within a stacking context. Leaflet creates its own stacking context. Adding a panel inside that context means it cannot escape the Leaflet z-index hierarchy (which tops out at 1000 for controls). The panel needs to live in the PAGE stacking context, not Leaflet's.

**Consequences:**
- Panel renders behind Leaflet zoom controls
- Leaflet popup markers appear on top of panel content
- On iOS, the stacking behavior differs from desktop, causing unpredictable layering

**Prevention:**
The panel MUST be a sibling of `#map`, not a child. Wrap both in a relative-positioned container:

```html
<div class="map-container" style="position: relative;">
  <div id="map" class="route-map"></div>
  <aside id="sector-panel" class="sector-panel" style="position: absolute; z-index: 1000; right: 0; top: 0; bottom: 0;">
    <!-- panel content -->
  </aside>
</div>
```

This places the panel in the same stacking context as the map container, above Leaflet's internal panes.

**Warning signs:**
- Panel HTML added inside `<div id="map">`
- Panel is added as a Leaflet Control (L.Control) — controls are Leaflet-pane DOM, constrained to z-index 1000
- Panel appears behind zoom buttons in testing

**Phase to address:** Panel DOM structure phase — establish correct DOM placement before writing any open/close logic.

**Recovery cost if hit:** MEDIUM — restructuring the HTML requires updating CSS selectors, Astro scoped styles, and JavaScript DOM queries.

---

### Pitfall 5: Permanent Tooltip Labels Positioned Wrong on First Load (Lazy Init Timing)

**What goes wrong:**
Sector name labels implemented as `bindTooltip(..., { permanent: true })` appear mispositioned on initial render — often at `[0, 0]` (top-left of map), or at the top-left corner of the sector bounds rather than the midpoint. This is caused by a known Leaflet timing issue: when `bindTooltip` is called before the map has completed its first `fitBounds` + tile load cycle, the tooltip position calculation uses pre-fitBounds coordinate projections that become stale.

This is compounded by the existing lazy-init pattern in RouteMap.astro. The map is initialized on first scroll via IntersectionObserver. If sectors are added and labeled during async `initMap()` while tiles are still loading, the DOM layout and map projection may not be stable when `bindTooltip` calculates its pixel position.

**Why it happens:**
Leaflet's tooltip position is calculated at the time `bindTooltip` fires. For polylines, `permanent: true` tooltips default to the geometric center of the layer's bounds. If the map's projection changes after tooltip binding (because `fitBounds` fires, or a tile causes a repaint), the tooltip position is not recalculated. The `moveend` event does trigger repositioning, but there is a race condition in async init flows.

**Consequences:**
- Labels appear at wrong positions on first page load
- Labels correctly reposition after any user pan/zoom (which triggers the moveend update)
- This creates a confusing experience: broken on load, then suddenly correct when user interacts

**Prevention:**
1. Add labels AFTER `map.fitBounds()` completes, not before. Use the `map.once('moveend', ...)` callback:
   ```javascript
   map.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
   map.once('moveend', () => {
     // Add labels here — map projection is stable
     for (const sector of sectors) {
       polyline.bindTooltip(labelHTML, { permanent: true, direction: 'center' });
     }
   });
   ```
2. Alternatively, use `divIcon` markers at the manually computed midpoint (index `Math.floor((startIdx + endIdx) / 2)` of the `latlngs` array) rather than `bindTooltip` with `direction: 'center'`. This avoids Leaflet's internal projection calculation entirely.

**Warning signs:**
- Labels added during the main sector creation loop, before `fitBounds`
- Labels look correct after first user pan but wrong on load
- No `moveend` listener or post-fitBounds hook in label creation code

**Phase to address:** Sector label rendering phase — explicit post-fitBounds placement strategy needed.

**Recovery cost if hit:** MEDIUM — requires restructuring the label creation timing, plus regression testing the lazy-init flow.

---

### Pitfall 6: Bottom Sheet Gesture Conflicts With Map Pan on iOS Safari

**What goes wrong:**
On iOS Safari, the bottom sheet's drag handle and the Leaflet map pan gesture compete for touch events. The user swipes up to expand the bottom sheet; instead, Leaflet's touchmove handler intercepts the swipe and pans the map. Conversely, when the user tries to pan the map while the bottom sheet is open (partially expanded state), the sheet intercepts the swipe instead. This makes both interactions unreliable simultaneously.

The project already uses `leaflet-gesture-handling`. This plugin has documented issues on iOS devices (elmarquis/Leaflet.GestureHandling GitHub issues #98 and #99, reported July-September 2024): on iOS, the gesture handling plugin can make it harder to click markers, and in some configurations fails to properly intercept touch events.

**Why it happens:**
Touch events on mobile do not respect CSS `z-index` for routing decisions. They are dispatched to the topmost element at the touch point. When the bottom sheet partially overlaps the map, touches in the overlap zone are captured by whichever element has the first matching touch handler. Leaflet registers `touchstart` on the map container; the bottom sheet registers `touchstart` on its drag handle. The order of handler registration and DOM position both matter.

Additionally, iOS Safari's bounce effect (`overscroll-behavior`) can cause the bottom sheet to trigger the native page bounce when the sheet's scroll content reaches its top, affecting the visual stability of both the sheet and the map.

**Consequences:**
- Swiping up to open the bottom sheet pans the map instead
- Swiping on the map while the sheet is docked pans the sheet instead
- iOS bounce creates visual jitter
- The feature appears broken on first mobile test

**Prevention:**
1. When the bottom sheet begins a drag gesture, call `map.dragging.disable()` to halt Leaflet pan handling. Re-enable on sheet settle: `map.dragging.enable()`.
2. Apply `touch-action: none` to the bottom sheet drag handle to prevent the browser from handling those gestures natively.
3. Apply `overscroll-behavior: none` to the bottom sheet's scrollable content to prevent iOS bounce propagating to the map.
4. Use `pointer-events: none` on the map container while the sheet is in a drag transition state.
5. Test specifically: partially-expanded bottom sheet + attempt to pan map. This is the highest-risk interaction combination.

**Warning signs:**
- Bottom sheet drag handle has no `touch-action` CSS
- `map.dragging.disable()` is never called
- Bottom sheet height uses `100dvh` (causes layout recalc jitter on iOS as URL bar hides/shows)
- No iOS-specific testing in the phase plan

**Phase to address:** Bottom sheet mobile implementation phase.

**Recovery cost if hit:** HIGH — touch event management on iOS Safari requires careful sequencing of enable/disable calls plus device-specific testing that cannot be emulated in Chrome DevTools.

---

### Pitfall 7: Sector Labels Unreadable at Default Zoom Level Due to CyclOSM Tile Background Interference

**What goes wrong:**
CyclOSM tiles contain their own text labels: road names, forest names, lake names, elevation markers. Custom sector name labels placed via `divIcon` at the default route-overview zoom level collide visually with CyclOSM's own rendered text. The sector names become unreadable because they sit on top of (or directly adjacent to) road name text, water body labels, or topographic contour labels in the tile layer.

Additionally, the labels may be unreadable at low zoom levels where the sectors are short pixel segments. A 1.3-mile sector (sector-520) at zoom level 11 spans roughly 30px — a label wider than the segment.

**Why it happens:**
CyclOSM is a busy tile style designed for cycling navigation. It includes substantial label density at zoom levels 10-13, which overlap with the route-overview zoom (the `fitBounds` result for the 100-mile route typically settles around zoom 10-11). Unlike Mapbox GL or similar vector tile renderers, Leaflet has no built-in label collision detection between divIcon labels and tile text.

**Consequences:**
- Sector name labels are visually confusing or illegible at the default zoom
- The "National Park aesthetic" goal (PROJECT.md) is undermined by cluttered labels
- Star ratings placed beside sector names may not be readable at small sizes

**Prevention:**
1. Only show sector labels at zoom level 12 or higher, where sector lines are long enough to support a label and tile text is less dense. Implement via a `zoomend` listener:
   ```javascript
   map.on('zoomend', () => {
     const zoom = map.getZoom();
     labelMarkers.forEach(m => {
       if (zoom >= 12) { m.addTo(map); }
       else { m.remove(); }
     });
   });
   ```
2. At the default overview zoom, display no labels — the colored polylines suffice. Labels appear when the user zooms in.
3. Use a label background: dark forest green pill with white text (`background: var(--color-forest-900)`, `color: white`, `padding: 2px 6px`, `border-radius: 9999px`). This creates contrast against any tile background rather than relying on tile colors.
4. Use `text-shadow` for fallback contrast: `text-shadow: 0 0 3px #0d1a0d, 0 0 3px #0d1a0d`.
5. Limit label width: truncate names and use CSS `white-space: nowrap; overflow: hidden; max-width: 120px`.

**Warning signs:**
- Labels added without a `zoomend` visibility gate
- Labels use light text on transparent backgrounds
- Default (overview) zoom shows all labels simultaneously

**Phase to address:** Sector label rendering phase.

**Recovery cost if hit:** MEDIUM — requires adding zoom visibility logic after-the-fact and redesigning label styling.

---

## Moderate Pitfalls

Mistakes that cause delays, visual regressions, or technical debt. Recovery cost: MEDIUM.

---

### Pitfall 8: Sector Difficulty Rating Inconsistency Between annotations.json and data.md

**What goes wrong:**
The annotations.json and data.md disagree on sector difficulty levels for multiple segments:

| Sector | data.md rating | annotations.json difficulty |
|--------|---------------|----------------------------|
| 520 | 2-star | moderate |
| NF2266 | 5-star | moderate |
| Bass Lake Rd | 2-star | easy |
| NF2217-2218 | 2-star | moderate |
| ND2225 | 3-star | moderate |
| Doe Lake | 4-star | easy |
| Rapid River Truck Trail | 2-star | hard |

The panel will display star ratings from one source; the map polyline color uses the other. A user sees a "hard" red polyline for Rapid River (from annotations.json `hard`), but the panel shows "2-star" (from data.md). For Doe Lake they see easy/green on the map but "4-star" in the panel. This is contradictory and confusing.

**Why it happens:**
The annotations.json `difficulty` field was set by the build pipeline (resolve-annotations.js) using a different classification system than the editorial `data.md`. The annotations use `easy/moderate/hard` (3-tier) for COLORS; data.md uses star ratings (2-5 stars) for EDITORIAL content. These were never reconciled.

**Prevention:**
Before building the detail panel, explicitly audit and reconcile the difficulty classification:
1. Decide on canonical source: data.md star ratings (more granular, editorial) OR annotations.json tiers (drives polyline color)
2. Either add star ratings to annotations.json (e.g., `"stars": 4`) OR reclassify annotations.json difficulty tiers to match data.md
3. The SECTOR_COLORS in RouteMap.astro uses annotations.json — the polyline color scheme must stay consistent with whatever canonical source is chosen

**Warning signs:**
- Panel displays star ratings sourced from a different file than the one driving polyline color
- No reconciliation step in the phase plan
- Difficulty descriptions in the panel contradict the visual color of the line on the map

**Phase to address:** Data preparation phase — BEFORE building the panel UI.

**Recovery cost if hit:** MEDIUM — requires pipeline changes and data re-sync, plus visual regression testing.

---

### Pitfall 9: Label divIcon Default White Box Appears Unless Explicitly Nulled

**What goes wrong:**
Leaflet's `L.divIcon` adds a default CSS class `.leaflet-div-icon` which applies `background: white; border: 1px solid #666; padding: 2px`. Every sector label marker will have a white box with a dark border unless this is overridden. This contradicts the National Park aesthetic.

**Why it happens:**
This is a well-known Leaflet footgun — the default class cannot be removed, only overridden. RouteMap.astro already handles this for photo markers and restock markers (`className: 'photo-marker'` with `:global(.photo-marker) { background: transparent !important; border: none !important; }`). New sector label divIcons will require the same treatment.

**Prevention:**
Follow the existing pattern already established in RouteMap.astro. Set `className: 'sector-label'` on divIcon and add `:global(.sector-label) { background: transparent !important; border: none !important; }` in the component's `<style>` block. OR: override the default styling directly in the `html` string of the divIcon by wrapping content in a fully styled `<div>`.

**Warning signs:**
- `L.divIcon({html: ..., iconSize: [...]})` with no `className` override
- White boxes visible around sector name labels in testing

**Phase to address:** Sector label styling phase.

**Recovery cost if hit:** LOW — one CSS rule, but visually obvious and embarrassing until fixed.

---

### Pitfall 10: Map Does Not Resize Correctly When Slide-Out Panel Opens on Desktop

**What goes wrong:**
On desktop, the slide-out panel appears on the right side, narrowing the visible map area. If the map container `#map` width is set via `width: 100%` in CSS and the panel is positioned as an overlay (absolute/fixed), the map container does not physically narrow — the panel just covers the right portion. The map's tiles continue to render for the original full width, and the center point of the map appears visually shifted (it is centered on the full width, but the visible area is now the left portion). Additionally, if the panel is implemented with CSS Grid or flex that actually changes the map container's dimensions, Leaflet does not automatically detect the resize and `map.invalidateSize()` must be called manually.

**Why it happens:**
Leaflet caches the map container's pixel dimensions at initialization time. If the container CSS dimensions change at runtime (due to layout changes from a panel opening), Leaflet does not automatically recompute tile bounds. The existing code has no `ResizeObserver` on the map container.

**Consequences:**
- After panel opens, tiles at the right edge may be missing (grey tiles)
- Zoom control positions do not update
- Labels repositioned by pan/zoom events may calculate to wrong pixel positions

**Prevention:**
1. If the panel pushes the map (changes its actual CSS width), call `map.invalidateSize({ animate: false })` after the panel CSS transition completes:
   ```javascript
   panelEl.addEventListener('transitionend', () => {
     if (leafletMap) leafletMap.invalidateSize({ animate: false });
   });
   ```
2. Preferred alternative: use absolute/overlay positioning for the panel — it overlaps the map without changing the map container's physical dimensions. Call `invalidateSize` only if the map container's width actually changes.
3. Do NOT call `invalidateSize` with `{ pan: true }` — this causes map center to shift (documented Leaflet issue #6051).

**Warning signs:**
- Grey tiles visible at map edge after panel opens
- Panel implementation changes the CSS `width` of `#map` via flex/grid layout
- No `invalidateSize` call in the panel open transition

**Phase to address:** Panel layout phase.

**Recovery cost if hit:** LOW — add `invalidateSize` call, but may require debugging which layout approach is causing the dimension change.

---

### Pitfall 11: Sector Label Midpoint Calculation Using getBounds().getCenter() Places Label Outside Curved Sectors

**What goes wrong:**
Using `polyline.getBounds().getCenter()` to position sector labels places them at the geographic center of the bounding box, not along the actual polyline path. For curved or L-shaped sectors (NF2217 spans 6.6 miles with significant direction changes), the bounding box center may be in a forest clearing well off the actual road. The label appears to float in empty space with no obvious connection to a colored line.

**Why it happens:**
`getBounds().getCenter()` returns the center of the smallest enclosing rectangle, not a point on the feature. Leaflet's `getCenter()` on Polygon calculates centroid but may also fall outside concave shapes. For polylines specifically, `polyline.getCenter()` was not added to the Leaflet core until relatively recently, and even then computes a geometric centroid that may not be visually on-path.

**Prevention:**
Use the midpoint of the point array directly — the actual geographic coordinate at the middle index of the sector's route points. This is guaranteed to be ON the road:
```javascript
const midIdx = Math.floor((sector.startIdx + sector.endIdx) / 2);
const midPoint = latlngs[midIdx]; // [lat, lon] on the actual road
const labelMarker = L.marker(midPoint, {
  icon: L.divIcon({ html: labelHTML, className: 'sector-label', ... }),
  interactive: false
});
```
This is more reliable than any centroid calculation for route polylines.

**Warning signs:**
- Labels positioned via `getBounds().getCenter()` or `polyline.getCenter()`
- Labels appear in areas that don't look like roads on CyclOSM tiles
- NF2217 or NF2266 labels appear displaced from their visible colored lines

**Phase to address:** Sector label rendering phase.

**Recovery cost if hit:** LOW — replace the position calculation, but requires re-testing all 7 label positions.

---

## Technical Debt Patterns

Established patterns in this codebase that interact with the new features.

---

### Debt Pattern A: Difficulty Data Is Not Single-Source

The existing system has TWO representations of difficulty: `annotations.json` (`easy/moderate/hard`) drives map polyline color via `SECTOR_COLORS`, while `data.md` star ratings (2-5 stars) drive the `RouteExplainer.astro` SEGMENTS array. These have never been reconciled (see Pitfall 8 for specific mismatches). Adding a detail panel that displays BOTH a colored polyline indicator AND star ratings will make this discrepancy user-visible for the first time.

**Mitigation:** Add a `stars` field to `annotations.json` and treat it as the canonical source for the panel display. This is a data schema migration, not a UI problem.

---

### Debt Pattern B: SEGMENTS Array Is Hardcoded in RouteExplainer.astro

The panel needs rich data: description, surface type, Strava link. This data currently lives as inline JavaScript in RouteExplainer.astro's frontmatter SEGMENTS array. It is not in any JSON file. The panel in RouteMap.astro (a separate `<script>` context) cannot access RouteExplainer.astro's inline data directly.

**Mitigation:** Either (a) duplicate the sector descriptions in `annotations.json`, or (b) write a new `sector-details.json` file populated at build time, or (c) inline the sector descriptions into the panel HTML as static `data-*` attributes rendered at build time by Astro. Option (c) is lowest risk and requires no pipeline changes — RouteMap.astro can loop over sectors at build time and embed their descriptions in hidden `<div data-sector-id="...">` elements that the panel JavaScript reads.

---

### Debt Pattern C: Lazy Init Race Condition Window

The `initMap()` function is triggered on first scroll or IntersectionObserver. All sector setup happens inside `initMap()`. If a user somehow triggers a sector click before `initMap()` completes (not likely but possible on very fast connections), the click handler does not exist yet. The existing code has `mapInitialized` guard flag but this only prevents double-init, not click-during-init.

**Mitigation:** The panel DOM elements should exist in the HTML from initial page load (hidden via CSS), so that ANY JavaScript timing can find them. Only the `leafletMap` reference and the sector click handlers need to wait for `initMap()`.

---

## Integration Gotchas

Specific interactions between the new features and the existing system.

---

### Gotcha 1: `window.L = L` Must Remain Before Any Further Plugin Imports

RouteMap.astro sets `window.L = L` before importing `leaflet.markercluster` because the UMD plugin attaches to the global `L` object. Any new Leaflet plugin (e.g., Leaflet.HighlightableLayers for wider touch targets) must be imported AFTER this line, or the plugin will fail silently because `window.L` is not yet set. The ordering must be:
1. `const L = await import('leaflet')`
2. `window.L = L`
3. `await import('any-leaflet-plugin')`

---

### Gotcha 2: `L.DomEvent.disableClickPropagation` Is Required for Panel DOM

The sector detail panel will contain scrollable content, links, and close buttons. These are standard DOM elements, not Leaflet layers. If the panel is positioned OVER the map (absolute positioning within the map container wrapper), clicks on the panel will propagate down to the Leaflet map via pointer events unless explicitly blocked. Use `L.DomEvent.disableClickPropagation(panelEl)` OR ensure the panel is a true sibling (outside `#map`) where Leaflet does not intercept DOM events.

---

### Gotcha 3: GestureHandling "Use Ctrl+Scroll" Overlay Conflicts With Panel on iOS

The existing `gestureHandling: true` configuration displays a semi-transparent "Use two fingers to move the map" overlay. On iOS, this overlay sometimes appears when the user touches the bottom sheet (because the gesture is intercepted as a single-finger map interaction). This creates an confusing UX where the gesture hint appears while the user is clearly trying to interact with the panel. Consider calling `map.gestureHandling.disable()` while the panel is in a drag/transition state and re-enabling on settle.

---

### Gotcha 4: The Reset Button Calls `map.closePopup()` — This Will Not Close the Custom Panel

The existing reset control (lines 121-127 of RouteMap.astro) calls `map.closePopup()` on reset. Leaflet's `closePopup()` only closes popup layers — it does NOT close a custom DOM panel. The reset button should also dispatch a `sector:panelClose` event (or call the panel close function directly) so that resetting the map also collapses the panel.

---

## Performance Traps

---

### Trap 1: Adding a `zoomend` Listener Without Debouncing

Adding a `map.on('zoomend', ...)` handler to show/hide sector labels runs on every zoom step. Leaflet fires `zoomend` once per zoom level change, which is reasonable. However, if the handler does DOM operations (adding/removing 7 markers), it should be structured to minimize work — batch adds/removes, not one DOM operation per zoom event per marker. Not a crisis for 7 sectors, but worth doing correctly.

---

### Trap 2: Sparkline SVG in Panel Re-Generated on Every Open

If the sector detail panel renders a fresh elevation sparkline SVG on each open (by recalculating from `sector-elevations.json` points at runtime), it will block the JavaScript thread briefly for each sector click. For 7 sectors with ~10 elevation points each, this is negligible. But if the sparkline calculation is inadvertently moved into a loop over all 456 route points (regression), it becomes noticeable. Use `sector-elevations.json` which already has pre-computed per-sector elevation data — never recalculate from `route-data.json` at runtime.

---

### Trap 3: Panel CSS Transitions with `height: auto`

CSS transitions from `height: 0` to `height: auto` do not animate — they jump. The bottom sheet in particular will appear to snap open rather than slide if `height: auto` is used. Use `max-height` transitions or `transform: translateY` instead. The existing animated dividers in this project use `transform` transitions — follow that pattern.

---

## UX Pitfalls

---

### UX Pitfall 1: Detail Panel Obscures the Sector Being Described

On mobile, a bottom sheet that opens to 50% viewport height covers the lower half of the map. The sector being described (e.g., Rapid River at mile 94-100, near the route endpoint) may be in the lower half of the map view and thus completely hidden by the panel. The user clicks a sector and it disappears behind the panel they opened.

**Prevention:** When a sector is clicked and the panel opens, pan the map to center on the sector's midpoint, offset by the panel height. Leaflet supports this via `map.panBy([0, -panelHeightPx / 2])` or `map.panTo(midpoint, { animate: true })`.

---

### UX Pitfall 2: No Visual Indication of Which Sector Is "Active"

When a user clicks sector A and the panel opens showing sector A's details, then zooms out and cannot remember which colored line triggered the panel, they are confused. The active sector has no visual highlight distinguishing it from the other 6 sectors.

**Prevention:** On sector click, visually differentiate the active polyline (increase weight to 7, or add a white border/outline). Store a reference to the currently-active sector polyline. On panel close, reset the style. Using the ghost-layer pattern (Pitfall 1), apply the highlight to the visible layer.

---

### UX Pitfall 3: Close Button Is the Only Escape on Mobile

If the panel has only a close button (and no backdrop tap, no swipe-down gesture), mobile users who are used to "tap outside to close" will be confused. iOS bottom sheet conventions include a horizontal drag handle at the top for swipe-down dismissal.

**Prevention:** Implement both: (1) a visible close button meeting 52px touch target requirement, and (2) a swipe-down-to-close gesture on the drag handle.

---

### UX Pitfall 4: prefers-reduced-motion Not Applied to Panel Slide Transition

The existing codebase has comprehensive `prefers-reduced-motion` support (Leaflet transitions, animated dividers, scroll reveals — all gated). A new panel slide-in animation must follow the same discipline. A panel that slides in from the right (desktop) or up from the bottom (mobile) must either stop animating or use `opacity` fade only when `prefers-reduced-motion: reduce` is active.

**Prevention:** Follow the existing pattern: read `window.matchMedia('(prefers-reduced-motion: reduce)').matches` at the start of `initMap()`. Store as `prefersReducedMotion` (already done in the existing code). Use this flag to conditionally skip panel slide transitions:
```javascript
const transitionClass = prefersReducedMotion ? 'sector-panel--no-motion' : 'sector-panel--animate';
panelEl.classList.add(transitionClass);
```

---

## "Looks Done But Isn't" Checklist

Tests that appear to pass on first inspection but hide real problems.

- [ ] **Desktop-only testing**: Panel works on desktop, but bottom sheet not tested on real iOS Safari device (not DevTools emulation). Touch gesture conflicts on iOS differ from Chrome mobile emulation.
- [ ] **Short session testing**: Labels look correct after first user pan. But did you test labels on page load before ANY user interaction? Permanent tooltip positioning on first load is a known failure mode (Pitfall 5).
- [ ] **Rapid click testing**: Click sector A, immediately click sector B before A's panel finishes sliding in. Does the panel show B's data? Does state get corrupted?
- [ ] **Reset button smoke test**: Open a sector panel, then click the map reset button. Does the panel close? Does the map return to full-route view? Does the bikeMarker disappear if it was visible?
- [ ] **Hover sync after panel closes**: Open a panel, close it, then hover over the elevation chart. Does the bikeMarker reappear correctly? (Tests Pitfall 3 cleanup.)
- [ ] **Sector click on zoom level 10**: At the default route-overview zoom, clicking a 5px polyline on a touchscreen. Succeeds? (Tests Pitfall 1.)
- [ ] **Panel z-index above zoom controls**: Zoom controls have z-index 1000 in Leaflet. Is the panel rendered above or below them? (Tests Pitfall 4.)
- [ ] **Keyboard accessibility**: Can the panel be dismissed with Escape? Does focus return to the previously-focused element (the map)? (Not cosmetic — required for WCAG 2.1.2.)
- [ ] **Screen reader test**: Does a screen reader announce the panel when it opens? Does `aria-modal` or `role="dialog"` + `aria-label` exist?
- [ ] **prefers-reduced-motion**: Enable "Reduce Motion" in macOS Accessibility settings. Does the panel appear instantly (no slide) or animate?

---

## Recovery Strategies

If a pitfall is hit post-implementation:

**For ghost layer touch targets (Pitfall 1):**
Wrap the sector-creation loop in a helper function `addSectorPolylines(sector, latlngs)`. This makes it easy to modify the creation pattern for all 7 sectors at once without copy-paste error.

**For event propagation (Pitfall 2):**
If the map click handler and sector click handler conflict, add `e.originalEvent._leafletHandled = true` in the sector handler and check for this flag in the map handler before executing. This is a reliable Leaflet-compatible propagation guard.

**For difficulty data reconciliation (Pitfall 8):**
The safest migration path is to add a `stars` field to annotations.json without removing `difficulty`. The `difficulty` field continues to drive polyline colors. The new `stars` field drives the panel display. The two systems are then independent and can be corrected separately.

**For bottom sheet iOS gesture conflict (Pitfall 6):**
If full gesture disambiguation is too complex for the first implementation, a safe fallback is to close the bottom sheet automatically when the user starts a map drag (`map.on('dragstart', closePanel)`). This prevents the conflict by ensuring only one interaction is active at a time, at the cost of the sheet closing unexpectedly during map exploration.

---

## Pitfall-to-Phase Mapping

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Sector click handler setup | Pitfall 2 (event bubbling) | Set `bubblingMouseEvents: false` first |
| Sector click touch targets | Pitfall 1 (thin hit area) | Ghost layer pattern from day one |
| Sector label placement | Pitfalls 5, 7, 11 | Post-fitBounds timing, zoom gating, midpoint index |
| Label styling | Pitfall 9 (white box) | Follow existing photo-marker pattern |
| Panel DOM structure | Pitfall 4 (z-index) | Panel as sibling, not child of #map |
| Panel data content | Pitfall 8 (difficulty mismatch), Debt B | Reconcile data sources before building UI |
| Panel open/close logic | Pitfall 3 (event bus), Gotcha 4 | Dispatch `elevation:leave`; update reset button |
| Desktop layout (slide-out) | Pitfall 10 (invalidateSize) | `invalidateSize` on transitionend |
| Mobile layout (bottom sheet) | Pitfall 6 (gesture conflict), UX 1 (obscures sector) | `map.dragging.disable()`, pan to sector |
| Animation/transitions | UX Pitfall 4 (reduced motion) | Use existing `prefersReducedMotion` flag |
| Accessibility | UX Pitfall 3, checklist items | Focus trap, Escape key, ARIA roles |

---

## Sources

- Leaflet GitHub issue #1264 (polyline touch area): https://github.com/Leaflet/Leaflet/issues/1264
- Leaflet GitHub issue #5313 (bubblingMouseEvents polyline + map click): https://github.com/Leaflet/Leaflet/issues/5313
- Leaflet.HighlightableLayers (20px transparent hit area): https://github.com/FacilMap/Leaflet.HighlightableLayers
- Leaflet map panes and z-index documentation: https://leafletjs.com/examples/map-panes/
- Leaflet tooltip hide/show by zoom (GitHub issue #5032): https://github.com/Leaflet/Leaflet/issues/5032
- Leaflet permanent tooltip positioning issue: https://github.com/miguelcobain/ember-leaflet/issues/165
- Leaflet invalidateSize center-shift issue (#6051): https://github.com/Leaflet/Leaflet/issues/6051
- OpenStreetMap community: Leaflet z-index DOM overlay conflict: https://community.openstreetmap.org/t/leaflet-map-is-unaffected-by-z-index-interferes-with-overlayed-dom-events/114778
- Leaflet GestureHandling iOS issues (#98, #99): https://github.com/elmarquis/leaflet.gesturehandling/issues
- MDN overscroll-behavior: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior
- MDN touch-action: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action
- iOS Safari dvh viewport height issues: https://opus.ing/posts/fixing-ios-safaris-menu-bar-overlap-css-viewport-units
- Focus management for modal dialogs (accessibility): https://testparty.ai/blog/modal-dialog-accessibility
- Accessible slide menus (focus trap): https://knowbility.org/blog/2020/accessible-slide-menus
- Automatic Labels in Leaflet (academic, 2023): https://ica-adv.copernicus.org/articles/4/8/2023/ica-adv-4-8-2023.pdf
- Direct codebase analysis: `/Users/Sheppardjm/Repos/hiawathasRevenge/src/components/RouteMap.astro`
- Direct data analysis: `/Users/Sheppardjm/Repos/hiawathasRevenge/public/data/annotations.json`, `sector-elevations.json`, `data.md`
