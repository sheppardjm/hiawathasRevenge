# Technology Stack: v1.2 Cultural Maximalism

**Project:** Hiawatha's Revenge v1.2 Cultural Maximalism
**Researched:** 2026-03-31
**Scope:** Stack additions for animated SVG dividers, bold color palette, historical imagery, shield motifs, Strava integration, per-sector sparklines
**Overall Confidence:** HIGH
**Core constraint:** Zero new npm dependencies. CSS/SVG-only approach. Static output only.

---

## Executive Summary

The v1.2 cultural maximalism features require **zero new npm packages**. Every feature -- animated SVG dividers, bold multicolored palette, shield motifs, per-sector sparklines, and Strava embedding -- can be implemented with CSS animations, inline SVG, build-time data processing, and a single external embed script. The existing Astro 6 / Tailwind 4 / Chart.js stack handles everything.

The one external dependency is Strava's embed script (`strava-embeds.com/embed.js`), which is loaded via `<script>` tag and requires no API key or authentication.

---

## 1. CSS Animation Techniques for Multicolored Animated Dividers

### Recommendation: CSS `@keyframes` + CSS custom properties + `@property` for color animation

Three techniques, layered by capability:

### Technique A: `stroke-dasharray` / `stroke-dashoffset` Line Drawing (Primary)

Animate SVG paths to "draw themselves" on scroll. The vine-of-life in FloralDivider.astro is a perfect candidate.

```css
@keyframes draw-vine {
  from { stroke-dashoffset: var(--path-length); }
  to   { stroke-dashoffset: 0; }
}

.animated-vine path {
  stroke-dasharray: var(--path-length);
  stroke-dashoffset: var(--path-length);
  animation: draw-vine 2s ease-out forwards;
  animation-play-state: paused;
}

.animated-vine.in-view path {
  animation-play-state: running;
}
```

**How it works:** Set `stroke-dasharray` to the path's total length (one dash = full path). Offset the dash by the full length (hiding it), then animate offset to 0 (revealing it). Use `getTotalLength()` in a small `<script>` to measure paths at runtime and set `--path-length`.

**Browser support:** 99%+ (stroke-dasharray is SVG 1.1, universally supported).
**Performance:** Excellent. `stroke-dashoffset` is compositor-friendly and does not trigger layout/paint.

