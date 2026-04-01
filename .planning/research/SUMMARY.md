# Project Research Summary

**Project:** Hiawatha's Revenge v1.2 Cultural Maximalism
**Domain:** Maximalist cultural design layer for a static cycling showcase site (Astro 6 / Tailwind 4)
**Researched:** 2026-03-31
**Confidence:** HIGH

## Executive Summary

Hiawatha's Revenge v1.2 transforms a well-designed cycling showcase into something that feels like an award-winning cultural heritage site. The research converges on a key structural insight: **v1.2 is almost entirely additive**. The v1.1 architecture -- Astro 6 components, Tailwind 4 `@theme static` tokens, inline SVG dividers, IntersectionObserver patterns, CustomEvent bus for map/chart sync -- remains untouched. None of the seven feature areas (animated SVG dividers, bold palette expansion, historical imagery, shield motifs, content layout enrichment, per-sector sparklines, Strava links) touch the existing client-side interactive components (RouteMap, ElevationProfile, PhotoGallery) or their data flow. This is a design and content milestone, not an interactivity milestone, which dramatically reduces technical risk.

The recommended approach is CSS/SVG-first with zero new npm dependencies. Animated section dividers use `stroke-dashoffset` line drawing and CSS `@property` gradient cycling (96%+ browser support with graceful fallbacks). Per-sector elevation sparklines are build-time SVG polylines generated in Astro frontmatter -- zero JavaScript, zero runtime cost, 1.4KB total for all seven segments versus 30KB+ per Chart.js instance. The bold palette adds three new color families (turquoise, scarlet, sun) to `@theme static`, all WCAG AA-verified against the dark forest backgrounds. Historical imagery comes from verified public domain sources (Harrison Fisher 1906 illustrations, Frederic Remington 1891 paintings via Met Open Access and Internet Archive). The one external dependency is Strava's embed script for a single route embed, with per-segment Strava links as simple anchor tags.

The primary risks are not technical but compositional: maintaining WCAG AA contrast compliance with an expanded palette (Pitfall 2), respecting `prefers-reduced-motion` across all new animations (Pitfall 1), and preserving the site's cultural critique framing as maximalist visuals are layered on (Pitfall 3). The palette expansion phase must land first with documented contrast ratios, the first animated component must establish the `prefers-reduced-motion` pattern, and historical imagery must be framed as "Longfellow's fiction" not celebration. All four researchers independently converged on these three constraints.

## Key Findings

### Recommended Stack

The v1.2 stack requires zero new npm packages. The existing Astro 6 / Tailwind 4 / Vite 7 / Chart.js / Leaflet / PhotoSwipe / sharp stack handles everything. New capabilities come from native CSS and SVG features, not libraries.

**New stack elements (all zero-dependency):**
- **CSS `@property`**: Enables smooth gradient color animation by registering custom properties as `<color>` type -- 96% browser support, static gradient fallback
- **CSS `stroke-dashoffset`**: SVG path "draw-on-scroll" animation -- 99%+ support, the standard technique for vine/floral line drawing
- **SVG `<symbol>` + `<use>`**: Reusable shield/arrowhead motif system with zero HTTP requests and `currentColor` inheritance from Tailwind classes
- **Build-time SVG sparklines**: Astro frontmatter generates `<polyline>` elements from route-data.json at build time -- zero JavaScript shipped to client
- **Strava embed script**: Single external `<script>` for one route embed; per-segment links are plain `<a>` tags

**Explicitly rejected:**
- GSAP/GreenSock (23KB+ for what CSS handles), Lottie (50KB+ player), Chart.js for sparklines (7 instances = memory bloat), Strava API (requires OAuth/server), Strava iframe embeds (7 external requests), any icon library (3-5 custom motifs do not justify a dependency)

### Expected Features

