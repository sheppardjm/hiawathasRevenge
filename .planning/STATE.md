# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-31)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.
**Current focus:** v1.2 Cultural Maximalism -- Phase 22 Animation Polish complete (22-02 verified)

## Current Position

Phase: 22 (5 of 5 in v1.2) -- Animation Polish -- Complete
Plan: 02 of 2 in phase -- Complete
Status: 22-02 complete (reduced-motion audit passed, human visual approval)
Last activity: 2026-04-02 -- Completed 22-02-PLAN.md

Progress: [██████████] 100% (13/13 v1.2 plans)

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
- Total plans completed: 13 (18-01, 18-02, 19-01, 19-02, 19-03, 19-04, 19-05, 20-01, 20-02, 20-03, 21-01, 22-01, 22-02)
- Total phases: 5 (18-22)
- Estimated plans: 13 (COMPLETE)

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
| 19-04 | Animation durations asymmetric (8s blossom, 6s berry) | Prevents synchronization between variant types; creates organic rather than mechanical feel |
| 19-04 | scarlet-400 used in berry cycling (not scarlet-600) | scarlet-600 is large-text/decorative-only per 18-01; scarlet-400 is safe for decorative SVG fills |
| 19-05 | AnimatedDivider replaces second FloralDivider (not first) | Preserves contrast between static and animated dividers coexisting on same page |
| 19-05 | SECTOR_IDS Record map as bridge from segment names to content collection IDs | Explicit, readable, zero runtime cost — decouples display names from data IDs |
| 20-01 | MET Open Access / Wikimedia CC0 for Remington illustrations | DP-12259-001 and DP-12259-002 from 1891 Houghton Mifflin edition — cleanest possible public domain (CC0 not merely PD) |
| 20-01 | sepia(80%) saturate(30%) brightness(0.9) as canonical historical artifact filter | Visually distinct from full-color route photography; established as reusable pattern |
| 20-01 | mt-0 on first editorial h3, mt-[6rem] on subsequent three | First h3 follows h2 which already provides separation; subsequent sections need full 6rem gap |
| 20-01 | Conditional rendering guards on historicalPhotos.length for graceful degradation | Build passes cleanly even if historical-photos.json is empty |
| 20-03 | DIFFICULTY_COLORS uses sun-400/amber-500/scarlet-400 (not scarlet-600) | All three pass WCAG AA normal text on forest-950 per 18-01 constraints |
| 20-03 | Strava #FC5200 hardcoded, not a design token | Third-party brand color should not pollute the design system |
| 20-03 | stravaId fields omitted from SEGMENTS (user provides IDs later) | Conditional {seg.stravaId && ...} prevents broken links until IDs are ready |
| 20 | 6/7 Strava segment IDs populated; Rapid River Truck Trail deferred | User provided IDs for 520, NF2266, Bass Lake Rd, NF2217-2218, ND2225, Doe Lake |
| 21-01 | bg-forest-800 for action/data sections, bg-forest-950 for deep editorial/footer | Creates 60-30-10 distribution: forest-900/950 dominant, forest-800 accent |
| 21-01 | Full-width pattern: outer section with bg-*, inner div with max-w-4xl | No colored narrow columns; backgrounds span viewport width |
| 21-01 | AnimatedDivider placement only at color-transition boundaries (not same-color pairs) | RouteStats and GPX are both forest-800 — no divider between them |
| 22-01 | threshold 0.15 (not 0.3) for section reveals | Tall sections on mobile may never reach 30% visible; 15% triggers reliably |
| 22-01 | AnimatedDividers excluded from data-reveal | They manage their own IntersectionObserver per instance — adding data-reveal would conflict |
| 22-01 | data-reveal added inside component files (not wrapping in index.astro) | Keeps observer targeting the actual section element, not a wrapper |
| 22-02 | No source changes needed — 22-01 passed all ANI-03/ANI-04 audits | reduced-motion CSS guards, JS matchMedia skip, above-fold exclusions, and 614KB transfer all compliant |

### Pending Todos

None.

### Blockers/Concerns

- Ojibwe community consultation recommended (cultural sensitivity review)
- Project requires Node >=22.12.0 -- use Volta (`/Users/Sheppardjm/.volta/bin/node`)
- Strava IDs populated for 6/7 segments (Rapid River Truck Trail pending — user hasn't created that segment yet)
- Historical imagery sourced: Frederic Remington 1891 via Met Open Access CC0 (RESOLVED)
- scarlet-600 (#dc2626) documented as large-text/decorative ONLY in 18-01 (RESOLVED)

## Session Continuity

Last session: 2026-04-02
Stopped at: Completed 22-02-PLAN.md -- reduced-motion audit passed, human visual verification approved
Resume file: None
