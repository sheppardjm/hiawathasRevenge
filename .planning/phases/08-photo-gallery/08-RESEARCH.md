# Phase 8: Photo Gallery - Research

**Researched:** 2026-03-31
**Domain:** PhotoSwipe 5 lightbox + responsive CSS grid + Astro island pattern
**Confidence:** HIGH

## Summary

Phase 8 adds a PhotoSwipe 5 lightbox to a responsive thumbnail grid rendered from `photos.json`. The project already has 54 WebP thumbnails in `public/thumbs/` and source JPGs in `images/`, but `photos.json` is currently `[]` (empty, no manifest yet). The component must render gracefully when empty and activate fully once Phase 9 populates the manifest.

PhotoSwipe 5 is the confirmed library (roadmap specifies version 5.4.4). It uses a Lightbox module that defers loading the core JS until the user clicks — this satisfies the "lightbox deferred" requirement out of the box via `pswpModule: () => import('photoswipe')`. CSS is loaded eagerly at build time via Vite's CSS import pipeline; there is no first-class API for deferring CSS in PhotoSwipe 5 after v5.1 removed dynamic CSS injection.

The project uses a plain-Astro `<script>` island pattern (no View Transitions, no React framework). PhotoSwipe integrates directly with this pattern: the Lightbox module is initialized in a `<script>` block and binds DOM click listeners on `lightbox.init()`. Dimensions for `data-pswp-width` and `data-pswp-height` are embedded in source image filenames (e.g., `-1536x2048`) and can be parsed at build time in the Astro frontmatter when iterating `photos.json` entries.

**Primary recommendation:** Render the gallery as a static Astro component (no `client:` directive needed — PhotoSwipe wires itself via `<script>` tag). Use `<a data-pswp-width data-pswp-height>` anchors with inline `<img loading="lazy" decoding="async">` thumbnails. Parse dimensions from source filenames in frontmatter. Initialize PhotoSwipe Lightbox in a `<script>` block using `pswpModule: () => import('photoswipe')` to defer core JS until first click.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| photoswipe | 5.4.4 | Lightbox + swipe/keyboard navigation | Roadmap decision; dominant mobile-first lightbox library |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 4.x (already installed) | Responsive grid utilities | Already in project; `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PhotoSwipe 5 | Glightbox, Fancybox | Roadmap locks PhotoSwipe 5.4.4 — do not change |
| Tailwind grid | CSS custom grid | Tailwind already present; no reason to hand-roll |

**Installation:**
```bash
PATH="/usr/local/opt/node/bin:$PATH" npm install photoswipe@5.4.4
```

## Architecture Patterns

### Recommended Project Structure
```
src/
└── components/
    └── PhotoGallery.astro   # New island: grid + lightbox script

public/
├── thumbs/                  # 54 existing 400px WebP thumbnails
└── data/
    └── photos.json          # [] until Phase 9; gallery renders empty gracefully
```

### Pattern 1: Astro Frontmatter Dimension Extraction
**What:** Parse `data-pswp-width` and `data-pswp-height` from the source filename embedded dimensions at SSG build time. Source filenames contain `-WxH` (e.g., `-1536x2048`). When `photos.json` has entries, each entry's `filename` field contains this pattern.
**When to use:** Always — dimensions are known at build time from filenames; no runtime probing needed.
**Example:**
```typescript
// In PhotoGallery.astro frontmatter
import photosData from '../../public/data/photos.json';

type PhotoEntry = {
  id: string;
  filename: string;
  thumb: string;
  mile: number;
  lat?: number;
  lon?: number;
};

const photos = photosData as PhotoEntry[];

// Extract dimensions from filename e.g. "foo-1536x2048.jpg" → { w: 1536, h: 2048 }
function parseDims(filename: string): { w: number; h: number } | null {
  const m = filename.match(/-(\d+)x(\d+)/);
  if (!m) return null;
  return { w: Number(m[1]), h: Number(m[2]) };
}
```

**Verified:** Source filenames confirmed to contain `-WxH` suffix (e.g., `3h0Nkl8...-1536x2048.jpg`, `8VN9...-1152x2048.jpg`). Fallback needed for the 3 "(1)" duplicate files — their thumbnail name includes `_(1)` after space-to-underscore normalization.

### Pattern 2: PhotoSwipe HTML Gallery Structure
**What:** Each photo is an `<a>` anchor with `data-pswp-width`, `data-pswp-height`, and `href` pointing to the full image (served from `/images/` or the source path). Inside each anchor is the thumbnail `<img>`.
**When to use:** Always — DOM-connected gallery is simplest; PhotoSwipe Lightbox reads data attributes directly.
**Example:**
```html
<!-- Source: https://photoswipe.com/getting-started/ -->
<div id="photo-gallery" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
  <a
    href="/images/photo-1536x2048.jpg"
    data-pswp-width="1536"
    data-pswp-height="2048"
    data-cropped="true"
    class="block overflow-hidden"
  >
    <img
      src="/thumbs/photo-1536x2048.webp"
      alt=""
      loading="lazy"
      decoding="async"
      class="w-full h-full object-cover aspect-square"
    />
  </a>
