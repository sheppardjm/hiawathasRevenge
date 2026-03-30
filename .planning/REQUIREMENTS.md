# Requirements: Hiawatha's Revenge

**Defined:** 2026-03-30
**Core Value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive showcase that inspires them to ride it and support MBTN.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Map & Navigation

- [ ] **MAP-01**: Interactive Leaflet map displays the full 100-mile GPX route as a polyline on themed map tiles (no API key required)
- [ ] **MAP-02**: Map uses tile style fitting Forest Service / National Park aesthetic (not dark-matter tiles)
- [ ] **MAP-03**: Hovering the elevation chart moves a bike icon crosshair to the corresponding position on the map
- [ ] **MAP-04**: Restock point markers appear on the map with name and mileage labels
- [ ] **MAP-05**: Gravel sector overlays display as color-coded polyline segments on the map by difficulty rating
- [ ] **MAP-06**: Map lazy-loads via IntersectionObserver (Leaflet assets deferred until map scrolls into view)
- [ ] **MAP-07**: Map supports touch gesture handling to prevent mobile scroll trap (leaflet-gesture-handling)
- [ ] **MAP-08**: Custom reset control button returns map to default view

### Elevation Profile

- [ ] **ELEV-01**: Chart.js elevation profile displays elevation (feet) vs distance (miles) for the full route
- [ ] **ELEV-02**: Gravel sector annotations appear as color-coded bands on the elevation chart
- [ ] **ELEV-03**: Hover on elevation chart dispatches custom events to sync with map crosshair
- [ ] **ELEV-04**: Elevation chart lazy-loads via IntersectionObserver
- [ ] **ELEV-05**: Chart is responsive: appropriate height on mobile (140px), tablet (180px), and desktop (180px)

### Photo Gallery

- [ ] **PHOTO-01**: Photo gallery displays all route photos as a responsive grid (2 cols mobile, 3 tablet, 4 desktop)
- [ ] **PHOTO-02**: Clicking a photo thumbnail opens PhotoSwipe lightbox with full-screen viewing and navigation
- [ ] **PHOTO-03**: Photos appear as clustered markers on the map at their tagged mileage positions
- [ ] **PHOTO-04**: Photo thumbnails are generated as 400px-wide WebP at 80% quality via sharp at build time
- [ ] **PHOTO-05**: Photo manifest admin UI allows assigning mileage to each photo via a browser-based interface
- [ ] **PHOTO-06**: Thumbnails lazy-load with async decoding

### Content & Narrative

- [ ] **CONT-01**: Site displays introductory paragraphs about Hiawatha (the historical/literary figure) and how the Hiawatha National Forest came to bear his name
- [ ] **CONT-02**: Route stats block shows distance (100 mi), total elevation gain, and surface type breakdown
- [ ] **CONT-03**: GPX file available for direct download so riders can load onto GPS devices
- [ ] **CONT-04**: Donate to MBTN call-to-action prominently featured with link to mbtn.org

### Design & Theme

- [ ] **DSGN-01**: National park badge-style h1 site name design (CSS-only, Phil Monson-inspired)
- [ ] **DSGN-02**: U.S. Forest Service / National Park visual theme — deep forest greens, warm amber/gold, bold solid lines, heavy shadows, earthy tones
- [ ] **DSGN-03**: Typography with text shadows and bold condensed fonts fitting the park ranger station aesthetic
- [ ] **DSGN-04**: Topographic line patterns or decorative overlays reinforcing the wilderness theme
- [ ] **DSGN-05**: Responsive layout works across mobile, tablet, and desktop with 52px minimum touch targets
- [ ] **DSGN-06**: prefers-reduced-motion support for animations

### Build Pipeline

- [ ] **BUILD-01**: GPX parsing script converts route GPX to route-data.json with lat/lon/elevation/cumulative mileage
- [ ] **BUILD-02**: GPX data is reduced (Ramer-Douglas-Peucker or similar) to prevent mobile rendering overload
- [ ] **BUILD-03**: Elevation gain computed with noise filtering (minimum threshold delta) to prevent GPS inflation
- [ ] **BUILD-04**: Photo matching script maps manifest mileage entries to route coordinates, outputs photos.json
- [ ] **BUILD-05**: Thumbnail generation script creates WebP thumbnails from source images
- [ ] **BUILD-06**: Annotation resolution script maps gravel sectors and restock points to route coordinates
- [ ] **BUILD-07**: Single `prebuild` script orchestrates entire data pipeline before Astro build
- [ ] **BUILD-08**: Astro static build produces deployable site with no SSR

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Content

- **V2-01**: Printable route card / PDF export for offline reference
- **V2-02**: Dark/light mode toggle
- **V2-03**: Ride report or blog section for community stories

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Race registration / BikeReg | This is a ride, not a race — no competitive entry |
| KOM / segment timing | Contradicts the non-competitive spirit of the ride |
| Countdown timer | No specific race date; makes site feel stale |
| User accounts / login | Static showcase, no authentication needed |
| Strava / Komoot embeds | Third-party dependency, style conflicts, increasingly paywalled |
| Real-time features | Requires backend infrastructure; purely static site |
| Multiple distance options | One iconic 100-mile route is the identity |
| Comments / social wall | Moderation burden; link to MBTN social instead |
| Mobile app | Web-only showcase |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MAP-01 | Phase 3 | Pending |
| MAP-02 | Phase 3 | Pending |
| MAP-03 | Phase 5 | Pending |
| MAP-04 | Phase 6 | Pending |
| MAP-05 | Phase 5 | Pending |
| MAP-06 | Phase 3 | Pending |
| MAP-07 | Phase 3 | Pending |
| MAP-08 | Phase 3 | Pending |
| ELEV-01 | Phase 4 | Pending |
| ELEV-02 | Phase 5 | Pending |
| ELEV-03 | Phase 5 | Pending |
| ELEV-04 | Phase 4 | Pending |
| ELEV-05 | Phase 4 | Pending |
| PHOTO-01 | Phase 8 | Pending |
| PHOTO-02 | Phase 8 | Pending |
| PHOTO-03 | Phase 9 | Pending |
| PHOTO-04 | Phase 7 | Pending |
| PHOTO-05 | Phase 9 | Pending |
| PHOTO-06 | Phase 7 | Pending |
| CONT-01 | Phase 10 | Pending |
| CONT-02 | Phase 10 | Pending |
| CONT-03 | Phase 10 | Pending |
| CONT-04 | Phase 10 | Pending |
| DSGN-01 | Phase 10 | Pending |
| DSGN-02 | Phase 1 | Complete |
| DSGN-03 | Phase 1 | Complete |
| DSGN-04 | Phase 10 | Pending |
| DSGN-05 | Phase 11 | Pending |
| DSGN-06 | Phase 11 | Pending |
| BUILD-01 | Phase 2 | Pending |
| BUILD-02 | Phase 2 | Pending |
| BUILD-03 | Phase 2 | Pending |
| BUILD-04 | Phase 7 | Pending |
| BUILD-05 | Phase 7 | Pending |
| BUILD-06 | Phase 2 | Pending |
| BUILD-07 | Phase 2 | Pending |
| BUILD-08 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 after roadmap creation — all 37 requirements mapped*
