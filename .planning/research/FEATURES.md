# Feature Landscape: v1.3 Map Interactivity

**Domain:** Cycling/outdoor recreation interactive map — sector labels, clickable segments, detail panels
**Researched:** 2026-04-02
**Milestone:** v1.3 Map Interactivity
**Confidence:** MEDIUM-HIGH — patterns verified across Leaflet documentation (Context7/official), NN/g bottom sheet research, AllTrails, Ride with GPS, Komoot feature analyses, Trailforks metadata, and interactive map UX surveys

---

## Context

v1.2 shipped a complete editorial showcase with 7 gravel sector overlays color-coded by difficulty on the Leaflet map. The overlays are visual-only — polylines with no labels and no click handlers. The EditorialExplainer section below the map provides detailed segment cards with sparklines, Strava links, terrain descriptions, and difficulty ratings, but the map and explainer are disconnected.

v1.3 makes the map a first-class interactive experience by:

1. Adding sector name + star rating labels directly on the map at each sector's midpoint
2. Making sectors clickable — clicking a sector opens a detail panel
3. Implementing a responsive detail panel — right slide-out on desktop, bottom sheet on mobile

**Existing assets available at no additional cost:**
- `annotations.json` — 7 sectors with `id`, `name`, `startIdx`, `endIdx`, `difficulty`, `startMile`, `endMile`, `startLat/Lon`, `endLat/Lon`
- `sector-elevations.json` — per-sector `elevationPoints[]` with `miles` and `ele` values
- `ElevationSparkline.astro` — build-time SVG sparklines per sector, already used in RouteExplainer
- `RouteExplainer.astro` — `SEGMENTS[]` array with full descriptions, surface types, Strava IDs (6/7), difficulty ratings 1-5
- CSS design tokens — difficulty colors (`text-sun-400` / `text-amber-500` / `text-scarlet-400`), full Ojibwe palette
- `bubblingMouseEvents: false` available on all Leaflet Path objects — documented in official Leaflet reference

---

## Table Stakes

Features users expect when seeing a color-coded interactive map with labeled route segments. Missing any of these makes the interactivity feel incomplete or broken.

---

### 1. Sector Name Labels Visible on Map

**Why expected:** Every serious cycling/outdoor map app — Komoot, AllTrails, Ride with GPS, Trailforks — displays trail or segment names directly on the map, not just in a sidebar legend. When color-coded overlays appear on a map without labels, users naturally wonder "what are these?" The sector name bridges the gap between the visual map overlay and the editorial content below.

**What it looks like:** A small badge-style label positioned at the geographic midpoint of each sector polyline. The label contains the sector name (e.g., "NF2266") and a compact star difficulty indicator (e.g., "★★★★★" or "⬛⬛⬛⬛⬛" at small scale). Labels should be readable at the default zoom level but not overwhelm the map.

**Industry pattern:** Trailforks places trail difficulty ratings (green/blue/black diamond symbols) directly on trail lines. Komoot's sport-specific maps emphasize segment names and difficulty along route lines. Ride with GPS offers color-coded segment labels with surface type overlays. All use lightweight text badges rather than large callout boxes.

**Implementation approach:** L.divIcon markers placed at the midpoint lat/lon of each sector's polyline (computed as `latlngs[Math.floor((startIdx + endIdx) / 2)]`). Custom HTML in the `html` option creates a styled badge. A custom Leaflet pane at z-index ~450 (above polylines at 400, below popups at 700) ensures labels render above sector lines but below popups.

**Complexity:** LOW — Uses existing Leaflet patterns already in the codebase (divIcon already used for restock and photo markers). Midpoint computation from existing `startIdx`/`endIdx` data. CSS styling consistent with existing design tokens.

**Dependencies:**
- `annotations.json` sector data (already built)
- Design token palette (already in `:root` as `@theme static`)
- Existing `L.divIcon` pattern in RouteMap.astro

