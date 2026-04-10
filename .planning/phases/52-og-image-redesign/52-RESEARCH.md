# Phase 52: OG Image Redesign - Research

**Researched:** 2026-04-09
**Domain:** Static image generation — Node.js + sharp + SVG compositing
**Confidence:** HIGH

## Summary

Phase 52 is a static image generation task: rewrite `scripts/generate-og-image.js` to produce a branded 1200x630 JPEG that composites a dimmed hero photo background, the shield badge (from `favicon.svg`), tagline text, and event date. The new image must be written to a new filename to bust social platform caches. `BaseLayout.astro` must be updated to point to the new filename.

The entire implementation uses **sharp** (already installed at v0.34.5), which is fully capable of: resizing/cropping JPEG backgrounds, compositing SVG overlays (including text), and writing output JPEG files. A proof-of-concept composite was verified during research — the approach produces a legible branded image at both 1200x630 and 300x158 (thumbnail) sizes.

The key complication is font sourcing: `scripts/pipeline.js` runs as `prebuild` (before `astro build`), so `.astro/fonts/` does not exist yet and cannot be used as a font source. The safest solution is to commit the two required font files (`NationalPark-Heavy.otf` at 20KB and `SpaceMono-Bold.ttf` at 89KB) to `scripts/fonts/`, then base64-encode them inline into the SVG overlay at runtime. This approach is self-contained, CI-safe, and produces high-quality output identical to the project's visual identity.

**Primary recommendation:** Rewrite `generate-og-image.js` using sharp's SVG composite approach with committed font assets in `scripts/fonts/`. Use `og-card.jpg` as the new filename. Update `BaseLayout.astro` to reference the new filename (one line change).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sharp | 0.34.5 | Image resize, crop, composite, JPEG output | Already in project; handles all image ops needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js fs.readFileSync | built-in | Read font files and base64-encode for SVG @font-face | Load committed font assets at script startup |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SVG composite overlay | `canvas` npm package | canvas gives pixel-level control but adds a native dependency not already in the project; SVG + sharp is sufficient and already working |
| SVG composite overlay | Puppeteer/headless Chrome screenshot | Dramatically more complex, slow, overkill for a static image |
| Committed font files | System fontconfig fonts | System fonts work locally but are unreliable in CI/CD environments; committed files are portable |
| Committed font files | Google Fonts network fetch | Network dependency during build is fragile; committed files are faster and offline-safe |

**Installation:** No new packages needed. sharp is already a devDependency.

## Architecture Patterns

### Recommended Project Structure

```
scripts/
├── generate-og-image.js    # rewrite this (already in pipeline)
├── generate-favicons.js    # existing — reference for sharp SVG pattern
├── fonts/                  # NEW — committed font assets for OG image
│   ├── NationalPark-Heavy.otf    # 20KB — tagline text
│   └── SpaceMono-Bold.ttf        # 89KB — date text
└── pipeline.js             # no changes needed

public/
├── og-card.jpg             # NEW filename (was og-image.jpg)
└── og-image.jpg            # leave in place (superseded but harmless)

src/layouts/
└── BaseLayout.astro        # update line 17: '/og-image.jpg' → '/og-card.jpg'
                            # update og:image:alt text to match new branded design
```

### Pattern 1: Sharp SVG Composite with Embedded Fonts

**What:** Build a single SVG string that includes `@font-face` with base64-encoded font data, a semi-transparent dim rect, the shield badge path, and text elements. Composite this SVG as an overlay on the cropped hero photo.

**When to use:** Any time text or vector graphics need to be placed on top of a raster photo in Node.js without browser dependency.

**Example (verified in research):**
```javascript
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load fonts at startup — base64 encode for SVG @font-face
const npHeavy = readFileSync(join(__dirname, 'fonts/NationalPark-Heavy.otf')).toString('base64');
const smBold  = readFileSync(join(__dirname, 'fonts/SpaceMono-Bold.ttf')).toString('base64');

const SOURCE = join(root, 'public/images/irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536.jpg');
const OUTPUT = join(root, 'public/og-card.jpg');

const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <style>
      @font-face {
        font-family: 'NationalPark';
        src: url('data:font/otf;base64,${npHeavy}') format('opentype');
      }
      @font-face {
        font-family: 'SpaceMono';
        src: url('data:font/truetype;base64,${smBold}') format('truetype');
        font-weight: bold;
      }
    </style>
  </defs>
  <!-- Dim overlay -->
  <rect width="1200" height="630" fill="black" opacity="0.55"/>
  <!-- Shield badge (scaled from favicon.svg viewBox="0 0 56 56") -->
  <g transform="translate(520,50)">
    <rect width="160" height="160" rx="8" fill="#1a2e1a" opacity="0.85"/>
    <path d="M80 8 L40 108 Q44 104 60 98 L72 136 L80 160 L88 136 L100 98 Q116 104 120 108 Z" fill="#c8973e"/>
  </g>
  <!-- Tagline -->
  <text x="600" y="278" text-anchor="middle" font-size="42" fill="white"
        font-family="NationalPark" letter-spacing="2">A 100-Mile Gravel Ride</text>
  <text x="600" y="335" text-anchor="middle" font-size="42" fill="white"
        font-family="NationalPark" letter-spacing="2">Through the Hiawatha</text>
  <!-- Date -->
  <text x="600" y="425" text-anchor="middle" font-size="46" fill="#c8973e"
        font-family="SpaceMono" font-weight="bold">June 6, 2026</text>
</svg>`);

