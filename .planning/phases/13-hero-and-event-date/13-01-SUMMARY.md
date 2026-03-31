---
phase: 13-hero-and-event-date
plan: 01
subsystem: ui
tags: [astro, hero, lcp, css-grid, svg]

requires:
  - phase: 12-design-foundation
    provides: Color tokens (amber, gold, cream, forest families) and layout restructure (per-section width)
provides:
  - Full-viewport hero section with LCP-optimized background photo
  - Badge overlaid on hero via CSS Grid stacking
  - Event date with semantic <time> element
affects: [14-ojibwe-design-system, 15-editorial-content]

tech-stack:
  added: []
  patterns: [CSS Grid overlay for badge-on-image stacking, fluid clamp() typography]

key-files:
  created: [src/components/HeroSection.astro]
  modified: [src/pages/index.astro]

key-decisions:
  - "option-creek photo selected (forest creek with autumn reflections) over POV, cyclists, and lake options"
  - "Badge moved into hero section as centered overlay per user feedback"
  - "CSS Grid stacking (grid-area: 1/1) used instead of absolute positioning for badge inner content — more reliable with Astro scoped styles"
  - "Badge sized 240px mobile / 340px desktop to not dominate hero"

patterns-established:
  - "CSS Grid overlay: use grid-area: 1/1 to stack elements in Astro components instead of absolute positioning"

duration: ~15min
completed: 2026-03-31
---

# Phase 13-01: Hero Section Summary

**Full-viewport hero with forest creek photo, shield badge overlay, and event date using CSS Grid stacking**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3 (1 decision checkpoint, 1 auto, 1 visual verification)
- **Files modified:** 2

## Accomplishments
- Full-viewport hero section with LCP-optimized forest creek photo as background
- Shield badge overlaid on hero using CSS Grid stacking with fluid sizing
- Event date "June 6, 2026" visible without scrolling on all breakpoints
- Gradient overlay ensures text readability (forest-950, 0.85→0.1 opacity)
- Badge removed from separate section, consolidated into hero

## Task Commits

1. **Task 1: Select hero photo** — decision checkpoint (option-creek selected)
2. **Task 2: Create HeroSection.astro and wire into index.astro** — `76d2d6d` (feat)
3. **Task 3: Visual verification** — approved after fixes

**Correction commits:**
- `7f43c08` — fix: swap hero photo from cyclists to forest creek per user feedback
- `3db48f3` — feat: move badge into hero section as overlay per user feedback
- `d105bb7` — fix: CSS Grid stacking for badge overlay, reduce badge size

## Files Created/Modified
- `src/components/HeroSection.astro` — New hero component with photo bg, gradient overlay, badge, tagline, event date
- `src/pages/index.astro` — Removed badge section (now in hero), added HeroSection import

## Decisions Made
- Forest creek photo chosen over handlebar POV (plan recommendation), cyclists (user rejected), and lake panorama
- Badge integrated into hero instead of remaining as separate section below
- CSS Grid stacking pattern adopted for reliable overlay in Astro scoped styles

## Deviations from Plan

### User-Requested Changes

**1. Hero photo changed from cyclists to forest creek**
- User rejected cyclists photo ("that's a bad photo"), selected forest creek instead
- No structural impact

**2. Badge moved into hero section**
- Plan specified badge as separate section below hero; user requested badge overlay on hero
- Required restructuring hero-content layout from bottom-anchored text to centered badge + bottom text
- Badge styles moved from index.astro to HeroSection.astro

**3. CSS Grid stacking instead of absolute positioning**
- Absolute positioning for badge inner content failed with Astro scoped styles
- Switched to CSS Grid (grid-area: 1/1) stacking pattern — works reliably

---

**Total deviations:** 3 (all user-requested or technical fixes)
**Impact on plan:** Layout restructured per user vision. No scope creep.

## Issues Encountered
- Absolute positioning for badge-inner failed in Astro scoped styles — resolved with CSS Grid stacking

## Next Phase Readiness
- Hero section complete, ready for Phase 14 (Ojibwe Design System)
- Color tokens from Phase 12 used throughout (amber-500, gold-500, cream-100/200, forest-950)

---
*Phase: 13-hero-and-event-date*
*Completed: 2026-03-31*
