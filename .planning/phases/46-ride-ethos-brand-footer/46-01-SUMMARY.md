---
phase: 46-ride-ethos-brand-footer
plan: 01
subsystem: ui
tags: [astro, css, static-assets, accessibility, cls-prevention]

# Dependency graph
requires:
  - phase: 45-sticky-nav
    provides: StickyNav component and placement anchor in index.astro

provides:
  - RideEthos.astro — four-item declarative kicker section (Since 2014, Always Free, Fellowship, All Levels)
  - NeucadiaFooter.astro — "Powered by Neucadia" body-level footer with local logo
  - public/images/neucadia-logo.png — local copy of Neucadia wordmark (283x42 RGBA PNG)
  - index.astro updated — RideEthos placed between StickyNav and gold-section
  - BaseLayout.astro updated — NeucadiaFooter placed after </main> as body-level footer

affects:
  - 47-hiawatha-section-light-mode (layout structure — NeucadiaFooter is now outside main)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Kicker/stat layout: use <span> elements with class-based styling instead of heading elements to avoid inheriting global text-shadow styles"
    - "CLS prevention: explicit width/height HTML attributes on <img> reserve browser layout space before image loads"
    - "External links: always pair target=_blank with rel=noopener noreferrer (project convention from DonateCallout)"
    - "Body-level footer: NeucadiaFooter placed after </main> not inside it — brand attribution is not main content"

key-files:
  created:
    - src/components/RideEthos.astro
    - src/components/NeucadiaFooter.astro
    - public/images/neucadia-logo.png
  modified:
    - src/pages/index.astro
    - src/layouts/BaseLayout.astro

key-decisions:
  - "NeucadiaFooter placed after </main> in BaseLayout (not inside main) for semantic correctness — <footer> as body-level landmark"
  - "RideEthos uses <span> elements for display values to avoid global h1-h4 text-shadow inheritance"
  - "Logo displayed at 142x21 (50% of native 283x42) with explicit dimensions for CLS prevention"
  - "No data-reveal on RideEthos — near top of page, always visible"

patterns-established:
  - "Kicker block: <ul class='ethos-list'> with flex wrap + <span> for value/label pairs"
  - "Footer brand attribution: body-level <footer> after </main>, not inside main content"

# Metrics
duration: 8min
completed: 2026-04-07
---

# Phase 46 Plan 01: Ride Ethos + Brand Footer Summary

**RideEthos kicker section (4 items, display font + amber-500) and NeucadiaFooter (local PNG logo, body-level footer) built and wired into index.astro and BaseLayout.astro**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-08T01:46:04Z
- **Completed:** 2026-04-08T01:54:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Built RideEthos.astro with four declarative kicker items using --font-display at --font-size-2xl and --color-amber-500, no heading elements (avoids text-shadow inheritance), no data-reveal
- Built NeucadiaFooter.astro with local /images/neucadia-logo.png at 142x21 display size (50% of native 283x42) with explicit width/height for CLS prevention, neucadia.com link with noopener noreferrer, and prefers-reduced-motion guard
- Downloaded neucadia-logo.png (283x42 RGBA PNG, 5.1KB) from neucadia.com/assets/neucadia_logo.png to public/images/
- Wired RideEthos between StickyNav and gold-section in index.astro; wired NeucadiaFooter after </main> in BaseLayout.astro as semantic body-level footer landmark
- Astro build confirmed successful (2 pages built, no errors)

## Task Commits

Each task was committed atomically:

1. **Task 1: Download Neucadia logo and create RideEthos + NeucadiaFooter components** - `cde8672` (feat)
2. **Task 2: Wire RideEthos into index.astro and NeucadiaFooter into BaseLayout.astro** - `96e54db` (feat)

**Plan metadata:** _(pending docs commit)_

## Files Created/Modified

- `src/components/RideEthos.astro` — Four-item declarative ethos section with display font kicker values and mono font labels
- `src/components/NeucadiaFooter.astro` — "Powered by Neucadia" footer with local logo, CLS-safe dimensions, external link safety
- `public/images/neucadia-logo.png` — Local Neucadia wordmark logo (283x42 RGBA PNG, dark-background design)
- `src/pages/index.astro` — Added RideEthos import and placement between StickyNav and gold-section
- `src/layouts/BaseLayout.astro` — Added NeucadiaFooter import and placement after </main> as body-level footer

## Decisions Made

- **NeucadiaFooter placed after `</main>` (not inside):** Semantic HTML — brand attribution is not main content. The `<footer>` root element in NeucadiaFooter.astro becomes a proper body-level landmark for screen reader navigation.
- **`<span>` elements for ethos values (not `<h2>`/`<h3>`):** Global CSS in `@layer base` applies `text-shadow: var(--shadow-text)` to heading elements. Using `<span>` with explicit class-based styling avoids inheriting that shadow on the kicker values.
- **Logo displayed at 142x21 (50% scale):** Native PNG is 283x42; 50% scale gives crisp 1x rendering while keeping the footer line compact.
- **No `data-reveal` on RideEthos:** Near the top of the page — adding data-reveal would start it invisible and require scroll to trigger, which is unwanted for above-the-fold-adjacent content.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- RideEthos and NeucadiaFooter fully functional; page structure updated
- Phase 47 (Hiawatha Section Light Mode) can proceed — NeucadiaFooter is now a body-level sibling to `<main>`, not inside it
- No blockers

---
*Phase: 46-ride-ethos-brand-footer*
*Completed: 2026-04-07*
