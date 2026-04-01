# Roadmap: Hiawatha's Revenge

## Milestones

- v1.0 MVP - Phases 0-11 (shipped 2026-03-31)
- v1.1 Visual Redesign - Phases 12-16 (shipped 2026-03-31)
- v1.2 Map Interactivity - Planned (SECT-01, SECT-02, SECT-03)

## Phases

<details>
<summary>v1.0 MVP (Phases 0-11) - SHIPPED 2026-03-31</summary>

12 phases, 33 plans. Delivered interactive route map, elevation profile, photo gallery, build pipeline, and Forest Service visual identity. See MILESTONES.md for details.

</details>

### v1.1 Visual Redesign (Complete)

**Milestone Goal:** Elevate the site from functional showcase to immersive editorial experience with Ojibwe-inspired design, rewritten narrative, dramatic hero section, and masonry gallery.

- [x] **Phase 12: Design Foundation** - Color tokens, hex tokenization, and layout restructure that unblock all visual work
- [x] **Phase 13: Hero & Event Date** - Full-width hero section with dramatic route photo and prominent event date
- [x] **Phase 14: Ojibwe Design System** - Woodland floral beadwork-inspired decorative elements with cultural attribution
- [x] **Phase 15: Editorial Content** - Rewritten Hiawatha narrative and photo-integrated route explainer
- [x] **Phase 16: Masonry Gallery** - Redesigned photo gallery with editorial sizing and featured photos

## Phase Details

### Phase 12: Design Foundation
**Goal**: Site infrastructure supports a warmer Ojibwe-inspired color palette and mixed full-width / constrained-width layouts
**Depends on**: Nothing (first phase of v1.1; builds on shipped v1.0)
**Requirements**: DSN-01, DSN-02, DSN-05
**Success Criteria** (what must be TRUE):
  1. New color tokens (berry, gold, lake, moss families) are available as Tailwind utilities and CSS custom properties, all passing WCAG AA contrast against dark backgrounds
  2. Zero hardcoded hex color values remain in RouteMap.astro and ElevationProfile.astro JavaScript -- all colors reference CSS custom properties via getComputedStyle()
  3. BaseLayout.astro no longer constrains main content to max-w-4xl; individual sections control their own widths, and existing page layout is visually unchanged
**Plans:** 2 plans
Plans:
- [x] 12-01-PLAN.md — Color tokens (@theme static + 4 new families) and layout restructure (BaseLayout + index.astro)
- [x] 12-02-PLAN.md — Replace all hardcoded hex values in RouteMap.astro and ElevationProfile.astro with getCSSColor()

### Phase 13: Hero & Event Date
**Goal**: Visitors see a dramatic full-width route photo and the event date immediately upon landing, creating an emotional first impression
**Depends on**: Phase 12 (DSN-05 layout restructure enables full-width breakout)
**Requirements**: HERO-01, HERO-02, HERO-03, HERO-04
**Success Criteria** (what must be TRUE):
  1. A full-viewport-width hero section displays a dramatic route photo as background with site name and tagline overlaid as readable text
  2. Hero image loads with fetchpriority="high" and responsive srcset -- LCP remains under 2.5s on simulated 4G
  3. Event date "June 6, 2026" is visible without scrolling on desktop (1280px) and within the first viewport on mobile (375px)
  4. Hero text overlay is readable at 375px, 768px, and 1280px viewports with no text clipping or overflow
**Plans:** 1 plan
Plans:
- [x] 13-01-PLAN.md — Select hero photo, create HeroSection.astro with LCP-optimized image + gradient overlay + fluid typography + event date, wire into index.astro

### Phase 14: Ojibwe Design System
**Goal**: Ojibwe woodland floral beadwork-inspired decorative elements enrich the visual identity with proper cultural attribution
**Depends on**: Phase 12 (DSN-01/DSN-02 color palette available for motif coloring)
**Requirements**: DSN-03, DSN-04
**Success Criteria** (what must be TRUE):
  1. SVG decorative elements (borders, dividers, motifs) inspired by Ojibwe woodland floral beadwork patterns appear as section dividers and ornamental accents, replacing or supplementing existing topo-divider patterns
  2. Cultural attribution for the Ojibwe woodland floral design tradition is visible in the site footer or a design credits section, accessible from any page
  3. All decorative SVG elements use role="presentation" aria-hidden="true" and do not interfere with screen reader navigation
**Plans:** 1 plan
Plans:
- [x] 14-01-PLAN.md — Create FloralDivider.astro with Ojibwe-inspired SVG motifs, replace topo-dividers in index.astro, add cultural attribution to footer

