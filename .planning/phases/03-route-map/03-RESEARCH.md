# Phase 3: Route Map - Research

**Researched:** 2026-03-30
**Domain:** Leaflet 1.9.4, leaflet-gesture-handling, CyclOSM tiles, Astro dynamic import pattern, IntersectionObserver lazy-init
**Confidence:** HIGH (core stack verified against mkUltra reference implementation and official sources), MEDIUM (tile provider long-term reliability), LOW (global.css layer order correction impact)

## Summary

Phase 3 embeds an interactive Leaflet 1.9.4 map into the Astro static site, displaying the 456-point GPX route polyline from `public/data/route-data.json` on themed CyclOSM tiles. The mkUltra reference repo (`/Users/Sheppardjm/Repos/mkUltraGravel`) is the definitive implementation reference — the complete `RouteMap.astro` is available at `src/components/RouteMap.astro` and is 387 lines. This phase implements a scoped subset: the polyline, tile layer, gesture handling, lazy-init, and reset control (no photo markers, no elevation crosshair, no sector overlays — those are later phases).

The standard approach follows the mkUltra pattern exactly: Leaflet CSS imported via `global.css` into a `@layer leaflet` cascade layer, Leaflet JS loaded via dynamic import inside `<script>` (prevents SSR `window is undefined`), IntersectionObserver triggers lazy-init when map approaches viewport, and `leaflet-gesture-handling` wired via `L.Map.addInitHook` before `L.map()`. The tile provider decision is **CyclOSM** — it's bicycle-focused, free with no API key or domain registration, renders up to zoom 20, and has an outdoor/trail aesthetic fitting the Hiawatha National Forest setting. Stadia Terrain was evaluated but requires domain registration for production.

A critical pre-task exists: the current `global.css` uses `@layer leaflet {}` as a placeholder block AFTER `@import "tailwindcss"`. The mkUltra pattern requires `@layer leaflet, base, components, utilities` declared FIRST (before all imports) as a cascade layer ordering declaration, then the Leaflet CSS imported as `@import "leaflet/dist/leaflet.css" layer(leaflet)`. This order change must happen in 03-01 before Leaflet is installed.

**Primary recommendation:** Clone the mkUltra `RouteMap.astro` structure exactly, stripping features deferred to later phases. Fix `global.css` layer order as the first sub-task. Use CyclOSM tiles. IntersectionObserver approach: scroll event as primary trigger + IntersectionObserver as fallback (identical to mkUltra, not `rootMargin: '200px'` mentioned in roadmap — the mkUltra pattern is scroll-first).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `leaflet` | 1.9.4 | Interactive map engine | Current stable; confirmed in mkUltra reference; 1.x API is stable |
| `leaflet-gesture-handling` | 1.2.2 | Prevents mobile scroll trap on map | Exact library used in mkUltra; purpose-built for this problem; no API key |

### Tile Provider
| Provider | URL Pattern | API Key | Max Zoom | Aesthetic |
|----------|------------|---------|----------|-----------|
| CyclOSM | `https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png` | None | 20 | Bicycle/outdoor/terrain — greens and earthy tones |
| OpenTopoMap | `https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png` | None | 17 | Topographic contour lines — very detailed |
| Stadia Terrain (Stamen) | `https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png` | Domain registration required | 18 | Terrain with land cover — excellent aesthetic |
| CARTO Dark Matter | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` | None | 20 | Dark theme — explicitly not this project's aesthetic |

**Decision: Use CyclOSM.** Stadia has the best terrain aesthetic but requires domain registration even for the free tier — violates the no-API-key constraint unless domain auth is set up. CyclOSM is bicycle-specific, no registration, active maintenance by OSM-FR, and the green/terrain look fits the Forest Service aesthetic better than generic OSM standard tiles.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CyclOSM | Stadia Stamen Terrain | Better terrain look but needs domain auth config for production |
| CyclOSM | OpenTopoMap | Contour lines are great but max zoom 17 (may feel pixelated when zoomed) |
| `leaflet-gesture-handling` | Custom touch handler | Hand-rolling gesture handling has many edge cases across iOS/Android — don't do it |

**Installation:**
```bash
PATH="/usr/local/opt/node/bin:$PATH" npm install leaflet@1.9.4 leaflet-gesture-handling
```

Note: No `@types/leaflet` needed — the `leaflet` package includes TypeScript types in 1.9.4. The `.astro` `<script>` block runs in browser context; TypeScript types apply there.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── RouteMap.astro       # Map island: div + <script> with dynamic import + IntersectionObserver
├── styles/
│   └── global.css           # Leaflet CSS imported layer(leaflet); layer order MUST be fixed first
└── pages/
    └── index.astro           # Uses <RouteMap /> (plain import, no client: directive needed)

public/
└── data/
    ├── route-data.json       # Source of truth: 456 points {lat, lon, ele, miles}
    └── annotations.json      # Not consumed by Phase 3 (deferred to later phases)
```

