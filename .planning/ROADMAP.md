# Roadmap: Hiawatha's Revenge

## Overview

This roadmap delivers a visually immersive, static showcase site for the Hiawatha's Revenge 100-mile gravel route. The work begins with Astro scaffolding and design tokens, proceeds through a two-phase build pipeline that produces clean JSON and WebP artifacts, then assembles the interactive map, elevation profile, photo gallery, and content layer that together inspire visitors to ride the route and donate to MBTN.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Astro 6 + Tailwind 4 project scaffold with Forest Service design tokens and base layout
- [x] **Phase 2: Data Pipeline** - GPX parsing, annotation resolution, and build orchestration producing all route JSON
- [x] **Phase 3: Route Map** - Leaflet island with GPX polyline, themed tiles, gesture handling, and lazy-load
- [x] **Phase 4: Elevation Profile** - Chart.js island with elevation vs. distance, lazy-load, and responsive heights
- [x] **Phase 5: Map-Elevation Sync** - CrosshairCustomEvent bus, gravel sector overlays on map and chart
- [x] **Phase 6: Restock Markers** - Restock point markers on map with name and mileage labels
- [x] **Phase 7: Photo Pipeline** - sharp thumbnail generation, photo matching script, and photos.json
- [x] **Phase 8: Photo Gallery** - PhotoSwipe lightbox with thumbnail grid
- [x] **Phase 9: Photo Markers and Admin** - Geotagged map markers, cluster layer, and manifest admin UI
- [x] **Phase 10: Content, Narrative, and Visual Identity** - Hiawatha intro, route stats, donate CTA, badge h1, topographic patterns
- [x] **Phase 11: Responsive Polish and Production Build** - Touch targets, reduced-motion, full responsive audit, production verification

## Phase Details

### Phase 1: Foundation
**Goal**: Visitors can open a working Astro site that renders the Forest Service visual identity with correct fonts, colors, and layout shell — ready to receive interactive components
**Depends on**: Nothing (first phase)
**Requirements**: BUILD-08, DSGN-02, DSGN-03
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts without errors and serves a page at localhost
  2. The page renders in deep forest green with amber/gold accents using the defined CSS custom properties
  3. Space Mono and Special Elite fonts load and render on headings and body text without layout shift
  4. `astro build` produces a static `dist/` folder with no SSR output
  5. Tailwind 4 utility classes resolve correctly in the browser (no missing styles)
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Astro 6 + Tailwind 4 project with Vite 7 override and Forest Service design tokens in global.css @theme
- [x] 01-02-PLAN.md — Create BaseLayout.astro with Astro Fonts API and index.astro with visual identity showcase

### Phase 2: Data Pipeline
**Goal**: Running `npm run pipeline` produces valid, well-formed JSON files that all downstream components can consume — route coordinates, elevation data, annotations, and sector definitions
**Depends on**: Phase 1
**Requirements**: BUILD-01, BUILD-02, BUILD-03, BUILD-06, BUILD-07
**Success Criteria** (what must be TRUE):
  1. `npm run pipeline` completes without errors and produces `route-data.json`, `annotations.json` in `public/data/`
  2. `route-data.json` contains lat/lon/elevation/cumulative-mileage arrays with coordinates reduced to under 600 points
  3. Elevation gain in `route-data.json` matches known Garmin/Strava figures within a 10% tolerance (noise-filtered)
  4. `annotations.json` contains named restock points and gravel sector definitions each snapped to route coordinates
  5. `npm run build` invokes the pipeline automatically before the Astro build step
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Parse GPX, compute cumulative mileage, apply RDP simplification, apply elevation noise filter, output route-data.json; checkpoint for elevation gain verification
- [x] 02-02-PLAN.md — Define restock points and gravel sectors, snap to route coordinates, output annotations.json
- [x] 02-03-PLAN.md — Wire pipeline.js orchestrator with prebuild/predev npm hooks; create content.config.ts with Zod schemas for all collections

### Phase 3: Route Map
**Goal**: Visitors can see the full 100-mile GPX route rendered as a polyline on a forest-themed map that lazy-loads on scroll, handles mobile touch correctly, and resets to the default view on demand
**Depends on**: Phase 2
**Requirements**: MAP-01, MAP-02, MAP-06, MAP-07, MAP-08
**Success Criteria** (what must be TRUE):
  1. Scrolling to the map section loads the Leaflet map with the GPX route polyline visible
  2. The map tile style uses a forest or terrain aesthetic (not dark-matter) with OSM attribution visible
  3. Pinching or scrolling on mobile does not trap the user in the map (gesture handling active)
  4. A reset button on the map returns it to the initial `fitBounds()` view
  5. Leaflet assets are not loaded until the map enters the viewport (IntersectionObserver confirmed in Network tab)
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — Install Leaflet deps, fix global.css cascade layer order, create RouteMap.astro with CyclOSM tiles and GPX polyline, wire into index.astro
- [x] 03-02-PLAN.md — Visual verification of map rendering, tile aesthetics, gesture handling, lazy-loading, and reset button

