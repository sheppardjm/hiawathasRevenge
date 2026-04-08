# Phase 47: History Light/Dark Mode - Research

**Researched:** 2026-04-07
**Domain:** CSS prefers-color-scheme, CSS ::before background images, IntersectionObserver, WCAG AA contrast
**Confidence:** HIGH

---

## Summary

This phase modifies a single component — `HiawathaExplainer.astro` — to support light/dark OS color scheme preferences using CSS-only `@media (prefers-color-scheme: light)` scoped to `.hiawatha-section`. It also implements a partially-stubbed `::before` background image system for scroll-triggered faded Remington painting overlays on each of three subsections.

All six heading colors in the component currently fail WCAG AA when placed on light/cream backgrounds — every single one fails. New light-mode overrides using existing darker tokens (rust-600, turquoise-700, scarlet-700, forest-900) are verified to pass AA. The IntersectionObserver and prefers-reduced-motion guards are already in place; the JS requires no changes. The `::before` image system is a skeleton — the reduced-motion CSS stub exists but the main rules and `bg-visible` CSS response are missing.

**Primary recommendation:** Add one `@media (prefers-color-scheme: light)` block at the bottom of the existing scoped `<style>` in HiawathaExplainer.astro, and fill in the missing `::before` CSS rules (main rule + bg-visible + per-section url()). No new files, no JS changes, no global CSS changes.

---

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| CSS `@media (prefers-color-scheme: light/dark)` | Browser native (Baseline: 2019) | CSS-only mode switching | Zero JS, OS-aware, no toggle state needed |
| CSS `::before` pseudo-element | Browser native | Background image layer | position:absolute, pointer-events:none pattern preserves text layering |
| CSS `filter: sepia() saturate() brightness()` | Browser native | Desaturate/fade images | Already used in project on `.museum-plate img` (same pattern) |
| IntersectionObserver | Browser native | Scroll-triggered bg-visible toggle | Already implemented in HiawathaExplainer.astro — no changes needed |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Astro scoped `<style>` | Astro 6.x | Scope light-mode overrides to .hiawatha-section | Prevents global scope bleed; descendant selectors override Tailwind utilities |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@media (prefers-color-scheme: light)` | JS class toggle | JS toggle requires persistence, user accounts; OS media query is sufficient per requirement |
| CSS `filter` on `::before` | Separate grayscale image assets | Single source (requirement decision); CSS filter avoids duplicate assets |
| `::before` with absolute positioning | Separate `<div>` background element | Pseudo-element needs no HTML change; keeps DOM clean |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

No new files. All changes in one component:

```
src/
└── components/
    └── HiawathaExplainer.astro   # Only file modified
