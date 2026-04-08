# Architecture Research: v1.8 Navigation & Identity

**Domain:** Integrating sticky nav, ride ethos explainer, Neucadia footer, and light/dark history section into an existing Astro 6 + Tailwind 4 static site
**Researched:** 2026-04-07
**Confidence:** HIGH — based on direct analysis of all components, index.astro, BaseLayout.astro, global.css, HiawathaExplainer.astro, ScrollReveal.astro, and the 49 existing inspiration images

---

## Existing Architecture Snapshot

The site is a single `src/pages/index.astro` that imports all components. Layout flow (sequential):

```
BaseLayout (html/head/body wrapper)
  └── <main>
        HeroSection              — full-viewport video/image hero
        <section> DonateCallout  — gold-section (sun-500 bg)
        FloralDivider
        HiawathaExplainer        — hiawatha-section (forest-950 bg)
        RouteExplainer           — route-explainer-section
        AnimatedDivider (minimal)
        <section> RouteStats     — amber-section
        <section> GPX download   — bg-forest-800
        AnimatedDivider (berry)
        OjibweBorderPattern
        <section id="route"> RouteMap  ← only section with id currently
        <section> ElevationProfile
        WaterWavePattern
        <section> PhotoGallery
        AnimatedDivider (floral)
        <section> DonateCallout  — teal-section
        <section> footer text    — bg-forest-950
        ScrollReveal             — JS-only, no DOM output
```

Key architecture constraints established in prior milestones:
- `@theme static` (not `@theme`) for Tailwind tokens — all tokens stay in `:root` for JS access via `getComputedStyle`
- Scoped Astro styles + `:global()` pattern for cross-component overrides from parent
- `[data-reveal]` + `ScrollReveal.astro` IntersectionObserver pattern for scroll animations
- `[data-bg-fade]` + per-component IntersectionObserver for background parallax in HiawathaExplainer
- `#route=100k` URL hash pattern used by RouteMap — scroll-fragment IDs must not collide with `#route`
- Hero is `100svh` height — sticky nav must account for this when calculating scroll threshold

---

## Component Integration Map: What Needs to Change

### New Components (create from scratch)

**1. `StickyNav.astro`**

A new component, not a modification to any existing component. Placed in `index.astro` immediately after `<HeroSection />`, before the first `<section>`.

Integration points:
- Rendered between `<HeroSection />` and the gold `<section>` containing `DonateCallout` in `index.astro`
- Links to 4 anchor IDs that must be added to existing sections: `#history`, `#route` (already exists), `#gallery`, `#sectors`
- The nav starts in document flow (not fixed), becomes `position: fixed` at top when scrolled past the hero
- Uses `IntersectionObserver` on `<HeroSection>` element to toggle the fixed class — consistent with the existing observer pattern already used by `ScrollReveal.astro` and `HiawathaExplainer.astro`
- Does NOT use `[data-reveal]` (nav should appear immediately, not fade in)
- Self-contained `<script>` inside the component, matching the Astro pattern

