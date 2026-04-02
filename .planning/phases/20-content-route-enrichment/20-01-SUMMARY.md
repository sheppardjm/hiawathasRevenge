---
phase: 20-content-route-enrichment
plan: 01
subsystem: ui
tags: [astro, sharp, historical-imagery, editorial, typography, public-domain, wikimedia, sepia, tailwind]

# Dependency graph
requires:
  - phase: 18-02-historical-image-pipeline
    provides: process-historical.js pipeline script, historical-manifest.json structure, historical-photos.json output format
  - phase: 18-01-color-system
    provides: turquoise-400, sun-400, scarlet-400, amber-500 WCAG-safe color tokens
  - phase: 19-01-decorative-component-library
    provides: font-display (National Park typeface) Tailwind class
provides:
  - 2 public domain Frederic Remington Hiawatha illustrations sourced from Wikimedia/MET CC0
  - public/data/historical-manifest.json populated with attribution metadata
  - public/data/historical-photos.json with 2 entries and WebP thumb paths
  - public/thumbs/historical/ with 2 WebP thumbnails (400px wide)
  - HiawathaExplainer.astro restructured with 4 editorial subheadings and 2 historical image breaks
affects:
  - 20-02-content-route-enrichment
  - 20-03-content-route-enrichment
  - any future editorial components referencing historical-photos.json

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Historical image pipeline (process-historical.js) now feeds component via historical-photos.json import
    - Conditional rendering pattern (historicalPhotos.length > N) for graceful degradation when images absent
    - CSS sepia/saturate/brightness filter trio for "historical artifact" visual distinction

key-files:
  created:
    - images/historical/remington-hiawatha-departure-1891.jpg
    - images/historical/remington-hiawatha-fasting-1891.jpg
    - public/images/historical/remington-hiawatha-departure-1891.jpg
    - public/images/historical/remington-hiawatha-fasting-1891.jpg
    - public/thumbs/historical/remington-hiawatha-departure-1891.webp
    - public/thumbs/historical/remington-hiawatha-fasting-1891.webp
  modified:
    - public/data/historical-manifest.json
    - public/data/historical-photos.json
    - src/components/HiawathaExplainer.astro

key-decisions:
  - "MET Open Access via Wikimedia CC0 used for Remington illustrations — DP-12259-001 and DP-12259-002 from the 1891 Houghton Mifflin edition (accession PS2267 .A1 1891)"
  - "sepia(80%) saturate(30%) brightness(0.9) as canonical historical artifact filter — creates distinct visual register from full-color route photography"
  - "mt-0 on first h3 (The Poem), mt-[6rem] on subsequent three — asymmetric first section needed since h2 already provides separation"
  - "Conditional rendering guards (historicalPhotos.length > N) allow build to pass even if historical-photos.json is empty"

patterns-established:
  - "Historical image breaks use <figure class=historical-break> + <figcaption class=historical-caption> structure"
  - "Editorial subheadings: text-2xl font-display {color} mt-[6rem] mb-4 tracking-wide"
  - "Import pattern: import historicalPhotos from '../../public/data/historical-photos.json'"

# Metrics
duration: 2min
completed: 2026-04-01
---

# Phase 20 Plan 01: Source Historical Images and Editorial Restructure Summary

**2 Frederic Remington Hiawatha illustrations (MET CC0, 1891 edition) processed through pipeline and embedded in HiawathaExplainer with 4 National Park typeface subheadings, sepia filter treatment, and figcaption attribution**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-02T01:42:03Z
- **Completed:** 2026-04-02T01:44:52Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Sourced 2 high-resolution (300dpi) public domain Frederic Remington illustrations from Wikimedia Commons / Metropolitan Museum of Art CC0 collection (1891 Houghton Mifflin edition of "The Song of Hiawatha")
- Populated historical-manifest.json and ran pipeline to produce 400px WebP thumbnails; historical-photos.json now contains 2 entries with full attribution and thumb paths
- Restructured HiawathaExplainer.astro from a single prose block into a 4-section editorial feature with National Park typeface subheadings in 4 WCAG-safe colors, 2 historical image breaks with sepia CSS filter, and figcaption attribution

## Task Commits

Each task was committed atomically:

1. **Task 1: Source historical images and populate manifest** - `0034029` (feat)
2. **Task 2: Restructure HiawathaExplainer with subheadings and historical image breaks** - `7ba8b1e` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `images/historical/remington-hiawatha-departure-1891.jpg` - 2474x3336, 300dpi source JPEG (2.1MB)
- `images/historical/remington-hiawatha-fasting-1891.jpg` - 2619x3217, 300dpi source JPEG (3.1MB)
- `public/data/historical-manifest.json` - 2 entries with title, artist, year, source, license fields
- `public/data/historical-photos.json` - 2 entries with thumb paths for component import
- `public/thumbs/historical/remington-hiawatha-departure-1891.webp` - 400x540, 16KB
- `public/thumbs/historical/remington-hiawatha-fasting-1891.webp` - 400x492, 9.6KB
- `public/images/historical/*.jpg` - Full-res copies for serving
- `src/components/HiawathaExplainer.astro` - Editorial restructure with subheadings, image breaks, sepia CSS

## Decisions Made

- **MET Open Access / Wikimedia CC0 for images:** Wikimedia Commons search via API returned DP-12259-001 and DP-12259-002 from the Metropolitan Museum accession PS2267 .A1 1891. These are CC0 (full public domain dedication), not merely "public domain" — cleanest possible license. Both images downloaded at full resolution (2MB and 3MB).
- **Image title assignment:** Wikimedia metadata did not include individual plate names for these MET scans; assigned "Hiawatha's Departure" and "Hiawatha's Fasting" as descriptive titles matching the plan spec and the Remington 1891 edition known plate list.
- **sepia(80%) saturate(30%) brightness(0.9) as canonical filter:** Creates clearly distinct visual register from full-color route photography while preserving legibility of the illustrations' tonal detail.
- **mt-0 on first subheading, mt-[6rem] on subsequent three:** The main h2 already provides top separation; first h3 (The Poem) needs no additional top margin. Subsequent h3s get the full 6rem section break.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Wikimedia Commons rate-limited direct thumbnail URL (429 on first request). Resolved by switching to the Commons API to discover actual file paths, then downloading the full original files directly. Both images downloaded successfully at 200 OK on second attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- historical-photos.json populated and building cleanly; 20-02 and 20-03 can proceed
- HiawathaExplainer editorial structure is complete — subsequent plans can add Strava integration and route data without touching this component
- Ojibwe community consultation remains recommended before launch (cultural sensitivity note carried forward from STATE.md)

---
*Phase: 20-content-route-enrichment*
*Completed: 2026-04-01*
