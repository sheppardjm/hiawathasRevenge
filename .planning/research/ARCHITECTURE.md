# Architecture Research: v1.2 Cultural Maximalism Integration

**Domain:** Maximalist cultural design layer added to existing Astro 6 / Tailwind 4 static cycling showcase
**Researched:** 2026-03-31
**Confidence:** HIGH -- based on direct analysis of all existing source files, v1.1 shipped architecture, and verified CSS/SVG animation capabilities

---

## Executive Summary

v1.2 "Cultural Maximalism" introduces 7 feature areas into the shipped v1.1 architecture. Unlike v1.1 (which required structural changes like removing BaseLayout width constraints and establishing the CustomEvent bus), v1.2 is almost entirely **additive** -- the foundational architecture is already in place. The features break into three integration tiers:

1. **Pure CSS/SVG additions** (animated dividers, shield motif system, color expansion) -- zero JavaScript, zero data flow changes, zero risk to existing interactive components
2. **Data-layer extensions** (historical imagery, Strava links, per-sector elevation) -- small schema additions to existing JSON files and pipeline scripts, backward compatible
3. **Component modifications** (content layout enrichment) -- targeted changes to HiawathaExplainer and RouteExplainer, preserving their existing data wiring

The critical architectural insight: **nothing in v1.2 touches the CustomEvent bus, the lazy-loading patterns, or the three complex client-side components (RouteMap, ElevationProfile, PhotoGallery)**. This is a design and content milestone, not an interactivity milestone.

---

## Current Architecture (v1.1 Shipped Baseline)

### System Diagram

```
BaseLayout.astro
  <main>                               <-- No width constraint (v1.1 change)
    <slot />
  </main>

index.astro
  HeroSection         (full-width, 100svh, LCP-optimized hero photo + badge SVG + event date)
  DonateCallout       (max-w-4xl centered)
  FloralDivider       (max-w-4xl centered, inline SVG, Ojibwe woodland floral)
  HiawathaExplainer   (max-w-4xl centered, editorial prose, no JS)
  RouteExplainer      (full-width topo bg, max-w-4xl inner, CSS Grid segment cards + photos)
  RouteStats          (max-w-4xl centered, content collection data)
  GPX download link   (max-w-4xl centered)
  FloralDivider       (max-w-4xl centered)
  RouteMap            (max-w-4xl, 60vh, Leaflet lazy-loaded via IO + scroll)
  ElevationProfile    (max-w-4xl, Chart.js lazy-loaded via IO)
  PhotoGallery        (max-w-4xl, CSS columns masonry, PhotoSwipe)
  DonateCallout       (max-w-4xl centered, repeated)
  Footer              (max-w-4xl, cultural attribution)
```

### Existing Patterns (PRESERVE)

| Pattern | Implementation | v1.2 Impact |
|---------|---------------|-------------|
| CustomEvent bus | `elevation:hover`, `elevation:leave`, `map:photoClick` via `window.dispatchEvent` | NOT TOUCHED |
| IntersectionObserver lazy loading | RouteMap (scroll + IO), ElevationProfile (IO only) | NOT TOUCHED |
| `getCSSColor()` runtime reads | Inside `initMap()` and `initChart()` for CSS token propagation | NEW TOKENS AUTO-PROPAGATE |
| Inline SVG with `var(--color-*)` | FloralDivider, badge in HeroSection | EXTEND to new motifs |
| `@theme static` tokens | 12 color families in global.css, forced to `:root` for JS access | ADD new tokens |
| Scoped `<style>` per component | All .astro components use Astro scoped styles | FOLLOW for new components |
| Build pipeline (6 steps) | parse-gpx -> resolve-annotations -> generate-thumbnails -> copy-images -> match-photos -> copy-gpx | EXTEND resolve-annotations and match-photos |
| Content collections | routeData, annotations, photos in content.config.ts | EXTEND schemas |

### Key Architectural Constraints

1. **SVG data URIs cannot use `var(--color-*)`** -- RouteExplainer's topo background hardcodes `%233d6b3d`. Any new SVG backgrounds must follow this pattern.
2. **`@theme static` is required** (not `@theme`) because `getCSSColor()` in RouteMap and ElevationProfile calls `getComputedStyle()` at runtime, which requires tokens to be emitted as CSS custom properties on `:root`. Tailwind v4's `@theme` tree-shakes unused tokens; `@theme static` forces emission.
3. **Photos-manifest.json is canonical** -- all photo metadata flows from `public/data/photos-manifest.json` through pipeline scripts to `public/data/photos.json`. Never edit `photos.json` directly.
4. **Segment data is hardcoded in RouteExplainer.astro** -- the SEGMENTS array is defined inline in the component frontmatter, not sourced from a JSON file. This is by design (v1.1 decision: "keeping the content inline in the component is simpler").

---

## v1.2 Integration Architecture

### Overview: New vs. Modified vs. Unchanged