**Must have (table stakes):**
- Section color differentiation -- alternating backgrounds using expanded palette; the most visible change for least effort
- Content layout enrichment -- inline historical photos, pull quotes, generous whitespace, subheadings in HiawathaExplainer
- Segment/route enrichment -- Strava links, elevation sparklines, terrain detail expansion in RouteExplainer
- Bold palette expansion -- turquoise, scarlet, sun families added to `@theme static` with WCAG AA documentation
- Historical Hiawatha imagery -- 2-4 Harrison Fisher color illustrations from 1906 public domain edition

**Should have (differentiators):**
- Animated multicolored section dividers -- vine drawing on scroll, blossom color cycling, section-specific color theming
- Shield/arrowhead motif system -- extracted from hero badge, repeated as heading icons, background watermarks, blockquote ornaments
- Dramatic pull quote treatment -- oversized quotation marks, background shift, National Park typeface, arrowhead ornament
- CSS scroll-driven section reveals -- fade/slide-in on scroll using IntersectionObserver (CSS `animation-timeline: view()` has only 83% support; use IO as primary)

**Defer (v1.3+):**
- Scroll-driven reveals via CSS `animation-timeline: view()` as primary (Firefox still behind flag)
- Parallax scrolling (performance issues on mobile Safari, motion sickness risk)
- Dark/light mode toggle (dark forest palette IS the brand identity)
- Video content (no assets exist, autoplay destroys Core Web Vitals)
- AI-generated cultural imagery (contradicts the site's cultural critique narrative)
- Scroll-jacking/snap scrolling (breaks natural scroll behavior)

### Architecture Approach

v1.2 features break into three integration tiers: (1) pure CSS/SVG additions with zero JavaScript and zero data flow changes (animated dividers, shield motifs, color expansion), (2) data-layer extensions with small backward-compatible schema additions (historical imagery categories, Strava links), and (3) component modifications that are purely presentational template/style changes within existing components (HiawathaExplainer and RouteExplainer enrichment). Nothing touches the CustomEvent bus, lazy-loading patterns, or the three complex client-side components.

**New components (4):**
1. `AnimatedDivider.astro` -- Scroll-triggered animated SVG divider with vine/arrowhead/shield variants; replaces FloralDivider instances
2. `ShieldMotif.astro` -- Reusable decorative SVG (sm/md/lg) for headings, bullets, watermarks
3. `ElevationSparkline.astro` -- Build-time SVG polyline sparkline for per-sector elevation profiles
4. `HistoricalFigure.astro` -- Image + figcaption component for historical illustrations with float positioning

**Modified components (6):**
- `global.css` -- Add color tokens to `@theme static` (~15 lines)
- `HiawathaExplainer.astro` -- Historical imagery, pull quotes, typography, motif accents
- `RouteExplainer.astro` -- Sparklines, Strava links, motif markers, expanded descriptions
- `index.astro` -- Import AnimatedDivider, replace FloralDivider instances
- `match-photos.js` -- Handle `mile: null` and `category` field for historical images
- `content.config.ts` -- Add `category`, `caption`, make `mile` nullable

**Unchanged (12):** BaseLayout, HeroSection, RouteMap, ElevationProfile, PhotoGallery, RouteStats, DonateCallout, FloralDivider (preserved, not modified), pipeline.js, parse-gpx.js, generate-thumbnails.js, copy-gpx.js

### Critical Pitfalls

1. **Animated SVGs ignore `prefers-reduced-motion`** -- All animations MUST default to static; animation is progressive enhancement, not baseline. Build the `prefers-reduced-motion` pattern into the FIRST animated component so all subsequent animations copy it. Test by enabling "Reduce Motion" in macOS Accessibility settings -- all animation should STOP, not slow down.

2. **New palette fails WCAG AA contrast** -- Red on dark green fails AA normal text (3.2:1). Every new token needs documented contrast ratios against both forest-950 and forest-900. Designate each as "text-safe" (4.5:1+), "large-text-only" (3:1+), or "decorative-only". The STACK research pre-computed all ratios: scarlet-600 (#dc2626) at 3.71:1 fails AA normal text and is large-text/decorative ONLY.

3. **Cultural sensitivity regression** -- Maximalist historical imagery (Longfellow-era illustrations) risks celebrating the romanticization the site's text explicitly critiques. Prevention: frame historical images with sepia/halftone treatment as "historical artifacts", pair every illustration with contextual captioning, keep Ojibwe-inspired design elements (floral motifs) visually distinct from Longfellow-era imagery. Recovery cost if framing is wrong: HIGH.

4. **LCP regression from above-fold additions** -- No new images or animated SVGs in the first viewport. Gate all animations with IntersectionObserver. Keep the hero image as the sole above-fold resource. Test with Lighthouse mobile after every visual phase.

5. **Chart.js memory bloat from sparklines** -- Solved by architecture decision: use build-time SVG sparklines, not Chart.js. This is a settled question; the STACK, ARCHITECTURE, and PITFALLS researchers all independently converged on SVG sparklines as the correct approach.

## Implications for Roadmap

Based on dependency analysis across all four research files, the features form a clear five-phase structure with a strict ordering rationale.

### Phase 1: Color Foundation and Pipeline Prep
**Rationale:** Every visual feature downstream consumes the new color tokens. The palette must be defined, WCAG-verified, and documented BEFORE any component uses it. Pipeline prep for historical images is independent work that can happen here without blocking anything.
**Delivers:** 8 new color tokens in `@theme static` with contrast documentation; `match-photos.js` and `content.config.ts` updated for historical image category; activation of orphaned v1.1 tokens (lake-500, berry-500, moss-600)
**Addresses:** Table Stakes #4 (Bold Palette Expansion), prerequisite for all visual features
**Avoids:** Pitfall 2 (WCAG contrast failures) by documenting ratios at definition time; Pitfall 11 (visual incoherence) by defining color roles before use; Pitfall 12 (pipeline conflicts) by updating the pipeline before adding images

### Phase 2: Decorative Component Library
**Rationale:** AnimatedDivider, ShieldMotif, and ElevationSparkline are independent components with no cross-dependencies. Building them before content enrichment means the enrichment phases can simply import and place them. Critically, AnimatedDivider establishes the `prefers-reduced-motion` pattern that all subsequent animations must follow.
**Delivers:** Three new Astro components ready for integration; the animation accessibility pattern established and tested
**Addresses:** Differentiator #1 (Animated Dividers), Differentiator #2 (Shield Motif System), per-sector sparkline infrastructure
**Avoids:** Pitfall 1 (motion accessibility) by establishing the pattern in the first animated component; Pitfall 5 (Chart.js bloat) by using build-time SVG; Pitfall 6 (motif visual fatigue) by defining the motif vocabulary and variation levels upfront

### Phase 3: Historical Imagery and Content Enrichment
**Rationale:** With palette tokens, decorative components, and pipeline prep all in place, this phase does the editorial work: sourcing/processing historical illustrations, restructuring HiawathaExplainer with inline photos and pull quotes, and enriching RouteExplainer with sparklines, Strava links, and expanded descriptions. This is the largest phase by content effort.
**Delivers:** HiawathaExplainer transformed with historical imagery, dramatic pull quotes, typography hierarchy; RouteExplainer enriched with sparklines, Strava links, motif accents; 2-4 processed historical illustrations in the pipeline
**Addresses:** Table Stakes #2 (Content Layout Enrichment), Table Stakes #3 (Segment/Route Enrichment), Table Stakes #5 (Historical Imagery), Differentiator #4 (Pull Quote Treatment)
**Avoids:** Pitfall 3 (cultural sensitivity) by framing historical images as artifacts with contextual captions; Pitfall 7 (responsive breakage) by adding elements INSIDE existing grid areas; Pitfall 8 (dead Strava links) by making them supplementary with proper UX patterns; Pitfall 9 (copyright) by using only verified public domain sources

### Phase 4: Section Color Differentiation and Page Assembly
**Rationale:** Section-specific backgrounds need the animated dividers to transition between them, and they need the content enrichment to be complete so colors are applied to final content. This is the phase that makes the page feel like a "journey through distinct moments" rather than "one long page."
**Delivers:** Section-specific background colors; AnimatedDividers placed between sections in index.astro replacing FloralDividers; the full maximalist visual composition assembled
**Addresses:** Table Stakes #1 (Section Color Differentiation), final page assembly
**Avoids:** Pitfall 4 (LCP regression) by keeping all new content below the fold; Pitfall 10 (page weight) by running Lighthouse audit after assembly

### Phase 5: Polish, Accessibility Audit, and Performance Validation
**Rationale:** All content is in place. This phase adds scroll-driven section reveals (if the animation budget allows), runs comprehensive accessibility and performance audits, and tests across breakpoints. Scroll reveals are explicitly last because they animate the completed page -- doing them earlier means re-tuning every time content changes.
**Delivers:** Optional scroll-driven reveals via IntersectionObserver; verified WCAG AA compliance; verified performance budget (<3MB transfer, LCP <2.5s); responsive testing across 5 breakpoints
**Addresses:** Differentiator #3 (Scroll-Driven Reveals), cross-cutting quality gates
**Avoids:** All pitfalls via comprehensive audit; specifically Pitfall 1 (final `prefers-reduced-motion` verification), Pitfall 2 (final contrast audit), Pitfall 4 (final Lighthouse check), Pitfall 10 (final page weight check)

### Phase Ordering Rationale

- **Color tokens first** because every feature consumes them -- this is the unanimous recommendation from FEATURES, ARCHITECTURE, and PITFALLS researchers
- **Components before content** because content enrichment imports the components; building them in isolation enables parallel testing
- **Content enrichment before section colors** because section backgrounds wrap completed content; applying colors to half-finished content means re-testing
- **Scroll reveals absolutely last** because they animate the final composition; any content change after reveals means re-tuning animation timing
- **Historical imagery sourcing runs in parallel** with component development (manual download/processing task with no code dependencies)

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Content Enrichment):** Editorial judgment calls -- where to break text with photos, which historical illustrations to select, how to frame the cultural critique visually. This is design/editorial work, not technical research, but it will require iteration.
- **Phase 3 (Strava Integration):** Strava segment IDs must be created manually on Strava. This is a prerequisite task, not a research gap, but it blocks the Strava links feature.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Color Foundation):** Adding tokens to `@theme static` is a proven 20-line CSS change. Contrast checking is mechanical.
- **Phase 2 (Decorative Components):** SVG animation with `stroke-dashoffset`, `<symbol>` + `<use>`, and build-time SVG generation are all thoroughly documented with code examples in the STACK and ARCHITECTURE research files.
- **Phase 4 (Section Colors):** Applying background classes to `<section>` elements is trivial CSS.
- **Phase 5 (Polish):** Standard Lighthouse/axe audit workflow.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies. All CSS/SVG techniques verified against MDN and Can I Use with specific browser support percentages. Contrast ratios pre-computed. |
| Features | MEDIUM-HIGH | Feature patterns verified across 10+ award-winning sites (charity: water, National Geographic, UNBOUND Gravel, WWF, museum brands). Cultural color research cross-referenced across multiple Ojibwe sources. Minor gap: exact Strava segment IDs not yet created. |
| Architecture | HIGH | Based on direct source code analysis of all existing components, pipeline scripts, and data schemas. Every modification path tested against existing patterns. Build dependency graph fully mapped. |
| Pitfalls | HIGH | 12 pitfalls identified with specific detection methods, prevention steps, and recovery costs. Critical pitfalls (accessibility, contrast, cultural sensitivity) have actionable prevention checklists. |

