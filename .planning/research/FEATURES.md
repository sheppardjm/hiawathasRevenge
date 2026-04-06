# Feature Landscape: v1.5 Multi-Route Support

**Domain:** Cycling event showcase site with multiple distance variants on a shared interactive map
**Researched:** 2026-04-06
**Milestone:** v1.5 Multi-Route Support
**Confidence:** HIGH -- patterns verified across Ride with GPS multi-route embed, UNBOUND Gravel routes page, SBT GRVL course pages, Leaflet layers control documentation, Chart.js update API, segmented control UX research (Apple HIG, Mobbin, W3C APG), and competitive analysis of marathon/endurance event websites

---

## Context

v1.4 shipped a complete single-route showcase: interactive Leaflet map with CyclOSM tiles, surface-colored polyline, 7 clickable gravel sector overlays with detail panels, Chart.js elevation profile synced via CustomEvent bus, route stats, and a GPX download. All data is build-time JSON from a 12-step pipeline processing a single GPX file.

v1.5 adds two additional route variants alongside the existing 100-mile route:
- **100k** (~62 miles, 2,780 GPX points) -- 5 of 7 sectors
- **50k** (~31 miles, 954 GPX points) -- 3 of 7 sectors

All three routes share the same start/finish location in Munising (46.363, -86.712). Shorter routes are geographic subsets of the 100-mile route -- they turn around earlier, not on different roads. The 50k bounding box is a strict subset of the 100k, which is a strict subset of the 100-mile. This "nested" geography simplifies the visualization challenge significantly compared to routes that diverge onto completely different roads.

**Existing assets that remain shared across all routes:**
- Editorial content (HiawathaExplainer, RouteExplainer editorial text)
- Photo gallery and photo markers
- Restock point markers
- Cultural design elements (motifs, dividers, hero, parallax)
- Donate CTA, footer, metadata

**Assets that must become per-route:**
- Route polyline (map)
- Surface coloring data
- Elevation profile chart data
- Sector overlays, labels, and detail panels (filtered to sectors on selected route)
- Route stats (distance, elevation gain)
- GPX download link

---

## Table Stakes

Features users expect when a cycling event site advertises multiple distance options. Missing any of these makes multi-route feel incomplete or confusing.

---

### 1. Route Selector Control on Map

**Why expected:** Every cycling event with multiple distances provides a way to choose which route to view. Ride with GPS multi-route embeds show route names as clickable list items in a sidebar. UNBOUND Gravel (unboundgravel.com/routes/) uses anchor-linked sections per distance. SBT GRVL uses color-coded course cards (Green/Blue/Red/Black). Marathon websites (Toronto Marathon, Jersey City Marathon) use toggle buttons or tab headers for Full/Half/10K/5K. The pattern is universal: the user must be able to select a distance, and the selected distance must be visually obvious.

**What it looks like:** A segmented control (pill-bar/button group) positioned either above the map or overlaid on the map in a control position. Three options: "100mi" / "100k" / "50k". The selected option has a visually distinct active state (filled background, different color). Unselected options appear muted. Clicking an option immediately switches the map display.

**Why segmented control, not tabs or dropdown:**
- **Three options is ideal for segmented controls** -- Apple HIG recommends 2-5 segments. Three route distances fits perfectly.
- **Same content context** -- Segmented controls filter/change presentation within the same view (the map), which matches exactly. Tabs imply separate content areas.
- **Compact footprint** -- A dropdown hides options behind a click. With only 3 options, all should be visible at once to enable quick scanning.
- **Precedent** -- Ride with GPS uses a route name list (essentially a segmented selector). Marathon sites use button bars.

**Accessibility requirements:**
- Use `role="radiogroup"` with individual `role="radio"` elements (per W3C APG radiogroup pattern), since exactly one route is selected at a time -- this is semantically a radio selection, not tab navigation
- `aria-checked="true"` on selected route, `aria-checked="false"` on others
- Arrow key navigation between options (Left/Right moves selection)
- Visible focus indicator on keyboard navigation (existing `:focus-visible` pattern)
- 52px minimum touch target height (existing project constraint)

**Complexity:** LOW -- Pure HTML/CSS/JS. Three buttons in a flex container. Click handler dispatches a `CustomEvent('route:change', { detail: { routeId } })`. No new libraries.

**Dependencies on existing features:**
- RouteMap.astro (selector placed inside or adjacent to map container)
- Existing `getCSSColor()` pattern for design token access
- Existing event bus architecture (`CustomEvent` dispatch/listen)

| Criterion | Detail |
|-----------|--------|
| Implementation | Inline button group rendered in map section; `route:change` event dispatched on click |
| Risk | LOW -- 3 static buttons with CSS active state |
| WCAG | `role="radiogroup"`, arrow key nav, `aria-checked`, `:focus-visible`, 52px targets |

---

### 2. Selected Route Polyline Replaces Previous on Map

**Why expected:** When a user selects a different route distance, the map must show that route's polyline and hide the previous one. This is the fundamental expectation -- Ride with GPS multi-route embed shows only the selected route's polyline when a route name is clicked (the "Show All" mode is a separate toggle). Marathon sites replace the course line entirely. No cycling event site leaves the previous route visible at full opacity when a different route is selected.

