---
phase: 30-image-optimization
plan: 01
subsystem: ui
tags: [sharp, webp, picture-element, srcset, preload, lcp, image-optimization]

# Dependency graph
requires:
  - phase: 14-hero-section
    provides: HeroSection.astro with original <img> tag and hero JPEG source
  - phase: 29-seo-social-sharing
    provides: BaseLayout.astro head structure with canonical, icon, font preloads
provides:
  - scripts/generate-webp.js: Sharp script generating 3 hero WebP variants (640w/1280w/1600w) and 3 parallax WebP files
  - public/images/*-640w.webp, *-1280w.webp, *-1600w.webp: Hero WebP srcset variants
  - public/images/Eo6Lpv5a2onA-*-1536x2048.webp: Parallax WebP for poem-section (Plan 30-02)
  - public/images/K9zNeD_*-1536x2048.webp: Parallax WebP for forest-section (Plan 30-02)
  - public/images/Gw-Ziugqo*-1536x2048.webp: Parallax WebP for ride-section (Plan 30-02)
  - HeroSection.astro updated with <picture> + WebP <source> srcset and JPEG <img> fallback
  - BaseLayout.astro with <link rel="preload" as="image"> with imagesrcset for LCP
affects:
  - 30-02-parallax-webp (consumes 3 parallax WebP files generated here)
  - future Lighthouse audits (eliminates "Serve images in next-gen formats" and "Properly size images" warnings)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "generate-webp.js: existsSync idempotency check before each Sharp conversion (matches project pattern from generate-thumbnails.js)"
    - "withoutEnlargement: true prevents Sharp from upscaling when requested size exceeds source"
    - "<picture> + <source type=image/webp> + <img> JPEG fallback pattern for modern format with graceful degradation"
    - "<link rel=preload as=image> with imagesrcset/imagesizes matching <picture> source exactly to avoid double-fetch"

key-files:
  created:
    - scripts/generate-webp.js
    - public/images/irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536-640w.webp
    - public/images/irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536-1280w.webp
    - public/images/irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536-1600w.webp
    - public/images/Eo6Lpv5a2onA-EMkS4BGrkQOHMQb4rwDbey7kfJDAZc-1536x2048.webp
    - public/images/K9zNeD_N2ikOKXNlKHc1dGUY7N6W3cGWVevoXlB49aI-1536x2048.webp
    - public/images/Gw-ZiugqoNyWNNMHZ-n65VcO7XjnipWnDWQz77mE2kQ-1536x2048.webp
  modified:
    - scripts/pipeline.js
    - src/components/HeroSection.astro
    - src/layouts/BaseLayout.astro

key-decisions:
  - "withoutEnlargement: true used for hero variants — source is 1600x1200 despite filename claiming 2048x1536, so 1600w variant caps at native resolution"
  - "Parallax images converted at native dimensions only (no resize) — Sharp webp({ quality: 80 }) only"
  - "preload href points to 1280w as middle-ground default for browsers lacking imagesrcset support"
  - "Hero <img> dimensions corrected to width=1600 height=1200 (actual) for accurate CLS prevention"
  - "class=hero-img stays on <img>, not <picture> — <picture> is transparent for layout"

patterns-established:
  - "WebP generation: separate script (generate-webp.js) registered in pipeline after copy-images"
  - "Preload imagesrcset must exactly match <picture> <source> srcset to avoid double-fetch"

# Metrics
duration: 5min
completed: 2026-04-06
---

# Phase 30 Plan 01: Image Optimization - Hero WebP Srcset and LCP Preload Summary

**Sharp script generating 6 WebP files (3 hero srcset variants at 640w/1280w/1600w + 3 parallax), hero <picture> element with WebP srcset and JPEG fallback, and <link rel="preload"> with imagesrcset in BaseLayout for LCP optimization**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-06T15:41:42Z
- **Completed:** 2026-04-06T15:43:34Z
- **Tasks:** 2
- **Files modified:** 3 (plus 6 WebP files generated)

## Accomplishments

- Created `scripts/generate-webp.js` — idempotent Sharp script generating all 6 WebP files in one pass; registered in pipeline.js after copy-images step
- Hero image now served as WebP at responsive sizes (640w/1280w/1600w) with `<picture>` element and JPEG `<img>` fallback for full browser compatibility
- LCP preload added to `<head>` via `<link rel="preload" as="image">` with `imagesrcset` exactly matching `<picture>` source to prevent double-fetch

## Task Commits

Each task was committed atomically:

1. **Task 1: Create generate-webp.js and add to pipeline** - `9bdae25` (feat)
2. **Task 2: Update HeroSection.astro and BaseLayout.astro** - `a0aac79` (feat)

## Files Created/Modified

- `scripts/generate-webp.js` - Sharp script generating hero WebP srcset (640w/1280w/1600w) and 3 parallax WebP conversions; existsSync idempotency check per file
- `scripts/pipeline.js` - Added generate-webp step after copy-images (index 7)
- `src/components/HeroSection.astro` - Replaced `<img>` with `<picture>` + WebP `<source>` srcset + JPEG `<img>` fallback; corrected dimensions to 1600x1200
- `src/layouts/BaseLayout.astro` - Added `<link rel="preload" as="image">` with imagesrcset/imagesizes/fetchpriority=high/type=image/webp
- `public/images/*-640w.webp` - Hero WebP variant 640x480
- `public/images/*-1280w.webp` - Hero WebP variant 1280x960
- `public/images/*-1600w.webp` - Hero WebP variant 1600x1200 (capped at source; withoutEnlargement)
- `public/images/Eo6Lpv5a2onA-*-1536x2048.webp` - Parallax WebP 1200x1600
- `public/images/K9zNeD_*-1536x2048.webp` - Parallax WebP 1200x1599
- `public/images/Gw-ZiugqoNyW*-1536x2048.webp` - Parallax WebP 1200x1600

## Decisions Made

- **withoutEnlargement for hero variants:** Source is 1600x1200 (filename claims 2048x1536). The 1600w variant outputs at true native resolution rather than failing or upscaling.
- **Parallax: convert only, no resize:** Parallax images are used as full-bleed CSS backgrounds; their native 1200x1600 dimensions are appropriate and resizing would reduce quality with no benefit.
- **Preload href=1280w:** Middle-ground fallback for browsers that don't support `imagesrcset`. These browsers fetch 1280w rather than the largest or smallest variant.
- **Corrected hero img dimensions:** `width="1600" height="1200"` instead of `width="2048" height="1536"` — the correct aspect ratio prevents layout shift (CLS) since the browser now reserves the right space before the image loads.
- **class stays on `<img>`:** CSS `.hero-img` targets the `<img>`, not the `<picture>` wrapper. The `<picture>` element is layout-transparent, so no CSS changes needed.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The hero source confirmed at 1600x1200 (as the plan forewarned despite the 2048x1536 filename), so `withoutEnlargement: true` worked as expected — the 1600w variant caps at 1600x1200 rather than attempting to upscale.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 30-02 (parallax WebP) can proceed immediately — all 3 parallax WebP files are already generated and waiting in `public/images/`
- Lighthouse "Serve images in next-gen formats" and "Properly size images" warnings for the hero should be eliminated
- Hero LCP preload is in place; browsers that support `imagesrcset` will fetch the size-appropriate WebP before parsing HeroSection.astro

---
*Phase: 30-image-optimization*
*Completed: 2026-04-06*
