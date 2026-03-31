# Technology Stack

**Project:** Hiawatha's Revenge v1.1 Visual Redesign
**Researched:** 2026-03-31
**Scope:** Stack additions and CSS techniques for visual redesign features ONLY
**Confidence:** HIGH for CSS techniques; MEDIUM for native CSS masonry (browser support evolving)

## Context

The v1.0 stack is validated and stable (see v1.0 STACK.md, 2026-03-30). This document covers ONLY what is needed for the v1.1 visual redesign features. The core stack (Astro 6, Tailwind 4, Leaflet, Chart.js, PhotoSwipe, sharp) does not change.

**Key constraint:** This is a static site with no JS frameworks. Every technique below must work with vanilla CSS/JS inside Astro `<script>` blocks. No React, no Vue, no Svelte components.

---

## New Stack Additions

### Zero New Dependencies

**The v1.1 redesign requires NO new npm packages.** Every feature can be implemented with CSS techniques already available in Tailwind 4 + modern CSS + vanilla JavaScript. This is the single most important finding of this research.

| Feature | Implementation | New Library Needed? |
|---------|---------------|-------------------|
| Masonry gallery | CSS `columns` (Tailwind `columns-*` utilities) | NO |
| Full-width hero | CSS `object-fit` + gradient overlay | NO |
| Slide-out detail panel | HTML `<dialog>` + CSS `@keyframes` + vanilla JS | NO |
| SVG decorative patterns | Inline SVG `<pattern>` / CSS `background-image` data URIs | NO |
| Color palette evolution | Tailwind `@theme` custom properties | NO |
| Editorial layout | CSS Grid `grid-template-areas` + `float` + `shape-outside` | NO |
| Drop caps | CSS `::first-letter` (+ `initial-letter` where supported) | NO |

---

## Feature-by-Feature Technical Specification

### 1. Masonry Gallery Layout

**Recommendation: CSS `columns` with Tailwind utilities. Do NOT use native CSS masonry.**

#### Why CSS Columns, Not Native Grid Masonry

Native CSS masonry has been through years of specification debate. As of March 2026:

| Approach | Status | Global Support | Production Ready? |
|----------|--------|---------------|-------------------|
| `display: grid-lanes` (new spec) | Working Draft | 0.02% (Safari 26.4+ only) | NO |
| `grid-template-rows: masonry` (old spec) | Superseded by grid-lanes | Firefox flag only | NO |
| CSS `columns` + `break-inside: avoid` | Stable standard | 99%+ | YES |

