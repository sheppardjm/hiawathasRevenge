---
phase: 47-history-light-dark-mode
plan: 01
subsystem: ui
tags: [css, dark-mode, light-mode, scroll-animation, intersection-observer, astro, prefers-color-scheme, prefers-reduced-motion]

# Dependency graph
requires:
  - phase: 44-tech-debt-cleanup
    provides: HiawathaExplainer.astro with subsection-bg/IntersectionObserver scaffold
provides:
  - ::before background image system with per-section Remington paintings (poem, forest, ride)
  - Light-mode @media (prefers-color-scheme: light) overrides scoped to .hiawatha-section
  - WCAG AA contrast colors for all headings, links, body text in light mode
  - Reduced-motion safe: static 0.04 opacity, no transition (ordering enforced)
affects: [48-future-phases, any phase touching HiawathaExplainer.astro]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "::before pseudo-element as scroll-triggered background layer, toggled via IntersectionObserver bg-visible class"
    - "CSS cascade ordering: main ::before rule before prefers-reduced-motion override for correct specificity"
    - "Light-mode scoping: .hiawatha-section prefix on section-level rules, Astro scoped styles handle child isolation"

key-files:
  created: []
  modified:
    - src/components/HiawathaExplainer.astro

key-decisions:
  - "Block 1 (::before main rule) inserted BEFORE reduced-motion block so cascade override works correctly"
  - "Light-mode rules use .hiawatha-section prefix for section-level selectors to avoid leaking into other page sections"
  - "Light-mode rules use unprefixed selectors (.pull-quote, .editorial-grid p) since Astro scoped styles already isolate them"
  - "bg-visible opacity 0.08 dark / 0.12 light — lighter filter in light mode (brightness 1.2 vs 0.6)"

patterns-established:
  - "Scroll-triggered ::before pattern: data-bg-fade attribute + IntersectionObserver bg-visible class toggle"
  - "Dual-mode filter: dark uses brightness(0.6), light uses brightness(1.2) for matching visual weight"

# Metrics
duration: 1min
completed: 2026-04-07
---

# Phase 47 Plan 01: History Light/Dark Mode Summary

**CSS-only ::before background image system with scroll-triggered Remington paintings and full light-mode color override for the History section**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-04-08T02:11:16Z
- **Completed:** 2026-04-08T02:12:30Z
- **Tasks:** 1 of 1
- **Files modified:** 1

## Accomplishments
- Added `.subsection-bg::before` pseudo-element system with per-section Remington painting URLs (departure/fasting)
- Scroll-triggered fade-in/fade-out via existing IntersectionObserver `bg-visible` class (opacity 0 → 0.08 dark / 0.12 light)
- Reduced-motion respected: static 0.04 opacity, `transition: none` — ordering enforced (main rule before override)
- Complete `@media (prefers-color-scheme: light)` block: cream-100 background, forest-900 body text, rust-600/turquoise-700/scarlet-700 heading accents, cream-200 pull-quote, forest-700 links, rust-600 drop-caps
- Dark mode entirely unchanged — zero modifications to existing rules

## Task Commits

1. **Task 1: Add ::before background image system and light-mode CSS overrides** - `5db2155` (feat)

**Plan metadata:** *(pending)*

## Files Created/Modified
- `src/components/HiawathaExplainer.astro` - Added 110 lines of CSS: ::before system (Block 1) + light-mode media query (Block 2)

## Decisions Made
- Inserted Block 1 before the existing `@media (prefers-reduced-motion: reduce)` block so the reduced-motion stub correctly overrides the main `::before` opacity and transition (CSS cascade order)
- Light-mode `@media` block scoped with `.hiawatha-section` prefix on all section-level selectors (background, h2, h3, links) to prevent leaking into StickyNav, RideEthos, or other components
- Unprefixed selectors used for `.pull-quote`, `.editorial-grid p`, `.drop-cap` in light-mode — Astro scoped styles already isolate these to the component
- `poem-section` and `ride-section` both use `remington-hiawatha-departure-1891.webp` (two distinct paintings exist in the pipeline; departure is the visually stronger image for both narrative sections)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The verify spec states `grep -c "subsection-bg::before"` expects "at least 4". The actual count is 3 (main rule + reduced-motion override + light-mode override). The `bg-visible` variant uses `.subsection-bg.bg-visible::before` which doesn't match the grep pattern. All 5 logical rules exist and are correct; the verify spec's count was off by one due to the compound selector. Build passed cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- History section is fully light/dark mode ready; images are in the pipeline (`/thumbs/historical/` directory)
- Visual testing recommended: toggle OS appearance in System Preferences to verify cream background and color changes
- Scroll-triggered backgrounds require JavaScript (works via existing IntersectionObserver in the component's `<script>` block)
- No blockers for subsequent phases

---
*Phase: 47-history-light-dark-mode*
*Completed: 2026-04-07*
