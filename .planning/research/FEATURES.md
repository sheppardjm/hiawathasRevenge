# Feature Landscape: v1.1 Visual Redesign

**Domain:** Outdoor cycling route showcase -- editorial visual upgrade
**Researched:** 2026-03-31
**Milestone:** v1.1 Visual Redesign
**Confidence:** MEDIUM-HIGH -- patterns verified across UNBOUND Gravel, SBT GRVL, Cycle Oregon, Terra Brasil ecotourism sites, Nature Conservancy, and editorial storytelling site surveys; cultural sensitivity findings verified across multiple Indigenous cultural sources

---

## Context

v1.0 shipped a fully functional showcase: interactive Leaflet map with GPX polyline, gravel sector overlays, restock markers, photo clusters; Chart.js elevation profile synced via CustomEvent bus; PhotoSwipe gallery with uniform grid; Forest Service / National Park badge identity; basic narrative paragraphs. All table-stakes and core differentiators from v1.0 research are built and working.

v1.1 evolves the site from **functional showcase** to **immersive editorial experience**. The existing data infrastructure (GPX pipeline, photo manifest, annotations JSON, event bus) is solid. What changes is how content is presented, not what content exists.

---

## Table Stakes

Features that must be polished for the v1.1 redesign to feel complete. If any of these feel half-done, the redesign looks worse than the current v1.0.

| Feature | Why Expected | Complexity | Depends On | Notes |
|---------|--------------|------------|------------|-------|
| Full-width hero section with route photo | Every premium outdoor event site (UNBOUND, SBT GRVL, Cycle Oregon, Nature Conservancy) opens with a dramatic full-bleed photo. The current v1.0 opens with a centered badge on a dark background -- functional but not immersive. Users have been trained by outdoor brands to expect visual drama above the fold. | MEDIUM | Selecting 1-2 hero-quality landscape photos from the 54-photo library; existing Astro image pipeline can handle srcset/WebP | Gradient overlay (bottom-to-top dark) ensures text legibility. Badge h1 relocates INTO the hero rather than floating in void. Must be responsive -- portrait crop on mobile, wide landscape on desktop. UNBOUND uses dark navy overlay; SBT GRVL uses layered typography; Cycle Oregon uses atmospheric full-width. Recommendation: dark gradient overlay approach like Nature Conservancy -- lets the photo breathe while keeping text readable. |
| Event date (June 6, 2026) prominently placed | SBT GRVL, Cycle Oregon, and UNBOUND all place date + location within the first viewport. UNBOUND specifically stacks "May 28-31, 2026 / Emporia, KS" immediately below the logo. This is the single most important piece of information for prospective riders. Currently absent from v1.0. | LOW | None -- pure markup and styling | Place in hero section, below route name. Format: "June 6, 2026 / Munising, MI" in display font with generous letter-spacing. Do NOT build a countdown timer (explicitly out of scope per PROJECT.md). Static date text is correct -- it persists after the event as a "this happened" marker rather than going stale. |
| Masonry/editorial photo gallery replacing uniform grid | The current 2/3/4-column uniform grid with square aspect-ratio crops is functional but generic. Editorial outdoor sites (bikepacking.com, Terra Brasil inspiration images) use mixed-size layouts where hero images get 2x space and landscape/portrait orientations are preserved. The uniform grid actively hides the variety of the photography. | MEDIUM | Existing PhotoSwipe lightbox integration; existing photos.json with dimensions parseable from filenames; Tailwind CSS columns utility | Use CSS columns approach (Tailwind `columns-2 md:columns-3 lg:columns-4`) -- proven, no-JS, works today in all browsers. Native CSS Grid masonry (`grid-template-rows: masonry`) is Firefox-only as of March 2026 and not viable. Some photos should be "featured" (larger) -- add a `featured: boolean` field to photos.json manifest. PhotoSwipe integration stays intact since it reads the same `<a>` elements. |
| Route narrative rewrite with photo integration | The current v1.0 has four paragraphs of plain text under an h2. Editorial sites (Vev storytelling examples, Nature Conservancy, bikepacking.com long-form routes) interleave text with photography. The Hiawatha/Nanabozho story deserves richer treatment -- it is the narrative hook that distinguishes this site from every other gravel route page. | MEDIUM | data.md historical content; 54 existing route photos; writing craft for the New Yorker tone | Structure as alternating text blocks and photo breaks. Not scrollytelling (too complex for this scope) -- instead, use the editorial pattern of full-width or inset photos between prose sections, like a magazine feature. Pull quotes from data.md (the Longfellow critique passage) styled as typographic callouts. Must feel like reading an article, not a brochure. |
| Color palette evolution to warmer/more vibrant | The current palette (forest-950 through forest-600, amber-500/400/300, rust-600/500, cream-100/200/50) is solid but cool and austere. The inspiration images -- especially bogcore, national park badges (Yosemite, Grand Canyon, Sequoia), and the Arizona/Southwest geometric patterns -- all use warmer, more saturated palettes. The Ojibwe woodland beadwork tradition uses vibrant berry reds, deep blues, and rich greens alongside the earth tones. | LOW | Updating CSS custom properties in global.css @theme block; verifying contrast ratios for accessibility | Expand, do not replace. Add warmer accent colors (berry red, deeper gold, richer greens) alongside existing palette. Key additions: a warmer red-orange for accent (replacing/supplementing rust), a deeper/richer amber, and potentially a muted blue for water/lake references. All additions must maintain WCAG AA contrast against the dark backgrounds. |

