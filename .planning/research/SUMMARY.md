# Project Research Summary

**Project:** Hiawatha's Revenge
**Domain:** Static cycling route showcase / charity ride marketing site
**Researched:** 2026-03-30
**Confidence:** HIGH

## Executive Summary

Hiawatha's Revenge is a static single-page showcase site for a 100-mile gravel cycling route through Michigan's Hiawatha National Forest, with the explicit purpose of inspiring riders and driving donations to the Munising Bay Trail Network (MBTN). The project is not a race registration site, not a blog, and not a backend application — it is a visually rich, data-driven static site whose center of gravity is an interactive map, an elevation profile, and a curated photo gallery. The dominant expert pattern for this category is Astro 6 (zero-JS static output, islands architecture) with Leaflet 1.9.4 (map), Chart.js 4.5.1 (elevation), and PhotoSwipe 5.4.4 (gallery) — all validated against the mkUltraGravel reference implementation which is the direct architectural ancestor of this project.

The recommended approach is a two-phase build: first a Node.js pipeline (gpxparser, sharp, exifr) that transforms raw GPX and photos into clean JSON and WebP thumbnails, then an Astro build that assembles those artifacts into static HTML with client-side Leaflet/Chart.js islands. This separation is mandatory — Leaflet and Sharp both assume browser/Node globals that Astro's SSR prerender environment does not provide. Cross-component interaction (elevation chart hover moves a crosshair on the map) is achieved via a lightweight `window.CustomEvent` bus with no framework overhead. The design system uses a National Park Service / Forest Service aesthetic (deep green, amber, parchment) and Space Mono + Special Elite fonts — both self-hosted via Astro 6's built-in Fonts API.

The dominant risks are architectural, not library-selection risks. Importing Leaflet at module scope crashes the build. Passing raw GPX point counts (3,000–5,000 points) to Chart.js degrades mobile performance. Naive elevation gain summation from GPS data produces figures 2x or more above actual values. Failing to install `leaflet-gesture-handling` traps mobile users in the map. All four risks have deterministic prevention strategies that must be applied in Phase 1 before any component is wired together. The stack is exceptionally well-validated: every core library version is current, and the mkUltraGravel codebase provides proven implementation patterns for every major feature on the roadmap.

---

## Key Findings

### Recommended Stack

The stack is fully constrained by the mkUltraGravel reference implementation and confirmed current against npm and official changelogs as of 2026-03-30. No version drift was found in any core dependency. Two map plugins (`leaflet-gesture-handling` and `leaflet.markercluster`) are unmaintained but stable on Leaflet 1.9.x — do not upgrade either until Leaflet 2.0 ecosystem catches up. The key non-obvious requirement is a Vite 7 override in `package.json` (Astro 6 ships Vite 6 internally; mkUltra forces Vite 7 at the outer project level).

**Core technologies:**
- **Astro 6.1.x** — static site framework; zero-JS components; Vite 6 build pipeline with Vite 7 override; built-in Fonts API; requires Node 22+
- **Tailwind CSS 4.2.2 + @tailwindcss/vite** — CSS-first config (`@theme` in CSS, no `tailwind.config.js`); runs as Vite plugin in `astro.config.mjs`
- **Leaflet 1.9.4** — interactive map; no API key; CARTO Dark Matter tiles; must be dynamically imported inside `<script>` blocks
- **Chart.js 4.5.1** — elevation profile; canvas-based, zero dependencies; built-in LTTB decimation for large GPX datasets
- **PhotoSwipe 5.4.4** — photo lightbox; used in two modes (HTML gallery anchors + programmatic `loadAndOpen()` from map markers)
- **gpxparser 3.0.8** — build-time GPX parsing; Node.js only; abandonware but functional
- **sharp 0.34.5** — build-time WebP thumbnail generation; devDependency; platform-specific binary requiring Node 22.22.2 (Volta-pinned)
- **exifr 7.1.3** — reads GPS EXIF from photos for mileage-tagged map markers
- **chartjs-plugin-annotation 3.1.0** — sector band overlays on elevation chart; must be registered before `new Chart()`

See `/Users/Sheppardjm/Repos/hiawathasRevenge/.planning/research/STACK.md` for full version matrix and installation commands.

---

### Expected Features

Reference sites audited: bikepacking.com, UNBOUND Gravel, Adventure Cycling Golden Gravel Trail, Gravel Worlds, mbtn.org.

