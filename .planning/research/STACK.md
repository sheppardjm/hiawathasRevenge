# Technology Stack: Navigation & Identity (v1.8)

**Project:** Hiawatha's Revenge v1.8
**Researched:** 2026-04-07
**Scope:** Stack additions/changes for sticky nav, light/dark history section, scroll-triggered image fading, and Neucadia brand footer
**Overall confidence:** HIGH
**Core constraint:** No new npm dependencies. All four features are solved by the existing stack plus native browser APIs.

---

## Executive Summary

Zero new dependencies. Every v1.8 feature is handled by the existing stack plus native CSS/browser capabilities that are already in use or baseline-available:

1. **Sticky nav** — `position: sticky` CSS (97% global support, MDN Baseline)
2. **Light/dark history section** — `@media (prefers-color-scheme: dark)` (MDN Baseline since 2020); Tailwind v4's `dark:` variant works automatically via OS preference with no configuration
3. **Scroll-triggered image fading** — `IntersectionObserver` already in the codebase (ScrollReveal.astro, HiawathaExplainer.astro); same pattern extended
4. **Neucadia footer logo** — `<img>` pointing to `https://neucadia.com/assets/neucadia_logo.png` (5.1KB PNG confirmed publicly accessible)

The tempting alternatives — CSS scroll-driven animations (`animation-timeline: view()`), JavaScript-managed dark mode toggles, inline SVG for the external logo — are either not yet baseline or add unnecessary complexity for the requirements as stated.

---

## Recommended Stack (No Changes)

### Core — KEEP AS-IS

| Technology | Installed Version | Relevant Capability | Status |
|------------|------------------|---------------------|--------|
| Astro | 6.1.2 | Component authoring, scoped styles, `<style>` blocks | No change |
| Tailwind CSS | 4.2.2 | `dark:` variant uses `prefers-color-scheme` automatically | No change |
| `@tailwindcss/vite` | 4.2.2 | Tailwind build pipeline | No change |
| TypeScript | 5.9.3 | Astro frontmatter typing | No change |

### Browser APIs in Use — EXTEND, DON'T REPLACE

| API | Current Use | v1.8 Extension |
|-----|------------|----------------|
| `IntersectionObserver` | ScrollReveal.astro (data-reveal), HiawathaExplainer.astro (data-bg-fade) | History section image fade in/out — same pattern, same thresholds |
| `@media (prefers-reduced-motion: reduce)` | global.css, HiawathaExplainer.astro, index.astro | Guard all v1.8 transitions |
| CSS custom properties | @theme static tokens throughout | Light mode color overrides within history section via `@media (prefers-color-scheme: light)` |
| `position: sticky` | Not currently used | New sticky nav — CSS-only, no JS needed |

---

## Feature-by-Feature Stack Decisions

### 1. Sticky Navigation Bar

**Decision: `position: sticky` + `top: 0` in CSS. No JavaScript.**

`position: sticky` is MDN Baseline, 97.21% global support (caniuse.com). It requires no JavaScript, no scroll event listeners, no libraries. The nav sits below the hero and sticks at `top: 0` once the hero scrolls past.

No `-webkit-sticky` prefix needed for current browser targets — unprefixed support covers all major browsers since 2017-2018. The site already targets the same audience bracket.

**Shadow-on-scroll enhancement (optional):** A small `box-shadow` can appear when the nav is stuck to communicate elevation. Two approaches:

- CSS-only via `:stuck` pseudo-class — NOT YET BASELINE (CSS Scrolled State, Chrome 132+ only, no Firefox). Do not use.
- IntersectionObserver sentinel — observe a 1px element just above the nav; when it leaves viewport, add `.is-stuck` class. This is the established pattern and uses the existing IntersectionObserver infrastructure. Zero new dependencies.

**Verdict:** CSS `position: sticky` for the core behavior. IntersectionObserver sentinel for the stuck-shadow enhancement if needed.

---

### 2. History Section Light/Dark Mode

**Decision: Native CSS `@media (prefers-color-scheme: light/dark)` scoped to the history section component. No JavaScript. No Tailwind `dark:` utilities needed.**

The v1.8 requirement is targeted: light/dark mode applies to the **History section only** (HiawathaExplainer.astro), not the whole site. The rest of the site remains dark-only (forest-900 base). This scoped approach is cleaner than toggling a site-wide dark class.

**Why not Tailwind `dark:` utilities:**

Tailwind v4's `dark:` variant is activated automatically by `@media (prefers-color-scheme: dark)` — no configuration needed. However, the existing design system uses `@theme static` CSS custom properties, not Tailwind color utilities, for all color values. HiawathaExplainer.astro already uses `var(--color-forest-950)` CSS variables, not `class="bg-forest-950"` Tailwind utilities. Mixing approaches (Tailwind `dark:` utilities alongside CSS var overrides) would create inconsistency. Use the same CSS-var approach throughout.

