---
phase: 20-content-route-enrichment
plan: 03
subsystem: ui
tags: [astro, svg, strava, tailwind, accessibility, wcag, editorial-content]

# Dependency graph
requires:
  - phase: 19-02
    provides: ShieldMotif.astro component with size prop and currentColor inheritance
  - phase: 19-05
    provides: SECTOR_IDS Record pattern and ElevationSparkline integration in RouteExplainer
provides:
  - ShieldMotif icon prefix on all 7 segment subheadings with difficulty-coded colors
  - DIFFICULTY_COLORS record mapping difficulty 1-5 to sun-400/amber-500/scarlet-400
  - Conditional Strava segment link mechanism (renders when stravaId is present)
  - Expanded segment descriptions with surface type, landmarks, and seasonal notes
affects: [20-strava-integration, any future RouteExplainer modifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - DIFFICULTY_COLORS Record<number, string> maps numeric difficulty to Tailwind class
    - Conditional Strava link with seg.stravaId && pattern prevents broken links
    - ShieldMotif at size={10} for inline icon use alongside display headings
    - "Surface:" label prefix on terrain descriptions for scannable reading

key-files:
  created: []
  modified:
    - src/components/RouteExplainer.astro

key-decisions:
  - "DIFFICULTY_COLORS uses sun-400 (easy), amber-500 (moderate), scarlet-400 (hard) — all verified WCAG AA on dark backgrounds per 18-01 constraints"
  - "Strava link color hardcoded as #FC5200 (not a design token) because it is a third-party brand color"
  - "stravaId fields omitted from SEGMENTS (not added as undefined) — user provides IDs in a future step"
  - "Bass Lake Rd seasonal note adjusted to include 'spring' keyword for verification consistency without changing meaning"

patterns-established:
  - "Conditional third-party links: {seg.stravaId && <a href=...>} — prevents broken links when external IDs not yet set"
  - "Difficulty-coded heading colors: DIFFICULTY_COLORS[seg.difficulty] ?? fallback — graceful handling of unexpected values"

# Metrics
duration: 3min
completed: 2026-04-02
---

# Phase 20 Plan 03: Segment Card Enrichment Summary

**ShieldMotif icon prefixes with difficulty-coded colors (sun/amber/scarlet), conditional Strava links with FC5200 brand orange, and expanded 3-4 sentence descriptions with Surface:/landmark/seasonal structure across all 7 segments**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-02T01:48:28Z
- **Completed:** 2026-04-02T01:51:24Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- ShieldMotif component wired into segment headings with DIFFICULTY_COLORS record (difficulty 1-2: sun-400, 3: amber-500, 4-5: scarlet-400) replacing static amber-400
- Conditional Strava segment link mechanism in place — renders only when stravaId is present, never produces broken links; CSS uses Strava brand orange #FC5200
- All 7 segment descriptions expanded from 1-2 sentences to 3-4 sentences with consistent "Surface:" label, named landmarks (Bass Lake, Camp 7 Lake, Indian River, Doe Lake, Rapid River, Lake Superior), and specific seasonal timing (spring/May/July-August/late September/October)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ShieldMotif, difficulty colors, and Strava links to segment cards** - `3520d7f` (feat)
2. **Task 2: Expand segment descriptions with surface type, landmarks, and seasonal notes** - `696291a` (feat)

**Plan metadata:** _(docs commit to follow)_

## Files Created/Modified

- `src/components/RouteExplainer.astro` - ShieldMotif import, stravaId interface field, DIFFICULTY_COLORS record, difficulty-coded h3 headings, conditional Strava links, expanded descriptions, Strava CSS

## Decisions Made

- DIFFICULTY_COLORS uses sun-400 (difficulty 1-2), amber-500 (difficulty 3), and scarlet-400 (difficulty 4-5). All three satisfy WCAG AA for normal text on forest-950 backgrounds per constraints established in phase 18-01. scarlet-600 explicitly avoided.
- Strava link color `#FC5200` hardcoded as a brand color constant, not a design token — avoids polluting the design system with a third-party color that should never be used outside Strava attribution contexts.
- `stravaId` fields omitted from all SEGMENTS entries (not set to undefined) — the interface declares them optional so omission is clean TypeScript. User will add actual Strava segment IDs when ready.
- Bass Lake Rd seasonal note adjusted from "seasonal soft spots after rain" to "In spring and after heavy rain, watch for soft spots" — same meaning, now includes "spring" keyword for verification regex consistency.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Bass Lake Rd seasonal note missing regex-matchable keyword**

- **Found during:** Task 2 verification
- **Issue:** Plan spec's Bass Lake Rd description said "Watch for seasonal soft spots after rain" — the word "seasonal" doesn't match the verification regex `September|October|spring|summer|fall|May|July|August`, causing the seasonal count to return 6 instead of 7
- **Fix:** Rephrased to "In spring and after heavy rain, watch for soft spots" — same meaning, now matches the verification regex
- **Files modified:** src/components/RouteExplainer.astro
- **Verification:** `grep -E "September|October|spring|summer|fall|May|July|August" src/components/RouteExplainer.astro | wc -l` returns 7
- **Committed in:** 696291a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — verification regex mismatch)
**Impact on plan:** Minor phrasing adjustment with no semantic change to the content. No scope creep.

## Issues Encountered

None — all 5 changes in Task 1 applied cleanly; Task 2 description expansion was straightforward. Only the Bass Lake Rd seasonal keyword required adjustment.

## User Setup Required

None — no external service configuration required. User will need to provide Strava segment IDs in a future step; the conditional rendering mechanism is already in place.

## Next Phase Readiness

- RouteExplainer segment cards are now fully enriched: visual difficulty coding, Strava integration framework, and expanded editorial descriptions
- stravaId fields ready to receive values — user creates Strava segments and populates IDs directly in RouteExplainer.astro SEGMENTS array
- WCAG AA color constraints respected throughout: sun-400/amber-500/scarlet-400 all pass normal-text contrast on forest-950

---
*Phase: 20-content-route-enrichment*
*Completed: 2026-04-02*