**What it looks like:** Clicking "100k" in the selector removes the 100-mile polyline and draws the 100k polyline. The new route's surface coloring (paved/gravel/dirt segments) is applied. The map smoothly transitions its viewport to fit the new route's bounds via `map.fitBounds()` with padding.

**Implementation approach:**
- All three routes' data is loaded at init time (fetched in parallel via `Promise.all` -- the data is small, JSON files under 100KB each)
- Each route's polyline and surface-colored segments are pre-created as Leaflet `L.layerGroup()` instances but only the selected route's group is added to the map via `.addTo(map)`
- On route switch: `currentRouteGroup.removeFrom(map)` then `newRouteGroup.addTo(map)` then `map.fitBounds(newBounds, { padding: [20, 20], animate: !prefersReducedMotion })`
- The base route polyline (dark forest-900 underline) is replaced along with the surface overlay

**Why not Leaflet's built-in `L.control.layers`:** The built-in layers control renders as a collapsible panel with radio buttons in the top-right corner. It is designed for switching tile layers, not for a prominent route selector that is the primary interaction on the page. A custom segmented control is more visually consistent with the site's National Park design system and provides better discoverability.

**Complexity:** MEDIUM -- Requires restructuring `initMap()` to organize layers into per-route groups instead of directly adding them to the map. The existing single-route code adds polylines directly to the map; this needs to be wrapped in a layer group pattern. The core Leaflet API (`L.layerGroup`, `.addTo()`, `.removeFrom()`) is well-documented and straightforward.

