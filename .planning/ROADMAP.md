# Roadmap: Hiawatha's Revenge

## Milestones

- ✅ **v1.0 MVP** — Phases 0–11 (shipped 2026-03-31)
- ✅ **v1.1 Visual Redesign** — Phases 12–17 (shipped 2026-03-31)
- ✅ **v1.2 Cultural Maximalism** — Phases 18–22 (shipped 2026-04-02)
- 🚧 **v1.3 Interactive Map & Editorial Polish** — Phases 23–27 (in progress)

---

<details>
<summary>✅ v1.0 MVP (Phases 0–11) — SHIPPED 2026-03-31</summary>

Astro 6 + Tailwind 4 static site with Forest Service identity, GPX pipeline, interactive Leaflet map, Chart.js elevation profile synced via event bus, PhotoSwipe gallery, and full responsive polish. 219 files, 2,223 LOC, 12 phases, 33 plans.

</details>

<details>
<summary>✅ v1.1 Visual Redesign (Phases 12–17) — SHIPPED 2026-03-31</summary>

Ojibwe-inspired design system, full-viewport hero, witty Hiawatha editorial narrative, photo-integrated route explainer, masonry gallery, and FloralDivider SVG motifs. 51 files, 1,912 LOC, 6 phases, 8 plans.

</details>

<details>
<summary>✅ v1.2 Cultural Maximalism (Phases 18–22) — SHIPPED 2026-04-02</summary>

Expanded color palette (13 new tokens), animated geometric dividers, shield motif system, historical Remington illustrations, magazine editorial layout, enriched segment cards with sparklines, scroll-driven reveals, multi-color section backgrounds. 72 files, 2,936 LOC, 5 phases, 17 plans.

</details>

---

### 🚧 v1.3 Interactive Map & Editorial Polish (In Progress)

**Milestone Goal:** Make the route map a first-class interactive experience with sector labels, clickable detail panels, and surface-colored track — while polishing the editorial layout with better whitespace, redesigned pull quotes, parallax imagery, and additional cultural design elements.

---

## Phase Details

### Phase 23: Data Reconciliation + Sector Details Pipeline

**Goal:** All panel content exists as a single canonical source — sector details, difficulty ratings, and surface types are reconciled, correct, and available to the runtime at build time.

**Depends on:** v1.2 complete (phases 0–22)

**Requirements:** DATA-01, DATA-02, DATA-03

**Success Criteria** (what must be TRUE):
1. A single `stars` integer field exists in `annotations.json` for all 7 sectors and is the canonical difficulty source — no contradiction with `data.md` ratings is possible
2. Running `node pipeline.js` produces `public/data/sector-details.json` containing name, description, surface type, stars, Strava link, and mile range for all 7 sectors
3. Running `node pipeline.js` produces surface-type data per route point (paved/dirt/gravel/sand) from `hiawathasRevenge.json` that can be consumed by track coloring
4. The build passes with no missing-data errors after these changes

**Plans:** 2 plans

Plans:
- [x] 23-01-PLAN.md — Reconcile difficulty stars + surface-points pipeline step (DATA-01, DATA-03)
- [x] 23-02-PLAN.md — Sector details pipeline step + full build verification (DATA-02)

---

### Phase 24: Sector Labels on Map

**Goal:** Named sector labels with difficulty stars are permanently visible on the route map at each sector's geographic midpoint, styled to match the National Park design system.

**Depends on:** Phase 23 (sector-details.json available)

**Requirements:** MAP-01, MAP-02

**Success Criteria** (what must be TRUE):
1. All 7 sector names are visible on the map as styled pill/badge markers positioned at each polyline's geographic midpoint (not an arbitrary coordinate)
2. Each label displays the sector name and difficulty stars (e.g., ★★★★), color-coded by difficulty tier using the existing design palette
3. Labels use the National Park aesthetic — shield motif reference, opaque dark background pill, no default Leaflet white box
4. Labels appear at zoom ≥ 12 and hide at lower zoom levels to prevent collision with CyclOSM tile text
5. The `<dialog id="sector-panel">` element exists in the DOM with full CSS for desktop right-panel and mobile bottom-sheet, styled to spec — but no open/close logic yet

**Plans:** 1 plan (complete)

Plans:
- [x] 24-01-PLAN.md — Sector label markers with zoom gating and panel DOM scaffold

---

### Phase 25: Click Handlers, Panel Logic, and Surface-Colored Track

**Goal:** Clicking any sector polyline opens a fully-populated detail panel; the panel closes cleanly via all affordances; the route polyline is colored by surface type; the experience works correctly on both desktop and mobile.

**Depends on:** Phase 24 (panel DOM in place, labels established)

**Requirements:** MAP-03, MAP-04, MAP-05, MAP-06, MAP-07, MAP-08, MAP-09, MAP-10, MAP-11, MAP-12, MAP-13, MAP-14

