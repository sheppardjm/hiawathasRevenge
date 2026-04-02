# Roadmap: Hiawatha's Revenge

## Milestones

- ✅ **v1.0 MVP** -- Phases 0-11 (shipped 2026-03-31)
- ✅ **v1.1 Visual Redesign** -- Phases 12-17 (shipped 2026-03-31)
- 🚧 **v1.2 Cultural Maximalism** -- Phases 18-22 (in progress)
- 📋 **v1.3 Map Interactivity** -- Planned (SECT-01, SECT-02, SECT-03)

## Phases

<details>
<summary>v1.0 MVP (Phases 0-11) -- SHIPPED 2026-03-31</summary>

12 phases, 33 plans. Delivered interactive route map, elevation profile, photo gallery, build pipeline, and Forest Service visual identity. See milestones/v1.0-ROADMAP.md for details.

</details>

<details>
<summary>v1.1 Visual Redesign (Phases 12-17) -- SHIPPED 2026-03-31</summary>

6 phases, 8 plans. Delivered Ojibwe-inspired design system, full-viewport hero, editorial narrative, route explainer, masonry gallery, and tech debt closure. See milestones/v1.1-ROADMAP.md for details.

- [x] Phase 12: Design Foundation (2/2 plans) -- completed 2026-03-31
- [x] Phase 13: Hero & Event Date (1/1 plan) -- completed 2026-03-31
- [x] Phase 14: Ojibwe Design System (1/1 plan) -- completed 2026-03-31
- [x] Phase 15: Editorial Content (2/2 plans) -- completed 2026-03-31
- [x] Phase 16: Masonry Gallery (1/1 plan) -- completed 2026-03-31
- [x] Phase 17: Tech Debt & Photo Cleanup (1/1 plan) -- completed 2026-03-31

</details>

### 🚧 v1.2 Cultural Maximalism (In Progress)

**Milestone Goal:** Transform the site into a maximalist cultural celebration -- bold colors, historical imagery, enriched segment content, animated section breaks, and shield motifs layered throughout, worthy of an award-winning non-profit heritage site.

- [x] **Phase 18: Color Foundation** - Expanded palette tokens and pipeline prep for historical imagery (completed 2026-04-01)
- [x] **Phase 19: Decorative Component Library** - Animated dividers, shield motifs, and elevation sparklines (completed 2026-04-01)
- [x] **Phase 20: Content & Route Enrichment** - Historical imagery, editorial restructure, and segment detail expansion (completed 2026-04-01)
- [ ] **Phase 21: Section Color Differentiation** - Per-section backgrounds and page assembly with animated dividers
- [ ] **Phase 22: Animation & Polish** - Scroll-driven reveals, accessibility audit, and performance validation

## Phase Details

### Phase 18: Color Foundation
**Goal**: Visitors see a richer, bolder color vocabulary across the site, and the build pipeline can process historical illustrations alongside route photos
**Depends on**: Phase 17 (v1.1 complete)
**Requirements**: DES-01, DES-02
**Success Criteria** (what must be TRUE):
  1. New turquoise, vermillion/scarlet, and sun-yellow color tokens are visible in the site's CSS custom properties and render correctly in a browser
  2. Orphaned v1.1 tokens (lake-500, berry-500, moss-600, etc.) appear in at least one visible element on the page
  3. Every new color token has a documented WCAG AA contrast ratio against forest-900 and forest-950 backgrounds, with each classified as text-safe, large-text-only, or decorative-only
  4. The build pipeline accepts images with a `category: "historical"` field and processes them through the sharp WebP pipeline without breaking existing route photo processing
**Plans**: ~2 plans

Plans:
- [x] 18-01: Palette expansion and contrast documentation
- [x] 18-02: Pipeline extension for historical image category

### Phase 19: Decorative Component Library
**Goal**: Three new reusable Astro components exist (AnimatedDivider, ShieldMotif, ElevationSparkline) that can be dropped into any section, establishing the animation accessibility pattern for the entire milestone
**Depends on**: Phase 18 (color tokens available for component theming)
**Requirements**: DEC-01, DEC-02, DEC-03, DEC-04, DEC-05, RTE-02, RTE-05
**Success Criteria** (what must be TRUE):
  1. Animated section dividers draw vine paths on scroll with cycling blossom colors, and at least 2 visual variants (full floral vine, berry cluster, or minimal double-curve) are available via a `variant` prop
  2. With macOS "Reduce Motion" enabled, all divider animations stop completely and a static, beautifully-colored fallback is shown instead
  3. Shield/arrowhead motif renders at multiple sizes (icon 16-24px, watermark 400-600px) using SVG `<symbol>` + `<use>` with zero additional HTTP requests and color inherited from parent Tailwind classes
  4. Per-sector elevation sparklines render as static SVG polylines showing each segment's elevation profile, generated at build time with zero client-side JavaScript
  5. Pipeline computes per-segment elevation data from route-data.json and makes it available for sparkline generation
**Plans**: 3 plans

