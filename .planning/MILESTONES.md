# Project Milestones: Hiawatha's Revenge

## v1.8 Navigation & Identity (Shipped: 2026-04-08)

**Delivered:** Sticky navigation bar with scroll-spy active highlighting, ride ethos values statement, "Powered by Neucadia" brand footer, and History section light/dark mode with full-bleed Ojibwe inspiration background images and WCAG AA contrast compliance.

**Phases completed:** 45-47 (5 plans total)

**Key accomplishments:**

- Sticky navigation bar with IntersectionObserver scroll-spy active highlighting, stuck-state detection (top:-1px trick), and scroll-margin-top anchor offsets for all 4 sections
- RideEthos declarative kicker section communicating founding date (June 7, 2014), always free, fellowship over competition, and all-levels welcome
- "Powered by Neucadia" body-level footer with locally-hosted logo, CLS-safe dimensions, and external link safety
- History section CSS-only light/dark mode via prefers-color-scheme — cream/forest palette with WCAG AA heading contrast
- Full-bleed Ojibwe inspiration background images via CSS breakout pattern (width:100vw + translateX) with scroll-triggered fade and reduced-motion guard

**Stats:**

- 86 files changed (+3,627/-66)
- 4,397 lines of Astro/TypeScript/JavaScript/CSS (total codebase)
- 3 phases, 5 plans, 27 commits
- 2 days (2026-04-07 → 2026-04-08)

**Git range:** `11fe6b2` (docs(45): research phase sticky nav domain) → `788452d` (docs(47): complete history light/dark mode phase)

**What's next:** TBD — next milestone via `/gsd:new-milestone`

---

## v1.7 UX Polish & Photo Pipeline (Shipped: 2026-04-07)

**Delivered:** Clean two-color route map, expanded photo pipeline (56 photos mileage-sorted), user-chosen segment card hero photos, resolved gallery layout and download UX friction, and full tech debt cleanup addressing all milestone audit items.

**Phases completed:** 40-44 (6 plans total)

**Key accomplishments:**

- Two-color route map replacing four-color surface-type polyline with forest900 base + amber500 gravel sector overlays; surface-points infrastructure fully removed
- UX friction resolved: broken "View in route guide" jump links removed from sector panels; route selector guidance added to GPX download section
- Photo pipeline expansion: 5 new photos processed (56 total), mileage-sorted output, WebP thumbnails generated, map markers and gallery updated
- Gallery layout polish: multi-column CSS Grid for segment cards (280px min, responsive 1-3 cols), mileage-ordered gallery, aspect ratios preserved via parseDims
- Tech debt cleanup: deleted 4 dead surface-points.json files, removed generate-surface-points from pipeline, fixed stale comments, corrected landscape CLS placeholder
- User-chosen segment card photos: reverted multi-photo grid to single hero image per card with full-res JPGs and cardPhoto field in segments.json

**Stats:**

- 51 files changed (+4,041/-5,742)
- 5,718 lines of Astro/TypeScript/JavaScript/CSS (total codebase)
- 5 phases, 6 plans, 35 commits
- 1 day (2026-04-07)

**Git range:** `30a9447` (docs: start milestone v1.7) → `5e3b8f4` (docs(44): complete phase)

**What's next:** TBD — next milestone via `/gsd:new-milestone`

---

## v1.6 Segment Editorial & Polish (Shipped: 2026-04-07)

**Delivered:** Concise ecological segment descriptions (35-55 words each) grounded in Hiawatha NF Forest Plan data, 520 segment hero photo via boundary adjustment, sector pill label removal, and production site URL configuration.

**Phases completed:** 38-39 (2 plans total)

**Key accomplishments:**