**Success Criteria** (what must be TRUE):
1. Tapping or clicking any of the 7 sector polylines reliably opens the detail panel on both iOS Safari and desktop Chrome — including a 20px ghost hit layer ensuring mobile touch accuracy
2. The panel displays sector name, difficulty stars, terrain description, surface type, elevation sparkline, distance/mile range, Strava link, and a jump link to the segment card in the route explainer
3. The panel closes via X button, Escape key, or clicking the backdrop — and focus returns to the previously focused element after close
4. On desktop (>768px), the panel slides in from the right (~350px wide); on mobile (≤768px), a bottom sheet slides up (~50vh) — both with CSS translate transitions that respect `prefers-reduced-motion`
5. The full route polyline is re-rendered as surface-type segments, each colored distinctly (paved/dirt/gravel/sand) using data from the pipeline
6. The active (clicked) sector polyline shows a thicker, brighter highlight while its panel is open; desktop hover changes polyline weight/opacity

**Plans:** 2 plans (complete)

Plans:
- [x] 25-01-PLAN.md — Surface-colored track, ghost polylines, click/hover handlers, and panel open/close logic
- [x] 25-02-PLAN.md — SVG sparkline generator, enhanced panel content, and RouteExplainer jump link IDs

---

### Phase 26: Editorial Polish

**Goal:** The editorial sections breathe with generous whitespace, pull quotes are redesigned as typographic showpieces, background images create depth via parallax, route stats are legible, and additional Native American design elements enrich the cultural identity throughout.

**Depends on:** Phase 23 (can run in parallel with phases 24–25; no MAP dependencies)

**Requirements:** VIS-01, VIS-02, VIS-03, VIS-04, VIS-05, VIS-06, PERF-01

**Success Criteria** (what must be TRUE):
1. Content sections have noticeably more vertical padding — the page breathes rather than feeling dense
2. Pull quotes display a large drop-cap initial letter in a classic American serif (Caslon or Garamond) and are set larger than body text, drawing the reader's eye
3. Editorial sections (poem, forest, ride) have a fixed-position background image that fades in and out as the user scrolls past — creating depth without motion sickness
4. Route stats text is high-contrast and legible — no dark text on mid-tone background color combination
5. Photo grid images show a skeleton loader (shimmer or fade-in placeholder) while loading — no layout shift visible during page load
6. At least three additional Native American design elements (patterns, symbols, or cultural motifs) appear in section backgrounds, dividers, or decorative roles throughout the page

**Plans:** 3 plans (complete)

Plans:
- [x] 26-01-PLAN.md — Section spacing, route stats legibility fix, and photo gallery skeleton loaders
- [x] 26-02-PLAN.md — EB Garamond drop-cap typography, parallax background fades, and three cultural motif components
- [x] 26-03-PLAN.md — Sub-section parallax backgrounds with independent IntersectionObserver (gap closure)

---

### Phase 27: Audit Gap Closure

**Goal:** Close the two requirement gaps found by the v1.3 milestone audit — EB Garamond font not loading (VIS-02) and panel backdrop close affordance (MAP-08) — plus clean up associated tech debt in RouteMap.astro.

**Depends on:** Phase 26 (editorial polish complete), Phase 25 (panel logic complete)

**Requirements:** VIS-02, MAP-08

**Gap Closure:** Closes gaps from v1.3-MILESTONE-AUDIT.md

**Success Criteria** (what must be TRUE):
1. EB Garamond font is loaded via `<Font>` tag in BaseLayout.astro and drop-cap `::first-letter` elements render in EB Garamond (not system serif)
2. Clicking the map area outside the open panel closes the panel — OR a documented decision exists that this affordance is intentionally omitted in favor of map interactivity
3. Stale comment at RouteMap.astro line 482 is removed, dead `::backdrop` CSS is removed, and NF2217 display name is consistent between panel and segment card

**Plans:** 1 plan

Plans:
- [ ] 27-01-PLAN.md — VIS-02 font fix, MAP-08 trade-off documentation, NF2217 name consistency, and RouteMap.astro tech debt cleanup

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 0–11. MVP foundations | v1.0 | 33/33 | Complete | 2026-03-31 |
| 12–17. Visual redesign | v1.1 | 8/8 | Complete | 2026-03-31 |
| 18–22. Cultural maximalism | v1.2 | 17/17 | Complete | 2026-04-02 |
| 23. Data reconciliation | v1.3 | 2/2 | Complete | 2026-04-02 |
| 24. Sector labels | v1.3 | 1/1 | Complete | 2026-04-02 |
| 25. Click handlers + surface track | v1.3 | 2/2 | Complete | 2026-04-02 |
| 26. Editorial polish | v1.3 | 3/3 | Complete | 2026-04-02 |
| 27. Audit gap closure | v1.3 | 0/0 | Not started | — |