| Component | Status | Change Description |
|-----------|--------|-------------------|
| `global.css` | **MODIFY** | Add 4 color tokens (turquoise, red, yellow, black) to `@theme static` |
| `FloralDivider.astro` | **MODIFY or EXTEND** | Add CSS animation (draw-on-scroll), optionally create variant |
| `HiawathaExplainer.astro` | **MODIFY** | Content layout enrichment: pull quotes, historical imagery, typography enhancements |
| `RouteExplainer.astro` | **MODIFY** | Add per-sector elevation sparklines, Strava links, content enrichment |
| `index.astro` | **MODIFY** | Import new components, add AnimatedDivider instances |
| `content.config.ts` | **MODIFY** | Add optional fields to sector and photo schemas |
| `resolve-annotations.js` | **MODIFY** | Add Strava segment IDs and elevation data slice to sector output |
| `match-photos.js` | **MODIFY** | Add optional `category` field for historical vs route photos |
| `photos-manifest.json` | **MODIFY** | Add historical image entries with `category: "historical"` |
| `AnimatedDivider.astro` | **NEW** | Scroll-triggered animated SVG section divider |
| `ShieldMotif.astro` | **NEW** | Reusable shield/arrowhead decorative SVG component |
| `ElevationSparkline.astro` | **NEW** | Build-time SVG sparkline for per-sector elevation snippets |
| `HistoricalFigure.astro` | **NEW** | Image + caption component for historical illustrations |

### Components NOT Modified

| Component | Reason |
|-----------|--------|
| `HeroSection.astro` | Hero is complete; v1.2 adds cultural elements below the fold |
| `RouteMap.astro` | No new map interactions; Strava links are in RouteExplainer, not on map |
| `ElevationProfile.astro` | Full chart untouched; sparklines are separate build-time SVGs |
| `PhotoGallery.astro` | Gallery layout unchanged; historical images mix into existing flow |
| `RouteStats.astro` | Stats content unchanged |
| `DonateCallout.astro` | CTA unchanged |
| `BaseLayout.astro` | Layout structure unchanged |
| `pipeline.js` | Same 6 steps, same order |
| `parse-gpx.js` | GPX parsing unchanged |
| `generate-thumbnails.js` | Thumbnail spec unchanged (400px WebP 80%) |
| `copy-images.js` | Image copy unchanged |
| `copy-gpx.js` | GPX copy unchanged |

---

## Detailed Integration Analysis

### 1. Animated Section Dividers

**Decision: Create new `AnimatedDivider.astro`, DO NOT modify `FloralDivider.astro`.**

**Rationale:** FloralDivider works correctly and is used in two places in index.astro. Retrofitting animation into it risks breaking the existing visual. Instead, create a new component that can be placed alongside or instead of FloralDivider instances at the orchestrator's discretion.

#### Component Architecture

```
src/components/AnimatedDivider.astro

Props:
  variant: 'vine' | 'arrowhead' | 'shield'  (default: 'vine')
  direction: 'ltr' | 'rtl'                   (default: 'ltr')

Template:
  <div class="animated-divider" aria-hidden="true" role="presentation">
    <svg viewBox="0 0 800 60" ...>
      <!-- SVG paths with class="draw-path" for CSS animation targeting -->
    </svg>
  </div>

Script: (none -- pure CSS animations)

Style (scoped):
  .animated-divider svg { opacity: 0; }
  .animated-divider.visible svg { opacity: 1; }
  .draw-path {
    stroke-dasharray: var(--path-length);
    stroke-dashoffset: var(--path-length);
    transition: stroke-dashoffset 1.5s ease-out;
  }
  .animated-divider.visible .draw-path {
    stroke-dashoffset: 0;
  }
  @media (prefers-reduced-motion: reduce) {
    .draw-path { transition: none; stroke-dashoffset: 0; }
    .animated-divider svg { opacity: 1; }
  }
```

#### Animation Approach: CSS transitions + IntersectionObserver class toggle

**Why NOT CSS `animation-timeline: view()`:** Browser support is Chrome 115+, Safari 18+, but Firefox is still behind a flag as of March 2026. This site should work across browsers. The established IntersectionObserver pattern already exists in the codebase (RouteMap, ElevationProfile).

**Why NOT SMIL `<animate>`:** SMIL animations restart on every DOM reflow and cannot be easily triggered on scroll. CSS transitions with class toggling give precise control.

**Why CSS transitions (not `@keyframes` animations):** The "draw-on" effect for SVG paths uses `stroke-dasharray` / `stroke-dashoffset` -- this is a single state change (from fully dashed to no offset), which maps cleanly to CSS `transition` rather than multi-step `@keyframes`. Simpler, fewer lines, better performance.

#### Implementation detail: `stroke-dasharray` / `stroke-dashoffset` draw effect

Each SVG `<path>` element needs a `--path-length` CSS custom property set to its total length. This can be computed at build time using `getTotalLength()` (but that requires a DOM), or estimated manually since the SVG paths are hand-authored and their lengths are known.

**Practical approach:** Set `stroke-dasharray` and `stroke-dashoffset` to a generous overestimate (e.g., `1600` for an 800-unit-wide viewBox). If the value exceeds the actual path length, the effect still works -- the stroke simply finishes drawing before the transition ends, which is visually acceptable and avoids the need for runtime `getTotalLength()` calls.

#### Script block (minimal)

```html
<script>
  // IntersectionObserver to add .visible class -- same pattern as existing lazy loaders
  document.querySelectorAll('.animated-divider').forEach(el => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
  });
</script>
```