</div>
```

Note: `data-cropped="true"` is required when thumbnails are CSS-cropped with `object-fit: cover`. PhotoSwipe uses this to calculate the correct zoom origin during the opening animation.

### Pattern 3: PhotoSwipe Lightbox Initialization
**What:** PhotoSwipe Lightbox is initialized once in a `<script>` block. `pswpModule: () => import('photoswipe')` defers the 30KB core module until the user clicks.
**When to use:** Always — satisfies PHOTO-02 and the "lightbox deferred" success criterion.
**Example:**
```javascript
// Source: https://photoswipe.com/getting-started/
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

const lightbox = new PhotoSwipeLightbox({
  gallery: '#photo-gallery',
  children: 'a',
  pswpModule: () => import('photoswipe')
});

lightbox.init();
```

Key behavior: `lightbox.init()` only binds click listeners. It does NOT open the dialog or load the core. The core loads on the first click.

### Pattern 4: Empty Gallery State
**What:** When `photos.json` is `[]` (Phase 9 not yet run), render nothing or a placeholder. Never error.
**When to use:** Always — `photos.json` is currently empty.
**Example:**
```astro
{photos.length === 0 ? (
  <p class="text-cream-200 text-sm">No photos yet.</p>
) : (
  <div id="photo-gallery" ...>
    <!-- grid items -->
  </div>
)}
```
Also: skip the `<script>` lightbox init when the gallery is empty (no DOM element to target).

### Pattern 5: Deferred Lightbox (CSS Consideration)
**What:** The roadmap says "PhotoSwipe assets are not loaded until the gallery is interacted with." The JS core satisfies this via `pswpModule: () => import('photoswipe')`. The CSS is a separate concern.
**When to use:** Must decide during planning.

**Options for CSS deferral:**
1. **Import CSS in `<script>` block** (`import 'photoswipe/style.css'`): Vite bundles it into the page CSS. CSS loads with the page — not truly deferred. Simple, zero risk.
2. **Dynamic link injection on first click**: Add a `beforeOpen` event listener that injects a `<link rel="stylesheet" href="/photoswipe.css">` element. Requires pre-copying the CSS to `public/` or serving via Vite. More complex.
3. **Import CSS in Astro frontmatter** (`import 'photoswipe/style.css'`): Same as option 1 — Vite bundles it eagerly.

**Recommendation (see Open Questions):** Import CSS in `<script>` block. PhotoSwipe's CSS is ~3KB — deferring it provides negligible perf benefit and risks FOUC (flash of unstyled lightbox). The `pswpModule: () => import('photoswipe')` already defers the heavy JS (~30KB core). The requirement language "assets not loaded until interacted with" is most naturally satisfied by JS deferral, which is fully achieved.

### Anti-Patterns to Avoid
- **Importing photoswipe in Astro frontmatter for SSR**: PhotoSwipe requires browser globals. Import only in `<script>` blocks.
- **Using `astro:page-load` lifecycle**: This project does not use View Transitions — no need for cleanup/reinit pattern.
- **Passing array as `dataSource`**: DOM-connected gallery (anchor elements) is simpler for this use case since all images are statically rendered by Astro. Array-based data source is for dynamic galleries.
- **Missing `data-cropped="true"`**: Without this, PhotoSwipe will attempt a zoom animation from the uncropped thumbnail region, causing visual glitches.
- **Not handling fallback for missing dimensions**: 3 source files contain ` (1)` in filename — their thumbnail becomes `_(1).webp`. If `parseDims()` returns `null`, fall back to known defaults (1536×2048 is the common portrait size).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keyboard arrow navigation | Custom keydown handlers | PhotoSwipe (built-in via `arrowKeys: true`) | Handles focus trap, esc key, all edge cases |
| Touch swipe gestures | Touch event handler | PhotoSwipe (built-in) | Pan/zoom/pinch all handled |
| Image preloading | Custom preloader | PhotoSwipe `preload: [1, 2]` option | Adjacent slide preloading built in |
| Zoom animation from thumbnail | Custom CSS transform | PhotoSwipe `showHideAnimationType: 'zoom'` (default) with `data-cropped="true"` | Requires precise thumb bounds calculation |
| Responsive grid | Custom CSS media queries | Tailwind `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` | Already installed, exact breakpoints align with requirements |

**Key insight:** PhotoSwipe handles all the hard parts (gestures, keyboard, zoom animation, preloading). The implementation work is wiring HTML data attributes and CSS grid layout.

## Common Pitfalls

### Pitfall 1: Missing `data-pswp-width` / `data-pswp-height`
**What goes wrong:** PhotoSwipe renders images at wrong dimensions or shows a broken layout.
**Why it happens:** PhotoSwipe 5 requires pre-declared dimensions and cannot detect them from the loaded image.
**How to avoid:** Extract dimensions from filename at build time using `-WxH` regex. Provide fallback (1536×2048 for missing).
**Warning signs:** Images appear too small, wrong aspect ratio, or misaligned in lightbox.

### Pitfall 2: Missing `data-cropped="true"` on CSS-cropped thumbnails
**What goes wrong:** Opening zoom animation looks wrong — PhotoSwipe tries to animate from the full (uncropped) thumbnail bounds.
**Why it happens:** `object-fit: cover` crops the image visually but PhotoSwipe doesn't know the effective display region.
**How to avoid:** Always add `data-cropped="true"` to `<a>` elements when thumbnails use `object-fit: cover`.

### Pitfall 3: PhotoSwipe in SSR context
**What goes wrong:** Build fails with "window is not defined" or similar SSR error.
**Why it happens:** PhotoSwipe accesses browser globals at import time.
**How to avoid:** Only import `photoswipe/lightbox` and `photoswipe/style.css` inside `<script>` tags, never in Astro frontmatter.

### Pitfall 4: Gallery element not in DOM when script runs
**What goes wrong:** `lightbox.init()` silently does nothing; clicks don't open lightbox.
**Why it happens:** Script runs before DOM is ready, or gallery is conditionally rendered (empty state).
**How to avoid:** Guard `lightbox.init()` with a `document.getElementById('photo-gallery')` null check. The `<script>` tag in Astro runs after component DOM renders.

### Pitfall 5: Thumbnail filename normalization mismatch
**What goes wrong:** `<img src>` points to a non-existent file.
**Why it happens:** `photos.json` already stores the normalized thumb path (`/thumbs/basename.replace(/ /g, '_').webp`). Use `photo.thumb` directly from the JSON — do not re-derive.
**How to avoid:** Read `photo.thumb` from `photos.json` verbatim. That field is written by `match-photos.js` using the same normalization as `generate-thumbnails.js`.

### Pitfall 6: `href` in anchor pointing to non-existent path
**What goes wrong:** Clicking opens a 404 in the lightbox.
**Why it happens:** Source images in `images/` are not in `public/` so not served.
**How to avoid:** Serve full images from `public/images/` — either copy during pipeline or create a symlink. Alternatively, use the thumb path as `href` (lower quality but zero risk). **Decision needed at planning time.**

## Code Examples

Verified patterns from official sources:

### Minimal Working Gallery (HTML + JS)
```javascript
// Source: https://photoswipe.com/getting-started/
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

