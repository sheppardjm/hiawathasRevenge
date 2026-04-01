---
phase: 16-masonry-gallery
plan: 01
subsystem: ui
tags: [astro, tailwind, css-columns, masonry, photoswipe, lightbox]

# Dependency graph
requires:
  - phase: 15-editorial-content
    provides: PhotoGallery component and photos.json data already wired into page
  - phase: 13-hero
    provides: Hero photo selected (irrVhAXH...2048x1536.jpg) — also one of the 4 featured landscape photos

provides:
  - CSS columns masonry gallery with natural aspect ratios (GAL-01)
  - 4 featured landscape photos with column-span all treatment (GAL-02, GAL-05)
  - PhotoSwipe lightbox with click-to-open and left/right navigation (GAL-03)
  - Responsive 1/2/3-column layout (mobile/sm/lg) (GAL-04)
  - featured field propagated through photos-manifest.json → match-photos.js → photos.json

affects: [future gallery work, Phase 17+ if applicable]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS columns masonry (no JS, no flexbox, no grid) with break-inside-avoid per item"
    - "featured field propagated via spread conditional: ...(entry.featured ? { featured: true } : {})"
    - "column-span: all for full-width editorial moments in CSS columns layout"
    - "max-height: 60vh + object-fit: cover to prevent landscape photos dominating viewport"

key-files:
  created: []
  modified:
    - public/data/photos-manifest.json
    - scripts/match-photos.js
    - public/data/photos.json
    - src/components/PhotoGallery.astro

key-decisions:
  - "CSS columns layout (not grid or flex) — only masonry approach supported by CSS alone without JS"
  - "max-height: 60vh on featured-photo img — prevents landscape photos from dominating viewport vertically"
  - "Spread conditional for featured field — keeps JSON clean (field absent on non-featured entries)"
  - "data-cropped removed — thumbnails have natural aspect ratios so PhotoSwipe hint is now inaccurate"
  - "mb-3 on each item (not gap-y) — CSS columns gap-* only controls column-gap, not row spacing"

patterns-established:
  - "Featured photo: add featured: true to manifest → pipeline passes through → component applies column-span: all"
  - "CSS columns masonry: columns-1 sm:columns-2 lg:columns-3 + break-inside-avoid + mb-3 per item"

# Metrics
duration: 9min
completed: 2026-03-31
---

# Phase 16 Plan 01: Masonry Gallery Summary

**CSS columns masonry gallery replacing square-crop grid — 4 landscape photos span full-width via column-span: all, PhotoSwipe lightbox and map:photoClick bridge preserved intact**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-04-01T00:40:52Z
- **Completed:** 2026-04-01T00:49:33Z
- **Tasks:** 2 of 2
- **Files modified:** 4

## Accomplishments

- Added `featured: true` to 4 landscape (2048x1536) photos in `photos-manifest.json` and propagated field through `match-photos.js` pipeline to `photos.json`
- Rewrote `PhotoGallery.astro` from uniform square-crop grid (`grid-cols-2/3/4`, `aspect-square object-cover`) to CSS columns masonry (`columns-1 sm:columns-2 lg:columns-3`) with natural aspect ratios (`h-auto block`)
- Featured photos receive `column-span: all` treatment — full-width editorial moments with `max-height: 60vh` to keep landscape photos from overwhelming the viewport
- Removed `data-cropped="true"` (now inaccurate since thumbnails render at natural aspect ratio)
- PhotoSwipe lightbox init (`gallery: '#photo-gallery'`, `children: 'a'`) and `map:photoClick` bridge preserved byte-for-byte

## Task Commits

Each task was committed atomically:

1. **Task 1: Add featured field to data pipeline and regenerate photos.json** - `d29f25d` (feat)
2. **Task 2: Rewrite PhotoGallery.astro from grid to CSS columns masonry with featured treatment** - `83adc60` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `public/data/photos-manifest.json` - Added `featured: true` to 4 landscape (2048x1536) photos
- `scripts/match-photos.js` - Spread conditional passes `featured` field through to output
- `public/data/photos.json` - Regenerated with `featured` on 4 landscape photos (54 total unchanged)
- `src/components/PhotoGallery.astro` - Rewritten: CSS columns masonry, natural aspect ratios, featured treatment, `featured?: boolean` type

## Decisions Made

- **CSS columns layout (not grid or flex):** Only masonry approach achievable in CSS without JavaScript; `column-count` + `break-inside-avoid` per item is the standard solution
- **max-height: 60vh on featured-photo img:** Prevents landscape photos from dominating the viewport vertically while still filling the full column-span width
- **Spread conditional for featured:** `...(entry.featured ? { featured: true } : {})` keeps non-featured entries clean (no `featured: false` noise in JSON)
- **data-cropped removed:** Previous grid used `aspect-square object-cover` crops so `data-cropped="true"` was accurate. Masonry uses natural aspect ratios, so the hint is now inaccurate and was removed
- **mb-3 on each item (not gap-y on container):** CSS columns `gap-*` only sets column-gap; row spacing in a columns layout requires margin on individual items

## Deviations from Plan

None - plan executed exactly as written. Note: plan verification step 8 states `grep -c '"id":' public/data/photos.json` should return `52`, but actual count is 54 (consistent before and after — plan comment was outdated). No action taken; all 54 photos are correctly processed.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- v1.1 Visual Redesign is now complete (Phase 16 = final phase, GAL-01 through GAL-05 fulfilled)
- Gallery is visually ready for production — CSS columns masonry with featured landscape moments
- No blockers; build passes cleanly

---
*Phase: 16-masonry-gallery*
*Completed: 2026-03-31*
