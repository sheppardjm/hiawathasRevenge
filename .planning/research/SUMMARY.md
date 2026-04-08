# Project Research Summary

**Project:** Hiawatha's Revenge v1.8 — Navigation & Identity
**Domain:** Static editorial cycling site — nav, identity, and light/dark theming additions
**Researched:** 2026-04-07
**Confidence:** HIGH

## Executive Summary

v1.8 adds four features to an existing Astro 6 + Tailwind 4 single-page editorial site: a sticky navigation bar below the hero, a ride ethos explainer section, a "Powered by Neucadia" footer, and light/dark mode for the History section via `prefers-color-scheme`. All four are purely CSS/HTML work. Zero new npm dependencies are required. Every feature is implemented using native browser APIs already in use in the codebase or baseline-available since 2020. The recommended approach is additive: new Astro components for nav, ethos, and footer; a CSS `@media` block added to the existing `HiawathaExplainer.astro` for light/dark switching.

The critical architectural constraint is scope. Light/dark mode applies only to the History section — not the whole site. The existing `@theme static` token system is a dark-site design and must not be overridden globally. All `prefers-color-scheme: light` rules must be scoped to `.hiawatha-section`. The scroll-triggered image fade in the History section builds directly on an existing `IntersectionObserver` + `bg-visible` class mechanism that is already partially implemented (observer fires, `::before` CSS not yet wired).

The top risks are: (1) CSS contrast failures when existing amber/turquoise heading colors render on a cream background in light mode — every heading color needs a contrast audit before marking the phase complete; (2) silently broken background images if inspiration images are not confirmed present in `public/images/` before CSS `url()` references are written; (3) z-index collision between the sticky nav and the sector panel (z-index 1000) — assign the nav z-index 100 and document a budget. Two items need requirement clarification before build: the exact placement of the ethos explainer ("above MBTN callout" is ambiguous between two DonateCallout instances) and whether the Neucadia logo should be fetched locally or remain as an external reference.

---

## Key Findings

### Recommended Stack

No changes to the stack. Astro 6.1.2, Tailwind CSS 4.2.2, and TypeScript 5.9.3 are all that is needed. `position: sticky` replaces any JS-driven scroll-fix approach (97% global support, MDN Baseline). `@media (prefers-color-scheme)` is Baseline Widely Available since January 2020. `IntersectionObserver` is already used in three existing components and handles the scroll-triggered fade. CSS scroll-driven animations (`animation-timeline: view()`) are explicitly ruled out — not Baseline, Firefox unsupported as of April 2026. No animation libraries, no color-mode libraries, no framework islands.

**Core technologies:**
- Astro 6.1.2: component authoring, scoped `<style>` blocks — no change
- Tailwind 4.2.2: `dark:` variant available but not used; `@theme static` CSS vars are the project's established pattern
- `position: sticky` CSS: sticky nav behavior, zero JS, 97.21% global support
- `@media (prefers-color-scheme: light)`: scoped to `.hiawatha-section`, CSS-only, no localStorage
- `IntersectionObserver` (existing): extended to `::before` pseudo-element opacity toggling for image fade

### Expected Features

All four v1.8 features are correctly scoped and should ship together. No deferral recommended.

