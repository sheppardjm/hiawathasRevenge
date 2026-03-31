# Architecture Research: v1.1 Visual Redesign Integration

**Domain:** Visual redesign of existing Astro 6 static cycling route showcase
**Researched:** 2026-03-31
**Confidence:** HIGH -- based on direct analysis of all existing source files, v1.0 architecture patterns, and Astro 6 / Tailwind 4 capabilities

---

## Executive Summary

The v1.1 visual redesign introduces 7 feature areas into an existing, well-structured Astro static site. The core architectural challenge is that the current `index.astro` is a monolithic page with inline content, a `max-w-4xl` centered layout, and components that assume this constrained width. The redesign needs full-width sections (hero, gallery), a new interactive panel (sector details), richer decorative elements (Ojibwe motifs), and new content sections -- all while preserving the working CustomEvent bus, lazy-loading patterns, and build pipeline.

**Key architectural insight:** Most changes are additive (new components, new CSS tokens, new content sections) rather than structural rewrites. The three components with complex client-side JavaScript (RouteMap, ElevationProfile, PhotoGallery) need targeted modifications, not replacements. The biggest structural change is in `BaseLayout.astro` (removing `max-w-4xl` constraint to enable full-width sections) and `index.astro` (reorganizing section layout).

---

## Current Architecture (v1.0 Baseline)

### System Diagram

```
BaseLayout.astro
  <main class="max-w-4xl mx-auto px-4 py-8">   <-- Constrains ALL content to 896px
    <slot />                                       <-- Everything is inside this container
  </main>

index.astro
  Badge hero section (centered, 300-420px badge)
  DonateCallout
  topo-divider
  "The Route" narrative prose
  RouteStats
  GPX download link
  topo-divider
  RouteMap (60vh, lazy-loaded)
  ElevationProfile (140-180px, lazy-loaded)
  PhotoGallery (2-4 col grid, PhotoSwipe)
  DonateCallout (repeated)
  Footer
```

### Layout Constraint Problem

The `max-w-4xl mx-auto px-4` on `<main>` in BaseLayout means EVERY section is constrained to 896px. This works for v1.0's document-style layout but blocks:
- Full-width hero images (need viewport width)
- Full-bleed map section
- Masonry gallery that uses wider breakpoints
- Ojibwe border decorations that span the viewport edge

---

## v1.1 Integration Architecture

### Structural Change: BaseLayout Width Strategy

**Decision: Move width constraints from `<main>` to individual sections.**

```
BEFORE (v1.0):
  BaseLayout.astro
    <main class="max-w-4xl mx-auto px-4 py-8">  <-- one size fits all
      <slot />
    </main>

AFTER (v1.1):
  BaseLayout.astro
    <main>                                         <-- no width constraint
      <slot />
    </main>

  index.astro
    <HeroSection />                                <-- full-width (self-contained)
    <section class="max-w-4xl mx-auto px-4">      <-- constrained sections opt in
      <NarrativeSection />
    </section>
    <section class="max-w-6xl mx-auto px-4">      <-- wider sections for gallery
      <PhotoGallery />
    </section>
    <RouteMap />                                   <-- full-width map
```

**Rationale:** This is the standard Astro pattern for mixed-width layouts. Each section controls its own max-width rather than inheriting a global constraint. The change to BaseLayout is a one-line edit (removing classes from `<main>`) and then each section in index.astro adds its own container class.

**Impact:** Minimal. The `py-8` and `px-4` currently on `<main>` need to be moved to individual sections. This is mechanical, not architectural.

---

## Component Integration Map

### Overview: New vs. Modified vs. Unchanged

