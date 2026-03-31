---
phase: 08-photo-gallery
plan: 02
subsystem: build-pipeline
tags: [pipeline, node, copyFileSync, static-assets, astro, lightbox]

# Dependency graph
requires:
  - phase: 07-photo-pipeline
    provides: generate-thumbnails.js pipeline step and images/ source directory
  - phase: 08-01
    provides: PhotoGallery.astro with lightbox href="/images/{filename}" paths that need real files
provides:
  - scripts/copy-images.js — copies source JPGs from images/ to public/images/ for lightbox serving
  - pipeline.js 5-step orchestrator with copy-images as step 4
affects: [09-photo-admin, any phase that runs npm run pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "copyFileSync (not symlinks) for pipeline image distribution — symlinks break in CI/production"
    - "readdirSync without recursion naturally excludes images/inspiration/ subdirectory"
    - "ESM top-level await in pipeline scripts, consistent with generate-thumbnails.js"

key-files:
  created:
    - scripts/copy-images.js
    - public/images/ (54 source JPGs)
  modified:
    - scripts/pipeline.js

key-decisions:
  - "copyFileSync not symlinks — symlinks break in CI/production builds, file copies are safe"
  - "No filename normalization in copy-images.js — lightbox href uses photo.filename from photos.json which maps to original source name"
  - "copy-images inserted after generate-thumbnails, before match-photos — both process images/ dir; match-photos may reference image paths"

patterns-established:
  - "Pipeline step ordering: parse-gpx → resolve-annotations → generate-thumbnails → copy-images → match-photos"
  - "public/images/ is the canonical served location for full-resolution source JPGs"

# Metrics
duration: 2min
completed: 2026-03-31
---

# Phase 8 Plan 02: Copy-Images Pipeline Step Summary

**copy-images.js pipeline step using copyFileSync copies 54 source JPGs from images/ to public/images/ so PhotoSwipe lightbox href="/images/{filename}" paths resolve after build**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-31T14:59:47Z
- **Completed:** 2026-03-31T15:01:39Z
- **Tasks:** 2
- **Files modified:** 2 (scripts/copy-images.js created, scripts/pipeline.js updated)

## Accomplishments
- Created scripts/copy-images.js as ESM module following generate-thumbnails.js conventions
- Copies all 54 source JPGs from images/ to public/images/ via copyFileSync
- Integrated as step 4 in pipeline.js (between generate-thumbnails and match-photos)
- Pipeline now runs 5 steps; npm run pipeline and astro build both succeed

## Task Commits

Each task was committed atomically:

1. **Task 1: Create copy-images.js pipeline step** - `ce8388d` (feat)
2. **Task 2: Integrate copy-images into pipeline.js** - `6b71a3c` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `scripts/copy-images.js` - Copies source JPGs from images/ to public/images/ for lightbox serving
- `scripts/pipeline.js` - Added copy-images as step 4 in 5-step pipeline array
- `public/images/` - 54 full-resolution JPG files now tracked and served by Astro

## Decisions Made
- copyFileSync not symlinks: symlinks break in CI/production builds; file copies are safe and total ~60MB which is acceptable for a static site
- No filename normalization: lightbox href uses photo.filename from photos.json which maps to original source name as-is; normalizing here would create a mismatch
- Step ordering: copy-images after generate-thumbnails (both process images/ dir) and before match-photos (may reference image paths); no data dependencies so placement is flexible

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Full lightbox pipeline is complete: thumbnails in public/thumbs/, full-res images in public/images/
- PhotoSwipe gallery will serve real images when photos-manifest.json is populated in Phase 9
- Phase 9 (Photo Admin) can now build the manifest UI knowing both asset directories exist

---
*Phase: 08-photo-gallery*
*Completed: 2026-03-31*
