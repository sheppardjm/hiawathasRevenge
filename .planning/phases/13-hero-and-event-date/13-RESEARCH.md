# Phase 13: Hero & Event Date - Research

**Researched:** 2026-03-31
**Domain:** Astro image optimization, hero section CSS patterns, LCP performance, full-width layout
**Confidence:** HIGH

## Summary

Phase 13 adds a full-viewport-width hero section with a dramatic route photo background and overlaid text (site name, tagline, event date). The phase has two primary challenges: (1) getting the hero image to load with proper LCP optimization (fetchpriority, srcset, no lazy-loading), and (2) building a full-width breakout section that works within the per-section container architecture Phase 12 established.

The critical architectural decision is where to store the hero image. All 54 route photos currently live in `public/images/` and are served as static files. Images in `public/` are **never processed by Astro** — no optimization, no srcset generation, no WebP conversion. To use Astro's `<Image>` or `<Picture>` components with automatic srcset, the selected hero photo must be moved to (or copied into) `src/assets/`. Alternatively, a hand-written `<img>` with a manually-authored `srcset` pointing to `public/images/` files can satisfy the LCP requirement with less build complexity. The manual `<img>` approach is the correct choice here: the photos already exist at full resolution in `public/images/`, there is no image processing pipeline to WebP (thumbs are in `public/thumbs/` as WebP but at thumbnail size), and adding a 2048×1536 image to `src/assets/` would trigger multi-width build-time processing that may be overkill for a single hero image.

The full-width breakout is already enabled by Phase 12 — `BaseLayout.astro` has no width constraint, and individual sections use `max-w-4xl mx-auto px-4`. A hero section simply omits that container class, making it naturally fill the full viewport width.

**Primary recommendation:** Use a hand-written `<img>` with `fetchpriority="high"` `loading="eager"` `decoding="async"` and a manually-authored `srcset` pointing to the existing `public/images/` files. The hero section is a new `HeroSection.astro` component added before the existing badge section in `index.astro`. The hero photo is selected by the implementer from the 4 landscape-orientation images (2048×1536) in the library.

## Standard Stack

No new dependencies. This phase uses only what is already installed.

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Tailwind CSS v4 | 4.2.2 | Hero layout, overlay, responsive text | Already installed; `@theme static` tokens available |
| Native HTML `<img>` | HTML5 | Hero image with `fetchpriority`, `srcset`, `sizes` | Images in `public/` cannot use Astro's Image component optimization; hand-written `<img>` gives full control |
| CSS custom properties | native | Color tokens for overlay tint, text colors | All `--color-*` tokens already defined in `global.css` |
| Astro component | 6.1.1 | `HeroSection.astro` new component | Follows existing component pattern |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `sharp` (dev dep, already installed) | Would handle image resizing if images were in `src/assets/` | Not needed for this approach |
| WebAIM contrast checker | Verify overlay + text color meets WCAG AA | Before finalizing overlay opacity |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-written `<img>` with manual srcset | Astro `<Image>` with `src/assets/` | Astro's Image requires moving photo to `src/assets/`, adds build-time image processing (generates multiple WebP widths). Overkill for a single hero from an existing library; manual srcset is simpler and sufficient |
| Astro `<Picture>` with formats=['avif','webp'] | Hand-written `<img>` | Requires moving image to `src/assets/`; Picture would auto-generate format variants which is a nice LCP win but adds complexity. Could revisit in a future polish phase |
| CSS `background-image` | `<img>` element | CSS background images are NOT automatically discovered by browser preload scanner, requiring a separate `<link rel="preload">` in the `<head>`. Using an `<img>` tag is simpler and LCP-optimal |
| `getImage()` API | Native `<img>` | `getImage()` works with `src/assets/` images and generates CSS-usable URLs; only needed if implementing CSS background approach |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── HeroSection.astro    # NEW: full-width hero with photo background + text overlay
│   ├── DonateCallout.astro  # existing
│   ├── RouteMap.astro       # existing
│   └── ...
├── pages/
│   └── index.astro          # MODIFY: import HeroSection, add before badge section
└── styles/
    └── global.css           # no changes needed
public/
└── images/
    └── [selected-hero].jpg  # existing photo, no move needed
