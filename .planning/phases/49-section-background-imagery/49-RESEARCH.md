# Phase 49: Section Background Imagery - Research

**Researched:** 2026-04-08
**Domain:** CSS ::before full-bleed backgrounds, IntersectionObserver, sharp image processing
**Confidence:** HIGH

---

## Summary

Phase 49 extends the established Phase 47 (v1.8) pattern to two new sections: Route Map (`#route`) and Gallery (`#gallery`). The core CSS/JS infrastructure is fully reusable — the same `::before` pseudo-element pattern, `data-bg-fade` IntersectionObserver toggle, and `prefers-reduced-motion` guard used in `HiawathaExplainer.astro` applies directly. No new JavaScript infrastructure is needed.

The implementation has two distinct tasks: (1) extend `process-inspiration-bg.js` with two new image entries and run it to produce `route-bg.webp` and `gallery-bg.webp` in `public/thumbs/inspiration/`, and (2) add `position: relative`, `data-bg-fade`, and `::before` CSS to the Route Map and Gallery sections in `index.astro`. The light-mode overrides must be scoped to `#route` and `#gallery` selectors using `:global()` in `index.astro`.

One open question: the "morel woodcut" image filename (`gallery-bg` source) is not recorded in any existing planning document. The "topo arrowheads" filename is confirmed as `original-21cf144750c04b7d07af135578e70983.webp`. The morel woodcut source must be identified before the script can be extended.

**Primary recommendation:** Add `data-bg-fade` to the `#route` and `#gallery` sections in `index.astro`, add scoped `::before` CSS with `:global()`, extend `process-inspiration-bg.js` with the two new entries, run the script, then verify with `npm run build`.

---

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| CSS `::before` pseudo-element | Browser native | Background image layer that does not affect text | Established pattern from Phase 47 — already deployed on HiawathaExplainer |
| `left: 50%; width: 100vw; transform: translateX(-50%)` | Browser native | Full-bleed breakout from constrained container | Phase 47 decision — `inset: 0` only fills container; this escapes max-w constraints |
| `filter: sepia(80%) saturate(20%) brightness(0.6)` | Browser native | Desaturate/darken image for dark-mode overlay | Same filter values as History section |
| IntersectionObserver with `data-bg-fade` / `bg-visible` | Browser native | Scroll-triggered fade | JS already in `HiawathaExplainer.astro` observes ALL `[data-bg-fade]` elements globally |
| `@media (prefers-reduced-motion: reduce)` | Browser native | Static low-opacity background, no transition | Same CSS block structure as History section |
| `@media (prefers-color-scheme: light)` | Browser native | Light-mode opacity and filter adjustments | Same pattern as History section |
| `sharp` v0.34.5 | Already installed | Process source images to WebP | Already used by `process-inspiration-bg.js` |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `process-inspiration-bg.js` | Project script | Batch-convert inspiration images to 1200px WebP | Add 2 new entries; run manually with `node scripts/process-inspiration-bg.js` |
| Astro scoped `<style>` with `:global()` | Astro 6.x | Apply CSS to elements rendered by child components | Required for sections whose content is rendered by child components like RouteMap/PhotoGallery |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `::before` in `index.astro` `<style>` | Dedicated wrapper component | Wrapper adds a file; inline style block reuses the established pattern with minimal indirection |
| Manual script run | Add to pipeline.js | Script currently NOT in pipeline by design; images change infrequently. Keep manual to avoid re-processing on every build |

**Installation:** No new packages needed. `sharp` is already installed.

---

## Architecture Patterns

### Recommended Project Structure

No new files beyond the 2 new WebP outputs:

```
public/
└── thumbs/
    └── inspiration/
        ├── poem-bg.webp     (exists — History section)
        ├── forest-bg.webp   (exists — History section)
        ├── ride-bg.webp     (exists — History section)
        ├── route-bg.webp    (NEW — Route Map section)
        └── gallery-bg.webp  (NEW — Gallery section)

src/
├── pages/
│   └── index.astro          (MODIFIED — add ::before CSS + section attributes)
└── scripts/
    └── process-inspiration-bg.js  (MODIFIED — add 2 new IMAGES entries)
```

