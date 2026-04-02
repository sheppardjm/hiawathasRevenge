# Phase 21: Section Color Differentiation - Research

**Researched:** 2026-04-01
**Domain:** CSS section backgrounds, Tailwind v4 utility classes, AnimatedDivider wiring
**Confidence:** HIGH

## Summary

Phase 21 is primarily a **CSS layout and composition task**, not a new-component task. The color tokens, the AnimatedDivider component, and the section structure all exist already. The work is:
1. Assign distinct background colors to each major section in `index.astro` and individual component `<style>` blocks
2. Wire additional `AnimatedDivider` instances between sections, replacing the remaining static `FloralDivider`
3. Verify the page achieves ~60% forest-900/950 backgrounds, ~30% accent mid-tones, ~10% bold pop colors

The implementation is pure CSS/Tailwind — no new components, no new npm packages, no JavaScript changes. All color tokens are already defined in `@theme static` in `global.css` and are available as Tailwind utility classes (`bg-forest-900`, `bg-forest-950`, etc.) and CSS custom properties (`var(--color-forest-900)`).

**Primary recommendation:** Apply background colors via scoped `<style>` blocks inside each section component (or on the `<section>` wrapper elements in `index.astro`) using existing `var(--color-*)` custom properties. Use Tailwind utility classes (`bg-*`) where sections are defined inline in `index.astro`; use scoped CSS vars where sections live inside components.

---

## Standard Stack

No new libraries. This phase uses what the project already has.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Tailwind CSS v4 | 4.2.2 | `bg-*` utility classes on inline sections | Already in project; `--color-*` tokens auto-generate `bg-*` utilities |
| CSS custom properties | native | `background-color: var(--color-*)` in scoped `<style>` blocks | Used throughout all existing components |
| Astro scoped styles | Astro 6 | `<style>` blocks in `.astro` files | Already established pattern in every component |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Per-component `<style>` blocks | Tailwind `bg-*` on wrapper `<section>` | Either works; use whichever matches where the `<section>` element lives |
| Inline `background-color` | CSS variables | Inline styles are fine for one-off values but vars are more maintainable |

**Installation:** None required.

---

## Architecture Patterns

### Existing Section Structure (as of Phase 20)

The current `index.astro` page structure is:

```
HeroSection                    (full-viewport photo hero — no bg class needed, photo IS the bg)
  <section> DonateCallout      (inline section in index.astro — bg-forest-900 from body default)
FloralDivider                  (static, first divider — KEEP per 19-05 decision)
HiawathaExplainer              (component — already sets background-color: var(--color-forest-950))
RouteExplainer                 (component — already sets background-color: var(--color-forest-950))
  <section> RouteStats         (inline section in index.astro — bg-forest-900 from body default)
  <section> GPX Download       (inline section in index.astro)
AnimatedDivider variant="berry" (one instance already wired in index.astro)
  <section id="route"> RouteMap (inline section — bg-forest-900 default)
  <section> ElevationProfile   (inline section — bg-forest-900 default)
  <section> Photos + Gallery   (inline section — bg-forest-900 default)
  <section> DonateCallout      (inline section — bg-forest-900 default)
  <section> Footer/Credits     (inline section — bg-forest-900 default)
```

**Key observation:** The body already sets `bg-forest-900` via the `min-h-screen bg-forest-900` class on `<body>`. Most inline sections inherit that background silently. Only `HiawathaExplainer` and `RouteExplainer` explicitly set `background-color: var(--color-forest-950)`.

### Pattern 1: Background via Tailwind utility on inline sections

For `<section>` elements defined directly in `index.astro`, add a Tailwind `bg-*` class:

```astro
<!-- Before -->
<section class="max-w-4xl mx-auto px-4 py-[--spacing-block]">

<!-- After (example: forest-800 for a lighter panel feel) -->
<section class="bg-forest-800 max-w-4xl mx-auto px-4 py-[--spacing-block]">
```

Since all `--color-forest-*` tokens are in `@theme static`, Tailwind v4 auto-generates `bg-forest-800`, `bg-forest-950`, etc.