## Differentiators

Features that elevate the site from "good outdoor event page" to "something you send to friends." These are what make visitors say "this site is beautiful" rather than just "this site is useful."

| Feature | Value Proposition | Complexity | Depends On | Notes |
|---------|-------------------|------------|------------|-------|
| Interactive sector map labels with slide-out detail panels | Currently, sector overlays are color-coded polylines with no labels or click behavior. Adding named labels ("NF2266 - 5 stars") with clickable detail panels transforms the map from a visualization into an exploration tool. Visitors can click a sector and see: name, distance, difficulty stars, surface description, and possibly a representative photo. No reference gravel site does this. | HIGH | Existing annotations.json with sector data; Leaflet map already renders sectors; need to extend sector data with descriptions and optional photo references | Two implementation approaches: (1) Leaflet.SidePanel plugin for a sidebar that slides in from the right, or (2) custom CSS panel absolutely positioned over/beside the map. Recommendation: custom CSS panel rather than plugin dependency -- simpler to style within the existing design system, and the data is already structured. Star ratings rendered as SVG or Unicode. On mobile, panel opens below the map rather than beside it. |
| Ojibwe woodland floral design elements as decorative system | The existing topo-divider is the only decorative pattern. Replacing/supplementing it with floral motifs inspired by Ojibwe woodland beadwork creates a design language unique to this site. The five-petal blossom, double-curve scroll, vine/tendril patterns, and berry/leaf forms are visually stunning and deeply connected to the land the route traverses. | HIGH | SVG illustration work; cultural sensitivity review (see dedicated section below) | This is the single highest-impact visual differentiator. Use abstract floral forms as: section dividers (replacing topo-divider in some locations), border decorations, background patterns (subtle, low-opacity), and pull-quote ornaments. Do NOT use sacred or ceremonial designs. The Neebin.com Anishinaabe Floral Set provides CC-licensed SVG reference designs created by an Anishinaabe artist specifically for digital use. Floral patterns should feel organic and hand-drawn, not geometric or mechanical. |
| Photo-integrated route explainer over topographic background | A dedicated section that walks through the route sector-by-sector with integrated photography, layered over a subtle topographic map background. This is the "magazine feature" section -- the visual centerpiece of the editorial redesign. Each sector gets a text block with a representative photo, creating a scrollable route narrative. | HIGH | Existing sector data from annotations.json; selecting representative photos for each sector; topo pattern SVG background | Distinct from the narrative rewrite (which covers history/culture). This section covers the ride itself -- "what you will actually experience." Structure as a vertical timeline or sectioned layout with alternating photo-left/text-right positioning. The topographic background should be subtle (5-10% opacity) and fixed (CSS `background-attachment: fixed` for parallax-lite effect) with `prefers-reduced-motion` fallback. |
| Witty New Yorker editorial tone for narrative | The current narrative is informative but encyclopedic. The rewrite should have the sophisticated irreverence of a New Yorker "Talk of the Town" piece -- wry about Longfellow's cultural blunder, respectful of Ojibwe culture, affectionate about the landscape, and self-aware about the absurdity of naming a forest after a poem that confused two entirely different Indigenous nations. | MEDIUM | data.md source material; narrative craft | This is a writing differentiator, not a technical one, but it affects component structure: the narrative needs typographic variety (pull quotes, em-dashes, italicized asides) that the current plain `<p>` tags cannot support. Implement as Astro markdown/MDX or as semantic HTML with styled blockquotes, `<aside>` elements, and `<figure>` captions. The tone should make readers want to share the page for the writing, not just the ride. |

