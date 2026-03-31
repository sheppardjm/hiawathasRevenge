# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-31)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive showcase that inspires them to ride it and support MBTN.
**Current focus:** v1.1 Visual Redesign -- Phase 13 (Hero & Event Date)

## Current Position

Phase: 12 (Design Foundation) -- COMPLETE
Plan: All plans complete (2/2)
Status: Phase verified and complete
Last activity: 2026-03-31 -- Phase 12 verified (3/3 must-haves passed)

Progress: [██░░░░░░░░] 20% (v1.1: 1/5 phases complete)

## Performance Metrics

**v1.0 Summary:**
- Total plans completed: 33
- Total phases: 12 (0-11)
- Timeline: 2 days (2026-03-30 -> 2026-03-31)

**v1.1:**
- Plans executed: 2 (12-01, 12-02)
- Phases complete: 1 (Phase 12)

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

v1.1 decisions pending:
- Hero photo selection needed before Phase 13 implementation

### Pending Todos

None.

### Blockers/Concerns

- Ojibwe community consultation recommended for Phase 14 (cultural sensitivity review)
- Hero photo must be selected from 54-photo library before Phase 13
- Project requires Node >=22.12.0 (Astro 6 requirement) — use Volta (`/Users/Sheppardjm/.volta/bin/node`) or PATH="/Users/Sheppardjm/.volta/bin:$PATH" npm run build

## Session Continuity

Last session: 2026-03-31
Stopped at: Phase 12 complete, ready for Phase 13
Resume file: None