```

### Pattern 1: Section-Scoped Light Mode via @media (prefers-color-scheme: light)

**What:** Add a single `@media (prefers-color-scheme: light)` block inside the component's scoped `<style>`. Selectors are prefixed with `.hiawatha-section` to avoid affecting any other section.

**Prior decision constraint:** Global `@theme static` tokens must NOT be overridden. Per-element overrides inside `.hiawatha-section` context only.

**Example:**
```css
/* Inside HiawathaExplainer.astro <style> */
@media (prefers-color-scheme: light) {
  .hiawatha-section {
    background-color: var(--color-cream-100);
  }

  /* h2 inherits global color: amber-500 — override to dark green */
  .hiawatha-section h2 {
    color: var(--color-forest-900);
    text-shadow: none;
  }

  /* h3 headings use Tailwind utility classes — override via descendant selector */
  .hiawatha-section .text-amber-500 {
    color: var(--color-rust-600);
  }
  .hiawatha-section .text-turquoise-400 {
    color: var(--color-turquoise-700);
  }
  .hiawatha-section .text-sun-400 {
    color: var(--color-rust-600);
  }
  .hiawatha-section .text-scarlet-400 {
    color: var(--color-scarlet-700);
  }

  /* Body paragraph text */
  .editorial-grid p {
    color: var(--color-forest-900);
  }

  /* Links inside the section */
  .hiawatha-section a {
    color: var(--color-forest-700);
  }
  .hiawatha-section a:hover {
    color: var(--color-rust-600);
  }

  /* Pull quote */
  .pull-quote {
    background: var(--color-cream-200);
    border-left-color: var(--color-rust-600);
  }
  .pull-quote p {
    color: var(--color-forest-900);
  }
  .pull-quote-attribution {
    color: var(--color-forest-800);
  }
  .pull-quote-attribution cite a {
    color: var(--color-forest-800);
  }

  /* Drop caps */
  .drop-cap::first-letter {
    color: var(--color-rust-600);
    text-shadow: none;
  }
  .pull-quote p::first-letter {
    color: var(--color-rust-600);
    text-shadow: none;
  }

  /* Background image opacity/filter adjustments for light bg */
  .subsection-bg::before {
    filter: sepia(80%) saturate(15%) brightness(1.2);
  }
  .subsection-bg.bg-visible::before {
    opacity: 0.12;
  }
}
```

**Specificity note:** Astro scoped styles apply a `[data-astro-cid-xxx]` attribute to `.hiawatha-section`. The descendant combinator `.hiawatha-section .text-amber-500` becomes `[data-astro-cid-xxx].hiawatha-section .text-amber-500`. Specificity is 0-2-0, which beats Tailwind's 0-1-0, so the override wins.

### Pattern 2: ::before Background Image System

**What:** The `::before` system is currently a skeleton. The JS toggle (`bg-visible` class) and the reduced-motion CSS stub (`.subsection-bg::before { transition: none; opacity: 0.04 }`) both exist, but the main `::before` CSS rule and the `bg-visible` CSS response are missing.

**What needs to be added:**

```css
/* Main ::before rule — add to existing .subsection-bg block or new rule */
.subsection-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
  z-index: 0; /* content children are already z-index: 1 */
  filter: sepia(80%) saturate(20%) brightness(0.6);
}

/* JS toggles bg-visible — CSS responds */
.subsection-bg.bg-visible::before {
  opacity: 0.08;
}

/* Per-section image assignment */
.poem-section::before {
  background-image: url('/thumbs/historical/remington-hiawatha-departure-1891.webp');
}

.forest-section::before {
  background-image: url('/thumbs/historical/remington-hiawatha-fasting-1891.webp');
}

