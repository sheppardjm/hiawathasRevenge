---
phase: 54-route-start-relocation-data-regeneration
verified: 2026-05-29T18:00:00Z
status: passed
score: 9/9 must-haves verified
overrides_applied: 0
re_verification: false
---

# Phase 54: Route Start Relocation & Data Regeneration — Verification Report

**Phase Goal:** All three routes start and finish at the new unified staging point (46.34770, -86.72515), and every piece of derived data — route geometry, gravel sector snapping, restock mileages, photo mileage tags, per-route stats, and the downloadable GPX files — accurately reflects the rotated course.
**Verified:** 2026-05-29T18:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Three repo-root GPX files start at lat 46.3477, -86.7251 | VERIFIED | `grep -m1 lat="46.3477"` confirmed on all three; byte sizes match alt-start: 247017 / 148734 / 72446; trkpt counts: 2676 / 1616 / 787 |
| 2 | match-photos.js reads per-route `100mi/route-data.json`, not the stale legacy root path | VERIFIED | Line 23: `const ROUTE_PATH = resolve(ROOT, 'public', 'data', '100mi', 'route-data.json')` — old form absent |
| 3 | 56 photos-manifest.json mileage tags rotated +1.59 mi, all in range [0, 101.91] | VERIFIED | 56 entries, max mile 101.9, min mile 3.8, 0 out-of-range entries |
| 4 | Pipeline regenerates all derived JSON end-to-end with no errors | VERIFIED | Git commit 13179b1 records pipeline exit 0; all 9 per-route JSON files present, timestamped 2026-05-29; original point count 2676 in 100mi meta confirms alt-start GPX consumed |
| 5 | Gravel sectors re-snap: 8 on 100mi, 5 on 100k, 4 on 50k, all startIdx < endIdx | VERIFIED | annotations.json sector entries: 100mi=8, 100k=5, 50k=4; all 17 sectors pass startIdx < endIdx check; sector-elevations.json sector counts: 8/5/4 |
| 6 | Restock mileages (Camp 7, Midway) re-derived in 100mi annotations.json | VERIFIED | restock-camp7 mile=42.69, restock-midway mile=74.22 in `public/data/100mi/annotations.json`; route-config.js RESTOCK_DEFS synced to same values |
| 7 | Per-route stats in routes.json fall in expected ranges | VERIFIED | 100mi: 101.91 mi / 2288 ft; 100k: 60.78 mi / 1535 ft; 50k: 30.02 mi / 747 ft; elevationTargetRange [2123, 2411] unchanged (IN RANGE at threshold=2.5m) |
| 8 | Served public/*.gpx downloads are the alt-start tracks starting at 46.3477 | VERIFIED | All three `public/*.gpx` first trkpt confirmed at `lat="46.3477"` |
| 9 | photos.json has 56 entries with snapped lat/lon coordinates on new course geometry | VERIFIED | 56 entries, all with lat/lon, max mile 101.91, all coordinates within Upper Peninsula region (lat 46.04–46.38, lon -86.78 to -86.42), 0 out-of-range |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `Munising_Hiawatha_s_Revenge.gpx` (repo root) | 100mi alt-start GPX, 2676 trkpts, first trkpt lat=46.3477 | VERIFIED | 247017 bytes, 2676 trkpts, first trkpt lat="46.3477" |
| `Hiawatha_s_Revenge_100k.gpx` (repo root) | 100k alt-start GPX, 1616 trkpts | VERIFIED | 148734 bytes, 1616 trkpts, first trkpt lat="46.3477" |
| `Hiawatha_s_Revenge_50K_.gpx` (repo root) | 50k alt-start GPX, 787 trkpts | VERIFIED | 72446 bytes, 787 trkpts, first trkpt lat="46.3477" |
| `scripts/migrate-photos-mileage.js` | One-shot migration; contains OFFSET_MILES; ≥30 lines | VERIFIED | 51 lines; OFFSET_MILES=1.59, NEW_TOTAL_MILES=101.91; proper ESM structure with try/catch, readFileSync/writeFileSync |
| `public/data/photos-manifest.json` | 56 rotated entries, max mile ~101.9 | VERIFIED | 56 entries, max mile 101.9, min mile 3.8, 0 out-of-range |
| `public/data/routes.json` | Per-route stats for all 3 routes | VERIFIED | 3 routes present (100mi/100k/50k) with totalMiles and elevationGainFeet |
| `public/data/100mi/annotations.json` | Sectors + restock-camp7 + restock-midway | VERIFIED | 10 entries, 8 sectors, restock-camp7 mile=42.69, restock-midway mile=74.22 |
| `public/data/100mi/route-data.json` | 451 simplified pts, first pt at 46.3477 | VERIFIED | points[0]={lat:46.3477,lon:-86.7251,ele:314.6,miles:0}; meta.totalMiles=101.91, meta.pointCount=451, meta.originalPointCount=2676 |
| `public/data/100k/route-data.json` | First pt at 46.3477, totalMiles ~60.78 | VERIFIED | points[0]={lat:46.3477,lon:-86.72515}; meta.totalMiles=60.78 |
| `public/data/50k/route-data.json` | First pt at 46.3477, totalMiles ~30.02 | VERIFIED | points[0]={lat:46.3477,lon:-86.72515}; meta.totalMiles=30.02 |
| `public/data/100mi/sector-elevations.json` | 8 sector entries | VERIFIED | 8 sector keys |
| `public/data/100k/sector-elevations.json` | 5 sector entries | VERIFIED | 5 sector keys |
| `public/data/50k/sector-elevations.json` | 4 sector entries | VERIFIED | 4 sector keys |
| `public/data/photos.json` | 56 entries with lat/lon snapped to new course | VERIFIED | 56 entries, all with lat/lon, miles 3.79–101.91, 0 out-of-range |
| `public/Munising_Hiawatha_s_Revenge.gpx` | Served alt-start GPX, first trkpt lat=46.3477 | VERIFIED | lat="46.3477" confirmed |
| `public/Hiawatha_s_Revenge_100k.gpx` | Served alt-start GPX, first trkpt lat=46.3477 | VERIFIED | lat="46.3477" confirmed |
| `public/Hiawatha_s_Revenge_50K_.gpx` | Served alt-start GPX, first trkpt lat=46.3477 | VERIFIED | lat="46.3477" confirmed |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/match-photos.js` | `public/data/100mi/route-data.json` | `ROUTE_PATH` constant (line 23) | WIRED | `resolve(ROOT, 'public', 'data', '100mi', 'route-data.json')` — old stale path form absent |
| `scripts/migrate-photos-mileage.js` | `public/data/photos-manifest.json` | `readFileSync` + `writeFileSync` | WIRED | Reads and writes `photos-manifest.json`; 56 entries confirmed rotated |
| `public/data/100mi/annotations.json` | new 100mi course geometry | coordinate haversine snap in `resolve-annotations.js` | WIRED | restock-camp7 mile=42.69, restock-midway mile=74.22 match expected new-course positions; 8 sectors snapped with valid indices |
| `public/Munising_Hiawatha_s_Revenge.gpx` | repo-root `Munising_Hiawatha_s_Revenge.gpx` | `copy-gpx.js` pipeline step | WIRED | Both repo-root and served file confirm lat="46.3477" at first trkpt |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `public/data/100mi/route-data.json` | `points[]`, `meta` | Pipeline parses `Munising_Hiawatha_s_Revenge.gpx` (2676 trkpts) | Yes — `meta.originalPointCount=2676`, `points[0].lat=46.3477` | FLOWING |
| `public/data/100mi/annotations.json` | sector entries, restock entries | `resolve-annotations.js` haversine snap against route-data.json | Yes — 8 sectors with valid indices, restock miles from live snap | FLOWING |
| `public/data/photos.json` | photo markers with lat/lon/mile | `match-photos.js` snaps `photos-manifest.json` to route-data.json geometry | Yes — 56 entries with coordinates in correct region, miles 3.79–101.91 | FLOWING |
| `public/data/routes.json` | per-route `totalMiles`, `elevationGainFeet` | Pipeline aggregates from per-route meta | Yes — 101.91/60.78/30.02 mi, 2288/1535/747 ft | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All three repo-root GPX start at 46.3477 | `grep -m1 lat= *.gpx` | lat="46.3477" × 3 | PASS |
| photos-manifest.json 56 entries in range | `node -e "m.length, max mile"` | count=56, max=101.9 | PASS |
| 100mi route-data.json first point at new start | `node -e "rd.points[0]"` | lat:46.3477, miles:0 | PASS |
| Sector counts 8/5/4, all startIdx < endIdx | `node -e "checkIndexOrder()"` | 0 violations across all 17 sectors | PASS |
| restock-camp7 and restock-midway in annotations | `node -e "annotations filter"` | mile=42.69 and mile=74.22 | PASS |
| photos.json 56 snapped entries with lat/lon | `node -e "photos count + region check"` | 56 entries, 0 outside region | PASS |
| Public served GPX start at 46.3477 | `grep -m1 lat= public/*.gpx` | lat="46.3477" × 3 | PASS |

---

### Probe Execution

No probe scripts (`.sh`) were declared in plan frontmatter or found in `scripts/*/tests/`. The integration gate was `npm run build`, which is a build-time verification. The executor recorded exit 0 at commit `dea93df`. Two subsequent commits are docs-only (`docs(54-02)`, `docs(54)`); no data or build files were changed after the build confirmation. Build gate accepted as PASS.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ROUTE-01 | 54-01 | Three route GPX files replaced with new alt-start tracks at 46.34770, -86.72515 | SATISFIED | Repo-root GPX files: 2676/1616/787 trkpts, all first trkpt lat="46.3477", sizes match alt-start sources |
| ROUTE-02 | 54-02 | Build pipeline runs end-to-end, npm run build green | SATISFIED | Pipeline exit 0 at commit 13179b1; `npm run build` exit 0 at commit dea93df; all 12 derived JSON files timestamped 2026-05-29 |
| ROUTE-03 | 54-02 | Sectors re-snap: 8 on 100mi, 5 on 100k, 4 on 50k; valid index ordering | SATISFIED | sector entries in annotations.json: 8/5/4; all 17 sectors pass startIdx < endIdx; sector-elevations.json: 8/5/4 entries |
| ROUTE-04 | 54-02 | Restock mileages (Camp 7, Midway) re-derived in annotations.json; route-config comments synced | SATISFIED | restock-camp7 mile=42.69, restock-midway mile=74.22 in annotations.json; route-config.js RESTOCK_DEFS synced |
| ROUTE-05 | 54-01 | Photo mileage tags re-validated against new course | SATISFIED | photos-manifest.json: 56 entries, max 101.9, 0 out-of-range; photos.json: 56 entries with lat/lon snapped to new geometry, miles 3.79–101.91 |
| ROUTE-06 | 54-02 | Per-route stats reflect new tracks; elevationTargetRange validated | SATISFIED | routes.json: 100mi=101.91mi/2288ft, 100k=60.78mi/1535ft, 50k=30.02mi/747ft; elevationTargetRange [2123,2411] unchanged (IN RANGE at 2288ft) |
| ROUTE-07 | 54-02 | User-downloadable GPX files served by site are new alt-start tracks | SATISFIED | public/Munising_Hiawatha_s_Revenge.gpx, public/Hiawatha_s_Revenge_100k.gpx, public/Hiawatha_s_Revenge_50K_.gpx all confirm lat="46.3477" |

All 7 requirements from REQUIREMENTS.md Phase 54 traceability table are accounted for and satisfied. No orphaned requirements.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | No TBD/FIXME/XXX markers found in modified scripts; no TODO/HACK/PLACEHOLDER markers found |

**Debt marker scan:** Clean. No blocking or warning markers in `scripts/migrate-photos-mileage.js`, `scripts/match-photos.js`, or `scripts/route-config.js`.

**Notes on sector-520 endMile:0 in sector-details.json:** This value was present in the previous commit as well — it is a pre-existing pipeline convention for the wrap-around sector that physically ends at/near the course start/finish on this loop course. The `startIdx=435 < endIdx=450` index check passes correctly. The build accepts this value without schema errors.

---

### Human Verification Required

None. All success criteria for this build-time data-regeneration phase are verifiable programmatically via file inspection and data assertions. The Astro build smoke test was run at executor time (commit `dea93df`), and the only two subsequent commits are documentation-only with no impact on build or data artifacts.

---

## Gaps Summary

No gaps. All 9 must-have truths verified, all 7 requirements satisfied, all required artifacts exist with substantive content, all key links confirmed wired, data flows end-to-end from alt-start GPX through pipeline to derived JSON and served downloads. Phase goal is fully achieved in the codebase.

---

_Verified: 2026-05-29T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
