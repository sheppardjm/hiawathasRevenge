# Phase 51: Favicon & Icons - Research

**Researched:** 2026-04-09
**Domain:** Browser favicon, apple-touch-icon, ICO generation, Astro head tags
**Confidence:** HIGH

## Summary

This phase replaces the current tree-emoji favicon.svg with a branded shield badge icon, adds an apple-touch-icon.png (180x180) for iOS home screen, adds a favicon.ico (32x32) legacy fallback, and updates the HTML head with all required link tags. The implementation is entirely in `public/` static assets plus one head tag change in `BaseLayout.astro`.

The standard minimal favicon set per Evil Martians' widely-cited 2021 guide (still the canonical reference in 2026) is three files: `favicon.svg` (modern browsers), `apple-touch-icon.png` at 180x180 (Apple devices), and `favicon.ico` at 32x32 (legacy). This project does NOT need PWA/manifest infrastructure — the success criteria explicitly only require those three file types plus link tags.

Sharp is already a devDependency in this project (used by `scripts/generate-og-image.js` and thumbnail pipelines). The ICO generation needs one additional small package (`to-ico` or `png-to-ico`) since sharp does not natively write ICO format. The apple-touch-icon can be generated entirely with sharp (SVG → PNG resize with solid background). All generation should live in `scripts/generate-favicons.js` and be wired into the existing pipeline.

**Primary recommendation:** Hand-author `favicon.svg` from the existing shield motif path, use a one-off Node.js script with sharp + `to-ico` to generate `apple-touch-icon.png` and `favicon.ico`, then add three link tags to `BaseLayout.astro`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sharp | ^0.34.5 (already installed) | Render SVG/PNG, resize, add solid background | Already in project; handles all raster transforms |
| to-ico | ~3.x | Encode PNG buffers into ICO binary format | Lightweight, no native deps; accepts sharp output buffers directly |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none additional) | — | — | sharp handles SVG rasterization natively |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| to-ico | png-to-ico | png-to-ico is slightly simpler API but fewer stars; both work |
| to-ico | astro-favicons integration | Heavy-weight; generates dozens of files and manifest; overkill for this scope |
| to-ico | icon-gen | More complex API; designed for desktop apps; overkill |
| hand-authored SVG | Exporting from badge.svg | badge.svg is a complex Illustrator export at 1294x966 with many detailed paths — not suitable for small favicon use; the shield-motif path in BaseLayout.astro is the right starting point |

**Installation:**
```bash
npm install --save-dev to-ico
```

## Architecture Patterns

### Recommended Project Structure
```
public/
├── favicon.svg              # Replace existing tree-emoji version
├── apple-touch-icon.png     # NEW: 180x180, solid forest-900 background
└── favicon.ico              # NEW: 32x32 legacy fallback

scripts/
└── generate-favicons.js     # NEW: generates apple-touch-icon.png and favicon.ico from favicon.svg

src/layouts/
└── BaseLayout.astro         # UPDATE: add apple-touch-icon and favicon.ico link tags
```

### Pattern 1: Three-File Minimal Favicon Set

**What:** Serve exactly three icon files covering all browser/device scenarios.
**When to use:** Any site that is not a PWA and does not need Android home screen icon.
**HTML head implementation (canonical per Evil Martians 2021 guide):**

```html
<!-- Modern browsers use SVG (scalable, supports dark mode via CSS inside SVG) -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />

<!-- Apple devices (iOS home screen) -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />

<!-- Legacy browsers that don't understand SVG favicons -->
<link rel="icon" href="/favicon.ico" sizes="32x32" />
```

The ordering matters: put `favicon.ico` LAST (or with `sizes="32x32"`) so that modern browsers prefer the SVG. If you put `favicon.ico` first, Chrome may use it even when SVG is available.

### Pattern 2: favicon.svg Shield Badge Design

**What:** Standalone SVG using the same shield path as the BaseLayout.astro symbol, with dark-mode awareness.
**When to use:** Always — the favicon.svg should be self-contained (not reference the `<use href="#shield-motif">` mechanism since that requires the full document DOM).

The shield-motif path is already extracted and normalized in BaseLayout.astro:
```
M14 0 L0 38 Q2 36 8 34 L12 48 L14 56 L16 48 L20 34 Q26 36 28 38 Z
viewBox="0 0 28 56"
```

favicon.svg should embed this path directly with brand colors, NOT reference a symbol or external file.

