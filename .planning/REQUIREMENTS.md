# Requirements: Hiawatha's Revenge v1.8

**Defined:** 2026-04-07
**Core Value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.

## v1.8 Requirements

Requirements for milestone v1.8 "Navigation & Identity." Each maps to roadmap phases.

### Navigation

- [ ] **NAV-01**: Sticky navigation bar below hero with 4 links: History, Route, Gallery, Sectors
- [ ] **NAV-02**: Section anchor IDs added to all target sections (#history, #route, #gallery, #sectors)
- [ ] **NAV-03**: scroll-margin-top on all anchor targets so sticky nav does not cover section headings
- [ ] **NAV-04**: Nav visible on all screen sizes including 375px mobile — no hamburger menu, inline links only
- [ ] **NAV-05**: Visual distinction when nav becomes stuck (drop shadow or background shift)
- [ ] **NAV-06**: Active section highlighting in nav as user scrolls through the page

### Ride Ethos

- [ ] **ETHOS-01**: Statement-format explainer with founding date (June 7, 2014), always free, fellowship over competition, all levels welcome
- [ ] **ETHOS-02**: Positioned right after the hero, above the gold DonateCallout — values statement before any content
- [ ] **ETHOS-03**: Visually distinct from body text — larger font, different color/styling, compact declarative format (not prose)

### Brand Footer

- [ ] **FOOT-01**: "Powered by Neucadia" full-width single line at bottom of page
- [ ] **FOOT-02**: Neucadia logo downloaded as local asset, displayed inline, linked to neucadia.com

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
| NAV-01 | — | Pending |
| NAV-02 | — | Pending |
| NAV-03 | — | Pending |
| NAV-04 | — | Pending |
| NAV-05 | — | Pending |
| NAV-06 | — | Pending |
| ETHOS-01 | — | Pending |
| ETHOS-02 | — | Pending |
| ETHOS-03 | — | Pending |
| FOOT-01 | — | Pending |
| FOOT-02 | — | Pending |
| MODE-01 | — | Pending |
| MODE-02 | — | Pending |
| MODE-03 | — | Pending |
| MODE-04 | — | Pending |
| MODE-05 | — | Pending |
| MODE-06 | — | Pending |
| MODE-07 | — | Pending |
| MODE-08 | — | Pending |

**Coverage:**
- v1.8 requirements: 19 total
- Mapped to phases: 0
- Unmapped: 19 (pending roadmap creation)

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-07 after initial definition*
