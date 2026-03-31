---
phase: 00-full-site
plan: 01
subsystem: ui
tags: [astro, leaflet, photoswipe, svg, photos]

# Dependency graph
requires:
  - phase: 08-photo-gallery
    provides: PhotoGallery.astro with PhotoSwipe lightbox
  - phase: 07-photo-pipeline
    provides: photos.json with thumb field containing full /thumbs/... paths
  - phase: 06-restock-markers
    provides: RouteMap.astro restock marker L.divIcon pattern
provides:
  - Photo thumbnails load without 404s (thumb src uses photo.thumb directly)
  - Restock markers render as blue water drop SVG icons (visually distinct from photo markers)
affects: [00-02, 00-03, 00-04, 00-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "photo.thumb used as direct src — field already contains full path, no prefix needed"
    - "Water drop SVG divIcon pattern — inline SVG in L.divIcon html string for custom marker shapes"

key-files:
  created: []
  modified:
    - src/components/PhotoGallery.astro
    - src/components/RouteMap.astro

key-decisions:
  - "photo.thumb field contains /thumbs/filename.webp — use directly, never prepend /thumbs/"
  - "Water drop blue (#4a90d9) chosen for restock markers — immediately distinct from amber (#c8973e/#d4a84e) photo circles"
  - "iconAnchor at bottom-center [10, 26] — pointy end of drop aims at exact map location"

patterns-established:
  - "Direct field usage: when JSON fields contain full paths, use them directly in src attributes"
  - "SVG divIcon: inline SVG in L.divIcon html string enables arbitrary marker shapes without extra assets"

# Metrics
duration: 1min
completed: 2026-03-31
---

# Phase 00 Plan 01: UAT Gap Closure — Photo 404s and Restock Markers Summary

**Fixed photo thumbnail double-prefix 404 (photo.thumb used directly) and replaced amber circle restock markers with blue water drop SVG icons**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-31T17:51:47Z
- **Completed:** 2026-03-31T17:52:43Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Photo gallery thumbnails now load correctly — removed `/thumbs/` prepend that was doubling the path prefix
- Restock markers are now visually distinct blue water drop SVG icons vs amber circle photo markers
- Both marker click actions still work: restock shows popup, photo markers open lightbox

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix photo thumbnail double-prefix 404** - `a1d106b` (fix)
2. **Task 2: Replace restock marker with water drop SVG icon** - `278dc43` (feat)

**Plan metadata:** committed with SUMMARY and STATE update

## Files Created/Modified
- `src/components/PhotoGallery.astro` - Fixed img src to use `photo.thumb` directly (was prepending `/thumbs/` on a field that already contained `/thumbs/...`)
- `src/components/RouteMap.astro` - Replaced amber circle divIcon with blue water drop SVG for restock markers

## Decisions Made
- `photo.thumb` field in photos.json already contains the full path `/thumbs/filename.webp` — only the component had the bug; photos.json was correct and not modified
- Water drop color `#4a90d9` (blue) chosen to be visually distinct from the existing amber photo/restock palette (`#c8973e`, `#d4a84e`)
- `iconAnchor: [10, 26]` places the anchor at the bottom-center of the drop shape so the pointy tip indicates the exact map location
- `popupAnchor: [0, -26]` updated to match the new icon height (was `-12` for the old 18px circle)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Photo gallery fully functional — thumbnails load, lightbox opens on click
- Restock markers visually distinct — water drop blue vs amber photo clusters
- Ready for 00-02 (elevation chart X-axis cap) and remaining UAT gap closure plans

---
*Phase: 00-full-site*
*Completed: 2026-03-31*
