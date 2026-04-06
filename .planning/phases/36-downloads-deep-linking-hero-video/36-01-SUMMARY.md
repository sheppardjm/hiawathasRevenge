---
phase: 36-downloads-deep-linking-hero-video
plan: 01
subsystem: ui
tags: [leaflet, astro, history-api, deep-linking, gpx, route-switcher]

# Dependency graph
requires:
  - phase: 34-route-switcher
    provides: RouteSelector UI and route:change event dispatch
  - phase: 33-multi-route-data
    provides: routes.json manifest with gpxFile/shortName/name per route
provides:
  - Route-aware GPX download link that updates href/label on route:change
  - URL hash deep linking (#route=<id>) with history.replaceState
  - Pre-selection of deep-linked route on page load (selector button, map, elevation, stats)
affects:
  - Any future phase that adds shareable links or route-specific content

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "history.replaceState for hash writes (avoids hashchange event cascade)"
    - "window route:change listener in index.astro for cross-component sync"
    - "Lazy routes.json cache in page-level script (_routesCache pattern)"

key-files:
  created: []
  modified:
    - src/pages/index.astro
    - src/components/RouteMap.astro

key-decisions:
  - "history.replaceState (not location.hash assignment) prevents hashchange events firing on every route switch"
  - "initialRouteId declared inside initMap() with const — in scope for selector loop, renderRoute, updateGhostVisibility"
  - "GPX link default stays static (Munising_Hiawatha_s_Revenge.gpx) — route:change fires before user scrolls to download section"

patterns-established:
  - "Hash deep link pattern: parse on init, replaceState on change, fall back to routes[0].id on invalid"
  - "Page-level route:change listener updates download-section DOM independent of map component"

# Metrics
duration: 2min
completed: 2026-04-06
---

# Phase 36 Plan 01: Downloads Deep Linking Hero Video Summary

**GPX download link becomes route-aware via route:change listener; URL hash (#route=100k) pre-selects route on load via history.replaceState**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-06T23:54:34Z
- **Completed:** 2026-04-06T23:56:27Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- GPX download `<a>` now carries `id="gpx-download-link"` and updates href, download attribute, and visible label text whenever `route:change` fires
- Navigating to `/#route=100k` or `/#route=50k` pre-selects the correct route on page load — map, selector button highlight, elevation profile, and stats all reflect the deep-linked route
- Every route switch writes `history.replaceState` so the URL hash stays current for sharing without triggering a page reload or hashchange cascade

## Task Commits

Each task was committed atomically:

1. **Task 1: GPX download link — route-aware href and label** - `75102f7` (feat)
2. **Task 2: URL hash deep linking — read on load, write on switch** - `bc3430f` (feat)

## Files Created/Modified
- `src/pages/index.astro` - Added `id="gpx-download-link"` to download `<a>`, added `<script>` with routes cache and `route:change` listener
- `src/components/RouteMap.astro` - Added hash parse + `initialRouteId` in `initMap()`, `history.replaceState` in `renderRoute()`, updated selector button init and initial render call to use `initialRouteId`

## Decisions Made
- `history.replaceState` chosen over `location.hash =` to avoid triggering hashchange events on every route switch — keeps the URL in sync without re-initializing listeners
- `initialRouteId` declared as `const` inside `initMap()` so it is naturally in scope for the selector button loop (which runs inside `initMap()`), `renderRoute(initialRouteId)`, and `updateGhostVisibility(initialRouteId)` — no need to lift to module scope
- Default GPX link stays static (100mi file) because `route:change` always fires before a user can scroll past the map to the download section

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Download and deep linking features complete for v1.5 multi-route support
- URL sharing for any route now works: `/#route=100k`, `/#route=50k`, `/#route=100mi`
- Remaining Phase 36 work: hero video implementation (if any subsequent plans)

---
*Phase: 36-downloads-deep-linking-hero-video*
*Completed: 2026-04-06*