## Anti-Features

Features to explicitly NOT build for v1.1. These are commonly seen on outdoor sites but are wrong for this project.

| Anti-Feature | Why Tempting | Why Wrong for This Project | What to Do Instead |
|--------------|-------------|---------------------------|-------------------|
| Countdown timer to June 6 | Standard on event sites; UNBOUND has one | PROJECT.md explicitly lists this as Out of Scope. A countdown goes stale the moment the event passes, making the site feel abandoned. The site should work as a permanent showcase, not an ephemeral event page. | Static date text: "June 6, 2026 / Munising, MI" -- dignified, permanent, no JavaScript required. |
| Parallax scrolling / scrollytelling | Trendy for outdoor editorial sites; CSS scroll-driven animations are now possible without JS | Adds significant complexity for marginal value on a static Astro site. Parallax effects perform poorly on mobile, conflict with `prefers-reduced-motion`, and the site's content does not have the length or narrative arc that scrollytelling demands. The 2-minute read time does not justify a 20-hour parallax implementation. | Use simple CSS `background-attachment: fixed` for the topo pattern in one section (with reduced-motion fallback). Full parallax is overkill. |
| Video hero / autoplay background video | Many outdoor sites (Patagonia, REI) use video heroes | No video assets exist. Acquiring/editing video adds massive scope. Autoplay video destroys performance metrics, annoys mobile users on data plans, and conflicts with the prefers-reduced-motion commitment. A single dramatic photo is more powerful than mediocre video. | Full-width hero photograph with gradient overlay. One great photo beats one okay video. |
| Instagram feed embed | SBT GRVL integrates their Instagram grid | Third-party dependency that loads slowly, breaks when API changes, and introduces visual inconsistency. The site's curated 54-photo library is better than a social feed. Instagram embeds also inject their own CSS that fights with custom styling. | Use the existing curated photo library in the masonry gallery. Stronger curation beats more content. |
| Registration / RSVP form | Natural impulse for an event site | Not a race. No entry fees, no bibs, no cutoffs. Adding registration implies organizational overhead that does not exist and creates data-handling obligations (GDPR, email lists). The ride is: show up on June 6 and ride. | Donate CTA to MBTN is the sole conversion action. Keep it that way. |
| Multi-page site with separate gallery/map/info pages | As content grows, tempting to split into pages | Single-page design is a feature, not a limitation. The entire experience is one scroll -- map, elevation, photos, narrative, donate. Splitting into pages adds navigation overhead and breaks the immersive flow. All reference sites that feel editorial (Nature Conservancy, bikepacking.com route pages) keep route content on a single page. | Keep single-page architecture. Use smooth scroll anchors for section navigation if needed. |
| Animated map route drawing | "Watch the route trace itself on the map" | Cool demo, terrible UX. Users want to see the full route immediately so they can zoom/pan to areas of interest. Animation delays access to information. Leaflet does not natively support animated polyline drawing without a plugin. | Show the full route polyline immediately on map load, as currently implemented. |
| AI-generated Ojibwe art or pattern generation | Tempting shortcut for the floral design system | Using AI to generate art inspired by a specific Indigenous tradition is culturally inappropriate. It strips the human craft and intentionality from designs that carry deep spiritual and historical meaning. Multiple Indigenous cultural sources emphasize that the designs encode medicinal knowledge and spiritual teachings. | Use the open-licensed Neebin.com Anishinaabe Floral Set as reference, create hand-crafted SVGs inspired by (not copied from) the design vocabulary, and credit the tradition clearly. |
| Dark/light mode toggle | Common UX pattern | The dark forest-green palette IS the identity. A light mode would require a complete parallel design system and would undermine the immersive forest atmosphere that makes the site distinctive. No NPS-themed site offers a light mode. | Ship the dark theme. It is a design decision, not a missing feature. |

