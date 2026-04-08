# Phase 45: Sticky Nav - Research

**Researched:** 2026-04-07
**Domain:** CSS sticky positioning, IntersectionObserver, active-section scroll-spy
**Confidence:** HIGH

---

## Summary

Phase 45 adds a sticky navigation bar with four links (History, Route, Gallery, Sectors) that persists as the user scrolls. The implementation requires: (1) CSS `position: sticky` for the nav element itself, (2) anchor IDs on four target sections, (3) `scroll-margin-top` on anchor targets to prevent the sticky bar from obscuring headings, (4) an IntersectionObserver-based scroll-spy for active link highlighting, and (5) a "stuck" visual change (shadow/background shift) once the nav has passed the hero.

The standard approach for this project is **no external library**—everything is vanilla CSS + vanilla JS inside an Astro component, consistent with how ScrollReveal and HiawathaExplainer already work. The only subtlety is the "stuck" detection: the cleanest technique uses `top: -1px` on the sticky element paired with an IntersectionObserver at `threshold: [1]`, which fires when the element is no longer 100% in-viewport (i.e., it has become stuck).

**Primary recommendation:** Build a new `StickyNav.astro` component with scoped CSS (`position: sticky; top: -1px`) and a single `<script>` block that handles both "stuck" class toggling and scroll-spy active-link updates via two IntersectionObservers.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla CSS (position: sticky) | N/A | Sticky positioning | Zero-dependency, GPU-composited, widely supported |
| IntersectionObserver API | Browser native | Sticky detection + scroll-spy | No scroll event listeners; performant; already used in project (ScrollReveal, HiawathaExplainer) |
| scroll-margin-top | CSS property | Offset anchor targets so heading is below nav | Baseline Widely Available since April 2021; one-line solution |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| astro-navbar | ~3.x | Headless Astro nav with sticky wrapper | Would add a dep; not needed for this simple case |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| top: -1px sentinel trick | Separate sentinel div approach (Chrome blog) | Sentinel divs require extra DOM nodes and more observer setup; the -1px trick is simpler for a single nav bar |
| scroll-margin-top | padding-top + negative margin-top hack | Old workaround predating CSS property; avoid |
| scroll-margin-top | scroll-padding-top on html element | Works but applies globally; scroll-margin-top on each section is more explicit and doesn't affect unrelated scroll containers |
| Two IntersectionObservers | Single scroll event listener | Scroll events are synchronous/expensive; IntersectionObserver is already the project idiom |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   └── StickyNav.astro      # New component — nav bar, scoped CSS, script
├── pages/
│   └── index.astro          # Add StickyNav after <HeroSection />, add section IDs
```

### Pattern 1: sticky + top:-1px for stuck detection

**What:** Set `top: -1px` on the sticky element (instead of `top: 0`). Create an IntersectionObserver with `threshold: [1]` watching the nav element. When `intersectionRatio < 1`, the element has slid 1px off-screen top—meaning it is now stuck. Toggle a `.is-stuck` class.

**When to use:** Whenever you need a visual change on the nav the moment it transitions from flowing to stuck. Works regardless of scroll direction.

**Example:**
```javascript
// Source: https://davidwalsh.name/detect-sticky
const nav = document.querySelector('.sticky-nav');
const observer = new IntersectionObserver(
  ([e]) => e.target.classList.toggle('is-stuck', e.intersectionRatio < 1),
  { threshold: [1] }
);
observer.observe(nav);
```

**CSS counterpart:**
```css
.sticky-nav {
  position: sticky;
  top: -1px;          /* must be -1px not 0 for the trick to work */
}
.sticky-nav.is-stuck {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  background-color: var(--color-forest-950);
}
```

**Caveat:** Because `top: -1px`, the nav bar will overlap its content by 1px while NOT stuck. This is visually imperceptible but must be verified. Alternative: add a 1px spacer above the nav, or accept the 1px. In practice this is standard and unnoticeable.

### Pattern 2: IntersectionObserver scroll-spy with rootMargin

**What:** Observe each of the four anchor sections. Use `rootMargin: '-NAVHEIGHTpx 0px 0px 0px'` so the observer treats the top of the viewport as starting just below the sticky nav. When a section enters this adjusted viewport, mark its nav link active.

**When to use:** Active link highlighting as user scrolls through sections.

**Two-observer strategies:**

**Strategy A — observe headings, mark when they pass top of viewport:**
```javascript
// rootMargin shifts the top boundary down by nav height
// so sections are considered "entered" only when visible below the nav
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActive(entry.target.id);
      }
    });
  },
  {
    rootMargin: `-${NAV_HEIGHT}px 0px -70% 0px`,
    threshold: 0
  }
);
```

The `-70%` on the bottom pushes the bottom boundary up, creating a narrow "active zone" near the top of the viewport. This prevents the next section from activating before the current one is mostly scrolled past.

**Strategy B — track last-intersected heading (simpler, good for single-page):**
```javascript
let currentActive = null;
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        currentActive = entry.target.id;
        updateNavLinks(currentActive);
      }
    });
  },
  { rootMargin: `0px 0px -90% 0px`, threshold: 0 }
);
```

**Recommendation:** Use Strategy A with `rootMargin: \`-${navHeight}px 0px -60% 0px\`` for this project. It's the most reliable pattern for a page where sections are tall and nav height is known at runtime.

