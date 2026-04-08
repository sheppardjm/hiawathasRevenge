# Requirements: Hiawatha's Revenge v1.9

**Defined:** 2026-04-08
**Core Value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.

## v1.9 Requirements

### Segment Data

- [x] **SEG-01**: Little Indian sector defined in segments.json with name, mile range, difficulty (2 stars), Strava link (34542982), and cardPhoto
- [x] **SEG-02**: Little Indian sector coordinates added to route-config.js SECTOR_DEFS with start/end lat/lon from GPX data
- [x] **SEG-03**: Little Indian included in 100mi and 100k sectorIds in route-config.js (not 50k)
- [x] **SEG-04**: Little Indian entry added to generate-sector-details.js SECTOR_DETAILS with surface label and Strava link

### Display

- [x] **DISP-01**: Little Indian segment card rendered in RouteExplainer with photo, difficulty stars, Strava link, and elevation sparkline
- [x] **DISP-02**: Little Indian sector overlay appears on map for 100mi and 100k routes with amber500 gravel highlight
- [x] **DISP-03**: Little Indian sector detail panel accessible from map with elevation sparkline and description

### Pipeline

- [x] **PIPE-01**: Build pipeline regenerates annotations.json, sector-details.json, and sector-elevations.json with Little Indian data for all applicable routes
- [x] **PIPE-02**: Photo-association mile ranges adjusted so Little Indian photos map correctly (no overlap with ND2225 or Doe Lake ranges)

### Polish

- [ ] **FIX-01**: SVG wave background pattern in RouteExplainer tiles seamlessly with no visible seam at tile boundaries

## Out of Scope

| Feature | Reason |
|---------|--------|
| New photos for Little Indian | Existing photos in mile range are sufficient |
| 50k route inclusion | Little Indian is not on the 50k route |
| Description authoring | User will provide later; placeholder for now |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEG-01 | Phase 48 | Complete |
| SEG-02 | Phase 48 | Complete |
| SEG-03 | Phase 48 | Complete |
| SEG-04 | Phase 48 | Complete |
| DISP-01 | Phase 48 | Complete |
| DISP-02 | Phase 48 | Complete |
| DISP-03 | Phase 48 | Complete |
| PIPE-01 | Phase 48 | Complete |
| PIPE-02 | Phase 48 | Complete |
| FIX-01 | Phase 48 | Complete |

**Coverage:**
- v1.9 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after initial definition*
