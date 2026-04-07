---
phase: 36-downloads-deep-linking-hero-video
plan: 02
subsystem: ui
tags: [astro, video, hero, autoplay, reduced-motion, css, accessibility]

# Dependency graph
requires:
  - phase: 36-downloads-deep-linking-hero-video
    provides: hero section with existing image/poster infrastructure
provides:
  - Looping background video in hero section with image fallback
  - CSS reduced-motion support (display: none on .hero-video)
  - JS dynamic reduced-motion listener for preference changes at runtime
  - Video served as static asset from public/
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Background video via <video autoplay muted loop playsinline> with poster= pointing to existing hero image"
    - "CSS display:none under prefers-reduced-motion prevents download and playback"
    - "JS matchMedia listener handles dynamic preference changes at runtime"

key-files:
  created:
    - public/Stationary_Hero_Video_With_Motion.mp4
  modified:
    - src/components/HeroSection.astro

key-decisions:
  - "CSS display:none for reduced-motion (not just JS pause) prevents browser from downloading video at all"
  - "Video placed after <picture> in DOM -- both absolutely positioned, video renders on top via stacking order without needing higher z-index"
  - ".catch(()=>{}) on heroVideo.play() prevents unhandled promise rejection if browser refuses autoplay"

patterns-established:
  - "Hero video: <video autoplay muted loop playsinline poster='/images/...'> immediately after </picture>"

# Metrics
duration: checkpoint approval flow
completed: 2026-04-06
---

# Phase 36 Plan 02: Hero Background Video Summary

**Looping MP4 background video added to hero section with image poster/fallback, object-fit cover layout, and CSS + JS prefers-reduced-motion support**

## Performance

- **Duration:** Checkpoint approval flow (Task 1 + visual verify)
- **Started:** 2026-04-06
- **Completed:** 2026-04-06
- **Tasks:** 2 (1 auto + 1 checkpoint:human-verify)
- **Files modified:** 2

## Accomplishments
- Hero section plays looping MP4 video behind badge, tagline, and date with `autoplay muted loop playsinline` attributes for cross-browser compatibility including iOS Safari
- Existing hero JPG serves as poster frame and fallback when video cannot play
- CSS `display: none` under `prefers-reduced-motion: reduce` prevents video download and playback for users who prefer reduced motion
- JS `matchMedia` listener handles dynamic OS preference changes at runtime without page reload
- Video served as static asset from `public/` (bypasses Astro asset pipeline, appropriate for large binary files)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add background video to hero section with fallback and reduced-motion** - `0fcec9c` (feat)
2. **Task 2: checkpoint:human-verify** - approved by user (no commit)

**Plan metadata:** (this commit) (docs: complete hero video plan)

## Files Created/Modified
- `public/Stationary_Hero_Video_With_Motion.mp4` - Hero background video served as static asset (~7.1 MB)
- `src/components/HeroSection.astro` - Added `<video>` element, `.hero-video` CSS, reduced-motion media query, JS runtime listener

## Decisions Made
- CSS `display: none` for reduced-motion preferred over JS-only pause — prevents browser from downloading video entirely, no JS dependency
- Video placed immediately after `</picture>` (same absolute-positioned layer stack) — renders on top of image via DOM order without needing a higher z-index
- `.catch(() => {})` on `heroVideo.play()` prevents unhandled promise rejection if browser refuses autoplay on dynamic preference change

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 36 is now fully complete (plans 36-01 and 36-02 both done)
- v1.5 Multi-Route Support milestone complete
- Hero section has immersive video with accessible fallback
- Outstanding items for future phases: iOS Safari device testing, Ojibwe community consultation, deployment URL update in astro.config.ts

---
*Phase: 36-downloads-deep-linking-hero-video*
*Completed: 2026-04-06*
