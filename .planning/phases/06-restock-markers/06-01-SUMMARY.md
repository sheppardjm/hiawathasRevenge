---
phase: 06-restock-markers
plan: 01
subsystem: ui
tags: [leaflet, divicon, popup, css, annotations, map-markers]

# Dependency graph
requires:
  - phase: 05-map-elevation-sync
    provides: RouteMap.astro with annotations.json fetch already in place
  - phase: 02-data-pipeline
    provides: annotations.json with restock entries (mile field, lat/lon coords)
provides:
  - Two amber circle markers on the Leaflet map at restock GPS coordinates
  - Click-to-open popups showing stop name and mileage
  - Forest-themed dark popup CSS (forest-900 bg, cream-100 text, forest-700 border)
affects:
  - 09-photos: photo markers will follow same L.divIcon + bindPopup pattern
  - Any phase adding additional map annotation types

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "L.divIcon with named className + :global CSS in <style> block to strip Leaflet white box"
    - "annotations.filter(a => a.type === X) reuse of existing fetch for additional marker types"
    - "zIndexOffset layering: polylines(0) < restock markers(500) < bike crosshair(1000)"
    - ".leaflet-popup.restock-popup compound selector targets Leaflet popup DOM hierarchy"

key-files:
  created: []
  modified:
    - src/components/RouteMap.astro
    - src/styles/global.css

key-decisions:
  - "Named className 'restock-marker' (not empty string '') — enables targeted CSS in global.css; :global() required in <style> to escape Astro scoping"
  - "Use stop.mile field (not stop.mi) — this project's annotation schema uses 'mile', mkUltra uses 'mi'"
  - "zIndexOffset: 500 — above sector polylines (default 0), below bike crosshair (1000)"
  - "CSS custom properties (var(--color-forest-900) etc.) in popup CSS — maintains design token consistency"
  - "Popup CSS placed inside @layer base — participates in cascade layer system, overrides @layer leaflet"

patterns-established:
  - "Pattern: Restock/POI markers via L.divIcon + bindPopup — reusable for photo markers in Phase 9"
  - "Pattern: annotations.filter() reuse — single fetch serves multiple annotation types"
  - "Pattern: .leaflet-popup.className compound selector for themed popups"

# Metrics
duration: 2min
completed: 2026-03-31
---

# Phase 6 Plan 01: Restock Markers Summary

**Two amber circle markers at Camp 7 Lake Campground (Mile 44.7) and Midway General Store (Mile 75.7) with click-to-open forest-themed popups using L.divIcon and bindPopup**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-31T01:11:33Z
- **Completed:** 2026-03-31T01:13:12Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Restock marker loop filters existing annotations.json fetch for `type === 'restock'` — no new fetch needed
- Two amber circle markers (14px, `#c8973e` fill, `#1a2e1a` border, box-shadow) render at correct GPS coordinates
- Click opens popup with `<strong>Name</strong><br>Mile X.X` content styled with forest-900 background, cream-100 text
- `:global(.restock-marker)` CSS strips Leaflet's default white divIcon box from named class
- Three popup CSS rules (content-wrapper, tip, close-button) using design tokens in `@layer base`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add restock marker loop and :global CSS to RouteMap.astro** - `1718449` (feat)
2. **Task 2: Add forest-themed popup CSS to global.css** - `cc94124` (feat)

## Files Created/Modified
- `src/components/RouteMap.astro` - Added restock marker loop (23 lines) after sectors loop; added `:global(.restock-marker)` in `<style>` block
- `src/styles/global.css` - Added 3 `.leaflet-popup.restock-popup` CSS rules inside `@layer base`

## Decisions Made
- Named `className: 'restock-marker'` (not `''`) so future CSS targeting is possible; contrast with bike crosshair which uses `''` because no CSS targeting is ever needed
- `stop.mile` field used (confirmed from annotations.json data shape) — mkUltra reference uses `mi` but this project uses `mile`
- `zIndexOffset: 500` places restock markers above sector polylines (default 0) but below bike crosshair (1000)
- CSS custom properties in global.css popup rules (not hardcoded hex) — maintains design token consistency
- `popupAnchor: [0, -12]` opens popup above marker so tip doesn't overlap the circle

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 6 Plan 01 complete — restock markers implemented
- Phase 6 Plan 02 (if it exists) or Phase 7 can begin
- Photo markers in Phase 9 can follow the identical L.divIcon + bindPopup pattern established here
- The `annotations.filter(a => a.type === X)` pattern is reusable for any new annotation type

---
*Phase: 06-restock-markers*
*Completed: 2026-03-31*