### Pattern 1: Full-Bleed ::before on Container-Constrained Sections

**What:** Route Map and Gallery sections each sit inside a `max-w-4xl` inner div. The `::before` uses the full-bleed breakout trick to escape that constraint.

**Critical detail:** The `::before` is applied to the outer `<section>` element (which is `w-full` and has no max-width), NOT to the inner `div.max-w-4xl`. The section already spans full viewport width.

**HTML structure (current, index.astro):**
```html
<section data-reveal id="route" class="w-full py-[--spacing-block]">
  <div class="max-w-4xl mx-auto px-4">
    <h2 ...>Explore the Route</h2>
    <RouteMap />
  </div>
</section>

<section id="gallery" class="w-full py-[--spacing-block]">
  <div class="max-w-4xl mx-auto px-4">
    <h2 ...>Photos</h2>
    <PhotoGallery />
  </div>
</section>
```

**Required HTML change:** Add `data-bg-fade` to each section element:
```html
<section data-reveal data-bg-fade id="route" class="w-full py-[--spacing-block]">
<section data-bg-fade id="gallery" class="w-full py-[--spacing-block]">
```

**Since the section is already `w-full`**, the `::before` can use `inset: 0` (not the `left: 50%; width: 100vw` trick). The section IS the full-width element. Verify: `w-full` means `width: 100%` of its parent — which in this case is the `<main>` or `<body>` at full viewport width.

**CSS pattern (in index.astro `<style>`):**
```css
/* Route Map and Gallery: ::before background image system */
/* Matching Phase 47 History section pattern */

/* Both sections need position: relative for ::before to fill them */
:global(#route),
:global(#gallery) {
  position: relative;
}

/* Base ::before rule */
:global(#route)::before,
:global(#gallery)::before {
  content: '';
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
  z-index: 0;
  filter: sepia(80%) saturate(20%) brightness(0.6);
}

/* Content children must be above ::before layer */
:global(#route) > *,
:global(#gallery) > * {
  position: relative;
  z-index: 1;
}

/* Fade in when IntersectionObserver adds bg-visible */
:global(#route.bg-visible)::before,
:global(#gallery.bg-visible)::before {
  opacity: 0.08;
}

/* Per-section image assignment */
:global(#route)::before {
  background-image: url('/thumbs/inspiration/route-bg.webp');
}

:global(#gallery)::before {
  background-image: url('/thumbs/inspiration/gallery-bg.webp');
}

/* prefers-reduced-motion: static backgrounds, no transition */
@media (prefers-reduced-motion: reduce) {
  :global(#route)::before,
  :global(#gallery)::before {
    transition: none;
    opacity: 0.04;
  }
}

/* Light-mode: higher brightness, lower opacity */
@media (prefers-color-scheme: light) {
  :global(#route)::before,
  :global(#gallery)::before {
    filter: sepia(80%) saturate(15%) brightness(1.2);
  }
  :global(#route.bg-visible)::before,
  :global(#gallery.bg-visible)::before {
    opacity: 0.12;
  }
}
```

### Pattern 2: IntersectionObserver Reuse (JS Already Works — Zero Changes)

**What:** The IntersectionObserver in `HiawathaExplainer.astro`'s `<script>` block observes `document.querySelectorAll('[data-bg-fade]')`. This is a document-wide query — it observes ALL `[data-bg-fade]` elements on the page, not just those inside HiawathaExplainer.

**Key insight:** Adding `data-bg-fade` to the `#route` and `#gallery` sections is sufficient. The JS will automatically pick them up. No JS changes needed anywhere.

**Verified from HiawathaExplainer.astro:**
```javascript
// Source: src/components/HiawathaExplainer.astro lines 552-563
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const sections = document.querySelectorAll('[data-bg-fade]');
  if (sections.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle('bg-visible', entry.isIntersecting);
      });
    }, { threshold: 0.15 });
    sections.forEach(section => observer.observe(section));
  }
}
```

