---
phase: 02-data-pipeline
plan: 03
subsystem: data-pipeline
tags: [astro, content-collections, zod, npm-scripts, pipeline-orchestration]

# Dependency graph
requires:
  - phase: 02-01
    provides: route-data.json — single source of truth for route points and metadata
  - phase: 02-02
    provides: annotations.json — flat array of snapped sector and restock annotations
provides:
  - scripts/pipeline.js orchestrator running parse-gpx then resolve-annotations in sequence
  - npm lifecycle hooks (prebuild, predev) auto-running pipeline before every build/dev start
  - src/content.config.ts with Zod-validated schemas for routeData, annotations, and photos collections
affects:
  - 02-04
  - 03-map
  - 04-route-profile
  - 07-photos
  - all phases importing content collections

# Tech tracking
tech-stack:
  added: []
  patterns:
    - npm prebuild/predev lifecycle hooks for zero-touch data regeneration
    - Astro file() loader with custom parser to wrap non-array JSON as collection entry
    - z.discriminatedUnion for heterogeneous annotation types (sector vs restock)
    - Stub content collection with fallback empty-array parser for not-yet-existing files

key-files:
  created:
    - scripts/pipeline.js
    - src/content.config.ts
  modified:
    - package.json

key-decisions:
  - "pipeline.js uses process.execPath (not 'node') to guarantee same Node binary across environments"
  - "routeData uses file() with parser:(text) => [{id:'route', ...JSON.parse(text)}] because route-data.json is a single object, not an array"
  - "photos collection stub uses try/catch in parser so build succeeds before Phase 7 produces photos.json"

patterns-established:
  - "Pipeline orchestrator pattern: execFileSync + try/catch + process.exit(1) to abort npm lifecycle on failure"
  - "Content collection stub pattern: parser with try/catch returning [] for optional future data files"
  - "Discriminated union schema for mixed-type annotation arrays"

# Metrics
duration: 2min
completed: 2026-03-30
---

# Phase 2 Plan 03: Pipeline Orchestrator and Content Collections Summary

**pipeline.js orchestrator auto-runs parse-gpx + resolve-annotations on every build/dev via npm lifecycle hooks, and src/content.config.ts provides Zod-validated Astro content collections for routeData, annotations, and a Phase-7-ready photos stub.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-30T21:07:49Z
- **Completed:** 2026-03-30T21:10:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `scripts/pipeline.js` orchestrates parse-gpx and resolve-annotations with per-step logging and error exit
- `package.json` prebuild and predev hooks ensure pipeline fires automatically before every `npm run build` and `npm run dev`
- `src/content.config.ts` defines three Zod-validated content collections with schemas matching the exact JSON shapes produced by the pipeline
- Full build verified: pipeline fires, both scripts run, Astro processes content collections, dist/ produced with no Zod validation errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create pipeline orchestrator and wire npm hooks** - `1e7371a` (feat)
2. **Task 2: Create Astro content config with Zod schemas** - `b983004` (feat)

**Plan metadata:** (committed with docs commit below)

## Files Created/Modified
- `scripts/pipeline.js` - Pipeline orchestrator running parse-gpx then resolve-annotations via execFileSync
- `package.json` - Added pipeline, prebuild, predev npm scripts
- `src/content.config.ts` - Zod schemas for routeData, annotations, and photos Astro content collections

## Decisions Made
- `process.execPath` used in execFileSync instead of hardcoded `'node'` — ensures the same Node binary is used regardless of PATH, important since the project requires Node 25
- `routeData` collection uses a custom parser to wrap the single-object `route-data.json` as `[{ id: 'route', ...data }]` because Astro's `file()` loader expects an array of objects with unique id fields
- `photos` stub collection uses a try/catch parser returning `[]` when `photos.json` is absent — the build logs an `[ERROR]` from the internal file-loader but does not abort, confirming the stub works as designed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Astro's `file()` loader logs `[ERROR] [file-loader] File not found: public/data/photos.json` at build time even when the custom parser catches the error. This is cosmetic — the build completes successfully and the stub returns an empty collection. This is expected behavior per the plan's NOTE on the photos stub.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Pipeline orchestration is complete: any developer running `npm run build` or `npm run dev` automatically gets fresh JSON data
- Astro content collections are ready for downstream components to use `getCollection('annotations')` and `getCollection('routeData')` with full type safety
- The photos stub (Phase 7) is in place and does not block the build
- 02-04 (the final data pipeline plan) can proceed immediately

---
*Phase: 02-data-pipeline*
*Completed: 2026-03-30*
