# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-06)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.
**Current focus:** v1.5 Multi-Route Support -- gap closure (Phase 37 added)

## Current Position

Phase: 37 of 37 (Panel Auto-Close & Sector Data Fix)
Plan: 1 of 1 in current phase
Status: Phase complete -- v1.5 milestone fully complete
Last activity: 2026-04-06 -- Completed 37-01-PLAN.md (all tasks including checkpoint bug fix)

Progress: [████████████████████] v1.0-v1.4 complete | v1.5 [██████████] 10/10 plans complete

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
| 33-03 | routes.json manifest includes shortName, gpxFile, color, totalMiles, elevationGainFeet, sectorIds | Provides everything a route switcher needs without additional lookups |
| 33-03 | sector-details.json and photos.json remain at flat /data/ paths | Not per-route; sector-details is route-agnostic, photos matched to 100mi |
| 33-03 | content.config.ts Astro collections point to 100mi subdirectory | Primary route for SSG build; 100mi is default/display route |
| 34-01 | sector-details.json fetched once in initMap() (not renderRoute) | Route-agnostic; no need to re-fetch on route switch |
| 34-01 | updateLabelVisibility() uses opacity toggle not add/remove | Labels stay in activeRouteGroup across zoom changes; avoids re-add complexity |
| 34-02 | RouteSelector is plain DOM element (not L.Control) | Enables true top-center positioning; L.Control confined to corner divs |
| 34-02 | Ghost polylines created AFTER renderRoute('100mi') | Map needs valid pixel bounds from fitBounds before Leaflet _clipPoints |
| 34-02 | Ghost polylines on map directly (not activeRouteGroup) with bringToBack | Persist across route switches; bringToBack for z-order behind active route |
| 34-02 | ElevationProfile updateChart uses chart.update('none') | Instant in-place data swap without animation; preserves crosshair annotation |
| 35-01 | window.__activeRouteId set before route:change dispatch | Global available to any post-init sync even if dispatch is synchronous |
| 35-01 | Post-init sync only corrects non-100mi routes | 100mi is correct initChart() default; no redundant re-fetch needed |
| 35-01 | RouteStats uses Astro getEntry for SSG + script for runtime updates | Build-time HTML valid for 100mi; runtime script corrects on route switch |
| 35-02 | routesManifest frontmatter import (build-time) for comparison grid | Comparison cards are static HTML; no runtime fetch needed |
| 35-02 | --route-color CSS custom property per card drives active border | Pure-CSS active color without JS color lookup |
| 35-02 | Comparison highlight consolidated into existing route:change listener | Avoids duplicate listeners; single handler updates both hero stats and comparison grid |
| 36-01 | history.replaceState (not location.hash) for hash writes | Prevents hashchange event cascade on every route switch |
| 36-01 | initialRouteId const inside initMap() -- no module scope lift needed | Naturally in scope for selector loop, renderRoute(), updateGhostVisibility() calls |
| 36-01 | GPX link default stays static (100mi); route:change updates it dynamically | route:change always fires before user can scroll to download section |
| 37-01 | Panel close check at step 1.5 (before clearActiveRoute) | clearActiveRoute() nulls activeSector — any check after is dead code |
| 37-01 | keepPanelSectorId pattern for shared-sector panel persistence | Save sector ID before clearActiveRoute(), restore activeSector reference + highlight after sector overlay rebuild |
| 37-01 | route-config.js SECTOR_DEFS is canonical sector name source | Pipeline propagates to all generated JSON; single source of truth |

### Pending Todos

None.

### Blockers/Concerns

- Ojibwe community consultation recommended (cultural sensitivity review)
- Project requires Node >=22.12.0 -- use Volta (`/Users/Sheppardjm/.volta/bin/node`)
- Strava IDs: all 7/7 segments complete (Ridge Rd segment 41188200 wired in Phase 37)
- iOS Safari device testing deferred to v1.5+ (requires physical device)
- astro.config.ts site URL is placeholder -- update before deployment
- Elevation gains for 100k (~1,616 ft) and 50k (~809 ft) unverified against Strava/Garmin reference recordings

### Tech Debt

All tech debt items from v1.0-v1.4 resolved. No outstanding items.

## Session Continuity

Last session: 2026-04-06
Stopped at: 37-01 fully complete (all tasks including checkpoint bug fix)
Resume file: None
