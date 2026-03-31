# Project Research Summary

**Project:** Hiawatha's Revenge v1.1 Visual Redesign
**Domain:** Static cycling route showcase -- editorial visual upgrade (Astro 6 / Tailwind 4)
**Researched:** 2026-03-31
**Confidence:** HIGH

## Executive Summary

Hiawatha's Revenge v1.1 transforms an already-functional static cycling route showcase into an immersive editorial experience. The v1.0 site ships with a working interactive map, elevation profile, photo gallery, and narrative -- all the data infrastructure is solid. The v1.1 redesign changes how content is presented, not what content exists. Research across stack, features, architecture, and pitfalls converges on a single critical finding: **this redesign requires zero new npm dependencies.** Every feature -- full-width hero, masonry gallery, slide-out sector panels, Ojibwe-inspired decorative motifs, color palette evolution, and editorial layouts -- is achievable with CSS techniques already available in Tailwind 4 and modern browsers, plus vanilla JavaScript for the one interactive component (sector detail panel using HTML `<dialog>`).

The recommended approach is to treat this as a layered visual evolution, not a rewrite. The existing Astro component architecture, CustomEvent bus (3 events today, extending to 6-7), lazy-loading patterns, and two-phase build pipeline all remain intact. The biggest structural change is a one-line edit to `BaseLayout.astro` -- removing the global `max-w-4xl` container constraint from `<main>` so individual sections can control their own widths. Everything else is additive: 6 new Astro components, expanded `@theme` color tokens, and SVG decorative elements. The masonry gallery uses CSS `columns` (99%+ browser support), not the still-unshippable native CSS masonry spec (0.02% support). The sector detail panel uses HTML `<dialog>` with `showModal()` (96.86% support) for free accessibility -- focus trapping, Escape key, backdrop, and screen reader announcements with zero custom code.

The two highest-risk areas are cultural sensitivity and color migration. The Ojibwe woodland floral design elements require careful attribution and cultural framing -- the site already critiques Longfellow's cultural appropriation, so using Ojibwe art without context would be hypocritical. The Neebin.com Anishinaabe Floral Set (created by an Anishinaabe artist for digital use) provides a defensible starting point. Color migration is risky because the codebase has hardcoded hex values in Chart.js configs, Leaflet marker SVGs, and inline styles that will not update when `@theme` tokens change -- these must be audited and tokenized before any palette shifts.

## Key Findings

### Recommended Stack

The v1.1 redesign adds nothing to the dependency tree. The core stack -- Astro 6, Tailwind 4, Leaflet, Chart.js, PhotoSwipe 5, sharp -- is unchanged. All visual features are implemented with CSS and vanilla JS that the existing stack already supports.

**Core techniques (all zero-dependency):**
- **CSS `columns` + `break-inside-avoid`**: Masonry gallery layout -- 99%+ browser support, Tailwind `columns-*` utilities built-in
- **HTML `<dialog>` + `showModal()`**: Sector detail slide-out panel -- 96.86% support, free accessibility
- **CSS `@starting-style`**: Smooth open/close transitions on `<dialog>` -- 89% support with graceful degradation (instant close in older browsers)
- **Tailwind 4 `@theme` block extensions**: New color tokens auto-generate utility classes -- zero config, zero plugins
- **Inline SVG `<pattern>` + CSS `background-image` data URIs**: Ojibwe-inspired decorative elements -- matches existing `topo-divider` technique
- **CSS Grid `grid-template-areas` + `float` + `shape-outside`**: Editorial photo-text layouts -- 97%+ support
- **`::first-letter` with `initial-letter` progressive enhancement**: Drop caps -- universal base, 91% enhanced

**Critical version/support notes:**
- Do NOT use native CSS masonry (`grid-template-rows: masonry` or `display: grid-lanes`) -- 0.02% global support, Safari 26.4+ only
- Do NOT add Masonry.js, Isotope, GSAP, or any JS layout/animation library
- Do NOT add new fonts -- the National Park + Space Mono pairing is the identity
- Do NOT add Tailwind plugins (@tailwindcss/typography, @tailwindcss/forms) -- custom CSS in `@layer` is sufficient

### Expected Features