| Component | Status | Change Description |
|-----------|--------|-------------------|
| `BaseLayout.astro` | **MODIFY** | Remove `max-w-4xl mx-auto px-4 py-8` from `<main>`, add OG meta tags for hero image |
| `index.astro` | **MODIFY** | Major restructure: new section ordering, per-section width containers, import new components |
| `global.css` | **MODIFY** | Evolve `@theme` tokens (new colors, new spacing), add Ojibwe decorative patterns, new `@layer` rules |
| `RouteMap.astro` | **MODIFY** | Add sector click handlers, dispatch `sector:click` events, add sector name labels |
| `ElevationProfile.astro` | **MODIFY** | Add sector click handlers (clicking a sector band dispatches `sector:click`) |
| `PhotoGallery.astro` | **REWRITE** | Replace uniform grid with masonry layout, add featured/hero image support |
| `RouteStats.astro` | **MINOR MODIFY** | Style updates only (new color tokens), no structural change |
| `DonateCallout.astro` | **MINOR MODIFY** | Style evolution to match new design language |
| `HeroSection.astro` | **NEW** | Full-width hero with route photo, overlay text, event date |
| `SectorDetailPanel.astro` | **NEW** | Slide-out panel showing sector info (name, difficulty, length, surface, mini-elevation) |
| `NarrativeSection.astro` | **NEW** | Rewritten Hiawatha narrative with editorial layout, integrated photos |
| `RouteExplainer.astro` | **NEW** | Photo-integrated route overview over topographic background |
| `EventDate.astro` | **NEW** | Event date display component (June 6, 2026) |
| `OjibweBorder.astro` | **NEW** | Reusable SVG decorative border/divider component (replaces topo-divider) |
| `OjibweMotif.astro` | **NEW** | Standalone decorative SVG motif component (floral, beadwork patterns) |

---

## Detailed Integration Analysis

### 1. Full-Width Hero Section

**New component:** `src/components/HeroSection.astro`

**Integration points:**
- Consumes a hero image from `public/images/` (one of the existing route photos, selected editorially)
- Overlays the badge SVG (moved from inline in index.astro to HeroSection)
- Displays event date (June 6, 2026) as overlay text
- Must break free of any parent container (full viewport width)

**Architecture:**
```
HeroSection.astro
  <section class="relative w-full h-[80vh] min-h-[500px]">
    <img> or CSS background-image (hero photo)
    <div class="absolute inset-0 bg-gradient-to-b ...">  (overlay gradient)
      Badge SVG (extracted from current index.astro inline SVG)
      Event date text
      Tagline
    </div>
  </section>
```

**Key decisions:**
- Use `<img>` with `object-fit: cover` rather than CSS `background-image` for better lazy-loading control and accessibility (alt text).
- The badge SVG (currently 100+ lines of inline SVG in index.astro) should be extracted into this component. It does NOT need its own .astro file because it is only used in the hero.
- Hero image selection: Use one of the existing route photos. The pipeline does NOT need modification -- just reference a specific image path.
- The `py-[--spacing-section]` and centered layout currently wrapping the badge in index.astro gets replaced by the full-width absolute-positioned hero.

**No new data dependencies.** Hero content is static markup.

**Build order implication:** Can be built independently. No dependency on any other v1.1 feature.

---

### 2. Masonry Photo Gallery

**Modified component:** `src/components/PhotoGallery.astro` (rewrite)

**Current state:**
```html
<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
  {photos.map((photo) => (
    <a ...><img class="w-full aspect-square object-cover" /></a>
  ))}
</div>
```

Uniform grid, all thumbnails are identical square crops, no editorial hierarchy.

**v1.1 target:** Masonry layout with featured hero images at larger sizes, mixed aspect ratios, editorial spacing.

**Architecture decision: CSS-only masonry vs. JavaScript masonry.**

CSS `columns` is the recommended approach for this project because:
- No additional dependencies needed
- Works with SSR/static output (no hydration required)
- Adequate for 54 photos (not a performance concern)
- Tailwind 4 supports `columns-2 sm:columns-3 lg:columns-4` natively

True CSS `masonry` layout (the `grid-template-rows: masonry` spec) is NOT production-ready as of March 2026 -- it remains behind flags in Firefox and has no Chrome/Safari implementation. Do not use it.

**Integration approach:**
```
PhotoGallery.astro (rewritten)
  <div id="photo-gallery" class="columns-2 sm:columns-3 lg:columns-4 gap-3">
    {photos.map((photo, index) => {
      const isFeatured = photo.featured || index < 2;
      return (
        <a class={`block mb-3 break-inside-avoid ${isFeatured ? 'col-span-full' : ''}`}>
          <img class="w-full" />  <!-- NO aspect-square; natural aspect ratio -->
        </a>
      );
    })}
  </div>
```

**Data change required:** The `photos.json` schema needs a new optional `featured` boolean field to mark editorially-selected hero images. This is a schema addition (backward compatible).