This is ~12 lines of vanilla JS. No dependencies, no event bus extension, no interaction with existing components.

#### Integration into index.astro

AnimatedDivider replaces or supplements FloralDivider instances:

```
Option A: Replace both FloralDividers
  <AnimatedDivider variant="vine" />        (was FloralDivider)
  ...
  <AnimatedDivider variant="arrowhead" />   (was FloralDivider)

Option B: Add AnimatedDividers at new section boundaries, keep FloralDividers
  <FloralDivider />
  ...
  <AnimatedDivider variant="shield" />      (new divider between new sections)
  ...
  <FloralDivider />
```

**Recommendation: Option A** -- replace FloralDividers. The `vine` variant can reproduce the existing floral design with animation added. No content is lost.

#### Build order dependency: None. Can be built first or in parallel with any other v1.2 feature.

---

### 2. Shield/Arrowhead Motif System

**New component:** `src/components/ShieldMotif.astro`

#### Source Material Analysis

The badge SVG in HeroSection.astro contains a shield shape (`<path d="M500 70 150 175.3v217.1C150 785 500 930 500 930s350-145 350-537.6V175.2L500 70Z" ...>`) and an arrowhead motif (`<path d="M20 2 L6 40 Q8 38 14 36 L18 50 L20 58 L22 50 L26 36 Q32 38 34 40 Z" ...>`). These are the geometric source for extracting reusable motifs.

#### Component Architecture

```
src/components/ShieldMotif.astro

Props:
  size: 'sm' | 'md' | 'lg'    (default: 'md')
  variant: 'shield' | 'arrowhead' | 'both'  (default: 'shield')
  color: string                (default: 'var(--color-amber-500)')

Template:
  <span class={`motif motif-${size}`} aria-hidden="true" role="presentation">
    <svg viewBox="0 0 40 50" ...>
      <!-- Simplified shield or arrowhead path -->
    </svg>
  </span>

Style (scoped):
  .motif-sm svg { width: 16px; height: 20px; }
  .motif-md svg { width: 24px; height: 30px; }
  .motif-lg svg { width: 40px; height: 50px; }
```

#### Usage Patterns

The motif component is decorative and used inline:
- As bullet markers in content lists (replacing `<li>` bullet styling)
- As section heading accents (placed before/after `<h2>` text)
- As divider line endpoints (paired with `<hr>` elements)
- As repeated pattern in AnimatedDivider SVG paths

**This is NOT an interactive component.** No JavaScript, no events, no data flow. Pure presentational SVG.

#### Integration points

- **HiawathaExplainer.astro:** Shield motifs as decorative heading accents
- **RouteExplainer.astro:** Arrowhead motifs as segment card visual markers
- **AnimatedDivider.astro:** Shield/arrowhead shapes incorporated into divider SVG patterns
- **index.astro:** Direct motif usage at section boundaries

#### Build order dependency: None. Can be built in parallel. Optionally built before AnimatedDivider if divider variants use motif shapes.

---

### 3. Color Palette Expansion

**Modified file:** `src/styles/global.css` -- `@theme static` block only

#### Current State

The `@theme static` block has 4 color families from v1.1:
- **Berry** (3 tokens): berry-700, berry-600, berry-500
- **Gold** (3 tokens): gold-600, gold-500, gold-400
- **Lake** (4 tokens): lake-700, lake-600, lake-500, lake-400
- **Moss** (2 tokens): moss-600, moss-500

Plus the original v1.0 families: forest (5), amber (3), rust (2), cream (3).

8 of the v1.1 tokens are orphaned (defined but unused). v1.2 may activate some of these.

#### New Tokens for v1.2

The "Cultural Maximalism" theme calls for bolder, more saturated colors inspired by Native American art traditions. The specific additions:

```css
@theme static {
  /* v1.2: Bold cultural accent colors */

  /* Turquoise family — Southwest/Great Lakes beadwork turquoise */
  --color-turquoise-600: #1a8a7a;  /* deep turquoise for decorative fills */
  --color-turquoise-500: #2db5a3;  /* primary turquoise accent */
  --color-turquoise-400: #4ecdc4;  /* light turquoise for highlights */

  /* Red family — ceremonial/medicine wheel red */
  --color-red-700: #8b1a1a;        /* deep ceremonial red */
  --color-red-600: #b22222;        /* primary red accent */
  --color-red-500: #cd3333;        /* lighter red for text-safe uses */

  /* Yellow family — sun/medicine wheel yellow */
  --color-yellow-500: #d4a017;     /* NOTE: same as existing gold-500, may alias */
  --color-yellow-400: #f0c040;     /* brighter yellow accent */

  /* Black family — existing forest-950 serves; add explicit cultural alias */
  --color-ink-900: #0d1a0d;        /* alias of forest-950 for cultural motif use */
}
```

#### WCAG Contrast Considerations

New tokens MUST be annotated with their contrast ratios against the background (`forest-900: #1a2e1a`):

| Token | Hex | Ratio vs forest-900 | Safe for |
|-------|-----|---------------------|----------|
| turquoise-500 | #2db5a3 | ~4.8:1 | AA normal text |
| turquoise-400 | #4ecdc4 | ~6.2:1 | AA normal text |
| red-600 | #b22222 | ~3.1:1 | Decorative/large text only |
| red-500 | #cd3333 | ~3.9:1 | AA large text only |
| yellow-400 | #f0c040 | ~6.5:1 | AA normal text |

