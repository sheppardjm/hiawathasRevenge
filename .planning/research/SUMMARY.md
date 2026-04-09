# Project Research Summary

**Project:** Hiawatha's Revenge -- SEO & Social Sharing Polish (v1.11)
**Domain:** SEO, structured data, social sharing for a static cycling event site
**Researched:** 2026-04-09
**Confidence:** HIGH

## Executive Summary

This milestone closes the gap between a site that technically works for search engines and one that looks professional when shared. The existing Astro 6 single-page site already has foundational OG tags, Twitter Card tags, canonical URLs, and Event JSON-LD from v1.4 -- but the OG image is a raw photo crop with no branding, the favicon is a tree emoji, there is no robots.txt or sitemap, and the Event schema is missing properties Google requires for rich result eligibility (most critically: a street-level address and an `offers` block for the free event). The fix requires only two new dependencies (`@astrojs/sitemap` and `png-to-ico`), with all other work handled by the existing `sharp` library and template edits to `BaseLayout.astro`.

The recommended approach is four focused phases: (1) meta tag and structured data fixes in BaseLayout.astro, which are pure template edits with the highest SEO impact per effort; (2) favicon and apple-touch-icon generation via a new pipeline script using the simplified shield motif path already in the codebase; (3) redesigning the OG share image as a badge+tagline composite over a dark background using sharp's SVG compositing API; and (4) adding robots.txt via an Astro page endpoint plus the `@astrojs/sitemap` integration. This ordering front-loads the changes that affect Google rich result eligibility and back-loads the lowest-impact items.

The key risks are OG image cache poisoning across social platforms (mitigated by using a new filename instead of overwriting the existing one), text illegibility at thumbnail rendering sizes (mitigated by designing for 300x158 display), and the badge SVG's 21KB Illustrator complexity potentially rendering poorly through librsvg (mitigated by falling back to a pre-exported PNG). One content dependency exists: the Event schema requires a street-level address for the ride start location, which is a user-input question, not a technical one.

## Key Findings

### Recommended Stack

Two new dependencies total. Everything else uses existing sharp (0.34.5) and hand-written code.

**Core technologies:**
- `@astrojs/sitemap` (^3.7.2): auto-generates sitemap at Astro build time -- official integration, zero-config for static output, `site` already configured in `astro.config.ts`
- `png-to-ico` (^3.0.1): converts 32x32 PNG to favicon.ico -- pure JS, no native deps, needed only because sharp cannot output ICO format
- `sharp` (existing ^0.34.5): handles OG image compositing (badge + tagline overlay) and favicon PNG generation from SVG -- no version bump needed

**Explicitly rejected:** `astro-robots-txt` (overkill for static file), `favicons` npm (30+ variants, massive overkill), `@vercel/og`/`satori` (SSR-oriented, wrong for static build), SVGO (risks breaking complex badge SVG paths), `astro-seo` (unnecessary wrapper for single-page site).

### Expected Features

**Must have (table stakes):**
- TS-1: Branded OG share image with badge, event name, date, tagline (1200x630 JPEG) -- current raw photo crop is unrecognizable when shared
- TS-2: robots.txt with Sitemap directive
- TS-3: sitemap.xml via `@astrojs/sitemap`
- TS-4: Apple touch icon (180x180 PNG from shield motif) -- iOS home screen currently shows ugly screenshot
- TS-5: favicon.ico fallback (32x32) -- currently 404s on direct request
- TS-6: Missing OG meta tags (`og:site_name`, `og:locale`, `og:image:alt`, `og:image:type`, `twitter:image:alt`)
- TS-7: Event schema enrichment -- street address (required for rich results), `offers` with `price: "0"`, `isAccessibleForFree`, `url`, `geo` coordinates, ISO 8601 datetimes with timezone

**Should have (differentiators):**
- D-1: Designed share card with visual hierarchy (goes beyond TS-1 with proper design craft)
- D-3: `theme-color` meta tag for mobile browser chrome
- D-5: SVG favicon with dark mode support via `prefers-color-scheme`

