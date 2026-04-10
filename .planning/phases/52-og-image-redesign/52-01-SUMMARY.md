---
phase: 52-og-image-redesign
plan: 01
subsystem: ui
tags: [sharp, svg, og-image, social-sharing, fonts, jpeg, composite]

# Dependency graph
requires:
  - phase: 51-favicon-icons
    provides: font embedding pattern (base64 @font-face in SVG, inline fill attributes for librsvg compatibility)
  - phase: 50-meta-tags
    provides: og:image meta tag structure in BaseLayout.astro, ogImageURL variable
provides:
  - Branded 1200x630 og-card.jpg compositing dimmed hero photo with shield badge, tagline, and event date
  - scripts/fonts/ directory with NationalPark-Heavy.otf and SpaceMono-Bold.ttf bundled in repo
  - Rewritten generate-og-image.js using sharp SVG composite pipeline
  - Updated BaseLayout.astro og:image and twitter:image pointing to og-card.jpg
  - Updated og:image:alt and twitter:image:alt describing the branded design
affects:
  - Any phase touching BaseLayout.astro meta tags
  - Any phase touching the pipeline (generate-og-image.js is a shared step)
  - Social sharing / deployment verification

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SVG @font-face embedding via base64-encoded font files from scripts/fonts/ for sharp librsvg rendering"
    - "sharp pipeline: resize → extract center crop → composite SVG buffer → jpeg"
    - "Inline SVG fill attributes (not CSS classes) for librsvg compatibility"
    - "OG image filename includes 'card' suffix (og-card.jpg) for social platform cache busting"

key-files:
  created:
    - scripts/fonts/NationalPark-Heavy.otf
    - scripts/fonts/SpaceMono-Bold.ttf
    - public/og-card.jpg
  modified:
    - scripts/generate-og-image.js
    - src/layouts/BaseLayout.astro

key-decisions:
  - "Output filename changed from og-image.jpg to og-card.jpg for social platform cache busting"
  - "Fonts stored in scripts/fonts/ (not .astro/fonts/ which doesn't exist at pipeline run time)"
  - "SVG overlay uses inline fill attributes on rect/path elements — CSS class fills unreliable in sharp/librsvg"
  - "JPEG quality set to 85 (up from 75) for branded card with text legibility priority"
  - "extract top offset is 135px (center of 900px height for 630px crop) — same math as original script"

patterns-established:
  - "Font embedding for pipeline scripts: readFileSync + base64 + SVG @font-face data URI"
  - "OG image composite order: resize → extract → composite → jpeg (no flatten before composite)"

# Metrics
duration: 2min
completed: 2026-04-10
---

# Phase 52 Plan 01: OG Image Redesign Summary

**Branded 1200x630 og-card.jpg compositing dimmed hero photo with amber shield badge, National Park tagline, and Space Mono event date via sharp SVG overlay pipeline**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-10T01:12:57Z
- **Completed:** 2026-04-10T01:14:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Copied NationalPark-Heavy.otf and SpaceMono-Bold.ttf to scripts/fonts/ for pipeline-accessible font embedding
- Rewrote generate-og-image.js: sharp pipeline composites dimmed hero photo (55% black overlay) with SVG shield badge, two-line tagline in National Park Heavy, and amber date in Space Mono Bold
- Renamed output from og-image.jpg to og-card.jpg for social platform cache busting
- Updated BaseLayout.astro to reference og-card.jpg and updated both alt text attributes to describe the branded composite design
- Full build verified: pipeline generates og-card.jpg (201KB), Astro build succeeds, dist/index.html confirms og:image and twitter:image point to https://hiawathasrevenge.com/og-card.jpg

## Task Commits

Each task was committed atomically:

1. **Task 1: Copy font assets and rewrite generate-og-image.js with SVG composite overlay** - `77497d5` (feat)
2. **Task 2: Update BaseLayout.astro og:image reference and verify full build** - `8727468` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `scripts/fonts/NationalPark-Heavy.otf` - National Park Heavy font for tagline rendering (19.8KB, copied from /Library/Fonts/)
- `scripts/fonts/SpaceMono-Bold.ttf` - Space Mono Bold font for event date rendering (88.9KB, copied from /Library/Fonts/)
- `scripts/generate-og-image.js` - Rewrites: base64 font embedding, SVG overlay with shield badge + text, sharp composite pipeline, og-card.jpg output
- `public/og-card.jpg` - Branded 1200x630 JPEG social share image (201KB)
- `src/layouts/BaseLayout.astro` - ogImageURL changed to og-card.jpg; og:image:alt and twitter:image:alt updated to describe branded design

## Decisions Made
- Output filename changed to **og-card.jpg** (was og-image.jpg) to bust social platform caches (iMessage, Slack, Discord, X, Facebook cache by URL)
- Fonts stored in **scripts/fonts/** — .astro/fonts/ does not exist at pipeline run time (prebuild runs before Astro processes assets)
- SVG overlay uses **inline fill attributes** on rect/path — CSS class fills are unreliable in sharp's librsvg renderer (same lesson applied in phase 51)
- JPEG quality raised to **85** (from 75 in old script) — text legibility on branded card takes priority over file size
- extract top offset is **135px** — same center-crop math as original (900px resized height minus 630px target, divided by 2)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- og-card.jpg is in public/ and will deploy with the site
- Social platforms (iMessage, Slack, Facebook, X, Discord) will fetch og-card.jpg on next share due to filename change
- To force cache refresh on platforms that cache aggressively, append `?v=2` to og:image URL if needed (not required for initial deploy)
- Remaining phase 52 plans (if any) can reference og-card.jpg and the scripts/fonts/ pattern

---
*Phase: 52-og-image-redesign*
*Completed: 2026-04-10*
