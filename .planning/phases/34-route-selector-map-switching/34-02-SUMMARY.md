---
phase: 34-route-selector-map-switching
plan: 02
subsystem: ui
tags: [leaflet, astro, route-selector, ghost-polylines, elevation-chart, route-switching]

requires:
  - phase: 34-route-selector-map-switching
    plan: 01
    provides: initMap()/renderRoute() split, activeRouteGroup, clearActiveRoute(), drawSurfacePolyline()
provides:
  - RouteSelector segmented control (100mi/100k/50k) centered at top of map
  - Ghost polylines for inactive routes (0.2 opacity, route-specific colors)
  - route:change CustomEvent dispatch from renderRoute()
  - ElevationProfile.astro route:change listener with chart data swap
affects:
  - Phase 35 (elevation profile and route stats consume route:change event)
  - Phase 36 (GPX download link updates on route:change)

key-files:
  modified:
    - src/components/RouteMap.astro
    - src/components/ElevationProfile.astro

key-decisions:
  - "RouteSelector is a plain DOM element appended to map container (not L.Control) for true top-center positioning"
  - "Ghost polylines created AFTER renderRoute('100mi') — map needs valid pixel bounds for Leaflet _clipPoints"
  - "Ghost polylines added directly to map (not activeRouteGroup) so clearLayers() preserves them"
  - "bringToBack() on ghost polylines ensures they render behind activeRouteGroup layers"
  - "ElevationProfile updateChart() uses chart.update('none') for instant data swap without animation"
  - "Mousemove clamping reads chart.data.datasets[0].data dynamically (not stale local reference)"

patterns-established:
  - "route:change CustomEvent: dispatched from renderRoute(), consumed by ElevationProfile and future components"
  - "updateGhostVisibility(activeId): sets active ghost to 0 opacity, inactive ghosts to 0.2"

duration: 8min
completed: 2026-04-06
---

# Phase 34 Plan 02: Route Selector, Ghost Polylines, Elevation Chart Switching

**Route selector UI, ghost polylines for inactive routes, route:change event dispatch, and elevation chart data swap — completing all Phase 34 user-facing functionality**

## Performance

- **Duration:** 8 min
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 2

## Accomplishments

- RouteSelector segmented control with 3 buttons (100mi/100k/50k), 52px touch targets, aria-checked radiogroup, arrow key navigation — positioned top-center of map
- Ghost polylines for all 3 routes persist on map across switches; active ghost hidden (opacity 0), inactive at 0.2 with route-specific colors
- route:change CustomEvent dispatched from renderRoute() after fitBounds and panel close logic
- ElevationProfile.astro: module-scoped chart, updateChart(routeId) swaps dataset data + x-axis max + sector annotation bands in-place
- Mousemove clamping updated to read current chart data dynamically after route switch

## Task Commits

1. **Task 1: RouteSelector control and ghost polylines** — `5c44603` (feat)
2. **Task 2: ElevationProfile route:change listener** — `b7d4d28` (feat)
3. **Orchestrator fix: ghost polyline timing + selector positioning** — `23ba14f` (fix)

## Deviations from Plan

- Ghost polylines moved from before renderRoute() to after — map requires valid pixel bounds (from fitBounds) before Leaflet can clip polyline points; original ordering caused Bounds.intersects crash
- RouteSelector changed from L.Control (topleft position) to plain DOM element appended to map container — enables true horizontal centering at top of map per user feedback

## Issues Encountered

- Leaflet Bounds.intersects TypeError when ghost polylines added to map before first fitBounds — fixed by reordering to after renderRoute('100mi')

---
*Phase: 34-route-selector-map-switching*
*Completed: 2026-04-06*
