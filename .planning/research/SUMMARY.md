# Project Research Summary

**Project:** Hiawatha's Revenge v1.5 -- Multi-Route Support
**Domain:** Cycling event showcase site with interactive map, elevation profile, and per-route data switching
**Researched:** 2026-04-06
**Confidence:** HIGH

## Executive Summary

Hiawatha's Revenge v1.5 adds 100k (~62mi) and 50k (~31mi) route variants alongside the existing 100-mile flagship route. All three routes are nested geographic loops starting and ending in Munising, with shorter routes being strict geographic subsets of longer ones. The existing stack (Astro 6, Leaflet 1.9.4, Chart.js 4.5.1, fast-xml-parser 5.5.9, simplify-js 1.2.4) requires zero new dependencies. This is fundamentally a data architecture and pipeline problem -- restructuring a single-route build pipeline to produce per-route JSON files, then wiring client-side components to swap data on user interaction.

The recommended approach is **per-route file namespacing** (e.g., `public/data/100mi/route-data.json`) with a lightweight route manifest (`routes.json`) that drives the UI. The pipeline runs route-specific steps in a loop, writing to subdirectories. Client-side switching uses Leaflet `L.layerGroup` for polyline toggling, Chart.js destroy-and-recreate for elevation profile swapping, and the existing `CustomEvent` bus extended with a `route:change` event for cross-component coordination. All research files converge on this architecture independently.

The highest-risk area is the pipeline phase: surface data exists only for the 100mi route (the 100k GPX is from Strava with no surface metadata), sector annotations use route-specific array indices that must be recomputed per route via coordinate-based snapping instead of mile-based snapping, and elevation gain calibration is hardcoded to 100mi reference values. These issues are all solvable but must be addressed first -- every client-side feature depends on correct per-route data. The client-side work follows well-documented patterns (Leaflet LayerGroup API, Chart.js dataset replacement) with high confidence.

## Key Findings

### Recommended Stack

No changes to the technology stack. Every capability needed for multi-route support exists in the installed libraries. Leaflet's `L.layerGroup` handles polyline toggling, Chart.js v4 supports full dataset replacement via `chart.destroy()` + `new Chart()`, and `fast-xml-parser` parses all three GPX file formats identically despite different source tools (RidewithGPS vs Strava).

**Core technologies (unchanged):**
- **Leaflet 1.9.4:** `L.layerGroup` for per-route layer management, custom `L.Control.extend()` for route selector (already proven pattern with existing ResetControl)
- **Chart.js 4.5.1:** Destroy-and-recreate pattern for full elevation profile swapping with LTTB decimation compatibility
- **fast-xml-parser 5.5.9:** Handles all 3 GPX formats (RidewithGPS 5-decimal, Strava 7-decimal) via identical `gpx.trk.trkseg.trkpt` path
- **simplify-js 1.2.4:** Stateless RDP -- works on any point array with no route-specific configuration

**What NOT to add:** Turf.js (hardcoded sector membership beats geographic overlap detection for 3 fixed routes), Nano Stores/Zustand (one CustomEvent for a single string value does not warrant a state library), Leaflet 2.0 (alpha, breaks marker cluster), `@astrojs/react` (3-button selector does not warrant a framework island).

### Expected Features

**Must have (table stakes):**
- Route selector control on map (segmented control with `role="radiogroup"` accessibility)
- Route polyline swap with `map.fitBounds()` transition
- Elevation profile swap (destroy + recreate chart on route change)
- Sector overlay filtering (only show sectors present on selected route)
- Route stats update per selection (pre-render all three, toggle `hidden`)
- Per-route GPX download link (dynamic `href` swap on `route:change`)
- Pipeline expansion to produce per-route JSON data files

**Should have (high value, low complexity -- include in MVP):**
- Bike marker crosshair respects route switch (swap `routePoints` reference)
- Deep link to specific route via URL hash (`#route=100k`)
- Ghost routes showing inactive routes at low opacity for geographic context

**Defer (v2+):**
- Route color coding (nice visual touch but not essential)
- Animated crossfade transitions between routes (Leaflet SVG opacity is browser-dependent)
- Route comparison stats sidebar (low complexity but adds design decisions)

### Architecture Approach