Source: [Can I Use - CSS Grid Lanes](https://caniuse.com/css-grid-lanes) -- 0.02% global support as of March 2026. Chrome 140+ and Firefox 77+ have it behind flags. Only Safari 26.4+ ships it enabled. This is not viable for production.

#### Implementation with Tailwind 4

Tailwind 4 ships `columns-*` and `break-inside-*` utilities that map directly to the CSS columns approach:

```html
<!-- Responsive masonry gallery -->
<div class="columns-2 gap-2 sm:columns-3 lg:columns-4">
  <div class="break-inside-avoid mb-2">
    <a href="/images/photo.jpg" data-pswp-width="1536" data-pswp-height="2048">
      <img src="/thumbs/photo.webp" alt="" loading="lazy" class="w-full rounded" />
    </a>
  </div>
  <!-- More items... -->
</div>
```

**Tailwind utilities used (all built-in, no config needed):**

| Utility | CSS Output | Purpose |
|---------|-----------|---------|
| `columns-2` | `columns: 2` | 2-column layout on mobile |
| `sm:columns-3` | `columns: 3` at 640px+ | 3 columns on tablet |
| `lg:columns-4` | `columns: 4` at 1024px+ | 4 columns on desktop |
| `gap-2` | `column-gap: 0.5rem` | Gutter between columns |
| `break-inside-avoid` | `break-inside: avoid-column` | Prevent image splitting across columns |
| `mb-2` | `margin-bottom: 0.5rem` | Vertical spacing between items |

**Browser support:** Universal. CSS `columns` is supported in all browsers since IE10.

**Limitation to document:** CSS columns flow content top-to-bottom per column (not left-to-right across rows). Photo ordering will be column-first, not row-first. For a photo gallery this is acceptable -- photos will still group geographically when sorted by mile marker. If strict left-to-right reading order is required later, a JS-based solution like CSS Grid with explicit `grid-row` placement would be needed, but this adds complexity for marginal benefit.

**PhotoSwipe integration:** No changes needed. PhotoSwipe reads `<a>` elements from the gallery container. Changing the layout CSS from `grid` to `columns` does not affect the DOM structure or PhotoSwipe's initialization.

**Featured photos:** Add `featured: boolean` to `photos.json`. Featured photos render at native aspect ratio (removing `aspect-square object-cover`) and get prominent placement. All photos now show at natural aspect ratio instead of square crops -- the masonry layout accommodates mixed sizes inherently.

#### Confidence: HIGH
CSS columns is a mature, universally-supported technique. Tailwind 4 utilities are verified in official documentation.

---

### 2. Full-Width Hero Image Section

**Recommendation: `<img>` with `object-cover` + absolute-positioned gradient overlay + text. Break out of the `max-w-4xl` container.**

#### Breaking the Container

The current `BaseLayout.astro` wraps all content in:
```html
<main class="max-w-4xl mx-auto px-4 py-8">
```

The hero section must break out of this container to be full-width. Two approaches:

**Option A (Recommended): Move hero OUTSIDE `<main>`**
```html
<body>
  <section class="relative h-[70vh] min-h-[400px] w-full overflow-hidden">
    <!-- Hero content -->
  </section>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <!-- Everything else -->
  </main>
</body>
```

**Option B: Negative margin breakout**
```css
.hero-full-width {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
}
```

Option A is cleaner -- it does not fight the container. Requires restructuring `BaseLayout.astro` to support a named slot or moving hero markup before `<main>`.

#### Hero Image Technique

```html
<section class="relative h-[70vh] min-h-[400px] w-full overflow-hidden">
  <!-- Background image -->
  <img
    src="/images/hero-landscape.webp"
    alt="Hiawatha National Forest trail through morning mist"
    class="absolute inset-0 w-full h-full object-cover"
    loading="eager"
    decoding="async"
  />
  <!-- Gradient overlay for text legibility -->
  <div class="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/40 to-transparent"></div>
  <!-- Text content -->
  <div class="absolute inset-0 flex flex-col items-center justify-end pb-12 text-center">
    <!-- Badge + title + date -->
  </div>
</section>
```

**Tailwind utilities used (all built-in):**

| Utility | Purpose |
|---------|---------|
| `relative` / `absolute inset-0` | Stacking context for image + overlay + text |
| `h-[70vh] min-h-[400px]` | Viewport-relative height with minimum |
| `object-cover` | Image fills container, crops overflow |
| `bg-gradient-to-t` | Bottom-to-top gradient |
| `from-forest-950/90 via-forest-950/40 to-transparent` | Dark at bottom (text area), transparent at top (image visible) |

**Why `<img>` not `background-image`:** Semantic HTML. The hero photo has alt text. `<img>` works with Astro's image optimization pipeline. `object-cover` on an `<img>` gives identical visual results to `background-size: cover` but with better semantics and optimization potential.

**Responsive behavior:** On mobile, `h-[70vh]` still works. Consider `md:h-[80vh]` for larger viewports. The image crops via `object-cover` -- select a hero photo where the subject is centered so cropping works in both portrait and landscape viewports. Use `object-position` if the focal point is off-center: `object-[center_30%]`.

**Performance:** Mark hero image `loading="eager"` (not lazy) since it is above the fold and part of LCP.

#### Confidence: HIGH
All techniques are standard CSS with universal browser support. Tailwind gradient utilities are documented and tested.

---

### 3. Slide-Out Detail Panel (Map Sector Interactions)

**Recommendation: HTML `<dialog>` element with CSS keyframe animation + vanilla JS `showModal()` / `close()`. No library needed.**

#### Why `<dialog>`

| Approach | Pros | Cons |
|----------|------|------|
| HTML `<dialog>` + `showModal()` | Built-in focus trapping, backdrop, Escape key, accessibility | Requires JS to open/close |
| CSS-only (`:target` or `:checked`) | Zero JS | No focus trapping, accessibility issues, URL hash pollution |
| Custom div + JS | Full control | Must implement focus trapping, Escape key, aria-modal, backdrop manually |

`<dialog>` is the clear winner. It provides free accessibility (focus trap, Escape to close, `aria-modal` automatic, screen reader announcements) with 96.86% global browser support. Source: [Can I Use - Dialog](https://caniuse.com/dialog).

#### Slide-Out Pattern

Override `<dialog>` default centering to position it as a right-side panel:

```css
dialog.sector-panel {
  /* Override UA defaults */
  position: fixed;
  inset: 0 0 0 auto; /* top right bottom left -- pin to right edge */
  height: 100vh;
  max-height: 100vh;
  width: min(400px, 85vw); /* 400px or 85% viewport on mobile */
  margin: 0;
  padding: 0;
  border: none;
  border-left: 2px solid var(--color-forest-700);
  background: var(--color-forest-900);
  color: var(--color-cream-100);
  overflow-y: auto;
}

/* Backdrop */
dialog.sector-panel::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

/* Slide-in animation */
dialog.sector-panel[open] {
  animation: panel-enter 250ms ease-out;
}

@keyframes panel-enter {
  from { translate: 100% 0; }
  to { translate: 0 0; }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  dialog.sector-panel[open] {
    animation: none;
  }
}
```

#### Smooth Close Animation with `@starting-style`

The challenge: `<dialog>` disappears instantly on `close()` because `display` changes from `block` to `none`. CSS `@starting-style` enables smooth exit transitions.

**Browser support for `@starting-style`:** 89% global. Chrome 117+, Edge 117+, Firefox 129+, Safari 17.5+. Source: [Can I Use - @starting-style](https://caniuse.com/mdn-css_at-rules_starting-style).

```css
/* Entry state for smooth open */
@starting-style {
  dialog.sector-panel[open] {
    translate: 100% 0;
    opacity: 0;
  }
  dialog.sector-panel[open]::backdrop {
    opacity: 0;
  }
}

/* Open state */
dialog.sector-panel[open] {
  translate: 0 0;
  opacity: 1;
  transition: translate 250ms ease-out,
              opacity 250ms ease-out,
              overlay 250ms allow-discrete,
              display 250ms allow-discrete;
}

dialog.sector-panel[open]::backdrop {
  opacity: 1;
  transition: opacity 250ms ease-out,
              overlay 250ms allow-discrete,
              display 250ms allow-discrete;
}

/* Closed state (for exit transition) */
dialog.sector-panel {
  translate: 100% 0;
  opacity: 0;
  transition: translate 250ms ease-in,
              opacity 250ms ease-in,
              overlay 250ms allow-discrete,
              display 250ms allow-discrete;
}
```

**Fallback for older browsers:** Without `@starting-style`, the panel opens with the keyframe animation and closes instantly. This is acceptable degraded behavior -- the panel still functions, just without a smooth close.

#### Integration with Leaflet Map

The existing codebase uses `window.dispatchEvent(new CustomEvent(...))` for cross-component communication (e.g., `elevation:hover`, `map:photoClick`). The detail panel follows this same pattern:

```javascript
// In RouteMap.astro -- sector click handler
sectorPolyline.on('click', () => {
  window.dispatchEvent(new CustomEvent('map:sectorClick', {
    detail: { sectorId: sector.id, name: sector.name, difficulty: sector.difficulty, ... }
  }));
});

// In SectorPanel.astro -- listen and populate
window.addEventListener('map:sectorClick', (e) => {
  const panel = document.querySelector('dialog.sector-panel');
  // Populate panel content from e.detail
  panel.showModal();
});
```

This matches the existing event bus architecture. No new patterns introduced.

#### Confidence: HIGH
`<dialog>` has 96.86% support. `@starting-style` has 89% support (graceful degradation for the 11% without it). The vanilla JS pattern matches the existing CustomEvent architecture.

---

### 4. Ojibwe Woodland Floral Design Elements (CSS/SVG Patterns)

**Recommendation: Hand-crafted SVG patterns inspired by (not copying) woodland floral traditions, delivered as inline SVG `<pattern>` elements and CSS `background-image` data URIs.**

#### Cultural Sensitivity -- Critical Note

Ojibwe woodland floral beadwork is a living cultural tradition. Best practices from Indigenous design consultants:

1. **Create original designs inspired by the aesthetic vocabulary** (curved flowing stems, symmetrical floral forms, leaf and petal shapes) rather than directly copying specific traditional patterns
2. **Acknowledge the cultural source** in the site's content -- the route passes through Ojibwe homelands and the Hiawatha National Forest is named after Ojibwe cultural traditions (already documented in the existing narrative text)
3. **Avoid sacred or ceremonial symbols** -- stick to the secular floral/botanical vocabulary
4. **Consider consultation** with MBTN or local Ojibwe community members on appropriateness

The [Neebin Studios Anishinaabe Floral Set](https://neebin.com/design/floral_set/) is a free resource created by an Anishinaabe designer specifically for broader use, including digital applications. The SVG files from this set could serve as reference for creating site-specific decorative elements, or potentially be used directly with proper attribution.

Sources: [Neebin Studios](https://neebin.com/design/floral_set/), [Vincent Design - Best Practices in Indigenous Graphic Design](https://vincentdesign.ca/2021/03/08/considerations-and-best-practices-in-indigenous-design/), [Communication Arts - Decolonizing Native American Design](https://www.commarts.com/columns/decolonizing-native-american-design)

#### Technical Implementation

**Approach 1: SVG `<pattern>` for repeating borders/dividers**

Replace the current `topo-divider` (topographic contour lines) with a floral pattern:

```html
<!-- Define once in BaseLayout or a shared SVG defs block -->
<svg class="sr-only" aria-hidden="true">
  <defs>
    <pattern id="floral-border" x="0" y="0" width="120" height="40"
             patternUnits="userSpaceOnUse">
      <!-- Simplified floral motif path data here -->
      <path d="M60 5 C50 15, 40 10, 30 20 S20 30, 30 35 S50 30, 60 35
               S70 30, 80 35 S90 30, 80 20 S70 10, 60 5Z"
            fill="none" stroke="var(--color-amber-500)" stroke-width="1.5" opacity="0.5" />
    </pattern>
  </defs>
</svg>
```

**Approach 2: CSS `background-image` data URIs for section decorations**

Inline SVG in CSS, matching the existing `topo-divider` pattern:

```css
.floral-divider {
  height: 60px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><!-- floral path --></svg>');
  background-repeat: repeat-x;
  background-size: 120px 60px;
  opacity: 0.6;
}
```

This matches the exact technique already used for `.topo-divider` in `global.css` (line 157-163). No new patterns needed.

**Approach 3: CSS `mask-image` for decorative overlays on section backgrounds**

```css
.section-floral-accent {
  mask-image: url('data:image/svg+xml;utf8,<svg>...</svg>');
  mask-repeat: repeat;
  mask-size: 200px 200px;
}
```

CSS `mask-image` has 97%+ browser support with `-webkit-` prefix.

#### Performance Considerations

| Technique | Payload | Performance |
|-----------|---------|-------------|
| Inline SVG `<pattern>` | 0 HTTP requests, ~500B per pattern | Excellent -- renders immediately |
| CSS `background-image` data URI | 0 HTTP requests, ~500B-2KB per pattern | Excellent -- cached in CSS |
| External SVG file | 1 HTTP request per file | Good -- cacheable but extra request |
| PNG/raster pattern | Larger files, no scaling | Poor -- avoid |

**Recommendation:** Use data URI SVG in CSS (approach 2) for dividers and borders, matching the existing `topo-divider` precedent. Use inline SVG `<pattern>` (approach 1) for more complex decorative elements that need to reference theme colors via CSS custom properties.

#### Confidence: MEDIUM
The technical implementation is straightforward (HIGH confidence). Cultural sensitivity requires human judgment and potentially community consultation (MEDIUM confidence on appropriateness -- flag for review).

---

### 5. Color Palette Evolution

**Recommendation: Expand the `@theme` block in `global.css` with additional warm tones. Do NOT replace existing colors -- extend them.**

#### Additions to @theme

```css
@theme {
  /* === EXISTING (keep as-is) === */
  /* --color-forest-950 through --color-forest-600 */
  /* --color-amber-500 through --color-amber-300 */
  /* --color-rust-600, --color-rust-500 */
  /* --color-cream-100, --color-cream-200, --color-cream-50 */

  /* === NEW: Warmer accent family === */
  --color-berry-700: #7a2e3d;  /* deep berry for subtle accents */
  --color-berry-600: #9a3a4f;  /* primary berry red -- section accents, callout borders */
  --color-berry-500: #b34d63;  /* lighter berry for hover states */

  /* === NEW: Richer gold family (supplement amber) === */
  --color-gold-600: #b8860b;   /* dark goldenrod -- richer than amber-500 */
  --color-gold-500: #d4a017;   /* warm gold -- premium accent */
  --color-gold-400: #e6b422;   /* bright gold for highlights */

  /* === NEW: Lake/water blue (Ojibwe blue) === */
  --color-lake-700: #2c5282;   /* deep lake blue */
  --color-lake-600: #2b6cb0;   /* primary blue -- water references, links variant */
  --color-lake-500: #3182ce;   /* lighter blue for hover */

  /* === NEW: Deeper forest greens === */
  --color-forest-850: #243d24; /* between 900 and 800 -- card backgrounds */
  --color-moss-600: #6b7c3f;   /* warmer yellow-green -- nature accent */
}
```

**How Tailwind 4 @theme auto-generates utilities:**

When you define `--color-berry-600: #9a3a4f` inside `@theme`, Tailwind 4 automatically generates:
- `bg-berry-600`, `text-berry-600`, `border-berry-600`, `ring-berry-600`, etc.
- All responsive and state variants (`hover:bg-berry-600`, `md:text-berry-600`)
- No plugin or config file needed

This is verified behavior from the [Tailwind CSS v4 documentation](https://tailwindcss.com/docs/theme) -- "Theme variables aren't just CSS variables -- they also instruct Tailwind to create new utility classes."

#### Contrast Verification Required

All new colors must pass WCAG AA (4.5:1 for body text, 3:1 for large text) against the primary backgrounds:

| Color | Against `forest-950` (#0d1a0d) | Against `forest-900` (#1a2e1a) | Use Case |
|-------|-------------------------------|-------------------------------|----------|
| berry-600 (#9a3a4f) | Must verify | Must verify | Accent borders, callout highlights |
| gold-500 (#d4a017) | Must verify | Must verify | Premium accent, replacing some amber-500 uses |
| lake-600 (#2b6cb0) | Must verify | Must verify | Water references, alternate link color |

**Action item for implementation:** Run each new color through a contrast checker against `forest-950` and `forest-900`. Adjust lightness as needed to hit AA ratios. The specific hex values above are starting points -- the exact values may shift during implementation to meet contrast requirements.

#### Confidence: HIGH
Tailwind 4 `@theme` color extension is well-documented and verified. The exact hex values are design recommendations (will need visual review during implementation), but the mechanism is certain.

---

### 6. Editorial Photo-Integrated Content Layout

**Recommendation: CSS Grid with `grid-template-areas` for structured sections + CSS `float` with `shape-outside` for text-wrap effects. Use `::first-letter` for drop caps.**

#### Magazine-Style Section Layout

```html
<section class="editorial-section">
  <div class="grid md:grid-cols-[1fr_1.5fr] gap-8 items-start">
    <img src="/images/forest-trail.webp" alt="..." class="w-full rounded" />
    <div class="prose">
      <p class="first-letter:text-5xl first-letter:font-display first-letter:text-amber-500 first-letter:float-left first-letter:mr-2 first-letter:mt-1">
        In 1855, Henry Wadsworth Longfellow published...
      </p>
    </div>
  </div>
</section>
```

**Tailwind utilities for editorial grids (all built-in):**

| Utility | Purpose |
|---------|---------|
| `md:grid-cols-[1fr_1.5fr]` | Asymmetric 2-column grid (image narrower than text) |
| `md:grid-cols-[1.5fr_1fr]` | Alternating: text wider, image right |
| `gap-8` | Generous whitespace between columns |
| `items-start` | Top-align grid children (prevent image stretching) |

#### Text Wrapping with `shape-outside`

For inline photos within prose sections:

```css
.editorial-inset-photo {
  float: right;
  width: 45%;
  margin: 0 0 1rem 1.5rem;
  shape-outside: inset(0); /* Text wraps around the rectangle */
}

/* For circular crop photos */
.editorial-round-photo {
  float: left;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  margin: 0 1.5rem 1rem 0;
  shape-outside: circle(50%); /* Text wraps around the circle */
  object-fit: cover;
}
```

**Browser support for `shape-outside`:** 97.2% global. Chrome 37+, Edge 79+, Safari 7.1+, Firefox 62+. Source: [Can I Use - CSS Shapes Level 1](https://caniuse.com/css-shapes). This is production-ready.

#### Drop Caps

Two approaches, layered with progressive enhancement:

**Base approach -- `::first-letter` (universal support):**
```css
.editorial-drop-cap::first-letter {
  float: left;
  font-family: var(--font-display);
  font-size: 3.5em;
  line-height: 0.8;
  padding-right: 0.1em;
  color: var(--color-amber-500);
}
```

Tailwind 4 provides the `first-letter:` variant, so this can also be done inline:
```html
<p class="first-letter:float-left first-letter:text-5xl first-letter:font-display first-letter:text-amber-500 first-letter:leading-none first-letter:pr-1">
```

**Enhanced approach -- `initial-letter` (91% support, no Firefox):**
```css
@supports (initial-letter: 3) {
  .editorial-drop-cap::first-letter {
    initial-letter: 3; /* spans 3 lines */
    float: none; /* initial-letter handles positioning */
    margin-right: 0.2em;
  }
}
```

`initial-letter` automatically sizes and aligns the drop cap to span the specified number of text lines. Browser support: 91.38% (Chrome 110+, Safari 9+, Edge 110+ -- but NOT Firefox). Source: [Can I Use - CSS initial-letter](https://caniuse.com/css-initial-letter).

**Recommendation:** Use `::first-letter` with `float` as the base (works everywhere), with `@supports (initial-letter: 3)` as progressive enhancement. The base approach is sufficient -- `initial-letter` is a nice-to-have.

#### Pull Quotes / Typographic Callouts

For the Longfellow critique passages from `data.md`:

```html
<blockquote class="border-l-4 border-amber-500 pl-6 my-8 text-xl font-display text-cream-200 italic">
  "He has woven together their beautiful traditions into a whole..."
</blockquote>
```

All Tailwind utilities, no custom CSS needed.

#### Confidence: HIGH
CSS Grid, float, `::first-letter`, and `shape-outside` are all mature, universally-supported CSS. Tailwind 4 provides utilities for all of them.

---

## Full-Width Section Pattern (Shared)

Both the hero and editorial full-width photo sections need to break out of the `max-w-4xl` container. This requires a structural change to `BaseLayout.astro`.

**Recommendation: Introduce a slot-based layout system.**

```astro
<!-- BaseLayout.astro -->
<body class="min-h-screen bg-forest-900 text-cream-100 font-mono">
  <slot name="hero" /> <!-- Full-width, outside main container -->
  <main class="max-w-4xl mx-auto px-4 py-8">
    <slot /> <!-- Default slot, constrained width -->
  </main>
</body>
```

This allows full-width sections via `<section slot="hero">` while keeping all other content in the constrained container. An alternative is to use the negative margin breakout technique (`width: 100vw; margin-left: calc(-50vw + 50%)`) which avoids layout restructuring, but the slot approach is cleaner and more maintainable.

For mid-page full-width photo breaks in the editorial sections, the negative margin technique is appropriate since those cannot use a named slot.

---

## What NOT to Add

| Technology | Why NOT | Use Instead |
|------------|---------|-------------|
| Masonry.js / Isotope.js | 25KB+ JS library for a layout CSS handles natively via `columns`. Overkill for a photo gallery. | CSS `columns` + `break-inside-avoid` |
| CSS Grid masonry (`display: grid-lanes`) | 0.02% browser support. Only Safari 26.4+. Not production viable. | CSS `columns` |
| React/Vue/Svelte for slide-out panel | Massive overhead for a single interactive component. Breaks the vanilla-JS-islands pattern. | HTML `<dialog>` + vanilla JS |
| Framer Motion / GSAP for animations | Only the slide-out panel needs animation. CSS `@keyframes` + `@starting-style` handle this. | CSS animations |
| Lightbox replacement (e.g., GLightbox) | PhotoSwipe 5 is already integrated and working. The masonry layout change does not require a lightbox change. | Keep PhotoSwipe 5.4.4 |
| Icon library (Heroicons, Lucide) | The site uses inline SVG for all icons (map markers, badge). A library adds dependencies for 3-4 icons. | Hand-crafted inline SVG |
| Web font additions | National Park and Space Mono cover display and body. Adding more fonts increases payload and visual inconsistency. | Existing font stack |
| CSS-in-JS (Emotion, styled-components) | Incompatible with Astro's static extraction. Tailwind 4 CSS-first approach is the right tool. | Tailwind 4 `@theme` + utilities |
| Tailwind plugins (Typography, Forms) | The editorial layout needs custom prose styling, not the opinionated `@tailwindcss/typography` defaults. The site has no forms. | Custom CSS in `@layer base` / `@layer components` |

---

## Browser Support Summary

All techniques recommended in this document and their support status:

| Feature | Global Support | Minimum Browser | Graceful Fallback |
|---------|---------------|-----------------|-------------------|
| CSS `columns` | 99%+ | IE10+ | N/A -- universal |
| `break-inside: avoid` | 99%+ | IE10+ | N/A -- universal |
| `object-fit: cover` | 98%+ | Edge 16+ | N/A -- universal |
| CSS Grid `grid-template-areas` | 97%+ | All modern | N/A -- universal |
| `shape-outside` | 97.2% | Chrome 37+, FF 62+, Safari 7.1+ | Falls back to rectangular wrap |
| HTML `<dialog>` + `showModal()` | 96.86% | Chrome 37+, FF 98+, Safari 15.4+ | N/A -- target audience uses modern browsers |
| `::backdrop` pseudo-element | 96.86% | Same as `<dialog>` | No backdrop (functional, less polished) |
| `@starting-style` | 89% | Chrome 117+, FF 129+, Safari 17.5+ | Panel opens with animation, closes instantly |
| `initial-letter` | 91.38% | Chrome 110+, Safari 9+ (NOT Firefox) | `::first-letter` + `float` fallback |
| CSS `translate` property | 95%+ | All modern (Baseline 2025) | Use `transform: translateX()` |
| `allow-discrete` transitions | ~89% | Same as `@starting-style` | Instant open/close without transition |

**No feature below 89% support.** All features at <95% have explicit fallbacks documented above.

---

## Integration with Existing Tailwind 4 @theme System

All v1.1 additions integrate with the existing CSS-first configuration pattern:

**global.css additions:**
```css
@theme {
  /* ... existing tokens (unchanged) ... */

  /* v1.1: Warmer palette additions */
  --color-berry-700: #7a2e3d;
  --color-berry-600: #9a3a4f;
  --color-berry-500: #b34d63;
  --color-gold-600: #b8860b;
  --color-gold-500: #d4a017;
  --color-gold-400: #e6b422;
  --color-lake-700: #2c5282;
  --color-lake-600: #2b6cb0;
  --color-lake-500: #3182ce;
  --color-forest-850: #243d24;
  --color-moss-600: #6b7c3f;

  /* v1.1: Editorial typography additions */
  --font-size-6xl: 3.75rem;  /* hero title */
  --font-size-7xl: 4.5rem;   /* hero title on desktop */

  /* v1.1: Shadow additions */
  --shadow-hero: 0 4px 30px rgba(0, 0, 0, 0.4);  /* hero overlay shadow */
}

@layer components {
  /* v1.1: Floral divider (replaces or supplements topo-divider) */
  .floral-divider {
    height: 60px;
    background-image: url('data:image/svg+xml;utf8,<svg ...>...</svg>');
    background-repeat: repeat-x;
    background-size: 120px 60px;
    opacity: 0.6;
  }

  /* v1.1: Sector panel dialog overrides */
  .sector-panel { /* ... dialog styles ... */ }
}
```

**No changes to existing `@layer` structure.** The `@layer leaflet, base, components, utilities` order in `global.css` is preserved. New component styles go in `@layer components`. New base styles go in `@layer base`.

---

## Sources

### Verified (HIGH confidence)
- [Tailwind CSS v4 - Theme Variables](https://tailwindcss.com/docs/theme) -- `@theme` auto-generates utility classes from custom properties
- [Tailwind CSS v4 - Columns](https://tailwindcss.com/docs/columns) -- `columns-*` and `break-inside-*` utilities confirmed in official docs
- [Can I Use - HTML Dialog](https://caniuse.com/dialog) -- 96.86% global support
- [Can I Use - CSS @starting-style](https://caniuse.com/mdn-css_at-rules_starting-style) -- 89% global support
- [Can I Use - CSS Shapes Level 1](https://caniuse.com/css-shapes) -- 97.2% global support for `shape-outside`
- [Can I Use - CSS initial-letter](https://caniuse.com/css-initial-letter) -- 91.38% partial support (no Firefox)
- [Can I Use - CSS Grid Lanes](https://caniuse.com/css-grid-lanes) -- 0.02% support, not production viable
- [Ben Nadel - Dialog Element as Fly-out Sidebar](https://www.bennadel.com/blog/4862-opening-the-dialog-element-as-a-fly-out-sidebar.htm) -- `<dialog>` sidebar pattern with CSS keyframe animation
- [MDN - Dialog Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) -- authoritative `<dialog>` documentation

### Cross-Referenced (MEDIUM confidence)
- [CSS-Tricks - Masonry Layout is Now grid-lanes](https://css-tricks.com/masonry-layout-is-now-grid-lanes/) -- spec history, grid-lanes syntax evolution
- [WebKit - Introducing CSS Grid Lanes](https://webkit.org/blog/17660/introducing-css-grid-lanes/) -- Safari implementation details
- [Smashing Magazine - How to Build a Magazine Layout with CSS Grid Areas](https://www.smashingmagazine.com/2023/02/build-magazine-layout-css-grid-areas/) -- editorial grid patterns
- [LogRocket - Animating dialog and popover with @starting-style](https://blog.logrocket.com/animating-dialog-popover-elements-css-starting-style/) -- `@starting-style` animation patterns
- [DevToolbox - CSS @starting-style Complete Guide 2026](https://devtoolbox.dedyn.io/blog/css-starting-style-guide) -- current `@starting-style` usage patterns

### Cultural References
- [Neebin Studios - Anishinaabe Floral Set](https://neebin.com/design/floral_set/) -- free Anishinaabe floral SVG set, created by Anishinaabe designer for broad use
- [Vincent Design - Best Practices in Indigenous Graphic Design](https://vincentdesign.ca/2021/03/08/considerations-and-best-practices-in-indigenous-design/) -- cultural sensitivity guidelines
- [Communication Arts - Decolonizing Native American Design](https://www.commarts.com/columns/decolonizing-native-american-design) -- principles for respectful use

---

*Stack research for: Hiawatha's Revenge v1.1 Visual Redesign*
*Researched: 2026-03-31*
*Previous version: v1.0 stack research dated 2026-03-30 -- core stack unchanged*