- Rewrote all 7 segment descriptions as 35-55 word naturalist prose with three-clause structure: surface texture, named ecological species (sugar maple, jack pine, paper birch, etc.), and terrain character
- Descriptions grounded in 2006 Hiawatha National Forest Plan ecological zone data — specific species per segment, no generic group names
- Synced descriptions word-for-word across RouteExplainer.astro, generate-sector-details.js, and regenerated sector-details.json
- 520 segment gains hero photo via boundary widening (endMi 5.0→5.6), NF2266 startMi adjusted to match
- Sector pill labels removed from map — obscured route at all tested sizes (user-directed)
- Production site URL set in astro.config.ts with TODO comment removed

**Stats:**

- 21 files modified (+2,412/-1,235)
- 5,807 lines of Astro/TypeScript/JavaScript/CSS (total codebase)
- 2 phases, 2 plans, ~4 tasks
- 1 day (2026-04-07)

**Git range:** `39d34e8` (docs: start milestone v1.6) → `1523a9a` (test(39): complete UAT)

**What's next:** TBD — next milestone via `/gsd:new-milestone`

---

## v1.5 Multi-Route Support (Shipped: 2026-04-07)

**Delivered:** Three-distance route system (100mi/100k/50k) with map-based route selector, per-route elevation profiles, filtered sector display, GPX downloads, URL deep linking, route comparison sidebar, hero background video, and a self-healing multi-route build pipeline.

**Phases completed:** 33-37 (10 plans total)

**Key accomplishments:**

- Multi-route data pipeline: route-config.js canonical source, parameterized pipeline producing per-route subdirectories (100mi/100k/50k), routes.json manifest, coordinate-based haversine sector snapping with RidewithGPS proximity fallback
- Atomic route switching: initMap()+renderRoute() refactor with activeRouteGroup L.layerGroup, run-flush surface-colored polylines (paved/gravel/dirt/unknown), persistent ghost polylines at 0.2 opacity for geographic context
- Cross-component synchronization: route:change CustomEvent wiring across elevation chart, route stats, GPX download link, and URL hash — all UI zones update atomically on route switch
- URL deep linking: #route=100k pre-selection on page load, history.replaceState without reload cascade, all route states bookmarkable and shareable
- Complete sector coverage: 7/7 Strava segments (Ridge Rd segment 41188200 added), panel auto-close on route switch with shared-sector persistence via keepPanelSectorId pattern
- Hero video: looping MP4 background with image poster/fallback, CSS + JS prefers-reduced-motion support
- Chart.js annotation fix: resolved Proxy infinite loop (Object.set recursion) in annotation updates during route switching

**Stats:**

- 64 files created/modified (+28,494/-448)
- 5,667 lines of Astro/TypeScript/JavaScript/CSS (total codebase)
- 5 phases, 10 plans, 48 commits
- 1 day (2026-04-06)

**Git range:** `525df3a` (feat(33-01): create route-config.js) → `e4b2c3f` (fix: mutate Chart.js annotations)

**What's next:** TBD — next milestone via `/gsd:new-milestone`

---

## v1.4 Performance & Polish (Shipped: 2026-04-06)

**Delivered:** Ship-ready polish with WebP image optimization (hero srcset, gallery, parallax), full SEO/social sharing metadata (OpenGraph, Twitter Card, canonical, Event JSON-LD), WCAG AA accessibility hardening (focus indicators, alt text, contrast, reduced-motion), tech debt cleanup (font, naming, cross-browser), and self-healing build pipeline.

**Phases completed:** 28-32 (7 plans total)

**Key accomplishments:**

- Tech debt resolved: Spectral serif font via Astro Fonts API, NF2217-2218 naming reconciled across all data files, Firefox star rating gradient @supports fallback
- Full SEO & social sharing: OpenGraph, Twitter Card, canonical URL, Schema.org Event JSON-LD for June 6, 2026 ride with 1200x630 OG image
- Image optimization: Hero WebP srcset (640w/1280w/1600w) with LCP preload, gallery WebP thumbnails confirmed, parallax CSS image-set() with WebP/JPEG selection
- WCAG AA accessibility: Global :focus-visible keyboard indicators, descriptive gallery alt text, star rating contrast fix (5.30:1), full reduced-motion compliance
- Self-healing pipeline: NF2217-2218 fixed at source in resolve-annotations.js, generate-og-image.js wired as 12th pipeline step
- Comprehensive audit passed: 15/15 requirements, 5/5 phases, 18/18 integration connections, 6/6 E2E flows verified

