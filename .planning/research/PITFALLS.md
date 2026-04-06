# Domain Pitfalls: v1.5 Multi-Route Support

**Domain:** Adding multiple route variants (100mi/100k/50k) to an existing single-route Leaflet + Chart.js cycling map
**Researched:** 2026-04-06
**Confidence:** HIGH (all pitfalls derived from reading actual source code and analyzing all three GPX files)

---

## Critical Pitfalls

Mistakes that cause rewrites, broken features, or data corruption. Recovery cost: HIGH.

---

### Pitfall 1: Surface Data Has No Source for 100k/50k Routes

**What goes wrong:** The current surface coloring pipeline depends on `hiawathasRevenge.json` -- a RidewithGPS export that contains an `S` field (surface type) per track point. This JSON export exists only for the 100mi route. The 100k GPX comes from Strava and the 50k from RidewithGPS, but neither has the companion `.json` export with `S` values. Without this, `generate-surface-points.js` cannot produce surface coloring for the shorter routes.

**Why it happens:** `generate-surface-points.js` (lines 39-44) loads `hiawathasRevenge.json` and builds a coordinate lookup map from `rwgps.route.track_points[].S`. The script then matches simplified route points against this map using 5-decimal-place coordinate keys. There is no fallback, no second data source. The script will exit with code 1 if >5 points are unmatched (lines 98-101).

**Consequences:**
- Pipeline crashes on 100k/50k if naively extended to process multiple GPX files
- If you skip surface data for shorter routes, the map loses its signature visual feature (surface-colored polylines)
- If you try to reuse the 100mi surface lookup for shared segments, coordinate precision differences between GPX sources (Strava uses 7 decimal places, RidewithGPS uses 5) will cause lookup misses

**Warning signs:**
- `generate-surface-points.js` exits with "ERROR: N unmatched points" for non-100mi routes
- Surface polylines render entirely as "unknown" color for shorter routes
- Coordinate key format `"lat,lon"` fails to match across different GPX precision levels

**Prevention:**
1. For shared segments (where 100k/50k overlap with 100mi), use nearest-neighbor geographic matching instead of exact coordinate key lookup. A haversine distance threshold of ~10m would match corresponding points across GPX sources with different precision.
2. For route segments unique to shorter routes, either obtain RidewithGPS JSON exports for those routes OR infer surface type from the 100mi route's surface data by geographic proximity.
3. Alternatively, restructure to make surface data route-agnostic: build a geographic surface lookup indexed by lat/lon regions, then query it per-route at generation time.

**Detection:** Pipeline error output. Test by running `generate-surface-points.js` against 100k route data early.

**Recovery cost:** HIGH -- requires rethinking the surface data pipeline architecture, not just parameterizing it.

**Which phase should address it:** First pipeline phase. Must be solved before any per-route data generation works.

---

### Pitfall 2: Event Bus Messages Lack Route Context (Cross-Component Desync)

**What goes wrong:** The CustomEvent bus dispatches `elevation:hover` with `{ miles }` and `elevation:leave` with no payload. When multiple routes exist, the map's `snapByMiles()` function (RouteMap.astro line 216-224) searches the module-scope `routePoints` variable. If the elevation chart shows the 50k route (31 miles) but the map still has 100mi `routePoints` loaded, a hover at mile 25 will snap to the wrong geographic point on the wrong route.

**Why it happens:** The event bus was designed for a single route. `routePoints` is assigned once (line 322) and never updated. The `elevation:hover` handler (line 228-234) uses it directly with no concept of "which route am I tracking." Similarly, the elevation chart (ElevationProfile.astro line 168) dispatches `miles` without any route identifier.

**Consequences:**
- Bike marker animates along the wrong route's coordinates when a shorter route is selected
- Crosshair position on the elevation chart may show nonsensical mile values
- No error is thrown -- the system silently produces wrong behavior, making it hard to catch in testing

**Warning signs:**
- Hovering the 50k elevation chart moves the bike marker to the 100mi route's corresponding mileage point
- After switching routes, the bike marker appears in geographic locations not on the visible polyline

**Prevention:**
1. Add a `routeId` field to the `elevation:hover` event detail: `{ miles, routeId }`.
2. Update `RouteMap.astro` to maintain a `currentRouteId` and `routePoints` reference that updates when the route changes. The hover handler should check `routeId` matches before snapping.
3. Dispatch a new `route:change` event when the user switches routes. Both the map and elevation chart should listen for this and swap their internal state.
4. Consider whether `elevation:leave` also needs route context (it probably does not, since it only removes the marker).