**Defer (v2+ or skip):**
- D-2: Web manifest / PWA icons -- this is an informational event site, not an installable app
- D-4: SportsEvent schema type -- incorrect for a non-competitive ride; keep `Event`

**Anti-features (do NOT build):**
- Do NOT use `og:type` "event" (Facebook-specific, deprecated event protocol; keep "website")
- Do NOT use WebP/AVIF for OG image (LinkedIn and older iMessage clients silently fail)
- Do NOT create separate pages for SEO (dilutes single-page link equity)
- Do NOT add `SportsEvent` schema (semantically wrong for a non-competitive ride)
- Do NOT keyword-stuff the meta description (Google rewrites these; write naturally)

### Architecture Approach

The build pipeline already handles image generation before Astro build via `scripts/pipeline.js`. The OG image redesign modifies the existing `generate-og-image.js` step (step 9/11). Favicon generation adds a new `generate-favicons.js` step. The sitemap plugs into Astro's build process via integration (not the pipeline -- it needs to know what pages Astro generates). The robots.txt is best implemented as a `src/pages/robots.txt.ts` endpoint that reads `site` from Astro config, keeping the sitemap URL DRY. All meta tag and structured data changes are template edits in `BaseLayout.astro`.

**Major components:**
1. `scripts/generate-og-image.js` (modified) -- badge+tagline composite replacing center-crop; uses sharp SVG compositing with inline SVG text overlay pattern
2. `scripts/generate-favicons.js` (new) -- generates favicon.svg (shield motif with dark mode), apple-touch-icon.png (180x180), and optionally favicon.ico (32x32 via png-to-ico) from the simplified shield path
3. `src/pages/robots.txt.ts` (new) -- Astro endpoint generating robots.txt with sitemap reference, disallowing /admin and /api/
4. `astro.config.ts` (modified) -- adds `@astrojs/sitemap` integration
5. `src/layouts/BaseLayout.astro` (modified) -- adds missing OG tags, enriches Event JSON-LD, updates favicon link tags

**Key boundary principle:** Image/asset generation belongs in the pipeline (pre-build, uses sharp). Page/route generation belongs in Astro (build-time). The sitemap runs during Astro build, not in the pipeline.

### Critical Pitfalls

1. **OG image cache poisoning** -- Social platforms cache OG images for days/weeks. Updating the image at the same URL means stale previews everywhere, with zero cache-purge mechanism for iMessage. **Avoid by:** using a new filename (e.g., `og-hiawatha-badge.jpg`) and updating the meta tag to match. Deploy well before any social media push.

2. **Event schema missing street address** -- Google requires `streetAddress` for Event rich results as of mid-2025. The current schema has city-level only ("Munising, MI"). Without a street address, the event will not appear in Google's event search results. **Avoid by:** adding the ride start location address (requires user input).

3. **Free event missing `offers` block** -- Google expects `offers` with `price: "0"` even for free events. Without it, Google cannot determine pricing and may decline to show the event in enhanced results. **Avoid by:** adding `offers` with price "0", priceCurrency "USD", and `isAccessibleForFree: true`.

4. **OG image text illegible at thumbnail size** -- The image looks great at 1200x630 but renders at 300x158 in iMessage. Text becomes unreadable. **Avoid by:** designing for the smallest rendering size, using 3-5 bold words maximum, testing at 300x158 before finalizing.

5. **Sitemap filename mismatch in robots.txt** -- `@astrojs/sitemap` generates `sitemap-index.xml`, not `sitemap.xml`. A hand-written robots.txt pointing to the wrong filename silently breaks sitemap discovery. **Avoid by:** using the Astro page endpoint approach that reads from config, or verifying the exact filename after build.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Meta Tags, Structured Data, and Canonical Audit

