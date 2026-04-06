# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-06)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.
**Current focus:** v1.5 Multi-Route Support -- Phase 33: Pipeline & Route Data

## Current Position

Phase: 33 of 36 (Pipeline & Route Data)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-04-06 -- Completed 33-02-PLAN.md (coordinate snapping + surface proximity fallback)

Progress: [████████████████████] v1.0-v1.4 complete | v1.5 [██░░░░░░░░] 2/9 plans

## Performance Metrics

**v1.0 Summary:** 33 plans, 12 phases, 2 days
**v1.1 Summary:** 8 plans, 6 phases, 1 day
**v1.2 Summary:** 17 plans, 5 phases + gaps, 2 days
**v1.3 Summary:** 9 plans, 5 phases, 3 days
**v1.4 Summary:** 7 plans, 5 phases, 7 days

## Accumulated Context

### Decisions

| Plan | Decision | Rationale |
|------|----------|-----------|
| 33-01 | Subdirectory output: public/data/{routeId}/ | Enables lazy loading, avoids index collisions, matches ARCHITECTURE.md spec |
| 33-01 | Coordinate-verified sector membership for 100k/50k | [520, NF2266, Doe Lake, Rapid River] -- NOT Bass Lake/NF2217/ND2225 as previously estimated in STACK.md |
| 33-01 | Elevation calibration conditional on elevationTargetRange | Skip threshold scan for 100k/50k; use fixed 2m threshold |
| 33-01 | Consecutive duplicate deduplication in parse-gpx.js | Handles Strava triplicate-start artifact (100k had 51 dupes) |
| 33-02 | Coordinate-based haversine snapping replaces mile-based | Eliminates drift from route length differences across 100mi/100k/50k |
| 33-02 | RidewithGPS proximity fallback (100m threshold) for 100k/50k | No native rwgps JSON available; 100mi track_points used as reference |
| 33-02 | generate-sector-details.js reads from 100mi/annotations.json | Route-agnostic; 100mi has all 7 sectors needed for editorial content |

### Pending Todos

None.

### Blockers/Concerns

- Ojibwe community consultation recommended (cultural sensitivity review)
- Project requires Node >=22.12.0 -- use Volta (`/Users/Sheppardjm/.volta/bin/node`)
- Strava IDs populated for 6/7 segments (Rapid River Truck Trail pending)
- iOS Safari device testing deferred to v1.5+ (requires physical device)
- astro.config.ts site URL is placeholder -- update before deployment
- **[33-01 NEW]** content.config.ts and RouteMap.astro/ElevationProfile.astro reference flat public/data/route-data.json which no longer receives output -- must update to public/data/100mi/route-data.json to restore Astro build
- ~~Surface data gap: 100k/50k lack RidewithGPS JSON; fallback strategy needed~~ RESOLVED in 33-02 (proximity fallback)
- Elevation gains for 100k (~1,616 ft) and 50k (~809 ft) unverified against Strava/Garmin reference recordings

### Tech Debt

All tech debt items from v1.0-v1.4 resolved. No outstanding items.

## Session Continuity

Last session: 2026-04-06T21:47:53Z
Stopped at: Completed 33-02-PLAN.md -- ready to execute 33-03
Resume file: None
