# Project Research Summary

**Project:** Hiawatha's Revenge — v1.3 Map Interactivity
**Domain:** Interactive cycling route map — sector labels, clickable polylines, responsive detail panels
**Researched:** 2026-04-02
**Confidence:** HIGH

---

## Executive Summary

v1.3 adds three tightly coupled capabilities to the existing Leaflet map: permanent sector name + difficulty labels at each sector's geographic midpoint, click handlers on the 7 sector polylines that open a detail panel, and a responsive panel that slides in from the right on desktop and slides up as a bottom sheet on mobile. All three features can be delivered with zero new npm dependencies using Leaflet 1.9.4 (already installed), the native HTML `<dialog>` element, and CSS `translate` transitions. The implementation is additive — no existing components change behavior, no new Astro components are needed, and the existing event bus is extended only with a new `map:sectorClick` dispatch for future use.

The central architectural challenge is getting build-time editorial content (sector descriptions, star ratings, surface types, Strava IDs) into a client-side panel assembled at runtime inside `initMap()`. The correct solution is a new build-time script (`generate-sector-details.js`) that outputs `public/data/sector-details.json`, fetched at runtime alongside the existing `annotations.json`. This follows the established pipeline pattern and eliminates duplicate sources of truth. The elevation sparkline for each sector panel is replicated as a ~20-line `buildSparklineSVG()` JS helper ported directly from `ElevationSparkline.astro` math — no additional fetch or Astro component involvement needed.

The highest-risk issues are not architectural: they are data inconsistency and mobile touch targets. The `annotations.json` difficulty tiers (`easy/moderate/hard`) and `data.md` star ratings (2–5 stars) use incompatible classification systems and disagree on multiple specific sectors — this contradiction has been invisible until now but becomes directly user-visible the moment a panel shows both a colored polyline and a star rating. This must be reconciled before panel UI is built. Additionally, 5px polyline stroke widths are below reliable touch target size on mobile — a transparent ghost polyline at 20–30px weight carrying all click events is required from the start, not as a retrofit. Both issues are well-understood and fully preventable with the correct build order.

---

## Key Findings

### Recommended Stack

All v1.3 features are implementable with the existing stack at Leaflet 1.9.4 + Astro 6 + Vite 7. The HTML `<dialog>` element (Baseline Widely Available since March 2022) replaces any need for a custom modal library — `showModal()` provides focus trapping, Escape-key close, and `::backdrop` for free. CSS `translate` transitions (hardware-accelerated, compositor-thread) replace any JS animation library. Do not upgrade to Leaflet 2.0-alpha: it is pre-release, has breaking ESM API changes, and `leaflet.markercluster` and `leaflet-gesture-handling` have not published compatible versions.

**Core technologies:**
- **Leaflet 1.9.4:** Sector labels via `L.marker` + `L.divIcon` at computed midpoint; polyline click/hover via `.on('click'|'mouseover'|'mouseout')`; event propagation controlled with `bubblingMouseEvents: false` — already installed, all APIs confirmed in official docs
- **HTML `<dialog>` (native):** Slide-out panel container with `showModal()` for modal semantics, focus trapping, Escape-key dismiss, and `::backdrop` — no library needed, zero JS overhead beyond open/close calls
- **CSS `translate` + `@media`:** Hardware-accelerated slide-in from right (desktop) and slide-up from bottom (mobile) via a single `<dialog>` element with media-query layout switching — no viewport-detection JS needed
- **CSS `@starting-style` (progressive enhancement):** Entry animation on panel open; ~86% browser support (Chrome 117+, Firefox 129+, Safari 17.5+); non-supporting browsers get instant panel appearance with no functional loss

**Optional dependency — add only if touch testing shows need:**
- `leaflet-highlightable-layers` — transparent 20px hit-area overlay on sector polylines; the ghost-polyline pattern achieves the same outcome without a new package and is preferred

### Expected Features

