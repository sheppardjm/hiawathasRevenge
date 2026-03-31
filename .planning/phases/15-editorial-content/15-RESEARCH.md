# Phase 15: Editorial Content — Research

**Researched:** 2026-03-31
**Domain:** CSS editorial layout, topographic background textures, star ratings, Astro content components
**Confidence:** HIGH (CSS/MDN verified) / MEDIUM (Astro patterns) / LOW (topo texture specifics)

---

## Summary

Phase 15 requires two new Astro components: a rewritten narrative section about Longfellow's Hiawatha blunder and a route segment-by-segment explainer with integrated photos. The core technical challenges are (1) editorial float/grid layouts that degrade gracefully to mobile single-column, (2) a topographic background texture for the route explainer section, and (3) static star ratings for segment difficulty.

The standard approach for this stack is **CSS Grid with `grid-template-areas`** for the photo-text editorial layout (more robust for responsive than float/shape-outside), with `float` + `shape-outside` reserved for inline paragraph wrapping where a specific "magazine pull-quote" aesthetic is needed. Star ratings should use the **Unicode `★★★★★` + CSS linear-gradient clip technique** — no JS, zero requests, fully accessible via `aria-label`. The topographic texture is best implemented as an **inline SVG `data:` URI in CSS** using the pattern already established by `.topo-divider` in `global.css`.

All layout CSS belongs in component `<style>` blocks (scoped Astro styles), not in Tailwind utilities — this keeps editorial-specific styles isolated. `shape-outside` has no Tailwind utility; use Tailwind's arbitrary property syntax `[shape-outside:circle(50%)]` or write it in the component `<style>` block. The project already has a `.topo-divider` class in `global.css` that demonstrates the inline SVG data URI pattern; extend this for the full section background.

**Primary recommendation:** Use CSS Grid + `grid-template-areas` for photo-text pairing per segment; use `float` + `shape-outside` only for inline paragraph wraps in the Hiawatha narrative. Both degrade to `display: block` / `float: none` at mobile with a single `@media` query.

---

## Standard Stack

### Core (already in project)
| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| Astro | ^6.1.1 | Static component rendering | Frontmatter data import, scoped styles |
| Tailwind CSS | ^4.2.2 | Utility classes for spacing/type | `@theme static` config, no tailwind.config.js |
| CSS (scoped) | n/a | Editorial layout properties | `shape-outside`, `grid-template-areas` in `<style>` blocks |

### No new dependencies needed
All techniques are pure CSS or SVG — no new npm packages required.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS Grid areas | Float + shape-outside throughout | Grid is more robust for responsive; shape-outside only applies to floated elements |
| Inline SVG data URI | External `.svg` file reference | Data URI avoids extra HTTP request; pattern already established in project |
| Unicode star gradient | SVG `<symbol>` + `<use>` stars | SVG stars are more pixel-perfect but require more markup; Unicode is zero-setup |
| CSS Grid areas | Flexbox wrapping | Grid gives exact photo placement control; flex would require more markup hacks |

---

## Architecture Patterns

### Recommended File Structure

```
src/components/
├── HiawathaExplainer.astro    # Rewritten narrative, ~4-5 paragraphs, optional floated photo
├── RouteExplainer.astro       # Segment-by-segment with photos, topo background
└── StarRating.astro           # (optional sub-component) Reusable N/5 star display
src/pages/
└── index.astro                # Replace existing narrative <section> with <HiawathaExplainer />
                               # Add <RouteExplainer /> after FloralDivider
```

### Pattern 1: Photo-Text Grid Layout (per segment)

**What:** Each route segment is a grid cell with a photo column and a text column. On mobile it stacks to single column.

**When to use:** Route explainer section, one card per segment.

```css
/* Component <style> block — scoped to RouteExplainer.astro */
.segment-card {
  display: grid;
  grid-template-columns: 1fr;           /* mobile: single column */
  grid-template-areas:
    "photo"
    "content";
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .segment-card {
    grid-template-columns: 280px 1fr;   /* tablet+: photo left, text right */
    grid-template-areas: "photo content";
    align-items: start;
  }
  /* Alternate photo position for odd segments */
  .segment-card:nth-child(even) {
    grid-template-columns: 1fr 280px;
    grid-template-areas: "content photo";
  }
}

.segment-photo { grid-area: photo; }
.segment-content { grid-area: content; }
```

