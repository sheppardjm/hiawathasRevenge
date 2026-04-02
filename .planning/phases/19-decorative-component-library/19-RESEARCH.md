# Phase 19: Decorative Component Library - Research

**Researched:** 2026-04-01
**Domain:** SVG animation (stroke-dashoffset), SVG symbol/use reuse, CSS @property, prefers-reduced-motion, build-time SVG generation in Astro, pipeline elevation extraction
**Confidence:** HIGH — all major technical claims verified via MDN official docs, direct codebase inspection, and live data computation

## Summary

Phase 19 has three sub-plans, each adding a reusable Astro component. All three are achievable with zero new npm packages using CSS, SVG, and Astro's build-time content API. The key technical patterns are well-understood and verified:

**19-01 (AnimatedDivider):** The vine draw-on animation uses `stroke-dashoffset` animated to 0 via CSS `@keyframes`. The path length normalization problem (normally requires `getTotalLength()`, a browser-only API) is solved cleanly by setting `pathLength="1"` on each SVG `<path>` element — this normalizes the coordinate system so `stroke-dasharray="1" stroke-dashoffset="1"` always means "fully hidden", with no JavaScript or runtime computation. The scroll trigger uses `IntersectionObserver` in a `<script>` block (same pattern as `ElevationProfile.astro` and `RouteMap.astro`). `prefers-reduced-motion` is handled with a CSS `@media` block that sets `animation: none` and shows a static colored fallback — an established, widely-supported pattern already used in this codebase. CSS `@property` for animating custom color properties is now Baseline 2024 but scroll-driven `animation-timeline` is NOT baseline (Firefox lacks support) — use `IntersectionObserver` + CSS class toggle instead.

**19-02 (ShieldMotif):** The shield/arrowhead path already exists in `HeroSection.astro` (the `g` element with `transform="translate(460, 260) scale(2)"` containing `M20 2 L6 40 Q8 38 14 36 L18 50 L20 58 L22 50 L26 36 Q32 38 34 40 Z`). Extract this into a `<symbol id="shield-motif">` defined in a hidden inline SVG at the top of the layout, then reference it with `<use href="#shield-motif">` at any size. This generates zero HTTP requests and inherits `currentColor` from Tailwind classes on the `<svg>` wrapper. No npm package needed — pure SVG server-rendered at build time.

**19-03 (ElevationSparkline + pipeline):** `route-data.json` already contains `points[]` with `ele` and `miles` fields. `annotations.json` already has `startIdx`/`endIdx` per sector that index into `points[]`. RTE-05 requires a pipeline script (`compute-sector-elevations.js`) that extracts and precomputes per-sector elevation arrays into `public/data/sector-elevations.json`. The `ElevationSparkline` component then reads this via Astro content collections at build time and renders a static `<polyline>` SVG — no client-side JavaScript. The polyline coordinate math is simple normalization, verified with live data (10-36 points per sector, all producing clear elevation profiles).

**Primary recommendation:** Use `pathLength="1"` to sidestep `getTotalLength()` for the divider animation. Use `IntersectionObserver` + CSS class toggle (not `animation-timeline`) for scroll trigger. Read `sector-elevations.json` via a new content collection. All three components render zero client-side JavaScript except the minimal IntersectionObserver in `AnimatedDivider`.

---

## Standard Stack

### Core (no new packages required)

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| SVG `stroke-dashoffset` | Native SVG | Path draw-on animation | Baseline widely available since March 2020; no library needed |
| SVG `pathLength` attribute | Native SVG | Normalize path length to 1 without `getTotalLength()` | Eliminates build-time path length computation; browser normalizes internally |
| CSS `@keyframes` | Native CSS | Drive stroke-dashoffset animation | Standard animation mechanism; already in codebase |
| CSS `@media prefers-reduced-motion` | Native CSS | Stop animation for accessibility | Already used in project (`global.css`, `DonateCallout.astro`, `index.astro`) |
| `IntersectionObserver` | Browser API | Trigger animation on scroll | Already used in `ElevationProfile.astro` and `RouteMap.astro`; pattern established |
| SVG `<symbol>` + `<use>` | Native SVG | Zero-HTTP-request icon reuse | Baseline widely available since July 2015 |
| `currentColor` | SVG/CSS | Color inheritance from Tailwind classes | Standard SVG inheritance; zero configuration |
| SVG `<polyline points="">` | Native SVG | Static elevation sparkline | Zero JavaScript; generates at build time |
| `getCollection('annotations')` | Astro content API | Read sector data at build time | Already registered in `content.config.ts` |
| `getEntry('routeData', 'route')` | Astro content API | Read elevation points at build time | Already registered in `content.config.ts` |

### Not Needed

