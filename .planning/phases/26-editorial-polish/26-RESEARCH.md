# Phase 26: Editorial Polish - Research

**Researched:** 2026-04-02
**Domain:** CSS typography (drop-caps, web fonts), CSS parallax (background-attachment, IntersectionObserver fade), image skeleton loaders (CLS prevention), section whitespace, SVG cultural motifs
**Confidence:** HIGH

## Summary

Phase 26 has five distinct workstreams: (1) section spacing increase, (2) pull quote drop-cap redesign using a classic serif, (3) scroll-driven background fade for editorial sections, (4) route stats legibility fix, and (5) photo loading skeletons. A sixth workstream adds three or more Native American design elements using the project's existing inline SVG approach.

The codebase is well-prepared for most of this work. Drop-caps already exist in `HiawathaExplainer.astro` using `::first-letter` with `--font-display` (National Park sans-serif). Phase 26 needs to replace that with a classic serif — EB Garamond is the correct choice: it is on Google Fonts, it offers weights 400–800 in both normal and italic styles, and Astro's Font API already loads fonts via `fontProviders.google()` in `astro.config.ts`. No new build tooling is needed; just add EB Garamond to `astro.config.ts` and update the `::first-letter` CSS.

The parallax requirement (VIS-04) requires careful implementation. `background-attachment: fixed` is the obvious CSS tool, but it has a critical mobile bug: iOS Safari 13+ recognizes the property but applies no effect, and Samsung Internet does not support it at all. The correct approach for this project is an **IntersectionObserver-based opacity fade** — the same primitive already used in `AnimatedDivider.astro` and `ScrollReveal.astro`. Sections get a `position: relative` background image layer (`::before` pseudo-element or a dedicated `<div>`) that transitions `opacity: 0 → 1` when the section enters the viewport and `1 → 0` when it exits. This is not technically parallax (no position offset), but it satisfies the requirement as written: "fixed-position background image that fades in and out as the user scrolls past." The IntersectionObserver approach is compositor-safe, works on all mobile browsers, and requires zero new dependencies.

Route stats legibility is a bug caused by a CSS cascade conflict. The `.amber-section :global(span)` rule in `index.astro` forces `color: forest-900 (#1a2e1a)` on all spans inside the amber section, including `.stat-value` and `.stat-label` elements in `RouteStats.astro`. Those spans sit on `.stat-card` elements with `background: forest-800 (#2d4a2d)` — dark text on a dark green background. The fix is to remove `RouteStats` from the amber section context, or to add targeted overrides that restore appropriate colors on stat-card elements.

**Primary recommendation:** Use EB Garamond for the drop-cap `::first-letter`. Use IntersectionObserver opacity fade (not `background-attachment: fixed`) for editorial section backgrounds. Fix route stats legibility by moving the stats section off the amber background or overriding the stat-card colors explicitly. Use `img.complete` + `load` event for photo skeleton loaders. New cultural motifs should be inline SVG components using the existing `--color-*` palette tokens.

---

## Standard Stack

