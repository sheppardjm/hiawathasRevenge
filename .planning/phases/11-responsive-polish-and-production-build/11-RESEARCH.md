# Phase 11: Responsive Polish and Production Build - Research

**Researched:** 2026-03-31
**Domain:** CSS responsive design, accessibility (prefers-reduced-motion), Astro static build, touch target sizing
**Confidence:** HIGH

## Summary

Phase 11 has four distinct workstreams: touch target sizing, prefers-reduced-motion suppression, responsive layout audit, and production build verification. Research found that most of the work is CSS-in-global.css overrides plus a critical Astro configuration fix. The build currently produces `dist/client/` and `dist/server/` subdirectories (not `dist/`) because `admin.astro` and `api/save-manifest.ts` use `prerender = false`, which forces the `@astrojs/node` adapter into hybrid mode. The success criterion "no SSR output" requires resolving this conflict.

The key finding is that **the admin page cannot coexist with a purely static build producing a flat `dist/` output**. The planner must choose: remove the node adapter and make admin dev-only via a different mechanism, or accept that production output lives in `dist/client/` (not `dist/`). This is the largest decision this phase must make.

All other workstreams are straightforward: Tailwind 4's `motion-reduce:` variant handles CSS transitions, PhotoSwipe 5 handles reduced motion automatically in JS, Leaflet requires a CSS override + JS map option, and Chart.js needs a `window.matchMedia` check before init. Touch targets need CSS overrides for Leaflet control buttons (currently 26px default, 30px on touch).

**Primary recommendation:** Remove `@astrojs/node` adapter and convert admin page to dev-only via `import.meta.env.DEV` guard at the page level (not `prerender = false`), enabling a flat `dist/` static output. Alternatively, keep the adapter and accept `dist/client/` as the deployable output directory.

## Standard Stack

### Core (already installed — no new packages needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.2.x | `motion-reduce:` variant for CSS transitions | Built into Tailwind 4, no plugin needed |
| Chart.js | 4.5.x | `animation: false` on init suppresses chart transitions | Already in use |
| Leaflet | 1.9.x | `zoomAnimation: false` map option + CSS overrides | Already in use |
| PhotoSwipe | 5.4.x | Automatically handles `prefers-reduced-motion` in JS | Built-in, no config needed |
| Astro | 6.1.x | Static build with `output: 'static'` | Already configured |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @astrojs/node | 10.x | Required ONLY if any page keeps `prerender = false` | Remove if going fully static |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Removing node adapter | Keep adapter, deploy `dist/client/` | Simpler but success criterion says "no SSR output" |
| CSS `@media (prefers-reduced-motion: reduce)` | Tailwind `motion-reduce:` variant | Both work; CSS is simpler for existing non-Tailwind styles |

**Installation:** No new packages needed.

## Architecture Patterns

### Pattern 1: Astro Static Build — The Admin Page Conflict

**What:** The current build uses `output: 'static'` in `astro.config.ts` but has two files with `prerender = false`:
- `src/pages/admin.astro` (line 5: `export const prerender = false`)
- `src/pages/api/save-manifest.ts` (line 5: `export const prerender = false`)

Because the `@astrojs/node` adapter is present, Astro runs in hybrid mode and produces:
```
dist/
  client/      ← static assets (index.html, thumbs/, data/, etc.)
  server/      ← SSR entry (entry.mjs, chunks/)
```

The build log confirms this: `[build] mode: "server"` despite `output: 'static'`.

**The fix (recommended — fully static):**
Remove `@astrojs/node` from `astro.config.ts` and change the admin page to fail at request time in production without needing SSR:

```typescript
// astro.config.ts — remove adapter
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  // NO adapter — produces flat dist/ directory
  fonts: [...],
  vite: { plugins: [tailwindcss()] },
});
```

```astro
// admin.astro — dev-only via static prerender + redirect in PROD
---
// With output:'static' and NO prerender=false, this page IS prerendered.
// In production, redirect away immediately via meta refresh.
if (import.meta.env.PROD) {
  return Astro.redirect('/');
}
// rest of admin page code...
---
```