**Example favicon.svg structure:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 56">
  <style>
    .bg { fill: #1a2e1a; }
    .shield { fill: #c8973e; }
    @media (prefers-color-scheme: dark) {
      .bg { fill: #1a2e1a; }
      .shield { fill: #d4a84e; }
    }
  </style>
  <!-- Optional solid background rect for visibility on light tab bars -->
  <rect width="28" height="56" class="bg" rx="2"/>
  <path d="M14 0 L0 38 Q2 36 8 34 L12 48 L14 56 L16 48 L20 34 Q26 36 28 38 Z" class="shield"/>
</svg>
```

Note: The amber-on-forest-green contrast works well on both light and dark browser tab backgrounds.

### Pattern 3: Apple-Touch-Icon Generation (sharp)

**What:** Rasterize SVG to 180x180 PNG with explicit solid background color.
**Why:** Apple iOS ignores any background in the SVG; it displays the raw PNG directly on the home screen. The PNG must have a solid background matching the brand, otherwise the icon appears on a white square.

```javascript
// Source: sharp docs + project pattern from generate-og-image.js
import sharp from 'sharp';

const SHIELD_SVG = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 56">
  <rect width="28" height="56" fill="#1a2e1a"/>
  <path d="M14 0 L0 38 Q2 36 8 34 L12 48 L14 56 L16 48 L20 34 Q26 36 28 38 Z" fill="#c8973e"/>
</svg>`);

await sharp(SHIELD_SVG)
  .resize(180, 180)
  .flatten({ background: '#1a2e1a' }) // ensures no transparent edges
  .png()
  .toFile('public/apple-touch-icon.png');
```

### Pattern 4: favicon.ico Generation (sharp + to-ico)

**What:** Create a 32x32 ICO file from the shield SVG.
**Why:** Legacy browsers (IE11, older Edge, some RSS readers) request `/favicon.ico` regardless of HTML link tags. Without it you get a 404 in server logs and no favicon in those browsers.

```javascript
import sharp from 'sharp';
import toIco from 'to-ico';
import { writeFileSync } from 'fs';

const pngBuffer = await sharp(SHIELD_SVG)
  .resize(32, 32)
  .flatten({ background: '#1a2e1a' })
  .png()
  .toBuffer();

const icoBuffer = await toIco([pngBuffer]);
writeFileSync('public/favicon.ico', icoBuffer);
```

`to-ico` requires the PNG to be exactly a valid ICO size (16, 32, 48, etc). 32x32 is valid.

### Pattern 5: Script Integration into Pipeline

**What:** Add `generate-favicons.js` to the existing pipeline.js sharedSteps array.
**Why:** The pipeline runs pre-build and pre-dev. Favicon assets should be regenerated whenever the script changes (idempotent: same output each run).

Add to `scripts/pipeline.js` in the `sharedSteps` array:
```javascript
{ name: 'generate-favicons', script: 'scripts/generate-favicons.js' },
```

### Anti-Patterns to Avoid

- **Referencing `<use href="#shield-motif">` in favicon.svg:** The symbol `#shield-motif` is defined in the page body DOM. favicon.svg is a standalone file; it cannot reference document symbols. Embed the path directly.
- **Using `public/images/badge.svg` as favicon source:** The full badge SVG is a 1294x966 Illustrator export with hundreds of paths and a `fill: #3b2412` style. It is not the simplified shield badge used as the visual identity — and it is far too complex to render cleanly at 16-32px.
- **Omitting `sizes="32x32"` on the favicon.ico link tag:** Without the `sizes` attribute, Chrome may incorrectly prefer the ICO over the SVG.
- **Omitting the `flatten()` call in sharp:** SVG rasterized to PNG can have transparent pixels even when it appears solid. `flatten({ background: '#1a2e1a' })` composites the image onto the background color before encoding.
- **Generating apple-touch-icon without explicit background:** iOS clips the icon to a rounded rect and does NOT add a background color. If the PNG has transparency, the icon looks bad on home screen.
- **Placing favicon.ico link before favicon.svg link:** Ordering in `<head>` affects browser preference. SVG should come before or instead of ICO (ICO is the fallback).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ICO binary format encoding | Custom binary writer | `to-ico` npm package | ICO is a multi-entry binary format with a specific header structure; edge cases exist for color depth and sizes |
| SVG rasterization at precise sizes | Canvas/browser rendering | `sharp` (already installed) | sharp uses libvips to rasterize SVG at pixel-perfect sizes; handles viewBox scaling correctly |
| Multi-size ICO (if needed) | Manual per-size rendering | `to-ico` with array of buffers | to-ico accepts an array of PNG buffers at different sizes and creates a valid multi-size ICO |

**Key insight:** The only custom code needed is configuration values (colors, sizes, paths). All binary format concerns are delegated to `sharp` and `to-ico`.

## Common Pitfalls

### Pitfall 1: Shield Path Aspect Ratio Mismatch
**What goes wrong:** The shield path has viewBox="0 0 28 56" — it is 1:2 ratio (tall, not square). When rendered into a square favicon canvas, it needs padding or the viewBox needs to be square.
**Why it happens:** Designers use natural proportions; favicons expect square output.
**How to avoid:** Use a square viewBox (e.g., `viewBox="0 0 56 56"`) with the shield centered horizontally: shift x-coordinates by +14 (half the difference). Alternatively, add padding in the SVG itself with a square viewBox.
**Warning signs:** The shield looks squashed or the bottom point is cut off.

### Pitfall 2: SVG favicon Not Updating in Chrome
**What goes wrong:** Chrome aggressively caches favicons. During development, changes to favicon.svg may not appear immediately.
**Why it happens:** Browser-level favicon cache ignores standard HTTP cache headers.
**How to avoid:** For testing, open DevTools → Application → Clear Storage, or hard-reload (Ctrl+Shift+R). In production, cache busting is not practically possible for favicons — the SVG change takes effect for new visitors.
**Warning signs:** Old tree emoji still showing after deploying new favicon.svg.

### Pitfall 3: `to-ico` Receiving Non-Standard PNG Size
**What goes wrong:** `to-ico` throws an error if the PNG buffer is not a supported ICO dimension.
**Why it happens:** ICO format only supports: 16, 24, 32, 48, 64, 128, 256.
**How to avoid:** Always pass `resize(32, 32)` (or another valid ICO size) before `.toBuffer()`.
**Warning signs:** `Error: invalid PNG size` from to-ico at build time.

### Pitfall 4: Pipeline Script Errors Blocking Build
**What goes wrong:** If `generate-favicons.js` throws on first run (e.g., missing module), the prebuild step fails and the dev server won't start.
**Why it happens:** The pipeline is wired as `predev` and `prebuild`.
**How to avoid:** Test the script standalone before wiring into pipeline: `node scripts/generate-favicons.js`. Make the script idempotent (safe to re-run).

### Pitfall 5: apple-touch-icon Background Color Mismatch
**What goes wrong:** The background color in the PNG doesn't match the site's theme color (#1a2e1a), making the icon look inconsistent.
**Why it happens:** Phase 50 set `theme-color` to `#1a2e1a`. The apple-touch-icon should use the same color so the icon looks intentional on iOS home screen.
**How to avoid:** Use `#1a2e1a` (forest-900) as the background for both the SVG rect and the sharp `flatten()` background.

## Code Examples

Verified patterns from project patterns and official sources:

### Complete generate-favicons.js Script
```javascript
// Source: project pattern from scripts/generate-og-image.js + sharp docs
import sharp from 'sharp';
import toIco from 'to-ico';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Shield badge SVG — same path as BaseLayout.astro #shield-motif
// viewBox made square (56x56) with shield centered horizontally (+14 x-offset)
const FAVICON_SVG = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56">
  <rect width="56" height="56" fill="#1a2e1a"/>
  <path d="M28 0 L14 38 Q16 36 22 34 L26 48 L28 56 L30 48 L34 34 Q40 36 42 38 Z" fill="#c8973e"/>
</svg>`);

// apple-touch-icon: 180x180 PNG with solid background
await sharp(FAVICON_SVG)
  .resize(180, 180)
  .flatten({ background: '#1a2e1a' })
  .png()
  .toFile(join(root, 'public/apple-touch-icon.png'));
console.log('✓ Generated public/apple-touch-icon.png (180x180)');

// favicon.ico: 32x32 ICO for legacy browsers
const png32 = await sharp(FAVICON_SVG)
  .resize(32, 32)
  .flatten({ background: '#1a2e1a' })
  .png()
  .toBuffer();

const icoBuffer = await toIco([png32]);
writeFileSync(join(root, 'public/favicon.ico'), icoBuffer);
console.log('✓ Generated public/favicon.ico (32x32)');
```

### Updated Head Link Tags in BaseLayout.astro
```html
<!-- Line 109 area — replace existing single icon link with three links -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="icon" href="/favicon.ico" sizes="32x32" />
```

### Updated favicon.svg (replace public/favicon.svg)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56">
  <style>
    .bg { fill: #1a2e1a; }
    .shield { fill: #c8973e; }
  </style>
  <rect width="56" height="56" class="bg" rx="3"/>
  <path d="M28 0 L14 38 Q16 36 22 34 L26 48 L28 56 L30 48 L34 34 Q40 36 42 38 Z" class="shield"/>
</svg>
```

Note: The path coordinates are the original BaseLayout shield path with all x-coordinates shifted +14 to center within a 56x56 square viewBox. Verify visually after implementation.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multiple PNG sizes (16, 32, 48, 64, 96, 180, 192, 512) | favicon.svg + apple-touch-icon.png + favicon.ico (3 files) | ~2021 (Evil Martians guide) | Massive reduction in files to maintain |
| favicon.ico as primary | favicon.svg as primary, favicon.ico as fallback | Chrome 78+, Firefox 41+ SVG support | SVG scales infinitely; no more blurry 16px icons |
| Separate light/dark PNGs | CSS `prefers-color-scheme` inside SVG | 2019 (Chrome 80+) | Single file adapts to OS theme |

**Deprecated/outdated:**
- `<link rel="shortcut icon">`: The `shortcut` keyword is deprecated; use `<link rel="icon">` only
- Multiple PNG sizes (favicon-16x16.png, favicon-32x32.png, etc.): No longer needed for modern browsers; favicon.svg covers all sizes
- `manifest.json` with icon arrays: Not required for this phase (not a PWA)

## Open Questions

1. **Shield path coordinate precision**
   - What we know: The BaseLayout.astro shield path is `M14 0 L0 38 Q2 36 8 34 L12 48 L14 56 L16 48 L20 34 Q26 36 28 38 Z` in a 28x56 viewBox
   - What's unclear: Shifting all x-coords +14 (to center in 56x56) produces `M28 0 L14 38...` — this is a mathematical transform that should be correct but needs visual verification at 16px and 32px render sizes
   - Recommendation: Generate the favicon, open DevTools, and visually inspect at small tab size. If the shield point appears too thin or the curves look bad at 16px, simplify the bezier curves (the `Q` quadratic commands).

2. **Dark mode favicon behavior**
   - What we know: SVG favicons with embedded `prefers-color-scheme` work in Chrome and Firefox but NOT Safari. Safari on iOS uses apple-touch-icon.png for home screen (not SVG favicon).
   - What's unclear: Whether the amber-on-forest-green shield reads well on light browser tab backgrounds (e.g., light mode Chrome where the tab bar is white/light gray)
   - Recommendation: Use a square rounded-rect background in the SVG (the `rx="3"` rect) so the icon has a defined boundary regardless of tab bar color. The forest-900 background will show a dark badge on both light and dark tab bars.

## Sources

### Primary (HIGH confidence)
- Evil Martians Favicon Guide (https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs) — three-file minimal approach, HTML link tag ordering
- Project codebase: BaseLayout.astro lines 109, 121-133 — existing favicon link, shield-motif path
- Project codebase: scripts/generate-og-image.js — sharp usage pattern for static asset generation
- Project codebase: package.json — sharp ^0.34.5 already installed as devDependency

### Secondary (MEDIUM confidence)
- WebSearch: Favicon best practices 2026 — confirmed three-file approach is still current standard
- WebSearch: to-ico npm — usage pattern with sharp confirmed by multiple sources
- WebSearch: SVG favicon dark mode — prefers-color-scheme in SVG confirmed by CSS-Tricks, multiple blog posts
- Astro official docs: public/ directory behavior — files served as-is, no processing

### Tertiary (LOW confidence)
- to-ico exact current version and API — could not fetch npm page directly; version and API based on WebSearch summaries (verify with `npm info to-ico` before installing)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — sharp already installed; to-ico is a well-established package; approach is verified by multiple authoritative sources
- Architecture: HIGH — file locations, script pattern, and link tag order verified against official docs and project conventions
- Pitfalls: MEDIUM — shield path coordinate math is untested; requires visual verification

**Research date:** 2026-04-09
**Valid until:** 2026-07-09 (favicon standards are stable; 90-day validity appropriate)