No new npm dependencies required for this phase.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| EB Garamond (Google Fonts) | Variable 400–800 | Classic serif for drop-cap `::first-letter` | Available via Astro Font API; satisfies "Garamond" requirement in VIS-02; weights 400–800 in normal + italic |
| CSS `::first-letter` | Web Platform (Baseline) | Drop-cap styling | Already used in `HiawathaExplainer.astro`; supports `font-family`, `font-size`, `color`, `float`, `padding` |
| `IntersectionObserver` | Web Platform (Baseline 2019+) | Background fade in/out on scroll | Already used in `AnimatedDivider.astro` and `ScrollReveal.astro`; zero cost |
| CSS `opacity` transition | Web Platform | Background image fade effect | Compositor-only — no repaint triggered |
| `img.complete` + `load` event | Web Platform (Baseline) | Detect image load to remove skeleton | Handles both cached and freshly-loaded images |
| CSS `@keyframes` shimmer | Web Platform | Shimmer animation on skeleton placeholders | Pure CSS; `background-position` animation on linear-gradient |
| Inline SVG in `.astro` files | N/A | New cultural motif components | Already used for `FloralDivider.astro`, `AnimatedDivider.astro`, `ShieldMotif.astro` |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| Astro `fontProviders.google()` | Load EB Garamond via Astro Font API | Adding to `astro.config.ts` |
| CSS `aspect-ratio` + `width`/`height` attrs on `<img>` | Reserve layout space to prevent CLS | Required if photos.json dimensions are missing from `<img>` elements |
| CSS `@media (prefers-reduced-motion: reduce)` | Disable skeleton shimmer and background fades | Already established pattern in codebase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| EB Garamond | Cormorant Garamond | Both are on Google Fonts; EB Garamond is more faithful to historical Garamond; Cormorant is more decorative/display-oriented. Either satisfies VIS-02. EB Garamond preferred for body-text drop-caps. |
| EB Garamond | Adobe Caslon (not on Google Fonts) | Adobe Caslon is not available via Google Fonts — would require self-hosting or Adobe Fonts subscription. EB Garamond is the correct substitute. |
| IntersectionObserver opacity fade | `background-attachment: fixed` | Fixed attachment doesn't work on iOS Safari 13+ or Samsung Internet. IO fade is fully cross-platform. |
| IntersectionObserver opacity fade | CSS `animation-timeline: scroll()` | Firefox does not support `animation-timeline` — deferred to v1.3 per prior project decision |
| JS skeleton loader | CSS-only `loading="lazy"` + `aspect-ratio` | CSS-only approach prevents layout shift but does not produce a visible shimmer. JS approach adds shimmer animation and visible loading state. Either satisfies PERF-01 if no layout shift occurs. |

**Installation:** No new packages. Add EB Garamond to `astro.config.ts` fonts array only.

---

## Architecture Patterns

### Recommended File Structure

```
astro.config.ts                # MODIFY: add EB Garamond font entry
src/styles/global.css          # MODIFY: add --font-garamond variable + spacing token increase
src/components/
├── HiawathaExplainer.astro    # MODIFY: update ::first-letter to Garamond, add parallax bg, section padding
├── PhotoGallery.astro         # MODIFY: add skeleton loader CSS + JS
├── OjibweBorderPattern.astro  # NEW: repeating geometric border pattern motif
├── TurtleMotif.astro          # NEW (optional): turtle/Anishinaabe symbol
src/pages/index.astro          # MODIFY: section padding increase, RouteStats context fix
```

### Pattern 1: EB Garamond via Astro Font API

**What:** Add EB Garamond to `astro.config.ts` using the same `fontProviders.google()` pattern as Space Mono and National Park. Set `cssVariable: "--font-garamond"`. Reference in `::first-letter` CSS.

**When to use:** VIS-02 (drop-cap initial letter).

```typescript
// Source: astro.config.ts — existing pattern for Space Mono and National Park
{
  provider: fontProviders.google(),
  name: 'EB Garamond',
  cssVariable: '--font-garamond',
  weights: [400, 700],
  styles: ['normal', 'italic'],
}
```

```css
/* src/styles/global.css — add alongside --font-mono and --font-display */
--font-garamond: var(--font-eb-garamond, 'EB Garamond', 'Garamond', Georgia, serif);
```

```css
/* Updated drop-cap in HiawathaExplainer.astro */
.drop-cap::first-letter {
  font-family: var(--font-garamond);  /* Changed: was --font-display */
  font-size: 4.5rem;
  float: left;
  line-height: 0.8;
  padding-right: 0.5rem;
  padding-top: 0.15rem;
  color: var(--color-gold-500);
  text-shadow: 2px 3px 0px rgba(0, 0, 0, 0.3);
}
```

**Important:** Astro's Font API generates the CSS variable as `--font-{kebab-case-name}`, so `'EB Garamond'` becomes `--font-eb-garamond`. Verify this matches by checking the compiled output after adding the font.

### Pattern 2: IntersectionObserver Background Fade (Not `background-attachment: fixed`)

**What:** A full-bleed `::before` pseudo-element (or a `.section-bg` child `<div>`) with `background-image`, `position: absolute`, `inset: 0`, starting at `opacity: 0`. IntersectionObserver adds/removes a class that transitions opacity. The section container has `position: relative` and `overflow: hidden`.

**When to use:** VIS-04 (poem, forest, ride sections in HiawathaExplainer).

**Why not `background-attachment: fixed`:** iOS Safari 13+ recognizes the property but applies no effect (webkit bug). Samsung Internet doesn't support it. This approach renders it non-functional for roughly 50% of mobile users.