**Implementation pattern:**

```css
/* Within HiawathaExplainer.astro <style> block */

.hiawatha-section {
  /* Default (dark) — already existing values */
  --section-bg: var(--color-forest-950);
  --prose-bg: transparent;
  --text-primary: var(--color-cream-100);
  --text-secondary: var(--color-cream-200);
}

@media (prefers-color-scheme: light) {
  .hiawatha-section {
    --section-bg: #f5f0e8;   /* beige/off-white — same as --color-cream-100 */
    --text-primary: var(--color-forest-900);
    --text-secondary: var(--color-forest-800);
  }
}
```

This pattern is already proven in the codebase: `global.css` uses the same approach for `prefers-reduced-motion`. Scoped to `.hiawatha-section`, it doesn't touch the rest of the page.

**Confidence: HIGH.** `prefers-color-scheme` is MDN Baseline Widely Available since January 2020. CSS-only, zero JavaScript, zero dependencies.

---

### 3. Scroll-Triggered Image Fading (History Section)

**Decision: `IntersectionObserver` with CSS opacity transitions. Same pattern as `data-bg-fade` in HiawathaExplainer.astro. No new libraries.**

The existing `data-bg-fade` mechanism in HiawathaExplainer already does exactly this: observes subsections, toggles a `bg-visible` class, CSS handles the opacity transition. The v1.8 requirement ("faded desaturated inspiration images with scroll-triggered fade in/out") is an extension of this pattern to the `<figure class="museum-plate">` elements.

The key distinction from `ScrollReveal.astro` (data-reveal): ScrollReveal fires once and unobserves (fade in, stay visible). The history section requirement says "fade in/out" — images fade as they enter/leave viewport. This matches the `data-bg-fade` pattern exactly (no `obs.unobserve()`, persistent observation).

**Implementation:**

```javascript
// Same JS pattern as existing data-bg-fade, applied to museum-plate figures
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    entry.target.classList.toggle('is-visible', entry.isIntersecting);
  });
}, { threshold: 0.15 });

document.querySelectorAll('.museum-plate[data-fade]').forEach(el => observer.observe(el));
```

```css
.museum-plate[data-fade] {
  opacity: 0;
  transition: opacity 0.6s ease;
}
.museum-plate[data-fade].is-visible {
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .museum-plate[data-fade] {
    opacity: 1;
    transition: none;
  }
}
```

**Why not CSS scroll-driven animations (`animation-timeline: view()`):**

MDN explicitly marks `animation-timeline` as "Limited availability — not Baseline because it does not work in some of the most widely-used browsers." As of April 2026, Firefox does not support it. This site has no analytics data to justify excluding Firefox users. The IntersectionObserver pattern works in all browsers the site already supports.

---

### 4. "Powered by Neucadia" Footer

**Decision: `<img>` tag pointing to `https://neucadia.com/assets/neucadia_logo.png`. No inline SVG. No new dependencies.**

The Neucadia logo exists at `https://neucadia.com/assets/neucadia_logo.png` (5.1KB PNG, confirmed accessible). An external `<img>` is the correct approach for a third-party brand logo:

- No build-time SVG fetch/embedding needed
- Neucadia controls their own logo appearance — an `<img>` picks up any future brand updates automatically
- No CORS issues for a `<img src>` load
- `loading="lazy"` keeps it off the critical path (footer, below fold)

**Why not inline SVG fetched from neucadia.com at build time:** The logo is a PNG, not an SVG. Even if an SVG existed, embedding third-party SVG inline risks their symbol IDs conflicting with the site's own `<defs>` (the shield motif symbol is already defined in BaseLayout.astro). Inline embedding also couples the build to an external URL — a network failure during `astro build` would break the build.

**Image inversion for light mode:** The PNG logo is dark on transparent (assumption — typical for brand logos). In the history section light mode, inversion may be needed. CSS `filter: invert(1)` or a `@media (prefers-color-scheme: light)` filter rule handles this without needing a second logo asset. Confirm logo colors after first implementation.

**Markup pattern:**

```html
<footer class="neucadia-footer">
  <a href="https://neucadia.com" rel="noopener noreferrer" target="_blank">
    <img
      src="https://neucadia.com/assets/neucadia_logo.png"
      alt="Neucadia"
      width="120"
      height="auto"
      loading="lazy"
      decoding="async"
    />
  </a>
</footer>
```

---

## Tailwind v4 Dark Mode: What Works, What Doesn't

The project uses `@theme static` — CSS custom properties compiled to static `:root` values. This is **orthogonal** to Tailwind's dark mode variant.