**Must have (table stakes) -- the redesign looks incomplete without these:**
- Full-width hero section with route photo, gradient overlay, badge relocation, and event date ("June 6, 2026 / Munising, MI")
- Masonry/editorial photo gallery replacing the uniform square-crop grid, with featured photo support and natural aspect ratios
- Route narrative rewrite with photo-integrated editorial layout, pull quotes, and drop caps
- Color palette evolution -- new berry, gold, lake, and moss accent families extending (not replacing) the existing forest/amber/rust/cream tokens

**Should have (differentiators) -- what makes the site shareable:**
- Interactive sector map labels with slide-out detail panels (name, difficulty stars, surface, description)
- Ojibwe woodland floral design elements as decorative system (section dividers, pull-quote ornaments, background patterns) with cultural attribution
- Photo-integrated route explainer section over topographic background
- Witty New Yorker editorial tone for the Hiawatha/Nanabozho narrative

**Explicitly not building (anti-features):**
- Countdown timer (goes stale after event, explicitly out of scope)
- Parallax scrolling / scrollytelling (2-minute read does not justify 20-hour implementation)
- Video hero (no video assets exist; one great photo beats one okay video)
- Instagram embed, registration form, multi-page site, animated route drawing, dark/light toggle
- AI-generated Ojibwe art (culturally inappropriate)

### Architecture Approach

The architecture is additive, not a rewrite. The existing CustomEvent bus pattern extends from 3 events to 6-7 with two new event pairs (`sector:click`/`sector:close`, `sector:hover`/`sector:leave`). The critical structural change is moving width constraints from `BaseLayout.astro`'s `<main>` to individual sections in `index.astro`, enabling mixed full-width and constrained-width layouts. Six new Astro components are created; three existing components are modified (RouteMap, ElevationProfile, PhotoGallery); the build pipeline gets two minor schema extensions (photos.json `featured` + `aspectRatio`, annotations.json `stars` + `surface` + `description`). No new pages, layouts, scripts, or dependencies.

**New components (6):**
1. `HeroSection.astro` -- Full-width hero with photo, overlay gradient, badge SVG (extracted from index.astro), event date
2. `SectorDetailPanel.astro` -- Slide-out `<dialog>` panel for sector info, listens to `sector:click` events
3. `NarrativeSection.astro` -- Rewritten Hiawatha narrative with editorial layout, integrated photos, pull quotes
4. `RouteExplainer.astro` -- Photo-integrated sector-by-sector route overview over topographic background
5. `OjibweBorder.astro` -- Reusable SVG decorative divider (replaces/supplements `topo-divider`)
6. `OjibweMotif.astro` -- Standalone decorative SVG motif for pull-quote ornaments and backgrounds

**Modified components (3):**
1. `RouteMap.astro` -- Add sector labels (L.divIcon at midpoints) and click handlers dispatching `sector:click`
2. `ElevationProfile.astro` -- Add click callbacks on sector annotation bands dispatching `sector:click`
3. `PhotoGallery.astro` -- Rewrite from uniform grid to CSS columns masonry, support `featured` flag, remove `aspect-square` crops

**Key architectural patterns preserved:**
- CustomEvent bus for cross-component communication (no state store needed at 6-7 events)
- IntersectionObserver lazy loading on RouteMap and ElevationProfile
- Scoped `<style>` blocks per component; only `@theme` tokens and `@layer` rules in global.css
- `role="presentation" aria-hidden="true"` for all decorative SVG elements

### Critical Pitfalls

1. **CSS masonry has no production browser support** -- `grid-template-rows: masonry` / `display: grid-lanes` works in 0.02% of browsers. Build the gallery with CSS `columns` (99%+). Use `@supports` only as progressive enhancement. Test in Chrome stable first, always.

2. **Full-width hero image tanks LCP** -- The current site has no above-fold images and loads sub-1s. Adding a hero photo without `loading="eager"`, `fetchpriority="high"`, `<link rel="preload">`, and responsive `srcset` will push LCP past 2.5s. Generate sizes at 640w/960w/1280w/1920w WebP.

3. **Slide-out panel gets trapped behind Leaflet map z-index** -- Leaflet's container creates its own stacking context with internal z-index 200-1000. The panel DOM element must be a sibling of the map container, never inside it. Use `isolation: isolate` on the map's parent section. On mobile, use a bottom sheet (not side panel) so the map remains partially visible.

