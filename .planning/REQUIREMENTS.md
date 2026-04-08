# Requirements: Hiawatha's Revenge v1.8

**Defined:** 2026-04-07
**Core Value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.

## v1.8 Requirements

Requirements for milestone v1.8 "Navigation & Identity." Each maps to roadmap phases.

### Navigation

- [x] **NAV-01**: Sticky navigation bar below hero with 4 links: History, Route, Gallery, Sectors
- [x] **NAV-02**: Section anchor IDs added to all target sections (#history, #route, #gallery, #sectors)
- [x] **NAV-03**: scroll-margin-top on all anchor targets so sticky nav does not cover section headings
- [x] **NAV-04**: Nav visible on all screen sizes including 375px mobile — no hamburger menu, inline links only
- [x] **NAV-05**: Visual distinction when nav becomes stuck (drop shadow or background shift)
- [x] **NAV-06**: Active section highlighting in nav as user scrolls through the page

### Ride Ethos

- [x] **ETHOS-01**: Statement-format explainer with founding date (June 7, 2014), always free, fellowship over competition, all levels welcome
- [x] **ETHOS-02**: Positioned right after the hero, above the gold DonateCallout — values statement before any content
- [x] **ETHOS-03**: Visually distinct from body text — larger font, different color/styling, compact declarative format (not prose)

### Brand Footer

- [x] **FOOT-01**: "Powered by Neucadia" full-width single line at bottom of page
- [x] **FOOT-02**: Neucadia logo downloaded as local asset, displayed inline, linked to neucadia.com

### History Light/Dark Mode

- [ ] **MODE-01**: prefers-color-scheme CSS-only light/dark switching for history section (no JS toggle)
- [ ] **MODE-02**: Light mode: beige/off-white background using existing cream tokens, dark text
- [ ] **MODE-03**: Dark mode: current forest-950/white styling unchanged
- [ ] **MODE-04**: Faded desaturated inspiration images as absolutely positioned backgrounds in both modes
- [ ] **MODE-05**: Scroll-triggered fade in/out for inspiration images (using existing IntersectionObserver pattern)
- [ ] **MODE-06**: WCAG AA contrast verified for all heading colors in light mode
- [ ] **MODE-07**: Smooth CSS transition on filter property to avoid flicker between modes
- [ ] **MODE-08**: prefers-reduced-motion respected — disable scroll-triggered animations when set

## Future Requirements

Deferred to later milestones.

- **NAV-F01**: Smooth scroll animation on anchor link clicks
- **MODE-F01**: Site-wide light/dark mode (beyond history section)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Hamburger menu on mobile | 4 links fit at 375px; hamburger adds interaction cost |
| JS dark/light mode toggle | No user accounts or preference persistence; OS setting sufficient |
| Full grayscale on images | Looks like error state; use sepia/antique filter treatment |
| Animated Neucadia logo | Self-promotional distraction in a credit line |
| Separate light/dark image assets | CSS filter achieves both from single source |
| Bottom mobile nav bar | Native app pattern; conflicts with editorial scroll UX |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 45 | Complete |
| NAV-02 | Phase 45 | Complete |
| NAV-03 | Phase 45 | Complete |
| NAV-04 | Phase 45 | Complete |
| NAV-05 | Phase 45 | Complete |
| NAV-06 | Phase 45 | Complete |
| ETHOS-01 | Phase 46 | Complete |
| ETHOS-02 | Phase 46 | Complete |
| ETHOS-03 | Phase 46 | Complete |
| FOOT-01 | Phase 46 | Complete |
| FOOT-02 | Phase 46 | Complete |
| MODE-01 | Phase 47 | Pending |
| MODE-02 | Phase 47 | Pending |
| MODE-03 | Phase 47 | Pending |
| MODE-04 | Phase 47 | Pending |
| MODE-05 | Phase 47 | Pending |
| MODE-06 | Phase 47 | Pending |
| MODE-07 | Phase 47 | Pending |
| MODE-08 | Phase 47 | Pending |

**Coverage:**
- v1.8 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-07 after roadmap creation*
