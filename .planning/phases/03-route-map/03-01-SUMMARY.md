---
phase: 03-route-map
plan: 01
subsystem: ui
tags: [leaflet, cyclosm, polyline, gesture-handling, lazy-init, intersection-observer, css-layers, tailwind]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: global.css @layer leaflet placeholder, Tailwind 4 CSS-first setup
  - phase: 02-data-pipeline
    provides: route-data.json with 456 simplified points at public/data/route-data.json
provides:
  - Leaflet 1.9.4 + leaflet-gesture-handling 1.2.2 installed as runtime deps
  - global.css cascade layer order fixed with @layer leaflet, base, components, utilities
  - Leaflet CSS isolated in lowest-priority layer via @import layer(leaflet)
  - RouteMap.astro island component with CyclOSM tiles, amber polyline, gesture handling, lazy-init, reset control
  - Map section wired into index.astro (id="route") between Route text and Support sections
affects: [03-route-map, 05-elevation-chart, 06-restock-markers, 09-photos]

# Tech tracking
tech-stack:
  added: [leaflet@1.9.4, leaflet-gesture-handling@1.2.2]
  patterns:
    - dynamic import in <script> block to avoid SSR "window is undefined"
    - L.Map.addInitHook before L.map() for plugin registration
    - scroll + IntersectionObserver two-stage lazy-init
    - @layer declaration order for CSS priority control

key-files:
  created:
    - src/components/RouteMap.astro
  modified:
    - package.json
    - package-lock.json
    - src/styles/global.css
    - src/pages/index.astro

key-decisions:
  - "CyclOSM confirmed as tile layer (not CARTO Dark Matter) — forest-themed, no API key required"
  - "Amber #c8973e polyline color matches project accent token, contrasts well on CyclOSM light tiles"
  - "Route data access via routeData.points[].{lat,lon} (not routeData[].{lat,lon}) matching route-data.json shape"
  - "initialBounds defined after polyline render — reset button closure captures it correctly"

patterns-established:
  - "Dynamic Leaflet import pattern: const L = (await import('leaflet')).default inside initMap()"
  - "Plugin hook pattern: addInitHook before L.map() for any future Leaflet plugins"
  - "Lazy-init pattern: scroll (once/passive) + IntersectionObserver(rootMargin 0px) two-stage"
  - "CSS layer isolation: @layer leaflet, base, components, utilities declared before @import tailwindcss"

# Metrics
duration: 2min
completed: 2026-03-30
---

# Phase 3 Plan 01: Route Map Core Implementation Summary

**Leaflet 1.9.4 map island with CyclOSM tiles, amber 456-point polyline, gesture handling, custom reset control, and scroll+IO lazy-init rendering on the index page**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-30T21:46:29Z
- **Completed:** 2026-03-30T21:48:57Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Installed leaflet@1.9.4 and leaflet-gesture-handling@1.2.2 as runtime dependencies
- Fixed global.css cascade layer order so Leaflet CSS is isolated at lowest priority, preventing any Leaflet styles from overriding Tailwind utilities
- Created RouteMap.astro with all Phase 3 features: CyclOSM tiles, amber polyline from route-data.json, gesture handling wired via addInitHook, custom reset control, and two-stage lazy-init
- Wired map section (id="route") into index.astro — visible below "The Route" text section

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Leaflet deps and fix global.css cascade layer order** - `5e265d7` (chore)
2. **Task 2: Create RouteMap.astro and wire into index.astro** - `cd2aac1` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/RouteMap.astro` - Leaflet map island with CyclOSM tiles, amber polyline, gesture handling, reset control, scroll+IO lazy-init (108 lines)
- `src/styles/global.css` - Added @layer order declaration before @import tailwindcss, imported Leaflet CSS into leaflet layer, removed empty placeholder block
- `src/pages/index.astro` - Added RouteMap import and route map section (id="route") between Route text and Support sections
- `package.json` - Added leaflet@1.9.4 and leaflet-gesture-handling@1.2.2 to dependencies
- `package-lock.json` - Updated with new packages

## Decisions Made

- **CyclOSM over CARTO Dark Matter:** CyclOSM confirmed as the tile layer — forest-aesthetic, bicycle-focused cartography that suits the Hiawatha's Revenge route theme. No API key required.
- **Amber #c8973e polyline:** Matches the project's primary accent token (--color-amber-500). CyclOSM uses light/terrain tiles so amber contrasts well (CARTO Dark Matter would need lighter color like mkUltra's #d4d4d4).
- **Route data shape:** routeData.points[].{lat, lon} not routeData[].{lat, lon} — route-data.json wraps points in a `points` array, confirmed from Phase 2 output.
- **initialBounds after fitBounds:** Reset button click handler captures initialBounds via closure — defined after polyline render so it correctly reflects the fitted bounds.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The `photos.json` [ERROR] log during build is the expected stub error from Phase 2 (02-03 decision: photos stub returns [] when absent), does not abort build.

## User Setup Required

None - no external service configuration required. CyclOSM tiles require no API key.

## Next Phase Readiness

- RouteMap.astro is fully functional with Phase 3 scope. Phase 5 (elevation chart) can add CustomEvent dispatch to the reset control and sector polyline overlays.
- Phase 6 (restock markers) can add L.marker calls directly inside initMap() — the map instance is local but the pattern is established.
- Phase 9 (photos) can extend initMap() with photo marker + MarkerCluster imports — the dynamic import pattern is established.
- No blockers.

---
*Phase: 03-route-map*
*Completed: 2026-03-30*