**Rationale:** Highest SEO impact for the lowest effort. Pure template edits, no new files or dependencies. The Event schema street address gap is the single most impactful fix for Google rich result eligibility. Front-loading this ensures the site is eligible for event search results as early as possible before the June 6 event.
**Delivers:** Complete OG tag set, enriched Event JSON-LD with all recommended properties, explicit `trailingSlash` config, verified canonical URL.
**Addresses:** TS-6 (missing OG tags), TS-7 (event schema enrichment), D-3 (theme-color).
**Avoids:** Pitfall 3 (missing offers), Pitfall 4 (SportsEvent misclassification), Pitfall 8 (trailing slash inconsistency), Pitfall 10 (missing recommended properties), Pitfall 15 (iMessage title truncation).
**User input required:** Street address for the ride start location and event start/end times with timezone.

### Phase 2: Favicon and Apple Touch Icon Generation

**Rationale:** No dependency on other phases. Uses the simplified shield motif path already in BaseLayout.astro. Tests the pipeline script creation pattern (useful practice before the more complex OG image phase). Replaces the emoji favicon immediately for branded browser chrome.
**Delivers:** `favicon.svg` (dark mode aware shield), `apple-touch-icon.png` (180x180), optionally `favicon.ico` (32x32), updated `<link>` tags in BaseLayout.astro.
**Addresses:** TS-4 (apple touch icon), TS-5 (favicon.ico), D-5 (SVG favicon with dark mode).
**Avoids:** Pitfall 5 (emoji favicon inconsistency), Pitfall 13 (double-rounded corners on apple-touch-icon), Pitfall 14 (invalid rel="shortcut icon").
**Uses:** sharp (existing), png-to-ico (new dev dependency), shield motif path from BaseLayout symbol.

### Phase 3: OG Image Redesign

**Rationale:** Most complex change -- requires SVG compositing with text rendering, font file management, and visual design decisions. Benefits from having simpler changes landed and validated first. The badge SVG rendering (21KB Illustrator export through librsvg) carries medium risk and needs early testing.
**Delivers:** Branded OG share image (badge + tagline over dark background), updated meta tags to point to new filename.
**Addresses:** TS-1 (branded OG image), D-1 (designed share card).
**Avoids:** Pitfall 1 (cache poisoning via new filename), Pitfall 2 (WebP format trap -- JPEG only), Pitfall 6 (text illegibility at thumbnail size), Pitfall 9 (schema image vs OG image separation).
**Uses:** sharp SVG compositing, scripts/fonts/ directory with National Park .ttf.
**Design decision needed:** Whether to use the full 21KB badge.svg or the simplified shield motif. Whether the Event schema `image` should remain the scenic hero photo (separate from the badge-centric OG image).

### Phase 4: robots.txt and Sitemap

**Rationale:** Lowest priority for a single-page site -- search engines find single-page sites fine without these. But they close the final gaps in any SEO audit. robots.txt references the sitemap URL, so both should ship together. The `@astrojs/sitemap` integration is zero-config and the robots.txt endpoint is ~15 lines.
**Delivers:** `robots.txt` (with /admin and /api/ disallowed), `sitemap-index.xml` and `sitemap-0.xml`.
**Addresses:** TS-2 (robots.txt), TS-3 (sitemap.xml).
**Avoids:** Pitfall 7 (hash fragments in sitemap, filename mismatch), Pitfall 11 (site URL mismatch).
**Uses:** `@astrojs/sitemap` (new dependency), `src/pages/robots.txt.ts` endpoint pattern.

### Phase Ordering Rationale

- **Phases 1 and 2 are independent** and could be done in parallel or in either order. Phase 1 is recommended first because the Event schema fixes have the highest SEO impact before the June 6 event date.
- **Phase 3 depends on a design decision** (badge rendering approach) and font availability, making it the highest-risk item. Placing it third gives time to resolve the badge SVG rendering question.
- **Phase 4 is genuinely lowest priority** for a single-page site but trivial to implement. It rounds out the milestone.
- All phases should include a UAT step that tests with actual platform crawler tools (opengraph.xyz, Facebook Sharing Debugger, Google Rich Results Test).

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (OG Image Redesign):** Font rendering through librsvg needs testing. The 21KB badge SVG may not render cleanly -- test early and have a PNG fallback ready. The design composition (badge size, text placement, background treatment) needs visual iteration.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Meta/Schema Audit):** Pure template edits with well-documented patterns from Google and OGP specs.
- **Phase 2 (Favicons):** Standard sharp SVG-to-PNG pipeline. Shield motif is a simple path.
- **Phase 4 (robots.txt + Sitemap):** Zero-config Astro integration + trivial endpoint. Fully documented in Astro docs.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Only 2 new deps, both verified against official docs. sharp already in use. |
| Features | HIGH | Verified against OGP spec, Google Event docs, Apple TN3156, Slack unfurling docs. Clear table-stakes vs differentiators. |
| Architecture | HIGH | Pipeline pattern established by existing scripts. Sitemap integration is official Astro. robots.txt endpoint is standard Astro pattern. |
| Pitfalls | HIGH | All critical pitfalls verified against official docs or direct codebase inspection. OG cache poisoning confirmed via Apple developer forums. |

