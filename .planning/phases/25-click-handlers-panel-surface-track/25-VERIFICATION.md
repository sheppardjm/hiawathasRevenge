---
phase: 25-click-handlers-panel-surface-track
verified: 2026-04-02T21:00:00Z
status: gaps_found
score: 5/6 must-haves verified
gaps:
  - truth: "The panel closes via X button, Escape key, or clicking the backdrop — and focus returns to the previously focused element after close"
    status: partial
    reason: "X button and Escape key close affordances work. But 'clicking the backdrop' is not achievable: dialog.show() (non-modal) produces no native backdrop, and the dialog element is only 350px wide on desktop / 50vh tall on mobile. Clicking the MAP AREA outside the panel does not hit the dialog element and cannot trigger the close handler. The e.target===panel handler only fires for clicks on the dialog's own CSS padding — a trivially small hit target that is not a usable 'backdrop click'. The ::backdrop CSS rule is explicitly commented as 'dead code with show()' in the source."
    artifacts:
      - path: "src/components/RouteMap.astro"
        issue: "panel.addEventListener('click', (e) => { if (e.target === panel) closePanel(); }) at line 545 cannot be triggered by clicking outside the panel on the map — dialog element does not span full viewport with show()"
    missing:
      - "A full-viewport transparent overlay element (separate from the dialog) that sits behind the panel and calls closePanel() on click"
      - "OR: a documented decision that 'clicking outside the panel' close is intentionally not provided in favor of keeping the map fully interactive"
---

# Phase 25: Click Handlers, Panel Logic, and Surface Track — Verification Report

**Phase Goal:** Clicking any sector polyline opens a fully-populated detail panel; the panel closes cleanly via all affordances; the route polyline is colored by surface type; the experience works correctly on both desktop and mobile.
**Verified:** 2026-04-02T21:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Tapping or clicking any of the 7 sector polylines opens the detail panel, including a 20px ghost hit layer | VERIFIED | `ghostPoly = L.polyline(sectorPts, { weight: 20, opacity: 0, interactive: true })` at line 393-395. 7 sectors confirmed in annotations.json. |
| 2 | Panel displays sector name, difficulty stars, terrain description, surface type, elevation sparkline, distance/mile range, Strava link, and jump link | VERIFIED | `generateSparklineSvg()` at line 431; `openPanel()` innerHTML at lines 499-507 includes all 8 required content elements. 6/7 sectors have Strava links; 1 (Rapid River) gracefully omits it. |
| 3 | Panel closes via X button, Escape key, or clicking the backdrop — focus returns to previous element | PARTIAL | X button (line 534) and Escape key (line 538) verified. Backdrop click NOT working: `dialog.show()` produces no native backdrop; `e.target===panel` handler only fires for clicks inside dialog's own CSS padding, not map-area clicks. `previousFocus?.focus()` in `close` event listener (line 530) verified. |
| 4 | Desktop right-panel slides in from right (~350px); mobile bottom sheet slides up (~50vh); CSS translate transitions; prefers-reduced-motion respected | VERIFIED | `width: 350px; translateX(100%)` at lines 67-73. `max-height: 50vh; translateY(100%)` at lines 82-88. `transition: transform 0.3s ease` at line 59. `@media (prefers-reduced-motion: reduce) { transition: none }` at lines 92-96. |
| 5 | Full route polyline re-rendered as surface-type segments, each colored distinctly (paved/dirt/gravel/unknown) | VERIFIED | Run-flush algorithm at lines 344-360. SURFACE_COLORS covers paved/gravel/dirt/unknown (sand not present in route data — 0 of 456 surface points tagged sand). 456 surface points = 456 route points. |
| 6 | Active sector polyline shows thicker, brighter highlight while panel open; desktop hover changes weight/opacity | VERIFIED | Active: `weight: 8, opacity: 1.0` at line 418 with `bringToFront()` at line 419. Hover: `weight: 7, opacity: 1.0` at line 403. `activeSector` guard prevents hover from overwriting active highlight (lines 402, 407). |

