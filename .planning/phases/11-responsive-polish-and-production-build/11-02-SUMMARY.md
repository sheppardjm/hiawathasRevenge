---
phase: 11-responsive-polish-and-production-build
plan: "02"
subsystem: ui
tags: [css, leaflet, accessibility, reduced-motion, prefers-reduced-motion, responsive]

# Dependency graph
requires:
  - phase: 11-01
    provides: 52px touch target overrides in global.css @layer base; inline-flex on donate button and GPX download link
  - phase: 10-content-narrative-and-visual-identity
    provides: DonateCallout.astro and index.astro with donate button and GPX download link transitions
  - phase: 03-route-map
    provides: RouteMap.astro with Leaflet map and fitBounds calls
provides:
  - Leaflet CSS transitions (zoom-anim, fade-anim, pan-anim) suppressed via @layer base @media query in global.css
  - Donate button hover transition suppressed via scoped @media query in DonateCallout.astro
  - GPX download link hover transition suppressed via scoped @media query in index.astro
  - RouteMap fitBounds calls pass animate: !prefersReducedMotion via window.matchMedia JS guard
affects:
  - 11-03-PLAN.md and later plans inspecting global.css or RouteMap

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "window.matchMedia('(prefers-reduced-motion: reduce)').matches for JS animation guard"
    - "@media (prefers-reduced-motion: reduce) { transition: none } for CSS transition suppression"
    - "prefersReducedMotion const declared once at top of initMap() — closure captures it in ResetControl click handler"

key-files:
  created: []
  modified:
    - src/styles/global.css
    - src/components/DonateCallout.astro
    - src/pages/index.astro
    - src/components/RouteMap.astro

key-decisions:
  - "prefersReducedMotion const declared after addInitHook but before ResetControl definition — closure in click handler captures it correctly"
  - "animate: !prefersReducedMotion (not animate: false) — motion is only disabled when user has requested it, not always"
  - "CSS overrides placed in @layer base — no !important needed; base already beats leaflet in cascade layer order"
  - "Chart.js and PhotoSwipe confirmed as no-action-needed: Chart.js has animation: false; PhotoSwipe 5 auto-handles reduced motion"

patterns-established:
  - "DSGN-06 reduced-motion rule: all CSS transitions suppressed + JS animation guards when prefers-reduced-motion: reduce"
  - "Leaflet JS animation guards via window.matchMedia — complement to CSS overrides for JS-driven animations like fitBounds"

# Metrics
duration: 3min
completed: 2026-03-31
---

# Phase 11 Plan 02: Reduced Motion Polish Summary

**prefers-reduced-motion: reduce support via @layer base CSS overrides for Leaflet transitions and scoped media queries on donate/GPX buttons, plus window.matchMedia JS guard on fitBounds animate option**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-31T17:16:18Z
- **Completed:** 2026-03-31T17:18:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Leaflet zoom, popup fade, tile fade, and pan CSS transitions suppressed via @media (prefers-reduced-motion: reduce) block in global.css @layer base
- DonateCallout.astro scoped style now suppresses .donate-button hover transition under reduced motion
- index.astro scoped style now suppresses .gpx-download hover transition under reduced motion
- RouteMap.astro reads window.matchMedia at initMap() start; both fitBounds calls (initial auto-fit and reset button) pass animate: !prefersReducedMotion

## Task Commits

Each task was committed atomically:

1. **Task 1: Add prefers-reduced-motion CSS overrides for Leaflet** - `f2825e7` (feat)
2. **Task 2: Add reduced motion overrides to component scoped styles and RouteMap JS** - `649c53b` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `src/styles/global.css` - Added @media (prefers-reduced-motion: reduce) block in @layer base after 52px touch target overrides, before .topo-divider
- `src/components/DonateCallout.astro` - Added @media (prefers-reduced-motion: reduce) { .donate-button { transition: none } } at end of scoped style
- `src/pages/index.astro` - Added @media (prefers-reduced-motion: reduce) { .gpx-download { transition: none } } at end of scoped style
- `src/components/RouteMap.astro` - Added prefersReducedMotion const after addInitHook; updated both fitBounds calls with animate: !prefersReducedMotion

## Decisions Made
- `animate: !prefersReducedMotion` rather than `animate: false` — the Leaflet animate option should only be disabled when the user has actually requested reduced motion, not unconditionally
- `prefersReducedMotion` const placed after both dynamic imports (Leaflet + GestureHandling) and the `addInitHook` call, but before `ResetControl` definition — this ensures the const is in scope when the click handler closure is created
- No changes needed for Chart.js (already has `animation: false` on dataset) or PhotoSwipe (v5 automatically respects prefers-reduced-motion via its built-in CSS)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors (70 errors from chartjs-plugin-annotation type definitions + fs module in save-manifest.ts) were present before this plan and are unrelated to any changes made here. No new errors introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- DSGN-06 reduced-motion requirement fully satisfied across all animated elements
- Leaflet CSS overrides, component scoped overrides, and JS fitBounds guard all in place
- Ready for 11-03 (responsive layout polish) and remaining Phase 11 plans

---
*Phase: 11-responsive-polish-and-production-build*
*Completed: 2026-03-31*
