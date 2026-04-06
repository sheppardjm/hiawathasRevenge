---
phase: 33-pipeline-route-data
plan: 01
subsystem: pipeline
tags: [node, gpx, pipeline, route-data, simplify-js, fast-xml-parser]

# Dependency graph
requires:
  - phase: 15-editorial-content
    provides: Existing pipeline.js and parse-gpx.js baseline to refactor
provides:
  - scripts/route-config.js as single source of truth for route definitions, verified sector membership, and sector coordinates
  - scripts/pipeline.js refactored to loop route-specific steps per route then shared steps once
  - scripts/parse-gpx.js parameterized by routeId writing to per-route subdirectories
  - public/data/100mi/route-data.json (456 pts, 101.98 mi, 2258 ft gain)
  - public/data/100k/route-data.json (278 pts, 61.68 mi, 1616 ft gain)
  - public/data/50k/route-data.json (134 pts, 31.19 mi, 809 ft gain)
affects:
  - 33-02 (generate-surface-points, resolve-annotations, compute-sector-elevations must import ROUTES and accept routeId)
  - 33-03 (generate-routes-manifest reads per-route subdirectories and ROUTES config)
  - 34 and beyond (all downstream scripts reading route-data.json must use new subdirectory paths)
  - content.config.ts (must update from public/data/route-data.json to public/data/100mi/route-data.json)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - route-config.js as single source of truth for route definitions (imported by all pipeline scripts)
    - routeId from process.argv[2] pattern for parameterizing pipeline scripts
    - per-route subdirectory output: public/data/{routeId}/route-data.json
    - pipeline loop pattern: routeSpecificSteps per route then sharedSteps once

key-files:
  created:
    - scripts/route-config.js
    - public/data/100mi/route-data.json
    - public/data/100k/route-data.json
    - public/data/50k/route-data.json
  modified:
    - scripts/pipeline.js
    - scripts/parse-gpx.js

key-decisions:
  - "Subdirectory output pattern (public/data/{routeId}/) chosen over flat key files (route-data-100mi.json)"
  - "Sector membership verified by coordinate analysis; 100k and 50k have [520, NF2266, Doe Lake, Rapid River] -- NOT Bass Lake/NF2217/ND2225 as previously estimated"
  - "Consecutive duplicate-point deduplication added to handle Strava triplicate-start artifact (100k had 51 dupes)"
  - "Elevation calibration loop skipped for 100k/50k (elevationTargetRange: null); fixed 2m threshold used"

patterns-established:
  - "Pattern: All pipeline scripts accept routeId from process.argv[2] and look up config via ROUTES.find(r => r.id === routeId)"
  - "Pattern: route-config.js is the canonical import for ROUTES, SECTOR_DEFS, RESTOCK_DEFS"
  - "Pattern: mkdirSync(outDir, { recursive: true }) before writeFileSync for per-route dirs"

# Metrics
duration: 2min
completed: 2026-04-06
---

# Phase 33 Plan 01: Pipeline & Route Data (Foundation) Summary

**Multi-route pipeline foundation: route-config.js as single source of truth, parse-gpx.js parameterized by routeId, producing three route-data.json files in public/data/{100mi,100k,50k}/ subdirectories**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-06T21:40:01Z
- **Completed:** 2026-04-06T21:42:34Z
- **Tasks:** 2
- **Files modified:** 5 (2 modified, 4 created including 3 data outputs)

## Accomplishments

- Created scripts/route-config.js with coordinate-verified sector membership (7 sectors, 3 routes, 2 restock points)
- Refactored pipeline.js to loop route-specific steps over 3 routes then run shared steps once
- Parameterized parse-gpx.js by routeId with deduplication, conditional elevation calibration, and per-route output directories
- Generated all three route-data.json files with correct mileage and elevation metadata

## Task Commits

Each task was committed atomically:

1. **Task 1: Create route-config.js and refactor pipeline.js** - `525df3a` (feat)
2. **Task 2: Make parse-gpx.js accept routeId and write to subdirectory** - `62891b6` (feat)

**Plan metadata:** (forthcoming in final commit)

## Files Created/Modified

- `scripts/route-config.js` - Single source of truth: ROUTES (3), SECTOR_DEFS (7), RESTOCK_DEFS (2), DEFAULT_ROUTE_ID
- `scripts/pipeline.js` - Imports ROUTES, loops routeSpecificSteps per route, runs sharedSteps once
- `scripts/parse-gpx.js` - Accepts routeId from argv, resolves GPX from config, deduplicates, conditional elevation calibration, writes to per-route subdir
- `public/data/100mi/route-data.json` - 456 pts, 101.98 mi, 2258 ft gain
- `public/data/100k/route-data.json` - 278 pts, 61.68 mi, 1616 ft gain
- `public/data/50k/route-data.json` - 134 pts, 31.19 mi, 809 ft gain

## Decisions Made

1. **Subdirectory output** over flat files: `public/data/{routeId}/route-data.json` rather than `route-data-100mi.json`. Enables lazy loading, avoids index collisions, matches ARCHITECTURE.md spec.

2. **Coordinate-verified sector membership**: The research doc revealed prior planning estimates were wrong. 100k and 50k loop north back through Doe Lake and Rapid River sectors, NOT through Bass Lake/NF2217/ND2225. Membership confirmed by haversine distance analysis (all "on route" sectors within 37m, all "off route" sectors 1,446m+ away).

3. **Elevation calibration conditional**: Routes with `elevationTargetRange: null` skip the threshold scanning loop entirely. This is cleaner than running the loop and letting it fall through with no match.

4. **Deduplication before fullPoints**: Added consecutive duplicate filter before building fullPoints (not after) so haversine distance calculation is clean. 100k had 51 consecutive duplicate start points (Strava artifact).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- 100k produced 278 simplified points vs. the research doc's ~300-450 estimate, and 50k produced 134 vs. ~150-250. This is expected variation from the simplification algorithm acting on actual GPX geometry. The estimates in the research doc were proportional extrapolations, not hard targets. Point density (pts/mile) is consistent across all three routes (~4.5 pts/mile for 100mi and 100k).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- route-config.js is ready for import by all plan 33-02 scripts (generate-surface-points, resolve-annotations, compute-sector-elevations)
- All three route-data.json files exist in correct subdirectory locations
- pipeline.js references generate-routes-manifest in sharedSteps (to be created in plan 33-03)
- **Blocker for existing site**: content.config.ts and RouteMap.astro/ElevationProfile.astro still reference the flat public/data/route-data.json path which no longer receives output. This breaks the Astro build. Plan 33-02 or a dedicated path-update plan must update these paths to public/data/100mi/route-data.json.

---
*Phase: 33-pipeline-route-data*
*Completed: 2026-04-06*