### Pattern 3: scroll-margin-top for anchor offset

**What:** Apply `scroll-margin-top` to each `<section>` that is an anchor target. When a user clicks a nav link (`href="#history"`) the browser's native scroll-to-anchor respects this offset, landing the view so the section heading is below the nav bar.

**Example:**
```css
/* On each anchor target section */
#history,
#route,
#gallery,
#sectors {
  scroll-margin-top: 52px; /* equal to nav bar height */
}
```

Or use a CSS custom property for maintainability:
```css
:root {
  --nav-height: 52px;
}
#history, #route, #gallery, #sectors {
  scroll-margin-top: var(--nav-height);
}
```

CSS custom properties work as values for `scroll-margin-top` in all browsers that support the property (Chrome 69+, Firefox 68+, Safari 14.1+, Edge 79+). Baseline Widely Available since April 2021.

### Pattern 4: Section ID placement — wrapper section vs inner heading

**What:** The nav links target `#history`, `#route`, `#gallery`, `#sectors`. These IDs should go on the outermost `<section>` element of each major page section, NOT on the `<h2>` inside it. Reason: `scroll-margin-top` on the section ensures the heading clears the nav bar, and IntersectionObserver on sections is more reliable than observing headings.

**Current state of IDs in the codebase:**

| Nav target | Current state | What needs to happen |
|-----------|---------------|---------------------|
| `#history` | Missing | Add `id="history"` to `<HiawathaExplainer />` wrapper section OR add a wrapper `<section id="history">` in index.astro around it |
| `#route` | `id="route"` already exists on `<section>` in index.astro (line 66) | Already done — wraps RouteMap |
| `#gallery` | Missing | Add `id="gallery"` to the Photos `<section>` in index.astro (line 82) |
| `#sectors` | Missing | Add `id="sectors"` to `<RouteExplainer />` wrapper section OR wrap it in index.astro |

**How to add IDs to component-owned sections:** Two options:
1. Add the `id` prop directly on the `<section>` inside the component (requires editing the component).
2. Wrap the `<ComponentName />` in a `<section id="history">` in index.astro (cleaner separation, but adds DOM nesting).

**Recommendation:** Option 1 — add `id` prop to each component's own `<section>` tag. HiawathaExplainer owns its section, RouteExplainer owns its section. Adding the ID there is clean and keeps the component self-describing. The `<section id="route">` in index.astro is already this pattern and should remain.

### Pattern 5: Mobile inline nav (no hamburger, 375px)

**What:** The requirement states all four links must be visible inline at 375px width with no hamburger. At 375px, four nav links must fit horizontally.