The architecture follows a **per-route file namespace** pattern: the pipeline writes to `public/data/{routeId}/` subdirectories, a shared `routes.json` manifest provides selector metadata, and client-side components fetch route-specific files on demand. Shared content (sector editorial, photos, historical content) remains in flat files at `public/data/`. The key architectural insight is that sector `startIdx`/`endIdx` values are route-specific array indices that must be independently computed per route via geographic coordinate snapping -- not mile-based snapping, since the same physical sector appears at different mile markers on different routes.

**Major components:**
1. **Pipeline (route-specific loop):** `parse-gpx.js`, `resolve-annotations.js`, `compute-sector-elevations.js`, `generate-surface-points.js` each accept a route ID and write to per-route subdirectories
2. **Route manifest generator (`generate-routes-manifest.js`):** New pipeline step that aggregates per-route metadata into `routes.json`
3. **Route config (`scripts/route-config.js`):** New shared config defining route IDs, GPX filenames, sector membership, and elevation calibration params
4. **RouteMap.astro (refactored):** `initMap()` split into one-time setup + `renderRoute()` function; route-specific layers managed via `L.layerGroup`; route selector as custom `L.Control`
5. **ElevationProfile.astro (extended):** Listens for `route:change`, destroys and recreates chart with new route data
6. **RouteStats.astro (pre-rendered):** All three route stat sets rendered at build time, toggled via `hidden` attribute

### Critical Pitfalls

1. **Surface data has no source for 100k/50k routes** -- The surface coloring pipeline depends on a RidewithGPS JSON export (`hiawathasRevenge.json`) that only exists for the 100mi route. The 100k GPX comes from Strava (no surface metadata). Prevention: skip surface coloring for shorter routes (single-color polyline) or use nearest-neighbor geographic matching from 100mi surface data. Start simple -- surface coloring is not table stakes for route switching.

2. **Sector startIdx/endIdx are route-specific array indices** -- Annotations use indices into a specific route's simplified point array. Running `resolve-annotations.js` for a different route produces different point arrays with different indices. Prevention: generate per-route annotation files; switch from mile-based to coordinate-based sector snapping using haversine nearest-neighbor from sector geographic anchors.

3. **Event bus messages lack route context** -- `elevation:hover` dispatches `{ miles }` with no route ID. If the elevation chart shows the 50k route but the map still has 100mi `routePoints`, the bike marker snaps to the wrong geographic point. Prevention: update `routePoints` on every `route:change` event; optionally add `routeId` to hover events for defense-in-depth.

4. **Leaflet layer cleanup on route switch** -- `initMap()` is fire-once; layers are never removed. Route switching requires refactoring to use `L.layerGroup` with `clearLayers()` and tracking module-scope references. Prevention: separate initialization from data rendering; use a `renderRoute()` function that clears before drawing.

5. **Elevation gain calibration is 100mi-specific** -- `parse-gpx.js` calibrates noise filter thresholds against a hardcoded 2,123-2,411 ft range for the 100mi route. This range is meaningless for shorter routes. Prevention: use the 100mi calibrated threshold (2m) as default for all routes; log results and verify manually.

## Implications for Roadmap

Based on research, the milestone naturally divides into 4 phases following a strict dependency chain: pipeline first (all client work depends on per-route data), then map switching (the hero visual change), then elevation and stats (chart coordination), then polish and downloads.

### Phase 1: Pipeline Infrastructure and Route Config

**Rationale:** Every downstream feature depends on per-route JSON files existing. This is the foundation and the highest-risk phase because it involves the surface data gap, GPX source incompatibilities, sector coordinate snapping, and elevation calibration. Getting the data layer right eliminates the most critical pitfalls early.

**Delivers:**
- `scripts/route-config.js` with route definitions, sector membership, GPX filenames
- Modified `pipeline.js` with route-specific step loop
- Per-route output directories: `public/data/100mi/`, `public/data/100k/`, `public/data/50k/`
- Per-route files: `route-data.json`, `annotations.json`, `sector-elevations.json`, `surface-points.json`
- `public/data/routes.json` manifest
- All 3 GPX files copied to `public/`

