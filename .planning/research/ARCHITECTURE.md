# Architecture Patterns: SEO & Social Sharing Integration

**Domain:** SEO improvements for Astro 6 static cycling event site
**Researched:** 2026-04-09
**Overall confidence:** HIGH

## Current Architecture Snapshot

```
Build Flow:
  npm run build
    -> prebuild hook -> node scripts/pipeline.js (11 shared steps + 3 per-route steps)
    -> astro build -> dist/

Pipeline Step 11 (final shared step):
  generate-og-image.js
    - Reads: public/images/irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536.jpg
    - Outputs: public/og-image.jpg (1200x630 center-crop, JPEG quality 75)
    - Uses: sharp 0.34.5

Head Section (BaseLayout.astro):
  - <meta> OG tags (type, url, title, description, image, dimensions)
  - <meta> Twitter/X card tags (summary_large_image)
  - <link rel="canonical">
  - <link rel="icon" type="image/svg+xml" href="/favicon.svg"> (emoji tree)
  - <script type="application/ld+json"> Event schema
  - No robots.txt, no sitemap, no apple-touch-icon

Badge Assets:
  - images/badge.svg (source, fill #0d1a0d / forest green, 21KB Illustrator export)
  - public/images/badge.svg (deployed copy, fill #3b2412 / brown variant)
  - HeroSection.astro inline SVG (shield shape with text arcs + inner HTML overlay)
  - BaseLayout.astro <symbol id="shield-motif"> (simplified arrowhead path)
  - ShieldMotif.astro component (references #shield-motif via <use>)

Pages: index.astro (single page), admin.astro, api/save-manifest.ts
```

## Integration Architecture

### 1. OG Image Redesign: Modify generate-og-image.js

**Current state:** Simple center-crop of hero photo. No branding, no text.

**Target state:** Badge-based branded design with tagline overlay.

**Approach: Extend existing pipeline script with sharp SVG compositing.**

Sharp 0.34.5 includes librsvg 2.61.2, which means it can render SVG to raster natively. The proven pattern for adding text/graphics to images with sharp is:

1. Build an SVG string containing the design (badge graphic + text)
2. Convert to Buffer: `Buffer.from(svgString)`
3. Composite onto the base image: `sharp(base).composite([{ input: svgBuffer }])`

**Recommended architecture for generate-og-image.js:**

```
Step 1: Create 1200x630 base
  - Option A: Solid color background (forest-900 #0d1a0d)
  - Option B: Dimmed/tinted hero photo crop (current approach + dark overlay)
  - Recommendation: Dark solid or gradient. The badge IS the visual. A photo
    background competes with badge readability at small preview sizes.

Step 2: Build SVG overlay (1200x630 viewport)
  - Render simplified shield path from BaseLayout symbol (M14 0 L0 38...)
    at center, scaled to ~200px tall
  - Add text elements: "HIAWATHA'S REVENGE" (National Park font)
  - Add tagline: "100 Miles Through the Hiawatha National Forest"
  - Add date: "June 6, 2026"

Step 3: Composite SVG onto base
  sharp(baseBuffer)
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .jpeg({ quality: 85 })
    .toFile('public/og-image.jpg')
```

**Font handling for SVG text in sharp:**
Sharp/librsvg renders `<text>` elements using system fonts or fonts specified in the SVG. The site uses Google Fonts (National Park, Space Mono) loaded via Astro's font system, but these are not available as local font files during the pipeline build step.

**Font strategy options:**
| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| System font fallback | Simple | Won't match site design | No |
| Download .ttf to scripts/ | Matches site fonts | Manual font management | Yes -- preferred |
| Convert text to SVG paths | No font dependency | Complex, fragile | No |
| Use the full badge.svg as-is | No font needed | 21KB complex SVG, may render poorly | No |

**Recommendation:** Download National Park .ttf (or .woff2 converted) to a `scripts/fonts/` directory. Reference in SVG via `@font-face` in SVG `<defs>`. This is a build-time-only asset, not deployed.

**Performance note from sharp issue #2987:** SVG `<text>` compositing can take several seconds vs milliseconds for simple SVG. This is acceptable for a build-time script that runs once.

