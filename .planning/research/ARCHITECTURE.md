# Architecture Research

**Domain:** Static cycling route showcase site (Astro / Leaflet / Chart.js)
**Researched:** 2026-03-30
**Confidence:** HIGH — based on Context7 Astro docs, official Leaflet/Chart.js documentation, and the mkUltraGravel reference implementation as a proven pattern

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BUILD PIPELINE (Node.js scripts)              │
│  ┌────────────┐  ┌────────────────┐  ┌────────────┐  ┌──────────┐  │
│  │ parse-gpx  │  │resolve-         │  │match-      │  │generate- │  │
│  │ GPX→JSON   │  │annotations      │  │photos      │  │thumbnails│  │
│  │            │  │annotations.json │  │photos.json │  │WebP      │  │
│  └─────┬──────┘  └────────┬───────┘  └─────┬──────┘  └────┬─────┘  │
│        │                  │                 │              │         │
│        ▼                  ▼                 ▼              ▼         │
│  route-data.json   annotations.json   photos.json   public/thumbs/  │
└──────────────────────────────────────────────────────────────────────┘
            │                  │               │
            ▼                  ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ASTRO BUILD (src/content.config.ts)               │
│   file() loaders hydrate content collections from generated JSON     │
└──────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PAGE LAYER (src/pages/)                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      index.astro                              │   │
│  │  Assembles layout, passes data props to each island           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPONENT LAYER (src/components/)                 │
│  ┌──────────────────┐  ┌───────────────────┐  ┌─────────────────┐  │
│  │  RouteMap.astro   │  │ElevationProfile   │  │ PhotoGallery    │  │
│  │  (Leaflet island) │  │.astro             │  │ .astro          │  │
│  │  ~15KB JS         │  │(Chart.js island)  │  │ (PhotoSwipe)    │  │
│  │                   │  │~11KB JS           │  │                 │  │
│  └────────┬──────────┘  └─────────┬─────────┘  └────────┬────────┘  │
│           │                       │                      │           │
│     ┌─────▼───────────────────────▼──────────────────────▼──────┐   │
│     │            window CustomEvent bus                          │   │
│     │  elevation:hover | map:reset | elevation:sectorClick       │   │
│     └─────────────────────────────────────────────────────────── ┘   │
└──────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  ADMIN UI (src/pages/admin.astro)                    │
│  Photo manifest: assign mileage → writes/reads photos.json via      │
│  local dev server only — not included in static build output         │
└──────────────────────────────────────────────────────────────────────┘
```

---

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `scripts/parse-gpx.js` | Parse GPX XML → route-data.json (coordinates, elevation, distance) | Nothing at runtime — build only |
| `scripts/resolve-annotations.js` | Resolve sector and restock-point config → annotations.json | Nothing at runtime — build only |
| `scripts/match-photos.js` | Read photos.json manifest → validate file paths, emit final photo data | Nothing at runtime — build only |
| `scripts/generate-thumbnails.js` | Sharp: resize originals to 400px WebP @ 80% quality → public/thumbs/ | Nothing at runtime — build only |
| `src/content.config.ts` | file() loaders: expose route-data, annotations, photos as typed collections | Astro build system |
| `index.astro` | Page shell: fetch collections, pass serialized props to each component island | RouteMap, ElevationProfile, PhotoGallery, header, CTA |
| `RouteMap.astro` | Leaflet map: render polyline, sector overlays, restock markers, photo cluster markers | Emits `map:reset`; listens for `elevation:hover`, `elevation:sectorClick` |
| `ElevationProfile.astro` | Chart.js line chart: elevation vs distance with sector shading bands | Emits `elevation:hover`, `elevation:sectorClick`; listens for `map:reset` |
| `PhotoGallery.astro` | PhotoSwipe lightbox: thumbnail grid, lightbox open/close | Listens for `map:photoClick` (optional deep link) |
| `admin.astro` | Dev-only photo manifest editor: list images, assign mileage, write photos.json | photos.json via fetch POST (dev server only) |

---

## Recommended Project Structure

```
hiawathasRevenge/
├── scripts/                     # Build pipeline (run before astro build)
│   ├── parse-gpx.js             # GPX → src/data/route-data.json
│   ├── resolve-annotations.js   # Config → src/data/annotations.json
│   ├── match-photos.js          # Manifest → src/data/photos.json (validated)
│   └── generate-thumbnails.js   # images/*.jpg → public/thumbs/*.webp
│
├── src/
│   ├── content.config.ts        # file() loaders for all JSON data collections
│   │
│   ├── data/                    # Generated JSON (build artifacts, gitignored or committed)
│   │   ├── route-data.json      # Coordinates, elevation, cumulative distance
│   │   ├── annotations.json     # Sectors, restock points
│   │   └── photos.json          # Photo manifest with mileage assignments
│   │
│   ├── pages/
│   │   ├── index.astro          # Main showcase page
│   │   └── admin.astro          # Photo manifest admin (dev only)
│   │
│   ├── components/
│   │   ├── RouteMap.astro       # Leaflet island
│   │   ├── ElevationProfile.astro  # Chart.js island
│   │   ├── PhotoGallery.astro   # PhotoSwipe island
│   │   └── DonateCallout.astro  # Static MBTN CTA block
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro     # HTML shell, meta, fonts, global CSS
│   │
│   └── styles/
│       └── global.css           # Tailwind base, Forest Service design tokens
│
├── public/
│   ├── thumbs/                  # Generated WebP thumbnails (build artifact)
│   └── images/                  # Originals (if served directly) or keep in root
│
├── images/                      # Source photos (not served directly)
│   ├── *.jpg                    # ~50 route photos
│   └── inspiration/             # Design reference images
│
├── Munising_Hiawatha_s_Revenge.gpx  # Source GPX
├── package.json                 # "prebuild": "node scripts/..." before "astro build"
└── astro.config.mjs
```

### Structure Rationale

- **`scripts/`** — All pipeline scripts live here rather than in `src/`. They are Node.js, not Astro, and run outside the Vite build graph. This keeps the Astro source clean.
- **`src/data/`** — Generated JSON files belong in `src/` so Astro's content collections can load them as typed data. They are build artifacts but small enough to commit (they change only when source data changes).
- **`public/thumbs/`** — Thumbnails go to `public/` because they are served verbatim with no further processing. Sharp outputs here directly.
- **`images/`** — Source photos stay at root level (not `public/`) to prevent accidental full-resolution serving. Only thumbnails reach the browser.
- **`src/pages/admin.astro`** — Admin UI is a real Astro page but dev-only. It uses `process.env.NODE_ENV` guard or a separate npm script to prevent inclusion in production builds.

---

## Architectural Patterns

### Pattern 1: Two-Phase Build Pipeline

**What:** All data derivation happens in Node.js scripts before `astro build`. Astro sees only pre-cooked JSON — it never touches GPX or Sharp at compile time. The `package.json` `"build"` script chains them: `"build": "node scripts/pipeline.js && astro build"`.

**When to use:** Always for this project. This pattern avoids import errors from libraries (gpxparser, sharp) that assume Node.js globals, keeps Astro's Vite sandbox clean, and makes the pipeline independently testable.

**Trade-offs:** One more step to remember. Mitigated by chaining in `package.json` so `npm run build` handles both.

**Example:**
```json
{
  "scripts": {
    "dev": "npm run pipeline && astro dev",
    "build": "npm run pipeline && astro build",
    "pipeline": "node scripts/parse-gpx.js && node scripts/resolve-annotations.js && node scripts/match-photos.js && node scripts/generate-thumbnails.js"
  }
}
```

### Pattern 2: CustomEvent Bus for Cross-Component Sync

**What:** Islands communicate via `window.dispatchEvent(new CustomEvent(...))` and `window.addEventListener(...)`. No shared state library. Each island emits semantically named events and subscribes to events from other islands.

**When to use:** When two Astro `.astro` components need bidirectional sync but are not parent/child. This is appropriate here because RouteMap and ElevationProfile are sibling islands — neither owns the other.

**Trade-offs:** No runtime framework overhead (contrast with Nano Stores which requires a dependency). Slightly harder to debug than a central store because events are fire-and-forget. Acceptable for 3–4 well-named events.

**Example:**
```javascript
// ElevationProfile.astro — emit on Chart.js mousemove
chart.options.onHover = (event, elements) => {
  if (elements.length) {
    const idx = elements[0].index;
    window.dispatchEvent(new CustomEvent('elevation:hover', {
      detail: { index: idx, latlng: routeData[idx] }
    }));
  }
};