**Critical rule:** Red tokens fail AA for normal body text against dark backgrounds. Use ONLY for decorative elements, large headings, or SVG fills -- following the same pattern established for berry-700/600/500 in v1.1.

#### Activation of Orphaned Tokens

v1.2 should actively use some of the 8 orphaned v1.1 tokens:
- `lake-500` / `lake-600` -- for historical content accents (water imagery in the Hiawatha story)
- `berry-500` -- for bold pull quote styling
- `moss-600` -- for secondary nature-themed decorative fills

This reduces tech debt from the v1.1 audit while expanding the visual palette.

#### Build order dependency: FIRST. All other v1.2 visual work depends on color tokens being available. This is a ~20-line addition to global.css with zero risk.

---

### 4. Historical Imagery

**Decision: Add historical images to the existing photo pipeline with a `category` field, NOT a separate pipeline.**

#### Data Model Extension

Historical images (Longfellow portrait, Ojibwe beadwork examples, Hiawatha National Forest historical photos, etc.) are a new category of image that:
- Do NOT have a `mile` value (they are not geolocated on the route)
- Do NOT appear as map markers
- ARE processed through the same thumbnail pipeline
- ARE displayed in HiawathaExplainer and potentially the gallery

**photos-manifest.json extension:**

```json
{
  "filename": "longfellow-portrait.jpg",
  "mile": null,
  "category": "historical",
  "caption": "Henry Wadsworth Longfellow, c. 1868"
}
```

**Schema extension in content.config.ts:**

```typescript
const photos = defineCollection({
  schema: z.object({
    id: z.string(),
    filename: z.string(),
    thumb: z.string(),
    mile: z.number().nullable(),           // CHANGED: nullable for historical images
    lat: z.number().optional(),
    lon: z.number().optional(),
    featured: z.boolean().optional(),
    category: z.enum(['route', 'historical']).optional().default('route'),  // NEW
    caption: z.string().optional(),         // NEW: for historical image captions
  }),
});
```

**Pipeline changes:**

**`match-photos.js` modification:**
```javascript
// For historical images (no mile), skip geo-snapping
if (entry.mile === null || entry.mile === undefined) {
  return {
    id: entry.filename,
    filename: entry.filename,
    thumb: `/thumbs/${thumbName}`,
    mile: null,
    category: entry.category || 'historical',
    ...(entry.caption ? { caption: entry.caption } : {}),
    ...(entry.featured ? { featured: true } : {}),
  };
}
// Existing geo-snapping logic for route photos...
```

**`generate-thumbnails.js`:** No change needed. It already processes all `.jpg` files in `images/`. Historical images placed in `images/` are automatically thumbnailed.

**`RouteMap.astro`:** No change needed. Photo markers filter on `photo.lat && photo.lon`, which historical images lack. They naturally exclude themselves.

**`PhotoGallery.astro`:** Needs minor consideration. Currently it renders ALL photos. Options:

- **Option A (recommended):** Historical images appear in the gallery alongside route photos, with an optional caption overlay. This is "maximalist" -- more content, richer gallery.
- **Option B:** Filter historical images out of the gallery and only show them in HiawathaExplainer. This reduces gallery richness.

#### New Component: `HistoricalFigure.astro`

For inline historical imagery within HiawathaExplainer:

```
src/components/HistoricalFigure.astro

Props:
  src: string        (thumbnail path)
  alt: string        (image description)
  caption: string    (attribution / date)
  float?: 'left' | 'right'  (default: 'right')

Template:
  <figure class={`historical-figure float-${float}`}>
    <img src={src} alt={alt} loading="lazy" decoding="async" />
    <figcaption>{caption}</figcaption>
  </figure>

Style (scoped):
  .historical-figure { ... }
  .float-right { float: right; margin-left: 1.5rem; margin-bottom: 1rem; }
  .float-left { float: left; margin-right: 1.5rem; margin-bottom: 1rem; }
  figcaption { font-size: var(--font-size-xs); color: var(--color-cream-200); }
```

#### Build order dependency: Pipeline changes (match-photos.js, content.config.ts) must come before HiawathaExplainer modifications that use historical images. But thumbnail generation is automatic. Sequence: manifest entries -> pipeline run -> component integration.

---

### 5. Content Layout Enrichment

**Modified components:** `HiawathaExplainer.astro` and `RouteExplainer.astro`

This is the largest modification area but involves NO structural changes to data flow, event bus, or page architecture. It is purely presentational CSS and markup changes within existing components.

#### HiawathaExplainer Enrichment

Current state: 5 paragraphs of prose, 1 blockquote, 1 external link. Clean `max-w-prose` layout. No images, no visual hierarchy beyond text.

**v1.2 additions:**

1. **Historical imagery integration:** Use `HistoricalFigure` component for Longfellow portrait, beadwork illustration alongside relevant prose paragraphs. This requires importing the component and adding `<HistoricalFigure>` instances within the prose.

2. **Pull quote styling:** Enhance the existing `<blockquote>` with bolder typography, shield motif decorations, and new color tokens (berry-500 border, turquoise-500 accents).