**Confidence:** HIGH — Leaflet official docs confirm `bindTooltip` with `permanent: true` or custom `L.divIcon` marker placement both work for polyline labeling. The divIcon approach gives more styling control and is consistent with existing marker patterns.

| Criterion | Detail |
|-----------|--------|
| Implementation | L.divIcon at sector midpoint; custom pane at z-index 450; pointer-events: none on pane |
| Risk | Label readability at default zoom — may need min zoom threshold or font-size tuning |
| WCAG check | Label text must pass AA contrast against map tile background; use solid background color |

---

### 2. Sector Labels Show Difficulty Rating

**Why expected:** Komoot, Ride with GPS, and Trailforks all surface difficulty alongside segment names. AllTrails uses colored trail lines plus a difficulty badge on every trail card. Users reading a cycling route map have been trained to expect difficulty information at a glance — color alone is insufficient for accessibility (colorblind users) and insufficient for quick scanning at scale.

**What it looks like:** Star symbols (filled/unfilled) or a compact text rating (e.g., "★★" or "2★") rendered within the label badge. For this route, ratings span 2–5 stars. At map label scale, 3–4 characters is the maximum before readability suffers — so a compact format like "★★★★★" or "5★" is preferable to the full star row used in the editorial cards.

**Implementation approach:** The `SEGMENTS[]` array in RouteExplainer has integer difficulty (1–5). The `annotations.json` has string difficulty ("easy" / "moderate" / "hard"). Map labels can use the string difficulty to color the badge border/background, plus a compact star count rendered as Unicode filled stars (★) up to the difficulty value.

**Complexity:** LOW — Computed once per sector at label render time. Difficulty data already exists in both annotations.json and SEGMENTS array.

