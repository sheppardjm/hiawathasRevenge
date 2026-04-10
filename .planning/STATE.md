# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-09)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.
**Current focus:** v1.11 Phase 51 -- Favicon & Icons

## Current Position

Phase: 51 of 53 (Favicon & Icons)
Plan: 01 of 01
Status: Phase complete
Last activity: 2026-04-10 — Completed 51-01-PLAN.md (favicon & icons)

Progress: [████░░░░░░░░░░░░░░░] 25% (v1.11)

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
**v1.9 Summary:** 1 plan, 1 phase, <1 day
**v1.10 Summary:** 1 plan, 1 phase, <1 day

## Accumulated Context

### Decisions

(Full decision log in PROJECT.md Key Decisions table)

**Phase 50-01 (Meta Tags & Structured Data):**
- og:locale uses underscore format `en_US` (not hyphen `en-US`)
- theme-color hardcoded as `#1a2e1a` — CSS custom properties don't work in content attribute
- Event startDate timezone is CDT (-05:00) for Michigan UP in June
- offers.isAccessibleForFree is boolean true (not string); offers.price is string "0" (not number)
- admin.astro canonical gap accepted as won't-fix (redirects to / in prod, never crawled)

**Phase 51-01 (Favicon & Icons):**
- favicon.svg uses CSS classes; generate-favicons.js uses inline fill attributes (sharp does not process `<style>` blocks reliably for rasterization)
- Icon link tag order: SVG → apple-touch-icon → ICO with sizes=32x32 (modern browsers prefer SVG; ICO is legacy fallback only)
- No dark-mode media query needed in favicon.svg — forest-green background (#1a2e1a) works on both light and dark tab bars
- to-ico ^1.1.5 added as devDependency for ICO encoding

### Pending Todos

None.

### Blockers/Concerns

- Ojibwe community consultation recommended (cultural sensitivity review)
- Project requires Node >=22.12.0 -- use Volta (`/Users/Sheppardjm/.volta/bin/node`)
- iOS Safari device testing deferred (requires physical device)

### Tech Debt

- RouteExplainer.astro line 128 comment says "7 cards = 600ms max" but there are now 8 cards (stale comment, info-level only)

## Session Continuity

Last session: 2026-04-10T00:36:15Z
Stopped at: Completed 51-01-PLAN.md — favicon & icons
Resume file: None