### Pattern 2: Float + shape-outside for Narrative Wrapping

**What:** Single image floated into prose text with text wrapping around it. Used in HiawathaExplainer only.

**When to use:** Inline editorial pull — one photo inside a multi-paragraph narrative.

```css
/* Must be in <style> block; no Tailwind utility for shape-outside */
.prose-float {
  float: left;
  width: 200px;
  margin: 0 1.5rem 1rem 0;
  shape-outside: inset(0 round 4px);
  shape-margin: 0.5rem;
}

@media (max-width: 767px) {
  .prose-float {
    float: none;
    width: 100%;
    margin: 0 0 1rem 0;
    shape-outside: none;
  }
}
```

**Important:** `shape-outside` only works on floated elements. Widely supported (Baseline: widely available since Jan 2020, ~95% browser coverage). No polyfill needed.

### Pattern 3: Star Rating Display (Static)

**What:** Read-only N/5 star display using Unicode + CSS gradient clip. Zero JS, zero requests.

**Accessibility:** Add `aria-label="Difficulty: 4 out of 5 stars"` on the container element.

```html
<!-- StarRating.astro or inline in RouteExplainer -->
<div
  class="star-rating"
  style={`--rating: ${rating};`}
  aria-label={`Difficulty: ${rating} out of 5 stars`}
  role="img"
>
</div>
```

```css
.star-rating {
  --percent: calc(var(--rating) / 5 * 100%);
  --star-size: 1rem;

  display: inline-block;
  font-size: var(--star-size);
  line-height: 1;

  /* Gradient clips to star glyphs */
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

.star-rating::before {
  content: "★★★★★";
}
```

**Note:** `-webkit-background-clip: text` requires the vendor-prefixed form alongside `background-clip: text`. Both are needed for cross-browser support.

### Pattern 4: Topographic Background Texture

**What:** The route explainer section (`<RouteExplainer />`) renders over a repeating SVG contour-line texture. The project already uses this pattern in `.topo-divider` in `global.css`.

**Implementation:** Extend the existing topo pattern to a full section background using `background-image` with a `data:` URI. The `.topo-divider` SVG in `global.css` is the template to adapt — make the contour lines more complex and repeat on both axes.

```css
/* In RouteExplainer component <style> block */
.route-explainer-section {
  background-color: var(--color-forest-950);   /* slightly darker than body */
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120">
    <path d="M0 30 Q80 10 160 30 Q240 50 320 30 Q360 20 400 30" stroke="%233d6b3d" stroke-width="1" fill="none" opacity="0.4"/>
    <path d="M0 60 Q100 40 200 60 Q300 80 400 60" stroke="%233d6b3d" stroke-width="0.75" fill="none" opacity="0.3"/>
    <path d="M0 90 Q60 75 120 90 Q180 105 240 90 Q300 75 360 90 Q390 97 400 90" stroke="%233d6b3d" stroke-width="0.5" fill="none" opacity="0.2"/>
  </svg>');
  background-repeat: repeat;
  background-size: 400px 120px;
}
```

**SVG URL encoding:** Special chars in `data:image/svg+xml;utf8,` must be URL-encoded when inline in CSS: `#` → `%23`, `<` → `%3C`, etc. The approach in `global.css` (using `%23` for `#` in stroke color) already demonstrates this correctly. Write colors as `%23RRGGBB` (not CSS custom props, since data URIs are static strings — custom properties resolve to computed values at paint time, not at URI parsing time).

**Hardcode stroke color in the data URI** as the hex value of `--color-forest-700` (`#3d6b3d` → `%233d6b3d`) rather than trying to use `var(--color-forest-700)` inside the SVG string.

### Pattern 5: Astro Component Data Wiring

**What:** Route segment data (names, distances, difficulty) is hardcoded from `data.md` in the component frontmatter. Photos are imported from `public/data/photos.json` and assigned to segments by mile range.

**Key insight on photo assignment:** Photos have `mile` fields but no `segment` field. The planner must decide between:
  - (A) Hardcode segment mile ranges in the component and filter photos at build time
  - (B) Add a `segment` field to `photos.json` in the pipeline

