---
phase: 41-ux-cleanup
plan: 01
subsystem: ui
tags: [astro, leaflet, sector-panel, gpx, download, ux]

# Dependency graph
requires:
  - phase: 40-map-simplification
    provides: RouteMap.astro with sector overlay panels and route selector pill bar
provides:
  - GPX download section with route selector guidance text
  - Sector detail panels without broken "View in route guide" jump link
affects: [future ui phases using sector panel or GPX download section]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/pages/index.astro
    - src/components/RouteMap.astro

key-decisions:
  - "Guidance text placed as a <p> below the existing tagline <span> to keep elements semantically separate"
  - "All four jump link artifacts removed (CSS rules, const, innerHTML injection, addEventListener) for clean deletion with no dead code"

patterns-established: []

# Metrics
duration: 2min
completed: 2026-04-07
---

# Phase 41 Plan 01: Remove Broken Panel Button and Add Download Guidance Text Summary

**Deleted "View in route guide" jump link from sector panels and added route selector guidance paragraph to GPX download section**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-07T16:25:45Z
- **Completed:** 2026-04-07T16:27:05Z
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments

- GPX download section now displays a guidance paragraph directing users to use the route selector in the map below before downloading, preventing confusion about which route file they receive
- All "View in route guide" jump link infrastructure removed from `openPanel()` — no button appears in any sector detail panel, no dead CSS selectors remain
- Strava links, panel description, sparkline, elevation stats, and all other panel content unaffected

## Task Commits

Each task was committed atomically:

1. **Task 1: Add route selector guidance to GPX download section** - `3554a12` (feat)
2. **Task 2: Remove jump link from sector detail panels** - `ba6bcae` (fix)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/pages/index.astro` - Added guidance `<p>` below "Load this route onto your GPS device" tagline
- `src/components/RouteMap.astro` - Removed `.panel-jump-link` CSS (2 rule blocks), `jumpHtml` const, `${jumpHtml}` injection, and `jumpLink` addEventListener

## Decisions Made

- Guidance text placed as a separate `<p>` element below the existing `<span>` tagline rather than modifying the tagline itself — keeps elements semantically distinct and original tagline fully intact
- All four jump link artifacts removed together in one task commit for a clean, traceable deletion with zero dead code

## Deviations from Plan

One minor deviation in execution approach — the `jumpHtml` string contained a literal `\u2193` escape sequence (not a Unicode character) that caused the initial Edit tool call to fail. Used Python string replacement to match the exact bytes in the file. No change to plan scope or output.

**Total deviations:** 0 (plan executed exactly as written; one tooling workaround for Unicode escape handling, no scope change)

## Issues Encountered

The Edit tool could not match the `jumpHtml` const because the source file stores `\u2193` as a literal backslash-u escape rather than the actual Unicode down-arrow character. Resolved by using Python to perform the string replacement with the exact byte sequence. No code change required; same removal achieved.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both UX friction points resolved; sector panels are clean and GPX download section is informative
- No blockers for remaining phase 41 work or subsequent phases

---
*Phase: 41-ux-cleanup*
*Completed: 2026-04-07*