```typescript
// content.config.ts addition
schema: z.object({
  id: z.string(),
  filename: z.string(),
  thumb: z.string(),
  mile: z.number(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  featured: z.boolean().optional(),  // NEW: editorial selection for gallery hero
  aspectRatio: z.number().optional(), // NEW: natural w/h ratio for masonry sizing
})
```

**PhotoSwipe integration preserved:** The PhotoSwipe `<script>` block is unchanged. It targets `#photo-gallery a` elements, which remain the same. The `data-pswp-width` and `data-pswp-height` attributes are still set per anchor. The `map:photoClick` event listener is unchanged.

**Pipeline change:** The `generate-thumbnails.js` script needs to output thumbnails at natural aspect ratios (not square crops). Currently thumbnails are 400px wide WebP -- this just needs to preserve aspect ratio rather than forcing square. The `match-photos.js` script should write `aspectRatio` to photos.json by reading image dimensions from sharp metadata.

**Build order implication:** Depends on minor pipeline update (aspect ratio extraction). But can be developed with placeholder aspect ratios first and pipeline updated after.

---

### 3. Sector Detail Panel + Map Labels

**New component:** `src/components/SectorDetailPanel.astro`
**Modified component:** `src/components/RouteMap.astro`
**Modified component:** `src/components/ElevationProfile.astro`

This is the most architecturally complex v1.1 feature because it extends the CustomEvent bus and adds interactive behavior across three components.

#### 3a. New CustomEvent Bus Extensions

**Current events (v1.0):**
| Event | Emitter | Listener | Payload |
|-------|---------|----------|---------|
| `elevation:hover` | ElevationProfile | RouteMap | `{ miles }` |
| `elevation:leave` | ElevationProfile | RouteMap | (none) |
| `map:photoClick` | RouteMap | PhotoGallery | `{ photoIndex }` |

**New events (v1.1):**
| Event | Emitter | Listener | Payload |
|-------|---------|----------|---------|
| `sector:click` | RouteMap OR ElevationProfile | SectorDetailPanel | `{ sectorId }` |
| `sector:close` | SectorDetailPanel | RouteMap (optional: unhighlight) | (none) |
| `sector:hover` | RouteMap | ElevationProfile (optional: highlight band) | `{ sectorId }` |
| `sector:leave` | RouteMap | ElevationProfile (optional: unhighlight) | (none) |

**Event payload design:** The `sector:click` event carries `sectorId` (e.g., `"sector-520"`). The SectorDetailPanel looks up full sector data from a pre-serialized JSON blob (inlined as `define:vars` or fetched from annotations.json). This avoids coupling the panel to the map or chart's internal state.

#### 3b. RouteMap Modifications

**Changes needed in RouteMap.astro:**

1. **Sector labels on the map.** For each sector, place a Leaflet `L.divIcon` marker at the sector midpoint with the sector name and star difficulty rating. This is additive code in the `initMap()` function, after the sector polylines are drawn.

2. **Sector click handlers.** Attach click handlers to sector polylines AND sector label markers. On click, dispatch `window.dispatchEvent(new CustomEvent('sector:click', { detail: { sectorId: sector.id } }))`.

3. **Sector highlight on panel open.** Listen for `sector:close` to optionally de-emphasize the highlighted sector. (Nice to have, not critical.)

**Estimated code change:** ~40 lines added to the existing `initMap()` function. No structural changes to the lazy-loading pattern, tile layer, or bike marker logic.

#### 3c. ElevationProfile Modifications

**Changes needed in ElevationProfile.astro:**

1. **Sector band click handlers.** The sector bands are already rendered as `chartjs-plugin-annotation` box annotations. Add `click` event handling to the annotation plugin config. When a sector band is clicked, dispatch `sector:click` with the corresponding `sectorId`.

2. **Implementation:** Chart.js annotation plugin supports `click` callbacks on individual annotations. Add `click: (ctx, event) => { ... }` to each sector annotation definition.

**Estimated code change:** ~15 lines added to the sector annotation loop in `initChart()`.

#### 3d. SectorDetailPanel Component

**New file:** `src/components/SectorDetailPanel.astro`