**Detection:** Manual testing -- hover the elevation chart after switching routes and watch where the bike marker goes.

**Recovery cost:** MEDIUM -- the fix is straightforward (add routeId to events, add state management), but every component that touches the event bus needs updating simultaneously.

**Which phase should address it:** Must be addressed in the same phase that adds route switching UI, before the elevation chart is made route-aware.

---

### Pitfall 3: Sector startIdx/endIdx Are Route-Specific Array Indices

**What goes wrong:** Annotations in `annotations.json` store `startIdx` and `endIdx` as integer indices into the 100mi route's 456-point `simplifiedPoints` array. These indices are used directly in `RouteMap.astro` (line 368: `latlngs.slice(sector.startIdx, sector.endIdx + 1)`) to extract sector polyline coordinates, and in `compute-sector-elevations.js` (line 63: `routePoints.slice(startIdx, endIdx + 1)`) to extract elevation data. If you generate different simplified point arrays for 100k/50k routes (which will have different point counts and different indices), the same sector IDs will need different `startIdx`/`endIdx` values per route.

**Why it happens:** `resolve-annotations.js` calls `snapByMileage()` which returns a `snapIdx` -- the index in the 100mi route's point array closest to the sector's start/end mile. The 100k route will have a completely different set of simplified points, with different array lengths and different index assignments for the same geographic locations.

**Consequences:**
- Sector overlays drawn using 100mi indices on the 100k point array will cover the wrong geographic area or crash with out-of-bounds access
- Elevation sparklines for sectors will show wrong elevation data
- The sector detail panel's mile ranges (startMile/endMile) are mileage-correct, but the visual rendering (polylines, sparklines) will be wrong

**Warning signs:**
- Sector polylines on map visually do not align with the actual sector roads when a shorter route is selected
- Sparkline elevation shapes do not match the sector's actual terrain
- `slice()` returns empty arrays or arrays extending past the sector boundary

**Prevention:**
1. Generate per-route annotation files (e.g., `annotations-100mi.json`, `annotations-100k.json`, `annotations-50k.json`) with route-specific `startIdx`/`endIdx` values.
2. The `startMile`/`endMile` values must also be recomputed per route -- a sector at "mile 25.3" on the 100mi route will be at a different mile marker on the 100k route because the routes share a start point but diverge at different distances.
3. Frontend code must swap annotation data when the route changes, not just the polyline.
4. For sectors that do not exist on a shorter route, the annotation file should simply omit them.

**Detection:** Visual inspection -- draw sector overlays on the map for each route and verify they align with the actual sector roads.

**Recovery cost:** HIGH -- this is a data architecture change that propagates through `resolve-annotations.js`, `compute-sector-elevations.js`, `generate-sector-details.js`, and all frontend consumers (RouteMap.astro sector overlays, sector labels, sector detail panels, ElevationProfile.astro sector bands).

**Which phase should address it:** Pipeline restructuring phase, immediately after parse-gpx is made multi-route capable.

---

### Pitfall 4: Single-File Data Architecture Prevents Clean Route Switching

**What goes wrong:** All pipeline output goes to single files with no route qualifier: `route-data.json`, `surface-points.json`, `annotations.json`, `sector-details.json`, `sector-elevations.json`. The content config (`content.config.ts`) defines Zod schemas and Astro content collections that expect these exact filenames. The frontend fetches these paths directly (RouteMap.astro line 309-316, ElevationProfile.astro line 56). Going to multi-route means either: (a) restructuring to per-route files (breaking all existing references), or (b) merging all routes into the same files with a route key (requiring schema changes everywhere).

**Why it happens:** The system was correctly designed for a single route. Every layer -- pipeline scripts, content collections, Zod schemas, and frontend fetch calls -- assumes one route dataset.

**Consequences:**
- Naive approach of "just run the pipeline 3 times" would overwrite data files
- Content collection schemas need restructuring regardless of file strategy
- Build-time components (RouteStats.astro, ElevationSparkline.astro) use `getEntry('routeData', 'route')` which expects a single entry

**Warning signs:**
- Pipeline runs for 100k overwrite 100mi data in `route-data.json`
- Astro content collections fail validation if schema does not match new multi-route structure

**Prevention:**
Choose one strategy early and commit to it across the entire stack:

**Option A: Per-route file namespace** (Recommended)
- Output: `route-data-100mi.json`, `route-data-100k.json`, `route-data-50k.json` (same pattern for all data files)
- Content collections: use a glob loader pattern or restructure to folder-based collections
- Frontend: fetch based on selected route ID
- Pro: Each file is self-contained, easy to reason about, lazy-loadable
- Con: More files, content collection refactoring needed

**Option B: Single file with route-keyed structure**
- Output: `route-data.json` contains `{ "100mi": {...}, "100k": {...}, "50k": {...} }`
- Content collections: update schemas to expect the wrapping object
- Frontend: destructure by route key after fetch
- Pro: Fewer files, simpler fetch logic
- Con: Larger single file, more complex schemas, all routes loaded even when only one is viewed

**Recommendation: Option A.** Per-route files are cleaner, smaller, and allow the frontend to lazy-load only the selected route's data. The content collection refactoring is a one-time cost.

**Detection:** Attempt to run pipeline for two routes and observe file overwrites.

**Recovery cost:** HIGH if you start building without deciding. Retrofitting file naming and content collection schemas after components are built causes cascading changes.

**Which phase should address it:** Very first pipeline phase. This is a prerequisite decision that determines how every other phase operates.

---

### Pitfall 5: parse-gpx.js Elevation Gain Calibration Is Route-Specific

**What goes wrong:** `parse-gpx.js` (lines 111-136) has a calibration loop that tries noise filter thresholds (2m, 1m, 3m, 1.5m, 2.5m, 4m) to hit a target elevation gain range of 2,123-2,411 ft. This range was empirically determined for the 100mi route against Garmin/Strava recordings. Running the same calibration logic against the 100k or 50k GPX files will target a range that is meaningless for those routes, causing the loop to either: (a) land on a bad threshold, or (b) fail to find any threshold in range and silently use the default 2m.

**Why it happens:** The target range constants (`TARGET_MIN_FT = 2123`, `TARGET_MAX_FT = 2411`) are hardcoded for the 100-mile route. The entire calibration section was designed as a one-time validation step, not a reusable algorithm.

**Consequences:**
- Elevation gain figures for 100k/50k will either be wrong or use an inappropriate noise threshold
- RouteStats.astro displays `elevationGainFeet` from meta -- wrong values will be user-visible
- If the calibration silently succeeds with a bad threshold, the error is invisible until someone cross-checks against Strava

**Warning signs:**
- Console output during pipeline: threshold scan shows no checkmark ("IN RANGE") line for shorter routes
- Elevation gain for 50k route appears unreasonably high or low vs Strava data
- 100k elevation gain does not roughly scale proportionally to 100mi

**Prevention:**
1. Remove the hard-coded target range from `parse-gpx.js`. Use a fixed threshold (e.g., 2m, the value that works for 100mi) for all routes, or allow per-route configuration.
2. If per-route calibration is desired, accept target ranges as parameters or read them from a route config file.
3. Log the computed elevation gain prominently and require manual verification against Strava for each route before shipping.

**Detection:** Pipeline console output -- check if "IN RANGE" appears for each route during the threshold scan.

**Recovery cost:** LOW -- the fix is straightforward code parameterization. But the data error is invisible, so the real cost is shipping wrong numbers to users.

**Which phase should address it:** parse-gpx.js refactoring, first pipeline phase.

---

## Moderate Pitfalls

Mistakes that cause significant delays or technical debt. Recovery cost: MEDIUM.

---

### Pitfall 6: GPX Files Come from Different Sources with Incompatible Structures

**What goes wrong:** The three GPX files have different origins and structures:
- 100mi (`Munising_Hiawatha_s_Revenge.gpx`): RidewithGPS export, 1,927 points, 5-decimal lat/lon
- 100k (`Hiawatha_s_Revenge_100k.gpx`): Strava export, 2,780 points, 7-decimal lat/lon, triplicate start points, different XML namespace
- 50k (`Hiawatha_s_Revenge_50K_.gpx`): RidewithGPS export, 954 points, 5-decimal lat/lon, has `<metadata>` block with `<link>` and `<time>` elements

The current `parse-gpx.js` accesses `parsed.gpx.trk.trkseg.trkpt` directly. The 50k GPX nests `<trk>` inside `<trk><name>` and `<metadata>` blocks, while the 100k has a simpler Strava structure. Different XML shapes may cause fast-xml-parser to produce different JavaScript object structures.

**Why it happens:** GPX is a standard, but different tools (Strava, RidewithGPS, Garmin) produce slightly different XML structures and precision levels. The 100k file duplicates its first point 3 times (likely a Strava export artifact).

