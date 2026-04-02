# Requirements: Hiawatha's Revenge

**Defined:** 2026-04-02
**Core Value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.

## v1.3 Requirements

Requirements for v1.3 Interactive Map & Editorial Polish. Each maps to roadmap phases.

### Map Interactivity

- [x] **MAP-01**: Sector name and star difficulty badges visible on map at polyline midpoints using L.divIcon markers
- [x] **MAP-02**: Sector labels styled with National Park aesthetic — shield motif, difficulty color coding
- [x] **MAP-03**: Clicking a sector polyline opens a slide-out detail panel
- [x] **MAP-04**: Ghost hit layers (20px) on sector polylines for reliable mobile touch targets
- [x] **MAP-05**: Desktop hover state changes sector polyline weight/opacity
- [x] **MAP-06**: Clicked sector gets active highlight (thicker/brighter polyline)
- [x] **MAP-07**: Panel displays sector name, difficulty stars, terrain description, surface type, elevation sparkline, and Strava link
- [x] **MAP-08**: Panel closes via X button, Escape key, or click outside
- [x] **MAP-09**: Panel open/close animation respects prefers-reduced-motion
- [x] **MAP-10**: Panel styled to match National Park design system
- [x] **MAP-11**: Panel includes jump link to scroll to corresponding page section
- [x] **MAP-12**: Desktop layout: right slide-out panel (~350px wide)
- [x] **MAP-13**: Mobile layout: bottom sheet (~50vh, simple two-state open/close)
- [x] **MAP-14**: Route polyline colored by surface type (paved/dirt/gravel/sand) using RidewithGPS hiawathasRevenge.json data

### Visual Polish

- [x] **VIS-01**: More vertical padding at top and bottom of each content section for breathing room
- [x] **VIS-02**: Pull quote starts with capital drop letter in classic American typeface (Caslon or Garamond)
- [x] **VIS-03**: Pull quote set in larger font size than body text to draw reader attention
- [x] **VIS-04**: Sticky fixed-position background images in poem/forest/ride sections with scroll fade-in/out effect
- [x] **VIS-05**: Route stats section reverted to higher contrast color scheme for text legibility
- [x] **VIS-06**: Additional Native American design elements and motifs interspersed throughout site (patterns, symbols, earthy tones)

### Performance

- [x] **PERF-01**: Photo loading skeletons prevent layout shifts while images load

### Data Pipeline

- [x] **DATA-01**: Difficulty ratings reconciled between annotations.json and data.md to a single canonical source
- [x] **DATA-02**: New sector-details.json consolidating all panel content (name, description, surface, stars, Strava link) at build time
- [x] **DATA-03**: RidewithGPS JSON processed into per-point surface type data for track coloring pipeline step

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Map Enhancements

- **MAP-F01**: Elevation chart highlights corresponding sector band when sector panel is open
- **MAP-F02**: Zoom-gated label visibility (show/hide labels based on zoom level to prevent overlap)
- **MAP-F03**: Drag-to-snap bottom sheet with multiple stop positions

### Visual Enhancements

- **VIS-F01**: Dark/light mode toggle
- **VIS-F02**: Video content integration
- **VIS-F03**: Parallax scrolling with depth layers

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Leaflet 2.0 upgrade | Alpha — markercluster and gesture-handling plugins incompatible |
| Race registration / BikeReg | Ride showcase, not a race |
| Real-time features | Purely static showcase |
| User accounts / OAuth | No login needed |
| Mobile app | Web only |
| AI-generated cultural imagery | Contradicts site's cultural critique narrative |
| Chart.js sparklines in panel | Build-time SVG sparklines avoid memory bloat |
| GSAP/Lottie for animations | CSS handles everything needed; no new dependencies |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 23 | Complete |
| DATA-02 | Phase 23 | Complete |
| DATA-03 | Phase 23 | Complete |
| MAP-01 | Phase 24 | Complete |
| MAP-02 | Phase 24 | Complete |
| MAP-03 | Phase 25 | Complete |
| MAP-04 | Phase 25 | Complete |
| MAP-05 | Phase 25 | Complete |
| MAP-06 | Phase 25 | Complete |
| MAP-07 | Phase 25 | Complete |
| MAP-08 | Phase 25 | Complete |
| MAP-09 | Phase 25 | Complete |
| MAP-10 | Phase 25 | Complete |
| MAP-11 | Phase 25 | Complete |
| MAP-12 | Phase 25 | Complete |
| MAP-13 | Phase 25 | Complete |
| MAP-14 | Phase 25 | Complete |
| VIS-01 | Phase 26 | Complete |
| VIS-02 | Phase 26 | Complete |
| VIS-03 | Phase 26 | Complete |
| VIS-04 | Phase 26 | Complete |
| VIS-05 | Phase 26 | Complete |
| VIS-06 | Phase 26 | Complete |
| PERF-01 | Phase 26 | Complete |

**Coverage:**
- v1.3 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after Phase 26 completion*