**Overall confidence:** HIGH

### Gaps to Address

- **Street address for ride start location:** Required for Event schema rich results. This is a content question for the site owner, not a technical decision. Must be resolved before Phase 1 can ship.
- **Event start/end times with timezone:** Current schema has date-only (`2026-06-06`). Need actual ride start time and expected end time in Eastern timezone for ISO 8601 format.
- **Badge SVG rendering quality:** The 21KB Illustrator badge may render poorly through librsvg at composite time. Test early in Phase 3. Fallback: pre-export a high-res PNG of the badge.
- **Font availability for OG text:** National Park .ttf needs to be downloaded to `scripts/fonts/` for SVG text rendering. librsvg font resolution via `@font-face` in SVG `<defs>` needs validation.
- **SportsEvent vs Event:** Research confirms `Event` is correct for a non-competitive ride. Do NOT change to `SportsEvent`. This is flagged because the FEATURES.md researcher suggested it as a differentiator, but the PITFALLS.md researcher correctly identified it as a misclassification risk.

## Sources

### Primary (HIGH confidence)
- [Google: Event Structured Data](https://developers.google.com/search/docs/appearance/structured-data/event) -- required/recommended properties, 2025 physical location requirement, `offers` for free events
- [Open Graph Protocol Specification](https://ogp.me/) -- required/optional OG properties
- [Astro Sitemap Integration](https://docs.astro.build/en/guides/integrations-guide/sitemap/) -- version 3.7.2, zero-config for static output
- [Sharp Composite API](https://sharp.pixelplumbing.com/api-composite/) -- SVG buffer compositing, overlay positioning
- [Apple TN3156: Rich Previews for Messages](https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages) -- iMessage preview behavior, title truncation, no cache-purge mechanism
- [X/Twitter Card Docs](https://developer.x.com/en/docs/x-for-websites/cards/overview/summary-card-with-large-image) -- card requirements
- [Slack Link Unfurling](https://api.slack.com/reference/messaging/link-unfurling) -- 32KB head limit

### Secondary (MEDIUM confidence)
- [Evil Martians: How to Favicon in 2026](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs) -- minimal favicon set (3-5 files)
- [Sharp SVG text performance issue #2987](https://github.com/lovell/sharp/issues/2987) -- inline SVG Buffer composite preferred over constructor text option
- [OG Preview: Why OG Images Not Updating](https://ogpreview.app/why-og-images-not-updating/) -- cache poisoning across platforms
- [Ctrl Blog: WebP as OG Image](https://www.ctrl.blog/entry/webp-ogp.html) -- LinkedIn/iMessage WebP incompatibility

### Codebase Inspection
- `src/layouts/BaseLayout.astro` -- existing meta tags, JSON-LD, canonical URL, favicon link, shield-motif symbol
- `scripts/generate-og-image.js` -- current simple crop implementation
- `scripts/pipeline.js` -- 11 shared steps + 3 per-route steps
- `public/images/badge.svg` -- 21KB Illustrator export, complex paths
- `public/favicon.svg` -- 116-byte tree emoji placeholder
- `astro.config.ts` -- site URL configured, no integrations array, no trailingSlash

---
*Research completed: 2026-04-09*
*Ready for roadmap: yes*
