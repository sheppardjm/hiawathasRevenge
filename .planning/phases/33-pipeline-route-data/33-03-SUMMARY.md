---
phase: 33-pipeline-route-data
plan: 03
subsystem: pipeline
tags: [node, json, gpx, astro, content-collections, multi-route]

# Dependency graph
requires:
  - phase: 33-pipeline-route-data
    provides: route-config.js with 3 ROUTES, per-route subdirectory JSON output from plans 01+02

provides:
  - scripts/generate-routes-manifest.js reading per-route route-data.json to produce routes.json
  - public/data/routes.json with defaultRoute and 3 route entries (100mi/100k/50k)
  - All 3 GPX files in public/ for download (copy-gpx.js loops over ROUTES)
  - content.config.ts pointing to public/data/100mi/ subdirectory paths
  - RouteMap.astro and ElevationProfile.astro fetching from /data/100mi/ paths
  - Passing npm run build with full pipeline + Astro content collections resolving

affects:
  - Phase 34+ multi-route UI (consumes routes.json for route switcher)
  - Any future plan that extends content.config.ts collections
  - Pipeline maintenance (copy-gpx.js and generate-routes-manifest.js now auto-handle new routes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Loop over ROUTES for per-route file operations (manifest generation, GPX copy)"
    - "routes.json as top-level manifest for multi-route UI discovery"
    - "100mi subdirectory as source of truth for shared Astro content collections (route-specific but 100mi is primary)"

key-files:
  created:
    - scripts/generate-routes-manifest.js
    - public/data/routes.json
  modified:
    - scripts/copy-gpx.js
    - src/content.config.ts
    - src/components/RouteMap.astro
    - src/components/ElevationProfile.astro

key-decisions:
  - "routes.json manifest schema includes shortName, gpxFile, color, totalMiles, elevationGainFeet, sectorIds from route-config.js + route-data.json meta"
  - "sector-details.json and photos.json remain shared (flat public/data/ paths) -- not per-route"
  - "content.config.ts collections point to 100mi subdirectory as the primary/default route for SSG build"

patterns-established:
  - "Manifest pattern: scripts read ROUTES config + per-route JSON to produce aggregated manifest"
  - "Frontend routes: route-specific JSON at /data/{routeId}/, shared JSON at /data/"

# Metrics
duration: 2min
completed: 2026-04-06
---

# Phase 33 Plan 03: Manifest Generator, GPX Copy, and Frontend Path Migration Summary

**Routes.json manifest generated from per-route data, all 3 GPX files copied to public/, and all frontend data consumers migrated to /data/100mi/ subdirectory paths -- full pipeline builds cleanly with npm run build**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-06T21:50:24Z
- **Completed:** 2026-04-06T21:52:10Z
- **Tasks:** 2
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments

- Created `scripts/generate-routes-manifest.js` that reads per-route route-data.json metadata via ROUTES loop and writes `public/data/routes.json` with 3 routes (100mi/100k/50k), each with id, name, shortName, gpxFile, color, totalMiles, elevationGainFeet, and sectorIds
- Updated `scripts/copy-gpx.js` to loop over ROUTES and copy all 3 GPX files to public/ (replacing single hardcoded path)
- Migrated 5 frontend data consumer paths from flat `/data/` to `/data/100mi/` subdirectory: 3 in content.config.ts (routeData, annotations, sectorElevations collections), 4 in RouteMap.astro, and 2 in ElevationProfile.astro
- `npm run build` completes without errors; all 3 route subdirectories with 4 JSON files each are present in dist/; sector-details.json and photos.json remain shared

## Task Commits

Each task was committed atomically:

1. **Task 1: Create generate-routes-manifest.js and update copy-gpx.js** - `6d6c658` (feat)
2. **Task 2: Update content.config.ts and component fetch paths, then validate build** - `9b0b1b1` (feat)

**Plan metadata:** (see docs commit)

## Files Created/Modified

- `scripts/generate-routes-manifest.js` - New script: loops over ROUTES, reads per-route route-data.json meta, writes routes.json manifest to public/data/
- `scripts/copy-gpx.js` - Updated: replaced hardcoded single-file copy with ROUTES loop; handles all 3 GPX files
- `public/data/routes.json` - Generated manifest with defaultRoute "100mi" and 3 route entries
- `src/content.config.ts` - Updated 3 file() loader paths to public/data/100mi/ subdirectory
- `src/components/RouteMap.astro` - Updated 4 fetch() paths to /data/100mi/ (route-data, annotations, sector-elevations, surface-points); sector-details and photos unchanged
- `src/components/ElevationProfile.astro` - Updated 2 fetch() paths to /data/100mi/ (route-data, annotations)

## Decisions Made

- `routes.json` manifest includes `shortName` (same as `id`) and `gpxFile` in addition to display metadata, providing everything a route switcher component needs without additional lookups
- `sector-details.json` and `photos.json` remain at flat `/data/` paths since they are not per-route (sector-details is route-agnostic, photos are matched to 100mi)
- Astro content.config.ts collections remain pointed at `100mi` subdirectory for the SSG build -- the primary route for static site rendering

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All 3 route subdirectory JSON files were already present from plans 33-01 and 33-02, so both scripts and the Astro build ran cleanly on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 33 pipeline is fully complete:
- 3 route subdirectories in public/data/ with 4 JSON files each (route-data, annotations, sector-elevations, surface-points)
- routes.json manifest at public/data/routes.json
- 3 GPX files in public/ for download
- Existing 100mi site renders identically from new subdirectory paths
- npm run build passes cleanly

Ready for Phase 34+ multi-route UI work. The routes.json manifest provides the route switcher component everything needed to list and switch between routes. Frontend components will need to be updated to accept a routeId parameter and fetch from /data/{routeId}/ dynamically.

Concerns carrying forward:
- Elevation gains for 100k (~1,616 ft) and 50k (~809 ft) unverified against Strava/Garmin reference recordings
- astro.config.ts site URL is still placeholder -- update before deployment

---
*Phase: 33-pipeline-route-data*
*Completed: 2026-04-06*