.ride-section::before {
  /* Reuse departure painting — only 2 historical images in /public */
  background-image: url('/thumbs/historical/remington-hiawatha-departure-1891.webp');
}
```

**Image availability:** Two Remington paintings are confirmed in `/public/thumbs/historical/`:
- `/thumbs/historical/remington-hiawatha-departure-1891.webp`
- `/thumbs/historical/remington-hiawatha-fasting-1891.webp`

These are the ONLY publicly-served historical images. The `/images/inspiration/` folder exists at the project root but is NOT in `/public/` and CANNOT be used as CSS `url()` references. The blocker about "inspiration images pipeline inclusion" resolves as: use the 2 historical Remington paintings for poem-section and forest-section; reuse departure for ride-section.

### Pattern 3: prefers-reduced-motion (already implemented — verify it still applies)

**What:** The existing code already has:
1. CSS stub: `@media (prefers-reduced-motion: reduce) { .subsection-bg::before { transition: none; opacity: 0.04; } }`
2. JS guard: `if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) { ... IntersectionObserver ... }`

When reduced-motion is active, the JS does NOT run, so `bg-visible` is never toggled. The CSS stub sets a static `opacity: 0.04` on `::before`. After we add the main `::before` rule, this reduced-motion override will correctly suppress the transition and set a low static opacity.

**No changes needed to JS or the reduced-motion CSS block** — they already satisfy MODE-08.

### Anti-Patterns to Avoid

- **Overriding `@theme static` tokens in global.css:** Decision from STATE.md — scoped to `.hiawatha-section` only.
- **Using a JS class toggle for color scheme:** MODE-01 explicitly requires CSS-only (`@media (prefers-color-scheme: light)`), no JS toggle.
- **Using `color-scheme` property on `:root`:** This would affect browser chrome (scrollbars, form inputs) globally. Scope changes to `.hiawatha-section` only.
- **Putting `url()` references to images in `/images/inspiration/`:** That folder is not in `/public/`, images will 404. Only `/thumbs/historical/` images are web-served.
- **Placing `::before` without `z-index: 0` when children have `z-index: 1`:** The existing `.subsection-bg > *` already sets `z-index: 1`. The `::before` must be `z-index: 0` to stay behind content.
- **Not setting `pointer-events: none` on `::before`:** Without it, the absolutely-positioned pseudo-element captures clicks and prevents text selection.
- **Using `transition: filter` instead of `transition: opacity`:** Animating `filter` is more expensive; opacity animations are GPU-composited. The approach animates opacity on `::before`, not filter.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mode switching | JS class toggle + localStorage | `@media (prefers-color-scheme: light)` | Requirement says CSS-only; simpler, no JS needed |
| Image desaturation | Grayscale PNGs | CSS `filter: sepia() saturate() brightness()` | Single asset, out-of-scope to maintain separate images |
| Scroll-triggered bg fade | New IntersectionObserver | Existing `[data-bg-fade]` + `bg-visible` pattern | Already implemented in the component |
| Reduced-motion guard | New media query check | Existing JS guard + CSS stub | Both already in place; only need to wire CSS rule |

**Key insight:** The entire IntersectionObserver infrastructure for scroll-triggered backgrounds is already built. This phase primarily fills in missing CSS rules and adds the light-mode media query block.

---

## Common Pitfalls

### Pitfall 1: All heading colors fail WCAG AA on cream backgrounds

**What goes wrong:** Designers/developers assume the existing palette tokens (amber-500, turquoise-400, sun-400, scarlet-400) work on light backgrounds because they were designed for the dark-background site. They do not.

**Computed contrast ratios (vs cream-100 #f5f0e8):**

| Dark-mode color | Light-mode contrast | Result |
|----------------|-------------------|--------|
| amber-500 #c8973e (h2, h3 Poem) | 2.33:1 | FAIL |
| turquoise-400 #2dd4bf (h3 Confusion) | 1.64:1 | FAIL |
| sun-400 #facc15 (h3 Forest) | 1.35:1 | FAIL |
| scarlet-400 #f87171 (h3 Ride) | 2.44:1 | FAIL |
| gold-500 #d4a017 (drop cap) | 2.09:1 | FAIL |

**Required light-mode overrides (all PASS AA on cream-100):**

| Element | Light-mode token | Contrast vs cream-100 |
|---------|-----------------|----------------------|
| h2 | forest-900 #1a2e1a | 12.77:1 |
| h3 text-amber-500 (Poem) | rust-600 #8b4513 | 6.26:1 |
| h3 text-turquoise-400 (Confusion) | turquoise-700 #0f766e | 4.82:1 |
| h3 text-sun-400 (Forest) | rust-600 #8b4513 | 6.26:1 |
| h3 text-scarlet-400 (Ride) | scarlet-700 #b91c1c | 5.70:1 |
| drop cap ::first-letter | rust-600 #8b4513 | 6.26:1 |
| body paragraph text | forest-900 #1a2e1a | 12.77:1 |
| pull-quote text | forest-900 #1a2e1a on cream-200 | 12.77:1 |

**How to avoid:** These ratios are computed above. Use the table as the source of truth for the plan.

### Pitfall 2: h2 text-shadow causes muddy dark shadow on light background

**What goes wrong:** Global CSS sets `text-shadow: var(--shadow-text)` on all h1-h4. `--shadow-text` is `2px 2px 0px rgba(0, 0, 0, 0.7)` — a strong dark offset shadow designed for dark backgrounds. On a cream background with dark text (forest-900), this dark shadow compounds oddly.

**How to avoid:** Set `text-shadow: none` on `.hiawatha-section h2, .hiawatha-section h3` in the light-mode media query. The scoped rule has sufficient specificity to override global CSS.

### Pitfall 3: Link colors fail in light mode

**What goes wrong:** The component inherits global `a { color: amber-400 }`. On cream, amber-400 (#d4a84e) has 1.95:1 contrast — FAIL. The MBTN link in the ride section also has `hover:text-amber-300` (explicit Tailwind class), which also fails.

**How to avoid:** Add `.hiawatha-section a { color: var(--color-forest-700); }` and `.hiawatha-section a:hover { color: var(--color-rust-600); }` inside the light-mode block. Forest-700 (#3d6b3d) has 5.49:1 contrast on cream-100.

### Pitfall 4: Pull-quote attribution link is cream-colored (invisible on light bg)

**What goes wrong:** `.pull-quote-attribution cite a { color: var(--color-cream-200) }` — cream text on cream background is invisible.

**How to avoid:** Override to forest-800 in light mode: `.pull-quote-attribution cite a { color: var(--color-forest-800); }`. Forest-800 (#2d4a2d) has 7.52:1 on cream-200.

### Pitfall 5: The `::before` bg-visible class has NO matching CSS rule (yet)

**What goes wrong:** The JS already toggles `.bg-visible` on `[data-bg-fade]` elements. But the CSS rule `.subsection-bg.bg-visible::before { opacity: 0.08 }` doesn't exist. Without this rule, the opacity never changes and no background is visible.

**How to avoid:** This is the core implementation task. The planner should treat the JS as done and the CSS as the missing piece.

### Pitfall 6: Reduced-motion CSS stub references ::before before main rule exists

**What goes wrong:** The current CSS has `@media (prefers-reduced-motion: reduce) { .subsection-bg::before { ... } }` but no base `.subsection-bg::before` rule. This is currently a no-op stub. Once the main rule is added, the stub correctly overrides it.

**How to avoid:** Add the main `::before` rule BEFORE the reduced-motion block in the CSS. The reduced-motion block already has correct values (`transition: none; opacity: 0.04`).

### Pitfall 7: `inset: 0` may not be supported on very old Safari

**What goes wrong:** `inset: 0` is shorthand for `top: 0; right: 0; bottom: 0; left: 0`. Supported in Safari 14.1+.

**How to avoid:** Given other features in use (IntersectionObserver with rootMargin, etc.) already require modern Safari, `inset: 0` is safe. The project's existing posture accepts Safari 14.1+ minimum.

---

## Code Examples

### Complete light-mode media query (all overrides)

```css
/* Source: WCAG AA contrast analysis in 47-RESEARCH.md */
@media (prefers-color-scheme: light) {
  .hiawatha-section {
    background-color: var(--color-cream-100);
  }

  .hiawatha-section h2 {
    color: var(--color-forest-900);
    text-shadow: none;
  }

  .hiawatha-section h3 {
    text-shadow: none;
  }

  /* Tailwind utility class overrides — descendant selector beats utility specificity */
  .hiawatha-section .text-amber-500  { color: var(--color-rust-600); }
  .hiawatha-section .text-turquoise-400 { color: var(--color-turquoise-700); }
  .hiawatha-section .text-sun-400    { color: var(--color-rust-600); }
  .hiawatha-section .text-scarlet-400 { color: var(--color-scarlet-700); }

  .editorial-grid p {
    color: var(--color-forest-900);
  }

  .hiawatha-section a {
    color: var(--color-forest-700);
  }
  .hiawatha-section a:hover {
    color: var(--color-rust-600);
  }

  .pull-quote {
    background: var(--color-cream-200);
    border-left-color: var(--color-rust-600);
  }
  .pull-quote p {
    color: var(--color-forest-900);
  }
  .pull-quote-attribution {
    color: var(--color-forest-800);
  }
  .pull-quote-attribution cite a {
    color: var(--color-forest-800);
  }

  .drop-cap::first-letter,
  .pull-quote p::first-letter {
    color: var(--color-rust-600);
    text-shadow: none;
  }

  /* Adjusted background image treatment for light background */
  .subsection-bg::before {
    filter: sepia(80%) saturate(15%) brightness(1.2);
  }
  .subsection-bg.bg-visible::before {
    opacity: 0.12;
  }
}
```

### Complete ::before background image system (fills the skeleton)

```css
/* Source: Extends existing VIS-04 system skeleton in HiawathaExplainer.astro */