Option A (filtering by mile range in frontmatter) is simpler and requires no pipeline changes.

```typescript
// In RouteExplainer.astro frontmatter
import photosData from '../../public/data/photos.json';

const SEGMENTS = [
  { name: '520',                     startMi: 0,    endMi: 5.0,   distFromStart: '1.1mi', length: '1.3mi', difficulty: 2 },
  { name: 'NF2266',                  startMi: 5.0,  endMi: 18.0,  distFromStart: '6.7mi', length: '3.2mi', difficulty: 5 },
  { name: 'Bass Lake Rd',            startMi: 18.0, endMi: 32.0,  distFromStart: '25.3mi', length: '4.8mi', difficulty: 2 },
  { name: 'NF2217-2218',             startMi: 32.0, endMi: 50.0,  distFromStart: '36.8mi', length: '6.6mi', difficulty: 2 },
  { name: 'ND2225',                  startMi: 50.0, endMi: 70.0,  distFromStart: '55.7mi', length: '3.9mi', difficulty: 3 },
  { name: 'Doe Lake',                startMi: 70.0, endMi: 92.0,  distFromStart: '84.8mi', length: '3.1mi', difficulty: 4 },
  { name: 'Rapid River Truck Trail', startMi: 92.0, endMi: 110.0, distFromStart: '94.6mi', length: '6.3mi', difficulty: 2 },
];

const segmentsWithPhotos = SEGMENTS.map(seg => ({
  ...seg,
  photos: photosData
    .filter(p => p.mile >= seg.startMi && p.mile < seg.endMi)
    .slice(0, 3),   // cap at 3 photos per segment for layout control
}));
```

**Photo distribution (actual, verified against photos.json):**
Using the broader mile-range assignment approach yields:
- 520: 0 photos (miles 0-5) — no photos near start
- NF2266: 8 photos
- Bass Lake Rd: 9 photos
- NF2217-2218: 14 photos
- ND2225: 9 photos
- Doe Lake: 6 photos
- Rapid River Truck Trail: 8 photos

The "520" segment has zero photos. The planner should decide whether to show a placeholder, skip the photo column, or use a nearby photo.

### Anti-Patterns to Avoid

- **Using `shape-outside` without `float`**: `shape-outside` is only applied to floated elements. Without `float`, it has no effect.
- **CSS custom properties inside SVG data URIs**: `var(--color-*)` does NOT work inside `background-image: url('data:image/svg+xml,...')` — the URI is a static string. Hardcode hex values.
- **Forgetting `clear: both` after floated elements**: A prose section with a floated image will have the next sibling bleed under the float unless the parent or next element uses `clear: both` or `overflow: hidden`.
- **`-webkit-text-fill-color` without fallback**: Some very old browsers don't support this; adding `color: var(--color-amber-500)` as a fallback before the clip rule ensures legibility.
- **`grid-template-areas` with string mismatches**: Each row string must name the same number of columns. A period (`.`) represents an empty cell. Typos cause the entire grid to fail silently.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Star rating display | Custom icon SVGs or image assets | Unicode ★ + gradient clip | Zero assets, zero requests, single CSS block |
| Topographic texture | Importing an external PNG/JPEG file | Inline SVG `data:` URI | Keeps bundle self-contained; pattern already established in project |
| Responsive layout with photo swap | Complex JavaScript re-ordering | CSS Grid `grid-template-areas` with media queries | HTML order stays fixed; CSS controls visual order |
| Reading difficulty from data | Hardcoding emoji or HTML entities | Computed `--rating` custom property with `::before` stars | One CSS block handles all ratings 1-5 |

**Key insight:** This phase is 95% CSS layout craft, not engineering. The temptation is to reach for JS, but everything required — star display, photo placement, responsive column toggling — is solvable with pure CSS. Resist overengineering.

---

## Common Pitfalls

### Pitfall 1: SVG Data URI Encoding Breaks Background
**What goes wrong:** Background image renders blank or broken because SVG special characters (`<`, `>`, `#`) are not URL-encoded.
**Why it happens:** CSS `url()` requires proper encoding; unencoded `<` causes the browser to interpret the data URI as truncated.
**How to avoid:** URL-encode `<` → `%3C`, `>` → `%3E`, `#` → `%23`, `"` → `%22` inside the SVG string. The project's existing `.topo-divider` in `global.css` already does this correctly — follow its pattern exactly.
**Warning signs:** The background section renders as a solid color with no lines visible.

