---
phase: 07-photo-pipeline
plan: 02
subsystem: data-pipeline
tags: [node, esm, mileage-snapping, photos, pipeline, json]

# Dependency graph
requires:
  - phase: 07-01
    provides: generate-thumbnails.js, 54 WebP thumbnails in public/thumbs/, thumbnail filename normalization pattern
  - phase: 02-01
    provides: route-data.json with points[].miles for snapByMileage
  - phase: 02-02
    provides: snapByMileage pattern from resolve-annotations.js
provides:
  - scripts/match-photos.js — manifest-to-photos.json generator with mileage snapping
  - public/data/photos.json — empty array (real entries when Phase 9 provides manifest)
  - scripts/pipeline.js updated — 4-step orchestrator (parse-gpx, resolve-annotations, generate-thumbnails, match-photos)
affects: [09-photo-admin, photo-gallery-component, any consumer of photos.json]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Absent-manifest graceful fallback: existsSync check → warn + write empty array + exit(0)"
    - "snapByMileage reuse: copied from resolve-annotations.js for any mile-referenced data"
    - "Thumb derivation parity: match-photos.js and generate-thumbnails.js use identical basename.replace(/ /g, '_') + '.webp'"
    - "Pipeline extension: add steps to steps[] array in pipeline.js, order by data dependency"

key-files:
  created:
    - scripts/match-photos.js
    - public/data/photos.json
  modified:
    - scripts/pipeline.js

key-decisions:
  - "photos.json written as empty array when manifest absent — build never fails before Phase 9"
  - "match-photos.js thumb derivation identical to generate-thumbnails.js — ensures /thumbs/ URL resolves to real file"
  - "snapByMileage copied verbatim from resolve-annotations.js — consistent coordinate snapping across all annotation types"
  - "match-photos runs last in pipeline — conceptually depends on thumbnails existing and requires route-data.json"

patterns-established:
  - "Absent-file graceful fallback pattern: existsSync → warn → write empty [] → exit(0)"
  - "Pipeline extension: new scripts added to steps[] array, no other changes needed"

# Metrics
duration: 4min
completed: 2026-03-31
---

# Phase 7 Plan 02: Match Photos Summary

**match-photos.js writes empty photos.json when manifest absent and snapsByMileage when Phase 9 provides photos-manifest.json; pipeline.js extended to 4 steps**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-31T06:35:00Z
- **Completed:** 2026-03-31T06:39:28Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created scripts/match-photos.js with graceful absent-manifest handling (writes empty array, exits 0)
- snapByMileage copied from resolve-annotations.js — coordinate snapping consistent with all other annotation types
- Thumb URL derivation in match-photos.js matches generate-thumbnails.js exactly (space-to-underscore + .webp)
- Updated pipeline.js to orchestrate 4 steps: parse-gpx, resolve-annotations, generate-thumbnails, match-photos
- `npm run pipeline` and `npm run build` both complete without error

## Task Commits

Each task was committed atomically:

1. **Task 1: Create match-photos.js** - `a95549e` (feat)
2. **Task 2: Integrate both scripts into pipeline.js** - `a77dbb2` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `scripts/match-photos.js` - Reads photos-manifest.json, snaps mileage to route coords, writes photos.json; falls back to empty array when manifest absent
- `public/data/photos.json` - Empty array (placeholder until Phase 9 provides manifest)
- `scripts/pipeline.js` - Added generate-thumbnails and match-photos as steps 3 and 4

## Decisions Made
- photos.json written as empty array when manifest absent — the Astro content collection's try/catch parser handles empty arrays, so build never fails before Phase 9
- match-photos.js thumb derivation must be identical to generate-thumbnails.js: `basename.replace(/ /g, '_') + '.webp'` — this ensures the `thumb` URL in photos.json points to the actual file in public/thumbs/
- snapByMileage copied verbatim from resolve-annotations.js (not abstracted to shared module) — keeps scripts self-contained and avoids introducing a shared module pattern not established in this project
- match-photos runs last in pipeline — no strict data dependency on generate-thumbnails but conceptually thumbnails should exist before photos.json references them

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- None. Both tasks ran cleanly on first attempt. The `[WARN] [file-loader] No items found in public/data/photos.json` from Astro build is expected behavior for an empty array and does not affect build success.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Photo pipeline infrastructure complete: generate-thumbnails.js + match-photos.js + pipeline.js all integrated
- `npm run pipeline` produces all data files including photos.json (empty until Phase 9)
- Phase 9 (photo admin) only needs to write photos-manifest.json with `{filename, mile}` entries; match-photos.js handles the rest
- No blockers for Phase 8 (next phase in roadmap)

---
*Phase: 07-photo-pipeline*
*Completed: 2026-03-31*