### Pattern 3: process-inspiration-bg.js Extension

**What:** Add 2 new entries to the `IMAGES` array in `process-inspiration-bg.js`, then run the script.

**Current IMAGES array (3 entries for History section):**
```javascript
const IMAGES = [
  { src: 'original-0224278e4cf61770e3df248f5cd1f4bb.webp', out: 'poem-bg.webp', ... },
  { src: 'original-f146e847f065e9e9058869f6bd59733d.webp', out: 'forest-bg.webp', ... },
  { src: 'original-0ac1226989a12b196feeb9b3f9f6b47e.webp', out: 'ride-bg.webp', ... },
];
```

**Required additions:**
```javascript
  { src: 'original-21cf144750c04b7d07af135578e70983.webp', out: 'route-bg.webp', label: 'route-map section (topo arrowheads)' },
  { src: '[MOREL_WOODCUT_FILENAME]', out: 'gallery-bg.webp', label: 'gallery section (morel woodcut)' },
```

**Run command:**
```bash
/Users/Sheppardjm/.volta/bin/node scripts/process-inspiration-bg.js
```

### Anti-Patterns to Avoid

- **Applying `::before` to `div.max-w-4xl` instead of `section`:** The inner div is constrained; `::before` with `inset: 0` on the inner div would only fill the constrained width. The `<section>` elements are already `w-full`.
- **Using `inset: 0` on a container-constrained element:** If for any reason the `::before` is on an element inside `max-w-4xl`, use the `left: 50%; width: 100vw; transform: translateX(-50%)` breakout trick (Phase 47 pattern). For the `<section>` element itself, `inset: 0` works.
- **Forgetting `:global()` in index.astro scoped `<style>`:** Without `:global()`, Astro's scoped `[data-astro-cid-xxx]` attribute won't match `#route` or `#gallery` — the CSS silently does nothing.
- **Forgetting `z-index: 1` on section children:** The `::before` at `z-index: 0` (or default auto) with `position: absolute` will overlay content unless children are positioned with `z-index: 1`. The `div.max-w-4xl` inside each section needs `position: relative; z-index: 1`.
- **Adding `process-inspiration-bg.js` to pipeline.js:** It is intentionally not in the pipeline. Images change rarely; adding it would re-process on every build unnecessarily.
- **Writing `background-image` CSS before images exist in `public/`:** Always run the script first, then verify files exist, before writing the CSS.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image format conversion | Custom ffmpeg/imagemagick call | `sharp` via `process-inspiration-bg.js` | Already implemented; consistent with existing pipeline |
| Scroll detection | Manual scroll event listener | Existing `[data-bg-fade]` + IntersectionObserver | JS already in HiawathaExplainer.astro works globally |
| Reduced-motion guard | New JS check | Existing JS guard in HiawathaExplainer.astro | Query is global; already covers new sections |
| Light/dark mode toggle | JS class toggle | `@media (prefers-color-scheme: light)` CSS | Established project pattern (Phase 47) |

**Key insight:** The entire scroll-trigger and reduced-motion infrastructure is already deployed. Zero JS changes are needed. This phase is CSS + image processing only.

---

## Common Pitfalls

### Pitfall 1: Morel Woodcut Filename Unknown

**What goes wrong:** The requirements specify "morel woodcut" as the Gallery section background, but no planning document records which `original-*.webp` filename this corresponds to. Running the script with an unknown filename causes a `SKIP` log line and no `gallery-bg.webp` is produced.

**Why it happens:** The 49 inspiration images have opaque hashed filenames. The "topo arrowheads" filename was previously documented in the v1.2-gaps plan. The "morel woodcut" was not.

**How to avoid:** Before running the script, visually identify the correct source image. The `images/inspiration/` directory contains the source files. The implementer must visually inspect the webp files to find the morel woodcut. A one-liner to preview dimensions: `node -e "import('sharp').then(({default: s}) => s('images/inspiration/original-XXXXX.webp').metadata().then(console.log))"`.

