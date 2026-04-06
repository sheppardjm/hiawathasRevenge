---
phase: 28-tech-debt-cleanup
plan: 01
subsystem: ui
tags: [css, fonts, astro, tailwind, data-consistency, cross-browser]

# Dependency graph
requires:
  - phase: 15-editorial-content
    provides: RouteExplainer.astro sector display with star ratings
  - phase: 25-route-map
    provides: RouteMap.astro sector panel with font-body reference
provides:
  - Spectral font loaded via Astro Fonts API with --font-serif semantic variable
  - NF2217-2218 name consistent across all data files (annotations, sector-details, sector-elevations)
  - Cross-browser star rating via @supports guard with color:transparent for Firefox
affects: [29-performance-optimization, 30-image-optimization, 31-accessibility-polish]

# Tech tracking
tech-stack:
  added: [Spectral (Google Fonts via Astro Fonts API)]
  patterns:
    - "@supports feature query for progressive enhancement of gradient text"
    - "Semantic --font-serif CSS custom property following --font-mono/--font-display pattern"

key-files:
  created: []
  modified:
    - astro.config.ts
    - src/layouts/BaseLayout.astro
    - src/styles/global.css
    - src/components/RouteMap.astro
    - public/data/annotations.json
    - public/data/sector-details.json
    - public/data/sector-elevations.json
    - src/components/RouteExplainer.astro

key-decisions:
  - "Spectral chosen for sector panel body text to match EB Garamond's editorial register without preload (below-fold use)"
  - "@supports (background-clip: text) or (-webkit-background-clip: text) guard preserves Chrome gradient while adding Firefox color:transparent reveal"
  - "sector-nf2217 ID preserved as-is across all files; only 'name' display fields updated to NF2217-2218"

patterns-established:
  - "Astro font entry pattern: provider, name, cssVariable, weights, styles — Spectral follows EB Garamond template exactly"
  - "@supports guard for gradient text: base rule sets solid color fallback, @supports block adds gradient/clip/transparent"

# Metrics
duration: 4min
completed: 2026-04-06
---

# Phase 28 Plan 01: Tech Debt Cleanup Summary

**Spectral serif font via Astro Fonts API, NF2217-2218 name reconciled across all data files, and Firefox-compatible star rating via @supports gradient-clip guard**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-06T14:16:10Z
- **Completed:** 2026-04-06T14:19:54Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Eliminated undefined `var(--font-body)` CSS variable — RouteMap sector panel now uses `var(--font-serif)` backed by Spectral via Astro Fonts API
- Reconciled `NF2217` to `NF2217-2218` across all three data files (annotations.json, sector-details.json, sector-elevations.json), preserving `"id": "sector-nf2217"` DOM anchor
- Refactored `.star-rating` CSS with `@supports (background-clip: text)` guard — Firefox receives solid amber fallback, Chrome/Safari receive full gradient rendering

## Task Commits

Each task was committed atomically:

1. **Task 1: DEBT-01 — Add Spectral serif font and fix undefined --font-body** - `e2a377c` (fix)
2. **Task 2: DEBT-02 — Reconcile NF2217 naming to NF2217-2218** - `ce4523f` (fix)
3. **Task 3: DEBT-03 — Add Firefox-compatible star rating gradient fallback** - `079f6eb` (fix)

## Files Created/Modified

- `astro.config.ts` - Added Spectral font entry with cssVariable `--font-spectral`
- `src/layouts/BaseLayout.astro` - Added `<Font cssVariable="--font-spectral" />` tag (no preload — below-fold use)
- `src/styles/global.css` - Added `--font-serif: var(--font-spectral, 'Spectral', Georgia, serif)` to @theme static block
- `src/components/RouteMap.astro` - Replaced `var(--font-body)` with `var(--font-serif)` in sector panel
- `public/data/annotations.json` - Updated sector-nf2217 `"name"` field to `"NF2217-2218"`
- `public/data/sector-details.json` - Updated sector-nf2217 `"name"` field to `"NF2217-2218"`
- `public/data/sector-elevations.json` - Updated sector-nf2217 `"name"` field to `"NF2217-2218"`
- `src/components/RouteExplainer.astro` - Restructured `.star-rating` CSS with @supports progressive enhancement

## Decisions Made

- Used `@supports (background-clip: text) or (-webkit-background-clip: text)` as the feature guard — both the unprefixed and prefixed forms checked to maximize browser compatibility
- `color: transparent` added inside @supports block as the standard CSS companion to `-webkit-text-fill-color: transparent` — this is the Firefox-specific fix that reveals the background gradient through text
- Spectral loaded without `preload` attribute — it appears only below the fold in the sector panel, so no FCP impact concerns

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] sector-details.json had bare "NF2217" — plan stated it was already "NF2217-2218"**

- **Found during:** Task 2 (DEBT-02 NF2217 naming reconciliation)
- **Issue:** Plan comment said "sector-details.json already has 'name': 'NF2217-2218' — no change needed there." Grep revealed it still contained `"NF2217"`.
- **Fix:** Applied same name field update to sector-details.json as to the other two data files
- **Files modified:** `public/data/sector-details.json`
- **Verification:** `grep -rn '"name".*"NF2217"' public/data/ | grep -v "NF2217-2218"` returns no matches
- **Committed in:** `ce4523f` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 data inconsistency bug)
**Impact on plan:** Auto-fix necessary for data consistency. No scope creep — same operation as planned, just applied to an additional file.

## Issues Encountered

Working-tree JSON files were being reverted by an external process (likely IDE formatter or git checkout from another process) during execution. Resolved by running `git checkout HEAD --` to restore committed state. Task 2 commit was verified correct via `git diff HEAD` before the final verification pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three DEBT items resolved — codebase is clean for v1.4 continuation
- No `var(--font-body)` undefined variable references remain in src/
- All data files consistent on NF2217-2218 naming
- Star ratings cross-browser safe (Firefox + Chrome + Safari)
- Build passes cleanly — ready for Phase 29 (Performance Optimization)

---
*Phase: 28-tech-debt-cleanup*
*Completed: 2026-04-06*