// Source: 1600x1200 JPEG. Resize to 1200w → 900h, then center-crop to 630h.
await sharp(SOURCE)
  .resize(1200, null, { withoutEnlargement: true })
  .extract({ left: 0, top: 135, width: 1200, height: 630 })
  .composite([{ input: overlay, blend: 'over' }])
  .jpeg({ quality: 85 })
  .toFile(OUTPUT);
```

### Pattern 2: BaseLayout.astro filename update

Only line 17 of `BaseLayout.astro` needs to change:
```diff
- const ogImageURL = new URL('/og-image.jpg', Astro.site);
+ const ogImageURL = new URL('/og-card.jpg', Astro.site);
```

The `og:image:alt` on line 80 should also be updated to reflect the branded design:
```diff
- <meta property="og:image:alt" content="Autumn forest creek in Hiawatha National Forest — Hiawatha's Revenge 100-mile gravel ride" />
+ <meta property="og:image:alt" content="Hiawatha's Revenge shield badge with tagline 'A 100-Mile Gravel Ride Through the Hiawatha' and date June 6, 2026 on a forest photo background" />
```

### Anti-Patterns to Avoid

- **Reading fonts from `.astro/fonts/`:** That directory is gitignored and populated by `astro build/dev` — it does not exist when `pipeline.js` runs as `prebuild`. Using it will silently fall back to sans-serif (or fail).
- **Using `.flatten()` before `.composite()`:** Don't flatten before compositing — composite needs the background layer to be a proper buffer. The correct order is resize → extract → composite → jpeg.
- **Inline SVG CSS classes (not inline `fill` attributes) in sharp:** sharp's librsvg renderer processes `@font-face` CSS fine but CSS class-based fill can be unreliable. Use `fill` attributes directly on path elements for badge geometry.
- **Generating a new filename without updating BaseLayout.astro:** The cache-busting only works if the `og:image` meta tag actually points to the new URL. Both files must change atomically.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Text rendering | Custom pixel-by-pixel text blit | SVG `<text>` in sharp composite | SVG text handles kerning, font metrics, letter-spacing correctly |
| Image compositing | Manual pixel math | `sharp().composite()` | sharp handles alpha blending, premultiplied alpha, correct blend modes |
| JPEG encoding | Custom encoder | `sharp().jpeg({ quality: N })` | MozJPEG is already bundled in this version of sharp |

**Key insight:** The sharp + SVG composite pattern is the Node.js standard for static OG image generation without browser dependencies. Everything needed is already installed.

## Common Pitfalls

### Pitfall 1: Font not rendering (falls back to serif/sans-serif)

**What goes wrong:** Text renders in a generic serif or sans-serif font instead of National Park or Space Mono. The SVG looks correct in a browser but sharp renders with fallback fonts.

**Why it happens:** The `font-family` name in the SVG `@font-face` must exactly match the `font-family` attribute on the `<text>` element. Also, `woff2` format requires the MIME type `font/woff2`; for `.otf` use `format('opentype')`.

**How to avoid:** Test rendering early. Use the `font-family` name as a single quoted string with no spaces if possible (e.g., `'NationalPark'` as the CSS name, not `'National Park'`). Verify output visually by writing to a temp file.

**Warning signs:** Output JPEG file is very small (~15-20KB for 1200x630 instead of ~200KB with background).

### Pitfall 2: Shield badge path coordinates off-scale

**What goes wrong:** The shield appears too small, too large, or misaligned.

**Why it happens:** The shield path in `favicon.svg` is scaled for a `56x56` viewBox. For a 160px badge on a 1200x630 canvas, the path coordinates must be scaled accordingly (multiply by 160/56 ≈ 2.857).

**How to avoid:** Use an SVG `<g transform="translate(x,y) scale(s)">` wrapper around the shield path, or precompute scaled coordinates. The research verified this approach: `<g transform="translate(520,50)">` with path `M80 8 L40 108...` (original path × 2.857 factor applied manually).

**Warning signs:** Badge looks like a tiny sliver or is cut off at the edge.

### Pitfall 3: Crop math is wrong for new source image

**What goes wrong:** The background crop shows the wrong part of the hero photo.

**Why it happens:** The existing script computes `top: Math.round((900 - 630) / 2)` = 135 based on: 1600px wide source → resize to 1200px wide → height becomes 900px (4:3 ratio) → center crop to 630px. This math is correct for the current hero source.

**How to avoid:** Keep the same crop math from the existing `generate-og-image.js`. The source is the same hero JPEG.

### Pitfall 4: Social platforms serving cached old image after filename change

**What goes wrong:** Sharing the page on iMessage/Facebook still shows the old `og-image.jpg`.

**Why it happens:** Social crawlers cache OG images aggressively by URL. Changing only the *content* of `og-image.jpg` does not bust the cache.

**How to avoid:** Use the new filename `og-card.jpg` (SSI-02 requirement). This is the primary purpose of the filename change.

### Pitfall 5: Space Mono Bold not available from Google Fonts woff2 in SVG @font-face

**What goes wrong:** Date text renders in monospace fallback instead of Space Mono.

**Why it happens:** `.woff2` format is not fully supported in all versions of librsvg/pango. `.ttf` and `.otf` are more reliable when base64-embedded in SVG for sharp rendering.

**How to avoid:** Use `SpaceMono-Bold.ttf` (system font at `/Library/Fonts/SpaceMono-Bold.ttf`) committed to `scripts/fonts/`. The format declaration should be `format('truetype')`.

## Code Examples

### Full generate-og-image.js structure (verified working)

```javascript
#!/usr/bin/env node
// Generate branded 1200x630 OG social share image
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const SOURCE = join(root, 'public/images/irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536.jpg');
const OUTPUT = join(root, 'public/og-card.jpg');

