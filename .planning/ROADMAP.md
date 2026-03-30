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
- [ ] **Phase 3: Route Map** - Leaflet island with GPX polyline, themed tiles, gesture handling, and lazy-load
- [ ] **Phase 4: Elevation Profile** - Chart.js island with elevation vs. distance, lazy-load, and responsive heights
- [ ] **Phase 5: Map-Elevation Sync** - CrosshairCustomEvent bus, gravel sector overlays on map and chart
- [ ] **Phase 6: Restock Markers** - Restock point markers on map with name and mileage labels
- [ ] **Phase 7: Photo Pipeline** - sharp thumbnail generation, photo matching script, and photos.json
- [ ] **Phase 8: Photo Gallery** - PhotoSwipe lightbox with thumbnail grid
- [ ] **Phase 9: Photo Markers and Admin** - Geotagged map markers, cluster layer, and manifest admin UI
- [ ] **Phase 10: Content, Narrative, and Visual Identity** - Hiawatha intro, route stats, donate CTA, badge h1, topographic patterns
- [ ] **Phase 11: Responsive Polish and Production Build** - Touch targets, reduced-motion, full responsive audit, production verification

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
- [ ] 03-01-PLAN.md — Install Leaflet deps, fix global.css cascade layer order, create RouteMap.astro with CyclOSM tiles and GPX polyline, wire into index.astro
- [ ] 03-02-PLAN.md — Visual verification of map rendering, tile aesthetics, gesture handling, lazy-loading, and reset button

### Phase 4: Elevation Profile
**Goal**: Visitors can see the route's elevation vs. distance as an interactive chart that loads lazily and renders at the correct height on mobile, tablet, and desktop
**Depends on**: Phase 2
**Requirements**: ELEV-01, ELEV-04, ELEV-05
**Success Criteria** (what must be TRUE):
  1. The Chart.js elevation chart renders with elevation (feet) on the Y-axis and distance (miles) on the X-axis
  2. The chart lazy-loads via IntersectionObserver and is not loaded until it enters the viewport
  3. The chart renders at 140px tall on mobile, 180px on tablet, and 180px on desktop without overflow
  4. Chart.js assets are not present in the initial page bundle (confirmed in Network tab)
**Plans**: TBD

Plans:
- [ ] 04-01: Install Chart.js 4.5.1 and chartjs-plugin-annotation; create `ElevationProfile.astro` island with IntersectionObserver lazy-init
- [ ] 04-02: Configure Chart.js dataset from route-data.json with LTTB decimation (target ~500 points), responsive height config, and axis labels

### Phase 5: Map-Elevation Sync
**Goal**: Hovering the elevation chart moves a bike icon crosshair on the map to the corresponding route position, and gravel sectors appear as color-coded overlays on both the map and the chart
**Depends on**: Phase 3, Phase 4
**Requirements**: MAP-03, MAP-05, ELEV-02, ELEV-03
**Success Criteria** (what must be TRUE):
  1. Moving the cursor along the elevation chart moves a bike icon marker on the map to the corresponding GPS coordinate
  2. Gravel sectors appear as color-coded polyline segments on the map distinguishable by difficulty
  3. Gravel sectors appear as matching color-coded shaded bands on the elevation chart
  4. Crosshair sync uses distance-along-route (not array index) so it remains accurate even if arrays differ in length
**Plans**: TBD

Plans:
- [ ] 05-01: Implement CustomEvent bus (`elevation:hover`, `map:reset`) in RouteMap.astro and ElevationProfile.astro; wire crosshair bike icon marker
- [ ] 05-02: Add gravel sector polyline overlays to RouteMap.astro from annotations.json sector definitions; color-code by difficulty
- [ ] 05-03: Add chartjs-plugin-annotation sector band overlays to ElevationProfile.astro matching map sector colors

### Phase 6: Restock Markers
**Goal**: Visitors can see named restock points as markers on the map, each showing the location name and mileage, so they can plan water and food stops on the remote 100-mile route
**Depends on**: Phase 3, Phase 2
**Requirements**: MAP-04
**Success Criteria** (what must be TRUE):
  1. Each restock point defined in annotations.json appears as a distinct marker on the map at its correct GPS coordinate
  2. Clicking or hovering a restock marker shows its name and mileage label in a popup or tooltip
  3. Restock markers are visually distinct from photo markers and route path
**Plans**: TBD

Plans:
- [ ] 06-01: Add restock point marker layer to RouteMap.astro using L.marker with L.divIcon; bind popup with name and mileage from annotations.json

### Phase 7: Photo Pipeline
**Goal**: Running the build pipeline produces 400px WebP thumbnails for all source images and a validated photos.json mapping each image to a mileage position — ready for the gallery and map markers
**Depends on**: Phase 2
**Requirements**: BUILD-04, BUILD-05, PHOTO-04, PHOTO-06
**Success Criteria** (what must be TRUE):
  1. `npm run pipeline` generates a 400px-wide WebP thumbnail at 80% quality for every source image in `images/`
  2. Thumbnails are written to `public/thumbs/` and load correctly in the browser
  3. `photos.json` exists in `public/data/` with entries containing filename, mileage, and thumbnail path for each photo
  4. Gallery thumbnail `<img>` elements have `loading="lazy"` and `decoding="async"` attributes
