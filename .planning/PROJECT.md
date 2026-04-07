# Hiawatha's Revenge

## What This Is

An immersive editorial showcase website for Hiawatha's Revenge, a 100-mile cycling ride through Michigan's Hiawatha National Forest that supports the Munising Bay Trail Network (MBTN). The site combines interactive cartography — a Leaflet route map with surface-colored track, clickable sector detail panels with elevation sparklines, difficulty-starred labels, and a Chart.js elevation profile synced via event bus — with rich visual storytelling: a dramatic full-viewport hero, witty editorial narrative on Longfellow's Hiawatha/Nanabozho conflation, photo-integrated route explainer, parallax editorial sections with EB Garamond drop-caps, and masonry gallery. The design draws from Ojibwe woodland floral beadwork traditions with hand-authored SVG motifs and a warm berry/gold/lake/moss color palette enriched with geometric cultural elements. Ship-ready with WebP image optimization, full SEO/social sharing metadata, WCAG AA accessibility compliance, and a self-healing 12-step build pipeline.

## Core Value

Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.

## Requirements

### Validated

- ✓ Interactive route map (Leaflet) with CyclOSM tiles, GPX polyline, bike icon crosshair synced to elevation hover — v1.0
- ✓ Elevation profile chart (Chart.js) synchronized with the route map via CustomEvent bus — v1.0
- ✓ Gravel sector overlays on map and elevation chart, color-coded by difficulty (green/amber/rust) — v1.0
- ✓ Restock point markers on the map with water drop icons and name/mileage popups — v1.0
- ✓ Photo markers on the map at tagged mileage points with leaflet.markercluster — v1.0
- ✓ Photo gallery with PhotoSwipe lightbox for full-screen viewing — v1.0
- ✓ Photo manifest admin UI for easily assigning mileage to each photo (dev-only) — v1.0
- ✓ National park badge-style h1 site name design (shield SVG with arrowhead and curved textPath) — v1.0
- ✓ U.S. Forest Service / National Park visual theme — deep forest greens, warm amber/gold, bold solid lines, heavy shadows, earthy tones — v1.0
- ✓ Introductory paragraphs about Hiawatha, Longfellow, Ojibwe history, and the National Forest — v1.0
- ✓ Donate to MBTN call-to-action prominently featured (rendered twice: above-fold and support section) — v1.0
- ✓ Responsive design across mobile (375px), tablet (768px), and desktop (1280px) with 52px touch targets — v1.0
- ✓ Lazy-loaded map and chart assets (IntersectionObserver pattern) — v1.0
- ✓ Build pipeline: GPX parsing, photo matching, thumbnail generation (WebP), data JSON output — v1.0
- ✓ Static site built via Astro 6 with Tailwind 4 styling, flat dist/ output — v1.0
- ✓ Full-width hero section with dramatic route photo, badge overlay, and event date — v1.1
- ✓ Masonry gallery with CSS columns, natural aspect ratios, and featured photo moments — v1.1
- ✓ Witty editorial narrative on Longfellow's Hiawatha/Nanabozho conflation with data.md quotes — v1.1
- ✓ Photo-integrated route explainer with segment data, star ratings, and topo background — v1.1
- ✓ Event date (June 6, 2026) prominently featured in hero section — v1.1
- ✓ Ojibwe woodland floral beadwork SVG motifs with cultural attribution — v1.1
- ✓ Warmer Ojibwe-inspired color palette (berry/gold/lake/moss) with WCAG AA compliance — v1.1
- ✓ Content sections broken up with landscape photos, cultural design elements, whitespace, secondary/tertiary headings, and multi-color section differentiation — v1.2
- ✓ Segment section subheads in National Park typeface with Strava links, detailed terrain descriptions, per-sector elevation snippets, and landmarks/POI — v1.2
- ✓ Shield/arrowhead motif repeated throughout site as backgrounds, section icons, and decorative elements — maximalist cultural layering — v1.2
- ✓ Bold color palette expansion — turquoise, red, yellow, black alongside existing Ojibwe tones, applied consistently across typography, backgrounds, and design elements — v1.2
- ✓ Animated multicolored section dividers — award-winning non-profit aesthetic — v1.2
- ✓ Historical Hiawatha imagery sourced from public domain (poem illustrations, theatrical productions, musicals) integrated throughout content — v1.2
- ✓ Interactive map sector labels with difficulty-colored pills at polyline midpoints, zoom gating — v1.3
- ✓ Clickable sector detail panels with elevation sparklines, terrain descriptions, Strava links, jump links — desktop slide-in + mobile bottom sheet — v1.3
- ✓ Route polyline colored by surface type (paved/gravel/dirt) using RidewithGPS data — v1.3
- ✓ EB Garamond drop-cap pull quotes, parallax sub-section backgrounds, doubled section spacing — v1.3
- ✓ Photo gallery skeleton loaders preventing CLS, route stats legibility fix — v1.3
- ✓ Three new Native American cultural motif SVG components (OjibweBorderPattern, WaterWavePattern, TurtleMotif) — v1.3
- ✓ Complete build-time data pipeline: surface-points.json, sector-details.json, canonical difficulty stars — v1.3
- ✓ Hero WebP srcset (640w/1280w/1600w) with `<picture>` element and LCP preload — v1.4
- ✓ Gallery WebP thumbnails and parallax CSS image-set() with WebP/JPEG format selection — v1.4
- ✓ Global :focus-visible keyboard indicators, descriptive gallery alt text, star rating contrast (5.30:1) — v1.4
- ✓ Reduced-motion compliance: sector panel transitions, map fitBounds, Leaflet animations — v1.4
- ✓ OpenGraph, Twitter Card, canonical URL, Schema.org Event JSON-LD for June 6, 2026 — v1.4
- ✓ Tech debt resolved: Spectral serif font, NF2217-2218 naming at source, Firefox @supports gradient guard — v1.4
- ✓ Self-healing 12-step build pipeline with generate-webp and generate-og-image steps — v1.4
- ✓ Multi-route pipeline: route-config.js, per-route subdirectories, routes.json manifest, coordinate-based haversine sector snapping — v1.5
- ✓ Route selector segmented control (100mi/100k/50k) with 52px touch targets, arrow key navigation, route-specific colors — v1.5
- ✓ Atomic route switching: initMap()+renderRoute() with activeRouteGroup, surface-colored polylines, ghost polylines — v1.5
- ✓ Elevation profile and route stats update dynamically on route:change, lazy-init race condition fix — v1.5
- ✓ Route comparison sidebar showing all 3 routes' stats side by side — v1.5
- ✓ GPX download link updates per selected route — v1.5
- ✓ URL hash deep linking (#route=100k) with history.replaceState — v1.5
- ✓ Hero video (looping MP4) with image fallback and prefers-reduced-motion support — v1.5
- ✓ Panel auto-close on route switch with shared-sector persistence (keepPanelSectorId) — v1.5
- ✓ 7/7 Strava segment links (Ridge Rd segment 41188200 completing full coverage) — v1.5

### Active

#### Current Milestone: v1.6 Segment Editorial & Polish

**Goal:** Finalize segment descriptions as concise trail-guide blurbs informed by LANDFIRE ecological zone data, fix the 520 missing photo, enlarge map sector labels, and set the production site URL.

**Target features:**
- Rewrite all 7 segment descriptions: short blurbs covering gravel type (loose/hardpack, fine/coarse), surrounding vegetation, tree cover, and ecological zones
- Research LANDFIRE ecological zone data overlaid on route to inform descriptions
- Fix 520 segment missing hero photo
- Enlarge sector label pills on Leaflet map to fit full segment names
- Set site URL to hiawathasrevenge.com in astro.config.ts

### Out of Scope

- Race registration / BikeReg integration — this is a ride showcase, not a race
- KOM climbing segments — no competitive timing elements
- Countdown timer — no specific race date to count down to
- Real-time features — purely static showcase
- OAuth / user accounts — no login needed
- Mobile app — web only
- Leaflet 2.0 upgrade — alpha, plugins incompatible
- AI-generated cultural imagery — contradicts site's cultural critique narrative

## Context

Shipped v1.0 through v1.5 with 5,667 LOC across Astro/TypeScript/JavaScript/CSS.
Tech stack: Astro 6, Tailwind 4, Vite 7, Leaflet, Chart.js, PhotoSwipe, leaflet.markercluster, chartjs-plugin-annotation, sharp, gpxparser.
Build pipeline: 12-step pipeline.js running per-route (parse-gpx → generate-surface-points → resolve-annotations → generate-sector-details → compute-sector-elevations) then shared steps (generate-thumbnails → copy-images → generate-webp → process-historical → match-photos → copy-gpx → generate-og-image).
3 route distances: 100mi (456 pts, 102mi, 2,258 ft), 100k (278 pts, 62mi, 1,616 ft), 50k (134 pts, 31mi, 809 ft).
51 route photos with mileage-assigned manifest, 2 historical Remington illustrations (Met CC0).
v1.5 added multi-route support with per-route JSON data, map-based route selector, dynamic elevation chart, route comparison, GPX downloads, URL deep linking, and hero video.
Site URL configured as https://hiawathasrevenge.com (placeholder — update before deployment).
Reference implementation: github.com/sheppardjm/mkUltraGravel — same architecture, different visual identity.
MBTN (mbtn.org) is the beneficiary — donate CTA links to their site.

## Constraints

- **Tech stack**: Must match mkUltraGravel — Astro 6.x, Tailwind CSS 4.x, Leaflet, Chart.js, PhotoSwipe, sharp, gpxparser. No new frameworks.
- **No API keys**: Map tiles must be free/keyless (Carto, OpenStreetMap, or similar). Use a tile style that fits the forest/park theme rather than mkUltra's dark matter tiles.
- **Static output**: Astro static build, no SSR. All data processed at build time.
- **Image budget**: Thumbnails as 400px WebP at 80% quality (same as mkUltra pipeline).
- **Accessibility**: Touch-friendly controls (52x52px minimum), prefers-reduced-motion support.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clone mkUltra stack exactly | Proven architecture, known patterns, faster development | ✓ Good — shipped in 2 days |
| Photo manifest UI instead of EXIF extraction | Photos lack GPS data; user wants easy mileage assignment | ✓ Good — admin UI works well |
| Forest Service / National Park theme | Fits Hiawatha National Forest setting; inspiration images confirm direction | ✓ Good — cohesive identity |
| CyclOSM tiles (not Carto Dark Matter) | Forest-themed bicycle cartography, no API key | ✓ Good — excellent fit |
| National Park font for headings | Replaced Special Elite; better park ranger aesthetic | ✓ Good |
| Shield SVG badge h1 | Arrowhead + curved textPath, CSS-only | ✓ Good — distinctive branding |
| Elevation gain on full-res points | RDP strips intermediate changes causing ~45% under-count | ✓ Good — 2,258 ft verified |
| Direct canvas mousemove for crosshair | Chart.js onHover unreliable with parsing:false | ✓ Good — reliable sync |
| Water drop SVG for restock markers | Visually distinct from photo cluster markers | ✓ Good |
| No KOM segments | Ride (not race) — no competitive elements | ✓ Good |
| Donate CTA to MBTN | Ride supports trail network, not registration | ✓ Good |
| Remove @astrojs/node for static build | Flat dist/ with no SSR | ✓ Good — deployable anywhere |
| @theme static over @theme for Tailwind v4 tokens | Tree-shaking prevention; JS needs getComputedStyle access | ✓ Good — all tokens in :root |
| getCSSColor() inside init functions | getComputedStyle requires document ready; module scope too early | ✓ Good — reliable runtime reads |
| Forest creek as hero photo | User chose over POV, cyclists, lake options | ✓ Good — National Forest identity |
| CSS Grid stacking for badge overlay | Absolute positioning failed with Astro scoped styles | ✓ Good — reliable overlay |
| Inline SVG for FloralDivider | CSS data-URI cannot resolve var(--color-*) custom properties | ✓ Good — tokens in fill/stroke |
| Hand-authored SVG paths (not Neebin Studios) | Licensing ambiguity with institutional design files | ✓ Good — clean provenance |
| Specific Ojibwe/Anishinaabe attribution | Generic "Native American" insufficient per DSN-04 | ✓ Good — respectful specificity |
| CSS columns for masonry gallery | Only CSS-only masonry approach; no JS dependency | ✓ Good — standard, performant |
| Spread conditional for featured field | No featured: false noise in JSON | ✓ Good — clean data |
| Build-time sector-details.json | Single source of truth for panel content, not hardcoded | ✓ Good — clean data pipeline |
| Ghost polyline pattern (not leaflet-highlightable-layers) | Zero new dependencies | ✓ Good — simple, reliable |
| HTML dialog + CSS translate for panels | No JS animation library needed | ✓ Good — native semantics |
| dialog.show() over showModal() | Map stays interactive while panel is open | ✓ Good — documented trade-off |
| 5-decimal coordinate matching for surface lookup | 456/456 match rate, no fallback needed | ✓ Good — perfect accuracy |
| Hardcoded hex in sparkline SVG | CSS vars unavailable in innerHTML-injected SVG | ✓ Good — matches design tokens |
| Cascade fix for stat legibility | Specific :global() overrides, no !important | ✓ Good — clean CSS |
| EB Garamond Font tag without preload | Drop-cap use below-fold only | ✓ Good — no critical-path weight |
| MAP-08 show() trade-off | Non-modal preserves map interactivity, no backdrop expected | ✓ Good — intentional design |
| Spectral serif font for sector panel | Below-fold use, no preload weight | ✓ Good — editorial register |
| @supports guard for gradient text | Progressive enhancement: Firefox gets solid fallback | ✓ Good — cross-browser safe |
| amber-300 empty stars (5.30:1) | WCAG AA contrast on forest-800 background | ✓ Good — accessible |
| :focus-visible not :focus | Keyboard-only indicators per WCAG SC 2.4.7 | ✓ Good — no mouse rings |
| Sharp center-crop for OG image | Preserve forest midpoint in 1200x630 | ✓ Good — social preview quality |
| image-set() without -webkit- prefix | Baseline widely available since September 2023 | ✓ Good — clean CSS |
| Fix NF2217 at source not output | Pipeline source truth prevents regression | ✓ Good — self-healing |
| generate-og-image as final pipeline step | No data dependencies, safe ordering | ✓ Good — clean pipeline |
| Placeholder domain in astro.config.ts | Deployment URL TBD; all chain logic correct | — Pending deployment |
| Subdirectory output: public/data/{routeId}/ | Enables lazy loading, avoids index collisions | ✓ Good — clean per-route data |
| Coordinate-based haversine snapping | Eliminates drift from route length differences | ✓ Good — accurate sector mapping |
| RidewithGPS proximity fallback (100m) for 100k/50k | No native rwgps JSON for shorter routes | ✓ Good — 100mi as reference |
| routes.json manifest with shortName, color, sectorIds | Everything route switcher needs without extra lookups | ✓ Good — single fetch |
| RouteSelector as plain DOM (not L.Control) | Enables true top-center positioning | ✓ Good — not confined to corners |
| Ghost polylines on map directly (not activeRouteGroup) | Persist across route switches | ✓ Good — no re-creation |
| ElevationProfile chart.update('none') | Instant data swap without animation | ✓ Good — seamless switch |
| history.replaceState (not location.hash) | Prevents hashchange event cascade | ✓ Good — no reload loop |
| Panel close at step 1.5 before clearActiveRoute | clearActiveRoute nulls activeSector — check after is dead code | ✓ Good — bug fix |
| keepPanelSectorId for shared-sector persistence | Save sector ID before clear, restore after rebuild | ✓ Good — smooth UX |
| Mutate Chart.js annotations (not replace) | Replacing triggers Proxy Object.set infinite recursion | ✓ Good — fix for Chart.js v4 |

---
*Last updated: 2026-04-07 after v1.6 milestone started*
