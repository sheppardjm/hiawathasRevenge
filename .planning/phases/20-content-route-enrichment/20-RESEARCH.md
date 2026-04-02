# Phase 20: Content & Route Enrichment — Research

**Researched:** 2026-04-01
**Domain:** Astro component editing, CSS typography/pull-quote layout, CSS filter effects, historical image sourcing, Strava link conventions
**Confidence:** HIGH (codebase inspection, MDN verification) / MEDIUM (image sourcing) / LOW (Strava segment IDs)

---

## Summary

Phase 20 enriches two existing components — `HiawathaExplainer.astro` and `RouteExplainer.astro` — with editorial typography, historical imagery, a dramatic pull quote, and expanded segment data. No new components are required; all work happens inside or alongside these two files, plus manifest population and image sourcing.

The technical stack is already in place: National Park typeface is live via Astro Fonts API (`--font-display`), `ShieldMotif.astro` is built and wired, the `process-historical.js` pipeline step exists and handles empty manifests gracefully, and `historical-manifest.json` / `historical-photos.json` are ready to populate. The build pipeline writes `public/data/historical-photos.json` which the component will read.

The primary challenge is **content, not code**: historical illustrations must be sourced and placed in `images/historical/` before the pipeline can process them, and Strava segment IDs will be user-provided at implementation time. The CSS techniques (pull quote, sepia filter, difficulty-coded subheadings) are all straightforward single-property patterns with strong browser support.

**Primary recommendation:** Treat this phase as three sequential concerns — (1) image sourcing and pipeline population for CON-04/CON-05, (2) HiawathaExplainer restructure for CON-01/CON-02/CON-03, (3) RouteExplainer enrichment for RTE-01/RTE-03/RTE-04. The plans map cleanly onto these three concerns (20-01, 20-02, 20-03).

---

## Standard Stack

### Core (all already in project — no new dependencies)

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| Astro | ^6.1.1 | Component rendering, content collection reads | `getCollection()` already used by ElevationSparkline |
| sharp | ^0.34.5 | Historical image processing in pipeline | Already used by `process-historical.js` |
| CSS `filter` | browser native | Sepia/desaturated treatment for historical images | `sepia(80%) saturate(30%)` on `<img>` |
| `--font-display` | National Park via Astro Fonts | Subheadings and pull quotes | Already configured in `astro.config.ts` |
| `ShieldMotif.astro` | Phase 19 | Shield icon prefix on segment subheadings | Import and use as `<ShieldMotif size={16} class="text-moss-500" />` |

### No new dependencies needed

All requirements are achievable with existing CSS, SVG, and pipeline infrastructure. The constraint "No new npm dependencies" is fully satisfied.

---

## Architecture Patterns

### Recommended File Changes

```
src/components/
├── HiawathaExplainer.astro   # MODIFIED — subheadings, historical images, pull quote
└── RouteExplainer.astro      # MODIFIED — segment subheadings with shield icon,
                              #             Strava links, expanded terrain descriptions
images/
└── historical/               # CREATE — 2-4 public domain illustration source files
public/data/
└── historical-manifest.json  # POPULATE — currently [] (empty array)
```

No new `.astro` component files are needed. The `HistoricalImage` rendering can be done inline in `HiawathaExplainer.astro` since it is a single-consumer pattern.

---

### Pattern 1: HiawathaExplainer Subheading Structure (CON-01)

**What:** Replace the single `<h2>` with a subheading hierarchy. The existing prose maps naturally to 4 narrative beats: The Poem, The Confusion, The Forest, The Ride. Each gets an `<h3>` in `font-display` (National Park) with a distinct color from the palette.

**Color allocation for 3+ colors (all WCAG AA on forest-900/950):**
- "The Poem" — `text-amber-500` (existing heading color, continuity)
- "The Confusion" — `text-turquoise-400` (7.78:1 on forest-900, text-safe)
- "The Forest" — `text-sun-400` (9.46:1 on forest-900, text-safe)
- "The Ride" — `text-scarlet-400` (5.24:1 on forest-900, text-safe; use only at h3 size which qualifies as large text)

**Note:** `scarlet-600` is off-limits for normal text per STATE.md decision 18-01. Use `scarlet-400` (5.24:1) which passes AA even for normal text, or `scarlet-500` (3.85:1) as large-text-only.