**Architecture:**
```
SectorDetailPanel.astro
  <!-- Hidden by default, shown on sector:click -->
  <aside id="sector-panel" class="fixed right-0 top-0 h-full w-80 ... translate-x-full transition-transform">
    <button aria-label="Close panel">X</button>
    <h3 id="sector-name"></h3>
    <div id="sector-difficulty"></div>  <!-- star rating -->
    <div id="sector-stats"></div>       <!-- miles, start mile, surface -->
    <div id="sector-mini-elevation"></div>  <!-- optional: mini elevation slice -->
  </aside>

  <script>
    // Sector data inlined at build time or fetched from annotations.json
    const sectors = await fetch('/data/annotations.json')
      .then(r => r.json())
      .then(data => data.filter(a => a.type === 'sector'));

    window.addEventListener('sector:click', (e) => {
      const sector = sectors.find(s => s.id === e.detail.sectorId);
      if (!sector) return;
      // Populate panel DOM
      // Remove translate-x-full to slide in
    });

    // Close button dispatches sector:close
    document.getElementById('sector-close').addEventListener('click', () => {
      // Add translate-x-full to slide out
      window.dispatchEvent(new CustomEvent('sector:close'));
    });
  </script>
```

**Panel positioning:** Fixed right-side slide-out panel. On mobile (< 640px), the panel should be full-width bottom sheet instead of right-side. Use a responsive CSS approach:
```css
@media (max-width: 639px) {
  #sector-panel {
    width: 100%;
    height: auto;
    max-height: 60vh;
    top: auto;
    bottom: 0;
    transform: translateY(100%);  /* slides up from bottom */
  }
}
```

**Data flow:** The panel fetches `annotations.json` at runtime (same file RouteMap and ElevationProfile already fetch). The additional sector fields needed for the detail panel (star rating, surface type description) require extending the annotation schema.

**Schema extension for annotations.json:**
```typescript
// Additional fields for sector annotations
z.object({
  // ... existing fields ...
  difficulty: z.enum(['easy', 'moderate', 'hard']),
  stars: z.number().min(1).max(5).optional(),      // NEW: 1-5 star difficulty rating
  surface: z.string().optional(),                    // NEW: "rugged two-track", "FS gravel", etc.
  description: z.string().optional(),                // NEW: editorial description for panel
})
```

The data from `data.md` (star ratings, segment names) maps directly to these fields. The `resolve-annotations.js` script would be updated to include them.

**Build order implication:** Depends on RouteMap and ElevationProfile being modified to emit `sector:click`. Best built after those modifications. Pipeline script update is a prerequisite.

---

### 4. Ojibwe Design Elements

**New components:**
- `src/components/OjibweBorder.astro` -- Reusable SVG section divider
- `src/components/OjibweMotif.astro` -- Standalone decorative SVG element

**Modified file:** `src/styles/global.css`

**Architecture approach:** Inline SVG components, not external SVG files. This keeps the decorative elements:
- Part of the HTML (no extra HTTP requests)
- Styleable via CSS custom properties (colors change with theme)
- Accessible (decorative role, hidden from screen readers)

**OjibweBorder replaces topo-divider:**
```astro
---
// OjibweBorder.astro
interface Props {
  variant?: 'floral' | 'geometric' | 'beadwork';
}
const { variant = 'floral' } = Astro.props;
---
<div class="ojibwe-border" role="presentation" aria-hidden="true">
  {variant === 'floral' && (
    <svg ...><!-- Woodland floral pattern --></svg>
  )}
  <!-- other variants -->
</div>
```

**Current topo-divider uses a data URI SVG in CSS:**
```css
.topo-divider {
  height: 60px;
  background-image: url('data:image/svg+xml;utf8,...');
}
```

The Ojibwe border component replaces this inline -- the `.topo-divider` class in global.css either gets updated or deprecated in favor of the component.

**Color token evolution in `@theme`:**

The inspiration images show a direction toward warmer earth tones, birchbark textures, and more vibrant accent colors. The `@theme` block in global.css needs new color tokens while preserving the existing ones for backward compatibility.

