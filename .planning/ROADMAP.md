# Roadmap: Hiawatha's Revenge

## Milestones

- ✅ **v1.0 MVP** - Phases 1-11 (shipped 2026-03-31)
- ✅ **v1.1 Visual Redesign** - Phases 12-17 (shipped 2026-03-31)
- ✅ **v1.2 Cultural Maximalism** - Phases 18-22 (shipped 2026-04-02)
- ✅ **v1.3 Interactive Map & Editorial Polish** - Phases 23-27 (shipped 2026-04-02)
- ✅ **v1.4 Performance & Polish** - Phases 28-32 (shipped 2026-04-06)
- ✅ **v1.5 Multi-Route Support** - Phases 33-37 (shipped 2026-04-06)
- ✅ **v1.6 Segment Editorial & Polish** - Phases 38-39 (shipped 2026-04-07)
- ✅ **v1.7 UX Polish & Photo Pipeline** - Phases 40-44 (shipped 2026-04-07)
- 🚧 **v1.8 Navigation & Identity** - Phases 45-47 (in progress)

## Phases

<details>
<summary>All prior milestone phases documented in .planning/MILESTONES.md</summary>

- v1.0 MVP: Phases 1-11 (33 plans)
- v1.1 Visual Redesign: Phases 12-17 (8 plans)
- v1.2 Cultural Maximalism: Phases 18-22 (17 plans)
- v1.3 Interactive Map & Editorial Polish: Phases 23-27 (9 plans)
- v1.4 Performance & Polish: Phases 28-32 (7 plans)
- v1.5 Multi-Route Support: Phases 33-37 (10 plans)
- v1.6 Segment Editorial & Polish: Phases 38-39 (2 plans)
- v1.7 UX Polish & Photo Pipeline: Phases 40-44 (6 plans)

</details>

### 🚧 v1.8 Navigation & Identity (In Progress)

**Milestone Goal:** Improve site navigation, communicate ride ethos, add brand attribution, and enhance history section readability with light/dark mode support.

#### Phase 45: Sticky Nav
**Goal**: Visitors can orient themselves and jump to any major section from a persistent navigation bar at any scroll depth.
**Depends on**: Phase 44 (prior milestone)
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06
**Success Criteria** (what must be TRUE):
  1. A navigation bar with History, Route, Gallery, and Sectors links appears below the hero and remains visible as the user scrolls to the bottom of the page.
  2. Clicking any nav link scrolls to the correct section and the section heading is fully visible below the nav bar (not obscured).
  3. On a 375px-wide mobile screen, all four links are visible inline without collapsing into a hamburger menu.
  4. The nav visually changes appearance (shadow or background shift) once the user has scrolled past the hero.
  5. As the user scrolls through the page, the nav link corresponding to the current section is visually highlighted.
**Plans**: TBD

Plans:
- [x] 45-01: StickyNav component, anchor IDs, scroll-margin-top, z-index budget

#### Phase 46: Ride Ethos + Brand Footer
**Goal**: Visitors immediately understand what kind of ride Hiawatha's Revenge is and see brand attribution at the bottom of the page.
**Depends on**: Phase 45
**Requirements**: ETHOS-01, ETHOS-02, ETHOS-03, FOOT-01, FOOT-02
**Success Criteria** (what must be TRUE):
  1. An ethos statement appears before the first content section (above the MBTN donate callout), communicating the founding date, free participation, fellowship over competition, and all-levels welcome in a compact declarative format.
  2. The ethos statement is visually distinct from body prose — larger, differently styled, not a paragraph.
  3. A "Powered by Neucadia" footer line appears at the very bottom of every page with an inline Neucadia logo linked to neucadia.com.
  4. The Neucadia logo loads from a local asset (not an external URL) and has no layout shift.
**Plans**: TBD

Plans:
- [ ] 46-01: RideEthos component + NeucadiaFooter component

#### Phase 47: History Light/Dark Mode
**Goal**: The History section is readable and visually rich in both light and dark OS color scheme preferences, with inspiration images fading in as the user scrolls.
**Depends on**: Phase 45
**Requirements**: MODE-01, MODE-02, MODE-03, MODE-04, MODE-05, MODE-06, MODE-07, MODE-08
**Success Criteria** (what must be TRUE):
  1. When the OS is set to light mode, the History section displays a beige/off-white background with dark text; when set to dark mode, the existing forest-950/white styling is unchanged.
  2. Desaturated inspiration images appear as faded background layers behind History section content in both light and dark modes.
  3. Inspiration images fade in when a History subsection scrolls into view and fade out when it leaves the viewport.
  4. All heading text in the History section passes WCAG AA contrast against its background in light mode.
  5. When the OS has prefers-reduced-motion enabled, the scroll-triggered image fade animations are disabled.
**Plans**: TBD

Plans:
- [ ] 47-01: HiawathaExplainer light-mode CSS + ::before image system + reduced-motion guard

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-11 | v1.0 | 33/33 | Complete | 2026-03-31 |
| 12-17 | v1.1 | 8/8 | Complete | 2026-03-31 |
| 18-22 | v1.2 | 17/17 | Complete | 2026-04-02 |
| 23-27 | v1.3 | 9/9 | Complete | 2026-04-02 |
| 28-32 | v1.4 | 7/7 | Complete | 2026-04-06 |
| 33-37 | v1.5 | 10/10 | Complete | 2026-04-06 |
| 38-39 | v1.6 | 2/2 | Complete | 2026-04-07 |
| 40-44 | v1.7 | 6/6 | Complete | 2026-04-07 |
| 45. Sticky Nav | v1.8 | 1/1 | Complete | 2026-04-07 |
| 46. Ride Ethos + Brand Footer | v1.8 | 0/TBD | Not started | - |
| 47. History Light/Dark Mode | v1.8 | 0/TBD | Not started | - |