| Don't Use | Avoided Because |
|-----------|----------------|
| GSAP / ScrollMagic | No new npm packages allowed; IntersectionObserver is sufficient |
| `animation-timeline: scroll()` | NOT baseline — Firefox lacks support as of early 2026 |
| CSS `@property` for color cycling | Baseline 2024 but not needed — simpler CSS variable approach works; flag as optional enhancement |
| `getTotalLength()` | Requires browser DOM; not available at build time |
| `jsdom` / `happy-dom` | Would be needed for `getTotalLength()` — eliminated by `pathLength="1"` |

---

## Architecture Patterns

### Recommended Project Structure

```
src/components/
├── AnimatedDivider.astro    # NEW — 19-01, replaces FloralDivider instances
├── ShieldMotif.astro        # NEW — 19-02, symbol definition + use component  
├── ElevationSparkline.astro # NEW — 19-03, build-time SVG polyline per sector
├── FloralDivider.astro      # EXISTING — remains for now (AnimatedDivider is additive)

scripts/
├── compute-sector-elevations.js  # NEW — 19-03, pipeline step
├── pipeline.js              # MODIFIED — 19-03, add new step

public/data/
├── sector-elevations.json   # NEW — 19-03, output of compute-sector-elevations.js

src/content.config.ts        # MODIFIED — 19-03, add sectorElevations collection
```

---

### Pattern 1: stroke-dashoffset Draw-On Animation with pathLength="1"

**What:** Set `pathLength="1"` on any SVG path. Then `stroke-dasharray: 1; stroke-dashoffset: 1` fully hides it regardless of actual path length. Animate `stroke-dashoffset` to `0` to reveal it.

**When to use:** Any SVG path animation where you don't want to measure the actual path length at runtime.

**Why `pathLength="1"` is the correct approach:**
- `getTotalLength()` is a browser-only DOM API — not available in Node.js / Astro SSR context
- Hardcoding path length requires running in a browser or adding jsdom (both violate the no-new-dependencies constraint)
- `pathLength="1"` normalizes the length to 1 user unit, so dasharray/dashoffset values are always predictable

**Example:**
```html
<!-- Source: MDN pathLength documentation + project constraint analysis -->
<path
  d="M0 30 Q100 10 200 30 Q300 50 400 30 Q500 10 600 30 Q700 50 800 30"
  pathLength="1"
  stroke="var(--color-gold-500)"
  stroke-width="1.5"
  fill="none"
  class="vine-path"
/>
```

```css
.vine-path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset 1.2s ease-out;
}

.animated-divider.is-visible .vine-path {
  stroke-dashoffset: 0;
}

@media (prefers-reduced-motion: reduce) {
  .vine-path {
    stroke-dasharray: none;
    stroke-dashoffset: 0;   /* always visible, static */
    transition: none;
  }
}
```

```javascript
// In AnimatedDivider.astro <script> block
// Source: same pattern as ElevationProfile.astro IntersectionObserver
const divider = document.querySelector('.animated-divider');
const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      divider.classList.add('is-visible');
      observer.disconnect();
    }
  },
  { threshold: 0.3 }
);
observer.observe(divider);
```

---

### Pattern 2: prefers-reduced-motion Static Fallback

**What:** When `prefers-reduced-motion: reduce`, remove all animation and show the static SVG with its fill/stroke colors already applied (still beautiful, just not animated).

**When to use:** All animated components — DEC-03 is a hard requirement.

**The project's existing pattern** (from `global.css`, `DonateCallout.astro`, `index.astro`):
```css
@media (prefers-reduced-motion: reduce) {
  .animated-thing {
    transition: none;
    animation: none;
  }
}
```

**For AnimatedDivider specifically:** The static fallback IS the drawn vine — just set `stroke-dashoffset: 0` immediately in the `prefers-reduced-motion` block. The colors remain; only the drawing animation is suppressed. This satisfies DEC-03's "static, beautifully-colored fallback shown instead."

```css
@media (prefers-reduced-motion: reduce) {
  .vine-path,
  .blossom-path {
    stroke-dasharray: none;
    stroke-dashoffset: 0;
    transition: none;
    animation: none;
  }
  /* Color cycling stops: @keyframes are disabled, but @property initial-value color remains */
}
```

---

### Pattern 3: SVG `<symbol>` + `<use>` for ShieldMotif

**What:** Define the shield shape once as a `<symbol>` in a hidden inline SVG. Reference it with `<use href="#shield-motif">` at any size. Color inherits from parent via `currentColor`.

**Shield path extraction (from `HeroSection.astro`):**
```
Original path: M20 2 L6 40 Q8 38 14 36 L18 50 L20 58 L22 50 L26 36 Q32 38 34 40 Z
Original context: g transform="translate(460, 260) scale(2)" inside 1000x1000 viewBox badge
Path bounding box (path coords): x=[6,34]=28 wide, y=[2,58]=56 tall (aspect ratio ~1:2)
```