**Must have (table stakes — P1):**
- Interactive Leaflet map with 100-mile GPX route polyline
- Chart.js elevation profile with distance X-axis and route stats block (distance, elevation gain, % gravel)
- PhotoSwipe photo gallery with 40–50 curated wilderness images
- Donate to MBTN CTA — explicit site purpose
- Restock / aid point markers on map — safety-critical for remote 100-mile route
- GPX file download — riders load to Garmin/Wahoo before attempting
- Route narrative (Hiawatha history + Ojibwe context + MBTN mission)
- National Park / Forest Service badge visual identity
- Responsive design (mobile-first, 52px touch targets minimum)

**Should have (differentiators — P2):**
- Map + elevation hover sync (crosshair) — no reference site does this; the signature feature
- Geotagged photo markers on map at mileage positions — unique to this implementation
- Gravel sector color overlays on both map and elevation chart — surface difficulty visualization
- Photo manifest admin UI — dev-only tool that unblocks the photo marker feature

**Defer (v2+):**
- Printable route card / PDF export
- Dark/light mode toggle (contradicts intentional Forest Service aesthetic)
- Ride report / blog section (content maintenance burden; mbtn.org is the community home)

**Anti-features (explicitly out of scope):**
Race registration, countdown timers, KOM/segment timing, user accounts, Strava embeds, real-time features, multiple distance options. These introduce competitive framing, backend requirements, or external dependencies that contradict the site's charity showcase purpose.

See `/Users/Sheppardjm/Repos/hiawathasRevenge/.planning/research/FEATURES.md` for full competitor analysis.

---

### Architecture Approach

The architecture is a two-phase pipeline pattern: (1) Node.js scripts transform GPX, photos, and annotations into clean JSON and WebP assets before the Astro build starts, then (2) Astro ingests those JSON files via content collections with Zod schema validation and assembles the static page. Each interactive component (RouteMap, ElevationProfile, PhotoGallery) is an Astro island initialized lazily via `IntersectionObserver` — Leaflet and Chart.js are never loaded until the user scrolls to them. Cross-island communication uses a `window.CustomEvent` bus with semantically named events (`elevation:hover`, `elevation:sectorClick`, `map:reset`, `map:photoClick`) — no state management library is needed.

**Major components:**
1. **Build pipeline** (`scripts/`) — `parse-gpx.js`, `resolve-annotations.js`, `match-photos.js`, `generate-thumbnails.js` — run before `astro build` via `npm run pipeline`; produces all JSON and WebP artifacts
2. **Content collections** (`src/content.config.ts`) — exposes `route-data.json`, `annotations.json`, `photos.json` as typed Astro collections via `file()` loaders and Zod schemas
3. **`index.astro`** — page shell; fetches collections and passes serialized props to each island
4. **`RouteMap.astro`** — Leaflet island; polyline, sector overlays, restock markers, photo cluster markers; emits and listens to CustomEvents
5. **`ElevationProfile.astro`** — Chart.js island; elevation vs. distance with sector shading; emits `elevation:hover`; listens to `map:reset`
6. **`PhotoGallery.astro`** — PhotoSwipe island; thumbnail grid; programmatic open on `map:photoClick`
7. **`admin.astro`** — dev-only photo manifest editor; not included in production static build

**Key architectural rules:**
- Data flows down at build time (JSON props from page to islands); events flow sideways at runtime (CustomEvent bus between sibling islands)
- Islands never share mutable state; the event bus carries only lightweight payloads (index, latlng, sectorId)
- Large datasets (5,000-point coordinate arrays) are served as `public/data/*.json` and fetched at runtime, not inlined into HTML

See `/Users/Sheppardjm/Repos/hiawathasRevenge/.planning/research/ARCHITECTURE.md` for full component diagram and anti-patterns.

---

### Critical Pitfalls

1. **Leaflet `window is not defined` crashes the build** — Use `client:only="vanilla"` for all Leaflet components; never import Leaflet at the top of `.astro` frontmatter or outside a `<script>` block. Apply this pattern before writing any map code.

2. **Raw GPX data overwhelms Chart.js and Leaflet on mobile** — Apply Ramer-Douglas-Peucker simplification to the polyline and LTTB decimation to the chart dataset at build time. Target ~500 chart points. Bake this into `parse-gpx.js`, not into the client-side component.

3. **Elevation gain statistics are 2x+ actual due to GPS noise** — Apply a minimum-threshold filter (only count gains >5m between consecutive points) to cumulative elevation during GPX parsing. Validate computed gain against Garmin/Strava figures for this specific route before displaying stats.

