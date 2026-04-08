---
phase: 45-sticky-nav
plan: 01
subsystem: ui
tags: [astro, intersection-observer, sticky-nav, scroll-spy, css]

requires:
  - phase: 44
    provides: completed UX polish milestone
provides:
  - StickyNav.astro component with 4 section links
  - Anchor IDs on all 4 target sections
  - Scroll-spy active-link highlighting
  - Stuck-state visual transition (shadow + background shift)
affects: [phase-46, phase-47]

tech-stack:
  added: []
  patterns: [IntersectionObserver for stuck detection (top:-1px trick), IntersectionObserver for scroll-spy with rootMargin offset]

key-files:
  created: [src/components/StickyNav.astro]
  modified: [src/pages/index.astro, src/components/HiawathaExplainer.astro, src/components/RouteExplainer.astro]

key-decisions:
  - "z-index: 100 on sticky nav (NOT 1000 — sector panel uses z-index 1000; collision must be avoided)"
  - "top: -1px on nav enables IntersectionObserver threshold:[1] stuck detection without sentinel DOM node"
  - "scroll-margin-top: 52px applied via :global() in index.astro to pierce child component scope"
  - "id placed directly on outermost <section> in each child component (not a wrapper in index.astro)"

patterns-established:
  - "Pattern: IntersectionObserver stuck detection via top:-1px + threshold:[1] — fires when nav leaves flow"
  - "Pattern: Scroll-spy via IntersectionObserver rootMargin `-navHeight -60% 0 0` — narrow active zone near viewport top"
  - "Pattern: :global() CSS in page-level index.astro to apply scroll-margin-top to child component sections"

duration: 2min
completed: 2026-04-07
---

# Phase 45 Plan 01: StickyNav Summary

**Sticky nav bar with 4 section links, IntersectionObserver stuck detection (top:-1px trick), scroll-spy active highlighting, and scroll-margin-top anchor offset — zero new dependencies, vanilla CSS+JS in one Astro component.**

## Performance
- **Duration:** 2 min
- **Started:** 2026-04-08T01:12:53Z
- **Completed:** 2026-04-08T01:15:02Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created `src/components/StickyNav.astro` with 4 nav links (History, Route, Gallery, Sectors)
- Sticky positioning using `position: sticky; top: -1px; z-index: 100`
- `.is-stuck` class toggled via IntersectionObserver `threshold:[1]` — triggers shadow and background darkening
- Scroll-spy active link highlighting via second IntersectionObserver with `rootMargin: -navHeightpx 0px -60% 0px`
- Default active link set to `history` on page load
- `prefers-reduced-motion` guard disables all transitions
- Added `id="history"` to `HiawathaExplainer.astro` outermost section
- Added `id="sectors"` to `RouteExplainer.astro` outermost section
- Added `id="gallery"` to Photos section in `index.astro`
- `#route` already existed on RouteMap section — no change needed
- Applied `scroll-margin-top: 52px` to all 4 anchor targets via `:global()` in index.astro
- Wired `<StickyNav />` immediately after `<HeroSection />` in index.astro
- Astro build completes successfully with no errors

## Task Commits
1. **Task 1: Create StickyNav.astro** - `d6b0ad1` (feat)
2. **Task 2: Add anchor IDs, scroll-margin-top, wire StickyNav** - `0513dd2` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `src/components/StickyNav.astro` — NEW: sticky nav component, stuck detection, scroll-spy, reduced-motion
- `src/pages/index.astro` — import StickyNav, place after HeroSection, add id="gallery", add scroll-margin-top :global() CSS
- `src/components/HiawathaExplainer.astro` — add id="history" to outermost `<section>`
- `src/components/RouteExplainer.astro` — add id="sectors" to outermost `<section>`

## Decisions Made
- **z-index: 100** — STATE.md carried this decision forward from research: sector panel uses z-index 1000. Research file code example incorrectly used 1000; plan spec correctly specifies 100. Followed plan.
- **top: -1px sentinel trick** — Preferred over separate sentinel DOM nodes (simpler, fewer nodes, same result).
- **rootMargin `-navHeight -60% 0 0`** — Narrow active zone near viewport top prevents premature section transitions.
- **id on component `<section>` directly** — Cleaner than wrapper divs in index.astro; consistent with existing `#route` pattern.
- **:global() for scroll-margin-top** — Required in Astro because `#history` and `#sectors` live in child components and Astro's scoped data-attribute would not match them without it.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None — build was clean on first run. The `grep -c 'href="#'` verification check returns 5 (not 4) because the JS querySelector `a[href="#${id}"]` template literal also matches, but there are exactly 4 actual HTML anchor link elements.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 45 Plan 01 is complete. The sticky nav is wired and building. Next step is visual/browser verification (manual review at 375px mobile width to confirm all 4 links fit inline without wrapping). Phase 46 and 47 can proceed independently of this.

---
*Phase: 45-sticky-nav*
*Completed: 2026-04-07*