**Clean extraction — normalize to a tidy viewBox:**
```html
<!-- ShieldMotif.astro — define once, use anywhere -->
<svg style="display:none" aria-hidden="true">
  <symbol id="shield-motif" viewBox="0 0 28 56">
    <!-- Path shifted: original M20,2 -> M14,2 (centered in 28-wide viewBox) -->
    <path
      d="M14 2 L0 40 Q2 38 8 36 L12 50 L14 58 L16 50 L20 36 Q26 38 28 40 Z"
      fill="currentColor"
    />
  </symbol>
</svg>
```

**Wait — verify the path normalization is correct:**
- Original path: `M20 2 L6 40 Q8 38 14 36 L18 50 L20 58 L22 50 L26 36 Q32 38 34 40 Z`
- Bounding box: x_min=6, x_max=34, y_min=2, y_max=58
- To normalize: subtract (x_min, y_min) = (6, 2) from all points
- Normalized path: `M14 0 L0 38 Q2 36 8 34 L12 48 L14 56 L16 48 L20 34 Q26 36 28 38 Z`
- ViewBox: `0 0 28 56`

**Usage:**
```html
<!-- Icon size: 16-24px -->
<svg class="text-amber-500" width="20" height="40" aria-hidden="true" focusable="false">
  <use href="#shield-motif" />
</svg>

<!-- Watermark size: 400-600px at low opacity -->
<svg class="text-gold-600" width="500" height="1000" aria-hidden="true" focusable="false"
     style="opacity: 0.04; position: absolute; ...">
  <use href="#shield-motif" />
</svg>
```

**Placement of the `<symbol>` definition:**
The `<symbol>` element is invisible until referenced by `<use>`, so it can live anywhere in the HTML. Best practice: place it at the top of `BaseLayout.astro`'s `<body>`, or inside `ShieldMotif.astro` itself (inline, rendered once). Since Astro renders each component independently, if `ShieldMotif.astro` is the definition, every usage of it will re-render the symbol definition. This is harmless (browsers deduplicate by `id`) but slightly wasteful. The cleaner approach: `ShieldMotif.astro` accepts a `mode` prop — `"define"` emits the hidden `<symbol>`, `"use"` emits the `<use>`. The `BaseLayout.astro` gets one `<ShieldMotif mode="define" />` call; usage sites call `<ShieldMotif mode="use" size={24} class="..." />`.

Alternative (simpler): Inline the symbol definition in `BaseLayout.astro` directly. Then `ShieldMotif.astro` is purely a `<use>` wrapper. This avoids prop management.

**Cross-document `<use>` note:** The `href="#shield-motif"` works only when the `<symbol>` is in the SAME HTML document. Since Astro generates a single `index.html`, this is always satisfied. No external SVG file or fetch needed.

---

### Pattern 4: Build-Time SVG Polyline for ElevationSparkline

**What:** Astro component frontmatter reads route data via `getCollection` / `getEntry`, slices the elevation points for a specific sector, normalizes them to SVG coordinates, and renders a static `<polyline>` — zero client-side JavaScript.

**Data access — established pattern (already in `RouteStats.astro`):**
```astro
---
import { getEntry, getCollection } from 'astro:content';

const routeEntry = await getEntry('routeData', 'route');
const allAnnotations = await getCollection('annotations');
const sectors = allAnnotations.filter(a => a.data.type === 'sector');
---
```

**Or, after `compute-sector-elevations.js` runs, read from `sector-elevations.json`:**
```astro
---
import sectorElevations from '../../public/data/sector-elevations.json';
// Direct JSON import works for files accessible to Vite bundler
---
```

**Coordinate normalization (verified with live data):**
```javascript
// Source: verified against all 7 sectors from live route-data.json
const W = 100, H = 30;  // SVG viewBox dimensions
const points = routeData.points.slice(sector.startIdx, sector.endIdx + 1);
const eles = points.map(p => p.ele);
const miles = points.map(p => p.miles);
const eleMin = Math.min(...eles);
const eleMax = Math.max(...eles);
const eleRange = eleMax - eleMin;
const milesRange = miles[miles.length - 1] - miles[0];

const polylinePoints = points.map((p, i) => {
  const x = milesRange > 0 ? (p.miles - miles[0]) / milesRange * W : i / (points.length - 1) * W;
  const y = eleRange > 0 ? H - ((p.ele - eleMin) / eleRange * H) : H / 2;
  return `${x.toFixed(0)},${y.toFixed(0)}`;
}).join(' ');
```

**Result for each sector (verified sample):**
```
sector-520 (10 pts):     "0,29 14,30 28,26 37,28 51,24 60,21 69,20 76,21 78,21 100,0"
sector-nf2266 (11 pts):  "0,0 21,4 36,14 43,30 48,23 52,18 59,17 68,24 75,25 87,26 100,28"
sector-rapid-river (36 pts): "0,1 6,4 9,0 15,12 16,12 17,11 29,16 30,15 32,16 33,17..."
```

All 7 sectors produce meaningful elevation profiles. Even low-range sectors (doe-lake: 5m range) produce visible profiles.