**Plans**: TBD

Plans:
- [ ] 07-01: Install sharp 0.34.x as devDependency; write `scripts/generate-thumbnails.js` producing 400px WebP at 80% quality in `public/thumbs/`
- [ ] 07-02: Write `scripts/match-photos.js` — read photo manifest JSON, validate paths, snap mileage to route coordinates, output photos.json; integrate into pipeline

### Phase 8: Photo Gallery
**Goal**: Visitors can browse all route photos in a responsive grid and open any photo in a full-screen PhotoSwipe lightbox with swipe and keyboard navigation
**Depends on**: Phase 7
**Requirements**: PHOTO-01, PHOTO-02
**Success Criteria** (what must be TRUE):
  1. The photo gallery shows all route photos as a 2-column grid on mobile, 3-column on tablet, and 4-column on desktop
  2. Clicking any thumbnail opens the PhotoSwipe lightbox with the full-resolution image
  3. The lightbox supports swipe gestures on mobile and keyboard arrow navigation on desktop
  4. PhotoSwipe assets are not loaded until the gallery is interacted with (lightbox deferred)
**Plans**: TBD

Plans:
- [ ] 08-01: Install PhotoSwipe 5.4.4; create `PhotoGallery.astro` island with responsive thumbnail grid from photos.json
- [ ] 08-02: Wire PhotoSwipe lightbox initialization — set data-pswp-width/height at build time; support keyboard navigation and touch swipe

### Phase 9: Photo Markers and Admin
**Goal**: Developers can assign mileage to photos via a browser admin UI, and visitors see geotagged photos as clustered markers on the map that open the gallery lightbox when clicked
**Depends on**: Phase 8, Phase 3
**Requirements**: PHOTO-03, PHOTO-05
**Success Criteria** (what must be TRUE):
  1. Opening `/admin` in the Astro dev server shows a UI listing all photos with a mileage input for each
  2. Saving the manifest in the admin UI writes an updated photos.json that the pipeline can consume
  3. Photo markers appear on the map as clustered markers at their assigned mileage positions
  4. Clicking a photo cluster marker or individual marker opens the PhotoSwipe lightbox to that photo
**Plans**: TBD

Plans:
- [ ] 09-01: Create `admin.astro` (dev-only) — photo manifest editor with mileage inputs per photo and a save mechanism that writes photos-manifest.json
- [ ] 09-02: Add photo cluster marker layer to RouteMap.astro using leaflet.markercluster; install leaflet.markercluster; wire `map:photoClick` CustomEvent to PhotoGallery lightbox

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
**Plans**: TBD

Plans:
- [ ] 10-01: Write Hiawatha narrative content (historical figure, Longfellow poem, Ojibwe context, National Forest naming, MBTN mission); author in Astro component with appropriate typography
- [ ] 10-02: Build route stats block pulling distance and elevation gain from route-data.json at build time; add surface type breakdown from annotations.json
- [ ] 10-03: Create `DonateCallout.astro` with prominent donate button linking to mbtn.org/donate; add above-fold placement
- [ ] 10-04: Add GPX download link (`<a href="/Munising_Hiawatha_s_Revenge.gpx" download>`) to the page; copy GPX to public/
- [ ] 10-05: Design and implement national park badge-style h1 in CSS only (border layers, arrowhead motif, condensed lettering, text shadow)
- [ ] 10-06: Add topographic line SVG or CSS patterns as section background textures or decorative dividers

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
- [ ] 11-01: Audit all interactive controls for 52px touch targets; apply Tailwind min-w/min-h utilities where needed; test on 375px viewport
- [ ] 11-02: Add prefers-reduced-motion media query overrides for chart transitions, map animations, and lightbox transitions
- [ ] 11-03: Full responsive layout audit at 375px / 768px / 1280px — fix any overflow, clipping, or chart height issues
- [ ] 11-04: Run `astro build`, verify dist/ output, confirm thumbnails serve, confirm OSM attribution visible, confirm no SSR output

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

Note: Phase 3 and Phase 4 can proceed in parallel after Phase 2 completes. Phase 7 can proceed in parallel with Phase 3 and Phase 4.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-03-30 |
| 2. Data Pipeline | 3/3 | Complete | 2026-03-30 |
| 3. Route Map | 0/2 | Not started | - |
| 4. Elevation Profile | 0/2 | Not started | - |
| 5. Map-Elevation Sync | 0/3 | Not started | - |
| 6. Restock Markers | 0/1 | Not started | - |
| 7. Photo Pipeline | 0/2 | Not started | - |
| 8. Photo Gallery | 0/2 | Not started | - |
| 9. Photo Markers and Admin | 0/2 | Not started | - |
| 10. Content, Narrative, and Visual Identity | 0/6 | Not started | - |
| 11. Responsive Polish and Production Build | 0/4 | Not started | - |

---
*Roadmap created: 2026-03-30*
*Last updated: 2026-03-30 after Phase 3 planning*