```css
/* Section container setup */
.hiawatha-section {
  position: relative;
  overflow: hidden;
}

/* Pseudo-element background layer */
.hiawatha-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/images/[forest-image].jpg');
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 1.2s ease-in-out;
  z-index: 0;
  pointer-events: none;
}

/* Fade in when entering viewport */
.hiawatha-section.bg-visible::before {
  opacity: 0.08; /* Low opacity — text remains legible */
}

/* Content above background */
.hiawatha-section > * {
  position: relative;
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .hiawatha-section::before {
    transition: none;
    opacity: 0.08; /* Show statically without fade */
  }
}
```

```javascript
// IntersectionObserver — NOT one-shot (must fade in AND out)
// Use threshold 0 so it fires both on entry and on exit
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    entry.target.classList.toggle('bg-visible', entry.isIntersecting);
  });
}, { threshold: 0 });

document.querySelectorAll('[data-bg-fade]').forEach(el => {
  sectionObserver.observe(el);
});
```

**Key distinction from ScrollReveal:** ScrollReveal observers disconnect after first trigger (one-shot). The background fade observer must NOT disconnect — it needs to toggle the class both entering and leaving the viewport.

### Pattern 3: Section Padding Increase (VIS-01)

**What:** Increase `--spacing-block` from `2rem` to `4rem` globally, or use per-section overrides with `py-16` (Tailwind) or `py-[4rem]` for sections that need more breathing room.

**Options:**
- A: Update `--spacing-section` and `--spacing-block` tokens in `global.css` globally
- B: Use `py-16` on specific sections instead of `py-[--spacing-block]`

**Recommendation:** Use per-section overrides (Option B) to avoid unintended side effects. The `HiawathaExplainer`, `RouteExplainer`, and `Photos` sections benefit most from more padding. Keep the spacing tokens for consistency elsewhere.

### Pattern 4: Route Stats Legibility Fix (VIS-05)

**Root cause:** `.amber-section :global(span)` in `index.astro` forces all spans in the amber section to `color: forest-900 (#1a2e1a)`. The `RouteStats` component's `.stat-value` and `.stat-label` spans sit on `.stat-card` cards with `background: forest-800 (#2d4a2d)`. This produces dark green text (#1a2e1a) on dark green background (#2d4a2d) — very low contrast.

**Fix options:**
1. **Remove RouteStats from amber-section context** — Move the Route Stats section off the amber background entirely. Put it on `bg-forest-800` or `bg-forest-950` like other content sections. Cleanest fix: no cascade fighting.
2. **Override stat-card colors in index.astro** — Add `.amber-section :global(.stat-card) span` rules to restore cream/amber colors specifically for stat cards.
3. **Override in RouteStats.astro using `!important`** — Works but is an anti-pattern.

**Recommendation:** Option 1. The amber section color was a Phase 21 addition for color variety. Route Stats' dark-on-dark contrast problem is an unintended side effect. Moving it to the dark forest background is the principled fix.