### Pattern 1: global.css Cascade Layer Order for Tailwind v4 + Leaflet

**What:** Tailwind v4 uses CSS cascade layers. Leaflet CSS must be put into a named layer at LOWER priority than Tailwind utilities. The layer order declaration must come FIRST in the CSS file.

**Critical:** The current `global.css` has `@layer leaflet {}` as an empty block AFTER `@import "tailwindcss"`. This must be replaced with the correct pattern.

**The correct pattern (from mkUltra):**
```css
/* global.css — layer order declaration FIRST, before ALL imports */
@layer leaflet, base, components, utilities;

/* Tailwind v4 */
@import "tailwindcss";

/* Leaflet CSS goes into the leaflet layer — lowest priority, Tailwind always wins */
@import "leaflet/dist/leaflet.css" layer(leaflet);
@import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css" layer(leaflet);

/* Keep existing @theme block and @layer base block below */
```

**Why this matters:** Without the layer order declaration, `@layer leaflet` has undefined priority relative to Tailwind's layers. Leaflet's `.leaflet-container` rules (z-index, cursor) may not render correctly, and Tailwind utilities may be overridden by Leaflet styles.

### Pattern 2: Leaflet Dynamic Import in Astro `<script>` Block

**What:** Leaflet requires browser globals (`window`, `document`). In Astro's static build, `<script>` tags are bundled by Vite but run in the browser. The import must be dynamic (`await import(...)`) NOT a static top-level import. Static `import L from 'leaflet'` at the top of a `<script>` block will fail during Astro's SSR pass if any component runs server-side.

**The correct pattern (verified in mkUltra):**
```javascript
// Inside <script> in RouteMap.astro
async function initMap() {
  // Dynamic imports — deferred to browser runtime, never runs during SSR
  const L = (await import('leaflet')).default;

  // Wire GestureHandling BEFORE L.map() — addInitHook must precede map creation
  const { GestureHandling } = await import('leaflet-gesture-handling');
  L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling);

  // Initialize map with gestureHandling: true
  const map = L.map('map', { gestureHandling: true });

  // ... rest of init
}
```

**Note on Astro `client:` directives:** `RouteMap.astro` is a plain `.astro` component (not a React/Vue/Svelte component). It does NOT use `client:visible` or `client:only`. The lazy-init is handled manually via IntersectionObserver inside the `<script>` block — this gives full control and matches the mkUltra pattern.

### Pattern 3: Lazy-Init with Scroll + IntersectionObserver (mkUltra pattern)

**What:** Two-stage lazy initialization. Scroll event fires as soon as the user scrolls (before map is visible) — this is the primary trigger. IntersectionObserver handles direct-anchor navigation (`#route`) where scroll may not fire.

**Important difference from roadmap:** The roadmap mentions `rootMargin: '200px'`. The mkUltra implementation uses `rootMargin: '0px'` for the IntersectionObserver (only as fallback) with scroll as the primary trigger. This is more conservative and tested in production — use the mkUltra pattern.

```javascript
// Source: mkUltra RouteMap.astro, lines 360-386
let mapInitialized = false;
const mapEl = document.getElementById('map');

function tryInitMap() {
  if (!mapInitialized) {
    mapInitialized = true;
    initMap();
  }
}

if (mapEl) {
  // Primary trigger: fires on first scroll (even before map is visible)
  window.addEventListener('scroll', tryInitMap, { once: true, passive: true });

  // Fallback: IntersectionObserver for direct anchor navigation
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        tryInitMap();
      }
    },
    { rootMargin: '0px' }
  );
  observer.observe(mapEl);
}
```

