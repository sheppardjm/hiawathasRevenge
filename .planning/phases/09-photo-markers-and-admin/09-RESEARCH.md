# Phase 9: Photo Markers and Admin - Research

**Researched:** 2026-03-31
**Domain:** leaflet.markercluster (Leaflet plugin), Astro dev-only endpoint, PhotoSwipe programmatic open
**Confidence:** MEDIUM (markercluster ESM import has a known workaround with confirmed pattern; admin endpoint pattern verified from official Astro docs + PR)

## Summary

Phase 9 has two independent workstreams: (1) a dev-only admin UI (`admin.astro`) that lets the developer assign mileage to each photo and writes `photos-manifest.json`, and (2) photo cluster markers on the Leaflet map that open the PhotoSwipe lightbox when clicked.

The admin page uses Astro's hybrid static + dev-only endpoint pattern. Since Astro 5 merged `output: hybrid` into `output: static` (PR #11824), a static site can have individual routes with `export const prerender = false` that work in dev server without an adapter. The endpoint file writes `photos-manifest.json` using Node.js `fs.writeFileSync`. The `.astro` admin page redirects to `/` in production to prevent build artifacts.

The photo cluster markers use `leaflet.markercluster` — the official Leaflet plugin (npm: `leaflet.markercluster` v1.4.1). The ESM/Vite integration has a known complication: the plugin assumes a global `L` object. The confirmed working pattern inside an async dynamic import context is to assign `window.L = L` before dynamically importing the plugin. CSS must be imported separately via static import in the `<script>` block.

Opening PhotoSwipe from a map marker click uses `lightbox.loadAndOpen(index, { gallery: galleryEl })`. The `lightbox` instance created in `PhotoGallery.astro` must be made accessible to `RouteMap.astro`. The correct bridge is a `CustomEvent` dispatched from RouteMap carrying the photo index, caught by PhotoGallery which calls `lightbox.loadAndOpen()`.

**Primary recommendation:** Use `leaflet.markercluster` v1.4.1 with `window.L = L` assignment before dynamic import; bridge lightbox via `map:photoClick` CustomEvent carrying `photoIndex`; admin page uses `prerender = false` POST endpoint writing `photos-manifest.json` to `public/data/`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `leaflet.markercluster` | 1.4.1 | Cluster photo markers on Leaflet map | Official Leaflet plugin; only mature marker clustering library for Leaflet; no alternatives |
| `@types/leaflet.markercluster` | latest | TypeScript types for the plugin | Separate DefinitelyTyped package required (plugin ships no types) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `photoswipe` | 5.4.4 (already installed) | Lightbox opened from marker click | Already in project; Phase 8 installed it |
| `leaflet` | 1.9.4 (already installed) | Map engine | Already in project; no change needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `leaflet.markercluster` | `supercluster` + custom rendering | supercluster is faster for large datasets but has no Leaflet integration out of the box; 54 photos is tiny — no performance case for custom solution |
| Astro POST endpoint | Node.js CLI script (`node scripts/save-manifest.js`) | CLI script is simpler (no endpoint plumbing) but doesn't satisfy "browser-based" PHOTO-05 requirement |

**Installation:**
```bash
PATH="/usr/local/opt/node/bin:$PATH" npm install leaflet.markercluster @types/leaflet.markercluster
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── RouteMap.astro          # Add: cluster layer + dispatch map:photoClick
│   └── PhotoGallery.astro      # Add: expose lightbox + listen for map:photoClick
└── pages/
    ├── index.astro              # No change
    └── admin.astro              # New: dev-only manifest editor
        └── api/
            └── save-manifest.ts # New: POST endpoint writes photos-manifest.json

public/
└── data/
    ├── photos.json              # Written by match-photos.js (pipeline)
    └── photos-manifest.json     # Written by admin save endpoint
```

### Pattern 1: leaflet.markercluster with Vite/ESM Dynamic Import
**What:** The plugin assumes global `L`. In an async dynamic import context, assign `window.L = L` immediately after importing Leaflet, before importing the plugin. Then destructure `MarkerClusterGroup` from the dist file directly.
**When to use:** Always — the plugin uses UMD globals. This is the confirmed workaround.
**Example:**
```javascript
// Inside async initMap() — Source: VitePress/leaflet.markercluster community pattern
const L = (await import('leaflet')).default;
window.L = L;  // REQUIRED: plugin reads this global

// CSS must be imported at top of <script> block (static import, not dynamic)
// These are imported at script top level, not inside async function

await import('leaflet.markercluster/dist/leaflet.markercluster-src.js');
// Now L.markerClusterGroup is available on the L object

const clusterGroup = L.markerClusterGroup({
  maxClusterRadius: 50,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true
});
```

