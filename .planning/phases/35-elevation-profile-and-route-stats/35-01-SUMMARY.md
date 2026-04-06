---
phase: 35-elevation-profile-and-route-stats
plan: 01
subsystem: ui
tags: [chart.js, leaflet, astro, intersection-observer, custom-events, route-switching]

# Dependency graph
requires:
  - phase: 34-route-selector-map-switching
    provides: renderRoute() function, route:change CustomEvent dispatch, ElevationProfile updateChart()
provides:
  - window.__activeRouteId global set in renderRoute() before route:change dispatch
  - ElevationProfile post-init sync check resolves lazy-init race condition
  - RouteStats dynamic updates via route:change listener with cached routes.json fetch
  - Third stat card (Sectors) with id="stat-sectors"
affects:
  - 35-02 (any further elevation/stats work)
  - future phases that add stat cards or read window.__activeRouteId

# Tech tracking
tech-stack:
  added: []
  patterns:
    - window.__activeRouteId global as lightweight cross-component state bridge
    - Post-init sync pattern: set global before event dispatch, read global after lazy construction
    - Cached promise pattern for routes.json fetch (_routesCache = fetch(...).then())

key-files:
  created: []
  modified:
    - src/components/RouteMap.astro
    - src/components/ElevationProfile.astro
    - src/components/RouteStats.astro

key-decisions:
  - "window.__activeRouteId assigned before route:change dispatch so post-init sync always has correct value"
  - "Post-init sync only corrects non-100mi routes; 100mi is correct default from hardcoded initChart() fetch"
  - "RouteStats still uses Astro frontmatter getEntry for 100mi SSG default; script only updates at runtime"
  - "stat-sectors initial value hardcoded to 7 (100mi sector count from routes.json)"

patterns-established:
  - "Cross-component lazy-init race: set global before dispatching event, read global after constructing late-init component"
  - "Cached promise pattern for JSON manifests: module-scope let _cache = null; if (!_cache) _cache = fetch(...)"

# Metrics
duration: 4min
completed: 2026-04-06
---

# Phase 35 Plan 01: Elevation Profile and Route Stats Summary

**Race-condition fix using window.__activeRouteId bridge plus RouteStats dynamic updates with sector count card and cached routes.json listener**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-06T23:20:00Z
- **Completed:** 2026-04-06T23:24:22Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Fixed ElevationProfile lazy-init race: switching routes before scrolling now shows correct elevation profile (not always 100mi)
- RouteStats updates miles, elevation gain, and sector count on every route:change event
- Added third stat card (Sectors) completing the 3-column grid layout

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix ElevationProfile lazy-init race condition** - `0a49c95` (fix)
2. **Task 2: Make RouteStats dynamic with sector count and route:change listener** - `adb42ce` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `src/components/RouteMap.astro` - Added `window.__activeRouteId = routeId` before route:change dispatch
- `src/components/ElevationProfile.astro` - Added post-init sync check at end of initChart()
- `src/components/RouteStats.astro` - Added id attributes, sector stat card, route:change script block, removed spurious </div>

## Decisions Made
- `window.__activeRouteId` assigned before `route:change` dispatch in `renderRoute()` so that the global is set before any listeners fire. This guarantees the post-init sync in ElevationProfile reads the correct route even if dispatch is synchronous.
- Post-init sync only corrects non-100mi routes. The 100mi fetch in `initChart()` is the correct default; no need to re-fetch when the active route matches.
- RouteStats retains Astro frontmatter `getEntry` for SSG rendering. The `<script>` block only updates values at runtime, keeping build-time HTML valid for 100mi.
- `stat-sectors` initial value hardcoded to 7 (matches 100mi route in routes.json). Runtime listener corrects it on route switch.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Node.js version mismatch: system `npm run build` invokes Node v20 (unsupported), while Volta provides v22.22.2. Resolved by calling npm via `/Users/Sheppardjm/.volta/tools/image/node/22.22.2/bin/npm` directly. Build succeeds cleanly. This is a pre-existing environment concern documented in STATE.md.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 35 Plan 01 complete. Route stats are fully dynamic; elevation profile race condition is resolved.
- Ready for Phase 35 Plan 02 (if it involves further elevation/stats work — see 35-02-PLAN.md).

---
*Phase: 35-elevation-profile-and-route-stats*
*Completed: 2026-04-06*