**SVG output:**
```html
<svg viewBox="0 0 100 30" width="100%" height="30"
     aria-hidden="true" role="presentation" focusable="false">
  <polyline
    points="0,29 14,30 28,26 37,28 51,24 60,21 69,20 76,21 78,21 100,0"
    stroke="var(--color-amber-500)"
    stroke-width="1.5"
    fill="none"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
</svg>
```

---

### Pattern 5: compute-sector-elevations.js Pipeline Script

**What:** New pipeline script that reads `route-data.json` and `annotations.json`, extracts per-sector elevation point arrays, and writes `sector-elevations.json`.

**Why a separate pipeline script (per RTE-05):** The requirement explicitly says "Pipeline extended to compute per-segment elevation data." This follows the established pattern: each pipeline step produces one output file. The script makes the data transformation explicit and reproducible, and decouples the computation from the Astro build.

**Output schema:**
```json
[
  {
    "id": "sector-nf2266",
    "name": "NF2266",
    "difficulty": "moderate",
    "startMile": 6.7,
    "endMile": 9.9,
    "elevationPoints": [
      { "miles": 6.72, "ele": 290.9 },
      { "miles": 7.38, "ele": 288.1 }
    ],
    "eleMin": 270.5,
    "eleMax": 290.9,
    "eleGainMeters": 9,
    "eleLossMeters": 28
  }
]
```

**New pipeline.js step (insert after `resolve-annotations`, before `generate-thumbnails`):**
```javascript
{ name: 'compute-sector-elevations', script: 'scripts/compute-sector-elevations.js' }
```

**Why not skip the pipeline script and compute in Astro frontmatter?**
- RTE-05 explicitly requires pipeline extension
- Consistency with project architecture (all data transformations happen in pipeline, not component frontmatter)
- Easier to inspect/debug the intermediate JSON
- `ElevationSparkline.astro` can then be simpler (just reads precomputed data)

**Alternative for ElevationSparkline data access:** After the pipeline runs, `sector-elevations.json` lives in `public/data/`. To use it at build time in Astro (not via client-side fetch), either:
1. Add a `sectorElevations` collection to `content.config.ts` (consistent with routeData/annotations pattern)
2. Import directly: `import sectorElevations from '../../public/data/sector-elevations.json'` — Vite can bundle JSON files from `public/` if imported via relative path. Verify this works vs. the Vite `public/` directory restriction.

**Recommendation:** Use option 1 (new content collection) for consistency with the established pattern in this project.

---

### Pattern 6: AnimatedDivider Variants

**What:** A `variant` prop controls which SVG template renders. At minimum 2 variants required (DEC-02).

**Proposed variants:**
- `variant="floral"` (default) — full vine with blossoms and leaves (elaboration of existing FloralDivider)
- `variant="minimal"` — double-curve only, lighter visual weight for minor section breaks
- `variant="berry"` — vine with berry cluster motif (intermediate complexity)

**Implementation:** Astro's conditional rendering in frontmatter:
```astro
---
const { variant = 'floral' } = Astro.props;
---

{variant === 'floral' && (
  <svg><!-- full vine SVG --></svg>
)}
{variant === 'minimal' && (
  <svg><!-- double-curve SVG --></svg>
)}
{variant === 'berry' && (
  <svg><!-- berry cluster SVG --></svg>
)}
```

**All variants share:**
- Same outer `<div class="animated-divider">` wrapper
- Same CSS class `.vine-path` for the main animated stroke
- Same `prefers-reduced-motion` CSS block
- Same IntersectionObserver script

---

### Anti-Patterns to Avoid

- **Don't use `getTotalLength()`** — it requires a browser DOM. Use `pathLength="1"` instead.
- **Don't use `animation-timeline: scroll()`** — not supported in Firefox as of early 2026. Use IntersectionObserver.
- **Don't put `<symbol>` definition in every `ShieldMotif` usage** — browser deduplicates by ID but the HTML is redundant. Define once in `BaseLayout.astro` or via a `mode="define"` prop.
- **Don't use `fill="var(--color-scarlet-600)"` in text labels near the sparkline** — scarlet-600 (#dc2626) is large-text/decorative ONLY (3.00:1 on forest-900, fails AA normal text).
- **Don't make ElevationSparkline fetch `/data/sector-elevations.json` at runtime** — RTE-02 requires zero JavaScript. All data must be in the HTML at build time.
- **Don't try to cross-reference `<use href="#shield-motif">` to an external SVG file** — this requires an HTTP request and breaks the zero-HTTP-request requirement.
- **Don't animate `fill` directly** — CSS `fill` color animation requires `@property` registration for each custom color property; this is complex. Better to animate `opacity` for color cycling effects, or use CSS `@keyframes` on named color values for static color changes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path length for dashoffset | `getTotalLength()` call + jsdom | `pathLength="1"` attribute on `<path>` | Browser normalizes internally; no Node.js DOM needed |
| Icon reuse system | External SVG sprite file | Inline `<symbol>` + `<use>` in same document | Zero HTTP requests; browser caches with page |
| Color token reading at runtime | Hardcoded hex values | `var(--color-gold-500)` in SVG `stroke` attribute | Tokens defined in `@theme static`, available to SVG |
| Per-sector elevation slicing | Custom array slicer | `startIdx`/`endIdx` already in annotations.json | Indices already resolved and validated by `resolve-annotations.js` |
| Scroll detection library | Third-party scroll watcher | `IntersectionObserver` (browser API) | Already used 3x in this codebase; no new patterns needed |

