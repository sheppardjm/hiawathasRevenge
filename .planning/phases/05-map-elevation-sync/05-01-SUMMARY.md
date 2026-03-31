---
phase: 05-map-elevation-sync
plan: 01
subsystem: ui
tags: [chart.js, chartjs-plugin-annotation, leaflet, custom-events, crosshair, elevation-sync]

# Dependency graph
requires:
  - phase: 04-elevation-profile
    provides: ElevationProfile.astro with Chart.js line chart, IntersectionObserver lazy-init
  - phase: 03-route-map
    provides: RouteMap.astro with Leaflet map, CyclOSM tiles, route polyline, L.divIcon pattern
  - phase: 02-data-pipeline
    provides: route-data.json with points[].{lat, lon, miles, ele} fields

provides:
  - CustomEvent bus between ElevationProfile and RouteMap via window dispatch/listen
  - elevation:hover CustomEvent dispatching clamped miles value on chart mousemove
  - elevation:leave CustomEvent dispatching on chart mouseleave
  - Vertical crosshair line annotation (dashed amber) tracking cursor on elevation chart
  - Circle dot bike marker on map (L.divIcon, amber fill, forest-green stroke) synced to chart hover
  - snapByMiles helper for O(n) distance-along-route lookup

affects: [05-02-gravel-sectors, any future phase needing cross-component event bus]

# Tech tracking
tech-stack:
  added: [chartjs-plugin-annotation (dynamic import, registered in initChart)]
  patterns:
    - "CustomEvent window bus: component dispatches, sibling component listens at module scope"
    - "Module-scope guard variables: bikeMarker/routePoints/leafletMap set inside async init, checked in sync listeners"
    - "chart.update('none'): string arg required to suppress animation lag on high-frequency events"
    - "L.divIcon with className:'' removes default Leaflet white background from custom markers"
    - "snapByMiles: O(n) nearest-miles linear scan — sufficient for 456 points at 60fps"

key-files:
  created: []
  modified:
    - src/components/ElevationProfile.astro
    - src/components/RouteMap.astro

key-decisions:
  - "chartjs-plugin-annotation registered in initChart() (not globally) — keeps it in the same dynamic import bundle as Chart.js"
  - "Module-scope window listeners in RouteMap (not inside initMap) — ensures events are captured even before lazy-init completes"
  - "snapByMiles uses pt.miles field (distance-along-route) not array index — required for accurate sync when points are non-uniformly spaced"
  - "bikeMarker not added to map at creation — added on first elevation:hover, removed on elevation:leave and reset button"
  - "Clamped miles value to [0, totalMiles] — prevents crosshair escaping axis labels area"

patterns-established:
  - "Cross-component sync via window CustomEvents: ElevationProfile dispatches, RouteMap listens"
  - "Module-scope guard pattern: let x = null at top, assigned inside async init, guards in listeners"
  - "chart.update('none') for any high-frequency chart mutation to avoid animation judder"

# Metrics
duration: 3min
completed: 2026-03-31
---

# Phase 5 Plan 01: Map-Elevation Sync Summary

**CustomEvent bus wiring ElevationProfile and RouteMap — chart hover dispatches elevation:hover/leave events; Leaflet map responds with a circle dot marker that snaps to the GPS coordinate via snapByMiles distance lookup**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-31T00:13:24Z
- **Completed:** 2026-03-31T00:16:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- ElevationProfile.astro registers chartjs-plugin-annotation, shows/hides a dashed vertical crosshair line on hover, dispatches elevation:hover with clamped miles on mousemove, dispatches elevation:leave on mouseleave
- RouteMap.astro listens for both events at module scope (pre-initMap), moves an amber circle dot marker to the snapped GPS coordinate on hover, removes it on leave or map reset
- snapByMiles uses distance-along-route (pt.miles field) for accurate non-uniform-spacing sync at 60fps with 456 points

## Task Commits

Each task was committed atomically:

1. **Task 1: Add onHover dispatch and crosshair annotation to ElevationProfile** - `e7d1d1a` (feat)
2. **Task 2: Add window listener, bike dot marker, and snapByMiles to RouteMap** - `b0048f3` (feat)

## Files Created/Modified
- `src/components/ElevationProfile.astro` - Added chartjs-plugin-annotation dynamic import/register, onHover callback with CustomEvent dispatch and crosshair annotation control, mouseleave handler
- `src/components/RouteMap.astro` - Added module-scope variables, snapByMiles helper, module-scope window event listeners, L.divIcon circle dot bikeMarker, reset button bikeMarker cleanup

## Decisions Made
- chartjs-plugin-annotation registered inside initChart() alongside other Chart.js components (not at top-level) — keeps annotation plugin in the same dynamic import bundle, loaded lazily
- Module-scope window listeners in RouteMap rather than inside initMap() — guards with `if (!bikeMarker || !routePoints || !leafletMap) return` handle pre-init events safely without missing any dispatches
- snapByMiles O(n) linear scan over 456 points instead of binary search — sufficient for 60fps, simpler code, no pre-sort requirement
- bikeMarker created without adding to map (not `addTo(map)` at creation) — clean approach that adds marker on first hover via `bikeMarker._map` check
- Miles value clamped to `[0, totalMiles]` using `Math.max(0, Math.min(data[data.length-1].x, miles))` — prevents crosshair escaping chart bounds near axis labels

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 5 Plan 01 complete: cross-component sync infrastructure is in place
- Ready for Phase 5 Plan 02 (gravel sector bands on elevation chart) or Phase 5 Plan 03 (map-to-chart reverse sync on marker click)
- chartjs-plugin-annotation is now registered and available for future annotation work (gravel bands in 05-02)
- No blockers or concerns

---
*Phase: 05-map-elevation-sync*
*Completed: 2026-03-31*