### Pitfall 2: `background-clip: text` Leaves Invisible Text
**What goes wrong:** Star text becomes completely invisible on browsers that support `-webkit-text-fill-color: transparent` but not the gradient clip.
**Why it happens:** `color: transparent` + no gradient clip = invisible.
**How to avoid:** Always add `color: var(--color-amber-500)` BEFORE the clip rules as a fallback. The browser will use it only if gradient clip fails.

### Pitfall 3: Float Wrapping Bleeds Into Next Section
**What goes wrong:** The next section's content renders overlapping the floated image because the float is not cleared.
**Why it happens:** Floated elements are removed from normal flow; the parent container doesn't grow to contain them.
**How to avoid:** Add `overflow: hidden` on the parent prose container (creates a Block Formatting Context that contains the float), or add `clear: both` on the element after the prose.

### Pitfall 4: `shape-outside` Has No Effect
**What goes wrong:** Text wraps as a normal rectangle around the image despite `shape-outside` being set.
**Why it happens:** `shape-outside` ONLY applies to floated elements. Without `float: left` or `float: right` on the image, the property is ignored.
**How to avoid:** Always apply both `float` and `shape-outside` together on the same element.

### Pitfall 5: Photo Column Width Too Rigid on Tablet
**What goes wrong:** A fixed `280px` photo column looks fine on 1280px desktop but is too wide on 768px tablet, leaving almost no space for text.
**Why it happens:** Fixed pixel widths don't scale.
**How to avoid:** Use `minmax(200px, 280px)` or a `min()` expression: `grid-template-columns: min(280px, 35%) 1fr;`.

### Pitfall 6: 520 Segment Has Zero Photos
**What goes wrong:** If the component always renders `photos[0]`, the 520 segment will throw a render error or show `undefined`.
**Why it happens:** There are genuinely no photos between miles 0-5.1 in `photos.json`.
**How to avoid:** Add a null check: `{segment.photos.length > 0 && <img src={segment.photos[0].thumb} />}`. Optionally show a placeholder or just omit the photo column for that segment.

---

## Code Examples

### Verified: Astro component with JSON import + segment filtering
```typescript
// Source: Astro docs (docs.astro.build/en/guides/imports/)
// JSON imports return full parsed object; can be imported in frontmatter
import photosData from '../../public/data/photos.json';
const segmentPhotos = photosData.filter(p => p.mile >= 5.0 && p.mile < 18.0);
```

### Verified: `shape-outside` MDN baseline syntax
```css
/* Source: MDN Web Docs — Baseline widely available (Jan 2020) */
.floated-image {
  float: left;
  shape-outside: inset(0 round 4px);  /* rectangle with rounded corners */
  shape-margin: 0.5rem;
  width: 200px;
}
```

### Verified: Tailwind v4 arbitrary properties for CSS with no utility
```html
<!-- Source: tailwindcss.com/docs/adding-custom-styles -->
<!-- For inline use — but prefer <style> block for shape-outside in Astro -->
<img class="float-left [shape-outside:circle(50%)]" />
```

### Verified: Star rating CSS (Unicode gradient clip)
```css
/* Source: CSS-Tricks "Five Methods for Five-Star Ratings" */
.star-rating {
  --percent: calc(var(--rating) / 5 * 100%);
  font-size: 1rem;
  background: linear-gradient(to right,
    var(--color-amber-500) var(--percent),
    var(--color-forest-700) var(--percent)
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: var(--color-amber-500); /* fallback */
}
.star-rating::before { content: "★★★★★"; }
```