**File changes:**
| File | Action | What Changes |
|------|--------|-------------|
| `scripts/generate-og-image.js` | **Modify** | Replace center-crop with badge composite design |
| `scripts/fonts/` | **Create** | Add National Park .ttf for OG image text rendering |

**No changes to pipeline.js** -- the script name and position in pipeline remain the same. It still outputs `public/og-image.jpg` at 1200x630, so BaseLayout.astro OG meta tags remain valid without modification.

---

### 2. Sitemap: Use @astrojs/sitemap Integration

**Why integration, not pipeline step:**
- The sitemap must reflect Astro's actual generated pages, not a hardcoded list
- `@astrojs/sitemap` hooks into Astro's build process and auto-discovers routes
- It runs during `astro build`, not during the pre-build pipeline
- The `site` URL is already configured in `astro.config.ts`

**Why NOT a pipeline step:**
- Pipeline runs BEFORE `astro build` (prebuild hook)
- Pipeline scripts don't know which pages Astro will generate
- A pipeline-generated sitemap in `public/` would be overwritten or duplicated

**Installation:**
```bash
npx astro add sitemap
# or: npm install @astrojs/sitemap
```

**Configuration change to astro.config.ts:**
```typescript
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hiawathasrevenge.com',
  integrations: [sitemap()],
  // ... existing config
});
```

**Output:** `dist/sitemap-index.xml` and `dist/sitemap-0.xml` generated at build time.

**File changes:**
| File | Action | What Changes |
|------|--------|-------------|
| `astro.config.ts` | **Modify** | Add sitemap import and integration |
| `package.json` | **Modify** | Add @astrojs/sitemap dependency |

**No changes to pipeline.js.** The sitemap is generated by Astro's build, not the data pipeline.

---

### 3. robots.txt: Astro Page Endpoint

**Why a page endpoint, not a static file:**
- The robots.txt needs to reference the sitemap URL, which includes the full domain
- A `src/pages/robots.txt.ts` endpoint can read `site` from Astro context, keeping things DRY with `astro.config.ts`
- The current `public/` directory has no robots.txt, so no conflict
- Built at `astro build` time alongside pages, not during pipeline

**Why NOT a third-party integration (astro-robots-txt):**
- The site is simple (2 user-facing pages: index + admin)
- A 10-line endpoint file is simpler than adding another dependency
- Full control over content without learning integration config

**Implementation: `src/pages/robots.txt.ts`**
```typescript
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('/sitemap-index.xml', site);
  return new Response(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /api/',
      '',
      `Sitemap: ${sitemapURL.href}`,
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
};
```

**Key detail:** Disallow `/admin` and `/api/` routes from crawling. The admin page and save-manifest API endpoint are not for public indexing.

**File changes:**
| File | Action | What Changes |
|------|--------|-------------|
| `src/pages/robots.txt.ts` | **Create** | Endpoint generating robots.txt with sitemap reference |

---

### 4. Favicon & Apple Touch Icon: Pipeline Script

**Why a pipeline step, not an Astro integration:**
- Favicons are static assets generated from the badge SVG source file
- They belong in `public/` so they're served as-is (like the current favicon.svg)
- The pipeline already handles image generation (generate-og-image.js, generate-thumbnails.js, generate-webp.js)
- Generation only needs to happen when the badge SVG changes (idempotent)

**Current favicon state:**
```svg
<!-- public/favicon.svg — current -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <text x="4" y="26" font-size="28">(tree emoji)</text>
</svg>
```
This is a tree emoji rendered as SVG text. It works but is not branded.

**Modern favicon strategy (per Evil Martians guide):**

For this site, the minimal effective set is:

| File | Size | Purpose | How Generated |
|------|------|---------|---------------|
| `public/favicon.svg` | vector | Modern browsers, supports dark mode | Hand-authored from shield motif |
| `public/favicon.ico` | 32x32 | Legacy browser tab icon | sharp: SVG -> 32x32 PNG -> ICO wrapper |
| `public/apple-touch-icon.png` | 180x180 | iOS home screen bookmark | sharp: SVG -> 180x180 PNG |

**PWA icons (icon-192.png, icon-512.png) are NOT needed.** This is a static informational site for a cycling event, not a PWA. No `manifest.webmanifest` exists or is planned. Adding PWA assets for a single-page event site would be unnecessary complexity.

