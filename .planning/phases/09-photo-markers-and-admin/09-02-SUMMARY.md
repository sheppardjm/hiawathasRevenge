---
phase: 09-photo-markers-and-admin
plan: 02
subsystem: ui
tags: [leaflet, markercluster, photoswipe, customevent, clustering, map, lightbox]

# Dependency graph
requires:
  - phase: 07-photo-pipeline
    provides: photos.json with lat/lon/mile/filename/thumb fields for each photo
  - phase: 08-photo-gallery
    provides: PhotoGallery.astro with PhotoSwipe lightbox and #photo-gallery DOM element
  - phase: 03-route-map
    provides: RouteMap.astro with Leaflet map, initMap() structure, and module-scope pattern
requires:
  - phase: 08-photo-gallery
    provides: PhotoGallery.astro with PhotoSwipe lightbox — module-scope lightbox variable needed
  - phase: 07-photo-pipeline
    provides: photos.json with lat/lon coordinates for marker placement
provides:
  - RouteMap.astro — photo cluster marker layer using leaflet.markercluster with map:photoClick event dispatch
  - PhotoGallery.astro — map:photoClick event listener that opens PhotoSwipe lightbox to clicked photo index
  - Cross-component event bridge: RouteMap -> window CustomEvent -> PhotoGallery
affects: [09-admin, any future map feature that adds marker layers]

# Tech tracking
tech-stack:
  added:
    - leaflet.markercluster@1.5.3
    - "@types/leaflet.markercluster@1.5.6 (devDependency)"
  patterns:
    - "window.L = L before dynamic import of UMD markercluster plugin — plugin reads global L during module evaluation"
    - "Static CSS imports (MarkerCluster.css, MarkerCluster.Default.css) in script block — Vite bundles at build time"
    - "window CustomEvent bus (map:photoClick) for cross-component communication between Leaflet map and PhotoSwipe"
    - "Module-scope lightbox variable accessible from both gallery init and window event listener"
    - "if (photosData.length > 0) guard — prevents empty cluster group when photos.json is []"
    - "zIndexOffset layering: polylines(0) < restock(500) < photo markers(750) < bike crosshair(1000)"

key-files:
  created: []
  modified:
    - src/components/RouteMap.astro
    - src/components/PhotoGallery.astro
    - package.json
    - package-lock.json

key-decisions:
  - "window.L = L MUST be set before await import('leaflet.markercluster/dist/leaflet.markercluster-src.js') — the UMD bundle reads window.L at parse time"
  - "L.markerClusterGroup (lowercase m, factory function) — NOT L.MarkerClusterGroup"
  - "leaflet.markercluster-src.js (unminified) used for dynamic import — attaches to window.L at evaluation"
  - "photoIndex in map:photoClick CustomEvent maps to photos.json array index, which matches DOM order of <a> elements in gallery"
  - "loadAndOpen requires explicit { gallery: galleryEl } second argument for DOM-connected galleries"
  - "Photo marker color #d4a84e (amber-400) vs restock marker #c8973e (amber-500) — visual distinction on map"

patterns-established:
  - "Cross-component event bridge via window CustomEvent: RouteMap dispatches, PhotoGallery listens"
  - "Module-scope variable pattern for lightbox enables access from both initialization context and event handler context"

# Metrics
duration: 4min
completed: 2026-03-31
---

# Phase 9 Plan 02: Photo Cluster Markers + Lightbox Bridge Summary

**leaflet.markercluster photo layer on RouteMap with window CustomEvent bridge opening PhotoSwipe lightbox in PhotoGallery at the clicked photo's index**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-31T15:35:42Z
- **Completed:** 2026-03-31T15:39:48Z
- **Tasks:** 2
- **Files modified:** 4 (RouteMap.astro, PhotoGallery.astro, package.json, package-lock.json)

## Accomplishments
- Installed leaflet.markercluster with static CSS imports bundled by Vite
- Added photo cluster layer to RouteMap.astro — markers rendered at lat/lon from photos.json with correct zIndexOffset layering
- Wired map:photoClick CustomEvent bridge: marker click → window event → PhotoGallery lightbox opens at exact photo
- Module-scope lightbox variable pattern enables event listener access from outside the gallery initialization block
- Guard clauses prevent any errors when photos.json is empty (no cluster group, lightbox null check)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install leaflet.markercluster and add photo cluster layer to RouteMap** - `b4d7e08` (feat)
2. **Task 2: Wire PhotoGallery.astro to open lightbox from map:photoClick event** - `3874db7` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/RouteMap.astro` - Added MarkerCluster CSS imports, window.L assignment, photo cluster group, per-marker map:photoClick dispatch, :global(.photo-marker) CSS rule
- `src/components/PhotoGallery.astro` - Moved lightbox to module scope, added map:photoClick event listener calling loadAndOpen with gallery reference
- `package.json` - Added leaflet.markercluster@^1.5.3 dependency, @types/leaflet.markercluster@^1.5.6 devDependency
- `package-lock.json` - Lock file updated for 4 new packages

## Decisions Made
- `window.L = L` set before dynamic import of `leaflet.markercluster-src.js` — UMD plugin reads this global at module evaluation time; without it, `L.markerClusterGroup` is undefined
- Used `leaflet.markercluster/dist/leaflet.markercluster-src.js` (not the minified or ESM variant) — this is the file that performs the `window.L` attachment during evaluation
- `L.markerClusterGroup` (lowercase m, factory function) — not `L.MarkerClusterGroup` (capital M class)
- Photo marker amber-400 (#d4a84e) chosen over amber-500 (#c8973e, same as restock) for visual distinction on map
- `loadAndOpen(index, { gallery: galleryEl })` — gallery element passed explicitly as second argument; without it PhotoSwipe doesn't read data-pswp-width/height attributes from the anchor elements
- `@types/leaflet.markercluster` moved to devDependencies (type-only, not needed at runtime)

## Deviations from Plan

None — plan executed exactly as written. The stash/pop during verification revealed the npm install had been stashed alongside code changes; simple reinstall resolved it without any code deviation.

## Issues Encountered
- Pre-existing `[NoAdapterInstalled]` build error from `output: 'hybrid'` in astro.config.ts (requires an SSR adapter). This existed on commit 7c71e1d before any changes in this plan and did not block task execution — confirmed by testing stashed state.
- During verification testing, stash/pop caused package.json to revert to pre-install state. Resolved by running `npm install` again. No code impact.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Photo markers are fully wired: pipeline produces photos.json → RouteMap renders cluster layer → click opens PhotoSwipe at correct photo
- Phase 9 is now feature-complete except for Phase 09-01 admin UI (POST endpoint for photos-manifest.json is already implemented)
- The cross-component event pattern (window CustomEvent bus) is established and can be reused for future map→UI bridges

---
*Phase: 09-photo-markers-and-admin*
*Completed: 2026-03-31*
