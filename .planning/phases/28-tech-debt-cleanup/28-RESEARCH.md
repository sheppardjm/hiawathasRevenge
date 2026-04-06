# Phase 28: Tech Debt Cleanup - Research

**Researched:** 2026-04-06
**Domain:** CSS custom properties, Astro Fonts API, cross-browser CSS rendering
**Confidence:** HIGH

## Summary

Phase 28 resolves three discrete defects with no shared dependencies. DEBT-01 fixes an undefined `--font-body` CSS variable in RouteMap.astro by adding Spectral via Astro's native Fonts API and defining a `--font-serif` custom property. DEBT-02 renames the NF2217 annotation entry to NF2217-2218 in three locations (annotations.json, sector-details.json, sector-elevations.json) and confirming the rendered UI already uses the canonical name. DEBT-03 adds a Firefox-compatible fallback for the `background-clip: text` gradient star rating in RouteExplainer.astro using `color: transparent` alongside `-webkit-text-fill-color: transparent`.

All three fixes are small, targeted CSS/data edits. No new npm packages are required. The project already uses the Astro Fonts API (stable in Astro 6, confirmed in `astro.config.ts`), so adding Spectral follows the exact same pattern as the existing EB Garamond entry.

**Primary recommendation:** Follow the existing Astro Fonts API pattern to add Spectral, use `@supports (background-clip: text)` to guard the gradient star technique, and update three JSON files to use NF2217-2218.

## Standard Stack

No new libraries are introduced. This phase operates entirely within the existing stack.

### Core (existing)
| Technology | Version | Purpose | Notes |
|-----------|---------|---------|-------|
| Astro Fonts API | Astro 6 (stable) | Font loading via `fontProviders.google()` | Already used for Space Mono, National Park, EB Garamond |
| CSS custom properties | n/a | Design token variables | `--font-serif` added to `@theme static` in global.css |
| CSS `background-clip: text` | Baseline widely available (Firefox 49+) | Gradient text clipping for stars | Requires `color: transparent` companion |

### No New Installs Required

```bash
# No npm installs needed for this phase
```

## Architecture Patterns

### How the Astro Fonts API Works in This Project

The project uses Astro 6's stable (non-experimental) Fonts API. The pattern:

1. Declare font in `astro.config.ts` under `fonts: [...]`
2. Add `<Font cssVariable="--font-spectral" />` in `src/layouts/BaseLayout.astro` `<head>`
3. Define semantic alias `--font-serif: var(--font-spectral, 'Spectral', Georgia, serif)` in `global.css @theme static`
4. Reference `--font-serif` in component CSS

The `--font-garamond` font follows this exact pattern: defined in `astro.config.ts`, imported via `<Font cssVariable="--font-garamond" />` in BaseLayout.astro, and used as `var(--font-garamond, 'EB Garamond', serif)` in HiawathaExplainer.astro.

### Existing Font Variable Pattern in global.css

The current `@theme static` block defines:
```css
--font-mono: var(--font-space-mono, 'Space Mono', ui-monospace, monospace);
--font-display: var(--font-national-park, 'National Park', sans-serif);
```

`--font-serif` follows the same two-token pattern:
```css
--font-serif: var(--font-spectral, 'Spectral', Georgia, serif);
```

### DEBT-02: NF2217 Naming — Three Files, Shared ID

The sector ID `sector-nf2217` appears in all three files and in `RouteExplainer.astro`'s `SECTOR_IDS` map. The ID should NOT change (used for DOM anchoring and cross-component linking). Only the `name` field changes:

| File | Field to Change | Current Value | Target Value |
|------|----------------|---------------|-------------|
| `public/data/annotations.json` | `name` (line 53) | `"NF2217"` | `"NF2217-2218"` |
| `public/data/sector-details.json` | `name` (already `"NF2217-2218"`) | Already correct | No change needed |
| `public/data/sector-elevations.json` | `name` (line 219) | `"NF2217"` | `"NF2217-2218"` |
| `src/components/RouteExplainer.astro` | `SEGMENTS` array and `SECTOR_IDS` key (line 21, 39) | `'NF2217-2218'` in both | Already correct |