**Confirmed contrast values** (all against `forest-900` #1a2e1a):
- `cream-100` (#f5f0e8): ~14:1 — text-safe
- `amber-500` (#c8973e): ~5.4:1 — text-safe
- `forest-900` (#1a2e1a) on `forest-800` (#2d4a2d): ~1.2:1 — fails WCAG AA by wide margin

### Pattern 5: Photo Skeleton Loaders (PERF-01)

**What:** Each `.segment-hero img` and photo gallery `<img>` gets a CSS-animated shimmer background that disappears once the image loads. Three parts: (1) reserve space with correct `width`/`height` or `aspect-ratio`, (2) CSS shimmer animation on the container before load, (3) JS `load` + `complete` check removes the shimmer class.

**CLS prevention:** Images in the photo gallery already have dynamic dimensions extracted from filenames (e.g., `1536x2048`). These can be passed as `width` and `height` attributes on the `<img>` element — the browser uses them to pre-reserve layout space before the image loads, preventing CLS.

```css
/* Skeleton shimmer animation */
@keyframes skeleton-shimmer {
  0% { background-position: -800px 0; }
  100% { background-position: 800px 0; }
}

.skeleton-loading {
  background: linear-gradient(
    90deg,
    var(--color-forest-800) 25%,
    var(--color-forest-700) 50%,
    var(--color-forest-800) 75%
  );
  background-size: 800px 100%;
  animation: skeleton-shimmer 1.5s infinite linear;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-loading {
    animation: none;
    background: var(--color-forest-800);
  }
}
```

```javascript
// Apply to all gallery images
document.querySelectorAll('.skeleton-wrap img').forEach(img => {
  const wrap = img.closest('.skeleton-wrap');
  if (!wrap) return;
  if (img.complete) {
    wrap.classList.remove('skeleton-loading');
  } else {
    img.addEventListener('load', () => wrap.classList.remove('skeleton-loading'), { once: true });
    img.addEventListener('error', () => wrap.classList.remove('skeleton-loading'), { once: true });
  }
});
```

**Astro note:** The shimmer JS must run client-side in a `<script>` block. Since images have `loading="lazy"`, many will not be fetched until the user scrolls — the shimmer shows during their loading window.

### Pattern 6: Additional Native American Design Motifs (VIS-06)

**What:** Three or more new SVG decorative elements in section backgrounds, dividers, or decorative roles. Must be inspired by (not copied from) specific documented traditions.

**Existing motifs count:**
- `FloralDivider.astro` — bilateral diamond + chevron + arrowhead band (counts as 1)
- `AnimatedDivider.astro` (3 variants: floral, minimal, berry) — counts as 2-3 more
- `ShieldMotif.astro` — arrowhead/shield symbol (counts as 1)

The requirement "at least three additional" means three beyond what exists. Approach: create 1-2 new SVG components and use SVG `<pattern>` repeating tile elements as section backgrounds.

**Cultural sensitivity note (from project prior decisions):** No AI-generated cultural imagery. Design elements must be inspired by documented traditions and attributed correctly. The footer already carries the Ojibwe attribution statement. For Phase 26 motifs:
- Use geometric forms from woodland Ojibwe beadwork traditions (double curves, floral rosettes, bear paw tracks, turtle forms)
- **Avoid copying specific spiritual or ceremonial symbols** — stick to geometric decorative patterns
- Attribution in component comments, not in visible UI (the footer statement covers this)

**Recommended new motifs:**
1. **`OjibweWavePattern.astro`** — A repeating SVG `<pattern>` tile using a stylized wave/water form (Anishinaabe lake/water symbolism). Used as background texture on the `hiawatha-section` or `RouteExplainer` section.
2. **`BearPawDivider.astro`** — A horizontal band with bear paw print motifs (four-toed paw prints in bilateral rhythm, established decorative symbol in Great Lakes Indigenous art). Not ceremonial; widely used decoratively.
3. **Section background watermark** — A large, low-opacity `ShieldMotif` or diamond cluster used as a full-section watermark (similar to the existing footer watermark use of `ShieldMotif`).

**SVG pattern technique:**

```html
<!-- Repeating SVG pattern tile embedded in a component -->
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute">
  <defs>
    <pattern id="wave-pattern" x="0" y="0" width="60" height="30" patternUnits="userSpaceOnUse">
      <!-- Wave form inspired by Anishinaabe water symbolism -->
      <path d="M0 15 Q15 5 30 15 Q45 25 60 15" 
            fill="none" 
            stroke="var(--color-forest-700)" 
            stroke-width="1.5" />
    </pattern>
  </defs>
</svg>

<!-- Usage as section background -->
<svg class="section-bg-pattern" aria-hidden="true" role="presentation">
  <rect width="100%" height="100%" fill="url(#wave-pattern)" opacity="0.4" />
</svg>
```

### Anti-Patterns to Avoid

- **`background-attachment: fixed` for parallax:** Non-functional on iOS Safari 13+ and Samsung Internet. Do not use.
- **Loading EB Garamond for body text:** Load only the weights needed for drop-caps (400 italic + 700 normal). Do not make it the body font — `font-mono` remains the body font per design system.
- **`::first-letter` on inline or flex elements:** `::first-letter` only works on block containers. Ensure `<p class="drop-cap">` has `display: block` (paragraphs are block by default — no issue normally, but avoid `display: flex` or `display: grid` on drop-cap paragraphs).
- **One-shot IntersectionObserver for background fade:** The fade must work bidirectionally (fade in entering, fade out leaving). Do NOT call `obs.disconnect()` or `obs.unobserve()` on the background fade observer — it must keep watching.
- **Adding `::before` pseudo-element without `overflow: hidden` on parent:** If the section doesn't have `overflow: hidden`, the pseudo-element background may bleed outside the section boundary.
- **Applying skeleton shimmer to above-fold hero images:** HeroSection uses `loading="eager"` with `fetchpriority="high"` — no skeleton needed or wanted for LCP image.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Classic serif font | Custom font file or self-hosted | EB Garamond via Astro Font API | Already loaded and optimized by Astro's font pipeline |
| Mobile parallax | JS `scroll` event + `translateY` calculation | IntersectionObserver opacity fade | scroll listeners cause main-thread jank; IO fade achieves visual depth without position math |
| Image load detection | Polling `img.complete` in a loop | `img.complete` + `addEventListener('load')` | Combined check handles both cached and uncached images correctly without polling |
| Shimmer timing | `setTimeout`-based reveal | CSS `animation` + class removal on load | CSS animation is compositor-managed; JS only needed for the load event |

---

## Common Pitfalls

### Pitfall 1: EB Garamond CSS Variable Name Mismatch
**What goes wrong:** The Astro Font API converts the font name to a kebab-case CSS variable. `'EB Garamond'` becomes `--font-eb-garamond` (not `--font-garamond`). If you define `--font-garamond: var(--font-garamond)` (self-reference) or use the wrong variable name, drop-caps use a system serif fallback silently.
**Why it happens:** The variable name derivation is from the font's `name` field, not the `cssVariable` field — the `cssVariable` field IS the output variable name. Set `cssVariable: '--font-garamond'` explicitly.
**How to avoid:** Explicitly set `cssVariable: '--font-garamond'` in the astro.config.ts font entry, then use `var(--font-garamond)` in CSS. Check the built HTML to confirm the `@font-face` is present.
**Warning signs:** Drop-cap falls back to Georgia or Times New Roman instead of Garamond's characteristic long ascenders and sharp serifs.

### Pitfall 2: `::first-letter` on Paragraphs with Leading Punctuation
**What goes wrong:** If a `<p class="drop-cap">` starts with a quotation mark (`"` or `"`), the `::first-letter` selects the quote character, not the first letter. The oversized quotation mark looks broken.
**Why it happens:** `::first-letter` includes "typographic letter units" which in some browsers includes opening quotes.
**How to avoid:** Ensure all drop-cap paragraphs start directly with a letter. This is true for all current `.drop-cap` paragraphs in `HiawathaExplainer.astro` ("In 1855...", "Hiawatha was...", etc.).
**Warning signs:** Drop-cap shows an oversized opening quote instead of a letter.

### Pitfall 3: Background Fade Observer Never Fires Fade-Out
**What goes wrong:** The IntersectionObserver for the background fade uses `threshold: 0.5`. When the user scrolls past the section, the fade-out never fires because `isIntersecting` becomes `false` when < 50% is visible — but the callback only fires at the 50% mark, not at all. Wait: `isIntersecting` is false when the element transitions out at the threshold, so it does fire. The real problem: if `threshold: 0` is used but the section is taller than the viewport, `isIntersecting` is `true` for the entire scroll-through and never becomes false until the section fully exits — which is correct behavior. No bug here if `threshold: 0` is used.
**Real pitfall:** Using `threshold: 1.0` for the fade-out — the observer fires "fully visible" only when 100% of a tall section is in view, which on mobile never happens.
**How to avoid:** Use `threshold: 0` so the observer fires at the moment any part of the section enters or exits the viewport.

### Pitfall 4: Photo Skeleton Layout Shift on Load
**What goes wrong:** The skeleton wrapper has a fixed height (e.g., `220px` for segment heroes), but when the image loads at its natural aspect ratio it causes the container to reflow.
**Why it happens:** The `height: 220px` on `.segment-hero` is explicit and should prevent this — but if the CSS is removed or overridden, natural image height takes over.
**How to avoid:** Keep the `height: 220px` on `.segment-hero` (already present). For photo gallery images, pass `width` and `height` attributes using the dimensions parsed from filenames (the `parseDims()` function in `PhotoGallery.astro` already extracts them — just apply them as HTML attributes, not only as `data-pswp-*`).

### Pitfall 5: Route Stats Amber Section Cascade Conflict (Already Identified)
**What goes wrong:** The `.amber-section :global(span)` rule forces `color: forest-900` on all spans inside the amber section, including `stat-value` and `stat-label` which sit on dark forest-800 card backgrounds.
**Why it happens:** The amber section override was designed for DonateCallout spans — it over-reaches into RouteStats.
**How to avoid:** Fix VIS-05 by moving the Route Stats section out of the amber background context (preferred) or adding targeted overrides that counter the cascade for `.stat-card` specifically.

### Pitfall 6: `::before` Pseudo-Element Not Rendering
**What goes wrong:** The `::before` background fade pseudo-element doesn't appear despite correct CSS.
**Why it happens:** `::before` requires `content: ''` to render, even as an empty string. Without it, the element doesn't exist in the render tree.
**How to avoid:** Always include `content: '';` in `::before`/`::after` CSS rules.
**Warning signs:** No background image visible even after `bg-visible` class is added.

---

## Code Examples

### EB Garamond in astro.config.ts

```typescript
// Source: astro.config.ts — follows existing fontProviders.google() pattern
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Space Mono',
      cssVariable: '--font-space-mono',
      weights: [400, 700],
      styles: ['normal', 'italic'],
    },
    {
      provider: fontProviders.google(),
      name: 'National Park',
      cssVariable: '--font-national-park',
      weights: [400, 600, 700, 800],
      styles: ['normal'],
    },
    // NEW: EB Garamond for editorial drop-caps (VIS-02)
    {
      provider: fontProviders.google(),
      name: 'EB Garamond',
      cssVariable: '--font-garamond',
      weights: [400, 700],
      styles: ['normal', 'italic'],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### Drop-Cap Updated to Use Garamond

```css
/* HiawathaExplainer.astro — updated drop-cap style */
/* Changed from --font-display (National Park sans-serif) to --font-garamond (EB Garamond) */
.drop-cap::first-letter,
.pull-quote p::first-letter {
  font-family: var(--font-garamond);
  font-size: 4.5rem;    /* VIS-03: larger than body text */
  float: left;
  line-height: 0.8;
  padding-right: 0.5rem;
  padding-top: 0.15rem;
  color: var(--color-gold-500);
  text-shadow: 2px 3px 0px rgba(0, 0, 0, 0.3);
}
```

### Background Fade with IntersectionObserver

```astro
<!-- HiawathaExplainer.astro — updated section -->
<section data-bg-fade data-reveal class="hiawatha-section py-20">
  <!-- content -->
</section>

<style>
  .hiawatha-section {
    position: relative;
    overflow: hidden;
    background-color: var(--color-forest-950);
  }

  /* Background image layer — fades in when section is visible */
  .hiawatha-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('/images/irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536.jpg');
    background-size: cover;
    background-position: center;
    opacity: 0;
    transition: opacity 1.2s ease-in-out;
    z-index: 0;
    pointer-events: none;
  }

  .hiawatha-section.bg-visible::before {
    opacity: 0.06; /* Low opacity so text stays legible */
  }

  /* All children appear above the background layer */
  .hiawatha-section > * {
    position: relative;
    z-index: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .hiawatha-section::before {
      transition: none;
      opacity: 0.06;
    }
  }
</style>

<script>
  // Background fade observer — NOT one-shot (must toggle both in and out)
  // Uses threshold: 0 to fire on any entry/exit edge
  const bgObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('bg-visible', entry.isIntersecting);
    });
  }, { threshold: 0 });

  document.querySelectorAll('[data-bg-fade]').forEach(el => {
    bgObserver.observe(el);
  });