### Pattern 4: CyclOSM Tile Layer Configuration

```javascript
// Source: CyclOSM wiki + OSM raster tile providers docs
L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
  attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  subdomains: 'abc',
  maxZoom: 20
}).addTo(map);
```

### Pattern 5: Route Polyline from route-data.json

**The data structure is confirmed:** `public/data/route-data.json` contains `{ points: [{lat, lon, ele, miles}], meta: {...} }` with 456 points covering 101.98 miles.

```javascript
// Fetch from public directory (not content collections — this is client-side browser fetch)
const routeData = await fetch('/data/route-data.json').then(r => r.json());
const latlngs = routeData.points.map(pt => [pt.lat, pt.lon]);

const routeLine = L.polyline(latlngs, {
  color: '#4a8a4a',  // forest-600 green — fits the National Park aesthetic
  weight: 3,
  opacity: 0.85,
  smoothFactor: 1
}).addTo(map);

// Fit map to route bounds on init
map.fitBounds(routeLine.getBounds(), { padding: [20, 20] });

// Store initial bounds for reset
const initialBounds = routeLine.getBounds();
```

**Note on color:** mkUltra uses `#d4d4d4` (gray) on dark tiles. CyclOSM tiles are light/terrain-colored. Use a color that contrasts on light tile backgrounds. The forest-600 green (`#4a8a4a`) or amber-500 (`#c8973e`) will stand out against CyclOSM's muted greens. Amber-500 is recommended for maximum visibility.

### Pattern 6: Custom Reset Control

```javascript
// Source: mkUltra RouteMap.astro, lines 62-80
const ResetControl = L.Control.extend({
  options: { position: 'topleft' },
  onAdd() {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    const btn = L.DomUtil.create('a', '', container);
    btn.href = '#';
    btn.title = 'Reset view';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'Reset map to default view');
    btn.innerHTML = '&#8635;'; // ↺
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.on(btn, 'click', (e) => {
      L.DomEvent.preventDefault(e);
      map.fitBounds(initialBounds, { padding: [20, 20] });
      map.closePopup();
    });
    return container;
  }
});
new ResetControl().addTo(map);
```

**Note:** Phase 3's reset is simpler than mkUltra's (no sector polyline style reset, no crosshair hide, no lightbox close — those are later phases). The reset just calls `fitBounds` + `closePopup`.

### Pattern 7: Leaflet Default Marker Icon Fix (Vite/Astro)

**This only matters if any default `L.marker()` calls are used.** Phase 3 uses no markers (route polyline only), so this pitfall is deferred. However, it WILL matter in later phases when restock point markers are added. Document here for future reference:

Vite's asset hashing breaks Leaflet's default icon URL resolution. Fix by using `L.divIcon()` for all markers (as mkUltra does), or by patching `L.Icon.Default`:

```javascript
// Fix for Vite asset hashing — only needed if using L.marker() with default icon
import markerIconUrl from 'leaflet/dist/images/marker-icon.png?url';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png?url';
L.Icon.Default.prototype.options.iconUrl = markerIconUrl;
L.Icon.Default.prototype.options.shadowUrl = markerShadowUrl;
L.Icon.Default.imagePath = '';
```

**Phase 3 avoids this entirely** — the polyline and reset control use no default marker icons.

### Anti-Patterns to Avoid