CSS imports at top of `<script>` block (static, not dynamic):
```javascript
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
```

### Pattern 2: Building Photo Marker Cluster Layer
**What:** For each photo entry in `photos.json`, create an `L.marker` at `[photo.lat, photo.lon]` with the photo's index stored as custom data, add all markers to a `L.markerClusterGroup`, add the cluster group to the map.
**When to use:** During `initMap()`, after route data is loaded.
**Example:**
```javascript
const photosData = await fetch('/data/photos.json').then(r => r.json());

const clusterGroup = L.markerClusterGroup({ showCoverageOnHover: false });

photosData.forEach((photo, index) => {
  const marker = L.marker([photo.lat, photo.lon], {
    zIndexOffset: 750  // between restock (500) and bike crosshair (1000)
  });
  marker.on('click', () => {
    window.dispatchEvent(new CustomEvent('map:photoClick', {
      detail: { photoIndex: index }
    }));
  });
  clusterGroup.addLayer(marker);
});

// cluster click — zoom into cluster (default behavior via zoomToBoundsOnClick)
clusterGroup.on('clusterclick', (e) => {
  e.layer.zoomToBounds({ padding: [20, 20] });
});

clusterGroup.addTo(map);
```

### Pattern 3: Cross-Component Event Bridge (RouteMap → PhotoGallery)
**What:** RouteMap dispatches a `CustomEvent` on `window` when a photo marker is clicked. PhotoGallery listens for it and calls `lightbox.loadAndOpen()`.
**When to use:** The two components are siblings (both used in index.astro), not parent/child. Window events are the correct pattern in this project — matches existing `elevation:hover` / `elevation:leave` pattern.
**Example in RouteMap.astro:**
```javascript
window.dispatchEvent(new CustomEvent('map:photoClick', {
  detail: { photoIndex: index }
}));
```
**Example in PhotoGallery.astro `<script>` block:**
```javascript
// Module-scope — lightbox must be accessible here
let lightbox = null;
const gallery = document.getElementById('photo-gallery');
if (gallery) {
  lightbox = new PhotoSwipeLightbox({
    gallery: '#photo-gallery',
    children: 'a',
    pswpModule: () => import('photoswipe')
  });
  lightbox.init();
}

window.addEventListener('map:photoClick', (e) => {
  if (!lightbox) return;
  lightbox.loadAndOpen(e.detail.photoIndex, {
    gallery: document.getElementById('photo-gallery')
  });
});
```