**Example h3 pattern:**
```astro
<h3 class="text-xl font-display text-turquoise-400 mt-[6rem] mb-4">
  The Confusion
</h3>
```

**Spacing:** Requirements call for 6-8rem between major sections (`--spacing-section` is 4rem; use `mt-[6rem]` or `mt-[8rem]` via Tailwind arbitrary values for the generous whitespace).

---

### Pattern 2: Historical Image Breaks (CON-02, CON-04, CON-05)

**What:** After sourcing images into `images/historical/` and populating `historical-manifest.json`, the pipeline writes `public/data/historical-photos.json` with `thumb`, `title`, `artist`, `year`, `source`, `license` fields. The component imports this JSON and renders `<figure>` elements between prose paragraphs.

**Pipeline manifest entry format** (from `process-historical.js` inspection):
```json
[
  {
    "filename": "remington-hiawatha-1891.jpg",
    "category": "historical",
    "title": "Hiawatha's Departure",
    "artist": "Frederic Remington",
    "year": "1891",
    "source": "Wikimedia Commons / Public Domain",
    "license": "Public Domain"
  }
]
```

**Component rendering pattern:**
```astro
---
import historicalPhotos from '../../public/data/historical-photos.json';
---

{historicalPhotos.length > 0 && (
  <figure class="historical-break">
    <img
      src={historicalPhotos[0].thumb}
      alt={historicalPhotos[0].title}
      class="historical-img"
      loading="lazy"
      decoding="async"
    />
    <figcaption class="historical-caption">
      <em>{historicalPhotos[0].title}</em> — {historicalPhotos[0].artist}, {historicalPhotos[0].year}.
      {historicalPhotos[0].source}
    </figcaption>
  </figure>
)}
```

**CSS for "historical artifact" treatment (CON-05):**
```css
.historical-img {
  filter: sepia(80%) saturate(30%) brightness(0.9);
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  display: block;
}

.historical-break {
  margin: 6rem auto;
  text-align: center;
  max-width: 640px;
}

.historical-caption {
  font-size: var(--font-size-sm);
  color: var(--color-cream-200);
  margin-top: 0.75rem;
  font-style: italic;
}
```

**Key contrast:** Route photos use no filter (full-color). Historical images use `sepia(80%) saturate(30%)`. This visual distinction satisfies CON-05.

**Graceful empty state:** When `historical-photos.json` is `[]` (before images are sourced), the conditional `{historicalPhotos.length > 0 && ...}` blocks skip rendering entirely. Build does not fail.

---

### Pattern 3: Dramatic Pull Quote Treatment (CON-03)

**What:** The existing `<blockquote>` in `HiawathaExplainer.astro` (line 46) gets a full editorial pull quote treatment — breakout width, 60-80px quotation marks, background color shift, National Park typeface, arrowhead ornament.

**CSS pattern (all in component `<style>` block):**
```css
.pull-quote {
  /* Breakout: wider than the max-prose container */
  width: 100%;
  max-width: 48rem;            /* wider than max-w-prose (65ch ≈ 40rem) */
  margin: 4rem auto;
  padding: 2.5rem 3rem;
  background-color: var(--color-forest-950);
  border: none;                /* remove the existing border-l-2 */
  position: relative;
  font-family: var(--font-display);
  font-size: var(--font-size-xl);
  color: var(--color-cream-50);
  line-height: 1.5;
}

/* Oversized opening quotation mark (60-80px) */
.pull-quote::before {
  content: '\201C';           /* left double quotation mark */
  font-family: var(--font-display);
  font-size: 5rem;            /* 80px */
  line-height: 0;
  color: var(--color-gold-500);
  position: absolute;
  top: 2.5rem;
  left: 1rem;
  opacity: 0.6;
}

/* ShieldMotif ornament — rendered as inline SVG or <ShieldMotif> in template */
/* Position after the closing quote text */
```

**Template update:**
```astro
---
import ShieldMotif from './ShieldMotif.astro';
---
<blockquote class="pull-quote">
  <p>"a romanticized conflation of disparate Indian tribes, their traditions, and their legends" — one that presented Native American culture as doomed, a relic of the past inevitably making way for Euro-American expansion.</p>
  <ShieldMotif size={12} class="text-gold-500 opacity-40 mt-4" />
</blockquote>
```

