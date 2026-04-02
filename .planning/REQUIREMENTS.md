# Requirements: Hiawatha's Revenge v1.2

**Defined:** 2026-03-31
**Core Value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.

## v1.2 Requirements

Requirements for Cultural Maximalism milestone. Each maps to roadmap phases.

### Design System

- [ ] **DES-01**: Color palette expands with turquoise, vermillion/scarlet, and sun-yellow token families added to `@theme static`, each with WCAG AA contrast ratios documented against forest-900/950 backgrounds
- [ ] **DES-02**: Orphaned v1.1 color tokens (lake-500, berry-500, moss-600, etc.) are activated and assigned purpose in the design system
- [x] **DES-03**: Each major page section has a distinct background color drawn from the expanded palette, creating visual rhythm and "journey through distinct moments" rather than monochromatic scroll
- [x] **DES-04**: 60-30-10 color distribution rule applied: forest-900/950 dominant backgrounds (60%), existing berry/gold/lake/moss accents (30%), new bold colors as pop accents (10%)

### Decorative System

- [ ] **DEC-01**: Animated multicolored section dividers replace static FloralDividers with vine drawing on scroll (CSS `stroke-dashoffset`), blossom color cycling (CSS `@property`), and section-specific color theming via `variant` prop
- [ ] **DEC-02**: 2-3 divider variants exist (full floral vine, berry cluster, minimal double-curve) for major vs. minor section breaks
- [ ] **DEC-03**: All divider animations respect `prefers-reduced-motion` — static beautifully-colored fallback shown when motion is reduced
- [ ] **DEC-04**: Shield/arrowhead motif extracted from hero badge SVG into reusable component, appearing as heading icons (16-24px), background watermarks (400-600px at 3-5% opacity), pull quote ornaments, and footer mark
- [ ] **DEC-05**: Shield motif uses SVG `<symbol>` + `<use>` for zero-HTTP-request reuse with `currentColor` inheritance from Tailwind classes

### Content Enrichment

- [x] **CON-01**: HiawathaExplainer sections broken up with secondary/tertiary headings in National Park typeface ("The Poem," "The Confusion," "The Forest," "The Ride" or similar), using 3+ colors to differentiate sections
- [x] **CON-02**: 1-2 full-width historical illustration breaks inserted between narrative paragraphs with generous whitespace (6-8rem between major sections)
- [x] **CON-03**: Dramatic pull quote treatment for the Longfellow critique blockquote — breakout-width, oversized quotation marks (60-80px), background color shift, National Park typeface, arrowhead ornament
- [x] **CON-04**: 2-4 public domain historical Hiawatha illustrations (Harrison Fisher 1906, Frederic Remington 1891, or similar) sourced, processed through sharp pipeline as WebP, with `<figcaption>` attribution and "historical artifact" framing (sepia/desaturated treatment)
- [x] **CON-05**: Historical illustrations distinguished visually from route photography — sepia/desaturated treatment for historical vs. full-color for route photos

### Route Enrichment

- [x] **RTE-01**: Segment subheadings set in National Park typeface at larger size with difficulty-coded color (green/amber/rust) and shield/arrowhead icon prefix
- [ ] **RTE-02**: Per-sector elevation sparkline displayed as build-time SVG polyline (zero JavaScript) showing elevation gain/loss for that segment
- [x] **RTE-03**: Strava segment link per sector (outbound `<a>` tag to `strava.com/segments/[ID]`) with Strava icon — user provides segment IDs during implementation
- [x] **RTE-04**: Expanded terrain descriptions including surface type, key landmarks, and seasonal notes for each segment
- [ ] **RTE-05**: Pipeline extended to compute per-segment elevation data from route-data.json for sparkline generation

### Animation & Polish

- [ ] **ANI-01**: CSS scroll-driven section reveals — each major `<section>` fades in and slides up 20-30px as it enters the viewport via IntersectionObserver
- [ ] **ANI-02**: Staggered child reveals within route explainer — segment cards reveal sequentially with 100ms stagger
- [ ] **ANI-03**: All scroll-driven animations respect `prefers-reduced-motion` — content shown statically when motion is reduced
- [ ] **ANI-04**: Performance budget maintained: page transfer <3MB, LCP <2.5s on simulated 4G, no above-fold animations

## v1.3 Requirements

Deferred to next milestone. Tracked but not in current roadmap.

### Map Interactivity

- **SECT-01**: Gravel sectors labeled on map with names and star difficulty ratings
- **SECT-02**: Clicking a sector opens a slide-out detail panel with description, surface type, and elevation snippet
- **SECT-03**: Detail panel is responsive — right slide-out on desktop, bottom sheet on mobile

### Future Enhancements

- **CSS `animation-timeline: view()`** as primary scroll animation (when Firefox ships support)
- **Parallax depth effects** (deferred due to mobile Safari performance and motion sickness risk)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Parallax scrolling | Mobile Safari performance issues, motion sickness risk, scroll reveals provide pacing |
| Strava route embed (iframe) | Third-party dependency, fights site styling, existing Leaflet map is better |
| Video content (drone, ride footage) | No assets exist, autoplay destroys CWV, photos are sufficient |
| Dark/light mode toggle | Dark forest palette IS the brand identity; would require parallel design system |
| AI-generated cultural imagery | Contradicts site's critique of cultural appropriation |
| Scroll-jacking / snap scrolling | Breaks natural scroll, harms accessibility |
| Full-width text content | Degrades readability past 75 characters per line; use full-width backgrounds instead |
| New npm dependencies | All features achievable with CSS/SVG/build-time Astro |
| Chart.js for sparklines | Memory bloat (30KB+ per instance x 7); build-time SVG polyline is correct |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DES-01 | Phase 18 | Complete |
| DES-02 | Phase 18 | Complete |
| DES-03 | Phase 21 | Complete |
| DES-04 | Phase 21 | Complete |
| DEC-01 | Phase 19 | Complete |
| DEC-02 | Phase 19 | Complete |
| DEC-03 | Phase 19 | Complete |
| DEC-04 | Phase 19 | Complete |
| DEC-05 | Phase 19 | Complete |
| CON-01 | Phase 20 | Pending |
| CON-02 | Phase 20 | Pending |
| CON-03 | Phase 20 | Pending |
| CON-04 | Phase 20 | Pending |
| CON-05 | Phase 20 | Pending |
| RTE-01 | Phase 20 | Pending |
| RTE-02 | Phase 19 | Complete |
| RTE-03 | Phase 20 | Pending |
| RTE-04 | Phase 20 | Pending |
| RTE-05 | Phase 19 | Complete |
| ANI-01 | Phase 22 | Pending |
| ANI-02 | Phase 22 | Pending |
| ANI-03 | Phase 22 | Pending |
| ANI-04 | Phase 22 | Pending |

**Coverage:**
- v1.2 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after roadmap creation*