</script>
```

### Photo Skeleton Shimmer

```astro
<!-- PhotoGallery.astro — updated image wrapper -->
<div class="photo-wrap skeleton-loading break-inside-avoid mb-3">
  <img
    src={photo.thumb}
    alt=""
    width={dims.w}    /* NEW: explicit width prevents CLS */
    height={dims.h}   /* NEW: explicit height prevents CLS */
    loading="lazy"
    decoding="async"
    class="w-full h-auto block"
  />
</div>

<style>
  @keyframes skeleton-shimmer {
    0%   { background-position: -800px 0; }
    100% { background-position:  800px 0; }
  }

  .skeleton-loading {
    background: linear-gradient(
      90deg,
      var(--color-forest-800) 25%,
      var(--color-forest-700) 50%,
      var(--color-forest-800) 75%
    );
    background-size: 800px 100%;
    animation: skeleton-shimmer 1.5s infinite linear;
  }

  /* Images inside skeleton-loading are hidden until skeleton is removed */
  .skeleton-loading img {
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  /* Remove shimmer, show image via JS class removal */
  .photo-wrap:not(.skeleton-loading) img {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton-loading {
      animation: none;
      background: var(--color-forest-800);
    }
  }
</style>

<script>
  document.querySelectorAll('.photo-wrap img').forEach(img => {
    const wrap = img.closest('.photo-wrap');
    if (!wrap) return;
    const revealFn = () => wrap.classList.remove('skeleton-loading');
    if (img.complete) {
      revealFn();
    } else {
      img.addEventListener('load', revealFn, { once: true });
      img.addEventListener('error', revealFn, { once: true });
    }
  });
</script>
```

### SVG Pattern Motif Component

```astro
---
// OjibweWavePattern.astro
// Repeating wave/water motif inspired by Anishinaabe water symbolism
// Decorative only — aria-hidden. Uses inline SVG pattern element.
---
<svg
  class="ojibwe-wave-bg"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
  role="presentation"
  focusable="false"
  width="100%"
  height="100%"
  preserveAspectRatio="xMidYMid slice"
>
  <defs>
    <pattern id="ojibwe-wave" x="0" y="0" width="80" height="40" patternUnits="userSpaceOnUse">
      <!-- Double-curve wave — Anishinaabe water/lake symbolism -->
      <path d="M0 20 Q20 8 40 20 Q60 32 80 20"
            fill="none"
            stroke="var(--color-forest-700)"
            stroke-width="1.5" />
      <path d="M0 30 Q20 18 40 30 Q60 42 80 30"
            fill="none"
            stroke="var(--color-forest-700)"
            stroke-width="0.8"
            opacity="0.5" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#ojibwe-wave)" />
</svg>

<style>
  .ojibwe-wave-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.35;
  }
