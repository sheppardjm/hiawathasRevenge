---
phase: 50-meta-tags-structured-data
plan: 01
subsystem: seo
tags: [meta-tags, opengraph, twitter-card, schema.org, json-ld, structured-data, google-rich-results]

# Dependency graph
requires:
  - phase: 29-seo-social-sharing
    provides: baseline OG tags, Twitter Card, canonical link, og:image dimensions, Event JSON-LD with set:html pattern
provides:
  - Complete OG meta tags: og:site_name, og:locale, og:image:alt, og:image:type
  - Twitter accessibility tag: twitter:image:alt
  - theme-color meta tag (#1a2e1a)
  - Google Event rich result-eligible JSON-LD with street address, timezone-aware startDate, offers block, geo coordinates, and url
affects:
  - 51-sitemap-robots
  - 52-performance-audit
  - 53-deploy-v111

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "All SEO meta tags consolidated in BaseLayout.astro head — single source of truth for every page"
    - "Event JSON-LD uses Astro set:html directive for JSON injection to prevent HTML entity escaping"

key-files:
  created: []
  modified:
    - src/layouts/BaseLayout.astro

key-decisions:
  - "og:locale uses underscore format en_US (not hyphen en-US per BCP47)"
  - "theme-color uses literal hex #1a2e1a — CSS custom properties do not work in content attribute"
  - "startDate timezone is CDT (-05:00) for Michigan UP in June — not EST (-06:00) or EDT (-04:00)"
  - "offers.isAccessibleForFree is boolean true (not string 'true')"
  - "offers.price is string '0' (not number 0) per Schema.org spec"
  - "streetAddress set to 'Valley Spur Trailhead, M-94' — no formal street number exists for trailhead"

patterns-established:
  - "OG image alt text: describe scene + event name + category in one phrase"
  - "Event JSON-LD offers block: price string '0', isAccessibleForFree boolean true, availability InStock"

# Metrics
duration: 1min
completed: 2026-04-09
---

# Phase 50 Plan 01: Meta Tags & Structured Data Summary

**6 missing meta tags added and Event JSON-LD upgraded to Google Event rich result eligibility with street address, timezone-aware startDate (CDT -05:00), offers block, geo coordinates, and url field**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-04-09T15:37:23Z
- **Completed:** 2026-04-09T15:38:52Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added all 6 missing meta tags: og:site_name, og:locale, og:image:alt, og:image:type, twitter:image:alt, theme-color
- Upgraded Event JSON-LD with all fields required for Google Event rich results: timezone-aware startDate, street address, postal code, geo coordinates, offers block, and event url
- Astro build passes without errors; all tags verified in built dist/index.html

## Task Commits

Each task was committed atomically:

1. **Task 1: Add missing meta tags to HTML head** - `3826e78` (feat)
2. **Task 2: Upgrade Event JSON-LD schema** - `cc5abaf` (feat)

**Plan metadata:** (see final commit)

## Files Created/Modified

- `src/layouts/BaseLayout.astro` - Added 6 meta tags in head; replaced eventSchema object with upgraded version including geo, offers, streetAddress, timezone startDate, and url

## Decisions Made

- **og:locale format:** Used underscore `en_US` (OG format), not hyphen `en-US` (BCP47). Facebook and some parsers silently ignore the hyphen variant.
- **theme-color value:** Hardcoded `#1a2e1a` (forest-900). CSS custom properties are not evaluated in `content=""` attributes.
- **startDate timezone:** Michigan UP observes CDT (UTC-5) in June. Used `-05:00` as the offset for `2026-06-06T08:00:00-05:00`.
- **isAccessibleForFree type:** Boolean `true` per Schema.org spec — string "true" would be incorrect.
- **price type:** String `"0"` per Schema.org spec — number `0` would be incorrect.
- **streetAddress value:** `"Valley Spur Trailhead, M-94"` — no formal street number exists for this forest trailhead; M-94 is the road it accesses from.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All meta tag and structured data gaps from Phase 50 research are now closed
- Site qualifies for Google Event rich result testing — can validate via Google Rich Results Test using "code snippet" mode with built HTML
- admin.astro canonical gap is accepted as won't-fix (admin redirects to `/` in production and is never crawled)
- Ready to proceed to Phase 51 (sitemap/robots) or Phase 52 (performance audit)

---
*Phase: 50-meta-tags-structured-data*
*Completed: 2026-04-09*