**Warning signs:** `SKIP:` in script output indicates the file wasn't found. `gallery-bg.webp` absent from `public/thumbs/inspiration/` after running script.

### Pitfall 2: :global() Scoping Required for index.astro CSS

**What goes wrong:** `<style>` in Astro components is scoped via a `data-astro-cid-xxx` attribute. CSS selectors without `:global()` won't match `#route` or `#gallery` because those IDs are on the DOM elements but the scoping attribute doesn't get applied to them.

**Why it happens:** Astro scoping works by adding a `[data-astro-cid-xxx]` selector to every rule. `#route::before` becomes `#route[data-astro-cid-xxx]::before` — but the `<section>` element may not have that attribute unless Astro decides to add it.

**How to avoid:** Use `:global(#route)::before` and `:global(#gallery)::before` for the pseudo-element rules. Use `:global(#route)` for `position: relative`. Test that the backgrounds actually appear — if CSS is silently not applied, check if `:global()` was omitted.

**Warning signs:** Background images never appear despite having `bg-visible` class on the element. DevTools shows no `::before` pseudo-element.

### Pitfall 3: z-index Layering Conflict

**What goes wrong:** The `::before` pseudo-element with `position: absolute` sits in the stacking context. Without explicit `z-index` ordering, it may render over the section content (map tiles, gallery photos).

**Why it happens:** `position: absolute` creates a new stacking context layer. Without `z-index`, stacking order follows DOM order; `::before` appears before children but depends on stacking context behavior.

**How to avoid:** Set `z-index: 0` on `::before` and `z-index: 1` on the inner `div.max-w-4xl`. This is the same approach used in HiawathaExplainer where `.subsection-bg > * { z-index: 1 }`.

**Warning signs:** Map controls, photo thumbnails, or Leaflet layers appear to show background image bleeding through.

### Pitfall 4: Leaflet Map z-index Interference

**What goes wrong:** Leaflet sets its own z-index values on map layers. The `::before` background at low z-index should be behind map, but if the `<section>` creates a new stacking context (via `position: relative`), Leaflet's internal z-indexes may be affected.

**Why it happens:** Setting `position: relative` on `#route` creates a stacking context. Leaflet's tiles use `z-index: 200`, controls use `z-index: 1000`. These are relative to the Leaflet map container, not the `<section>`. The `::before` at `z-index: 0` on `#route::before` is in the section's stacking context — it should be behind the map div, which has its own stacking context.

**How to avoid:** The `::before` (`z-index: 0`) on the `<section>` is behind the `div.max-w-4xl` (`z-index: 1`) which contains the Leaflet map. The map's internal z-indexes are relative to the map container, not the section. This should not conflict. If visual issues appear during UAT, the nuclear option is `z-index: -1` on `::before` and removing `position` from the section (using `position: fixed` as alternative).

**Warning signs:** Map tiles disappear or sector panel displays behind the background image.

### Pitfall 5: Script Not in Pipeline — Must Be Run Manually Before Build

**What goes wrong:** `npm run build` runs `pipeline.js`, which does NOT include `process-inspiration-bg.js`. If the script hasn't been run, `route-bg.webp` and `gallery-bg.webp` won't exist, and the CSS `background-image: url('/thumbs/inspiration/route-bg.webp')` will silently fail (no error, just no background).

**Why it happens:** The script is intentionally outside the pipeline (images change rarely).

**How to avoid:** Run `node scripts/process-inspiration-bg.js` before `npm run build`. Verify output: `ls public/thumbs/inspiration/` should show 5 files (3 existing + 2 new).

---

## Code Examples

### process-inspiration-bg.js: Complete Updated IMAGES Array

