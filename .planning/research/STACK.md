# Stack Research

**Domain:** Static cycling route showcase site (interactive map, elevation chart, photo gallery)
**Researched:** 2026-03-30
**Confidence:** HIGH — all core versions verified against npm registry and official changelogs

## Context

Stack is constrained: must match `mkUltraGravel` exactly. Research validates that the mkUltra
versions are current, flags any drift, and documents gotchas learned from the existing codebase.

---

## Recommended Stack

### Core Technologies

| Technology | Version (mkUltra) | Latest Stable | Status | Why Recommended |
|------------|-------------------|---------------|--------|-----------------|
| Astro | ^6.1.1 | 6.1.2 | Current | Static output by default, zero-JS components, Vite 6 pipeline, built-in Fonts API (new in 6.0). Requires Node 22+. |
| Tailwind CSS | ^4.2.2 | 4.2.2 | Current | CSS-first config (no tailwind.config.js), native cascade layers, oklch color palette matches design system, Vite-native plugin. Major break from v3. |
| @tailwindcss/vite | ^4.2.2 | 4.2.2 | Current | Required Vite plugin for Tailwind 4 — replaces PostCSS approach. Configured in astro.config.mjs as a vite plugin. |
| TypeScript | via Astro strict | via astro/tsconfigs/strict | Current | Strict tsconfig via `"extends": "astro/tsconfigs/strict"`. No separate install needed. |

### Interactive Map Stack

| Library | Version (mkUltra) | Latest Stable | Status | Why |
|---------|-------------------|---------------|--------|-----|
| leaflet | ^1.9.4 | 1.9.4 | Current | No API key required. Free CARTO Dark Matter tiles. Mature API, all plugins target 1.x. **Do not upgrade to 2.0 alpha** — breaking API changes, plugin ecosystem not ready. |
| leaflet-gesture-handling | ^1.2.2 | 1.2.2 | Unmaintained but functional | Prevents scroll trap on page. Last published 2021 but stable against Leaflet 1.9.x. Incompatible with Leaflet 2.0 alpha. Stick with 1.2.2. |
| leaflet.markercluster | ^1.5.3 | 1.5.3 | Unmaintained but functional | Photo marker clustering. Last published 2021. Works on Leaflet 1.9.x. Required companion: `@types/leaflet.markercluster ^1.5.6`. |
| @types/leaflet.markercluster | ^1.5.6 | 1.5.6 | Current TS types | TypeScript types for markercluster. Published 4 months ago — actively maintained types. |

### Elevation Chart Stack

| Library | Version (mkUltra) | Latest Stable | Status | Why |
|---------|-------------------|---------------|--------|-----|
| chart.js | ^4.5.1 | 4.5.1 | Current | Canvas-based, zero dependencies, 70KB. Used via `chart.js/auto` import. LTTB decimation plugin built-in — critical for 5000-point GPX datasets. |
| chartjs-plugin-annotation | ^3.1.0 | 3.1.0 | Current | Sector band overlays and KOM segment highlights on elevation chart. Must be registered BEFORE `new Chart()` — silent failure otherwise. |

### Photo Gallery Stack

| Library | Version (mkUltra) | Latest Stable | Status | Why |
|---------|-------------------|---------------|--------|-----|
| photoswipe | ^5.4.4 | 5.4.4 | Current | Lightbox gallery. Used in two modes: (1) standard gallery from HTML anchors in PhotoGallery.astro, (2) programmatic `loadAndOpen(index)` from Leaflet map markers. No jQuery. Pure ESM. |

### Data Processing Pipeline (Node/Build-Time)

