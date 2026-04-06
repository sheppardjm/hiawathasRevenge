# Phase 36: Downloads, Deep Linking & Hero Video - Research

**Researched:** 2026-04-06
**Domain:** Vanilla JS DOM mutation, History API, HTML5 video, Astro static assets
**Confidence:** HIGH — all three features rely on native browser APIs verified against MDN; codebase fully inspected

## Summary

Phase 36 has three independent, low-dependency features. Each touches a specific, well-understood browser primitive. No new npm packages are required.

**DL-01 (GPX download):** The download link is in `src/pages/index.astro` as a static `<a>` with `href="/Munising_Hiawatha_s_Revenge.gpx"` and label `Download GPX File`. It must become a runtime-updated anchor that listens to `route:change` (dispatched on `window` from RouteMap) and swaps `href`, `download`, and `textContent` to match the selected route's `gpxFile` from `routes.json`.

**LINK-01 (deep linking):** `history.replaceState(null, '', '#route=100k')` is the correct mechanism — it updates the URL hash without triggering a page reload or a `hashchange` event. For pre-selection on load, the RouteMap's `initMap()` function must read `location.hash`, parse the route ID, validate it against `routesManifest.routes`, and pass that ID to the initial `renderRoute()` call instead of the hardcoded `'100mi'`. The selector buttons must also be initialized to reflect the deep-linked route (not always index 0).

**HERO-01 (video hero):** The existing `HeroSection.astro` uses a `<picture><img>` pattern. The video file (`Stationary_Hero_Video_With_Motion.mp4`, 7.1 MB, at project root) must be copied to `public/` so Astro serves it at `/Stationary_Hero_Video_With_Motion.mp4`. The hero must show a `<video autoplay muted loop playsinline>` behind the existing content, with the current hero `<img>` as the `poster` fallback. Autoplay requires `muted` to work in all modern browsers. `prefers-reduced-motion: reduce` must pause the video.

**Primary recommendation:** Three self-contained tasks: (1) add `id="gpx-download-link"` to the download anchor and a `<script>` block in `index.astro` that listens for `route:change`; (2) modify `RouteMap.astro`'s `initMap()` to read `location.hash` on entry and `history.replaceState` on each `renderRoute()` call; (3) convert `HeroSection.astro` to add a `<video>` element, copy the video to `public/`, and add reduced-motion handling.

## Standard Stack

### Core (all already installed / native)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Browser History API | Native | `history.replaceState` for URL hash updates | Zero-dep, same-origin, no page reload |
| `location.hash` | Native | Read hash on page load for deep link init | Immediate, synchronous on any script execution |
| HTML `<video>` | Native | Background video with autoplay | Universally supported; `muted+autoplay` works cross-browser |
| `window.matchMedia` | Native | Detect `prefers-reduced-motion` | Required for accessibility compliance |
| `routes.json` | Existing | `gpxFile`, `name`, `shortName` per route | Already fetched by `RouteStats.astro` via runtime fetch |

### No New Dependencies

All three features are pure HTML/JS/CSS. No libraries needed. The video file only needs to be copied to `public/`.

**Installation:** None.

## Architecture Patterns

### Current Relevant Structure

```
src/
├── pages/index.astro          # GPX download <a> lives here (static); needs id + script
├── components/
│   ├── HeroSection.astro      # Current: <picture><img>; needs <video> added
│   └── RouteMap.astro         # Dispatches route:change; initMap needs hash read + replaceState
public/
├── data/routes.json           # gpxFile, name, shortName for all 3 routes
├── Munising_Hiawatha_s_Revenge.gpx     # 100mi — already in public/
├── Hiawatha_s_Revenge_100k.gpx         # 100k — already in public/
└── Hiawatha_s_Revenge_50K_.gpx         # 50k — already in public/
Stationary_Hero_Video_With_Motion.mp4  # At project root — must be copied to public/
```

### Pattern 1: DL-01 — Runtime GPX Link Update

The download `<a>` needs an `id` for JS targeting. The script in `index.astro` listens on `window` for `route:change`, then fetches `routes.json` (cache it after first fetch) to look up `gpxFile` and `name` for the new route.

The `download` attribute on `<a>` specifies the suggested filename when saved. Set `href` to `/${route.gpxFile}` and `download` to a human-friendly name like `HiawathasRevenge-${route.shortName}.gpx`.