**Stats:**

- 52 files created/modified (+4,869/-218)
- 4,802 lines of Astro/TypeScript/JavaScript/CSS (total codebase)
- 5 phases, 7 plans, ~14 tasks
- 7 days from first commit to ship (2026-03-30 → 2026-04-06)

**Git range:** `8f47eee` (docs: create milestone v1.4 roadmap) → `e604041` (fix(uat): simplify map colors, fix gallery loading, polish hero and spacing)

**What's next:** TBD — next milestone via `/gsd:new-milestone`

---

## v1.3 Interactive Map & Editorial Polish (Shipped: 2026-04-02)

**Delivered:** First-class interactive map experience with sector labels, clickable detail panels with elevation sparklines, surface-colored route track, and editorial polish with EB Garamond drop-caps, parallax backgrounds, skeleton loaders, and three new Native American cultural motif components.

**Phases completed:** 23-27 (9 plans total)

**Key accomplishments:**

- Complete build-time data pipeline: surface-points.json (456 entries), sector-details.json (7 entries), and canonical difficulty stars in annotations.json — single source of truth for all map interactivity
- Interactive sector map with NP-styled difficulty-colored pill labels at polyline midpoints, zoom gating (>= 12), surface-colored route track (paved/gravel/dirt/unknown), and ghost polyline hit targets for reliable mobile touch
- Sector detail panels via HTML `<dialog>` with elevation sparklines, terrain descriptions, Strava links, and jump links to route guide — desktop slide-in (350px) and mobile bottom sheet (50vh) with X/Escape/click-outside close affordances
- Editorial polish: EB Garamond drop-caps, 3 independent parallax sub-section backgrounds with IntersectionObserver fade, doubled section spacing, route stats legibility fix, and photo gallery skeleton loaders
- Three new cultural motif SVG components (OjibweBorderPattern, WaterWavePattern, TurtleMotif) with proper accessibility attributes and currentColor theming
- Audit gap closure: EB Garamond Font tag, MAP-08 show() trade-off documented, NF2217-2218 name consistency, RouteMap.astro tech debt cleanup

**Stats:**

- 51 files created/modified
- 3,660 lines of Astro/TypeScript/JavaScript/CSS (total codebase)
- 5 phases, 9 plans, 17 tasks
- 3 days from first commit to ship (2026-03-30 → 2026-04-02)

**Git range:** `c2dfff2` (docs(23): research phase) → `6d4681f` (docs(27): complete audit gap closure phase)

**What's next:** TBD — next milestone via `/gsd:new-milestone`

---

## v1.2 Cultural Maximalism (Shipped: 2026-04-02)

**Delivered:** Maximalist cultural celebration with bold expanded color palette (turquoise/scarlet/sun-yellow), geometric animated dividers, shield/arrowhead motif system, historical Remington illustrations with sepia treatment, magazine editorial layout, enriched segment cards with sparklines and Strava links, scroll-driven reveals, and multi-color section backgrounds — elevating the site to award-winning non-profit visual storytelling.

**Phases completed:** 18-22 + v1.2-gaps (17 plans total)

**Key accomplishments:**

- Expanded color palette with 13 new tokens (turquoise, scarlet, sun-yellow families) and WCAG AA contrast documentation, plus orphaned v1.1 tokens activated
- AnimatedDivider with 3 geometric variants (zigzag, chevron, diamond) and FloralDivider redesigned with bold pattern bands, all with reduced-motion fallbacks
- ShieldMotif SVG symbol+use component system with currentColor inheritance at multiple sizes (icon, watermark, ornament)
- Build-time ElevationSparkline SVGs with gradient fills, grid lines, and per-segment elevation data computed by pipeline
- Historical Hiawatha illustrations (Frederic Remington 1891 via Met Open Access CC0) with sepia treatment, magazine editorial grid layout with named CSS tracks
- Enriched segment cards with photo-hero layout, difficulty-coded shields, Strava links (6/7), and expanded terrain descriptions
- Scroll-driven section reveals with staggered segment cards, dual CSS+JS reduced-motion guards, 614KB transfer size