```

### Pattern 1: Full-Width Hero with `<img>` Background Simulation

**What:** A `<section>` with `position: relative`, `overflow: hidden`, containing an absolutely-positioned `<img>` with `object-fit: cover` behind an overlay `<div>`, with content overlaid using `position: relative; z-index: 1`.

**When to use:** Hero sections where the image IS the background (vs. a decorative image beside text). This keeps the `<img>` in markup (LCP-discoverable by preload scanner) while appearing as a background.

**Example:**
```astro
---
// HeroSection.astro
// No imports needed — image is in public/
---

<section class="hero">
  <img
    class="hero-img"
    src="/images/[selected-hero]-2048x1536.jpg"
    srcset="
      /images/[selected-hero]-2048x1536.jpg 2048w
    "
    sizes="100vw"
    alt=""
    width="2048"
    height="1536"
    fetchpriority="high"
    loading="eager"
    decoding="async"
  />
  <div class="hero-overlay" aria-hidden="true"></div>
  <div class="hero-content">
    <h1 class="hero-title">Hiawatha's Revenge</h1>
    <p class="hero-tagline">A ride that tests your legs and rewards your soul.</p>
    <p class="hero-date">June 6, 2026</p>
  </div>
</section>

<style>
  .hero {
    position: relative;
    width: 100%;
    height: 100svh;    /* Use svh, not vh, for mobile toolbar handling */
    min-height: 480px; /* floor for very short mobile screens */
    overflow: hidden;
    display: flex;
    align-items: flex-end; /* content at bottom = most dramatic */
  }

  .hero-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    /* Gradient dark-to-transparent: bottom dark (text area) to top transparent */
    background: linear-gradient(
      to top,
      rgba(13, 26, 13, 0.85) 0%,
      rgba(13, 26, 13, 0.4) 50%,
      rgba(13, 26, 13, 0.1) 100%
    );
  }

  .hero-content {
    position: relative;
    z-index: 1;
    width: 100%;
    padding: 2rem;
    max-width: 64rem;
    margin: 0 auto;
  }
</style>
```

**Critical note on `alt=""`:** The hero image is decorative/atmospheric — the text content is in the overlay. Use `alt=""` (empty, not missing) to indicate presentational image. This is WCAG-correct.

### Pattern 2: Event Date Display in Hero

**What:** The event date "June 6, 2026" is displayed as a distinct element within the hero content area. Use a semantic element — `<time datetime="2026-06-06">` for machine-readability and SEO. Style distinctly from the h1/tagline (e.g., gold accent color, letter-spacing, smaller display font).

**Example:**
```astro
<p class="hero-event-label">Ride Date</p>
<time class="hero-date" datetime="2026-06-06">June 6, 2026</time>
```

### Pattern 3: Responsive Text Scaling with clamp()

**What:** Use CSS `clamp()` for fluid hero typography so text is readable at 375px, 768px, and 1280px without three separate breakpoints.

**Example:**
```css
.hero-title {
  font-size: clamp(2rem, 6vw, 4.5rem);
  /* 2rem at 375px, 4.5rem at 750px+, fluid in between */
}

.hero-date {
  font-size: clamp(1.25rem, 3vw, 2rem);
}
```

### Pattern 4: srcset for the Hand-Written `<img>` Approach

**What:** Since the hero photo is already at 2048×1536 in `public/images/`, and there's only one size available, the `srcset` initially points only to that one source. The `sizes="100vw"` tells the browser this image renders at full viewport width. If multiple sizes were generated (e.g., via the scripts pipeline), `srcset` would list them.

**Practical note:** With only 2048w available, browsers will always load the 2048px source. This is a known limitation of the approach. The LCP requirement is met via `fetchpriority="high"` and `loading="eager"`. If build-time resizing is desired, the script pipeline (`scripts/pipeline.js`) could generate a 1200w version.

**Example (single source):**
```html
<img
  src="/images/hero.jpg"
  srcset="/images/hero.jpg 2048w"
  sizes="100vw"
  fetchpriority="high"
  loading="eager"
  decoding="async"
  width="2048"
  height="1536"
  alt=""