</style>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `background-attachment: fixed` parallax | IntersectionObserver opacity fade | iOS Safari broke `fixed` in v13 (2019) | Use IO fade; fixed is effectively unusable on mobile |
| Polling `img.complete` in setInterval | `img.complete` check + `load` event | Modern best practice | Reliable, no polling overhead |
| System serif for drop-caps | Google Fonts web serif (EB Garamond) | Web font ecosystem matured 2010s | Consistent rendering across browsers and OSes |
| Static background patterns | SVG `<pattern>` element | Always available, but underutilized | Zero HTTP requests; scales infinitely; color tokens work |

**Deprecated/outdated:**
- `background-attachment: fixed` for parallax on any public-facing site: Broken on iOS. Avoid.
- `animation-timeline: scroll()` / `animation-timeline: view()`: Firefox does not support it — deferred to v1.3 per project decision.

---

## Open Questions

1. **Which specific images to use as editorial section backgrounds?**
   - What we know: The project has 52 images in `/public/images/`. The hero image (`irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536.jpg`) is a forest creek with autumn reflections — a good candidate for "The Forest" section. Other images are route photos.
   - What's unclear: Which images are forest/landscape shots vs. action shots. Need to identify 2-3 landscape images for the poem/forest/ride section backgrounds.
   - Recommendation: Planner should specify that task executor scans available images and picks landscape images for each editorial sub-section. Alternatively, use the hero image at very low opacity for all three (same image, different opacity levels).

