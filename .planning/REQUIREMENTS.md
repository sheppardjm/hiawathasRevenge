# Requirements: Hiawatha's Revenge v1.10

**Defined:** 2026-04-08
**Core Value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.

## v1.10 Requirements

### Background Imagery

- [ ] **BG-01**: Route map section displays topo arrowheads inspiration image as subtle scroll-triggered background
- [ ] **BG-02**: Gallery section displays morel woodcut inspiration image as subtle scroll-triggered background
- [ ] **BG-03**: Both backgrounds use `::before` pseudo-element with sepia filter matching History section pattern
- [ ] **BG-04**: Both backgrounds fade in via IntersectionObserver when section enters viewport
- [ ] **BG-05**: Both backgrounds respect `prefers-reduced-motion` (static low opacity, no transition)
- [ ] **BG-06**: Both backgrounds have light-mode overrides via `@media (prefers-color-scheme: light)`
- [ ] **BG-07**: Two new images processed via `process-inspiration-bg.js` (route-bg.webp, gallery-bg.webp)

## Future Requirements

None — focused milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Route Explainer section background | User clarified: route map and gallery only |
| Elevation Profile section background | Not requested |
| Site-wide background pattern overhaul | Targeted addition, not a redesign |
| New inspiration image sourcing | Using existing library images |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BG-01 | Phase 49 | Pending |
| BG-02 | Phase 49 | Pending |
| BG-03 | Phase 49 | Pending |
| BG-04 | Phase 49 | Pending |
| BG-05 | Phase 49 | Pending |
| BG-06 | Phase 49 | Pending |
| BG-07 | Phase 49 | Pending |

**Coverage:**
- v1.10 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after roadmap creation*