| Library | Version (mkUltra) | Latest Stable | Status | Why |
|---------|-------------------|---------------|--------|-----|
| gpxparser | ^3.0.8 | 3.0.8 | Abandonware (last pub 2021) | Parses GPX files into track points with lat/lon/elevation. Functional, no security concerns for local build-time use. Modern alternative: `gpxjs` — but no reason to switch, mkUltra works. |
| @xmldom/xmldom | ^0.8.11 | 0.9.9 | Minor drift (1 minor version) | DOM parser used internally by gpxparser for Node.js (which lacks browser DOM). mkUltra pins ^0.8.11 — verify 0.9.x compatibility before bumping. |
| exifr | ^7.1.3 | 7.1.3 | Current | Reads GPS EXIF from photos to produce lat/lon for mileage-tagged map markers. Fast, browser + Node compatible. |
| sharp | ^0.34.5 | 0.34.5 | Current (devDependency) | WebP thumbnail generation at build time. 400px-wide thumbs for map markers and gallery grid. Native binary — platform-specific install via npm. |

### Development & Testing

| Tool | Version (mkUltra) | Latest Stable | Status | Why |
|------|-------------------|---------------|--------|-----|
| vitest | ^4.1.2 | 4.1.2 | Current | Unit tests for scoring logic and data pipeline. Vite-native — zero config with Astro's Vite build. |
| Node.js | 22.22.2 (volta-pinned) | LTS | Pinned via Volta | Astro 6 requires Node 22+. mkUltra pins 22.22.2 via Volta. Use same version to avoid sharp binary mismatch. |

### Font Stack (Astro 6 Fonts API)

| Font | Provider | CSS Variable | Purpose |
|------|----------|--------------|---------|
| Space Mono | Google Fonts | `--font-mono` | Body/mono text — typewriter aesthetic |
| Special Elite | Google Fonts | `--font-display` | Display/badge headings — worn typeface |

Fonts are configured in `astro.config.mjs` via Astro 6's built-in Fonts API (`fontProviders.google()`).
Astro downloads, caches, and self-hosts fonts — no runtime Google Fonts CDN dependency.

---

## Tile Provider

**CARTO Dark Matter** (no API key required):
```
https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
subdomains: 'abcd', maxZoom: 20
```
Attribution: OpenStreetMap contributors + CARTO. Free for non-commercial/attribution use.
CARTO also offers Positron (light) and Voyager (terrain) as no-key alternatives.

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Leaflet 2.0.0-alpha | Pre-release; drops global `L`, factory methods removed, plugins incompatible. Targeted Nov 2025 release — missed. Ecosystem not ready. | Leaflet 1.9.4 |
| Mapbox GL JS | Requires paid API key. Proprietary license since v2. | Leaflet 1.9.4 + CARTO tiles |
| Google Maps JS API | Requires billing account + API key. Overkill for static showcase. | Leaflet 1.9.4 + CARTO tiles |
| MapLibre GL JS | Better alternative to Mapbox, but GL rendering overkill for a route polyline. Vector tiles = heavier setup. | Leaflet 1.9.4 (raster tiles sufficient) |
| Mapbox/Stamen tiles | API key required (Mapbox) or discontinued (Stamen → Stadia). | CARTO Dark Matter |
| tailwind.config.js | Tailwind 4 uses CSS-first config (@theme in CSS). A JS config file signals v3 patterns — don't create one. | @theme directive in global CSS |
| Astro client:load directive | Forces eager hydration. For Leaflet/Chart.js, use IntersectionObserver + scroll lazy init pattern instead. | Lazy init pattern (see RouteMap.astro) |
| @xmldom/xmldom 0.9.x (without testing) | Minor version bump from mkUltra's ^0.8.11. API may differ. | Stay on ^0.8.11 until verified |

---

## Vite Override

