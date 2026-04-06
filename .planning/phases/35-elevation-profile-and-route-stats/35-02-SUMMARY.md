---
phase: 35-elevation-profile-and-route-stats
plan: 02
subsystem: ui
tags: [astro, comparison-grid, route-comparison, css-custom-properties, responsive]

# Dependency graph
requires:
  - phase: 35-01
    provides: RouteStats dynamic stat cards with route:change listener
  - phase: 33-03
    provides: routes.json manifest with totalMiles, elevationGainFeet, sectorIds, color per route
provides:
  - Route comparison grid: 3 cards (100 Mile, 100K, 50K) rendered at build time from routes.json
  - Active route highlight: colored bottom border on comparison card matching selected route
  - Responsive layout: 3-column desktop, stacked mobile
affects: [future-route-ui, ux-improvements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Build-time Astro frontmatter import of routes.json for SSG comparison grid"
    - "--route-color CSS custom property per card drives active border color without JS"
    - "Single route:change listener handles both hero stat updates and comparison card highlights"

key-files:
  created: []
  modified:
    - src/components/RouteStats.astro
    - src/pages/index.astro

key-decisions:
  - "Astro frontmatter import of routes.json (not fetch) renders comparison grid at build time — no hydration needed"
  - "--route-color inline style per card enables pure-CSS active border without JS color lookup"
  - "comparison-card highlight consolidated into existing route:change listener from 35-01 (not a second listener)"
  - "amber-section :global(.comparison-name) override added because comparison-name is a div; span override would not cascade"

patterns-established:
  - "CSS custom property --route-color set inline from routes.json data, consumed by .is-active CSS rule"
  - "class:list Astro shorthand for conditional is-active class at build time"

# Metrics
duration: 2min
completed: 2026-04-06
---

# Phase 35 Plan 02: Route Comparison Grid Summary

**Build-time 3-card comparison grid in RouteStats.astro using routesManifest import, with --route-color CSS custom property driving active border on route:change**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-06T23:27:53Z
- **Completed:** 2026-04-06T23:30:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Comparison grid renders all 3 routes' key stats (miles, elevation gain, sector count) at build time via Astro frontmatter import of routes.json
- 100 Mile card highlighted by default (is-active class from routesManifest.defaultRoute); switches on route:change event
- Each card's border color driven by per-card --route-color CSS custom property — no JS color lookup needed
- amber-section color conflict resolved with :global(.comparison-name) override preserving route-specific colors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add comparison grid HTML and active highlight script** - `429554f` (feat)
2. **Task 2: Style comparison grid and active highlight** - `0e47c27` (feat)

**Plan metadata:** (included in final docs commit)

## Files Created/Modified
- `src/components/RouteStats.astro` - Added routesManifest frontmatter import, comparison grid HTML, comparison CSS rules, is-active toggle in route:change listener
- `src/pages/index.astro` - Added .amber-section :global(.comparison-name) override to preserve --route-color

## Decisions Made
- Used Astro frontmatter `import routesManifest from '../../public/data/routes.json'` (build-time) rather than fetch — comparison grid is static HTML, no runtime data needed
- `--route-color` inline style attribute on each card enables the `.comparison-card.is-active { border-bottom-color: var(--route-color) }` CSS rule to use the correct route color without JS
- Consolidating the comparison card toggle into the existing `route:change` listener (from 35-01) rather than adding a second listener — cleaner, avoids listener duplication

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- STAT-02 satisfied: route comparison sidebar complete with 3-column responsive grid, active highlight, and correct stat values from routes.json
- Phase 35 complete: ElevationProfile race fix (35-01), RouteStats dynamic stats (35-01), and comparison grid (35-02) all shipped
- Ready for Phase 36 or any remaining v1.5 phases

---
*Phase: 35-elevation-profile-and-route-stats*
*Completed: 2026-04-06*