**Consequences:**
- Parser may crash if GPX structure differs from what `parse-gpx.js` expects
- Duplicate start points in 100k inflate distance calculation at the very start
- Coordinate precision differences (5 vs 7 decimal places) propagate through all downstream matching

**Warning signs:**
- `parse-gpx.js` crashes with "Cannot read property 'trkpt' of undefined"
- Total distance for a route is slightly off from expected due to duplicate points
- Point count per route varies wildly (954 vs 2,780) affecting RDP simplification output

**Prevention:**
1. Add defensive GPX parsing: normalize the path to `trkpt` array, handle both single-track and multi-track structures, deduplicate consecutive identical points.
2. Normalize coordinate precision early (round to 5 decimal places) across all routes.
3. Add a `routes.config.js` or similar that declares per-route metadata: GPX filename, source format, expected total distance, and which sectors apply.

**Detection:** Run `parse-gpx.js` against each GPX file individually and compare output.

**Recovery cost:** MEDIUM -- requires refactoring parse-gpx.js, but the changes are well-scoped.

**Which phase should address it:** First pipeline phase, as part of parse-gpx.js multi-route refactoring.

---

### Pitfall 7: Content Collections and Build-Time Components Assume Single Route

**What goes wrong:** Multiple Astro components consume route data at build time through content collections:
- `RouteStats.astro` (line 4-5): `getEntry('routeData', 'route')` returns one entry, destructures `totalMiles` and `elevationGainFeet`
- `ElevationSparkline.astro` (line 13): `getCollection('sectorElevations')` returns all sectors -- no route filtering
- `content.config.ts` (lines 10-16): wraps `route-data.json` as a single entry with id `'route'` using a custom parser

These build-time components render static HTML. Multi-route requires dynamic content that changes based on user interaction.

**Why it happens:** Build-time rendering is the correct Astro pattern for a single-route site. Multi-route requires runtime content switching that is fundamentally at odds with static rendering.

**Consequences:**
- RouteStats.astro can only show one route's stats at build time -- the other two need JavaScript to swap
- ElevationSparkline.astro renders all sector sparklines at build time -- would need to render sparklines for all routes x sectors (up to 21 combinations)
- Astro content collection schemas need restructuring

**Warning signs:**
- Stats section always shows 100mi values regardless of route selection
- Sector sparklines in the RouteExplainer section show 100mi elevation profiles even when a shorter route is selected

**Prevention:**
1. Keep RouteStats as a build-time component but render all three route variants in hidden containers, toggled by client-side JavaScript based on route selection. This preserves static HTML performance while enabling route switching.
2. For ElevationSparkline, either pre-render all route variants (feasible -- only ~21 SVGs total) or convert to client-side rendering.
3. Default to 100mi on page load (the primary/flagship route), switch on user interaction.
4. Update content collections to load per-route data files.

**Detection:** Select a non-default route and check if stats/sparklines update.

**Recovery cost:** MEDIUM -- patterns are known, but touching build-time components requires understanding Astro's hydration boundaries.

**Which phase should address it:** After pipeline produces per-route data, before UI route switching is wired up.

---

### Pitfall 8: Sector-to-Route Mapping Is Not Defined Anywhere

**What goes wrong:** The project context says "shorter routes use subset of same 7 gravel sectors" but there is no formal mapping of which sectors appear on which route. The sector definitions in `resolve-annotations.js` use mile markers from the 100mi route (e.g., "Doe Lake starts at mile 84.8"). The 100k route is only ~62 miles long, and the 50k is ~31 miles -- sectors beyond those distances obviously are not on those routes. But sectors are defined by geographic location, not by mile marker, and a shorter loop that takes a different return path might pass through a sector at a different mile marker than the 100mi route.

**Why it happens:** The existing system has no concept of "which route does this sector belong to." Sectors are defined purely by mile markers on the 100mi route.

**Consequences:**
- Without explicit sector-to-route mapping, the frontend cannot filter sector overlays per route
- Mile-based sector boundaries from the 100mi route do not transfer to shorter routes (a sector at "mile 25" on the 100mi route might be at "mile 20" on the 100k route, or might not appear at all)
- Risk of showing sectors on routes that do not actually traverse them

**Warning signs:**
- Sector overlays appear on the map for routes that do not pass through those geographic areas
- Sector mile ranges in detail panels do not match the selected route's distance markers
- User confusion when "Doe Lake (mile 84.8)" appears while viewing a 31-mile route