### Pattern 2: Background via CSS custom property in scoped `<style>` block

For sections owned by a component (e.g., `HiawathaExplainer`, `RouteExplainer`), the background is already set in the component's `<style>` block. Changing it means editing the component file:

```css
/* HiawathaExplainer.astro — already exists */
.route-explainer-section {
  background-color: var(--color-forest-950);  /* currently here */
}
```

To differentiate, change the value to a different forest/accent shade.

### Pattern 3: Full-width vs. max-width backgrounds

**Critical layout concern:** All inline sections in `index.astro` use `max-w-4xl mx-auto px-4` to constrain content width. If a background color is applied to that constrained `<section>`, it only colors a centered column — not the full viewport width.

To get full-width section backgrounds, the pattern must be:

```astro
<!-- Full-width outer wrapper with bg, inner content constrained -->
<div class="bg-forest-800 w-full">
  <section class="max-w-4xl mx-auto px-4 py-[--spacing-block]">
    <!-- content -->
  </section>
</div>
```

OR apply the background directly to the `<section>` and use `w-full` instead of `max-w-4xl` on the same element, then constrain content inside:

```astro
<section class="bg-forest-800 w-full py-[--spacing-block]">
  <div class="max-w-4xl mx-auto px-4">
    <!-- content -->
  </div>
</section>
```

**RouteExplainer already does this correctly** — its `<section class="route-explainer-section py-[--spacing-block]">` applies the background to the full-width section, with `<div class="max-w-4xl mx-auto px-4">` constraining the content inside. This is the established pattern to follow.

### Pattern 4: AnimatedDivider variant prop for color theming

AnimatedDivider accepts `variant="floral" | "minimal" | "berry"`. The existing wiring in `index.astro`:
```astro
<AnimatedDivider variant="berry" />
```

Per decision 19-05, the **first** `FloralDivider` is kept static; the **second** was replaced by the `AnimatedDivider`. Phase 21 needs to wire AnimatedDividers between additional section transitions. The variant prop controls visual complexity but not the divider's SVG colors — those are hardcoded to the palette tokens inside the component.

### Anti-Patterns to Avoid

- **Applying `bg-*` only to constrained `max-w-4xl` sections:** Creates narrow colored columns instead of full-width section bands. Sections must either be `w-full` or have a full-width outer wrapper.
- **Adding background colors to `HeroSection`:** The hero is a full-viewport photo with gradient overlay — adding a background color would cover the photo or conflict with the overlay.
- **Using scarlet-600 as a section background:** Per 18-01, scarlet-600 fails WCAG AA normal text. Body text will render on top of section backgrounds — any section background must pass contrast with cream-100 body text, or the section must have no body text on that background.
- **Adding new npm packages:** Project policy prohibits new dependencies.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color token availability | New CSS variables | Existing `--color-*` tokens in `global.css` | All tokens already defined; Tailwind v4 auto-generates utilities |
| Animated dividers | New animation component | Existing `AnimatedDivider` with `variant` prop | Component is fully built and tested per Phase 19 |
| Background color utilities | Custom `bg-` classes | Tailwind v4 `bg-forest-900`, `bg-forest-950`, etc. | `@theme static` tokens automatically generate these utilities |
| Full-width section pattern | New layout system | Follow RouteExplainer's established `w-full section + max-w-4xl div` pattern | Pattern already proven in codebase |

---

## Common Pitfalls

### Pitfall 1: Constrained-width background
**What goes wrong:** Developer applies `bg-forest-800` to the same element that has `max-w-4xl mx-auto`, creating a visually narrow colored rectangle instead of a full-width section band.
**Why it happens:** All inline sections in `index.astro` currently use `max-w-4xl mx-auto px-4` on the `<section>` tag itself.
**How to avoid:** Restructure inline sections to separate width constraint from background: full-width `<section class="bg-* w-full py-*">` containing `<div class="max-w-4xl mx-auto px-4">`.
**Warning signs:** Section background appears as a centered column, not spanning the full page.

