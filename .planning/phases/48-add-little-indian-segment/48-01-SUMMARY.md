---
phase: 48-add-little-indian-segment
plan: 01
subsystem: ui
tags: [astro, json, pipeline, route-data, segments, gravel-sectors]

# Dependency graph
requires:
  - phase: 33-pipeline-route-data
    provides: resolve-annotations.js and compute-sector-elevations.js pipeline scripts, SECTOR_DEFS pattern in route-config.js
  - phase: 24-sector-detail-panels
    provides: generate-sector-details.js script and sector-details.json schema
provides:
  - Little Indian as the 8th gravel sector across all source files and pipeline outputs
  - sector-little-indian in 100mi and 100k annotations.json (not 50k)
  - Little Indian elevation sparkline data in 100mi/100k sector-elevations.json
  - 8-entry sector-details.json with Little Indian description and forest road gravel surface label
  - 8th segment card in RouteExplainer.astro with nth-child(8) stagger delay
affects: [any phase touching route explainer, sector panels, or pipeline outputs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Segment insertion pattern: update segments.json + route-config.js SECTOR_DEFS + sectorIds + generate-sector-details.js SECTOR_DETAILS + RouteExplainer.astro SECTOR_IDS, then run pipeline"
    - "Photo range boundary adjustment: ND2225 endMi and Doe Lake startMi adjusted to eliminate overlap/gap around new Little Indian segment"

key-files:
  created: []
  modified:
    - src/components/segments.json
    - scripts/route-config.js
    - scripts/generate-sector-details.js
    - src/components/RouteExplainer.astro
    - public/data/100mi/annotations.json
    - public/data/100k/annotations.json
    - public/data/sector-details.json
    - public/data/100mi/sector-elevations.json
    - public/data/100k/sector-elevations.json

key-decisions:
  - "Little Indian included in 100mi and 100k sectorIds but not 50k (consistent with route geography)"
  - "ND2225 endMi changed from 70.0 to 65.8; Doe Lake startMi changed from 70.0 to 71.5 to bound photo ranges around Little Indian"
  - "sector-little-indian difficulty=easy, stars=2 in SECTOR_DEFS"

patterns-established:
  - "New segment insertion requires 4 source file edits + 3 pipeline runs (resolve-annotations x3 routes, compute-sector-elevations x3 routes, generate-sector-details)"

# Metrics
duration: 2min
completed: 2026-04-08
---

# Phase 48 Plan 01: Add Little Indian Segment Summary

**Little Indian added as 8th gravel sector with forest road gravel surface, Strava segment 34542982, elevation sparkline, and 2-star difficulty on 100mi and 100k routes**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-08T17:45:25Z
- **Completed:** 2026-04-08T17:47:40Z
- **Tasks:** 3 (2 with commits, 1 build-only verification)
- **Files modified:** 9

## Accomplishments
- Little Indian segment card defined in all 4 source files with editorial data, Strava ID, and sector geometry
- Pipeline regenerated: sector-little-indian snapped into 100mi/100k annotations, elevation data computed, 8-entry sector-details.json produced
- Astro site built clean with 8-segment RouteExplainer and nth-child(8) stagger CSS

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Little Indian data to all 4 source files** - `12b758f` (feat)
2. **Task 2: Run pipeline and verify outputs** - `92e5880` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/components/segments.json` - Added Little Indian entry; adjusted ND2225 endMi=65.8 and Doe Lake startMi=71.5
- `scripts/route-config.js` - Added SECTOR_DEFS entry for sector-little-indian; added to 100mi and 100k sectorIds
- `scripts/generate-sector-details.js` - Added SECTOR_DETAILS entry (segmentName: 'Little Indian', forest road gravel)
- `src/components/RouteExplainer.astro` - Added SECTOR_IDS mapping, nth-child(8) stagger, updated heading to "Eight segments"
- `public/data/100mi/annotations.json` - Regenerated with sector-little-indian snapped at route coords
- `public/data/100k/annotations.json` - Regenerated with sector-little-indian snapped at route coords
- `public/data/sector-details.json` - Regenerated with 8 entries including Little Indian
- `public/data/100mi/sector-elevations.json` - Regenerated with Little Indian elevation points
- `public/data/100k/sector-elevations.json` - Regenerated with Little Indian elevation points

## Decisions Made
- Little Indian added to 100mi and 100k sectorIds but not 50k (matches route geography — sector is on the northern loop)
- Photo range boundaries adjusted so there is no overlap or gap: ND2225 (50.0–65.8mi), Little Indian (65.8–71.5mi), Doe Lake (71.5–92.0mi)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. All 7 pipeline commands exited 0. Astro build completed clean.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Little Indian sector is fully live in 100mi and 100k routes
- All source and generated files committed
- Astro build passes — ready for deployment
- 50k route unaffected (Little Indian correctly excluded)

---
*Phase: 48-add-little-indian-segment*
*Completed: 2026-04-08*