This produces a flat `dist/` with `dist/index.html`, `dist/thumbs/`, `dist/data/`, etc.

**Alternative (keep adapter, accept dist/client/):**
If the adapter stays, the deployable directory is `dist/client/`, not `dist/`. The success criterion "produces correct static output" would still be met, but the path differs. The OSM attribution check would need to look in `dist/client/`.

**WARNING:** Removing `@astrojs/node` means `save-manifest.ts` (a POST API endpoint) also cannot work. Since `save-manifest.ts` is dev-only admin functionality, this is acceptable — it only needs to work in `npm run dev`, not production.

### Pattern 2: Touch Target Sizing

**What:** WCAG 2.5.5 (Level AAA) specifies 44×44px minimum; the phase requires 52px. The current problematic elements are:

1. **Leaflet control buttons** (zoom +/-, reset): default 26px, touch devices get 30px. Both fail 52px requirement.
2. **Donate button**: `padding: 0.75rem 2rem` on `font-size: 1.125rem` line-height ~1.8rem = ~32px total height. Fails 52px.
3. **GPX download link**: `padding: 0.5rem 1.5rem` = ~28px height. Fails 52px.
4. **Gallery grid thumbnails**: `aspect-square` thumbnails — on 375px mobile with 2-col grid and `gap-2`, each cell is ~(375-16-8)/2 = ~175px. Pass easily.
5. **PhotoSwipe lightbox nav**: PhotoSwipe 5 uses its own CSS; arrows are ~44px by default. May need verification.

**Fix for CSS-controlled elements (donate button, GPX link):**
Add `min-height: 52px` (or `3.25rem`) and adjust padding to compensate. No Tailwind utility needed — these use scoped `<style>` blocks.

**Fix for Leaflet buttons — CSS override in global.css:**
```css
@media (prefers-reduced-motion: no-preference), (prefers-reduced-motion: reduce) {
  /* always apply touch target fix */
}

/* Target all leaflet bar buttons at 52px */
@layer base {
  .leaflet-bar a {
    width: 52px !important;
    height: 52px !important;
    line-height: 52px !important;
  }
}
```

Note: Leaflet CSS is in `@layer leaflet` (lowest priority). The `@layer base` overrides win. The `!important` is NOT needed if layer order is correct — `base` already beats `leaflet`. Use specificity matching instead:

```css
@layer base {
  .leaflet-bar a {
    width: 52px;
    height: 52px;
    line-height: 52px;
  }
  .leaflet-touch .leaflet-bar a {
    width: 52px;
    height: 52px;
    line-height: 52px;
  }
}
```

### Pattern 3: prefers-reduced-motion Implementation

**What:** The `@media (prefers-reduced-motion: reduce)` media query suppresses animations.

**CSS approach (Tailwind 4 `motion-reduce:` variant):**
For elements using Tailwind utility classes:
```html
<button class="transition-colors duration-200 motion-reduce:transition-none ...">
```

For scoped CSS in component `<style>` blocks:
```css
@media (prefers-reduced-motion: reduce) {
  .donate-button {
    transition: none;
  }
  .gpx-download {
    transition: none;
  }
}
```

**JavaScript approach for Chart.js:**
Chart.js currently has `animation: false` already set in options — no transitions to suppress. Confirmed at `ElevationProfile.astro` line 88: `animation: false`. No action needed for Chart.js.

**JavaScript approach for Leaflet:**
Leaflet animations come from:
1. CSS: `.leaflet-zoom-anim .leaflet-zoom-animated { transition: transform 0.25s ... }` and `.leaflet-fade-anim .leaflet-popup { transition: opacity 0.2s ... }`
2. JS: `map.flyTo()` / `map.panTo()` with animate:true

CSS approach (preferred — suppresses both CSS and some JS-driven animations):
```css
@layer base {
  @media (prefers-reduced-motion: reduce) {
    .leaflet-zoom-anim .leaflet-zoom-animated {
      transition: none !important;
    }
    .leaflet-fade-anim .leaflet-popup {
      transition: none !important;
    }
  }
}
```