```css
@theme {
  /* Existing forest greens -- PRESERVED */
  --color-forest-950: #0d1a0d;
  --color-forest-900: #1a2e1a;
  /* ... */

  /* NEW: Warmer earth tones inspired by Ojibwe art */
  --color-birch-100: #f5efe6;     /* warm birchbark light */
  --color-birch-200: #e8dcc8;     /* birchbark medium */
  --color-birch-300: #d4c4a8;     /* birchbark dark */

  /* NEW: Ojibwe-inspired accent colors */
  --color-berry-500: #8b2252;     /* berry/magenta from beadwork */
  --color-sky-400: #5da9c7;       /* lake blue */
  --color-earth-600: #7a5c3a;     /* warm brown earth */

  /* Existing amber -- may shift warmer */
  --color-amber-500: #c8973e;     /* keep or warm up slightly */

  /* NEW: Decorative element colors */
  --color-motif-primary: var(--color-amber-500);
  --color-motif-secondary: var(--color-berry-500);
  --color-motif-tertiary: var(--color-sky-400);
}
```

**Build order implication:** Color tokens should be defined FIRST (they affect everything). Decorative components can be built independently of interactive features.

---

### 5. Color Scheme Evolution

**Modified file:** `src/styles/global.css` -- `@theme` block only

This is purely a token update. The existing component CSS references tokens like `var(--color-amber-500)`, `var(--color-forest-900)`, etc. Changing the token values changes the entire site's appearance without touching any component code.

**Strategy:** Additive tokens, not replacements. Add new semantic aliases that reference the new palette, keeping the original tokens as fallbacks during transition:

```css
@theme {
  /* Semantic aliases -- components can adopt these gradually */
  --color-bg-primary: var(--color-forest-900);     /* may change to birch-100 for light sections */
  --color-bg-secondary: var(--color-forest-800);
  --color-text-primary: var(--color-cream-100);
  --color-text-heading: var(--color-amber-500);
  --color-accent-primary: var(--color-amber-500);
  --color-accent-secondary: var(--color-berry-500);
  --color-divider: var(--color-forest-700);
}
```

**Build order implication:** Should be the FIRST thing done -- all other visual changes build on top of the evolved color system.

---

### 6. Editorial Narrative Sections

**New component:** `src/components/NarrativeSection.astro`
**New component:** `src/components/RouteExplainer.astro`

These are purely presentational Astro components with no client-side JavaScript. They render static HTML at build time.

**NarrativeSection.astro** replaces the current inline `<section>` in index.astro that contains the Hiawatha history paragraphs. The v1.1 version has:
- Witty, editorial tone (rewritten copy)
- Integrated photos (pulled from the photo manifest or editorially selected)
- Pull quotes
- Wider layout with editorial spacing

**Architecture:**
```astro
---
// NarrativeSection.astro
// Static component -- no client-side JS, no event bus
---
<section class="max-w-prose mx-auto px-4 py-[--spacing-section]">
  <h2>...</h2>
  <div class="narrative-body">
    <p>...</p>
    <figure class="float-right ml-6 mb-4 w-48">
      <img src="/thumbs/selected-photo.webp" alt="..." loading="lazy" />
    </figure>
    <blockquote>...</blockquote>
    <p>...</p>
  </div>
</section>
```

**RouteExplainer.astro** is a new content section showing the route overview with integrated photos against a topographic background. It is a visual section, not interactive.

**Data dependency:** Both components use static content (hardcoded in the Astro template). They do NOT need content collections or JSON data unless the narrative text is extracted to a Markdown file for easier editing. For v1.1, keeping the content inline in the component is simpler and recommended.

**Build order implication:** Zero dependencies on other v1.1 features. Can be built at any time. Best done after color tokens are updated.

---

### 7. Event Date Display

**New component:** `src/components/EventDate.astro`

The simplest new component. Displays "June 6, 2026" prominently.

**Architecture options:**
- **Option A:** Standalone component placed in hero section
- **Option B:** Part of HeroSection.astro (inline, not a separate component)

**Recommendation: Option B.** The event date is only displayed once (in the hero) and is a simple text element. Creating a separate component for a single date string is over-abstraction. Include it inline in HeroSection.astro.

If the date needs to appear in multiple places (hero + a sidebar or footer), extract to a separate component at that point.

---

## Data Flow Changes

### annotations.json Schema Extension

**Current fields (sectors):**
```json
{
  "id": "sector-520",
  "type": "sector",
  "name": "520",
  "startMile": 1.1,
  "endMile": 2.4,
  "lengthMiles": 1.3,
  "startLat": 46.35686,
  "startLon": -86.73175,
  "endLat": 46.34027,
  "endLon": -86.74124,
  "startIdx": 5,
  "endIdx": 14,
  "difficulty": "hard"
}
```

