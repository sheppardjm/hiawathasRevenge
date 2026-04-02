---
phase: 19-decorative-component-library
plan: 03
subsystem: ui
tags: [astro, svg, elevation, pipeline, content-collections, zod, sparkline]

# Dependency graph
requires:
  - phase: 18-01-color-token-expansion
    provides: scarlet-400 token (text-safe at 5.24:1) used for hard difficulty stroke color
  - phase: pipeline-resolve-annotations
    provides: annotations.json with startIdx/endIdx sector data consumed by compute-sector-elevations
provides:
  - scripts/compute-sector-elevations.js pipeline script producing sector-elevations.json
  - public/data/sector-elevations.json with 7 sectors and 144 elevation points
  - sectorElevations Astro content collection with Zod schema
  - ElevationSparkline.astro — build-time static SVG polyline component
affects:
  - Phase 20 route segment integration (ElevationSparkline ready to embed in segment cards)
  - Any phase using per-sector elevation statistics (eleGainMeters, eleLossMeters)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "file() loader with flat JSON array — no custom parser needed (sector-elevations.json already has id fields)"
    - "Build-time SVG polyline normalization: x mapped to [0,W] from miles range, y mapped to [0,H] inverted from ele range"
    - "Difficulty color mapping via Record<string,string> lookup with fallback (easy=moss-500, moderate=gold-500, hard=scarlet-400)"
    - "Decorative SVG: aria-hidden=true + role=presentation + focusable=false pattern"

key-files:
  created:
    - scripts/compute-sector-elevations.js
    - public/data/sector-elevations.json
    - src/components/ElevationSparkline.astro
  modified:
    - scripts/pipeline.js
    - src/content.config.ts

key-decisions:
  - "compute-sector-elevations inserted as step 3 of 8 in pipeline (after resolve-annotations, before generate-thumbnails) — depends on annotations.json output"
  - "sector-elevations.json uses flat array with id fields — enables standard file() loader without custom parser"
  - "ElevationSparkline uses getCollection() not direct JSON import from public/ — respects content layer caching and type safety"
  - "viewBox 0 0 100 30 with W=100/H=30 coordinate space — optimized for inline sparkline aspect ratio"

patterns-established:
  - "Static SVG sparkline pattern: compute coordinates in frontmatter, render in template, zero <script>"
  - "Graceful degradation: polylinePoints empty string = component renders nothing (sector not found)"

# Metrics
duration: 2min
completed: 2026-04-02
---

# Phase 19 Plan 03: Elevation Sparkline Summary

**Per-sector elevation pipeline script + static SVG ElevationSparkline component reading from sectorElevations content collection with difficulty-coded stroke colors**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-02T00:33:22Z
- **Completed:** 2026-04-02T00:35:13Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Pipeline script `compute-sector-elevations.js` produces `sector-elevations.json` with all 7 sectors (144 total elevation points), computing eleMin, eleMax, eleGainMeters, eleLossMeters per sector
- `sectorElevations` Astro content collection registered in `content.config.ts` with full Zod schema validating all pipeline output fields
- `ElevationSparkline.astro` renders a static SVG polyline at build time — zero client-side JavaScript, difficulty-coded stroke (easy=moss-500, moderate=gold-500, hard=scarlet-400), graceful degradation for missing sector
- Full pipeline (8 steps) and `astro build` pass cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: compute-sector-elevations pipeline script** - `3489d0c` (feat)
2. **Task 2: sectorElevations collection + ElevationSparkline component** - `45706ec` (feat)

**Plan metadata:** _(to follow)_ (docs: complete plan)

## Files Created/Modified

- `scripts/compute-sector-elevations.js` - Pipeline script: reads route-data.json + annotations.json, writes per-sector elevation data to sector-elevations.json
- `public/data/sector-elevations.json` - Pipeline output: 7 sectors with elevationPoints arrays and stats
- `scripts/pipeline.js` - Added compute-sector-elevations as step 3 (after resolve-annotations, before generate-thumbnails)
- `src/content.config.ts` - Added sectorElevations collection with Zod schema; updated collections export
- `src/components/ElevationSparkline.astro` - Build-time static SVG polyline component; reads from sectorElevations collection via getCollection()

## Decisions Made

- compute-sector-elevations inserted as step 3 of 8 in pipeline after resolve-annotations — requires annotations.json with startIdx/endIdx, must run before generate-thumbnails which has no dependency on it
- sector-elevations.json uses flat array with id fields — enables standard `file()` loader without a custom parser wrapper (same approach as annotations collection)
- ElevationSparkline uses `getCollection('sectorElevations')` not a direct `import` from public/ — respects Astro content layer type safety and caching
- viewBox "0 0 100 30" coordinate space — W=100 maps to miles range, H=30 inverted for elevation; optimized for sparkline aspect ratio in route cards

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ElevationSparkline is ready to embed in route segment cards (Phase 20)
- Use `<ElevationSparkline sectorId="sector-nf2266" />` to render a sector's elevation profile
- All 7 sector IDs available: sector-520, sector-nf2266, sector-bass-lake, sector-nf2217, sector-nd2225, sector-doe-lake, sector-rapid-river
- Component renders nothing if sector ID not found (safe to use before all sectors are wired up)

---
*Phase: 19-decorative-component-library*
*Completed: 2026-04-02*
