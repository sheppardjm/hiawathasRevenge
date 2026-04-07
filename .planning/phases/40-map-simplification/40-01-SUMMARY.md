---
phase: 40-map-simplification
plan: 01
subsystem: map-rendering
tags: [leaflet, polyline, route-map, simplification, two-color]

requires:
  - phase: prior-phases
    provides: RouteMap.astro with surface-colored run-flush polyline rendering

provides:
  - Two-color route rendering: forest900 road base + amber500 gravel sector overlays

affects:
  - Future visual polish phases that reference map rendering
  - Any phase touching RouteMap.astro polyline logic

tech-stack:
  added: []
  patterns:
    - "Single L.polyline base layer (forest900) rendered before sector overlays for correct z-order"
    - "Sector overlays (SECTOR_COLOR.line = amber500) render on top for gravel-segment color"

key-files:
  created: []
  modified:
    - src/components/RouteMap.astro

key-decisions:
  - "Use forest900 directly for road base color (no new CSS variable) — already the existing fallback color in drawSurfacePolyline()"
  - "Leave surface-points.json files on disk; only removed the fetch — data files are dead but harmless"
  - "Ghost polylines remain unchanged — route.color at opacity 0.2 satisfies success criterion 4"

patterns-established:
  - "Two-color map pattern: single forest900 base polyline + amber500 sector overlays in add-order for correct z-ordering"

duration: 2min
completed: 2026-04-07
---

# Phase 40 Plan 01: Map Simplification — Two-Color Route Rendering Summary

**Replaced four-color surface-type polyline (lake/amber/rust/forest-700) with a single forest900 base polyline, producing a clean two-color map (forest900 road + amber500 gravel sectors) via the existing sector overlay pattern.**

## Performance
- **Duration:** ~2 minutes
- **Started:** 2026-04-07T16:05:55Z
- **Completed:** 2026-04-07T16:07:55Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Deleted `SURFACE_COLORS` constant (paved/gravel/dirt/unknown palette) from RouteMap.astro
- Deleted `drawSurfacePolyline()` run-flush algorithm function (27 lines removed)
- Removed `surface-points.json` fetch from `renderRoute()` Promise.all (4 fetches → 3)
- Replaced multi-color polyline call with single `L.polyline(latlngs, { color: forest900, ... })` base layer
- Sector overlays (SECTOR_COLOR.line = amber500) unchanged — continue to provide gravel color on top
- Ghost polylines for inactive routes unchanged — remain at 0.2 opacity using route.color
- Build verified clean; no console errors; no surface-points.json network requests

## Task Commits
1. **Task 1: Remove surface-color infrastructure** - `dac14ac` (refactor)
2. **Task 2: Visual verification across all routes** - verification only, no additional file changes

**Plan metadata:** (see docs commit below)

## Files Created/Modified
- `src/components/RouteMap.astro` — deleted SURFACE_COLORS, drawSurfacePolyline(), surface-points.json fetch; added forest900 base polyline

## Decisions Made
1. **Road color: forest900 (no new CSS variable)** — forest900 was already the fallback color in the deleted drawSurfacePolyline() and is visually tested against CyclOSM tiles. No new token needed.
2. **surface-points.json files left on disk** — scope is map rendering only; dead data files are harmless; cleanup deferred to future tech-debt phase.
3. **Ghost polylines untouched** — they use route.color at 0.2 opacity; explicitly permitted by success criterion 4 as "visually subordinate."

## Deviations from Plan
None — plan executed exactly as written. All four edit targets found at documented locations. Build succeeded first attempt.

## Issues Encountered
None.

## Next Phase Readiness
Ready for phase 41 (next in v1.7 roadmap). RouteMap.astro is in a clean state with simplified polyline rendering. The two-color map pattern is established and functional across all three routes (100mi, 100k, 50k).

---
*Phase: 40-map-simplification*
*Completed: 2026-04-07*