Plans:
- [x] 19-01: AnimatedDivider component with variants and reduced-motion support
- [x] 19-02: ShieldMotif component with symbol/use reuse pattern
- [x] 19-03: ElevationSparkline component and pipeline elevation extraction
- [x] 19-04: Blossom color cycling animation (gap closure)
- [x] 19-05: Component page integration (gap closure)

### Phase 20: Content & Route Enrichment
**Goal**: The HiawathaExplainer and RouteExplainer sections are transformed with historical imagery, dramatic typography, pull quotes, and enriched segment details -- the site reads like an award-winning editorial feature, not a simple ride page
**Depends on**: Phase 19 (decorative components available for integration), Phase 18 (pipeline processes historical images)
**Requirements**: CON-01, CON-02, CON-03, CON-04, CON-05, RTE-01, RTE-03, RTE-04
**Success Criteria** (what must be TRUE):
  1. HiawathaExplainer has secondary/tertiary subheadings in National Park typeface ("The Poem," "The Confusion," "The Forest," "The Ride" or similar) with 3+ distinct heading colors
  2. At least 2 public domain historical Hiawatha illustrations appear between narrative paragraphs with `<figcaption>` attribution, sepia/desaturated "historical artifact" treatment, and generous whitespace (6-8rem between major sections)
  3. Historical illustrations are visually distinct from route photography -- sepia/desaturated for historical versus full-color for route photos
  4. The Longfellow critique blockquote has dramatic pull quote treatment -- breakout width, oversized quotation marks, background color shift, and arrowhead ornament
  5. Each route segment has a National Park typeface subheading with difficulty-coded color and shield icon, a Strava segment link, and expanded terrain description with surface type, landmarks, and seasonal notes
**Plans**: 3 plans

Plans:
- [x] 20-01: Historical image sourcing and HiawathaExplainer editorial restructure with subheadings
- [x] 20-02: Dramatic pull quote treatment with ShieldMotif ornament
- [x] 20-03: RouteExplainer enrichment with difficulty-coded shields, Strava links, and expanded terrain descriptions

### Phase 21: Section Color Differentiation
**Goal**: Scrolling the page feels like a journey through distinct visual moments -- each major section has its own background color, animated dividers transition between them, and the 60-30-10 color rule creates visual rhythm without chaos
**Depends on**: Phase 20 (content complete -- section backgrounds wrap final content)
**Requirements**: DES-03, DES-04
**Success Criteria** (what must be TRUE):
  1. Each major page section (hero, explainer, route, gallery, donate) has a distinct background color drawn from the expanded palette, creating visible color transitions on scroll
  2. The overall page follows the 60-30-10 color distribution: forest-900/950 dominant backgrounds (~60%), berry/gold/lake/moss accents (~30%), turquoise/scarlet/sun pop accents (~10%)
  3. AnimatedDividers are wired into index.astro between sections, replacing static FloralDivider instances, with section-specific color theming via variant prop
**Plans**: ~1 plan

Plans:
- [ ] 21-01: Section backgrounds, 60-30-10 distribution, and divider integration

### Phase 22: Animation & Polish
**Goal**: The page has subtle, performant scroll-driven reveals that reward scrolling, all animations respect reduced-motion preferences, and the site passes accessibility and performance budgets
**Depends on**: Phase 21 (all content and visual composition finalized)
**Requirements**: ANI-01, ANI-02, ANI-03, ANI-04
**Success Criteria** (what must be TRUE):
  1. Major sections fade in and slide up 20-30px as they enter the viewport on scroll, with route explainer segment cards revealing sequentially with visible stagger
  2. With macOS "Reduce Motion" enabled, all scroll-driven animations are disabled and content appears statically -- no fade, no slide, no stagger
  3. No animations fire above the fold -- hero and first-visible content render without any entrance animation
  4. Page transfer size is under 3MB and Lighthouse mobile LCP is under 2.5s on simulated 4G
**Plans**: ~2 plans

Plans:
- [ ] 22-01: Scroll-driven section reveals and staggered card animations
- [ ] 22-02: Accessibility audit and performance validation

## Progress

**Execution Order:**
Phases execute in numeric order: 18 -> 19 -> 20 -> 21 -> 22

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 0-11 | v1.0 | 33/33 | Complete | 2026-03-31 |
| 12-17 | v1.1 | 8/8 | Complete | 2026-03-31 |
| 18. Color Foundation | v1.2 | 2/2 | Complete | 2026-04-01 |
| 19. Decorative Components | v1.2 | 5/5 | Complete | 2026-04-01 |
| 20. Content & Route Enrichment | v1.2 | 3/3 | Complete | 2026-04-01 |
| 21. Section Color Differentiation | v1.2 | 0/1 | Not started | - |
| 22. Animation & Polish | v1.2 | 0/2 | Not started | - |

---
*Roadmap created: 2026-03-31*
*v1.1 archived: 2026-03-31*
*v1.2 roadmap added: 2026-03-31*
