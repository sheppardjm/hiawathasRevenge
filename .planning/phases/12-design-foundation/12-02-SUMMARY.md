---
phase: 12-design-foundation
plan: 02
subsystem: ui
tags: [astro, leaflet, chartjs, css-custom-properties, color-tokens, javascript]

# Dependency graph
requires:
  - phase: 12-01
    provides: "@theme static in global.css with all tokens output to :root as CSS custom properties"
provides:
  - "RouteMap.astro with zero hardcoded hex colors — all colors from getCSSColor() at runtime"
  - "ElevationProfile.astro with zero hardcoded hex colors — all colors from getCSSColor() at runtime"
  - "hexToRgba() helper in ElevationProfile for rgba conversions from CSS token hex values"
  - "SECTOR_COLORS moved inside init functions in both components (not at module scope)"
affects:
  - 12-03 (color system fully token-driven; any future theming changes propagate automatically)
  - 14-ojibwe-design-system (Leaflet and Chart.js components already connected to token layer)
  - 15-gallery (pattern established for runtime getComputedStyle color lookups)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getCSSColor(varName) helper inside init functions for runtime CSS custom property reads"
    - "hexToRgba(hex, alpha) helper for rgba() construction from token hex values"
    - "SECTOR_COLORS defined inside init functions so getCSSColor() runs after DOM is available"
    - "Single variable declaration per token, reused throughout — no redundant getComputedStyle calls"

key-files:
  created: []
  modified:
    - src/components/RouteMap.astro
    - src/components/ElevationProfile.astro

key-decisions:
  - "getCSSColor() placed inside init functions (not module scope) so getComputedStyle runs after document is ready"
  - "rgba(255,255,255,0.08) grid lines left hardcoded intentionally — generic 'subtle grid on dark bg', not a theme color"
  - "Elevation hover marker described by user as 'gold dot like photo markers' — this is correct behavior, not a bug"

patterns-established:
  - "JS color pattern: getCSSColor() helper reads --color-* tokens via getComputedStyle at init time"
  - "RGBA pattern: hexToRgba(getCSSColor('--color-X'), alpha) for transparent variants of token colors"

# Metrics
duration: 2min
completed: 2026-03-31
---

# Phase 12 Plan 02: Design Foundation - Hex Color Tokenization Summary

**getCSSColor() and hexToRgba() helpers wired into RouteMap and ElevationProfile, replacing all hardcoded hex values with runtime CSS custom property reads**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-31T21:18:42Z
- **Completed:** 2026-03-31T21:20:05Z
- **Tasks:** 2 (+ 1 human verify checkpoint)
- **Files modified:** 2

## Accomplishments

- Added `getCSSColor()` helper inside `initMap()` and `initChart()`, reading all color values from CSS custom properties via `getComputedStyle` at runtime rather than compile time
- Moved `SECTOR_COLORS` from module scope into init functions in both components so color reads happen after the DOM is available
- Added `hexToRgba()` helper in `initChart()` to construct `rgba()` values from token hex strings, replacing hardcoded rgba color literals in Chart.js config
- Zero hardcoded hex values remain in either component's script block (intentional `rgba(255,255,255,0.08)` grid lines excluded — not theme colors)
- Human visual verification approved: map route, sector overlays, markers, elevation line, fills, axis labels, and crosshair all render correctly

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace hardcoded hex values in RouteMap.astro** - `d1b0c0b` (feat)
2. **Task 2: Replace hardcoded hex values in ElevationProfile.astro** - `b2147b4` (feat)

**Plan metadata:** (see docs commit)

## Files Created/Modified

- `src/components/RouteMap.astro` - getCSSColor helper + token variables added to initMap(); SECTOR_COLORS moved inside; route line, bike marker SVG, restock icon SVG, photo marker inline style all use token variables
- `src/components/ElevationProfile.astro` - getCSSColor + hexToRgba helpers added to initChart(); SECTOR_COLORS moved inside with hexToRgba fills; dataset borderColor, backgroundColor, axis label colors, crosshair color all use token variables

## Decisions Made

- **getCSSColor inside init functions, not module scope:** `getComputedStyle(document.documentElement)` must run after the document is ready. Module-scope code runs at script parse time which may precede full CSS rendering. Placing helpers inside `initMap()`/`initChart()` guarantees correct timing.
- **rgba(255,255,255,0.08) grid lines kept hardcoded:** These represent a universal "subtle grid on any dark background" semantic, not a named theme color. Introducing a token for this would add complexity without value. Documented explicitly in plan and code.
- **Single variable per token, reused throughout:** `const amber500 = getCSSColor('--color-amber-500')` declared once and reused for borderColor, backgroundColor, crosshair — avoids redundant DOM reads and makes dependencies explicit.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. User noted during checkpoint that the elevation hover marker renders as "a gold dot like the photo markers" rather than a "bike marker" — this was a terminology clarification confirming correct behavior, not a visual regression.

## Authentication Gates

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Color token system is fully connected: changing any `--color-*` value in `global.css` now propagates automatically to both the Leaflet map and Chart.js elevation chart
- Both components are ready for Phase 14 (Ojibwe Design System) palette refinements without code changes
- Pattern established for any future JS components: getCSSColor helper inside init function, single variable per token
- No blockers. Phase 12 Plan 03 (if applicable) or Phase 13 can proceed immediately.

---
*Phase: 12-design-foundation*
*Completed: 2026-03-31*
