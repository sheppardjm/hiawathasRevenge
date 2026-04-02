---
phase: 27-audit-gap-closure
plan: 01
subsystem: ui
tags: [astro, font, leaflet, dialog, css, json]

# Dependency graph
requires:
  - phase: 25-sector-panel
    provides: dialog.show() panel implementation with click-outside handler
  - phase: 23-data-pipeline
    provides: sector-details.json build pipeline
provides:
  - EB Garamond Font tag in BaseLayout.astro head (VIS-02 closed)
  - MAP-08 click-outside trade-off documented in code comment
  - NF2217-2218 display name consistent across sector-details.json and RouteExplainer.astro
  - RouteMap.astro free of dead ::backdrop CSS and stale "Plan 25-02" comment
affects: [milestone archival, v1.3-MILESTONE-AUDIT.md gap closure]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Font tag without preload for below-fold typography (drop-caps don't need critical-path preload)"
    - "Code comments document deliberate trade-offs (show() vs showModal()) for future maintainers"

key-files:
  created: []
  modified:
    - src/layouts/BaseLayout.astro
    - public/data/sector-details.json
    - src/components/RouteMap.astro

key-decisions:
  - "No preload on EB Garamond Font tag — drop-cap use is below-fold only; preloading would add unnecessary critical-path weight"
  - "MAP-08 documented as deliberate trade-off: show() (non-modal) keeps map interactive while panel is open at cost of no native backdrop"
  - "NF2217-2218 canonical name now enforced in JSON data — matches RouteExplainer.astro SEGMENTS and jump-link key"

patterns-established:
  - "Dead CSS with comment documenting why it's dead should be removed, not preserved"
  - "Design trade-offs (show vs showModal) documented inline at the decision point in code"

# Metrics
duration: 2min
completed: 2026-04-02
---

# Phase 27 Plan 01: Audit Gap Closure Summary

**EB Garamond drop-cap font loaded via Font tag (VIS-02), MAP-08 click-outside trade-off documented, NF2217-2218 name consistent, and dead ::backdrop CSS removed from RouteMap.astro**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-02T22:51:01Z
- **Completed:** 2026-04-02T22:52:21Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- VIS-02 closed: EB Garamond Font tag added to BaseLayout.astro head (no preload — drop-cap use is below-fold only)
- MAP-08 closed: click-outside handler comment expanded to document the deliberate show() vs showModal() trade-off and its implications
- NF2217 name inconsistency resolved: sector-details.json "NF2217" corrected to "NF2217-2218" matching RouteExplainer.astro canonical name
- RouteMap.astro tech debt cleared: dead `::backdrop` CSS block removed, stale "Plan 25-02 adds sparkline" comment replaced with accurate description

## Task Commits

Each task was committed atomically:

1. **Task 1: VIS-02 font fix and NF2217 name consistency** - `44bfe6e` (feat)
2. **Task 2: RouteMap.astro tech debt cleanup and MAP-08 documentation** - `95fc3fd` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/layouts/BaseLayout.astro` - Added `<Font cssVariable="--font-garamond" />` tag to head
- `public/data/sector-details.json` - Updated sector-nf2217 name from "NF2217" to "NF2217-2218"
- `src/components/RouteMap.astro` - Removed dead ::backdrop CSS, updated stale comment, expanded MAP-08 trade-off documentation

## Decisions Made
- No preload on EB Garamond Font tag: drop-caps appear below the fold, adding preload would increase critical-path weight for a non-critical font
- MAP-08 documented as deliberate trade-off rather than closed as gap: using `dialog.show()` (non-modal) intentionally keeps map interactive while panel is open; the absence of a native backdrop is the expected behavior, not a deficiency
- NF2217-2218 is the canonical name: matches RouteExplainer.astro SEGMENTS const and `'NF2217-2218': 'sector-nf2217'` jump-link mapping key; data file was the outlier

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All four v1.3 audit gaps from v1.3-MILESTONE-AUDIT.md are now closed
- v1.3 milestone can be archived as complete
- No blockers for milestone archival

---
*Phase: 27-audit-gap-closure*
*Completed: 2026-04-02*