4. **Mobile scroll trap ruins user experience** — Install and configure `leaflet-gesture-handling` with `gestureHandling: true` in map options from day one. Non-negotiable for a mid-page embedded map.

5. **Map-elevation sync silently breaks when chart and map use different data arrays** — Produce one canonical reduced dataset at build time shared by both Leaflet and Chart.js. Use distance-along-route (not array index) as the sync key if the two arrays ever differ in length.

6. **OSM tile server violation gets the site blocked** — Never disable `attributionControl`; never pre-fetch tiles programmatically; ensure `© OpenStreetMap contributors` is visible on the map canvas.

See `/Users/Sheppardjm/Repos/hiawathasRevenge/.planning/research/PITFALLS.md` for full recovery strategies and checklist.

---

## Implications for Roadmap

The build dependency graph from ARCHITECTURE.md dictates a clear phase order. The pipeline must exist before any interactive components can receive data. The map and elevation chart must both be stable before cross-component sync can be built. The admin UI must produce a `photos.json` manifest before photo markers can appear. Visual theme can be applied at any point but design tokens should be established early to avoid rework.

### Phase 1: Project Foundation and Data Pipeline

**Rationale:** Every downstream component depends on the JSON outputs of the build pipeline. No map, chart, or gallery can be built without `route-data.json`. This phase establishes the architecture's load-bearing foundation and avoids the most dangerous pitfalls (Leaflet SSR crash, GPS noise in stats, raw point count overload) before any component code is written.

**Delivers:**
- Astro 6 project scaffolded with Tailwind 4, Vite 7 override, strict TypeScript, and Astro Fonts API (Space Mono + Special Elite)
- `scripts/parse-gpx.js` producing validated `route-data.json` with RDP-simplified coordinates and threshold-filtered elevation stats
- `scripts/resolve-annotations.js` producing `annotations.json` (restock points + sector definitions)
- `src/content.config.ts` with Zod schemas for all collections
- `npm run pipeline` chained into `npm run build` and `npm run dev`
- National Park / Forest Service CSS design tokens (`@theme` in `global.css`) — established early to prevent rework
- BaseLayout.astro with HTML shell, meta tags, and font loading

**Addresses:** Interactive map (prerequisite), elevation profile (prerequisite), restock markers (data), gravel sector overlays (data)
**Avoids:** Leaflet SSR crash (architecture established before any Leaflet code), raw GPX overload (pipeline decimates at build time), inaccurate elevation stats (threshold filter in pipeline)
**Research flag:** Standard patterns — no additional research needed; mkUltraGravel provides direct reference

---

### Phase 2: Route Map and Elevation Profile (Core Interactive Features)

**Rationale:** The map and elevation chart are the center of gravity of the site. They must be built together in the same phase because map-elevation hover sync requires both to exist simultaneously and share a canonical dataset. Building them sequentially would require revisiting both when adding sync.

**Delivers:**
- `RouteMap.astro` — Leaflet island with CARTO Dark Matter tiles, gesture handling, GPX polyline, `fitBounds()` on load, restock point markers, sector polyline overlays
- `ElevationProfile.astro` — Chart.js island with LTTB decimation, distance X-axis, sector shading bands, `pointRadius: 0` on dataset, `responsive: true`
- `window.CustomEvent` bus: `elevation:hover` (crosshair sync), `elevation:sectorClick` (map flyTo), `map:reset`
- `IntersectionObserver` lazy init for both islands (`rootMargin: '200px'`)
- Route stats block (distance, elevation gain, % gravel) as static callout
- Both components passing `astro build` without errors

**Uses:** Leaflet 1.9.4, leaflet-gesture-handling, Chart.js 4.5.1, chartjs-plugin-annotation, leaflet.markercluster (placeholder), CARTO tiles
**Implements:** RouteMap island, ElevationProfile island, CustomEvent bus, IntersectionObserver pattern
**Avoids:** Mobile scroll trap (gesture handling from day one), map-chart sync drift (single canonical dataset), OSM tile violation (attribution never disabled), Chart.js mobile lag (decimation + pointRadius: 0)
**Research flag:** Standard patterns — Leaflet + Chart.js + CustomEvent bus are all well-documented; mkUltraGravel provides direct reference

---

### Phase 3: Photo Gallery and Image Pipeline