---

## Cultural Sensitivity: Ojibwe Design Elements

This section requires special attention because the project draws design inspiration from a living Indigenous culture. The project narrative also explicitly addresses Longfellow's cultural conflation (mixing Haudenosaunee Hiawatha with Ojibwe Nanabozho), which means the site must model the respectful approach it critiques Longfellow for lacking.

### What Is Appropriate

**Abstract floral forms inspired by woodland beadwork vocabulary:**
- Five-petal blossoms (the "universal wildflower" motif common in Ojibwe beadwork)
- Double-curve scrolls and tendrils (a pan-Woodland decorative motif, not clan-specific or ceremonial)
- Berry clusters (strawberry, blueberry -- common in secular beadwork)
- Vine and leaf forms (organic, flowing lines characteristic of the Woodland style)
- Color palette drawn from beadwork traditions (berry reds, deep blues, rich greens, warm golds)

**These are appropriate because:**
- Floral beadwork is a decorative art tradition, not a sacred/ceremonial one
- The Neebin.com floral set was created by an Anishinaabe artist specifically for digital use and distributed freely
- The five-petal blossom and double-curve are widely recognized as pan-Woodland decorative vocabulary, not restricted or clan-specific
- Using these as abstract decorative patterns (section dividers, border ornaments) does not claim to BE Indigenous art -- it draws visual vocabulary from a tradition connected to the land

### What Is NOT Appropriate

**Do not use:**
- Dreamcatchers (sacred spiritual object, heavily appropriated, not Ojibwe-specific despite popular association)
- War bonnets / headdress imagery (several inspiration images include these -- they are Plains tradition, NOT Ojibwe, and are the single most contentious appropriation issue in Indigenous design discourse)
- Medicine wheel or other sacred geometric symbols
- Clan animal totems or clan-specific imagery
- Bandolier bag patterns (these are specific ceremonial garments with cultural protocols)
- "Indian chief" profile silhouettes (multiple inspiration images include these -- they perpetuate stereotypes and have no connection to Ojibwe woodland culture)
- Teepee/tipi imagery (Plains tradition, not Great Lakes Woodland)

**Critical note on inspiration images:** The inspiration folder contains several images (headdress illustrations, "chief" profiles, skull-with-headdress designs, "Native" branded logos) that represent exactly the kind of pan-Indian stereotyping the site's own narrative critiques Longfellow for. Using these design directions would be hypocritical and harmful. The bogcore aesthetic, national park badges, and woodland floral motifs from the same inspiration folder are the appropriate design directions.

### Implementation Guidance

- Credit the tradition: include a footer note like "Design elements inspired by Anishinaabe woodland floral art traditions"
- Use abstract/decorative forms, not representational imagery of people or specific artifacts
- The floral patterns should feel like they grew from the same forest the route passes through
- Consider the Neebin.com Anishinaabe Floral Set as a reference starting point for SVG work
- If budget allows, commissioning an Ojibwe/Anishinaabe artist for custom design elements would be the gold standard approach

### Confidence Level

MEDIUM -- cultural sensitivity guidelines synthesized from multiple Indigenous cultural sources (Heart Berry, Royal Alberta Museum, PowWows.com, Mini Tipi, Florida Seminole Tourism). The distinction between decorative floral motifs and sacred imagery is well-documented. The appropriateness of digital use is supported by the Neebin.com floral set's explicit intended purpose. However, the project should remain open to feedback from Ojibwe community members if the opportunity arises.

---

## Feature Dependencies (v1.1 Additions)

