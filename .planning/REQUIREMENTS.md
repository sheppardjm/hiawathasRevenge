# Requirements: Hiawatha's Revenge v1.11

**Defined:** 2026-04-09
**Core Value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.

## v1.11 Requirements

Requirements for SEO & Social Sharing milestone.

### Social Share Image

- [ ] **SSI-01**: OG image displays shield badge, tagline "A 100-Mile Gravel Ride Through the Hiawatha", and "June 6, 2026" on a dimmed hero photo background (1200x630 JPEG)
- [ ] **SSI-02**: OG image uses a new filename (not `og-image.jpg`) to bust iMessage/Facebook/Slack caches
- [ ] **SSI-03**: `og:image` meta tag points to the new image URL

### Meta Tags

- [ ] **META-01**: `og:site_name`, `og:locale`, `og:image:alt`, `og:image:type` meta tags present
- [ ] **META-02**: `og:image:width` and `og:image:height` attributes present for instant preview sizing
- [ ] **META-03**: `twitter:image:alt` meta tag present for accessibility
- [ ] **META-04**: `theme-color` meta tag set to match site identity

### Structured Data

- [ ] **SCHEMA-01**: Event JSON-LD includes street address (Valley Spur Trailhead, Munising, MI 49862)
- [ ] **SCHEMA-02**: `startDate` includes timezone (`2026-06-06T08:00:00-05:00`)
- [ ] **SCHEMA-03**: `offers` block with `price: "0"`, `priceCurrency: "USD"`, and `isAccessibleForFree: true`
- [ ] **SCHEMA-04**: `url`, standalone `description`, and `geo` coordinates present
- [ ] **SCHEMA-05**: Passes Google Rich Results Test without errors

### Crawlability

- [ ] **CRAWL-01**: `robots.txt` serves valid directives and references sitemap URL
- [ ] **CRAWL-02**: `sitemap.xml` auto-generated via `@astrojs/sitemap`
- [ ] **CRAWL-03**: Canonical URL is correct and present on all pages

### Favicon & Icons

- [ ] **ICON-01**: `favicon.svg` uses simplified shield badge motif
- [ ] **ICON-02**: `apple-touch-icon.png` (180x180) generated from badge with solid background
- [ ] **ICON-03**: `favicon.ico` (32x32) legacy fallback present
- [ ] **ICON-04**: All icon `<link>` tags present in HTML `<head>`

## Future Requirements

Deferred to later milestones.

### Android Install

- **MANIFEST-01**: `site.webmanifest` with 192x192 and 512x512 icons for Android PWA install

## Out of Scope

| Feature | Reason |
|---------|--------|
| `SportsEvent` schema type | This is a ride, not a race — `Event` is correct |
| Site-wide dark/light toggle for SEO | OS preference only; no user toggle needed |
| Per-route OG images (#route=100k) | Single-page with hash routing; social crawlers ignore fragments |
| AI crawler blocking (GPTBot, ClaudeBot) | No reason to block; site is public promotional content |
| Google Search Console verification | Requires account access; out of scope for this build |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SSI-01 | — | Pending |
| SSI-02 | — | Pending |
| SSI-03 | — | Pending |
| META-01 | — | Pending |
| META-02 | — | Pending |
| META-03 | — | Pending |
| META-04 | — | Pending |
| SCHEMA-01 | — | Pending |
| SCHEMA-02 | — | Pending |
| SCHEMA-03 | — | Pending |
| SCHEMA-04 | — | Pending |
| SCHEMA-05 | — | Pending |
| CRAWL-01 | — | Pending |
| CRAWL-02 | — | Pending |
| CRAWL-03 | — | Pending |
| ICON-01 | — | Pending |
| ICON-02 | — | Pending |
| ICON-03 | — | Pending |
| ICON-04 | — | Pending |

**Coverage:**
- v1.11 requirements: 16 total
- Mapped to phases: 0
- Unmapped: 16 ⚠️

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after initial definition*
