# Technology Stack: SEO & Social Sharing Polish

**Project:** Hiawatha's Revenge
**Researched:** 2026-04-09
**Scope:** OG image redesign, robots.txt + sitemap.xml, favicon generation, meta/structured data audit
**Overall confidence:** HIGH
**Core constraint:** Two new dependencies total. Everything else uses existing sharp + hand-written code.

---

## Executive Summary

This milestone needs two new dependencies: `@astrojs/sitemap` (official Astro integration for sitemap.xml generation) and `png-to-ico` (lightweight ICO file generator for legacy favicon). Everything else -- OG image redesign, favicon PNG generation, robots.txt, meta tag improvements -- is handled by the existing `sharp` library and static file placement. The build pipeline gets one new step (`generate-favicons`) and one modified step (`generate-og-image`).

---

## Recommended Stack Additions

### 1. Sitemap Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@astrojs/sitemap` | ^3.7.2 | Automatic sitemap.xml generation at build time | Official Astro integration. Zero-config for static output mode. Already has `site` configured in `astro.config.ts`. Generates `sitemap-index.xml` + `sitemap-0.xml` into `dist/`. No reason to use a third-party alternative. |

**Installation:**
```bash
npx astro add sitemap
```

**Configuration change to `astro.config.ts`:**
```typescript
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hiawathasrevenge.com', // already present
  integrations: [sitemap()],
  // ... rest of existing config unchanged
});
```

The integration hooks into `astro build` automatically. No pipeline.js change needed -- sitemap generation happens during the Astro build step, not the pre-build pipeline.

**Confidence:** HIGH -- Verified via official Astro docs. Version 3.7.2 confirmed compatible with Astro 6.

---

### 2. robots.txt -- Static File, No Dependency

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Static file | N/A | `public/robots.txt` hand-written | For a single-page static site, a robots.txt integration is overkill. A 4-line static file in `public/` gets copied to `dist/` automatically by Astro. No dependency needed. |

**Content for `public/robots.txt`:**
```
User-agent: *
Allow: /

Sitemap: https://hiawathasrevenge.com/sitemap-index.xml
```

**Why not `astro-robots-txt` or `astro-robots` (npm packages):** These integrations add build-time configuration, verified-bots lists, and AI scraper blocking. None of that is needed for a simple cycling event site that wants to be fully crawlable. A static file is deterministic, version-controlled, has zero build-time cost, and is trivially auditable.

**Confidence:** HIGH -- Standard web practice. No library needed.

---

### 3. OG Image Redesign (Shield Badge + Tagline)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `sharp` (existing) | ^0.34.5 | Compose OG image: background photo + badge SVG overlay + text tagline | Already in devDependencies. Supports SVG input, PNG/JPEG output, `composite()` for layering, and SVG-based text overlays. No new dependency needed. |

**Current state:** `scripts/generate-og-image.js` crops a hero photo to 1200x630 JPEG. Simple crop, no compositing.

**Redesigned approach -- three-layer composite:**

1. **Background:** Hero photo cropped to 1200x630 (existing logic), optionally with a semi-transparent dark overlay for contrast
2. **Badge:** `public/images/badge.svg` rendered to PNG via `sharp(badgeSvgBuffer).resize(width).png().toBuffer()`, then composited at center
3. **Tagline text:** Rendered as an inline SVG string with explicit font styling, converted to `Buffer.from(svgString)`, composited below badge

**Text rendering: use inline SVG overlay via `composite()`, NOT sharp's constructor `text` option.**

Rationale:
- Sharp's constructor `text` option uses Pango/libvips text rendering, which depends on system-installed fonts and has documented performance issues (>7 seconds for SVG `<text>` elements per sharp issue #2987)
- The inline SVG overlay pattern is the established approach in the Node.js ecosystem: construct an SVG string with `<text>` elements, convert to Buffer, composite onto the base image
- This approach is portable across build environments (CI, local dev) because the SVG specifies fonts as CSS `font-family` with fallbacks

