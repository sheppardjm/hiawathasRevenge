# Phase 22: Animation & Polish - Research

**Researched:** 2026-04-01
**Domain:** IntersectionObserver scroll-driven reveals, CSS animation performance, prefers-reduced-motion, Lighthouse performance budgets
**Confidence:** HIGH

## Summary

Phase 22 adds scroll-driven section reveals and staggered card animations using IntersectionObserver — the same primitive already powering AnimatedDivider. The codebase provides a working, production-proven reference: `AnimatedDivider.astro` (threshold 0.3, one-shot disconnect, CSS `is-visible` class toggle, `prefers-reduced-motion` handled in both CSS and JS). Phase 22 reuses this exact pattern at a larger scale, applied to `<section>` elements and `.segment-card` children.

The only new JavaScript needed is a single inline `<script>` block in a new `ScrollReveal.astro` component (or equivalent), using `querySelectorAll` on a CSS class to wire observers to every reveal target. No npm packages required. All animations must use `opacity` and `transform: translateY()` exclusively — these are compositor-only properties that run off the main thread and never trigger layout or paint.

The performance budget (3MB transfer, LCP under 2.5s on simulated 4G) is the real constraint to audit. The current initial-load transfer size is approximately 1.2MB (hero 625KB + JS 472KB + CSS 51KB + fonts 88KB), well under budget. The full-session transfer (all lazy thumbnails loaded: +3MB) would exceed 3MB total, but Lighthouse's "total byte weight" audit counts all resources fetched during the session. The hero image (625KB uncompressed JPEG) is the primary LCP risk — it already has `fetchpriority="high"` and `loading="eager"`, which is correct. No above-fold animations should fire, and the hero must not acquire a CSS `opacity: 0` initial state that could delay its paint.

**Primary recommendation:** Implement scroll reveals as a single shared IntersectionObserver pattern, modeled directly on AnimatedDivider's existing implementation. Wire it from one Astro component using `querySelectorAll('[data-reveal]')`. Above-fold guard: check `entry.boundingClientRect.top < window.innerHeight` and skip animation setup for elements already in view on load.

---

## Standard Stack

No new libraries. This phase uses what the project already has.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `IntersectionObserver` | Web Platform API (Baseline 2019+) | Detect when sections enter viewport | Already used in AnimatedDivider; zero cost |
| CSS `opacity` + `transform` | Web Platform | Fade-in / slide-up animation | Compositor-only: never triggers layout/paint |
| `@media (prefers-reduced-motion: reduce)` | Web Platform (Baseline 2020+) | Disable all motion for accessibility | Already pattern in AnimatedDivider and global.css |
| `window.matchMedia("(prefers-reduced-motion: reduce)")` | Web Platform | JS-side reduced-motion gate | Skip observer setup entirely when motion is reduced |
| Astro `<script>` inline block | Astro 6 | Package the IO logic into a component | Same pattern as AnimatedDivider — compiles to inline `<script type="module">` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `IntersectionObserver` + class toggle | CSS `animation-timeline: view()` | Deferred to v1.3 per project decision — Firefox does not support it yet |
| Custom IntersectionObserver | GSAP ScrollTrigger | New npm dependency — explicitly out of scope |
| Per-component observers | Single shared observer for all reveal targets | Single observer with `querySelectorAll('[data-reveal]')` is simpler and avoids duplicate registrations |

**Installation:** None required.

---

## Architecture Patterns

### Pattern 1: The AnimatedDivider Reference Implementation

The existing AnimatedDivider is the proven model for this phase. Its compiled form in `dist/index.html`:

```javascript
// Source: src/components/AnimatedDivider.astro <script> block (compiled)
document.querySelectorAll(".animated-divider").forEach(e => {
  const s = new IntersectionObserver(r => {
    r[0].isIntersecting && (e.classList.add("is-visible"), s.disconnect())
  }, { threshold: 0.3 });
  s.observe(e);
});
```