---

## Common Pitfalls

### Pitfall 1: `<symbol>` `id` collision if defined multiple times

**What goes wrong:** If `ShieldMotif.astro` emits a `<symbol id="shield-motif">` inline every time it's rendered, and the component is used 4+ times on the page (icon, watermark, pull quote, footer), the page has 4 identical symbol definitions. Browsers handle this gracefully (use first definition), but the HTML is semantically invalid.

**How to avoid:** Define the symbol exactly once — either in `BaseLayout.astro` (recommended for this codebase) or use a prop pattern where only one instance emits the `<symbol>`.

**Warning signs:** Lighthouse or HTML validators report duplicate IDs.

### Pitfall 2: IntersectionObserver runs before DOM is ready

**What goes wrong:** If the `<script>` block in `AnimatedDivider.astro` runs before the divider element is in the DOM, `document.querySelector('.animated-divider')` returns null.

**How to avoid:** Astro places `<script>` at the end of `<body>` by default for `.astro` components. This is safe. Alternatively, wrap in `document.addEventListener('DOMContentLoaded', ...)`. The existing `ElevationProfile.astro` and `RouteMap.astro` use the same pattern without this guard.

### Pitfall 3: Multiple AnimatedDivider instances — one IntersectionObserver observes wrong element

**What goes wrong:** `index.astro` uses two `FloralDivider` instances. If `AnimatedDivider` replaces both, the `<script>` block (which is deduped by Astro) runs once but `document.querySelector` only finds the first element.

**How to avoid:** Use `document.querySelectorAll('.animated-divider')` and create one observer per element. This is a standard pattern for multiple instances of the same animated component.

### Pitfall 4: `stroke-dasharray: none` vs `stroke-dasharray: unset` in reduced-motion

**What goes wrong:** `stroke-dasharray: none` may not clear the animation state correctly in some edge cases.

**How to avoid:** Use `stroke-dashoffset: 0; transition: none` which fully reveals the path instantly with no transition. The `stroke-dasharray` can stay as `1` — setting `stroke-dashoffset: 0` immediately shows the full path. No need to unset `stroke-dasharray`.

### Pitfall 5: `public/data/` JSON files not importable via static `import` in Astro

