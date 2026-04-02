---
phase: 26-editorial-polish
plan: "02"
subsystem: ui
tags: [astro, svg, typography, intersection-observer, eb-garamond, cultural-motifs, css-animation]

# Dependency graph
requires:
  - phase: 26-01
    provides: section spacing, stats legibility, photo skeleton loaders
provides:
  - EB Garamond serif font loaded via Astro Font API with --font-garamond CSS variable
  - Drop-cap ::first-letter rules updated to use Garamond (visually distinct from National Park)
  - Pull quote font-size increased to font-size-2xl (desktop) / font-size-xl (mobile)
  - hiawatha-section ::before background image fades in/out with IntersectionObserver
  - prefers-reduced-motion: static 4% background, no transition
  - OjibweBorderPattern.astro — repeating beadwork diamond border SVG
  - WaterWavePattern.astro — three-layer Anishinaabe wave accent SVG
  - TurtleMotif.astro — geometric Turtle Island motif SVG (currentColor, size prop)
  - All three motifs integrated at distinct page locations in index.astro
affects: [any future phase touching HiawathaExplainer typography, index.astro layout, cultural motif system]

# Tech tracking
tech-stack:
  added: [EB Garamond (Google Fonts via Astro Font API), IntersectionObserver (browser native)]
  patterns:
    - "Background image fade via ::before pseudo-element + .bg-visible class toggle (bidirectional IntersectionObserver)"
    - "Cultural motif components: inline SVG, aria-hidden=true, role=presentation, focusable=false, --color-* tokens, currentColor for color inheritance"
    - "Pull quote size: font-size-2xl desktop / font-size-xl mobile"

key-files:
  created:
    - src/components/OjibweBorderPattern.astro
    - src/components/WaterWavePattern.astro
    - src/components/TurtleMotif.astro
  modified:
    - astro.config.ts
    - src/components/HiawathaExplainer.astro
    - src/pages/index.astro

key-decisions:
  - "Background image uses full JPG (no thumbnail directory exists) — at 6% opacity performance is acceptable"
  - "Bidirectional IntersectionObserver (classList.toggle) not one-shot (unobserve) for fade in/out on scroll"
  - "prefers-reduced-motion: static 4% opacity (always visible, no animation) vs animated 6%"
  - "TurtleMotif uses currentColor for color inheritance, allowing Tailwind text-* class theming"
  - "OjibweBorderPattern wraps SVG in div for max-w-4xl centering (matches FloralDivider pattern)"

patterns-established:
  - "Cultural motif SVG components: all use aria-hidden=true + role=presentation + focusable=false"
  - "Background fade: ::before pseudo-element, threshold 0.1, bidirectional toggle (not ScrollReveal's one-shot)"

# Metrics
duration: 4min
completed: 2026-04-02
---

# Phase 26 Plan 02: Editorial Typography and Cultural Motifs Summary

**EB Garamond drop-caps and larger pull quotes deliver editorial serif richness; scroll-driven background fade and three new geometric Native American SVG motifs complete the v1.3 cultural polish**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-02T21:30:51Z
- **Completed:** 2026-04-02T21:34:23Z
- **Tasks:** 2
- **Files modified:** 6 (2 modified, 4 created)

## Accomplishments
- EB Garamond serif loaded via Astro Font API (`--font-garamond`), replacing `--font-display` in drop-cap and pull-quote `::first-letter` rules — visually distinct from National Park sans-serif body text
- Pull quote font-size upgraded from `font-size-xl` (1.25rem) to `font-size-2xl` (1.5rem) on desktop, `font-size-xl` on mobile — now clearly larger than body text
- `hiawatha-section::before` background image fades from 0% to 6% opacity when section scrolls into view, fades back out when scrolled past; prefers-reduced-motion users see static 4%
- Three new cultural motif components (OjibweBorderPattern, WaterWavePattern, TurtleMotif) placed at three distinct page locations using established SVG accessibility patterns

## Task Commits

1. **Task 1: EB Garamond font, pull quote redesign, and parallax background fades** - `ce9bc84` (feat)
2. **Task 2: Create three Native American design motif components and integrate into page** - `af1cdba` (feat)

**Plan metadata:** *(docs commit follows)*

## Files Created/Modified
- `astro.config.ts` — Added EB Garamond font entry with `--font-garamond` CSS variable (weights 400/700, normal/italic)
- `src/components/HiawathaExplainer.astro` — Drop-cap Garamond, 2xl pull quote, ::before background fade with IntersectionObserver script
- `src/components/OjibweBorderPattern.astro` — New: repeating 16-diamond beadwork border SVG with 4-color cycling palette
- `src/components/WaterWavePattern.astro` — New: three-layer wave paths in lake-500/turquoise-500/lake-400 with dot accents
- `src/components/TurtleMotif.astro` — New: geometric Turtle Island motif (shell ellipses, head, tail, 4 legs) using currentColor
- `src/pages/index.astro` — Imports and places all three motifs; TurtleMotif in footer alongside ShieldMotif

## Decisions Made
- **Background image uses full JPG** — No `/images/thumbnails/` directory exists; used full-size JPG at 6% opacity which is perceptually equivalent; the plan's thumbnail reference was aspirational
- **Bidirectional IntersectionObserver** — `classList.toggle(entry.isIntersecting)` not `unobserve()`, so the background fades back out when scrolled past (per plan spec)
- **prefers-reduced-motion: 4% static** — Backgrounds shown at reduced (not zero) opacity to maintain subtle atmospheric quality for all users, just without animation
- **TurtleMotif uses currentColor** — Enables Tailwind `text-*` theming identical to ShieldMotif pattern; placed with `text-turquoise-400 opacity-50`

## Deviations from Plan

None — plan executed exactly as written. The only substitution was using the full-size JPG path (`/images/Eo6Lpv5a2onA...jpg`) in place of the non-existent thumbnail path, which the plan explicitly anticipated and permitted ("If the specific thumbnail referenced above doesn't exist at build time, substitute another").

## Issues Encountered

Volta shim (`~/.volta/bin/npx`) failed with binary encoding error in the Node 22 environment. Resolved by invoking the build directly via `~/.volta/tools/image/node/22.14.0/bin/node node_modules/.bin/astro build`. Build succeeded with no errors or warnings relevant to this plan's changes.

## User Setup Required

None — no external service configuration required. EB Garamond is loaded from Google Fonts via Astro's font optimization pipeline at build time.

## Next Phase Readiness
- Phase 26 Plan 02 complete — all v1.3 VIS items (VIS-02, VIS-03, VIS-04, VIS-06) delivered
- Phase 26 is now complete (both plans done), marking v1.3 final polish as shipped
- Outstanding: iOS Safari device testing for Phase 25 leaflet-gesture-handling issues (#98/#99) — cannot be reproduced in Chrome DevTools
- Outstanding: Ojibwe community consultation recommended for cultural sensitivity review of new motif components

---
*Phase: 26-editorial-polish*
*Completed: 2026-04-02*
