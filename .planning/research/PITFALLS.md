# Domain Pitfalls: v1.1 Visual Redesign

**Domain:** Visual redesign of existing static cycling route showcase (Astro 6 / Tailwind 4)
**Researched:** 2026-03-31
**Confidence:** HIGH for technical pitfalls, MEDIUM for cultural sensitivity (requires community engagement to reach HIGH)

---

## Critical Pitfalls

Mistakes that cause rewrites, community harm, or major regressions.

---

### Pitfall 1: CSS Masonry Has No Production Browser Support — Shipping It Without Fallback Breaks the Gallery

**What goes wrong:**
The developer implements `grid-template-rows: masonry` (or the newer `display: grid-lanes` syntax) for the photo gallery, tests it in Safari Technology Preview or Firefox with a flag enabled, and ships. In production, Chrome, Edge, Safari stable, and all mobile browsers render a broken grid with items stacked in equal-height rows or collapsing on top of each other. The gallery — the most visual part of the redesign — looks worse than the current uniform grid.

**Why it happens:**
As of March 2026, `grid-template-rows: masonry` is supported only in Safari Technology Preview (not Safari stable) and Firefox behind the `layout.css.grid-template-masonry-value.enabled` flag (disabled by default). Chrome, Edge, Opera, and all mobile browsers have zero support. The CSS Working Group is still debating whether masonry belongs in CSS Grid (as `grid-template-rows: masonry`) or as a separate `display: grid-lanes` module. The spec is not stable. Developers read blog posts celebrating "native CSS masonry" and miss the fine print about browser support.

**Consequences:**
- Gallery layout breaks for ~85%+ of visitors (Chrome + Edge + Safari stable market share)
- If no `@supports` fallback, items either collapse or render as a standard grid with awkward gaps
- Debugging reports from users on different browsers are confusing because the developer's browser works fine

**Prevention:**
1. Do NOT use native CSS masonry as the primary layout. Use it only as a progressive enhancement behind `@supports`.
2. Build the primary gallery layout using one of these proven approaches:
   - **CSS `columns` (column-count)** — simple, no JS, items flow top-to-bottom then left-to-right (reading order issue on some layouts)
   - **CSS Grid with explicit row spans** — calculate `grid-row: span N` based on known image aspect ratios at build time (Astro can do this in frontmatter)
   - **JavaScript masonry library** — Masonry.js, Colcade, or a lightweight custom implementation
3. Progressive enhancement layer: wrap native masonry in `@supports (grid-template-rows: masonry)` so browsers that support it get the native version, others get the fallback.
4. The recommended approach for this project: **CSS Grid with build-time row span calculation**. Astro already knows image dimensions at build time (from the photo pipeline). Compute `aspect-ratio` and assign `grid-row: span 2` to portrait images, `span 1` to landscape. This gives a masonry-like effect with zero JS and universal browser support.

**Warning signs:**
- Gallery looks perfect in Firefox Nightly but broken in Chrome
- `@supports` query not present alongside masonry properties
- No fallback grid styles defined

**Detection:** Test in Chrome stable (the largest browser by market share) before any other browser.

**Phase to address:** The gallery redesign phase. Decide fallback strategy before writing any gallery CSS.