**Prevention:**
1. Create a route configuration file that explicitly maps routes to their sectors. Based on the route distances (100mi = 102mi, 100k = 62mi, 50k = 31mi) and sector mile ranges, a plausible mapping is:
   - **100mi**: all 7 sectors (520, NF2266, Bass Lake, NF2217, ND2225, Doe Lake, Rapid River)
   - **100k**: first 4 sectors (520, NF2266, Bass Lake, NF2217) -- sectors beyond ~43 miles are past the 100k turnaround
   - **50k**: first 2-3 sectors (520, NF2266, possibly Bass Lake) -- sectors beyond ~25 miles are past the 50k turnaround
2. Validate this mapping by checking geographic overlap between each route's coordinates and each sector's coordinate range.
3. Pipeline should generate per-route sector annotations with route-specific mile markers.
4. This mapping must be verified against the actual GPX tracks, not assumed from distance alone.

**Detection:** Overlay all three routes on a map and visually check which sectors each route passes through.

**Recovery cost:** MEDIUM -- the mapping itself is simple once verified, but it must be propagated through the entire pipeline and frontend.

**Which phase should address it:** Route configuration phase, before pipeline generates per-route annotations.

---

### Pitfall 9: Map Layer Cleanup on Route Switch (Leaflet Memory Leak)

**What goes wrong:** RouteMap.astro creates multiple Leaflet layers that are never designed to be removed: base polyline (line 336-338), sector ghost/visible polylines (lines 371-374), sector label markers (lines 564-569), restock markers (lines 604-613), and photo cluster group (line 625-655). These layers are added to the map via `.addTo(map)` during `initMap()`. When switching routes, all route-specific layers need to be removed and new ones added. Leaflet layers that are added but never removed cause memory leaks and visual artifacts.

**Why it happens:** `initMap()` is a fire-once function. It does not return references to created layers in a structure suitable for later removal. Variables like `sectorLayers` are scoped inside `initMap()` and inaccessible from a route-switch handler.

**Consequences:**
- Old route polylines remain visible when new route is selected (visual clutter)
- Sector overlays from the wrong route remain interactive (clicking shows wrong sector data)
- Memory usage grows with each route switch (Leaflet layers accumulate)
- `bikeMarker`, `routePoints`, `initialBounds` retain stale values

**Warning signs:**
- Multiple route polylines visible simultaneously after switching
- Clicking a sector overlay opens the wrong route's sector panel
- Browser memory increases with repeated route switches
- `fitBounds` zooms to wrong extent after switch

**Prevention:**
1. Refactor `initMap()` to separate initialization from data rendering. `initMap()` creates the map, tiles, and controls once. A new `renderRoute(routeId)` function handles data-specific layers.
2. Use a Leaflet `L.layerGroup()` or `L.featureGroup()` to hold all route-specific layers. On route switch, call `layerGroup.clearLayers()` before adding new ones.
3. Expose module-scope references to the route layer group and current route ID.
4. Update `initialBounds` when route changes so the reset control works correctly.

**Detection:** Switch routes multiple times and monitor: (a) visual layer count, (b) DevTools memory tab.

**Recovery cost:** MEDIUM -- the refactoring is well-understood, but RouteMap.astro is the largest and most complex component (692 lines).

**Which phase should address it:** Same phase as the route selector UI on the map.

---

### Pitfall 10: Chart.js Elevation Profile Cannot Swap Data Without Careful Orchestration

**What goes wrong:** ElevationProfile.astro creates a Chart.js instance (line 82) with hardcoded dataset, scale configuration (`x.max = routeData.meta.totalMiles`), and sector band annotation overlays. The `chart` instance is scoped inside `initChart()` (line 82) and not accessible from outside. The sector annotations object (lines 68-79) is built once from fetched data. There is no mechanism to rebuild any of this when the route changes.

**Why it happens:** `chart` is function-scoped. The sector annotations, axis max, and data array are all set once at construction time.

**Consequences:**
- After route switch, elevation chart still shows old route data
- X-axis max stays at 100mi value (~102 miles), causing a 50k route (~31 miles) to render compressed into the left third of the chart with massive empty space
- Sector band overlays correspond to wrong mile ranges
- Crosshair dispatches wrong mile values via `elevation:hover`

**Warning signs:**
- Elevation chart looks "compressed" into the left portion after switching to a shorter route
- Sector band overlays do not align with elevation features
- Hovering the chart dispatches miles beyond the shorter route's total distance

