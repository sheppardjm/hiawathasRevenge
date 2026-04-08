# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-07)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.
**Current focus:** v1.8 Navigation & Identity — Milestone complete

## Current Position

Phase: 47 of 47 (History Light/Dark Mode)
Plan: 3 of 3 in current phase
Status: Milestone complete
Last activity: 2026-04-08 — Phase 47 gap closure complete (plans 47-02, 47-03 shipped)

Progress: [████████████████████] 100% (v1.8, all phases complete)

## Performance Metrics

**v1.0 Summary:** 33 plans, 12 phases, 2 days
**v1.1 Summary:** 8 plans, 6 phases, 1 day
**v1.2 Summary:** 17 plans, 5 phases + gaps, 2 days
**v1.3 Summary:** 9 plans, 5 phases, 3 days
**v1.4 Summary:** 7 plans, 5 phases, 7 days
**v1.5 Summary:** 10 plans, 5 phases, 1 day
**v1.6 Summary:** 2 plans, 2 phases, <1 day
**v1.7 Summary:** 6 plans, 5 phases, 1 day
**v1.8 Summary:** 5 plans, 3 phases, 2 days

## Accumulated Context

### Decisions

(Full decision log in PROJECT.md Key Decisions table)

- [v1.8 Phase 45]: Nav z-index set to 100 (sector panel is z-index 1000 — must not collide)
- [v1.8 Phase 45]: scroll-margin-top uses :global() in index.astro to pierce Astro scoped styles on child components
- [v1.8 Phase 45]: StickyNav uses top: -1px + IntersectionObserver threshold:[1] for stuck detection (no sentinel DOM node)
- [v1.8 Phase 47]: Light-mode CSS scoped to .hiawatha-section only — global @theme static tokens must not be overridden
- [v1.8 Phase 47]: ::before main rule inserted BEFORE prefers-reduced-motion block so cascade override works correctly
- [v1.8 Phase 47]: Light-mode @media block placed LAST in style tag (after responsive breakpoints) so source order wins at equal specificity
- [v1.8 Phase 47]: CSS full-bleed breakout (width:100vw + translateX) on ::before to escape max-w-5xl container
- [v1.8 Phase 47]: Option A selected for inspiration backgrounds: Ojibwe motifs grid, bogcore nature pattern, native profile silhouette
- [v1.8 Phase 46]: NeucadiaFooter placed after </main> in BaseLayout (not inside main) — body-level <footer> landmark
- [v1.8 Phase 46]: RideEthos uses <span> elements not headings — avoids global text-shadow inheritance on h1-h4
- [v1.8 Phase 46]: No data-reveal on RideEthos — near top of page, must be always visible

### Pending Todos

None.

### Blockers/Concerns

- Ojibwe community consultation recommended (cultural sensitivity review)
- Project requires Node >=22.12.0 -- use Volta (`/Users/Sheppardjm/.volta/bin/node`)
- iOS Safari device testing deferred (requires physical device)
- Elevation gains for 100k (~1,616 ft) and 50k (~809 ft) unverified against Strava/Garmin reference recordings

### Tech Debt

None.

## Session Continuity

Last session: 2026-04-08
Stopped at: v1.8 milestone complete — Phase 47 gap closure done, all 3 phases verified
Resume file: None