2. **Should drop-cap changes apply to the pull-quote `p::first-letter` as well?**
   - What we know: `HiawathaExplainer.astro` has both `.drop-cap::first-letter` and `.pull-quote p::first-letter` using the same font and size.
   - Recommendation: Yes — both should use EB Garamond for consistency. The pull-quote starts with `"a romanticized conflation..."` — that leading `"` may cause the quotation mark to become the drop-cap character. The planner should verify whether the pull-quote's first visible character is a letter or a quote.

3. **Should the three "additional" cultural motifs count existing motifs?**
   - What we know: The requirement says "at least three additional." The existing `FloralDivider`, `AnimatedDivider`, and `ShieldMotif` already provide ~4 motifs.
   - What's unclear: Does "additional" mean beyond existing, or just "total on the site"?
   - Recommendation: Plan treats it as "three new elements introduced in Phase 26," adding to the existing library. The safest interpretation.

---

## Specific Codebase Context

Key files for each requirement:

| Requirement | File(s) to Modify | Key Finding |
|-------------|-------------------|-------------|
| VIS-01 (whitespace) | `src/pages/index.astro`, `src/components/HiawathaExplainer.astro` | Sections use `py-[--spacing-block]` where `--spacing-block: 2rem`. Increase to ~4rem. |
| VIS-02 (drop-cap font) | `astro.config.ts`, `src/styles/global.css`, `src/components/HiawathaExplainer.astro` | Drop-cap already exists via `::first-letter` with `--font-display`. Replace font with EB Garamond. |
| VIS-03 (pull quote size) | `src/components/HiawathaExplainer.astro` | Pull quote `p` currently `font-size-xl` (1.25rem). Body text is `font-size-base` (1rem). Already satisfies VIS-03 — verify and potentially increase to `font-size-2xl`. |
| VIS-04 (parallax bg) | `src/components/HiawathaExplainer.astro` | Section already has `background-color: forest-950`. Add `::before` with IO-driven opacity fade. |
| VIS-05 (stats legibility) | `src/pages/index.astro`, `src/components/RouteStats.astro` | Root cause: `.amber-section :global(span)` overrides stat card text colors. Move RouteStats off amber section. |
| VIS-06 (cultural motifs) | New `.astro` component files, used in `index.astro` or existing section components | Create 1-2 new SVG pattern components; use `ShieldMotif` or existing components as watermarks in new positions. |
| PERF-01 (photo skeletons) | `src/components/PhotoGallery.astro`, `src/components/RouteExplainer.astro` | PhotoGallery already has `parseDims()` for image dimensions. Add skeleton CSS + JS load-event cleanup. |

