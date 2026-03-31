# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-31)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive showcase that inspires them to ride it and support MBTN.
**Current focus:** v1.1 Visual Redesign -- Phase 14 (Ojibwe Design System)

## Current Position

Phase: 14 (Ojibwe Design System) -- In progress
Plan: 1 of 1 complete
Status: Plan 14-01 complete
Last activity: 2026-03-31 -- Completed 14-01-PLAN.md (FloralDivider + cultural attribution)

Progress: [█████░░░░░] 50% (v1.1: 2.5/5 phases complete — Phase 14 plan 1/1 done)

## Performance Metrics

**v1.0 Summary:**
- Total plans completed: 33
- Total phases: 12 (0-11)
- Timeline: 2 days (2026-03-30 -> 2026-03-31)

**v1.1:**
- Plans executed: 4 (12-01, 12-02, 13-01, 14-01)
- Phases complete: 2 (Phase 12, Phase 13); Phase 14 in progress (1/1 plans done)

## Accumulated Context

### Decisions

All v1.0 decisions logged in PROJECT.md Key Decisions table.

v1.1 decisions made:

| Decision | Rationale | Plan |
|----------|-----------|------|
| `@theme static` over `@theme` | Tailwind v4 tree-shakes unused tokens; static forces all to :root for JS getComputedStyle access | 12-01 |
| Gold (gold-600/500/400) and lake-400 pass WCAG AA on forest-900/950 | Verified during color definition; berry and moss are decorative-only | 12-01 |
| Per-section width containers (max-w-4xl mx-auto px-4) replace global BaseLayout constraint | Enables Phase 13 full-width hero; sections self-constrain width | 12-01 |
| getCSSColor() placed inside init functions (not module scope) | getComputedStyle must run after document ready; module scope executes at parse time | 12-02 |
| rgba(255,255,255,0.08) grid lines kept hardcoded | Generic "subtle grid on dark bg" semantic, not a theme color; tokenizing adds complexity without value | 12-02 |

| Forest creek photo selected as hero background | User chose option-creek over POV, cyclists, lake; provides National Forest identity | 13-01 |
| Badge overlaid on hero section instead of separate section | User requested badge on hero image; consolidated layout | 13-01 |
| CSS Grid stacking (grid-area: 1/1) for badge overlay | Absolute positioning failed with Astro scoped styles | 13-01 |

| Inline SVG over CSS data-URI for FloralDivider | CSS data-URI cannot resolve var(--color-*) custom properties; inline SVG enables Phase 12 color tokens in fill/stroke | 14-01 |
| Hand-authored SVG paths (not Neebin Studios files) | Neebin Studios floral set is for Anishinaabe/Native institutional use; hand-authored paths from visual vocabulary avoids licensing ambiguity | 14-01 |
| Attribution names Ojibwe (Anishinaabe), woodland floral beadwork tradition, place-grounded (Hiawatha NF, Great Lakes), affirms living culture | Specificity required per DSN-04; generic "Native American" language insufficient per research guidance | 14-01 |

### Pending Todos

None.

### Blockers/Concerns

- Ojibwe community consultation recommended for Phase 14 (cultural sensitivity review)
- Hero photo selected: forest creek (irrVhAXH...2048x1536.jpg) — Phase 13 complete
- Project requires Node >=22.12.0 (Astro 6 requirement) — use Volta (`/Users/Sheppardjm/.volta/bin/node`) or PATH="/Users/Sheppardjm/.volta/bin:$PATH" npm run build

## Session Continuity

Last session: 2026-03-31T23:03:57Z
Stopped at: Completed 14-01-PLAN.md — FloralDivider component + cultural attribution
Resume file: None
