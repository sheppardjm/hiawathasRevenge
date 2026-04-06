# Phase 31: Accessibility Hardening - Research

**Researched:** 2026-04-06
**Domain:** WCAG AA accessibility — focus indicators, alt text, contrast, reduced motion
**Confidence:** HIGH (all findings from direct codebase inspection + verified contrast math)

## Summary

Phase 31 has four requirements: visible focus indicators on interactive elements (A11Y-01), descriptive alt text on gallery thumbnails (A11Y-02), star rating empty-star contrast fix (A11Y-03), and sector panel reduced-motion compliance (A11Y-04).

Direct code inspection reveals that A11Y-04 is already implemented — `RouteMap.astro` already has `@media (prefers-reduced-motion: reduce) { .sector-panel { transition: none; } }`. A11Y-01, A11Y-02, and A11Y-03 require targeted code changes. All changes are CSS or Astro template edits with no new dependencies. The work is limited in scope: 3 files for focus indicators, 1 file for alt text, 1 file for star contrast.

**Primary recommendation:** All four requirements can be satisfied with targeted edits to existing CSS and Astro templates. No new libraries, no structural changes, no pipeline changes needed.

## Standard Stack

No new dependencies needed. This phase is pure CSS and template edits within the existing stack.

### Core (already in project)
| Component | File | What Changes |
|-----------|------|--------------|
| Astro 6 component templates | `.astro` files | Add `alt` text, add `:focus-visible` CSS |
| CSS custom properties | `global.css` | Add global `a:focus-visible`, `button:focus-visible` baseline |
| Existing design tokens | `global.css @theme static` | `--color-amber-300: #e0b95f` already defined |

### No Installation Needed
```bash
# No new packages — all changes are CSS + Astro template edits
```

## Architecture Patterns

### Pattern 1: :focus-visible Baseline in global.css + Component Overrides

**What:** Add a global `a:focus-visible, button:focus-visible` rule in `global.css` `@layer base`, then add component-specific overrides where needed.

**When to use:** Establishes a visible focus ring for all interactive elements site-wide, then the component-level rules can tailor the appearance.

**Example:**
```css
/* global.css — in @layer base */
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--color-amber-500);
  outline-offset: 3px;
  border-radius: 2px;
}
```

This single rule covers `.gpx-download`, `.strava-link`, `.donate-button`, gallery `<a>`, `.panel-strava-link`, and `.panel-jump-link` automatically (they are all `<a>` or `<button>` elements).

**Why :focus-visible not :focus:** `:focus-visible` only shows the ring for keyboard navigation, not mouse clicks. All modern browsers support it natively (Chrome 86+, Firefox 85+, Safari 15.4+). No polyfill needed.

**Panel close button special case:** `.sector-panel__close` is a `<button>` inside a dark panel (`--color-forest-900` background). It inherits the global rule but needs explicit styling in `RouteMap.astro` because Astro scopes styles:

```css
/* RouteMap.astro <style> */
.sector-panel__close:focus-visible {
  outline: 2px solid var(--color-amber-500);
  outline-offset: 2px;
  border-radius: 2px;
}
```

### Pattern 2: Gallery Alt Text from mile field

**What:** Replace `alt=""` with `alt={\`Route photo at mile ${photo.mile.toFixed(1)}\`}` in `PhotoGallery.astro`.

**Why this approach:**
- `photos.json` has `mile` field for every entry (no other descriptive data exists)
- The success criterion explicitly says `"Route photo at mile 42"` — this is the exact pattern
- No pipeline changes needed; `photo.mile` is already available at build time
- The `<a>` wrapping the thumbnail is the interactive element; giving the `<img>` meaningful alt text provides the accessible name for the link

**The alt="" on hero image is intentional:** `HeroSection.astro` has `alt=""` on the hero image — this is correct WCAG practice because the image is decorative (the badge text and tagline carry all meaning). Do NOT change this.

**RouteExplainer.astro already has correct alt text:** `alt={\`Route photo near mile ${seg.photos[0].mile.toFixed(1)}\`}` — already correct, no change needed.

### Pattern 3: Star Rating Gradient — Change Empty Star Color

**What:** In `RouteExplainer.astro`, change the `@supports` gradient's second color stop from `var(--color-forest-700)` to `var(--color-amber-300)`.