```
[Hero Section]
    ├── needs: 1-2 hero-quality landscape photos (select from existing 54)
    ├── needs: CSS gradient overlay implementation
    ├── modifies: badge h1 positioning (moves INTO hero)
    └── modifies: DonateCallout (may relocate below hero instead of separate section)

[Event Date]
    ├── needs: hero section (date lives inside hero)
    └── independent of all data pipelines

[Masonry Gallery]
    ├── needs: photos.json (existing)
    ├── needs: `featured` field added to photo manifest
    ├── modifies: PhotoGallery.astro (new layout, same PhotoSwipe integration)
    └── needs: aspect ratio data from filenames (existing parseDims function)

[Narrative Rewrite]
    ├── needs: data.md source content (existing)
    ├── needs: selected photos for inline placement
    ├── modifies: index.astro narrative section (major restructure)
    └── independent of map/chart infrastructure

[Color Palette Evolution]
    ├── modifies: global.css @theme block
    ├── affects: ALL components (but only through CSS custom properties)
    └── should be done FIRST or EARLY so other features inherit new colors

[Sector Detail Panels]
    ├── needs: annotations.json sector data (existing)
    ├── needs: sector descriptions and optional photo refs (NEW data)
    ├── modifies: RouteMap.astro (click handlers on sector polylines)
    └── needs: CSS panel component (new)

[Ojibwe Floral Design System]
    ├── needs: SVG illustration work (new assets)
    ├── modifies: topo-divider (supplemented/replaced in some locations)
    ├── modifies: global.css (new decorative classes)
    └── consumed by: section dividers, pull quote ornaments, background patterns

[Route Explainer Section]
    ├── needs: sector data (existing annotations.json)
    ├── needs: representative photos per sector (selection from existing 54)
    ├── needs: topo pattern SVG background (extend existing topo-divider concept)
    ├── needs: Ojibwe floral design system (for section ornaments)
    └── new component: RouteExplainer.astro
```

### Dependency Ordering Implications

1. **Color palette first** -- everything else inherits the new palette through CSS custom properties
2. **Ojibwe floral SVGs early** -- needed by multiple downstream features (dividers, pull quotes, route explainer)
3. **Hero section and event date together** -- they are the same DOM region
4. **Masonry gallery independent** -- can be built in parallel with narrative work
5. **Narrative rewrite independent** -- writing + component work, no data pipeline changes
6. **Sector detail panels last** -- highest complexity, requires the most new code, and the current map already works well without them
7. **Route explainer depends on floral system and sector data** -- build after those are ready

---

## Complexity Assessment

| Feature | Design Effort | Code Effort | Content Effort | Overall | Risk |
|---------|--------------|-------------|----------------|---------|------|
| Full-width hero | Medium | Low | Low (photo selection) | MEDIUM | Low -- well-understood CSS pattern |
| Event date | Low | Low | None | LOW | None |
| Masonry gallery | Medium | Medium | Low (featured flags) | MEDIUM | Low -- CSS columns are battle-tested |
| Narrative rewrite | Low | Low | HIGH (writing craft) | MEDIUM | Medium -- tone is hard to get right |
| Color palette | Medium | Low | None | LOW | Low -- CSS custom property changes |
| Sector detail panels | Medium | High | Medium (sector descriptions) | HIGH | Medium -- Leaflet click handling + responsive panel |
| Ojibwe floral system | HIGH | Medium | None | HIGH | Medium -- SVG illustration quality is make-or-break |
| Route explainer | Medium | Medium | Medium | MEDIUM | Low if floral system is done first |
| New Yorker tone narrative | Low | Low | HIGH | MEDIUM | High -- tone is the hardest thing to execute |

---

## Phase Ordering Recommendation

Based on dependency analysis and risk assessment, recommended build sequence:

**Phase 1: Foundation (color + design system)**
- Color palette evolution (everything inherits)
- Ojibwe floral SVG design elements (needed by downstream features)
- This phase has no user-visible deliverable on its own but unblocks everything

**Phase 2: Above-the-fold transformation**
- Full-width hero section with gradient overlay
- Event date placement in hero
- Badge h1 repositioned into hero
- This is the first thing visitors see -- ship it for immediate visual impact

**Phase 3: Editorial content**
- Narrative rewrite with New Yorker tone
- Photo-integrated text layout
- Route explainer section over topo background
- This is the content heart of the redesign

**Phase 4: Gallery redesign**
- Masonry layout replacing uniform grid
- Featured photo flags in manifest
- PhotoSwipe integration maintained
- Can be built in parallel with Phase 3