### Pitfall 2: Text contrast failure on accent backgrounds
**What goes wrong:** A "pop accent" background (10% bucket) has body text rendered on top that fails WCAG AA.
**Why it happens:** The 10% pop bucket includes turquoise-700, scarlet-700, lake-700 — all documented as decorative-only or low contrast.
**How to avoid:** For any section with body text, use backgrounds from forest-900/950 or forest-800 only. Save accent backgrounds for sections with large text, decorative elements, or no body text. Cross-reference WCAG ratios in `global.css` comments before assigning.
**Warning signs:** A background assigned from the pop-accent group that has `text-cream-100` body copy directly on it.

### Pitfall 3: Breaking the static vs. animated divider balance
**What goes wrong:** The remaining `FloralDivider` gets replaced by an `AnimatedDivider`, violating decision 19-05.
**Why it happens:** Decision 19-05 explicitly preserves the first `FloralDivider` to maintain contrast between static and animated dividers on the same page.
**How to avoid:** Keep the first `FloralDivider` (after the opening DonateCallout section). Add new `AnimatedDivider` instances at OTHER transition points.
**Warning signs:** `FloralDivider` no longer appears in the rendered page at all.

### Pitfall 4: 60-30-10 calculated by element count not visual area
**What goes wrong:** Developer counts "sections" to achieve 60-30-10 rather than visual screen area.
**Why it happens:** Misreading the rule — it's about proportional visual weight, not number of sections.
**How to avoid:** The hero (full viewport), HiawathaExplainer (very long narrative), and RouteExplainer (very long segment cards) dominate visual area. Those three sections alone represent >60% of total scroll height. Keeping them forest-900/950 automatically satisfies the 60% dominant background rule. Accent backgrounds should go on the shorter sections (RouteStats, DonateCallout, GPX download, photo gallery).

---

## Code Examples

### Full-width section pattern (established by RouteExplainer)
```astro
<!-- Source: src/components/RouteExplainer.astro (already in codebase) -->
<section class="route-explainer-section py-[--spacing-block]">
  <div class="max-w-4xl mx-auto px-4">
    <!-- content constrained here -->
  </div>
</section>

<style>
  .route-explainer-section {
    background-color: var(--color-forest-950);
    background-image: url(/* vine pattern */);
    background-repeat: repeat;
    background-size: 400px 120px;
    border-top: 1px solid var(--color-forest-700);
    border-bottom: 1px solid var(--color-forest-700);
  }
</style>
```

### Tailwind bg-* utility usage (inline section in index.astro)
```astro
<!-- Source: Tailwind v4 docs + global.css @theme static tokens -->
<!-- --color-forest-800 in @theme static generates bg-forest-800 utility -->
<section class="bg-forest-800 w-full py-[--spacing-block]">
  <div class="max-w-4xl mx-auto px-4">
    <RouteStats />
  </div>
</section>
```

### AnimatedDivider wiring (existing pattern in index.astro)
```astro
<!-- Source: src/pages/index.astro — already wired once -->
<AnimatedDivider variant="berry" />
<!-- Add additional instances at other section boundaries: -->
<AnimatedDivider variant="minimal" />
<AnimatedDivider variant="floral" />
```

### Proposed section-to-background mapping (60-30-10 compliant)

Based on the visual area analysis and WCAG constraints:

| Section | Visual Weight | Proposed Background | Bucket |
|---------|---------------|---------------------|--------|
| Hero | ~25% scroll height | Photo + overlay (no change) | 60% dominant |
| DonateCallout (first) | ~5% | forest-900 (default, no change) | 60% dominant |
| [FloralDivider — keep static] | - | - | - |
| HiawathaExplainer | ~25% | forest-950 (already set) | 60% dominant |
| RouteExplainer | ~20% | forest-950 (already set) | 60% dominant |
| RouteStats + GPX | ~5% | forest-800 (subtle differentiation) | 30% accents |
| [AnimatedDivider variant="berry"] | - | - | - |
| Route Map | ~5% | forest-900 (default) | 60% dominant |
| Elevation Profile | ~3% | forest-950 (panel feel) | 60% dominant |
| Photo Gallery | ~5% | forest-900 (let photos speak) | 60% dominant |
| DonateCallout (second) | ~3% | forest-800 or berry-accent panel | 30% accents |
| Footer/Credits | ~4% | forest-950 (already has border-t) | 60% dominant |