/* Base ::before rule — add alongside existing .subsection-bg rule */
.subsection-bg::before {
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

/* JS toggles this class when section intersects viewport */
.subsection-bg.bg-visible::before {
  opacity: 0.08;
}

/* Per-section background images — images confirmed in /public/thumbs/historical/ */
.poem-section::before {
  background-image: url('/thumbs/historical/remington-hiawatha-departure-1891.webp');
}

.forest-section::before {
  background-image: url('/thumbs/historical/remington-hiawatha-fasting-1891.webp');
}

.ride-section::before {
  /* Only 2 historical images available; departure reused for ride section */
  background-image: url('/thumbs/historical/remington-hiawatha-departure-1891.webp');
}

/* Reduced-motion: existing stub is correct once base rule exists */
/* @media (prefers-reduced-motion: reduce) { */
/*   .subsection-bg::before { transition: none; opacity: 0.04; } */
/* } */
/* ↑ Already in the file, no changes needed */
```

### Selector specificity reference

```
Tailwind utility:               .text-amber-500            → 0-1-0
Scoped descendant override:     .hiawatha-section .text-amber-500  → 0-2-0  ✓ wins
Global heading rule:            h2                         → 0-0-1
Scoped heading override:        .hiawatha-section h2       → 0-1-1  ✓ wins
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JS class toggle + localStorage for dark mode | `@media (prefers-color-scheme)` CSS | Baseline 2019 | No JS needed; OS-native preference |
| `filter: grayscale(100%)` | `sepia() saturate() brightness()` | Project decision | Avoids error-state appearance |
| New DOM elements for backgrounds | `::before` pseudo-elements | Well established | Zero HTML, no layout impact |

**Deprecated/outdated:**
- `filter: grayscale(100%)` on images — looks like broken/error state; out of scope per requirements.
- Separate dark/light image assets — out of scope per requirements.

---

## Open Questions

1. **Ride section background image**
   - What we know: Only 2 Remington paintings exist in `/public/thumbs/historical/`. Three subsections need images. The `/images/inspiration/` folder has images but is NOT in `/public/`.
   - What's unclear: Whether the product owner wants ride-section to have a unique image or is fine with reuse.
   - Recommendation: Reuse `remington-hiawatha-departure-1891.webp` for ride-section. If a unique image is desired, the planner should add a task to copy one inspiration image to `/public/thumbs/historical/`. Plan conservatively: use reuse for now.

2. **`hover:text-amber-300` Tailwind class on MBTN link**
   - What we know: `<a href="https://mbtn.org" class="underline hover:text-amber-300">` — the hover color is set via Tailwind utility.
   - What's unclear: Whether `.hiawatha-section a:hover { color: rust-600 }` will override `hover:text-amber-300` (specificity 0-1-0 for hover class vs 0-1-1 for `.hiawatha-section a:hover`).
   - Recommendation: The scoped `.hiawatha-section a:hover` (0-1-1) should beat Tailwind's `hover:text-amber-300` (0-1-0). Verify in browser during UAT.

3. **Museum plate border in light mode (decorative)**
   - What we know: `.museum-plate` has `box-shadow: 0 0 0px 2px amber-300, 0 0 0 12px cream-200, 0 0 0 16px amber-300`. Amber-300 vs cream = 1.64:1 (decorative-only). The museum-plate frame is non-textual.
   - Recommendation: No change needed. It is a decorative border, not text. WCAG AA does not apply to non-text UI components that are purely decorative.

---

## Sources

### Primary (HIGH confidence)

- Codebase: `src/components/HiawathaExplainer.astro` — direct inspection of current CSS, JS, HTML structure
- Codebase: `src/styles/global.css` — direct inspection of @theme static tokens and global h1-h4 rules
- WCAG 2.1 contrast formula (Python implementation) — computed all ratios from first principles
- Codebase: `public/thumbs/historical/` — confirmed available images
- Codebase: `.planning/STATE.md` — confirmed prior decisions (light-mode scope, token freeze)
- Codebase: `.planning/REQUIREMENTS.md` — confirmed MODE-01 through MODE-08 requirements

### Secondary (MEDIUM confidence)

- MDN Web Docs: `@media (prefers-color-scheme)` — confirmed CSS-only approach
- MDN Web Docs: `::before` pseudo-elements with `position: absolute` — confirmed pointer-events, z-index pattern
- WCAG 2.1 SC 1.4.3 — 4.5:1 for normal text, 3.0:1 for large text (18pt/14pt bold)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — browser-native APIs, no new dependencies
- Architecture: HIGH — single component modification, all infrastructure already exists
- WCAG contrast ratios: HIGH — computed from WCAG formula, verified against all token values
- Image paths: HIGH — confirmed in /public/thumbs/historical/
- Pitfalls: HIGH — derived from direct code inspection, not speculation

**Research date:** 2026-04-07
**Valid until:** 2026-10-07 (stable browser APIs, no expiry concern)