**Phase 5: Map interactivity**
- Sector labels on map
- Click-to-detail panels
- Star ratings and descriptions
- Highest complexity, lowest risk of blocking other work

---

## Sources

- [UNBOUND Gravel](https://unboundgravel.com) -- hero section, date placement, visual design analysis (MEDIUM confidence, WebFetch)
- [SBT GRVL](https://sbtgrvl.com) -- hero section, date/location hierarchy, course detail patterns (MEDIUM confidence, WebFetch)
- [Cycle Oregon GRAVEL '26](https://cycleoregon.com/ride/gravel/) -- hero section, date stacking, course breakdown, photography treatment (MEDIUM confidence, WebFetch)
- [Neebin.com Anishinaabe Floral Set](https://neebin.com/design/floral_set/) -- open-licensed Ojibwe floral SVG reference by Anishinaabe artist (HIGH confidence, WebFetch)
- [Heart Berry -- Ojibwe Floral Beadwork as Covert Art](https://www.heartberry.com/blogs/news/17055207-anishinaabeg-use-ojibwe-floral-beadwork-as-covert-art) -- cultural significance of floral designs (MEDIUM confidence, WebSearch)
- [Robert Desjarlait Fine Arts -- Contemporary Aesthetics of Anishinaabe Floral Art](https://www.robertdesjarlaitfinearts.com/weeblycom/the-contemporary-aesthetics-of-anishinaabe-floral-art) -- design vocabulary analysis (MEDIUM confidence, WebSearch)
- [Royal Alberta Museum -- Appreciation or Appropriation](https://royalalbertamuseum.ca/blog/appreciation-or-appropriation) -- cultural sensitivity framework (MEDIUM confidence, WebSearch)
- [Mini Tipi -- Cultural Appropriation vs Cultural Appreciation](https://minitipi.ca/blogs/news/cultural-appropriation-vs-cultural-appreciation) -- Indigenous design guidelines (MEDIUM confidence, WebSearch)
- [PowWows.com -- Cultural Appropriation vs Appreciation](https://www.powwows.com/cultural-appropriation-vs-appreciation-new-wave-of-indigenous-representation-brings-new-enthusiasm-to-native-culture-art-and-products/) -- contemporary Indigenous representation (MEDIUM confidence, WebSearch)
- [MDN -- CSS Masonry Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout) -- browser support status for native masonry (HIGH confidence, official docs)
- [Cruip -- Masonry Layouts with Tailwind CSS](https://cruip.com/masonry-layouts-with-tailwind-css/) -- CSS columns implementation pattern (MEDIUM confidence, WebSearch verified against MDN)
- [Leaflet.SidePanel plugin](https://github.com/maxwell-ilai/Leaflet.SidePanel) -- sidebar panel pattern for Leaflet maps (MEDIUM confidence, GitHub)
- [TravelTime -- Interactive Map Design & UX](https://traveltime.com/blog/interactive-map-design-ux-mobile-desktop) -- map detail panel UX patterns (MEDIUM confidence, WebSearch)
- [Vev -- 9 Editorial Websites Bringing Long-Form to Life](https://www.vev.design/blog/editorial-websites/) -- editorial layout patterns (MEDIUM confidence, WebSearch)
- [Ishadeed -- Handling Text Over Images in CSS](https://ishadeed.com/article/handling-text-over-image-css/) -- hero overlay implementation patterns (HIGH confidence, authoritative CSS resource)
- Inspiration images in `images/inspiration/` -- national park badges (Yosemite, Grand Teton, Sequoia, Grand Canyon), bogcore patterns, outdoor brand patches, topographic art, Michigan fantasy map, arrowhead geometry (HIGH confidence, direct project assets)
- PROJECT.md -- confirmed active requirements, constraints, out-of-scope list (HIGH confidence, direct read)
- Existing v1.0 codebase -- index.astro, PhotoGallery.astro, RouteMap.astro, global.css (HIGH confidence, direct read)

---
*Feature research for: Hiawatha's Revenge v1.1 Visual Redesign*
*Researched: 2026-03-31*
*Supersedes: v1.0 feature research from 2026-03-30 (which covered initial build features, now all shipped)*
