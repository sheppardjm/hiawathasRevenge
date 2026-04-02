# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-31)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.
**Current focus:** v1.2 Cultural Maximalism -- Phase 19 complete, ready for Phase 20

## Current Position

Phase: 19 (2 of 5 in v1.2) -- Decorative Component Library -- COMPLETE
Plan: 03 of 3 in phase -- Complete
Status: Phase 19 complete
Last activity: 2026-04-02 -- Completed 19-03-PLAN.md (ElevationSparkline component)

Progress: [█████░░░░░] 45% (5/11 v1.2 plans)

## Performance Metrics

**v1.0 Summary:**
- Total plans completed: 33
- Total phases: 12 (0-11)
- Timeline: 2 days (2026-03-30 -> 2026-03-31)

**v1.1 Summary:**
- Total plans completed: 8
- Total phases: 6 (12-17)
- Timeline: 1 day (2026-03-31)

**v1.2 Summary:**
- Total plans completed: 5 (18-01, 18-02, 19-01, 19-02, 19-03)
- Total phases: 5 (18-22)
- Estimated plans: ~11

## Accumulated Context

### Decisions

All v1.0 + v1.1 decisions logged in PROJECT.md Key Decisions table.

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 18-01 | scarlet-600 (#dc2626) = large-text/decorative ONLY | 3.00:1 on forest-900, 3.71:1 on forest-950 — both fail WCAG AA normal text |
| 18-01 | sun-yellow all 4 shades pass AA normal text | Safest of the 3 new families for body text use |
| 18-01 | FloralDivider is canonical surface for orphaned/decorative tokens | Decorative aria-hidden component naturally accommodates expanded color vocabulary |
| 18-02 | Standalone script per image category (not modifying generate-thumbnails.js) | Zero risk to existing 51-photo route photo pipeline; clean isolation |
| 18-02 | process-historical inserted as step 5 of 7 (after copy-images, before match-photos) | Groups all image processing steps together in pipeline sequence |
| 18-02 | Empty manifest writes [] and exits 0 (not an error) | Enables clean builds before Phase 20 populates historical images |
| 19-01 | pathLength=1 + stroke-dashoffset pattern established as v1.2 animation standard | Normalizes animated path length without getTotalLength(); works in all browsers |
| 19-01 | Static decorative elements (leaves, blossoms, clusters) do NOT animate — only vine strokes draw on | Preserves full visual richness immediately; only structural vine animates on scroll |
| 19-02 | SVG symbol placed immediately after <body> tag (not in <head>) | SVG symbols must be in document body to be valid <use href> targets |
| 19-02 | height = size * 2 always (1:2 aspect ratio for 28x56 viewBox) | Callers control width via size prop; component maintains correct proportions automatically |
| 19-02 | Decorative by default (no label = aria-hidden + role=presentation) | Majority use case is decorative ornamentation; accessible usage is opt-in via label prop |
| 19-03 | compute-sector-elevations inserted as step 3 of 8 in pipeline | Depends on annotations.json (startIdx/endIdx), runs before generate-thumbnails |
| 19-03 | ElevationSparkline uses getCollection() not direct JSON import | Respects Astro content layer type safety and caching |
| 19-03 | viewBox "0 0 100 30" coordinate space for sparklines | W=100 maps to miles range, H=30 inverted for elevation; optimized for inline sparkline aspect ratio |

### Pending Todos

None.

### Blockers/Concerns

- Ojibwe community consultation recommended (cultural sensitivity review)
- Project requires Node >=22.12.0 -- use Volta (`/Users/Sheppardjm/.volta/bin/node`)
- User will create Strava segments and provide IDs during Phase 20 implementation
- Historical imagery must be public domain (Harrison Fisher 1906, Frederic Remington 1891 via Met Open Access / Internet Archive)
- scarlet-600 (#dc2626) documented as large-text/decorative ONLY in 18-01 (RESOLVED)

## Session Continuity

Last session: 2026-04-02
Stopped at: Completed 19-03-PLAN.md -- ElevationSparkline component + sectorElevations content collection + compute-sector-elevations pipeline script
Resume file: None
