# Requirements: Hiawatha's Revenge

**Defined:** 2026-04-06
**Core Value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.

## v1.5 Requirements

Requirements for multi-route support. Each maps to roadmap phases.

### Pipeline & Data

- [ ] **PIPE-01**: Pipeline processes all 3 GPX files (100mi, 100k, 50k) and produces per-route JSON data (route points, elevation, metadata)
- [ ] **PIPE-02**: Pipeline generates per-route surface-points data for surface-colored polylines (with fallback for routes lacking RidewithGPS surface metadata)
- [ ] **PIPE-03**: Pipeline produces per-route sector annotations with coordinate-based snapping (not mile-based) so sectors map correctly to each route's point array
- [ ] **PIPE-04**: Pipeline validates sector-to-route membership against actual GPS tracks and outputs a route-sector mapping
- [ ] **PIPE-05**: Pipeline copies all 3 GPX files to public/ for download

### Route Selector

- [ ] **SEL-01**: Segmented control (pill bar) on the map with 100mi / 100k / 50k options, 52px touch targets, `role="radiogroup"` with arrow key navigation
- [ ] **SEL-02**: Each route distance has a consistent color identity (e.g., amber/lake/moss) applied to the selector active state and ghost polylines
- [ ] **SEL-03**: Route selector dispatches `route:change` CustomEvent consumed by all route-aware components

### Map Display

- [ ] **MAP-01**: Selected route's surface-colored polyline replaces the previous route on the map via L.layerGroup toggling
- [ ] **MAP-02**: Sector overlays, ghost hit targets, and pill labels filter to show only sectors present on the selected route
- [ ] **MAP-03**: Map fitBounds adjusts to the selected route's geographic extent on route change
- [ ] **MAP-04**: Inactive routes appear as ghost polylines at low opacity (~0.2) with route-specific color for geographic context
- [ ] **MAP-05**: Sector detail panel closes on route change if showing a sector not on the new route

### Elevation & Stats

- [ ] **ELEV-01**: Elevation profile chart swaps data to the selected route (new distance on x-axis, new elevation on y-axis)
- [ ] **ELEV-02**: Sector annotation bands on the elevation chart filter to sectors present on the selected route
- [ ] **ELEV-03**: Bike marker crosshair on the map snaps to the selected route's coordinates (not the previous route)
- [ ] **STAT-01**: Route stats (distance, elevation gain) update to the selected route's values on route change
- [ ] **STAT-02**: Route comparison sidebar shows all 3 routes' key stats (distance, elevation, sector count) side by side

### Downloads & Links

- [ ] **DL-01**: GPX download link updates href and label text to match the selected route
- [ ] **LINK-01**: URL hash deep linking (`#route=100k`) pre-selects the specified route on page load and updates on route change via `history.replaceState`

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
| PIPE-01 | - | Pending |
| PIPE-02 | - | Pending |
| PIPE-03 | - | Pending |
| PIPE-04 | - | Pending |
| PIPE-05 | - | Pending |
| SEL-01 | - | Pending |
| SEL-02 | - | Pending |
| SEL-03 | - | Pending |
| MAP-01 | - | Pending |
| MAP-02 | - | Pending |
| MAP-03 | - | Pending |
| MAP-04 | - | Pending |
| MAP-05 | - | Pending |
| ELEV-01 | - | Pending |
| ELEV-02 | - | Pending |
| ELEV-03 | - | Pending |
| STAT-01 | - | Pending |
| STAT-02 | - | Pending |
| DL-01 | - | Pending |
| LINK-01 | - | Pending |

**Coverage:**
- v1.5 requirements: 20 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 20

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after initial definition*