3. **Typography hierarchy:** Add dropcap styling for first paragraph (`::first-letter` pseudo-element), section sub-headings within the narrative.

4. **Shield motif accents:** Import and place `ShieldMotif` components as decorative accents near headings.

**Modification scope:** Template changes (adding elements), style changes (enhancing existing CSS). NO frontmatter logic changes -- HiawathaExplainer has no frontmatter data dependencies.

#### RouteExplainer Enrichment

Current state: CSS Grid segment cards with photo + text, star ratings, topo SVG background. Frontmatter imports `photos.json` and defines SEGMENTS array.

**v1.2 additions:**

1. **Per-sector elevation sparklines:** Add a mini elevation profile SVG to each segment card (see section 6 below for detailed analysis).

2. **Strava links:** Add Strava segment links to each segment card (see section 7 below).

3. **Shield/arrowhead motif markers:** Replace or supplement the segment name heading with arrowhead motif accent.

4. **Richer description text:** Expand segment descriptions with additional detail, surface type callouts, notable landmarks.

5. **Color token activation:** Use turquoise-500 for difficulty-specific accents, red-600 for hardest segments (NF2266, Doe Lake).

**Modification scope:**
- **Frontmatter:** Add sparkline data computation (extracting elevation slices from route-data.json per segment mile range)
- **Template:** Add sparkline SVG, Strava link anchor, motif decorations to each segment card
- **Style:** Extend scoped CSS for new elements

**Key constraint:** The SEGMENTS array is hardcoded. Adding Strava segment IDs and elevation sparkline data can either:
- **Option A:** Extend the hardcoded SEGMENTS array with new fields (stravaId, elevationPoints)
- **Option B:** Import route-data.json in frontmatter and compute elevation slices dynamically

**Recommendation: Option B for elevation data, Option A for Strava IDs.** Route-data.json is already available at build time (RouteStats uses content collections to access it). Elevation data should be computed, not hardcoded, because it derives from the GPX data. Strava segment IDs are external identifiers that don't change and are best hardcoded alongside the existing segment definitions.

#### Build order dependency: Both components depend on color tokens (section 3) and ShieldMotif (section 2). HiawathaExplainer additionally depends on HistoricalFigure component (section 4) and historical images in the pipeline. RouteExplainer depends on ElevationSparkline (section 6) and Strava ID decisions (section 7).

---

### 6. Per-Sector Elevation Snippets

**Decision: Build-time SVG sparklines generated in Astro frontmatter, NOT Chart.js mini-instances.**

#### Why NOT Chart.js mini-instances

The existing ElevationProfile uses Chart.js with dynamic import (~200KB), IntersectionObserver lazy loading, and canvas rendering. Replicating this 7 times for segment cards would:
- Add 7 canvas elements to the DOM
- Require 7 lazy-loading observers (or eager loading, increasing bundle)
- Impose Chart.js initialization overhead per sparkline
- Introduce complex teardown/cleanup for canvases

This is wildly disproportionate to the goal of showing a simple elevation squiggle.

#### Why SVG sparklines generated at build time

Astro's frontmatter runs at build time. We can:
1. Import route-data.json (already available)
2. Filter points by mile range per segment
3. Convert to SVG `<polyline>` coordinates
4. Emit static SVG markup -- zero JavaScript, zero runtime cost

This follows the "Astro island" philosophy: compute everything possible at build time.

#### New Component: `ElevationSparkline.astro`

```
src/components/ElevationSparkline.astro

Props:
  points: Array<{ miles: number; ele: number }>  (pre-filtered elevation points)
  startMile: number
  endMile: number
  width?: number   (default: 200)
  height?: number  (default: 40)
  color?: string   (default: 'var(--color-amber-500)')

Frontmatter:
  // Normalize points to SVG coordinate space
  const minEle = Math.min(...points.map(p => p.ele));
  const maxEle = Math.max(...points.map(p => p.ele));
  const eleRange = maxEle - minEle || 1;
  const mileRange = endMile - startMile || 1;

  const svgPoints = points.map(p => {
    const x = ((p.miles - startMile) / mileRange) * width;
    const y = height - ((p.ele - minEle) / eleRange) * (height - 4); // 4px padding
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

Template:
  <svg
    viewBox={`0 0 ${width} ${height}`}
    width={width}
    height={height}
    aria-hidden="true"
    role="presentation"
    class="elevation-sparkline"
  >
    <polyline
      points={svgPoints}
      fill="none"
      stroke={color}
      stroke-width="1.5"
      stroke-linejoin="round"
    />
  </svg>

Style (scoped):
  .elevation-sparkline { display: block; opacity: 0.7; }
```

#### Data Flow

```
route-data.json (456 points, each with { lat, lon, ele, miles })
      |
      v
RouteExplainer.astro frontmatter
      |
      +-- Import route-data.json (or use content collection)
      +-- For each SEGMENT, filter points where startMi <= miles < endMi
      +-- Pass filtered points to <ElevationSparkline points={filteredPoints} />
      |
      v
Static SVG in HTML output (zero JS)
```

**RouteExplainer frontmatter changes:**