Key decisions already established:
- `threshold: 0.3` — fires when 30% of element is visible
- `s.disconnect()` — one-shot: stops observing after first trigger
- Class toggle (`is-visible`) — CSS handles the actual animation
- CSS transition on the class — `transition: opacity 0.6s, transform 0.6s`

### Pattern 2: Section Reveal — CSS + JS Structure

Apply the same pattern to all major `<section>` elements. CSS initial state is invisible; observer adds the visible class.

```css
/* Source: AnimatedDivider pattern, extended for sections */
/* Initial state — hidden */
[data-reveal] {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Visible state — triggered by JS class add */
[data-reveal].is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Reduced motion: show statically, no transition */
@media (prefers-reduced-motion: reduce) {
  [data-reveal] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

```javascript
// Source: established IntersectionObserver + matchMedia pattern (MDN)
// Skip all setup if user prefers reduced motion
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll("[data-reveal]").forEach(el => {
    // Above-fold guard: skip elements already in view at load time
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) {
        el.classList.add("is-visible");
        obs.unobserve(el);
      }
    }, { threshold: 0.15 });
    observer.observe(el);
  });
} else {
  // Ensure all reveal targets are visible when motion is reduced
  document.querySelectorAll("[data-reveal]").forEach(el => {
    el.classList.add("is-visible");
  });
}
```

### Pattern 3: Staggered Child Reveals (Segment Cards)

For the `RouteExplainer` segment cards (ANI-02), stagger is applied with CSS `transition-delay` set via inline style or `nth-child` CSS:

```css
/* Stagger via nth-child — pure CSS, no JS required */
[data-reveal-stagger] > *:nth-child(1) { transition-delay: 0ms; }
[data-reveal-stagger] > *:nth-child(2) { transition-delay: 100ms; }
[data-reveal-stagger] > *:nth-child(3) { transition-delay: 200ms; }
/* ... up to 7 segment cards */
[data-reveal-stagger] > *:nth-child(7) { transition-delay: 600ms; }

