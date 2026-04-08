# Domain Pitfalls: v1.8 Navigation & Identity

**Domain:** Adding sticky nav, ride-ethos explainer, "Powered by Neucadia" footer, and History section light/dark mode to an existing Astro 6 static site
**Researched:** 2026-04-07
**Confidence:** HIGH — all findings derived from direct code inspection of the existing codebase, supplemented by verified web sources

---

## Critical Pitfalls

Mistakes that cause rewrites, broken layouts, or broken accessibility.

---

### Pitfall 1: @theme static Tokens Are Not Light-Mode Tokens — They Are Dark-Mode Tokens

**What goes wrong:** The entire `@theme static` block in `global.css` was designed for a dark background (`--color-forest-900: #1a2e1a`). When light mode is introduced, the instinct is to add a `@media (prefers-color-scheme: light)` block that overrides specific tokens. But the mental model is backwards: the existing theme IS the dark theme. Light mode requires a full semantic alias layer, not scattered overrides.

**Why it happens:** The `static` keyword in `@theme static` sounds like it means "immutable," leading developers to think they cannot override these tokens. They can. `@theme static` only means "always emit all custom properties, even unused ones." The generated custom properties are regular CSS variables, fully overridable inside `@media (prefers-color-scheme: light)` blocks.

**The real trap:** If light mode overrides are written ad-hoc (overriding `--color-forest-900` to beige in some selectors but not others), the History section will have beige backgrounds where expected but green text, green borders, and green card backgrounds where the raw tokens are used. Leaflet popups, the sector panel, and the map controls all directly reference `--color-forest-900` — they will turn beige unless the scope of light mode overrides is limited to the `hiawatha-section` subtree.

**Prevention:** Scope light-mode CSS overrides to the History section only. Use `.hiawatha-section` as the root selector for all `@media (prefers-color-scheme: light)` rules. Do not override tokens globally unless you audit every consumer.

**Warning signs:**
- Leaflet popup backgrounds turning beige in light mode
- The sector panel (`z-index: 1000`, `background: var(--color-forest-900)`) turning beige
- Gold-section, amber-section, or teal-section text becoming unreadable because their inline color overrides were computed against the old token values

**Phase guidance:** Light/dark mode scoped to History section only. Global token override is a future milestone concern.

---

### Pitfall 2: Sticky Nav Z-Index Collision with the Sector Panel

**What goes wrong:** The sector panel (`RouteMap.astro`) is `position: fixed` with `z-index: 1000`. A sticky nav bar also needs a high z-index. If the sticky nav is assigned `z-index: 50` (Tailwind default) or less, the sector panel will slide over the nav when opened. If assigned `z-index: 1001` or higher, the nav will cover the panel. Neither is obviously correct without coordination.

**Existing z-index inventory (from code inspection):**
- `.hero-video`: `z-index: 0`
- `.hero-content`: `z-index: 1`
- `.hiawatha-section .subsection-bg > *`: `z-index: 1`
- `.route-map`: `z-index: 0` (the map container itself)
- `.sector-panel`: `z-index: 1000` (slides over map section when open)

There is no documented z-index budget in the codebase. The sticky nav will be the first element to need a z-index above 1 for an extended scroll duration.

**Prevention:** Assign the sticky nav `z-index: 100`. This is above everything except the sector panel (1000). The sector panel intentionally slides over all content — it should slide over the nav too (the panel is a full-height overlay). Document the z-index budget in a comment:
```
z-index budget:
  0   — positioned background layers (hero-video, route-map)
  1   — foreground content layers (hero-content, section children)
  100 — sticky nav
  1000 — sector panel (intentional full-overlay)
```

**Warning signs:**
- Sticky nav appears on top of the open sector panel on desktop (right-panel, 350px wide)
- Sticky nav disappears behind hero video when user scrolls down slowly

**Phase guidance:** Define the z-index budget as a comment in `global.css` before placing the nav. Do not reach for Tailwind's `z-50` (50) reflexively — it will be swallowed by the sector panel.

