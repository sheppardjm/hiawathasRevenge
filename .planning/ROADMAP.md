# Roadmap: Hiawatha's Revenge

## Milestones

- ✅ **v1.0 MVP** - Phases 0-11 (shipped 2026-03-31)
- ✅ **v1.1 Visual Redesign** - Phases 12-17 (shipped 2026-03-31)
- ✅ **v1.2 Cultural Maximalism** - Phases 18-22 (shipped 2026-04-02)
- ✅ **v1.3 Interactive Map** - Phases 23-27 (shipped 2026-04-02)
- ✅ **v1.4 Performance & Polish** - Phases 28-32 (shipped 2026-04-06)
- 🚧 **v1.5 Multi-Route Support** - Phases 33-36 (in progress)

## Phases

<details>
<summary>v1.0 through v1.4 (Phases 0-32) -- see MILESTONES.md</summary>

All v1.0-v1.4 phases shipped. See `.planning/MILESTONES.md` for full history.

</details>

### 🚧 v1.5 Multi-Route Support (In Progress)

**Milestone Goal:** Add 100k and 50k route variants alongside the existing 100-mile route with a map-based route selector, per-route elevation profiles, filtered sector display, and GPX downloads for all three distances.

**Phase Numbering:**
- Integer phases (33, 34, 35, 36): Planned milestone work
- Decimal phases (33.1, 34.1): Urgent insertions if needed (marked with INSERTED)

- [x] **Phase 33: Pipeline & Route Data** - Build-time pipeline produces per-route JSON data for all 3 distances
- [ ] **Phase 34: Route Selector & Map Switching** - Users toggle between routes on the map with full visual feedback
- [ ] **Phase 35: Elevation Profile & Route Stats** - Chart and stats stay synchronized with the selected route
- [ ] **Phase 36: Downloads, Deep Linking & Hero Video** - GPX downloads, URL-based route sharing, and hero video replacement

## Phase Details

### Phase 33: Pipeline & Route Data
**Goal**: The build pipeline processes all 3 GPX files and produces correct, per-route JSON data that downstream components can consume
**Depends on**: Nothing (first v1.5 phase; builds on v1.4 pipeline infrastructure)
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05
**Success Criteria** (what must be TRUE):
  1. Running `npm run build` produces three route subdirectories (`public/data/100mi/`, `public/data/100k/`, `public/data/50k/`) each containing `route-data.json`, `annotations.json`, `sector-elevations.json`, and `surface-points.json`
  2. Sector overlays for each route align visually with the actual gravel roads when rendered on the map (coordinate-based snapping, not mile-based)
  3. A `public/data/routes.json` manifest exists with metadata for all 3 routes (id, name, color, sector membership, distance, elevation gain)
  4. All 3 GPX files are available at `public/*.gpx` for download
  5. The existing 100-mile site renders identically to v1.4 when loading from the new `100mi/` subdirectory paths
**Plans**: 3 plans

Plans:
- [x] 33-01-PLAN.md -- Route config, pipeline loop, and parse-gpx multi-route
- [x] 33-02-PLAN.md -- Coordinate-based sector snapping and surface-point generation with fallback
- [x] 33-03-PLAN.md -- Route manifest, GPX copy, content path updates, and pipeline validation

### Phase 34: Route Selector & Map Switching
**Goal**: Users can switch between 100mi, 100k, and 50k routes on the map and see the correct polyline, sector overlays, ghost routes, and labels for their selection
**Depends on**: Phase 33 (requires per-route JSON data to exist)
**Requirements**: SEL-01, SEL-02, SEL-03, MAP-01, MAP-02, MAP-03, MAP-04, MAP-05
**Success Criteria** (what must be TRUE):
  1. A segmented control on the map allows switching between 100mi / 100k / 50k with keyboard arrow navigation and 52px touch targets
  2. Clicking a route option replaces the surface-colored polyline with the selected route and adjusts the map bounds to fit it
  3. Sector overlays, ghost hit targets, and pill labels show only sectors present on the selected route
  4. Inactive routes appear as faint ghost polylines with route-specific colors for geographic context
  5. The sector detail panel closes automatically if showing a sector not present on the newly selected route
**Plans**: 2 plans

Plans:
- [ ] 34-01-PLAN.md -- RouteMap.astro initMap/renderRoute refactor with activeRouteGroup and surface-colored polylines
- [ ] 34-02-PLAN.md -- Route selector control, ghost polylines, route:change event, and ElevationProfile switching

### Phase 35: Elevation Profile & Route Stats
**Goal**: The elevation chart, sector annotation bands, bike marker crosshair, and route stats all stay synchronized with the selected route
**Depends on**: Phase 34 (requires route:change event to be dispatched by the selector)
**Requirements**: ELEV-01, ELEV-02, ELEV-03, STAT-01, STAT-02
**Success Criteria** (what must be TRUE):
  1. Switching routes rebuilds the elevation profile chart with the selected route's distance on x-axis and elevation on y-axis
  2. Sector annotation bands on the chart show only sectors present on the selected route at their correct mile positions
  3. Hovering the elevation chart after a route switch moves the bike marker along the correct route's polyline on the map
  4. Route stats (distance, elevation gain, sector count) update to match the selected route
  5. A comparison sidebar shows all 3 routes' key stats side by side
**Plans**: TBD

Plans:
- [ ] 35-01: Elevation chart destroy/recreate on route:change
- [ ] 35-02: Route stats switching and comparison sidebar

### Phase 36: Downloads, Deep Linking & Hero Video
**Goal**: Users can download GPX files for any route, share links that pre-select a specific route, and experience a video hero section
**Depends on**: Phase 34 (requires route:change event and working route switching)
**Requirements**: DL-01, LINK-01, HERO-01
**Success Criteria** (what must be TRUE):
  1. The GPX download link updates its href and label text to match the currently selected route
  2. Navigating to `#route=100k` in the URL pre-selects the 100k route on page load
  3. Switching routes updates the URL hash via replaceState without a page reload
  4. The hero section plays a looping background video with the existing hero image as poster/fallback
**Plans**: TBD

Plans:
- [ ] 36-01: GPX download switching and URL hash deep linking
- [ ] 36-02: Hero video replacement with image fallback

## Progress

**Execution Order:**
Phases execute in numeric order: 33 → 34 → 35 → 36

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 33. Pipeline & Route Data | v1.5 | 3/3 | ✓ Complete | 2026-04-06 |
| 34. Route Selector & Map Switching | v1.5 | 0/2 | Not started | - |
| 35. Elevation Profile & Route Stats | v1.5 | 0/2 | Not started | - |
| 36. Downloads, Deep Linking & Hero Video | v1.5 | 0/2 | Not started | - |

---
*Roadmap created: 2026-04-06*
*Last updated: 2026-04-06*
