---
phase: 10
plan: "01"
subsystem: content-components
tags: [astro, content-collections, build-time-data, donate-cta, route-stats]

requires:
  - "02-03: routeData and annotations content collections established with Zod schemas"
  - "05-04: sector difficulty assignments (easy/moderate/hard) in annotations.json"

provides:
  - "RouteStats.astro: build-time route stats block (miles, elevation, surface breakdown)"
  - "DonateCallout.astro: MBTN donate CTA with Forest Service styling"

affects:
  - "10-03: index.astro assembly will import and render both components"

tech-stack:
  added: []
  patterns:
    - "getEntry('routeData', 'route') for single-entry content collection access"
    - "getCollection('annotations') filtered by discriminated union type field"
    - "type assertion (s.data as any).difficulty for discriminated union access in Astro frontmatter"

key-files:
  created:
    - src/components/RouteStats.astro
    - src/components/DonateCallout.astro
  modified: []

key-decisions:
  - "Used (s.data as any).difficulty type assertion because TypeScript cannot narrow discriminated union after array filter — the .filter(type === 'sector') narrows at runtime but not at the type level in this pattern"
  - "roadMiles computed as totalMiles minus all annotated sector miles (~72.8 mi of forest roads)"
  - "Surface colors match Phase 5 map sector overlay colors: forest-600 roads, amber-300 moderate, amber-500 easy, rust-500 hard"
  - "DonateCallout uses 3px amber border + 4px hard offset shadow matching existing badge design tokens"

patterns-established:
  - "Build-time content collection queries in Astro component frontmatter (no runtime fetch)"
  - "Discriminated union type assertion pattern for annotations collection access"

duration: "~2 min (81 seconds)"
completed: "2026-03-31"
---

# Phase 10 Plan 01: Route Stats and Donate Components Summary

**Shipped:** RouteStats.astro querying `routeData` and `annotations` collections at build time (distance 102mi, elevation 2,258ft, 4-row surface breakdown) plus DonateCallout.astro with amber badge-style button linking to mbtn.org/donate.

---

## Performance

- **Duration:** ~2 min (81 seconds)
- **Tasks:** 2/2 complete
- **Files created:** 2

---

## Accomplishments

- Created `RouteStats.astro` with zero runtime JavaScript — all data queried at build time via `getEntry`/`getCollection` from `astro:content`
- Stats grid shows 102 miles, 2,258 feet of climbing, and "4 Surface Types" from live content collection data
- Surface breakdown computes easy/moderate/hard singletrack miles from annotations and derives forest road remainder (~72.8 mi)
- Surface colors in breakdown match the map sector overlay colors established in Phase 5 (forest-600, amber-300, amber-500, rust-500)
- Created `DonateCallout.astro` with Forest Service visual styling — 3px amber border, hard offset shadow, uppercase tracking
- Donate button hover state inverts to amber background/dark text for high-contrast affordance
- External link safety: `target="_blank"` + `rel="noopener noreferrer"` on mbtn.org/donate
- Both components are fully self-contained with scoped `<style>` blocks
- Astro build completes cleanly — no errors, no warnings related to new components

---

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create RouteStats.astro | dc0798a | src/components/RouteStats.astro |
| 2 | Create DonateCallout.astro | adae7aa | src/components/DonateCallout.astro |

---

## Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/RouteStats.astro` | Route statistics block with distance, elevation, surface breakdown | 124 |
| `src/components/DonateCallout.astro` | Donate CTA button linking to mbtn.org/donate | 54 |

## Files Modified

None.

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Used `(s.data as any).difficulty` type assertion | TypeScript cannot narrow a discriminated union after `.filter()` — the type check runs at runtime correctly but TS still sees the union type; `as any` is minimal friction for build-time-only code |
| `roadMiles` as remainder after sector subtraction | 71.4% of route is unannotated forest road connective tissue; computing the remainder is more accurate than hardcoding |
| Surface colors matching Phase 5 map overlays | Visual consistency: what riders see on the map legend should match what they read in the stats block |
| DonateCallout uses existing `--border-badge` pattern | Reuses established design token rather than introducing new styling; button "feels" like part of the same design system |

---

## Deviations from Plan

None — plan executed exactly as written. The discriminated union type assertion was anticipated by the plan's note: "If the type narrowing does not compile, use type assertion: `(s.data as any).difficulty`". This was needed and applied.

---

## Issues Encountered

None. Build completed cleanly on first attempt.

---

## Next Phase Readiness

- **10-02 / 10-03 (index.astro assembly):** Both components are ready to import. Wire in with:
  ```astro
  import RouteStats from '../components/RouteStats.astro';
  import DonateCallout from '../components/DonateCallout.astro';
  ```
- **No blockers:** Components are self-contained, scoped styles won't leak, no new dependencies.
- **Placement guidance (from RESEARCH.md):** DonateCallout goes between the hero badge section and "The Route" section; RouteStats goes within "The Route" section.