// Embed fonts as base64 — no dependency on .astro/fonts/ (gitignored, not present at prebuild)
const npHeavy = readFileSync(join(__dirname, 'fonts/NationalPark-Heavy.otf')).toString('base64');
const smBold  = readFileSync(join(__dirname, 'fonts/SpaceMono-Bold.ttf')).toString('base64');

const overlay = Buffer.from(`...SVG string...`);

// Source is 1600x1200 (4:3). Resize to 1200w → 900h, center-crop to 630h.
await sharp(SOURCE)
  .resize(1200, null, { withoutEnlargement: true })
  .extract({ left: 0, top: 135, width: 1200, height: 630 })
  .composite([{ input: overlay, blend: 'over' }])
  .jpeg({ quality: 85 })
  .toFile(OUTPUT);

console.log('✓ Generated public/og-card.jpg (1200x630)');
```

### Font setup: copy files to scripts/fonts/

```bash
cp /Library/Fonts/NationalPark-Heavy.otf scripts/fonts/NationalPark-Heavy.otf
cp /Library/Fonts/SpaceMono-Bold.ttf scripts/fonts/SpaceMono-Bold.ttf
git add scripts/fonts/
```

### Verify OG tag in built output

```bash
# After build, check og:image URL in dist/index.html
grep 'og:image' dist/index.html
# Expected: content="https://hiawathasrevenge.com/og-card.jpg"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw photo crop (generate-og-image.js) | Branded composite with badge + text | Phase 52 | Social shares now show event identity, not anonymous forest photo |
| `og-image.jpg` filename | `og-card.jpg` | Phase 52 | Busts iMessage/Facebook/Slack/Discord caches |
| No alt text update | Updated alt text describing branded design | Phase 52 | Accessibility + accurate description |

**Deprecated/outdated:**
- `public/og-image.jpg`: superseded by `public/og-card.jpg`. Leave in place (harmless); do not add to pipeline output.

## Open Questions

1. **Font licensing for committed files**
   - What we know: NationalPark-Heavy.otf and SpaceMono-Bold.ttf are installed locally; Space Mono is Apache 2.0 licensed (Google Fonts); National Park license needs verification.
   - What's unclear: Whether National Park has a redistribution restriction that prevents committing to a git repo.
   - Recommendation: If licensing is unclear, use system fontconfig path (works locally) and document that CI builds would fall back to sans-serif — acceptable risk given no CI/CD is configured.

2. **Shield badge visual proportion at thumbnail size**
   - What we know: At 300x158, the shield is ~40px and legible in testing.
   - What's unclear: Whether the shield reads clearly enough against busy forest backgrounds.
   - Recommendation: Run the thumbnail test after implementation and adjust badge size or contrast if needed.

## Sources

### Primary (HIGH confidence)
- Direct code execution: sharp 0.34.5 SVG composite tested in project environment
- `/Users/Sheppardjm/Repos/hiawathasRevenge/scripts/generate-og-image.js` — existing script (current approach)
- `/Users/Sheppardjm/Repos/hiawathasRevenge/scripts/generate-favicons.js` — reference for sharp SVG pattern
- `/Users/Sheppardjm/Repos/hiawathasRevenge/src/layouts/BaseLayout.astro` — all og:image references confirmed

### Secondary (MEDIUM confidence)
- Visual inspection of `/tmp/og-test-committed-fonts.jpg` and `/tmp/og-thumbnail.jpg` (generated during research)
- System font inspection via `fc-list` confirming National Park and Space Mono availability

### Tertiary (LOW confidence)
- Sharp librsvg woff2 format support limitations — observed empirically (otf/ttf work reliably; woff2 may not in all versions)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — sharp already installed, SVG composite approach verified with working code
- Architecture: HIGH — two-file change (script + BaseLayout.astro), proven pattern from generate-favicons.js
- Pitfalls: HIGH — font sourcing pitfall is verified (`.astro/` is gitignored, prebuild timing confirmed)

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable domain; sharp API won't change in 30 days)
