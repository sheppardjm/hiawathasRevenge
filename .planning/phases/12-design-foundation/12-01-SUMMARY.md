---
phase: 12-design-foundation
plan: 01
subsystem: ui
tags: [tailwindcss, css-custom-properties, color-tokens, layout, astro]

# Dependency graph
requires: []
provides:
  - "@theme static in global.css with all tokens output to :root as CSS custom properties"
  - "12 new Ojibwe-inspired color tokens: berry (3), gold (3), lake (4), moss (2)"
  - "Unconstrained <main> element in BaseLayout enabling full-width child sections"
  - "Per-section width containers in index.astro preserving current visual appearance"
affects:
  - 12-02 (color token validation via getComputedStyle relies on @theme static)
  - 13-hero (full-width hero enabled by unconstrained main)
  - 14-ojibwe-design-system (berry/gold/lake/moss palette available)
  - 15-gallery (color tokens available for gallery redesign)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@theme static for guaranteed CSS custom property output regardless of Tailwind utility usage"
    - "Per-section width containment: each section owns its own max-w-4xl mx-auto px-4"

key-files:
  created: []
  modified:
    - src/styles/global.css
    - src/layouts/BaseLayout.astro
    - src/pages/index.astro

key-decisions:
  - "@theme static chosen over @theme to ensure all color tokens output to :root even if not referenced in any Tailwind utility class"
  - "berry/gold/lake/moss hex values finalized with WCAG AA comments: gold and lake-400 pass AA on dark backgrounds"
  - "Per-section containers use max-w-4xl mx-auto px-4 to match removed BaseLayout main padding"

patterns-established:
  - "Color token pattern: WCAG AA usage documented inline with each color family"
  - "Layout pattern: sections self-constrain width, BaseLayout main is unconstrained"

# Metrics
duration: 4min
completed: 2026-03-31
---

# Phase 12 Plan 01: Design Foundation - Color Tokens and Layout Restructure Summary

**@theme static with 12 Ojibwe-inspired color tokens (berry/gold/lake/moss) plus unconstrained BaseLayout main enabling per-section width control**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-31T21:10:34Z
- **Completed:** 2026-03-31T21:14:20Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `@theme static` keyword to global.css so all color tokens are always output as CSS custom properties to `:root`, including tokens only referenced in JavaScript (required for Phase 12 Plan 02's getComputedStyle validation)
- Defined 12 new color tokens across 4 Ojibwe-inspired families with inline WCAG AA guidance: gold-500/400 and lake-400 pass AA on forest-900/950 backgrounds; berry and moss families are decorative-only
- Removed all width/padding classes from BaseLayout `<main>` element and moved containment to per-section containers in index.astro, unblocking Phase 13's full-width hero section

## Task Commits

Each task was committed atomically:

1. **Task 1: Add new color token families with @theme static** - `07f9259` (feat)
2. **Task 2: Remove BaseLayout width constraint and add per-section containers** - `e80e6ac` (feat)

**Plan metadata:** (see docs commit below)

## Files Created/Modified

- `src/styles/global.css` - Changed @theme to @theme static; added berry (3), gold (3), lake (4), moss (2) color families after cream section
- `src/layouts/BaseLayout.astro` - Removed `max-w-4xl mx-auto px-4 py-8` from main element; main is now bare `<main>`
- `src/pages/index.astro` - All 12 content sections/dividers now carry explicit `max-w-4xl mx-auto px-4` plus appropriate vertical padding

## Decisions Made

- **@theme static over @theme:** Tailwind v4 by default tree-shakes tokens not referenced in utility classes. Using `static` forces all tokens into the `:root` output unconditionally. This is essential for Phase 12 Plan 02 which reads token values via `getComputedStyle()` in JavaScript.
- **WCAG AA designations finalized:** Gold family (gold-600/500/400) and lake-400 pass AA contrast ratio on forest-900 (#1a2e1a) and forest-950 (#0d1a0d). Berry and moss families are decorative-only — documented via inline comments so future developers don't accidentally use them for body text.
- **pt-8 on badge section, pb-8 on footer section:** The removed `py-8` from BaseLayout main was providing top/bottom padding for first and last sections. Compensated explicitly rather than adding wrapper padding.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reinstalled sharp for Node 22 arm64 runtime**

- **Found during:** Task 1 verification (build step)
- **Issue:** Project was running Node v20.19.5 but Astro 6 requires Node >=22.12.0. Switching to Node 22 via Volta caused `sharp` native module to fail with "Could not load the darwin-arm64 runtime" error since it was compiled against Node 20.
- **Fix:** Ran `npm install --os=darwin --cpu=arm64 sharp` to reinstall sharp with correct platform binaries.
- **Files modified:** package-lock.json (dependency update)
- **Verification:** Build completed successfully with Node 22.14.0
- **Committed in:** `07f9259` (Task 1 commit, package-lock.json staged)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary infrastructure fix. Node version requirement pre-existed; Volta's Node 22 was already available. No scope creep.

## Issues Encountered

The project's `npm run build` invocation relied on the system PATH providing Node v20, which is below Astro 6's `>=22.12.0` requirement. The build printed an error and exited. Used Volta's Node 22.14.0 (`/Users/Sheppardjm/.volta/bin/node`) to run all subsequent build commands successfully. The sharp native module required reinstallation for the arm64/Node-22 combination.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 12 new color tokens are available as CSS custom properties in `:root` — Phase 12 Plan 02 can immediately run getComputedStyle() validation
- BaseLayout main element is unconstrained — Phase 13 hero can render full-bleed without any layout changes to BaseLayout
- berry/gold/lake/moss families are available for Phase 14 (Ojibwe Design System) and Phase 15 (Gallery)
- No blockers. Hero photo selection (for Phase 13) remains a pending user decision but does not block Phase 12 Plan 02.

---
*Phase: 12-design-foundation*
*Completed: 2026-03-31*