**Example pattern:**
```javascript
// 1. Background with dark overlay
const bg = await sharp(heroPath)
  .resize(1200, null)
  .extract({ left: 0, top: cropTop, width: 1200, height: 630 })
  .composite([{
    input: {
      create: { width: 1200, height: 630, channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0.4 } }
    },
    blend: 'over'
  }])
  .toBuffer();

// 2. Badge SVG -> PNG buffer
const badge = await sharp(badgeSvgPath)
  .resize(200, null)
  .png()
  .toBuffer();

// 3. Tagline as inline SVG -> buffer
const taglineSvg = `<svg width="800" height="60" xmlns="http://www.w3.org/2000/svg">
  <text x="400" y="40" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="28" fill="white" letter-spacing="2">
    A 100-Mile Gravel Ride Through the Hiawatha
  </text>
</svg>`;
const tagline = Buffer.from(taglineSvg);

// 4. Composite all layers
await sharp(bg)
  .composite([
    { input: badge, top: 140, left: 500 },
    { input: tagline, top: 440, left: 200 },
  ])
  .jpeg({ quality: 80 })
  .toFile(outputPath);
```

**Critical risk -- badge SVG rendering:** The badge SVG is 21KB, exported from Adobe Illustrator 30.3.0 (viewBox="0 0 1294 966"), with complex path data. Sharp uses librsvg for SVG rendering, which handles most Illustrator exports but can occasionally misrender complex artwork. **Mitigation:** Test the badge rendering early in implementation. If it renders poorly, pre-export a high-resolution PNG of the badge (e.g., 512x wide) and composite that instead. This fallback requires zero additional dependencies.

**Confidence:** HIGH for the composite approach (well-documented sharp API). MEDIUM for direct rendering of this specific Illustrator SVG (21KB of path data may challenge librsvg).

---

### 4. Favicon Generation from Shield Badge SVG

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `sharp` (existing) | ^0.34.5 | Generate PNG favicons (180, 192, 512px) from badge SVG | Already available. Handles SVG-to-PNG conversion and resize natively. |
| `png-to-ico` | ^3.0.1 | Convert 32x32 PNG to `favicon.ico` | Lightweight, pure JavaScript, single-purpose. Only needed because sharp cannot output ICO format. |

**Installation:**
```bash
npm install -D png-to-ico
```

**Modern favicon file set (per Evil Martians "How to Favicon" guide, updated 2026):**

| File | Size | Format | Generation Method | Purpose |
|------|------|--------|-------------------|---------|
| `favicon.ico` | 32x32 | ICO | sharp SVG->PNG 32x32, then `png-to-ico` | Legacy browsers, RSS readers, PDF tab display |
| `favicon.svg` | vector | SVG | Manual: simplified version of badge.svg (or keep current emoji version) | Modern browsers, supports dark mode CSS |
| `apple-touch-icon.png` | 180x180 | PNG | sharp SVG->PNG, resize to 180, add solid background | iOS home screen shortcut |
| `icon-192.png` | 192x192 | PNG | sharp SVG->PNG, resize to 192 | Android home screen |
| `icon-512.png` | 512x512 | PNG | sharp SVG->PNG, resize to 512 | PWA splash (future-proofing) |

**Current state:** The project has `public/favicon.svg` which is a tree emoji (`<text x="4" y="26" font-size="28">tree-emoji</text>`). This should be replaced with the shield badge.

**Updated HTML tags for `BaseLayout.astro`:**
```html
<!-- Replace existing single favicon link -->
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

**Apple touch icon note:** Apple touch icons must have a solid background (no transparency). The badge SVG has transparent background, so the generation script should composite the badge onto a solid-color canvas (e.g., forest-900 / `#1a2e1a` to match the site's dark theme).

**Why `png-to-ico` over alternatives:**

| Package | Why Not (if not chosen) |
|---------|------------------------|
| `png-to-ico` (chosen) | Pure JS, 3.0.1 stable, single purpose, no native deps |
| `sharp-ico` | Wrapper around sharp; unnecessary indirection when we only need one ICO conversion |
| `favicons` | Heavyweight generator (30+ variants, manifests, HTML snippets). Massive overkill for 5 files. |
| `to-ico` | Older, less maintained. Similar approach but `png-to-ico` has more adoption. |
| `icon-gen` | Multi-platform icon generator (Windows .ico, macOS .icns). More than needed. |

