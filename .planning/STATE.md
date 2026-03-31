# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-30)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive showcase that inspires them to ride it and support MBTN.
**Current focus:** Phase 7 complete — photo pipeline fully integrated; 54 thumbnails in public/thumbs/, photos.json ready for Phase 9 manifest; Phase 8 next

## Current Position

Phase: 7 of 11 (Photo Pipeline) — Phase complete
Plan: 2 of 2 in current phase (2 complete)
Status: Phase complete — ready for Phase 8
Last activity: 2026-03-31 — Completed 07-02 (match-photos.js + pipeline.js 4-step orchestration)

Progress: [█████░░░░░] 50% (16/32 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: ~9 min
- Total execution time: ~65 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/2 complete | ~50 min | ~25 min |
| 02-data-pipeline | 3/3 complete | ~3 min | ~1 min |
| 03-route-map | 2/2 complete | ~7 min | ~3.5 min |
| 04-elevation-profile | 2/2 complete | ~7 min | ~3.5 min |
| 05-map-elevation-sync | 4/4 complete | ~7 min | ~2 min |
| 06-restock-markers | 1/1 complete | ~2 min | ~2 min |
| 07-photo-pipeline | 2/2 complete | ~6 min | ~3 min |

**Recent Trend:**
- Last 5 plans: 05-01 (~3 min), 06-01 (~2 min), 07-01 (~2 min), 07-02 (~4 min)
- Trend: On track; pure code plans run fast (~2-4 min)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Foundation: Clone mkUltra stack exactly — Astro 6.x, Tailwind 4.x, Vite 7 override required
- Pipeline: Elevation gain must be computed on full-resolution 1927-point set (not simplified). 2m threshold yields 2,258 ft — verified within user GPS range 2,123–2,411 ft (02-01 resolved)
- Photos: Admin UI writes photos-manifest.json; choose fetch POST vs. CLI script for simplicity at Phase 9
- 01-01: Tailwind 4 CSS-first approach confirmed — @theme in global.css, no tailwind.config.js
- 01-01: Vite 7 override required — Tailwind 4.2+ plugin needs Vite 7, Astro 6 ships Vite 6
- 01-01: Node 25 required — Astro 6 requires Node >=22.12.0; use /usr/local/opt/node (v25.8.2) for all npm/astro commands
- 01-01: @layer leaflet reserved in global.css for Phase 3 Leaflet CSS isolation
- 01-02: Astro Fonts API uses fonts[] array (not experimental.fonts + families) — correct shape in astro.config.ts
- 01-02: Font.astro component with preload=true emits preload link tags; must be in <head> of BaseLayout
- 01-02: National Park font (Google) replaces Special Elite for display headings — user-approved National Forest Service aesthetic
- 01-02: Shield SVG badge with arrowhead and curved textPath is the canonical location branding element (index.astro h1)
- 01-02: global.css font tokens use var(--font-national-park) / var(--font-space-mono) to bridge Astro-injected variables
- 02-01: Elevation gain computed on full 1927-point set (not simplified) — RDP strips intermediate changes causing ~45% under-count; 2m filter → 2,258 ft
- 02-01: route-data.json is the single source of truth for all downstream components (456 simplified points for rendering, full-res used only for elevation calc)
- 02-02: annotations.json is a flat array (not keyed object) — required for Astro file() loader which expects array-of-objects with unique id fields
- 02-02: snapByMileage pattern (nearest-mileage search over points[].miles) is reusable for any future mile-referenced annotation
- 02-03: process.execPath used in pipeline.js instead of 'node' — guarantees same Node binary across environments
- 02-03: routeData content collection uses file() with custom parser wrapping single-object JSON as [{id:'route',...}] — Astro file() loader requires array-of-objects
- 02-03: photos stub collection uses try/catch parser returning [] when photos.json absent — build logs [ERROR] from internal file-loader but does not abort
- 03-01: CyclOSM confirmed as tile layer (not CARTO Dark Matter) — forest-themed bicycle cartography, no API key
- 03-01: Route data shape is routeData.points[].{lat,lon} — points wrapped in points array in route-data.json
- 03-01: Dynamic import pattern for Leaflet: const L = (await import('leaflet')).default inside initMap()
- 03-01: addInitHook before L.map() is required for any Leaflet plugin registration
- 03-02: Route polyline uses forest-900 #1a2e1a (not amber #c8973e) — amber blends with CyclOSM burnt orange road features
- 03-02: Both GPX files (Munising_Hiawatha_s_Revenge.gpx and Hiawatha_100.gpx) cover identical geographic extent — kept original
- 04-01: chartjs-plugin-annotation installed now but not registered — deferred to Phase 5 (gravel sector bands)
- 04-01: Tree-shaken Chart.js import (not chart.js/auto) — LineController, LineElement, PointElement, LinearScale, Filler, Tooltip, Decimation only
- 04-01: IO-only lazy-init for ElevationProfile (no scroll listener) — avoids premature load triggered by RouteMap's scroll listener
- 04-01: parsing: false required at BOTH options root and dataset level for LTTB decimation to function
- 04-02: No code changes required — ElevationProfile.astro met all Phase 4 success criteria as built; verified feet/miles axes, 140px/180px heights, IntersectionObserver lazy-loading
- 05-01: chartjs-plugin-annotation registered inside initChart() (not globally) — lazy-loaded with Chart.js bundle
- 05-01: Module-scope window listeners in RouteMap (not inside initMap) — guard with !bikeMarker/!routePoints/!leafletMap handles pre-init events safely
- 05-01: snapByMiles O(n) linear scan over pt.miles field (distance-along-route, not array index) — accurate for non-uniform point spacing
- 05-01: L.divIcon className:'' REQUIRED on custom Leaflet markers — removes default white background/border from leaflet-div-icon class
- 05-01: chart.update('none') string arg required for high-frequency chart mutations — suppresses Chart.js animation on each mousemove
- 05-02: slice(startIdx, endIdx + 1) required for polyline segment from index range — JavaScript slice excludes end index, +1 closes off-by-one gap
- 05-02: All 7 gravel sectors use single amber color (#c8973e) — annotations.json has no difficulty field for differentiation
- 05-03: sectorAnnotations keyed object (not array) required by chartjs-plugin-annotation 3.1.0 for named annotation access alongside crosshair
- 05-03: yMin/yMax omitted from box annotations — plugin auto-expands to full chart height; no explicit bounds needed
- 05-03: drawTime: 'beforeDatasetsDraw' ensures sector bands render behind elevation line dataset
- 05-04: SECTOR_COLORS at module scope (before initMap/initChart) — accessible in async functions without closure issues
- 05-04: || SECTOR_COLORS.moderate fallback defensive against missing difficulty field in data
- 05-04: Difficulty assignments: NF numbered roads = moderate, named scenic roads = easy, Rapid River Truck Trail = hard
- 06-01: Named className 'restock-marker' (not '') on L.divIcon — enables targeted CSS; requires :global() in <style> to escape Astro scoping
- 06-01: stop.mile field (not stop.mi) — this project's annotation schema uses 'mile', mkUltra uses 'mi'
- 06-01: zIndexOffset layering pattern: polylines(0) < restock markers(500) < bike crosshair(1000)
- 06-01: .leaflet-popup.restock-popup compound selector — className in bindPopup adds class to .leaflet-popup, not .leaflet-popup-content-wrapper
- 07-01: sharp installed as devDependency only — never import in src/ to avoid Vite bundling native binaries; only used in build scripts/ via execFileSync
- 07-01: autoOrient() before resize() in sharp chain — portrait 1536x2048 sources produce 400x533 thumbnails (not 400x300 landscape)
- 07-01: Space-to-underscore filename normalization: basename.replace(/ /g, '_') + '.webp' — match-photos.js must use identical derivation for thumb field in photos.json
- 07-01: readdirSync without recursion naturally excludes images/inspiration/ subdirectory
- 07-02: photos.json written as empty array when manifest absent — build never fails before Phase 9
- 07-02: match-photos.js thumb derivation must match generate-thumbnails.js exactly: basename.replace(/ /g, '_') + '.webp'
- 07-02: snapByMileage copied verbatim from resolve-annotations.js — keeps scripts self-contained, consistent snapping
- 07-02: match-photos runs last in pipeline — conceptually depends on thumbnails; requires route-data.json from parse-gpx

### Pending Todos

- All future plans: Use `PATH="/usr/local/opt/node/bin:$PATH"` prefix for node/npm/npx commands (Node 25 required)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-31
Stopped at: Phase 7 complete — 07-02 (match-photos.js + pipeline.js 4-step orchestration) done; ready for Phase 8
Resume file: None
