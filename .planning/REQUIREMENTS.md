# Requirements: Hiawatha's Revenge

**Defined:** 2026-04-06
**Core Value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.

## v1.5 Requirements

Requirements for multi-route support. Each maps to roadmap phases.

### Pipeline & Data

- [x] **PIPE-01**: Pipeline processes all 3 GPX files (100mi, 100k, 50k) and produces per-route JSON data (route points, elevation, metadata)
- [x] **PIPE-02**: Pipeline generates per-route surface-points data for surface-colored polylines (with fallback for routes lacking RidewithGPS surface metadata)
- [x] **PIPE-03**: Pipeline produces per-route sector annotations with coordinate-based snapping (not mile-based) so sectors map correctly to each route's point array
- [x] **PIPE-04**: Pipeline validates sector-to-route membership against actual GPS tracks and outputs a route-sector mapping
- [x] **PIPE-05**: Pipeline copies all 3 GPX files to public/ for download

### Route Selector

- [x] **SEL-01**: Segmented control (pill bar) on the map with 100mi / 100k / 50k options, 52px touch targets, `role="radiogroup"` with arrow key navigation
- [x] **SEL-02**: Each route distance has a consistent color identity (e.g., amber/lake/moss) applied to the selector active state and ghost polylines
- [x] **SEL-03**: Route selector dispatches `route:change` CustomEvent consumed by all route-aware components

### Map Display

- [x] **MAP-01**: Selected route's surface-colored polyline replaces the previous route on the map via L.layerGroup toggling
- [x] **MAP-02**: Sector overlays, ghost hit targets, and pill labels filter to show only sectors present on the selected route
- [x] **MAP-03**: Map fitBounds adjusts to the selected route's geographic extent on route change
- [x] **MAP-04**: Inactive routes appear as ghost polylines at low opacity (~0.2) with route-specific color for geographic context
- [x] **MAP-05**: Sector detail panel closes on route change if showing a sector not on the new route

### Elevation & Stats

- [x] **ELEV-01**: Elevation profile chart swaps data to the selected route (new distance on x-axis, new elevation on y-axis)
- [x] **ELEV-02**: Sector annotation bands on the elevation chart filter to sectors present on the selected route
- [x] **ELEV-03**: Bike marker crosshair on the map snaps to the selected route's coordinates (not the previous route)
- [x] **STAT-01**: Route stats (distance, elevation gain) update to the selected route's values on route change
- [x] **STAT-02**: Route comparison sidebar shows all 3 routes' key stats (distance, elevation, sector count) side by side

### Downloads & Links

- [x] **DL-01**: GPX download link updates href and label text to match the selected route
- [x] **LINK-01**: URL hash deep linking (`#route=100k`) pre-selects the specified route on page load and updates on route change via `history.replaceState`

### Hero Video

- [x] **HERO-01**: Hero section plays a `<video>` element (Stationary_Hero_Video_With_Motion.mp4) with the existing hero image as `<img>` poster/fallback for unsupported browsers or slow connections

## Future Requirements

### Cross-Browser/Device (carried from v1.4)

- **XBRO-01**: iOS Safari touch target verification on real device
- **XBRO-02**: Sector panel gesture handling on iOS Safari
- **XBRO-03**: Bottom sheet behavior verification on iOS Safari

### Route Enhancements (deferred to v1.6+)

- **ANI-01**: Animated crossfade transition between routes (opacity interpolation on SVG paths)
- **PERF-01**: Lazy-load shorter route data on first selection (not preloaded at init)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Side-by-side map comparison | Ghost routes provide context within single map; 3x Leaflet overhead unjustified |
| Animated route playback / virtual ride | App feature, not showcase; existing elevation hover provides manual exploration |
| Route builder / custom distance | Requires routing engine; three curated distances are the product |
| Per-route editorial content | Editorial is about the event and forest, not specific distances |
| "Show All Routes" toggle | Ghost routes already provide all-routes context with clear hierarchy |
| Server-side route switching / SSR | Project constraint: static output only |
| Per-route tile styling | Same forest terrain for all routes; CyclOSM is correct for all |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PIPE-01 | Phase 33 | Complete |
| PIPE-02 | Phase 33 | Complete |
| PIPE-03 | Phase 33 | Complete |
| PIPE-04 | Phase 33 | Complete |
| PIPE-05 | Phase 33 | Complete |
| SEL-01 | Phase 34 | Complete |
| SEL-02 | Phase 34 | Complete |
| SEL-03 | Phase 34 | Complete |
| MAP-01 | Phase 34 | Complete |
| MAP-02 | Phase 34 | Complete |
| MAP-03 | Phase 34 | Complete |
| MAP-04 | Phase 34 | Complete |
| MAP-05 | Phase 34 | Complete |
| ELEV-01 | Phase 35 | Complete |
| ELEV-02 | Phase 35 | Complete |
| ELEV-03 | Phase 35 | Complete |
| STAT-01 | Phase 35 | Complete |
| STAT-02 | Phase 35 | Complete |
| DL-01 | Phase 36 | Complete |
| LINK-01 | Phase 36 | Complete |
| HERO-01 | Phase 36 | Complete |

**Coverage:**
- v1.5 requirements: 21 total
- Mapped to phases: 21/21
- Unmapped: 0

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after Phase 36 completion*