**Badge SVG source for favicon -- which one?**

The shield motif from BaseLayout.astro is ideal -- simple, recognizable at small sizes, already defined as a clean path:
```
M14 0 L0 38 Q2 36 8 34 L12 48 L14 56 L16 48 L20 34 Q26 36 28 38 Z
```
viewBox="0 0 28 56" (1:2 aspect ratio, arrowhead/shield shape).

The full `images/badge.svg` (21KB Illustrator export with hundreds of complex path nodes for the event text/artwork) is far too detailed for favicon use. At 32x32 it would be an unrecognizable blob. The simplified shield arrowhead is the correct source.

**Recommended approach: New pipeline script `scripts/generate-favicons.js`**

```
Step 1: Create favicon SVG
  - Use shield motif path in a square viewBox (center 1:2 shield in 1:1 square)
  - Fill with amber-500 (#f59e0b) on transparent or forest-900 (#0d1a0d) background
  - Optionally add CSS @media (prefers-color-scheme) for dark mode variant
  - Write to public/favicon.svg (replacing emoji version)

Step 2: Generate apple-touch-icon.png
  - Create an SVG with forest-900 background circle/rounded-rect + amber shield
  - Render at 180x180 via sharp
  - Write to public/apple-touch-icon.png

Step 3: Generate favicon.ico (optional)
  - Render favicon SVG at 32x32 via sharp -> PNG buffer
  - Convert PNG to ICO format
  - Write to public/favicon.ico
```

**ICO generation detail:**
Sharp cannot output ICO format directly. Options:
| Approach | Dependency | Complexity |
|----------|-----------|------------|
| `png-to-ico` npm package | ~3KB, no native deps | Simple -- feed 32x32 PNG buffer, get ICO buffer |
| Skip .ico entirely | None | SVG favicon covers all modern browsers |

**Recommendation:** Skip `.ico` and rely on SVG favicon. The site's audience (cyclists checking an event page) uses modern browsers. Chrome, Firefox, Edge, and Safari 15+ all support SVG favicons. The `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` tag already exists in BaseLayout.astro. If ICO is desired later, `png-to-ico` can be added trivially.

**BaseLayout.astro head changes for favicons:**
```html
<!-- Current (single line): -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />

<!-- Updated: -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

**Pipeline integration -- add BEFORE generate-og-image (new step 11, OG becomes step 12):**
```javascript
// In pipeline.js sharedSteps array:
{ name: 'generate-favicons', script: 'scripts/generate-favicons.js' },
{ name: 'generate-og-image', script: 'scripts/generate-og-image.js' },
```

**File changes:**
| File | Action | What Changes |
|------|--------|-------------|
| `scripts/generate-favicons.js` | **Create** | New pipeline script for favicon generation |
| `scripts/pipeline.js` | **Modify** | Add generate-favicons step before generate-og-image |
| `public/favicon.svg` | **Replace** | Branded shield motif instead of tree emoji |
| `public/apple-touch-icon.png` | **Create** | 180x180 PNG from shield SVG |
| `src/layouts/BaseLayout.astro` | **Modify** | Add apple-touch-icon link tag |

---

### 5. Meta Tag & Structured Data Audit: Modify BaseLayout.astro

**Current gaps identified:**

**Meta tags -- missing or improvable:**
| Issue | Current | Recommended Fix | Impact |
|-------|---------|-----------------|--------|
| No `og:site_name` | Missing | `<meta property="og:site_name" content="Hiawatha's Revenge" />` | Low -- improves FB rendering |
| No `og:locale` | Missing | `<meta property="og:locale" content="en_US" />` | Low -- explicit locale |
| No `og:image:type` | Missing | `<meta property="og:image:type" content="image/jpeg" />` | Low -- helps parsers |
| No `og:image:alt` | Missing | `<meta property="og:image:alt" content="..." />` | Medium -- accessibility |
| No `twitter:image:alt` | Missing | `<meta name="twitter:image:alt" content="..." />` | Medium -- accessibility |
| No `theme-color` | Missing | `<meta name="theme-color" content="#0d1a0d" />` | Low -- browser chrome color |
| Descriptions differ | Props default differs from schema `description` | Should use consistent description | Low |

**Structured data -- gaps vs Google Event rich results requirements:**
| Issue | Current | Required/Recommended | Severity |
|-------|---------|---------------------|----------|
| `location` lacks street address | City-level only ("Munising, Michigan") | Google **requires** `streetAddress` for rich results | **HIGH** |
| No `offers` property | Missing | Recommended -- ticket info or "free" indicator | Medium |
| No `url` property | Missing | Recommended -- canonical URL of event page | Medium |
| `image` is single URL | OG image URL only | Google recommends multiple aspect ratios (16:9, 4:3, 1:1) | Low |
| `description` differs from meta description | Longer version with MBTN mention | Should be consistent for SEO coherence | Low |

**The location gap is the most impactful issue.** Google's Event rich results documentation explicitly requires a `PostalAddress` with `streetAddress`. The current schema only has `addressLocality`, `addressRegion`, and `addressCountry`. Without a street-level address, Google is unlikely to surface the event in rich results.

**Note:** The `streetAddress` value (start location / venue for the ride) will need to be provided by the site owner. This is a content question, not a technical one.

**File changes:**
| File | Action | What Changes |
|------|--------|-------------|
| `src/layouts/BaseLayout.astro` | **Modify** | Add missing OG/meta tags, enhance structured data, add favicon links |

---

## Component Boundary Map

```
PIPELINE (prebuild)                    ASTRO BUILD
========================              ========================