const gallery = document.getElementById('photo-gallery');
if (gallery) {
  const lightbox = new PhotoSwipeLightbox({
    gallery: '#photo-gallery',
    children: 'a',
    pswpModule: () => import('photoswipe')
  });
  lightbox.init();
}
```

### Responsive Tailwind Grid
```html
<!-- sm=640px (3 cols), lg=1024px (4 cols) -->
<div id="photo-gallery" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
```

### Thumbnail with lazy loading (PHOTO-06)
```html
<img
  src="/thumbs/photo.webp"
  alt=""
  loading="lazy"
  decoding="async"
  class="w-full aspect-square object-cover"
/>
```

### Dimension parsing from filename
```typescript
// In Astro frontmatter — runs at SSG build time, not in browser
function parseDims(filename: string): { w: number; h: number } {
  const m = filename.match(/-(\d+)x(\d+)/);
  return m ? { w: Number(m[1]), h: Number(m[2]) } : { w: 1536, h: 2048 };
}
```

### Full PhotoSwipe anchor structure
```html
<a
  href="/images/photo-1536x2048.jpg"
  data-pswp-width="1536"
  data-pswp-height="2048"
  data-cropped="true"
  target="_blank"
  rel="noopener"
>
  <img src="/thumbs/photo-1536x2048.webp" alt="" loading="lazy" decoding="async"
       class="w-full aspect-square object-cover" />