**Note:** The existing blockquote has `border-l-2 border-gold-500 pl-4` inline Tailwind classes. These must be replaced with the pull quote CSS class.

---

### Pattern 4: RouteExplainer Segment Subheadings (RTE-01)

**What:** Replace the existing `<h3 class="text-xl font-display text-amber-400">` with a version that includes a `ShieldMotif` icon prefix and uses difficulty-coded color.

**Difficulty mapping:** The `SEGMENTS` array uses numeric difficulty 1-5. Map to categories:
- 1-2 = easy → `text-moss-500` (decorative only, but large heading qualifies as large text; `moss-500` is decorative-only per color system — use `sun-400` instead: 9.46:1)
- 3 = moderate → `text-amber-500` (primary accent)  
- 4-5 = hard → `text-scarlet-400` (5.24:1, AA for normal text)

**Color decision note:** `moss-500` is documented as decorative/non-text-only. For difficulty "easy" headings, use `sun-400` (gold/yellow family, 9.46:1 contrast, text-safe). This gives a visually appropriate green-ish gold for easy, amber for moderate, red for hard.

**Pattern:**
```astro
---
import ShieldMotif from './ShieldMotif.astro';

const DIFFICULTY_COLORS: Record<number, string> = {
  1: 'text-sun-400',    // easy — sun-yellow, text-safe
  2: 'text-sun-400',    // easy
  3: 'text-amber-500',  // moderate — amber, primary accent
  4: 'text-scarlet-400', // hard — scarlet, text-safe
  5: 'text-scarlet-400', // hard
};
---

<div class="flex items-center gap-2">
  <ShieldMotif size={10} class={DIFFICULTY_COLORS[seg.difficulty]} />
  <h3 class={`text-xl font-display ${DIFFICULTY_COLORS[seg.difficulty]}`}>
    {seg.name}
  </h3>
</div>
```

---

### Pattern 5: Strava Segment Links (RTE-03)

**What:** Each segment card gets an outbound `<a>` to `strava.com/segments/[ID]`. Segment IDs are user-provided at implementation time — the plan should include a placeholder mechanism (empty string or `null`) that conditionally renders the link only when an ID exists.

**Strava branding (from official guidelines):** Use "View on Strava" as link text. Strava's brand color is `#FC5200` (orange). No requirement to use the Strava logo for simple outbound links; the guidelines apply primarily to app developers. A plain text link with orange color is sufficient and compliant.

**SVG Strava icon alternative:** The Strava "S" chevron shape can be hand-authored as an inline SVG path (no external dependency, no logo file needed). This avoids branding questions while still being visually recognizable. Given "no new npm dependencies," a simple inline SVG or Unicode external link icon is the right approach.

**Pattern:**
```astro
// In SEGMENTS array, add optional stravaId field
interface Segment {
  // ...existing fields...
  stravaId?: string;
}

// In template
{seg.stravaId && (
  <a
    href={`https://www.strava.com/segments/${seg.stravaId}`}
    class="strava-link"
    target="_blank"
    rel="noopener noreferrer"
  >
    View on Strava
    <svg aria-hidden="true" ...><!-- external link icon --></svg>
  </a>
)}
```

**When IDs are unknown:** Set `stravaId: undefined` on all segments at plan time. The user populates them during implementation. The conditional prevents broken links.

---

### Pattern 6: Expanded Terrain Descriptions (RTE-04)

**What:** The 7 segment descriptions in the `SEGMENTS` array need expansion to include surface type, key landmarks, and seasonal notes. This is a content authoring task, not a code architecture task.

**Current descriptions** are 1-2 sentences of vivid editorial prose. Expansion adds:
- Surface type (paved, gravel, sand/two-track, singletrack)
- Key landmarks (lakes, roads, campgrounds, intersections)
- Seasonal notes (snow-melt mud, fall color, summer heat)

**Existing description format preserved:** The editorial voice matches the HiawathaExplainer tone ("The route's crucible," "deceptively civilized"). Expansions should maintain this voice.

---

## Public Domain Image Sourcing (CON-04)

### Confirmed Available Sources

**HIGH confidence — public domain status clear:**

1. **Frederic Remington illustrations (1891)** — 22 grisaille oil paintings created for the 1891 Houghton Mifflin deluxe photogravure edition of *The Song of Hiawatha*. Remington died 1909; all works pre-1928, firmly public domain in the US. The Met Open Access collection confirms the edition is held in the Thomas J. Watson Library.

2. **Wikimedia Commons** — Search `commons.wikimedia.org` for "Frederic Remington Hiawatha" or "Song of Hiawatha illustration." Individual file pages confirm CC0 / Public Domain status. Typical download URL pattern: `https://upload.wikimedia.org/wikipedia/commons/...`

