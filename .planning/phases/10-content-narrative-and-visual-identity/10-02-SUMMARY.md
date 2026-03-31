---
phase: 10-content-narrative-and-visual-identity
plan: 02
subsystem: infra
tags: [pipeline, gpx, css, svg, data-uri, tailwind, astro]

# Dependency graph
requires:
  - phase: 08-photo-gallery
    provides: copyFileSync pipeline pattern for static asset delivery
  - phase: 02-data-pipeline
    provides: pipeline.js orchestrator pattern with steps array
provides:
  - scripts/copy-gpx.js pipeline step that copies Munising_Hiawatha_s_Revenge.gpx to public/
  - .topo-divider CSS class with repeating SVG topographic contour pattern in forest green
  - pipeline.js updated with copy-gpx as final step
affects:
  - 10-03-index-astro-assembly (uses GPX file for download link and topo-divider for section dividers)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "copyFileSync (not symlinks) for pipeline static asset delivery — symlinks break in CI"
    - "SVG data URI in CSS background-image with %23 URL-encoding for # characters"
    - "Graceful pipeline skip with console.warn when source file missing"

key-files:
  created:
    - scripts/copy-gpx.js
    - public/Munising_Hiawatha_s_Revenge.gpx
  modified:
    - scripts/pipeline.js
    - src/styles/global.css

key-decisions:
  - "Only copy Munising_Hiawatha_s_Revenge.gpx (5,796 lines) — Hiawatha_100.gpx (252k lines) is too large for user download"
  - "copy-gpx added as last step in pipeline.js — no dependencies on other steps, preserves existing order"
  - "Three-layer SVG contour pattern at 20px/35px/50px vertical positions with decreasing opacity for topographic depth"
  - "forest-700 (#3d6b3d) as stroke color encoded as %233d6b3d — subtle contrast against forest-900 background"

patterns-established:
  - "Pipeline static asset copy: scripts/copy-gpx.js follows same copyFileSync pattern as copy-images.js (08-02)"
  - "CSS SVG data URI: %23 for # characters, repeat-x for horizontal strips, opacity <= 0.7 for subtlety"

# Metrics
duration: 2min
completed: 2026-03-31
---

# Phase 10 Plan 02: GPX Copy and Topo Pattern Summary

**Pipeline step copies Munising GPX to public/ for static download; .topo-divider CSS class renders three-layer organic contour lines via SVG data URI in forest-700 green**

## Performance

- **Duration:** ~2 minutes
- **Started:** 2026-03-31T16:30:55Z
- **Completed:** 2026-03-31T16:32:54Z
- **Tasks:** 2 completed
- **Files modified:** 4

## Accomplishments

- `scripts/copy-gpx.js` pipeline step created — copies smaller Munising GPX to `public/` with graceful skip if source missing
- `scripts/pipeline.js` updated — `copy-gpx` added as the 6th and final step, preserving existing step order
- `.topo-divider` CSS class added to `global.css @layer base` — three quadratic bezier contour lines at forest-700 stroke color, `repeat-x` tiling, overall `opacity: 0.7` for subtle decoration
- Astro build verified clean after all changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create copy-gpx.js pipeline step and wire into pipeline.js** - `d8c8c17` (feat)
2. **Task 2: Add topographic contour line pattern class to global.css** - `2410be2` (feat)

**Plan metadata:** (see docs commit below)

## Files Created/Modified

- `scripts/copy-gpx.js` - Pipeline step: copies `Munising_Hiawatha_s_Revenge.gpx` from project root to `public/` using `copyFileSync`; graceful skip with `console.warn` if source absent
- `scripts/pipeline.js` - Added `{ name: 'copy-gpx', script: 'scripts/copy-gpx.js' }` as final entry in steps array
- `public/Munising_Hiawatha_s_Revenge.gpx` - Static asset in public/ (164KB, served at `/Munising_Hiawatha_s_Revenge.gpx`)
- `src/styles/global.css` - Added `.topo-divider` class with three-layer SVG contour pattern inside `@layer base`

## Decisions Made

- **Only the smaller GPX file is copied**: `Munising_Hiawatha_s_Revenge.gpx` (~164KB, 5,796 lines) is copied to `public/`; `Hiawatha_100.gpx` (252,923 lines, ~10MB) is explicitly excluded per plan spec and research recommendation
- **copy-gpx placed as last pipeline step**: No ordering dependency on other steps; appended after `match-photos` to avoid disrupting proven pipeline order from phase 08-02
- **Three contour lines at decreasing opacity**: Lines at y=20 (opacity 1.0), y=35 (opacity 0.6), y=50 (opacity 0.35) create topographic depth illusion matching research pattern recommendation
- **forest-700 stroke at overall opacity 0.7**: Ensures pattern is "felt not seen" per research guidance — subtle decoration without competing with content on forest-900 background

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The `grep 'Hiawatha_100' scripts/copy-gpx.js` verification initially appeared to "fail" because the comment block mentions `Hiawatha_100.gpx` — verified with a non-comment grep that no functional code references the excluded file.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `public/Munising_Hiawatha_s_Revenge.gpx` is ready for the GPX download link in plan 10-03 (`index.astro` assembly)
- `.topo-divider` class is ready for use as section dividers in plan 10-03
- Pipeline now runs 6 steps: parse-gpx → resolve-annotations → generate-thumbnails → copy-images → match-photos → copy-gpx
- No blockers for plan 10-03

---
*Phase: 10-content-narrative-and-visual-identity*
*Completed: 2026-03-31*