// RouteMap.astro — receive and move bike marker
window.addEventListener('elevation:hover', (e) => {
  const { latlng } = e.detail;
  bikeMarker.setLatLng(latlng);
});
```

### Pattern 3: Two-Stage Asset Loading with IntersectionObserver

**What:** The map and chart containers render immediately as empty `<div>` placeholders. JavaScript for each island is deferred until the container enters the viewport using `IntersectionObserver`. A scroll-position fallback ensures initialization if the page loads already scrolled past the element (e.g., direct-link anchor navigation).

**When to use:** Always for Leaflet and Chart.js — both libraries are large. Leaflet initializing off-screen wastes tile fetches and layout calculations.

**Trade-offs:** Slightly more setup code. Browser support is universal (all modern browsers — no polyfill needed as of 2025).

**Example:**
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      initMap(); // import Leaflet and mount
      observer.disconnect();
    }
  });
}, { rootMargin: '200px' });

const el = document.getElementById('map-container');
observer.observe(el);

// Fallback: already in view on load
if (el.getBoundingClientRect().top < window.innerHeight) {
  initMap();
  observer.disconnect();
}
```

### Pattern 4: Content Collections as Typed Data Layer

**What:** Generated JSON files in `src/data/` are exposed through Astro's content collections using the `file()` loader and Zod schema validation. Pages fetch collections with `getCollection()` and pass typed data as serialized props to islands.