| Approach | Works with this project? | Verdict |
|----------|--------------------------|---------|
| `dark:bg-forest-950` Tailwind utility | YES — `dark:` variant works automatically with OS preference | Not used; project uses CSS vars not utility classes |
| `@media (prefers-color-scheme: dark)` in CSS | YES — always works | Use this directly |
| `@custom-variant dark` override | Not needed — no manual toggle required | Skip |
| `color-scheme: dark light` meta | Useful for browser chrome (scrollbar, form inputs) | Optional enhancement |

**Recommendation:** Use raw `@media (prefers-color-scheme: light)` directly in the component's `<style>` block. This is consistent with the existing codebase pattern and requires no Tailwind-specific configuration.

---

## What NOT to Add

| Library/Tool | Why People Suggest It | Why NOT for This Project |
|--------------|----------------------|--------------------------|
| **next-themes / color-mode** | User-controlled dark mode toggle | Requirement is OS-preference only (prefers-color-scheme). No toggle UI specified. These libraries add a JS runtime bundle for a feature that CSS handles natively. |
| **CSS scroll-driven animations** (`animation-timeline`) | Modern no-JS scroll effects | Not Baseline. Firefox does not support it. IntersectionObserver achieves the same effect with wider support. |
| **headless-ui / radix-ui** | Accessible nav bar components | A 4-link nav bar does not need an accessible component library. Four `<a>` tags with `aria-current` is the correct pattern. |
| **@astrojs/react or similar** | Framework for nav/footer components | The site's established pattern is Astro components + vanilla JS. No framework island needed for static nav links. |
| **CSS `:stuck` pseudo-class** | Nav shadow when sticky | Chrome 132+ only. No Firefox support. Use IntersectionObserver sentinel instead. |
| **motion / framer-motion** | Animation library for fades | IntersectionObserver + CSS `transition` already handles fades. Site already uses this pattern in two existing components. |
| **Intersection Observer polyfill** | IE 11 support | IE 11 < 1% global usage. The site does not target IE. Not needed. |
| **astro-icon** | Icon library for nav icons | Nav links are text-only (History, Route, Gallery, Sectors). No icon library needed. |

---

## Version Verification

All versions verified against installed `node_modules/*/package.json` on 2026-04-07:

| Package | Installed Version | v1.8 Status |
|---------|------------------|-------------|
| astro | 6.1.2 | No change needed |
| tailwindcss | 4.2.2 | `dark:` variant works automatically — no config change |
| @tailwindcss/vite | 4.2.2 | No change needed |
| typescript | 5.9.3 | No change needed |

**No version bumps required for v1.8.**

---

## Installation

```bash
# Nothing to install. All v1.8 features use existing stack + native browser APIs.
```

---

## Sources

### HIGH Confidence (Official Documentation, MDN Baseline)

- [Tailwind CSS v4 Dark Mode docs](https://tailwindcss.com/docs/dark-mode) — `dark:` variant uses `prefers-color-scheme` automatically; `@custom-variant dark` only needed for manual class toggle
- [MDN: prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) — Baseline Widely Available since January 2020; CSS-only, no JS
- [MDN: animation-timeline (scroll-driven)](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline) — "Limited availability" warning; not Baseline; Firefox unsupported as of April 2026
- [caniuse: position sticky](https://caniuse.com/css-sticky) — 97.21% global support, Baseline March 2022
- Codebase analysis 2026-04-07: HiawathaExplainer.astro (data-bg-fade pattern, IntersectionObserver toggle via bg-visible class), ScrollReveal.astro (data-reveal once-fire pattern), global.css (prefers-reduced-motion guards, @theme static token structure), BaseLayout.astro (shield symbol defs, no dark mode)

### MEDIUM Confidence (WebFetch confirmed, single official source)

- `https://neucadia.com/assets/neucadia_logo.png` — PNG logo confirmed accessible (5.1KB, successful HTTP fetch 2026-04-07). Path discovered via WebFetch of neucadia.com homepage HTML.

---

## Summary for Roadmap

All four v1.8 features are CSS/HTML work, no new dependencies:

1. **Sticky nav** — New Astro component, CSS `position: sticky`, optional IntersectionObserver sentinel for stuck-shadow
2. **Ethos explainer** — New Astro component, static HTML + existing CSS patterns (no dark mode needed here)
3. **Light/dark history** — `@media (prefers-color-scheme: light)` block added to HiawathaExplainer.astro's existing `<style>`, CSS var overrides for section background and text
4. **Image fading** — `data-fade` attribute + IntersectionObserver extension within HiawathaExplainer.astro, same toggle pattern as existing `data-bg-fade`
5. **Neucadia footer** — New Astro component or inline in index.astro, `<img>` tag pointing to external PNG

No pipeline changes. No build tool changes. No dependency additions. The implementation sequence is order-independent — each feature is isolated to its component.

---

*Stack research for: Hiawatha's Revenge v1.8 — Navigation & Identity*
*Researched: 2026-04-07*
*Previous: v1.5 stack research (2026-04-06) — multi-route support milestone*