**Key finding:** `sector-details.json` and `RouteExplainer.astro` already use "NF2217-2218". Only `annotations.json` and `sector-elevations.json` need updating. The rendered UI reads the name from `annotations.json` for sector overlay labels, so that is the visible fix.

### DEBT-03: Star Rating Firefox Rendering

**Current implementation in RouteExplainer.astro:**
```css
.star-rating {
  --percent: calc(var(--rating) / 5 * 100%);
  color: var(--color-amber-500);       /* solid fallback */
  background: linear-gradient(
    to right,
    var(--color-amber-500) var(--percent),
    var(--color-forest-700) var(--percent)
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;  /* MISSING: no color: transparent */
}
```

**The problem:** `-webkit-text-fill-color: transparent` is well-supported in Firefox 49+ (confirmed via Bugzilla bug 1247777, resolved FIXED, target Mozilla 48). However, `background-clip: text` requires the text color to be transparent to reveal the background. The standard CSS way to achieve this alongside `-webkit-text-fill-color` is to also declare `color: transparent`. The current code relies solely on the vendor-prefixed property without the standardized `color: transparent` that modern CSS specs recommend. Additionally, the `::before` pseudo-element only renders filled stars (★★★★★); the "empty" star portion is the `--color-forest-700` stop in the gradient showing through — Firefox may not render this visually as intended without the proper color transparency.

**The fix pattern (using @supports for safe progressive enhancement):**
```css
.star-rating {
  --percent: calc(var(--rating) / 5 * 100%);
  /* Solid color fallback for non-supporting browsers */
  color: var(--color-amber-500);
}

@supports (background-clip: text) or (-webkit-background-clip: text) {
  .star-rating {
    background: linear-gradient(
      to right,
      var(--color-amber-500) var(--percent),
      var(--color-forest-700) var(--percent)
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;  /* standard companion to -webkit-text-fill-color */
  }
}
```

This approach:
- Falls back gracefully to solid amber text in non-supporting browsers
- Uses `@supports` to conditionally apply the gradient clipping
- Adds `color: transparent` alongside `-webkit-text-fill-color: transparent` for standardized cross-browser behavior
- Preserves the existing gradient colors (amber-500 for filled, forest-700 for empty)

**Note on empty stars:** The current `::before` content is `"★★★★★"` (5 filled star characters). The "empty" appearance is achieved by the forest-700 stop in the gradient, making filled stars amber and unfilled positions dark green. This is already the correct approach — no second `::after` with ☆ characters needed. The fix ensures Firefox renders both the amber and forest-700 portions correctly.

### Anti-Patterns to Avoid

- **Changing the `sector-nf2217` ID**: This ID is used as a DOM anchor (`href="#sector-nf2217"`) and cross-referenced across multiple files. Only the `name` display field changes.
- **Adding a separate `@font-face` declaration for Spectral**: The project uses Astro's Fonts API exclusively. Adding a manual `@font-face` or a `<link>` to Google Fonts CDN would create a duplicate and bypass the API's preloading/optimization.
- **Scoping `--font-serif` to RouteMap only**: The CONTEXT gives discretion on scope but the existing pattern (`--font-mono`, `--font-display`) is global in `@theme static`. Following the same pattern prevents `--font-serif` from being an orphaned local variable.
- **Wrapping gradient stars in a media query instead of @supports**: `@media` is not the right mechanism for feature detection. `@supports` is correct.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Loading Spectral | Manual `<link>` to Google Fonts | Astro Fonts API (`fontProviders.google()`) | Project already uses the API; manual links bypass preloading and local-download optimizations |
| Firefox gradient text | SVG mask or canvas fallback | `@supports` + `color: transparent` | `background-clip: text` has been in Firefox since v49 (2016); no special technique needed, just the right CSS |

**Key insight:** Both font loading and cross-browser gradient text have trivial correct solutions already present in this codebase's patterns. The debt is CSS omissions, not architectural gaps.

## Common Pitfalls