### Verified: CSS Grid photo-text layout with responsive collapse
```css
/* Source: Smashing Magazine "Build Magazine Layout with CSS Grid Areas" (2023) */
.segment-card {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas: "photo" "content";
}
@media (min-width: 768px) {
  .segment-card {
    grid-template-columns: min(280px, 35%) 1fr;
    grid-template-areas: "photo content";
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|-----------------|-------|
| Float-only layouts | CSS Grid for structure, float only for inline text wrap | Grid is now the standard for photo-text paired layouts |
| SVG external file for texture | Inline SVG data URI | Faster, no request; project already uses this pattern |
| Radio-button CSS star ratings (interactive) | Static Unicode + gradient clip (display-only) | For display-only ratings, Unicode approach is simpler |
| `theme()` function in Tailwind v4 | CSS custom properties directly (`var(--color-*)`) | v4 exposes all `@theme` values as native CSS custom props |

**Deprecated/outdated:**
- `shape-inside` CSS property: was proposed but never shipped — only `shape-outside` exists. Don't use.
- `-webkit-background-clip` without `background-clip`: always set both; unprefixed version is now standard but webkit prefix is still needed for oldest Safari.

---

## Open Questions

1. **Does the 520 segment need a photo?**
   - What we know: There are 0 photos between miles 0-5.1 in `photos.json`.
   - What's unclear: Whether a photo from nearby (mile 5.5 is the first photo) is "close enough" or if the segment card should simply omit the photo column.
   - Recommendation: Planner should decide; code should guard against empty arrays regardless.

2. **How many photos per segment to display?**
   - What we know: Segments have 0-14 photos; showing all 14 for NF2217-2218 would be too many.
   - What's unclear: Design intent — single featured photo per segment? A 2-photo grid? Thumbnail strip?
   - Recommendation: Planner should cap at 1-2 photos per segment for editorial coherence. Displaying one `thumb` is simplest.

3. **Hiawatha narrative: does it replace or augment the existing 4 paragraphs?**
   - What we know: The 4 existing paragraphs in `index.astro` mix history, route description, and MBTN context.
   - What's unclear: Whether some paragraphs move to `RouteExplainer.astro` or all are consolidated into `HiawathaExplainer.astro`.
   - Recommendation: Create `HiawathaExplainer.astro` for the historical narrative and `RouteExplainer.astro` for the segment walkthrough; remove the existing narrative section from `index.astro`.

4. **Topographic section: full-width or max-w-4xl?**
   - What we know: All other sections use `max-w-4xl mx-auto px-4` containers.
   - What's unclear: Whether the topo background should bleed to viewport edges (for visual distinction) or stay within the same container width.
   - Recommendation: Full viewport-width background (`width: 100vw` or `background` on the `<section>`) with the content inside a `max-w-4xl mx-auto px-4` inner container, matching existing sections.

---

## Sources

### Primary (HIGH confidence)
- MDN Web Docs — `shape-outside` property, syntax, browser support, requirements (float required), shape-margin. Baseline widely available since January 2020.
- Tailwind CSS official docs — `float` utilities, arbitrary properties syntax `[property:value]`, CSS custom property shorthand `(--var)`.
- Astro official docs — component frontmatter capabilities, JSON imports, template syntax.

### Secondary (MEDIUM confidence)
- CSS-Tricks "Five Methods for Five-Star Ratings" — Unicode gradient clip pattern verified by MDN CSS properties.
- Smashing Magazine "Build Magazine Layout with CSS Grid Areas" (2023) — grid-template-areas pattern verified against MDN CSS Grid spec.
- Topography SVG Generator (topography.blixthalka.com) — SVG topo pattern format; pattern approach confirmed by project's existing `.topo-divider` implementation.

### Tertiary (LOW confidence)
- WebSearch results on responsive float mobile fallbacks — general patterns, not from a specific authoritative source; standard practice confirmed by MDN float documentation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all technologies already in use in the project; no new dependencies
- Architecture (CSS Grid layout): HIGH — verified against MDN and Smashing Magazine tutorial
- Architecture (shape-outside): HIGH — verified against MDN
- Architecture (star rating): MEDIUM — CSS-Tricks verified against MDN CSS gradient/clip properties
- Architecture (topo texture): MEDIUM — pattern directly extends existing `.topo-divider` in global.css
- Pitfalls: HIGH — derived from reading actual spec constraints (float requirement, URI encoding)
- Photo assignment: HIGH — calculated directly from `photos.json` data

**Research date:** 2026-03-31
**Valid until:** 2026-05-01 (stable CSS/Astro; unlikely to change)
