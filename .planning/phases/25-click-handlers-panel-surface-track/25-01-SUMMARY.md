---
phase: 25-click-handlers-panel-surface-track
plan: 01
subsystem: ui
tags: [leaflet, dialog, polyline, ghost-layer, surface-colors, panel, click-handlers]

# Dependency graph
requires:
  - phase: 24-sector-labels
    provides: Panel <dialog> DOM scaffold, sector label markers, CSS transitions
  - phase: 23-sector-data-build
    provides: surface-points.json (456 entries), sector-details.json (7 entries), sector-elevations.json

provides:
  - Surface-colored route polylines (paved/gravel/dirt/unknown) replacing single dark green line
  - Ghost+visible polyline pairs for all 7 sectors with 20px hit targets
  - Click/hover event handlers for all sector ghost polylines
  - openPanel() / closePanel() functions with focus management
  - Three close affordances: X button, Escape key, backdrop click
  - Active sector highlight (weight 8) and hover preview (weight 7)
  - Panel CSS fixed to position: fixed (viewport-anchored during scroll)
  - Panel body CSS (stars, meta, description, strava-link, jump-link)

affects: [25-02-panel-body, 26-route-explainer-ids]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ghost polyline pattern: weight 20 opacity 0 for hit detection, separate visible poly for styling"
    - "Run-flush algorithm: group consecutive same-surface points into polyline runs"
    - "Consolidated Promise.all at initMap() top for parallel data fetching"
    - "dialog.show() (non-modal) keeps map interactive while panel is open"
    - "Module-scope activeSector state with entry object {sectorId, visiblePoly, ghostPoly, defaultStyle}"

key-files:
  created: []
  modified:
    - src/components/RouteMap.astro

key-decisions:
  - "dialog.show() over showModal() — map stays interactive while panel open"
  - "position: fixed on .sector-panel (not absolute) — viewport-anchored during scroll"
  - "activeSector guard in mouseover/mouseout — prevents hover from overwriting active highlight"
  - "if (!panel.open) panel.show() guard — prevents double-show error in Safari 16"
  - "Promise.all consolidation — all 6 data fetches parallel at initMap() start"
  - "flushRun borrows endIdx+1 point — handles 13 single-point surface runs needing 2+ points"

patterns-established:
  - "Ghost+visible polyline: ghost (weight 20, opacity 0, interactive true) handles events; visible handles CSS"
  - "Surface run-flush: prevSurface/runStart loop, flushRun(endIdx) emits polyline with slice(runStart, endIdx+1)"
  - "Panel close event listener wired once (not in loop) to reset activeSector and restore previousFocus"

# Metrics
duration: 5min
completed: 2026-04-02
---

# Phase 25 Plan 01: Click Handlers, Panel Logic, and Surface Track Summary

**Surface-colored route track (paved/gravel/dirt/unknown), 7 ghost+visible sector polylines with click/hover handlers, and functional openPanel/closePanel with Escape/X/backdrop close affordances**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-02T15:53:00Z
- **Completed:** 2026-04-02T19:58:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Replaced single dark green `routeLine` with 51 surface-typed polyline segments using run-flush algorithm against `surface-points.json`
- Refactored all 7 sector polylines to ghost+visible pairs — ghost is 20px wide (invisible) for reliable mobile touch, visible poly receives setStyle() calls
- Wired click handlers (openPanel), hover handlers (weight preview with activeSector guard), and panel open/close with three close affordances plus focus restoration

## Task Commits

Each task was committed atomically:

1. **Task 1: Surface-colored track, ghost polylines, and click/hover handlers** - `0b13c52` (feat)
2. **Task 2: Panel open/close logic, CSS fix, and close affordances** - `022fa6c` (feat)

**Plan metadata:** *(added in final docs commit)*

## Files Created/Modified

- `src/components/RouteMap.astro` - Surface track rendering, ghost polylines, event handlers, openPanel/closePanel, panel body CSS, position: fixed

## Decisions Made

- `dialog.show()` (not `showModal()`) — keeps the Leaflet map fully interactive while panel is open; user can pan/zoom while reading sector details
- CSS `position: absolute` changed to `position: fixed` on `.sector-panel` — the dialog element uses the viewport as its containing block regardless, but `absolute` scrolls with the page; `fixed` stays pinned
- `if (!panel.open) panel.show()` guard — Safari 16 throws on double `.show()`; this prevents the error when user clicks sector B while panel is already showing sector A
- `activeSector` guard in hover handlers — without this, mouseover on the active sector would overwrite the thick active highlight with the thinner hover style
- Consolidated all 6 fetches into one `Promise.all` at initMap() top — eliminates sequential waterfall (route-data → annotations → photos → etc.)
- `flushRun(endIdx + 1)` borrow — 13 of 51 surface runs have only 1 coordinate point; borrowing the next run's first point ensures `pts.length >= 2` for a renderable polyline

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Panel opens and closes via all three mechanisms with working focus management
- Active sector highlight persists while panel is open; resets cleanly on close
- Panel body shows stars, miles range, surface type, description, Strava link (when available), and jump link
- Plan 25-02 adds full `buildPanelBody()` with elevation sparkline SVG
- `RouteExplainer.astro` article elements need `id={SECTOR_IDS[seg.name] ?? ''}` for jump links to work (Phase 26)
- iOS Safari device testing still required per STATE.md blocker (overflow-y on dialog)

---
*Phase: 25-click-handlers-panel-surface-track*
*Completed: 2026-04-02*