- **Static top-level `import L from 'leaflet'`:** Will fail during Astro SSR pass. Always use `await import('leaflet')` inside an async function in the `<script>` block.
- **`client:visible` directive on `.astro` components:** Not applicable — `.astro` components cannot use Astro client directives. Only framework components (React/Vue/Svelte) use `client:visible`. The IntersectionObserver approach in `<script>` is the correct Astro-native pattern.
- **`@layer leaflet {}` empty block without the `@layer` order declaration:** Does not establish priority ordering. Must declare `@layer leaflet, base, components, utilities` first.
- **Calling `L.Map.addInitHook` after `L.map()`:** GestureHandling's `addInitHook` must be called BEFORE the map is created. Wrong order = gesture handling silently does nothing.
- **Using Stadia tiles without domain auth config:** Works on localhost, fails (429/403) on production domain without domain registration.
- **Fetching route data from Astro content collections client-side:** Content collections are build-time only. Use `fetch('/data/route-data.json')` in the browser `<script>` to get data from the `public/` directory.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mobile scroll trap prevention | Custom touch event handler | `leaflet-gesture-handling` | iOS/Android gesture detection has many edge cases; plugin handles Ctrl+scroll (desktop), two-finger (mobile), focus-trap detection across browsers |
| Tile attribution display | Custom attribution UI | `L.tileLayer` attribution option | Attribution is legally required (OSM license); Leaflet handles display, placement, and HTML rendering automatically |
| Cascade layer priority for 3rd-party CSS | Manual CSS specificity overrides | `@import "..." layer(leaflet)` with declared layer order | Specificity battles are fragile; cascade layers are the CSS-native solution |
| Reset button UI | Custom floating button with absolute positioning | `L.Control.extend` | Controls integrate with Leaflet's built-in positioning system, z-index management, and click propagation handling |

**Key insight:** Leaflet's plugin ecosystem handles the hard parts. The `leaflet-gesture-handling` package solves a genuinely complex cross-browser problem. Never build gesture handling custom.

## Common Pitfalls

### Pitfall 1: Wrong global.css Layer Order
**What goes wrong:** `@layer leaflet {}` block after `@import "tailwindcss"` creates an undeclared layer with undefined cascade priority.
**Why it happens:** Phase 1 placeholder was created before Leaflet was installed; correct pattern wasn't known yet.
**How to avoid:** Replace with the mkUltra pattern: `@layer leaflet, base, components, utilities` declared BEFORE `@import "tailwindcss"`, then `@import "leaflet/dist/leaflet.css" layer(leaflet)` after.
**Warning signs:** Map tiles render but Leaflet controls (zoom, attribution box) have incorrect styling. Tailwind utilities mysteriously fail to override Leaflet styles.

### Pitfall 2: GestureHandling addInitHook After L.map()
**What goes wrong:** Gesture handling is silently ignored — the map scrolls freely on mobile.
**Why it happens:** `addInitHook` registers a handler that Leaflet runs during map construction. After construction it has no effect.
**How to avoid:** Always call `L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling)` before `L.map(...)`.
**Warning signs:** Mobile users can scroll while touching the map (scroll trap exists); `map.gestureHandling` is undefined.

### Pitfall 3: Map Container Height Not Set
**What goes wrong:** Leaflet renders into a div with no height, resulting in a 0px-tall invisible map. `fitBounds()` has nothing to fit into.
**Why it happens:** Leaflet requires an explicit height on the container element — it does not auto-size.
**How to avoid:** Always set explicit height in component `<style>`: `height: 60vh; min-height: 400px`.
**Warning signs:** Map element is in DOM but invisible; `map.fitBounds()` console logs but nothing renders; browser inspector shows `#map` with height: 0.

### Pitfall 4: fitBounds Called Before Tiles Load
**What goes wrong:** Not a real problem — `fitBounds` sets the viewport, tiles load asynchronously after. This is fine.
**Why it doesn't matter:** Leaflet's tile loading is decoupled from viewport setting. `fitBounds` can be called immediately after polyline creation.