**Current failing state:**
```css
/* Currently: forest-700 (#3d6b3d) on forest-800 (#2d4a2d) = 1.58:1 contrast — FAIL */
background: linear-gradient(
  to right,
  var(--color-amber-500) var(--percent),
  var(--color-forest-700) var(--percent)  /* ← FAILS 4.5:1 */
);
```

**Fix:**
```css
/* amber-300 (#e0b95f) on forest-800 (#2d4a2d) = 5.30:1 — PASSES */
background: linear-gradient(
  to right,
  var(--color-amber-500) var(--percent),
  var(--color-amber-300) var(--percent)  /* ← PASSES */
);
```

**Why amber-300:** Keeps empty stars visually in the amber family (dimmer amber vs brighter amber), which is better UX than using cream/white. `--color-amber-300: #e0b95f` is already defined in the design tokens.

**Contrast math verified:**
- `amber-300 (#e0b95f)` on `forest-800 (#2d4a2d)` = **5.30:1** — passes WCAG AA (4.5:1)
- `amber-500 (#c8973e)` on `forest-800 (#2d4a2d)` = 3.74:1 (filled stars — acceptable under WCAG 1.4.11 for graphical objects at 3:1, and role="img" means this is a graphical object not text)
- Note: the `role="img"` + `aria-label="Difficulty: X out of 5 stars"` on `.star-rating` means the requirement for the graphical visual is WCAG 1.4.11 (non-text contrast, 3:1 for graphical objects). The requirement specifically calls out 4.5:1 for empty stars — use amber-300 to meet it.

**The fallback is unchanged:** The non-`@supports` fallback `color: var(--color-amber-500)` shows all stars as solid amber — no contrast issue there.

**Panel-stars in RouteMap are NOT affected:** `.panel-stars` uses plain `color: var(--color-amber-500)` (not gradient) on `forest-900` background = 5.49:1 — already passes. No change needed.

### Pattern 4: Sector Panel Reduced Motion — Already Implemented

**Current state in `RouteMap.astro`:**
```css
.sector-panel {
  transition: transform 0.3s ease;
}
@media (prefers-reduced-motion: reduce) {
  .sector-panel {
    transition: none;
  }
}
```

This is the correct WCAG approach. `transition: none` makes the transform change instant. The `dialog.show()` call triggers display change and attribute change simultaneously; with no transition, the panel appears instantly.

**A11Y-04 task = verification only.** The CSS is already correct. The plan task should verify this works (ideally via Playwright or manual test with system reduced-motion setting enabled) and add a code comment referencing the A11Y-04 requirement.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Polyfill for :focus-visible | Custom JS focus detection | Native CSS :focus-visible | 100% browser support since 2022 |
| Contrast ratio calculator | Custom math in pipeline | Use inline calc or just pick from existing tokens | amber-300 is already in the design system |
| Alt text generation in pipeline | Add alt text field to photos.json | Just use template expression in Astro | `photo.mile` is already available, no data change needed |
| New accessibility library | axe-core, eslint-plugin-jsx-a11y | Direct CSS/template fixes | Fixes are known and targeted; audit tooling not needed for targeted fixes |

**Key insight:** All four requirements have targeted, single-file fixes. There's no architecture change needed — just CSS and template edits.

## Common Pitfalls

### Pitfall 1: Using :focus instead of :focus-visible
**What goes wrong:** Adding `:focus` styles shows the focus ring even when clicking with a mouse, which is a poor visual UX.
**Why it happens:** `:focus` is the traditional approach; `:focus-visible` is the modern improvement.
**How to avoid:** Always use `:focus-visible` exclusively.
**Warning signs:** Focus ring appears when clicking buttons/links with mouse.