### Pitfall 1: Changing the Sector ID Instead of the Name
**What goes wrong:** Changing `"id": "sector-nf2217"` breaks DOM anchors, Strava links, and the `SECTOR_IDS` map in RouteExplainer.astro.
**Why it happens:** It looks like the ID should match the canonical name.
**How to avoid:** Change only the `name` field. The `id` is an internal reference key, not a display string.
**Warning signs:** Check before committing that all `sector-nf2217` references still resolve.

### Pitfall 2: Forgetting sector-elevations.json
**What goes wrong:** `sector-elevations.json` also has `"name": "NF2217"` (line 219) and is not mentioned prominently in the requirements.
**Why it happens:** The requirements list only annotations.json and sector-details.json.
**How to avoid:** Update all three data files: annotations.json, sector-details.json (already correct), AND sector-elevations.json.
**Warning signs:** Grep for "NF2217" across all JSON to confirm no remaining instances.

### Pitfall 3: Spectral Not Appearing in Sector Panel
**What goes wrong:** Adding `--font-serif` globally but RouteMap.astro's scoped `<style>` block uses `var(--font-body)` which is undefined, not `var(--font-serif)`.
**Why it happens:** The variable name has to be updated to `--font-serif` in RouteMap.astro's `.sector-panel` rule.
**How to avoid:** Update RouteMap.astro line 56 from `font-family: var(--font-body)` to `font-family: var(--font-serif)`.
**Warning signs:** If font is still monospace after adding Spectral, the variable reference was not updated.

### Pitfall 4: RouteMap panel-stars also uses star characters
**What goes wrong:** RouteMap.astro's `.panel-stars` (line 134) uses `color: var(--color-amber-500)` with raw Unicode star characters injected by JS (`'\u2605'.repeat(sector.stars) + '\u2606'.repeat(5 - sector.stars)`). This is NOT the gradient-clip technique — it's a simple color assignment. DEBT-03 only applies to RouteExplainer.astro's `.star-rating` class.
**How to avoid:** Do not touch RouteMap.astro's star rendering; it has no gradient and no Firefox issue.

### Pitfall 5: Adding `<Font cssVariable="--font-spectral" preload />` Without Config Entry
**What goes wrong:** `<Font>` component will fail at build time without a matching entry in `astro.config.ts`.
**Why it happens:** The Font component requires the `cssVariable` to match an entry in `fonts: [...]`.
**How to avoid:** Add the config entry FIRST, then add the `<Font>` tag in BaseLayout.astro.

## Code Examples

### DEBT-01: Add Spectral to astro.config.ts

```typescript
// Source: Astro Fonts API docs (docs.astro.build/en/guides/fonts/)
// Add after existing EB Garamond entry in astro.config.ts
{
  provider: fontProviders.google(),
  name: 'Spectral',
  cssVariable: '--font-spectral',
  weights: [400, 700],
  styles: ['normal', 'italic'],
},
```

### DEBT-01: Add Font tag in BaseLayout.astro

```astro
<!-- Source: Astro Fonts API docs — mirrors existing Font tags for Space Mono, National Park, EB Garamond -->
<Font cssVariable="--font-spectral" />
```

### DEBT-01: Add --font-serif to global.css @theme static

```css
/* Source: mirrors existing --font-mono and --font-display pattern in global.css */
--font-serif: var(--font-spectral, 'Spectral', Georgia, serif);
```

### DEBT-01: Update RouteMap.astro sector panel

```css
/* Change line 56 in RouteMap.astro */
/* BEFORE: */
font-family: var(--font-body);

/* AFTER: */
font-family: var(--font-serif);
```

### DEBT-02: annotations.json rename

```json
// Line 53 in public/data/annotations.json — change "name" field only
// BEFORE:
"name": "NF2217"
// AFTER:
"name": "NF2217-2218"
```

### DEBT-02: sector-elevations.json rename

```json
// Line 219 in public/data/sector-elevations.json — change "name" field only
// BEFORE:
"name": "NF2217"
// AFTER:
"name": "NF2217-2218"
```

### DEBT-03: Star rating Firefox fix in RouteExplainer.astro