</a>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PhotoSwipe v4 dynamic CSS loading | Static CSS import — no dynamic CSS in v5 | v5.1 | Must import CSS eagerly or inject `<link>` manually |
| PhotoSwipe v4 `gettingData` for dimensions | `data-pswp-width` / `data-pswp-height` HTML attributes | v5.0 | Must know dimensions at build time |
| PhotoSwipe v4 jQuery-era markup | Pure ES module, no jQuery | v5.0 | Clean ES import pattern |
| Separate Lightbox and Core imports | Same — Lightbox defers Core via `pswpModule` | v5.0 | Core only loads on first click |

**Deprecated/outdated:**
- PhotoSwipe v4 API (`gettingData`, `items` array constructor): Do not use. v5 uses `dataSource` or DOM attributes.
- `import 'photoswipe/dist/photoswipe.css'`: The correct path is `'photoswipe/style.css'` in v5.

## Open Questions

1. **Source image serving for lightbox `href`**
   - What we know: Source JPGs live in `images/` (not `public/`), so they are not served by Astro's static server. The lightbox `href` must point to a served file.
   - What's unclear: Should the pipeline copy source images to `public/images/` during Phase 8, or should the lightbox `href` point to the 400px thumbnail (degraded quality)?
   - Recommendation: Serve full images from `public/images/` for proper lightbox experience. Add a `copy-images.js` pipeline step or symlink. Alternatively, use thumbs as `href` for Phase 8 and serve full images in Phase 9 when the manifest exists.

2. **CSS deferral for "lightbox deferred" requirement**
   - What we know: JS core is deferred via `pswpModule: () => import('photoswipe')`. CSS cannot be dynamically loaded via PhotoSwipe's own API (removed in v5.1). Manually injecting `<link>` on `beforeOpen` is possible but adds complexity.
   - What's unclear: Does the success criterion "PhotoSwipe assets are not loaded until the gallery is interacted with" require CSS deferral or just JS?
   - Recommendation: Interpret as JS deferral only. Import CSS in `<script>` block so Vite bundles it. This is consistent with how other Astro+PhotoSwipe implementations work. PhotoSwipe CSS is ~3KB — deferring it is premature optimization.

3. **Thumbnail aspect ratio in grid**
   - What we know: Thumbnails are 400px wide but have variable heights (portrait: 400×533, landscape: 400×711 based on source dimensions). A uniform grid looks better.
   - What's unclear: Should the grid use `aspect-square` (uniform squares via CSS crop) or natural proportions (variable height masonry-like)?
   - Recommendation: Use `aspect-square` + `object-fit: cover` for a clean 2/3/4-column grid. Set `data-cropped="true"` on all anchors. This matches common gallery patterns.

## Sources

### Primary (HIGH confidence)
- https://photoswipe.com/getting-started/ — Installation, HTML structure, JS initialization, pswpModule pattern
- https://photoswipe.com/options/ — All config options (keyboard, touch, pswpModule, bgOpacity)
- https://photoswipe.com/data-sources/ — Array data source vs DOM-connected gallery
- https://photoswipe.com/opening-or-closing-transition/ — data-cropped behavior, zoom animation
- https://photoswipe.com/events/ — beforeOpen and other lifecycle events
- https://tailwindcss.com/docs/grid-template-columns — grid-cols-N responsive variants confirmed valid

### Secondary (MEDIUM confidence)
- https://www.launchfa.st/blog/photoswipe-astro — Astro+PhotoSwipe integration pattern (CSS in script block, astro:page-load pattern)
- https://dev.to/petrovicz/astro-photoswipe-549a — DEV article: CSS import in script block, `pswpModule: () => import('photoswipe')`
- Confirmed via official docs: Tailwind 4 breakpoints sm=640px, md=768px, lg=1024px

### Tertiary (LOW confidence)
- WebSearch: CSS deferral via `<link>` injection on `beforeOpen` — pattern found in community but not in official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — PhotoSwipe 5.4.4 is locked by roadmap; confirmed current version matches
- Architecture: HIGH — All patterns verified from official PhotoSwipe docs + project codebase inspection
- Pitfalls: HIGH — Pitfalls 1-5 verified from official docs; Pitfall 6 (image serving) from codebase inspection
- CSS deferral open question: MEDIUM — Official docs confirm dynamic CSS was removed in v5.1; manual injection approach is community-only

**Research date:** 2026-03-31
**Valid until:** 2026-05-01 (PhotoSwipe 5.x is stable; v6 is in development but not released)
