---
phase: 26-editorial-polish
plan: 03
subsystem: ui
tags: [css, parallax, intersection-observer, background-attachment, editorial-grid]

# Dependency graph
requires:
  - phase: 26-02
    provides: Drop-caps, pull quotes, museum plates, ShieldMotif/TurtleMotif motifs, single background fade on .hiawatha-section
provides:
  - Three independent sub-section parallax backgrounds (poem-section, forest-section, ride-section)
  - background-attachment:fixed on each sub-section ::before pseudo-element
  - Independent IntersectionObserver per sub-section via querySelectorAll
  - Editorial grid tracks replicated inside each sub-section wrapper
  - prefers-reduced-motion static fallback for all three sections
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "subsection-bg pattern: grid-column:full wrapper that replicates parent grid tracks, enabling ::before parallax without overflow:hidden"
    - "Independent IntersectionObserver via querySelectorAll — single observer instance, sections.forEach(observe)"

key-files:
  created: []
  modified:
    - src/components/HiawathaExplainer.astro

key-decisions:
  - "Three sub-section wrappers with grid-column:full replace single .hiawatha-section::before background"
  - "overflow:hidden removed from .hiawatha-section — required for background-attachment:fixed to work correctly"
  - "Each subsection-bg replicates editorial-grid column template so children keep prose/breakout column assignments"
  - "querySelectorAll (not querySelector) observes all three wrappers with single IntersectionObserver instance"
  - "Threshold raised to 0.15 (from 0.1) for more natural feel with smaller per-section heights"

patterns-established:
  - "subsection-bg: wrapper with grid-column:full + replicated grid-template-columns + position:relative for ::before parallax"
  - "data-bg-fade on inner sub-sections (not outer section) when multiple independent backgrounds needed"

# Metrics
duration: 2min
completed: 2026-04-02
---

# Phase 26 Plan 03: Sub-Section Parallax Backgrounds Summary

**Three independent background-attachment:fixed parallax images behind poem, forest, and ride sub-sections — each fading in/out via separate IntersectionObserver observation**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-02T21:55:09Z
- **Completed:** 2026-04-02T21:57:07Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Replaced single monolithic `.hiawatha-section::before` background with three independent sub-section wrappers
- Each of `.poem-section`, `.forest-section`, `.ride-section` has its own `::before` with `background-attachment:fixed` for true parallax depth
- Removed `overflow:hidden` from `.hiawatha-section` (was blocking fixed-attachment parallax from working)
- Each sub-section wrapper replicates editorial-grid column tracks so prose/breakout children maintain their positions
- `querySelectorAll('[data-bg-fade]')` observes all three sections; single IntersectionObserver instance toggles `.bg-visible` independently per section
- `prefers-reduced-motion` respected: CSS static 4% opacity with no transition, JS observer entirely skipped

## Task Commits

Each task was committed atomically:

1. **Task 1: Wrap sub-sections in dedicated containers with fixed-attachment backgrounds** - `88ca085` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/HiawathaExplainer.astro` - Three sub-section wrappers with independent parallax backgrounds, updated JS observer, mobile responsive rules

## Decisions Made

- Three sub-section wrappers (`poem-section`, `forest-section`, `ride-section`) with `grid-column: full` inside the editorial-grid, each replicating the grid column template so children retain `prose`/`breakout` assignments
- `overflow: hidden` removed from `.hiawatha-section` — this property prevents `background-attachment: fixed` from working correctly on descendant elements; removal is safe since the old position:absolute ::before is gone
- Single `IntersectionObserver` instance with `sections.forEach(section => observer.observe(section))` rather than three separate observers — efficient and idiomatic
- Threshold raised to `0.15` (from `0.1`) for slightly more natural trigger point on sub-sections that are individually shorter than the full section was
- `data-bg-fade` moved from parent `<section>` to three inner wrapper `<div>` elements

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- VIS-04 gap is now fully closed: three independent sub-section parallax backgrounds replace the single-background implementation
- Phase 26 editorial polish is complete (plans 01, 02, 03 all done)
- iOS Safari graceful degradation verified architecturally: `background-attachment: fixed` is ignored by iOS Safari, which falls back to `scroll` — no visual breakage
- Ojibwe community consultation remains a recommended follow-up (carried from STATE.md)

---
*Phase: 26-editorial-polish*
*Completed: 2026-04-02*