**Must have (table stakes):**
- Sticky nav links scroll to correct sections — requires adding `id="history"`, `id="gallery"`, `id="sectors"` to existing sections (`id="route"` already exists)
- `scroll-margin-top` on all four anchor targets — without this, sticky nav covers section headings on link click
- Nav visible on all screen sizes, no hamburger collapse — 4 short labels fit at 375px with compact sizing
- History light mode background = `--color-cream-100` (#f5f0e8), not pure white
- History images desaturated via CSS filter, not `filter: invert()` — photographic inversion produces film-negative artifacts
- `prefers-reduced-motion` guard on all new scroll animations — site-wide contract already established

**Should have (differentiators):**
- Nav gains visual weight when stuck (subtle `box-shadow` via IntersectionObserver sentinel)
- Ethos section uses founding date ("Since June 7, 2014") as typographically emphasized statement format
- History image filter transitions smoothly between light and dark mode (CSS `transition: filter`)
- Neucadia logo stored locally in `public/images/` rather than as external `<img src>` — prevents silent failure

**Defer (v2+):**
- Active section highlighting (scroll-spy) in nav — requires a sixth IntersectionObserver; scoped as a separate sub-task
- Hamburger or bottom-bar mobile nav — anti-feature for this site
- Site-wide dark/light toggle — OS preference only is correct for a static editorial site
- CSS `:stuck` pseudo-class for nav shadow — Chrome 132+ only, no Firefox

### Architecture Approach

The site is a single `index.astro` that imports all components in sequence. Three new Astro components are created (`StickyNav.astro`, `RideEthos.astro`, `NeucadiaFooter.astro`). One existing component is modified (`HiawathaExplainer.astro`). DOM insertion order in `index.astro` is the only coordination point. No data pipeline changes are required for nav, ethos, or footer. The History light/dark mode requires a pipeline verification step to confirm inspiration images are present in `public/images/inspiration/` before CSS `url()` references are written.

**Major components:**
1. `StickyNav.astro` (new) — `position: sticky; top: 0`, four anchor links, z-index 100, `scroll-margin-top` CSS var, optional IntersectionObserver sentinel for stuck-shadow
2. `RideEthos.astro` (new) — static statement section, no script, inserted after `<FloralDivider />` before `<HiawathaExplainer />`
3. `NeucadiaFooter.astro` (new) — semantic `<footer>` element added to `BaseLayout.astro` outside `<main>`, `<img>` logo with `loading="lazy"`, full-width single line
4. `HiawathaExplainer.astro` (modified) — `@media (prefers-color-scheme: light)` block scoped to `.hiawatha-section`; `::before` pseudo-element background images wired to existing `bg-visible` class toggle; heading color overrides for light-mode contrast

**Anchor IDs strategy:** wrap `<HiawathaExplainer />` and `<RouteExplainer />` in `<div id="history">` / `<div id="sectors">` in `index.astro` — simpler than passing as props, no component modification needed.

### Critical Pitfalls

1. **Global `@theme static` token override breaks the whole site in light mode** — scope all `prefers-color-scheme: light` CSS to `.hiawatha-section` only. Leaflet popups, the sector panel (z-index 1000, `position: fixed`), and all other sections reference `--color-forest-9xx` tokens globally.

2. **Sticky nav z-index collision with sector panel** — sector panel is z-index 1000; assign nav z-index 100 and document a z-index budget in `global.css`. Tailwind's reflexive `z-50` will be swallowed by the panel.

3. **Background image opacity on container fades text** — inspiration images must use `::before` pseudo-elements with their own `opacity` transitions. The existing `.subsection-bg > *` already sets `z-index: 1`; `::before` at `z-index: 0` is the correct structure. The observer and `bg-visible` class are already wired — only the `::before` CSS is missing.

4. **Amber/turquoise heading colors fail WCAG AA on cream background** — `--color-amber-500` (#c8973e) on `--color-cream-100` (#f5f0e8) is approximately 2.4:1. Every colored heading in HiawathaExplainer needs override values in the light-mode `@media` block before the phase is done.

5. **External Neucadia logo fails silently** — `<img src="https://neucadia.com/...">` breaks on network failure with no fallback. Download and commit to `public/images/neucadia-logo.png` before shipping.

---

## Implications for Roadmap

All four features are implementation-independent of each other. Phases ordered by risk level, not feature dependency.

### Phase 1: Foundation — Sticky Nav + Section IDs

**Rationale:** The nav is the highest structural change — it requires adding `id` attributes to existing sections and introducing the first `position: sticky` + z-index element in the project. Doing this first establishes the z-index budget and `scroll-margin-top` pattern that all subsequent phases inherit. The nav height CSS variable also sets the offset used by all anchor targets.

**Delivers:** Fully functional sticky nav with four working anchor links, `scroll-margin-top` on all targets, z-index budget documented in `global.css`.

**Addresses:** Table-stakes features — nav links scroll correctly, visible all screen sizes, nav below hero, no hamburger.

**Avoids:** Pitfall 2 (z-index collision with sector panel), Pitfall 3 (wrong sticky transition point), Pitfall 9 (missing scroll-margin-top).

### Phase 2: Identity — Ride Ethos + Neucadia Footer

**Rationale:** Both are fully additive, touch no existing component logic, and carry zero implementation risk. Bundle them as a small identity phase. Requires one upfront clarification: confirm ethos placement ("above MBTN callout" is ambiguous — recommend after `<FloralDivider />`, before `<HiawathaExplainer />`).

**Delivers:** `RideEthos.astro` in its correct DOM position; `NeucadiaFooter.astro` as a semantic `<footer>` in `BaseLayout.astro`; Neucadia logo committed as a local asset.

**Addresses:** Neucadia footer feature; ride ethos feature; semantic HTML improvement (existing footer is a `<section>`, not `<footer>`).

**Avoids:** Pitfall 8 (external logo failure), Pitfall 10 (ethos breaks section color rhythm), Pitfall 12 (double-footer confusion).

### Phase 3: History Light/Dark Mode

**Rationale:** Most complex change — modifies an existing component with established styles, requires a contrast audit on every heading color, involves the partially-implemented `::before` background system, and must verify inspiration image pipeline availability. Last to allow focused QA without blocking phases 1 and 2.

**Delivers:** `HiawathaExplainer.astro` with `@media (prefers-color-scheme: light)` overrides scoped to `.hiawatha-section`; inspiration images wired to `::before` pseudo-elements with `grayscale + brightness` filter treatment; scroll-triggered fade in/out working; `prefers-reduced-motion` guards on all new transitions.

**Addresses:** History light/dark mode feature; scroll-triggered image fade.

**Avoids:** Pitfall 1 (global token bleed), Pitfall 4 (opacity fades text), Pitfall 5 (invert artifacts on photos), Pitfall 6 (missing reduced-motion guard), Pitfall 11 (heading contrast failures), Pitfall 15 (inspiration images not in public/).

### Phase Ordering Rationale

- Phase 1 first: establishes `index.astro` DOM order and the CSS var for nav height (`--nav-height`) that phases 2 and 3 inherit for precise `scroll-margin-top`
- Phases 2 and 3 are independent of each other but both depend on Phase 1's `index.astro` DOM finalization
- Phase 3 last: isolated to `HiawathaExplainer.astro` internals, most testing-intensive (two OS theme states + reduced-motion), benefits from knowing Phase 1 nav height for offset precision

### Research Flags

Phases with standard patterns (skip deeper research):
- **Phase 1 (Sticky Nav):** `position: sticky`, `scroll-margin-top`, and IntersectionObserver sentinel are textbook CSS + MDN Baseline. Codebase already uses this exact observer pattern. No research phase needed.
- **Phase 2 (Identity):** Pure static content components. No research needed.

Phases requiring pre-build implementation checks (not a full research-phase):
- **Phase 3 (History Light/Dark):** Two mandatory pre-build checks — (1) run contrast calculations for every heading color before writing CSS; (2) verify `copy-images` pipeline step includes `images/inspiration/` before writing `url()` references. These are scoped implementation-time checks.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All decisions verified against installed package versions and MDN Baseline status. Direct codebase analysis confirms IntersectionObserver pattern reuse. Zero new dependencies confirmed. |
| Features | HIGH | MDN, LogRocket UX analysis, CSS-Tricks guide, and live gravel site audits (SBT GRVL, Grasshopper, Grassroots Gravel) corroborate all table-stakes and differentiator calls. |
| Architecture | HIGH | Based on direct code inspection of all relevant components with exact line numbers. Component placement and observer scoping verified against actual implementation state. |
| Pitfalls | HIGH | All critical pitfalls derived from code inspection, not inference. Contrast ratio calculations use actual hex values. Z-index inventory from actual source values. |

**Overall confidence:** HIGH

### Gaps to Address

- **Ethos placement:** "Above the MBTN callout" has two possible interpretations. Architecture research recommends after `<FloralDivider />` (before `<HiawathaExplainer />`). Confirm with product owner before Phase 2.

- **Specific inspiration image selection:** Three sub-sections (poem, forest, ride) each need one background image from the 49 available in `images/inspiration/`. Curatorial decision deferred to Phase 3 planning.

- **Neucadia logo dimensions:** PNG confirmed accessible (5.1KB) but width/height are unknown. Set explicit `width` and `height` attributes after inspecting the asset to prevent CLS.

- **Inspiration images pipeline status:** Whether `scripts/pipeline.js` `copy-images` step includes `images/inspiration/` is unverified. Must be checked before Phase 3 writes any CSS `url()` references.

- **Light mode heading color palette:** Exact replacement tokens for amber/turquoise/sun/scarlet headings in light mode are unspecified. Forest-900 for `h2` and forest-800 for `h3` are the recommended defaults, but visual review is required before finalizing.

---

## Sources

### Primary (HIGH confidence)
- MDN Web Docs — `prefers-color-scheme`, `position: sticky`, `animation-timeline`, `scroll-margin-top` — Baseline status verified for all
- caniuse.com — `position: sticky` 97.21% global support confirmed
- Direct codebase inspection (2026-04-07): `HiawathaExplainer.astro`, `ScrollReveal.astro`, `RouteMap.astro`, `HeroSection.astro`, `BaseLayout.astro`, `global.css`, `index.astro`, `scripts/pipeline.js`
- Tailwind CSS v4 dark mode documentation — `dark:` variant behavior with `prefers-color-scheme`

### Secondary (MEDIUM confidence)
- `https://neucadia.com/assets/neucadia_logo.png` — PNG confirmed accessible at 5.1KB via WebFetch 2026-04-07
- LogRocket UX analysis — sticky vs. fixed navigation UX patterns
- CSS-Tricks — complete guide to dark mode on the web
- SBT GRVL, Grasshopper Adventure Series, Grassroots Gravel — live site audits for nav and ethos section patterns

### Tertiary (LOW confidence)
- Webflow Blog — general navigation bar design best practices (not cycling-specific)

---

*Research completed: 2026-04-07*
*Ready for roadmap: yes*