JS approach (for the reset button `fitBounds` call — currently in RouteMap.astro):
```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Pass animate:false to fitBounds when user prefers reduced motion
map.fitBounds(initialBounds, {
  padding: [20, 20],
  animate: !prefersReducedMotion
});
```

The current `initMap()` uses `fitBounds()` (not `flyTo()`), so animation is minimal by default. Still worth guarding.

**PhotoSwipe 5 — no action needed:**
PhotoSwipe 5 automatically disables animations when `prefers-reduced-motion: reduce` is detected. Confirmed in source: `node_modules/photoswipe/dist/types/photoswipe.d.ts`: "Animations are automatically disabled if user (prefers-reduced-motion: reduce)." No configuration required.

### Pattern 4: Responsive Layout Audit

**What:** The page uses `max-w-4xl mx-auto px-4` in `BaseLayout.astro` (line 27). At 375px mobile, `max-w-4xl` (896px) does not constrain width, so the full 375px with `px-4` (16px each side) = 343px content area. This is correct.

Known potential issues to audit:
1. **Stats grid** (`RouteStats.astro`): `grid-template-columns: repeat(3, 1fr)` — at 375px, three columns of ~109px each. Stat values use `font-size: 1.875rem` — may overflow or wrap awkwardly. **Likely needs responsive override to 1-col or 2-col.**
2. **Badge** (`index.astro`): At 375px uses `width: 300px`, at 640px uses `width: 420px`. At 375px this is 300px / 375px = 80% of viewport — should be fine.
3. **Map height**: `height: 60vh; min-height: 400px` — at 375px, 60vh = 225px, but min-height: 400px takes over. Map will be 400px tall. This is intentional but may feel tall on small screens.
4. **Elevation chart**: `h-[140px] sm:h-[180px]` — fixed heights, should not overflow.
5. **Photo gallery**: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` — 2-col at 375px is correct.

### Anti-Patterns to Avoid

- **Inline `!important` in component styles for Leaflet overrides:** The cascade layer `@layer leaflet` (declared in `global.css` line 4) already ensures `@layer base` overrides Leaflet CSS without `!important`. Prefer using layer specificity.
- **Removing the node adapter without also removing `prerender = false`:** The build will error — Astro requires an adapter if any page has `prerender = false`.
- **Running `astro build` without `PATH="/usr/local/opt/node/bin:$PATH"`:** Node 25 is required per project decisions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PhotoSwipe reduced motion | Custom JS detection + animation disable | Built-in PhotoSwipe 5 feature | Already handled automatically |
| Chart.js reduced motion | Custom CSS override | `animation: false` already set | Chart.js already has no animations |
| Leaflet CSS animation disable | JavaScript-only approach | CSS `@media (prefers-reduced-motion: reduce)` override in `@layer base` | CSS approach also handles tile fade, popup fade |
| Admin page dev-only | Complex routing logic | Static prerender + `Astro.redirect('/')` in PROD | Simpler, no SSR needed |

**Key insight:** Most "reduced motion" work is one CSS block in global.css. Don't overcomplicate it.

## Common Pitfalls

### Pitfall 1: The `dist/client/` vs `dist/` Confusion
**What goes wrong:** Build produces `dist/client/index.html` instead of `dist/index.html`. Preview (`astro preview`) works but the success criterion says "all thumbnails serve from dist/".
**Why it happens:** `@astrojs/node` adapter forces hybrid mode, splitting output into client/server subdirectories regardless of `output: 'static'`.
**How to avoid:** Remove the adapter from `astro.config.ts` AND remove `prerender = false` from both admin files.
**Warning signs:** Build log shows `[build] mode: "server"` and `dist/server/` directory exists after build.

### Pitfall 2: Leaflet Control Button Touch Targets Require CSS Cascade Awareness
**What goes wrong:** Adding `.leaflet-bar a { width: 52px }` to a scoped `<style>` in `RouteMap.astro` has no effect because Leaflet CSS is in `@layer leaflet` which scoped styles don't override correctly.
**Why it happens:** Astro scoped styles use attribute selectors (`.leaflet-bar a[data-astro-cid-...]`) which don't match dynamically created Leaflet DOM elements.
**How to avoid:** Put Leaflet button overrides in `global.css` inside `@layer base`. The declared layer order `@layer leaflet, base, ...` ensures `base` wins.

### Pitfall 3: Stats Grid Overflow at 375px
**What goes wrong:** Three-column stats grid on 375px mobile shows very cramped numbers or text wraps badly.
**Why it happens:** `grid-template-columns: repeat(3, 1fr)` with `font-size: 1.875rem` and `padding: 1rem` in each cell = narrow columns.
**How to avoid:** Add responsive override: `grid-cols-1 sm:grid-cols-3` (using Tailwind) or `@media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr; } }` in scoped style.

### Pitfall 4: Node Adapter Removed but `save-manifest.ts` Still Has `export const prerender = false`
**What goes wrong:** `astro build` errors: "Cannot use `prerender = false` without an adapter."
**Why it happens:** `prerender = false` requires an adapter — it's not valid in purely static builds.
**How to avoid:** Remove `prerender = false` from both `admin.astro` and `api/save-manifest.ts`. The API endpoint will still function in `npm run dev` (Astro dev server handles API routes without an adapter).

### Pitfall 5: OSM Attribution Hidden by z-index
**What goes wrong:** OSM attribution control is invisible in production build due to z-index stacking issues with the Leaflet map container.
**Why it happens:** The map div has `z-index: 0` (set in `RouteMap.astro` `.route-map` style). Leaflet attribution uses `z-index: 800` relative to the map container — this should be fine but can be overridden by page styles.
**How to avoid:** Verify attribution is visible at production URL. If hidden, add to `global.css`:
```css
@layer base {
  .leaflet-control-attribution {
    z-index: 800 !important;
    position: relative;
  }
}
```

### Pitfall 6: `motion-reduce:` Tailwind Variant Unavailability
**What goes wrong:** `motion-reduce:transition-none` has no effect on elements whose transitions are defined in scoped `<style>` blocks (not Tailwind utilities).
**Why it happens:** Tailwind variants only apply to utility classes, not to custom CSS. The donate button and GPX link transitions are in component `<style>` blocks.
**How to avoid:** For scoped CSS transitions, use `@media (prefers-reduced-motion: reduce)` directly in the component's `<style>` block — not Tailwind variants.

## Code Examples

### Disable Leaflet Animations (CSS, global.css)
```css
/* Source: MDN prefers-reduced-motion + Leaflet CSS layer knowledge */
@layer base {
  @media (prefers-reduced-motion: reduce) {
    .leaflet-zoom-anim .leaflet-zoom-animated {
      transition: none;
    }
    .leaflet-fade-anim .leaflet-popup {
      transition: none;
    }
    .leaflet-pan-anim .leaflet-tile {
      transition: none;
    }
  }
}
```

### Leaflet Touch Target Override (CSS, global.css)
```css
/* Source: Leaflet CSS defaults (leaflet.css lines 288-333); layer order ensures base wins */
@layer base {
  .leaflet-bar a {
    width: 52px;
    height: 52px;
    line-height: 52px;
  }
  .leaflet-touch .leaflet-bar a {
    width: 52px;
    height: 52px;
    line-height: 52px;
  }
}
```

### prefers-reduced-motion in Component Scoped Styles
```css
/* Source: MDN Web Docs - prefers-reduced-motion */
/* In DonateCallout.astro <style> block */
@media (prefers-reduced-motion: reduce) {
  .donate-button {
    transition: none;
  }
}
```

### Leaflet JS Reduced Motion for fitBounds
```javascript
// Source: Leaflet API reference (animate option)
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
map.fitBounds(routeLine.getBounds(), {
  padding: [20, 20],
  animate: !prefersReducedMotion
});
```

### Remove Adapter for Fully Static Output
```typescript
// Source: Astro docs - output modes
// astro.config.ts
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  // No adapter — dist/ is flat, not dist/client/ + dist/server/
  fonts: [...],
  vite: { plugins: [tailwindcss()] },
});
```

### Admin Page Without prerender=false
```astro
---
// admin.astro — works in dev; redirects in prod without needing SSR
// Remove: export const prerender = false