**Layout strategy:**
- Use `display: flex; gap: 0.5rem; justify-content: center;` on the nav link list.
- Text: short labels (History, Route, Gallery, Sectors) — test at 375px.
- At 375px container with ~16px side padding, usable width is 343px. Four items at ~85px each = 340px. Tight but feasible with `font-size: 0.75rem` and compact padding.
- `white-space: nowrap` on each link prevents wrapping.
- `overflow-x: auto` on the nav bar as a safety valve if fonts scale up, but keep links visible at default settings.

**Recommendation:** Use `flex-wrap: nowrap; overflow-x: auto` on the link container. Test at 375px in DevTools early to validate font size choice.

### Anti-Patterns to Avoid

- **Scroll event listener for active state:** Expensive, fires synchronously on every scroll tick. IntersectionObserver is already the project pattern.
- **Using `position: fixed` instead of `position: sticky`:** Fixed takes nav out of document flow and requires manually compensating layout (padding-top on body). Sticky is simpler and works with the existing flow.
- **Observing `<h2>` elements instead of `<section>` elements:** Headings may be inside nested grid components. The section itself is the logical unit.
- **Hard-coding nav height in rootMargin:** Nav height may differ on small screens if font size or padding scales. Prefer reading height at runtime: `const navHeight = nav.offsetHeight`.
- **`scroll-padding-top` on `html` element instead of `scroll-margin-top` on sections:** Global scroll-padding-top affects all scroll snap containers and anchor links site-wide. scroll-margin-top is section-specific and more precise.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Detecting stuck state | Custom sentinel divs | `top: -1px` + IntersectionObserver `threshold: [1]` | Simpler, fewer DOM nodes, same result |
| Scroll-spy math | scroll event + getBoundingClientRect calculations | IntersectionObserver with `rootMargin` | Project already uses IO; no scroll event overhead |
| Anchor offset | JS-based `scrollTo()` with calculated offset | `scroll-margin-top` CSS property | Browser native, zero JS, keyboard navigation works too |

**Key insight:** All three sub-problems (sticky detection, active-link highlighting, anchor offset) have native CSS/browser API solutions that require minimal code. The entire implementation should fit in one Astro component with <50 lines of CSS and <60 lines of JS.

---

## Common Pitfalls

### Pitfall 1: top:0 prevents stuck detection

**What goes wrong:** Setting `top: 0` on the sticky nav means the element is never at all "outside" the viewport—its intersection ratio is always 1.0. The `intersectionRatio < 1` trick never fires. Nav never gets `is-stuck` class.

**Why it happens:** The `top: -1px` sentinel approach requires the element to straddle the top edge of the viewport by exactly 1px when stuck.

**How to avoid:** Always use `top: -1px` (not `top: 0`) when using this detection technique. Add a comment in the CSS: `/* -1px enables stuck detection via IntersectionObserver */`.

**Warning signs:** `.is-stuck` class never appears in DevTools as you scroll.

### Pitfall 2: IntersectionObserver rootMargin not accounting for nav height

**What goes wrong:** Section active states update as soon as the section's top edge crosses the viewport top—but the actual visible area starts below the sticky nav. Result: the active link updates too early (one section ahead of what the user is looking at).

**Why it happens:** Without negative top rootMargin, the intersection root includes the area behind the nav bar.

**How to avoid:** Set `rootMargin: \`-${navHeight}px 0px 0px 0px\`` where `navHeight = nav.getBoundingClientRect().height`.

### Pitfall 3: Section IDs in components require `id` on `<section>`, not on a child div

**What goes wrong:** Adding `id="history"` on a `<div>` inside the HiawathaExplainer component means `scroll-margin-top` applies to the div, not the section. The section's padding may still hide behind the nav bar on jump.

**Why it happens:** `scroll-margin-top` must be on the element that is the scroll target.

**How to avoid:** Put `id` on the outermost `<section>` element in the component.

### Pitfall 4: Active link highlighting at page top / bottom edge cases

**What goes wrong:** When the page first loads (no scrolling), no section has "intersected" so no link is active. When the user is near the bottom and the last section is in view, the rootMargin `bottom: -60%` may exclude it.

**Why it happens:** IntersectionObserver only fires on change. If no section has ever entered the adjusted viewport, the observer callback never ran.