**Stats:**

- 72 files created/modified
- 2,936 lines of Astro/TypeScript/JavaScript/CSS (total codebase)
- 6 phases, 17 plans, 63 commits
- 2 days (2026-04-01 → 2026-04-02)

**Git range:** `41b0ec2` (docs(18): research phase) → `3fc7e01` (docs(v1.2-gaps): complete UAT gap closure phase)

**What's next:** v1.3 Map Interactivity — sector labels, clickable detail panels

---

## v1.1 Visual Redesign (Shipped: 2026-03-31)

**Delivered:** Immersive editorial experience with Ojibwe-inspired design system, dramatic full-viewport hero, witty Hiawatha narrative, photo-integrated route explainer, and masonry gallery — elevating the site from functional showcase to visual storytelling.

**Phases completed:** 12-17 (8 plans total)

**Key accomplishments:**

- Ojibwe-inspired design system with 12 color tokens (berry/gold/lake/moss) via Tailwind v4 @theme static, getCSSColor() runtime pattern for JS components
- Hand-authored FloralDivider SVGs inspired by woodland floral beadwork with Ojibwe/Anishinaabe cultural attribution in footer
- Full-viewport hero with LCP-optimized forest creek photo, CSS Grid badge overlay, and event date visible without scrolling
- Witty HiawathaExplainer on Longfellow's conflation + photo-integrated RouteExplainer with segment data, star ratings, and topo textures
- CSS columns masonry gallery with natural aspect ratios, full-width featured photo moments, preserving PhotoSwipe lightbox
- Tech debt closure: accessibility fix (reduced-motion), dead CSS removal, WCAG accuracy, duplicate photo cleanup (54→51)

**Stats:**

- 51 files created/modified
- 1,912 lines of Astro/TypeScript/JavaScript/CSS (total codebase)
- 6 phases, 8 plans, 45 commits
- 1 day (2026-03-31)

**Git range:** `1151dbb` (docs(12): research phase) → `45d9d26` (docs(17): complete Tech Debt & Photo Cleanup)

**What's next:** v1.2 Map Interactivity — sector labels, detail panels

---

## v1.0 MVP (Shipped: 2026-03-31)

**Delivered:** Immersive showcase site for the Hiawatha's Revenge 100-mile gravel route with interactive map, elevation profile, photo gallery, and Forest Service visual identity — inspiring visitors to ride and support MBTN.

**Phases completed:** 0-11 (33 plans total)

**Key accomplishments:**

- Astro 6 + Tailwind 4 static site with Forest Service / National Park visual identity (badge h1, topo patterns, deep forest greens, amber accents)
- GPX data pipeline producing route-data.json, annotations.json, photos.json at build time with RDP simplification and elevation noise filtering
- Interactive Leaflet map with CyclOSM tiles, difficulty-coded gravel sector overlays, water drop restock markers, and clustered photo markers
- Chart.js elevation profile synced to map via CustomEvent bus with bike icon crosshair tracking
- PhotoSwipe gallery with sharp-generated WebP thumbnails and dev-only admin manifest UI for mileage assignment
- Full responsive polish (52px touch targets), prefers-reduced-motion support, and flat static production build

**Stats:**

- 219 files created/modified
- 2,223 lines of Astro/TypeScript/JavaScript/CSS
- 12 phases, 33 plans
- 2 days from initialization to ship (2026-03-30 → 2026-03-31)

**Git range:** `17068f4` (docs: initialize project) → `ff7f6a3` (docs(00): complete full-site UAT gap closure)

**What's next:** TBD — next milestone via `/gsd:new-milestone`

---
