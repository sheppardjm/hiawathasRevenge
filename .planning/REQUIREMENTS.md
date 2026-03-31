# Requirements: Hiawatha's Revenge v1.1

**Defined:** 2026-03-31
**Core Value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.

## v1.1 Requirements

Requirements for visual redesign milestone. Each maps to roadmap phases.

### Design System

- [ ] **DSN-01**: Color palette evolves from pure Forest Service green/amber to warmer Ojibwe-inspired tones (berry, gold, lake) while maintaining WCAG AA contrast ratios
- [ ] **DSN-02**: Hardcoded hex color values in RouteMap.astro and ElevationProfile.astro JavaScript are replaced with CSS custom property references so palette changes propagate automatically
- [x] **DSN-03**: Ojibwe woodland floral beadwork-inspired SVG decorative elements (borders, dividers, motifs) replace or supplement existing topo-divider patterns
- [x] **DSN-04**: Cultural attribution for Ojibwe woodland floral design tradition appears in site footer or design credits section
- [ ] **DSN-05**: BaseLayout.astro container width constraint is removed from `<main>` and moved to individual sections, enabling full-width breakout sections

### Hero & Event

- [x] **HERO-01**: Full-width hero section displays a dramatic route photo as background with overlay text (site name, tagline)
- [x] **HERO-02**: Hero image is optimized for LCP — uses `<img>` with fetchpriority="high", appropriate srcset, and no lazy-loading
- [x] **HERO-03**: Event date (June 6, 2026) is prominently displayed in or near the hero section, visible without scrolling on desktop
- [x] **HERO-04**: Hero section is responsive — full viewport width on all breakpoints with readable text overlay at 375px, 768px, and 1280px

### Content & Narrative

- [ ] **NARR-01**: Hiawatha explainer text is rewritten in a witty, sophisticated New Yorker tone that highlights Longfellow's conflation of Hiawatha (Haudenosaunee peacemaker) with Nanabozho (Ojibwe trickster)
- [ ] **NARR-02**: Narrative incorporates direct quotes from data.md historical content about Hiawatha and the Longfellow critique
- [ ] **NARR-03**: Route explainer section presents the ride segment-by-segment with integrated route photos and historical context over a topographic background
- [ ] **NARR-04**: Route explainer uses segment data from data.md (names, distances, star difficulty ratings) to structure the narrative
- [ ] **NARR-05**: Content sections use editorial layout with photos integrated alongside text (not separated into distinct photo/text blocks)

### Gallery

- [ ] **GAL-01**: Photo gallery uses a masonry-style layout with mixed photo sizes (CSS columns, not uniform grid)
- [ ] **GAL-02**: 2-4 featured photos are displayed at larger sizes (hero treatment) within the gallery flow
- [ ] **GAL-03**: Gallery maintains PhotoSwipe lightbox functionality — clicking any photo opens full-screen viewing with navigation
- [ ] **GAL-04**: Gallery is responsive — single column on mobile, 2 columns on tablet, 3 columns on desktop with appropriate gutter spacing
- [ ] **GAL-05**: Photos with `featured: true` in photos.json are rendered at larger column-spanning sizes

## v1.2 Requirements

Deferred to next milestone. Tracked but not in current roadmap.

### Map Interactivity

- **SECT-01**: Gravel sectors labeled on map with names and star difficulty ratings
- **SECT-02**: Clicking a sector opens a slide-out detail panel with description, surface type, and elevation snippet
- **SECT-03**: Detail panel is responsive — right slide-out on desktop, bottom sheet on mobile

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| CSS Grid masonry (`grid-template-rows: masonry`) | Zero stable browser support — use CSS columns fallback |
| New npm dependencies for gallery | CSS columns achieves masonry without JS libraries |
| Sector detail panels | Deferred to v1.2 — highest complexity, lowest urgency for visual redesign |
| Dark/light mode toggle | Contradicts intentional curated visual identity |
| Printable route card / PDF | Deferred to v2+ |
| Blog / ride reports | Content maintenance burden |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DSN-01 | Phase 12: Design Foundation | Complete |
| DSN-02 | Phase 12: Design Foundation | Complete |
| DSN-03 | Phase 14: Ojibwe Design System | Complete |
| DSN-04 | Phase 14: Ojibwe Design System | Complete |
| DSN-05 | Phase 12: Design Foundation | Complete |
| HERO-01 | Phase 13: Hero & Event Date | Complete |
| HERO-02 | Phase 13: Hero & Event Date | Complete |
| HERO-03 | Phase 13: Hero & Event Date | Complete |
| HERO-04 | Phase 13: Hero & Event Date | Complete |
| NARR-01 | Phase 15: Editorial Content | Pending |
| NARR-02 | Phase 15: Editorial Content | Pending |
| NARR-03 | Phase 15: Editorial Content | Pending |
| NARR-04 | Phase 15: Editorial Content | Pending |
| NARR-05 | Phase 15: Editorial Content | Pending |
| GAL-01 | Phase 16: Masonry Gallery | Pending |
| GAL-02 | Phase 16: Masonry Gallery | Pending |
| GAL-03 | Phase 16: Masonry Gallery | Pending |
| GAL-04 | Phase 16: Masonry Gallery | Pending |
| GAL-05 | Phase 16: Masonry Gallery | Pending |

**Coverage:**
- v1.1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after Phase 14 completion*