### Pattern 4: Dev-Only Admin Page (Astro Static + prerender=false)
**What:** Since Astro 5 merged hybrid into static (PR #11824), a `src/pages/admin.astro` can use `export const prerender = false` and redirect to `/` when `import.meta.env.PROD` is true. In dev, it renders a form UI. This works in `astro dev` without an adapter.
**When to use:** Always for this admin page.
**Example (`src/pages/admin.astro`):**
```astro
---
export const prerender = false;

if (import.meta.env.PROD) {
  return Astro.redirect('/');
}

// Load current manifest for pre-populating form
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const manifestPath = resolve(process.cwd(), 'public/data/photos-manifest.json');
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : [];

// Load photos list from public/images/ directory
import { readdirSync } from 'fs';
const imagesDir = resolve(process.cwd(), 'public/images');
const photoFiles = readdirSync(imagesDir).filter(f => f.endsWith('.jpg'));
---

<html>
  <body>
    <form id="manifest-form">
      <!-- render photo list with mileage inputs -->
    </form>
  </body>
</html>
```

### Pattern 5: Save Endpoint (POST, writes photos-manifest.json)
**What:** An API endpoint at `src/pages/api/save-manifest.ts` accepts a POST with JSON body, writes `public/data/photos-manifest.json`. Responds `{ ok: true }` on success.
**When to use:** Called from the admin form's save button via `fetch('/api/save-manifest', { method: 'POST', body: JSON.stringify(manifest) })`.
**Example (`src/pages/api/save-manifest.ts`):**
```typescript
import type { APIRoute } from 'astro';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: 'Not available in production' }), { status: 403 });
  }

  const manifest = await request.json();
  const outputPath = resolve(process.cwd(), 'public/data/photos-manifest.json');
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf8');

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

### Pattern 6: Admin UI Save Flow
**What:** After saving, the admin page must trigger the pipeline to regenerate `photos.json` from the updated manifest. Two options: (a) notify the user to re-run `npm run pipeline`, or (b) spawn a child process from the endpoint. Option (a) is simpler and less risky.
**When to use:** Option (a) — show a message "Manifest saved. Re-run `npm run pipeline` then reload."
**Note:** The pipeline runs on `predev` so re-running `npm run dev` also regenerates. An in-browser pipeline trigger is out of scope for Phase 9.

### Anti-Patterns to Avoid
- **Importing `leaflet.markercluster` at static import top level**: The plugin errors because `L` is not defined when the module is parsed. Use dynamic import after setting `window.L = L`.
- **Using `leaflet.markercluster.esm` package**: The `iohansson/l.markercluster` ESM fork is experimental/unmaintained. Use the official `leaflet.markercluster` package with the `window.L` workaround instead.
- **Calling `lightbox.loadAndOpen()` without the gallery argument**: With a DOM-connected gallery, the gallery element must be passed explicitly when calling `loadAndOpen()` from outside the gallery — the lightbox doesn't know which gallery to use without it.
- **Building the admin page with SSR adapter**: This project is static. The `prerender = false` pattern works in dev without an adapter. Do NOT add an adapter.
- **Storing lightbox in a DOM attribute or closure inaccessible to the event listener**: The `lightbox` variable must be in module scope of the `<script>` block (not inside an `if` block) to be reachable from the `map:photoClick` listener.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Marker clustering | Custom cluster algorithm | `leaflet.markercluster` | Handles overlap detection, zoom levels, cluster counts, spiderfy — all complex |
| Admin file persistence | SQLite, local storage | Direct `fs.writeFileSync` | This is dev-only; simplest option that meets the requirement |
| Photo index lookup by marker | Map object with marker refs | Store index directly on marker via closure | Closures are reliable; no mutable state to sync |

**Key insight:** For 54 photos, `leaflet.markercluster`'s default settings work without tuning. The complexity of this phase is the ESM import workaround and the cross-component event bridge, not the business logic.

## Common Pitfalls

### Pitfall 1: "L.markerClusterGroup is not a function"
**What goes wrong:** `L.markerClusterGroup` is undefined after dynamic import of the plugin.
**Why it happens:** The plugin's UMD module attaches itself to the global `L` object when loaded. If `window.L` is not set before the plugin module is evaluated, the attachment fails silently.
**How to avoid:** Always set `window.L = L` immediately after `const L = (await import('leaflet')).default;`, before any `await import('leaflet.markercluster/...')`.
**Warning signs:** `TypeError: L.markerClusterGroup is not a function` in console.

### Pitfall 2: Missing CSS imports for cluster markers
**What goes wrong:** Cluster markers appear without the cluster count badge styling or with broken visuals.
**Why it happens:** `leaflet.markercluster` requires two CSS files that are not included in Leaflet's existing CSS.
**How to avoid:** Add static imports at the top of the `<script>` block (or in `global.css`):
```javascript
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
```
**Warning signs:** Cluster markers show as plain markers without count badges, or count badges are black squares.

### Pitfall 3: :global() required for cluster marker styles in Astro
**What goes wrong:** Leaflet cluster CSS classes (`.leaflet-cluster-anim`, `.marker-cluster`, etc.) are not applied because Astro's scoped styles don't match runtime-injected DOM elements.
**Why it happens:** The same reason `:global(.restock-marker)` is needed in RouteMap.astro — Leaflet creates DOM elements dynamically, outside Astro's component scope.
**How to avoid:** Use `:global(.marker-cluster)` in the `<style>` block if any custom cluster styles are needed. The CSS files imported in `<script>` are global by default so this only matters for custom overrides.

### Pitfall 4: lightbox variable not in module scope
**What goes wrong:** `map:photoClick` handler gets `lightbox = null` even after initialization.
**Why it happens:** `lightbox` was declared inside an `if (gallery)` block, not at module scope.
**How to avoid:** Declare `let lightbox = null;` at module scope, assign inside the `if (gallery)` block.

### Pitfall 5: photoIndex mismatch when photos.json is empty
**What goes wrong:** Cluster layer is added but no markers appear; or worse, marker click opens wrong photo.
**Why it happens:** `photos.json` is empty (`[]`) until the manifest is saved and pipeline runs. Photo index must map to the same position in the `<a>` elements rendered by PhotoGallery.
**How to avoid:** The index used in `clusterGroup` marker click MUST be the same as the DOM order of `<a>` elements in `#photo-gallery`. Both read from `photos.json` — same array, same order. Verify no sorting or filtering changes between the JSON array and the rendered anchors.

### Pitfall 6: Admin page included in production static build
**What goes wrong:** An `/admin` page is shipped in the production build, accessible by visitors.
**Why it happens:** Astro builds all pages in `src/pages/` unless they redirect or return 404.
**How to avoid:** Use `if (import.meta.env.PROD) { return Astro.redirect('/'); }` in the admin page frontmatter. The production build will include a redirect page but no admin content.

### Pitfall 7: `process.cwd()` in admin endpoint
**What goes wrong:** File written to wrong path if `process.cwd()` is not the project root.
**Why it happens:** `process.cwd()` depends on where `astro dev` is launched from.
**How to avoid:** Use `import.meta.url` with `fileURLToPath` to derive paths relative to the endpoint file, then navigate to project root — same pattern as existing `scripts/*.js` files. Or use `process.cwd()` but document that `npm run dev` must be run from project root (which it always is).

## Code Examples

Verified patterns from official/authoritative sources:

### leaflet.markercluster dynamic import with window.L fix
```javascript
// Source: VitePress + leaflet.markercluster community pattern (verified multiple sources)
// Must be inside async function (initMap)
const L = (await import('leaflet')).default;
window.L = L;  // Critical: plugin reads this global at module evaluation time
await import('leaflet.markercluster/dist/leaflet.markercluster-src.js');
const clusterGroup = L.markerClusterGroup({ showCoverageOnHover: false });
```

### MarkerClusterGroup click event (individual marker vs cluster)
```javascript
// Source: https://github.com/Leaflet/Leaflet.markercluster README
clusterGroup.on('click', (e) => {
  // e.layer is the clicked marker
  const index = e.layer.options._photoIndex;
  window.dispatchEvent(new CustomEvent('map:photoClick', { detail: { photoIndex: index } }));
});

clusterGroup.on('clusterclick', (e) => {
  // zoom to cluster bounds on click (or spiderfy at max zoom — default behavior)
  // Can intercept here if needed
});
```

Alternative: attach click handler per-marker (cleaner for index binding):
```javascript
const marker = L.marker([lat, lon]);
marker.on('click', () => {
  window.dispatchEvent(new CustomEvent('map:photoClick', { detail: { photoIndex: i } }));
});
```

### PhotoSwipe loadAndOpen from external trigger
```javascript
// Source: https://photoswipe.com/methods/ + github.com/dimsemenov/PhotoSwipe/issues/1848
lightbox.loadAndOpen(photoIndex, {
  gallery: document.getElementById('photo-gallery')
});
```

### Astro dev-only page with prerender=false
```astro
---
// Source: https://github.com/Thinkmill/keystatic/discussions/486 + Astro docs
export const prerender = false;

if (import.meta.env.PROD) {
  return Astro.redirect('/');
}
---
```

### Astro POST endpoint writing a file
```typescript
// Source: https://docs.astro.build/en/guides/endpoints/ + Astro PR #11824
import type { APIRoute } from 'astro';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (import.meta.env.PROD) {
    return new Response(null, { status: 403 });
  }
  const data = await request.json();
  writeFileSync(resolve(process.cwd(), 'public/data/photos-manifest.json'),
    JSON.stringify(data, null, 2), 'utf8');
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `output: 'hybrid'` for mixed static+SSR | `output: 'static'` with per-route `prerender = false` | Astro 5 (PR #11824) | No need for `output: 'hybrid'`; static sites get hybrid behavior by default |
| `globalThis.L = L` before import | `window.L = L` before import | Always needed for UMD plugins | Functionally equivalent; `window.L` is conventional for browser-only code |
| leaflet.markercluster v1.5.x (never released) | leaflet.markercluster v1.4.1 (latest stable) | Stuck at 1.4.1 since 2019 | Plugin is stable but unmaintained; no ESM rewrite planned |

**Deprecated/outdated:**
- `leaflet.markercluster.esm` (iohansson fork): Not widely maintained; official package with workaround is preferred.
- `output: 'hybrid'` in Astro config: Removed in Astro 5; use `output: 'static'` with per-route `prerender = false`.

## Open Questions

1. **Does `window.L = L` actually work when the plugin is dynamically imported (not static import)?**
   - What we know: VitePress + async dynamic import community pattern uses this exact approach and reports it works. Multiple sources confirm it for Vue/Vite contexts.
   - What's unclear: Whether Astro's Vite bundling handles the dynamic `import()` of the plugin dist file differently.
   - Recommendation: Implement as described. If it fails, fallback is importing from the compiled dist: `'leaflet.markercluster/dist/leaflet.markercluster.js'` (UMD, requires `window.L`). The core issue is the same either way.

2. **Does the Astro dev server execute `prerender = false` endpoints without an adapter?**
   - What we know: Astro PR #11824 confirmed static sites work with `prerender = false` routes. Dev server has its own built-in Vite server that handles SSR. Multiple community sources confirm POST endpoints work in dev without an adapter.
   - What's unclear: Whether `fs.writeFileSync` specifically is allowed inside an Astro endpoint (no explicit docs statement found).
   - Recommendation: Implement it. Node.js built-in modules like `fs` are available in Astro's dev server Node.js runtime. If the endpoint approach fails, fallback is: save to `localStorage` in the browser and have a separate "Export" button that downloads `photos-manifest.json`.

3. **Admin UI: does restarting the dev server re-run the pipeline automatically?**
   - What we know: `package.json` has `"predev": "node scripts/pipeline.js"` — the pipeline runs before every `astro dev` invocation.
   - What's unclear: Whether saving the manifest and having the user restart dev is an acceptable UX for Phase 9.
   - Recommendation: Accept this limitation. Success criteria say "writes an updated photos-manifest.json that the pipeline can consume" — not that it auto-runs the pipeline. Show a message after save: "Manifest saved. Restart `npm run dev` to regenerate photos.json."

## Sources

### Primary (HIGH confidence)
- https://docs.astro.build/en/guides/endpoints/ — POST endpoint pattern, `prerender = false`
- https://github.com/withastro/astro/pull/11824 — Confirms `output: 'static'` + `prerender = false` works like hybrid
- https://github.com/Leaflet/Leaflet.markercluster — Official README: `L.markerClusterGroup()` API, CSS files, event names
- https://photoswipe.com/methods/ — `lightbox.loadAndOpen(index, dataSource)` signature

### Secondary (MEDIUM confidence)
- https://github.com/Thinkmill/keystatic/discussions/486 — Dev-only page with `prerender = false` + MODE check pattern
- https://dev.to/trincadev/vitepress-and-leafletmarkercluster-ce9 — Dynamic import + `window.L` pattern for Vite; verified working
- https://github.com/dimsemenov/PhotoSwipe/issues/1848 — `loadAndOpen()` with gallery reference for external triggers
- https://github.com/Leaflet/Leaflet.markercluster/issues/874 — ESM import issue; `window.L` / `import 'leaflet'; const L = window.L` workaround documented

### Tertiary (LOW confidence)
- WebSearch: Multiple sources confirming Astro dev server handles `prerender = false` routes without adapter — not found in official docs but consistent across community sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `leaflet.markercluster` is the only Leaflet clustering plugin; confirmed current version 1.4.1
- Architecture (cluster markers): MEDIUM — `window.L` workaround is community-confirmed but not officially documented by Leaflet
- Architecture (admin endpoint): MEDIUM — `prerender = false` in static site dev server confirmed via Astro PR; `fs.writeFileSync` in endpoint inferred from Node.js runtime availability
- Architecture (PhotoSwipe bridge): HIGH — `loadAndOpen()` is official API; window event bridge matches existing project pattern
- Pitfalls: HIGH — All pitfalls derived from official sources or verified working code in the codebase

**Research date:** 2026-03-31
**Valid until:** 2026-05-01 (leaflet.markercluster is stable/unmaintained — no breaking changes expected; Astro 6 APIs stable)