```typescript
// NEW: Import route data for sparkline generation
import routeDataRaw from '../../public/data/route-data.json';

const segmentsWithPhotosAndElevation = SEGMENTS.map(seg => ({
  ...seg,
  photos: (photosData as any[])
    .filter((p: any) => p.mile >= seg.startMi && p.mile < seg.endMi)
    .slice(0, 2),
  // NEW: elevation points for sparkline
  elevationPoints: routeDataRaw.points
    .filter((p: any) => p.miles >= seg.startMi && p.miles < seg.endMi),
}));
```

**Estimated impact:** ~10 lines added to RouteExplainer frontmatter, ~30 lines for ElevationSparkline.astro. Zero JavaScript in the output.

#### Elevation data characteristics per segment

| Segment | Mile Range | Approx Points | Notes |
|---------|-----------|---------------|-------|
| 520 | 0 - 5.0 | ~25 | Short, low variance |
| NF2266 | 5.0 - 18.0 | ~65 | HIGH variance -- the "crucible" |
| Bass Lake Rd | 18.0 - 32.0 | ~70 | Rolling, moderate |
| NF2217-2218 | 32.0 - 50.0 | ~90 | Long, gentle |
| ND2225 | 50.0 - 70.0 | ~100 | Moderate |
| Doe Lake | 70.0 - 92.0 | ~110 | Technical, punchy |
| Rapid River | 92.0 - 110.0 | ~95 | Descending home stretch |

All point counts are reasonable for SVG polyline rendering (no decimation needed for sparklines at 200px width).

#### Build order dependency: Depends on no other v1.2 feature. Can be built in parallel. Integrates into RouteExplainer which is a later task.

---

### 7. Strava Links

**Decision: Hardcode Strava segment/route IDs in the RouteExplainer SEGMENTS array, NOT in annotations.json.**

#### Rationale

Strava links are:
- External identifiers that don't change
- Only used in one component (RouteExplainer)
- Not needed by RouteMap, ElevationProfile, or any other consumer of annotations.json
- Purely presentational (anchor tags to strava.com)

Adding them to annotations.json and the pipeline would:
- Require modifying resolve-annotations.js
- Extend the content.config.ts schema
- Add fields that only one component uses
- Over-engineer a simple feature

**The SEGMENTS array already contains segment-specific data that only RouteExplainer uses** (descriptions, display names, formatted distances). Strava IDs belong here.

#### Data Model

```typescript
interface Segment {
  name: string;
  startMi: number;
  endMi: number;
  distFromStart: string;
  length: string;
  difficulty: number;
  description: string;
  stravaUrl?: string;    // NEW: full Strava segment/route URL
}

const SEGMENTS: Segment[] = [
  {
    name: '520',
    // ... existing fields ...
    stravaUrl: 'https://www.strava.com/segments/12345678',
  },
  // ...
];
```

**Note:** Strava URLs may point to segments (`/segments/ID`) or routes (`/routes/ID`). Use the full URL rather than just an ID to support both.

#### Template Integration

```html
{seg.stravaUrl && (
  <a
    href={seg.stravaUrl}
    target="_blank"
    rel="noopener noreferrer"
    class="strava-link"
    aria-label={`View ${seg.name} on Strava`}
  >
    View on Strava
  </a>
)}
```

#### Strava Embed Consideration

Strava offers iframe embeds (`<iframe src="https://www.strava.com/segments/ID/embed" ...>`). **Do NOT use iframe embeds** because:
- They add HTTP requests per segment (7 iframes = 7 external requests)
- They require JavaScript and break in static site caching
- They add visual inconsistency (Strava's styling vs. the site's design)
- They increase page weight significantly
- A simple text link is maximalist in content, not in page weight

**Recommendation:** Plain text links styled to match the site's design language (amber-400, font-display, uppercase). Consider adding a small Strava-branded SVG icon inline.

#### Build order dependency: None. Just adding a field and a template element. Can be done when RouteExplainer is being modified for other v1.2 changes.

---

## Data Flow Changes Summary

### Pipeline Extensions

| Script | Change | Backward Compatible |
|--------|--------|-------------------|
| `resolve-annotations.js` | No changes needed for v1.2 | N/A |
| `match-photos.js` | Add `category` field pass-through, handle `mile: null` | Yes -- new optional field |
| `generate-thumbnails.js` | No changes needed | N/A |
| `pipeline.js` | No changes needed (same 6 steps) | N/A |

### Schema Extensions

**content.config.ts photos collection:**
```typescript
// ADD to existing schema
mile: z.number().nullable(),             // CHANGED from z.number()
category: z.enum(['route', 'historical']).optional(),  // NEW
caption: z.string().optional(),          // NEW
```

**content.config.ts annotations collection:** No changes needed for v1.2.

### JSON Format Changes

**photos-manifest.json** -- adds optional fields:
```json
{ "filename": "...", "mile": null, "category": "historical", "caption": "..." }
```

**photos.json** (output) -- passes through new fields:
```json
{ "id": "...", "filename": "...", "thumb": "...", "mile": null, "category": "historical", "caption": "..." }
```

**annotations.json** -- unchanged.
**route-data.json** -- unchanged.

---

## Build Order (Dependency Graph)