**Must have (table stakes) — all 5 required for the feature to feel complete:**
- Sector name labels on map at geographic midpoints — users expect named overlays; anonymous color-coded lines without labels feel incomplete (confirmed across AllTrails, Komoot, Ride with GPS, Trailforks)
- Difficulty star ratings on labels — color alone is insufficient for accessibility and scanning; every major cycling app surfaces difficulty alongside segment names
- Click sector polyline → open detail panel — the fundamental "clickable map" contract; overlays that do nothing on click feel broken
- Responsive panel: right slide-out on desktop (width ~400px), bottom sheet at `max-width: 768px` (height ~60dvh) — industry-standard pattern (Google Maps, AllTrails, Komoot); mobile needs vertical space use, not horizontal
- Panel close: X button, Escape key, backdrop click — non-negotiable for accessibility; NN/g identifies missing close affordances as a top failure mode for bottom sheets

**Should have (low-complexity differentiators — include in v1.3 MVP):**
- Hover state on polylines: `mouseover` → `setStyle({weight: 7, opacity: 1})` — required for discoverability on desktop; LOW complexity
- Active sector highlight: opened sector stays visually distinct (thicker stroke) while panel is open — wayfinding feedback; LOW complexity
- National Park design treatment for panel: dark `forest-900` background, National Park typeface heading, difficulty-color accent — maintains site visual identity; LOW complexity (pure CSS)
- "Read full segment guide" smooth-scroll link from panel to RouteExplainer card — bridges map and editorial content; LOW complexity (one `scrollIntoView` call + stable IDs on segment cards)

**Defer post-v1.3:**
- Elevation chart highlight synced to sector click — MEDIUM complexity (requires Chart.js annotation plugin or CSS overlay coordinated with ElevationProfile component); high value but not essential for v1.3 ship; the `map:sectorClick` event dispatch leaves the wire in place

