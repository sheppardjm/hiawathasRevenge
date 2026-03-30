---
phase: 02-data-pipeline
plan: "02"
subsystem: data-pipeline
tags: [node, json, gpx, coordinates, snapping, gravel, annotations]

# Dependency graph
requires:
  - phase: 02-01
    provides: public/data/route-data.json with 456 simplified points each carrying lat/lon/ele/miles fields
provides:
  - scripts/resolve-annotations.js — annotation definition + mileage-to-coordinate snapping + JSON output
  - public/data/annotations.json — 9-entry flat array of 7 gravel sectors and 2 restock points with snapped coordinates
affects:
  - 03-map (sector polyline overlays and restock markers)
  - 04-elevation-chart (sector band overlays)
  - 05-content-stats (surface type breakdown, gravel mileage)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Mileage-snap: nearest-neighbor search over points[].miles for O(n) coordinate resolution
    - Cap-and-clamp: endMile capped at totalMiles before snap; endIdx clamped to routePoints.length-1 if tie occurs

key-files:
  created:
    - scripts/resolve-annotations.js
    - public/data/annotations.json
  modified: []

key-decisions:
  - "annotations.json is a flat array (not keyed object) to work with Astro file() loader which requires array-of-objects with id fields"
  - "endMile capped at meta.totalMiles (101.98) before snapping — sector-rapid-river raw endMile 100.9 is within range, but cap is defensive for future edits"

patterns-established:
  - "Snap pattern: snapByMileage(targetMile, routePoints) returns { lat, lon, ele, miles, snapIdx } — reusable for any future mile-referenced annotation"

# Metrics
duration: 1min
completed: 2026-03-30
---

# Phase 02 Plan 02: Resolve Annotations Summary

**Mileage-to-coordinate snapping for 7 gravel sectors and 2 restock points producing a 9-entry annotations.json consumed by map, chart, and stats components**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-30T21:03:09Z
- **Completed:** 2026-03-30T21:04:26Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- ESM script `scripts/resolve-annotations.js` defines all route annotations and snaps them to route coordinates via nearest-mileage search
- `public/data/annotations.json` outputs 9 entries: 7 gravel sectors with `startLat/Lon/Idx` + `endLat/Lon/Idx`, and 2 restock points with `lat/lon/ele/snapIdx`
- All entries carry unique `id` fields (required for Astro `file()` loader content collections)
- Sector index integrity guaranteed: `startIdx < endIdx` for all 7 sectors; last-sector overshoot capped at `totalMiles`

## Task Commits

Each task was committed atomically:

1. **Task 1: Write resolve-annotations.js with annotation definitions and coordinate snapping** - `5cc1282` (feat)

**Plan metadata:** (see below)

## Files Created/Modified

- `scripts/resolve-annotations.js` — ESM script: hardcoded GRAVEL_SECTORS + RESTOCK_POINTS, snapByMileage(), JSON output, stdout summary
- `public/data/annotations.json` — 9-entry flat array (7 sectors + 2 restock) with snapped coordinates and route indices

## Decisions Made

- **Flat array format for annotations.json:** Astro `file()` loader requires an array-of-objects where each entry has a unique `id` field. A keyed object would require a custom loader.
- **Defensive endMile cap at totalMiles:** The last sector (sector-rapid-river, endMile 100.9) is within the route's 101.98 miles, but the cap prevents silent data errors if sector definitions are ever updated.
- **`startIdx < endIdx` clamp:** After snapping, if the nearest points for start and end happen to resolve to the same index (possible on very short sectors near endpoint), `endIdx` is clamped to `routePoints.length - 1`. This ensures all downstream slice operations are valid.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `public/data/annotations.json` is ready for consumption by Phase 3 (map), Phase 4 (elevation chart), and Phase 5 (content stats)
- Snap function pattern (`snapByMileage`) is available in the script if needed by Phase 3 at runtime (or can be ported)
- No blockers.

---
*Phase: 02-data-pipeline*
*Completed: 2026-03-30*