scripts/pipeline.js
  |
  +-- [steps 1-10 unchanged]
  |
  +-- generate-favicons.js  [NEW]     astro.config.ts  [MODIFIED]
  |     |                                |
  |     +-> public/favicon.svg          +-- @astrojs/sitemap integration
  |     +-> public/apple-touch-icon.png      |
  |                                          +-> dist/sitemap-index.xml
  +-- generate-og-image.js  [MODIFIED]       +-> dist/sitemap-0.xml
        |
        +-> public/og-image.jpg        src/pages/robots.txt.ts  [NEW]
                                           |
                                           +-> dist/robots.txt

                                       src/layouts/BaseLayout.astro [MODIFIED]
                                           |
                                           +-> <head> meta tags (enhanced)
                                           +-> structured data (enhanced)
                                           +-> favicon link tags (updated)
```

**Key boundary principle:** Image/asset generation belongs in the pipeline (pre-build, uses sharp). Page/route generation belongs in Astro (build-time, knows about pages). Meta tag changes are in the layout template. The sitemap integration runs during Astro build, not in the pipeline.

---

## Suggested Build Order for Implementation

The features have natural dependencies:

```
Phase ordering:

1. Favicon generation (generate-favicons.js + BaseLayout apple-touch-icon link)
   - No dependencies on other new features
   - Replaces emoji favicon immediately
   - Tests pipeline script creation pattern
   - Smallest scope, fastest to validate

2. Meta tag & structured data audit (BaseLayout.astro modifications)
   - No dependencies on new files beyond favicon links (done in step 1)
   - Can be validated with Google Rich Results Test
   - streetAddress needs to be determined (user input required)
   - High SEO impact for minimal effort

3. OG image redesign (generate-og-image.js modification)
   - Depends on font files being available in scripts/fonts/
   - Most complex change (SVG composition with text rendering)
   - Can be validated visually + with social preview tools (opengraph.xyz, etc.)

4. robots.txt + sitemap (robots.txt.ts + @astrojs/sitemap)
   - robots.txt references sitemap URL, so sitemap config should exist first
   - Both are trivial to implement
   - Should be done together since robots.txt references sitemap
   - Lowest priority -- search engines find single-page sites fine without these