if (import.meta.env.PROD) {
  return Astro.redirect('/');
}

// rest of admin frontmatter unchanged...
---
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `output: 'hybrid'` in Astro | Merged into `output: 'static'` with `prerender = false` | Astro v5 | "hybrid" keyword removed; static+prerender=false IS hybrid now |
| Manual `prefers-reduced-motion` in PhotoSwipe | Automatic in PhotoSwipe 5 | v5.0 | No configuration needed |
| `tailwind.config.js` with plugin | `@theme` in CSS, `motion-reduce:` built-in | Tailwind 4 | No plugin needed; works directly in class names |
| WCAG 2.5.5 (44px AAA) | Phase requires 52px (stricter than AAA) | Phase requirement | Must use CSS min-height/padding, not rely on browser defaults |

**Deprecated/outdated:**
- `output: 'hybrid'`: Astro v5 removed this; `output: 'static'` with `prerender=false` is now the equivalent.

## Open Questions

1. **Admin page in production**
   - What we know: `admin.astro` redirects in production (`if (import.meta.env.PROD) { return Astro.redirect('/'') }`) — but with `prerender = false` this is an SSR redirect, not a static redirect.
   - What's unclear: If we remove `prerender = false`, the page will be statically prerendered. Astro's `Astro.redirect()` in SSG mode emits a `<meta http-equiv="refresh">` redirect. This means `dist/admin/index.html` still exists in production. Is that acceptable? Or should we exclude it from the build entirely?
   - Recommendation: Acceptable — the page redirects immediately and has no sensitive data. If stricter exclusion needed, use a Vite/Astro integration to inject the route dev-only.

