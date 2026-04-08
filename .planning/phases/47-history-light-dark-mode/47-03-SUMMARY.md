---
phase: 47-history-light-dark-mode
plan: 03
subsystem: ui
tags: [css, background-images, sharp, webp, full-bleed, ojibwe, inspiration]

# Dependency graph
requires:
  - phase: 47-history-light-dark-mode
    provides: "Phase 47-01: ::before background image system and IntersectionObserver scroll triggers"
provides:
  - "Full-bleed Ojibwe inspiration backgrounds spanning 100vw behind History section content"
  - "3 processed WebP background images in public/thumbs/inspiration/"
  - "CSS breakout pattern (width: 100vw + translateX) for ::before pseudo-elements"
  - "Image processing script for inspiration backgrounds"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS full-bleed breakout: width: 100vw + left: 50% + translateX(-50%) on ::before to escape constrained container"
    - "overflow: hidden on parent section to clip horizontal overflow from breakout"

key-files:
  created:
    - scripts/process-inspiration-bg.js
    - public/thumbs/inspiration/poem-bg.webp
    - public/thumbs/inspiration/forest-bg.webp
    - public/thumbs/inspiration/ride-bg.webp
  modified:
    - src/components/HiawathaExplainer.astro

key-decisions:
  - "Option A (Indigenous art focus) selected for background images: Ojibwe motifs grid, bogcore nature pattern, stylized native profile"
  - "CSS breakout instead of HTML restructuring — zero risk to existing editorial grid layout"
  - "1200px wide images at WebP quality 80 — adequate for full-bleed backgrounds with heavy desaturation"

patterns-established:
  - "Full-bleed ::before breakout: top:0; bottom:0; left:50%; width:100vw; transform:translateX(-50%) — paired with overflow:hidden on ancestor"

# Metrics
duration: 3min
completed: 2026-04-08
---

# Phase 47 Plan 03: Full-bleed Ojibwe Inspiration Images Summary

**Replaced Remington paintings with 3 Ojibwe-themed inspiration images spanning full viewport width behind History section content via CSS breakout pattern**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-08
- **Completed:** 2026-04-08
- **Tasks:** 3 (1 decision checkpoint, 1 auto, 1 human-verify)
- **Files modified:** 2, Files created: 4

## Accomplishments

- Created `scripts/process-inspiration-bg.js` Sharp script that processes 3 selected images from `images/inspiration/` to 1200px wide WebP at quality 80
- Generated `poem-bg.webp` (1200x1200, 372KB), `forest-bg.webp` (1200x903, 232KB), `ride-bg.webp` (1200x900, 10KB) in `public/thumbs/inspiration/`
- Applied CSS full-bleed breakout on `.subsection-bg::before` — replaced `inset: 0` with `top:0; bottom:0; left:50%; width:100vw; transform:translateX(-50%)`
- Added `overflow: hidden` to `.hiawatha-section` to clip horizontal overflow
- Updated 3 `background-image` URLs to point to new Ojibwe inspiration images
- User verified: full-bleed backgrounds display correctly in both light and dark mode, no horizontal scroll

## Task Commits

1. **Task 1: Image selection** — Decision checkpoint: Option A (Indigenous art focus)
2. **Task 2: Process images + update CSS** — `5e21b5b` (feat: process images), `f89f29a` (feat: CSS breakout)
3. **Task 3: Human verification** — Approved

## Files Created/Modified

- `scripts/process-inspiration-bg.js` — Sharp image processing script for 3 Ojibwe inspiration backgrounds
- `public/thumbs/inspiration/poem-bg.webp` — Ojibwe motifs grid (poem section background)
- `public/thumbs/inspiration/forest-bg.webp` — Bogcore nature pattern (forest section background)
- `public/thumbs/inspiration/ride-bg.webp` — Stylized native profile (ride section background)
- `src/components/HiawathaExplainer.astro` — CSS breakout + new image URLs + overflow hidden

## Decisions Made

- Selected Option A (Indigenous art focus) for the 3 background images
- Used CSS breakout pattern rather than HTML restructuring to achieve full-bleed effect
- Processed at 1200px wide (not 400px like other thumbs) since these are full-viewport backgrounds

## Deviations from Plan

None - plan executed as written with user's image selection.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 47 gap closure plans complete (47-02 + 47-03)
- History section has readable light-mode text and full-bleed Ojibwe backgrounds
- v1.8 milestone ready for final verification

---
*Phase: 47-history-light-dark-mode*
*Completed: 2026-04-08*