**Confidence:** HIGH for PNG generation via sharp. HIGH for `png-to-ico` (pure JS, no native deps, stable).

---

### 5. Meta Tags & Structured Data Audit -- No New Dependencies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| No new dependencies | N/A | Audit/improve `<head>` in BaseLayout.astro | All meta tag and JSON-LD changes are pure HTML/JSON template edits. No library needed. |

**What exists and works (from BaseLayout.astro):**
- `og:type`, `og:url`, `og:title`, `og:description`, `og:image` with width/height -- GOOD
- `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image` -- GOOD
- `<link rel="canonical">` using `Astro.url.pathname` + `Astro.site` -- GOOD
- Schema.org Event JSON-LD with name, description, startDate, endDate, eventStatus, location, organizer, image -- GOOD

**Improvements to make (pure template edits):**

| Addition | Tag | Value | Why |
|----------|-----|-------|-----|
| Site name | `<meta property="og:site_name">` | "Hiawatha's Revenge" | Displayed by Facebook/LinkedIn alongside the page title |
| Locale | `<meta property="og:locale">` | "en_US" | Explicit locale declaration for OG parsers |
| Image alt | `<meta property="og:image:alt">` | Descriptive alt text | Accessibility for social card previews |
| Theme color | `<meta name="theme-color">` | "#1a2e1a" (forest-900) | Mobile browser chrome color on Android/iOS |
| Image type | `<meta property="og:image:type">` | "image/jpeg" | Explicit content type for the OG image |

**Structured data audit areas:**

| Field | Status | Action |
|-------|--------|--------|
| `name` | Present | No change |
| `description` | Present | No change |
| `startDate` / `endDate` | Present (2026-06-06) | Verify still accurate |
| `eventStatus` | `EventScheduled` | No change |
| `location` | Place with address | Consider adding geo coordinates |
| `organizer` | Organization with URL | No change |
| `image` | OG image URL | Will auto-update with redesigned OG image |
| `offers` | MISSING | Consider adding if registration link exists |
| `performer` | N/A | Not applicable to cycling event |
| `url` | MISSING | Add canonical URL to event schema |
| `eventAttendanceMode` | `OfflineEventAttendanceMode` | Correct, no change |

**Confidence:** HIGH -- Pure template changes in BaseLayout.astro.

---

## What NOT to Add (and Why)

| Rejected Technology | Why Not |
|---------------------|---------|
| `astro-robots-txt` / `astro-robots` | Overkill for a single-page fully-crawlable site. Static file is simpler, more predictable, zero build cost. |
| `astro-seo` (npm) | Wrapper component for meta tags. Project already has working hand-written meta tags in BaseLayout. Adds indirection without value for a single-page site. |
| `favicons` (npm) | Generates 30+ icon variants, HTML, manifests. We need 5 files. |
| `@astrojs/sitemap` custom options | No need for `filter`, `customPages`, `i18n`, `serialize`. One-page site means default config produces exactly what's needed. |
| `manifest.webmanifest` | Only needed for PWA installability. This is an informational event site, not an installable app. Skip unless explicitly requested. |
| Sharp constructor `text` option | Uses Pango/libvips, depends on OS fonts, documented performance issues. SVG text overlay via `composite()` is more portable and predictable. |
| `@vercel/og` or `satori` | SSR-oriented OG image generators. This is a static build-time pipeline; sharp composite is the right tool. |
| SVGO (for badge optimization) | The badge SVG is complex Illustrator output. Automated optimization risks breaking intricate path data. For favicon SVG, manual simplification is safer and a one-time effort. |

---

## Integration with Existing Build Pipeline

**Current `scripts/pipeline.js` shared steps:**
1. generate-routes-manifest
2. generate-sector-details
3. generate-thumbnails
4. copy-images
5. generate-webp
6. process-historical
7. match-photos
8. copy-gpx
9. generate-og-image

**Changes needed:**

