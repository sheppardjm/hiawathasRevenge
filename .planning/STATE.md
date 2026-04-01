# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-31)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive showcase that inspires them to ride it and support MBTN.
**Current focus:** v1.1 Tech Debt Closure (Phase 17) -- COMPLETE

## Current Position

Phase: 17 (Tech Debt and Photo Cleanup) -- Complete
Plan: 1 of 1 complete
Status: Phase 17 complete — v1.1 fully closed
Last activity: 2026-03-31 -- Completed 17-01-PLAN.md (Tech Debt and Photo Cleanup)

Progress: [██████████] 100% (v1.1: 6/6 phases, Phase 17 done)

## Performance Metrics

**v1.0 Summary:**
- Total plans completed: 33
- Total phases: 12 (0-11)
- Timeline: 2 days (2026-03-30 -> 2026-03-31)

**v1.1:**
- Plans executed: 8 (12-01, 12-02, 13-01, 14-01, 15-01, 15-02, 16-01, 17-01)
- Phases complete: 6 (Phase 12, Phase 13, Phase 14, Phase 15, Phase 16, Phase 17)

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

| No float/shape-outside in HiawathaExplainer | Plan marks float as optional; no contextual image available for narrative; blockquote provides visual break | 15-01 |
| data.md quote styled as displayed blockquote | Scholarly critique reads as cited source with visual separation; not buried inline | 15-01 |
| SVG data URI hardcodes hex %233d6b3d (not CSS var) | CSS custom properties cannot resolve inside background-image data URIs; must hardcode hex | 15-02 |
| no-photo class overrides nth-child alternation at tablet+ | Without override, 520 segment (no photos) produces empty first column in 2-col grid | 15-02 |
| Photos mapped to segments by mile range filter | p.mile >= startMi && p.mile < endMi; deterministic given photos are already geo-tagged | 15-02 |

| CSS columns layout (not grid or flex) for masonry | Only masonry approach achievable in CSS without JavaScript; column-count + break-inside-avoid is standard | 16-01 |
| max-height: 60vh on featured-photo img | Prevents landscape photos from dominating viewport vertically while filling full column-span width | 16-01 |
| Spread conditional for featured field in match-photos.js | Keeps JSON clean — field absent on non-featured entries (no featured: false noise) | 16-01 |
| data-cropped removed from PhotoGallery anchors | Previous grid used aspect-square object-cover crops so hint was accurate; masonry uses natural aspect ratios so hint is now inaccurate | 16-01 |
| mb-3 on each item (not gap-y on container) | CSS columns gap-* only sets column-gap; row spacing in columns layout requires margin on individual items | 16-01 |

| Dead .topo-divider rule removed entirely (not commented) | Never referenced in any component; commenting out dead code preserves confusion without benefit | 17-01 |
| WCAG comments must specify ratio and text-size applicability | gold-600 was incorrectly described as AA normal text; actual ratio 4.45:1 only passes AA large text | 17-01 |
| photos-manifest.json is canonical source; pipeline regenerates photos.json | Edit manifest, run pipeline — photos.json is never hand-edited | 17-01 |

### Pending Todos

None.

### Blockers/Concerns

- Ojibwe community consultation recommended for Phase 14 (cultural sensitivity review)
- Hero photo selected: forest creek (irrVhAXH...2048x1536.jpg) — Phase 13 complete
- Project requires Node >=22.12.0 (Astro 6 requirement) — use Volta (`/Users/Sheppardjm/.volta/bin/node`) or PATH="/Users/Sheppardjm/.volta/bin:$PATH" npm run build

## Session Continuity

Last session: 2026-03-31
Stopped at: Completed 17-01-PLAN.md (Tech Debt and Photo Cleanup — v1.1 fully closed)
Resume file: None
