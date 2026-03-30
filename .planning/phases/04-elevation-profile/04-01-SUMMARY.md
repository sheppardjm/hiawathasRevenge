---
phase: 04-elevation-profile
plan: 01
subsystem: ui
tags: [chart.js, chartjs-plugin-annotation, elevation, intersection-observer, lttb, decimation, astro]

# Dependency graph
requires:
  - phase: 02-data-pipeline
    provides: route-data.json with points[].{lat,lon,ele,miles} — elevation source data
  - phase: 03-route-map
    provides: IntersectionObserver lazy-init pattern established in RouteMap.astro
provides:
  - chart.js@4.5.1 and chartjs-plugin-annotation@3.1.0 in dependencies
  - ElevationProfile.astro island component with Chart.js line chart
  - Elevation (ft) vs distance (miles) visualization with LTTB decimation
  - IntersectionObserver lazy-init (Chart.js loads only on viewport entry)
  - Responsive fixed-height container (140px mobile / 180px tablet+desktop)
affects: [05-gravel-sectors, any phase using Chart.js or elevation data]

# Tech tracking
tech-stack:
  added:
    - chart.js@4.5.1
    - chartjs-plugin-annotation@3.1.0
  patterns:
    - Dynamic import of tree-shaken Chart.js components inside async initChart() — same IntersectionObserver lazy-init as RouteMap.astro
    - parsing: false at both options level and dataset level required for LTTB decimation
    - maintainAspectRatio: false with fixed-height CSS container for responsive chart sizing
    - Meters-to-feet conversion inline in data mapping (pt.ele * 3.28084)

key-files:
  created:
    - src/components/ElevationProfile.astro
  modified:
    - package.json
    - package-lock.json
    - src/pages/index.astro

key-decisions:
  - "chartjs-plugin-annotation installed now but NOT registered/used — deferred to Phase 5 (gravel sector bands)"
  - "Tree-shaken import (not chart.js/auto) — imports only LineController, LineElement, PointElement, LinearScale, Filler, Tooltip, Decimation"
  - "IO-only lazy-init (no scroll listener) — map section scroll listener already handles upper page; IO alone sufficient for below-map chart"
  - "parsing: false required at BOTH options and dataset level for LTTB decimation to function — without it, decimation silently does nothing"

patterns-established:
  - "ElevationProfile lazy-init: IntersectionObserver only (no scroll listener) — differs from RouteMap two-stage pattern intentionally"
  - "Chart.js tree-shaken dynamic import pattern: await import('chart.js') with named component destructuring inside initChart()"

# Metrics
duration: 2min
completed: 2026-03-30
---

# Phase 4 Plan 01: Elevation Profile — Chart.js Install and Component Summary

**Chart.js 4.5.1 line chart rendering elevation (feet) vs distance (miles) from route-data.json, lazy-loaded via IntersectionObserver with LTTB decimation and responsive 140px/180px container**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-30T22:53:37Z
- **Completed:** 2026-03-30T22:55:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Installed chart.js@4.5.1 and chartjs-plugin-annotation@3.1.0 as runtime dependencies
- Created ElevationProfile.astro with tree-shaken Chart.js dynamic import, meters-to-feet conversion, LTTB decimation, and IntersectionObserver lazy-init
- Wired elevation profile section into index.astro between the route map and Support the Trail sections

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Chart.js and chartjs-plugin-annotation** - `3e8e581` (chore)
2. **Task 2: Create ElevationProfile.astro and wire into index.astro** - `92a153c` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/components/ElevationProfile.astro` - Chart.js elevation line chart island with IntersectionObserver lazy-init, responsive container, LTTB decimation
- `src/pages/index.astro` - Added ElevationProfile import and section after route map
- `package.json` - Added chart.js@4.5.1 and chartjs-plugin-annotation@3.1.0 to dependencies
- `package-lock.json` - Lockfile updated

## Decisions Made

1. **chartjs-plugin-annotation installed but not registered** — Installed now as Phase 5 (gravel sector bands) requires it, but no annotations drawn in this phase. Avoids a second package install commit mid-project.

2. **IO-only lazy-init, no scroll listener** — RouteMap.astro uses a scroll listener as primary trigger to load Leaflet on first user scroll. If ElevationProfile also used a scroll listener, Chart.js would load the moment the user scrolled (triggering the map's scroll listener at the same time). IO-only means Chart.js loads only when the elevation section actually enters the viewport — the user must scroll past the map first.

3. **Tree-shaken import over chart.js/auto** — `chart.js/auto` imports all controllers, scales, plugins (~200KB+). Manually importing only LineController, LineElement, PointElement, LinearScale, Filler, Tooltip, and Decimation keeps the bundle ~30KB.

4. **parsing: false at both levels** — Chart.js LTTB decimation silently does nothing if `parsing: false` is omitted from either the options root or the dataset. The plan specified both; confirmed and implemented.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The pre-existing `[ERROR] [file-loader] File not found: public/data/photos.json` log appears in every build — this is the known photos stub behavior established in 02-03. It does not abort the build.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ElevationProfile component is ready for Phase 5 enhancements
- chartjs-plugin-annotation@3.1.0 is installed and ready to register in Phase 5
- Chart instance is not exported/accessible outside the script block — Phase 5 will need to either add a CustomEvent dispatch pattern or restructure to expose the chart reference for hover sync with the map

---
*Phase: 04-elevation-profile*
*Completed: 2026-03-30*
