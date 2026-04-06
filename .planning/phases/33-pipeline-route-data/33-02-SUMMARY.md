---
phase: 33-pipeline-route-data
plan: 02
subsystem: data-pipeline
tags: [haversine, coordinate-snapping, surface-data, elevation, rwgps, gpx, multi-route]

# Dependency graph
requires:
  - phase: 33-01
    provides: route-config.js with ROUTES/SECTOR_DEFS/RESTOCK_DEFS, parse-gpx.js writing per-route subdirectories, public/data/{routeId}/route-data.json for all 3 routes
provides:
  - "Coordinate-based sector/restock snapping via haversine distance (replaces mile-based)"
  - "public/data/100mi/annotations.json (7 sectors + 2 restocks)"
  - "public/data/100k/annotations.json (4 sectors + 1 restock)"
  - "public/data/50k/annotations.json (4 sectors + 0 restocks)"
  - "public/data/100mi/surface-points.json (456 points, exact key lookup, 0 unmatched)"
  - "public/data/100k/surface-points.json (278 points, proximity fallback, 6 unknown)"
  - "public/data/50k/surface-points.json (134 points, proximity fallback, 7 unknown)"
  - "public/data/100mi/sector-elevations.json (7 sectors)"
  - "public/data/100k/sector-elevations.json (4 sectors)"
  - "public/data/50k/sector-elevations.json (4 sectors)"
  - "public/data/sector-details.json reads from 100mi/annotations.json (7 entries, unchanged)"
affects:
  - 34-ui-route-selector
  - 35-elevation-multi-route
  - 36-surface-coloring-multi-route

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Haversine coordinate snapping for sector/restock annotation positioning"
    - "RidewithGPS proximity fallback (100m threshold) for routes lacking native JSON export"
    - "Per-route argv dispatch pattern: node script.js <routeId>"

key-files:
  created:
    - public/data/100mi/annotations.json
    - public/data/100k/annotations.json
    - public/data/50k/annotations.json
    - public/data/100mi/surface-points.json
    - public/data/100k/surface-points.json
    - public/data/50k/surface-points.json
    - public/data/100mi/sector-elevations.json
    - public/data/100k/sector-elevations.json
    - public/data/50k/sector-elevations.json
  modified:
    - scripts/resolve-annotations.js
    - scripts/generate-surface-points.js
    - scripts/compute-sector-elevations.js
    - scripts/generate-sector-details.js

key-decisions:
  - "Coordinate-based snapping via haversine replaces mile-based snapByMileage -- eliminates drift from route length differences between 100mi/100k/50k"
  - "100mi surface data uses exact 'lat,lon' key lookup from RidewithGPS JSON (0 unmatched; 30 S=0 entries legitimately map to unknown)"
  - "100k/50k proximity fallback uses 100mi RidewithGPS JSON as reference; 100m threshold; no exit(1) for unknown count"
  - "generate-sector-details.js reads from 100mi/annotations.json (all 7 sectors present); remains route-agnostic"

patterns-established:
  - "Proximity fallback pattern: load 100mi rwgps JSON, haversine-match each simplified point against original track_points, apply 100m threshold"
  - "Log snap distances per sector at resolve-annotations time to enable debugging of sector coordinate drift"
  - "S=0 in RidewithGPS means no OSM surface tag, correctly maps to 'unknown' -- not an error condition"

# Metrics
duration: 3min
completed: 2026-04-06
---

# Phase 33 Plan 02: Coordinate-Based Annotation Snapping and Surface Proximity Fallback Summary

**Coordinate-based haversine snapping for sector/restock annotations across all 3 routes, with RidewithGPS proximity fallback for surface data on routes lacking native JSON export**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-06T21:44:47Z
- **Completed:** 2026-04-06T21:47:53Z
- **Tasks:** 2
- **Files modified:** 4 scripts + 9 data files created

## Accomplishments

- Replaced mile-based `snapByMileage` with coordinate-accurate `snapByCoordinate` using haversine distance; all 3 routes produce annotations with all snap distances under 200m (except sector-doe-lake on 50k at 254m -- route divergence, expected)
- Added proximity fallback in `generate-surface-points.js` so 100k and 50k routes can derive surface type from 100mi RidewithGPS track_points using 100m threshold
- Updated `compute-sector-elevations.js` and `generate-sector-details.js` to read from per-route subdirectories; `sector-details.json` unchanged (7 entries)

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor resolve-annotations.js for coordinate-based snapping** - `d3c93d0` (feat)
2. **Task 2: Add proximity fallback to generate-surface-points.js and update remaining scripts** - `6444887` (feat)

**Plan metadata:** (to be committed with SUMMARY.md)

## Files Created/Modified

- `scripts/resolve-annotations.js` - Rewritten: coordinate snapping via haversine, imports from route-config.js, per-route subdirectory output
- `scripts/generate-surface-points.js` - Rewritten: exact lookup (100mi) vs proximity fallback (100k/50k) branching
- `scripts/compute-sector-elevations.js` - Updated: reads routeId from argv, per-route paths for inputs/output
- `scripts/generate-sector-details.js` - Updated: annotationsPath points to 100mi/annotations.json
- `public/data/100mi/annotations.json` - 9 entries (7 sectors + 2 restocks), all snap distances 0-7m
- `public/data/100k/annotations.json` - 5 entries (4 sectors + 1 restock), snap distances 2-74m
- `public/data/50k/annotations.json` - 4 entries (4 sectors + 0 restocks), snap distances 2-254m
- `public/data/100mi/surface-points.json` - 456 points, 0 unmatched (exact lookup), 30 S=0 -> unknown
- `public/data/100k/surface-points.json` - 278 points, 272 matched, 6 unknown (proximity mode)
- `public/data/50k/surface-points.json` - 134 points, 127 matched, 7 unknown (proximity mode)
- `public/data/100mi/sector-elevations.json` - 7 sectors, 144 elevation points
- `public/data/100k/sector-elevations.json` - 4 sectors, 63 elevation points
- `public/data/50k/sector-elevations.json` - 4 sectors, 70 elevation points

## Decisions Made

- Coordinate-based snapping replaces mile-based to correctly handle routes of different total lengths where mileage markers don't correspond across routes.
- `generate-sector-details.js` stays route-agnostic (reads 100mi for all 7 sectors); does not accept a routeId argument.
- 100mi surface data uses exact coordinate key lookup (no regression); 100k/50k use proximity fallback with 100m threshold.
- No exit(1) for unknown count in proximity mode since divergent segments legitimately produce 'unknown'.

## Deviations from Plan

None - plan executed exactly as written. The 30 S=0 entries in 100mi/surface-points.json are pre-existing behavior (present in the old flat surface-points.json) and correctly map to 'unknown' per the `S_TO_SURFACE` table.

## Issues Encountered

None. The sector-doe-lake snap distance of 254m on the 50k route (slightly over the 200m guideline) is expected -- the 50k route takes a different path near Doe Lake compared to the 100mi route. The sector is still included per the route-config.js verified sector membership.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All per-route data files complete: annotations, surface-points, sector-elevations for 100mi/100k/50k
- sector-details.json (shared) updated and correct
- Ready for Phase 34 (UI route selector) and Phase 35/36 (elevation/surface multi-route rendering)
- Blocker: content.config.ts and RouteMap.astro/ElevationProfile.astro still reference flat public/data/route-data.json -- must update to public/data/100mi/route-data.json to restore Astro build (tracked in STATE.md)

---
*Phase: 33-pipeline-route-data*
*Completed: 2026-04-06*
