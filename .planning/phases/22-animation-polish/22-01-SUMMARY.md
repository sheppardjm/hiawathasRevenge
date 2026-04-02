---
phase: 22-animation-polish
plan: 01
subsystem: ui
tags: [astro, scroll-animation, intersection-observer, css-transitions, accessibility, reduced-motion]

# Dependency graph
requires:
  - phase: 21-section-color-differentiation
    provides: section structure with bg-forest-800/950 backgrounds and AnimatedDivider placements
provides:
  - ScrollReveal.astro: global IntersectionObserver-based scroll reveal system
  - data-reveal attributes wired to 9 below-fold sections
  - Segment card stagger CSS with nth-child 100ms delays in RouteExplainer
  - prefers-reduced-motion safe: all animations skipped in reduced-motion mode
affects:
  - 22-02 (any further animation polish builds on this reveal foundation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "data-reveal attribute pattern for scroll-triggered section reveal"
    - "Single shared IntersectionObserver for all [data-reveal] targets (not one per element)"
    - "Above-fold guard: getBoundingClientRect().top < window.innerHeight adds is-visible immediately"
    - "One-shot unobserve: obs.unobserve() prevents re-triggering on scroll-back"
    - "CSS + JS dual-layer reduced-motion: CSS shows content statically, JS skips observer entirely"
    - "nth-child transition-delay stagger pattern for sequential card reveals"

key-files:
  created:
    - src/components/ScrollReveal.astro
  modified:
    - src/pages/index.astro
    - src/components/HiawathaExplainer.astro
    - src/components/RouteExplainer.astro

key-decisions:
  - "threshold 0.15 (not 0.3) for section reveals because tall sections may never reach 30% visible on mobile"
  - "ScrollReveal component has empty template (no HTML) — encapsulates CSS and JS only"
  - "Segment card stagger uses CSS nth-child pattern rather than JS, keeping JS minimal"
  - "AnimatedDividers excluded from data-reveal — they have their own IntersectionObserver"

patterns-established:
  - "data-reveal + is-visible: the v1.2 scroll reveal protocol — attribute on element, class added by observer"
  - "ScrollReveal.astro rendered as last child before </BaseLayout> to ensure all [data-reveal] elements are in DOM"
  - "Stagger via .parent-section.is-visible .child CSS selector — parent reveal triggers children"

# Metrics
duration: 2min
completed: 2026-04-02
---

# Phase 22 Plan 01: Scroll Reveal System Summary

**IntersectionObserver-based scroll reveal with opacity+translateY(24px) transitions on 9 below-fold sections, and 100ms nth-child stagger on 7 RouteExplainer segment cards**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-02T10:13:33Z
- **Completed:** 2026-04-02T10:15:43Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- Created ScrollReveal.astro with global CSS (hidden/visible states, reduced-motion override) and shared IntersectionObserver JS with above-fold guard and one-shot unobserve
- Wired data-reveal to 9 sections: HiawathaExplainer, RouteExplainer, RouteStats, GPX Download, Route Map, Elevation Profile, Photos, Support the Trail, Credits
- Added segment card stagger CSS in RouteExplainer.astro — nth-child transition-delay 0-600ms, triggered when parent section receives is-visible
- All animations fully skip for prefers-reduced-motion: reduce users (CSS shows content statically, JS never sets up observer)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ScrollReveal.astro component** - `35b1a32` (feat)
2. **Task 2: Wire data-reveal attributes and segment card stagger CSS** - `e15beed` (feat)

## Files Created/Modified
- `src/components/ScrollReveal.astro` - Global CSS and IntersectionObserver JS for scroll reveal system
- `src/pages/index.astro` - Added ScrollReveal import/render; data-reveal on 7 inline sections
- `src/components/HiawathaExplainer.astro` - data-reveal added to hiawatha-section element
- `src/components/RouteExplainer.astro` - data-reveal on route-explainer-section; segment card stagger CSS

## Decisions Made
- threshold 0.15 (not 0.3) for section reveals — tall sections on mobile may never reach 30% visible
- ScrollReveal.astro has empty HTML template — no markup, only `<style is:global>` and `<script>` blocks
- Segment card stagger uses CSS nth-child approach (not JS) keeping animation logic declarative
- AnimatedDividers explicitly excluded — they manage their own IntersectionObserver per instance
- data-reveal added inside component files (HiawathaExplainer, RouteExplainer) rather than wrapping in index.astro — keeps observer targeting the actual section element

## Deviations from Plan

None - plan executed exactly as written.

The verify step noted `grep -c "transition-delay"` should return 7, but the plan's own CSS includes 8 occurrences (7 nth-child rules + 1 in reduced-motion block). Implementation matches the specified CSS exactly.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Scroll reveal foundation complete for Phase 22
- data-reveal protocol established and documented in patterns
- AnimatedDivider boundary (has own observer, no data-reveal) preserved
- Ready for 22-02 (additional animation polish if planned)

---
*Phase: 22-animation-polish*
*Completed: 2026-04-02*