### Pitfall 5: Polyline Color Invisible on CyclOSM Tiles
**What goes wrong:** CyclOSM tiles use a light background with green road colors. A gray polyline (`#d4d4d4` from mkUltra's dark-matter config) will be nearly invisible.
**Why it happens:** mkUltra used dark tiles where light colors stand out. CyclOSM needs a contrasting color.
**How to avoid:** Use `color: '#c8973e'` (amber-500) or `color: '#8b4513'` (rust-600) for maximum contrast on CyclOSM's terrain tiles. Amber-500 is the project's primary accent color and will be immediately recognizable.
**Warning signs:** Route polyline is very hard to see on the map, especially in forested/green tile areas.

### Pitfall 6: Map Not Re-Initializing on Astro View Transitions
**What goes wrong:** If Astro view transitions are ever enabled, the `mapInitialized` flag persists across navigations and the map doesn't re-init.
**Why it doesn't matter now:** This project uses default Astro routing with no view transitions enabled. Not a current concern.

### Pitfall 7: IntersectionObserver Not Firing in Lighthouse
**What goes wrong:** Lighthouse performance testing doesn't simulate scroll events. The scroll-primary, IntersectionObserver-fallback pattern in mkUltra addresses this: Lighthouse triggers the IntersectionObserver when the map enters the synthetic viewport.
**How to avoid:** Use both triggers (scroll + IntersectionObserver) as in mkUltra. Using IntersectionObserver-only with `rootMargin: '200px'` causes Leaflet to be eagerly loaded before the map is even close to visible in the Lighthouse simulation.

## Code Examples

Verified patterns from official sources and mkUltra reference:

### Complete RouteMap.astro Structure (Phase 3 Scoped Version)
```astro
---
// RouteMap.astro — Leaflet map with CyclOSM tiles, GPX polyline, gesture handling, lazy-init
// Dynamic imports in <script> prevent SSR "window is undefined" errors
// Leaflet CSS is imported via global.css in @layer leaflet (not here)
---

<div id="map" class="route-map"></div>

<style>
  .route-map {
    width: 100%;
    height: 60vh;
    min-height: 400px;
    position: relative;
    z-index: 0;
  }
</style>

<script>
  async function initMap() {
    const L = (await import('leaflet')).default;

    // Wire GestureHandling BEFORE L.map() — critical ordering
    const { GestureHandling } = await import('leaflet-gesture-handling');
    L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling);

    const map = L.map('map', { gestureHandling: true });

    // CyclOSM tiles — no API key required, bicycle/outdoor aesthetic
    L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
      attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abc',
      maxZoom: 20
    }).addTo(map);

    // Custom reset control
    const ResetControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const btn = L.DomUtil.create('a', '', container);
        btn.href = '#';
        btn.title = 'Reset view';
        btn.setAttribute('role', 'button');
        btn.setAttribute('aria-label', 'Reset map to default view');
        btn.innerHTML = '&#8635;';
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(btn, 'click', (e) => {
          L.DomEvent.preventDefault(e);
          map.fitBounds(initialBounds, { padding: [20, 20] });
          map.closePopup();
        });
        return container;
      }
    });
    new ResetControl().addTo(map);

    // Fetch route data (browser fetch from public/)
    const routeData = await fetch('/data/route-data.json').then(r => r.json());
    const latlngs = routeData.points.map((pt) => [pt.lat, pt.lon]);

    const routeLine = L.polyline(latlngs, {
      color: '#c8973e',  // amber-500 — contrasts on CyclOSM light tiles
      weight: 3,
      opacity: 0.85,
      smoothFactor: 1
    }).addTo(map);

    map.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
    const initialBounds = routeLine.getBounds();
  }

  // Two-stage lazy init — scroll primary, IntersectionObserver fallback
  let mapInitialized = false;
  const mapEl = document.getElementById('map');

  function tryInitMap() {
    if (!mapInitialized) {
      mapInitialized = true;
      initMap();
    }
  }

  if (mapEl) {
    window.addEventListener('scroll', tryInitMap, { once: true, passive: true });
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          tryInitMap();
        }
      },
      { rootMargin: '0px' }
    );
    observer.observe(mapEl);
  }
</script>
```

### global.css Layer Order Fix
```css
/* global.css — BEFORE any other imports */
@layer leaflet, base, components, utilities;

@import "tailwindcss";

@import "leaflet/dist/leaflet.css" layer(leaflet);
@import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css" layer(leaflet);

/* @theme block follows unchanged */
```

### CyclOSM Tile Layer
```javascript
// Source: wiki.openstreetmap.org/wiki/CyclOSM
L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
  attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  subdomains: 'abc',
  maxZoom: 20
}).addTo(map);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Import Leaflet CSS in component `<style>` | Import in `global.css` with `@layer` | Tailwind v4 (2024) | Prevents Tailwind/Leaflet specificity conflicts |
| `import L from 'leaflet'` at top of script | `const L = (await import('leaflet')).default` | Astro SSR requirement | Prevents `window is undefined` build error |
| Stamen Terrain tiles (via Stamen CDN) | Stadia Maps Terrain (requires account) | Stamen EOL 2023 | Stamen tiles are now Stadia-hosted; need account for production |
| `rootMargin: '200px'` eager preload | Scroll-first + IO fallback | mkUltra refinement | Avoids loading Leaflet before any user interaction in automated testing |

**Deprecated/outdated:**
- Stamen CDN (`tile.stamen.com`): Decommissioned 2023. Tiles now hosted by Stadia. All Stamen tile URLs are broken if not using Stadia.
- Leaflet `type: 'data'` content collections: Not applicable here (this is frontend, not build pipeline), but noted for completeness.

## Open Questions

1. **Polyline color on CyclOSM tiles**
   - What we know: CyclOSM has light terrain tiles with green road markings. Amber (`#c8973e`) should contrast well.
   - What's unclear: Exact visual appearance until rendered in browser. CyclOSM's green palette may or may not clash with the project's `--color-forest-700` (#3d6b3d) green.
   - Recommendation: Default to amber-500 (`#c8973e`); can be adjusted after first visual inspection. Also consider weight: 4 or 5 for visibility.

2. **CyclOSM tile reliability for production**
   - What we know: Hosted by OpenStreetMap France, openly available, no API key required, actively maintained.
   - What's unclear: SLA/uptime guarantees for a free community tile service. OSM tile services have occasionally had rate limiting or downtime.
   - Recommendation: For a low-traffic showcase site this is fine. If reliability becomes an issue, Stadia's domain-auth free tier is the upgrade path (no code key exposure).

3. **global.css @layer declaration side effects**
   - What we know: Adding `@layer leaflet, base, components, utilities` before `@import "tailwindcss"` changes layer priority.
   - What's unclear: Whether the existing `@layer base {}` block in Phase 1's global.css still works correctly after adding the declaration. In CSS Cascade Level 5, an `@layer` declaration block that comes after the `@layer` order declaration is valid — the block's rules join the already-declared layer.
   - Recommendation: The mkUltra reference has the exact pattern working in production with Tailwind v4. Follow it exactly.

## Sources

### Primary (HIGH confidence)
- `/Users/Sheppardjm/Repos/mkUltraGravel/src/components/RouteMap.astro` — Complete reference implementation, verified working in production with same Astro 6.x / Tailwind 4.x / Vite 7 stack
- `/Users/Sheppardjm/Repos/mkUltraGravel/src/styles/global.css` — CSS layer order pattern verified
- `/Users/Sheppardjm/Repos/mkUltraGravel/package.json` — Confirmed library versions: leaflet@1.9.4, leaflet-gesture-handling@1.2.2
- https://leafletjs.com/reference.html — Leaflet 1.9.4 API (L.polyline, L.tileLayer, L.Control.extend, fitBounds)
- https://github.com/elmarquis/Leaflet.GestureHandling — leaflet-gesture-handling v1.2.2 API: `addInitHook` pattern

### Secondary (MEDIUM confidence)
- https://wiki.openstreetmap.org/wiki/CyclOSM — CyclOSM tile URL format, attribution text, usage policy (no API key, max zoom 20)
- https://wiki.openstreetmap.org/wiki/Raster_tile_providers — Comparison of free tile providers (CyclOSM, OpenTopoMap)
- https://docs.stadiamaps.com/authentication/ — Stadia Maps authentication: domain registration required for production (confirmed: rules out Stadia without account setup)

### Tertiary (LOW confidence)
- WebSearch results on Vite/Leaflet default marker icon fix — community-reported pattern for `L.Icon.Default` fix; relevant to later phases but not Phase 3

## Metadata

**Confidence breakdown:**
- Standard stack (Leaflet 1.9.4, leaflet-gesture-handling 1.2.2): HIGH — verified directly in working mkUltra reference repo
- Architecture (global.css layer order, dynamic import, IntersectionObserver pattern): HIGH — verified against mkUltra source code
- Tile provider (CyclOSM): MEDIUM — tile URL and attribution verified via OSM wiki; reliability for production is community-maintained service without SLA
- Pitfalls: HIGH for layer order/gesture handling ordering; MEDIUM for polyline color on CyclOSM

**Research date:** 2026-03-30
**Valid until:** 2026-05-01 (Leaflet 1.9.x is stable; CyclOSM tile server is long-running OSM community service)