---

## Sources

### Primary (HIGH confidence)
- `src/components/HiawathaExplainer.astro` — Existing drop-cap CSS pattern, pull-quote implementation, section structure
- `src/components/RouteStats.astro` — Stat card layout and color assignments
- `src/pages/index.astro` — `.amber-section` CSS cascade conflict identified
- `src/styles/global.css` — Current spacing tokens (`--spacing-block: 2rem`, `--spacing-section: 4rem`)
- `astro.config.ts` — Font loading pattern via `fontProviders.google()`
- `https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap` (WebFetch 2026-04-02) — Confirmed EB Garamond weights 400–800 available in normal and italic
- MDN `::first-letter` (WebFetch 2026-04-02) — Confirmed: `font-family`, `font-size`, `color`, `float`, `padding` all permitted; only works on block containers
- MDN `IntersectionObserver` (WebFetch 2026-04-02) — `isIntersecting` is false on exit; `threshold: 0` fires on any entry/exit edge
- MDN `img.complete` (WebFetch 2026-04-02) — Confirmed: handles cached images; combine with `load` event for uncached
- `caniuse.com/background-attachment` (WebFetch 2026-04-02) — Confirmed: iOS Safari 13+ has webkit bug where `fixed` is recognized but has no effect; Samsung Internet does not support it

### Secondary (MEDIUM confidence)
- MDN `background-attachment` (WebFetch 2026-04-02) — "Baseline Widely available" but "some parts have varying levels of support"; mobile caveats confirmed by caniuse
- Google Fonts `fonts.google.com` (WebFetch 2026-04-02) — EB Garamond confirmed as primary Garamond-style serif on Google Fonts

### Tertiary (LOW confidence)
- CSS-Tricks parallax article — Referenced 3D transform parallax approach; details not fully extracted (timeout)

---

## Metadata

**Confidence breakdown:**
- VIS-01 (whitespace): HIGH — Simple CSS token/class change; all involved code inspected
- VIS-02 (drop-cap font): HIGH — EB Garamond confirmed on Google Fonts with correct weights; Astro Font API pattern verified in codebase
- VIS-03 (pull quote size): HIGH — Pull quote already at xl (1.25rem) vs base body; verified in component
- VIS-04 (parallax): HIGH — `background-attachment: fixed` mobile bug confirmed via caniuse; IO fade pattern well-established in this codebase
- VIS-05 (stats legibility): HIGH — Root cause identified via direct CSS inspection; fix options clear
- VIS-06 (cultural motifs): MEDIUM — SVG inline pattern technique is HIGH confidence; cultural appropriateness guidance is MEDIUM (no formal review conducted)
- PERF-01 (photo skeletons): HIGH — `img.complete` + `load` event pattern confirmed via MDN; existing `parseDims()` function provides dimensions

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (CSS features are stable; Google Fonts availability stable)