**Dependencies:**
- Sector labels (Table Stakes #1)
- Difficulty color tokens already in `:root`

**Confidence:** HIGH — Pattern verified across all major cycling apps; implementation is pure CSS/HTML within divIcon.

| Criterion | Detail |
|-----------|--------|
| Implementation | Include star string and difficulty class in divIcon HTML; CSS border-color keyed to difficulty |
| Risk | Very small — purely additive to label design |

---

### 3. Clicking a Sector Opens a Detail Panel

**Why expected:** This is the fundamental "clickable map" expectation established by Google Maps, Apple Maps, AllTrails, Komoot, and every similar app. Color-coded overlays that do nothing on click feel broken. The industry-wide pattern is: click a route element → see more information. AllTrails shows trail details. Komoot shows surface and elevation data. Ride with GPS shows segment stats. The user expects *something* to happen.

**What it looks like:** A click on a sector polyline or its label badge opens a panel displaying:
- Sector name (heading)
- Difficulty rating (stars + color indicator)
- Distance and mile-marker context ("1.3 mi · starts at mile 6.7")
- Surface type (from SEGMENTS descriptions: "deep sand and gravel two-track")
- Terrain description (2–3 sentences)
- Elevation snippet (ElevationSparkline SVG, already built)
- Elevation stats (gain/loss in feet, from sector-elevations.json)
- Strava segment link (if available — 6/7 sectors have IDs)

**Implementation approach:** Polyline click handlers via `sector.on('click', handler)` with `bubblingMouseEvents: false` to prevent map click from also firing. Label badge markers also get click handlers. Handler dispatches a `CustomEvent` (matching the existing `elevation:hover` / `elevation:leave` event bus pattern) or directly manipulates a detail panel DOM element outside the map container. The panel is a standard `<div>` in the page layout, not inside the Leaflet map DOM.

**Complexity:** MEDIUM — Requires wiring click handlers on 7 sector polylines plus their label markers, populating panel content dynamically from sector data, and managing open/close state. No new libraries needed.

**Dependencies:**
- Sector labels (Table Stakes #1)
- SEGMENTS data array (already exists in RouteExplainer — needs to be accessible to map script, either via embedded JSON in the page or a new `/data/segments.json` static asset)
- ElevationSparkline SVGs (already built at build time — need to be embeddable in panel, either as inline SVG strings or as `<img src>` references)
- CSS transition/transform for panel animation

**Confidence:** HIGH — Leaflet polyline click events are well-documented. The `bubblingMouseEvents: false` option prevents event bubbling. Opening a DOM panel from a Leaflet click handler is a standard pattern (Google Maps, MapLibre, and Leaflet plugin examples all use this approach).

| Criterion | Detail |
|-----------|--------|
| Implementation | `sector.on('click', openPanel)` + `bubblingMouseEvents: false`; panel as sibling DOM element to `#map` |
| Risk | MEDIUM — ElevationSparkline is an Astro component; panel content must be populated dynamically in client JS. Options: (a) serialize sparkline SVG as a data attribute on the map container at build time, (b) generate sparkline SVG inline via JS at runtime from sector-elevations.json |
| Key decision | Whether sparklines in panel use pre-built SVG (simpler, no duplication) or are re-rendered in JS (consistent but adds complexity) |

---

### 4. Responsive Panel: Right Slide-Out on Desktop, Bottom Sheet on Mobile

**Why expected:** This is the industry-standard responsive pattern for map detail interactions. Google Maps uses a left-side panel on desktop that becomes a bottom sheet on mobile. AllTrails uses a persistent bottom sheet on mobile for trail details. Komoot's route pages use a right sidebar on desktop. The pattern exists because:
- Desktop: there is horizontal space to keep the map visible while showing details
- Mobile: horizontal space is scarce; vertical slide-up from bottom uses screen space efficiently and matches native gesture conventions

**What it looks like:**

*Desktop (≥768px):* A panel slides in from the right side, overlapping the right portion of the map or pushing the map layout. Width ~380px. Panel contains scrollable content. Close via X button or pressing Escape. Map remains partially interactive alongside the panel.

*Mobile (<768px):* A bottom sheet slides up from the bottom of the screen. Initially shows ~50% of viewport (partial open / "peek" state). Can be dismissed by tapping a close button, tapping the backdrop, or pressing Escape. Does NOT implement drag-to-snap — this adds significant complexity for marginal UX gain given the content is read-only (not a form).

**Implementation approach:**
- Single `<div id="sector-detail-panel">` element in page markup, below the map section
- CSS: `position: fixed` on mobile, `position: absolute` relative to map container on desktop (or fixed with right-side offset)
- CSS transforms: `translateX(100%)` hidden state on desktop (slides from right), `translateY(100%)` hidden state on mobile (slides from bottom)
- Breakpoint detection: CSS classes toggled by JS `window.matchMedia('(max-width: 767px)')` or pure CSS with `@media` queries on the panel itself
- `prefers-reduced-motion` support: disable CSS transition duration when true (already a project constraint)
- Panel open state managed by a JS module-scope variable, toggled by sector click handlers

**Complexity:** MEDIUM — CSS transform-based animation is well-supported and performant. The two-state (hidden/visible) model is simpler than multi-snap-point bottom sheets. Using CSS transitions on `transform` runs on the compositor thread (no layout thrash). The main complexity is ensuring the panel's z-index layers correctly over the map and other page content.

**Dependencies:**
- Sector click handlers (Table Stakes #3)
- CSS design tokens for panel styling
- `prefers-reduced-motion` media query check (already used in RouteMap.astro)

**Confidence:** HIGH — CSS `translateX`/`translateY` transitions are the standard performant approach confirmed by Chrome developer docs and multiple implementation guides. No new libraries needed.

| Criterion | Detail |
|-----------|--------|
| Implementation | Fixed-position panel; CSS transform for animation; media query for layout variant |
| Risk | LOW — z-index stacking with Leaflet map (map is z-index 0 container; panel at z-index 1000+ will clear it) |
| WCAG | Escape key dismissal required; close button with aria-label required; focus management (move focus to panel on open, return to triggering element on close) |

---

### 5. Panel Close Interactions

**Why expected:** Every well-designed slide-out panel or bottom sheet must have explicit, obvious close affordances. NN/g research on bottom sheets specifically identifies missing close buttons as a top accessibility failure. AllTrails, Google Maps, and Komoot all provide: (a) an X close button, (b) Escape key support on desktop, (c) backdrop tap/click on mobile.

**What it looks like:**
- X button in top-right corner of panel
- Escape key listener (desktop)
- Clicking/tapping outside the panel closes it (desktop: map click; mobile: overlay backdrop tap)
- Closing returns keyboard focus to the sector label that triggered the open

**Complexity:** LOW — Standard DOM event listeners and focus management. The keyboard handling pattern is well-documented in W3C ARIA Practices Guide.

**Dependencies:**
- Detail panel (Table Stakes #4)

**Confidence:** HIGH — Documented in W3C ARIA APG and NN/g guidelines.

| Criterion | Detail |
|-----------|--------|
| Implementation | addEventListener('keydown', escapeHandler); X button onclick; backdrop div onClick |
| WCAG | role="dialog", aria-labelledby pointing to panel heading, aria-modal="true", focus trap during open state |

---

## Differentiators

Features that would set this showcase apart from typical cycling route pages. Not expected, but highly valued — consistent with the site's award-winning cultural showcase ambition.

---

### 1. Coordinated Map + Elevation Chart Highlight on Sector Click

**What:** When a sector is clicked (opening the detail panel), the corresponding segment on the elevation profile chart is also highlighted — matching the existing bidirectional sync where elevation hover moves the bike marker on the map.

**Value proposition:** Creates a seamless, interconnected exploration experience. The user can see both "where is this on the map" and "what does the elevation look like" simultaneously. No cycling route app this project competes with does true bidirectional segment highlighting — this would be a genuine differentiator for a showcase site.

**Complexity:** MEDIUM — Requires the sector click handler to dispatch a `CustomEvent` that the ElevationProfile component listens for, then applies a background highlight to the correct chart region using Chart.js annotation plugin or a CSS overlay synchronized to the chart's x-axis scale. The event bus pattern already exists (`elevation:hover`); adding `sector:click` is consistent with the architecture.

**Dependencies:**
- Sector click handlers (Table Stakes #3)
- ElevationProfile component with access to sector mile ranges
- Chart.js chartjs-plugin-annotation (if region highlighting is used) OR a CSS overlay approach

**Confidence:** MEDIUM — Chart.js annotation plugin is documented and available but adds a library dependency. The CSS overlay approach (a positioned div over the chart canvas with computed left/width from chart scales) avoids new dependencies but requires access to Chart.js internal scale methods.

---

### 2. "Jump to Section" Link from Panel to Editorial Card

**What:** The sector detail panel includes a "Read more in route guide" link (or button) that smooth-scrolls the page to the corresponding segment card in the RouteExplainer section. This creates a navigation bridge between the map interaction and the editorial content below.

**Value proposition:** Treats the map as a navigation layer over the editorial content, not just a standalone widget. Users who discover the route through the map can flow naturally into the detailed editorial narrative. Bikepacking.com uses this pattern — clicking a stage on their route overview map scrolls to the stage writeup.

**Complexity:** LOW — `document.getElementById('segment-card-520').scrollIntoView({behavior: 'smooth'})`. Requires adding stable IDs to segment cards in RouteExplainer.astro (currently they have no IDs). The `smooth` behavior already respects `prefers-reduced-motion` in modern browsers (falls back to instant scroll).

**Dependencies:**
- Detail panel (Table Stakes #4)
- Stable `id` attributes on RouteExplainer segment cards (minor RouteExplainer.astro change)

**Confidence:** HIGH — `scrollIntoView` is well-supported. Trivial to implement.

---

### 3. Sector Hover State (Visual Feedback Before Click)

**What:** On desktop, hovering over a sector polyline or its label badge changes the cursor to `pointer` and subtly brightens/thickens the polyline to signal interactivity. This "hover affordance" is the difference between a map that feels clickable and one that requires user discovery.

**Value proposition:** Industry standard for interactive web maps (Google Maps, Komoot, Leaflet GeoJSON examples). Without hover feedback, users may not discover that sectors are clickable. The label badges already signal interactivity by their badge styling, but polyline hover state reinforces it.

**Complexity:** LOW — Leaflet `mouseover`/`mouseout` event handlers on each sector polyline to call `sector.setStyle({weight: 7, opacity: 1})` and revert. CSS `cursor: pointer` via `interactive: true` (default for Leaflet path layers).

**Dependencies:**
- Sector polylines (already rendered in RouteMap.astro)

**Confidence:** HIGH — Leaflet `setStyle` documented in official reference. Standard pattern in Leaflet GeoJSON interactive examples.

---

### 4. Active Sector State (Open Panel = Highlighted Sector)

**What:** When a sector detail panel is open, the corresponding sector polyline on the map is visually distinguished — thicker stroke, brighter color, or a subtle animated pulse — to show which sector is "selected." Closing the panel reverts the polyline to its normal state.

**Value proposition:** Provides wayfinding feedback: "this panel is about THIS sector on the map." Particularly useful when the map has scrolled or panned since the sector was clicked. AllTrails uses this pattern (selected trail highlighted in blue regardless of difficulty color). Trailforks highlights selected trail in yellow.

**Complexity:** LOW — Track an `activeSector` reference in module scope. On panel open: `activeSector.setStyle({weight: 8})`. On panel close: `activeSector.setStyle({weight: 5, opacity: 0.85})`.

**Dependencies:**
- Sector click handlers (Table Stakes #3)
- Panel close handlers (Table Stakes #5)

**Confidence:** HIGH — Leaflet `setStyle` is the documented approach.

---

### 5. National Park Design Treatment for Panel

**What:** The detail panel uses the site's established National Park / Ojibwe design system: National Park typeface for the sector name heading, difficulty color for the header background or border accent, shield/arrowhead decorative element, and the established dark forest-900 panel background. The panel feels like a continuation of the site's editorial identity rather than a generic map popup.

**Value proposition:** Every other gravel route showcase with a detail panel uses a generic white card with default typography. A panel that expresses the site's visual identity creates a memorable, cohesive experience — the kind of design detail that makes the site "share-worthy." This is consistent with the v1.2 cultural maximalism ethos.

**Complexity:** LOW — Pure CSS/HTML styling inside the panel. Uses existing design tokens already in `:root`. ElevationSparkline already renders in the route's color palette.

**Dependencies:**
- Detail panel (Table Stakes #4)
- Existing design tokens (already available)

**Confidence:** HIGH — Purely additive styling on top of working panel structure.

---

## Anti-Features

Features to deliberately NOT build. These are common pattern traps that would add complexity without proportionate value for this specific showcase context.

---

### Anti-Feature 1: Drag-to-Snap Bottom Sheet with Multiple Snap Points

**Why avoid:** Multi-snap-point draggable bottom sheets (Google Maps style: peek → half → full) require either a library (react-spring-bottom-sheet adds ~15KB, is React-specific) or significant custom JavaScript (~200+ lines) to handle touch event sequences, velocity detection, and snap point targeting correctly. NN/g research warns against complex multi-layered interactions on small screens. This showcase has read-only content — users don't need to resize the panel.

**What to do instead:** A simple two-state bottom sheet (hidden/visible at ~50% screen height) with a close button. If the content overflows 50% of the screen, make the panel scrollable internally.

---

### Anti-Feature 2: Inline Leaflet Popup for Sector Detail

**Why avoid:** Leaflet's built-in `bindPopup` is limited in styling, limited in DOM complexity (no embedded SVGs or complex layouts), and creates a visual "map popup" appearance that doesn't match the site's editorial design. More critically, Leaflet popups render inside the map container DOM, which limits CSS access to design tokens and conflicts with the map's z-index management. The sector detail panel needs to live outside the map container to support the full slide-out animation and to allow the map to remain partially interactive behind it.

**What to do instead:** A custom `<div>` outside the map container, wired via Leaflet click events. This is the approach used by Google Maps (the info panel lives outside the map canvas), Mapbox GL JS (the sidebar pattern), and Komoot (route details in a separate DOM panel).

---

### Anti-Feature 3: Tooltip Label with `permanent: true` as Primary Label System

**Why avoid:** Leaflet `bindTooltip({permanent: true})` renders tooltips at the geographic centroid of a polyline, which works for polygons but for long polylines (like a 6.6-mile forest road) positions the label at the mathematical center of all coordinates — which may be off the actual road midpoint, in the middle of forest, or at a confusing location. Additionally, permanent tooltips render inside the Leaflet tooltip pane and are harder to style consistently with the site's design system than a custom divIcon marker.

**What to do instead:** A custom `L.divIcon` marker placed at the computed midpoint of the sector's coordinate array (`routePoints[Math.floor((startIdx + endIdx) / 2)]`). Full HTML/CSS control, placement on the road, and consistent styling with existing marker patterns.

---

### Anti-Feature 4: Auto-Pan Map to Center on Clicked Sector

**Why avoid:** Auto-panning on sector click is disorienting when the user has already panned the map to a specific view. Google Maps does this only for point markers, not for linear features. For a route that spans 100 miles, panning to center on a 6-mile sector often moves the map so far that the rest of the route context is lost. Komoot does NOT auto-pan on segment selection.

**What to do instead:** On sector click, optionally zoom to fit the sector's bounds with generous padding if the sector is not currently visible in the viewport. But do this only if the sector is outside the current map view — don't move the map if the sector is already visible. Implementation: `map.fitBounds(sectorBounds)` only when `!map.getBounds().contains(sectorBounds)`.

---

### Anti-Feature 5: Sector-Level Turn-by-Turn Navigation

**Why avoid:** This is a showcase site, not a navigation app. Turn-by-turn instructions (bearing changes, road names, estimated time to sector) are out of scope per PROJECT.md. Strava and Ride with GPS already provide this for users who download the GPX. Building a duplicate navigation system would take enormous effort for near-zero added value for the site's audience (cyclists exploring the route before riding, not navigating while riding).

**What to do instead:** Link to the Strava segment and provide the GPX download link already in the RouteExplainer.

---

### Anti-Feature 6: Real-Time or User-Generated Content in Panels

**Why avoid:** The site is a static Astro build with no SSR. User comments, crowdsourced conditions, dynamic photo uploads, or Strava activity feed for a segment require API integrations and a dynamic backend — all out of scope per PROJECT.md.

**What to do instead:** Link to the Strava segment page (which already has user activities, KOMs, etc.) for live community data.

---

## Feature Dependencies

```
Sector Name Labels (Table Stakes #1)
    └── Difficulty Stars on Labels (Table Stakes #2)
    └── Hover State (Differentiator #3)
    └── Sector Click → Open Panel (Table Stakes #3)
            └── Panel Responsive Layout (Table Stakes #4)
            │       └── Panel Close Interactions (Table Stakes #5)
            │       └── Active Sector Highlight (Differentiator #4)
            │       └── National Park Panel Design (Differentiator #5)
            │       └── Jump to Section Link (Differentiator #2)
            └── Elevation Chart Highlight (Differentiator #1)
                    └── (requires ElevationProfile component coordination)
```

**Build order:** Labels (#1) → Difficulty on labels (#2) → Click handlers (#3) → Panel HTML/CSS (#4) → Close (#5) → Active state (#4-diff) → Design treatment (#5-diff) → Jump link (#2-diff) → Chart highlight (#1-diff, optional)

---

## MVP Definition

**Core MVP (deliver all 5 Table Stakes):**

| # | Feature | Rationale |
|---|---------|-----------|
| 1 | Sector name labels on map | Without this, the sector overlays have no identity on the map |
| 2 | Difficulty stars on labels | Critical for glanceability — users need difficulty info without clicking |
| 3 | Click sector → open panel | The entire feature request depends on this |
| 4 | Responsive panel (slide-out desktop / bottom sheet mobile) | Required for usable mobile experience |
| 5 | Panel close (X button, Escape, backdrop click) | Non-negotiable for usability and accessibility |

**Recommended additions to MVP (low complexity, high value):**
- Hover state (Differentiator #3) — LOW complexity, significantly improves discoverability
- Active sector highlight (Differentiator #4) — LOW complexity, essential wayfinding
- National Park panel design (Differentiator #5) — LOW complexity, maintains site identity
- Jump to section link (Differentiator #2) — LOW complexity, creates map ↔ editorial connection

**Defer post-MVP:**
- Elevation chart highlight (Differentiator #1): MEDIUM complexity, requires Chart.js coordination. Valuable but not essential for first ship.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Complexity | Ship in MVP? |
|---------|-----------|--------------------------|-------------|
| Sector labels with names | HIGH | LOW | YES |
| Difficulty stars on labels | HIGH | LOW | YES |
| Click → open panel | HIGH | MEDIUM | YES |
| Responsive panel layout | HIGH | MEDIUM | YES |
| Panel close interactions | HIGH | LOW | YES |
| Hover affordance | MEDIUM | LOW | YES (bundle with labels) |
| Active sector highlight | MEDIUM | LOW | YES (bundle with click handler) |
| National Park panel design | MEDIUM | LOW | YES (bundle with panel) |
| Jump to section link | MEDIUM | LOW | YES (trivial add) |
| Elevation chart highlight | HIGH | MEDIUM | NO — defer |

---

## Competitor Feature Analysis

| App/Platform | Segment Labels on Map | Click → Detail Panel | Panel Location (Desktop) | Panel Location (Mobile) | Difficulty on Map |
|-------------|----------------------|---------------------|--------------------------|-------------------------|-------------------|
| **AllTrails** | Yes — trail names on polylines at zoom | Yes — trail card in sidebar | Left sidebar panel | Bottom sheet (partial, expandable) | Color-coded lines + badge |
| **Komoot** | Yes — sport-specific labels on route | Yes — segment stats appear on click | Right sidebar | Bottom sheet with map shrink | Surface overlaid on route line |
| **Ride with GPS** | Yes — optional labels on segment overlays | Yes — popover with stats | Right panel or inline popup | Bottom sheet or full-screen | Color by surface/difficulty |
| **Trailforks** | Yes — trail names at zoom level | Yes — trail stats popup | Left sidebar with full trail info | Bottom sheet or popup | Difficulty color on line + icon |
| **Strava Route** | Segment names on route | Segment segment stats card | Right inline card | Stacked cards below map | No difficulty indicator |
| **Google Maps** | Road/place names always visible | Yes — place info panel | Left sidebar | Bottom sheet (3-snap: peek/half/full) | N/A (route only) |
| **This site (target)** | Sector names + stars | Yes — themed detail panel | Right slide-out | Bottom sheet (2-state: hidden/visible) | Color polyline + label stars |

**Pattern summary from competitive analysis:**

1. **Left vs. right sidebar**: AllTrails and Trailforks favor left sidebars (matching Google Maps convention). Komoot and Ride with GPS favor right panels. For this site, right is preferable because the detail panel should not compete with the map's zoom controls (top-left) and reset button (top-left).

2. **Bottom sheet snap points**: Google Maps uses 3 snap points. AllTrails uses 2 (collapsed/expanded). Trailforks uses a simple popup. For a read-only showcase with bounded content (one sector's data), 2 states (hidden/visible at ~50vh) is optimal — no drag complexity needed.

3. **Label zoom thresholds**: Most apps show labels above a certain zoom level to prevent clutter. For this route (7 sectors spread over 100 miles), the default zoom level likely shows all 7 sectors with sufficient spacing, so a zoom threshold may not be necessary. Monitor label overlap at default zoom after implementation.

4. **Map remains interactive**: All reference apps keep the map pannable/zoomable when a detail panel is open. This is the expected behavior — the panel provides detail, the map provides spatial context. Do not lock the map behind a modal backdrop.

---

## Panel Content Specification

The detail panel for each sector should display (in order, top to bottom):

1. **Sector name** — `<h2>` in National Park typeface, difficulty color accent (gold/amber/scarlet per difficulty)
2. **Difficulty row** — filled star symbols (★) up to difficulty rating (1–5), plus text label ("Moderate", "Hard")
3. **Stats row** — length (e.g., "3.2 mi") · starts at mile (e.g., "mile 6.7")
4. **Elevation snippet** — ElevationSparkline SVG at 100% panel width, with gain/loss stats below ("↑ 420 ft / ↓ 380 ft" computed from sector-elevations.json)
5. **Surface type callout** — extracted first sentence of description or a dedicated surface field: "Deep sand and gravel two-track"
6. **Terrain description** — 2–3 sentences from SEGMENTS array description field
7. **Strava link** — "View on Strava →" external link (if stravaId exists for that sector)
8. **Jump link** — "Read full segment guide ↓" that smooth-scrolls to RouteExplainer card

**Content data sources:**
- Name, difficulty, mile markers: `annotations.json` (available in client JS via fetch)
- Sparkline SVG: needs to be available in panel — options are (a) embed SVG data in annotations.json at build time, or (b) re-render from `sector-elevations.json` data in client JS
- Elevation gain/loss: compute from `sector-elevations.json` `elevationPoints[].ele` array (max - min as proxy, or proper cumulative gain algorithm)
- Description, surface, stravaId: from `SEGMENTS[]` in RouteExplainer.astro — needs to be exposed as a static JSON asset (`/data/segments.json`) for client JS access

---

## Sources

- **Leaflet Tooltip/Popup documentation:** https://leafletjs.com/reference.html (HIGH confidence — official docs)
- **Leaflet Map Panes documentation:** https://leafletjs.com/examples/map-panes/ (HIGH confidence — official docs)
- **NN/g Bottom Sheet UX guidelines:** https://www.nngroup.com/articles/bottom-sheet/ (HIGH confidence — authoritative UX research)
- **LogRocket Bottom Sheet design patterns:** https://blog.logrocket.com/ux-design/bottom-sheets-optimized-ux/ (MEDIUM confidence — verified against NN/g)
- **Native-like bottom sheets with CSS scroll snap:** https://viliket.github.io/posts/native-like-bottom-sheets-on-the-web/ (MEDIUM confidence — technical implementation article)
- **Interactive map UX patterns (TravelTime):** https://traveltime.com/blog/interactive-map-design-ux-mobile-desktop (MEDIUM confidence — survey of real apps)
- **W3C ARIA APG — Keyboard Interface:** https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/ (HIGH confidence — official accessibility spec)
- **Ride with GPS 2025 Feature Roundup (bikepacking.com):** https://bikepacking.com/news/2025-ride-with-gps-feature-roundup/ (MEDIUM confidence — feature journalism)
- **Trailforks trail metadata:** https://www.trailforks.com/about/metadata/ (MEDIUM confidence — official product docs, 403 on direct fetch)
- **Leaflet bubblingMouseEvents option:** https://leafletjs.com/reference.html#interactive-layer-bubblingmouseevents (HIGH confidence — official docs)
- **UNBOUND Gravel routes page:** https://www.unboundgravel.com/routes/ (MEDIUM confidence — direct inspection of live site)
- **Cycling app detail panels (bikeradar.com):** https://www.bikeradar.com/advice/buyers-guides/best-cycling-apps (MEDIUM confidence — product survey)