```css
/* Source: MDN background-clip docs, Bugzilla 1247777, @supports spec */
/* Replace the current .star-rating block with: */

.star-rating {
  --percent: calc(var(--rating) / 5 * 100%);
  display: inline-block;
  font-size: 1rem;
  line-height: 1;
  /* Solid amber fallback for browsers without background-clip: text support */
  color: var(--color-amber-500);
}

@supports (background-clip: text) or (-webkit-background-clip: text) {
  .star-rating {
    background: linear-gradient(
      to right,
      var(--color-amber-500) var(--percent),
      var(--color-forest-700) var(--percent)
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
}
```

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Manual Google Fonts `<link>` | Astro Fonts API (`fontProviders.google()`) | Project already on current approach |
| `-webkit-text-fill-color: transparent` only | `color: transparent` + `-webkit-text-fill-color: transparent` | Both are needed for full cross-browser coverage |
| No `@supports` guard on gradient text | `@supports (background-clip: text)` wrapper | Enables graceful fallback to solid color |

**Notes on Firefox gradient text:**
- Firefox has supported `background-clip: text` and `-webkit-text-fill-color` since Firefox 49 (September 2016)
- The issue is not missing Firefox support; it's missing `color: transparent` and the absence of an `@supports` guard that ensures solid-color fallback in edge cases
- `background-clip: text` is now Baseline Widely Available (caniuse data: Firefox 49+, Chrome 120+, Safari 14+, Edge 120+)

## Open Questions

1. **`<Font cssVariable="--font-spectral" preload />` vs without preload**
   - What we know: The existing `Space Mono` and `National Park` fonts use `preload`, while `EB Garamond` does not
   - What's unclear: Whether Spectral should preload (preload is for above-the-fold critical fonts)
   - Recommendation: Omit `preload` for Spectral — the sector panel body text is below-the-fold and non-critical

2. **Whether sector-elevations.json name field is rendered in the UI**
   - What we know: `sector-elevations.json` is fetched by RouteMap.astro's `initMap()` but the `name` field is not visibly rendered — only `id`, `elevationPoints`, `eleMin`, `eleMax`, `difficulty` are used
   - What's unclear: Whether the name field in elevations data affects any UI element
   - Recommendation: Update it anyway for data consistency per DEBT-02 requirements

## Sources

### Primary (HIGH confidence)
- Astro Fonts API official docs (`docs.astro.build/en/guides/fonts/`) — confirmed stable API, `fontProviders.google()` usage
- `astro.config.ts` in project — confirmed pattern for adding fonts (EB Garamond is exact template)
- `src/layouts/BaseLayout.astro` — confirmed `<Font>` component usage pattern
- `src/styles/global.css` — confirmed `@theme static` custom property definitions
- `src/components/RouteExplainer.astro` — confirmed star rating CSS and gradient colors
- `src/components/RouteMap.astro` — confirmed `var(--font-body)` undefined reference
- `public/data/annotations.json`, `sector-details.json`, `sector-elevations.json` — confirmed which files need NF2217 rename
- Bugzilla bug 1247777 (RESOLVED FIXED, target Firefox 48) — confirmed Firefox supports `-webkit-text-fill-color`
- caniuse.com/background-clip-text — confirmed Firefox 49+ support for `background-clip: text`

### Secondary (MEDIUM confidence)
- MDN `-webkit-text-fill-color` page — "Baseline Widely available" since September 2016
- Astro docs example — confirmed `fontProviders.google()` config format
- mdn/content issue #2638 — recommended using `color: transparent` + `@supports` guard pattern

## Metadata

**Confidence breakdown:**
- DEBT-01 (font fix): HIGH — exact API pattern exists in project (EB Garamond), direct code inspection confirms missing variable
- DEBT-02 (naming): HIGH — direct JSON inspection confirms which files need changes and which are already correct
- DEBT-03 (Firefox stars): HIGH — browser support confirmed via Bugzilla/caniuse; fix is a well-established CSS pattern

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable CSS features and Astro API patterns; 30-day window appropriate)