**Confidence:** HIGH — Verified via [Can I Use: grid-template-rows masonry](https://caniuse.com/mdn-css_properties_grid-template-rows_masonry) and [MDN Web Docs masonry layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout).

---

### Pitfall 2: Full-Width Hero Image Tanks LCP on a Static Site That Was Otherwise Fast

**What goes wrong:**
The developer adds a dramatic full-width hero image above the fold. The existing site has no above-fold images — the badge SVG and text load instantly. Adding a large hero photo pushes LCP from sub-1-second to 3-4+ seconds. The site feels noticeably slower, especially on mobile where the hero image may be 500KB+ at full viewport width.

**Why it happens:**
Several compounding mistakes:
1. **Lazy loading the hero** — Astro's `<Image>` component defaults to `loading="lazy"`. A hero image MUST be `loading="eager"` because it is above the fold.
2. **Missing `fetchpriority="high"`** — Without this attribute, the browser deprioritizes the image behind stylesheets and scripts.
3. **No `<link rel="preload">`** — The browser doesn't discover the hero image until it parses the HTML and finds the `<img>` tag. Preloading in `<head>` starts the fetch earlier.
4. **Single enormous image** — Serving a 2400px-wide WebP to a 375px mobile screen wastes bandwidth.
5. **No `sizes` attribute** — Browser downloads the largest srcset image by default.

**Consequences:**
- LCP regression from excellent (<1s) to poor (>2.5s)
- Core Web Vitals score drops, affecting SEO if the site is indexed
- Mobile users on cellular connections see a blank hero area for seconds
- The site *feels* slower even though it has more content

**Prevention:**
1. Use Astro's `<Image>` or `<Picture>` component with `layout="full-width"` — this auto-generates `srcset` and `sizes` attributes for responsive delivery.
2. Explicitly set `loading="eager"` and `fetchpriority="high"` on the hero image (override Astro defaults).
3. Add `<link rel="preload" as="image" href="..." fetchpriority="high">` in the `<head>` for the hero image, with `imagesrcset` and `imagesizes` attributes matching the `<img>`.
4. Generate multiple sizes at build time: 640w, 960w, 1280w, 1920w at minimum. Use WebP format.
5. Set explicit `width` and `height` attributes (or CSS `aspect-ratio`) to prevent layout shift (CLS).
6. Consider using the Astro `image.layout: 'full-width'` config option (responsive images were unflagged in Astro 5+ and available in Astro 6).

**Warning signs:**
- Hero image `<img>` tag has `loading="lazy"` (inspect element)
- No `<link rel="preload">` for the hero in page source `<head>`
- Only one image size served regardless of viewport width
- Lighthouse LCP element points to the hero image with >2.5s timing

**Detection:** Run Lighthouse on the built static site with throttled mobile connection. LCP element should load in <2.5s.

**Phase to address:** The hero section phase. Get the image pipeline and preload right before building the visual layout around it.

**Confidence:** HIGH — Verified via [web.dev LCP optimization](https://web.dev/articles/optimize-lcp), [Addy Osmani's fetchpriority guide](https://addyosmani.com/blog/fetch-priority/), and [Astro image docs](https://docs.astro.build/en/guides/images/).

---

### Pitfall 3: Slide-Out Panel Gets Trapped Behind Leaflet Map Due to Stacking Context

**What goes wrong:**
The developer builds a slide-out detail panel for sector information that should appear over the map when a sector label is clicked. The panel renders but is invisible — trapped behind the Leaflet map tiles. Increasing `z-index` to 9999 on the panel has no effect. The developer wastes hours tweaking z-index values that never work.

**Why it happens:**
Leaflet's `.leaflet-container` creates its own CSS stacking context. Inside that context, Leaflet manages internal z-index layers:
- `tilePane`: z-index 200
- `overlayPane`: z-index 400
- `shadowPane`: z-index 500
- `markerPane`: z-index 600
- `tooltipPane`: z-index 650
- `popupPane`: z-index 700

The current codebase sets `.route-map { z-index: 0 }` on the map container — this creates a stacking context where the map's internal z-index values are scoped. But the slide-out panel, if it is a *sibling* of the map container or inside a parent that doesn't create a higher stacking context, cannot escape the map's rendering order by z-index alone.

Additionally, Leaflet's control elements (`.leaflet-top`, `.leaflet-bottom`) use `z-index: 1000`. If the panel overlaps these areas, it must exceed 1000 within the same stacking context.

**Consequences:**
- Panel appears behind the map — user clicks a sector and nothing visible happens
- Developer enters a z-index arms race, adding increasingly absurd values
- Potential regression: changing z-index on the map container may break existing marker layering or popup rendering

**Prevention:**
1. **Place the slide-out panel as a sibling of the map container, NOT inside it.** The panel should be a separate DOM element adjacent to (not inside) the `#map` div. Since both are children of the same parent, normal z-index ordering works.
2. **Use `isolation: isolate` on the map's parent section** to contain the map's stacking context without affecting the panel.
3. **Define a project-wide z-index scale** and document it:
   ```
   Map container:    z-index: 0 (already set)
   Map internals:    z-index 200-1000 (Leaflet-managed, don't touch)
   Slide-out panel:  z-index: 50 (relative to section parent, above map's 0)
   ```
4. **On mobile, don't overlay the panel on the map at all.** Instead, push the panel below the map or use a bottom sheet pattern. Overlaying a panel on a 60vh map on a 375px screen leaves zero usable map area.
5. Keep the existing `z-index: 0` on `.route-map` — it correctly scopes Leaflet's internal stacking. Do not remove it or change it to `auto`.

**Warning signs:**
- Panel HTML is inside the `#map` div or the Leaflet container
- Panel CSS uses `z-index` values in the hundreds or thousands
- Panel works on a test page without the map but disappears when the map is present

**Detection:** Use browser DevTools "Layers" panel (Chrome) to visualize stacking contexts. The panel and map should be in sibling stacking contexts.

**Phase to address:** The interactive sector map phase. Design the DOM structure and z-index strategy before implementing the panel animation.

**Confidence:** HIGH — Verified via [Leaflet official reference: default pane z-index values](https://leafletjs.com/reference.html), [Leaflet issue #6555](https://github.com/Leaflet/Leaflet/issues/6555), and [Leaflet issue #2782](https://github.com/Leaflet/Leaflet/issues/2782). Codebase z-index verified in `src/components/RouteMap.astro`.

---

### Pitfall 4: Ojibwe Floral Motifs Used Without Cultural Context Reads as Appropriation

**What goes wrong:**
The developer uses Ojibwe woodland floral beadwork motifs as purely decorative CSS patterns — borders, dividers, backgrounds — without any acknowledgment of their cultural origin, meaning, or the Ojibwe people's connection to the land the route traverses. The site looks beautiful, but an Ojibwe community member or ally sees their cultural art used as wallpaper on a cycling event site and rightfully calls it appropriation. At best, this is embarrassing. At worst, it harms the project's relationship with the community whose land the ride traverses and whom MBTN works alongside.

**Why it happens:**
The designer treats floral motifs as an aesthetic choice — "pretty flowers that fit the forest theme." They miss (or are unaware of) several critical layers of meaning:

1. **Ojibwe floral beadwork is not generic folk art.** During the era when Indigenous medicines were outlawed, Anishinaabe elders encoded knowledge of medicinal plants into floral beadwork designs. The flowers are not decorative — they are a form of covert cultural preservation and resistance. (Source: [Heart Berry: Anishinaabeg Use Ojibwe Floral Beadwork as Covert Art](https://www.heartberry.com/blogs/news/17055207-anishinaabeg-use-ojibwe-floral-beadwork-as-covert-art))

2. **The site already acknowledges the naming problem.** The existing narrative explains that Longfellow conflated Haudenosaunee Hiawatha with Ojibwe Nanabozho. Using Ojibwe art purely decoratively — without deeper engagement — would contradict the site's own stated awareness.

3. **The Hiawatha National Forest is Ojibwe land.** The Forest Service maintains [tribal relations](https://www.fs.usda.gov/r09/hiawatha/working-with-us/tribal-relations) with federally recognized tribes culturally affiliated with the land. The ride literally passes through this territory.

**Consequences:**
- Social media criticism that could harm MBTN's reputation and community relationships
- Loss of trust with tribal partners who work with the Forest Service on trail management
- Having to remove design elements and rush a redesign under pressure
- Missing an opportunity to do something genuinely respectful and meaningful

**Prevention:**

**Minimum standard (non-negotiable):**
1. **Attribution on every page that uses floral motifs.** Not hidden in a footer — visible near the design elements. Example: "Decorative motifs inspired by Ojibwe woodland floral beadwork traditions. The Hiawatha National Forest lies on the ancestral homeland of the Anishinaabe people."
2. **Never reproduce specific sacred or ceremonial designs.** Use generalized floral patterns inspired by the aesthetic vocabulary (flowing vines, symmetrical petals, leaf forms) rather than copying specific beadwork patterns from museum pieces or ceremonial items.
3. **Explain the cultural connection in the site narrative.** The existing Hiawatha text already discusses Longfellow's appropriation — extend this to explain why the site honors Ojibwe art traditions and what they mean.

**Higher standard (recommended):**
4. **Use designs from explicitly open resources.** The [Neebin Design Anishinaabe Floral Set](https://neebin.com/design/floral_set/) by Neebinnaukzhik Southall (Anishinaabe artist) was created "with the intention that it can be used by anyone" and is available in SVG/AI/PNG formats. Using these designs (with artist credit) is the most defensible approach.
5. **Consider commissioning an Ojibwe artist.** Even a modest commission for custom SVG motifs gives the project authentic designs and a real relationship. MBTN likely has connections through their Forest Service tribal relations work.
6. **Use the design elements to tell the deeper story.** Instead of motifs as wallpaper, pair them with content about Ojibwe connections to the land, the medicine-encoding tradition, and the ongoing Anishinaabe presence in the Upper Peninsula.

**What NOT to do:**
- Do not use the word "tribal" as a design aesthetic
- Do not describe the motifs as "Native-inspired" without specificity (which nation? which tradition?)
- Do not use motifs from sacred or ceremonial contexts (medicine bundles, clan symbols, midewiwin scrolls)
- Do not present the motifs as "historical" — Ojibwe beadwork is a living tradition with active contemporary artists
- Do not use AI-generated "Ojibwe-style" patterns (these homogenize distinct tribal art traditions and often produce inauthentic results)

**Warning signs:**
- Floral motifs appear on the site with no attribution or cultural context anywhere
- Design brief describes motifs as "decorative elements" with no mention of Ojibwe culture
- Motifs are copied from museum photographs of specific historical pieces
- No Ojibwe or Anishinaabe person has seen the designs before launch

**Detection:** Before launch, ask: "If an Ojibwe community member visited this site, would they feel their culture was respected or extracted?" If you cannot confidently answer "respected," the design needs more work.

**Phase to address:** This must be addressed in the design system / color palette phase, BEFORE any floral motifs are created or implemented. The cultural framework should precede the pixels.

**Confidence:** MEDIUM — Cultural sensitivity research is inherently incomplete without direct community engagement. The sources consulted ([Heart Berry](https://www.heartberry.com/blogs/news/17055207-anishinaabeg-use-ojibwe-floral-beadwork-as-covert-art), [Neebin Design](https://neebin.com/design/floral_set/), [Indigenous Protocols for the Visual Arts](https://www.indigenousprotocols.art/), [USFS Tribal Relations](https://www.fs.usda.gov/r09/hiawatha/working-with-us/tribal-relations)) provide a solid framework, but the highest confidence comes from direct consultation with Ojibwe community members — which is a project management step, not a research step.

---

### Pitfall 5: Color Scheme Change Breaks Existing Components Invisibly

**What goes wrong:**
The developer updates the `@theme` color tokens in `global.css` — changing forest greens to warmer tones, adjusting amber values, adding new accent colors — and existing components silently break. Text becomes unreadable against new backgrounds. Borders disappear. The chart becomes illegible. The map popups lose contrast. The badge SVG colors clash with the new palette. The developer doesn't notice because each component looks "fine" in isolation but the overall page is inconsistent.

**Why it happens:**
The existing codebase uses Tailwind 4's `@theme` CSS custom properties extensively. Every component references these tokens:
- `--color-forest-900` appears as `bg-forest-900` in BaseLayout.astro's body class
- `--color-amber-500` is hardcoded in SVG `fill` attributes in the badge, in Chart.js config objects (`borderColor: '#c8973e'`), and in Leaflet marker HTML strings
- `--color-cream-100` is used for text throughout
- `--color-forest-700` is used for borders, grid lines, and Leaflet popup styles

The problem: **not all color references go through the theme tokens.** The codebase has hardcoded hex values in:
- RouteMap.astro: `color: '#1a2e1a'` (route polyline), `fill="#c8973e"` (bike marker SVG), `fill="#4a90d9"` (restock marker), `background:#d4a84e` (photo marker)
- ElevationProfile.astro: `borderColor: '#c8973e'`, `grid: { color: 'rgba(255,255,255,0.08)' }`, sector fill colors as rgba values
- index.astro: SVG fill values using `var()` references (these are fine) but also inline styles
- DonateCallout.astro: references theme tokens correctly

Changing the `@theme` tokens updates Tailwind classes and `var()` references but leaves all hardcoded hex values unchanged. The result is a jarring mismatch between elements that updated and elements that didn't.

**Consequences:**
- Chart.js elevation line remains old amber while headings shift to new amber
- Leaflet markers remain old colors while surrounding UI changes
- Route polyline color doesn't match new forest green
- Restock popup background mismatches new panel backgrounds
- Partial color update looks worse than no update at all

**Prevention:**
1. **Audit all color references before changing any tokens.** Search for every hex color in the `src/` directory. The specific values to find:
   - `#0d1a0d`, `#1a2e1a`, `#2d4a2d`, `#3d6b3d`, `#4a8a4a` (forest greens)
   - `#c8973e`, `#d4a84e`, `#e0b95f` (ambers)
   - `#8b4513`, `#a0522d` (rusts)
   - `#f5f0e8`, `#e8e0d0`, `#faf8f4` (creams)
   - `#4a90d9` (restock blue)
   - Any `rgba()` values derived from these
2. **Replace hardcoded hex values with CSS custom property references** wherever possible. For JavaScript contexts (Chart.js config, Leaflet inline HTML), read the CSS custom property value at runtime:
   ```javascript
   const style = getComputedStyle(document.documentElement);
   const amber = style.getPropertyValue('--color-amber-500').trim();
   ```
3. **Create a color migration checklist** that lists every component and whether its colors are tokenized or hardcoded.
4. **Test the color change with a "nuclear" test:** temporarily change `--color-amber-500` to bright red. Everything that should be amber but stays amber is a hardcoded value that will break during the real migration.

**Warning signs:**
- `grep -r '#c8973e' src/` returns results in JavaScript/TypeScript files (not just CSS)
- Chart.js or Leaflet config objects contain string hex values
- SVG elements use `fill="..."` with hex values instead of `fill="var(--color-...)"`

**Detection:** After the color change, take full-page screenshots at 375px, 768px, and 1280px and compare every element for color consistency. Automated visual regression testing (Percy, Chromatic) would be ideal but overkill for this project.

**Phase to address:** The design system / color palette phase. Tokenize all hardcoded colors BEFORE changing any token values.

**Confidence:** HIGH — Verified by direct audit of the codebase. Hardcoded hex values confirmed in RouteMap.astro, ElevationProfile.astro, and global.css.

---

## Moderate Pitfalls

Mistakes that cause delays, rework, or visible quality issues.

---

### Pitfall 6: Full-Width Hero Breaks the Existing max-w-4xl Page Container

**What goes wrong:**
The current `BaseLayout.astro` wraps all content in `<main class="max-w-4xl mx-auto px-4 py-8">`. This constrains everything to 896px centered. A full-width hero image needs to break out of this container and span the entire viewport. The developer either:
- (a) Removes `max-w-4xl` from `<main>`, breaking the layout of every existing section, or
- (b) Tries CSS tricks like `width: 100vw; margin-left: calc(-50vw + 50%);` which causes horizontal scrollbar issues, or
- (c) Restructures the entire page layout, touching every section and introducing regressions.

**Why it happens:**
The v1.0 design was correctly built around a single constrained container. A visual redesign that mixes full-width sections (hero, topo dividers, potentially gallery) with constrained content sections requires a fundamentally different layout approach.

**Prevention:**
1. **Restructure the layout to alternate between full-width and constrained sections.** Move the `max-w-4xl mx-auto px-4` from `<main>` to individual sections that need it. The hero and other full-bleed sections get no container constraint.
2. **Use a wrapper pattern:**
   ```html
   <main>
     <section class="w-full"><!-- hero, full width --></section>
     <section class="max-w-4xl mx-auto px-4"><!-- constrained content --></section>
     <section class="w-full"><!-- gallery, full width --></section>
   </main>
   ```
3. **Do this layout restructure as a standalone commit before adding the hero.** If the restructure breaks anything, the regression is isolated and easy to diagnose.

**Warning signs:**
- Hero image is constrained to 896px wide with visible margins on desktop
- Horizontal scrollbar appears after adding the hero
- Removing `max-w-4xl` from `<main>` causes all text sections to span full width

**Phase to address:** First phase of the visual redesign — layout restructure should precede any new sections.

**Confidence:** HIGH — Verified from direct reading of BaseLayout.astro (`max-w-4xl mx-auto px-4 py-8` on `<main>`).

---

### Pitfall 7: Masonry Gallery Breaks Photo-to-Lightbox Index Mapping

**What goes wrong:**
The current PhotoGallery.astro renders photos in a flat grid with `photos.map((photo, index) => ...)`. PhotoSwipe uses the DOM order index to open the lightbox at the correct photo. The `map:photoClick` event from RouteMap.astro dispatches `photoIndex` based on the original array index. If the masonry layout reorders photos (e.g., by featured status, by aspect ratio for visual balance, or by CSS columns which flow top-to-bottom), the DOM order no longer matches the array index. Clicking a photo marker on the map opens the wrong photo in the lightbox.

**Why it happens:**
CSS columns reorder items visually: in a 3-column layout, items 1, 4, 7 appear in column 1; items 2, 5, 8 in column 2; items 3, 6, 9 in column 3. The DOM order (1, 2, 3, 4...) no longer matches the visual order. PhotoSwipe reads DOM order. The map dispatches array index.

**Prevention:**
1. **Keep the photo array order consistent between the map and gallery.** If the gallery reorders photos for visual layout, maintain a `data-photo-id` attribute on each gallery item and look up by ID, not index.
2. **If using CSS columns, be aware of the reordering.** Either:
   - Use CSS Grid (not columns) which preserves source order, or
   - Update the PhotoSwipe initialization to use a data attribute for identification instead of DOM index
3. **Update the `map:photoClick` handler** to find the gallery item by `data-photo-id` rather than position index:
   ```javascript
   // Instead of lightbox.loadAndOpen(e.detail.photoIndex, ...)
   const items = gallery.querySelectorAll('a');
   const targetIndex = [...items].findIndex(a => a.dataset.photoId === e.detail.photoId);
   lightbox.loadAndOpen(targetIndex, ...);
   ```

**Warning signs:**
- Clicking a photo marker on the map opens a different photo in the lightbox
- Gallery uses CSS `columns` or `column-count` (which reorders DOM flow)
- Photos have a "featured" sort that changes their visual position

**Phase to address:** The gallery redesign phase. Update the PhotoSwipe bridge before or alongside the masonry layout work.

**Confidence:** HIGH — Verified from direct reading of PhotoGallery.astro and RouteMap.astro (index-based photoClick dispatch on line 225 of RouteMap.astro).

---

### Pitfall 8: Slide-Out Panel Unusable on Mobile — Covers Map With No Way to Dismiss

**What goes wrong:**
The slide-out detail panel works great on desktop (300px panel alongside a wide map). On mobile (375px), the panel covers the entire map. The user cannot see the sector they clicked, cannot interact with the map, and may not discover how to dismiss the panel (especially if the close button is behind a Leaflet control). The UX degrades to a dead end.

**Why it happens:**
Desktop-first panel design without mobile breakpoint consideration. A 300px panel on a 375px screen leaves 75px of visible map — useless. The Leaflet gestureHandling overlay may also conflict with panel touch gestures.

**Prevention:**
1. **On mobile (< 768px), use a bottom sheet pattern instead of a side panel.** The panel slides up from the bottom, covering the lower 40-60% of the screen. The user can still see the map above. Swiping down dismisses it.
2. **Include a visible, large (52px minimum) close/dismiss affordance.** Do not rely on clicking outside the panel — that conflicts with the map's gesture handling.
3. **When the panel is open on mobile, disable map interaction** to prevent conflicting gestures. Re-enable when dismissed.
4. **Test the panel at 375px width with the map at its current 60vh height.** The arithmetic must work: panel height + visible map area + close button = usable.
5. **Add `prefers-reduced-motion: reduce` handling** to skip panel slide animations.

**Warning signs:**
- Panel CSS has no mobile breakpoint styles
- Panel width is a fixed pixel value (not responsive)
- No close button visible when panel is open
- Panel opens but covers 100% of the map on mobile

**Phase to address:** The interactive sector map phase. Design the mobile panel UX before the desktop version — it's harder and constrains the desktop design.

**Confidence:** HIGH — Verified from codebase: map is 60vh height (min 400px), page is max-w-4xl (896px), current 52px touch target requirement established.

---

### Pitfall 9: Event Date (June 6, 2026) Becomes Stale and Embarrassing After the Event

**What goes wrong:**
"June 6, 2026" is hardcoded into the page. After the event passes, the site proudly displays a date in the past. In July 2026, it looks like the site is unmaintained. By January 2027, it looks abandoned. If the ride happens annually, the 2026 date actively misleads visitors about when the next one is.

**Why it happens:**
Static sites have no server-side logic to hide or update dates. The date is baked into HTML at build time. Nobody remembers to rebuild and redeploy after the event passes.

**Prevention:**
1. **Build-time date logic in Astro frontmatter.** Compute whether the date is in the future or past at build time:
   ```astro
   ---
   const eventDate = new Date('2026-06-06T08:00:00-04:00'); // EDT
   const now = new Date();
   const isUpcoming = eventDate > now;
   ---
   {isUpcoming ? (
     <div>June 6, 2026</div>
   ) : (
     <div>Check back for next year's date</div>
   )}
   ```
2. **Include the timezone explicitly** when displaying the date. "June 6, 2026" is ambiguous — is that EDT? The event is in Michigan (Eastern Time). Display as "June 6, 2026 - Munising, MI" or "Saturday, June 6, 2026 (Eastern Time)."
3. **Do NOT use client-side JavaScript to compute the date comparison.** This causes a flash of incorrect content (the static HTML shows the date, then JS hides it). The comparison should happen at build time.
4. **Set a calendar reminder to rebuild and redeploy after the event.** Or, if deploying to Netlify/Vercel/Cloudflare Pages, schedule a rebuild via their cron/scheduled build feature.
5. **Design the date display to degrade gracefully.** The section should look complete with or without a specific date. "2026 Edition - Date TBD" is better than a stale "June 6, 2026" in 2027.

**Warning signs:**
- Date is hardcoded as a string in HTML with no conditional logic
- No timezone indicator alongside the date
- No plan for who rebuilds the site after the event

**Phase to address:** The editorial content / event date phase. Implement the conditional date logic when adding the date display.

**Confidence:** HIGH — Standard static site lifecycle issue, verified by [Jim Nielsen's blog post on dates in static site generators](https://blog.jim-nielsen.com/2023/date-and-time-in-ssg/).

---

### Pitfall 10: Editorial Photo-Text Layouts Break at Tablet Breakpoint

**What goes wrong:**
The developer creates beautiful editorial layouts with large photos alongside text blocks (magazine-style "photo left, text right" sections). They look great at desktop (1280px) and acceptable at mobile (375px, stacked). But at tablet width (768-1024px), the layout enters an awkward middle ground: the photo is too narrow to be impactful, the text column is too narrow to be readable, and the two together feel cramped. This is the "responsive uncanny valley."

**Why it happens:**
Developers test at mobile and desktop, skipping the tablet range. The CSS breakpoint system (Tailwind's `sm:640px`, `md:768px`, `lg:1024px`) creates cliff-edge transitions. A layout that works at 767px (stacked) and 1024px (side-by-side) may be broken at 800px.

**Prevention:**
1. **Design for three distinct states:** stacked (mobile), two-column narrow (tablet), two-column wide (desktop). Use `md:` for the transition to side-by-side and adjust proportions at `lg:`.
2. **Set minimum content widths.** Text columns should never be narrower than ~280px (about 45 characters per line for readability). If the photo + text cannot both meet their minimums, stack them.
3. **Use `aspect-ratio` on photo containers** to maintain proportions across breakpoints. Without it, photos either squish or overflow.
4. **Use `object-fit: cover` with explicit `aspect-ratio`** on editorial images so they crop gracefully rather than distorting.
5. **Test specifically at 768px, 834px (iPad), and 1024px (iPad landscape).** These are the danger zone widths.

**Warning signs:**
- Layout has only two states (mobile and desktop) with no tablet consideration
- Photo widths are percentage-based without minimum constraints
- Text alongside narrow photos becomes a single-word-per-line column

**Phase to address:** The editorial layout / route explainer phase. Define the three-state responsive behavior before writing layout CSS.

**Confidence:** HIGH — Standard responsive design pitfall, verified by current Tailwind breakpoint values and the project's existing responsive design requirements (375px, 768px, 1280px in PROJECT.md).

---

## Minor Pitfalls

Mistakes that cause annoyance or minor quality issues, but are straightforward to fix.

---

### Pitfall 11: Topo Divider Pattern Clashes With New Ojibwe Floral Dividers

**What goes wrong:**
The existing site uses `.topo-divider` elements (topographic contour line SVG patterns) as section separators. The redesign adds Ojibwe floral motif dividers. If both coexist, the page has two competing visual languages — contour lines (U.S. Forest Service) and floral patterns (Ojibwe) — creating a confused visual identity that looks indecisive rather than intentional.

**Prevention:**
Decide early whether the redesign replaces topo dividers entirely or keeps them for specific sections. Recommended approach: keep topo patterns for the map/elevation sections (where the cartographic language makes sense) and use floral motifs for the narrative/gallery sections. Document this in the design system so it's intentional, not accidental.

**Phase to address:** Design system phase — before implementing any new dividers.

**Confidence:** HIGH — Verified from codebase: `.topo-divider` class exists in global.css and is used twice in index.astro.

---

### Pitfall 12: New Fonts for Ojibwe Design Clash With Existing National Park + Space Mono Pairing

**What goes wrong:**
The developer adds a third font to complement the Ojibwe design elements. Three font families on one page creates visual noise and slows page load (each Google Font adds ~20-50KB). The existing National Park (display) + Space Mono (body) pairing is already well-established.

**Prevention:**
Do not add new font families. The Ojibwe design elements should work through color, pattern, and shape — not typography. If a different text treatment is needed for specific elements, use weight/size/spacing variations of the existing fonts. The National Park display font is already versatile across weights (400, 600, 700, 800).

**Phase to address:** Design system phase.

**Confidence:** HIGH — Verified from astro.config.ts: two fonts already loaded with preload.

---

### Pitfall 13: Masonry Gallery Images Without Explicit Dimensions Cause Layout Shift

**What goes wrong:**
In a masonry layout, if images load without explicit width/height attributes or CSS `aspect-ratio`, the layout recalculates and jumps as each image loads. This is especially jarring in a masonry layout where one image's dimensions affect the position of everything below it.

**Prevention:**
1. Calculate image dimensions at build time (Astro frontmatter) and set `width`, `height`, and `aspect-ratio` on every image element.
2. Use CSS `aspect-ratio` on the container, not just the image, so the space is reserved even before the image starts loading.
3. The current photo pipeline already extracts dimensions from filenames (`parseDims` function in PhotoGallery.astro). Extend this to set explicit attributes on the masonry grid items.

**Phase to address:** Gallery redesign phase.

**Confidence:** HIGH — Verified from existing `parseDims` function in PhotoGallery.astro that already extracts dimensions.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|-------------|---------------|----------|------------|
| Design system / color palette | Color token change breaks hardcoded hex in JS components (#5) | Critical | Audit and tokenize all hex values before changing tokens |
| Design system / color palette | Ojibwe motifs used without cultural context (#4) | Critical | Establish attribution framework before creating motifs |
| Hero section | Hero image tanks LCP (#2) | Critical | fetchpriority="high", preload, srcset, eager loading |
| Hero section | Full-width hero breaks max-w-4xl container (#6) | Moderate | Restructure layout container before adding hero |
| Gallery redesign | Masonry layout broken in 85%+ of browsers (#1) | Critical | Build-time row span calculation, @supports progressive enhancement |
| Gallery redesign | Photo-to-lightbox index mapping breaks (#7) | Moderate | Use data-photo-id instead of array index |
| Gallery redesign | Layout shift from lazy-loaded images (#13) | Minor | Build-time dimensions, CSS aspect-ratio |
| Interactive sector map | Slide-out panel trapped behind Leaflet (#3) | Critical | Panel as sibling of map container, not inside it |
| Interactive sector map | Panel unusable on mobile (#8) | Moderate | Bottom sheet pattern on mobile, disable map interaction |
| Editorial layouts | Tablet breakpoint layout breaks (#10) | Moderate | Three-state responsive design, minimum column widths |
| Event date display | Stale date after event (#9) | Moderate | Build-time conditional rendering, timezone |
| Visual identity | Competing divider languages (#11) | Minor | Intentional placement rules for topo vs. floral |
| Visual identity | Font overload (#12) | Minor | No new fonts — use existing pairing |

---

## "Looks Done But Isn't" Checklist for v1.1

- [ ] **Masonry gallery:** Renders correctly in Chrome stable (not just Safari TP or Firefox Nightly)
- [ ] **Hero image:** Lighthouse LCP < 2.5s on throttled mobile; no `loading="lazy"` on hero `<img>`
- [ ] **Slide-out panel:** Visible and usable at 375px width; close button meets 52px touch target
- [ ] **Ojibwe motifs:** Attribution text visible on every page using floral elements; narrative explains the cultural connection
- [ ] **Color migration:** `grep -r '#c8973e' src/` returns zero results (all hardcoded hex replaced with token references)
- [ ] **Photo lightbox:** Map marker click opens correct photo after gallery reorder (test with first and last photo)
- [ ] **Event date:** Date display conditionally renders based on build-time comparison; timezone specified
- [ ] **Editorial layouts:** Text readable at 768px width (no single-word columns); photos maintain aspect ratio
- [ ] **Topo vs. floral dividers:** Each divider type used intentionally, not randomly mixed
- [ ] **Page container:** Full-width sections (hero, gallery) are truly full-width; constrained sections maintain max-w-4xl

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Masonry broken in production (#1) | LOW | Add `@supports` fallback grid; keep masonry as enhancement |
| Hero kills LCP (#2) | LOW | Add preload link tag, change loading to eager, add fetchpriority; < 30 min |
| Panel behind map (#3) | MEDIUM | Restructure DOM to make panel a sibling; may require refactoring event wiring |
| Cultural appropriation complaint (#4) | HIGH | Cannot be fixed with code — requires community engagement, possible design removal, public response |
| Color migration half-done (#5) | MEDIUM | Finish hex-to-token migration; systematic grep + replace |
| Container breakout issues (#6) | MEDIUM | Restructure main container; touches every section |
| Photo index mismatch (#7) | LOW | Add data-photo-id attributes; update event handler; < 1 hour |
| Panel unusable on mobile (#8) | MEDIUM | Implement bottom sheet pattern; requires new responsive CSS |
| Stale date (#9) | LOW | Add Astro frontmatter conditional; rebuild + deploy |
| Tablet layout broken (#10) | LOW-MEDIUM | Add `md:` breakpoint styles; test at 768px |

---

## Sources

**CSS Masonry:**
- [Can I Use: grid-template-rows masonry](https://caniuse.com/mdn-css_properties_grid-template-rows_masonry) -- HIGH confidence
- [MDN: Masonry layout guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout) -- HIGH confidence
- [Smashing Magazine: Native CSS Masonry Layout](https://www.smashingmagazine.com/native-css-masonry-layout-css-grid/) -- MEDIUM confidence
- [CSS-Tricks: Masonry Layout is Now grid-lanes](https://css-tricks.com/masonry-layout-is-now-grid-lanes/) -- MEDIUM confidence

**Hero Image Performance:**
- [web.dev: Optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp) -- HIGH confidence
- [Addy Osmani: fetchpriority=high for LCP hero images](https://addyosmani.com/blog/fetch-priority/) -- HIGH confidence
- [Astro: Images guide](https://docs.astro.build/en/guides/images/) -- HIGH confidence
- [web.dev: Fetch Priority API](https://web.dev/articles/fetch-priority) -- HIGH confidence

**Leaflet Stacking / Z-Index:**
- [Leaflet official reference: Map panes and z-index values](https://leafletjs.com/reference.html) -- HIGH confidence
- [Leaflet issue #6555: z-index of .leaflet-top should be lower](https://github.com/Leaflet/Leaflet/issues/6555) -- HIGH confidence
- [Leaflet issue #2782: z-index problems with controls](https://github.com/Leaflet/Leaflet/issues/2782) -- HIGH confidence
- [Leaflet: Working with map panes tutorial](https://leafletjs.com/examples/map-panes/) -- HIGH confidence

**Ojibwe Cultural Sensitivity:**
- [Heart Berry: Anishinaabeg Use Ojibwe Floral Beadwork as Covert Art](https://www.heartberry.com/blogs/news/17055207-anishinaabeg-use-ojibwe-floral-beadwork-as-covert-art) -- HIGH confidence (Anishinaabe-authored source)
- [Neebin Design: Anishinaabe Floral Set](https://neebin.com/design/floral_set/) -- HIGH confidence (Anishinaabe artist's explicit usage terms)
- [Indigenous Protocols for the Visual Arts](https://www.indigenousprotocols.art/) -- HIGH confidence
- [USFS Hiawatha National Forest: Tribal Relations](https://www.fs.usda.gov/r09/hiawatha/working-with-us/tribal-relations) -- HIGH confidence
- [Robert Desjarlait: Contemporary Aesthetics of Anishinaabe Floral Art](https://www.robertdesjarlaitfinearts.com/weeblycom/the-contemporary-aesthetics-of-anishinaabe-floral-art) -- MEDIUM confidence
- [Inquiries Journal: Native Design in Modern Fashion](http://www.inquiriesjournal.com/articles/1730/native-design-in-modern-fashion-the-transformations-of-native-american-flower-beadwork) -- MEDIUM confidence

**Tailwind 4 Theme Migration:**
- [Tailwind CSS: Theme variables documentation](https://tailwindcss.com/docs/theme) -- HIGH confidence

**Static Site Dates:**
- [Jim Nielsen: Date and Time with a Static Site Generator](https://blog.jim-nielsen.com/2023/date-and-time-in-ssg/) -- MEDIUM confidence

**Responsive Design:**
- [MDN: Common grid layouts](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Common_grid_layouts) -- HIGH confidence
- [Tailwind CSS: Responsive design](https://tailwindcss.com/docs/responsive-design) -- HIGH confidence

---
*Pitfalls research for: v1.1 Visual Redesign (Hiawatha's Revenge)*
*Researched: 2026-03-31*
*Replaces v1.0 pitfalls research from 2026-03-30*