**New fields needed for sector detail panel:**
```json
{
  "stars": 2,
  "surface": "Rugged Two-Track",
  "description": "A rough forest two-track with significant washboarding..."
}
```

**Source:** The star ratings are already documented in `data.md`. The `resolve-annotations.js` script needs to be updated to include them in the output.

**Schema update in content.config.ts:**
```typescript
z.object({
  // ... existing fields ...
  difficulty: z.enum(['easy', 'moderate', 'hard']),
  stars: z.number().min(1).max(5).optional(),
  surface: z.string().optional(),
  description: z.string().optional(),
})
```

**Backward compatibility:** All new fields are optional (`z.optional()`). Existing code that reads annotations.json ignores unknown fields. Zero breaking changes.

### photos.json Schema Extension

**New optional fields:**
```json
{
  "featured": true,
  "aspectRatio": 0.75
}
```

Used by the masonry gallery for editorial photo sizing. Backward compatible (optional fields).

### No Changes to route-data.json

The route data schema is unchanged. No new points, no new metadata. The hero section and narrative use static content, not route data.

---

## Modified File Analysis

### Files Requiring Modification (Ranked by Scope)

| File | Scope | Risk | Notes |
|------|-------|------|-------|
| `src/pages/index.astro` | LARGE | LOW | Section reordering, new imports, per-section width classes. No logic changes. |
| `src/styles/global.css` | LARGE | LOW | New `@theme` tokens, new/updated decorative patterns. Additive changes only. |
| `src/components/PhotoGallery.astro` | LARGE | MEDIUM | Rewrite grid to masonry. PhotoSwipe script block preserved as-is. |
| `src/components/RouteMap.astro` | MEDIUM | LOW | Add sector labels and click handlers to existing `initMap()`. All additions are at the end of the function. |
| `src/components/ElevationProfile.astro` | SMALL | LOW | Add click callbacks to existing sector annotation definitions. ~15 lines. |
| `src/layouts/BaseLayout.astro` | SMALL | LOW | Remove 4 CSS classes from `<main>` tag. One-line edit. |
| `src/components/RouteStats.astro` | SMALL | LOW | Style-only updates for new color tokens. |
| `src/components/DonateCallout.astro` | SMALL | LOW | Style-only updates for new color tokens. |
| `src/content.config.ts` | SMALL | LOW | Add optional fields to sector and photo schemas. |
| `scripts/resolve-annotations.js` | SMALL | LOW | Add star/surface/description fields from data.md source. |
| `scripts/match-photos.js` | SMALL | LOW | Add aspectRatio computation from sharp metadata. |

### Files NOT Requiring Modification

| File | Reason |
|------|--------|
| `scripts/parse-gpx.js` | Route data unchanged |
| `scripts/generate-thumbnails.js` | Thumbnail spec unchanged (400px WebP 80%) |
| `scripts/copy-gpx.js` | GPX file unchanged |
| `scripts/copy-images.js` | Image copy unchanged |
| `scripts/pipeline.js` | Pipeline orchestration unchanged (same scripts, same order) |
| `astro.config.ts` | No new integrations, fonts, or Vite plugins needed |
| `package.json` | No new dependencies needed |

---

## New Files to Create

| File | Purpose | Complexity |
|------|---------|------------|
| `src/components/HeroSection.astro` | Full-width hero with photo, badge, event date | Medium (SVG extraction, responsive sizing) |
| `src/components/SectorDetailPanel.astro` | Slide-out sector info panel | Medium (event bus integration, responsive panel) |
| `src/components/NarrativeSection.astro` | Rewritten Hiawatha narrative | Low (static content, no JS) |
| `src/components/RouteExplainer.astro` | Photo-integrated route overview | Low (static content, no JS) |
| `src/components/OjibweBorder.astro` | Decorative SVG divider | Low (SVG markup, CSS-only) |
| `src/components/OjibweMotif.astro` | Decorative SVG motif | Low (SVG markup, CSS-only) |

**Total: 6 new files.** All are Astro components. No new pages, no new layouts, no new scripts, no new dependencies.

---

## Build Order (Dependency Graph)

