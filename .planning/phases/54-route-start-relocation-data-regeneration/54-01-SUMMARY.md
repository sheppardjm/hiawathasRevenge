---
phase: 54-route-start-relocation-data-regeneration
plan: "01"
subsystem: data-pipeline
tags: [gpx, route-data, photos, migration, pipeline-inputs]
dependency_graph:
  requires: []
  provides: [ROUTE-01, ROUTE-05-input]
  affects: [scripts/match-photos.js, public/data/photos-manifest.json, Munising_Hiawatha_s_Revenge.gpx, Hiawatha_s_Revenge_100k.gpx, Hiawatha_s_Revenge_50K_.gpx]
tech_stack:
  added: []
  patterns: [one-shot-migration-script, esm-node-script]
key_files:
  created:
    - scripts/migrate-photos-mileage.js
  modified:
    - Munising_Hiawatha_s_Revenge.gpx
    - Hiawatha_s_Revenge_100k.gpx
    - Hiawatha_s_Revenge_50K_.gpx
    - scripts/match-photos.js
    - public/data/photos-manifest.json
decisions:
  - "Replace GPX files in-place (keep existing filenames) so route-config.js, routes.json, and index.astro need no changes"
  - "One-shot migration script for photos-manifest.json (Option A: update manifest before pipeline so single pipeline pass suffices)"
  - "OFFSET_MILES=1.59 with NEW_TOTAL_MILES=101.91 (pre-pipeline haversine estimate; modulo wrap needed for 0 entries in this dataset)"
metrics:
  duration: "~1 min"
  completed: "2026-05-29"
  tasks_completed: 3
  files_modified: 5
---

# Phase 54 Plan 01: Pre-Pipeline Input Preparation Summary

All pre-pipeline mutations applied: three alt-start GPX tracks swapped in, match-photos.js legacy path bug fixed, and all 56 photo mileage tags rotated +1.59 mi via one-shot migration script.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Swap in three alt-start GPX tracks | 1f69f44 | Munising_Hiawatha_s_Revenge.gpx, Hiawatha_s_Revenge_100k.gpx, Hiawatha_s_Revenge_50K_.gpx |
| 2 | Fix match-photos.js stale ROUTE_PATH | 0190f7d | scripts/match-photos.js |
| 3 | Create and run migrate-photos-mileage.js | f3a9c01 | scripts/migrate-photos-mileage.js, public/data/photos-manifest.json |

## Verification Results

**Task 1 — GPX coordinates confirmed:**
- `Munising_Hiawatha_s_Revenge.gpx`: first trkpt `lat="46.3477"` (247017 bytes, alt-start)
- `Hiawatha_s_Revenge_100k.gpx`: first trkpt `lat="46.3477"` (148734 bytes, alt-start)
- `Hiawatha_s_Revenge_50K_.gpx`: first trkpt `lat="46.3477"` (72446 bytes, alt-start)
- `Hiawatha_100.gpx` unchanged (7282925 bytes, unrelated artifact)

**Task 2 — ROUTE_PATH fixed:**
- `grep` finds `'public', 'data', '100mi', 'route-data.json'` in match-photos.js
- Old broken form `'public', 'data', 'route-data.json'` no longer present

**Task 3 — Migration verified:**
- Migration script logged: `Entries migrated: 56`, `Offset applied: +1.59 miles (modulo 101.91)`
- Post-migration verify: `OK 56 entries, max mile 101.9`
- No modulo wrap fired (all 5 near-end photos shifted to 100.6–101.9, all below 101.91)
- 5 near-end photos: old miles 99.0/99.1/99.9/100.1/100.3 → new miles 100.6/100.7/101.5/101.7/101.9

## Decisions Made

1. **GPX filenames kept identical** — `Munising_Hiawatha_s_Revenge.gpx`, `Hiawatha_s_Revenge_100k.gpx`, `Hiawatha_s_Revenge_50K_.gpx` — so route-config.js `gpxFile` refs, index.astro download hrefs, and routes.json need no changes.

2. **Option A sequencing (migration before pipeline)** — photos-manifest.json updated first, then pipeline runs once in plan 02 producing correct photos.json without a double-run.

3. **OFFSET_MILES = 1.59** — pre-pipeline haversine estimate (old start at new-course mile 100.32, new total ~101.91). Modulo wrap fires for zero entries in this dataset. Post-pipeline totalMiles from route-data.json may differ slightly; snapByMileage clamps gracefully.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all pipeline inputs are now set for the plan-02 pipeline run.

## Threat Flags

None — no new network surface, auth paths, or trust-boundary changes introduced.

## Self-Check: PASSED

- [x] scripts/migrate-photos-mileage.js exists
- [x] scripts/match-photos.js contains `'100mi', 'route-data.json'`
- [x] Munising_Hiawatha_s_Revenge.gpx starts at 46.3477 (247017 bytes)
- [x] Hiawatha_s_Revenge_100k.gpx starts at 46.3477 (148734 bytes)
- [x] Hiawatha_s_Revenge_50K_.gpx starts at 46.3477 (72446 bytes)
- [x] photos-manifest.json has 56 entries, max mile 101.9, all in range
- [x] Commits 1f69f44, 0190f7d, f3a9c01 exist