```

**Rationale for this order:**
- Items 1 and 2 are independent and could be done in parallel
- Item 3 is the most complex and benefits from getting simpler changes landed first
- Item 4 is the simplest but has the least SEO impact for a single-page static site

---

## Anti-Patterns to Avoid

### Anti-Pattern: Generating sitemap in the pipeline
**Why bad:** The pipeline runs before `astro build` via the `prebuild` npm hook. It doesn't know what pages Astro will generate. Hardcoding URLs defeats the purpose of auto-discovery.
**Instead:** Use `@astrojs/sitemap` integration which hooks into Astro's build process.

### Anti-Pattern: Using the full 21KB badge.svg for favicons
**Why bad:** Complex Illustrator SVG with hundreds of path nodes and embedded text. Renders as an unrecognizable blob at 32x32. May fail or look muddy in librsvg.
**Instead:** Use the simplified shield motif path (single `<path>` element, ~60 bytes) from BaseLayout.astro's `<symbol id="shield-motif">`.

### Anti-Pattern: Embedding font files in SVG as base64 for OG image
**Why bad:** Bloats the SVG buffer, slows librsvg rendering, brittle with WOFF2 encoding.
**Instead:** Reference local .ttf font file via `@font-face` in SVG `<defs>`, or install the font so librsvg can resolve it by family name.

### Anti-Pattern: Putting robots.txt as static file in public/
**Why bad:** The sitemap URL includes the full domain (`https://hiawathasrevenge.com/sitemap-index.xml`). A static file hardcodes it, breaking DRY with the `site` setting in `astro.config.ts`.
**Instead:** Use `src/pages/robots.txt.ts` endpoint that reads `site` from Astro context.

### Anti-Pattern: Over-engineering the favicon set (192, 512, maskable, manifest)
**Why bad:** This is a single-page event website, not a PWA. Extra icons and a webmanifest add complexity for zero user benefit.
**Instead:** Three files maximum: favicon.svg (modern browsers), favicon.ico (legacy, optional), apple-touch-icon.png (iOS).

---

## Dependency Map: New and Modified Files

```
NEW FILES:
  scripts/generate-favicons.js       depends on: sharp (existing dep), shield motif path (hardcoded)
  scripts/fonts/NationalPark.ttf     depends on: Google Fonts download (one-time manual step)
  src/pages/robots.txt.ts            depends on: Astro site config (already set)
  public/apple-touch-icon.png        generated by: generate-favicons.js

MODIFIED FILES:
  scripts/generate-og-image.js       depends on: scripts/fonts/NationalPark.ttf, sharp
  scripts/pipeline.js                adds: generate-favicons step before generate-og-image
  src/layouts/BaseLayout.astro       adds: meta tags, structured data fields, apple-touch-icon link
  astro.config.ts                    adds: @astrojs/sitemap import and integration
  package.json                       adds: @astrojs/sitemap dependency
  public/favicon.svg                 replaced by: generate-favicons.js output (shield motif)

UNCHANGED:
  src/pages/index.astro              no changes needed
  src/components/ShieldMotif.astro   no changes needed (still uses #shield-motif from BaseLayout)
  src/components/HeroSection.astro   no changes needed (has its own inline badge SVG)
  All other pipeline scripts         no changes needed
  Pipeline step ordering             unchanged for existing steps; new step inserted before last
```

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| OG image compositing with sharp | HIGH | sharp 0.34.5 + librsvg 2.61.2 confirmed installed; SVG composite pattern well-documented |
| @astrojs/sitemap integration | HIGH | Official Astro integration, site URL already configured, static output mode |
| robots.txt endpoint pattern | HIGH | Standard Astro static endpoint, verified against official docs |
| Favicon generation with sharp | HIGH | SVG-to-PNG is core sharp functionality; shield path is simple geometry |
| Font availability for OG text | MEDIUM | librsvg can render @font-face in SVG, but path resolution needs testing at implementation time |
| Event structured data streetAddress | MEDIUM | Technical change is trivial, but the actual address value requires user input |

## Sources

- [Astro sitemap integration docs](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [Astro endpoints docs](https://docs.astro.build/en/guides/endpoints/)
- [Sharp SVG text compositing (GitHub #1120)](https://github.com/lovell/sharp/issues/1120)
- [Sharp SVG text performance (GitHub #2987)](https://github.com/lovell/sharp/issues/2987)
- [How to Favicon in 2026 -- Evil Martians](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs)
- [Google Event structured data requirements](https://developers.google.com/search/docs/appearance/structured-data/event)
- [astro-robots-txt npm](https://www.npmjs.com/package/astro-robots-txt)
- [Astro project structure docs](https://docs.astro.build/en/basics/project-structure/)