```
Phase dependencies flow left to right:

  Color Tokens (global.css @theme)
     |
     +---> Ojibwe Decorative Components (OjibweBorder, OjibweMotif)
     |        |
     |        +---> index.astro Restructure (uses new dividers)
     |
     +---> HeroSection (uses new tokens, replaces badge section)
     |        |
     |        +---> index.astro Restructure (imports HeroSection)
     |
     +---> NarrativeSection + RouteExplainer (static content, new tokens)
     |        |
     |        +---> index.astro Restructure (imports new sections)
     |
     +---> PhotoGallery Rewrite (masonry, uses new tokens)
              |
              +---> Pipeline Update (aspectRatio in match-photos.js)

  Pipeline Update (annotations schema + stars/surface/description)
     |
     +---> RouteMap Sector Labels + Click Handlers
     |        |
     |        +---> SectorDetailPanel
     |
     +---> ElevationProfile Sector Click Handlers
              |
              +---> SectorDetailPanel

  BaseLayout.astro Edit (one-line, prerequisite for full-width sections)
     |
     +---> Everything that uses full-width layout (Hero, Map section, Gallery)
```

### Recommended Phase Execution Order

**Phase A: Foundation (no visible changes, enables everything)**
1. Update `global.css` `@theme` with new color tokens and semantic aliases
2. Edit `BaseLayout.astro` to remove `max-w-4xl` constraint from `<main>`
3. Update `index.astro` to add per-section width containers (maintaining current appearance)

**Phase B: Visual Identity (decorative, no interactivity)**
4. Create `OjibweBorder.astro` and `OjibweMotif.astro` decorative components
5. Create `HeroSection.astro` (extract badge SVG, add hero photo, event date)
6. Replace badge section and topo-dividers in index.astro

**Phase C: Content Sections (static, no interactivity)**
7. Create `NarrativeSection.astro` with rewritten editorial narrative
8. Create `RouteExplainer.astro` with photo-integrated route overview
9. Integrate both into index.astro

**Phase D: Gallery Rework (client-side impact, contained)**
10. Update `match-photos.js` to extract aspect ratios
11. Update `content.config.ts` photo schema
12. Rewrite `PhotoGallery.astro` as masonry layout

**Phase E: Sector Interactivity (most complex, broadest impact)**
13. Update `resolve-annotations.js` to include stars/surface/description
14. Update `content.config.ts` annotations schema
15. Add sector labels and click handlers to `RouteMap.astro`
16. Add sector band click handlers to `ElevationProfile.astro`
17. Create `SectorDetailPanel.astro`
18. Integrate panel into index.astro

**Phase F: Polish**
19. Responsive testing (hero, masonry, sector panel mobile bottom sheet)
20. Color token refinement based on visual review
21. Accessibility audit (new components, panel keyboard/focus management)

---

## Architectural Patterns to Follow

### Pattern 1: Astro Component Scoping (Existing -- Preserve)

Every v1.0 component uses Astro's scoped `<style>` blocks. New components MUST follow this pattern. Do NOT add component-specific styles to `global.css` -- only `@theme` tokens and base/layer styles belong there.

### Pattern 2: CustomEvent Bus (Existing -- Extend)

The v1.0 event bus pattern (window.dispatchEvent / window.addEventListener) works well for 3-4 events and should extend cleanly to 6-7. At this scale, there is no need for a state management library (Nano Stores, etc.).

**Event naming convention:** `namespace:action` (e.g., `sector:click`, `sector:close`). Follow the existing `elevation:hover`, `map:photoClick` pattern.

**Critical rule to preserve:** Event listeners are registered at module scope (outside async init functions) with null guards. This ensures listeners are wired before the emitting component initializes. See the existing `window.addEventListener('elevation:hover', ...)` pattern in RouteMap.astro.

### Pattern 3: Lazy Loading (Existing -- Extend to New Components)

The SectorDetailPanel does NOT need lazy loading -- it is hidden by default and has minimal JS. The panel's `<script>` block can run eagerly because it only registers event listeners (lightweight).

The HeroSection does NOT need lazy loading -- it is above the fold.

The NarrativeSection and RouteExplainer have no JS at all.

Only RouteMap and ElevationProfile retain their existing IntersectionObserver lazy-loading.

### Pattern 4: Semantic HTML + Accessibility (Extend)

