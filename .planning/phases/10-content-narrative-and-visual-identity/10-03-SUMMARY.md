---
phase: 10
plan: "03"
subsystem: page-assembly
tags: [astro, narrative, content, donate-cta, gpx-download, topo-divider, badge, route-stats]

requires:
  - "10-01: RouteStats.astro and DonateCallout.astro components created"
  - "10-02: public/Munising_Hiawatha_s_Revenge.gpx available via pipeline; .topo-divider CSS class in global.css"
  - "02-03: routeData and annotations content collections"
  - "01-02: badge SVG and scoped styles in index.astro"

provides:
  - "src/pages/index.astro: complete narrative-driven page with all Phase 10 content"
  - "Hiawatha/Longfellow/Ojibwe narrative (4 paragraphs) replacing placeholder text"
  - "DonateCallout above-fold and in Support section"
  - "RouteStats section with build-time data"
  - "GPX download link with download attribute"
  - "Two topo-divider elements as section separators"
  - "badge-rule hr refinement in badge-content"

affects:
  - "Phase 11: final polish/launch — page is now feature-complete"

tech-stack:
  added: []
  patterns:
    - "Astro component import and render pattern: import Component; <Component />"
    - "download attribute on anchor for clean GPX filename (HiawathasRevenge.gpx)"
    - "DonateCallout rendered twice — above-fold and in support section — no state duplication needed"

key-files:
  created: []
  modified:
    - src/pages/index.astro

key-decisions:
  - "DonateCallout placed both above-fold (between hero and narrative) and in Support section — ensures donate CTA visible immediately on desktop and again at natural scroll terminus"
  - "GPX download attribute value HiawathasRevenge.gpx (no underscores/spaces) gives a clean downloaded filename while source file retains original name"
  - "badge-rule uses hr element with border-top and opacity: 0.6 — minimal CSS, no new SVG elements, preserves existing badge structure"
  - "gpx-download style uses 2px forest-700 border (lighter than donate button's 3px amber) — secondary action visual weight intentionally lower"

patterns-established:
  - "Page assembly pattern: all data flows through components (RouteStats, DonateCallout), index.astro contains only layout and narrative prose"
  - "Section separator pattern: topo-divider between hero+content block and interactive sections"

duration: "~2 min (93 seconds)"
completed: "2026-03-31"
---

# Phase 10 Plan 03: Index Assembly Summary

**Shipped:** Complete index.astro assembly wiring RouteStats and DonateCallout components, replacing placeholder text with 4-paragraph Hiawatha/Longfellow/Ojibwe/MBTN narrative, adding GPX download link, two topo-divider section separators, and badge-rule hr refinement — transforming the page from technical demo into narrative-driven showcase.

---

## Performance

- **Duration:** ~2 min (93 seconds)
- **Started:** 2026-03-31T16:37:05Z
- **Completed:** 2026-03-31T16:38:38Z
- **Tasks:** 1/1 complete
- **Files modified:** 1

---

## Accomplishments

- `src/pages/index.astro` fully assembled: 244 lines (up from 167), all Phase 10 success criteria met
- Imported and rendered `RouteStats` and `DonateCallout` components — all route data flows through build-time content collections, zero runtime fetch
- Added 4-paragraph Hiawatha narrative covering: Longfellow's 1855 poem drawing on Ojibwe oral traditions; National Forest naming (1931); route description threading through the forest; MBTN nonprofit mission
- `DonateCallout` placed twice: immediately after the hero badge (above-fold on desktop) and in the "Support the Trail" section at bottom
- `RouteStats` renders in dedicated "Route Stats" section with heading
- GPX download link: `href="/Munising_Hiawatha_s_Revenge.gpx"` with `download="HiawathasRevenge.gpx"` for clean downloaded filename
- Two `<div class="topo-divider">` elements: first between DonateCallout and narrative, second between GPX download and the interactive sections
- Badge `<hr class="badge-rule" />` added between title and miles label — thin amber line at 60% width, opacity 0.6
- All existing interactive sections preserved exactly: RouteMap (id="route"), ElevationProfile, PhotoGallery
- Footer section preserved with MBTN link
- Astro build completes cleanly: `[build] Complete!` in 3.56s

---

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wire components, narrative, GPX link, and topo dividers into index.astro | 7d8c2cd | src/pages/index.astro |

---

## Files Created

None.

## Files Modified

| File | Purpose | Lines Before | Lines After |
|------|---------|-------------|-------------|
| `src/pages/index.astro` | Complete page assembly with narrative, components, GPX download, topo dividers, badge rule | 167 | 244 |

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| DonateCallout rendered twice (above-fold + Support section) | Plan spec requires above-fold visibility on desktop; a second instance at the scroll terminus is conventional for donation flows — no state exists in the component so duplication is safe |
| `download="HiawathasRevenge.gpx"` clean filename | Source file has underscores (`Munising_Hiawatha_s_Revenge.gpx`) which is correct for the pipeline; the download attribute gives riders a clean, brandable filename on their GPS device |
| `badge-rule` uses `<hr>` not SVG | Minimal change to existing badge structure — plan specified hr element, preserves all existing SVG/scoped styles |
| gpx-download border: 2px forest-700 (vs donate button 3px amber) | Visual hierarchy: donate is primary action (3px amber), GPX download is secondary utility action (2px forest green) |

---

## Deviations from Plan

None — plan executed exactly as written. All sections implemented per specification, all existing sections preserved.

---

## Issues Encountered

None. Build completed cleanly on first attempt. All 10 verification checks passed.

---

## Next Phase Readiness

- **Phase 11 (final polish/launch):** Page is feature-complete. All Phase 10 success criteria are met.
- No blockers.
- The page structure is stable: badge hero → donate CTA → topo-divider → narrative → stats → GPX → topo-divider → map → elevation → photos → support → footer.