**When to use:** Always — this gives TypeScript types for free, validates data shape at build time, and prevents runtime surprises from malformed JSON.

**Trade-offs:** Requires defining schemas in `src/content.config.ts`. Worth it — catches bugs at build time rather than in the browser.

**Example:**
```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

const routeData = defineCollection({
  loader: file('src/data/route-data.json'),
  schema: z.object({
    coordinates: z.array(z.tuple([z.number(), z.number()])),
    elevations: z.array(z.number()),
    distances: z.array(z.number()),
  }),
});
```

---

## Data Flow

### Build-Time Pipeline

```
Munising_Hiawatha_s_Revenge.gpx
    │
    ▼ parse-gpx.js (gpxparser)
src/data/route-data.json
  { coordinates: [[lat,lng],...], elevations: [...], distances: [...] }
    │
    ├── ElevationProfile receives it as prop → Chart.js dataset
    └── RouteMap receives it as prop → Leaflet polyline + bike marker positions

images/*.jpg (50 photos)
    │
    ├── admin.astro (dev only) → photos.json (mileage assignments)
    │
    ▼ match-photos.js (validates paths)
src/data/photos.json
  [{ filename, mileage, caption? }]
    │
    ├── generate-thumbnails.js → public/thumbs/*.webp
    └── RouteMap receives it as prop → cluster markers at mileage coordinates
        PhotoGallery receives it as prop → thumbnail grid
```

### Runtime Event Flow

```
User hovers ElevationProfile chart
    │
    ▼ ElevationProfile emits: window CustomEvent 'elevation:hover' { index, latlng }
    │
    ▼ RouteMap listens: moves bike marker crosshair to latlng

User clicks sector band on ElevationProfile
    │
    ▼ ElevationProfile emits: window CustomEvent 'elevation:sectorClick' { sectorId }
    │
    ▼ RouteMap listens: flyTo() sector bounds, highlights polyline segment

User clicks map reset button
    │
    ▼ RouteMap emits: window CustomEvent 'map:reset'
    │
    ▼ ElevationProfile listens: clears active element, resets Chart.js hover state

User clicks photo cluster marker on RouteMap
    │
    ▼ RouteMap emits: window CustomEvent 'map:photoClick' { index }
    │
    ▼ PhotoGallery listens: opens PhotoSwipe at that index
```