### Phase 15: Editorial Content
**Goal**: Visitors read a witty, sophisticated narrative about Longfellow's Hiawatha blunder and explore the route segment-by-segment with integrated photography
**Depends on**: Phase 12 (color palette), Phase 14 (Ojibwe decorative elements for section dividers and ornaments)
**Requirements**: NARR-01, NARR-02, NARR-03, NARR-04, NARR-05
**Success Criteria** (what must be TRUE):
  1. Hiawatha explainer text is rewritten in a witty New Yorker editorial tone that explains how Longfellow confused Hiawatha (Haudenosaunee peacemaker) with Nanabozho (Ojibwe trickster), incorporating direct quotes from data.md
  2. Route explainer section presents the ride segment-by-segment with names, distances, and star difficulty ratings from data.md, with route photos integrated alongside the text
  3. Content sections use editorial layout -- photos float alongside text with shape-outside wrapping or grid-area placement, not separated into distinct photo/text blocks
  4. Route explainer renders over a topographic background texture, visually distinct from other content sections
  5. Editorial layouts are responsive -- readable single-column flow on mobile (375px), photo-text layouts on tablet (768px) and desktop (1280px)
**Plans:** 2 plans
Plans:
- [x] 15-01-PLAN.md — Create HiawathaExplainer.astro with editorial narrative, wire into index.astro
- [x] 15-02-PLAN.md — Create RouteExplainer.astro with segments, photos, star ratings, topo background, wire into index.astro

### Phase 16: Masonry Gallery
**Goal**: Photo gallery showcases route photography with editorial sizing, featured hero images, and natural aspect ratios instead of uniform square crops
**Depends on**: Phase 12 (color tokens for gallery styling)
**Requirements**: GAL-01, GAL-02, GAL-03, GAL-04, GAL-05
**Success Criteria** (what must be TRUE):
  1. Gallery displays photos in a masonry-style layout using CSS columns with mixed sizes and natural aspect ratios (no square crops)
  2. Photos with featured: true in photos.json render at larger, column-spanning sizes within the gallery flow
  3. Clicking any gallery photo opens the PhotoSwipe lightbox with full-screen viewing and left/right navigation between photos
  4. Gallery is responsive -- single column on mobile (375px), 2 columns on tablet (768px), 3 columns on desktop (1280px) with consistent gutter spacing
**Plans:** 1 plan
Plans:
- [x] 16-01-PLAN.md — Masonry layout with CSS columns, featured photo pipeline, PhotoSwipe preservation

### Phase 17: Tech Debt & Photo Cleanup
**Goal**: Close all tech debt from v1.1 audit — dead CSS, brace imbalance, comment inaccuracy — and remove 3 duplicate photo pairs from the data pipeline
**Depends on**: Phase 16 (all v1.1 feature work complete)
**Requirements**: None (tech debt closure, not new requirements)
**Gap Closure**: Closes all items from v1.1-MILESTONE-AUDIT.md
**Success Criteria** (what must be TRUE):
  1. `.topo-divider` CSS rule is removed from global.css — zero references in HTML or CSS
  2. `@media (min-width: 640px)` brace imbalance in index.astro `<style>` block is fixed — `prefers-reduced-motion` rule applies at all viewport widths
  3. gold-600 WCAG AA inline comment accurately states it passes AA large text only (not AA normal text)
  4. Three `(1)` duplicate photos are removed from photos-manifest.json, source images, public images, and thumbnails — photos.json regenerated with 51 entries (down from 54)
  5. Build passes cleanly and site renders correctly
**Plans:** 1 plan
Plans:
- [ ] 17-01-PLAN.md — Remove dead CSS, fix brace imbalance, fix WCAG comment, remove duplicate photos and regenerate pipeline

## Progress

**Execution Order:**
Phases 12 through 16 execute in numeric order. Phase 17 executes after Phase 16 (gap closure).

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 12. Design Foundation | v1.1 | 2/2 | Complete | 2026-03-31 |
| 13. Hero & Event Date | v1.1 | 1/1 | Complete | 2026-03-31 |
| 14. Ojibwe Design System | v1.1 | 1/1 | Complete | 2026-03-31 |
| 15. Editorial Content | v1.1 | 2/2 | Complete | 2026-03-31 |
| 16. Masonry Gallery | v1.1 | 1/1 | Complete | 2026-03-31 |
| 17. Tech Debt & Photo Cleanup | v1.1 | 0/1 | Planned | — |

---
*Roadmap created: 2026-03-31*
*Milestone: v1.1 Visual Redesign (19 requirements, 6 phases)*
