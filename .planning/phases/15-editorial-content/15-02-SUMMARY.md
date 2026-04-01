---
phase: 15-editorial-content
plan: 02
subsystem: ui
tags: [astro, css-grid, responsive, svg, typography, photos, route-segments]

# Dependency graph
requires:
  - phase: 15-01
    provides: HiawathaExplainer component and updated index.astro structure with FloralDivider
  - phase: 12-01
    provides: Tailwind v4 CSS custom properties (color tokens, spacing vars)
  - phase: 13-01
    provides: index.astro HeroSection structure and section layout patterns
provides:
  - RouteExplainer.astro: segment-by-segment route walkthrough with integrated photos, star ratings, topo background
  - index.astro updated with RouteExplainer between HiawathaExplainer and Route Stats
affects: [phase-16, final-qa, seo]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CSS Grid alternating photo-text layout with nth-child(even) column reversal
    - Star rating via background gradient clip-text technique with CSS custom property --rating
    - SVG topo texture via data URI in scoped Astro <style> block (not global.css)
    - Graceful empty-photo guard using Array.length check before rendering grid-area

key-files:
  created:
    - src/components/RouteExplainer.astro
  modified:
    - src/pages/index.astro

key-decisions:
  - "Segment mile ranges define photo-to-segment mapping (filter by p.mile >= startMi && p.mile < endMi)"
  - "no-photo class on segment-card overrides nth-child column alternation to prevent empty grid columns"
  - "Topo background SVG hardcodes hex %233d6b3d (forest-700) because CSS vars cannot be resolved inside data URIs"

patterns-established:
  - "SVG data URI: always hardcode hex colors — CSS custom properties do not resolve inside background-image data URIs"
  - "CSS Grid photo-text: use grid-template-areas + grid-area for named slot assignment; nth-child(even) swaps column order"
  - "Star rating: --rating CSS var on element, linear-gradient clip via -webkit-background-clip and background-clip: text"

# Metrics
duration: 2min
completed: 2026-03-31
---

# Phase 15 Plan 02: RouteExplainer Summary

**CSS Grid segment-by-segment route walkthrough with photos.json-integrated thumbnails, gradient star ratings, and repeating SVG topo background texture**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-01T00:12:13Z
- **Completed:** 2026-04-01T00:14:11Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- RouteExplainer.astro created with all 7 route segments from data.md, each with name, distance from start, segment length, star difficulty rating (1-5), and editorial description
- Photos from photos.json mapped to segments by mile range; up to 2 photos per segment, first photo displayed; 520 segment renders text-only (graceful empty handling)
- Alternating photo-left/right CSS Grid layout at 768px+ with .no-photo override; single column on mobile
- Topo SVG texture (3 contour paths) on forest-950 background with forest-700 borders for visual distinction
- Wired into index.astro between HiawathaExplainer and Route Stats; all existing sections preserved

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RouteExplainer.astro** - `403532e` (feat)
2. **Task 2: Wire RouteExplainer into index.astro** - `acc4bd0` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/components/RouteExplainer.astro` - 162-line segment walkthrough component with 7 segments, photo integration, star ratings, topo background
- `src/pages/index.astro` - Added RouteExplainer import and usage between HiawathaExplainer and Route Stats

## Decisions Made

- **Segment mile ranges for photo mapping:** Photos matched to segments by `p.mile >= seg.startMi && p.mile < seg.endMi`; first photo in range used for display. Simple and deterministic given photos are already geo-tagged.
- **no-photo class overrides nth-child alternation:** Without this override, the 520 segment (no photos) would produce an empty first column at tablet+ width. The `.no-photo` CSS rules at both mobile and tablet breakpoints force single-column.
- **Hardcoded hex in SVG data URI:** Following the pattern established in 14-01 (inline SVG over data-URI for CSS vars), the topo background uses `%233d6b3d` directly because CSS custom properties cannot resolve inside background-image data URIs.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Build passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 15 complete: both editorial components (HiawathaExplainer, RouteExplainer) are live
- Route section now presents narrative context, segment-by-segment detail, and visual photos in one continuous scroll
- Ready for Phase 16 (final QA / polish) or deployment

---
*Phase: 15-editorial-content*
*Completed: 2026-03-31*