**Rationale:** The gallery is the primary emotional conversion mechanism for MBTN donations. It depends on the thumbnail generation pipeline (sharp) and the photo manifest (photos.json). This phase builds the complete image pipeline from source JPEGs to WebP thumbnails to PhotoSwipe lightbox. Photo manifest admin UI is included here as it directly unblocks geotagged photo markers.

**Delivers:**
- `scripts/generate-thumbnails.js` — sharp pipeline producing 400px WebP thumbnails at 80% quality in `public/thumbs/`
- `scripts/match-photos.js` — validates photo paths and emits final `photos.json`
- `admin.astro` — dev-only photo manifest editor (assign mileage per photo, write `photos.json`)
- `PhotoGallery.astro` — PhotoSwipe 5 lightbox with thumbnail grid; `data-pswp-width` / `data-pswp-height` set at build time via `getImage()`; `loading="lazy"` on all thumbnails
- Photo markers on `RouteMap.astro` via `leaflet.markercluster` at mileage positions; `L.divIcon()` for all markers
- `window.CustomEvent` `map:photoClick` wired from map marker to PhotoGallery `lightbox.loadAndOpen(index)`

**Uses:** sharp, exifr, photoswipe, leaflet.markercluster
**Implements:** thumbnail pipeline, PhotoGallery island, admin UI, photo marker cluster layer
**Avoids:** Serving full-res originals in gallery grid (thumbnails only), PhotoSwipe dimension errors (build-time `getImage()`), admin UI path mismatch (validated end-to-end in this phase)
**Research flag:** Standard patterns for PhotoSwipe and sharp; admin UI file-write pattern may need brief validation — low complexity

---

### Phase 4: Content, Donate CTA, and GPX Download

**Rationale:** The non-interactive content — route narrative, donate CTA, GPX download, and responsive layout polish — does not depend on the interactive components but does need them stable first to integrate into the full page layout. Deferring this prevents content rewriting as the layout evolves.

**Delivers:**
- Route narrative section (Hiawatha history + Ojibwe context + MBTN mission statement)
- `DonateCallout.astro` — prominent donate button linking to `mbtn.org/donate`
- GPX download link (`<a href="/Munising_Hiawatha_s_Revenge.gpx" download>`)
- Full responsive layout audit: mobile-first breakpoints, 52px touch targets, Chart.js `maintainAspectRatio: false` with explicit CSS heights
- Leaflet fullscreen affordance or external map link for mobile deep exploration
- Final visual polish: badge typography, elevation chart axis labels, map control styling
- Production build verification: `astro build` passes; CSS includes all used Tailwind classes; thumbnails serve correctly; attribution visible on map canvas

**Uses:** Tailwind 4 utility classes, Astro Fonts API (Space Mono + Special Elite)
**Avoids:** Tailwind class purging (static class lists only; no dynamic class construction), mobile chart overflow (explicit container heights), Donate CTA buried below fold
**Research flag:** No research needed — standard Astro/Tailwind patterns

---

### Phase Ordering Rationale

- **Pipeline before components** — gpxparser and sharp require Node.js globals unavailable in Astro's Vite/SSR context; separating them into `scripts/` is architecturally mandatory, not optional
- **Map and chart together** — cross-component hover sync requires both to share one canonical dataset; building them in the same phase prevents the index-drift pitfall before it can emerge
- **Photo pipeline after map/chart** — photo markers depend on the map being stable; the admin UI is only meaningful once there are stable map pins to preview
- **Content last** — narrative and CTA text are stable regardless of component order; finalizing them after components are locked prevents unnecessary rewrites to accommodate layout shifts
- **Design tokens in Phase 1** — establishing `@theme` CSS variables early prevents scattered color/font hardcoding that creates rework in every subsequent phase

---

### Research Flags

**Phases that can skip `/gsd:research-phase` — standard patterns with direct mkUltraGravel reference:**
- Phase 1 (Astro scaffolding + GPX pipeline) — direct reference implementation available
- Phase 2 (Leaflet + Chart.js + CustomEvent bus) — official docs + mkUltra patterns fully cover this
- Phase 3 (PhotoSwipe + sharp + admin UI) — standard patterns; only admin UI file-write is slightly novel but low complexity
- Phase 4 (content + responsive polish) — no novel patterns