Anchor IDs to add in `index.astro`:
- `id="history"` — add to the `<section>` wrapping `<HiawathaExplainer />` (currently it has no wrapper section — `HiawathaExplainer` renders its own `<section>` element, so add `id="history"` as a prop or directly to `HiawathaExplainer`'s outer section)
- `id="route"` — already exists on the RouteMap section
- `id="gallery"` — add to the `<section>` that wraps `<PhotoGallery />` (line 82 in index.astro)
- `id="sectors"` — add to the `<section>` wrapping `<RouteExplainer />` (RouteExplainer renders its own outer section, same pattern as HiawathaExplainer)

**2. `RideEthos.astro`**

A new component placed in `index.astro` between `<FloralDivider />` and `<HiawathaExplainer />`. Per the brief, it goes "above the MBTN callout" — however the page has two MBTN callout placements. Based on needs.md ("above the Munising Bay Trail Network callout below the hero"), this means between the hero area and the history section. The most defensible placement: after `<FloralDivider />`, before `<HiawathaExplainer />`.

Content: Since June 7, 2014. Always free. Ride your own pace. Fellowship over competition. All levels welcome.

Styling: Larger font, distinct color treatment to stand out. The existing `gold-section` (sun-500) is already used for the DonateCallout above this. Use a different color — the cream/parchment palette on forest-800 background would distinguish it, or a standalone cream bg with forest-950 text for contrast.

No data dependencies. Pure content + styling.

**3. `NeucadiaFooter.astro`**

A new component replacing the existing informal footer text in `index.astro` (lines 98–112), or added after it. The current "footer" section contains the shield/turtle motif and Ojibwe attribution text — that should be preserved. The Neucadia footer is a separate, distinct element: full-width, single line, "Powered by Neucadia" with logo.

The logo at `https://neucadia.com/assets/neucadia_logo.png` is an external PNG. For a static site, the options are:
- Fetch and bundle the PNG in the build pipeline
- `<img src="https://neucadia.com/assets/neucadia_logo.png">` with external reference
- Text-only fallback if image unavailable

Recommended: `<img>` with external src, `loading="lazy"`, explicit `width`/`height` for CLS prevention, `alt="Neucadia"`. This is a footer element — not LCP-critical. No pipeline change needed.

Placement: After the existing `bg-forest-950` attribution section in `index.astro`. A new `<footer>` HTML element (not `<section>`) for semantic correctness. Full-width, visually distinct from the Ojibwe attribution above it.

### Modified Components

**4. `HiawathaExplainer.astro` — Light/Dark Mode**

This is the most architecturally complex change. The component currently has a hardcoded dark background (`background-color: var(--color-forest-950)`).

The requirement: `prefers-color-scheme` light mode gets a beige/off-white background. Both modes get faded desaturated inspiration images with scroll-triggered fade in/out.

Three sub-problems:

**A. Color scheme switching via CSS media query**

Add to the existing `.hiawatha-section` style block:
```css
@media (prefers-color-scheme: light) {
  .hiawatha-section {
    background-color: #f5f0e8; /* --color-cream-100 */
    color: var(--color-forest-950);
  }
  /* Override text colors for light mode readability */
}
```

The existing typography uses hardcoded color variables (cream-100 text, amber-500/turquoise-400/sun-400/scarlet-400 headings). In light mode on a cream background, `--color-cream-100` text becomes invisible — it must be overridden. Each heading color (amber-500, turquoise-400, sun-400, scarlet-400) needs contrast checking against the light background. Most will be too light — will need darker variants from the existing palette.

The museum plate, pull quote, and drop cap colors all need light mode overrides. This is the most CSS-intensive change in the milestone.

**B. Inspiration images as faded backgrounds**

49 inspiration images exist in `images/inspiration/`. These are `.webp` and `.jpg` files. They need to be served from `public/` — check if they're already copied by the pipeline. If not, a pipeline step or a direct `public/inspiration/` copy is needed.

The `.subsection-bg::before` pseudo-element currently exists in `HiawathaExplainer.astro` (see `prefers-reduced-motion: reduce` rule at line 222 targeting `.subsection-bg::before`). This is the hook for background images — the parallax background was planned but appears partially stubbed. The pseudo-element already exists in reduced-motion fallback, meaning the full implementation was begun but the `background-image` rules were removed or never added for the three sub-sections.

Architecture for inspiration images:
- Three `subsection-bg` divs (poem-section, forest-section, ride-section) each get a `::before` pseudo-element with `background-image`, `background-size: cover`, `filter: grayscale(100%) brightness(0.3)` (dark mode) or `filter: grayscale(100%) brightness(0.85) saturate(0)` (light mode)
- The `bg-visible` class toggle (already wired in the existing `data-bg-fade` IntersectionObserver script) controls opacity fade in/out
- Image assignment: pick one inspiration image per sub-section — forest/wilderness for poem-section, forest landscape for forest-section, trail/bike image for ride-section

**C. Scroll-triggered fade**

The `[data-bg-fade]` + `bg-visible` class mechanism is already fully implemented in `HiawathaExplainer.astro` (lines 430–443). The observer fires at `threshold: 0.15`. This is the mechanism to use — no new JS needed. Adding the `::before` background image CSS and opacity transition is the only remaining work.

**5. `index.astro` — Anchor ID additions**

Not a component change — four `id=` attributes added to existing section elements. However, `HiawathaExplainer` and `RouteExplainer` both render their own outer `<section>` tag inside the component. Two options:

Option A: Pass `id` as a prop to those components and apply it to their outer section.
Option B: Wrap the `<HiawathaExplainer />` and `<RouteExplainer />` invocations in a `<div id="history">` / `<div id="sectors">` wrapper in `index.astro`.

Option B is simpler — no component modification needed, and a wrapper div with just an `id` has no visual effect. It's a valid anchor target. Use this approach.

**6. `BaseLayout.astro` — No changes expected**

The `<main>` wrapper has no height constraint or overflow hidden that would interfere with a sticky nav. The `body` has `min-h-screen`. No changes needed.

---

## Data Flow Changes

No new data pipeline steps. All four features are pure frontend/CSS:

| Feature | Data source | Pipeline impact |
|---------|-------------|-----------------|
| Sticky nav | Hardcoded links + scroll JS | None |
| Ride ethos | Hardcoded content | None |
| Neucadia footer | External URL for logo | None (external img) |
| Light/dark history | CSS media query + existing inspiration images | Possibly: copy inspiration/ to public/inspiration/ if not already there |

The inspiration images may need a pipeline step. Check: they exist at `images/inspiration/` but it's unclear if they're already in `public/`. The build pipeline's `copy-images` step copies from `images/` to `public/images/`. The `images/inspiration/` subfolder — if it's included in that copy step — is already available at `public/images/inspiration/`. Verify before adding a new pipeline step.

---

## Sticky Nav: Scroll Behavior Architecture

The standard approach for "nav that starts in flow, becomes fixed on scroll" has two sub-patterns:

**Pattern A: IntersectionObserver on hero**
- Place a sentinel element (or observe the `<HeroSection>` itself) at the bottom of the hero
- When hero leaves viewport, add `.is-fixed` to nav; when it re-enters, remove it
- Pro: No scroll event listener, consistent with existing site patterns
- Con: Requires observing a specific element

**Pattern B: CSS `position: sticky`**
- Nav is `position: sticky; top: 0` in normal flow
- Becomes sticky automatically when parent scrolls
- Pro: Zero JavaScript needed
- Con: The nav needs to be inside a parent that is taller than the nav (it is — the entire page content follows)

Recommendation: CSS `position: sticky; top: 0` with a high `z-index`. This is the simplest, most reliable approach and requires no JavaScript at all. The only case where the IntersectionObserver is needed is if the nav should be visually different (e.g., transparent → opaque background) when it sticks — a CSS scroll-driven animation or `@supports` sticky check can handle that too.

If a "background appears on stick" effect is wanted: use `position: sticky` + a CSS custom property updated on scroll, or use the IntersectionObserver on the hero sentinel. Both patterns are zero-dependency additions.

---

## URL Hash Collision Risk

The RouteMap uses `#route=100k` URL hash format (not a plain fragment ID). The sticky nav links use plain fragment IDs (`#history`, `#route`, `#gallery`, `#sectors`).

**Collision:** `#route` in the nav links to the RouteMap section (already has `id="route"`). The RouteMap hash pattern is `#route=100k` (with `=` separator). The plain `#route` fragment will not match the RouteMap's regex `/^#route=(.+)$/` — it requires an `=` sign. So `href="#route"` in the nav is safe and will not trigger the route-switching logic.

**Scroll offset issue:** When the sticky nav is fixed at the top (~48–56px), clicking `#route` will scroll such that the section heading is hidden behind the nav. This is the standard "sticky nav scroll offset" problem. Fix: add `scroll-margin-top: 56px` (or whatever the nav height is) to `#history`, `#route`, `#gallery`, `#sectors` via CSS. This is a single CSS rule in `global.css` or in `StickyNav.astro`'s style block.

---

## Light/Dark Mode: CSS Scoping

The `prefers-color-scheme` media query in Astro scoped styles works correctly. Astro's scoped style compiler adds a unique hash attribute to elements — `@media` queries inside scoped `<style>` blocks work identically to standard CSS. No special handling needed.

The risk: the editorial content uses many explicit color variable references (`var(--color-cream-100)`, etc.) that are theme-agnostic (not dark-mode-aware). The light mode overrides need to be comprehensive. The `.hiawatha-section` class is the scope boundary — a single `@media (prefers-color-scheme: light) { .hiawatha-section { ... } }` block covering all nested selectors is the right approach.

The `pull-quote` background (`var(--color-forest-800)`) on a light beige page will appear as a dark green box — which may actually be a desirable contrast element. Evaluate visually.

---

## Component Build Order

Dependencies between the four features:

1. **Anchor IDs** (`index.astro` wrapper divs) — must be done before or alongside sticky nav, since the nav links to them. No external dependency.

2. **Sticky nav** (`StickyNav.astro`) — depends on anchor IDs existing. Can be built and tested with placeholder anchors. No other dependencies.

3. **Ride ethos** (`RideEthos.astro`) — fully independent. No anchor needed. Can be built in any order.

4. **Neucadia footer** (`NeucadiaFooter.astro`) — fully independent. No anchor needed. Can be built in any order.

5. **Light/dark history** (`HiawathaExplainer.astro` modification) — independent of other three features. Depends on inspiration images being available in public/. Most complex — should be built last or in a dedicated phase.

Recommended phase order:
1. Sticky nav + anchor IDs (coupled — one phase)
2. Ride ethos explainer (standalone — can be its own small phase or bundled with footer)
3. Neucadia footer (standalone — bundle with ride ethos)
4. History light/dark mode (most complex — dedicated phase)

---

## Inspiration Images: Pipeline Status

The `images/inspiration/` directory contains 49 images (mix of `.webp` and `.jpg`). The build pipeline has a `copy-images` step. Whether inspiration images are included in that copy depends on what path pattern `copy-images` uses.

If `copy-images` copies all of `images/` recursively, then `public/images/inspiration/*.webp` already exists after a build. If it copies specific files or skips subdirectories, a new pipeline entry is needed.

Check the pipeline's `copy-images` step before writing any `background-image: url('/images/inspiration/...')` references. If images aren't served, the background will silently fail.

---

## New Component Signatures

```
StickyNav.astro
  Props: none
  Renders: <nav> with 4 anchor links
  Script: IntersectionObserver on hero sentinel OR relies on CSS position:sticky
  Output CSS class: .sticky-nav (base), .sticky-nav--fixed (when scrolled)

RideEthos.astro
  Props: none
  Renders: <section> with ethos content
  No script needed

NeucadiaFooter.astro
  Props: none
  Renders: <footer> with "Powered by" text and <img> logo
  No script needed

HiawathaExplainer.astro (modified)
  New CSS: @media (prefers-color-scheme: light) overrides
  New CSS: .subsection-bg::before { background-image, opacity, transition }
  New CSS: .bg-visible { opacity change for ::before }
  Existing script: unchanged (already handles bg-visible toggle)
```

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Component placement | HIGH | Direct codebase analysis — exact line numbers verified |
| Sticky nav scroll behavior | HIGH | CSS position:sticky is well-established; observer pattern matches existing site code |
| URL hash collision | HIGH | RouteMap regex requires `=` separator — `#route` plain fragment is safe |
| Light/dark color overrides | MEDIUM | CSS structure is clear; specific color values for light mode need visual validation |
| Inspiration image availability | MEDIUM | Files exist in images/inspiration/ — pipeline copy behavior needs verification before implementation |
| Neucadia logo format | MEDIUM | PNG at /assets/neucadia_logo.png confirmed via WebFetch; dimensions unknown |

---

## Open Questions

1. **Does `copy-images` include `images/inspiration/` subdirectory?** — Check `scripts/pipeline.js` copy-images step before writing background-image CSS paths.

2. **Which inspiration images map to which sub-section?** — Three sub-sections (poem, forest, ride) need one image each. Curatorial decision for implementation phase.

3. **Sticky nav height for scroll-margin-top** — Final nav height determines the CSS offset value. Measure after building.

4. **Neucadia logo dimensions** — No width/height known from research. Set `width` and `height` attributes after inspecting the actual PNG to prevent CLS.

5. **Light mode text colors** — Specific color token choices for body text, headings, and accents on the cream-100 background need visual review. The existing WCAG contrast annotations in global.css (documented per token vs forest-900/forest-950) won't apply to a light background — new contrast calculations needed for the relevant tokens.