mkUltraGravel pins Vite 7 via package.json `overrides`:
```json
"overrides": {
  "vite": "^7"
}
```
Astro 6 ships with Vite 6 internally. The override forces Vite 7 for the outer project. Replicate this
override in hiawathasRevenge to stay in sync. (Astro 6 uses Vite's Environment API — this override
works because Astro's Vite dependency is compatible with Vite 7.)

---

## Installation

```bash
# Create Astro project
npm create astro@latest

# Core dependencies (match mkUltra exactly)
npm install astro@^6.1.1 tailwindcss@^4.2.2 @tailwindcss/vite@^4.2.2

# Map stack
npm install leaflet@^1.9.4 leaflet-gesture-handling@^1.2.2 leaflet.markercluster@^1.5.3 @types/leaflet.markercluster@^1.5.6

# Chart stack
npm install chart.js@^4.5.1 chartjs-plugin-annotation@^3.1.0

# Gallery
npm install photoswipe@^5.4.4

# Data pipeline
npm install gpxparser@^3.0.8 @xmldom/xmldom@^0.8.11 exifr@^7.1.3

# Dev dependencies
npm install -D sharp@^0.34.5 vitest@^4.1.2
```

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| leaflet@1.9.4 | leaflet-gesture-handling@1.2.2 | Tested in mkUltra. GestureHandling uses `addInitHook` — must register before `L.map()`. |
| leaflet@1.9.4 | leaflet.markercluster@1.5.3 | Works. markercluster attaches as side-effect import. |
| chart.js@4.5.1 | chartjs-plugin-annotation@3.1.0 | Annotation 3.x requires Chart.js 4.x. Must `Chart.register(AnnotationPlugin)` before `new Chart()`. |
| photoswipe@5.4.4 | leaflet@1.9.4 | No conflict. PhotoSwipe used independently via `lightbox.loadAndOpen(index)` from marker click handlers. |
| astro@6.1.x | tailwindcss@4.2.2 + @tailwindcss/vite@4.2.2 | Tailwind 4 runs as Vite plugin in `astro.config.mjs`. No PostCSS config needed. |
| astro@6.1.x | leaflet@1.9.4 | Leaflet must be dynamically imported inside `<script>` tags — SSR will throw `window is undefined` if imported at module scope. |
| sharp@0.34.5 | Node 22.22.2 | Sharp binaries are platform/Node-version specific. Pin Node version via Volta to avoid binary mismatch on team machines. |

---

## Alternatives Considered

| Category | Recommended | Alternative | When Alternative Is Better |
|----------|-------------|-------------|---------------------------|
| Static framework | Astro 6 | Next.js, SvelteKit, Nuxt | Never for this use case — all require server runtime, API routes, or heavy hydration for a pure showcase site. |
| Map library | Leaflet 1.9.4 | MapLibre GL JS | If you need vector tiles, 3D terrain, or custom GL shaders. Overkill for a route polyline. |
| CSS framework | Tailwind 4 | Vanilla CSS, UnoCSS | UnoCSS is faster in theory but smaller ecosystem; Tailwind's utility classes match what mkUltra already uses. Vanilla fine but verbose for badge/overlay styling. |
| Charts | Chart.js 4 | D3.js, Recharts, Plotly | D3 gives more control but 4x heavier setup for a simple elevation line. Recharts is React-only. |
| Gallery | PhotoSwipe 5 | GLightbox, FancyBox | GLightbox is simpler but lacks programmatic `open(index)` API needed for map-marker integration. FancyBox is paid for commercial. |
| Image processing | sharp | Jimp, imagemin | sharp is 5–10x faster, supports WebP natively, handles EXIF-aware rotation. Jimp is pure JS but slow. |
| GPX parsing | gpxparser | gpxjs, @tmcw/togeojson | gpxjs is more actively maintained with TypeScript and GeoJSON output — good migration target if gpxparser ever breaks. @tmcw/togeojson outputs GeoJSON directly. |
| Font delivery | Astro Fonts API (Google) | Google Fonts CDN, self-hosted | Astro Fonts API self-hosts automatically — better performance, privacy, no third-party CDN dependency. |

---

## Key Architectural Gotchas (From mkUltra Source)

**1. Leaflet must be dynamically imported.**
All Leaflet code lives inside `<script>` blocks with `await import('leaflet')`. Never import at the
top of an Astro component frontmatter — SSR will throw `window is undefined`.

**2. Lazy init via IntersectionObserver + scroll event.**
Both map and chart use a two-stage lazy init: scroll event (primary) + IntersectionObserver (fallback
for anchor navigation). This keeps Leaflet (44KB) and Chart.js (70KB) off the LCP critical path.

**3. Tailwind 4 CSS-first config.**
No `tailwind.config.js`. Theme tokens (`--font-mono`, `--font-display`, colors) defined in CSS via
`@theme`. Leaflet CSS imported in a `@layer leaflet` block to prevent Tailwind's reset from clobbering
map controls.

**4. divIcon for all Leaflet markers.**
Default Leaflet markers break in Vite builds (PNG paths resolve incorrectly). All markers use
`L.divIcon()` with inline HTML/SVG. Restock markers, photo markers, sector badges, and the bike
crosshair all use divIcon.

**5. AnnotationPlugin registration order.**
`Chart.register(AnnotationPlugin)` must happen before `new Chart()`. Silent failure if out of order.

**6. sharp is a devDependency.**
sharp runs only at build time (thumbnail generation). It is NOT a runtime dependency — keep it in
`devDependencies` to avoid shipping native binaries in production.

**7. PhotoSwipe dual usage pattern.**
PhotoSwipe is used two ways: (a) gallery mode from HTML anchors in the grid, (b) programmatic
`lightbox.loadAndOpen(index)` from map marker clicks. The programmatic mode requires passing a
`dataSource` array to the lightbox constructor — not an HTML gallery selector.

---

## Sources

- `package.json` from mkUltraGravel — authoritative version pins (HIGH confidence)
- `astro.config.mjs` from mkUltraGravel — configuration pattern (HIGH confidence)
- `src/components/RouteMap.astro`, `ElevationProfile.astro`, `PhotoGallery.astro` — implementation patterns (HIGH confidence)
- https://registry.npmjs.org/astro/latest — Astro 6.1.2 confirmed current (HIGH confidence)
- https://astro.build/blog/astro-6/ — Astro 6.0 released March 10, 2026; Fonts API introduced in 6.0 (HIGH confidence)
- https://registry.npmjs.org/tailwindcss/latest — Tailwind 4.2.2 confirmed current (HIGH confidence)
- https://tailwindcss.com/blog/tailwindcss-v4 — Tailwind v4.0 released Jan 22, 2025; Vite plugin, CSS-first config (HIGH confidence)
- https://github.com/Leaflet/Leaflet/releases — Leaflet 1.9.4 latest stable; 2.0 alpha not production-ready (HIGH confidence)
- https://github.com/Leaflet/Leaflet/issues/9869 — Leaflet 2.0 targeted Nov 2025, missed; ecosystem (plugins) not upgraded (MEDIUM confidence)
- https://github.com/chartjs/Chart.js/releases — Chart.js 4.5.1 confirmed latest (HIGH confidence)
- https://registry.npmjs.org/chartjs-plugin-annotation/latest — 3.1.0 confirmed current (HIGH confidence)
- https://github.com/dimsemenov/PhotoSwipe/releases — PhotoSwipe 5.4.4 confirmed current (HIGH confidence)
- https://github.com/lovell/sharp/releases — sharp 0.34.5 confirmed current stable (HIGH confidence)
- https://registry.npmjs.org/vitest/latest — vitest 4.1.2 confirmed current (HIGH confidence)
- https://registry.npmjs.org/gpxparser/latest — gpxparser 3.0.8, last pub June 2021 (HIGH confidence)
- https://registry.npmjs.org/@xmldom/xmldom/latest — @xmldom/xmldom 0.9.9 current; mkUltra pins 0.8.11 (HIGH confidence)
- https://registry.npmjs.org/exifr/latest — exifr 7.1.3 confirmed current (HIGH confidence)
- https://www.npmjs.com/package/leaflet-gesture-handling — 1.2.2 latest, last pub 2021 (MEDIUM confidence — unmaintained)
- https://www.npmjs.com/package/leaflet.markercluster — 1.5.3 latest, last pub 2021 (MEDIUM confidence — unmaintained)

---
*Stack research for: Hiawatha's Revenge cycling route showcase site*
*Researched: 2026-03-30*