---

### Pitfall 3: Sticky Nav Transition Breaks at the Hero Bottom Edge

**What goes wrong:** The hero section is `height: 100svh; overflow: hidden`. The nav will be placed immediately below the hero. When the nav transitions from its natural in-flow position to `position: sticky` (or when a JS sentinel triggers a CSS class swap to `position: fixed`), the transition point must be the nav's own scroll position, not the hero's bottom edge. These are the same offset only if there is nothing between the hero and the nav in the DOM — which may not be true if a DonateCallout section precedes the nav.

**Current DOM order** (from `index.astro`):
1. `<HeroSection />`
2. `<section class="gold-section">` (DonateCallout)
3. `<FloralDivider />`
4. `<HiawathaExplainer />`

The nav must sit between HeroSection and the gold-section to read as "below the hero." If DonateCallout moves above the nav, the nav sticks immediately rather than after scrolling past the hero.

**Prevention:** Use `position: sticky; top: 0` natively rather than a JavaScript-toggled `position: fixed` class. Native sticky avoids all offset calculation and fires off the browser's own scroll position. Add `id="history"`, `id="route"`, `id="gallery"`, `id="sectors"` to target sections before adding links.

**Warning signs:**
- Nav appears fixed before the user has scrolled past the hero on initial page load
- Nav flashes into place on first scroll tick rather than smoothly becoming sticky

**Phase guidance:** Native `position: sticky` is the correct mechanism. Avoid scroll listener + `position: fixed` toggle, which requires precise `offsetTop` calculation that breaks on viewport resize.

---

### Pitfall 4: Background Image Opacity Applied to Container Fades the Text Too

**What goes wrong:** The History section (`HiawathaExplainer.astro`) has three `[data-bg-fade]` subsections that already use `IntersectionObserver` to toggle a `bg-visible` CSS class. The class is defined in the component's `<style>` block — but as of the code inspection, no `::before` pseudo-element background is defined for the `bg-visible` state. The background fade is partially implemented (the observer exists, the class toggles) but the visual effect is not wired up.

When adding faded inspiration images, the most common mistake is applying `opacity` to the `.subsection-bg` container itself rather than to a `::before` pseudo-element. Applying opacity to the container fades the text, pull quotes, museum plates, and all children along with the background.

**Prevention:** Background images must live on `::before` pseudo-elements:
```css
.poem-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/images/inspiration/...');
  background-size: cover;
  opacity: 0;
  transition: opacity 0.6s ease;
  z-index: 0; /* below the z-index: 1 children */
}
.poem-section.bg-visible::before {
  opacity: 0.06; /* keep it faint — it's decorative backdrop */
}
```
The existing `.subsection-bg > *` already sets `z-index: 1`, which correctly layers children above a `z-index: 0` pseudo-element. This structure is already correct — the pseudo-element just needs to be filled in.

**Warning signs:**
- Text, pull quotes, or museum plates fade along with the background during scroll
- The page section temporarily becomes unreadable as users scroll through

**Phase guidance:** Audit whether `bg-visible` has any active CSS when implementing. Fill in the `::before` pseudo-element rather than adding a new mechanism.

---

### Pitfall 5: CSS filter: invert() on Inspiration Images Creates Unacceptable Dark-Mode Artifacts

**What goes wrong:** The milestone spec says "CSS invert for dark mode" on the inspiration images. Applying `filter: invert(1)` to color landscape photographs does not produce a usable dark aesthetic — it produces color-negative images (green trees become magenta, blue sky becomes orange). For faint desaturated backgrounds at ~0.06 opacity, the visible difference between inverted and non-inverted may be acceptable, but the approach is fragile and breaks if opacity increases.

**Prevention:** Use two separate image treatments:
- **Dark mode:** desaturated, low-opacity image (`filter: grayscale(80%) brightness(0.7)`, opacity ~0.06)
- **Light mode:** desaturated, slightly brighter image (`filter: grayscale(60%) brightness(0.9) sepia(20%)`, opacity ~0.08)

