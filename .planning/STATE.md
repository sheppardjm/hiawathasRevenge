# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-30)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive showcase that inspires them to ride it and support MBTN.
**Current focus:** Phase 3 complete — ready for Phase 4

## Current Position

Phase: 3 of 11 (Route Map) — COMPLETE
Plan: 2 of 2 in current phase (all complete)
Status: Phase 3 verified and complete
Last activity: 2026-03-30 — Phase 3 verified (5/5 must-haves passed, human-confirmed)

Progress: [█████░░░░░] 23% (7/31 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: ~9 min
- Total execution time: ~60 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/2 complete | ~50 min | ~25 min |
| 02-data-pipeline | 3/3 complete | ~3 min | ~1 min |
| 03-route-map | 2/2 complete | ~7 min | ~3.5 min |

**Recent Trend:**
- Last 5 plans: 02-01 (~unknown), 02-02 (1 min), 02-03 (2 min), 03-01 (2 min), 03-02 (~5 min including checkpoint)
- Trend: On track; visual checkpoint plans take longer due to human review

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

### Pending Todos

- All future plans: Use `PATH="/usr/local/opt/node/bin:$PATH"` prefix for node/npm/npx commands (Node 25 required)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-30
Stopped at: Phase 3 complete — all 2 plans executed, verified (5/5 must-haves), roadmap updated
Resume file: None