### Phase 4: Elevation Profile
**Goal**: Visitors can see the route's elevation vs. distance as an interactive chart that loads lazily and renders at the correct height on mobile, tablet, and desktop
**Depends on**: Phase 2
**Requirements**: ELEV-01, ELEV-04, ELEV-05
**Success Criteria** (what must be TRUE):
  1. The Chart.js elevation chart renders with elevation (feet) on the Y-axis and distance (miles) on the X-axis
  2. The chart lazy-loads via IntersectionObserver and is not loaded until it enters the viewport
  3. The chart renders at 140px tall on mobile, 180px on tablet, and 180px on desktop without overflow
  4. Chart.js assets are not present in the initial page bundle (confirmed in Network tab)
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Install Chart.js 4.5.1 + chartjs-plugin-annotation 3.1.0; create ElevationProfile.astro with line chart, IntersectionObserver lazy-init, responsive height, LTTB decimation; wire into index.astro
- [x] 04-02-PLAN.md — Visual verification of chart rendering, axis labels, responsive heights, lazy-loading, and Network tab confirmation

### Phase 5: Map-Elevation Sync
**Goal**: Hovering the elevation chart moves a bike icon crosshair on the map to the corresponding route position, and gravel sectors appear as color-coded overlays on both the map and the chart
**Depends on**: Phase 3, Phase 4
**Requirements**: MAP-03, MAP-05, ELEV-02, ELEV-03
**Success Criteria** (what must be TRUE):
  1. Moving the cursor along the elevation chart moves a bike icon marker on the map to the corresponding GPS coordinate
  2. Gravel sectors appear as color-coded polyline segments on the map distinguishable by difficulty
  3. Gravel sectors appear as matching color-coded shaded bands on the elevation chart
  4. Crosshair sync uses distance-along-route (not array index) so it remains accurate even if arrays differ in length
**Plans**: 4 plans

Plans:
- [x] 05-01-PLAN.md — Implement CustomEvent bus (`elevation:hover`, `map:reset`) in RouteMap.astro and ElevationProfile.astro; wire crosshair bike icon marker
- [x] 05-02-PLAN.md — Add gravel sector polyline overlays to RouteMap.astro from annotations.json sector definitions
- [x] 05-03-PLAN.md — Add chartjs-plugin-annotation sector band overlays to ElevationProfile.astro matching map sector colors
- [x] 05-04-PLAN.md — Gap closure: add difficulty-based color coding to sector overlays on map and chart

### Phase 6: Restock Markers
**Goal**: Visitors can see named restock points as markers on the map, each showing the location name and mileage, so they can plan water and food stops on the remote 100-mile route
**Depends on**: Phase 3, Phase 2
**Requirements**: MAP-04
**Success Criteria** (what must be TRUE):
  1. Each restock point defined in annotations.json appears as a distinct marker on the map at its correct GPS coordinate
  2. Clicking or hovering a restock marker shows its name and mileage label in a popup or tooltip
  3. Restock markers are visually distinct from photo markers and route path
**Plans**: 1 plan

Plans:
- [x] 06-01-PLAN.md — Add restock point markers with forest-themed popups to RouteMap.astro and global.css

### Phase 7: Photo Pipeline
**Goal**: Running the build pipeline produces 400px WebP thumbnails for all source images and a validated photos.json mapping each image to a mileage position — ready for the gallery and map markers
**Depends on**: Phase 2
**Requirements**: BUILD-04, BUILD-05, PHOTO-04
**Success Criteria** (what must be TRUE):
  1. `npm run pipeline` generates a 400px-wide WebP thumbnail at 80% quality for every source image in `images/`
  2. Thumbnails are written to `public/thumbs/` and load correctly in the browser
  3. `photos.json` exists in `public/data/` with entries containing filename, mileage, and thumbnail path for each photo
**Plans**: 2 plans

Plans:
- [ ] 07-01-PLAN.md — Install sharp 0.34.x; create generate-thumbnails.js producing 400px WebP at 80% quality in public/thumbs/
- [ ] 07-02-PLAN.md — Create match-photos.js for manifest-to-photos.json generation; integrate both scripts into pipeline.js

### Phase 8: Photo Gallery
**Goal**: Visitors can browse all route photos in a responsive grid and open any photo in a full-screen PhotoSwipe lightbox with swipe and keyboard navigation
**Depends on**: Phase 7
**Requirements**: PHOTO-01, PHOTO-02, PHOTO-06
**Success Criteria** (what must be TRUE):
  1. The photo gallery shows all route photos as a 2-column grid on mobile, 3-column on tablet, and 4-column on desktop
  2. Clicking any thumbnail opens the PhotoSwipe lightbox with the full-resolution image
  3. The lightbox supports swipe gestures on mobile and keyboard arrow navigation on desktop
  4. PhotoSwipe assets are not loaded until the gallery is interacted with (lightbox deferred)
**Plans**: 2 plans

Plans:
- [x] 08-01-PLAN.md — Install PhotoSwipe 5.4.4; create PhotoGallery.astro with responsive grid, lightbox script, dimension parsing, and empty-state handling; wire into index.astro
- [x] 08-02-PLAN.md — Create copy-images.js pipeline step to serve full-resolution source JPGs from public/images/ for lightbox; integrate as step 4 in pipeline.js