This mapping satisfies ~60% forest-900/950, ~30% forest-800/accent-adjacent, ~10% from existing turquoise/berry/scarlet decorative elements in dividers.

**Note:** The planner should decide whether to add any overt accent backgrounds (e.g., a DonateCallout with a subtle forest-800 or lake-900-adjacent panel). The 10% pop-accent budget is already partially consumed by divider animations and decorative SVG tokens rather than section backgrounds per se.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single global bg on `<body>` | Per-section backgrounds via scoped CSS | Phase 21 (this phase) | Creates visual journey feel |
| Static FloralDivider only | FloralDivider + multiple AnimatedDividers | Phase 19 + 21 | Animated transitions between color zones |
| All sections at forest-900 | 60-30-10 color distribution | Phase 21 (this phase) | Visual rhythm without chaos |

---

## Open Questions

1. **How many AnimatedDivider instances to add?**
   - What we know: Currently 1 `AnimatedDivider` (berry variant) and 1 `FloralDivider`. Requirement SC-3 says "wired between sections, replacing static FloralDivider instances." But decision 19-05 says first FloralDivider must be kept.
   - What's unclear: Whether SC-3 means "replace ALL FloralDividers" (conflicting with 19-05) or "replace the removable ones." The 19-05 decision wins — only the second FloralDivider was targeted.
   - Recommendation: Keep first FloralDivider static. Add 1-2 more AnimatedDivider instances at other section transitions (e.g., after RouteExplainer, after Gallery). The requirement "replacing static FloralDivider instances" refers to the second one that was already replaced in Phase 19.

2. **Should DonateCallout sections have background differentiation?**
   - What we know: Two DonateCallout instances exist — one early (before HiawathaExplainer) and one late (before footer). They're both the same component with no background.
   - What's unclear: Whether to give one/both a distinct panel treatment to signal "action zone" vs. "content zone."
   - Recommendation: The planner can decide; the late-position DonateCallout (before footer) is a natural candidate for forest-800 or subtle accent panel to visually separate it from the photo gallery and footer.

3. **Background for Photo Gallery section?**
   - What we know: The gallery is a masonry grid of dark-ish photos on currently default forest-900.
   - What's unclear: Whether forest-950 would give photos better contrast pop or if the current default is fine.
   - Recommendation: Leave gallery as forest-900 (photos are colorful and carry their own visual weight). Low priority decision.

---

## Sources

### Primary (HIGH confidence)
- `src/styles/global.css` — All color tokens, their values, and WCAG documentation
- `src/pages/index.astro` — Current section structure and divider wiring
- `src/components/AnimatedDivider.astro` — Component API (variant prop)
- `src/components/RouteExplainer.astro` — Canonical full-width section background pattern
- `src/components/HiawathaExplainer.astro` — Current forest-950 background usage
- Tailwind v4 `@theme` docs (WebFetch verified 2026-04-01) — `--color-*` tokens auto-generate `bg-*` utilities

### Secondary (MEDIUM confidence)
- Tailwind CSS background-color docs (WebFetch verified 2026-04-01) — Section-level bg patterns
- `.planning/STATE.md` — 19-05 decision (first FloralDivider preserved)

### Tertiary (LOW confidence)
- None — all claims verified against codebase or official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools are already in use; no new libraries
- Architecture patterns: HIGH — full-width section pattern verified from existing RouteExplainer code
- Pitfalls: HIGH — constrained-width and contrast issues verified against actual code structure
- Color mapping: MEDIUM — proposed mapping is a starting recommendation; planner should validate 60-30-10 percentages against actual page scroll heights

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable project; no moving dependencies)
