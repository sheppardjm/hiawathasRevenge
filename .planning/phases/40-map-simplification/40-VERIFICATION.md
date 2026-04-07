---
phase: 40-map-simplification
verified: 2026-04-07T12:10:00Z
status: passed
score: 4/4 must-haves verified
---

# Phase 40: Map Simplification — Verification

**Phase Goal:** Visitors see a clean, readable route map with gravel sectors visually distinct from other road — no confusing multi-color surface legend
**Verified:** 2026-04-07T12:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Must-Haves Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Two colors only (forest900 road + amber500 sectors) | VERIFIED | Line 572-578: `L.polyline(latlngs, { color: forest900 ... })` for route base; line 586: `color: SECTOR_COLOR.line` (amber500) for sector overlays. No other polyline color exists for the active route. |
| 2 | No surface-type legend or color key | VERIFIED | `grep -c "SURFACE_COLORS\|drawSurfacePolyline\|surface-points.json"` returns 0. No "legend", "color key", or "MapLegend" elements exist anywhere in `src/components/`. |
| 3 | Consistent across all three routes (100mi, 100k, 50k) | VERIFIED | `renderRoute(routeId)` is a single generic function with no route-specific conditionals on color. Called identically for 100mi, 100k, and 50k via the route selector (lines 707-718). Routes.json confirms all three route IDs exist. |
| 4 | Ghost polylines visible at 0.2 opacity | VERIFIED | Lines 800-813: ghost polylines created for every route in `routesManifest.routes`, each with `opacity: 0.2`. `updateGhostVisibility()` sets inactive routes to opacity 0.2 and active route ghost to opacity 0. Ghost polylines use `route.color` (per-route branding, distinct from road/sector colors), which is intentional — they are subordinate background context, not part of the active route's two-color scheme. |

## Build Verification

Build succeeded with no errors:

```
12:09:51 [build] 2 page(s) built in 1.44s
12:09:51 [build] Complete!
```

One informational WARN (`No API Route handler for GET /api/save-manifest`) is pre-existing and unrelated to this phase.

## Artifact Verification

| Artifact | Level 1: Exists | Level 2: Substantive | Level 3: Wired | Status |
|----------|----------------|---------------------|---------------|--------|
| `src/components/RouteMap.astro` | EXISTS (846 lines) | SUBSTANTIVE — real Leaflet rendering logic, no stubs | WIRED — used by index.astro; rendering logic invoked by `renderRoute()` on route switch | VERIFIED |

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `renderRoute()` | Single-color base polyline | `activeRouteGroup.addLayer(L.polyline(latlngs, ...))` | WIRED | Line 572: `color: forest900`, no surface-conditional branching |
| Sector overlay step 5 | Amber sector polylines | `color: SECTOR_COLOR.line` | WIRED | Lines 586-588: visible poly and ghost poly both use `SECTOR_COLOR.line` (amber500) |
| `updateGhostVisibility()` | Inactive route ghosts at 0.2 opacity | `ghost.setStyle({ opacity: ... })` | WIRED | Line 675: inactive routes set to 0.2, active set to 0 |

## Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| MAP-01 (two-color route rendering) | SATISFIED | forest900 base + amber500 sector overlays, no multi-color surface logic |
| MAP-02 (no surface legend) | SATISFIED | Zero legend elements; surface-points.json fetch removed; SURFACE_COLORS constant removed |

## Anti-Patterns Found

None. No TODO/FIXME/placeholder patterns in `RouteMap.astro`. No stub implementations detected.

## Summary

Phase 40 goal is fully achieved. The active route renders as exactly two colors: `forest900` (dark green) for the base road polyline and `amber500` for gravel sector overlays. The prior multi-color surface system (`SURFACE_COLORS`, `drawSurfacePolyline`, `surface-points.json` fetch) has been entirely removed — confirmed by grep count of 0. The `renderRoute()` function applies these colors uniformly to all three routes (100mi, 100k, 50k) with no route-specific color conditionals. Ghost polylines for inactive routes are present at opacity 0.2, using per-route branding colors as subordinate visual context. The build completes cleanly.

## Gaps

None.

## Human Verification

The following items cannot be verified programmatically and should be visually confirmed in-browser:

1. **Two-color contrast is readable against CyclOSM tiles**
   - Test: Load the site, scroll to the map, observe the 100mi route
   - Expected: Dark green road track clearly distinct from amber gravel sectors; both legible on the tile background
   - Why human: Color contrast against a dynamic tile layer cannot be verified statically

2. **Ghost routes appear subdued on route switch**
   - Test: Switch between 100mi, 100k, and 50k via the route selector
   - Expected: Inactive routes appear as faint background traces; active route is clearly foregrounded
   - Why human: Visual subordination (0.2 opacity on real tiles) requires human judgment

---

_Verified: 2026-04-07T12:10:00Z_
_Verifier: Claude (gsd-verifier)_