/* Reset delays under reduced motion */
@media (prefers-reduced-motion: reduce) {
  [data-reveal-stagger] > * { transition-delay: 0ms; }
}
```

Alternative: set `transition-delay` inline via `data-*` attributes and JavaScript:

```javascript
// JS-driven stagger — more flexible
container.querySelectorAll(".segment-card").forEach((card, i) => {
  card.style.setProperty("transition-delay", `${i * 100}ms`);
});
```

The CSS `nth-child` approach is preferred — zero JS, works at build time, matches the static site philosophy.

### Pattern 4: Above-the-Fold Guard

Critical for ANI-04: the hero and first-visible content must not animate in. Two approaches:

**Approach A (JS guard in observer setup):**
```javascript
// Check if element is already in viewport before observing
if (el.getBoundingClientRect().top < window.innerHeight) {
  el.classList.add("is-visible"); // Show immediately, no animation
  return; // Don't set up observer
}
```

**Approach B (CSS only — no above-fold selectors):**
Simply don't add `data-reveal` to `HeroSection` and the first `DonateCallout` section. Only sections that are genuinely below-fold get the reveal attribute.

**Approach B is preferred** — simpler, zero JavaScript for the guard case, and aligns with the Astro static-site philosophy. The planner should specify which sections get `data-reveal` attributes, explicitly excluding HeroSection and the opening DonateCallout.

### Pattern 5: Reduced-Motion Handling

Two layers required (matching AnimatedDivider's approach):

**Layer 1: CSS** — Initial state should be visible in reduced-motion context:
```css
@media (prefers-reduced-motion: reduce) {
  [data-reveal] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

**Layer 2: JavaScript** — Skip observer setup entirely:
```javascript
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  // Make all reveal targets visible immediately — don't observe
  document.querySelectorAll("[data-reveal]").forEach(el => el.classList.add("is-visible"));
  return; // Exit script entirely
}
// ... observer setup only runs for users who don't prefer reduced motion
```

The CSS layer alone is sufficient for correctness (elements show statically), but the JS layer also prevents unnecessary IntersectionObserver setup, which is clean practice.

### Pattern 6: Single Component vs. Distributed Scripts

Two implementation options:

**Option A: Single `ScrollReveal.astro` component** — A component with no visible HTML (empty template), only a `<style>` and `<script>` block. Imported once in `BaseLayout.astro` or at the bottom of `index.astro`. Adds the global reveal CSS and observer setup.

**Option B: Distributed** — Add `data-reveal` attributes in existing components + add the CSS to `global.css` + add the observer script to `BaseLayout.astro`.

**Option A is preferred** — encapsulates all reveal logic in one file, easy to find/modify, doesn't scatter changes across multiple files. It can be imported in `index.astro` (not BaseLayout, since reveal behavior is page-specific).

### Anti-Patterns to Avoid

- **Applying `opacity: 0` to HeroSection or above-fold content:** This delays the LCP element render, directly hurting Lighthouse LCP score. Never add `data-reveal` to the hero.
- **Animating `margin`, `top`, `left`, `height`, or `width`:** These trigger layout recalculation (reflow) on every frame, causing jank. Only `transform` and `opacity` are compositor-safe.
- **Creating a new IntersectionObserver per element:** While acceptable, a single shared observer with `querySelectorAll` is more efficient. AnimatedDivider creates one per instance because it's a self-contained component — for sections, a shared approach is cleaner.
- **Not disconnecting after first trigger:** Without `obs.unobserve(el)`, the callback fires again if the user scrolls back up past the element and then back down. For one-shot reveals, always unobserve.
- **Using `will-change: transform` globally:** The `will-change` property forces GPU layer promotion for every element it's applied to. Applied to many elements simultaneously, it consumes GPU memory and can hurt performance. Only apply to actively-animating elements, and remove after animation completes. For simple section reveals, skip `will-change` entirely.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll detection | Custom `scroll` event listener | `IntersectionObserver` | Scroll listeners fire on every frame (60/s), IO is event-driven and async — much cheaper |
| Animation timing | `setTimeout` / `requestAnimationFrame` cascade | CSS `transition-delay` with `nth-child` | Pure CSS, compositor-handled, zero JS cost |
| Reduced-motion detection | Custom preference storage | `window.matchMedia("(prefers-reduced-motion: reduce)")` | Native OS preference; updates live if user changes setting |
| Performance profiling | Console.time measurements | Lighthouse CLI or DevTools Performance tab | Standardized, reproducible, measures what matters (LCP) |

---

## Common Pitfalls

### Pitfall 1: Invisible Hero Delays LCP
**What goes wrong:** Developer adds `[data-reveal]` to the `HeroSection` component or its parent `<section>`, causing `opacity: 0` to be the initial state of the LCP image. Even with `fetchpriority="high"`, the image cannot paint until the opacity transition fires (after observer callback).
**Why it happens:** It's tempting to animate everything, including the first section.
**How to avoid:** Explicitly list which sections get `data-reveal` in the plan. HeroSection, the opening DonateCallout, and FloralDivider must NOT have `data-reveal`.
**Warning signs:** Lighthouse LCP jumps above 2.5s after animation implementation; Performance trace shows "First Contentful Paint" delayed.

### Pitfall 2: Stagger Delay Stack
**What goes wrong:** Seven segment cards each with 100ms stagger means the 7th card starts revealing at 600ms. If the section itself also has a 600ms reveal transition, the last card doesn't finish until 1200ms+ after scroll entry. This feels slow and disconnected.
**Why it happens:** Compound transition delays not accounted for.
**How to avoid:** Apply stagger delay only to the cards' `transition-delay`, not to a parent container that also has a delay. The section container reveal should be fast (200-300ms), then cards stagger within it.
**Warning signs:** Last card in segment list feels noticeably late to arrive.

### Pitfall 3: Reduced-Motion Still Shows `opacity: 0` Flash
**What goes wrong:** The CSS `@media (prefers-reduced-motion: reduce)` rule sets `opacity: 1` for `[data-reveal]` elements, but a brief flash of invisible content occurs before the CSS is parsed.
**Why it happens:** Inline styles or JavaScript `classList.add("is-visible")` timing can conflict with CSS.
**How to avoid:** CSS handles the initial state correctly as long as the `@media` rule appears in the same stylesheet that sets `opacity: 0`. Since both are in the same component `<style>` block (or global.css), FOUC is not a real risk here.
**Warning signs:** Testing with reduced motion enabled in DevTools shows flash of invisible content.

### Pitfall 4: Threshold Too High for Tall Sections
**What goes wrong:** Using `threshold: 0.5` (fires at 50% visibility) for a section taller than the viewport means the animation never triggers — the element can never be 50% in-view when it's taller than the screen.
**Why it happens:** `threshold` is fraction of the TARGET element that must be visible, not fraction of viewport.
**How to avoid:** Use `threshold: 0.15` (15% visible) for section-level reveals. For segment cards (smaller elements), 0.2 to 0.3 is appropriate (matching AnimatedDivider's 0.3).
**Warning signs:** Section reveals never trigger on mobile (smaller viewport) but work on desktop.

### Pitfall 5: Animation CSS not Scoped to Avoid Specificity Conflicts
**What goes wrong:** Global `[data-reveal]` styles in global.css conflict with component-scoped styles that also set `opacity` or `transform`.
**Why it happens:** Astro scoped styles use `data-astro-cid-*` attributes for specificity, but global attribute selectors don't have scoping.
**How to avoid:** Use a dedicated CSS class (e.g., `.scroll-reveal`) instead of a data attribute, or add reveal styles as an Astro component's scoped `<style>` with `is:global`. Alternatively, keep reveal styles in global.css as `@layer components` to control cascade priority.
**Warning signs:** Existing section styles (e.g., `.hiawatha-section` background) appear to fight with reveal transforms.

### Pitfall 6: Transfer Size Exceeds 3MB
**What goes wrong:** Adding animation JS or CSS pushes the page over 3MB transfer size budget.
**Why it happens:** Misunderstanding the budget — but also possible if new assets (fonts, images) are inadvertently added.
**How to avoid:** Phase 22 adds only inline CSS and ~20 lines of JS (both negligible). The actual risk is the 51 thumbnails (3MB total) loading in a single scroll session. Lighthouse counts all resources fetched during test. If Lighthouse's "Total Byte Weight" audit fails, thumbnails are the culprit, not animations.
**Warning signs:** Lighthouse flags "Avoid enormous network payloads" with thumbnails listed.

---

## Code Examples

### Section reveal — complete implementation

```javascript
// Source: MDN IntersectionObserver API + AnimatedDivider.astro existing pattern
// Place in ScrollReveal.astro <script> block or inline in index.astro

// Gate: skip all setup when reduced motion is preferred
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll("[data-reveal]").forEach(el => {
    // Above-fold guard: elements already in view get shown immediately
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add("is-visible");
    } else {
      observer.observe(el);
    }
  });
}
```

```css
/* Source: established CSS animation pattern (web.dev animations guide) */
/* Use opacity + transform only — compositor-safe, no layout/paint triggers */

[data-reveal] {
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

[data-reveal].is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Reduced motion: content is always fully visible */
@media (prefers-reduced-motion: reduce) {
  [data-reveal] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

### Segment card stagger — pure CSS approach

```css
/* Source: established nth-child stagger pattern */
/* Applied to .segment-card children inside RouteExplainer */
/* Requires parent to have [data-reveal-stagger] when parent becomes is-visible */

/* Default: cards have the same animation as other reveal targets */
.segment-card {
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Stagger delays — 100ms per card, 7 cards = 600ms max */
.segment-card:nth-child(1)  { transition-delay: 0ms; }
.segment-card:nth-child(2)  { transition-delay: 100ms; }
.segment-card:nth-child(3)  { transition-delay: 200ms; }
.segment-card:nth-child(4)  { transition-delay: 300ms; }
.segment-card:nth-child(5)  { transition-delay: 400ms; }
.segment-card:nth-child(6)  { transition-delay: 500ms; }
.segment-card:nth-child(7)  { transition-delay: 600ms; }

/* When the section becomes visible, cards inherit */
.route-explainer-section.is-visible .segment-card {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .segment-card {
    opacity: 1;
    transform: none;
    transition: none;
    transition-delay: 0ms;
  }
}
```

### Verifying prefers-reduced-motion in tests

```javascript
// Source: MDN prefers-reduced-motion docs
// Toggle in Chrome DevTools: Rendering panel > Emulate CSS media feature > prefers-reduced-motion: reduce
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
console.log("Reduced motion:", prefersReducedMotion);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `scroll` event listener | `IntersectionObserver` | 2018-2019 | Async, off main-thread, much cheaper |
| GSAP / anime.js for reveals | CSS transition + IO class toggle | Post-2020 best practice | Zero dependencies, compositor-native |
| `animation-timeline: view()` | Not yet (deferred v1.3) | Firefox support gap 2025 | Project explicitly deferred this |
| JS-driven stagger (setTimeout) | CSS `transition-delay` + `nth-child` | Modern standard | Pure CSS, no JS timing fragility |

**Deprecated/outdated:**
- `scroll` event + `getBoundingClientRect()` polling: Was common before IntersectionObserver; now an anti-pattern due to main-thread cost.
- `will-change: transform` on all animated elements: Older advice; current best practice is to not add it unless profiling shows a concrete need.

---

## Performance Budget Analysis

### Current Transfer Size (as of Phase 21)

| Resource | Size | Load Strategy |
|----------|------|---------------|
| Hero image (JPEG) | 625 KB | Eager (`fetchpriority="high"`) |
| JS bundles | 472 KB | `type="module"` (deferred) |
| CSS (Tailwind + components) | 51 KB | Inline in `<head>` |
| Fonts (woff2) | 88 KB | `font-display: swap` |
| **Initial load subtotal** | **~1.2 MB** | — |
| 51 thumbnails (webp, lazy) | ~3.0 MB | `loading="lazy"` |
| **Full session (all lazy)** | **~4.2 MB** | — |

**Budget status:**
- Initial load: 1.2MB — well within 3MB budget.
- Full session if all thumbnails load: ~4.2MB — exceeds 3MB. If Lighthouse counts all resources fetched during its session (it does), this may flag "Avoid enormous network payloads." Phase 22 animations add <1KB of CSS/JS — they are not the cause and not the fix.
- The thumbnail total is a pre-existing condition. Phase 22 must not make it worse. It does not need to fix it (out of scope for this phase).

### LCP Risk Assessment

- Current hero: `<img fetchpriority="high" loading="eager">` — correct.
- Hero image size: 625KB JPEG with no responsive smaller size for mobile. On Lighthouse's simulated 1.6 Mbps download, a 625KB image takes ~3 seconds to download. This is the most likely LCP risk.
- Phase 22 animation risk: Any CSS that sets `opacity: 0` on the hero or its containing section will delay paint and directly harm LCP. The implementation plan MUST explicitly exclude HeroSection from `data-reveal`.
- Phase 22 will not fix the hero image size (that would be a separate optimization); it must not make LCP worse.

### Lighthouse Throttling Reference

Lighthouse mobile simulation uses:
- Network: 1.6 Mbps download, 750 Kbps upload, 150ms RTT ("Slow 4G / Fast 3G boundary")
- CPU: 4x slowdown multiplier (simulates mid-tier mobile)
- LCP passing threshold: ≤ 2.5s

---

## Implementation Scope Map

Sections in `index.astro` and their `data-reveal` eligibility:

| Section | Gets `data-reveal`? | Reason |
|---------|---------------------|--------|
| `HeroSection` | NO | Above fold — LCP element |
| DonateCallout (first, below hero) | NO | Likely above fold on most viewports |
| `FloralDivider` | NO | Static decorative element (19-05 decision) |
| `HiawathaExplainer` | YES | Clearly below fold |
| `RouteExplainer` | YES (section) + stagger cards | Below fold; 7 segment cards stagger 100ms each |
| RouteStats section | YES | Below fold |
| GPX Download section | YES | Below fold |
| Route Map section | YES | Below fold |
| Elevation Profile section | YES | Below fold |
| Photos section | YES | Below fold |
| Second DonateCallout (Support the Trail) | YES | Below fold |
| Footer/Credits section | YES | Below fold |
| AnimatedDividers | NO | Already have their own IntersectionObserver |

---

## Open Questions

1. **Where does the reveal CSS and JS live?**
   - What we know: Options are (A) a new `ScrollReveal.astro` component or (B) distributed across global.css + BaseLayout. 
   - Recommendation: A new `ScrollReveal.astro` component imported at the bottom of `index.astro` is the cleanest approach — all reveal logic in one file, page-specific, doesn't affect admin page.

2. **Should segment cards observe individually or trigger stagger from parent?**
   - What we know: Parent-triggered stagger (CSS `nth-child` delays, parent gets `is-visible`) is simpler. Individual card observers would allow each card to animate only when it itself enters view (more precise), but adds 7 observers.
   - Recommendation: Parent-triggered stagger — the section-level observer fires once, adds `is-visible` to the section, and CSS `nth-child` transition-delay handles the cascade. This is simpler and still satisfies ANI-02 ("reveal sequentially with 100ms stagger").

3. **Does the thumbnail transfer size violate the 3MB budget?**
   - What we know: Full-session transfer including all lazy thumbnails is ~4.2MB. Initial load is ~1.2MB.
   - What's unclear: Whether the phase's "page transfer size under 3MB" criterion refers to initial load or full session.
   - Recommendation: Plan should note this ambiguity and verify against Lighthouse's "Total Byte Weight" audit. If Lighthouse counts all lazy resources, the budget was already exceeded before Phase 22 and is out of this phase's scope to fix. Phase 22 adds <1KB of CSS/JS and cannot move the needle either direction.

---

## Sources

### Primary (HIGH confidence)
- `src/components/AnimatedDivider.astro` — Reference implementation for IO pattern, CSS class toggle, reduced-motion handling, and `pathLength=1` animation standard
- `dist/index.html` (built output) — Verified compiled AnimatedDivider script: `querySelectorAll(".animated-divider")`, `threshold: 0.3`, `s.disconnect()`
- MDN IntersectionObserver API (WebFetch 2026-04-01) — Constructor options, `isIntersecting`, one-shot pattern with `unobserve()`
- MDN prefers-reduced-motion (WebFetch 2026-04-01) — CSS `@media (prefers-reduced-motion: reduce)` and `window.matchMedia()` JS pattern
- web.dev animations guide (WebFetch 2026-04-01) — Only `opacity` and `transform` are compositor-safe; `will-change` should be used sparingly
- GitHub Lighthouse throttling docs (WebFetch 2026-04-01) — 1.6 Mbps / 150ms RTT / 4x CPU slowdown; LCP threshold 2.5s
- MDN CSS animation performance (WebFetch 2026-04-01) — CSS transitions and keyframe animations have equivalent performance; both can run off main thread for `transform`/`opacity`

### Secondary (MEDIUM confidence)
- web.dev optimize-lcp (WebFetch 2026-04-01) — `fetchpriority="high"` and `loading="eager"` on hero confirmed as correct approach; "never lazy-load LCP image"
- web.dev LCP article (WebFetch 2026-04-01) — LCP elements include `<img>`, animated GIF first frame, video poster; 2.5s threshold; CSS `opacity: 0` can exclude elements from LCP candidacy

### Tertiary (LOW confidence)
- None — all claims verified against codebase or official documentation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — entirely existing web platform APIs already used in codebase
- Architecture patterns: HIGH — AnimatedDivider is a working reference implementation; patterns are derived from it plus MDN-verified API behavior
- Performance budget: MEDIUM — initial load budget is clear and passing; full-session thumbnail total is a pre-existing condition whose exact Lighthouse treatment is ambiguous
- LCP risk: HIGH — hero image already has correct attributes; the risk is only if animation CSS incorrectly hides it

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (web platform APIs are stable; IntersectionObserver and prefers-reduced-motion have been baseline since 2019-2020)
