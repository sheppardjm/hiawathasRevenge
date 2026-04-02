---
phase: 23-data-reconciliation-sector-pipeline
plan: 01
subsystem: data pipeline
tags: [node, pipeline, json, annotations, surface-types, ridewithgps, astro, zod]

# Dependency graph
requires:
  - phase: 22-or-earlier
    provides: route-data.json (456 simplified points from parse-gpx.js)
  - phase: 22-or-earlier
    provides: hiawathasRevenge.json (RidewithGPS export with track_points S field)
provides:
  - stars integer field (1-5) in annotations.json for all 7 gravel sectors
  - surface-points.json with 456 entries mapping route points to surface types (paved/gravel/dirt/unknown)
  - updated content.config.ts Zod schema validating stars field at build time
  - generate-surface-points.js pipeline step wired after parse-gpx
affects:
  - phase: 23-02 (sector-details pipeline reads annotations.json with stars)
  - phase: 25 (surface-colored track reads surface-points.json)
  - phase: 26 (sector panel UI reads stars from sector-details.json which reads annotations.json)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pipeline script pattern: ESM imports, fileURLToPath __dirname, readFileSync/writeFileSync, summary log"
    - "Coordinate lookup pattern: 5-decimal rounding Map for simplified -> original point matching"

key-files:
  created:
    - scripts/generate-surface-points.js
    - public/data/surface-points.json
  modified:
    - scripts/resolve-annotations.js
    - scripts/pipeline.js
    - src/content.config.ts
    - public/data/annotations.json

key-decisions:
  - "stars field is additive only — difficulty string left unchanged to avoid breaking existing components"
  - "Coordinate lookup via 5-decimal rounding (not distance-based) — 100% match rate confirmed empirically"
  - "S=57 (compacted gravel) mapped to 'gravel' same as S=56 for coloring purposes"
  - "generate-surface-points inserted after parse-gpx, before resolve-annotations — reads route-data.json only"

patterns-established:
  - "Coordinate matching: route-data.json lat/lon (5 decimals) == round(track_points y/x, 5)"
  - "S field mapping: 95=paved, 56=gravel, 57=gravel, 59=dirt, 0=unknown"

# Metrics
duration: 2min
completed: 2026-04-02
---

# Phase 23 Plan 01: Data Reconciliation (DATA-01 + DATA-03) Summary

**Stars integer added to annotations.json via coordinate-matched RidewithGPS S-field producing 456-entry surface-points.json, both resolving DATA-01 and DATA-03 data foundations**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-02T17:05:39Z
- **Completed:** 2026-04-02T17:07:37Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- DATA-01 resolved: stars integer (1-5) is now canonical difficulty source in annotations.json for all 7 sectors; difficulty strings preserved unchanged
- DATA-03 resolved: surface-points.json produced from 456/456 coordinate-matched RidewithGPS track_points (0 unmatched), with distribution: 109 paved, 177 gravel, 140 dirt, 30 unknown
- Astro build passes with updated Zod schema validating stars field at build time

## Task Commits

Each task was committed atomically:

1. **Task 1: Add stars to resolve-annotations.js and update content.config.ts schema** - `b33f222` (feat)
2. **Task 2: Create generate-surface-points.js and wire into pipeline** - `6f4aa8b` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `scripts/resolve-annotations.js` - Added stars integer to GRAVEL_SECTORS constant and snappedSectors.map() output
- `src/content.config.ts` - Added stars: z.number().int().min(1).max(5) to sector discriminated union schema
- `public/data/annotations.json` - Regenerated with stars field on all 7 sector entries
- `scripts/generate-surface-points.js` - New pipeline script: coordinate lookup from RidewithGPS track_points S field to surface-points.json
- `scripts/pipeline.js` - Inserted generate-surface-points step after parse-gpx, before resolve-annotations
- `public/data/surface-points.json` - New output: 456 entries with { miles, surface } aligned to route-data.json

## Decisions Made

- **stars additive only**: DATA-01 adds stars alongside difficulty (not replacing it). The difficulty strings ('easy'/'moderate'/'hard') are used by many existing components and have intentional mismatches with star values per data.md. Stars is the canonical source going forward.
- **Coordinate matching strategy**: 5-decimal rounding Map lookup (not distance-based) — verified at 456/456 match rate empirically during research. Zero fallbacks needed.
- **S=57 treated as gravel**: Compacted/fine gravel treated same as S=56 for coloring purposes; distinction has no visual significance at the rendered track scale.
- **generate-surface-points after parse-gpx**: Does not depend on annotations.json; inserted at earliest possible position to make step order intent explicit.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npx astro build` requires Node >=22.12.0 (system Node is v20). Used `/Users/Sheppardjm/.volta/bin/node` per established project pattern. Build passed cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 23 Plan 02 (generate-sector-details.js) is unblocked: annotations.json now includes stars field which sector-details.json will read
- Phase 25 surface-colored track is unblocked: surface-points.json exists with 456 entries aligned to route-data.json by index
- Known data discrepancy documented in research: sector-520 shows mostly S=56 (gravel) in surface-points.json but editorial description says "smooth asphalt" — OSM data may be stale. Phase 25 will render from S-field data; editorial surface label in sector-details.json will say "paved"

---
*Phase: 23-data-reconciliation-sector-pipeline*
*Completed: 2026-04-02*