**Overall confidence:** HIGH

### Gaps to Address

- **Strava segment IDs**: Must be created on Strava before per-segment links can be added. This is a manual task (ride the route or create segments from GPX data). Not a research gap but a prerequisite with no workaround.
- **Harrison Fisher illustration selection**: 69 illustrations are available; selecting 2-4 and determining placement within HiawathaExplainer is an editorial judgment call that cannot be resolved by research alone. Download the full set during Phase 1 pipeline prep, make selections during Phase 3 implementation.
- **Animation timing and organic feel**: The FEATURES researcher flagged that making SVG floral animations feel "organic, not mechanical" is a design tuning challenge. CSS animation durations (8-12s vine sway, 20-30s color cycling) are suggested ranges but will require visual iteration.
- **Orphaned v1.1 color tokens**: 8 tokens defined but unused from v1.1. Phase 1 should activate some (lake-500, berry-500, moss-600) but decisions on which to activate and where depend on section color design decisions in Phase 4.
- **CSS `animation-timeline: view()` support**: Firefox support still behind a flag (March 2026). The IntersectionObserver fallback is battle-tested in this codebase, so this gap has zero impact on functionality. Consider revisiting for v1.3 if Firefox ships support.

## Sources

### Primary (HIGH confidence)
- Direct source code analysis of all 21 project files (9 components, 6 pipeline scripts, global.css, content.config.ts, astro.config.ts, route-data.json, photos-manifest.json)
- [Can I Use -- CSS @property](https://caniuse.com/mdn-css_at-rules_property) -- 96.02% global support
- [MDN -- CSS stroke-dasharray animation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) -- WCAG AA ratio calculations
- [Strava Partners -- Route Embed Documentation](https://partners.strava.com/resources/how-to-embed-a-strava-route)
- [Internet Archive -- Song of Hiawatha 1908 Edition](https://archive.org/details/songhiawatha00wyetgoog) -- "NOT_IN_COPYRIGHT"
- [Metropolitan Museum of Art -- Remington Hiawatha](https://www.metmuseum.org/art/collection/search/11864) -- Open Access
- [hiawatha.digital/illustrations](https://hiawatha.digital/illustrations) -- 69 Harrison Fisher illustrations (1906), public domain
- [Chart.js Performance Documentation](https://www.chartjs.org/docs/latest/general/performance.html)
- [CSS-Tricks -- How SVG Line Animation Works](https://css-tricks.com/svg-line-animation-works/)

### Secondary (MEDIUM confidence)
- [Alex Plescan -- Easy SVG Sparklines](https://alexplescan.com/posts/2023/07/08/easy-svg-sparklines/) -- build-time SVG sparkline technique
- [Josh W. Comeau -- Color Shifting in CSS](https://www.joshwcomeau.com/animation/color-shifting/) -- `@property` gradient animation
- [National Geographic Website Design Analysis](https://www.designrush.com/best-designs/websites/national-geographic-website-design)
- [ImageX -- Best Nonprofit Website Designs](https://imagexmedia.com/blog/best-nonprofit-website-designs-drive-impact)
- [The Brand Identity -- Museum Identities](https://the-brandidentity.com/resource/6-cultural-creative-and-charming-identities-for-museums-featuring-north-base-design-and-more)
- [Communication Arts -- Decolonizing Native American Design](https://www.commarts.com/columns/decolonizing-native-american-design)
- [Four Directions Teachings -- Ojibwe](https://fourdirectionsteachings.com/transcripts/ojibwe.html)
- [Pope Tech -- Accessible Animation](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/)
- [DC Rainmaker -- Strava External Links](https://www.dcrainmaker.com/2025/03/strava-backtracks-now-allows-external-links-again.html)
- [Strava Community Hub -- Jan 2026 Embed Issue](https://communityhub.strava.com/developers-api-7/strava-widgets-embedded-on-website-stopped-working-since-20-jan-2026-12591) -- resolved Feb 19, 2026

### Tertiary (LOW confidence)
- [Wikimedia Commons -- Song of Hiawatha category](https://commons.wikimedia.org/wiki/Category:The_Song_of_Hiawatha) -- 45+ files, individually licensed
- [Maximalism in Web Design (Grazitti)](https://www.grazitti.com/blog/maximalism-in-web-design-bold-beautiful-and-beyond-the-ordinary/)
- [Native American Color Meanings](https://www.color-meanings.com/native-american-color-meanings/) -- general reference, needs cross-validation

---
*Research completed: 2026-03-31*
*Ready for roadmap: yes*