Do not apply `filter: invert()` to photographic images. The existing museum plate treatment already does this correctly with `filter: sepia(80%) saturate(30%) brightness(0.9)`.

**Warning signs:**
- Any inspiration image with blue sky or green foliage looks strongly magenta/orange in dark mode
- Switching OS theme causes a jarring visual flash as inverted colors snap in

**Phase guidance:** Test both modes on actual inspiration images before committing to any `filter` approach. A side-by-side OS-theme toggle test at 100% opacity is required before opacity is reduced.

---

### Pitfall 6: prefers-reduced-motion Not Applied to New Scroll Observers

**What goes wrong:** This site already has three IntersectionObserver-driven animations: `ScrollReveal.astro` (reveal on enter), `HiawathaExplainer.astro` (bg-visible toggle), and `AnimatedDivider.astro` (SVG draw). Each of these guards with `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before creating observers. New scroll-triggered fade animations for the inspiration background must follow the same pattern, otherwise the site violates its own established `prefers-reduced-motion` contract and the existing WCAG AA accessibility standard.

**Prevention:** Wrap any new `IntersectionObserver` construction in:
```js
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // observer setup
}
```
Also add the CSS static fallback:
```css
@media (prefers-reduced-motion: reduce) {
  .subsection-bg::before {
    transition: none;
    opacity: 0.04; /* show at fixed low opacity, no fade */
  }
}
```

**Warning signs:**
- New scroll observers created unconditionally (no `matchMedia` guard)
- CSS `transition` on `::before` pseudo-element has no `prefers-reduced-motion: reduce` override

**Phase guidance:** The `prefers-reduced-motion` guard is a done-criteria requirement, not an optional polish step. Audit all new observer and transition code before marking the phase complete.

---

### Pitfall 7: Multiple IntersectionObserver Instances Observing the Same Elements

**What goes wrong:** `ScrollReveal.astro` queries `document.querySelectorAll('[data-reveal]')` globally. `HiawathaExplainer.astro` queries `document.querySelectorAll('[data-bg-fade]')`. If the new ride-ethos explainer section uses `data-reveal` for entry animation AND a new `data-bg-fade` for its background image, it will be observed by multiple observers simultaneously — the reveal observer fires and calls `obs.unobserve(entry.target)` on its own observer only; the bg-fade observer is unaffected. This is not a conflict — it is correct behavior, but it requires understanding that each observer is independent.

**The real risk:** If a new background fade observer is added globally (in a new component that queries `[data-bg-fade]` without disconnecting the existing HiawathaExplainer observer), two observers fire on the same elements. Both toggle the same class. The class toggling becomes a race condition on very fast scroll.

**Prevention:** Keep the `[data-bg-fade]` observer local to `HiawathaExplainer.astro`. Do not add a second global observer for the same selector. If the ride-ethos section needs a background fade, give it a distinct data attribute (e.g., `data-ethos-bg`) and its own scoped observer.

**Warning signs:**
- Two `IntersectionObserver` instances in the DevTools performance trace observing the same DOM node
- Background class toggles with unexpected timing or flicker on medium-speed scroll

**Phase guidance:** Before adding any new observer, grep for existing observers on the same target selector. The current observer inventory (ScrollReveal, HiawathaExplainer, AnimatedDivider, ElevationProfile, RouteMap) is all scoped differently — maintain that separation.

---

### Pitfall 8: External Logo Fetch Fails at Static Site Deploy Time

**What goes wrong:** The spec calls for fetching the Neucadia logo from neucadia.com. A static site has no server-side proxy. If the logo is fetched client-side with `<img src="https://neucadia.com/logo.svg">`, it will:
1. Fail if neucadia.com is down (404, DNS, or timeout)
2. Fail if neucadia.com sends a `Content-Security-Policy` or `X-Frame-Options` header blocking cross-origin use
3. Load slowly on first paint because it is a cross-origin resource not in the browser cache
4. Appear broken in the final rendered page (no fallback)

**Prevention:**
- Download the logo at dev time and commit it to `public/images/neucadia-logo.svg`
- Reference it as a local asset: `<img src="/images/neucadia-logo.svg">`
- If the logo must stay remote (branding requirement), add `onerror` fallback and a text-only fallback: `<span>Neucadia</span>`

**Warning signs:**
- `<img src="https://neucadia.com/...">` committed to the footer component
- No `onerror` handler or fallback text

**Phase guidance:** Treat the logo like any other asset. Download it, run it through the pipeline if it needs WebP conversion (it likely does not for an SVG), and commit the local copy. The "powered by" link can still point to neucadia.com — only the image needs to be local.

---

## Moderate Pitfalls

Mistakes that cause visible bugs or delayed debugging.

---

### Pitfall 9: Section IDs Missing or Conflicting with Existing Anchor Links

**What goes wrong:** The sticky nav requires four anchor targets: `#history`, `#route`, `#gallery`, `#sectors`. The site already has `id="route"` on the Explore the Route section (line 66 in `index.astro`) and `id="gpx-download-link"` on the download anchor. There is no `#history`, `#gallery`, or `#sectors` id in the current DOM.

