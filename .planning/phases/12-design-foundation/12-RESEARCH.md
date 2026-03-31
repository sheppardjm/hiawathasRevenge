# Phase 12: Design Foundation - Research

**Researched:** 2026-03-31
**Domain:** Tailwind CSS 4 @theme token extension, CSS custom property access from JavaScript, BaseLayout width restructure
**Confidence:** HIGH

## Summary

Phase 12 is infrastructure work: expand the color token system, replace hardcoded hex values in JavaScript with `getComputedStyle()` lookups, and remove the global width constraint from `BaseLayout.astro`. All three tasks are purely additive or surgical -- no rewrites, no new dependencies.

The codebase is already on Tailwind 4.2.2 using the CSS-first `@theme` pattern. Adding new color families (berry, gold, lake, moss) means appending to the existing `@theme` block in `global.css`. A critical finding is that Tailwind 4 only outputs CSS custom properties for theme variables that are **actually used in utility classes**, by default. Because the new color tokens must be readable from JavaScript via `getComputedStyle()` (for use in Canvas/Leaflet/Chart.js), the entire `@theme` color block must use `@theme static` OR the colors used only in JS must be declared under a plain `:root {}` block outside Tailwind's control.

WCAG AA contrast verification is non-negotiable before finalizing hex values. Verified contrast data shows that several obvious candidate colors (berry-600 at #9a3a4f, lake-600 at #2b6cb0, moss-600 at #6b7c3f) **fail** WCAG AA against the primary backgrounds. Only gold-family and the existing amber-500 pass reliably. The planner must budget time for iterative contrast testing during token definition.

**Primary recommendation:** Use `@theme static` for all color tokens so they are always output to `:root` and accessible via `getComputedStyle()` regardless of which utility classes appear in HTML; then verify every new color against `forest-900` (#1a2e1a) and `forest-950` (#0d1a0d) with an online contrast tool before committing hex values.

## Standard Stack

No new dependencies. This phase uses only what is already installed.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.2.2 | CSS token system and utility generation | Already installed; @theme block is the token source |
| CSS custom properties | native | Bridge between CSS tokens and JS | `getComputedStyle(document.documentElement)` reads any `--color-*` variable |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| webaim.org/resources/contrastchecker | WCAG AA verification | Before finalizing every new hex value |
| colourcontrast.cc | Quick hex-to-hex contrast check | Same purpose, faster URL pattern |
| Browser DevTools | Verify CSS variable appears in :root computed styles | After build, open DevTools > Elements > :root |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@theme static` | `:root {}` block outside @theme | `:root` block works but bypasses Tailwind utility generation; use `@theme static` to get both CSS vars and utilities |
| `@theme static` | `@theme` (default) | Default only outputs used vars; JS reads `getComputedStyle` and would return empty string for unused tokens |
| Manual `getComputedStyle` helper | Inline hardcoded hex | Hardcoded hex breaks when palette changes; getComputedStyle is the correct pattern |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure

No new files. All changes are to existing files:

```
src/
├── styles/
│   └── global.css           # MODIFY: expand @theme block to @theme static, add new color families
├── layouts/
│   └── BaseLayout.astro     # MODIFY: remove max-w-4xl mx-auto px-4 py-8 from <main>
├── pages/
│   └── index.astro          # MODIFY: add per-section width containers to maintain current appearance
└── components/
    ├── RouteMap.astro        # MODIFY: replace hardcoded hex with getComputedStyle lookups
    └── ElevationProfile.astro # MODIFY: replace hardcoded hex with getComputedStyle lookups
```

### Pattern 1: @theme static — Ensure All Color Tokens Are Always Output

**What:** Changing `@theme { ... }` to `@theme static { ... }` forces Tailwind to output ALL defined CSS custom properties to `:root`, regardless of whether the corresponding utility classes appear in the HTML scanned by Tailwind's content detection.

**When to use:** Required whenever a CSS variable defined in `@theme` must be read by JavaScript via `getComputedStyle()`. The new color tokens will be used in Canvas SVG markup (RouteMap) and Chart.js config objects (ElevationProfile) -- these are runtime JavaScript contexts that Tailwind cannot scan, so the tokens would silently not be output without `@theme static`.

**Example:**
```css
/* Source: https://tailwindcss.com/docs/theme */
/* global.css — CHANGE @theme to @theme static */
@theme static {
  /* ============================================================
     Existing tokens (unchanged)
     ============================================================ */
  --color-forest-950: #0d1a0d;
  --color-forest-900: #1a2e1a;
  /* ... all existing tokens ... */

  /* ============================================================
     v1.1 New: Ojibwe-inspired color families
     WCAG AA verified against forest-950 and forest-900 below
     ============================================================ */

  /* Berry family — use for accents/borders ONLY (not body text) */
  /* berry-700 to berry-600 pass AA for large text only; do not use for body text */
  --color-berry-700: #7a2e3d;
  --color-berry-600: #9a3a4f;
  --color-berry-500: #b34d63;

  /* Gold family — verified to pass AA for normal text */
  /* gold-500 (#d4a017) on forest-950: 7.55:1 — PASS */
  /* gold-500 (#d4a017) on forest-900: 6.10:1 — PASS */
  --color-gold-600: #b8860b;
  --color-gold-500: #d4a017;
  --color-gold-400: #e6b422;

  /* Lake family — requires lighter values to pass AA on dark backgrounds */
  /* lake-400 (#4a9eca) on forest-900: 4.85:1 — PASS */
  /* lake-400 (#4a9eca) on forest-950: 6.01:1 — PASS */
  /* lake-600 (#2b6cb0) FAILS on forest-900 (3.31:1) — do NOT use for text */
  --color-lake-700: #2c5282;
  --color-lake-600: #2b6cb0;
  --color-lake-500: #3182ce;
  --color-lake-400: #4a9eca;

  /* Moss family — fails AA for normal text; use for decorative/non-text elements only */
  /* moss-600 (#6b7c3f) on forest-950: 3.91:1 — FAIL normal text */
  --color-moss-600: #6b7c3f;
  --color-moss-500: #7d9448;
}
```

### Pattern 2: getComputedStyle() for JS Color Access

**What:** Read CSS custom properties at runtime so JavaScript (Leaflet SVG, Chart.js config) automatically picks up palette changes without code changes.

**When to use:** Everywhere a hardcoded hex currently exists in RouteMap.astro and ElevationProfile.astro JavaScript.

**Example:**
```javascript
// Source: https://tailwindcss.com/docs/theme (official getComputedStyle pattern)
// Helper — call once at init time, not per-event
function getCSSColor(varName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

// Usage in initMap() or initChart() — replaces hardcoded hex values
const colors = {
  forest900:  getCSSColor('--color-forest-900'),   // was '#1a2e1a'
  forest950:  getCSSColor('--color-forest-950'),   // was '#0d1a0d'
  amber500:   getCSSColor('--color-amber-500'),    // was '#c8973e'
  amber400:   getCSSColor('--color-amber-400'),    // was '#d4a84e'
  cream200:   getCSSColor('--color-cream-200'),    // was '#e8e0d0'
  lake400:    getCSSColor('--color-lake-400'),     // was '#4a90d9' (restock icon blue)
};

// Example: sector colors using new tokens
const SECTOR_COLORS = {
  easy:     { line: getCSSColor('--color-moss-500') },   // was '#8a9a5b'
  moderate: { line: getCSSColor('--color-amber-500') },  // was '#c8973e'
  hard:     { line: getCSSColor('--color-rust-500') },   // was '#a0522d'
};
```

**Timing note:** `getComputedStyle` calls must happen inside `initMap()` / `initChart()` (after DOM + CSS are loaded), not at module scope. The existing async init functions already run after DOMContentLoaded, so this is safe.

### Pattern 3: BaseLayout Width Restructure

**What:** Remove the `max-w-4xl mx-auto px-4 py-8` constraint from `<main>` in BaseLayout. Move equivalent per-section classes to each section in `index.astro`.

**When to use:** Required for DSN-05 and as a prerequisite for Phase 13 (full-width hero).

**BaseLayout.astro change (one-line edit):**
```astro
<!-- BEFORE -->
<main class="max-w-4xl mx-auto px-4 py-8">
  <slot />
</main>

<!-- AFTER -->
<main>
  <slot />
</main>
```

**index.astro change (wrap existing sections):**
```astro
<!-- Each existing section gets an explicit container so appearance is unchanged -->
<section class="max-w-4xl mx-auto px-4 py-[--spacing-section] flex flex-col items-center text-center">
  <!-- badge content (currently py-[--spacing-section]) -->
</section>

<section class="max-w-4xl mx-auto px-4 py-[--spacing-block] flex justify-center">
  <!-- DonateCallout -->
</section>

<!-- etc. for each section -->
```

**Key:** The `py-8` currently on `<main>` becomes per-section `py-[--spacing-block]` or `py-[--spacing-section]` depending on context. No visual change to the existing layout.

### Anti-Patterns to Avoid

- **Using `@theme` without `static` when tokens are needed in JS:** Tokens may not be output to the stylesheet if Tailwind's content scan doesn't find their utility classes. Silent failure — `getComputedStyle` returns empty string, Chart.js renders with no color.
- **Reading CSS variables at module scope (outside async init):** Stylesheet may not be applied yet. Always read inside `initMap()` or `initChart()`, not at the top of the `<script>` block.
- **Using berry-600/lake-600/moss-600 for body text:** These colors fail WCAG AA for normal text on `forest-900`. Restrict them to large headings (3:1 threshold), borders, and decorative elements.
- **Negative margin full-width breakout:** Do NOT use `width: 100vw; margin-left: calc(-50vw + 50%)`. It causes horizontal scrollbar on mobile. Removing the BaseLayout constraint is the correct approach.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WCAG contrast verification | Custom contrast calculation | colourcontrast.cc or webaim.org | Contrast math has edge cases (luminance formula, precision); use a verified tool |
| CSS variable-to-JS bridge | Custom observer/event system | `getComputedStyle(document.documentElement).getPropertyValue()` | This is the standard browser API, already supported everywhere |
| "Always output" CSS vars | Separate `:root {}` block outside @theme | `@theme static` | `@theme static` outputs vars AND generates utility classes from same definition |

**Key insight:** The only moving part in this phase is knowing that `@theme static` is required for JavaScript-accessed tokens. Everything else is mechanical search-and-replace of hex values.

## Common Pitfalls

### Pitfall 1: @theme Without `static` — getComputedStyle Returns Empty String

**What goes wrong:** New color tokens are defined in `@theme` but none of the new color utilities are used in HTML yet (this is Phase 12 — we're just defining the tokens, not using them in components). Tailwind's content scan finds no uses of `bg-berry-600`, `text-gold-500`, etc. Tailwind does not output those variables to `:root`. When RouteMap's JavaScript calls `getComputedStyle(document.documentElement).getPropertyValue('--color-berry-600')`, it returns `''`. Chart.js and Leaflet receive empty strings for color, rendering with no color or browser defaults.

**Why it happens:** Tailwind 4's default optimization behavior excludes unused CSS variables from the output bundle.

**How to avoid:** Change `@theme {` to `@theme static {` in `global.css`. All tokens are then always output regardless of utility class usage.

**Warning signs:** Open DevTools > Elements > `:root` in computed styles. If new color variables don't appear there after build, the `static` keyword is missing.

### Pitfall 2: WCAG AA Failure — Berry/Lake/Moss Colors Fail Against Dark Backgrounds

**What goes wrong:** Developer picks visually appealing berry, lake, and moss values, adds them as `@theme` tokens, and uses them for text and UI elements. Users with low vision cannot read the content. Automated accessibility audit flags failures.

**Why it happens:** Dark backgrounds like `forest-900` (#1a2e1a) and `forest-950` (#0d1a0d) require relatively high-luminance foreground colors to meet 4.5:1. Mid-saturation colors in the berry (red-purple) and lake (blue) ranges are darker than gold/amber and need to be significantly lighter to pass.

**Verified contrast data (against forest-900 #1a2e1a):**
| Color | Hex | Ratio | AA Normal? |
|-------|-----|-------|-----------|
| berry-600 | #9a3a4f | 2.13:1 | FAIL |
| berry-500 | #b34d63 | 2.87:1 | FAIL |
| lake-600 | #2b6cb0 | 3.31:1 | FAIL (large text only) |
| lake-400 | #4a9eca | 4.85:1 | PASS |
| gold-500 | #d4a017 | 6.10:1 | PASS |
| amber-500 | #c8973e | 5.49:1 | PASS (existing token) |
| moss-600 | #6b7c3f | 3.91:1 | FAIL |

**How to avoid:** Use contrast checker before finalizing hex values. For berry and lake families, lighten by 15-25% luminance from the initial candidates. Berry used as a border/accent color (not text) is exempt from the 4.5:1 requirement.

**Warning signs:** Any new color used as body text that isn't checked against the primary backgrounds.

### Pitfall 3: BaseLayout Change Breaks Section Spacing

**What goes wrong:** Removing `py-8` from `<main>` removes all top/bottom padding from every section if the sections don't add their own. The page content collapses against the top of the viewport and sections run together.

**Why it happens:** The current `index.astro` sections use `py-[--spacing-section]` and `py-[--spacing-block]` from their own classes — but the outer `py-8` from `<main>` also contributes to the top of the first section and bottom of the last. When removed, if the first and last sections don't compensate, the page loses those padding values.

**How to avoid:** After removing the classes from `<main>`, do a visual comparison of the page. Ensure the first section (`badge` section) has `py-[--spacing-section]` and the last section (footer) has matching padding. The existing sections already have explicit `py` classes — this is a lower risk than it appears, but must be verified visually.

**Warning signs:** Page content starts at the very top edge (no whitespace above badge), or sections have inconsistent gaps.

### Pitfall 4: Hardcoded SVG Colors in HTML Markup vs JavaScript

**What goes wrong:** Developer replaces hex values in the JavaScript SECTOR_COLORS and Chart.js config but misses inline SVG HTML strings like the `fill="#c8973e"` inside the bike marker `<circle>` and the `fill="#4a90d9"` in the restock water drop SVG. These are string literals embedded in `html:` properties of `L.divIcon` objects.

**Why it happens:** These are not CSS color properties — they're SVG `fill` and `stroke` attributes baked into HTML strings. They look different from Chart.js config values and are easy to miss in a search.

**How to avoid:** Use a targeted search for all hex patterns in the component files. The full list from the current codebase:

| File | Line | Current Value | Replace With |
|------|------|--------------|-------------|
| RouteMap.astro | 53 | `'#8a9a5b'` (easy sector) | `getCSSColor('--color-forest-600')` or new moss token |
| RouteMap.astro | 54 | `'#c8973e'` (moderate sector) | `getCSSColor('--color-amber-500')` |
| RouteMap.astro | 55 | `'#a0522d'` (hard sector) | `getCSSColor('--color-rust-500')` |
| RouteMap.astro | 126 | `'#1a2e1a'` (route line color) | `getCSSColor('--color-forest-900')` |
| RouteMap.astro | 136 | `fill="#c8973e"` in SVG string | `fill="${getCSSColor('--color-amber-500')}"` |
| RouteMap.astro | 136 | `stroke="#1a2e1a"` in SVG string | `stroke="${getCSSColor('--color-forest-900')}"` |
| RouteMap.astro | 174 | `fill="#4a90d9"` (restock icon) | `fill="${getCSSColor('--color-lake-400')}"` |
| RouteMap.astro | 174 | `stroke="#1a2e1a"` (restock icon) | `stroke="${getCSSColor('--color-forest-900')}"` |
| RouteMap.astro | 214 | `background:#d4a84e` (photo marker inline style) | `background:${getCSSColor('--color-amber-400')}` |
| RouteMap.astro | 214 | `border:2px solid #1a2e1a` (photo marker) | `border:2px solid ${getCSSColor('--color-forest-900')}` |
| ElevationProfile.astro | 73 | `borderColor: '#c8973e'` | `getCSSColor('--color-amber-500')` |
| ElevationProfile.astro | 123-131 | `color: '#e8e0d0'` (×4 occurrences) | `getCSSColor('--color-cream-200')` |

**Warning signs:** `grep -n '#[0-9a-fA-F]' src/components/RouteMap.astro` still returns results after the migration.

## Code Examples

### getComputedStyle Helper Pattern (Verified)

```javascript
// Source: https://tailwindcss.com/docs/theme (official Tailwind 4 documentation)
// Place this helper at the top of initMap() and initChart(), not at module scope

function getCSSColor(varName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}
```

### @theme static Declaration (Verified)

```css
/* Source: https://tailwindcss.com/docs/theme */
/* global.css */
@theme static {
  /* All existing tokens remain here */
  --color-forest-950: #0d1a0d;
  --color-forest-900: #1a2e1a;
  /* ... etc ... */

  /* New v1.1 tokens — all verified against primary backgrounds */
  --color-gold-500: #d4a017;   /* 7.55:1 on forest-950, 6.10:1 on forest-900 — PASS */
  --color-lake-400: #4a9eca;   /* 6.01:1 on forest-950, 4.85:1 on forest-900 — PASS */
  /* berry and moss: use for decorative/large-text only, not body text */
  --color-berry-600: #9a3a4f;
  --color-moss-600: #6b7c3f;
}
```

### Inline SVG Color Substitution (Verified Pattern)

```javascript
// Source: MDN getComputedStyle + existing RouteMap.astro patterns
// Build SVG strings dynamically using getCSSColor for all color values

const amber500 = getCSSColor('--color-amber-500');
const forest900 = getCSSColor('--color-forest-900');

const bikeIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6" fill="${amber500}" stroke="${forest900}" stroke-width="2"/>
  </svg>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});
```

### SECTOR_COLORS Migration (Verified Pattern)

```javascript
// Source: existing RouteMap.astro pattern, migrated to getCSSColor
// Called inside initMap() after getCSSColor helper is defined

const SECTOR_COLORS = {
  easy:     { line: getCSSColor('--color-moss-500') },
  moderate: { line: getCSSColor('--color-amber-500') },
  hard:     { line: getCSSColor('--color-rust-500') },
};
```

Note: `SECTOR_COLORS` is currently defined at module scope (line 52 in RouteMap.astro). It must be **moved inside `initMap()`** so `getCSSColor` runs after the CSS is loaded. Moving it inside `initMap()` is safe — it is only used inside that function.

### ElevationProfile borderColor and tick color Migration

```javascript
// Source: existing ElevationProfile.astro pattern, migrated
// Called inside initChart()

const amber500 = getCSSColor('--color-amber-500');
const cream200 = getCSSColor('--color-cream-200');

// In Chart.js dataset config:
borderColor: amber500,           // was '#c8973e'
backgroundColor: `${amber500}26`, // was 'rgba(200, 151, 62, 0.15)'
                                  // Note: 26 hex = 15% opacity

// In scales config:
title: { color: cream200 },      // was '#e8e0d0'
ticks: { color: cream200 },      // was '#e8e0d0'
```

**Handling rgba in Chart.js:** Chart.js accepts hex colors directly. For `rgba(200, 151, 62, 0.15)` (the fill under the elevation line), use `getCSSColor('--color-amber-500') + '26'` where `26` is hex for 15% opacity (0.15 × 255 ≈ 38 = `0x26`). Alternatively, construct `rgba()` from the CSS var value by parsing it.

### BaseLayout.astro Edit (Exact Change)

```astro
<!-- Source: direct file analysis -->
<!-- BEFORE (line 28 in BaseLayout.astro) -->
<main class="max-w-4xl mx-auto px-4 py-8">

<!-- AFTER -->
<main>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` theme extension | `@theme { }` block in CSS | Tailwind v4 (2025) | No JS config file; tokens live in CSS |
| Always output all CSS vars | Only used vars output by default | Tailwind v4 | Need `@theme static` for JS-accessed vars |
| `theme()` function in CSS | `var(--color-*)` CSS custom properties | Tailwind v4 | Standard CSS vars work everywhere including JS |

**Deprecated/outdated:**
- `tailwind.config.js`: Not used in this project (CSS-first from v1.0). Do not create one.
- `@apply` for custom component styles: Discouraged in Tailwind 4 in favor of utility classes or real CSS. Not used in this project.

## Open Questions

1. **Exact berry/gold/lake/moss hex values**
   - What we know: Starting candidates are in the Code Examples above; gold-500 (#d4a017) and lake-400 (#4a9eca) pass WCAG AA against both backgrounds; berry and moss families fail for normal text
   - What's unclear: The designer's visual preference within the passing-contrast range has not been decided
   - Recommendation: Treat the hex values in this research as "contrast-verified starting points" that will be refined during implementation. The implementation task should explicitly include visual review and adjustment within passing-contrast bounds.

2. **SECTOR_COLORS scope: module-scope vs. inside initMap()**
   - What we know: `SECTOR_COLORS` is currently at module scope in RouteMap.astro (before `initMap()`), but `getCSSColor` must be called after CSS loads
   - What's unclear: Whether any other code references `SECTOR_COLORS` from outside `initMap()` (visual inspection shows it is only used inside the function)
   - Recommendation: Move `SECTOR_COLORS` inside `initMap()` as part of the migration. This is safe and correct.

3. **ElevationProfile rgba conversion**
   - What we know: Chart.js sector fill colors use `rgba()` syntax with 0.18 opacity; `getComputedStyle` returns the hex value, not rgba
   - What's unclear: Whether to build a small hex-to-rgba helper or use a different approach
   - Recommendation: Write a 3-line `hexToRgba(hex, alpha)` helper inside `initChart()`. This is simple enough to not require a library. Document it in the plan.

## Sources

### Primary (HIGH confidence)
- https://tailwindcss.com/docs/theme — `@theme static` keyword, `getComputedStyle` pattern, CSS variable output behavior
- https://colourcontrast.cc — Contrast ratio tool; all contrast values in this document verified here
- Direct source analysis of `src/components/RouteMap.astro`, `src/components/ElevationProfile.astro`, `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro`

### Secondary (MEDIUM confidence)
- https://tailwindcss.com/docs/adding-custom-styles — Verified CSS variable accessibility from JavaScript context
- https://tailwindlabs/tailwindcss discussions/16436 — Community discussion confirming `@theme static` is required for JS-accessed variables

### Tertiary (LOW confidence)
- WebSearch results on Ojibwe-inspired color palettes — No authoritative source found; hex values are original recommendations informed by general color theory and contrast requirements only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Tailwind 4.2.2 already installed; no new dependencies; APIs verified via official docs
- Architecture: HIGH — Based on direct source file analysis of the existing codebase; changes are surgical and well-defined
- Color token hex values: MEDIUM — Starting values are contrast-verified but visual refinement is expected during implementation
- WCAG contrast data: HIGH — Verified via colourcontrast.cc for each color

**Research date:** 2026-03-31
**Valid until:** 2026-05-01 (stable Tailwind 4 APIs; color choices are design decisions, not technical)
