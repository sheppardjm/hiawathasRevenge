# Hiawatha's Revenge

## What This Is

An immersive editorial showcase website for Hiawatha's Revenge, a 100-mile cycling ride through Michigan's Hiawatha National Forest that supports the Munising Bay Trail Network (MBTN). The site combines interactive cartography (Leaflet route map with gravel sector overlays, Chart.js elevation profile synced via event bus) with rich visual storytelling — a dramatic full-viewport hero, witty editorial narrative on Longfellow's Hiawatha/Nanabozho conflation, photo-integrated route explainer, and masonry gallery. The design draws from Ojibwe woodland floral beadwork traditions with hand-authored SVG motifs and a warm berry/gold/lake/moss color palette.

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

### Active

- [ ] Sector map labels with names and star difficulty ratings, clickable with slide-out detail panels

### Out of Scope

- Race registration / BikeReg integration — this is a ride showcase, not a race
- KOM climbing segments — no competitive timing elements
- Countdown timer — no specific race date to count down to
- Real-time features — purely static showcase
- OAuth / user accounts — no login needed
- Mobile app — web only

## Context

Shipped v1.0 + v1.1 with 1,912 LOC across Astro/TypeScript/JavaScript/CSS.
Tech stack: Astro 6, Tailwind 4, Vite 7, Leaflet, Chart.js, PhotoSwipe, sharp, gpxparser.
Build pipeline: 6-step pipeline.js (parse-gpx → resolve-annotations → generate-thumbnails → copy-images → match-photos → copy-gpx).
51 route photos with mileage-assigned manifest (3 duplicates removed in v1.1), 456 simplified route points (from 1,927 source), 2,258 ft elevation gain.
v1.1 added Ojibwe-inspired design system (12 color tokens), full-viewport hero, editorial narrative, route explainer, masonry gallery, and cultural attribution.
Reference implementation: github.com/sheppardjm/mkUltraGravel — same architecture, different visual identity.
MBTN (mbtn.org) is the beneficiary — donate CTA links to their site.
Historical context in `data.md` — segment details with star ratings, Hiawatha history with Longfellow critique quote.

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

---
*Last updated: 2026-03-31 after v1.1 milestone completion*
