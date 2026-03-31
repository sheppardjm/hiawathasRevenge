---
phase: 05-map-elevation-sync
plan: "04"
subsystem: ui
tags: [leaflet, chartjs, annotations, difficulty, color-coding, gravel-sectors]

# Dependency graph
requires:
  - phase: 05-02
    provides: gravel sector polyline overlays on RouteMap using amber color
  - phase: 05-03
    provides: gravel sector box annotation bands on ElevationProfile using amber fill
provides:
  - annotations.json with difficulty field on all 7 gravel sectors (2 easy, 4 moderate, 1 hard)
  - Zod schema validation of difficulty enum on sector type
  - Difficulty-based color coding for sector polylines on RouteMap (green-gold/amber/rust)
  - Difficulty-based fill colors for sector bands on ElevationProfile (matching palette)
affects: [06-photos, 07-admin, future-phases-using-annotations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SECTOR_COLORS lookup object at module scope for difficulty-based color selection
    - Fallback to moderate color when difficulty field missing (|| SECTOR_COLORS.moderate)

key-files:
  created: []
  modified:
    - scripts/resolve-annotations.js
    - src/content.config.ts
    - src/components/RouteMap.astro
    - src/components/ElevationProfile.astro
    - public/data/annotations.json

key-decisions:
  - "SECTOR_COLORS object at module scope (not inside function) — accessible across sync/async boundaries"
  - "Fallback || SECTOR_COLORS.moderate defensive against missing difficulty field in data"
  - "Fill opacity raised 0.15 → 0.18 for better visibility of green-gold easy bands which are subtler than amber"

patterns-established:
  - "SECTOR_COLORS lookup: const colors = SECTOR_COLORS[sector.difficulty] || SECTOR_COLORS.moderate"
  - "Difficulty pipeline: GRAVEL_SECTORS source → annotations.json → Zod validation → component color lookup"

# Metrics
duration: 2min
completed: 2026-03-31
---

# Phase 5 Plan 04: Difficulty-Based Sector Color Coding Summary

**Difficulty-based color coding for 7 gravel sectors: green-gold easy (#8a9a5b), amber moderate (#c8973e), rust hard (#a0522d) — both map polylines and elevation chart bands**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-31T00:44:44Z
- **Completed:** 2026-03-31T00:46:42Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added difficulty field (easy/moderate/hard) to all 7 GRAVEL_SECTORS and passed through to annotations.json output
- Added z.enum(['easy', 'moderate', 'hard']) Zod schema validation on the sector type in content.config.ts
- RouteMap.astro sector polylines now render in 3 distinct colors (green-gold/amber/rust) based on difficulty field
- ElevationProfile.astro sector bands now render with matching difficulty-based fill colors at 18% opacity

## Task Commits

Each task was committed atomically:

1. **Task 1: Add difficulty field to annotation pipeline and regenerate data** - `967498c` (feat)
2. **Task 2: Add difficulty-based color mapping to RouteMap and ElevationProfile** - `f370c8a` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `scripts/resolve-annotations.js` - Added difficulty property to all 7 GRAVEL_SECTORS entries; passes difficulty: sector.difficulty through to snappedSectors output
- `src/content.config.ts` - Added difficulty: z.enum(['easy', 'moderate', 'hard']) to sector schema in discriminatedUnion
- `public/data/annotations.json` - Regenerated with difficulty field on all 7 sector objects (2 easy, 4 moderate, 1 hard)
- `src/components/RouteMap.astro` - Added SECTOR_COLORS at module scope; polyline loop uses colors.line from SECTOR_COLORS[sector.difficulty]
- `src/components/ElevationProfile.astro` - Added SECTOR_COLORS at module scope; annotation loop uses colors.fill from SECTOR_COLORS[sector.difficulty]

## Decisions Made

- SECTOR_COLORS placed at module scope (before initMap/initChart) so it is accessible in the async functions without closure issues
- Fallback `|| SECTOR_COLORS.moderate` added defensively in case difficulty field is ever missing from data
- Easy fill opacity set to 0.18 (slightly higher than the original 0.15 for all sectors) to improve visibility of the green-gold color, which is more muted than amber
- Difficulty assignments: NF numbered roads (520, NF2266, NF2217, ND2225) = moderate; named scenic roads (Bass Lake Rd, Doe Lake) = easy; Rapid River Truck Trail (roughest, longest at 6.3mi) = hard

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 5 gap closure complete — all 5 ROADMAP requirements for Phase 5 are now met including MAP-05 color-coded difficulty
- annotations.json is fully enriched with difficulty field; ready for any future phases that consume annotation data
- No blockers for Phase 6

---
*Phase: 05-map-elevation-sync*
*Completed: 2026-03-31*
