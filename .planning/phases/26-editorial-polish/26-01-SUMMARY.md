---
phase: 26-editorial-polish
plan: 01
subsystem: ui
tags: [css, astro, animation, skeleton, accessibility, wcag, contrast, spacing]

# Dependency graph
requires:
  - phase: 15-editorial-content
    provides: RouteStats component with .stat-value/.stat-label classes on forest-800 cards
  - phase: 21-section-color-differentiation
    provides: amber-section class with :global(span) color override causing legibility bug
provides:
  - Global --spacing-block token doubled (2rem -> 4rem) for all section vertical breathing room
  - VIS-05 route stats contrast fix via targeted CSS cascade overrides in index.astro
  - PERF-01 photo gallery skeleton shimmer loader preventing CLS during image load
affects: [future-ui-changes, photo-gallery-updates, route-stats-updates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS cascade specificity fix: targeted :global() overrides after broad :global(span) rule to restore component-specific colors"
    - "Skeleton loader pattern: wrapper element carries shimmer animation; .loaded class removes it via JS img.complete + addEventListener"
    - "CLS prevention: parseDims() width/height on img elements reserves layout space before image data arrives"

key-files:
  created: []
  modified:
    - src/styles/global.css
    - src/pages/index.astro
    - src/components/PhotoGallery.astro

key-decisions:
  - "Cascade fix (not component move) for stat legibility: add specific overrides after broad rule, no !important, no restructuring"
  - "Skeleton on <a> wrapper (not <img>): wrapper fills column space during load; img overlays it naturally"
  - "prefers-reduced-motion: static forest-800 background instead of animated shimmer"

patterns-established:
  - "Astro :global() cascade specificity: broader rule first, targeted overrides after — no !important needed"
  - "Skeleton loader: img.complete sync check + { once: true } load/error events — handles cached and uncached images"

# Metrics
duration: 2min
completed: 2026-04-02
---

# Phase 26 Plan 01: Editorial Polish — Spacing, Stats Legibility, Skeleton Loaders Summary

**CSS spacing token doubled to 4rem, amber-section stat contrast restored via cascade overrides, photo gallery gains shimmer skeleton loader with CLS-preventing width/height attributes**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-02T21:24:07Z
- **Completed:** 2026-04-02T21:26:34Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- VIS-01: `--spacing-block` increased from `2rem` to `4rem` — all 8 sections using `py-[--spacing-block]` gain vertical breathing room
- VIS-05: Route stats `.stat-value` (amber-500, ~4.8:1) and `.stat-label` (cream-200, ~5.2:1) legibility restored on forest-800 cards via targeted CSS cascade overrides; surface breakdown rows keep dark text on amber-500 background
- PERF-01: Photo gallery images show shimmer skeleton (forest-800/700 gradient) during loading; `width`/`height` from `parseDims()` prevent CLS; `prefers-reduced-motion` falls back to static `forest-800`

## Task Commits

Each task was committed atomically:

1. **Task 1: Increase section spacing and fix route stats legibility** - `e0fcb01` (feat)
2. **Task 2: Add photo gallery skeleton loaders with shimmer animation** - `5640568` (feat)

## Files Created/Modified

- `src/styles/global.css` - Increased `--spacing-block` from `2rem` to `4rem`; added `@keyframes shimmer` at end of `@layer base`
- `src/pages/index.astro` - Added four targeted `:global()` overrides after `.amber-section :global(span)` to restore stat card legibility
- `src/components/PhotoGallery.astro` - Added `img-skeleton` class to `<a>` wrappers, `width`/`height` attrs on `<img>`, skeleton CSS in `<style>`, JS load handler in `<script>`

## Decisions Made

- **Cascade fix, not component relocation:** Adding specific `.stat-value`/`.stat-label` overrides after the broad `span` rule is cleaner and less disruptive than moving RouteStats out of the amber section. No `!important` needed — specificity handles it.
- **Skeleton on `<a>` wrapper:** The anchor element fills the column slot before image pixels arrive. When `.loaded` is added, `background: none` removes the shimmer cleanly with no layout jump.
- **`parseDims()` already existed:** Width/height data was already extracted from filenames for PhotoSwipe — adding the attrs to `<img>` was a zero-cost CLS fix.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The build warning about `matchHostname` etc. from `@astrojs/internal-helpers/remote` is a pre-existing upstream Vite warning, not introduced by these changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Visual quality baseline established for plan 26-02 (mobile/iOS Safari polish)
- Spacing, stats legibility, and skeleton loaders are production-ready
- No blockers for next plan

---
*Phase: 26-editorial-polish*
*Completed: 2026-04-02*
