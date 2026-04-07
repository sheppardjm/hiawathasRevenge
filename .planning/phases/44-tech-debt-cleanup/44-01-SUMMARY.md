---
phase: 44-tech-debt-cleanup
plan: 01
subsystem: data-pipeline
tags: [surface-points, photos, cls-placeholder, parseDims, pipeline, tech-debt]

requires:
  - phase: 40-surface-rendering
    provides: surface rendering removal (surface-points.json files became dead data)
  - phase: 42-photo-pipeline
    provides: photo pipeline with parseDims filename-based dimension extraction
provides:
  - Clean codebase with no dead surface-points.json files
  - RouteMap.astro with no stale feature references
  - Correct landscape CLS placeholder for photo 486608604
  - Pipeline no longer generates dead surface-points data
affects:
  - Future pipeline runs (no longer generate surface-points.json)
  - Gallery and segment card rendering (landscape CLS placeholder now correct)

tech-stack:
  added: []
  patterns:
    - "Photo filenames include -WxH dimension suffix for parseDims CLS placeholder extraction"
    - "Pipeline routeSpecificSteps only includes steps with active consumers"

key-files:
  created: []
  modified:
    - src/components/RouteMap.astro
    - scripts/pipeline.js
    - public/data/photos-manifest.json
    - public/data/photos.json
    - images/486608604_9394952410585513_146903612478534164_n-2048x1536.jpg (renamed)
    - public/images/486608604_9394952410585513_146903612478534164_n-2048x1536.jpg (renamed)
    - public/thumbs/486608604_9394952410585513_146903612478534164_n-2048x1536.webp (renamed)
  deleted:
    - public/data/surface-points.json
    - public/data/100mi/surface-points.json
    - public/data/100k/surface-points.json
    - public/data/50k/surface-points.json

key-decisions:
  - "Removed generate-surface-points from pipeline.js (Rule 3 blocker: prebuild was regenerating deleted files)"
  - "Renamed photo files with -2048x1536 suffix rather than modifying parseDims fallback"

patterns-established:
  - "Dimension suffix -WxH on photo filenames is required for correct CLS placeholders"

duration: 4min
completed: 2026-04-07
---

# Phase 44 Plan 01: Tech Debt Cleanup Summary

**Deleted 4 dead surface-points.json files, removed generate-surface-points from pipeline, cleaned 2 stale RouteMap comments, and fixed landscape CLS placeholder for photo 486608604 by adding -2048x1536 dimension suffix.**

## Performance

- Duration: 4 minutes
- Started: 2026-04-07T18:53:13Z
- Completed: 2026-04-07T18:57:XX Z
- Tasks: 2/2
- Files modified: 7 (4 deleted, 3 renamed, 2 modified)

## Accomplishments

1. **Deleted 4 dead surface-points.json files** — public/data/surface-points.json and all three route subdirectory variants removed from disk and git.
2. **Removed generate-surface-points from pipeline.js** — Prevented prebuild from regenerating dead files on every build. No consumers remain in the codebase.
3. **Cleaned 2 stale RouteMap.astro comments** — Removed ", surface-points" from the route-specific data fetch comment (~line 347) and ", jump link" from the panel body build comment (~line 442).
4. **Fixed landscape CLS placeholder for photo 486608604** — Renamed pipeline source, published image, and thumbnail to include -2048x1536 suffix. Regenerated photos.json via match-photos.js. parseDims now returns 2048x1536 (landscape) instead of falling back to 1536x2048 (portrait).

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Delete dead surface-points.json files and fix stale RouteMap comments | b605b95 | 4 deleted, RouteMap.astro |
| 2 | Fix landscape photo CLS placeholder by adding -WxH dimension suffix | d30e74d | 3 renamed, photos-manifest.json, photos.json, pipeline.js |

## Files Created/Modified

**Deleted:**
- `public/data/surface-points.json`
- `public/data/100mi/surface-points.json`
- `public/data/100k/surface-points.json`
- `public/data/50k/surface-points.json`

**Renamed:**
- `images/486608604_*_n.jpg` → `images/486608604_*_n-2048x1536.jpg`
- `public/images/486608604_*_n.jpg` → `public/images/486608604_*_n-2048x1536.jpg`
- `public/thumbs/486608604_*_n.webp` → `public/thumbs/486608604_*_n-2048x1536.webp`

**Modified:**
- `src/components/RouteMap.astro` — 2 comment lines updated
- `scripts/pipeline.js` — generate-surface-points step removed from routeSpecificSteps
- `public/data/photos-manifest.json` — filename updated to include -2048x1536
- `public/data/photos.json` — regenerated; id/filename/thumb all include -2048x1536

## Decisions Made

1. **Removed generate-surface-points from pipeline.js** — The prebuild hook runs `pipeline.js` before every build. Deleting the files without removing the generator step meant every `npm run build` would regenerate them. Removing the step from the pipeline permanently closes this tech debt item. No consumers of surface-points.json remain in the codebase.

2. **Renamed photo files rather than modifying parseDims fallback** — The plan's intent is that parseDims extracts dimensions from filenames. Modifying the fallback would be a workaround; the correct fix is to name files consistently with the established convention.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed generate-surface-points from pipeline.js**

- **Found during:** Task 1 verification (build step ran `prebuild` which is `node scripts/pipeline.js`)
- **Issue:** `npm run build` triggers `prebuild` which runs the full pipeline including `generate-surface-points.js`, recreating the 3 subdirectory surface-points.json files that were just deleted. The top-level `public/data/surface-points.json` was already committed as deleted, but the subdirectory files were being regenerated on each build.
- **Fix:** Removed `{ name: 'generate-surface-points', script: 'scripts/generate-surface-points.js' }` from `routeSpecificSteps` array in `scripts/pipeline.js`. No consumers of surface-points.json remain in any source file or script.
- **Files modified:** `scripts/pipeline.js`
- **Commit:** d30e74d (included in Task 2 commit)

## Issues Encountered

None beyond the Rule 3 blocker documented above.

## User Setup Required

None. All changes are code/data only.

## Next Phase Readiness

All 4 tech debt items from v1.7-MILESTONE-AUDIT.md are resolved:
- No surface-points.json files exist in public/data/ (and pipeline won't regenerate them)
- RouteMap.astro has no stale references to removed features
- Photo 486608604 has correct landscape dimensions for CLS placeholder
- Pipeline source renamed for future pipeline consistency

Phase 44 is complete. v1.7 milestone is fully clean.