**What goes wrong:** Vite restricts static imports of files in `public/` by design (they're served as-is, not bundled). `import data from '../../public/data/sector-elevations.json'` may fail.

**How to avoid:** Use the content collection pattern (`getCollection`) for all `public/data/` JSON files, as this project already does for `route-data.json` and `annotations.json`. Add `sectorElevations` to `content.config.ts` after the pipeline creates the file.

**Alternative if content collection is overkill:** Read with `readFileSync` in the frontmatter (Node.js available in Astro frontmatter at build time). This is a valid but non-standard approach.

### Pitfall 6: ElevationSparkline polyline is invisible due to tiny stroke-width at small render sizes

**What goes wrong:** At small display widths (e.g., in a sidebar), a `stroke-width="1.5"` in a `100x30` viewBox renders as a very thin line that may be invisible on high-DPI displays.

**How to avoid:** Use `stroke-width="1.5"` in SVG units (not CSS px) inside a `viewBox="0 0 100 30"` SVG scaled via CSS `width: 100%`. The stroke scales with the SVG viewport. Test at multiple widths. Add a minimum rendered width with CSS.

### Pitfall 7: `sector-elevations.json` content collection requires schema alignment

**What goes wrong:** `content.config.ts` validates schemas with Zod. If `sector-elevations.json` is added as a collection without a schema, build warnings or type errors appear.

**How to avoid:** Add a Zod schema to the new `sectorElevations` collection definition, matching the output schema of `compute-sector-elevations.js`.

---

## Code Examples

### AnimatedDivider.astro: Full Component Shell

```astro
---
// Source: based on FloralDivider.astro (project) + MDN stroke-dashoffset pattern
interface Props {
  variant?: 'floral' | 'minimal' | 'berry';
}
const { variant = 'floral' } = Astro.props;
---

<div class="animated-divider" aria-hidden="true" role="presentation">
  {variant === 'floral' && (
    <svg viewBox="0 0 800 60" width="100%" height="60"
         aria-hidden="true" role="presentation" focusable="false">
      <path
        class="vine-path"
        d="M0 30 Q100 10 200 30 Q300 50 400 30 Q500 10 600 30 Q700 50 800 30"
        pathLength="1"
        stroke="var(--color-gold-500)"
        stroke-width="1.5"
        fill="none"
      />
      <!-- blossom paths also get pathLength="1" and vine-path class -->
    </svg>
  )}
  {variant === 'minimal' && (
    <svg viewBox="0 0 800 30" width="100%" height="30"
         aria-hidden="true" role="presentation" focusable="false">
      <path
        class="vine-path"
        d="M200 15 Q400 5 600 15"
        pathLength="1"
        stroke="var(--color-gold-600)"
        stroke-width="1"
        fill="none"
      />
      <path
        class="vine-path"
        d="M200 15 Q400 25 600 15"
        pathLength="1"
        stroke="var(--color-gold-500)"
        stroke-width="1"
        fill="none"
        opacity="0.5"
      />
    </svg>
  )}
</div>

<style>
  .animated-divider {
    max-width: 56rem;
    margin: 0 auto;
  }

  .vine-path {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    transition: stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .animated-divider.is-visible .vine-path {
    stroke-dashoffset: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .vine-path {
      stroke-dashoffset: 0;
      transition: none;
    }
  }
</style>

<script>
  // Source: same IntersectionObserver pattern as ElevationProfile.astro
  document.querySelectorAll('.animated-divider').forEach((divider) => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          divider.classList.add('is-visible');
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(divider);
  });
</script>
```

### ShieldMotif.astro: Symbol Definition + Use Component

```astro
---
// Source: MDN SVG symbol/use documentation
interface Props {
  size?: number;       // CSS px for the SVG element
  class?: string;      // Tailwind classes (including text-* for currentColor)
  label?: string;      // aria-label for non-decorative uses
}
const { size = 24, class: className = '', label } = Astro.props;
const isDecorative = !label;
---

<!-- Symbol definition (rendered once per page by BaseLayout) -->
<!-- This component ALWAYS emits a <use> reference -->
<!-- The <symbol> lives in BaseLayout.astro -->
<svg
  width={size}
  height={size * 2}
  class={className}
  aria-hidden={isDecorative ? 'true' : undefined}
  aria-label={label}
  role={isDecorative ? 'presentation' : 'img'}
  focusable="false"
>
  <use href="#shield-motif" width={size} height={size * 2} />
</svg>
```

In `BaseLayout.astro` `<body>`, add once:
```html
<svg style="display:none" aria-hidden="true" focusable="false">
  <defs>
    <symbol id="shield-motif" viewBox="0 0 28 56">
      <!-- Normalized from HeroSection.astro path -->
      <!-- Original: M20 2 L6 40 Q8 38 14 36 L18 50 L20 58 L22 50 L26 36 Q32 38 34 40 Z -->
      <!-- Normalized (subtract x_min=6, y_min=2): -->
      <path
        d="M14 0 L0 38 Q2 36 8 34 L12 48 L14 56 L16 48 L20 34 Q26 36 28 38 Z"
        fill="currentColor"
      />
    </symbol>
  </defs>
</svg>
```

### ElevationSparkline.astro: Build-Time Static SVG

```astro
---
// Source: pattern from RouteStats.astro (getCollection) + verified coordinate math
import { getEntry, getCollection } from 'astro:content';

interface Props {
  sectorId: string;   // e.g., 'sector-nf2266'
}
const { sectorId } = Astro.props;

const routeEntry = await getEntry('routeData', 'route');
const allAnnotations = await getCollection('annotations');

const sector = allAnnotations.find(a => a.id === sectorId && a.data.type === 'sector');
if (!sector || !routeEntry) return null;

const { startIdx, endIdx, name, difficulty } = sector.data as any;
const points = routeEntry.data.points.slice(startIdx, endIdx + 1);

const eles = points.map(p => p.ele);
const miles = points.map(p => p.miles);
const eleMin = Math.min(...eles);
const eleMax = Math.max(...eles);
const eleRange = eleMax - eleMin;
const milesRange = miles[miles.length - 1] - miles[0];

const W = 100, H = 30;
const polylinePoints = points.map((p, i) => {
  const x = milesRange > 0 ? (p.miles - miles[0]) / milesRange * W : i / Math.max(points.length - 1, 1) * W;
  const y = eleRange > 0 ? H - ((p.ele - eleMin) / eleRange * H) : H / 2;
  return `${x.toFixed(0)},${y.toFixed(0)}`;
}).join(' ');

const DIFFICULTY_COLORS = {
  easy:     'var(--color-moss-500)',
  moderate: 'var(--color-gold-500)',
  hard:     'var(--color-scarlet-400)',
};
const strokeColor = DIFFICULTY_COLORS[difficulty] ?? 'var(--color-gold-500)';
---

<svg
  viewBox="0 0 100 30"
  width="100%"
  height="30"
  aria-hidden="true"
  role="presentation"
  focusable="false"
>
  <polyline
    points={polylinePoints}
    stroke={strokeColor}
    stroke-width="1.5"
    fill="none"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
</svg>
```

### compute-sector-elevations.js: Pipeline Script

```javascript
// Source: modeled on resolve-annotations.js pattern (direct codebase inspection)
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const routeData = JSON.parse(readFileSync(join(ROOT, 'public/data/route-data.json'), 'utf8'));
const annotations = JSON.parse(readFileSync(join(ROOT, 'public/data/annotations.json'), 'utf8'));

const sectors = annotations.filter(a => a.type === 'sector');
const points = routeData.points;

const results = sectors.map(sector => {
  const segPoints = points.slice(sector.startIdx, sector.endIdx + 1);
  const eles = segPoints.map(p => p.ele);
  const eleMin = Math.min(...eles);
  const eleMax = Math.max(...eles);
  const eleGain = eles.reduce((sum, ele, i) => i === 0 ? 0 : sum + Math.max(0, ele - eles[i-1]), 0);
  const eleLoss = eles.reduce((sum, ele, i) => i === 0 ? 0 : sum + Math.max(0, eles[i-1] - ele), 0);

  return {
    id: sector.id,
    name: sector.name,
    difficulty: sector.difficulty,
    startMile: sector.startMile,
    endMile: sector.endMile,
    elevationPoints: segPoints.map(p => ({ miles: p.miles, ele: p.ele })),
    eleMin: Math.round(eleMin * 10) / 10,
    eleMax: Math.round(eleMax * 10) / 10,
    eleGainMeters: Math.round(eleGain),
    eleLossMeters: Math.round(eleLoss),
  };
});

const outDir = join(ROOT, 'public', 'data');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'sector-elevations.json'), JSON.stringify(results, null, 2), 'utf8');
console.log(`compute-sector-elevations: ${results.length} sectors written`);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-----------------|--------------|--------|
| `getTotalLength()` for dashoffset | `pathLength="1"` attribute | SVG2 spec | Eliminates browser DOM requirement for build-time SVG |
| External SVG sprite file (separate HTTP request) | Inline `<symbol>` in same HTML document | Modern SSR era | Zero HTTP requests; no CORS issues |
| GSAP ScrollTrigger for scroll animations | `IntersectionObserver` (browser API) | Chrome 51/2016, all browsers 2019 | No library needed for entry-based animations |
| `animation-timeline: scroll()` for scroll-driven | `IntersectionObserver` + CSS class toggle | Still emerging (Firefox lacking) | More compatible choice for production 2026 |
| Client-side fetch for chart data | Build-time `getCollection()` in Astro frontmatter | Astro 2.0+ content collections | Zero JS for data; static HTML output |

**Deprecated/outdated for this phase:**
- CSS `animation-timeline: scroll()` for production: Firefox lacks support. IntersectionObserver is the correct choice.
- `animation-timeline: view()` for entry-based: Same Firefox issue. IntersectionObserver + class toggle is equivalent and supported.

---

## Open Questions

1. **Whether `ElevationSparkline` should use `compute-sector-elevations.js` output or slice `route-data.json` directly in frontmatter**
   - What we know: RTE-05 explicitly requires pipeline extension. `RouteStats.astro` already uses `getCollection` to read route/annotation data at build time.
   - What's unclear: Is the pipeline script truly necessary if the Astro component can do the same computation in frontmatter with no perf downside?
   - Recommendation: Build the pipeline script (satisfies RTE-05 literal requirement) AND have `ElevationSparkline` use the existing `getCollection` approach for reading data (avoids content.config.ts changes if the pre-computed JSON just duplicates what's already available). The script adds the `eleGain`/`eleLoss` stats that may be useful beyond just sparklines.

2. **Where to place the `<symbol id="shield-motif">` definition**
   - What we know: It must appear exactly once per HTML document. `BaseLayout.astro` is the only layout.
   - What's unclear: Whether to modify `BaseLayout.astro` directly or use a `ShieldMotif` component with a "define" mode
   - Recommendation: Add the hidden `<svg><defs><symbol>` block directly to `BaseLayout.astro` — it's the simplest approach and follows the single-layout architecture.

3. **Blossom color cycling in AnimatedDivider — use `@property` or simpler approach?**
   - What we know: CSS `@property` is Baseline 2024; the requirement says "blossom color cycling (CSS `@property`)". This IS a stated requirement in DEC-01.
   - What's unclear: Whether this means using `@keyframes` with `@property` for smooth color interpolation, or just using sequential `@keyframes` with color steps
   - Recommendation: Implement color cycling via `@property` as stated in DEC-01. Define `@property --blossom-hue: { syntax: "<color>"; inherits: false; initial-value: var(--color-gold-400); }` and animate it through the color families. Firefox support for `@property` itself is Baseline 2024 (July 2024), but without `animation-timeline: scroll()`, blossom color will cycle on a timer (not scroll-position-linked), which is fine for DEC-01. Note: `@property` animation in a `@keyframes` animation works in all modern browsers as of July 2024.

4. **`sector-elevations.json` content collection schema — simple or complex?**
   - What we know: `content.config.ts` uses Zod for all collections.
   - What's unclear: Does `elevationPoints` array need to be in the Zod schema (it's a nested array)?
   - Recommendation: Define a simple schema that validates the fields needed by `ElevationSparkline`. The nested `elevationPoints` array can be `z.array(z.object({ miles: z.number(), ele: z.number() }))`.

---

## Data Verification

All polyline outputs verified with live `route-data.json` (456 points, 101.98 miles) and `annotations.json` (7 sectors):

| Sector | Points | Ele Range | Polyline Quality |
|--------|--------|-----------|-----------------|
| sector-520 | 10 | 17m | Clear upward trend |
| sector-nf2266 | 11 | 20m | Clear descent |
| sector-bass-lake | 23 | 21m | Rolling hills visible |
| sector-nf2217 | 24 | 37m | Largest range, good profile |
| sector-nd2225 | 29 | 22m | Rolling profile |
| sector-doe-lake | 11 | 5m | Narrow range but visible |
| sector-rapid-river | 36 | 26m | Most detail, good profile |

All sectors have sufficient point density (10+ points) for a meaningful 100x30px sparkline.

---

## Sources

### Primary (HIGH confidence)

- Direct file inspection: `src/components/FloralDivider.astro` — current SVG structure for vine animation baseline
- Direct file inspection: `src/components/HeroSection.astro` — shield/arrowhead path `M20 2 L6 40 Q8 38 14 36 L18 50 L20 58 L22 50 L26 36 Q32 38 34 40 Z` within `g transform="translate(460, 260) scale(2)"`
- Direct file inspection: `src/components/ElevationProfile.astro` — IntersectionObserver pattern for lazy-init
- Direct file inspection: `src/components/RouteMap.astro` — `window.matchMedia('(prefers-reduced-motion: reduce)')` JS pattern
- Direct file inspection: `src/styles/global.css` — `@media (prefers-reduced-motion: reduce)` CSS pattern; all color tokens
- Direct file inspection: `src/components/RouteStats.astro` — `getEntry()` + `getCollection()` build-time data access pattern
- Direct file inspection: `src/content.config.ts` — registered collections (routeData, annotations), Zod schemas, `file()` loader from `public/data/`
- Direct file inspection: `scripts/pipeline.js` — pipeline step pattern; current 7-step sequence
- Direct file inspection: `scripts/resolve-annotations.js` — pipeline script template
- Live data computation: `public/data/route-data.json` (456 points) + `public/data/annotations.json` (7 sectors) — verified polyline coordinates for all sectors
- MDN: SVG `stroke-dashoffset` — draw-on animation technique
- MDN: SVG `pathLength` attribute — path length normalization to avoid `getTotalLength()`
- MDN: CSS `@media prefers-reduced-motion` — browser support (Baseline since January 2020)
- MDN: SVG `<symbol>` element — `viewBox`, `<use>`, `currentColor` inheritance (Baseline since July 2015)
- MDN: `SVGGeometryElement.getTotalLength()` — confirmed browser-only, requires DOM
- MDN: CSS `@property` — Baseline 2024 (July 2024)

### Secondary (MEDIUM confidence)

- MDN: `animation-timeline` — confirmed NOT baseline; Firefox lacks support as of early 2026
- WebSearch verification: CSS scroll-driven animations (Safari 26 June 2026; Firefox not yet) — confirms IntersectionObserver is correct choice
- Docs.astro.build: Content collections — confirmed `getCollection()` / `getEntry()` work in component frontmatter at build time
- WebSearch: `svg-path-properties` library — viable alternative to `getTotalLength()` for Node.js, but not needed given `pathLength="1"` approach

### Tertiary (LOW confidence)

- WebSearch: `pathLength="1"` as the canonical solution for dashoffset without `getTotalLength()` — multiple community sources confirm this pattern; not explicitly documented in official MDN pathLength page but follows directly from the normalization math

---

## Metadata

**Confidence breakdown:**
- Standard stack (no new packages): HIGH — verified against project constraints and available browser APIs
- pathLength="1" technique: HIGH — derived directly from MDN pathLength normalization formula
- IntersectionObserver pattern: HIGH — already used 3x in codebase with same pattern
- SVG symbol/use: HIGH — MDN Baseline widely available; same-document `<use href="#id">` confirmed
- Build-time polyline math: HIGH — computed and verified against all 7 live sectors
- Blossom color cycling via `@property`: MEDIUM — `@property` itself is Baseline 2024; specific animation interaction with `@keyframes` confirmed working but not directly verified in this codebase
- Pipeline script architecture: HIGH — mirrors existing pipeline scripts exactly
- `sector-elevations.json` content collection: MEDIUM — pattern established in project; Zod schema for nested arrays not explicitly verified

**Research date:** 2026-04-01
**Valid until:** Stable (all browser APIs are baseline or well-established). Re-check `animation-timeline` Firefox status if any timing slips past June 2026.
