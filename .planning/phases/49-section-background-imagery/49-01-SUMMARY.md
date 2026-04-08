---
phase: 49-section-background-imagery
plan: 01
subsystem: ui
tags: [css, astro, sharp, webp, intersection-observer, ::before, background-imagery, sepia-filter]

# Dependency graph
requires:
  - phase: 47-section-background-imagery
    provides: "::before full-bleed background system in HiawathaExplainer.astro, data-bg-fade IntersectionObserver, process-inspiration-bg.js with 3 inspiration images"
provides:
  - "route-bg.webp — processed topo arrowheads WebP in public/thumbs/inspiration/"
  - "gallery-bg.webp — processed bogcore mushroom woodcut WebP in public/thumbs/inspiration/"
  - "scroll-triggered ::before background on #route section (topo arrowheads, sepia filter)"
  - "scroll-triggered ::before background on #gallery section (mushroom woodcut, sepia filter)"
  - "prefers-reduced-motion and prefers-color-scheme light overrides for both sections"
affects:
  - "49-section-background-imagery (human verify checkpoint — pending)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "data-bg-fade + IntersectionObserver pattern extended to non-HiawathaExplainer sections globally"
    - "::before inset:0 (not left:50%/100vw breakout) correct for w-full section elements"
    - "index.astro :global() CSS selectors for cross-component scoped styles"

key-files:
  created:
    - public/thumbs/inspiration/route-bg.webp
    - public/thumbs/inspiration/gallery-bg.webp
  modified:
    - scripts/process-inspiration-bg.js
    - src/pages/index.astro

key-decisions:
  - "Used original-aafd7b2567bdcc068e17d93d44562fa7.webp (bogcore mushroom/nature woodcut single card) for gallery-bg — morel woodcut not found as standalone; this image has prominent mushrooms in woodcut etching style and is not already used"
  - "inset: 0 on ::before correct for #route and #gallery (both are w-full sections, not max-w constrained)"
  - "Zero JS changes needed — HiawathaExplainer.astro IntersectionObserver uses querySelectorAll('[data-bg-fade]') which is document-global"

patterns-established:
  - "Pattern: Adding data-bg-fade to any page element auto-enrolls it in existing IntersectionObserver scroll fade system"
  - "Pattern: index.astro :global() CSS for sections whose content is rendered by child components"

# Metrics
duration: 4min
completed: 2026-04-08
---

# Phase 49 Plan 01: Section Background Imagery Summary

**Sepia-toned topo arrowheads + bogcore mushroom woodcut scroll-fade backgrounds added to #route and #gallery via ::before, extending Phase 47 pattern with zero JS changes**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-08T19:12:21Z
- **Completed:** 2026-04-08T19:16:26Z
- **Tasks:** 2 of 3 (paused at human-verify checkpoint)
- **Files modified:** 3

## Accomplishments

- Extended `process-inspiration-bg.js` from 3 to 5 entries; processed route-bg.webp (49KB, 1200x900) and gallery-bg.webp (91KB, 1200x903) with 5/5 script output
- Added `data-bg-fade` to both `#route` and `#gallery` sections — hooks them into the existing global IntersectionObserver automatically
- Added complete CSS block in index.astro: `::before` pseudo-element, `bg-visible` opacity toggle (0 → 0.08), `prefers-reduced-motion` static (0.04), `prefers-color-scheme: light` overrides (brightness 1.2, opacity 0.12), all using `:global()` scoping

## Task Commits

Each task was committed atomically:

1. **Task 1: Process background images for Route Map and Gallery** - `973c6df` (feat)
2. **Task 2: Add scroll-triggered background CSS and HTML attributes to index.astro** - `a4a9ab7` (feat)

_Task 3 (checkpoint:human-verify) — pending user visual verification_

## Files Created/Modified

- `scripts/process-inspiration-bg.js` — Updated IMAGES array from 3 to 5 entries; updated header comment
- `public/thumbs/inspiration/route-bg.webp` — Topo arrowheads background, 1200x900px, 49KB
- `public/thumbs/inspiration/gallery-bg.webp` — Bogcore mushroom/nature woodcut, 1200x903px, 91KB
- `src/pages/index.astro` — Added data-bg-fade attributes on #route and #gallery; added 60-line CSS block with ::before system

## Decisions Made

- **Morel woodcut identification:** No standalone morel mushroom woodcut image was found in the 36 inspiration images after visual inspection of all files. The bogcore single-card illustration (`original-aafd7b2567bdcc068e17d93d44562fa7.webp`) — featuring prominent mushrooms rendered in an etching/woodcut style alongside skull, frog, and dragonfly motifs — was selected for gallery-bg. It is not already in use (the tiled bogcore pattern `original-f146e847f065e9e9058869f6bd59733d.webp` is forest-bg). This image fits the "woodcut mushroom" intent and the forest/nature theme.
- **inset: 0 vs full-bleed breakout:** Confirmed `inset: 0` is correct for #route and #gallery because the `<section>` elements are `w-full` (full viewport width), unlike the `.subsection-bg` elements in HiawathaExplainer which sit inside a `max-w-5xl` container. No `left:50%; width:100vw; transform:translateX(-50%)` breakout needed.
- **Zero JS changes:** Confirmed the IntersectionObserver in HiawathaExplainer.astro uses `document.querySelectorAll('[data-bg-fade]')` — a document-global query. Adding `data-bg-fade` to #route and #gallery is sufficient.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both background images processed and in place in `public/thumbs/inspiration/`
- CSS + HTML changes committed and build verified passing
- Awaiting visual verification: scroll behavior, z-index layering (Leaflet map, gallery photos above background), light-mode and reduced-motion behavior
- If Leaflet z-index issues arise, fallback: set `::before` to `z-index: -1` and keep `position: relative` only on the inner `div.max-w-4xl`

---
*Phase: 49-section-background-imagery*
*Completed: 2026-04-08*