**Anti-features to deliberately avoid:**
- Drag-to-snap multi-point bottom sheet — ~200 lines of custom touch JS or a React library for a read-only panel; 2-state model is sufficient
- Leaflet `bindPopup` for sector detail — renders inside map stacking context, cannot be bottom-sheet, conflicts with restock popups, limited CSS control
- `bindTooltip({permanent: true})` on polylines — documented-broken positioning on polylines (Leaflet issue #5758, closed without fix); anchors to first coordinate, not geometric midpoint
- Auto-pan map to center on sector click — disorienting for a 100-mile linear route; Komoot also does not do this

### Architecture Approach

The feature lives entirely within `RouteMap.astro`: the `<dialog>` panel HTML goes in the component template as a sibling to `<div id="map">` (not inside it), the panel CSS in the `<style>` block, and the panel + click handler JS inside `initMap()` where Leaflet is in scope. A new build script (`generate-sector-details.js`) joins the existing pipeline to produce `public/data/sector-details.json`, fetched at runtime. No new Astro components, no SSR changes, no new CustomEvent listeners — only a new `map:sectorClick` dispatch for future consumers.

**Major components and their responsibilities:**

1. **`scripts/generate-sector-details.js` (new build script)** — reads canonical sector content (descriptions, surface types, Strava IDs) and writes `public/data/sector-details.json` at build time; resolves the SEGMENTS-in-RouteExplainer vs. panel content duplication problem
2. **`RouteMap.astro` — panel HTML/CSS block** — `<dialog id="sector-panel">` as sibling to `#map` inside the existing relative-positioned `.route-map` wrapper; CSS handles both layout variants and the `prefers-reduced-motion` override
3. **`RouteMap.astro` — `initMap()` extensions** — fetch `sector-details.json` + `sector-elevations.json`, build `sectorDetailsMap` and `sectorElevMap` module-scope Maps, register non-interactive `L.marker` labels at midpoints with zoom visibility gating, register ghost + visible polyline pairs with click/hover handlers, implement `openSectorPanel()` and `closeSectorPanel()`
4. **`buildSparklineSVG()` helper (inline in initMap)** — 20-line port of `ElevationSparkline.astro` math; renders inline SVG from `sectorElevMap` at panel-open time without a separate fetch or Astro component invocation
5. **`pipeline.js` (modified)** — adds `generate-sector-details` as a pipeline step before `astro build`

### Critical Pitfalls

1. **5px polyline touch targets are too narrow on mobile** — implement a transparent ghost polyline at 20–30px weight on top of each visible polyline (which is set `interactive: false`); the ghost carries all click handlers. Leaflet's SVG renderer uses visual stroke width as the hit area — there is no built-in `touchTolerance` for SVG paths (confirmed Leaflet GitHub issue #1264, open since 2013). Build the ghost-layer pattern into the sector creation loop from the start. Recovery cost if missed: MEDIUM (refactor all 7 sector polyline constructions + iOS/Android retest).

2. **`bubblingMouseEvents` causes panel to flash open and instantly close** — if `map.on('click', closePanel)` exists alongside polyline click handlers, the sector click fires both. Set `bubblingMouseEvents: false` on all interactive polylines AND call `L.DomEvent.stopPropagation(e)` inside the handler (belt-and-suspenders). Establish this in the click handler phase from the start. Recovery cost: LOW to fix, HIGH to diagnose if not known.

3. **Difficulty data inconsistency between `annotations.json` and `data.md`** — the two sources use incompatible systems (3-tier vs. 5-star) and disagree on multiple sectors specifically: Rapid River Truck Trail is `hard` in annotations but 2-star in data.md; Doe Lake is `easy` in annotations but 4-star in data.md. This must be reconciled before panel UI is built. Recommended fix: add a `stars` field to `annotations.json` and treat it as the canonical source. Recovery cost if discovered late: MEDIUM (pipeline changes + re-testing all sector visual states).

4. **`bindTooltip({permanent:true})` on polylines positions labels at the wrong point** — anchors to the first coordinate of the polyline, not a midpoint; the position drifts after `fitBounds` in lazy-init flows. Use `L.marker` + `L.divIcon` at `latlngs[Math.floor((startIdx+endIdx)/2)]` instead. This approach is guaranteed on-road and fully bypasses Leaflet's tooltip positioning (Leaflet issue #5758, closed without fix). Recovery cost if wrong approach used: MEDIUM (replace positioning logic + retest all 7 labels).

5. **Panel placed inside `#map` breaks z-index layering** — Leaflet creates its own stacking context inside `#map`; elements inside it cannot escape z-index 1001 (Leaflet controls). The panel must be a sibling of `#map` inside the relative-positioned `.route-map` wrapper. Establish this DOM structure before writing any open/close JS. Recovery cost: MEDIUM (restructure HTML + update CSS selectors + update JS DOM queries).

**Additional pitfalls to address in implementation:**
- Sector labels at overview zoom collide with CyclOSM tile text — implement `zoomend` visibility gate (show labels only at zoom ≥ 12); use opaque dark pill background for contrast at any zoom
- `openSectorPanel()` does not dispatch `elevation:leave` — bikeMarker stays frozen on map; add `window.dispatchEvent(new CustomEvent('elevation:leave'))` at the top of `openSectorPanel()`
- Default `L.divIcon` renders a white box unless `className` is explicitly overridden — follow existing photo-marker pattern (`className: 'sector-label'` + `:global(.sector-label) { background: transparent !important; border: none !important; }`)
- `map.invalidateSize()` required after slide-out opens if panel pushes the map container width; use overlay positioning to avoid this requirement
- iOS Safari gesture conflicts — `leaflet-gesture-handling` has documented issues on iOS (#98, #99); when bottom sheet is in a drag state, call `map.dragging.disable()` and re-enable on settle

---

## Implications for Roadmap

v1.3 delivers in 3 phases. The build order is dictated by hard data and DOM dependencies: data reconciliation must precede panel UI, and panel DOM structure must precede click handler wiring.

### Phase 23: Data Reconciliation + Sector Details Pipeline

**Rationale:** Two issues block everything downstream. The difficulty discrepancy between `annotations.json` and `data.md` will produce contradictory UI (red "hard" polyline + "2-star" panel for Rapid River) if not fixed before panel UI is built. And the panel needs `sector-details.json` to exist before any panel logic can be written or tested. This phase has no visual deliverable but eliminates the highest recovery-cost problems.

**Delivers:** Reconciled difficulty classification in `annotations.json` (with `stars` field added and all 7 sectors verified); `scripts/generate-sector-details.js` producing `public/data/sector-details.json`; `pipeline.js` updated; verified JSON output confirming shape matches Architecture Pattern 1

**Addresses:** FEATURES table-stakes data integrity; PITFALLS 8 (difficulty inconsistency) and Debt Pattern B (SEGMENTS hardcoded in RouteExplainer.astro)

**Avoids:** Late-discovery data contradiction visible in the panel; content duplication across two files

**Research flag:** Standard patterns — pipeline extension mirrors `resolve-annotations.js` exactly. Data reconciliation is an editorial decision, not a technical research question.

---

### Phase 24: Sector Labels on Map

**Rationale:** Labels are the prerequisite for click interaction — users need visual affordance before they discover sectors are clickable. This phase also establishes the `L.marker` + `L.divIcon` non-interactive label pattern, the zoom-threshold visibility gate, and the `<dialog>` panel DOM structure (as static HTML with CSS, no JS logic yet). Scaffolding the panel here gives Phase 25 a wired target.

**Delivers:** Sector name + difficulty star labels at geographic midpoints, visible at zoom ≥ 12, with opaque pill styling using existing design token palette; `<dialog id="sector-panel">` in DOM (hidden, no open/close logic); full panel CSS for desktop right-panel and mobile bottom-sheet variants including `@starting-style` animation and `prefers-reduced-motion` override

**Uses:** Leaflet `L.marker` + `L.divIcon` at `latlngs[Math.floor((startIdx+endIdx)/2)]`; CSS `translate`; `@starting-style` as progressive enhancement; `@media (max-width: 768px)` for bottom-sheet variant

**Implements:** Architecture Pattern 2 (midpoint label markers) + Pattern 4 (panel HTML in RouteMap.astro template)

**Avoids:** PITFALLS 5 (tooltip positioning), 7 (tile background interference), 9 (default white divIcon box), 11 (bounding-box centroid off-road)

**Research flag:** Standard patterns — well-documented Leaflet marker and CSS dialog patterns, no unknowns.

---

### Phase 25: Click Handlers, Panel Logic, and Responsive Behavior

**Rationale:** With data available (Phase 23) and DOM structure in place (Phase 24), all remaining features land in one phase: polyline click handlers with ghost hit layers, panel open/close logic, panel content rendering, accessibility wiring, hover/active states, and the low-complexity differentiators. Grouping these together avoids a fourth phase of overhead — hover state, active highlight, jump link, and design treatment are all LOW complexity and tightly coupled to the click/panel logic. Mobile touch behavior on iOS is the highest-risk area and requires explicit device test steps.

**Delivers:** Clickable sector polylines with transparent ghost polylines at 20–30px weight; `openSectorPanel()` / `closeSectorPanel()` wired to all 7 sectors; panel content populated (name, stars, sparkline SVG, distance/mile-range, surface type, terrain description, Strava link, jump link); hover state (weight increase on `mouseover`); active-sector highlight (thicker stroke while panel open); National Park design treatment; `map:sectorClick` CustomEvent dispatch; `elevation:leave` dispatch on panel open; `ResetControl` extended to call `closeSectorPanel()`; full keyboard accessibility (Escape close, focus trap, focus return); `map.invalidateSize()` on `transitionend`; iOS gesture conflict prevention (`map.dragging.disable()` during sheet transition, `overscroll-behavior: none`, `touch-action: none` on drag handle)

**Uses:** `<dialog>.showModal()`; `bubblingMouseEvents: false`; `L.DomEvent.stopPropagation`; `buildSparklineSVG()` helper ported from ElevationSparkline.astro; `sectorDetailsMap` + `sectorElevMap` module-scope Maps; `window.matchMedia` (or pure CSS) for breakpoint detection

**Implements:** Architecture Patterns 3–7 (click handlers, panel overlay, CSS transitions, sparkline rendering, module-scope data maps) + Event Bus extension (map:sectorClick)

**Avoids:** PITFALLS 1 (touch targets via ghost polyline), 2 (event bubbling via bubblingMouseEvents:false), 3 (elevation:hover frozen via explicit elevation:leave dispatch), 4 (z-index stacking via sibling DOM placement), 6 (iOS gesture conflicts via map.dragging coordination), 10 (invalidateSize on transitionend); Gotchas 1–3

**Research flag:** iOS touch behavior requires explicit device testing — `leaflet-gesture-handling` iOS issues (#98, #99) cannot be reproduced in Chrome DevTools. Phase plan must include iOS Safari test steps for: (a) tap sector polyline, (b) partially-open bottom sheet + attempt map pan, (c) gesture hint overlay not appearing during panel interactions.

---

### Phase Ordering Rationale

- **Data before UI:** Pitfall 8 (difficulty inconsistency) cannot be patched retroactively once panel UI is built without rewriting content logic. Phase 23 closes this risk first.
- **DOM structure before JS:** The panel must exist in the DOM before `initMap()` wires click handlers into it. Phase 24 scaffolds the static HTML; Phase 25 activates it. This also allows CSS panel behavior to be verified independently of JS logic.
- **Labels before clicks:** Users need visual affordance to discover sectors are interactive. Labels also establish the midpoint calculation and the `L.marker` non-interactive pattern reused by the ghost hit layer in Phase 25.
- **All differentiators in Phase 25:** Hover state, active highlight, jump link, and design treatment are LOW complexity and deeply coupled to the click/panel logic. Isolating them into a fourth phase adds overhead without benefit.
- **Elevation chart sync deferred post-v1.3:** Requires Chart.js annotation plugin evaluation and ElevationProfile coordination — medium complexity for a showcase differentiator. The `map:sectorClick` dispatch in Phase 25 leaves the wire in place.

### Research Flags

**Needs attention during phase planning:**
- **Phase 25 — iOS touch behavior:** `leaflet-gesture-handling` has documented iOS issues (GitHub #98, #99 reported July–September 2024). The interaction between the gesture plugin, bottom sheet drag, and Leaflet map pan gesture requires explicit test steps and a clear `map.dragging.disable()` / `map.dragging.enable()` strategy. Device testing required — Chrome DevTools mobile emulation does not reproduce iOS touch event routing.
- **Phase 25 — `@starting-style` fallback:** ~14% of browsers will get instant panel appearance without slide animation. Verify this is visually acceptable. Should be — the panel content still appears correctly — but worth a QA note.

**Standard patterns (skip `/gsd:research-phase`):**
- **Phase 23:** Pipeline extension is a direct copy of the `resolve-annotations.js` pattern. Data schema migration is a content decision, not a technical research question.
- **Phase 24:** `L.marker` + `L.divIcon` at computed midpoint, CSS `<dialog>` slide-out, and zoom visibility gating are all thoroughly documented with verified implementation patterns in the research files.
- **Phase 25 (except iOS touch):** `<dialog>.showModal()`, `bubblingMouseEvents: false`, CSS class-toggle transitions, `buildSparklineSVG()` port — all well-documented with code-level examples in STACK.md and ARCHITECTURE.md.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations verified against official Leaflet 1.9.4 docs and MDN. Zero new dependencies for baseline implementation. Ghost-polyline and `leaflet-highlightable-layers` both validated as touch-target solutions. |
| Features | HIGH | Patterns verified against AllTrails, Komoot, Ride with GPS, Trailforks, Google Maps competitive analysis. NN/g bottom sheet research cited. Feature scope is unambiguous. |
| Architecture | HIGH | Based on direct source analysis of RouteMap.astro, ElevationSparkline.astro, ElevationProfile.astro, annotations.json, sector-elevations.json, and pipeline.js. All integration points verified against actual file contents. |
| Pitfalls | HIGH (Leaflet-specific), MEDIUM (iOS touch) | Leaflet pitfalls verified against official docs and confirmed GitHub issues. iOS Safari gesture conflicts are platform-specific — documented behavior but real-device variance is possible and cannot be fully characterized without device testing. |

**Overall confidence:** HIGH

### Gaps to Address

- **Difficulty data reconciliation decision:** The specific mapping between `annotations.json` difficulty tiers and `data.md` star ratings requires an editorial decision before Phase 23 can produce `sector-details.json`. Research documents the discrepancies (7 mismatches). Recommended resolution: treat `data.md` star ratings as canonical (more granular), reclassify `annotations.json` to match, and add a `stars` integer field.
- **Ghost polyline vs. `leaflet-highlightable-layers`:** Research recommends the ghost-polyline pattern (zero dependencies), but documents the library as a validated alternative. The phase plan should commit to one approach at the start of Phase 25 rather than leaving it open.
- **Panel width on narrow desktop viewports:** At `min(400px, 90vw)` panel width, an 900px desktop screen leaves 500px for the map. Acceptable but worth a QA note in Phase 25 — not a blocker.
- **Elevation chart highlight (deferred):** Post-v1.3 implementation will need to evaluate Chart.js annotation plugin vs. CSS overlay approach. The `map:sectorClick` event dispatch in Phase 25 is the wire; the listener lives in a future milestone.

---

## Sources

### Primary (HIGH confidence — official docs or direct codebase analysis)

- [Leaflet 1.9.4 Reference](https://leafletjs.com/reference.html) — `bindTooltip`, `L.marker`, `L.divIcon`, `bubblingMouseEvents`, `polyline.on()`, `setStyle()`, `interactive` option, `L.DomEvent`
- [Leaflet GitHub Releases](https://github.com/leaflet/leaflet/releases) — 1.9.4 confirmed current stable; 2.0.0-alpha.1 confirmed pre-release with plugin incompatibilities
- [MDN — `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) — `showModal()`, `close()`, `::backdrop`, focus trapping; Baseline Widely Available March 2022
- [MDN — `@starting-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style) — Baseline Newly Available August 2024; ~86% support
- Direct source analysis: `RouteMap.astro`, `ElevationSparkline.astro`, `ElevationProfile.astro`, `PhotoGallery.astro`, `annotations.json`, `sector-elevations.json`, `pipeline.js`, `data.md`
- [W3C ARIA APG — Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) — focus trap, Escape key, focus return patterns

### Secondary (MEDIUM confidence — community sources, cross-referenced)

- [Leaflet issue #5758](https://github.com/Leaflet/Leaflet/issues/5758) — permanent tooltip positioning on polylines confirmed broken; closed without fix
- [Leaflet issue #1264](https://github.com/Leaflet/Leaflet/issues/1264) — SVG hit area limited to visual stroke width; Canvas backend fix only; SVG unresolved
- [leaflet-gesture-handling GitHub issues #98, #99](https://github.com/elmarquis/Leaflet.GestureHandling/issues) — iOS marker click interference; reported July–September 2024
- [Ben Nadel — Dialog as Fly-out Sidebar](https://www.bennadel.com/blog/4862-opening-the-dialog-element-as-a-fly-out-sidebar.htm) — `inset: 0 0 0 auto` + `margin: 0` pattern for right-panel dialog
- [Simon Willison TIL — Full-height Dialog](https://til.simonwillison.net/css/dialog-full-height) — `height: 100dvh` / `max-height: 100dvh` for no-gap right panel
- [Frontend Masters — Dialog Entry Animations](https://frontendmasters.com/blog/the-dialog-element-with-entry-and-exit-animations/) — `@starting-style` + `translate` pattern
- [NN/g Bottom Sheet Research](https://www.nngroup.com/articles/bottom-sheet/) — 2-state vs. multi-snap; missing close button as top failure mode
- [leaflet-highlightable-layers](https://github.com/FacilMap/Leaflet.HighlightableLayers) — transparent hit-area overlay pattern; Leaflet 1.x compatible; alternative to ghost-polyline approach

### Tertiary (MEDIUM confidence — product/feature survey)

- AllTrails, Komoot, Ride with GPS, Trailforks, Google Maps, Strava Route — competitive feature analysis for label patterns, panel placement, bottom sheet behavior, difficulty display (direct product inspection)
- [NN/g / LogRocket — Bottom Sheet Design Patterns](https://blog.logrocket.com/ux-design/bottom-sheets-optimized-ux/) — snap point complexity vs. 2-state model

---

*Research completed: 2026-04-02*
*Ready for roadmap: yes*