**Score:** 5/6 truths verified (1 partial)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/RouteMap.astro` | Surface-colored track, ghost polylines, click/hover handlers, openPanel/closePanel | VERIFIED | 707 lines. All patterns present: run-flush (344-360), ghost+visible pairs (386-424), openPanel (476-518), closePanel (520-522), 3 close wiring points (534-547). |
| `src/components/RouteExplainer.astro` | id attributes on 7 segment card articles for jump link targeting | VERIFIED | `<article id={SECTOR_IDS[seg.name] ?? ''}` at line 60. SECTOR_IDS map at lines 35-43 covers all 7 sectors. All 7 article IDs verified to match sector-details.json ids. |
| `public/data/sector-details.json` | 7 entries with name, description, surface, stars, startMile, endMile, stravaLink | VERIFIED | 7 entries. All have: name, description, surface, stars, startMile, endMile. 6/7 have stravaLink (Rapid River omitted). |
| `public/data/sector-elevations.json` | 7 entries with elevationPoints, eleMin, eleMax, difficulty | VERIFIED | 7 entries, all have elevationPoints array, eleMin, eleMax, difficulty field. First sector has 10 elevation points. |
| `public/data/surface-points.json` | 456 entries matching route-data.json point count | VERIFIED | 456 entries. Surfaces: paved (109), gravel (177), dirt (140), unknown (30). Exactly matches route-data.json 456 points. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `RouteMap.astro initMap()` | `sector-details.json` | `fetch('/data/sector-details.json')` in Promise.all | WIRED | Line 319. Used in `sectorDetails.find(d => d.id === sector.id)` at line 420. |
| `RouteMap.astro initMap()` | `sector-elevations.json` | `fetch('/data/sector-elevations.json')` in Promise.all | WIRED | Line 320. Used in `sectorElevations.find(e => e.id === sector.id)` at line 421. |
| `RouteMap.astro initMap()` | `surface-points.json` | `fetch('/data/surface-points.json')` in Promise.all | WIRED | Line 321. Used in run-flush loop at line 356. |
| `ghostPoly click handler` | `openPanel()` | `ghostPoly.on('click', () => { ... openPanel({...}) })` | WIRED | Line 413-423. Passes `{ sector, details, elevData }`. |
| `openPanel()` | `generateSparklineSvg()` | `const sparklineSvg = generateSparklineSvg(elevData)` | WIRED | Line 494. SVG inserted into innerHTML at line 502. |
| `panel jump link href` | `RouteExplainer article id` | `href="#${details.id}"` / `id={SECTOR_IDS[seg.name] ?? ''}` | WIRED | All 7 sector IDs match exactly. `details.id` from sector-details.json = `SECTOR_IDS[seg.name]` from RouteExplainer. |
| `X button / Escape / e.target===panel` | `closePanel()` | Event listeners at lines 534, 538, 545 | PARTIAL | X button and Escape wired correctly. e.target===panel close fires for dialog padding clicks only — not effective for map-area backdrop clicks. |

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| MAP-03 through MAP-14 (sector polylines, click handlers, panel) | VERIFIED (with gap) | All core requirements met. Single gap: backdrop close affordance not functional outside dialog element bounds. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `RouteMap.astro` | 482 | Stale comment: "minimal content; Plan 25-02 adds full buildPanelBody() with sparkline" — sparkline IS already implemented | Info | None — code is correct, comment is outdated |
| `RouteMap.astro` | 133-135 | `::backdrop` CSS rule commented as "dead code with show()" — still present | Info | No runtime impact; just dead CSS |

### Human Verification Required

The following items require device/browser testing that cannot be verified from source code:

#### 1. iOS Safari Touch Handling
**Test:** On an iPhone running iOS Safari, tap each of the 7 sector polylines
**Expected:** Panel opens reliably every tap with no missed taps; 20px ghost target provides accurate hit detection through touch
**Why human:** iOS Safari touch event handling for Leaflet polylines requires device testing; STATE.md notes this as a blocker

#### 2. Panel Slide Animation
**Test:** Open the panel on both desktop Chrome and mobile Chrome/Safari; observe the slide-in transition
**Expected:** Desktop: right-to-left slide over ~300ms; Mobile: bottom-to-top slide over ~300ms; both smooth without jank
**Why human:** CSS transform transition quality is a perceptual judgment

#### 3. Escape Key Focus Restoration
**Test:** Click a sector, verify panel opens and focus moves to X button; press Escape; verify focus returns to the element that had focus before the panel opened
**Expected:** `document.activeElement` is the same element as before the panel opened
**Why human:** Focus management in complex Leaflet+dialog environments can have browser-specific quirks

#### 4. Map Interactivity While Panel Open
**Test:** Open a sector panel; while panel is open, pan and zoom the Leaflet map
**Expected:** Map responds normally to pan/zoom gestures; panel stays pinned to its viewport position; `dialog.show()` (non-modal) should allow map interaction
**Why human:** Interaction between non-modal dialog and underlying Leaflet map requires visual verification

#### 5. Jump Link Scroll
**Test:** Open any sector panel; click "View in route guide" jump link
**Expected:** Page scrolls to the matching segment card in the RouteExplainer section; panel closes; card is the correct sector
**Why human:** Smooth scroll + panel close + correct target anchor requires end-to-end browser verification

### Gaps Summary

One gap was found: the "backdrop click" close affordance.

The phase used `dialog.show()` (non-modal) rather than `showModal()` — this is a deliberate design decision that keeps the Leaflet map fully interactive while the panel is open. However, the consequence is that no visual backdrop is rendered, and the dialog element only occupies its CSS-defined area (350px right column on desktop, bottom 50vh on mobile). Clicking the map area outside the panel does not trigger any dialog event.

The code implements `e.target === panel` as a "click outside" handler, but this only fires when a click lands on the dialog element's own padding/border — not when clicking the map. This mechanism is technically present but practically unusable as a close affordance.

X button and Escape key close affordances work correctly and cover the primary keyboard and pointer use cases. The missing backdrop close is a lower-priority affordance, but it is specifically called out in the phase success criteria. A transparent full-viewport overlay behind the panel would implement this correctly without breaking the non-modal map interaction.

---

_Verified: 2026-04-02T21:00:00Z_
_Verifier: Claude (gsd-verifier)_