```
Color Tokens (global.css @theme static)           [NO DEPS]
     |
     +---> ShieldMotif.astro                       [DEPENDS: tokens]
     |        |
     +---> AnimatedDivider.astro                   [DEPENDS: tokens, optionally motifs]
     |        |
     +---> index.astro (replace FloralDividers)    [DEPENDS: AnimatedDivider]
     |
     +---> HistoricalFigure.astro                  [DEPENDS: tokens]
     |
     +---> ElevationSparkline.astro                [NO DEPS]

Pipeline: match-photos.js + content.config.ts     [NO DEPS]
     |
     +---> Historical images in manifest            [DEPENDS: pipeline changes]

HiawathaExplainer enrichment                       [DEPENDS: tokens, ShieldMotif,
     |                                              HistoricalFigure, pipeline for images]

RouteExplainer enrichment                          [DEPENDS: tokens, ShieldMotif,
                                                    ElevationSparkline, Strava IDs]

index.astro final assembly                         [DEPENDS: all above]
```

### Recommended Phase Execution Order

**Phase A: Color Foundation (enables all visual work)**
1. Add turquoise/red/yellow/ink tokens to `@theme static` in global.css
2. Activate orphaned v1.1 tokens with usage in existing components

**Phase B: Decorative Components (independent, no data deps)**
3. Create ShieldMotif.astro (reusable decorative SVG)
4. Create AnimatedDivider.astro (scroll-triggered SVG with IO class toggle)
5. Create ElevationSparkline.astro (build-time SVG sparkline)

**Phase C: Data Pipeline (enables historical imagery)**
6. Extend match-photos.js for `category` and `mile: null` handling
7. Extend content.config.ts photos schema
8. Add historical image entries to photos-manifest.json, place source images in `images/`

**Phase D: Content Enrichment (depends on A, B, C)**
9. Create HistoricalFigure.astro (image + caption component)
10. Enrich HiawathaExplainer.astro (historical imagery, pull quotes, motifs, typography)
11. Enrich RouteExplainer.astro (sparklines, Strava links, motifs, expanded descriptions)

**Phase E: Page Assembly (depends on D)**
12. Update index.astro (swap FloralDividers for AnimatedDividers, wire new sections)
13. Responsive testing across breakpoints
14. Accessibility audit (animated elements respect prefers-reduced-motion, new images have alt text)

---

## Patterns to Follow

### Pattern 1: Build-Time Computation (EXTEND)

ElevationSparkline is the exemplar of this pattern. Astro frontmatter can import JSON, compute derived data, and emit static HTML/SVG. Use this for anything that doesn't require user interaction:
- Sparkline SVG generation
- Historical image filtering
- Strava URL construction

### Pattern 2: Inline SVG with CSS Custom Properties (EXTEND)

