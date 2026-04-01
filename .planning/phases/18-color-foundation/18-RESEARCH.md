# Phase 18: Color Foundation - Research

**Researched:** 2026-03-31
**Domain:** CSS design token expansion (Tailwind 4 @theme static), WCAG AA contrast analysis, build pipeline extension (sharp WebP)
**Confidence:** HIGH — all findings from direct codebase inspection and computed WCAG ratios

## Summary

Phase 18 has two discrete workstreams with no technical dependencies between them. Plan 18-01 adds three new color token families to `@theme static` in `src/styles/global.css` and activates orphaned v1.1 tokens by assigning each a visible use in `FloralDivider.astro`. Plan 18-02 adds a new `scripts/process-historical.js` pipeline step and a `historical-manifest.json` template to support historical illustration processing without touching the existing route photo pipeline.

For Plan 18-01, all WCAG contrast ratios are pre-computed against both `forest-900` (#1a2e1a) and `forest-950` (#0d1a0d) backgrounds. The token values, hex codes, and classifications are documented below — the planner can use these directly without recomputation. The key STATE.md constraint is confirmed: scarlet-600 (#dc2626) is 3.00:1 on forest-900 and 3.71:1 on forest-950, both failing AA normal text (4.5:1 minimum). The STATE.md decision to classify it large-text/decorative ONLY is correct.

For Plan 18-02, the cleanest architecture is a standalone `process-historical.js` script that mirrors the existing pattern of `generate-thumbnails.js` and `copy-images.js` but reads from `images/historical/` instead of `images/`. This completely isolates historical image processing from route photo processing. If `historical-manifest.json` is absent, the script exits gracefully with an empty output (matching `match-photos.js` pattern). A new pipeline step is added to `pipeline.js`.

**Primary recommendation:** Two clean, independent plans. 18-01 is pure CSS + one component file. 18-02 is one new script + one new manifest template + one pipeline.js edit. No new npm packages required for either.

---

## Research Area 1: Tailwind 4 @theme static

### Finding

The existing `src/styles/global.css` uses `@theme static { ... }` for all design tokens. In Tailwind 4, `@theme static` forces ALL defined CSS variables to be output in the compiled CSS regardless of whether they appear in HTML — this is the correct block for a design system where tokens should always be available.

Tokens defined as `--color-NAME-SHADE: VALUE` inside `@theme static` automatically generate utility classes `bg-NAME-SHADE`, `text-NAME-SHADE`, `border-NAME-SHADE`, `fill-NAME-SHADE`, `stroke-NAME-SHADE`, etc. No configuration file needed (Tailwind 4 is CSS-first, no `tailwind.config.js`).

**Insertion point:** New token families go inside the existing `@theme static { ... }` block in `src/styles/global.css`, after the existing Ojibwe palette block (after line 60, before the Typography Scale comment). The pattern follows the existing commented-section style with a header comment per family.

**Confidence:** HIGH — verified via Tailwind 4 docs (WebFetch) and direct inspection of `src/styles/global.css`.

### Tailwind 4 @theme static Pattern

```css
/* existing location: src/styles/global.css, inside @theme static { } */

/* ============================================================
   v1.2: Bold expansion palette — turquoise, scarlet, sun-yellow
   ============================================================ */

/* Turquoise family — Ojibwe sky/water tradition */
/* turquoise-300 through -500 pass AA normal text; -600 large-text-only; -700 decorative-only */
--color-turquoise-300: #5eead4;
--color-turquoise-400: #2dd4bf;
--color-turquoise-500: #14b8a6;
--color-turquoise-600: #0d9488;
--color-turquoise-700: #0f766e;

/* Scarlet family — bold red accent; scarlet-400 is text-safe; -500/-600 large-text-only; -700 decorative-only */
/* STATE.md decision: scarlet-600 (#dc2626) at 3.00:1 forest-900 / 3.71:1 forest-950 — large-text/decorative ONLY */
--color-scarlet-400: #f87171;
--color-scarlet-500: #ef4444;
--color-scarlet-600: #dc2626;
--color-scarlet-700: #b91c1c;

/* Sun-yellow family — all four shades pass AA normal text on forest-900/950 */
--color-sun-300: #fde047;
--color-sun-400: #facc15;
--color-sun-500: #eab308;
--color-sun-600: #ca8a04;
```

---

## Research Area 2: WCAG Contrast Ratios (Pre-Computed)

All ratios computed using the WCAG 2.1 relative luminance formula. Backgrounds: `forest-900` (#1a2e1a, luminance 0.022482) and `forest-950` (#0d1a0d, luminance 0.008534).

Classification thresholds (against the primary `forest-900` background):
- **text-safe (AA)**: ratio >= 4.5:1 — safe for normal body text
- **large-text-only**: 3.0:1 <= ratio < 4.5:1 — safe only for headings 18pt+ or bold 14pt+
- **decorative-only**: ratio < 3.0:1 — no WCAG requirement; must not be used as text color

### New Turquoise Family

| Token | Hex | vs forest-900 | vs forest-950 | Classification |
|-------|-----|---------------|---------------|----------------|
| turquoise-300 | #5eead4 | 9.79:1 | 12.13:1 | text-safe (AA) |
| turquoise-400 | #2dd4bf | 7.78:1 | 9.64:1 | text-safe (AA) |
| turquoise-500 | #14b8a6 | 5.82:1 | 7.21:1 | text-safe (AA) |
| turquoise-600 | #0d9488 | 3.87:1 | 4.79:1 | large-text-only |
| turquoise-700 | #0f766e | 2.65:1 | 3.28:1 | decorative-only |

### New Scarlet Family

| Token | Hex | vs forest-900 | vs forest-950 | Classification |
|-------|-----|---------------|---------------|----------------|
| scarlet-400 | #f87171 | 5.24:1 | 6.48:1 | text-safe (AA) |
| scarlet-500 | #ef4444 | 3.85:1 | 4.77:1 | large-text-only |
| scarlet-600 | #dc2626 | 3.00:1 | 3.71:1 | large-text-only* |
| scarlet-700 | #b91c1c | 2.24:1 | 2.77:1 | decorative-only |

*STATE.md decision: scarlet-600 designated **large-text/decorative ONLY** — confirmed correct. 3.00:1 on forest-900 exactly meets the 3.0:1 large-text minimum; 3.71:1 on forest-950 passes large-text. Neither passes AA normal text (4.5:1).

### New Sun-Yellow Family

| Token | Hex | vs forest-900 | vs forest-950 | Classification |
|-------|-----|---------------|---------------|----------------|
| sun-300 | #fde047 | 10.99:1 | 13.61:1 | text-safe (AA) |
| sun-400 | #facc15 | 9.46:1 | 11.71:1 | text-safe (AA) |
| sun-500 | #eab308 | 7.55:1 | 9.35:1 | text-safe (AA) |
| sun-600 | #ca8a04 | 4.93:1 | 6.11:1 | text-safe (AA) |

### Existing v1.1 Tokens (for reference in CSS comments)

| Token | Hex | vs forest-900 | Classification |
|-------|-----|---------------|----------------|
| berry-700 | #7a2e3d | 1.79:1 | decorative-only |
| berry-600 | #9a3a4f | 2.13:1 | decorative-only |
| berry-500 | #b34d63 | 2.87:1 | decorative-only |
| gold-600 | #b8860b | 4.45:1 | large-text-only (just below AA 4.5) |
| gold-500 | #d4a017 | 6.28:1 | text-safe (AA) |
| gold-400 | #e6b422 | 8.28:1 | text-safe (AA) |
| lake-700 | #2c5282 | 2.48:1 | decorative-only |
| lake-600 | #2b6cb0 | 3.14:1 | large-text-only |
| lake-500 | #3182ce | 3.60:1 | large-text-only |
| lake-400 | #4a9eca | 4.85:1 | text-safe (AA) |
| moss-600 | #6b7c3f | 3.16:1 | large-text-only |
| moss-500 | #7d9448 | 4.28:1 | large-text-only |

**Confidence:** HIGH — ratios computed directly from hex values using the WCAG 2.1 formula.

---

## Research Area 3: Orphaned v1.1 Token Activation (DES-02)

### Current Token Usage State

**Currently used in src/:**
- `lake-400` — `RouteMap.astro` (map track color via `getCSSColor`)
- `berry-600` — `FloralDivider.astro` (blossom center dots, 2 circles)
- `moss-500` — `FloralDivider.astro` (leaf ellipses, 6 uses), `ElevationProfile.astro` (easy-sector fill)
- `gold-500` — `FloralDivider.astro` (vine stroke, double-curve accents), `HeroSection.astro` (CSS color), `HiawathaExplainer.astro` (blockquote border via Tailwind class `border-gold-500`)
- `gold-400` — `FloralDivider.astro` (blossom petal ellipses, 10 uses)

**Orphaned (defined in CSS, zero usages in src/):**
- `lake-500`, `lake-600`, `lake-700`
- `berry-500`, `berry-700`
- `moss-600`
- `gold-600`

**Success criteria:** Each orphaned token must appear in at least one visible element on the page.

### Activation Strategy

`FloralDivider.astro` is the correct activation location. It is purely decorative (aria-hidden), already uses 5 of the v1.1 palette tokens, and appears twice on the page (`index.astro` lines 23 and 45). Adding more color variation to its SVG elements is natural and non-intrusive.

**Proposed assignments for orphaned tokens:**
- `berry-500` — use as fill for outer blossom petals at vine troughs (currently `gold-400`; vary per blossom instance, or add a third blossom)
- `berry-700` — use as a secondary vine stroke or double-curve variant
- `lake-500` — add a subtle leaf outline stroke (SVG `stroke` attribute alongside fill)
- `lake-600` — add as vine shadow / parallel path at reduced opacity
- `lake-700` — use as background circle behind blossom center
- `moss-600` — use as alternate leaf fill on the center leaf pair (x=400) to distinguish it
- `gold-600` — use as stroke on double-curve accents (currently no stroke on those paths)

Alternative if FloralDivider grows too complex: create a `ColorSwatchRow` component visible only in dev builds. But FloralDivider enrichment is the simpler, production-valid approach.

**Confidence:** HIGH — current token usage confirmed by grep across src/; FloralDivider structure confirmed by file read.

---

## Research Area 4: Pipeline Extension Architecture

### Current Pipeline

`scripts/pipeline.js` runs 6 steps in sequence:
1. `parse-gpx.js` → `public/data/route-data.json`
2. `resolve-annotations.js` → `public/data/annotations.json`
3. `generate-thumbnails.js` → `public/thumbs/*.webp` (reads `images/*.jpg` only, no subdirectory recursion)
4. `copy-images.js` → `public/images/*.jpg` (reads `images/*.jpg` only, no subdirectory recursion)
5. `match-photos.js` → `public/data/photos.json`
6. `copy-gpx.js` → `public/*.gpx`

Steps 3 and 4 explicitly filter for `.jpg` files in `images/` flat directory. They do NOT recurse into subdirectories. Historical images in `images/historical/` would be silently ignored by the existing scripts.

### Recommended Architecture: Standalone `process-historical.js`

Adding historical image support as a new, standalone script is the correct approach:
- Zero changes to `generate-thumbnails.js` or `copy-images.js` (no risk to existing route photo processing)
- Historical images live in `images/historical/` (isolated subdirectory)
- `public/data/historical-manifest.json` describes historical images with `category: "historical"` field
- New script produces `public/thumbs/historical/` and `public/images/historical/`

**New pipeline step in `pipeline.js`:**
```javascript
{ name: 'process-historical', script: 'scripts/process-historical.js' }
```
Insert after `copy-images` (step 4) — or at end. Order relative to other steps does not matter.

### historical-manifest.json Schema

```json
[
  {
    "filename": "example.jpg",
    "category": "historical",
    "title": "Song of Hiawatha - Frontispiece",
    "artist": "Harrison Fisher",
    "year": 1906,
    "source": "Internet Archive",
    "license": "Public domain"
  }
]
```

The `category: "historical"` field satisfies the success criteria requirement that the pipeline "accepts images with a `category: 'historical'` field." The script reads and validates this field.

### process-historical.js Architecture

```javascript
// Key behavior differences from generate-thumbnails.js:
// 1. Source: images/historical/ (not images/)
// 2. Accepts multiple formats: .jpg, .jpeg, .png, .tiff, .tif, .webp (not just .jpg)
// 3. Output thumbs: public/thumbs/historical/ (not public/thumbs/)
// 4. Output images: public/images/historical/ (not public/images/)
// 5. Reads historical-manifest.json, validates category field
// 6. Writes public/data/historical-photos.json
// 7. Graceful absent-manifest: if manifest missing, write [] and exit 0

// Sharp processing: identical to generate-thumbnails.js
// sharp(src).autoOrient().resize({ width: 400 }).webp({ quality: 80 }).toFile(out)
```

**Graceful absent-manifest pattern** (from `match-photos.js`):
```javascript
if (!existsSync(MANIFEST_PATH)) {
  console.warn('process-historical: historical-manifest.json not found — writing empty historical-photos.json');
  writeFileSync(OUTPUT_PATH, '[]', 'utf8');
  process.exit(0);
}
```

**Graceful absent-images-dir pattern:**
```javascript
if (!existsSync(SRC_DIR)) {
  mkdirSync(SRC_DIR, { recursive: true });
  console.warn('process-historical: images/historical/ not found — created empty dir, writing empty output');
  writeFileSync(OUTPUT_PATH, '[]', 'utf8');
  process.exit(0);
}
```

**Sharp version:** 0.34.5 (confirmed in project). API is stable: `.autoOrient().resize().webp().toFile()` identical to generate-thumbnails.js usage. No API changes needed.

**Confidence:** HIGH — pipeline scripts read directly; sharp API confirmed at 0.34.5.

---

## Architecture Patterns

### Recommended File Changes

**Plan 18-01:**
```
src/styles/global.css              MODIFY — add 3 new token families inside @theme static
src/components/FloralDivider.astro MODIFY — add orphaned token uses to SVG elements
```

**Plan 18-02:**
```
scripts/process-historical.js      CREATE — new pipeline script
scripts/pipeline.js                MODIFY — add process-historical step
public/data/historical-manifest.json  CREATE — empty template []
images/historical/                 CREATE — empty source dir (with .gitkeep)
```

### CSS Comment Documentation Pattern

The existing `@theme static` block uses inline comments per token family (e.g., "lake-400 PASSES AA; lake-500/600/700 are decorative only"). Follow the same pattern for new tokens:

```css
/* Turquoise family — -300/-400/-500 text-safe; -600 large-text-only; -700 decorative-only */
/* Scarlet family — -400 text-safe; -500/-600 large-text-only; -700 decorative-only */
/* Sun-yellow family — all four shades pass AA normal text on forest-900/950 */
```

Individual WCAG ratios per shade can be documented as a block comment table above each family.

### Anti-Patterns to Avoid

- **Don't modify `generate-thumbnails.js` to recurse into subdirectories** — this risks breaking the existing 51-photo route photo pipeline. The new isolated script is safer.
- **Don't add `category: "historical"` to the existing `photos-manifest.json`** — `match-photos.js` would need to handle missing `mile` fields, adding complexity and risk.
- **Don't use turquoise/scarlet/sun tokens in text elements in Phase 18** — Phase 21 handles section color differentiation. Phase 18 just needs the tokens to exist and render visibly (FloralDivider SVG fills are sufficient).
- **Don't skip the graceful absent-manifest guard in process-historical.js** — the historical manifest starts empty; without the guard, the first `npm run build` would fail before any historical images exist.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WCAG contrast calculation | Custom formula | Pre-computed ratios in this research | Ratios are fixed; recalculating adds risk of formula error |
| WebP thumbnail generation | Custom image processing | `sharp` (already in devDependencies at 0.34.5) | Already used in generate-thumbnails.js; identical API |
| Image format detection | Extension parsing | `sharp` auto-detects format from magic bytes | Handles JPEG vs PNG vs TIFF without extension heuristics |
| Pipeline orchestration | New runner | Extend existing `pipeline.js` steps array | One line to add new step; error handling already in place |

---

## Common Pitfalls

### Pitfall 1: Confusing forest-900 vs forest-950 for scarlet-600 ratio

**What goes wrong:** STATE.md says "scarlet-600 (#dc2626) at 3.71:1" — developer assumes 3.71:1 is the ratio against forest-900.

**Reality:** 3.71:1 is the ratio against forest-950. Against forest-900, scarlet-600 is 3.00:1. The STATE.md decision is still correct: it fails AA normal text on BOTH backgrounds, and the large-text/decorative ONLY classification holds for both.

**How to avoid:** Document BOTH ratios in the CSS comment, labeled per background.

### Pitfall 2: New token families not rendering visibly (success criteria 1)

**What goes wrong:** Adding tokens to `@theme static` is not sufficient — success criteria requires them to "render correctly in a browser," meaning appear in a visible element.

**How to avoid:** Assign at least one new token per family as an SVG fill/stroke in `FloralDivider.astro`. Turquoise can be a vine stroke variant, scarlet as a blossom accent, sun-yellow in the double-curve accents.

### Pitfall 3: process-historical.js failing when historical-manifest.json is absent

**What goes wrong:** `process-historical.js` crashes on first run because no historical images exist yet. This breaks `npm run build` before Phase 20 can add historical images.

**How to avoid:** Implement the same absent-manifest graceful exit as `match-photos.js`. Write `[]` to output and exit 0.

### Pitfall 4: Historical images in wrong format not processed

**What goes wrong:** Historical illustrations from Internet Archive/Met Open Access may be PNG, TIFF, or JPEG. If `process-historical.js` only filters `.jpg` like `generate-thumbnails.js`, other formats are silently skipped.

**How to avoid:** Filter for multiple extensions: `['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.webp']`. Sharp handles all of these natively.

### Pitfall 5: FloralDivider SVG colors look muddy with too many simultaneous additions

**What goes wrong:** Adding 7 new color references to a 60px-high SVG results in visual noise, undermining the decorative aesthetic.

**How to avoid:** Use orphaned tokens at low opacity (0.3-0.5) for secondary details. Vary by instance (the two FloralDivider instances on the page can use slightly different tokens). The blossom center dots, leaf pair fills, and double-curve strokes offer 5+ color slots without adding new SVG elements.

---

## Code Examples

### Adding New Step to pipeline.js

```javascript
// Source: scripts/pipeline.js (direct inspection)
const steps = [
  { name: 'parse-gpx', script: 'scripts/parse-gpx.js' },
  { name: 'resolve-annotations', script: 'scripts/resolve-annotations.js' },
  { name: 'generate-thumbnails', script: 'scripts/generate-thumbnails.js' },
  { name: 'copy-images', script: 'scripts/copy-images.js' },
  { name: 'process-historical', script: 'scripts/process-historical.js' }, // NEW
  { name: 'match-photos', script: 'scripts/match-photos.js' },
  { name: 'copy-gpx', script: 'scripts/copy-gpx.js' },
];
```

### process-historical.js Structure

```javascript
// Source: modeled on generate-thumbnails.js + match-photos.js (direct inspection)
import sharp from 'sharp';
import { readdirSync, mkdirSync, existsSync, copyFileSync, readFileSync, writeFileSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'images', 'historical');
const OUT_THUMBS = join(ROOT, 'public', 'thumbs', 'historical');
const OUT_IMAGES = join(ROOT, 'public', 'images', 'historical');
const MANIFEST_PATH = join(ROOT, 'public', 'data', 'historical-manifest.json');
const OUTPUT_PATH = join(ROOT, 'public', 'data', 'historical-photos.json');

const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.webp']);

// Graceful absent-manifest
if (!existsSync(MANIFEST_PATH)) {
  console.warn('process-historical: historical-manifest.json not found — writing empty output');
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, '[]', 'utf8');
  process.exit(0);
}

// Graceful absent-source-dir
if (!existsSync(SRC_DIR)) {
  mkdirSync(SRC_DIR, { recursive: true });
  console.warn('process-historical: images/historical/ not found — created, writing empty output');
  writeFileSync(OUTPUT_PATH, '[]', 'utf8');
  process.exit(0);
}

mkdirSync(OUT_THUMBS, { recursive: true });
mkdirSync(OUT_IMAGES, { recursive: true });
mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const sourceFiles = readdirSync(SRC_DIR).filter(
  (f) => SUPPORTED_EXTS.has(extname(f).toLowerCase())
);

const results = [];
for (const entry of manifest) {
  if (entry.category !== 'historical') {
    console.warn(`  SKIP: ${entry.filename} — category is not "historical"`);
    continue;
  }
  if (!sourceFiles.includes(entry.filename)) {
    console.warn(`  SKIP: ${entry.filename} — not found in images/historical/`);
    continue;
  }

  const srcPath = join(SRC_DIR, entry.filename);
  const thumbName = basename(entry.filename, extname(entry.filename)).replace(/ /g, '_') + '.webp';
  const thumbPath = join(OUT_THUMBS, thumbName);

  const info = await sharp(srcPath)
    .autoOrient()
    .resize({ width: 400 })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  copyFileSync(srcPath, join(OUT_IMAGES, entry.filename));

  results.push({
    filename: entry.filename,
    category: 'historical',
    thumb: `/thumbs/historical/${thumbName}`,
    title: entry.title,
    artist: entry.artist,
    year: entry.year,
    source: entry.source,
    license: entry.license,
  });
  console.log(`  ${thumbName} (${info.width}x${info.height}, ${info.size} bytes)`);
}

writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf8');
console.log(`process-historical: complete — ${results.length} images processed`);
```

### Sample historical-manifest.json

```json
[]
```

Start empty. Entries added in Phase 20 when actual public domain images are sourced.

### FloralDivider Orphaned Token Activation Example

```astro
<!-- Replace one blossom center dot color to activate berry-500 -->
<!-- Before: fill="var(--color-berry-600)" -->
<circle cx="270" cy="44" r="2" fill="var(--color-berry-500)" opacity="0.75" />

<!-- Add moss-600 as alternate leaf fill on center leaf pair -->
<ellipse cx="400" cy="30" rx="10" ry="4" fill="var(--color-moss-600)" transform="rotate(-25, 400, 30)" opacity="0.55" />

<!-- Add lake-500 as stroke on existing leaf ellipses (no fill change needed) -->
<ellipse cx="150" cy="18" rx="10" ry="4" fill="var(--color-moss-500)"
         stroke="var(--color-lake-500)" stroke-width="0.5"
         transform="rotate(-25, 150, 18)" opacity="0.55" />
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|-----------------|-------|
| tailwind.config.js for custom colors | `@theme static { --color-*: value }` in CSS | Tailwind 4 is CSS-first; no JS config needed |
| Separate WCAG checker tool | Pre-computed ratios in CSS comments | Document at definition time, not retroactively |
| Single image pipeline for all image types | Separate scripts per category | Avoids cross-contamination of route photos and historical illustrations |

---

## Open Questions

1. **Recommended turquoise/scarlet/sun shade count (3-shade vs 5-shade families)**
   - What we know: Phase 21 applies 60-30-10 rule; Phase 19 uses new colors for animated dividers
   - What's unclear: 5-shade families (300-700) vs 3-shade (400-500-600) — 5-shade is more useful for Phase 21 gradient work
   - Recommendation: Define 4-5 shades (as computed above) to give Phase 21 options. Adding extra CSS tokens has zero runtime cost in `@theme static`.

2. **Whether to start `historical-manifest.json` with placeholder entries or truly empty**
   - What we know: No historical images exist yet; Phase 20 sources them
   - What's unclear: Whether having an empty `[]` manifest causes any dev experience friction
   - Recommendation: Empty `[]` is fine. The script's graceful-no-manifest guard also covers the truly empty manifest case.

3. **DES-02 orphaned token 'assigned purpose' interpretation**
   - What we know: Success criteria says "appear in at least one visible element on the page"
   - What's unclear: Does a CSS comment documenting purpose (e.g., "— for future use as water/lake backgrounds") satisfy "assigned purpose" without a visible element?
   - Recommendation: Require BOTH a purpose comment in CSS AND at least one visible use in FloralDivider. The success criteria explicitly requires visible rendering.

---

## Sources

### Primary (HIGH confidence)

- Direct file inspection: `src/styles/global.css` — confirmed `@theme static` structure, current v1.1 token definitions and usage comments
- Direct file inspection: `scripts/generate-thumbnails.js` — confirmed sharp API usage, .jpg-only filter, no subdirectory recursion
- Direct file inspection: `scripts/copy-images.js` — confirmed .jpg-only filter
- Direct file inspection: `scripts/match-photos.js` — confirmed graceful absent-manifest pattern
- Direct file inspection: `scripts/pipeline.js` — confirmed steps array structure and error handling
- Direct file inspection: `src/components/FloralDivider.astro` — confirmed current token usage
- Direct grep: `src/` — confirmed current orphaned token usage (zero usages for lake-500/600/700, berry-500/700, moss-600, gold-600)
- WCAG contrast ratios: computed from hex values using WCAG 2.1 relative luminance formula (node script in this session)
- `package.json`: confirmed sharp 0.34.5 in devDependencies

### Secondary (MEDIUM confidence)

- Tailwind 4 `@theme static` documentation (WebFetch of tailwindcss.com/docs/theme): confirmed that `@theme static` forces all variables to be included in output; `@theme` (without static) only includes used variables

### Tertiary (LOW confidence)

None — all claims backed by direct codebase inspection or official docs.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; everything already in project
- Architecture (palette): HIGH — all ratios computed, token values chosen
- Architecture (pipeline): HIGH — pattern directly modeled on existing scripts
- Pitfalls: HIGH — derived from direct code inspection

**Research date:** 2026-03-31
**Valid until:** Stable. No external dependencies. Re-check sharp API if 0.35.x is released before execution.