2. **save-manifest.ts API endpoint in static mode**
   - What we know: `save-manifest.ts` uses `writeFileSync` — a Node.js fs call. In `npm run dev`, Astro dev server handles this with Node. With `output: 'static'` and no adapter, this endpoint won't be included in the build at all.
   - What's unclear: Will `npm run dev` still serve the POST endpoint without the node adapter?
   - Recommendation: Yes — Astro dev server always supports API routes regardless of adapter. Remove `prerender = false` from `save-manifest.ts`; the endpoint will work in dev and be excluded from production build.

3. **Leaflet fitBounds animation — does current usage animate?**
   - What we know: `fitBounds()` animates by default when the zoom change is within `zoomAnimationThreshold` (4 levels). Initial route bounds span ~5 zoom levels, which likely exceeds the threshold and skips animation already.
   - What's unclear: Whether the reset button's `fitBounds` triggers visible animation in practice.
   - Recommendation: Add `animate: !prefersReducedMotion` guard anyway for correctness; negligible cost.

## Sources

### Primary (HIGH confidence)
- Leaflet CSS source at `node_modules/leaflet/dist/leaflet.css` — button sizes (26px default, 30px touch), animation classes
- PhotoSwipe type definitions at `node_modules/photoswipe/dist/types/photoswipe.d.ts` — "Animations are automatically disabled if user (prefers-reduced-motion: reduce)"
- MDN Web Docs: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion — CSS/JS patterns
- Astro docs: https://docs.astro.build/en/guides/on-demand-rendering/ — hybrid output behavior
- Astro docs: https://docs.astro.build/en/reference/configuration-reference/ — build.client, build.server, output options
- Tailwind docs: https://tailwindcss.com/docs/hover-focus-and-other-states#prefers-reduced-motion — `motion-reduce:` variant

### Secondary (MEDIUM confidence)
- GitHub issue #13191 withastro/astro — confirms dist/client + dist/server split with node adapter + output:static + prerender:false
- Astro build output (`npm run build` observed): `[build] mode: "server"` with adapter present

### Tertiary (LOW confidence)
- Keystatic docs: https://keystatic.com/docs/recipes/astro-disable-admin-ui-in-production — conditional integration approach for dev-only pages (not the approach recommended here, but validated the pattern)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, confirmed in package.json and node_modules
- Architecture: HIGH — build output confirmed by running `npm run build`; CSS layer order confirmed in global.css; component code read directly
- Pitfalls: HIGH for build/adapter issues (confirmed by running build); MEDIUM for responsive overflow issues (inferred from CSS, not visually verified)

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable stack)
