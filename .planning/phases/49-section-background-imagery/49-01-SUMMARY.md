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
  - "gallery-bg.webp — processed Hiawatha scenes grid WebP in public/thumbs/inspiration/"
  - "scroll-triggered ::before background on #route section (topo arrowheads, sepia filter, cover)"
  - "scroll-triggered ::before background on #gallery section (Hiawatha scenes, sepia filter, tiling repeat)"
  - "prefers-reduced-motion and prefers-color-scheme light overrides for both sections"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "data-bg-fade + IntersectionObserver pattern extended to non-HiawathaExplainer sections globally"
    - "::before inset:0 (not left:50%/100vw breakout) correct for w-full section elements"
    - "index.astro :global() CSS selectors for cross-component scoped styles"
    - "background-repeat: repeat with fixed size for tall sections (gallery)"

key-files:
  created:
    - public/thumbs/inspiration/route-bg.webp
    - public/thumbs/inspiration/gallery-bg.webp
  modified:
    - scripts/process-inspiration-bg.js
    - src/pages/index.astro
    - src/components/HiawathaExplainer.astro

key-decisions:
  - "Used original-116171370441ce4fcd033d6070c3fdf2.webp (Hiawatha scenes illustration grid) for gallery-bg — tiles well across tall gallery section"
  - "Gallery uses background-repeat: repeat + background-size: 400px instead of cover — gallery section is 5000+ px tall with 56 photos"
  - "Lowered IntersectionObserver threshold from 0.15 to 0.01 — 15% of a 5000px section exceeds viewport height, preventing the observer from ever firing"
  - "inset: 0 on ::before correct for #route and #gallery (both are w-full sections, not max-w constrained)"

patterns-established:
  - "Pattern: Adding data-bg-fade to any page element auto-enrolls it in existing IntersectionObserver scroll fade system"
  - "Pattern: index.astro :global() CSS for sections whose content is rendered by child components"
  - "Pattern: Use tiling repeat instead of cover for sections taller than ~2x viewport"

# Metrics
duration: ~20min (including visual review iterations)
completed: 2026-04-08
---

# Phase 49 Plan 01: Section Background Imagery Summary

**Sepia-toned topo arrowheads + Hiawatha scenes scroll-fade backgrounds added to #route and #gallery via ::before, extending Phase 47 pattern with tiling gallery treatment**

## Performance

- **Completed:** 2026-04-08
- **Tasks:** 3 of 3 (including human-verify checkpoint)
- **Files modified:** 5

## Accomplishments

- Extended `process-inspiration-bg.js` from 3 to 5 entries; processed route-bg.webp (49KB) and gallery-bg.webp (30KB)
- Added `data-bg-fade` to both `#route` and `#gallery` sections — hooks into existing global IntersectionObserver
- Added complete CSS block in index.astro: `::before` pseudo-element, `bg-visible` opacity toggle (0 → 0.08), `prefers-reduced-motion` static (0.04), `prefers-color-scheme: light` overrides
- Gallery uses tiling repeat pattern (400px tiles) for the tall 56-photo masonry section
- Fixed IntersectionObserver threshold for tall sections (0.15 → 0.01)

## Task Commits

1. **Task 1: Process background images** — `973c6df` (feat)
2. **Task 2: Add CSS and HTML attributes** — `a4a9ab7` (feat)
3. **Orchestrator fix: Swap gallery image to tiling grid, fix observer threshold** — `e919183` (fix)

## Deviations from Plan

1. **Gallery image swapped twice:** Initial bogcore mushroom image was too large/detailed for the 5000px tall gallery. User selected Hiawatha scenes illustration grid for better tiling.
2. **Gallery CSS changed to tiling:** `background-size: cover` stretched poorly. Changed to `background-size: 400px` + `background-repeat: repeat`.
3. **Observer threshold lowered:** `threshold: 0.15` prevented gallery bg from triggering on tall sections. Changed to `0.01` in HiawathaExplainer.astro.

## Issues Encountered

None after corrections applied.

---
*Phase: 49-section-background-imagery*
*Completed: 2026-04-08*
