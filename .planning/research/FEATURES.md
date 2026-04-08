# Feature Landscape: v1.8 Navigation & Identity

**Domain:** Cycling event editorial showcase — navigation, identity, and theming features
**Researched:** 2026-04-07
**Milestone:** v1.8 Navigation & Identity
**Confidence:** HIGH — patterns verified via MDN (prefers-color-scheme), LogRocket UX analysis, CSS-Tricks dark mode guide, live gravel event site audits (SBT GRVL, Grasshopper, Grassroots Gravel), and codebase inspection of existing v1.7 architecture

---

## Context

The existing site (v1.7) is a single-page editorial showcase. The layout from top to bottom:

1. HeroSection (full-viewport video/image)
2. DonateCallout (gold section, above-fold MBTN CTA)
3. FloralDivider
4. HiawathaExplainer (History — poem/forest/ride narrative with parallax sub-sections)
5. RouteExplainer (7 segment cards with hero photos)
6. AnimatedDivider
7. RouteStats (amber section)
8. GPX download section
9. AnimatedDivider
10. OjibweBorderPattern
11. RouteMap (id="route")
12. ElevationProfile
13. WaterWavePattern
14. Photos section (PhotoGallery)
15. AnimatedDivider
16. DonateCallout (teal section, second MBTN CTA)
17. Footer (existing: minimal, shields motif + MBTN attribution)

**Existing section IDs:** only `id="route"` is present. History, Gallery, and Sectors have no IDs yet.

**Target additions for v1.8:**
- Sticky nav bar (below hero, 4 links: History, Route, Gallery, Sectors)
- Ride ethos explainer (above first DonateCallout, or between FloralDivider and HiawathaExplainer)
- "Powered by Neucadia" footer (full-width single-line with logo)
- History section light/dark mode via prefers-color-scheme (beige/off-white bg in light, faded desaturated images in both modes, scroll fade in/out)

---

## Table Stakes

