# Hiawatha's Revenge

## What This Is

A showcase website for Hiawatha's Revenge, a 100-mile cycling ride through Michigan's Hiawatha National Forest that supports the Munising Bay Trail Network (MBTN). The site exists because the current MBTN page doesn't capture how remote and breathtaking the route is — this site does the ride justice with an interactive route map, elevation profile, geotagged photo gallery, and a U.S. Forest Service / National Park visual identity.

## Core Value

Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Interactive route map (Leaflet) displaying the 100-mile GPX route with bike icon crosshair synced to elevation hover
- [ ] Elevation profile chart (Chart.js) synchronized with the route map
- [ ] Gravel sector overlays on map and elevation chart, color-coded by difficulty
- [ ] Restock point markers on the map with labels
- [ ] Photo markers on the map at tagged mileage points with clustered thumbnails
- [ ] Photo gallery with PhotoSwipe lightbox for full-screen viewing
- [ ] Photo manifest admin UI for easily assigning mileage to each photo
- [ ] National park badge-style h1 site name design (Phil Monson-inspired, CSS-only)
- [ ] U.S. Forest Service / National Park visual theme — deep forest greens, warm amber/gold, bold solid lines, heavy shadows, earthy tones
- [ ] Introductory paragraphs about Hiawatha (the historical figure) and how the land came to bear his name
- [ ] Donate to MBTN call-to-action prominently featured
- [ ] Responsive design across mobile, tablet, and desktop
- [ ] Lazy-loaded map and chart assets (IntersectionObserver pattern from mkUltra)
- [ ] Build pipeline: GPX parsing, photo matching, thumbnail generation (WebP), data JSON output
- [ ] Static site deployed via Astro with Tailwind CSS styling

### Out of Scope

- Race registration / BikeReg integration — this is a ride showcase, not a race
- KOM climbing segments — no competitive timing elements
- Countdown timer — no specific race date to count down to
- Real-time features — purely static showcase
- OAuth / user accounts — no login needed
- Mobile app — web only

## Context

- **Reference implementation:** github.com/sheppardjm/mkUltraGravel — same tech stack, same map/elevation/photo architecture. This project adapts it for a different route and completely different visual identity.
- **Route data:** `Munising_Hiawatha_s_Revenge.gpx` already in repo (100-mile route through Hiawatha National Forest, Upper Peninsula Michigan)
- **Photos:** ~50 route photos in `images/` folder, no GPS EXIF data. Mileage will be assigned via a manifest admin UI.
- **Inspiration images:** `images/inspiration/` folder contains national park badges (Yosemite, Grand Teton, Grand Canyon), Phil Monson badge designs, Pacific Northwest outdoor patches, arrowhead motifs with topographic lines, bogcore/wilderness illustrations, vintage Americana lettering, woodcut illustration styles, Michigan fantasy map art, native-themed geometric patterns.
- **Design direction:** The mkUltra site used a dark brutalist/classified-document aesthetic. This site pivots to a U.S. Forest Service / National Park ranger station feel — dark forest greens (#1a2e1a range), warm amber/gold (#c8973e range), rust/terracotta accents, cream/parchment text, heavy badge-style borders, topographic line patterns, bold condensed typography with text shadows.
- **MBTN:** The Munising Bay Trail Network (mbtn.org) is the beneficiary. The donate CTA links to their site.
- **Hiawatha context:** Named after the Hiawatha National Forest, itself named after the Longfellow poem "The Song of Hiawatha" which drew on Ojibwe legends of the Great Lakes region. The intro text should respectfully cover this history.

## Constraints

- **Tech stack**: Must match mkUltraGravel — Astro 6.x, Tailwind CSS 4.x, Leaflet, Chart.js, PhotoSwipe, sharp, gpxparser. No new frameworks.
- **No API keys**: Map tiles must be free/keyless (Carto, OpenStreetMap, or similar). Use a tile style that fits the forest/park theme rather than mkUltra's dark matter tiles.
- **Static output**: Astro static build, no SSR. All data processed at build time.
- **Image budget**: Thumbnails as 400px WebP at 80% quality (same as mkUltra pipeline).
- **Accessibility**: Touch-friendly controls (52x52px minimum), prefers-reduced-motion support.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clone mkUltra stack exactly | Proven architecture, known patterns, faster development | -- Pending |
| Photo manifest UI instead of EXIF extraction | Photos lack GPS data; user wants easy mileage assignment | -- Pending |
| Forest Service / National Park theme | Fits Hiawatha National Forest setting; inspiration images confirm direction | -- Pending |
| No KOM segments | Ride (not race) — no competitive elements | -- Pending |
| Donate CTA to MBTN | Ride supports trail network, not registration | -- Pending |

---
*Last updated: 2026-03-30 after initialization*