**Prevention:**
1. Expose the `chart` instance at module scope (similar to how `bikeMarker` and `leafletMap` are exposed in RouteMap.astro).
2. Create an `updateChart(routeId)` function that: fetches the new route data, replaces `chart.data.datasets[0].data`, updates `chart.options.scales.x.max`, rebuilds sector annotations, and calls `chart.update()`.
3. Listen for the `route:change` event and call `updateChart()`.
4. Alternative: destroy the chart (`chart.destroy()`) and recreate it entirely. This is simpler but causes a visible flash. With `animation: false` already set, the flash is minimal.

**Detection:** Switch routes and check that the elevation chart x-axis max matches the new route's total distance.

**Recovery cost:** MEDIUM -- Chart.js data swapping is documented but the annotation plugin integration adds complexity.

**Which phase should address it:** Same phase as the elevation profile per-route support.

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable. Recovery cost: LOW.

---

### Pitfall 11: RouteExplainer.astro Hardcoded Segments Cannot Be Route-Filtered

**What goes wrong:** RouteExplainer.astro (lines 17-25) has a hardcoded `SEGMENTS` array with all 7 sectors, mile ranges, and editorial descriptions. This is rendered at build time with no mechanism for filtering by route. The component also has a hardcoded intro text: "100 miles of forest roads..." (line 57-58) which is wrong for 100k and 50k routes.

**Why it happens:** Build-time rendering. The component was designed to show a single route's sector breakdown.

**Consequences:**
- Route explainer always shows all 7 sectors regardless of selected route
- Sector cards for sectors not on the selected route create confusion
- Intro text is factually wrong for shorter routes

**Warning signs:**
- 50k route selected but all 7 sector cards visible
- "100 miles" text appears while viewing 50k route

**Prevention:**
1. Simplest approach: keep all sectors visible (they are editorial content about the ride) and add a visual indicator showing which sectors are on the currently selected route. This avoids the complexity of conditionally hiding/showing build-time HTML.
2. If filtering is required: render all sector cards at build time with `data-routes="100mi,100k"` attributes, then use client-side JavaScript to show/hide based on route selection.
3. Update the intro paragraph dynamically or use a template that adapts to the selected route.
4. Consider whether the RouteExplainer even needs route-awareness -- it may be more useful as "here are all the sectors on the full ride" regardless of which distance you choose.

**Detection:** Select a shorter route and check if irrelevant sector cards are still visible.

**Recovery cost:** LOW-MEDIUM -- the simplest approach (visual indicators) is low effort. Full filtering is medium due to build-time vs runtime tension.

**Which phase should address it:** After route switching is functional, as a polish item.

---

### Pitfall 12: GPX Download Link Is Hardcoded to Single Route

**What goes wrong:** `index.astro` (lines 48-53) has a single `<a href="/Munising_Hiawatha_s_Revenge.gpx" download="HiawathasRevenge.gpx">` download link. `copy-gpx.js` copies only the 100mi GPX file to `public/`. Multi-route requires per-route download links and per-route GPX files in `public/`.

**Why it happens:** Single-route design. One GPX file, one download button.

**Consequences:**
- Users always download the 100mi GPX regardless of which route they are viewing
- Missing download capability for 100k and 50k routes

**Warning signs:**
- Download button label says "Download GPX File" with no route indication
- Downloaded file is always 100mi regardless of route context

**Prevention:**
1. Update `copy-gpx.js` to copy all three GPX files to `public/` with consistent naming.
2. Make the download section route-aware: either show three download buttons always, or dynamically update the download link based on the selected route.
3. Include the route name in the download filename (e.g., `HiawathasRevenge-100mi.gpx`).

**Detection:** Check download link href after route switch.

**Recovery cost:** LOW -- straightforward file copying and link updates.

**Which phase should address it:** Late phase, after route switching is functional.

---

### Pitfall 13: Photo Matching Assumes Single Route Point Array

**What goes wrong:** `match-photos.js` snaps photo mileage to coordinates using the 100mi route's point array. Photos are then placed on the map at these snapped coordinates. For routes that share segments, the photos will still appear at the correct geographic locations. However, photos with mileage values beyond the shorter route's total distance should be excluded from the shorter route's view, or at least not shown when that route is selected.

**Why it happens:** Photos are assigned mileage in the manifest based on the 100mi route. The mileage-to-coordinate snap uses 100mi route points.

**Consequences:**
- Photo markers for miles beyond a shorter route's distance appear on the map even when that route is selected
- Photo mileage labels in popups may not make sense for shorter routes ("Mile 85" on a 31-mile route)
- Not a crash, but a UX inconsistency

