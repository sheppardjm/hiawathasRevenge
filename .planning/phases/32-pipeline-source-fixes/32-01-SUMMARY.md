---
phase: 32-pipeline-source-fixes
plan: 01
subsystem: pipeline
tags: [node, pipeline, gravel-sectors, og-image, sharp, data-generation]

# Dependency graph
requires:
  - phase: 28-gap-closure
    provides: Manual NF2217-2218 fix to data files (now made permanent in source)
  - phase: 29-seo-social-sharing
    provides: generate-og-image.js script and public/og-image.jpg
provides:
  - resolve-annotations.js GRAVEL_SECTORS source has NF2217-2218 permanently — no manual re-fix needed after pipeline runs
  - pipeline.js orchestrates all steps including generate-og-image as final step
affects:
  - Any phase that runs npm run pipeline (all future pipeline runs are now self-healing)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pipeline source truth: sector display names must be fixed in GRAVEL_SECTORS constant, not patched in output files"
    - "Pipeline step ordering: generate-og-image runs last (no data dependencies)"

key-files:
  created:
    - .planning/phases/32-pipeline-source-fixes/32-01-SUMMARY.md
  modified:
    - scripts/resolve-annotations.js
    - scripts/pipeline.js
    - public/data/annotations.json
    - public/data/sector-details.json
    - public/data/sector-elevations.json
    - public/og-image.jpg

key-decisions:
  - "Fix NF2217 in source (GRAVEL_SECTORS) rather than post-hoc data file patching to prevent future regression"
  - "Add generate-og-image as final pipeline step — no data dependencies so ordering is safe"

patterns-established:
  - "Source truth pattern: pipeline source definitions are the canonical record; data files are derived outputs"

# Metrics
duration: 1min
completed: 2026-04-06
---

# Phase 32 Plan 01: Pipeline Source Fixes Summary

**Fixed DEBT-02 regression at its source (resolve-annotations.js NF2217 -> NF2217-2218) and wired generate-og-image.js into pipeline.js so all outputs are correct after every clean pipeline run**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-04-06T16:47:47Z
- **Completed:** 2026-04-06T16:48:55Z
- **Tasks:** 2
- **Files modified:** 2 source files, 4 pipeline outputs confirmed correct

## Accomplishments
- Closed DEBT-02 at the source: resolve-annotations.js GRAVEL_SECTORS now defines `name: 'NF2217-2218'` so every pipeline run produces the correct name without manual patching
- Wired generate-og-image.js into pipeline.js steps array as the final step, so `npm run pipeline` produces public/og-image.jpg automatically
- Ran full pipeline to verify: all three data files contain NF2217-2218, zero bare NF2217 name references, og-image.jpg generated at 233KB (1200x630 JPEG)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix NF2217 source name and wire OG image into pipeline** - `6cb9428` (fix)
2. **Task 2: Run pipeline and verify all outputs** - no separate commit needed (output files already matched correct state in git from Phase 28/29 fixes; pipeline confirmed identical regenerated content)

**Plan metadata:** (see docs commit below)

## Files Created/Modified
- `scripts/resolve-annotations.js` - GRAVEL_SECTORS sector-nf2217 name changed from 'NF2217' to 'NF2217-2218'
- `scripts/pipeline.js` - Added `{ name: 'generate-og-image', script: 'scripts/generate-og-image.js' }` as final step
- `public/data/annotations.json` - Contains NF2217-2218 (regenerated, matched existing)
- `public/data/sector-details.json` - Contains NF2217-2218 (regenerated, matched existing)
- `public/data/sector-elevations.json` - Contains NF2217-2218 (regenerated, matched existing)
- `public/og-image.jpg` - Valid JPEG 233KB (regenerated, matched existing)

## Decisions Made
- Fixed in GRAVEL_SECTORS source constant rather than adding a post-processing step, to ensure the source of truth is always correct and self-documenting
- Placed generate-og-image as the final pipeline step: it has no dependencies on other data outputs and logically belongs at the end

## Deviations from Plan

None - plan executed exactly as written.

**Note on Task 2 commit:** The pipeline output files (annotations.json, sector-details.json, sector-elevations.json, og-image.jpg) were already at the correct state in git (from Phase 28 manual fix and Phase 29 OG image work respectively). The pipeline ran cleanly and regenerated identical content, so no new commit was needed for output files. The important achievement is that these files will now remain correct after every future pipeline run without manual intervention.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Pipeline is now fully self-healing: `npm run pipeline` produces all correct outputs in one command
- DEBT-02 is permanently closed at the source level (not just patched in output)
- OG image generation is part of standard pipeline — no manual steps needed
- Ready for any future phases requiring pipeline runs

---
*Phase: 32-pipeline-source-fixes*
*Completed: 2026-04-06*