```javascript
// Source: scripts/process-inspiration-bg.js (extend existing IMAGES array)
const IMAGES = [
  // Existing 3 entries (History section — DO NOT MODIFY)
  {
    src: 'original-0224278e4cf61770e3df248f5cd1f4bb.webp',
    out: 'poem-bg.webp',
    label: 'poem-section (Ojibwe motifs/symbols grid)',
  },
  {
    src: 'original-f146e847f065e9e9058869f6bd59733d.webp',
    out: 'forest-bg.webp',
    label: 'forest-section (Bogcore nature pattern)',
  },
  {
    src: 'original-0ac1226989a12b196feeb9b3f9f6b47e.webp',
    out: 'ride-bg.webp',
    label: 'ride-section (Stylized native profile silhouette)',
  },
  // New 2 entries for Phase 49 (Route Map + Gallery sections)
  {
    src: 'original-21cf144750c04b7d07af135578e70983.webp',
    out: 'route-bg.webp',
    label: 'route-map section (topo arrowheads)',
  },
  {
    src: '[MOREL_WOODCUT_FILENAME_TBD]',
    out: 'gallery-bg.webp',
    label: 'gallery section (morel woodcut)',
  },
];
```

### index.astro: HTML Attribute Additions

```html
<!-- Route Map section: add data-bg-fade -->
<section data-reveal data-bg-fade id="route" class="w-full py-[--spacing-block]">

<!-- Gallery section: add data-bg-fade -->
<section data-bg-fade id="gallery" class="w-full py-[--spacing-block]">
```

### index.astro: Complete CSS Block Addition

```css
/* Source: Extends Phase 47 ::before pattern from HiawathaExplainer.astro */
/* Add to index.astro <style> block */

/* Phase 49: Route Map + Gallery section background image system */
/* Sections are w-full — ::before with inset: 0 fills full viewport width */

:global(#route),
:global(#gallery) {
  position: relative;
}

:global(#route)::before,
:global(#gallery)::before {
  content: '';
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
  z-index: 0;
  filter: sepia(80%) saturate(20%) brightness(0.6);
}

/* Section content stays above ::before layer */
:global(#route) > *,
:global(#gallery) > * {
  position: relative;
  z-index: 1;
}

/* IntersectionObserver in HiawathaExplainer.astro toggles bg-visible on ALL [data-bg-fade] elements */
:global(#route.bg-visible)::before,
:global(#gallery.bg-visible)::before {
  opacity: 0.08;
}

/* Per-section image URLs */
:global(#route)::before {
  background-image: url('/thumbs/inspiration/route-bg.webp');
}

:global(#gallery)::before {
  background-image: url('/thumbs/inspiration/gallery-bg.webp');
}

/* prefers-reduced-motion: static backgrounds, no transition */
@media (prefers-reduced-motion: reduce) {
  :global(#route)::before,
  :global(#gallery)::before {
    transition: none;
    opacity: 0.04;
  }
}

/* Light-mode: higher brightness filter, slightly higher opacity */
@media (prefers-color-scheme: light) {
  :global(#route)::before,
  :global(#gallery)::before {
    filter: sepia(80%) saturate(15%) brightness(1.2);
  }

  :global(#route.bg-visible)::before,
  :global(#gallery.bg-visible)::before {
    opacity: 0.12;
  }
}
```

### Verification Commands