### Phase 9: Photo Markers and Admin
**Goal**: Developers can assign mileage to photos via a browser admin UI, and visitors see geotagged photos as clustered markers on the map that open the gallery lightbox when clicked
**Depends on**: Phase 8, Phase 3
**Requirements**: PHOTO-03, PHOTO-05
**Success Criteria** (what must be TRUE):
  1. Opening `/admin` in the Astro dev server shows a UI listing all photos with a mileage input for each
  2. Saving the manifest in the admin UI writes an updated photos.json that the pipeline can consume
  3. Photo markers appear on the map as clustered markers at their assigned mileage positions
  4. Clicking a photo cluster marker or individual marker opens the PhotoSwipe lightbox to that photo
**Plans**: 2 plans

Plans:
- [x] 09-01-PLAN.md — Create admin.astro (dev-only) and save-manifest.ts POST endpoint for photo manifest editing with mileage inputs per photo
- [x] 09-02-PLAN.md — Install leaflet.markercluster, add photo cluster marker layer to RouteMap.astro, wire map:photoClick CustomEvent bridge to PhotoGallery lightbox

### Phase 10: Content, Narrative, and Visual Identity
**Goal**: Visitors encounter a rich narrative about Hiawatha and the National Forest, a route stats block, a prominent MBTN donate call-to-action, a GPX download link, a national park badge-style h1, and topographic decorative details that complete the Forest Service visual identity
**Depends on**: Phase 1
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, DSGN-01, DSGN-04
**Success Criteria** (what must be TRUE):
  1. The page opens with introductory paragraphs covering Hiawatha the historical figure and the origin of the National Forest name
  2. A route stats block displays 100 miles, total elevation gain (from route-data.json), and surface type breakdown
  3. A donate CTA button linking to mbtn.org is prominent and visible without scrolling on desktop
  4. A GPX download link is present and downloads the source GPX file when clicked
  5. The site name h1 renders as a national park badge design (CSS-only, no images)
  6. Topographic line patterns or decorative wilderness overlays appear as section dividers or background textures
**Plans**: 3 plans

Plans:
- [x] 10-01-PLAN.md — Create RouteStats.astro (build-time data) and DonateCallout.astro (donate button) components
- [x] 10-02-PLAN.md — Add GPX copy pipeline step and topographic pattern CSS class
- [x] 10-03-PLAN.md — Assemble index.astro: narrative content, wire components, GPX link, topo dividers, badge refinement

### Phase 11: Responsive Polish and Production Build
**Goal**: The site works flawlessly on every screen size, animations respect prefers-reduced-motion, all touch targets meet the 52px minimum, and `astro build` produces a deployable artifact with no errors or warnings
**Depends on**: Phase 10, Phase 9, Phase 5, Phase 6
**Requirements**: DSGN-05, DSGN-06
**Success Criteria** (what must be TRUE):
  1. All interactive controls (map buttons, lightbox nav, donate button, gallery grid) have a minimum 52px touch target on mobile
  2. Animations (chart transitions, map fly-to, lightbox open) are suppressed when prefers-reduced-motion: reduce is set
  3. The page layout adapts correctly at 375px (mobile), 768px (tablet), and 1280px (desktop) without overflow or clipping
  4. `astro build` completes without errors, produces correct static output, and all thumbnails serve from dist/
  5. OSM attribution is visible on the map canvas in the production build
**Plans**: TBD

Plans:
- [x] 11-01-PLAN.md — Audit all interactive controls for 52px touch targets; apply CSS overrides and min-height utilities
- [x] 11-02-PLAN.md — Add prefers-reduced-motion media query overrides for Leaflet, donate button, GPX link, and fitBounds JS guard
- [x] 11-03-PLAN.md — Fix RouteStats grid responsive breakpoint for mobile-first single-column layout
- [x] 11-04-PLAN.md — Remove @astrojs/node adapter, fix static build to produce flat dist/ with all assets

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

Note: Phase 3 and Phase 4 can proceed in parallel after Phase 2 completes. Phase 7 can proceed in parallel with Phase 3 and Phase 4.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-03-30 |
| 2. Data Pipeline | 3/3 | Complete | 2026-03-30 |
| 3. Route Map | 2/2 | Complete | 2026-03-30 |
| 4. Elevation Profile | 2/2 | Complete | 2026-03-30 |
| 5. Map-Elevation Sync | 4/4 | Complete | 2026-03-30 |
| 6. Restock Markers | 1/1 | Complete | 2026-03-30 |
| 7. Photo Pipeline | 2/2 | Complete | 2026-03-31 |
| 8. Photo Gallery | 2/2 | Complete | 2026-03-31 |
| 9. Photo Markers and Admin | 2/2 | Complete | 2026-03-31 |
| 10. Content, Narrative, and Visual Identity | 3/3 | Complete | 2026-03-31 |
| 11. Responsive Polish and Production Build | 4/4 | Complete | 2026-03-31 |

---
*Roadmap created: 2026-03-30*
*Last updated: 2026-03-31 after Phase 11 execution*