Source: [CSS-Tricks -- How SVG Line Animation Works](https://css-tricks.com/svg-line-animation-works/)

### Technique B: CSS `@property` for Gradient Color Cycling

Animate gradient color stops smoothly -- impossible with regular CSS custom properties because the browser does not know they are `<color>` values. `@property` registration tells the browser the type, enabling interpolation.

```css
@property --divider-color-1 {
  syntax: '<color>';
  inherits: false;
  initial-value: #14b8a6; /* turquoise-500 */
}

@property --divider-color-2 {
  syntax: '<color>';
  inherits: false;
  initial-value: #ef4444; /* scarlet-500 */
}

@keyframes color-shift {
  0%   { --divider-color-1: #14b8a6; --divider-color-2: #ef4444; }
  33%  { --divider-color-1: #facc15; --divider-color-2: #14b8a6; }
  66%  { --divider-color-1: #ef4444; --divider-color-2: #facc15; }
  100% { --divider-color-1: #14b8a6; --divider-color-2: #ef4444; }
}

.animated-divider {
  background: linear-gradient(90deg, var(--divider-color-1), var(--divider-color-2));
  animation: color-shift 8s ease-in-out infinite;
}
```

**Browser support:** 96.02% (Chrome 85+, Firefox 128+, Safari 16.4+, Edge 85+).
Source: [Can I Use -- CSS @property](https://caniuse.com/mdn-css_at-rules_property)

**Fallback:** Without `@property`, the gradient shows static colors. Use `@supports` to detect:

```css
@supports (animation-name: test) and (not (syntax: '<color>')) {
  /* Fallback: use filter hue-rotate for color shifting */
  .animated-divider {
    filter: hue-rotate(0deg);
    animation: hue-cycle 8s linear infinite;
  }
}
```

Source: [Josh W. Comeau -- Color Shifting in CSS](https://www.joshwcomeau.com/animation/color-shifting/)

### Technique C: SVG `fill` / `stroke` Animation via CSS

Animate SVG element colors directly with CSS keyframes. Simpler than `@property` gradients but limited to individual elements, not gradient stops.

```css
@keyframes blossom-pulse {
  0%, 100% { fill: var(--color-gold-400); }
  50%      { fill: var(--color-scarlet-400); }
}

.animated-blossom ellipse {
  animation: blossom-pulse 4s ease-in-out infinite;
}

.animated-blossom ellipse:nth-child(2) {
  animation-delay: 0.3s;
}
```

**Browser support:** 99%+ (CSS animation of SVG presentation attributes is universally supported in modern browsers).
**Performance:** Triggers repaint but not layout. Acceptable for small SVG elements.

### Technique Comparison

| Technique | Use Case | Browser Support | Performance | Complexity |
|-----------|----------|----------------|-------------|------------|
| `stroke-dashoffset` | Vine/path drawing on scroll | 99%+ | Excellent | Low |
| CSS `@property` gradients | Multicolor gradient cycling | 96% | Excellent | Medium |
| SVG `fill`/`stroke` CSS | Individual element color shifts | 99%+ | Good | Low |
| `filter: hue-rotate()` | Full-element color cycling fallback | 99%+ | Excellent | Low |

### What NOT to Use

| Technology | Why Not |
|------------|---------|
| **GSAP / GreenSock** | 23KB+ JS library. CSS handles all needed animations. Overkill for scroll-triggered draws and color cycling. |
| **Lottie / Bodymovin** | Requires After Effects export pipeline + 50KB+ player. SVG path animation is simpler for vine/floral motifs. |
| **SMIL animation** | 97% support, NOT deprecated (Chrome reversed deprecation). But CSS animations are more maintainable, debuggable, and Tailwind-integrated. SMIL is appropriate only for `<img src="file.svg">` contexts where CSS cannot reach. |
| **Web Animations API (JS)** | Adds JS complexity for what CSS handles. Reserve for programmatic needs. |
| **`motion-path` / `offset-path`** | 96% support but only useful for moving elements along paths (e.g., floating particles). Not needed for divider color/draw animations. |

### Reduced Motion

All animations MUST respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .animated-vine path,
  .animated-divider,
  .animated-blossom ellipse {
    animation: none;
    /* Show final state immediately */
    stroke-dashoffset: 0;
  }
}
```

The existing codebase already follows this pattern (see `global.css` line 165-178).

---

## 2. Historical Hiawatha Imagery -- Public Domain Sources

### Recommendation: Harrison Fisher 1906 illustrations as primary source, Frederic Remington 1891 as secondary

Three verified public domain illustration collections exist for The Song of Hiawatha, each with distinct visual character:

### Primary Source: Harrison Fisher (1906)

**What:** 69 illustrations (16 color, 53 black-and-white) for the 1906 Bobbs-Merrill edition.
**Style:** Romantic, detailed portraiture. Color plates have rich warm tones. Ideal for the maximalist aesthetic.
**Access:** [hiawatha.digital/illustrations](https://hiawatha.digital/illustrations) -- high-resolution digital scans, downloadable via browser, explicitly marked "copyright has expired -- in the public domain."
**Quality:** Digitized in 2024 from a very good copy. High resolution suitable for web use.
**Why primary:** Color illustrations match the bold palette. Romantic style complements the editorial narrative tone. 69 images provide extensive selection.

**Confidence: HIGH** -- Public domain status is unambiguous (1906 publication, author died 1934).

### Secondary Source: Frederic Remington (1891)

**What:** 22 black-and-white oil paintings, one per canto, for the 1891 Houghton Mifflin deluxe edition.
**Style:** Documentary realism, action-oriented. Strong line work.
**Access:**
- [Metropolitan Museum of Art](https://www.metmuseum.org/art/collection/search/11864) -- Open Access, unrestricted use including commercial
- [Internet Archive](https://archive.org/details/songhiawatha00wyetgoog) -- full scan of 1891 edition
- [Library of Congress](https://www.loc.gov/item/20006813) -- digital catalog record
**Quality:** Museum-quality scans from the Met. Internet Archive scans are adequate but lower resolution.
**Why secondary:** Black-and-white only. Best used for textural elements, background watermarks, or monochrome accent images.

**Confidence: HIGH** -- Pre-1928 publication, Met Open Access policy explicitly permits unrestricted reuse.

### Tertiary Source: Wikimedia Commons Category

**What:** 45+ files across 5 subcategories including theatrical productions, landscapes, and additional illustrated editions.
**Access:** [Category:The Song of Hiawatha](https://commons.wikimedia.org/wiki/Category:The_Song_of_Hiawatha)
**Notable items:**
- Albert Bierstadt "Departure of Hiawatha" (c. 1868) -- landscape painting
- 1931 theatrical production photographs (41 files)
- 1898 Altemus edition illustrations
**Why tertiary:** Mixed quality. Individual items need license verification. Best for supplementary/decorative use.

**Confidence: MEDIUM** -- Items are individually licensed; verify each before use.

### Implementation Approach

1. **Download** selected Fisher color illustrations to `public/images/historical/`
2. **Process** through existing sharp pipeline (`generate-thumbnails` script) to create optimized WebP thumbnails
3. **Reference** in components via standard `<img>` tags with `loading="lazy"`
4. **Credit** illustrator in alt text and in a credits section (good form for public domain use)

No new build tooling needed. The existing `generate-thumbnails` pipeline handles new images automatically.

### Sources NOT to Use

| Source | Why Not |
|--------|---------|
| **Getty Images / Alamy** | Watermarked previews; licensing fees for hi-res even on public domain works |
| **Pinterest** | Unverified provenance, low resolution, unclear rights |
| **AI-generated "Hiawatha" images** | Culturally inappropriate. The project uses authentic historical illustrations that contextualize the poem's actual cultural history |

---

## 3. Bold Color Palette Expansion -- WCAG AA Verified

### Recommendation: Add three new color families (turquoise, scarlet, sun) to `@theme static` block

The existing palette (forest, amber, rust, cream, berry, gold, lake, moss) is woodland-muted. The v1.2 maximalist aesthetic demands bolder, higher-saturation accent colors drawn from Haudenosaunee wampum belts (purple/white), Ojibwe beadwork (turquoise/red/yellow), and the bold graphic sensibility of non-profit event branding.

### WCAG AA Contrast Ratios Against Primary Background

All ratios calculated against `forest-950` (#0d1a0d), the darkest background used on the site.

| Token | Hex | Ratio vs #0d1a0d | AA Normal (4.5:1) | AA Large (3:1) | Recommended Use |
|-------|-----|-------------------|---------------------|------------------|-----------------|
| **turquoise-400** | `#2dd4bf` | 9.64:1 | PASS | PASS | Bright accent, highlights, hover states |
| **turquoise-500** | `#14b8a6` | 7.21:1 | PASS | PASS | Primary turquoise text, links, headings |
| **turquoise-600** | `#0d9488` | 4.79:1 | PASS | PASS | Subtle accent, borders, decorative |
| **scarlet-400** | `#f87171` | 6.48:1 | PASS | PASS | Text-safe red, callout text |
| **scarlet-500** | `#ef4444` | 4.77:1 | PASS | PASS | Primary bold red, badges, alerts |
| **scarlet-600** | `#dc2626` | 3.71:1 | FAIL | PASS | Large text/headings only, decorative fills |
| **sun-400** | `#facc15` | 11.71:1 | PASS | PASS | Primary bold yellow, energy accent |
| **sun-500** | `#eab308` | 9.35:1 | PASS | PASS | Secondary yellow, text-safe |

### Additions to `global.css` @theme static Block

```css
@theme static {
  /* ... existing forest/amber/rust/cream/berry/gold/lake/moss tokens ... */

  /* ============================================================
     v1.2: Bold Cultural Maximalism Color Families
     ============================================================ */

  /* Turquoise family -- Great Lakes water, Ojibwe beadwork accent
     All three pass AA normal text on forest-950 */
  --color-turquoise-600: #0d9488;
  --color-turquoise-500: #14b8a6;
  --color-turquoise-400: #2dd4bf;

  /* Scarlet family -- bold energy, wampum/beadwork red
     scarlet-600 is large-text/decorative ONLY (3.71:1 fails AA normal) */
  --color-scarlet-600: #dc2626;
  --color-scarlet-500: #ef4444;
  --color-scarlet-400: #f87171;

  /* Sun family -- warmth, energy, bold highlight
     Both pass AA normal text comfortably */
  --color-sun-500: #eab308;
  --color-sun-400: #facc15;
}
```

**How Tailwind 4 generates utilities:** Defining `--color-turquoise-500` inside `@theme static` automatically creates `text-turquoise-500`, `bg-turquoise-500`, `border-turquoise-500`, etc., plus all responsive/state variants. No configuration file needed.

### Palette Interaction with Existing Tokens

The new families complement rather than replace existing tokens:

| Context | Existing Token | v1.2 Alternative | When to Use v1.2 |
|---------|---------------|------------------|------------------|
| Headings | `amber-500` | Keep `amber-500` | Amber stays for primary headings -- it's the brand |
| Accent borders | `forest-700` | `turquoise-600` | For sections needing visual pop |
| Callout backgrounds | `forest-800` | Gradient using turquoise + scarlet | For cultural history sections |
| Links | `amber-400` | `turquoise-400` | For links in turquoise-themed sections |
| Badges | `rust-600` | `scarlet-500` | For difficulty/alert badges wanting more contrast |
| Highlights | `gold-400` | `sun-400` | For maximum visual energy moments |

### Palette Governance Rule

The bold colors should appear in **culturally-themed sections** (Hiawatha explainer, historical imagery, shield motifs) while the woodland palette (forest/amber/cream) remains dominant for **route/ride content** (map, elevation, photos, stats). This prevents the maximalist palette from overwhelming the site's core identity.

---

## 4. SVG Motif System -- Shield/Arrowhead Repeating Pattern

### Recommendation: SVG `<symbol>` + `<use>` for icons, CSS `background-image` data URIs for repeating backgrounds

The existing HeroSection.astro already contains a hand-crafted SVG shield badge (the ranger-station shield with arrowhead, lines 24-40). Extract the shield path as a reusable `<symbol>` and propagate it throughout the site.

### Architecture: Three Tiers of Motif Usage

**Tier 1: `<symbol>` + `<use>` for Inline Icons**

Define once in a shared SVG sprite, reference everywhere:

```html
<!-- In BaseLayout.astro or a shared component -->
<svg class="sr-only" aria-hidden="true">
  <defs>
    <symbol id="shield-motif" viewBox="0 0 100 120">
      <!-- Simplified shield path from HeroSection badge -->
      <path d="M50 5 L10 20 V55 C10 90 50 110 50 110 S90 90 90 55 V20 Z"
            fill="currentColor" />
    </symbol>
    <symbol id="arrowhead-motif" viewBox="0 0 40 60">
      <path d="M20 2 L6 40 Q8 38 14 36 L18 50 L20 58 L22 50 L26 36 Q32 38 34 40 Z"
            fill="currentColor" />
    </symbol>
  </defs>
</svg>

<!-- Usage anywhere -->
<svg class="w-6 h-6 text-turquoise-500"><use href="#shield-motif" /></svg>
<svg class="w-4 h-4 text-scarlet-500"><use href="#arrowhead-motif" /></svg>
```

**Why `<symbol>` + `<use>`:** Zero HTTP requests. `currentColor` inherits from Tailwind `text-*` classes. Cacheable in the DOM. The same technique used by every SVG icon system (Heroicons, Lucide, etc.) but without the npm dependency.

**Browser support:** 99%+ (SVG `<use>` with fragment identifiers).

**Tier 2: CSS `background-image` Data URI for Repeating Backgrounds**

The RouteExplainer.astro already uses this pattern for topo-line backgrounds (line 75). Extend it for shield motifs:

```css
.shield-bg {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="72" viewBox="0 0 60 72"><path d="M30 3 L6 12 V33 C6 54 30 66 30 66 S54 54 54 33 V12 Z" fill="none" stroke="%233d6b3d" stroke-width="1" opacity="0.12"/></svg>');
  background-repeat: repeat;
  background-size: 60px 72px;
}
```

**Performance:** Excellent. Data URI SVGs are parsed inline, no HTTP request. At ~200 bytes per motif, negligible payload.

**Tier 3: CSS `mask-image` for Decorative Overlays**

Use shield shapes as masks over gradient backgrounds for bold section headers:

```css
.shield-mask-accent {
  background: linear-gradient(135deg, var(--color-turquoise-500), var(--color-scarlet-500));
  -webkit-mask-image: url('data:image/svg+xml;utf8,<svg>...</svg>');
  mask-image: url('data:image/svg+xml;utf8,<svg>...</svg>');
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  mask-size: contain;
}
```

**Browser support:** CSS `mask-image` is 97%+ with `-webkit-` prefix. Source: [Can I Use -- CSS Masks](https://caniuse.com/css-masks).

### Motif Inventory

| Motif | Source | Uses |
|-------|--------|------|
| Shield | Extracted from HeroSection badge `<path>` | Section headers, list bullets, background pattern |
| Arrowhead | Extracted from HeroSection badge tree/arrow | Directional indicators, divider accents |
| Vine (existing) | FloralDivider.astro S-curve path | Section dividers (animated in v1.2) |
| Blossom (existing) | FloralDivider.astro five-petal cluster | Decorative accent points |

### What NOT to Build

| Approach | Why Not |
|----------|---------|
| External SVG sprite file | Adds HTTP request for something achievable with inline `<symbol>` |
| Icon font | Accessibility issues, no multicolor support, larger payload than inline SVG |
| Heroicons/Lucide/Phosphor | 3-5 custom motifs do not justify an icon library dependency |
| Canvas-based rendering | No semantic benefit over SVG, worse accessibility, cannot be styled with CSS |

---

## 5. Strava Segment/Route Integration

### Recommendation: Strava route embed (div + external script), NOT iframe, NOT API

Strava offers two embed formats. The modern one is preferred:

### Modern Embed (Recommended)

```html
<div class="strava-embed-placeholder"
     data-embed-type="route"
     data-embed-id="[ROUTE_ID]"
     data-style="standard"
     data-slippy="true">
</div>
<script src="https://strava-embeds.com/embed.js"></script>
```

**Features included in embed:**
- Interactive map with route trace
- Elevation profile (toggleable)
- Distance and elevation gain display
- "Flyover" 3D preview button
- "View on Strava" link
- Responsive width

**Requirements:**
- Route must be **public** on Strava
- No API key needed
- No authentication needed
- Works on static sites

### Segment Embeds (Also Available)

Individual segments can be embedded similarly:

```html
<iframe height="405" width="590" frameborder="0"
        allowtransparency="true" scrolling="no"
        src="https://www.strava.com/segments/[SEGMENT_ID]/embed">
</iframe>
```

The segment ID is the number in the Strava URL: `strava.com/segments/7041089` --> ID is `7041089`.

### Reliability Concern

**January 2026 incident:** Strava club widget embeds broke globally from January 20 to February 19, 2026. The issue was specific to **club-level widgets**, not individual activity or route embeds. It was resolved with a server-side fix.

**Mitigation for static site:**
1. Wrap the Strava embed in a container with fallback text
2. Use `loading="lazy"` pattern (load embed script only when section is in viewport)
3. Provide a direct Strava link as fallback if embed fails

```html
<div id="strava-embed-container">
  <div class="strava-embed-placeholder" data-embed-type="route" data-embed-id="[ID]" data-style="standard" data-slippy="true"></div>
  <noscript>
    <a href="https://www.strava.com/routes/[ROUTE_ID]">View route on Strava</a>
  </noscript>
</div>
```

### Alternative: Link-Only Approach (Simpler, More Reliable)

Instead of embedding, simply link to the Strava route/segment pages with styled buttons:

```html
<a href="https://www.strava.com/routes/[ROUTE_ID]"
   class="inline-flex items-center gap-2 px-4 py-2 border border-scarlet-500 text-scarlet-400 font-display uppercase tracking-wider text-sm hover:bg-scarlet-500/10"
   target="_blank" rel="noopener noreferrer">
  <svg class="w-4 h-4"><use href="#strava-logo" /></svg>
  View on Strava
</a>
```

**Recommendation:** Use the modern `div` embed for the main route (one instance, prominent placement). Use link-only approach for individual segments within RouteExplainer cards. This limits embed script loading to one instance while still connecting every segment to Strava.

### What NOT to Do

| Approach | Why Not |
|----------|---------|
| **Strava API v3** | Requires OAuth, API key, server-side token refresh. Fundamentally incompatible with static site. |
| **Scraping Strava data** | TOS violation. Strava explicitly prohibits scraping. |
| **Caching embed content** | The embed script loads dynamically. Cannot be statically captured. |
| **Multiple full embeds** | Each embed loads the full embed.js script + map tiles. One embed per page is the practical limit for performance. |

Sources:
- [Strava Partners -- How to Embed a Route](https://partners.strava.com/resources/how-to-embed-a-strava-route)
- [Strava Support -- Sharing Activities and Routes](https://support.strava.com/hc/en-us/articles/216918527)
- [Strava Community Hub -- January 2026 Embed Issue](https://communityhub.strava.com/developers-api-7/strava-widgets-embedded-on-website-stopped-working-since-20-jan-2026-12591)

---

## 6. Per-Sector Elevation Sparklines

### Recommendation: Build-time SVG generation in Astro frontmatter. No new libraries.

The existing ElevationProfile.astro uses Chart.js for the full-route elevation chart. Per-sector sparklines should NOT use Chart.js -- they are small, non-interactive, and should be zero-JS.

### Approach: Astro Build-Time SVG Path Generation

Generate `<svg>` sparklines at build time in Astro component frontmatter, using the existing `route-data.json` points array.

```astro
---
// SectorSparkline.astro
import routeData from '../../public/data/route-data.json';

interface Props {
  startMile: number;
  endMile: number;
  width?: number;
  height?: number;
}

const { startMile, endMile, width = 120, height = 32 } = Astro.props;

// Filter points for this sector
const points = routeData.points.filter(
  (p) => p.miles >= startMile && p.miles <= endMile
);

if (points.length < 2) return;

// Convert elevation from meters to feet
const elevations = points.map((p) => p.ele * 3.28084);
const miles = points.map((p) => p.miles);

const minEle = Math.min(...elevations);
const maxEle = Math.max(...elevations);
const minMile = miles[0];
const maxMile = miles[miles.length - 1];
const eleRange = maxEle - minEle || 1;
const mileRange = maxMile - minMile || 1;

// Generate SVG polyline points
// Y is inverted (SVG 0,0 is top-left)
const svgPoints = points
  .map((p, i) => {
    const x = ((miles[i] - minMile) / mileRange) * width;
    const y = height - ((elevations[i] - minEle) / eleRange) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  })
  .join(' ');

// Area fill path (close to bottom)
const areaPath = `M0,${height} L${svgPoints.split(' ').map((p, i) => {
  if (i === 0) return p;
  return `L${p}`;
}).join(' ')} L${width},${height} Z`;

const gainFt = Math.round(maxEle - elevations[0]);
---

<svg
  viewBox={`0 0 ${width} ${height}`}
  width={width}
  height={height}
  preserveAspectRatio="none"
  aria-label={`Elevation profile: ${Math.round(minEle)}ft to ${Math.round(maxEle)}ft`}
  role="img"
  class="sector-sparkline"
>
  <polyline
    points={svgPoints}
    fill="none"
    stroke="var(--color-amber-500)"
    stroke-width="1.5"
    vector-effect="non-scaling-stroke"
  />
  <polyline
    points={`0,${height} ${svgPoints} ${width},${height}`}
    fill="var(--color-amber-500)"
    fill-opacity="0.15"
    stroke="none"
  />
</svg>
```

### Why Build-Time SVG, Not Chart.js

| Factor | Chart.js Mini-Charts | Build-Time SVG |
|--------|---------------------|----------------|
| JS payload | ~30KB per instance (even with dynamic import) | 0 KB |
| Render timing | After hydration + IntersectionObserver | Immediate (in HTML) |
| Interactivity | Tooltip on hover | None needed for sparklines |
| Accessibility | Canvas -- needs `aria-label` on canvas | SVG -- native `aria-label`, `role="img"` |
| Instances | 7 sectors = 7 Chart.js instances | 7 tiny SVGs, ~200 bytes each |
| Total overhead | ~30KB JS + 7 canvas elements | ~1.4KB total inline SVG |

**The choice is clear.** Sparklines are tiny, non-interactive, and appear in a list. Build-time SVG is the right tool.

### SVG Sparkline Technique Details

**Core SVG attributes:**
- `viewBox="0 0 120 32"` -- coordinate space matching pixel dimensions
- `preserveAspectRatio="none"` -- stretch to fill container (sparklines should adapt to width)
- `vector-effect="non-scaling-stroke"` -- keep stroke width consistent when scaling

Source: [Alex Plescan -- Easy SVG Sparklines](https://alexplescan.com/posts/2023/07/08/easy-svg-sparklines/)

**Path generation:**
- `M` (moveto) sets starting point
- `L` (lineto) draws line segments
- Y coordinates are inverted: `height - ((value - min) / range) * height`
- Area fill closes path to bottom edge with additional bottom-left and bottom-right points

**Integration with RouteExplainer.astro:**
Add `<SectorSparkline startMile={seg.startMi} endMile={seg.endMi} />` to each segment card. The sparkline renders inline, zero JS, and uses existing color tokens.

### Styling

```css
.sector-sparkline {
  display: block;
  width: 100%;
  max-width: 120px;
  height: 32px;
}

/* Difficulty-based colors via parent class */
.sector-card[data-difficulty="hard"] .sector-sparkline polyline {
  stroke: var(--color-scarlet-500);
}
.sector-card[data-difficulty="easy"] .sector-sparkline polyline {
  stroke: var(--color-moss-500);
}
```

---

## SVG Animation Approach Decision Matrix

For the various animated elements in v1.2, use this decision matrix:

| Element | Animation Type | Technique | Why |
|---------|---------------|-----------|-----|
| FloralDivider vine | Draw-on-scroll | `stroke-dashoffset` + IntersectionObserver | Path drawing is the natural animation for a vine |
| FloralDivider blossoms | Color pulse | CSS `fill` animation | Simple color cycling on small elements |
| Section divider gradients | Color cycling | CSS `@property` gradients | Smooth multicolor gradient transitions |
| Shield motif appearance | Fade/scale on scroll | CSS `opacity` + `transform` + IntersectionObserver | Standard reveal animation |
| Background patterns | None (static) | No animation | Background textures should be stable |

**IntersectionObserver pattern (reusable):**
The existing codebase uses IntersectionObserver for lazy-loading (ElevationProfile.astro lines 193-206). Extend the same pattern for scroll-triggered animations:

```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  },
  { rootMargin: '0px', threshold: 0.2 }
);

document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));
```

---

## Complete Stack Summary

### Unchanged from v1.1

| Technology | Version | Role |
|------------|---------|------|
| Astro | 6.x | Static site generator |
| Tailwind CSS | 4.x | CSS-first utility framework |
| Vite | 7.x | Build tool (via Astro) |
| Chart.js | 4.x | Full-route elevation profile (existing) |
| Leaflet | 1.x | Route map |
| PhotoSwipe | 5.x | Photo lightbox |
| sharp | latest | Image optimization pipeline |

### New for v1.2

| Technology | Version | Role | Type |
|------------|---------|------|------|
| CSS `@property` | N/A (native CSS) | Gradient color animation | CSS feature, no dependency |
| CSS `stroke-dashoffset` | N/A (SVG/CSS) | Vine drawing animation | CSS feature, no dependency |
| SVG `<symbol>` + `<use>` | N/A (SVG 1.1) | Shield/arrowhead motif system | HTML/SVG pattern, no dependency |
| Strava embed script | External | Route embed | `<script src="strava-embeds.com/embed.js">` |
| Build-time SVG sparklines | N/A (Astro frontmatter) | Per-sector elevation profiles | Astro template logic, no dependency |

### New npm Dependencies

**None.**

---

## Browser Support Summary

| Feature | Global Support | Minimum Browser | Fallback |
|---------|---------------|-----------------|----------|
| CSS `@keyframes` + SVG `fill`/`stroke` | 99%+ | All modern | N/A |
| `stroke-dasharray` / `stroke-dashoffset` | 99%+ | All modern | N/A |
| CSS `@property` | 96.02% | Chrome 85+, FF 128+, Safari 16.4+ | Static gradient (no animation) |
| SVG `<symbol>` + `<use>` | 99%+ | All modern | N/A |
| CSS `mask-image` | 97%+ | All modern (with `-webkit-` prefix) | No mask (element still visible) |
| IntersectionObserver | 99%+ | All modern | N/A |
| `prefers-reduced-motion` | 99%+ | All modern | N/A |
| Strava embed | N/A (third-party) | Depends on Strava | Fallback link to Strava page |

No feature below 96% support. All features below 99% have documented fallbacks.

---

## Sources

### Verified (HIGH Confidence)

**CSS Animation:**
- [Can I Use -- CSS @property](https://caniuse.com/mdn-css_at-rules_property) -- 96.02% global support (Chrome 85+, FF 128+, Safari 16.4+)
- [Can I Use -- SVG SMIL](https://caniuse.com/svg-smil) -- 97.25% but CSS preferred for maintainability
- [CSS-Tricks -- How SVG Line Animation Works](https://css-tricks.com/svg-line-animation-works/) -- `stroke-dashoffset` technique
- [Josh W. Comeau -- Color Shifting in CSS](https://www.joshwcomeau.com/animation/color-shifting/) -- `@property` gradient animation patterns

**Public Domain Imagery:**
- [hiawatha.digital/illustrations](https://hiawatha.digital/illustrations) -- 69 Harrison Fisher illustrations (1906), public domain, high-resolution downloads
- [Metropolitan Museum of Art -- Remington Hiawatha](https://www.metmuseum.org/art/collection/search/11864) -- Open Access, unrestricted reuse
- [Wikimedia Commons -- Song of Hiawatha](https://commons.wikimedia.org/wiki/Category:The_Song_of_Hiawatha) -- 45+ files in category

**Strava Integration:**
- [Strava Partners -- How to Embed a Route](https://partners.strava.com/resources/how-to-embed-a-strava-route) -- official embed documentation
- [Strava Community Hub -- Jan 2026 Embed Issue](https://communityhub.strava.com/developers-api-7/strava-widgets-embedded-on-website-stopped-working-since-20-jan-2026-12591) -- resolved Feb 19, 2026

**Color Contrast:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) -- WCAG AA ratio calculations
- Contrast ratios computed locally using WCAG 2.0 relative luminance formula

### Cross-Referenced (MEDIUM Confidence)

- [Alex Plescan -- Easy SVG Sparklines](https://alexplescan.com/posts/2023/07/08/easy-svg-sparklines/) -- build-time SVG sparkline technique
- [SVG Genie -- SVG Masks and Shape Dividers](https://www.svggenie.com/blog/svg-masks-shape-dividers-web-design) -- CSS mask-image pattern approaches
- [Digital Thrive -- CSS Gradient Animation Guide](https://digitalthriveai.com/en-us/resources/web-development/the-state-of-changing-gradients-with-css-transitions-and-animations/) -- `@property` gradient animation patterns

---

*Stack research for: Hiawatha's Revenge v1.2 Cultural Maximalism*
*Researched: 2026-03-31*
*Previous version: v1.1 stack research dated 2026-03-31 -- core stack unchanged*