4. **Ojibwe floral motifs without cultural context reads as appropriation** -- Non-negotiable minimum: visible attribution near every use of floral elements, narrative explanation of the cultural connection, and use of generalized abstract forms (not specific ceremonial designs). Use the Neebin.com Anishinaabe Floral Set as reference. Never use AI to generate Indigenous-style art.

5. **Color token changes break hardcoded hex values silently** -- The codebase has hex colors in Chart.js configs (`'#c8973e'`), Leaflet SVG strings (`fill="#c8973e"`), and inline styles. These do not update when `@theme` tokens change. Audit all hex references with grep, replace with `getComputedStyle()` reads for JS contexts, and do a "nuclear test" (change amber to bright red) before the real migration.

## Implications for Roadmap

Based on dependency analysis, risk assessment, and build-order constraints from all four research files:

### Phase 1: Design Foundation (Color + Layout Structure)
**Rationale:** Everything downstream inherits color tokens. The `BaseLayout.astro` width constraint must be removed before any full-width section can exist. These are invisible infrastructure changes that unblock all visual work.
**Delivers:** Expanded `@theme` color palette (berry, gold, lake, moss families), tokenized hex values in JS components, `BaseLayout.astro` width restructure, per-section container classes in `index.astro`.
**Addresses:** Color palette evolution (table stake), layout container restructure (prerequisite).
**Avoids:** Pitfall #5 (hardcoded hex mismatch) by tokenizing before changing values. Pitfall #6 (container breakout) by restructuring layout first.

### Phase 2: Hero + Event Date
**Rationale:** The hero is the first thing visitors see and the single highest-impact visual change. It depends on the layout restructure from Phase 1. Event date is trivially embedded in the hero.
**Delivers:** `HeroSection.astro` with full-width route photo, gradient overlay, repositioned badge SVG, event date ("June 6, 2026 / Munising, MI"), and build-time conditional for date staleness.
**Addresses:** Full-width hero (table stake), event date (table stake).
**Avoids:** Pitfall #2 (LCP regression) by implementing `fetchpriority="high"`, `<link rel="preload">`, and responsive `srcset` from the start. Pitfall #9 (stale date) with build-time conditional rendering.

### Phase 3: Ojibwe Design System + Decorative Elements
**Rationale:** The floral motifs are consumed by multiple downstream features (section dividers, pull-quote ornaments, route explainer decorations). Building the SVG design system early unblocks editorial content phases. Cultural attribution framework must be established before any motifs appear.
**Delivers:** `OjibweBorder.astro`, `OjibweMotif.astro`, SVG pattern definitions, cultural attribution footer text, decision on topo-divider vs. floral-divider placement rules.
**Addresses:** Ojibwe woodland floral design elements (differentiator).
**Avoids:** Pitfall #4 (cultural appropriation) by establishing attribution framework first. Pitfall #11 (competing divider languages) by defining intentional placement rules. Pitfall #12 (font overload) by relying on pattern/color/shape, not new typography.

### Phase 4: Editorial Content (Narrative + Route Explainer)
**Rationale:** The narrative and route explainer are the content heart of the redesign. They depend on the color palette (Phase 1) and Ojibwe decorative system (Phase 3). They have no dependency on the gallery or map interactivity and can be built in parallel with Phase 5.
**Delivers:** `NarrativeSection.astro` with New Yorker editorial tone, photo-integrated text layouts, pull quotes, drop caps. `RouteExplainer.astro` with sector-by-sector photo narrative over topographic background.
**Addresses:** Narrative rewrite (table stake), photo-integrated route explainer (differentiator), witty editorial tone (differentiator).
**Avoids:** Pitfall #10 (tablet breakpoint) by designing three-state responsive layout (mobile/tablet/desktop) with minimum column widths.

### Phase 5: Masonry Gallery
**Rationale:** Gallery can be built in parallel with Phase 4. Depends on Phase 1 (color tokens) but nothing else. Pipeline update for aspect ratios is a minor prerequisite.
**Delivers:** Rewritten `PhotoGallery.astro` with CSS `columns` masonry, `featured` photo support, natural aspect ratios (no more square crops). Pipeline updates to `match-photos.js` (aspect ratio extraction) and `content.config.ts` (schema additions).
**Addresses:** Masonry gallery (table stake).
**Avoids:** Pitfall #1 (broken masonry) by using CSS columns, not native grid masonry. Pitfall #7 (photo index mismatch) by switching from array index to `data-photo-id` for PhotoSwipe bridge. Pitfall #13 (layout shift) by setting explicit dimensions from build-time metadata.