**How to avoid:** 
1. On page load, set the first nav link as active by default.
2. For the last section, consider reducing the bottom rootMargin (e.g., `-30%`) or using a separate "last section" observer.

### Pitfall 5: `scroll-margin-top` ignored on Chromium for inline elements

**What goes wrong:** If `id` is placed on an inline element (span, a) rather than a block element, some browsers may not apply `scroll-margin-top` reliably.

**How to avoid:** Only put anchor IDs on block-level elements (`<section>`, `<div>`). In this project, all targets are `<section>` elements.

### Pitfall 6: Z-index stacking with Leaflet map

**What goes wrong:** The RouteMap uses Leaflet, which sets internal z-index values (400, 500, 600, etc.) on its pane divs. The sticky nav must have a z-index higher than any Leaflet layer it could overlap.

**How to avoid:** Set `z-index: 1000` on the sticky nav. Leaflet's map container default z-index is `auto` but tiles go up to `z-index: 200`. Sticky nav at `z-index: 1000` is safe.

---

## Code Examples

### Minimal complete StickyNav implementation pattern

```astro
---
// StickyNav.astro
// NAV-01 through NAV-06
---

<nav class="sticky-nav" aria-label="Page navigation">
  <ul class="nav-links">
    <li><a href="#history" class="nav-link">History</a></li>
    <li><a href="#route" class="nav-link">Route</a></li>
    <li><a href="#gallery" class="nav-link">Gallery</a></li>
    <li><a href="#sectors" class="nav-link">Sectors</a></li>
  </ul>
</nav>

<style>
  .sticky-nav {
    position: sticky;
    top: -1px;          /* -1px enables stuck detection */
    z-index: 1000;
    background-color: var(--color-forest-900);
    border-bottom: 1px solid var(--color-forest-700);
    transition: background-color 0.2s, box-shadow 0.2s;
  }

  /* NAV-05: visual change when stuck */
  .sticky-nav.is-stuck {
    background-color: var(--color-forest-950);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }

  .nav-links {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    list-style: none;
    margin: 0;
    padding: 0.625rem 1rem;
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .nav-link {
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-cream-200);
    text-decoration: none;
    padding: 0.375rem 0.5rem;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
  }

  /* NAV-06: active link */
  .nav-link.is-active,
  .nav-link:hover {
    color: var(--color-amber-500);
    border-bottom-color: var(--color-amber-500);
  }

  @media (prefers-reduced-motion: reduce) {
    .sticky-nav,
    .nav-link {
      transition: none;
    }
  }
</style>

<script>
  const nav = document.querySelector('.sticky-nav') as HTMLElement | null;
  if (!nav) throw new Error('StickyNav: nav element not found');

  // NAV-05: Detect stuck state via top:-1px sentinel trick
  // Source: https://davidwalsh.name/detect-sticky
  const stuckObserver = new IntersectionObserver(
    ([e]) => e.target.classList.toggle('is-stuck', e.intersectionRatio < 1),
    { threshold: [1] }
  );
  stuckObserver.observe(nav);

  // NAV-06: Active section scroll-spy
  const NAV_HEIGHT = nav.offsetHeight;
  const SECTIONS = ['history', 'route', 'gallery', 'sectors'];
  const links = SECTIONS.reduce<Record<string, Element | null>>((acc, id) => {
    acc[id] = nav.querySelector(`a[href="#${id}"]`);
    return acc;
  }, {});

  function setActive(id: string) {
    SECTIONS.forEach(s => links[s]?.classList.toggle('is-active', s === id));
  }

  // Default: first section active on load
  setActive('history');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    {
      rootMargin: `-${NAV_HEIGHT + 1}px 0px -60% 0px`,
      threshold: 0
    }
  );

  SECTIONS.forEach(id => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });
</script>
```

### scroll-margin-top applied to anchor sections

```css
/* Applied to each anchor target section */
/* Source: https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin-top */
#history,
#route,
#gallery,
#sectors {
  scroll-margin-top: var(--nav-height, 48px);
}
```

Define `--nav-height` in global.css `@theme static` or as a fallback value. Alternative: use a fixed pixel value matching the nav bar height (e.g., `52px`).