**No phase requires `/gsd:research-phase` during planning.** The combination of official documentation confidence (HIGH across all core libraries) and a direct reference implementation (mkUltraGravel) eliminates the need for exploratory research during roadmap execution. Implementation-time validation points are captured in PITFALLS.md's "Looks Done But Isn't" checklist.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm registry and official changelogs; mkUltraGravel provides authoritative version pins; only @xmldom/xmldom shows minor drift (0.8.11 vs 0.9.9 current — intentionally held) |
| Features | MEDIUM-HIGH | Core features confirmed against PROJECT.md and multiple reference sites; competitor analysis is pattern-triangulated from live sites; two features (hover sync, photo markers) are unique enough that no direct competitor reference exists |
| Architecture | HIGH | Based on official Astro/Leaflet/Chart.js docs and direct mkUltraGravel reference implementation; all patterns are verified against working code |
| Pitfalls | HIGH | Critical pitfalls verified via official GitHub issues, OSM policy docs, Chart.js performance docs; elevation noise handling confirmed via Ride with GPS support docs and research paper |

**Overall confidence: HIGH**

---

### Gaps to Address

- **Tile style choice:** STACK.md recommends CARTO Dark Matter (matches mkUltra); FEATURES.md notes a forest/park route may benefit from CyclOSM or Stadia Terrain tiles for better thematic fit. Resolve during Phase 2 — try both before locking in; CARTO Dark Matter is the safe default.

- **Elevation gain threshold tuning:** The 5-meter minimum threshold filter is a starting recommendation. The actual threshold for this specific GPX file should be validated against the known Garmin/Strava elevation figure for Hiawatha's Revenge before displaying stats. Do this during Phase 1 pipeline work.

- **Photo manifest file-write mechanism for admin UI:** The admin UI writes `photos.json` during dev. The exact mechanism (fetch POST to Astro dev server endpoint vs. CLI script) is described architecturally but not with a verified implementation. Either approach works; choose at Phase 3 based on simplicity.

- **@xmldom/xmldom version pin:** mkUltraGravel pins `^0.8.11`; current is `0.9.9`. No verified testing of 0.9.x compatibility with gpxparser has been done. Stay on `^0.8.11` unless gpxparser breakage is encountered.

---

## Sources

### Primary (HIGH confidence)
- `mkUltraGravel` reference implementation (`package.json`, `astro.config.mjs`, component source) — authoritative version and pattern reference
- [Astro Islands Architecture Docs](https://docs.astro.build/en/concepts/islands/) — component isolation and hydration patterns
- [Astro Content Collections — file() loader](https://docs.astro.build/en/guides/content-collections/) — typed data layer
- [Astro Blog: Astro 6.0](https://astro.build/blog/astro-6/) — Fonts API introduction (March 10, 2026)
- [Tailwind CSS v4 Blog](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config, Vite plugin
- [Leaflet GitHub Releases](https://github.com/Leaflet/Leaflet/releases) — 1.9.4 latest stable; 2.0 alpha ecosystem status
- [Chart.js Performance Documentation](https://www.chartjs.org/docs/latest/general/performance.html) — decimation, pointRadius
- [OSM Foundation Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) — attribution requirements
- [Leaflet.GestureHandling library](https://github.com/elmarquis/Leaflet.GestureHandling) — scroll trap prevention
- [PhotoSwipe Data Sources docs](https://photoswipe.com/data-sources/) — programmatic open API
- [npm registry](https://registry.npmjs.org/) — version verification for all core libraries
- PROJECT.md — confirmed features, constraints, and out-of-scope list

### Secondary (MEDIUM confidence)
- [bikepacking.com](https://bikepacking.com/routes/croatan-gravel-vanish/) — route page feature audit
- [Adventure Cycling Golden Gravel Trail](https://www.adventurecycling.org/routes-and-maps/adventure-cycling-route-network/golden-gravel-trail/) — feature audit
- [UNBOUND Gravel](https://www.unboundgravel.com/routes/) — feature audit
- [Ride with GPS: GPS Accuracy FAQ](https://support.ridewithgps.com/hc/en-us/articles/4419010957467) — elevation noise documentation
- [Grant Holtes: A Smoother Approach to Elevation Gain Calculation (July 2025)](https://www.grantholtes.com/assets/documents/Gaia_Elevation_Calculation.pdf) — threshold filter validation
- [Stamen Maps → Stadia Maps migration](https://stamen.com/here-comes-the-future-of-stamen-maps/) — tile provider context
- Leaflet GitHub Issues #6552, #8327 — SSR `window is not defined` verification

### Tertiary (LOW confidence)
- WebSearch "gravel cycling event website best design interactive map elevation GPX download 2025" — used for pattern triangulation only; no specific claims drawn from this

---
*Research completed: 2026-03-30*
*Ready for roadmap: yes*