/>
```

### Anti-Patterns to Avoid

- **`loading="lazy"` on hero image:** Never. This delays the LCP image. Default is `eager` for images above fold; be explicit.
- **CSS `background-image` without `<link rel="preload">`:** The browser preload scanner cannot discover CSS background images. Using `<img>` in markup is simpler and automatically discovered.
- **Missing `width` and `height` attributes:** Without explicit dimensions on the `<img>`, the browser cannot reserve space, causing Cumulative Layout Shift (CLS).
- **`100vh` for hero height on mobile:** Mobile browser toolbars (URL bar, nav) eat into `100vh`, causing the hero to extend below the fold. Use `100svh` (small viewport height) instead. Add `min-height: 480px` as a floor for old browsers that don't support `svh`.
- **Multiple `fetchpriority="high"` images:** The attribute is most effective on exactly ONE image per page — the single highest-priority LCP candidate. Setting it on multiple images cancels out the benefit.
- **`decoding="sync"` without `priority`:** Sync decoding blocks the main thread. Use `decoding="async"` unless using Astro's `priority` prop (which sets `decoding="sync"` as part of a coordinated bundle with eager loading and high fetchpriority).
- **Hardcoded overlay rgba colors:** Use `var(--color-forest-950)` with opacity functions, or define an overlay-specific token. The forest-950 value is `#0d1a0d` = rgb(13,26,13).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive image widths from `public/` | Custom script to resize 2048px original into 800px, 1200px, 1600px variants | Existing `scripts/pipeline.js` already runs `sharp` — add a hero resize step there if multiple widths are needed | Don't add a standalone script; extend the existing pipeline |
| Text contrast verification | Manual eyeballing | WebAIM contrast checker against the actual overlay color | Overlay color + gradient means contrast depends on overlay opacity; test the actual darkest overlay rgb value against cream-100 |

**Key insight:** The hardest part of this phase is not writing code — it is selecting the right hero photo and tuning the overlay so text is readable across all three breakpoints. Budget time for visual QA.

## Common Pitfalls

### Pitfall 1: Hero Photo Selection Blocker

**What goes wrong:** Phase 13 cannot be implemented without a hero photo selected. The 54-photo library has 4 landscape-orientation images (2048×1536) and 50 portrait-orientation (1536×2048 or narrower). Portrait images will display poorly as full-width hero backgrounds because their narrow width creates visible upscaling/cropping artifacts on widescreen displays.

**Why it happens:** The photo pipeline generates images from GPS track captures — most are portrait shots taken vertically. Only 4 are landscape.

**How to avoid:** The implementer must select from the 4 landscape images:
- `irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536.jpg`
- `iU0rfyHu6xWrBRL3fhhcd3T1rNdhu9iNWV5gVDwDNbQ-2048x1536.jpg`
- `ozWsaD5fbt9Ql81EN4mrKWdDPZRUjEhRtW2a-rA8pz0-2048x1536.jpg`
- `uehdzvb4t9NxBDD02kCd53JLSdn1A6INGoMoqm9lJfA-2048x1536.jpg`

These are located at `/Users/Sheppardjm/Repos/hiawathasRevenge/public/images/`. The plan must include a step to open and review these 4 images and choose the most dramatic route photo.

**Warning signs:** If the hero looks stretched or blurry at 1280px wide, a portrait image was used.

### Pitfall 2: `100vh` Mobile Viewport Bug

**What goes wrong:** The hero section extends below the visible mobile viewport because `100vh` on mobile equals the full height including browser chrome (URL bar, navigation). The event date may not be visible "within the first viewport on mobile (375px)."

**Why it happens:** iOS Safari and Chrome Android measure `100vh` as the max viewport (toolbar hidden), not the actual visible area.

**How to avoid:** Use `height: 100svh` (small viewport height unit). Fall back: `@supports not (height: 100svh) { height: 100vh; }`.

**Warning signs:** On mobile Chrome/Safari, content appears cut off at bottom of hero.

### Pitfall 3: Text Readability Across Images

**What goes wrong:** A semi-transparent overlay that looks fine on a dark forest image may make text unreadable if a bright sky area appears in the hero.

**Why it happens:** Natural photos have unpredictable luminance variation. A single flat overlay rarely produces ≥4.5:1 contrast everywhere.

**How to avoid:** Use a gradient overlay that is darkest at the bottom (where text lives) and lighter at top. Pattern: `linear-gradient(to top, rgba(13,26,13,0.85) 0%, rgba(13,26,13,0.1) 100%)`. Test with `object-position` to control which part of the photo shows.

**Warning signs:** Text passes contrast testing in one browser viewport but fails in another because `object-position` shifts which photo area is visible.

### Pitfall 4: LCP Not Triggered by Hero Image

**What goes wrong:** The `<img>` tag is in the component but renders below a large above-fold element (the existing badge section), so the browser considers the badge/shield SVG to be the LCP element — not the hero photo.