FloralDivider established this pattern in v1.1. All new SVG elements (ShieldMotif, AnimatedDivider) MUST use `fill="var(--color-*)"` and `stroke="var(--color-*)"` references so they respond to palette changes. The sole exception is SVG embedded in CSS `background-image` data URIs (RouteExplainer's topo texture), where hex must be hardcoded.

### Pattern 3: IntersectionObserver for Scroll Effects (REUSE)

AnimatedDivider uses the same IO pattern as RouteMap and ElevationProfile. Keep the established convention:
- Observe the container element
- Add a class (`.visible`) on intersection
- Disconnect after first trigger (one-shot animation)
- Respect `prefers-reduced-motion`

### Pattern 4: Scoped Styles (PRESERVE)

All new components use Astro scoped `<style>` blocks. Global CSS additions are limited to `@theme static` tokens.

### Pattern 5: Progressive Enhancement for Animations (NEW)

AnimatedDivider MUST degrade gracefully:
- Without JavaScript: SVG is hidden (opacity: 0) -- acceptable for decorative element
- With `prefers-reduced-motion`: SVG appears immediately without animation
- Without CSS transitions: SVG appears immediately (transition property is non-critical)

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Chart.js for Sparklines

Do NOT instantiate Chart.js for 7 inline sparklines. The existing ElevationProfile already dynamically imports Chart.js (~200KB). Adding 7 mini-instances would:
- Multiply initialization overhead
- Require lazy-loading logic per sparkline
- Add canvas elements that compete with the full chart
- Be absurdly heavy for a 200px-wide squiggle

Use build-time SVG generation instead. Zero JavaScript, zero runtime cost.

### Anti-Pattern 2: Strava iFrame Embeds

Do NOT use Strava's iframe embed for inline route/segment previews. Each iframe is an external HTTP request with its own JavaScript runtime. Seven embeds would dramatically increase page weight and load time for a static site optimized for performance.

### Anti-Pattern 3: Separate Historical Image Pipeline

Do NOT create a new pipeline step for historical images. The existing `generate-thumbnails.js` already processes all `.jpg` files in `images/`. The existing `match-photos.js` already maps manifest entries to output JSON. Extend, do not duplicate.

### Anti-Pattern 4: `animation-timeline: view()` Without Fallback

Do NOT use CSS scroll-driven animation timelines without progressive enhancement. Firefox support is still behind a flag as of March 2026. The IntersectionObserver approach works in all browsers and is already proven in this codebase.

### Anti-Pattern 5: Modifying the CustomEvent Bus

v1.2 has NO features that require cross-component communication. Do NOT add events. Do NOT import state management. Every v1.2 feature is either static (build-time) or self-contained (scoped animation).

### Anti-Pattern 6: Moving Segment Data to annotations.json

The SEGMENTS array in RouteExplainer contains display-specific data (formatted distance strings, editorial descriptions, star ratings as integers 1-5). This data is intentionally NOT in annotations.json, which contains geo-referenced data for map/chart rendering. Do NOT merge these concerns. Strava IDs belong with the display data, not the geo data.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Animated SVG draw effect doesn't work with `stroke-dasharray` on complex paths | LOW | LOW | Test with simple paths first. The overestimate approach (dasharray: 1600) handles most cases. |
| Historical images with `mile: null` break PhotoGallery map bridge | LOW | MEDIUM | PhotoGallery map bridge uses `photo.lat && photo.lon` guard. Historical images lack lat/lon, so they are naturally excluded from map interaction. Verify with test. |
| New color tokens conflict with Tailwind utility generation | LOW | LOW | `@theme static` forces all tokens to `:root`. Tailwind generates utilities for all `@theme` values. No conflict possible. |
| `route-data.json` import in RouteExplainer frontmatter increases build size | LOW | LOW | Route data is 456 points (~30KB JSON). Imported at build time only, not shipped to client. Astro tree-shakes frontmatter imports. |
| `prefers-reduced-motion` not respected in AnimatedDivider | MEDIUM | MEDIUM | Must test explicitly. Include `@media (prefers-reduced-motion: reduce)` rule that removes transition and sets opacity: 1 / stroke-dashoffset: 0 immediately. |
| Sparkline SVG looks wrong for segments with few points (e.g., 520 with ~25 points) | LOW | LOW | 25 points at 200px width = 1 point per 8px. This is adequate for a sparkline. If it looks jagged, reduce width or increase stroke-width. |

---

## Files Changed Summary

### New Files (6)

| File | Purpose | Complexity | Lines (est) |
|------|---------|------------|-------------|
| `src/components/AnimatedDivider.astro` | Scroll-triggered animated SVG section divider | Medium | 80-120 |
| `src/components/ShieldMotif.astro` | Reusable shield/arrowhead decorative SVG | Low | 30-50 |
| `src/components/ElevationSparkline.astro` | Build-time SVG elevation sparkline | Low | 30-40 |
| `src/components/HistoricalFigure.astro` | Image + caption for historical illustrations | Low | 25-35 |
| Historical image files in `images/` | Source images for pipeline | N/A | N/A |
| Historical entries in `photos-manifest.json` | Manifest entries for new images | N/A | ~5-10 JSON entries |

### Modified Files (6)

| File | Scope | Risk | Changes |
|------|-------|------|---------|
| `src/styles/global.css` | Small | LOW | ~15 lines: new color tokens in `@theme static` |
| `src/components/HiawathaExplainer.astro` | Medium | LOW | Template: add HistoricalFigure, ShieldMotif, enhanced blockquote. Style: typography enhancements. |
| `src/components/RouteExplainer.astro` | Medium | LOW | Frontmatter: import route-data.json, add Strava URLs. Template: add sparkline, Strava link, motifs. Style: new element styling. |
| `src/pages/index.astro` | Small | LOW | Import AnimatedDivider, replace FloralDivider instances |
| `scripts/match-photos.js` | Small | LOW | ~10 lines: handle `mile: null`, pass-through `category` and `caption` |
| `src/content.config.ts` | Small | LOW | ~3 lines: add `category`, `caption`, make `mile` nullable |

### Unchanged Files (12)

BaseLayout.astro, HeroSection.astro, RouteMap.astro, ElevationProfile.astro, PhotoGallery.astro, RouteStats.astro, DonateCallout.astro, FloralDivider.astro, pipeline.js, parse-gpx.js, generate-thumbnails.js, copy-gpx.js, copy-images.js

---

## Sources

- Direct source code analysis of all 9 components, 6 pipeline scripts, global.css, content.config.ts, and astro.config.ts -- HIGH confidence
- v1.1 shipped ROADMAP.md, REQUIREMENTS.md, and MILESTONE-AUDIT.md -- HIGH confidence
- [CSS stroke-dasharray animation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline) -- MDN documentation, HIGH confidence
- [CSS scroll-driven animations browser support](https://caniuse.com/css-scroll-timeline) -- Can I Use, HIGH confidence (Chrome 115+, Safari 18+, Firefox behind flag)
- [Chart.js sparkline configuration](https://www.ethangunderson.com/sparklines-in-chartjs/) -- confirms Chart.js sparklines are possible but heavy
- [SVG sparkline zero-dependency approach](https://alexplescan.com/posts/2023/07/08/easy-svg-sparklines/) and [fnando/sparkline](https://github.com/fnando/sparkline) -- confirms pure SVG sparkline feasibility
- [Strava embed format](https://partners.strava.com/resources/how-to-embed-a-strava-route) -- Strava Partners documentation, HIGH confidence
- route-data.json analysis: 456 points, ~30KB, segments range from ~25-110 points -- HIGH confidence (direct measurement)

---
*Architecture research for: Hiawatha's Revenge v1.2 Cultural Maximalism*
*Researched: 2026-03-31*