### Key Data Flow Rules

1. **Data flows down at build time, events flow sideways at runtime.** Pages pass serialized JSON props down to islands. Islands communicate laterally via events — never by reading each other's DOM.
2. **Islands never share mutable state.** Each island owns its own internal state (chart instance, map instance). The event bus carries only lightweight payloads (index, latlng, sectorId).
3. **Admin UI is write-only to photos.json.** It modifies the source manifest file on disk during dev. The main showcase page treats photos.json as read-only.

---

## Scaling Considerations

This is a static showcase site — scaling is primarily about asset size and perceived performance, not server load.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single route (current) | One page, one set of data files. No routing needed. |
| Multiple routes | Add `src/pages/[route].astro` dynamic route; content collections per route; pipeline accepts route slug as param |
| 500+ photos | Pagination in PhotoGallery; virtual scroll or windowing for thumbnail grid |
| Tile performance | Preload above-the-fold tile region using Leaflet's `prefetchTiles()` or tile warming script |

### Performance Priorities

1. **First bottleneck: Leaflet + tile fetches.** Mitigated by IntersectionObserver lazy load — map tiles only requested when user scrolls to map.
2. **Second bottleneck: Full-size photo loads.** Mitigated by thumbnail-first pattern — originals only loaded in PhotoSwipe lightbox on click.
3. **Third bottleneck: Chart.js bundle.** Mitigated by dynamic import inside IntersectionObserver callback — Chart.js not parsed until visible.

---

## Anti-Patterns

### Anti-Pattern 1: Parsing GPX Inside Astro Components

**What people do:** Import gpxparser in an Astro component frontmatter and parse the GPX file at build time.

**Why it's wrong:** gpxparser uses DOM APIs (DOMParser) that behave inconsistently in Astro's SSR/prerender environment. Sharp also has native bindings that don't survive Vite's module transform. Both cause cryptic build errors.

**Do this instead:** Run all data transformation in plain Node.js scripts via the `package.json` `prebuild` step. Astro only ever sees clean JSON.

### Anti-Pattern 2: Initializing Leaflet on Page Load

**What people do:** Initialize Leaflet in a `<script>` tag at the bottom of the page, or in an `astro:page-load` listener.

**Why it's wrong:** Leaflet triggers tile fetches and layout calculations immediately. On a long-scroll page, the map may be well below the fold — all those tile requests waste bandwidth and delay above-the-fold content.

**Do this instead:** Wrap Leaflet initialization in IntersectionObserver. Use `rootMargin: '200px'` so the map loads just before the user reaches it.

### Anti-Pattern 3: Passing Large Arrays as Inline Props

**What people do:** Serialize all 5000+ route coordinate pairs as a JSON blob in an Astro `define:vars` script block.

**Why it's wrong:** This inflates initial HTML size. The coordinate array for 100 miles of GPX data can be 300–500KB uncompressed when inlined.

**Do this instead:** Write route-data.json to `public/data/` and fetch it at runtime via `fetch('/data/route-data.json')` inside the island's initialization. The JSON will be compressed by the server and cached by the browser. Only metadata (bounding box, distance, elevation range) needs to be inline.

### Anti-Pattern 4: Syncing Map and Chart via Shared DOM State

**What people do:** Use `data-*` attributes on a shared container to pass hover index between map and chart, polling with `MutationObserver`.

**Why it's wrong:** Brittle, creates implicit coupling between components. MutationObserver on data attributes is harder to debug and slower than custom events.

**Do this instead:** Use CustomEvent on `window`. Events are semantically clear, decoupled, and natively supported.

### Anti-Pattern 5: Serving Original Photos

**What people do:** Point `<img>` src at full-resolution originals in the images directory, relying on the browser to display them at thumbnail size.

**Why it's wrong:** The source photos are 1536×2048 JPEGs (1.5–3MB each). Sending 50 of these to load a gallery grid would be 75–150MB — unusable on mobile.