3. **Internet Archive** — Digitized editions of *The Song of Hiawatha* (various dates 1855-1910) include scanned illustration pages. Search `archive.org` for "song of hiawatha" with mediatype:texts. Pages can be extracted as JPG.

**MEDIUM confidence — needs verification at sourcing time:**

4. **Harrison Fisher illustrations** — The objective context mentions "Harrison Fisher 1906" but the Wikipedia article on *The Song of Hiawatha* does not list Fisher as an illustrator. Fisher (1877–1934) was primarily known for magazine cover illustration. This specific attribution needs verification — he may have illustrated a 1906 edition. His works pre-1928 are public domain.

5. **Met Open Access** — `metmuseum.org/art/collection/search?showOnly=openAccess` with query "hiawatha" returns artworks marked `isOpenAccess: true`. The Edmonia Lewis marble busts (1868) are confirmed Open Access but are sculptures, not illustrations.

### Image Placement Recommendation

Place sourced images in: `images/historical/` (the pipeline's `SRC_DIR`)  
Name them descriptively: `remington-hiawatha-1891-[subject].jpg`  
Populate: `public/data/historical-manifest.json` with the schema the pipeline expects

### Manifest Schema (from `process-historical.js` inspection)

```json
[
  {
    "filename": "remington-hiawatha-1891.jpg",
    "category": "historical",
    "title": "Hiawatha's Canoe",
    "artist": "Frederic Remington",
    "year": "1891",
    "source": "Internet Archive / Public Domain",
    "license": "Public Domain"
  }
]
```

The pipeline validates `category === "historical"` and skips entries where the source file doesn't exist in `images/historical/`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sepia treatment | Custom CSS blend modes or canvas API | `filter: sepia(80%) saturate(30%)` | Single CSS property, universal browser support, zero JS |
| Historical image component | New `HistoricalImage.astro` component | Inline figure markup in `HiawathaExplainer.astro` | Single-consumer; a separate component adds abstraction overhead with no reuse benefit |
| Strava icon | Full SVG logo file download | Inline external-link SVG or orange text link | Avoids brand asset questions; "View on Strava" in orange is per-spec compliant |
| Pull quote ornament | Custom SVG path | `<ShieldMotif size={12}>` already built | Phase 19 delivered this component precisely for this use case |
| Difficulty color logic | Complex CSS class calculation | Simple TypeScript `Record<number, string>` lookup | Already established pattern in `ElevationSparkline.astro` (DIFFICULTY_COLORS record) |

---

## Common Pitfalls

### Pitfall 1: Historical images render before sourcing completes
**What goes wrong:** Plan tasks reference `historical-photos.json` data that doesn't exist yet if image sourcing hasn't happened.  
**Why it happens:** The pipeline writes `[]` when `images/historical/` is empty (graceful guard in `process-historical.js` line 45-51).  
**How to avoid:** Image sourcing (placing files in `images/historical/` and populating `historical-manifest.json`) must be the first task of 20-01, before any component code expects populated data.  
**Warning signs:** `historical-photos.json` is still `[]` after running pipeline.

### Pitfall 2: scarlet-600 used for difficulty "hard" subheadings
**What goes wrong:** `scarlet-600` (#dc2626) fails WCAG AA for normal text (3.00:1 on forest-900). If used for segment `<h3>` text at smaller sizes, it fails accessibility.  
**Why it happens:** The color looks visually "red/hard" and is tempting.  
**How to avoid:** Use `scarlet-400` (#f87171, 5.24:1 — AA for all text sizes). This is the established pattern from ElevationSparkline's DIFFICULTY_COLORS.  
**Warning signs:** Any use of `text-scarlet-600` in RouteExplainer heading context.

### Pitfall 3: moss-500 used for "easy" difficulty text
**What goes wrong:** `moss-500` is documented as "decorative/non-text only (fails AA on dark bg)" per global.css comments. Using it for h3 text headings would fail accessibility.  
**Why it happens:** Green intuitively represents "easy."  
**How to avoid:** Use `sun-400` (gold-yellow, 9.46:1 contrast) for easy segments. Visually distinct from amber-500 (moderate) while being clearly lighter/warmer than scarlet (hard).  
**Warning signs:** `text-moss-500` appearing on any heading element.

### Pitfall 4: Pull quote breaks prose flow on mobile
**What goes wrong:** "Breakout width" wider than the parent container creates horizontal scroll on mobile.  
**Why it happens:** Using `width: 110%` or negative margins without full-width parent containment.  
**How to avoid:** Keep `width: 100%` and expand padding/background. The visual "breakout" comes from the background-color shift and padding, not literal width overflow. The `max-w-4xl` parent already constrains width.  
**Warning signs:** Horizontal scrollbar on mobile when pull quote is visible.

### Pitfall 5: Historical images load eagerly above fold
**What goes wrong:** Large historical image files cause LCP regression.  
**Why it happens:** Missing `loading="lazy"` on below-fold images.  
**How to avoid:** All historical `<img>` elements must have `loading="lazy" decoding="async"`. The HiawathaExplainer section is below the hero, so no historical images are above fold.  
**Warning signs:** LCP score regression in Lighthouse after adding historical images.

### Pitfall 6: Strava links without `rel="noopener noreferrer"`
**What goes wrong:** Security issue — `target="_blank"` without `rel="noopener"` allows the opened page to access `window.opener`.  
**Why it happens:** Forgetting rel attributes on external links.  
**How to avoid:** All Strava links: `target="_blank" rel="noopener noreferrer"`.

---

## Code Examples

### Sepia Filter for Historical Images

```css
/* Source: MDN Web Docs — CSS filter property */
.historical-img {
  filter: sepia(80%) saturate(30%) brightness(0.9);
  /* sepia(80%): strong warm sepia tone */
  /* saturate(30%): further desaturates remaining color */
  /* brightness(0.9): slight darkening for aged-paper feel */
}
```

Filters are applied left-to-right. The combination creates a convincing "historical artifact" effect without the complete visual deadness of pure `grayscale(100%)`.

### Pull Quote CSS (No Horizontal Overflow)

```css
/* Component <style> block */
.pull-quote {
  background-color: var(--color-forest-950);
  border-left: none;
  padding: 2.5rem 3rem 2.5rem 4.5rem;  /* extra left padding for quote mark */
  margin: 4rem 0;
  position: relative;
  font-family: var(--font-display);
  font-size: var(--font-size-xl);
  font-style: normal;                    /* override italic default */
  color: var(--color-cream-50);
}

.pull-quote::before {
  content: '\201C';
  font-size: 5rem;
  color: var(--color-gold-500);
  position: absolute;
  top: 1.5rem;
  left: 0.75rem;
  line-height: 1;
  opacity: 0.7;
  font-family: var(--font-display);
}
```

### Difficulty-Coded Color Record (RouteExplainer)

```typescript
// Mirrors the pattern from ElevationSparkline.astro
const DIFFICULTY_COLORS: Record<number, string> = {
  1: 'text-sun-400',     // easy — sun-yellow 9.46:1 contrast
  2: 'text-sun-400',     // easy
  3: 'text-amber-500',   // moderate — amber primary accent
  4: 'text-scarlet-400', // hard — scarlet-400 5.24:1 contrast
  5: 'text-scarlet-400', // hard
};
```

### National Park Typeface Subheading

```astro
<!-- CON-01: secondary heading in National Park typeface with distinct color -->
<h3 class="font-display text-2xl text-turquoise-400 mt-[6rem] mb-4 tracking-wide">
  The Confusion
</h3>
```

`font-display` maps to `var(--font-national-park)` per `global.css` line 111. The `tracking-wide` letter-spacing enhances the park-signage aesthetic.

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Single `<h2>` for entire HiawathaExplainer | Multiple `<h2>` + `<h3>` subheadings | Required CON-01 |
| Simple `border-l-2` blockquote | Full editorial pull quote | Required CON-03 |
| No historical imagery | 2-4 sepia public domain illustrations | Required CON-02/04/05 |
| Plain `<h3>` segment titles | Shield icon + difficulty-coded color h3 | Required RTE-01 |
| No Strava links | Conditional outbound links per segment | Required RTE-03 |
| 1-2 sentence segment descriptions | Expanded terrain + landmarks + seasonal | Required RTE-04 |

---

## Open Questions

1. **Harrison Fisher 1906 attribution**
   - What we know: The STATE.md context names "Harrison Fisher 1906" as a source
   - What's unclear: Wikipedia's Hiawatha article does not list Fisher as a Hiawatha illustrator; he was a Gibson-Girl-era illustrator. A 1906 Fisher edition may exist but is unverified.
   - Recommendation: Confirm via archive.org search at sourcing time; Remington 1891 is the safer, confirmed source. If Fisher 1906 cannot be found, substitute another confirmed public domain illustrator (Bufford 1856, or any pre-1928 illustrated edition).

2. **Strava segment IDs**
   - What we know: User will create Strava segments and provide IDs during Phase 20 implementation
   - What's unclear: Whether IDs exist at plan execution time
   - Recommendation: Plan 20-03 should implement the link mechanism with `stravaId?: string` as optional, so the UI is complete even if IDs arrive later. Include a comment in the code with placeholder text.

3. **Number of historical images to source**
   - What we know: Requirements say "2-4 public domain historical Hiawatha illustrations" (CON-04); "1-2 full-width historical illustration breaks" (CON-02) suggests 2 is the working number for layout purposes
   - What's unclear: Whether 2 or 4 images is optimal for the editorial flow
   - Recommendation: Plan for 2 illustrations (one between paragraphs 2-3, one between paragraphs 4-5 of HiawathaExplainer). If more are sourced, the data-driven rendering pattern handles them automatically.

4. **Breakout width behavior at max-width**
   - What we know: The HiawathaExplainer uses `max-w-4xl mx-auto px-4` as outer container (from `index.astro`)
   - What's unclear: How wide the pull quote should visually appear — the requirement says "breakout width" but the container already constrains to 4xl (56rem / 896px)
   - Recommendation: Use `max-w-prose` on paragraph text but allow the blockquote to fill the full `max-w-4xl` parent. This creates visual breakout relative to the prose width without true viewport-breaking.

---

## Sources

### Primary (HIGH confidence)

- Codebase inspection: `src/components/HiawathaExplainer.astro`, `src/components/RouteExplainer.astro`, `src/components/ShieldMotif.astro`, `src/components/ElevationSparkline.astro` — direct file reads
- `scripts/process-historical.js` — direct file read confirming manifest schema and graceful empty guard
- `public/data/historical-manifest.json` — confirmed `[]` (empty, ready to populate)
- `src/styles/global.css` — color palette, WCAG contrast ratios, font token definitions
- MDN Web Docs CSS filter — `sepia()`, `grayscale()`, `saturate()` syntax and browser support
- `.planning/STATE.md` — prior decisions (scarlet-600, moss-500, sun-yellow constraints)

### Secondary (MEDIUM confidence)

- Wikipedia: The Song of Hiawatha — Remington 1891 photogravure edition confirmed, 22 grisaille illustrations
- Met Open Access search — Remington 1891 edition confirmed in Watson Library collection
- Strava Developer Guidelines (`developers.strava.com/guidelines/`) — "View on Strava" link text requirement, `#FC5200` orange, logo usage restrictions

### Tertiary (LOW confidence)

- Harrison Fisher 1906 Hiawatha attribution — mentioned in project context but not confirmed by Wikipedia or other authoritative source; needs verification at sourcing time

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools already in project, direct codebase verification
- Architecture: HIGH — patterns derived from existing component inspection
- CSS techniques: HIGH — MDN-verified filter syntax, existing project CSS patterns
- Image sourcing: MEDIUM — Remington 1891 confirmed public domain, Fisher unverified
- Pitfalls: HIGH — directly observed from codebase (scarlet-600 constraint from STATE.md, moss-500 from global.css)

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable stack; CSS and image sourcing don't change rapidly)