**Label update:** The requirement says "label text" must update. Current label is "Download GPX File" — update to include route name, e.g., "Download 100K GPX".

```javascript
// Source: MDN Web Docs — HTMLAnchorElement
// Pattern: update href, download, and text in route:change listener
let _routesCache = null;
async function getRoutes() {
  if (!_routesCache) _routesCache = fetch('/data/routes.json').then(r => r.json());
  return _routesCache;
}

window.addEventListener('route:change', async (e) => {
  const data = await getRoutes();
  const route = data.routes.find(r => r.id === e.detail.routeId);
  if (!route) return;
  const link = document.getElementById('gpx-download-link');
  if (!link) return;
  link.href = `/${route.gpxFile}`;
  link.download = `HiawathasRevenge-${route.shortName}.gpx`;
  link.textContent = `Download ${route.name} GPX`;
});
```

### Pattern 2: LINK-01 — Deep Linking via Hash

**Two-part implementation:**

1. **On route change:** call `history.replaceState(null, '', '#route=' + routeId)` inside `renderRoute()` after `window.__activeRouteId = routeId`.

2. **On page load:** at the start of `initMap()`, read `location.hash`, parse route ID, validate against `routesManifest.routes`, and use it as the initial route:

```javascript
// Source: MDN Web Docs — History.replaceState, location.hash
// Inside renderRoute(routeId) after activeRouteId = routeId:
history.replaceState(null, '', '#route=' + routeId);

// Inside initMap(), before renderRoute('100mi'):
const hashMatch = location.hash.match(/^#route=(.+)$/);
const validIds = routesManifest.routes.map(r => r.id);
const initialRouteId = (hashMatch && validIds.includes(hashMatch[1]))
  ? hashMatch[1]
  : routesManifest.routes[0].id;
```

3. **Selector button initialization:** when `initialRouteId !== 'index 0'`, the selector buttons must initialize with the correct button active (not always the first). Extract the per-button initialization into a function or loop over `selectorBtns` after creation to apply the correct `aria-checked`, `tabindex`, and color.

**Critical distinction:** `history.replaceState` does NOT trigger `hashchange`. This is correct behavior — we do not want the route to re-select itself when replaceState fires.

### Pattern 3: HERO-01 — Video Background with Fallback

The existing `HeroSection.astro` has:
- `<section class="hero">` with `position: relative; overflow: hidden`
- `<picture><img class="hero-img">` — current background, absolutely positioned `inset: 0`
- `.hero-overlay` div for gradient
- `.hero-content` for badge + text

The video must sit in the same layer stack as the `<picture>`. Replace the `<picture>` with a wrapper that has both `<video>` and `<picture>` as fallback:

```html
<!-- Source: MDN Web Docs — HTMLVideoElement, autoplay guide -->
<video
  class="hero-video"
  autoplay
  muted
  loop
  playsinline
  poster="/images/irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536.jpg"
>
  <source src="/Stationary_Hero_Video_With_Motion.mp4" type="video/mp4" />
  <!-- Fallback: existing picture element for browsers without video support -->
  <picture>
    ...existing srcset...
  </picture>
</video>
```

CSS for the video matches the existing `hero-img` pattern:
```css
.hero-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
```

Reduced motion handling in `<script>`:
```javascript
// Source: MDN Web Docs — prefers-reduced-motion
const video = document.querySelector('.hero-video');
if (video) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) video.pause();
  mq.addEventListener('change', () => {
    mq.matches ? video.pause() : video.play();
  });
}
```

### Anti-Patterns to Avoid

