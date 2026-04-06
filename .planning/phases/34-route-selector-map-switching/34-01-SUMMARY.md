---
phase: 34-route-selector-map-switching
plan: 01
subsystem: ui
tags: [leaflet, astro, map, polyline, surface-colors, route-switching, layergroup]

# Dependency graph
requires:
  - phase: 33-pipeline-route-data
    provides: per-route data files in public/data/{routeId}/ and routes.json manifest
  - phase: 25-map-elevation-chart
    provides: RouteMap.astro with sector panel, ghost polys, labels, restock markers, photo clusters
provides:
  - RouteMap.astro refactored into initMap() one-time setup + renderRoute(routeId) data-driven layers
  - activeRouteGroup L.layerGroup containing all route-specific layers (clearable on switch)
  - Surface-colored polyline segments via run-flush algorithm (paved=lake, gravel=amber, dirt=rust, unknown=forest)
  - clearActiveRoute() function ready for Phase 34-02 route switcher UI
affects:
  - 34-02-PLAN (route switcher UI calls renderRoute() and clearActiveRoute())
  - Any future phase that adds route-specific map layers

# Tech tracking
tech-stack:
  added: []
  patterns:
    - initMap()/renderRoute() split: one-time tile+shared-data setup separated from per-route layer creation
    - activeRouteGroup pattern: all route-specific layers in a single L.layerGroup for atomic clear/rebuild
    - Run-flush polyline algorithm: groups consecutive same-surface points into colored polyline segments
    - Opacity-based zoom gating: labels stay in layerGroup but opacity toggled to avoid re-add complexity

key-files:
  created: []
  modified:
    - src/components/RouteMap.astro

key-decisions:
  - "sector-details.json and photos.json fetched once in initMap() (shared, not per-route)"
  - "routes.json added to initMap() Promise.all (needed for panel close-on-switch sectorIds check)"
  - "updateLabelVisibility() uses opacity instead of add/remove — labels stay in activeRouteGroup permanently"
  - "SURFACE_COLORS moved inside initMap() closure (needs getCSSColor() access)"

patterns-established:
  - "renderRoute(routeId): fetch /data/{routeId}/* in Promise.all, clear, rebuild all route layers"
  - "clearActiveRoute(): reset activeSector, call activeRouteGroup.clearLayers(), reset sectorLayerEntries/sectorLabels"
  - "drawSurfacePolyline(latlngs, surfacePoints, layerGroup): run-flush groups consecutive same-surface points"

# Metrics
duration: 5min
completed: 2026-04-06
---

# Phase 34 Plan 01: Route Selector Map Switching Summary

**RouteMap.astro refactored into initMap()+renderRoute() split with activeRouteGroup L.layerGroup and surface-colored polylines via run-flush algorithm, enabling atomic route switching without layer leaks**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-06T22:31:35Z
- **Completed:** 2026-04-06T22:36:22Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Monolithic initMap() restructured: shared data (routes.json, sector-details.json, photos.json) stays in initMap(); per-route data (route-data.json, annotations.json, sector-elevations.json, surface-points.json) moves to renderRoute()
- activeRouteGroup L.layerGroup created in initMap() and populated by renderRoute(); clearActiveRoute() calls activeRouteGroup.clearLayers() for atomic route switching
- Surface-colored polyline replaces single dark green line: run-flush algorithm groups consecutive same-surface points into paved (lake-400), gravel (amber-400), dirt (rust-600), or unknown (forest-700) segments
- Sector labels opacity-gated via CSS (not add/remove) so they remain in activeRouteGroup across zoom changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor RouteMap.astro into initMap() + renderRoute() with activeRouteGroup and surface-colored polylines** - `6b3df0f` (feat)

**Plan metadata:** (see below)

## Files Created/Modified

- `src/components/RouteMap.astro` - Refactored with initMap()/renderRoute() split, activeRouteGroup, drawSurfacePolyline(), clearActiveRoute(), opacity-based label zoom gating

## Decisions Made

- sector-details.json fetched in initMap() (not renderRoute) because it is route-agnostic: all sector editorial content lives here regardless of which route is active
- routes.json added to initMap() Promise.all because the panel close-on-switch logic needs routesManifest.sectorIds to check if the active sector belongs to the newly-loaded route
- updateLabelVisibility() uses opacity toggle instead of add/remove; this avoids having to re-add labels to the map (which would bypass the activeRouteGroup container) after clearLayers()
- SURFACE_COLORS object kept inside initMap() closure because it calls getCSSColor() which requires the document to be available

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The build environment requires Node >=22.12.0 via Volta (`/Users/Sheppardjm/.volta/bin/node`). Build ran with `PATH="/Users/Sheppardjm/.volta/bin:$PATH" npm run build` and passed cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- renderRoute(routeId) is callable from any UI element — Phase 34-02 can wire a route selector button/tab that calls renderRoute() on click
- clearActiveRoute() is exposed in initMap() closure — Phase 34-02 can call it before renderRoute() (though renderRoute() already calls it internally)
- activeRouteId module-scope variable tracks current route for the switcher UI to know which route is selected
- All existing sector behavior, panel, elevation chart sync, photo clusters, and restock markers preserved exactly as v1.4

---
*Phase: 34-route-selector-map-switching*
*Completed: 2026-04-06*