**Warning signs:**
- Photo markers appear in geographic areas not covered by the selected route
- Clicking a photo marker shows a mile value that exceeds the selected route's total distance

**Prevention:**
1. Filter photo markers on the map based on geographic proximity to the selected route's polyline, rather than by mile range.
2. Use the route layer group pattern (from Pitfall 9) to include photo cluster layers in the route-specific layer group.
3. Alternatively, keep all photos visible regardless of route (they are geographic points of interest, not route-specific), but update the mile label in popups based on the selected route.

**Detection:** Select the 50k route and check if photos from mile 80+ are still visible.

**Recovery cost:** LOW -- filtering, not restructuring.

**Which phase should address it:** Same phase as route switching on the map.

---

### Pitfall 14: RDP Simplification Tolerance Is Route-Length Dependent

**What goes wrong:** `parse-gpx.js` uses a fixed RDP tolerance of `0.0002` decimal degrees which produces ~456 points from the 100mi route's 1,927 raw points. The 100k route has 2,780 points (more than 100mi despite being shorter -- Strava exports are denser) and the 50k has 954 points. The same tolerance will produce different point densities for different routes. The 100k may simplify to 600+ points (triggering the warning on line 74-76), while the 50k may simplify to ~100 points (possibly losing elevation detail).

**Why it happens:** The tolerance was tuned for the 100mi route's specific point density and geographic spread. Different source tools (Strava vs RidewithGPS) produce different raw point densities.

**Consequences:**
- Inconsistent visual quality across routes (50k may look angular, 100k may be unnecessarily dense)
- Point count warnings in build output
- Performance differences in map rendering

**Warning signs:**
- "WARNING: N points exceeds 600 target" in pipeline output for 100k
- 50k route polyline looks jagged on the map
- Large file size variance across route data JSON files

**Prevention:**
1. Use adaptive tolerance: adjust per route until point count falls in a target range (200-500 points).
2. Alternatively, deduplicate identical points first (the 100k GPX has 3 duplicate start points), then apply RDP.
3. Log the point count per route and visually verify each simplified route.

**Detection:** Pipeline console output -- check simplified point count for each route.

**Recovery cost:** LOW -- tolerance tuning is a configuration change, not an architectural one.

**Which phase should address it:** parse-gpx.js refactoring in the first pipeline phase.

---

### Pitfall 15: Stale Module-Scope Variables After Route Switch

**What goes wrong:** RouteMap.astro has module-scope variables (lines 208-212): `bikeMarker`, `routePoints`, `leafletMap`, `activeSector`, `previousFocus`. These are set during `initMap()` and referenced by window event listeners. When switching routes, `routePoints` must be updated, `activeSector` must be cleared (its referenced polylines will be removed), and `bikeMarker` must be removed from the map. If any of these are missed, the system operates on stale state.

**Why it happens:** Module-scope state was appropriate for single-route initialization. Multi-route turns "initialize once" into "initialize once, update many times."

**Consequences:**
- `activeSector` references a layer from the previous route that no longer exists on the map
- Calling `activeSector.visiblePoly.setStyle()` on a removed layer throws errors
- `routePoints` contains the wrong route's point array, causing `snapByMiles()` to return wrong coordinates

**Warning signs:**
- JavaScript console errors after route switch: "Cannot read property 'setStyle' of null" or similar
- Route switch works the first time but breaks on subsequent switches
- Bike marker disappears or appears at wrong location after route switch

**Prevention:**
1. Create a `resetRouteState()` function that clears all route-specific module-scope variables.
2. Call `resetRouteState()` before loading new route data.
3. Consider consolidating route-specific state into a single object for easier lifecycle management:
   ```js
   let routeState = { id: null, points: null, layerGroup: null, activeSector: null };
   ```

**Detection:** Switch routes 3+ times rapidly and check for console errors.

**Recovery cost:** LOW -- once identified, the fix is mechanical.

**Which phase should address it:** Same phase as route switching UI.

---

## Pitfall Dependency Chain

Some pitfalls must be solved in order because later solutions depend on earlier ones:

```
Pitfall 4 (file naming decision)
  |
  v
Pitfall 6 (GPX parsing normalization) + Pitfall 8 (sector-to-route mapping)
  |
  v
Pitfall 5 (elevation calibration) + Pitfall 14 (RDP tolerance)
  |
  v
Pitfall 1 (surface data pipeline) + Pitfall 3 (per-route indices)
  |
  v
Pitfall 7 (content collections)
  |
  v
Pitfall 2 (event bus context) + Pitfall 9 (layer cleanup) + Pitfall 15 (state reset)
  |
  v
Pitfall 10 (chart swap)
  |
  v
Pitfall 11 (RouteExplainer) + Pitfall 12 (downloads) + Pitfall 13 (photos)
```

**Reading the chain:** You cannot solve layer cleanup (Pitfall 9) without first having per-route data files (Pitfall 4) and per-route annotations (Pitfall 3). You cannot solve per-route annotations without first normalizing GPX parsing (Pitfall 6) and knowing which sectors belong to which route (Pitfall 8).

---

## Phase-Specific Warning Summary

| Phase Topic | Likely Pitfalls | Highest Severity | Key Mitigation |
|-------------|----------------|------------------|----------------|
| Pipeline multi-route | 1 (surface data), 4 (file naming), 5 (elevation cal), 6 (GPX sources), 14 (RDP tolerance) | CRITICAL | Decide file namespace first; nearest-neighbor surface matching; normalize GPX parsing |
| Route config & sector mapping | 3 (indices), 8 (sector-to-route) | CRITICAL | Create explicit route config; generate per-route annotations with route-specific indices |
| Content collection refactoring | 7 (build-time components) | MODERATE | Pre-render all route variants; update Zod schemas |
| Route selector UI & map | 2 (event bus), 9 (layer cleanup), 15 (stale state) | CRITICAL | Add routeId to events; use L.layerGroup; consolidate route state |
| Elevation profile per-route | 10 (chart swap) | MODERATE | Expose chart instance; create updateChart function |
| Route explainer & polish | 11 (hardcoded segments) | MINOR | data-routes attributes with JS show/hide |
| Downloads & photos | 12 (GPX links), 13 (photo filtering) | MINOR | Copy all GPX files; filter markers by route extent |

---

## Sources

All pitfalls derived from direct source code analysis of the Hiawatha's Revenge codebase at `/Users/Sheppardjm/Repos/hiawathasRevenge/`:

**Pipeline scripts analyzed:**
- `scripts/pipeline.js` -- 12-step pipeline orchestrator
- `scripts/parse-gpx.js` -- GPX parsing with RDP simplification (line 22: hardcoded GPX filename, lines 111-136: elevation calibration)
- `scripts/generate-surface-points.js` -- Surface type mapping via RidewithGPS S field (lines 39-44: single JSON source, lines 98-101: fail threshold)
- `scripts/resolve-annotations.js` -- Sector/restock snapping to route indices (lines 87-117: startIdx/endIdx from single route)
- `scripts/generate-sector-details.js` -- Editorial content merge with annotation geometry
- `scripts/compute-sector-elevations.js` -- Per-sector elevation extraction using startIdx/endIdx (line 63)
- `scripts/copy-gpx.js` -- Single GPX file copy (line 15: hardcoded filename)
- `scripts/match-photos.js` -- Photo mileage snapping to single route (line 23: single route path)

**Frontend components analyzed:**
- `src/components/RouteMap.astro` -- Leaflet map (lines 208-212: module-scope state, lines 228-234: event handler, lines 309-316: data fetches, line 336-338: base polyline, lines 364-403: sector overlays)
- `src/components/ElevationProfile.astro` -- Chart.js (line 56: single route fetch, line 82: scoped chart instance, line 139: hardcoded x-axis max, line 168: event dispatch without routeId)
- `src/components/RouteExplainer.astro` -- Build-time segments (lines 17-25: hardcoded SEGMENTS, line 57: "100 miles" text)
- `src/components/RouteStats.astro` -- Build-time stats (line 4-5: single entry content collection)
- `src/components/ElevationSparkline.astro` -- Build-time sparklines (line 13: unfiltered collection)
- `src/content.config.ts` -- Content collections (lines 10-16: single-entry route data, all schemas)
- `src/pages/index.astro` -- Page layout (lines 48-53: single GPX download link)

**GPX file analysis:**
- 100mi: 1,927 raw points, 102 miles, RidewithGPS export, paired with `hiawathasRevenge.json` (has surface `S` field)
- 100k: 2,780 raw points, 62 miles, Strava export, no companion JSON, 7-decimal precision, 3 duplicate start points
- 50k: 954 raw points, 31 miles, RidewithGPS export, no companion JSON, 5-decimal precision
- All three are loops starting/ending near Munising (~46.364, -86.713)