**Why it happens:** LCP is measured on the largest rendered element in the viewport. If the badge SVG renders at large size before the image paints, it becomes the LCP candidate.

**How to avoid:** The hero section must come FIRST in `index.astro`, before the existing badge section. The existing badge becomes a secondary section below the fold.

**Warning signs:** PageSpeed Insights shows LCP element is not the hero image.

### Pitfall 5: Missing `<link rel="preload">` for WebP Sources

**What goes wrong:** When using Astro's `<Picture>` component with WebP format, the browser selects the WebP `<source>` but the preload scanner does not preload it (it processes `<source>` elements, but requires correct `imagesrcset`/`imagesizes` on the preload link).

**Why it happens:** The `<picture>/<source>` pattern adds complexity to preloading.

**How to avoid:** Using a plain `<img>` with srcset avoids this entirely. If `<Picture>` is used, add a corresponding `<link rel="preload" as="image" imagesrcset="..." imagesizes="100vw">` in the `<head>` slot of BaseLayout.

### Pitfall 6: alt Attribute Accessibility

**What goes wrong:** Setting `alt` to a meaningful description on a decorative background-style image causes screen readers to announce it as content when it is purely atmospheric.

**How to avoid:** `alt=""` (empty string, NOT missing). An empty `alt` tells screen readers this image is presentational. Never omit `alt` entirely — that is an accessibility violation. The text content in the overlay (site name, tagline, date) is the real content.

## Code Examples

Verified patterns from official sources and web.dev:

### LCP-Optimized Hero `<img>` Tag
```html
<!-- Source: web.dev/articles/optimize-lcp + Astro docs -->
<img
  src="/images/hero-2048x1536.jpg"
  srcset="/images/hero-2048x1536.jpg 2048w"
  sizes="100vw"
  alt=""
  width="2048"
  height="1536"
  fetchpriority="high"
  loading="eager"
  decoding="async"
/>
```

### Event Date with Semantic `<time>` Element
```html
<!-- Machine-readable date for SEO + accessibility -->
<time datetime="2026-06-06" class="hero-date">June 6, 2026</time>
```

### Full-Width Hero Section (No Container)
```astro
<!-- In index.astro — hero goes BEFORE max-w-4xl sections, has NO container -->
<HeroSection />

<!-- Existing sections retain their containers -->
<section class="max-w-4xl mx-auto px-4 pt-8 ...">
  <!-- badge, donate, etc. -->
</section>
```

### Gradient Overlay for Readability
```css
/* Source: web best practices for text-over-image contrast */
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(13, 26, 13, 0.85) 0%,   /* forest-950 at 85% = darkest at bottom */
    rgba(13, 26, 13, 0.40) 50%,   /* mid-fade */
    rgba(13, 26, 13, 0.10) 100%   /* near-transparent at top */
  );
}
```

### Mobile Viewport Height Fix
```css
/* Source: CSS Working Group / MDN - svh = small viewport height */
.hero {
  height: 100svh;
  min-height: 480px; /* floor for old browsers */
}

@supports not (height: 100svh) {
  .hero {
    height: 100vh;
  }
}
```

### Fluid Hero Typography
```css
/* Readable at 375px, 768px, 1280px without breakpoints */
.hero-title {
  font-size: clamp(1.875rem, 5vw + 0.5rem, 4rem);
  /* 30px at 375px → fluid → 64px at 1280px+ */
}
.hero-tagline {
  font-size: clamp(1rem, 2.5vw, 1.5rem);
}
.hero-date {
  font-size: clamp(1.25rem, 3vw, 2rem);
  font-family: var(--font-display);
  color: var(--color-gold-500); /* passes WCAG AA on forest-950 overlay */
  letter-spacing: 0.08em;
}
```