**The conflict risk:** If `id="route"` is reused as-is, it works. But the existing `id="route"` is on the section wrapper that contains RouteMap — which places the nav link scroll target at the top of the map section with a `max-w-4xl` container, not at the top of the section's heading. With a sticky nav present, the heading will scroll behind the nav and appear clipped.

**Prevention:** Use `scroll-margin-top` on all anchor target sections to offset for the sticky nav height. If the nav is 48px tall:
```css
section[id] {
  scroll-margin-top: 48px;
}
```
Also audit whether `#route` is referenced anywhere else before adding nav links that depend on it.

**Warning signs:**
- Clicking a nav link scrolls so that the section heading is partially hidden behind the nav
- Missing `id` attributes cause nav links to jump to the top of the page

**Phase guidance:** Add `scroll-margin-top` to all four target sections as part of the same task that places the section IDs. Do not separate these steps.

---

### Pitfall 10: Ride Ethos Section Breaks the DOM Order / Section Color Rhythm

**What goes wrong:** `index.astro` has an established rhythm of section background colors: gold-section (DonateCallout), forest-950 (Hiawatha explainer), etc. The ride-ethos explainer is spec'd to appear "above the MBTN callout." The MBTN callout appears in two places: the gold-section at the top and the teal-section near the bottom. If the ride-ethos content is inserted above the gold-section, it must not share the gold background, which is hardcoded to that specific `<section class="gold-section">` element.

If the ride-ethos section is inserted between HeroSection and gold-section (above the sticky nav), it will appear before the nav, which contradicts the spec (nav is below hero, ethos is above MBTN callout — and the MBTN callout is after the nav). The nav placement and the ethos placement must be coordinated.

**Prevention:** Establish DOM insertion points for both the nav and the ethos section before writing component markup. The natural ordering is:
1. HeroSection
2. StickyNav (immediately after hero)
3. RideEthosExplainer (new section)
4. gold-section DonateCallout (MBTN callout)

This places the ethos above MBTN while the nav is above the ethos. Verify this ordering against the spec before writing markup.

**Warning signs:**
- Ride ethos section appears above the sticky nav in the DOM
- Gold background bleeds into the ethos section due to misplaced section wrapper

**Phase guidance:** Write `index.astro` insertion points as a planning step before any component implementation.

---

### Pitfall 11: Light Mode Contrast for Existing Amber/Gold Heading Colors on Beige Backgrounds