### Phase 6: Sector Interactivity (Map Labels + Detail Panel)
**Rationale:** Highest complexity, broadest cross-component impact, and the feature with the most pitfalls. The current map already works well without it. Built last so all prerequisite infrastructure (color tokens, layout structure, design system) is stable.
**Delivers:** Sector labels on map (L.divIcon), sector click handlers on map and elevation chart, `SectorDetailPanel.astro` as `<dialog>` slide-out panel, `sector:click`/`sector:close` events on the CustomEvent bus. Pipeline update to `resolve-annotations.js` (stars, surface, description fields).
**Addresses:** Interactive sector detail panels (differentiator).
**Avoids:** Pitfall #3 (z-index stacking) by placing panel as DOM sibling of map container. Pitfall #8 (mobile unusability) by using bottom sheet pattern below 768px.

### Phase 7: Responsive Polish + Accessibility Audit
**Rationale:** Final pass after all features are integrated. Catches interaction bugs between new components.
**Delivers:** Verified responsive behavior at 375px/768px/1024px/1280px, WCAG AA contrast verification on all new colors, keyboard navigation through sector panel, `prefers-reduced-motion` handling on all animations.
**Addresses:** Cross-cutting quality across all features.
**Avoids:** Pitfall #10 (tablet breakpoint) final verification.

### Phase Ordering Rationale

- **Color tokens first** because every component references them. Changing tokens after components are built risks Pitfall #5 (silent color mismatches). Tokenizing hardcoded hex values is a prerequisite, not a nice-to-have.
- **Layout restructure with colors** because the BaseLayout change is a one-line edit but touches every section's spacing. Doing it early isolates regressions.
- **Hero before editorial content** because the hero delivers immediate visual impact with low complexity, building momentum. It also validates the full-width layout pattern that other sections reuse.
- **Ojibwe design system before editorial content** because the narrative sections and route explainer consume floral dividers and motifs. Building the decorative vocabulary first ensures consistent application.
- **Gallery in parallel with editorial content** because they have no mutual dependencies. Both depend only on Phase 1 (colors).
- **Sector interactivity last** because it is the highest-complexity feature, touches three existing components (RouteMap, ElevationProfile, index.astro), extends the event bus, and the map already works well without it. If the project runs out of time, deferring this to v1.2 loses the least value.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Ojibwe Design System):** SVG illustration quality and cultural appropriateness require human judgment. The Neebin.com floral set is a starting point but custom SVG work needs design review. Cultural consultation with MBTN's tribal relations contacts is recommended.
- **Phase 6 (Sector Interactivity):** Leaflet click handler coordination, `<dialog>` as slide-out panel (non-standard usage), `@starting-style` transitions, and mobile bottom sheet pattern all warrant a `/gsd:research-phase` pass. The CustomEvent bus extension is straightforward but the responsive panel UX is not.

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 1 (Design Foundation):** Grep-and-replace hex values, extend `@theme` block, remove classes from `<main>`. Entirely mechanical.
- **Phase 2 (Hero):** Full-width hero with gradient overlay is one of the most documented CSS patterns on the web.
- **Phase 5 (Masonry Gallery):** CSS `columns` is universally supported. PhotoSwipe bridge update is a known pattern.
- **Phase 4 (Editorial Content):** CSS Grid + float + shape-outside are mature techniques. The writing itself is the risk, not the code.
- **Phase 7 (Polish):** Standard responsive testing and accessibility audit.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies. All CSS techniques verified against Can I Use, MDN, and Tailwind 4 docs. Browser support floor is 89% (@starting-style), with graceful degradation. |
| Features | MEDIUM-HIGH | Table stakes well-defined by competitive analysis (UNBOUND, SBT GRVL, Cycle Oregon). Cultural sensitivity guidance is solid but inherently incomplete without Ojibwe community engagement. Writing quality (New Yorker tone) is a human judgment call, not a technical research question. |
| Architecture | HIGH | Based on direct source code analysis of every file in the v1.0 codebase. Component boundaries, event bus patterns, data schemas, and build pipeline are fully understood. All changes are additive. |
| Pitfalls | HIGH | 5 critical pitfalls identified with verified sources (Can I Use, Leaflet docs, web.dev, Anishinaabe cultural sources, codebase audit). Prevention strategies are specific and actionable. Recovery costs documented for each. |