### HeroSection component slot for head preload (if Picture is used)
```astro
<!-- BaseLayout.astro already has <slot /> in body -->
<!-- For preload: use Astro's <head> slot or add directly to BaseLayout if needed -->
<!-- Simplest: just use <img> with fetchpriority="high" — no preload link needed -->
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `100vh` for full-screen sections | `100svh` (small viewport height) | CSS WG 2023, broad support 2024+ | Fixes mobile toolbar cut-off on iOS Safari and Chrome Android |
| `rel=preload` for LCP images | `fetchpriority="high"` on `<img>` (simpler) | Widely supported 2023+ | Eliminates the preload link complexity when image is in HTML markup |
| CSS `background-image` for hero | `<img>` with `object-fit: cover` | Best practice since 2022 | Better LCP (preload scanner discovers `<img>` in markup automatically) |
| Fixed breakpoint font sizes | `clamp()` fluid typography | CSS 2020+ | Eliminates 3 breakpoints for hero text |
| `@theme` (default) | `@theme static` | Phase 12 (this project) | All CSS custom properties always emitted to `:root` |

**Deprecated/outdated:**
- `loading="lazy"` on above-fold images: never correct; modern browsers are aggressive about lazy-loading delaying LCP
- Separate `<link rel="preload">` for `<img>` in markup: unnecessary when `fetchpriority="high"` is set directly on the `<img>` tag

## Open Questions

1. **Hero photo selection — not resolvable by research agent**
   - What we know: 4 landscape images exist at `public/images/` at 2048×1536. These are the only viable candidates for a full-width hero.
   - What's unclear: Which of the 4 is the most "dramatic route photo"? This is an aesthetic decision requiring the actual files to be opened and reviewed.
   - Recommendation: The planning task must include a concrete step: "Open all 4 landscape images and select the most dramatic. Record the filename in the plan." Do not defer photo selection past the plan.

2. **srcset strategy with single-size source**
   - What we know: Only one resolution (2048×1536) exists per photo in `public/images/`. Thumbnails exist in `public/thumbs/` as WebP but are thumbnail-sized (unsuitable for hero).
   - What's unclear: Should the pipeline generate a 1200w or 800w intermediate for bandwidth savings on mobile?
   - Recommendation: For Phase 13, proceed with single-size `srcset`. If bandwidth on mobile 4G is a concern in verification, add a pipeline step to generate a 1200w WebP as a follow-up. The LCP target is about time-to-display, not just file size — `fetchpriority="high"` has more impact than srcset width selection on simulated 4G.

3. **Badge section fate**
   - What we know: The existing badge/shield SVG + tagline section is currently the first `<section>` in `index.astro`. Phase 13 adds a hero section BEFORE it.
   - What's unclear: Does the badge section need to be modified, visually adjusted, or removed? The requirements only specify adding the hero — the badge may become a secondary below-fold element.
   - Recommendation: Keep the badge section as-is. The hero delivers the emotional first impression; the badge section becomes a secondary brand element below the fold. If it looks redundant (tagline appears in both hero and badge), address in Phase 15 (Editorial Content).

## Sources

### Primary (HIGH confidence)
- Astro official docs: https://docs.astro.build/en/guides/images/ — Image component, public/ limitations, src/assets import pattern, `priority` prop, `layout` prop, `widths`/`sizes` props
- Astro official API reference: https://docs.astro.build/en/reference/modules/astro-assets/ — Full prop list for `<Image>`, `<Picture>`, and `getImage()`
- web.dev/articles/optimize-lcp — `fetchpriority="high"`, preload links, lazy-loading anti-pattern, CSS background vs `<img>` for LCP
- addyosmani.com/blog/fetch-priority/ — fetchpriority="high" performance impact, "up to 4-30% LCP improvement", one-image-per-page guidance
- Codebase inspection: `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `src/styles/global.css`, `public/images/` directory listing

### Secondary (MEDIUM confidence)
- WebSearch findings confirmed by Astro docs: `priority` prop sets `loading="eager"` + `decoding="sync"` + `fetchpriority="high"` as a coordinated bundle
- SVH viewport unit: MDN and CSS Working Group specification, confirmed via WebSearch (multiple credible sources agree)

### Tertiary (LOW confidence)
- Specific LCP timing benchmarks on simulated 4G: The 2.5s target is from web.dev spec; whether a 2048px JPEG loads under 2.5s on simulated 4G depends on file size (typically 500KB-2MB for this library), which was not directly measured

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all tools already installed and documented
- Architecture patterns: HIGH — verified against Astro docs and existing codebase patterns
- Pitfalls: HIGH — based on official Astro docs (public/ limitation), web.dev (LCP), and direct codebase inspection (landscape images, existing component structure)
- Photo selection: LOW (aesthetic judgment, not researchable)

**Research date:** 2026-03-31
**Valid until:** 2026-05-01 (Astro stable, Tailwind v4 stable — no breaking changes expected in 30 days)