- **Don't use `location.hash = '#route=...'`**: This triggers `hashchange` and would cause a second route change cycle. Use `history.replaceState` instead.
- **Don't put the video in `src/` and import it**: Astro processes imports through the asset pipeline; large video files should go in `public/` for direct serving unchanged.
- **Don't omit `muted` on the video**: Autoplay without `muted` is blocked in Chrome, Firefox, and Safari. The video will silently fail to autoplay.
- **Don't omit `playsinline`**: Without it, Safari on iOS opens video in fullscreen instead of inline, breaking the hero layout.
- **Don't use `autoplay="false"`**: Boolean HTML attributes can't be set to false via the attribute value — to disable autoplay, remove the attribute entirely.
- **Don't assume `route:change` fires on initial page load for the GPX link**: The map fires `route:change` only after `initMap()` runs (triggered by scroll/viewport). The GPX link starts as the 100mi hardcoded value; the first `route:change` will update it when map initializes. If a user never scrolls to the map, the download link always shows 100mi. This is acceptable for now.
- **Don't update selectorBtns with the wrong index**: When deep linking to `100k`, button index 1 (not 0) must get `aria-checked="true"` and the `route.color` background. The current code uses `i === 0` unconditionally.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL hash without page reload | Custom popstate handler | `history.replaceState(null, '', '#route=...')` | Native API, correct semantics, no events fired |
| Video autoplay cross-browser | Browser-specific detection | `autoplay muted loop playsinline` attributes | These 4 attrs together cover all modern browsers |
| Fallback for video | JavaScript canPlayType() checks | `poster` attribute + `<picture>` inside `<video>` | Browser handles natively; `poster` shows during load/failure |
| GPX routes data | Fetching from a bespoke API | `routes.json` already at `/data/routes.json` | Already cached by `RouteStats.astro` — reuse same cache pattern |

**Key insight:** All three features are already solved by the platform. The implementation is purely wiring existing mechanisms.

## Common Pitfalls

### Pitfall 1: Deep Link Race — Map Init vs. Hash Read

**What goes wrong:** `initMap()` is deferred (lazy-loaded on scroll/viewport). If `location.hash` is read before `initMap()` runs, it reads the correct value — but `routesManifest` isn't loaded yet. Reading the hash at the top of `initMap()` (after the manifest fetch) is the correct place.

**Why it happens:** The hash is available immediately at `location.hash`, but the routes manifest is fetched inside `initMap()`.

**How to avoid:** Read the hash AFTER `routesManifest` is fetched in `initMap()`. The fetch of `routes.json` happens near the top of `initMap()` — read hash immediately after that fetch resolves.

**Warning signs:** If the page always loads with `100mi` regardless of the hash, the hash read is happening before the manifest is available or the initial `renderRoute()` call is still hardcoded.

### Pitfall 2: Selector Button Not Reflecting Deep Link

**What goes wrong:** Even if `renderRoute('100k')` is called correctly, the selector buttons visually show `100mi` as active because button initialization is hardcoded to `i === 0`.

**Why it happens:** Buttons are built with `btn.setAttribute('aria-checked', i === 0 ? 'true' : 'false')` — the initial state is always index 0 active.

**How to avoid:** After determining `initialRouteId`, loop over `selectorBtns` and apply `aria-checked`, `tabindex`, and `background` based on whether `btn.dataset.routeId === initialRouteId`.

**Warning signs:** The route renders correctly but the pill bar still shows "100mi" highlighted.

### Pitfall 3: Video File Not in `public/`

**What goes wrong:** `Stationary_Hero_Video_With_Motion.mp4` is at project root (verified). It is NOT in `public/`. Using `src="/Stationary_Hero_Video_With_Motion.mp4"` will 404 in both dev and production.

**Why it happens:** The video was placed at the project root during content staging, not in `public/`.

**How to avoid:** Add a `copy-video.js` pipeline script OR manually copy the file to `public/` as a pre-build step. The simplest approach: add it to the pipeline's copy step.

**Warning signs:** Video element is present but blank/broken in browser dev tools network tab shows 404 for the mp4.

### Pitfall 4: GPX Link Shows Stale Route on Initial Load

**What goes wrong:** The GPX download link always shows 100mi initially because `route:change` is not fired on page load — only on user-driven route switches (or when the map initializes). If a user deep-links to `#route=100k`, the map will render 100k and fire `route:change` with `routeId: '100k'` — but the GPX link only updates AFTER `initMap()` and the initial `renderRoute()` complete.

**Why it happens:** The download link's script depends on `route:change`. This fires only after map lazy-init.

**How to avoid:** The download link script can also read `window.__activeRouteId` on DOMContentLoaded as a sync initialization, then update. OR, since `route:change` fires during the initial `renderRoute()` call regardless, the link will update when the map initializes. This is acceptable — the download section is far below the hero, so users scroll past the map before reaching downloads.

**Warning signs:** None — this is expected behavior. No action needed beyond the `route:change` listener.

### Pitfall 5: Video Autoplay Blocked Without `muted`

**What goes wrong:** Browser silently blocks autoplay if the video has an audio track and `muted` is not set.