Features that must be present for these additions to work at all. Missing any = the feature is broken or actively worse than nothing.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Nav links scroll to correct sections | Users expect anchor links in a nav to actually navigate. If clicking "Gallery" doesn't reach Photos, the nav is a non-feature. | Low | Requires adding `id` attributes to HiawathaExplainer section, Photos section, RouteExplainer section |
| scroll-margin-top on all anchor targets | A sticky nav 48-56px tall will cover section headings if scroll-margin-top is not applied to every target section. This is the single most common sticky nav defect. | Low | Requires CSS var for nav height; all anchor sections need the property |
| Nav hides behind hero, appears on scroll | Below-hero sticky nav should not display while the hero is fully visible. Onset as hero exits viewport. Standard behavior on every gravel/outdoor event site surveyed (SBT GRVL, Grasshopper). Without this, nav is a permanent visual clutter element above the fold. | Medium | IntersectionObserver on hero section, or CSS position:sticky with initial top offset |
| Nav visible on all screen sizes | Per spec: "visible on all screen sizes." Mobile view must not collapse to hamburger — 4 links fit on 375px with compact spacing. | Low | Tailwind responsive utilities |
| prefers-color-scheme only, no toggle | The spec calls for system-preference-based switching only, no JS toggle. This is correct for a static editorial site — no user preference persistence needed. | Low | CSS @media only, no localStorage |
| Light mode background = beige/off-white, not white | Pure white (#fff) on a history section creates harsh contrast jarring against the dark forest palette on the rest of the page. The spec says "beige/off-white" — this matches the site's existing cream color family (--color-cream-100: #f5f0e8). | Low | Use existing token or new light-mode token |
| Dark mode background = existing forest-950 or deeper | History section in dark mode should maintain the existing dark forest palette. No change from current state in dark mode. | Low | None — this is the current default |
| Images desaturated + faded in both modes | Inspiration images (historical Hiawatha illustrations) are currently filtered in the museum-plate treatment. The spec calls for faded/desaturated in both light AND dark modes with scroll-triggered fade. Scroll fade already partially implemented via IntersectionObserver in HiawathaExplainer (data-bg-fade sections). | Medium | Builds on existing data-bg-fade IntersectionObserver pattern |
| Ethos explainer has distinct visual weight | The ride ethos section must be visually heavier/larger than body text and distinct from the editorial narrative. Without typographic elevation, it reads as another paragraph. Gravel sites universally use a statement format: large type, centered, or blockquote-style. | Low | New component or inline styles |
| Neucadia logo loads from neucadia.com | The spec says "logo from neucadia.com." The PNG is at https://neucadia.com/assets/neucadia_logo.png (5.1KB). A `<img>` referencing this external URL works but depends on the remote asset staying available. For a static site, fetching and inlining as a local asset is more reliable. | Low | Pipeline or manual copy of logo PNG |

---

## Differentiators

Features that improve the implementation beyond bare function. Good implementations of these four features versus bad ones.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Nav gets visual distinction when stuck (box-shadow or bg shift) | When nav first sticks it can be hard to distinguish from the section it overlays. A subtle background opacity increase or drop shadow on sticky onset signals to the user that it has locked into position. Pattern from LogRocket UX analysis and CSS Tricks sticky patterns. | Low | IntersectionObserver on a sentinel element above the nav, or CSS sticky with a JS class toggle |
| Active section highlighting in nav | The current nav link for the visible section highlights (amber or turquoise accent matching site palette). Tells the user where they are on a long single-page site. | Medium | IntersectionObserver with threshold monitoring for each section |
| Ethos section uses specific founding date copy | "Since June 7, 2014" is a credibility signal. It should be typographically emphasized (not hidden in prose). Gravel sites like Grassroots Gravel lead with founding year because longevity = trust for prospective riders. | Low | Inline typographic treatment, no new component |
| History section light mode uses cream palette, not pure white | The site has --color-cream-50 (#faf8f4) and --color-cream-100 (#f5f0e8) tokens. Light mode history should use one of these, not introduce a new off-white. Cohesion across the site's token system matters. | Low | Use existing token |
| History images: filter changes smoothly (transition) | The existing data-bg-fade implementation toggles a class. If the image filter changes (desaturation shifts between light/dark) there should be a CSS transition on the filter property to avoid jarring flicker. | Low | CSS transition: filter 0.3s ease |
| Neucadia footer uses site-appropriate minimal styling | "Full-width single line" per spec. Contrast against the existing footer's dark forest palette. A hairline top border in forest-700 color and small centered text at 11-12px in cream-200 matches the site's existing secondary text treatment. | Low | Mirrors existing footer typography |
| Nav links use site's existing section heading terminology | The spec says "History, Route, Gallery, Sectors." These should map exactly to existing section headings: HiawathaExplainer = "History," RouteMap section = "Route" (id="route" already exists), Photos section = "Gallery," RouteExplainer = "Sectors." No new terminology. | None | Just confirms naming alignment |

---

## Anti-Features

Things to explicitly not build. Each one is a common mistake in this category.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Hamburger menu on mobile | The spec says "visible on all screen sizes." 4 links at compact size fit in 375px without collapsing. A hamburger adds interaction cost — the user must tap to open nav, then tap a link, then the menu closes. Two-tap navigation for a four-destination site is worse than a condensed inline row. | 4-link inline row, smaller font size and padding on mobile, no hamburger |
| JS toggle for dark/light mode | This site has no user accounts, no localStorage persistence between sessions, and no design need for a user-overrideable preference. A toggle adds UI chrome (button, icon) that serves a small minority who want to override their OS setting. Adds JS weight and maintenance surface. | prefers-color-scheme only via CSS @media |
| Separate mobile nav (bottom bar pattern) | A bottom navigation bar in the mobile viewport is a native app pattern. On an editorial scroll site it competes with the content and interferes with thumb-scrolling. | Single sticky top nav, compact on mobile |
| Animated logo in Neucadia footer | Animation in a credit attribution footer is self-promotional distraction. The "powered by" footer is a single line — it should read and disappear. | Static logo, no hover animation |
| Sticky nav on hero section (from top of page) | Starting the sticky nav at the very top of the page means it appears over the hero video/image. The hero is the emotional opening of the site. Covering it with a nav bar degrades the first impression. SBT GRVL, Grasshopper, and every gravel site surveyed use a pattern where nav only becomes visible after the hero exits. | Nav appears as hero exits viewport |
| Ethos section as a long prose block | The ride ethos is 4 facts: founding date, always free, fellowship over competition, all levels. If written as a paragraph, it reads as fine print. If formatted as a statement, it reads as a value proposition. Long prose is for the editorial sections — this should be compact and declarative. | Statement/callout format, 4 lines or fewer, large-ish type |
| New color tokens for light mode | The site has --color-cream-50 and --color-cream-100 already. Introducing #f5f0ec or similar as a new token for light mode creates token sprawl without benefit. | Reuse --color-cream-50 or --color-cream-100 for light mode background |
| CSS filter: grayscale(1) on images (fully grayscale) | Fully grayscale historical illustrations in the HiawathaExplainer look like error states ("broken image"). The current museum-plate treatment uses sepia(80%) saturate(30%) — a warmer desaturation that reads as antique, not missing. The new filter treatment should stay in this register: faded, not stripped. | filter: sepia(60%) saturate(40%) brightness(0.85) in dark mode; saturate(20%) brightness(0.9) sepia(40%) in light mode |
| Separate light-mode and dark-mode image assets | Requires maintaining two versions of every historical image in the pipeline. The CSS filter approach achieves faded/desaturated from a single source image. | CSS filter variation per prefers-color-scheme |

---

## Feature Dependencies on Existing Architecture

| v1.8 Feature | Depends On | Risk |
|--------------|------------|------|
| Sticky nav anchor links | Adding `id` attributes to HiawathaExplainer section (id="history"), Photos section (id="gallery"), RouteExplainer section (id="sectors"). id="route" already exists on RouteMap section. | Low — straightforward attribute addition |
| scroll-margin-top | A CSS variable for nav height (e.g., --nav-height: 52px). All four target sections need scroll-margin-top: calc(var(--nav-height) + 8px). | Low |
| Nav sticky-onset detection | Hero section needs an IntersectionObserver target, OR nav uses a CSS position:sticky with top: 0 placed immediately after HeroSection in DOM order. The latter is simpler. | Low — CSS position:sticky handles it without JS if DOM order is correct |
| History light/dark mode | HiawathaExplainer.astro has three subsections (.poem-section, .forest-section, .ride-section) each with .subsection-bg. The section-level background change applies to .hiawatha-section. The existing `data-bg-fade` / IntersectionObserver system already fades background in/out on scroll. The new filter treatment on museum-plate images extends this pattern. | Low — builds directly on existing implementation |
| Ethos explainer placement | Must be inserted between FloralDivider and HiawathaExplainer (above first DonateCallout per spec), OR between DonateCallout and FloralDivider. The page currently has: HeroSection → gold DonateCallout → FloralDivider → HiawathaExplainer. "Above MBTN callout" is ambiguous — could mean above the first DonateCallout (after hero) or above the second (above teal section). Context suggests the second position (above second DonateCallout, as a philosophical statement before the ask). Clarify at requirements stage. | Low — DOM placement only, no architectural dependency |
| Neucadia footer | Sits inside or immediately after the existing footer section. The existing footer is a `<section>` with bg-forest-950, shields motif, and MBTN attribution text. Neucadia footer needs to be its own distinct line — either appended to existing footer or as a new `<footer>` element below it. | Low |

---

## Implementation Notes by Feature

### Sticky Nav Bar

**Pattern:** `position: sticky; top: 0` on a `<nav>` element placed in the DOM immediately after `<HeroSection />`. No JavaScript required for the sticky behavior itself.

**Sticky-onset styling:** Sentinel trick is unnecessary complexity. Simpler: nav starts with transparent or lightly tinted background, receives a `data-stuck` attribute via IntersectionObserver on a 1px sentinel placed just above it. Or: always use a semitransparent background (forest-900/80% opacity + backdrop-filter blur) so it reads well over both the hero and content sections.

**Mobile (375px):** 4 links at `font-size: 11-12px`, `padding: 8px`, `letter-spacing: 0.1em`, uppercase. Total width of 4 labels ("History", "Route", "Gallery", "Sectors") at this size fits comfortably in 375px without wrapping.

**scroll-margin-top:** Apply `scroll-margin-top: calc(var(--nav-height) + 12px)` to `#history`, `#route`, `#gallery`, `#sectors`. Use a CSS custom property for nav height. Baseline browser support is excellent (Chrome 69+, Firefox 68+, Edge 79+).

**Confidence:** HIGH — these are well-documented CSS primitives, no library needed.

### Ride Ethos Explainer

**Pattern:** A short statement block — not a component with interactive behavior. Typographically elevated (larger than body text), possibly with a horizontal rule or decorative element to signal separation from editorial sections.

**Content:** 4 facts: (1) since June 7, 2014; (2) always free; (3) fellowship over competition; (4) all levels welcome. These map naturally to 4 styled lines or a 2-column grid with large numerals or icons.

**Position clarification needed:** "Above MBTN callout" — which instance? The first DonateCallout (gold section, above-fold) or the second (teal section). For a "fellowship over competition, always free" message, placing it directly before the second DonateCallout (the support/donate ask) is logical: state your ethos, then make the ask. Placing it before the first (above-fold) DonateCallout makes the first interaction on the page a values statement before users have explored anything. Recommend second position.

**Confidence:** HIGH — content and position are design decisions, implementation is trivial.

### "Powered by Neucadia" Footer

**Pattern:** Full-width, single line, visually subordinate to existing footer content. Standard "built by" attribution. The Neucadia logo PNG is at https://neucadia.com/assets/neucadia_logo.png (confirmed accessible, 5.1KB). 

**Recommendation:** Fetch the logo at build time and serve as a local asset to avoid runtime external dependency. A single `curl` or pipeline step in `pipeline.js` would suffice. Alternatively, serve via `<img src="https://neucadia.com/assets/neucadia_logo.png">` — this creates an external dependency but requires no pipeline change.

**Styling:** `border-top: 1px solid var(--color-forest-700)`, background same as existing footer (forest-950), centered single line: `[logo] Powered by Neucadia` in cream-200 at 11-12px. Logo displayed inline at ~60-80px width with auto height.

**Confidence:** HIGH — well-understood pattern; only uncertainty is logo format compatibility (PNG confirmed at 5.1KB, adequate for small footer use).

### History Section Light/Dark Mode

**Pattern:** Pure CSS `@media (prefers-color-scheme: light)` — no JavaScript.

**Dark mode (current state):** `.hiawatha-section` already has `background-color: var(--color-forest-950)`. No change needed.

**Light mode:** Override `.hiawatha-section` background to `var(--color-cream-100)` (#f5f0e8) or `var(--color-cream-50)` (#faf8f4). Update text colors within the section: heading colors must pass WCAG AA against the light background. Existing amber/gold headings may fail — check contrast ratios.

**Image treatment (both modes):** The existing museum-plate treatment uses `filter: sepia(80%) saturate(30%) brightness(0.9)`. This already achieves "faded desaturated" for dark mode. For light mode, soften further: `filter: sepia(60%) saturate(20%) brightness(0.95) contrast(0.9)`. Add `transition: filter 0.3s ease` to avoid jarring flicker on system theme change.

**Scroll-triggered fade:** The existing `data-bg-fade` / IntersectionObserver system in HiawathaExplainer.astro already handles scroll-triggered visibility toggling on subsection backgrounds. The new light/dark mode changes are additive — the @media query handles the mode switch while IntersectionObserver handles the scroll fade. These are independent mechanisms and do not conflict.

**prefers-color-scheme browser support:** Baseline widely available since January 2020 (MDN). No polyfill needed.

**Confidence:** HIGH — MDN confirms full browser support; pattern is additive to existing implementation.

---

## MVP Recommendation

All four features are scoped correctly for a single milestone. No deferral recommended. Ordered by implementation risk (lowest first):

1. **Neucadia footer** — purely additive, no existing code interaction, lowest risk. Do first.
2. **Ride ethos explainer** — new component, no existing interaction, isolated placement. Do second.
3. **Sticky nav** — requires adding IDs to existing sections and CSS position:sticky + scroll-margin-top. Medium scope, no JS complexity.
4. **History light/dark mode** — requires @media override within existing HiawathaExplainer styles, text contrast audit for light mode, and image filter refinement. Most complex because it touches existing styled component internals.

**Position clarification needed before build:** Where exactly does the ethos explainer sit? "Above MBTN callout" is ambiguous between the two DonateCallout instances.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Sticky nav CSS mechanics | HIGH | position:sticky, scroll-margin-top — MDN, well-documented |
| Nav mobile fit at 375px | HIGH | 4 short labels at compact size confirmed to fit |
| prefers-color-scheme implementation | HIGH | MDN + CSS-Tricks confirmed; widely available since 2020 |
| Dark mode image filter values | MEDIUM | Specific filter() values for faded-not-grayscale are experience-based; may need visual tuning |
| Neucadia logo asset | MEDIUM | PNG confirmed at https://neucadia.com/assets/neucadia_logo.png; format adequate; colors/design unknown until rendered |
| Ethos explainer position | LOW | "Above MBTN callout" is ambiguous — needs requirement clarification |
| Light mode text contrast ratios | LOW | Existing amber/gold/turquoise heading colors against cream-100 background untested; some may fail WCAG AA |

---

## Sources

- [prefers-color-scheme — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme) — HIGH confidence
- [Sticky vs. Fixed Navigation: UX Analysis — LogRocket](https://blog.logrocket.com/ux-design/sticky-vs-fixed-navigation/) — HIGH confidence
- [A Complete Guide to Dark Mode on the Web — CSS-Tricks](https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/) — HIGH confidence
- [Anchor link scroll-margin-top solution — Go Make Things](https://gomakethings.com/how-to-prevent-anchor-links-from-scrolling-behind-a-sticky-header-with-one-line-of-css/) — HIGH confidence
- [SBT GRVL About page — live site audit](https://www.sbtgrvl.com/about) — MEDIUM confidence (nav pattern observed)
- [Grasshopper Adventure Series — live site audit](https://www.grasshopperadventureseries.com/huffmaster) — MEDIUM confidence (footer pattern observed)
- [Grassroots Gravel — live site audit](https://www.grassrootsgravel.com) — MEDIUM confidence (ethos structure observed)
- [Neucadia.com — logo asset location confirmed](https://neucadia.com) — MEDIUM confidence
- [Navigation bar design best practices — Webflow Blog](https://webflow.com/blog/navigation-bar-design) — LOW confidence (general patterns, not cycling-specific)