```bash
# 1. Run image processing script
/Users/Sheppardjm/.volta/bin/node scripts/process-inspiration-bg.js

# 2. Confirm both new images exist
ls public/thumbs/inspiration/
# Expected: forest-bg.webp  gallery-bg.webp  poem-bg.webp  ride-bg.webp  route-bg.webp

# 3. Build
npm run build

# 4. Verify CSS in built output
grep -r "route-bg\|gallery-bg" dist/ | head -5

# 5. Verify data-bg-fade attributes
grep "data-bg-fade" src/pages/index.astro
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Remington paintings from /thumbs/historical/ | Ojibwe inspiration images from /thumbs/inspiration/ | Phase 47 final implementation | Culturally consistent with site narrative |
| `inset: 0` for ::before fill | `left: 50%; width: 100vw; transform: translateX(-50%)` in Phase 47 PLAN (now superseded) | Phase 47 debug (history-bg-paintings.md) | For sections that ARE w-full, `inset: 0` is correct; breakout trick needed only for constrained containers |
| No section backgrounds on Route Map/Gallery | scroll-triggered ::before backgrounds | Phase 49 (this phase) | Matches History section visual treatment |

**Note on inset vs full-bleed breakout:** The Phase 47 implementation in `HiawathaExplainer.astro` uses `left: 50%; width: 100vw; transform: translateX(-50%)` because `.subsection-bg` elements are children of `max-w-5xl`. The Route Map and Gallery `<section>` elements are NOT inside a max-width container — they are direct children of the layout and are `w-full`. Therefore `inset: 0` is correct for Phase 49 and the breakout trick is not needed.

---

## Open Questions

1. **Morel woodcut filename**
   - What we know: The Gallery section should use a "morel woodcut" image. The topo arrowheads filename (`original-21cf144750c04b7d07af135578e70983.webp`) is confirmed from the v1.2-gaps plan. No planning document records the morel woodcut filename.
   - What's unclear: Which of the ~36 `original-*.webp` files in `images/inspiration/` is the morel woodcut.
   - Recommendation: The implementer must visually inspect the inspiration images. A quick approach: open the `images/inspiration/` directory in Finder/file browser, or use a quick script to read dimensions and render previews. If uncertain, fall back to `original-43d1a0faec435241903ca567d174e9d9.webp` or similar — but the correct file must be identified visually before committing.

2. **Leaflet z-index interaction under position: relative**
   - What we know: `position: relative` on `#route` creates a stacking context. Leaflet manages its own internal z-indexes.
   - What's unclear: Whether Leaflet's tiles/controls remain properly layered when the containing `<section>` gains `position: relative` and a `::before` layer.
   - Recommendation: Test in browser during implementation. The `::before` at `z-index: 0` is behind `div.max-w-4xl` at `z-index: 1`, which contains the Leaflet map. Leaflet's internal z-indexes are within that container's stacking context. This should not conflict. If it does, set `z-index: -1` on `::before` and remove `position: relative` from `#route` (keeping it only on the inner max-w-4xl div).

---

## Sources

### Primary (HIGH confidence)

- `src/components/HiawathaExplainer.astro` — direct inspection of complete ::before CSS system and IntersectionObserver JS (lines 178-563)
- `src/pages/index.astro` — direct inspection of Route Map (`#route`) and Gallery (`#gallery`) section structure
- `scripts/process-inspiration-bg.js` — direct inspection of complete script, IMAGES array, and sharp pipeline
- `scripts/pipeline.js` — confirmed `process-inspiration-bg.js` is NOT in the build pipeline
- `public/thumbs/inspiration/` — confirmed directory exists with 3 images (poem-bg, forest-bg, ride-bg)
- `images/inspiration/` — confirmed 49 source images present including `original-21cf144750c04b7d07af135578e70983.webp`
- `.planning/phases/v1.2-gaps/v1.2-gaps-01-PLAN.md` — confirmed topo arrowheads filename
- `.planning/STATE.md` — confirmed Phase 47 decisions: full-bleed breakout pattern, Ojibwe Option A, CSS scoping approach
- `.planning/REQUIREMENTS.md` — confirmed BG-01 through BG-07 requirements

### Secondary (MEDIUM confidence)

- MDN Web Docs: `::before` with `position: absolute` — confirmed `inset: 0` fills positioned ancestor
- MDN Web Docs: Stacking context — confirmed `position: relative` creates stacking context

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all tools already in use
- Architecture: HIGH — direct codebase inspection; pattern already deployed in Phase 47
- Pitfalls: HIGH — derived from code inspection and Phase 47 debug artifacts
- Morel woodcut filename: LOW — not recorded in any document; requires visual identification

**Research date:** 2026-04-08
**Valid until:** 2026-10-08 (stable browser APIs, no external dependencies)
