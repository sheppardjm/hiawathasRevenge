---
phase: 25-click-handlers-panel-surface-track
plan: 02
subsystem: ui
tags: [leaflet, dialog, sparkline, svg, elevation, panel, route-explainer, jump-links, accessibility]

# Dependency graph
requires:
  - phase: 25-01-click-handlers-panel-surface-track
    provides: openPanel/closePanel functions, panel DOM scaffold, ghost polyline click handlers, panel body CSS
  - phase: 23-sector-data-build
    provides: sector-elevations.json (elevationPoints, eleMin, eleMax, difficulty per sector)

provides:
  - generateSparklineSvg() client-side JS function replicating ElevationSparkline.astro algorithm
  - Panel body with full content order: stars, meta, sparkline, elevation range, description, Strava link, jump link
  - Difficulty-coded sparkline stroke colors: moss #7d9448 (easy), amber #c8973e (moderate), scarlet #f87171 (hard)
  - Elevation range display in feet (ft min – ft max) below sparkline
  - id attributes on all 7 RouteExplainer segment card article elements
  - Panel jump links (#sector-520, etc.) scrolling to correct segment cards

affects: [26-route-explainer-ids, phase-26-final-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client-side SVG generation: replicate build-time Astro component algorithm as a pure JS function"
    - "Gradient area fill with linearGradient defs in innerHTML-injected SVG"
    - "eleMin/eleMax ft conversion: Math.round(meters * 3.28084)"
    - "id attributes on section card articles: SECTOR_IDS[seg.name] ?? '' pattern"

key-files:
  created: []
  modified:
    - src/components/RouteMap.astro
    - src/components/RouteExplainer.astro

key-decisions:
  - "Hardcoded hex colors in generateSparklineSvg (#7d9448, #c8973e, #f87171) — CSS variables can't be used in innerHTML-injected SVG without getComputedStyle(); hex matches design tokens at their resolved values"
  - "elevData.eleMin/eleMax used directly for ft range display — avoids re-computing Math.min/max over elevationPoints array"
  - "?? '' fallback on id attribute — prevents undefined id if SECTOR_IDS map is ever incomplete; defensive for all 7 covered segments"

patterns-established:
  - "Panel sparkline as client-side JS: replicates Astro build-time algorithm with W=100, H=50, padding=4 constants"
  - "SVG gradient ID scoped to sector: gradId = elev-fill-${elevData.id} prevents gradient collision when multiple panels render"
  - "Panel content order: stars -> meta -> sparkline -> ele-range -> description -> strava -> jump-link"

# Metrics
duration: 2min
completed: 2026-04-02
---

# Phase 25 Plan 02: Panel Sparkline, Full Body Content, and RouteExplainer IDs Summary

**Client-side SVG sparkline generator with difficulty-coded colors, full panel body content, and jump-link anchor IDs on all 7 RouteExplainer segment cards**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-02T20:02:34Z
- **Completed:** 2026-04-02T20:04:14Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `generateSparklineSvg()` to RouteMap.astro — a client-side JS function that replicates the `ElevationSparkline.astro` build-time algorithm; renders an SVG with gradient area fill, difficulty-coded polyline, and start/end dot markers
- Enhanced panel body to show full content: difficulty stars, mile range + surface type, sparkline, elevation range in feet, description, Strava link, and "View in route guide" jump link
- Added `id={SECTOR_IDS[seg.name] ?? ''}` to all 7 `<article>` segment cards in RouteExplainer.astro, enabling panel jump links to scroll to the correct card

## Task Commits

Each task was committed atomically:

1. **Task 1: SVG sparkline generator and enhanced panel body** - `235cc36` (feat)
2. **Task 2: RouteExplainer segment card IDs for jump links** - `56b62bf` (feat)

**Plan metadata:** *(added in final docs commit)*

## Files Created/Modified

- `src/components/RouteMap.astro` - generateSparklineSvg() function, enhanced openPanel() innerHTML, .panel-sparkline and .panel-ele-range CSS classes
- `src/components/RouteExplainer.astro` - id attribute added to segment card article element

## Decisions Made

- Hardcoded hex colors in `generateSparklineSvg` (`#7d9448`, `#c8973e`, `#f87171`) instead of CSS variables — CSS custom properties can't be read from inside an innerHTML-assigned SVG string without calling `getComputedStyle()` first; hex values are the resolved equivalents of `--color-moss-500`, `--color-amber-500`, `--color-rust-500`
- Used `elevData.eleMin` / `elevData.eleMax` directly for the ft range display rather than re-computing `Math.min(...eles)` — avoids redundant array iteration since sector-elevations.json already provides these pre-computed values
- `?? ''` fallback on `id` attribute in RouteExplainer — defensive against any future segment whose name isn't in `SECTOR_IDS`; all 7 current segments are covered

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Panel now shows full rich content: elevation sparkline, stars, surface type, mile range, description, Strava link, and jump link
- Jump links from panel to RouteExplainer cards are fully functional (all 7 article IDs confirmed in built HTML)
- Sparkline colors match difficulty tier: moss (easy), amber (moderate), scarlet (hard)
- Phase 25 is complete — both plans executed
- Phase 26 (final polish / iOS Safari testing) can proceed
- iOS Safari device testing still required per STATE.md blocker (overflow-y on dialog, leaflet-gesture-handling)

---
*Phase: 25-click-handlers-panel-surface-track*
*Completed: 2026-04-02*