**Addresses features:** Pipeline expansion (Table Stakes #7)

**Avoids pitfalls:** #1 (surface data), #3 (route-specific indices), #4 (file naming), #5 (elevation calibration), #6 (GPX source differences), #8 (sector-to-route mapping), #14 (RDP tolerance)

### Phase 2: Route Selector and Map Switching

**Rationale:** The map is the hero component. Once per-route data exists, the most impactful visual change is showing users they can switch routes. This phase also forces the LayerGroup refactoring that all subsequent map-related work depends on.

**Delivers:**
- Route selector segmented control (custom `L.Control`, `role="radiogroup"`, 52px touch targets)
- `switchRoute()` function with lazy data fetching and layer group swap
- `initMap()` refactored into one-time setup + `renderRoute(routeId)` for repeatable layer creation
- Sector overlay filtering per selected route
- Map `fitBounds()` transition to new route extent
- `route:change` CustomEvent dispatched to all listeners
- Module-scope `routePoints` and `initialBounds` updated on switch

**Addresses features:** Route selector (TS #1), polyline swap (TS #2), sector filtering (TS #4), bike marker crosshair (Diff #6)

**Avoids pitfalls:** #2 (event bus context), #9 (layer cleanup/memory leak), #15 (stale module-scope state)

### Phase 3: Elevation Profile, Stats, and Content Collections

**Rationale:** With the map switching functional, the elevation profile and stats need to stay synchronized. This phase wires Chart.js destroy-recreate on `route:change`, updates RouteStats to show/hide pre-rendered variants, and updates content collection schemas. Can partially overlap with Phase 2 since elevation work is in a separate component.

**Delivers:**
- ElevationProfile.astro listens for `route:change`, destroys and recreates chart
- Sector annotation bands rebuilt per route on chart recreate
- X-axis scale range updates per route (102mi, 62mi, 31mi)
- Crosshair hover sync verified against new route's `routePoints`
- RouteStats.astro pre-renders all three route stat sets, toggles via `hidden`
- Updated `content.config.ts` for per-route data loading at build time

**Addresses features:** Elevation profile swap (TS #3), route stats update (TS #5)

**Avoids pitfalls:** #7 (content collections assume single route), #10 (chart cannot swap data without orchestration)

### Phase 4: Polish, Downloads, and Differentiators

**Rationale:** Once core switching works across map, chart, and stats, this phase adds GPX downloads, deep linking, ghost routes, and RouteExplainer badges. These are independent features that do not affect each other and can be developed in parallel.

**Delivers:**
- Dynamic GPX download link swaps `href` on `route:change`
- Deep link support via URL hash read on init + `history.replaceState` on change
- Ghost routes (inactive routes at opacity 0.15-0.25 for geographic context)
- RouteExplainer sector badges indicating "100mi only" for sectors not on selected route
- End-to-end UAT across all three routes

**Addresses features:** GPX download (TS #6), deep link (Diff #5), ghost routes (Diff #1)

**Avoids pitfalls:** #11 (RouteExplainer hardcoded), #12 (GPX download hardcoded), #13 (photo filtering)

### Phase Ordering Rationale

- **Pipeline must come first** because every client-side feature fetches per-route JSON files. Without correct data, nothing works.
- **Map switching before chart switching** because the map is the hero component and the `route:change` event originates from the map's route selector. The chart is a consumer of this event.
- **Stats and content collections grouped with chart** because they share the same event listener pattern and the content collection schema change is a build-time concern that pairs naturally with chart work.
- **Polish and differentiators last** because ghost routes, deep links, and download swaps are all additive -- they enhance a working multi-route system rather than being structural.
- **This order follows the pitfall dependency chain** (Pitfalls 4 -> 6/8 -> 5/14 -> 1/3 -> 7 -> 2/9/15 -> 10 -> 11/12/13), ensuring each phase resolves its pitfalls before downstream phases begin.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Pipeline):** Surface data strategy for 100k/50k needs validation. The nearest-neighbor approach from 100mi surface data has medium confidence -- accuracy degrades on divergent route segments. Also: the exact sector-to-route membership (which of the 7 sectors fall on each route) is estimated from mile ranges but not verified against actual GPX tracks. Run the pipeline early and visually inspect overlay alignment.
- **Phase 2 (Map Switching):** The `initMap()` refactor touches RouteMap.astro (692 lines, the largest component). Research the exact layer creation points that need wrapping in `L.layerGroup` before starting.

Phases with standard patterns (skip research-phase):
- **Phase 3 (Chart + Stats):** Chart.js destroy-recreate and DOM `hidden` toggling are well-documented, standard patterns. No research needed.
- **Phase 4 (Polish):** URL hash reading, GPX download link swapping, and ghost polylines are all trivial browser APIs with no ambiguity.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against installed `node_modules/*/package.json`. All APIs confirmed in official Leaflet and Chart.js docs. Zero new dependencies needed. |
| Features | HIGH | Validated against competitive analysis (Ride with GPS, UNBOUND Gravel, SBT GRVL, marathon sites). Feature list is comprehensive. Segmented control UX backed by Apple HIG and W3C APG. |
| Architecture | HIGH | Derived from direct analysis of all 12 pipeline scripts, both frontend components (692 + 203 lines), all 3 GPX files, and content collection config. Per-route file namespace is the clear winner. |
| Pitfalls | HIGH | All 15 pitfalls identified from reading actual source code with specific line number references. Dependency chain between pitfalls is mapped. |

**Overall confidence:** HIGH

### Gaps to Address

- **Sector-to-route membership not verified:** The mapping of which sectors fall on the 100k and 50k routes is estimated from mile ranges and route geometry. The ARCHITECTURE and FEATURES files disagree slightly (ARCHITECTURE says 100k/50k share 4 sectors: 520, NF2266, Doe Lake, Rapid River; FEATURES says 100k has 5 and 50k has 3 based on mile cutoffs: 520, NF2266, Bass Lake, NF2217, ND2225). This must be resolved by overlaying all 3 GPX tracks and visually confirming which sectors each route traverses. Handle during Phase 1 pipeline implementation.

- **Surface coloring strategy for shorter routes:** No RidewithGPS JSON export exists for 100k or 50k routes. The recommended approach (skip surface coloring for shorter routes, show single-color polylines) is the safest starting point, but if the visual inconsistency is jarring, nearest-neighbor surface inheritance from 100mi data is the fallback. Decide during Phase 1 after seeing initial output.

- **Elevation gain reference values for 100k/50k:** No verified Strava/Garmin reference values exist for the shorter routes' elevation gain. The pipeline will compute values using the 100mi-calibrated 2m noise threshold, but these should be cross-checked against Strava or RidewithGPS listings before shipping. Handle during Phase 1 validation.

- **Chart.js update vs destroy-recreate:** STACK.md recommends `chart.data.datasets[0].data = newData; chart.update('none')` (in-place update). ARCHITECTURE.md recommends `chart.destroy()` + `new Chart()` (destroy-recreate) due to LTTB decimation plugin state concerns. The destroy-recreate approach is safer and recommended. Resolve during Phase 3 implementation.

## Sources

### Primary (HIGH confidence)
- [Leaflet Layer Groups and Layers Control tutorial](https://leafletjs.com/examples/layers-control/) -- LayerGroup API, addTo/remove patterns
- [Leaflet 1.9.4 Reference](https://leafletjs.com/reference.html) -- LayerGroup, L.Control.extend(), fitBounds API
- [Chart.js Updating Charts](https://www.chartjs.org/docs/latest/developers/updates.html) -- dataset replacement, `chart.update()` and `chart.destroy()` patterns
- [Chart.js API Reference](https://www.chartjs.org/docs/latest/developers/api.html) -- `update(mode?)`, `destroy()` method signatures
- [Apple HIG: Segmented Controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls) -- 2-5 segments recommendation
- [W3C APG: Radiogroup Role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/radiogroup_role) -- accessibility pattern for mutually exclusive selection
- Direct codebase analysis: RouteMap.astro (692 lines), ElevationProfile.astro (203 lines), all 12 pipeline scripts, content.config.ts, all 3 GPX files

### Secondary (MEDIUM confidence)
- [Ride with GPS multi-route embed](https://support.ridewithgps.com/hc/en-us/articles/10127592878235-Multi-Route-Embed) -- multi-route UX patterns
- [UNBOUND Gravel routes page](https://www.unboundgravel.com/routes/) -- per-distance content sections
- [SBT GRVL courses](https://www.sbtgrvl.com/2026courses) -- color-coded distance cards
- [Chart.js GitHub issue #3614](https://github.com/chartjs/Chart.js/issues/3614) -- community confirmation of dataset replacement pattern
- [Leaflet multiple overlapping routes](https://dev.to/geoapify-maps-api/how-to-visualize-multiple-overlapping-routes-on-a-leaflet-map-16ni) -- ghost route opacity patterns

### Tertiary (LOW confidence)
- Sector-to-route membership mapping -- estimated from mile ranges, needs GPX overlay verification
- 100k/50k elevation gain values -- no reference data available, pipeline output needs manual validation

---
*Research completed: 2026-04-06*
*Ready for roadmap: yes*
