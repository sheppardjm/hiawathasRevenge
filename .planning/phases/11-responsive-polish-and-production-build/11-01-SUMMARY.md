---
phase: 11-responsive-polish-and-production-build
plan: "01"
subsystem: ui
tags: [css, leaflet, photoswipe, touch-targets, accessibility, responsive]

# Dependency graph
requires:
  - phase: 10-content-narrative-and-visual-identity
    provides: DonateCallout.astro and index.astro with donate button and GPX download link
  - phase: 03-route-map
    provides: RouteMap.astro with Leaflet map controls
  - phase: 08-photo-gallery
    provides: PhotoGallery.astro with PhotoSwipe lightbox
provides:
  - 52px minimum touch target on all Leaflet zoom/reset buttons via @layer base CSS overrides
  - 52px minimum touch target on PhotoSwipe lightbox nav buttons via min-width override
  - 52px minimum touch target on donate CTA button via inline-flex + min-height
  - 52px minimum touch target on GPX download link via inline-flex + min-height
affects:
  - 11-02-PLAN.md and later plans that may inspect global.css or button styles

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@layer base overrides @layer leaflet — cascade layer order (declared at top of global.css) handles specificity without !important"
    - "inline-flex + align-items/justify-content: center pattern for vertically-centered touch targets with min-height"
    - "min-height (not height) on buttons — allows text wrapping growth while ensuring minimum tap area"

key-files:
  created: []
  modified:
    - src/styles/global.css
    - src/components/DonateCallout.astro
    - src/pages/index.astro

key-decisions:
  - "No !important used — @layer base already overrides @layer leaflet for Leaflet button size rules"
  - "min-height: 52px (not height: 52px) on interactive elements — preserves wrapping behavior"
  - "inline-flex replaces inline-block on .donate-button and .gpx-download — required for align-items: center to work"
  - "font-size: 1.25rem on .leaflet-bar a — scales zoom +/- glyphs proportionally with enlarged 52px button"

patterns-established:
  - "DSGN-05 touch target rule: all tappable elements min 52px in height/width"
  - "Leaflet overrides live in @layer base of global.css — never in component <style> blocks (scoped styles don't affect Leaflet DOM)"
  - "PhotoSwipe overrides live in @layer base of global.css — PhotoSwipe renders outside Astro component scope"

# Metrics
duration: 2min
completed: 2026-03-31
---

# Phase 11 Plan 01: Touch Target Polish Summary

**52px DSGN-05 touch targets on all four interactive elements: Leaflet map buttons, PhotoSwipe lightbox nav, donate CTA, and GPX download link — via cascade layer overrides and inline-flex min-height**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-31T17:12:24Z
- **Completed:** 2026-03-31T17:13:49Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Leaflet .leaflet-bar a buttons enlarged to 52x52px with proportional glyph scaling via @layer base override (no !important needed)
- PhotoSwipe .pswp__button given min-width: 52px — closes 2px gap from default 50px width
- DonateCallout.astro donate button updated to inline-flex + min-height: 52px with text vertically centered
- index.astro GPX download link updated to inline-flex + min-height: 52px with text vertically centered

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Leaflet button 52px touch target overrides to global.css** - `380ca42` (feat)
2. **Task 2: Add min-height: 52px to donate button and GPX download link** - `cee9661` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `src/styles/global.css` - Added .leaflet-bar a (52px w/h/line-height, 1.25rem font), .leaflet-touch .leaflet-bar a (same), .pswp__button (min-width: 52px) in @layer base
- `src/components/DonateCallout.astro` - Changed .donate-button from inline-block to inline-flex with align/justify center and min-height: 52px
- `src/pages/index.astro` - Changed .gpx-download from inline-block to inline-flex with align/justify center and min-height: 52px

## Decisions Made
- No !important used — the cascade layer order `@layer leaflet, base, components, utilities` declared at the top of global.css means `base` rules win over `leaflet` rules naturally. This is the correct approach per the project's Tailwind 4 CSS-first architecture.
- min-height rather than fixed height on interactive elements — preserves ability for button to grow if text wraps on very narrow viewports
- inline-flex (not just flexbox) preserves the inline-level formatting context of the anchor elements while enabling cross-axis alignment

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in ElevationProfile.astro (70 errors from chartjs-plugin-annotation type definitions) were present before this plan and are unrelated to any changes made here. No errors exist in DonateCallout.astro, index.astro, or global.css.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All four interactive elements now meet the 52px DSGN-05 minimum touch target requirement
- global.css @layer base is the established location for Leaflet/PhotoSwipe overrides (scoped component styles cannot reach those DOM elements)
- Ready for 11-02 (responsive layout polish) and remaining Phase 11 plans

---
*Phase: 11-responsive-polish-and-production-build*
*Completed: 2026-03-31*