**Do this instead:** Use the Sharp pipeline to generate 400px WebP thumbnails at 80% quality in `public/thumbs/`. Originals are only loaded in the PhotoSwipe lightbox when the user explicitly opens a photo.

---

## Build Order Implications

The dependency graph determines phase order for the roadmap:

```
1. Build pipeline (scripts/)
   └── parse-gpx.js        → must exist before RouteMap or ElevationProfile can receive data
   └── generate-thumbnails  → must exist before PhotoGallery can show images
   └── match-photos.js      → depends on photos.json from admin UI

2. Admin UI (photos.json authoring)
   └── needed before photo markers can appear on map
   └── needed before PhotoGallery has correct mileage data
   └── CAN be built after map/elevation if photo pins are deferred

3. RouteMap (Leaflet)
   └── depends on route-data.json (from parse-gpx)
   └── depends on annotations.json (sectors, restock points)
   └── photo markers depend on photos.json (can be added later)

4. ElevationProfile (Chart.js)
   └── depends on route-data.json
   └── sector shading depends on annotations.json
   └── no photo dependency

5. PhotoGallery (PhotoSwipe)
   └── depends on photos.json
   └── depends on WebP thumbnails existing in public/thumbs/

6. Cross-component sync (CustomEvent bus)
   └── depends on both RouteMap AND ElevationProfile existing

7. Visual theme (Tailwind / Forest Service design)
   └── no hard dependencies — can be applied at any phase
   └── design tokens should be established early to avoid rework
```

**Recommended build order for phases:**

1. Build pipeline + basic Astro shell + route map (polyline only)
2. Elevation profile + map-elevation sync
3. Sector overlays + restock point markers (annotations)
4. Admin UI + photo matching pipeline + thumbnail generation
5. Photo markers on map + PhotoGallery
6. Visual theme, typography, responsive polish

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenStreetMap / Carto tiles | Leaflet TileLayer with public tile URL | No API key needed. Choose a tile style that fits forest/park aesthetic (Stamen Terrain, Carto Voyager, or OpenTopoMap) |
| MBTN donate link | Static `<a>` to mbtn.org | No integration needed — just a link |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Build scripts ↔ Astro | JSON files written to src/data/ | Scripts run before Astro; Astro never imports scripts directly |
| Astro page ↔ islands | Serialized JSON props via Astro `define:vars` or `JSON.stringify` | Keep inline props small; large data via fetch |
| RouteMap ↔ ElevationProfile | window CustomEvents | Never access each other's DOM or variables directly |
| RouteMap ↔ PhotoGallery | window CustomEvent `map:photoClick` | Optional enhancement — PhotoGallery works standalone |
| Admin UI ↔ photos.json | Dev server file write (fetch POST or CLI script) | Admin UI is dev-only; not included in production Astro build |

---

## Sources

- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/) — HIGH confidence (official docs)
- [Astro Content Collections — file() loader](https://docs.astro.build/en/guides/content-collections/) — HIGH confidence (official docs)
- [Astro Integration API Hooks](https://docs.astro.build/en/reference/integrations-reference/) — HIGH confidence (official docs)
- [Leaflet Official Documentation](https://leafletjs.com/reference.html) — HIGH confidence (official docs)
- [Leaflet Lazy Loading Pattern](https://advancedweb.hu/how-to-lazy-load-and-initialize-elements-using-an-intersection-observer/) — MEDIUM confidence (verified against IntersectionObserver spec)
- [Chart.js Programmatic Events](https://www.chartjs.org/docs/latest/samples/advanced/programmatic-events.html) — HIGH confidence (official docs)
- [Sharp GitHub — WebP thumbnail generation](https://github.com/lovell/sharp) — HIGH confidence (official repo)
- [IntersectionObserver scrollMargin](https://frontendmasters.com/blog/simplify-lazy-loading-with-intersection-observers-scrollmargin/) — MEDIUM confidence (verified against MDN)
- mkUltraGravel reference implementation — HIGH confidence (direct reference; project is a fork of this architecture)

---
*Architecture research for: Hiawatha's Revenge cycling route showcase*
*Researched: 2026-03-30*
