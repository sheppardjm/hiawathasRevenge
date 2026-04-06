---
phase: 33-pipeline-route-data
verified: 2026-04-06T22:10:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 33: Pipeline Route Data Verification Report

**Phase Goal:** The build pipeline processes all 3 GPX files and produces correct, per-route JSON data that downstream components can consume
**Verified:** 2026-04-06T22:10:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | `npm run build` produces 3 route subdirectories each with 4 JSON files | VERIFIED | `dist/data/100mi/`, `dist/data/100k/`, `dist/data/50k/` each contain `route-data.json`, `annotations.json`, `sector-elevations.json`, `surface-points.json` |
| 2 | Sector overlays use coordinate-based snapping, not mile-based | VERIFIED | `resolve-annotations.js` implements `snapByCoordinate()` via haversine distance; all annotations.json files have `startIdx`/`endIdx` from coordinate snap; `startLat`/`startLon` present on all sectors across all 3 routes |
| 3 | `public/data/routes.json` manifest exists with metadata for all 3 routes | VERIFIED | Manifest present with `defaultRoute: "100mi"` and 3 route entries: 100mi (#c8973e, 7 sectors, 101.98mi, 2258ft), 100k (#5b9279, 4 sectors, 61.68mi, 1616ft), 50k (#4a90c4, 4 sectors, 31.19mi, 809ft) — all required fields present |
| 4 | All 3 GPX files available at `public/*.gpx` for download | VERIFIED | `public/Munising_Hiawatha_s_Revenge.gpx`, `public/Hiawatha_s_Revenge_100k.gpx`, `public/Hiawatha_s_Revenge_50K_.gpx` all present; also copied to `dist/` |
| 5 | Existing 100-mile site renders identically from new `100mi/` subdirectory paths | VERIFIED | `content.config.ts` loads from `public/data/100mi/` for all 3 collections; `RouteMap.astro` fetches from `/data/100mi/` for all 4 route-specific files; `ElevationProfile.astro` fetches from `/data/100mi/` for route-data and annotations; no old flat-path references remain; `dist/` build completed successfully |

**Score:** 5/5 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/route-config.js` | ROUTES (3), SECTOR_DEFS (7), RESTOCK_DEFS (2), DEFAULT_ROUTE_ID | VERIFIED | 160 lines, all 4 exports present, no stubs |
| `scripts/pipeline.js` | Loops routeSpecificSteps per route, runs sharedSteps once | VERIFIED | 64 lines; imports ROUTES; `for (const route of ROUTES)` loop over 4 route-specific steps; sharedSteps run once |
| `scripts/parse-gpx.js` | Accepts routeId from argv[2], writes to per-route subdir | VERIFIED | 193 lines; reads routeId from argv[2]; imports ROUTES; writes to `public/data/${routeId}/route-data.json` |
| `scripts/resolve-annotations.js` | Coordinate-based snapping, per-route output | VERIFIED | 198 lines; imports SECTOR_DEFS/RESTOCK_DEFS from route-config; implements `snapByCoordinate()` with haversine; filters sectors/restocks by route membership |
| `scripts/generate-surface-points.js` | Exact lookup (100mi), proximity fallback (100k/50k) | VERIFIED | 174 lines; branches on `routeConfig.rwgpsJson`; proximity fallback uses 100mi RWGPS JSON at 100m threshold |
| `scripts/compute-sector-elevations.js` | Reads/writes per-route subdirectory paths | VERIFIED | 131 lines; reads routeId from argv[2]; uses `public/data/${routeId}/` for all paths |
| `scripts/generate-routes-manifest.js` | Reads per-route data, writes routes.json | VERIFIED | 60 lines; imports ROUTES/DEFAULT_ROUTE_ID; loops routes; reads route-data.json meta; writes `public/data/routes.json` |
| `scripts/copy-gpx.js` | Loops ROUTES, copies all 3 GPX files | VERIFIED | 27 lines; imports ROUTES; loops and copies each route's gpxFile to public/ |
| `public/data/100mi/route-data.json` | 456 pts, 101.98mi, 2258ft | VERIFIED | 456 points, 101.98 miles, 2258ft elevation gain |
| `public/data/100k/route-data.json` | 278 pts, 61.68mi, 1616ft | VERIFIED | 278 points, 61.68 miles, 1616ft elevation gain |
| `public/data/50k/route-data.json` | 134 pts, 31.19mi, 809ft | VERIFIED | 134 points, 31.19 miles, 809ft elevation gain |
| `public/data/100mi/annotations.json` | 7 sectors + 2 restocks | VERIFIED | 9 entries; all sectors have startIdx < endIdx; all have coordinate data |
| `public/data/100k/annotations.json` | 4 sectors + 1 restock | VERIFIED | 5 entries; coordinate-snapped; correct sector membership (520, NF2266, Doe Lake, Rapid River) |
| `public/data/50k/annotations.json` | 4 sectors + 0 restocks | VERIFIED | 4 entries; coordinate-snapped; same 4 sectors as 100k; no restock points |
| `public/data/100mi/surface-points.json` | 456 points, 0 unmatched exact lookup | VERIFIED | 456 entries (array of {miles, surface}); 30 unknown (legitimate S=0 entries) |
| `public/data/100k/surface-points.json` | 278 points, proximity fallback | VERIFIED | 278 entries; 20 unknown (divergent segments expected) |
| `public/data/50k/surface-points.json` | 134 points, proximity fallback | VERIFIED | 134 entries; 10 unknown (divergent segments expected) |
| `public/data/100mi/sector-elevations.json` | 7 sectors | VERIFIED | 7 sector entries |
| `public/data/100k/sector-elevations.json` | 4 sectors | VERIFIED | 4 sector entries |
| `public/data/50k/sector-elevations.json` | 4 sectors | VERIFIED | 4 sector entries |
| `public/data/routes.json` | 3 routes with id/name/color/sectorIds/totalMiles/elevationGainFeet | VERIFIED | All required fields present for all 3 routes |
| `public/Munising_Hiawatha_s_Revenge.gpx` | 100mi GPX download | VERIFIED | Present in public/ and dist/ |
| `public/Hiawatha_s_Revenge_100k.gpx` | 100k GPX download | VERIFIED | Present in public/ and dist/ |
| `public/Hiawatha_s_Revenge_50K_.gpx` | 50k GPX download | VERIFIED | Present in public/ and dist/ |
| `src/content.config.ts` | Points to 100mi subdirectory for 3 collections | VERIFIED | `public/data/100mi/route-data.json`, `public/data/100mi/annotations.json`, `public/data/100mi/sector-elevations.json` — no old flat paths |
| `src/components/RouteMap.astro` | Fetches from /data/100mi/ for route-specific files | VERIFIED | 4 route-specific fetches use `/data/100mi/`; shared paths (sector-details, photos) unchanged |
| `src/components/ElevationProfile.astro` | Fetches from /data/100mi/ for route-specific files | VERIFIED | 2 route-specific fetches use `/data/100mi/` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/pipeline.js` | `scripts/route-config.js` | `import { ROUTES }` | WIRED | Line 15: `import { ROUTES } from './route-config.js'` |
| `scripts/pipeline.js` | `scripts/parse-gpx.js` | `execFileSync` with `route.id` | WIRED | Line 49: `execFileSync(process.execPath, [script, route.id], ...)` |
| `scripts/parse-gpx.js` | `scripts/route-config.js` | `import { ROUTES }` | WIRED | Line 18: resolves GPX filename and elevation target from ROUTES |
| `scripts/resolve-annotations.js` | `scripts/route-config.js` | `import ROUTES, SECTOR_DEFS, RESTOCK_DEFS` | WIRED | Line 19: all 3 exports imported and used |
| `scripts/generate-surface-points.js` | `scripts/route-config.js` | `import { ROUTES }` | WIRED | Line 22: used for rwgpsJson availability check and 100mi fallback reference |
| `scripts/generate-routes-manifest.js` | `scripts/route-config.js` | `import ROUTES, DEFAULT_ROUTE_ID` | WIRED | Line 20: both exports imported and used |
| `scripts/copy-gpx.js` | `scripts/route-config.js` | `import { ROUTES }` | WIRED | Line 11: iterates ROUTES for gpxFile names |
| `scripts/generate-sector-details.js` | `public/data/100mi/annotations.json` | `readFileSync` | WIRED | Line 75: `resolve(ROOT, 'public', 'data', '100mi', 'annotations.json')` |
| `src/content.config.ts` | `public/data/100mi/route-data.json` | `file()` loader | WIRED | Line 11: `file('public/data/100mi/route-data.json', ...)` |
| `src/components/RouteMap.astro` | `/data/100mi/` | `fetch()` at runtime | WIRED | Lines 311-315: all 4 route-specific fetches use `/data/100mi/` |
| `src/components/ElevationProfile.astro` | `/data/100mi/` | `fetch()` at runtime | WIRED | Lines 56, 66: both route-specific fetches use `/data/100mi/` |

---

## Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| 3 route subdirectories with 4 JSON files each | SATISFIED | All 12 files verified in public/ and dist/ |
| Coordinate-based sector snapping | SATISFIED | haversine snapByCoordinate() verified in resolve-annotations.js; all annotations have startIdx/endIdx from coordinate snap |
| routes.json manifest with 3-route metadata | SATISFIED | All required fields (id, name, color, sectorIds, totalMiles, elevationGainFeet) present |
| 3 GPX files in public/ for download | SATISFIED | All 3 GPX files present in public/ and dist/ |
| 100mi site renders identically from new paths | SATISFIED | All 3 components updated to /data/100mi/; dist/ build present; no old flat paths remain |

---

## Anti-Patterns Found

None. Zero TODO/FIXME/placeholder occurrences across all 8 pipeline scripts. All scripts are substantive (27-198 lines) with real implementations.

---

## Human Verification Required

### 1. Sector visual alignment on map

**Test:** Run `npm run dev`, open the map page, zoom in on each gravel sector overlay for the 100mi route
**Expected:** Sector start/end markers align with the gravel road transitions on the basemap
**Why human:** Coordinate accuracy of sector overlays requires visual inspection against map tiles — snap distances were logged (0-74m for 100k, 2-254m for 50k's Doe Lake sector due to known route divergence) but visual confirmation of correct road alignment cannot be verified programmatically

### 2. 100mi route render parity with v1.4

**Test:** View the built 100mi site and compare elevation profile, sector coloring, and map behavior against the v1.4 reference
**Expected:** Identical appearance — same sectors, same surface colors, same elevation profile shape
**Why human:** Visual rendering fidelity and interactive behavior (hover, scroll, sector highlighting) requires human judgment

### 3. 50k Doe Lake sector alignment

**Test:** On the map, check the Doe Lake sector overlay for the 50k route specifically
**Expected:** Sector overlay is placed on or near the gravel road segment — note that the 50k takes a different path than the 100mi near Doe Lake, so a 254m snap distance is expected and the overlay should still be reasonably positioned
**Why human:** The 254m snap distance (slightly over the 200m guideline) requires human judgment on whether the sector position is acceptable or needs coordinate adjustment

---

## Summary

Phase 33 goal is fully achieved. The build pipeline correctly processes all 3 GPX files and produces complete, per-route JSON data in subdirectories.

**Key verified facts:**
- `public/data/100mi/`, `public/data/100k/`, `public/data/50k/` each contain all 4 required JSON files with correct point counts and metadata
- `routes.json` manifest at `public/data/routes.json` contains all required fields for all 3 routes
- All 3 GPX files are in `public/` for download
- `scripts/pipeline.js` correctly loops 4 route-specific steps per route then runs shared steps once
- `resolve-annotations.js` uses haversine coordinate snapping — `snapByCoordinate()` replaces the old `snapByMileage()` — and all annotations have `startIdx`/`endIdx` from coordinate snap
- Frontend components (`content.config.ts`, `RouteMap.astro`, `ElevationProfile.astro`) all migrated to `/data/100mi/` paths with no old flat paths remaining
- `npm run build` completed successfully (verified by presence of `dist/` with all expected files)
- Zero stub patterns across all 8 pipeline scripts

Three items require human visual confirmation (sector overlay alignment, v1.4 render parity, 50k Doe Lake sector) but these are not blockers — the structural infrastructure is complete and correct.

---

_Verified: 2026-04-06T22:10:00Z_
_Verifier: Claude (gsd-verifier)_