| Change | Type | Pipeline Impact |
|--------|------|-----------------|
| Modify `generate-og-image.js` | Edit existing step (step 9) | Add badge + tagline composite layers. Same input/output path. |
| Add `generate-favicons.js` | New step (insert as step 10) | Reads `public/images/badge.svg`, outputs `public/favicon.ico`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`. Runs once. |
| Add `robots.txt` | Static file in `public/` | No pipeline change. Astro copies `public/` to `dist/` automatically. |
| Sitemap generation | Automatic via `@astrojs/sitemap` | Runs during `astro build`, not in pipeline.js. No pipeline change. |
| Update BaseLayout.astro | Template edit | Favicon `<link>` tags, additional meta tags. No pipeline change. |
| Update `favicon.svg` | Replace static file | Replace emoji SVG with simplified badge SVG. No pipeline change. |

**Updated pipeline shared steps after changes:**
1. generate-routes-manifest
2. generate-sector-details
3. generate-thumbnails
4. copy-images
5. generate-webp
6. process-historical
7. match-photos
8. copy-gpx
9. generate-og-image (modified)
10. **generate-favicons (new)**

---

## Complete Installation Summary

```bash
# Sitemap integration (hooks into astro build)
npx astro add sitemap

# ICO generation utility (dev dependency)
npm install -D png-to-ico
```

**Total new dependencies: 2** (`@astrojs/sitemap` + `png-to-ico`). Everything else leverages existing `sharp` (^0.34.5) and static file patterns.

**No version bumps needed for existing packages.**

---

## Sources

### HIGH Confidence (Official Documentation)

- [Astro Sitemap Integration Official Docs](https://docs.astro.build/en/guides/integrations-guide/sitemap/) -- Version 3.7.2, zero-config for static mode, requires `site` in astro.config (already present)
- [Sharp Composite API](https://sharp.pixelplumbing.com/api-composite/) -- Overlay positioning via `top`/`left`, `gravity`, blend modes, SVG buffer compositing, `create` option for blank overlays
- [Sharp Constructor API](https://sharp.pixelplumbing.com/api-constructor/) -- SVG input support ("SVG input becomes PNG output"), `text` option with Pango markup, `create` option for blank images
- [Sharp Output API](https://sharp.pixelplumbing.com/api-output/) -- PNG/JPEG/WebP output confirmed; ICO format NOT supported (justifies `png-to-ico` dependency)

### MEDIUM Confidence (Verified via Multiple Sources)

- [How to Favicon in 2026 -- Evil Martians](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs) -- Minimal favicon set: `.ico` (32x32) + `.svg` + `apple-touch-icon.png` (180x180) + manifest icons. ICO still needed for RSS readers and PDF tab display.
- [Favicon Best Practices 2025-2026](https://browserux.com/blog/guides/web-icons/favicons-best-practices.html) -- SVG as primary format for modern browsers, PNG as fallback baseline, 180x180 apple-touch-icon mandatory for iOS
- [Sharp SVG text performance issue #2987](https://github.com/lovell/sharp/issues/2987) -- SVG `<text>` element rendering can take >7 seconds; inline SVG Buffer composite is preferred over constructor text option

### Codebase Analysis (2026-04-09)

- `scripts/generate-og-image.js`: Current implementation is a simple crop (sharp resize + extract to 1200x630 JPEG). No compositing. Uses `sharp` already.
- `public/images/badge.svg`: 21KB Adobe Illustrator export (viewBox 1294x966). Complex path data. Single `<path>` element with `class="st0"`.
- `public/favicon.svg`: 116 bytes, tree emoji in SVG text element. Placeholder, not branded.
- `astro.config.ts`: `site: 'https://hiawathasrevenge.com'` already configured. No integrations array yet.
- `src/layouts/BaseLayout.astro`: Complete OG/Twitter Card/canonical/JSON-LD implementation. Single `<link rel="icon">` pointing to `favicon.svg`.
- `scripts/pipeline.js`: 9 shared steps + 3 route-specific steps. `generate-og-image` is the final shared step.
- `dist/`: Flat static output. No existing `robots.txt` or `sitemap.xml`.

---

*Stack research for: Hiawatha's Revenge -- SEO & Social Sharing Polish*
*Researched: 2026-04-09*
*Previous: v1.8 stack research (2026-04-07) -- Navigation & Identity*
