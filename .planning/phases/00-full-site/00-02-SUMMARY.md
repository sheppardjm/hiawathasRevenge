---
phase: 00-full-site
plan: 02
subsystem: ui
tags: [chart.js, elevation-profile, crosshair, canvas, custom-events]

# Dependency graph
requires:
  - phase: 04-elevation-profile
    provides: ElevationProfile.astro with Chart.js 4.5.1 tree-shaken imports
  - phase: 05-map-elevation-sync
    provides: elevation:hover / elevation:leave CustomEvent bus wired to RouteMap crosshair
provides:
  - X-axis capped at actual route distance (~101.98 miles) via routeData.meta.totalMiles
  - Reliable elevation:hover dispatch via direct canvas mousemove listener
affects: [future chart maintenance, UAT gap closure 00-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Direct canvas DOM listener instead of Chart.js onHover for reliable high-frequency events with parsing:false"
    - "X-axis max: routeData.meta.totalMiles pattern for capping dynamic chart bounds"

key-files:
  created: []
  modified:
    - src/components/ElevationProfile.astro

key-decisions:
  - "Chart.js 4.x onHover callback is unreliable with parsing:false — canvas.addEventListener('mousemove') bypasses internal event pipeline and fires reliably"
  - "X-axis max set to routeData.meta.totalMiles (~101.98) — prevents Chart.js auto-scaling to ~120 miles"
  - "Chart.js tooltip (mode: index) continues to work via Chart.js internal event pipeline — direct DOM listener and Chart.js internal events coexist cleanly"

patterns-established:
  - "Direct canvas mousemove: use for cross-component sync events when Chart.js onHover is unreliable"

# Metrics
duration: 5min
completed: 2026-03-31
---

# Phase 00 Plan 02: Elevation Chart X-axis Cap and Crosshair Hover Fix Summary

**Chart.js X-axis capped at 101.98 miles via routeData.meta.totalMiles; crosshair hover fixed by replacing unreliable onHover callback with direct canvas mousemove listener**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-31T17:48:00Z
- **Completed:** 2026-03-31T17:53:11Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Elevation chart X-axis now stops at the actual route distance (~102 miles) instead of Chart.js auto-scaling to ~120
- Hovering the elevation chart now reliably dispatches `elevation:hover` CustomEvents, syncing the amber crosshair marker along the route on the map
- Chart tooltip (mile/elevation on hover) still works via Chart.js internal event pipeline — coexists cleanly with direct DOM listener

## Task Commits

Each task was committed atomically:

1. **Task 1: Add X-axis max to cap at route distance** - `2de440a` (fix)
2. **Task 2: Fix crosshair hover sync with canvas mousemove** - `d4b12ea` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/ElevationProfile.astro` - Added `max: routeData.meta.totalMiles` to x scale config; removed `onHover` callback; added direct `canvas.addEventListener('mousemove', ...)` after chart creation

## Decisions Made

- **Direct canvas mousemove over onHover:** Chart.js 4.x `onHover` callback does not fire reliably when `parsing: false` is set (a known issue with Chart.js 4.5.1). The fix replaces it with a raw DOM `mousemove` listener on the canvas element, which bypasses Chart.js event routing entirely and fires on every mouse movement. Chart.js tooltip continues to work via its own internal event pipeline — no conflict.
- **X-axis max:** Set to `routeData.meta.totalMiles` (~101.98) to match actual route data. This value is already in scope from the fetch at line 39 of `initChart()`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — both changes were straightforward and the Astro build completed without warnings or errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Elevation chart X-axis and crosshair sync both fixed; UAT gap items 1 and 2 resolved
- Ready for 00-03 (remaining UAT gap closure plans)

---
*Phase: 00-full-site*
*Completed: 2026-03-31*