**Why it happens:** All modern browsers block unmuted autoplay by default (Chrome since 2018, Safari since iOS 10, Firefox behind a preference).

**How to avoid:** Always set `autoplay muted loop playsinline` together. The `Stationary_Hero_Video_With_Motion.mp4` should be silent (stationary hero footage) but set `muted` regardless.

**Warning signs:** Hero shows poster image but never transitions to video. Browser console may show autoplay policy error.

### Pitfall 6: `history.replaceState` Rate Limiting

**What goes wrong:** Firefox and Chrome have internal rate limits on History API calls (typically 100 calls per 30 seconds in Firefox). If route switches happen very rapidly, `replaceState` could throw a `SecurityError`.

**Why it happens:** Browsers protect against history-flooding abuse.

**How to avoid:** This is not a practical concern here — route switching requires a map fetch and re-render (network round-trip), so rapid-fire calls are impossible in normal use. No throttling needed.

**Warning signs:** Console error `SecurityError: The operation is insecure` in edge cases of automated testing.

## Code Examples

### DL-01: Complete GPX Download Script (in `index.astro`)

```javascript
// Source: MDN — HTMLAnchorElement.download, location.hash
// Attach id="gpx-download-link" to the <a> element in markup
let _routesCache = null;
async function getRoutes() {
  if (!_routesCache) _routesCache = fetch('/data/routes.json').then(r => r.json());
  return _routesCache;
}

window.addEventListener('route:change', async (e) => {
  const data = await getRoutes();
  const route = data.routes.find(r => r.id === e.detail.routeId);
  if (!route) return;
  const link = document.getElementById('gpx-download-link');
  if (!link) return;
  link.href = `/${route.gpxFile}`;
  link.download = `HiawathasRevenge-${route.shortName}.gpx`;
  link.textContent = `Download ${route.name} GPX`;
});
```

### LINK-01: Deep Link Read in `initMap()` (in `RouteMap.astro`)

```javascript
// Source: MDN — location.hash, History.replaceState
// Place immediately after routesManifest is fetched in initMap()
const hashMatch = location.hash.match(/^#route=(.+)$/);
const validIds = routesManifest.routes.map(r => r.id);
const initialRouteId = (hashMatch && validIds.includes(hashMatch[1]))
  ? hashMatch[1]
  : routesManifest.routes[0].id; // falls back to defaultRoute

// ...later in initMap(), when building selectorBtns:
// Initialize each btn based on initialRouteId, not i === 0
routes.forEach((route, i) => {
  const isInitialRoute = route.id === initialRouteId;
  btn.setAttribute('aria-checked', isInitialRoute ? 'true' : 'false');
  btn.setAttribute('tabindex', isInitialRoute ? '0' : '-1');
  if (isInitialRoute) {
    btn.style.background = route.color;
    btn.style.color = forest900;
  }
  // ...
});

// ...in renderRoute(routeId), after window.__activeRouteId = routeId:
history.replaceState(null, '', '#route=' + routeId);

// ...change initial render call:
await renderRoute(initialRouteId); // was hardcoded 'renderRoute('100mi')'
```

### HERO-01: Video Hero Element (in `HeroSection.astro`)

```html
<!-- Source: MDN — HTMLVideoElement, autoplay guide -->
<!-- Replace <picture>...</picture> with: -->
<video
  class="hero-video"
  autoplay
  muted
  loop
  playsinline
  poster="/images/irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536.jpg"
>
  <source src="/Stationary_Hero_Video_With_Motion.mp4" type="video/mp4" />
</video>
<!-- Keep the existing <picture><img class="hero-img"> as visible fallback -->
<!-- when video is unsupported or paused by reduced motion -->
```

```css
/* CSS for video element — mirrors existing hero-img rules */
.hero-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  z-index: 0; /* same layer as hero-img */
}
```

```javascript
// Source: MDN — prefers-reduced-motion
// In <script> block of HeroSection.astro
const video = document.querySelector('.hero-video');
if (video) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) video.pause();
  mq.addEventListener('change', () => {
    mq.matches ? video.pause() : video.play().catch(() => {});
  });
}
```

### Video File: Copy to Public

Add `copy-video.js` to scripts (or copy manually before build). The simplest solution since it is a one-time static file:

```javascript
// scripts/copy-video.js
import { copyFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'Stationary_Hero_Video_With_Motion.mp4');
const dest = join(root, 'public', 'Stationary_Hero_Video_With_Motion.mp4');
if (existsSync(src)) { copyFileSync(src, dest); console.log('[copy-video] Copied video to public/'); }
else { console.warn('[copy-video] Source video not found at project root'); }
```

Then add to `scripts/pipeline.js` step list.

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `location.hash = '#route=...'` | `history.replaceState(null, '', '#route=...')` | No `hashchange` event fired; cleaner state management |
| Video `<object>` or Flash | `<video autoplay muted loop playsinline>` | Universal browser support since 2020 |
| JS `canPlayType()` video detection | `<video>` + `poster` + `<picture>` fallback | Browser handles natively; no JS detection needed |

**No deprecated approaches in use for this phase.**

## Open Questions

1. **Video stacking with existing `<picture>`**
   - What we know: The existing `<picture><img class="hero-img">` is `position: absolute; inset: 0`. Adding a `<video>` with the same rules means both sit at `z-index: 0` (implicit).
   - What's unclear: Should the `<picture>` be removed entirely (video's `poster` covers the fallback case), or kept as a DOM fallback for browsers without video? The `poster` attribute shows during load regardless.
   - Recommendation: Keep the `<picture>` element present but hidden (`display: none`) when video is playing, or simply layer `<video>` on top of `<picture>` (video covers image when playing). The simplest approach: put `<video>` after `<picture>` in DOM order; both `position: absolute` with same `inset: 0`; video naturally covers the image. When video fails/pauses, the image shows through.

2. **Video performance on mobile**
   - What we know: The file is 7.1 MB — at the upper end of recommended (<5 MB ideal, <10 MB acceptable). Mobile networks will load this slowly.
   - What's unclear: Whether to add a `media` attribute or JS check to skip video on mobile/slow connections. HERO-01 does not specify this.
   - Recommendation: No optimization required in Phase 36 scope. The `poster` image provides an instant fallback during load. Performance optimization (WebM variant, resolution reduction) is out of scope per HERO-01 requirements.

3. **Pipeline integration for copy-video**
   - What we know: `scripts/pipeline.js` uses a steps array and runs scripts in order.
   - What's unclear: Whether adding to the pipeline is required or a manual one-time copy is preferred.
   - Recommendation: Add `copy-video.js` to the pipeline for consistency with how GPX files are handled. This ensures `npm run dev` and `npm run build` both work without manual file copying.

## Sources

### Primary (HIGH confidence)

- MDN Web Docs — `History.replaceState()`: https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState
- MDN Web Docs — `window.hashchange_event`: https://developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event — confirms `replaceState` does NOT fire hashchange
- MDN Web Docs — HTMLVideoElement autoplay guide: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay — muted requirement for cross-browser autoplay
- MDN Web Docs — `<video>` element: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video — attributes: autoplay, muted, loop, playsinline, poster
- MDN Web Docs — `location.hash`: https://developer.mozilla.org/en-US/docs/Web/API/Window/location
- Astro official docs — Project structure / public/ directory: https://docs.astro.build/en/basics/project-structure/ — files in public/ copied unchanged to build output
- Codebase inspection — `src/components/RouteMap.astro`, `src/pages/index.astro`, `src/components/HeroSection.astro`, `public/data/routes.json`, `scripts/route-config.js`

### Secondary (MEDIUM confidence)

- Design TLC — Background video best practices: https://designtlc.com/how-to-optimize-a-silent-background-video-for-your-websites-hero-area/ — poster, bitrate, file size guidelines (verified against MDN autoplay docs)
- Hashrocket TIL — `prefers-reduced-motion` video pattern: https://til.hashrocket.com/posts/scv8allemt-use-reduced-motion-to-control-a-video — matchMedia + play/pause (pattern verified against MDN prefers-reduced-motion docs)

### Tertiary (LOW confidence — not used for prescriptive recommendations)

- WebSearch results on History API SPA patterns — corroborates MDN findings

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — native browser APIs, verified in MDN official docs
- Architecture: HIGH — codebase fully read; current state of all 3 features confirmed
- Pitfalls: HIGH — most pitfalls verified with MDN (hashchange behavior, muted autoplay requirement, replaceState rate limits documented in MDN)

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable browser APIs; no fast-moving dependencies)
