# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-30)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive showcase that inspires them to ride it and support MBTN.
**Current focus:** Phase 3 in progress — Plan 01 complete

## Current Position

Phase: 3 of 11 (Route Map) — In Progress
Plan: 1 of ? in current phase
Status: Phase 3 Plan 01 complete
Last activity: 2026-03-30 — Completed 03-01-PLAN.md (RouteMap core implementation)

Progress: [████░░░░░░] 19% (6/31 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: ~9 min
- Total execution time: ~54 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/2 complete | ~50 min | ~25 min |
| 02-data-pipeline | 3/3 complete | ~3 min | ~1 min |
| 03-route-map | 1/? complete | ~2 min | ~2 min |

**Recent Trend:**
- Last 5 plans: 01-02 (~45 min), 02-01 (~unknown), 02-02 (1 min), 02-03 (2 min), 03-01 (2 min)
- Trend: Implementation plans running fast; Phase 3 Plan 01 was pure code with no visual checkpoints

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Foundation: Clone mkUltra stack exactly — Astro 6.x, Tailwind 4.x, Vite 7 override required
- Foundation: CARTO Dark Matter is default tile fallback; try CyclOSM or Stadia Terrain first for forest aesthetic (resolve in Phase 3)
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
- 03-01: Amber #c8973e polyline — matches project accent token, contrasts well on CyclOSM light tiles (mkUltra used #d4d4d4 for dark tiles)
- 03-01: Route data shape is routeData.points[].{lat,lon} — points wrapped in points array in route-data.json
- 03-01: Dynamic import pattern for Leaflet: const L = (await import('leaflet')).default inside initMap()
- 03-01: addInitHook before L.map() is required for any Leaflet plugin registration

### Pending Todos

- All future plans: Use `PATH="/usr/local/opt/node/bin:$PATH"` prefix for node/npm/npx commands (Node 25 required)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-30
Stopped at: Phase 3 Plan 01 complete — RouteMap core implementation, map visible on index page
Resume file: None