New interactive components need:
- `SectorDetailPanel`: `role="dialog"` or `<aside>`, `aria-label`, focus trap when open, Escape key to close
- Sector labels on map: `title` attribute for accessibility
- Hero section: `<img alt="...">` for hero photo (not decorative)
- Ojibwe decorative elements: `role="presentation" aria-hidden="true"`

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Creating a Shared State Store for 6 Events

It would be tempting to introduce Nano Stores or a similar shared-state library to coordinate the growing number of cross-component interactions. **Do not do this.** The CustomEvent bus handles 6-7 events cleanly. A state store adds a dependency, a learning curve, and hydration concerns for what is essentially a static site with a few interactive sprinkles.

**When to reconsider:** If event count exceeds ~12 or if components need to read each other's current state (not just react to state changes), then a store becomes justified. v1.1 does not approach this threshold.

### Anti-Pattern 2: Using a Masonry JS Library

Libraries like Masonry.js, Isotope, or react-masonry-css add JavaScript weight and hydration complexity for a layout that CSS `columns` handles natively. The only limitation of CSS columns is that items flow top-to-bottom-then-left-to-right rather than left-to-right-then-top-to-bottom. For a photo gallery, this is acceptable and arguably preferred (users scan vertically within columns).

### Anti-Pattern 3: Breaking the Two-Phase Build Pipeline

The v1.1 data changes (new annotation fields, photo aspect ratios) are additions to existing pipeline scripts. Do NOT create new pipeline scripts for these small changes -- extend the existing `resolve-annotations.js` and `match-photos.js`.

### Anti-Pattern 4: Over-Componentizing Static Content

The narrative and route explainer sections are each used exactly once. There is no reuse case. They should be components for code organization (keeping index.astro clean), but they should NOT be further decomposed into paragraph components, quote components, etc. One component per content section is the right granularity.

### Anti-Pattern 5: Full-Width Sections via Negative Margins

A common hack for full-width sections inside constrained containers is `margin-left: calc(-50vw + 50%); width: 100vw;`. **Do not do this.** It causes horizontal scrollbar issues and breaks on mobile with browser chrome. The correct approach (implemented above) is removing the constraint from `<main>` and letting each section opt into its own width.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| BaseLayout width change breaks existing section spacing | HIGH | LOW | Mechanical fix: add `max-w-4xl mx-auto px-4` to each section wrapper in index.astro. Test all sections after the change. |
| PhotoGallery rewrite breaks PhotoSwipe integration | MEDIUM | MEDIUM | The PhotoSwipe `<script>` block is decoupled from the HTML grid structure. As long as `#photo-gallery` contains `<a>` children with `data-pswp-*` attributes, PhotoSwipe works. Test lightbox after masonry change. |
| Sector click event conflicts with existing map interactions | LOW | LOW | Sector polylines already exist on the map. Adding click handlers is additive. Use `L.DomEvent.stopPropagation` if clicks bleed through to the map. |
| Ojibwe SVG decorative elements increase page weight | LOW | LOW | Inline SVGs are tiny (< 5KB each). The existing badge SVG is already ~30 lines of inline SVG. |
| SectorDetailPanel z-index conflicts with Leaflet popups | MEDIUM | LOW | Set panel z-index to `z-50` (Tailwind). Leaflet popups are z-index 700 within their container but the panel is `position: fixed` so it sits above the document flow. Test on mobile where the panel is a bottom sheet. |

---

## Sources

- Direct source code analysis of all files in `/Users/Sheppardjm/Repos/hiawathasRevenge/src/` -- HIGH confidence
- v1.0 ARCHITECTURE.md research document -- HIGH confidence
- Inspiration images in `images/inspiration/` -- HIGH confidence (first-party project artifacts)
- `data.md` sector star ratings and history content -- HIGH confidence (first-party data)
- CSS `columns` browser support: verified via MDN -- HIGH confidence (universally supported)
- CSS Masonry (`grid-template-rows: masonry`) status: behind flags only, not production-ready as of March 2026 -- HIGH confidence (verified via web standards status)
- Chart.js annotation plugin click callbacks: verified from chartjs-plugin-annotation docs -- HIGH confidence

---
*Architecture research for: Hiawatha's Revenge v1.1 Visual Redesign*
*Researched: 2026-03-31*
