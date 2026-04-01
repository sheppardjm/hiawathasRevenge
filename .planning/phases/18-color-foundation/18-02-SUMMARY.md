---
phase: 18-color-foundation
plan: 02
subsystem: infra
tags: [sharp, webp, pipeline, historical-images, node-esm]

# Dependency graph
requires:
  - phase: 15-editorial-content
    provides: pipeline.js orchestration pattern and match-photos.js graceful-absent-manifest guard pattern
provides:
  - scripts/process-historical.js — standalone historical image processing pipeline with sharp WebP conversion
  - public/data/historical-manifest.json — empty manifest template for Phase 20 to populate
  - images/historical/ — isolated source directory for public domain historical illustrations
  - public/data/historical-photos.json — pipeline output consumed by Phase 20 front-end features
affects:
  - phase 20 (historical illustrations feature — adds images and populates manifest)
  - phase 22 (any future pipeline additions follow this standalone-script pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Standalone per-category pipeline script: isolated script per image category (route photos vs historical), zero cross-contamination"
    - "Graceful absent-manifest guard: write [] and exit 0 when manifest missing — enables clean builds before data exists"
    - "Multi-format extension filtering: SUPPORTED_EXTS Set covers .jpg/.jpeg/.png/.tiff/.tif/.webp for heterogeneous source directories"
    - "Top-level await in ES modules: sharp calls use top-level await without async wrapper, matching generate-thumbnails.js pattern"

key-files:
  created:
    - scripts/process-historical.js
    - public/data/historical-manifest.json
    - public/data/historical-photos.json
    - images/historical/.gitkeep
  modified:
    - scripts/pipeline.js

key-decisions:
  - "Standalone script architecture: process-historical.js is fully isolated from generate-thumbnails.js and copy-images.js, preserving zero-risk to 51-photo route photo pipeline"
  - "Insert process-historical as step 5 of 7 (after copy-images, before match-photos) to group image processing steps together"
  - "Empty manifest produces empty output (not an error): empty [] manifest writes [] to historical-photos.json and exits 0 cleanly"

patterns-established:
  - "Per-category pipeline scripts: new image categories get their own standalone script rather than modifying existing scripts"
  - "Absent-manifest graceful exit: write output as [] and exit 0; do not fail build when data not yet populated"

# Metrics
duration: 2min
completed: 2026-04-01
---

# Phase 18 Plan 02: Historical Image Pipeline Summary

**Standalone sharp WebP pipeline for public domain historical illustrations, isolated from route photo processing, with graceful empty-manifest handling enabling clean builds before Phase 20 data exists**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-01T04:20:51Z
- **Completed:** 2026-04-01T04:22:24Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created process-historical.js processing historical illustrations through sharp WebP pipeline (400px wide, 80% quality), validating category: "historical" field and supporting 6 input formats
- Added graceful absent-manifest and absent-source-dir guards so npm run build passes cleanly before any historical images exist
- Integrated as step 5 of 7 in pipeline.js with zero modification to generate-thumbnails.js, copy-images.js, or match-photos.js
- Created empty historical-manifest.json template and images/historical/ directory ready for Phase 20 content

## Task Commits

Each task was committed atomically:

1. **Task 1: Create process-historical.js and supporting files** - `6330449` (feat)
2. **Task 2: Add process-historical step to pipeline.js and verify full build** - `7f5d2e9` (feat)

**Plan metadata:** (committed in docs commit below)

## Files Created/Modified

- `scripts/process-historical.js` - Standalone historical image processor: reads historical-manifest.json, validates category field, generates WebP thumbnails via sharp, copies full-res, writes historical-photos.json
- `scripts/pipeline.js` - Added process-historical as step 5 of 7 between copy-images and match-photos
- `public/data/historical-manifest.json` - Empty [] template; Phase 20 populates with actual public domain image entries
- `public/data/historical-photos.json` - Pipeline output; written as [] until Phase 20 adds images
- `images/historical/.gitkeep` - Tracks empty source directory in git

## Decisions Made

- **Standalone script architecture:** New script isolated from existing pipeline scripts — zero risk to the 51-photo route photo pipeline. Modifying generate-thumbnails.js to recurse subdirectories was explicitly rejected.
- **Step position (5 of 7):** Inserted after copy-images and before match-photos to group all image processing steps together in the pipeline.
- **Multi-format support:** SUPPORTED_EXTS covers .jpg/.jpeg/.png/.tiff/.tif/.webp because public domain historical images from Internet Archive / Met Open Access may arrive in any of these formats.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Pipeline is fully ready for Phase 20 to add historical images: populate historical-manifest.json with entries and drop image files into images/historical/
- The manifest schema is documented in 18-RESEARCH.md: filename, category, title, artist, year, source, license fields
- Phase 20 front-end code should fetch /data/historical-photos.json for the processed image data
- No pipeline changes needed in Phase 20 — script and manifest template already in place

---
*Phase: 18-color-foundation*
*Completed: 2026-04-01*