**Overall confidence:** HIGH

### Gaps to Address

- **Ojibwe community consultation:** Research provides a solid framework for respectful use of floral design elements, but the highest confidence comes from direct feedback from Ojibwe community members. MBTN likely has tribal relations contacts through the Forest Service. This is a project management action, not a research gap.
- **Hero photo selection:** No specific photo has been selected from the 54-photo library. The photo must have a centered subject (for `object-cover` cropping across viewports) and work as a dramatic landscape. This is an editorial decision needed before Phase 2 implementation.
- **Exact hex values for new color tokens:** The berry/gold/lake/moss hex values in STACK.md are starting points. Each must pass WCAG AA contrast verification against `forest-950` (#0d1a0d) and `forest-900` (#1a2e1a). Values may shift during implementation.
- **Sector descriptions and star ratings data entry:** The `data.md` file has star ratings and segment names but editorial descriptions for each sector's detail panel need to be written. This is content work, not research.
- **Narrative tone execution:** The New Yorker editorial tone is defined as a goal but cannot be validated by research. The writing must be reviewed by a human for tone calibration.

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme) -- `@theme` auto-generates utilities, `columns-*` confirmed
- [Can I Use: HTML Dialog](https://caniuse.com/dialog) -- 96.86% global support
- [Can I Use: CSS @starting-style](https://caniuse.com/mdn-css_at-rules_starting-style) -- 89% global support
- [Can I Use: CSS Shapes Level 1](https://caniuse.com/css-shapes) -- 97.2% support for `shape-outside`
- [Can I Use: CSS Grid Lanes](https://caniuse.com/css-grid-lanes) -- 0.02% support (NOT production viable)
- [Can I Use: CSS initial-letter](https://caniuse.com/css-initial-letter) -- 91.38% (no Firefox)
- [MDN: Dialog Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) -- authoritative `<dialog>` docs
- [Leaflet Reference: Map Panes](https://leafletjs.com/reference.html) -- z-index values for stacking context
- [web.dev: Optimize LCP](https://web.dev/articles/optimize-lcp) -- hero image performance
- [Addy Osmani: fetchpriority](https://addyosmani.com/blog/fetch-priority/) -- LCP hero image optimization
- [Astro Image Docs](https://docs.astro.build/en/guides/images/) -- responsive image pipeline
- Direct codebase analysis -- all src/ files, global.css, pipeline scripts

### Secondary (MEDIUM confidence)
- [UNBOUND Gravel](https://unboundgravel.com), [SBT GRVL](https://sbtgrvl.com), [Cycle Oregon](https://cycleoregon.com/ride/gravel/) -- competitive feature analysis
- [Neebin Studios Anishinaabe Floral Set](https://neebin.com/design/floral_set/) -- open-licensed Ojibwe floral SVG reference
- [Heart Berry: Ojibwe Floral Beadwork as Covert Art](https://www.heartberry.com/blogs/news/17055207-anishinaabeg-use-ojibwe-floral-beadwork-as-covert-art) -- cultural significance
- [Vincent Design: Indigenous Graphic Design Best Practices](https://vincentdesign.ca/2021/03/08/considerations-and-best-practices-in-indigenous-design/) -- cultural sensitivity framework
- [Indigenous Protocols for the Visual Arts](https://www.indigenousprotocols.art/) -- cultural use guidelines
- [USFS Hiawatha NF Tribal Relations](https://www.fs.usda.gov/r09/hiawatha/working-with-us/tribal-relations) -- land context
- [Smashing Magazine: Magazine Layout with CSS Grid Areas](https://www.smashingmagazine.com/2023/02/build-magazine-layout-css-grid-areas/) -- editorial grid patterns
- [Ben Nadel: Dialog as Fly-out Sidebar](https://www.bennadel.com/blog/4862-opening-the-dialog-element-as-a-fly-out-sidebar.htm) -- `<dialog>` panel pattern
- [CSS-Tricks: Masonry Layout is Now grid-lanes](https://css-tricks.com/masonry-layout-is-now-grid-lanes/) -- spec history

---
*Research completed: 2026-03-31*
*Ready for roadmap: yes*
