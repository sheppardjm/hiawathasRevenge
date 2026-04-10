# Roadmap: Hiawatha's Revenge v1.11 SEO & Social Sharing

## Overview

Close the gap between a technically functional site and one that looks professional when shared and found. The existing site has foundational OG tags and Event JSON-LD from v1.4, but the OG image is an unbranded photo crop, the favicon is a tree emoji, there is no robots.txt or sitemap, and the Event schema is missing properties Google requires for rich result eligibility. Four phases front-load the highest-SEO-impact template edits and back-load the lowest-priority crawlability items.

## Milestones

<details>
<summary>v1.0 through v1.10 (Phases 0-49) - SHIPPED</summary>

See .planning/MILESTONES.md for full history.

</details>

### v1.11 SEO & Social Sharing (In Progress)

**Milestone Goal:** Site looks compelling and accurate when shared on social platforms or found via search -- badge logo, proper descriptions, structured data, and crawlability.

## Phases

- [x] **Phase 50: Meta Tags & Structured Data** - Complete OG tag set and Google-eligible Event schema
- [x] **Phase 51: Favicon & Icons** - Branded browser chrome replacing tree emoji
- [ ] **Phase 52: OG Image Redesign** - Badge+tagline composite share image
- [ ] **Phase 53: Crawlability** - robots.txt and auto-generated sitemap

## Phase Details

### Phase 50: Meta Tags & Structured Data
**Goal**: Site metadata is complete and the Event schema qualifies for Google rich results
**Depends on**: Nothing (first phase of v1.11)
**Requirements**: META-01, META-02, META-03, META-04, SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05, CRAWL-03
**Success Criteria** (what must be TRUE):
  1. Sharing the site URL on any platform shows correct site name, locale, and image alt text from OG meta tags
  2. Social platform link previews display at correct dimensions without layout reflow (og:image:width/height present)
  3. Mobile browser chrome (address bar, task switcher) reflects the site's forest-green identity via theme-color
  4. Google Rich Results Test passes the Event JSON-LD without errors -- street address, timezone-aware startDate, free-event offers block, geo coordinates, and URL all present
  5. Canonical URL is correct and present on every page
**Plans:** 1 plan
Plans:
- [x] 50-01-PLAN.md — Add missing meta tags and upgrade Event JSON-LD schema

### Phase 51: Favicon & Icons
**Goal**: Browser tabs, bookmarks, and iOS home screen show the branded shield badge instead of a tree emoji
**Depends on**: Nothing (independent of Phase 50)
**Requirements**: ICON-01, ICON-02, ICON-03, ICON-04
**Success Criteria** (what must be TRUE):
  1. Browser tab displays a recognizable shield badge favicon (not a tree emoji)
  2. Adding the site to iOS home screen shows a clean shield badge on a solid background (180x180 apple-touch-icon)
  3. Legacy browsers that request favicon.ico get a 32x32 fallback (no 404)
  4. HTML source contains all required icon link tags (favicon.svg, apple-touch-icon, favicon.ico)
**Plans:** 1 plan
Plans:
- [x] 51-01-PLAN.md — Create shield badge favicons and wire into build pipeline

### Phase 52: OG Image Redesign
**Goal**: Sharing the site on iMessage, Slack, Facebook, X, or Discord shows a branded card with badge, tagline, and event date -- not a raw photo crop
**Depends on**: Phase 50 (meta tags must reference the new image filename)
**Requirements**: SSI-01, SSI-02, SSI-03
**Success Criteria** (what must be TRUE):
  1. The OG image displays the shield badge, tagline "A 100-Mile Gravel Ride Through the Hiawatha", and "June 6, 2026" on a dimmed hero background
  2. The image uses a new filename (not og-image.jpg) so social platform caches show the updated design
  3. Text on the OG image is legible at thumbnail rendering size (300x158px)
  4. og:image meta tag points to the new image URL and SSI-03 is verified in page source
**Plans:** 1 plan
Plans:
- [x] 52-01-PLAN.md — Rewrite OG image generator with branded SVG composite and update meta tag reference

### Phase 53: Crawlability
**Goal**: Search engines can discover and index every page through standard robots.txt and sitemap protocols
**Depends on**: Nothing (independent, but lowest priority -- ship last)
**Requirements**: CRAWL-01, CRAWL-02
**Success Criteria** (what must be TRUE):
  1. /robots.txt returns valid directives with a Sitemap reference pointing to the correct sitemap URL
  2. sitemap.xml (or sitemap-index.xml) is auto-generated at build time via @astrojs/sitemap and lists the site's pages
  3. /robots.txt disallows /admin and /api/ paths from crawlers
**Plans:** 1 plan
Plans:
- [ ] 53-01-PLAN.md — Install @astrojs/sitemap, create robots.txt, configure path filter

## Progress

**Execution Order:** 50 → 51 → 52 → 53
(Phases 50 and 51 are independent and could execute in either order. Phase 52 depends on Phase 50. Phase 53 is independent.)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 50. Meta Tags & Structured Data | v1.11 | 1/1 | ✓ Complete | 2026-04-09 |
| 51. Favicon & Icons | v1.11 | 1/1 | ✓ Complete | 2026-04-09 |
| 52. OG Image Redesign | v1.11 | 1/1 | ✓ Complete | 2026-04-09 |
| 53. Crawlability | v1.11 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-04-09*
*Last updated: 2026-04-09 — Phase 52 complete*
