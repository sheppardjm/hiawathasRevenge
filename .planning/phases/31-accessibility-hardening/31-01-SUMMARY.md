---
phase: 31-accessibility-hardening
plan: 01
subsystem: ui
tags: [accessibility, wcag, focus-visible, alt-text, css, astro]

# Dependency graph
requires:
  - phase: 30-image-optimization
    provides: Final performance/polish state before a11y hardening
provides:
  - Global :focus-visible CSS baseline (amber-500 ring on all interactive elements)
  - Sector panel close button focus indicator (RouteMap.astro component-scoped)
  - Gold-section focus override (forest-950 outline on sun-500 background)
  - Descriptive alt text on gallery thumbnails (mile marker format)
affects:
  - Any future component adding interactive elements (inherits global baseline)
  - Any future image components (pattern: mile-marker alt text)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ":focus-visible (not :focus) for keyboard-only focus indicators"
    - "@layer base for global focus ring baseline so all elements inherit"
    - ":global() scoped override in Astro page components for section-specific focus colors"
    - "Dynamic alt text using photo.mile.toFixed(1) for gallery thumbnails"

key-files:
  created: []
  modified:
    - src/styles/global.css
    - src/components/RouteMap.astro
    - src/pages/index.astro
    - src/components/PhotoGallery.astro

key-decisions:
  - "Use :focus-visible not :focus — keyboard-only, no ring on mouse clicks (WCAG SC 2.4.7)"
  - "amber-500 as global focus ring color (high contrast on dark forest-900/950 backgrounds)"
  - "gold-section override to forest-950 — amber-500 is invisible on sun-500 background"
  - "Only override outline-color in gold-section, not the full outline shorthand — preserves width/offset from baseline"

patterns-established:
  - "Focus ring pattern: 2px solid amber-500, 3px offset, 2px border-radius globally"
  - "Section-specific focus color override: use :global(a:focus-visible) / :global(button:focus-visible) in Astro page styles"
  - "Gallery alt text: 'Route photo at mile X.X' format using photo.mile.toFixed(1)"

# Metrics
duration: 1min
completed: 2026-04-06
---

# Phase 31 Plan 01: Accessibility Hardening — Focus Indicators + Gallery Alt Text Summary

**Global :focus-visible amber-500 ring added to all links/buttons via @layer base, with gold-section forest-950 override and descriptive gallery alt text at "Route photo at mile X.X"**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-04-06T16:15:35Z
- **Completed:** 2026-04-06T16:16:32Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- All interactive elements (links, buttons) now display a visible amber-500 focus ring when navigated via keyboard — satisfies A11Y-01 (WCAG SC 2.4.7)
- Sector panel close button has component-scoped :focus-visible with amber outline and opacity:1 — previously had opacity:0.7 baseline with no visible focus indicator
- Gold-section (sun-500 background) overrides focus outline-color to forest-950 — amber would be invisible on that background
- Gallery thumbnails now have descriptive alt text "Route photo at mile X.X" — satisfies A11Y-02 (WCAG SC 1.1.1)

## Task Commits

Each task was committed atomically:

1. **Task 1: Global focus-visible baseline + component overrides** - `a9976be` (feat)
2. **Task 2: Gallery alt text from photo mile data** - `aea3c4d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/styles/global.css` - Added `a:focus-visible, button:focus-visible` rule in `@layer base` after `a:hover`
- `src/components/RouteMap.astro` - Added `.sector-panel__close:focus-visible` rule after `.sector-panel__close:hover`
- `src/pages/index.astro` - Added `.gold-section :global(a:focus-visible), .gold-section :global(button:focus-visible)` outline-color override
- `src/components/PhotoGallery.astro` - Replaced `alt=""` with `alt={\`Route photo at mile ${photo.mile.toFixed(1)}\`}`

## Decisions Made

- Used `:focus-visible` (not `:focus`) so mouse clicks do not trigger the focus ring — standard WCAG 2.4.7 keyboard-focus pattern
- Chose `amber-500` (#c8973e) as the global focus ring color — consistent with brand palette and high contrast on dark forest-900/950 backgrounds
- Gold section override uses only `outline-color` property (not the full `outline` shorthand) — this intentionally inherits width and offset from the global baseline rule, keeping overrides minimal
- `innerHTML`-injected panel links (panel-strava-link, panel-jump-link) inherit the global baseline from `@layer base` — no additional component styles needed since global rules apply to dynamically-inserted DOM nodes

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- A11Y-01 (focus indicators) and A11Y-02 (gallery alt text) are satisfied
- Plan 31-02 can proceed with remaining accessibility items from RESEARCH.md
- All focus ring infrastructure is in place; future components automatically inherit the global baseline

---
*Phase: 31-accessibility-hardening*
*Completed: 2026-04-06*