**Dependencies on existing features:**
- RouteMap.astro `initMap()` function (must be refactored)
- Route selector (Table Stakes #1)
- Build pipeline producing per-route data (pipeline expansion needed first)
- Surface-points data per route (from pipeline)

| Criterion | Detail |
|-----------|--------|
| Implementation | `L.layerGroup` per route; `.addTo()` / `.removeFrom()` on switch; `fitBounds` animated transition |
| Risk | MEDIUM -- Requires initMap() refactor from flat structure to grouped layer management |
| Performance | All three routes preloaded; switching is instant (no network request on switch) |

---

### 3. Elevation Profile Swaps on Route Change

**Why expected:** Ride with GPS multi-route embed explicitly hides the elevation profile on "Show All" and shows only the selected route's profile. Every cycling route page (Komoot, AllTrails, Ride with GPS individual routes, Strava route pages) pairs the elevation profile with the specific route being viewed. Showing the 100-mile elevation profile while the 50k route is selected is incorrect and confusing.

**What it looks like:** When the user switches routes, the elevation chart smoothly updates to show the new route's distance (x-axis) and elevation (y-axis). The x-axis maximum changes from 102 miles to 62 miles to 31 miles. Sector overlay bands on the chart filter to only show sectors present on the selected route.

**Implementation approach -- update, not destroy:**
Chart.js v4 provides `chart.data.datasets[0].data = newData` followed by `chart.update()` as the documented approach for swapping data. This is more performant than `chart.destroy()` + `new Chart()` because it reuses the existing canvas context, scales, and plugins. The x-axis `max` needs updating via `chart.options.scales.x.max = newTotalMiles`. Sector annotation bands need to be replaced via the annotation plugin config.

The critical detail: the `elevation:hover` / `elevation:leave` CustomEvent bus still works because the chart's `mousemove` handler already converts pixel position to mile value via `chart.scales.x.getValueForPixel()` -- this automatically adjusts when the scale changes.

**Complexity:** MEDIUM -- The Chart.js data swap itself is straightforward (documented API), but the sector annotation bands must also be rebuilt per route, and the crosshair sync must continue working correctly. The bike marker on the map must snap to the correct route's points (not the previously loaded route). This requires coordinating the route data reference update across both RouteMap and ElevationProfile.

**Dependencies on existing features:**
- ElevationProfile.astro `initChart()` function (needs to expose chart instance for updates)
- Route selector event (`route:change`)
- Per-route elevation data from pipeline
- Sector annotations filtered per route
- Bike marker crosshair sync (module-scope `routePoints` variable must be swapped)

| Criterion | Detail |
|-----------|--------|
| Implementation | `chart.data.datasets[0].data = newData; chart.options.scales.x.max = newMax; chart.update()` |
| Risk | MEDIUM -- crosshair sync and annotation band rebuild require careful coordination |
| Performance | Chart.js `update()` is ~10ms for 500 data points; no perceptible delay |

---

### 4. Sector Overlays Filter to Selected Route

**Why expected:** If the 50k route only covers 3 of 7 gravel sectors, showing all 7 sector overlays on the map when the 50k is selected is incorrect. Sectors that don't exist on the selected route should not appear as overlays, labels, or be clickable. This is a correctness requirement more than a UX pattern -- showing non-existent sectors would be actively misleading.

**What it looks like:** When "50k" is selected, only sectors 520, NF2266, and Bass Lake Rd appear on the map. Their polyline overlays, ghost hit targets, and pill labels are visible. The remaining 4 sectors (NF2217-2218, ND2225, Doe Lake, Rapid River) are hidden. When "100mi" is selected, all 7 sectors appear. The detail panel can only be opened for sectors on the current route.

**Sector-to-route mapping (based on mile positions):**

| Sector | Mile Range | 100mi | 100k | 50k |
|--------|-----------|-------|------|-----|
| 520 | 1.1-2.4 | YES | YES | YES |
| NF2266 | 6.7-9.9 | YES | YES | YES |
| Bass Lake Rd | 25.3-30.1 | YES | YES | YES |
| NF2217-2218 | 36.8-43.4 | YES | YES | NO |
| ND2225 | 55.7-59.6 | YES | YES | NO |
| Doe Lake | 84.8-87.9 | YES | NO | NO |
| Rapid River | 94.6-100.9 | YES | NO | NO |

**NOTE:** This mapping assumes sectors are determined by mile-marker position on the 100-mile route and that shorter routes follow the same path for their shared segments. This assumption needs validation against the actual GPX track data -- it is possible that the 100k and 50k routes follow slightly different roads in shared segments, which would change sector inclusion. The pipeline must validate this by checking whether each sector's coordinates actually fall on each route's track. **Mark as MEDIUM confidence until pipeline validates.**

**Implementation approach:**
- Each sector's layers (visible polyline, ghost polyline, label marker) are organized in a per-sector layer group
- A `routeSectors` mapping defines which sector IDs belong to which route: `{ '100mi': ['sector-520', ...all 7], '100k': [...5], '50k': [...3] }`
- On route change: iterate sector groups, `.addTo(map)` for included sectors, `.removeFrom(map)` for excluded sectors
- Close any open sector detail panel on route change (prevents showing details for a now-hidden sector)

**Complexity:** MEDIUM -- Requires wrapping existing per-sector layer creation into named groups and adding/removing them based on route selection. The sector data structures (annotations, sector-details, sector-elevations) are already keyed by sector ID, so filtering is straightforward. The main complexity is ensuring the sector layer management integrates cleanly with the route polyline layer management.

**Dependencies on existing features:**
- Sector overlay rendering in RouteMap.astro (must be wrapped in layer groups)
- Sector label markers (must be conditionally shown/hidden)
- Sector detail panel (must close on route change if showing excluded sector)
- Route selector event (`route:change`)
- Pipeline producing per-route sector mappings

| Criterion | Detail |
|-----------|--------|
| Implementation | Per-sector `L.layerGroup`; route-to-sector mapping; `.addTo()`/`.removeFrom()` on switch |
| Risk | MEDIUM -- sector-to-route mapping must be validated by pipeline against actual GPS tracks |
| Data dependency | New: sector-to-route mapping in build-time data |

---

### 5. Route Stats Update Per Selection

**Why expected:** The existing route stats display shows "102 Miles" and "2,258 Feet of Climbing". When the user selects the 100k route, these numbers must update to the 100k's actual distance and elevation gain. Showing 100-mile stats for a 62-mile route is factually wrong and destroys trust. Every cycling event page with multiple distances shows per-distance stats.

**What it looks like:** The stat cards (Miles, Feet of Climbing) update their values when the route changes. The transition can be instant (no animation needed -- these are reference numbers, not decorative elements). The stat section heading does not change ("Route Stats" is generic and applies to all routes).

**Implementation approach:**
The current `RouteStats.astro` is a server-rendered component that reads from `route-data.json` at build time via Astro content collections. For multi-route, this must become dynamic:

Option A (recommended): **Client-side update.** Render the stat cards with the 100-mile data at build time (same as current). Add `id` attributes to the stat value `<span>` elements. On `route:change`, JavaScript updates the `textContent` of each stat element from a preloaded per-route stats object. This avoids any Astro component changes -- just add IDs and a script listener.

Option B: **Build-time rendering of all three.** Render three sets of stat cards, show/hide based on selection. Simpler logic but more DOM elements and requires CSS class toggling.

Option A is preferred because it adds 10 lines of JavaScript to an existing pattern (`window.addEventListener('route:change', ...)`) and requires no component restructuring.

**Complexity:** LOW -- Minimal code change. Preloaded per-route meta object, textContent swap on event.

**Dependencies on existing features:**
- RouteStats.astro (add `id` attributes to stat value spans)
- Route selector event (`route:change`)
- Per-route metadata from pipeline (totalMiles, elevationGainFeet per route)

| Criterion | Detail |
|-----------|--------|
| Implementation | Add IDs to stat spans; JS listener swaps textContent from preloaded route meta |
| Risk | LOW -- trivial DOM update |
| Data dependency | Per-route meta in a combined routes config object |

---

### 6. GPX Download Per Route

**Why expected:** A cyclist interested in the 50k route needs the 50k GPX file, not the 100-mile file. Every event site with multiple distances provides per-distance downloads. UNBOUND Gravel links to Garmin Connect and Ride with GPS per distance. SBT GRVL provides separate course files per color-coded distance. The current site has a single GPX download link -- this must expand to three, or dynamically change based on selection.

**What it looks like:** Two viable patterns:

**Pattern A (recommended): Dynamic download link.** The existing single GPX download link updates its `href` and visible text when the route changes. "Download 100mi GPX" / "Download 100k GPX" / "Download 50k GPX". Only one link visible at a time, matching the selected route.

**Pattern B: All three always visible.** Three download links shown side by side. Each labeled with its distance. This removes dependency on the route selector but uses more vertical space.

Pattern A is recommended because:
- The GPX download section is physically separated from the map (it is its own section in the page). Showing all three downloads when only one route is selected creates a disconnect.
- A single dynamic link matches the "one selected route at a time" mental model established by the route selector.
- Implementation is simpler (swap `href` and `textContent` on event).

**Implementation approach:**
- Add a `data-route-gpx` attribute and `id` to the download link
- Pipeline copies all three GPX files to `public/` (expand existing `copy-gpx.js`)
- On `route:change`, update the link's `href` to the selected route's GPX filename and update the visible label text

**Complexity:** LOW -- href and textContent swap on event. Pipeline change is trivial (copy 2 additional files).

**Dependencies on existing features:**
- GPX download section in index.astro
- `copy-gpx.js` pipeline step (must copy all 3 files)
- Route selector event (`route:change`)

| Criterion | Detail |
|-----------|--------|
| Implementation | `href` and `textContent` swap on `route:change`; pipeline copies 3 GPX files |
| Risk | LOW -- static file copy + DOM string update |
| Filename convention | `HiawathasRevenge-100mi.gpx`, `HiawathasRevenge-100k.gpx`, `HiawathasRevenge-50k.gpx` |

---

### 7. Pipeline Expansion for Per-Route Data

**Why expected:** This is not a user-facing feature but a build-time prerequisite for all other features. The current 12-step pipeline processes a single GPX file and produces single-route JSON files. Multi-route requires processing 3 GPX files and producing per-route variants of: route-data.json, surface-points.json, annotations.json (sector-to-route mapping), sector-details.json, and sector-elevations.json.

**What it looks like:** The pipeline is either:

**Approach A (recommended): Keyed by route.** Each output file includes data for all three routes, keyed by route ID. Example: `route-data.json` becomes `{ "100mi": { meta: {...}, points: [...] }, "100k": { meta: {...}, points: [...] }, "50k": { meta: {...}, points: [...] } }`. Client code accesses `routeData[selectedRouteId]`.

**Approach B: Separate files per route.** Three sets of files: `route-data-100mi.json`, `route-data-100k.json`, `route-data-50k.json`. Client fetches all three at init.

Approach A is preferred because:
- Fewer HTTP requests (one file with 3 routes vs 3 files per data type)
- Simpler fetch logic (same URL, different key)
- Total data size is manageable: ~100KB for 100mi points + ~30KB for 100k + ~15KB for 50k, all compressed to ~30KB gzip total
- Build-time simplicity: one script writes one file with all routes

**Complexity:** HIGH -- This is the most complex feature in the milestone because it requires modifying the core data pipeline (parse-gpx.js, generate-surface-points.js, resolve-annotations.js, generate-sector-details.js, compute-sector-elevations.js, copy-gpx.js). Each script must be generalized from "process one GPX" to "process N GPX files, produce keyed output." The existing content collection schema (route-data.json used by Astro `getEntry`) also needs updating.

**Dependencies on existing features:**
- All 12 pipeline scripts (6 need modification)
- Astro content collection schema (route-data)
- GPX files for all three routes (already present in repo root)
- annotations source data (sector definitions need route-association metadata)

| Criterion | Detail |
|-----------|--------|
| Implementation | Generalize parse-gpx.js to loop over 3 GPX configs; produce keyed JSON output |
| Risk | HIGH -- pipeline is the foundation; errors here cascade to all downstream features |
| Build order | MUST be completed first before any client-side route switching work |

---

## Differentiators

Features that would make this multi-route implementation stand out beyond the typical cycling event site pattern of "pick a distance, see a map." These are not required for functional correctness but would significantly elevate the user experience.

---

### 1. Ghost Routes (Show Inactive Routes at Low Opacity)

**What:** When a route is selected, the other two routes appear on the map as faded ghost lines (opacity 0.15-0.25, thin weight 2px, neutral gray color). This provides geographic context -- the user can see how the shorter routes relate to the full 100-mile route without visual clutter.

**Value proposition:** Ride with GPS has a "Show All" mode that displays all routes simultaneously. The ghost route pattern is a superior approach for this site because: (a) the routes share significant geography (they overlap for 30+ miles), (b) seeing all three at full opacity would be confusing due to overlap, and (c) the ghost treatment communicates "this exists but isn't selected" clearly. This is the same visual language already used in the existing ghost polyline pattern (invisible 20px-wide hit targets behind visible sector overlays) -- extending it to route switching is architecturally consistent.

**Complexity:** LOW-MEDIUM -- Create ghost polyline layer groups for each non-selected route. On route switch, the previous route becomes a ghost, the new route becomes active, and the third remains a ghost. The ghost polylines use the simplified route data (not surface-colored) for visual simplicity.

**Dependencies:**
- Route polyline layer groups (Table Stakes #2)
- Per-route coordinate data (Table Stakes #7)

| Criterion | Detail |
|-----------|--------|
| Implementation | Additional `L.polyline` per route at opacity 0.2, weight 2, gray color; managed as layer groups |
| Value | HIGH -- provides route comparison context with minimal visual cost |
| Risk | LOW -- additive visual layer, no interaction complexity |

---

### 2. Route Color Coding in Selector and Map

**What:** Each route distance has a consistent color identity used in the selector control, the route polyline (when shown as a ghost), and optionally in the elevation profile. For example: 100mi = amber (existing), 100k = lake blue, 50k = moss green. The selector pills/buttons use these colors as accent or background on the active state.

**Value proposition:** SBT GRVL uses Green/Blue/Red/Black color coding across their entire brand for each distance tier. Color coding creates instant recognition and helps users mentally track which route they are viewing. It also makes ghost routes distinguishable from each other (the user can tell at a glance whether the ghost is the 100k or the 50k).

**Complexity:** LOW -- CSS color tokens already exist in the palette (lake-400, moss-500, amber-500). Apply per-route color to selector active state and ghost polyline stroke color.

**Dependencies:**
- Route selector (Table Stakes #1)
- Ghost routes (Differentiator #1) -- color coding is most valuable when ghost routes are visible
- Existing CSS design tokens

| Criterion | Detail |
|-----------|--------|
| Implementation | Route config object with `{ color: '--color-amber-500' }` per route; applied to selector and polylines |
| Value | MEDIUM -- quick recognition, brand-like consistency |
| Risk | LOW -- pure CSS/token application |

---

### 3. Animated Transition Between Routes

**What:** When switching routes, instead of an abrupt polyline swap, the map smoothly transitions: the current route fades to ghost opacity while the new route fades in from ghost to full opacity, and the map viewport animates to fit the new route's bounds. This creates a feeling of continuity rather than a jarring page replacement.

**Value proposition:** No cycling event site I found does animated route transitions -- they all use instant swaps. A smooth crossfade between routes would be a genuine differentiator and would feel premium. The Leaflet `fitBounds` animation (pan + zoom) is already built in; the polyline opacity transition requires CSS or JS animation but is achievable.

**Complexity:** MEDIUM -- Leaflet polylines don't natively support CSS transitions on `opacity` because they are SVG elements rendered by Leaflet's internal engine. Options: (a) use `requestAnimationFrame` to interpolate opacity over ~300ms, (b) use Leaflet's `setStyle` in a timing loop, (c) apply CSS transitions via `L.DomUtil.setOpacity()` on the polyline's path elements. Option (c) is simplest but depends on Leaflet's internal DOM structure remaining stable.

**Dependencies:**
- Route polyline layer groups (Table Stakes #2)
- Ghost routes (Differentiator #1) -- animation is the transition between active and ghost states
- `prefers-reduced-motion` check (existing pattern) -- animation should be instant when reduced motion is preferred

| Criterion | Detail |
|-----------|--------|
| Implementation | `fitBounds` animation (built-in) + opacity interpolation via rAF or CSS transition on SVG paths |
| Value | MEDIUM -- feels premium but not functionally important |
| Risk | MEDIUM -- depends on Leaflet SVG rendering internals; test across browsers |

---

### 4. Route Comparison Stats Sidebar

**What:** A compact comparison view showing all three routes' key stats side by side: distance, elevation gain, number of gravel sectors, and percentage of route on gravel. This helps users make an informed decision about which route to ride without clicking between each one.

**Value proposition:** UNBOUND Gravel shows all distances with stats on a single scrollable page so users can compare. This differentiator brings that comparison capability into the map section itself, saving the user from scrolling. Particularly useful for cyclists deciding between the 100k and 50k -- seeing "100k has 5 sectors, 50k has 3" alongside distance/elevation helps the decision.

**Complexity:** LOW -- A small card or table rendered beside or below the selector. Data is available from the per-route pipeline output. Pure HTML/CSS, rendered at build time or populated from preloaded JSON.

**Dependencies:**
- Per-route metadata from pipeline (Table Stakes #7)
- Route selector placement (Table Stakes #1) -- comparison stats should be visually associated with the selector

| Criterion | Detail |
|-----------|--------|
| Implementation | Static HTML table with per-route stats; optionally highlights the currently selected row |
| Value | MEDIUM -- helps decision-making between routes |
| Risk | LOW -- static data display |

---

### 5. Deep Link to Specific Route

**What:** URL hash or query parameter support so users can share a link to a specific route. Example: `hiawathasrevenge.com/#route=100k` opens with the 100k route pre-selected on the map. Without this, all shared links default to the 100-mile route and the recipient must manually select a different distance.

**Value proposition:** Standard web UX for filterable views. When a cyclist shares "check out the 50k route" in a group chat, the link should take the recipient directly to the 50k view. This is particularly important because the route selector is in the middle of a long single-page site -- the recipient needs to both scroll to the map section AND select the right route.

**Complexity:** LOW -- Read `window.location.hash` on page load, extract route ID, dispatch initial `route:change` event. On route change, update `history.replaceState()` to sync the URL without a page reload.

**Dependencies:**
- Route selector (Table Stakes #1)
- All route switching logic (route must be fully initialized before deep link can be applied)

| Criterion | Detail |
|-----------|--------|
| Implementation | Hash read on init, `history.replaceState` on change |
| Value | HIGH -- essential for shareability |
| Risk | LOW -- standard browser API |

---

### 6. Bike Marker Crosshair Respects Route Switch

**What:** The existing bike icon marker on the map (which tracks the elevation chart cursor) must snap to the currently selected route's coordinates, not the previously selected route. This is partially a table-stakes correctness requirement, but it is listed as a differentiator because ensuring cross-component coordination (elevation chart cursor position maps to the correct route's coordinate lookup) requires careful implementation.

**Value proposition:** If the user switches from 100mi to 50k and then hovers at "mile 20" on the elevation chart, the bike marker must appear at mile 20 of the 50k route's actual GPS track -- not mile 20 of the 100-mile route (which might be on a different road). For nested routes that share geography, this difference may be invisible for early miles but becomes apparent near where routes diverge.

**Complexity:** LOW -- The `snapByMiles()` function in RouteMap.astro already uses the module-scope `routePoints` variable. On route change, update `routePoints = newRouteData.points`. The function automatically snaps to the new route's coordinates.

**Dependencies:**
- Elevation profile chart (Table Stakes #3) -- chart x-axis scale must match selected route
- Module-scope `routePoints` variable in RouteMap.astro

| Criterion | Detail |
|-----------|--------|
| Implementation | `routePoints = routeData[selectedRouteId].points` on route change |
| Value | HIGH -- correctness of existing feature across route switches |
| Risk | LOW -- single variable assignment |

---

## Anti-Features

Features to deliberately NOT build. Common mistakes when adding multi-route support that would add complexity without proportionate value for a static showcase site.

---

### Anti-Feature 1: Side-by-Side Route Comparison Map

**Why avoid:** Rendering two or three maps simultaneously (one per route) to enable visual comparison is a pattern seen in real estate and GIS applications. For a cycling event showcase, it quadruples the Leaflet instance overhead (~3 map instances loading CyclOSM tiles), creates complex synchronization requirements (pan one map, all maps pan), and uses 3x the screen real estate. The ghost route pattern (Differentiator #1) provides route comparison within a single map at a fraction of the complexity.

**What to do instead:** Ghost routes on the single map, plus a compact stats comparison card.

---

### Anti-Feature 2: Animated Route Playback / Virtual Ride

**Why avoid:** Some cycling sites offer an animated "ride along" that plays through the route with a moving marker and scrolling elevation profile. This is a fully interactive feature requiring timeline controls (play/pause/speed), continuous animation frames, and careful synchronization between map panning, elevation chart scrolling, and marker movement. Massive complexity (hundreds of lines of animation code) for a feature that few users engage with beyond novelty. This is an app feature, not a showcase feature.

**What to do instead:** The existing elevation chart hover-to-map-marker sync already provides manual "ride along" exploration. Users can drag their cursor along the elevation profile to trace the route on the map.

---

### Anti-Feature 3: Route Builder / Custom Distance

**Why avoid:** Allowing users to create custom route distances (e.g., "I want a 75-mile route") requires runtime route computation, turn-by-turn graph algorithms, and dynamic GPX generation. This is a full routing engine (OSRM, GraphHopper) -- the opposite of a static showcase. The three predefined distances are curated by the event organizer.

**What to do instead:** Three fixed distances with GPX downloads. Users who want custom routes can import the GPX into Ride with GPS or Komoot and modify it there.

---

### Anti-Feature 4: Per-Route Editorial Content

**Why avoid:** Creating separate editorial narratives, photo selections, or cultural explainers for each route distance would triple the content workload and fragment the site experience. The editorial content (HiawathaExplainer, the cultural narrative, the gallery) is about the Hiawatha's Revenge event and the National Forest -- not about a specific distance. The RouteExplainer segment descriptions do reference specific sectors, but these are already filtered by the sector visibility logic.

**What to do instead:** Keep all editorial content shared. The map, chart, sectors, stats, and download change per route. Everything else stays the same.

---

### Anti-Feature 5: "Show All Routes" Toggle

**Why avoid:** Ride with GPS multi-route embed has a "Show All" mode that shows all routes simultaneously with all elevation profiles hidden. For this site, "Show All" creates problems: (a) the routes overlap extensively (30+ miles of shared geography), making "all routes at full opacity" visually confusing, (b) which elevation profile should show?, (c) which stats should show?, (d) which sectors should be highlighted? The ghost route pattern (Differentiator #1) already provides route comparison context without these ambiguities.

**What to do instead:** Ghost routes show the non-selected routes at low opacity. This is functionally "show all" but with clear visual hierarchy establishing which route is primary. If ghost routes are not implemented, the user can simply click between the three routes to compare.

---

### Anti-Feature 6: Server-Side Route Switching / SSR

**Why avoid:** Converting from static to server-side rendering to handle route selection via URL parameters (e.g., `/route/100k`) would require adding an SSR adapter (Astro Node adapter), a server process, and dynamic page generation. The project constraint explicitly requires static output. All route switching must happen client-side with preloaded data.

**What to do instead:** Client-side route switching with all data loaded at init. URL hash deep linking for shareability.

---

### Anti-Feature 7: Per-Route Map Tile Styling

**Why avoid:** Some map applications change the tile style based on context (e.g., satellite view for mountain routes, road view for city routes). All three Hiawatha routes are in the same Hiawatha National Forest on similar terrain. CyclOSM is the correct tile set for all three. Switching tile layers per route adds complexity for zero value.

**What to do instead:** CyclOSM for all routes, as currently implemented.

---

## Feature Dependencies

```
Pipeline Expansion (Table Stakes #7) [MUST BE FIRST]
    |
    +-- Route Selector Control (Table Stakes #1)
    |       |
    |       +-- Route Polyline Swap (Table Stakes #2)
    |       |       |
    |       |       +-- Ghost Routes (Differentiator #1)
    |       |       |       +-- Route Color Coding (Differentiator #2)
    |       |       |       +-- Animated Transition (Differentiator #3)
    |       |       |
    |       |       +-- Bike Marker Crosshair (Differentiator #6)
    |       |
    |       +-- Elevation Profile Swap (Table Stakes #3)
    |       |
    |       +-- Sector Overlay Filtering (Table Stakes #4)
    |       |
    |       +-- Route Stats Update (Table Stakes #5)
    |       |
    |       +-- GPX Download Update (Table Stakes #6)
    |       |
    |       +-- Deep Link (Differentiator #5)
    |
    +-- Route Comparison Stats (Differentiator #4)
```

**Build order:**
1. Pipeline expansion (Table Stakes #7) -- foundation for everything else
2. Route selector control (Table Stakes #1) -- UI trigger for all switching
3. Route polyline swap + fitBounds (Table Stakes #2) -- primary visual change
4. Sector overlay filtering (Table Stakes #4) -- correctness requirement
5. Elevation profile swap (Table Stakes #3) -- chart synchronization
6. Route stats update (Table Stakes #5) -- data correctness
7. GPX download update (Table Stakes #6) -- functional completeness
8. Bike marker crosshair update (Differentiator #6) -- existing feature correctness
9. Ghost routes + color coding (Differentiators #1, #2) -- visual polish
10. Deep link support (Differentiator #5) -- shareability
11. Animated transition (Differentiator #3) -- polish, if time allows
12. Comparison stats (Differentiator #4) -- nice to have

---

## MVP Definition

**Core MVP (all 7 Table Stakes):**

| # | Feature | Rationale |
|---|---------|-----------|
| 1 | Pipeline expansion | All other features depend on per-route data |
| 2 | Route selector | The entire multi-route UX depends on this |
| 3 | Polyline swap | The map is the hero feature; must show correct route |
| 4 | Sector filtering | Showing wrong sectors is misleading |
| 5 | Elevation swap | Chart must match selected route |
| 6 | Stats update | Numbers must be correct |
| 7 | GPX download | Users need the right file |

**Recommended additions to MVP (low complexity, high value):**
- Bike marker crosshair update (Differentiator #6) -- LOW complexity, prevents subtle correctness bug
- Deep link support (Differentiator #5) -- LOW complexity, essential for sharing
- Ghost routes (Differentiator #1) -- LOW-MEDIUM complexity, significant visual improvement

**Defer post-MVP:**
- Route color coding (Differentiator #2): Nice visual touch but not essential. Can be added later with minimal refactoring.
- Animated transition (Differentiator #3): MEDIUM complexity, polish only. Ghost routes provide the visual context without animation.
- Comparison stats (Differentiator #4): LOW complexity but adds UI design decisions. Can be a quick follow-up.

---

## Feature Prioritization Matrix

| Feature | User Value | Complexity | Ship in MVP? |
|---------|-----------|------------|-------------|
| Pipeline expansion | CRITICAL | HIGH | YES (prerequisite) |
| Route selector control | CRITICAL | LOW | YES |
| Route polyline swap | CRITICAL | MEDIUM | YES |
| Sector overlay filtering | HIGH | MEDIUM | YES |
| Elevation profile swap | HIGH | MEDIUM | YES |
| Route stats update | HIGH | LOW | YES |
| GPX download update | HIGH | LOW | YES |
| Bike marker crosshair | HIGH | LOW | YES (correctness) |
| Deep link to route | MEDIUM | LOW | YES (shareability) |
| Ghost routes | MEDIUM | LOW-MEDIUM | YES (visual context) |
| Route color coding | LOW | LOW | NO -- defer |
| Animated transition | LOW | MEDIUM | NO -- defer |
| Comparison stats | MEDIUM | LOW | NO -- defer |

---

## Competitor Analysis: Multi-Route Patterns

| Platform | Selector Type | Route Display | Elevation per Route | Stats per Route | GPX Download |
|----------|--------------|---------------|--------------------|-----------------|----|
| **Ride with GPS (multi-route embed)** | Route name list (sidebar click) | Selected route only; "Show All" toggle available | Per-route; hidden on Show All | Distance + elevation per route | Per-route via Ride with GPS |
| **UNBOUND Gravel** | Scrollable sections (anchor links per distance) | No interactive map; external links to Garmin/RWGPS | No embedded profile | Distance + elevation + checkpoints per section | Per-distance Garmin/RWGPS links |
| **SBT GRVL** | Color-coded course cards (Green/Blue/Red/Black) | No embedded map; links to RWGPS per course | External via RWGPS | Miles, elevation, gravel % per card | External RWGPS links |
| **Jersey City Marathon** | "Full Marathon" toggle button | Map toggles between courses | N/A | N/A | N/A |
| **Toronto Marathon** | Tabs per distance | Individual maps per distance | N/A | N/A | N/A |
| **This site (target)** | Segmented control (pill bar) | Selected route + ghost inactive routes | Dynamic Chart.js swap per route | Dynamic stat cards per route | Dynamic download link per route |

**Key insight from competitive analysis:** Most cycling event sites do NOT have sophisticated route selectors. They either use scrollable page sections (UNBOUND) or link out to Ride with GPS for interactive maps. The few that embed maps (marathon sites) use simple toggle buttons. This site's planned implementation -- a segmented control with inline map switching, dynamic elevation profiles, and ghost routes -- would be notably more sophisticated than industry standard for an event showcase site.

---

## Data Architecture for Multi-Route

The per-route data structure needs to support efficient client-side switching. Recommended schema:

```json
// route-data.json (combined)
{
  "routes": {
    "100mi": {
      "meta": { "totalMiles": 101.98, "elevationGainFeet": 2258, "pointCount": 456, ... },
      "points": [{ "lat": ..., "lon": ..., "ele": ..., "miles": ... }, ...]
    },
    "100k": {
      "meta": { "totalMiles": 61.7, "elevationGainFeet": ..., "pointCount": ..., ... },
      "points": [...]
    },
    "50k": {
      "meta": { "totalMiles": 31.2, "elevationGainFeet": ..., "pointCount": ..., ... },
      "points": [...]
    }
  },
  "defaultRoute": "100mi"
}
```

```json
// route-config.json (new file, build-time generated)
{
  "routes": [
    {
      "id": "100mi",
      "label": "100 mi",
      "gpxFile": "HiawathasRevenge-100mi.gpx",
      "sectors": ["sector-520", "sector-nf2266", "sector-bass-lake", "sector-nf2217-2218", "sector-nd2225", "sector-doe-lake", "sector-rapid-river"],
      "color": "--color-amber-500"
    },
    {
      "id": "100k",
      "label": "100k",
      "gpxFile": "HiawathasRevenge-100k.gpx",
      "sectors": ["sector-520", "sector-nf2266", "sector-bass-lake", "sector-nf2217-2218", "sector-nd2225"],
      "color": "--color-lake-400"
    },
    {
      "id": "50k",
      "label": "50k",
      "gpxFile": "HiawathasRevenge-50k.gpx",
      "sectors": ["sector-520", "sector-nf2266", "sector-bass-lake"],
      "color": "--color-moss-500"
    }
  ]
}
```

This separation (route-config for UI metadata, route-data for geographic/elevation data) keeps the selector logic independent from the heavy coordinate data.

---

## Sources

- **Ride with GPS multi-route embed:** https://support.ridewithgps.com/hc/en-us/articles/10127592878235-Multi-Route-Embed (MEDIUM confidence -- 403 on direct fetch, details from help center search results)
- **UNBOUND Gravel routes page:** https://www.unboundgravel.com/routes/ (HIGH confidence -- directly fetched and analyzed)
- **SBT GRVL courses:** https://www.sbtgrvl.com/2026courses (MEDIUM confidence -- analyzed from search results, site timed out on direct fetch)
- **Leaflet layers control:** https://leafletjs.com/examples/layers-control/ (HIGH confidence -- official Leaflet documentation)
- **Leaflet Layer Group API:** https://leafletjs.com/reference.html (HIGH confidence -- official reference)
- **Chart.js Updating Charts:** https://www.chartjs.org/docs/latest/developers/updates.html (HIGH confidence -- official Chart.js docs)
- **Chart.js destroy/update patterns:** https://github.com/chartjs/Chart.js/issues/2424 (MEDIUM confidence -- GitHub issue discussion)
- **Segmented control UX:** https://developer.apple.com/design/human-interface-guidelines/segmented-controls (HIGH confidence -- Apple HIG)
- **Segmented control best practices:** https://mobbin.com/glossary/segmented-control (MEDIUM confidence -- design reference, 403 on fetch)
- **W3C ARIA radiogroup role:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/radiogroup_role (HIGH confidence -- MDN/W3C)
- **Leaflet multiple overlapping routes:** https://dev.to/geoapify-maps-api/how-to-visualize-multiple-overlapping-routes-on-a-leaflet-map-16ni (MEDIUM confidence -- technical article, directly fetched)
- **Leaflet fitBounds animation:** https://leafletjs.com/reference.html (HIGH confidence -- official Leaflet docs)
- **Marathon route selector patterns:** Cleveland Marathon, Toronto Marathon, Jersey City Marathon, SF Marathon (MEDIUM confidence -- analyzed from search results)
- **Ride with GPS advanced route planning (active/gray routes):** https://support.ridewithgps.com/hc/en-us/articles/4415470200859-Advanced-Route-Planning (MEDIUM confidence -- help center)