### Where to insert StickyNav in index.astro

```astro
<BaseLayout ...>
  <HeroSection />
  <StickyNav />         {/* ← placed immediately after hero, before all other sections */}
  ...remaining sections...
</BaseLayout>
```

The nav will be in document flow directly after the hero. Because it is `position: sticky`, it will first scroll with the page until it reaches the viewport top, then stick.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `window.onscroll` + `getBoundingClientRect()` | IntersectionObserver API | ~2018 broad support | No synchronous scroll listeners; GPU-efficient |
| `padding-top` hack for anchor offset | `scroll-margin-top` CSS property | April 2021 (Baseline Widely Available) | One-line fix, works with keyboard navigation too |
| `position: fixed` + manual body padding | `position: sticky` | ~2017 broad support | Element stays in document flow; no manual offset |
| Separate sentinel div for stuck detection | `top: -1px` + threshold:[1] trick | ~2020 blog posts | Fewer DOM nodes, same result |

**Deprecated/outdated:**
- `scroll-padding-top` on `html`: Use `scroll-margin-top` on each target section instead.
- jQuery `$(window).scroll()`: Project uses no jQuery; avoid.
- `offsetTop` scroll math: IntersectionObserver replaces this entirely.

---

## Open Questions

1. **Nav height at 375px mobile**
   - What we know: Nav will contain four short text links. Padding + font size determines height.
   - What's unclear: Whether the planned font size (0.75rem) and padding (0.625rem) produce ≤48px height, which matters for `scroll-margin-top` accuracy.
   - Recommendation: Build the component first, measure `nav.offsetHeight` in DevTools at 375px, then set `--nav-height` to that value. The scroll-spy already reads `nav.offsetHeight` at runtime so it self-adjusts.

2. **History section anchor placement**
   - What we know: HiawathaExplainer has its own `<section class="hiawatha-section">`.
   - What's unclear: Whether to add `id="history"` inside HiawathaExplainer's own section tag or wrap it in index.astro with a `<section id="history">`.
   - Recommendation: Edit HiawathaExplainer to accept an optional `id` prop and apply it to its `<section>`. This is cleaner than adding wrapper divs in index.astro and consistent with how other sections work.

3. **Sectors anchor placement**
   - What we know: RouteExplainer.astro has its own `<section class="route-explainer-section">`.
   - What's unclear: Same question as History—prop or wrapper.
   - Recommendation: Same approach—add optional `id` prop to RouteExplainer.

---

## Sources

### Primary (HIGH confidence)
- https://davidwalsh.name/detect-sticky — `top: -1px` + `threshold: [1]` pattern for detecting sticky state
- https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin-top — Baseline Widely Available, valid values, CSS custom property usage
- https://developer.chrome.com/docs/css-ui/sticky-headers — sentinel pattern detail (alternative approach, not recommended here)

### Secondary (MEDIUM confidence)
- https://css-tricks.com/table-of-contents-with-intersectionobserver/ — rootMargin pattern for scroll-spy with fixed header offset
- https://css-tricks.com/fixed-headers-and-jump-links-the-solution-is-scroll-margin-top/ — scroll-margin-top as canonical solution
- https://gomakethings.com/how-to-prevent-anchor-links-from-scrolling-behind-a-sticky-header-with-one-line-of-css/ — practical application

### Tertiary (LOW confidence)
- https://taylor.callsen.me/modern-navigation-menus-with-css-position-sticky-and-intersectionobservers/ — general IntersectionObserver navigation pattern
- WebSearch results confirming IntersectionObserver as ecosystem standard for scroll-spy (2025)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all techniques are browser-native, no external libraries needed
- Architecture: HIGH — component placement, ID locations, and script structure are clearly defined by codebase inspection
- Pitfalls: HIGH — all pitfalls verified against MDN, Chrome docs, or codebase analysis
- Code examples: MEDIUM — patterns are verified from authoritative sources; exact pixel values (nav height) will be confirmed at build time

**Research date:** 2026-04-07
**Valid until:** 2026-10-07 (stable browser APIs; no expiry concern)