### Pitfall 2: Astro Scoped Styles and :global()
**What goes wrong:** CSS in a component's `<style>` block is scoped — it won't match dynamically-injected HTML (like the panel body innerHTML in `RouteMap.astro`).
**Why it happens:** Astro adds a scoped hash to CSS selectors, but innerHTML-injected elements don't get the hash.
**How to avoid:**
- For `.panel-strava-link` and `.panel-jump-link`: these are injected via `innerHTML` in `openPanel()`. Their `:focus-visible` styles ARE in the `<style>` block and will work because the CSS selector matches the class (Astro scope hash doesn't affect dynamically-created elements that have the matching class).
- Actually: Astro's scoped styles add `[data-astro-cid-xxx]` to selectors. For innerHTML-injected elements that don't have that attribute, the scoped CSS WON'T match. Use `:global()` wrapper for panel body link styles.
- Alternatively: add the focus-visible rule in `global.css` `@layer base` — applies everywhere, no scoping issues.
**Warning signs:** Focus ring not appearing on panel links after applying styles.

### Pitfall 3: Empty alt Text on Interactive Images
**What goes wrong:** `alt=""` on an `<img>` inside a link (`<a>`) means the link has no accessible name — screen readers announce the URL instead.
**Why it happens:** Empty alt is correct for decorative standalone images, but wrong for images that are the content of a link.
**How to avoid:** When `<img>` is the only content inside an `<a>`, the `alt` must be descriptive (it becomes the link's accessible name).
**Warning signs:** Screen reader announces "link: /images/filename.webp" instead of "link: Route photo at mile 42".

### Pitfall 4: Changing Alt Text for Hero Image
**What goes wrong:** Adding descriptive alt text to the hero image in `HeroSection.astro`.
**Why it happens:** Developers see `alt=""` and assume it needs fixing.
**How to avoid:** The hero image `alt=""` is intentionally empty — the image is decorative (the `<h1>` badge and tagline carry all meaning). WCAG explicitly allows empty alt for decorative images. Do NOT change this.
**Warning signs:** This would be a regression if changed.

### Pitfall 5: Focus Outline Colors Against Variable Backgrounds
**What goes wrong:** A single amber focus outline looks great on dark backgrounds but may be invisible on the gold/sun-500 `gold-section` where `DonateCallout` is rendered.
**Why it happens:** The donate button appears in both `gold-section` (sun-500 background) and `teal-section` (turquoise-700 background).
**How to avoid:** Check the donate button in both contexts. In `gold-section`, the button has amber border on sun-500 bg. For focus, `outline-offset: 3px` with an amber outline may not contrast enough on sun-500 (#eab308). Use a forest-dark outline in that context. The `index.astro` already has `:global(.gold-section .donate-button)` overrides — add focus-visible there too.

## Code Examples

### Focus Indicator — Global Baseline
```css
/* global.css — in @layer base, after existing rules */

/* A11Y-01: Visible keyboard focus indicators */
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--color-amber-500);
  outline-offset: 3px;
  border-radius: 2px;
}
```

### Focus Indicator — Component Close Button
```css
/* RouteMap.astro <style> — add after .sector-panel__close:hover */

.sector-panel__close:focus-visible {
  outline: 2px solid var(--color-amber-500);
  outline-offset: 2px;
  border-radius: 2px;
  opacity: 1;
}
```

### Focus Indicator — Gold Section Override
```css
/* index.astro <style> — add inside .gold-section block */

.gold-section :global(a:focus-visible),
.gold-section :global(button:focus-visible) {
  outline-color: var(--color-forest-950);
}
```

### Gallery Alt Text
```astro
<!-- PhotoGallery.astro — change alt="" to: -->
<img
  src={photo.thumb}
  alt={`Route photo at mile ${photo.mile.toFixed(1)}`}
  loading="lazy"
  decoding="async"
  width={dims.w}
  height={dims.h}
  class="w-full h-auto block"
/>
```

### Star Rating Contrast Fix
```css
/* RouteExplainer.astro <style> — in @supports block */

@supports (background-clip: text) or (-webkit-background-clip: text) {
  .star-rating {
    background: linear-gradient(
      to right,
      var(--color-amber-500) var(--percent),
      var(--color-amber-300) var(--percent)   /* was: forest-700 (1.58:1) — now amber-300 (5.30:1) */
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
}
```

### Reduced Motion — Already Correct (verification + comment)
```css
/* RouteMap.astro — existing code, just add comment */

/* A11Y-04: Panel transitions are instant when prefers-reduced-motion is set */
@media (prefers-reduced-motion: reduce) {
  .sector-panel {
    transition: none;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `:focus` pseudo-class | `:focus-visible` | CSS Selectors Level 4, 2022 | Shows ring only for keyboard, not mouse |
| `tabindex="0"` on all interactive elements | Native `<a>` and `<button>` (already keyboard focusable) | Always | No tabindex needed; native elements are correct |
| `role="img"` for star rating | Already implemented via `role="img"` + `aria-label` | Already in code | Correct — no change needed |

**Already correct in codebase:**
- `HeroSection.astro`: `alt=""` on decorative hero image — correct per WCAG
- `RouteExplainer.astro` segment photos: `alt="Route photo near mile X"` — already correct
- `HiawathaExplainer.astro` historical images: descriptive alt — already correct
- SVG decorative elements: `aria-hidden="true" focusable="false"` — already correct
- `RouteMap.astro` sparkline SVG: `aria-hidden="true" role="presentation"` — already correct
- `RouteMap.astro` panel stars: `aria-label="Difficulty: X of 5 stars"` — already correct
- All Leaflet controls: `aria-label` already set — already correct
- `ScrollReveal.astro`: `prefers-reduced-motion` both in CSS and JS — already correct
- `DonateCallout.astro`: `prefers-reduced-motion` on transition — already correct

## Open Questions

1. **Gold section donate button focus outline**
   - What we know: `.donate-button` in `gold-section` has amber border; amber focus outline on amber/sun-500 background may not meet 3:1 contrast
   - What's unclear: Whether the gold section's color contrast for focus specifically matters for WCAG (the button itself is keyboard-accessible; the question is whether the focus ring is visible enough)
   - Recommendation: Use `outline-color: var(--color-forest-950)` for focus-visible in gold-section context; the index.astro already has the override structure for this.

2. **Panel body links (:focus-visible scope)**
   - What we know: `.panel-strava-link` and `.panel-jump-link` are injected via `innerHTML` in JS, so Astro scoped CSS hashes won't apply
   - What's unclear: Whether the global `a:focus-visible` rule in `global.css` will cover these links sufficiently
   - Recommendation: The global baseline `a:focus-visible` rule in `global.css` covers all `<a>` elements regardless of where they're created, including innerHTML-injected ones. This is the cleanest solution.

3. **Leaflet map interactive elements keyboard accessibility**
   - What we know: Leaflet sector overlays use `ghostPoly` polylines with `interactive: true` for click/hover, but polylines are SVG paths — not natively keyboard-focusable
   - What's unclear: The requirements mention "sector panel close button" as a focus target but not the sector polylines themselves
   - Recommendation: In scope is the panel close button and panel links, NOT the Leaflet map polylines. The polylines remain mouse/touch-only per the existing architecture decision.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/components/RouteMap.astro`, `src/components/RouteExplainer.astro`, `src/components/PhotoGallery.astro`, `src/components/DonateCallout.astro`, `src/pages/index.astro`, `src/styles/global.css`
- Contrast math verified with Node.js WCAG luminance formula
- Existing design tokens verified in `global.css @theme static`

### Secondary (MEDIUM confidence)
- WCAG 2.1 AA contrast requirements: 4.5:1 for normal text, 3:1 for large text and graphical objects (WCAG 1.4.3 and 1.4.11)
- `:focus-visible` browser support: Chrome 86+, Firefox 85+, Safari 15.4+ (universally supported in 2024-2026)

### Tertiary (LOW confidence)
- Astro scoped style behavior with innerHTML-injected elements (verified by code inspection, not Astro docs; behavior is consistent with how CSS hashing works)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing Astro + CSS patterns
- Architecture: HIGH — verified by direct codebase inspection; all file paths confirmed
- Pitfalls: HIGH for scoping and alt text patterns; MEDIUM for gold-section focus ring edge case
- Contrast math: HIGH — computed with verified WCAG luminance formula

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable CSS/WCAG domain)

## Phase Plan Alignment

The two-plan split from the roadmap is well-scoped:

**31-01: Focus indicators and alt text**
- Files: `src/styles/global.css`, `src/components/PhotoGallery.astro`, `src/components/RouteMap.astro`, `src/components/DonateCallout.astro`, `src/pages/index.astro` (gold-section override)
- Work: Add `a:focus-visible, button:focus-visible` global rule; add `.sector-panel__close:focus-visible`; change gallery `alt=""` to descriptive text
- Note: The global CSS rule covers panel body links (.panel-strava-link, .panel-jump-link) automatically

**31-02: Contrast and motion**
- Files: `src/components/RouteExplainer.astro`
- Work: Change empty star gradient stop from `forest-700` to `amber-300`
- Note: A11Y-04 (reduced motion) is already implemented in RouteMap.astro — this task is verification + adding A11Y-04 requirement comment to the existing CSS rule