**What goes wrong:** The History section headings use `--color-amber-500: #c8973e` for `<h2>` and `--color-amber-500` / `--color-turquoise-400` / `--color-sun-400` / `--color-scarlet-400` for `<h3>` sub-headings. These colors were chosen and WCAG-audited against `--color-forest-900` (#1a2e1a, dark green) and `--color-forest-950` (#0d1a0d, near-black).

On a light beige background (e.g., `#f5f0e8`, `--color-cream-100`), these ratios change dramatically:
- `--color-amber-500` (#c8973e) on `--color-cream-100` (#f5f0e8): approximately 2.4:1 — fails AA for all text
- `--color-turquoise-400` (#4a9eca) on cream: approximately 2.6:1 — fails AA
- `--color-scarlet-400` (#f87171) on cream: approximately 2.8:1 — fails AA

Every colored heading in the History section will fail WCAG AA in light mode if left at their dark-mode values.

**Prevention:** In the `@media (prefers-color-scheme: light)` block scoped to `.hiawatha-section`, override heading colors to dark values. Use forest-900 (#1a2e1a) for `h2` and forest-800 (#2d4a2d) for `h3` in light mode, or audit alternative color choices.

**Warning signs:**
- Browser accessibility audit (Lighthouse) returns contrast failures after light mode is added
- Any heading in the History section that is amber, turquoise, sun-yellow, or scarlet fails AA on cream

**Phase guidance:** Run a contrast check on every heading color used in `HiawathaExplainer.astro` against the proposed light-mode background before finalizing the palette. This is a done-criteria requirement, not post-merge polish.

---

### Pitfall 12: The "Powered by Neucadia" Footer Must Not Break the Existing Footer Section

**What goes wrong:** The current footer-like section in `index.astro` is a `<section>` with `class="bg-forest-950"` containing the shield motif, attribution note, and Ojibwe cultural acknowledgment. It is not a `<footer>` element. Adding a "Powered by Neucadia" full-width line requires deciding where it lives: inside the existing section (sharing the same dark background), or as a new `<footer>` element below it.

If placed inside the existing section, the Neucadia line may visually compete with the Ojibwe acknowledgment — both are small-print footer-style text. If placed as a new `<footer>` below, the page gains a second terminal section that may look like a double-footer on narrow screens.

**Prevention:** Add a semantic `<footer>` element wrapping both the existing bottom section and the Neucadia line. This is correct HTML, improves document semantics, and provides a single visual container. The "Powered by Neucadia" line can be separated from the acknowledgment text by a border or spacing.

**Warning signs:**
- Two visually distinct "footer" sections stacked with no separator
- Neucadia line sharing the same visual weight as the Ojibwe acknowledgment text

**Phase guidance:** The BaseLayout `<main>` wraps the current slot. A `<footer>` should be added to `BaseLayout.astro` outside `<main>`, not as an additional section inside the `index.astro` slot.

---

## Minor Pitfalls

---

### Pitfall 13: Sticky Nav Active State Cannot Use scroll-spy Without JavaScript

**What goes wrong:** Marking the active section in the nav (bold or highlighted link for the section currently in the viewport) requires either JavaScript scroll-spy or the newer CSS Scroll-Driven Animations API. If active state is a nice-to-have, it should be deferred — attempting it adds a non-trivial observer-based system that needs to coordinate with the five existing IntersectionObservers.

**Prevention:** Design the nav without active state highlighting for the first implementation. The four links are sufficient without it. Add active state as a separate sub-task with explicit scope.

**Warning signs:**
- Nav implementation adds a sixth IntersectionObserver that queries all four section IDs simultaneously
- Scroll-spy logic tied to the same observer as the background-fade observers

---

### Pitfall 14: Nav Accessibility — Missing aria-label on nav Element

**What goes wrong:** If the page has more than one `<nav>` element (unlikely now, but possible if `BaseLayout.astro` grows), the nav bar needs an `aria-label` to distinguish it from other nav regions. Even with a single nav, screen readers announce "navigation" without a label — "Main navigation" or "Section navigation" is more descriptive.

**Prevention:** `<nav aria-label="Section navigation">` on the sticky nav bar. This costs nothing to add and is correct from the start.

**Warning signs:**
- `<nav>` element with no `aria-label` or `aria-labelledby`

---

### Pitfall 15: Inspiration Image Pipeline Integration Forgotten

**What goes wrong:** The image pipeline (`pipeline.js`) runs `generate-thumbnails`, `copy-images`, `generate-webp`, and `process-historical` in sequence. Inspiration images currently live in `/images/inspiration/` as raw uploaded files. If they are referenced directly from that path in CSS background-image declarations, they will not be optimized. More importantly, they will not be present in `public/images/` where the build serves them from — `copy-images.js` copies from a source directory to `public/images/`, and inspiration images may not be in that source path.

**Prevention:** Before referencing inspiration images in CSS, run `ls /images/inspiration/` and verify the images are copied to `public/images/` by the pipeline. If they are not, add a pipeline step or manually copy them. Verify the final `public/images/` path matches the CSS `url()` reference.

**Warning signs:**
- CSS references `url('/images/inspiration/some-file.jpg')` but the file does not exist in `public/images/`
- Background images appear broken in the built site but work in dev (dev serves from the source tree, build serves from `public/`)

---

## Phase-Specific Warning Reference

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Sticky nav placement in DOM | Wrong position relative to hero, missing `scroll-margin-top` | Pitfall 3, 9 — native sticky, add scroll-margin-top |
| Sticky nav z-index | Collision with sector panel (z-index 1000) | Pitfall 2 — assign z-index 100, document budget |
| Ride ethos section insertion | Breaks section color rhythm, wrong DOM order | Pitfall 10 — plan insertion points before markup |
| Light mode for History section | Breaking existing heading contrast ratios | Pitfall 1, 11 — scope to `.hiawatha-section`, audit all heading colors |
| Inspiration images as backgrounds | Opacity fades text content | Pitfall 4 — use `::before` pseudo-element only |
| CSS filter for dark-mode images | Photographic inversion looks like film negatives | Pitfall 5 — use `grayscale + brightness`, not `invert` |
| New scroll-triggered animations | Missing `prefers-reduced-motion` guard | Pitfall 6 — required, not optional |
| Multiple IntersectionObservers | Race condition if two observe same elements | Pitfall 7 — keep observers scoped, use distinct data attributes |
| Neucadia logo | Remote image fails silently | Pitfall 8 — download and commit locally |
| Neucadia footer placement | Double-footer confusion, wrong semantic element | Pitfall 12 — add `<footer>` to BaseLayout |
| Inspiration images pipeline | Images not copied to public/images | Pitfall 15 — verify pipeline paths before CSS references |

---

## Sources

Confidence: HIGH on all critical pitfalls — derived from direct code inspection.

**Code-inspected files:**
- `src/styles/global.css` — `@theme static` token definitions, layer order
- `src/components/HeroSection.astro` — hero z-index (0, 1), video overlay structure
- `src/components/HiawathaExplainer.astro` — `[data-bg-fade]` observer, subsection z-index (1), existing `prefers-reduced-motion` guard
- `src/components/ScrollReveal.astro` — global `[data-reveal]` observer, `prefers-reduced-motion` guard
- `src/components/RouteMap.astro` — sector panel z-index (1000), `position: fixed`
- `src/components/ElevationProfile.astro` — IntersectionObserver lazy-init pattern
- `src/pages/index.astro` — DOM order, section IDs, existing `id="route"`
- `src/layouts/BaseLayout.astro` — `<main>` wrapper structure (no `<footer>` currently)
- `scripts/pipeline.js` — pipeline step order and image processing scope

**Web sources (verified against code):**
- Tailwind CSS v4 theme docs: `@theme static` generates regular CSS custom properties, fully overridable in media queries
- CSS `position: sticky` stacking context behavior: sticky creates stacking context only when `z-index` is not `auto`
- `opacity` creates new stacking context: applying `opacity` to container affects all children including text
- `prefers-reduced-motion` best practices: guard IntersectionObserver creation AND provide CSS fallback
- `filter: invert()` on photographs: produces film-negative effect, not viable for photographic backgrounds
