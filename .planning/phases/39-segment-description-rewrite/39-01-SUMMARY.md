---
phase: 39-segment-description-rewrite
plan: 01
subsystem: ui
tags: [content, astro, json, ecological-prose, segment-descriptions]

# Dependency graph
requires:
  - phase: 38-ui-config-quick-fixes
    provides: stable component foundation that segment descriptions render within
provides:
  - Seven 35-55 word naturalist segment descriptions grounded in Hiawatha NF Forest Plan ecology
  - Descriptions rendered identically in RouteExplainer.astro page and sector-details.json map panel
  - Elimination of Surface: label pattern, second-person voice, and generic group names from all descriptions
affects: [future content phases, any phase touching RouteExplainer.astro or sector-details.json]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Segment description three-clause structure: surface texture -> ecology (named species) -> terrain/riding character"
    - "Manual sync pattern: descriptions maintained identically in RouteExplainer.astro SEGMENTS const and generate-sector-details.js SECTOR_DETAILS const"
    - "JSON regeneration: node scripts/generate-sector-details.js regenerates public/data/sector-details.json from source"

key-files:
  created: []
  modified:
    - src/components/RouteExplainer.astro
    - scripts/generate-sector-details.js
    - public/data/sector-details.json

key-decisions:
  - "Used 'mature northern hardwoods' not 'old-growth' for NF2266 — old-growth claim unverifiable per Forest Plan data"
  - "Omitted Bass Lake as a named landmark from prose — used 'the lake corridor' per landscape-only rule"
  - "NF2217 description uses double-quoted string in JS to handle apostrophe in 'route's' without escaping"

patterns-established:
  - "Ecological prose pattern: surface texture as modifier in first clause, named species in second, terrain character in third"
  - "No second-person pronouns, no road names, no mile markers, no restock points in description prose"
  - "Species specificity: name actual species (sugar maple, jack pine, paper birch) not groups (hardwoods, conifers)"

# Metrics
duration: 3min
completed: 2026-04-07
---

# Phase 39 Plan 01: Segment Description Rewrite Summary

**Seven segment descriptions rewritten as 35-55 word ecological naturalist prose using named species from the 2006 Hiawatha National Forest Plan, synced across RouteExplainer.astro and sector-details.json**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-07T14:10:47Z
- **Completed:** 2026-04-07T14:14:00Z
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments

- Rewrote all 7 segment descriptions from 80-120 word trail-guide copy to 35-55 word naturalist blurbs (all land 43-49 words)
- Eliminated Surface: label pattern, second-person pronouns (you/you'll/your), generic group names (hardwoods, mixed forest) from all descriptions
- Grounded each description in Hiawatha NF ecology: sugar maple + beech (NF2266, sector-rapid-river), jack pine + blueberry (ND2225), paper birch (Bass Lake), red/white pine (NF2217), mixed conifer on moraines (Doe Lake)
- Synced descriptions word-for-word across RouteExplainer.astro, generate-sector-details.js, and the regenerated sector-details.json
- Build passes with no errors

## Task Commits

1. **Task 1: Rewrite all 7 segment descriptions in both source files** - `f2aa7ce` (feat)
2. **Task 2: Regenerate sector-details.json and verify sync** - `0c7a61f` (feat)

## Files Created/Modified

- `src/components/RouteExplainer.astro` - SEGMENTS const: 7 description fields rewritten
- `scripts/generate-sector-details.js` - SECTOR_DETAILS const: 7 description fields rewritten (identical text)
- `public/data/sector-details.json` - Regenerated output: 7 updated description fields

## Decisions Made

- Used "mature northern hardwoods" rather than "old-growth" for NF2266 — the Forest Plan confirms late-seral northern hardwood character (sugar maple, beech dominant, multi-layered canopy) but the specific NF2266 corridor's designation as old-growth is unverifiable at prose scale
- Omitted "Bass Lake" as a named landmark from Bass Lake Rd description — used "the lake corridor" to keep prose landscape-only per plan constraint
- NF2217 description is double-quoted in generate-sector-details.js (vs. escaped single-quote in Astro) to handle the apostrophe in "route's" — string value is identical
- Each segment given an ecologically distinct differentiator: sector-520 (sugar maple/yellow birch, paved threshold), NF2266 (mature hardwood canopy, sand/washboard), Bass Lake (paper birch on productive sands, lake corridor), NF2217 (red/white pine on flat outwash, Indian River headwaters), ND2225 (jack pine/blueberry, dry outwash barrens), Doe Lake (mixed conifer on moraines, roots/rock), sector-rapid-river (hardwoods returning, moraine descents)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — content rewrite and JSON regeneration completed in a single pass.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- v1.6 Segment Editorial & Polish phase complete
- All 7 segment descriptions meet editorial spec (35-55 words, three-clause structure, named species, third-person)
- sector-details.json committed and in sync with both source files
- Ready for v1.6 close-out or any subsequent phases in ROADMAP.md

---
*Phase: 39-segment-description-rewrite*
*Completed: 2026-04-07*
