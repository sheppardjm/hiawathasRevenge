# Phase 14: Ojibwe Design System - Research

**Researched:** 2026-03-31
**Domain:** SVG decorative elements (inline Astro components), cultural attribution footer, accessibility patterns
**Confidence:** HIGH (technical), MEDIUM (cultural guidance)

## Summary

Phase 14 has three distinct workstreams: (1) hand-authored SVG decorative elements inspired by Ojibwe woodland floral beadwork, (2) a cultural attribution statement in the site footer, and (3) accessibility markup for all decorative SVGs.

The technical approach is straightforward: hand-author SVG paths in `.astro` component files that draw inspiration from the visual characteristics of Ojibwe woodland floral beadwork — curvilinear vines, five-petal blossoms, double-curve motifs, and leaf forms. No third-party SVG library is needed. The existing `topo-divider` class in `global.css` uses a CSS `background-image` data-URI approach; the new Ojibwe-inspired dividers should use **inline SVG** instead, because inline SVGs can reference CSS custom properties (`var(--color-*)`) directly in `fill` and `stroke` attributes — data-URI SVGs cannot. This means the new dividers will automatically adopt the Phase 12 palette tokens (gold-600, berry-600, moss-600, lake-700) with no extra work.

The cultural dimension is the most important planning consideration. The phase blocker note explicitly flags "Ojibwe community consultation recommended." Research confirms this is correct: best practice for non-Indigenous design projects using Indigenous motifs requires attribution naming the specific tradition (Ojibwe/Anishinaabe woodland floral beadwork), not just a generic "Native American" reference. The attribution should appear in the site footer on every page. There is one documented free-to-use Anishinaabe floral graphic resource (Neebin Studios, neebin.com) that could serve as visual reference for motif proportions and composition — the creator explicitly invites use, though no formal license exists.

**Primary recommendation:** Hand-author 2–3 SVG divider/accent components using curvilinear paths, five-petal flower forms, and double-curve vine structure inspired by (not copied from) Ojibwe beadwork aesthetics. Add cultural attribution to the existing footer section in `index.astro`. Use `aria-hidden="true"` on all decorative SVGs.

## Standard Stack

No new npm dependencies required for this phase.

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Inline SVG in `.astro` files | N/A | Hand-authored decorative elements | Already used in HeroSection.astro badge; supports CSS custom properties directly |
| CSS custom properties | native | Color tokens from Phase 12 palette | `var(--color-gold-500)` etc. work inside inline SVG `fill`/`stroke` attributes |
| Tailwind CSS `@theme static` | 4.2.2 | Color token source | Already configured; all `--color-*` variables available to SVG fills |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| webaim.org/resources/contrastchecker | Verify any SVG stroke/fill against background if text-adjacent | If decorative SVGs are ever placed near light backgrounds |
| SVG `<defs>` + `<pattern>` | Repeating tile-based patterns within a single SVG | If a horizontal border needs seamlessly tiling motif units |
| CSS `background-image` data-URI | Repeating CSS-only patterns | Only for patterns that do NOT need dynamic color; the existing `topo-divider` uses this; do NOT use for new Ojibwe dividers |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-authored SVG paths | Neebin Studios floral set SVG files directly | The Neebin set is available for free use but was created to expand resources for Anishinaabe communities; using it as decorative background texture on a non-Indigenous cycling site may not align with the creator's intent. Hand-authoring *inspired* paths avoids this concern while achieving the aesthetic goal. |
| Inline SVG component | CSS data-URI background | data-URI cannot reference `var(--color-*)` CSS variables; color changes require regenerating the URI string. Inline SVG is clearly better here. |
| Inline SVG component | SVG file imported as Astro component (`import Motif from './motif.svg'`) | Valid approach in Astro 5.7+/6; works without configuration. Either approach is fine; inline SVG directly in `.astro` avoids a separate file per motif and keeps the pattern close to its usage. For dividers, inline is simpler. |

**Installation:** No packages needed.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── FloralDivider.astro      # NEW: section divider with Ojibwe floral motif
│   ├── FloralAccent.astro       # NEW (optional): standalone ornamental accent/motif
│   └── HeroSection.astro        # UNCHANGED
├── pages/
│   └── index.astro              # MODIFY: replace topo-divider divs with <FloralDivider />; add attribution to footer
└── styles/
    └── global.css               # MODIFY: keep .topo-divider for reference; add .floral-divider if needed
```

Two new divider instances replace the existing `<div class="topo-divider max-w-4xl mx-auto">` elements on lines 20 and 75 of `index.astro`. The footer section (currently lines 97–101) gains the cultural attribution statement.

### Pattern 1: Inline SVG Divider as Astro Component

**What:** An `.astro` component that renders a hand-authored inline SVG using CSS custom property color tokens. No props needed for the basic case; optional `width`, `height` props for responsive sizing.

**When to use:** Everywhere `topo-divider` currently appears; potentially as accents elsewhere in later phases.

**Example structure:**

```astro
---
// FloralDivider.astro
// Inspired by Ojibwe woodland floral beadwork — curvilinear vine with leaf and blossom motifs
// All fills reference Phase 12 color tokens; decorative only (aria-hidden)
---

<div class="floral-divider" aria-hidden="true" role="presentation">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 800 60"
    width="100%"
    height="60"
    aria-hidden="true"
    focusable="false"
  >
    <!--
      Central vine — a continuous curvilinear S-curve running the full width.
      Visual reference: the "vine of life" compositional anchor in Anishinaabe floral art.
    -->
    <path
      d="M0 30 Q100 10 200 30 Q300 50 400 30 Q500 10 600 30 Q700 50 800 30"
      stroke="var(--color-gold-500)"
      stroke-width="1.5"
      fill="none"
      opacity="0.7"
    />
    <!--
      Leaf pairs — opposing teardrop shapes along the vine at key inflection points.
      Curvilinear forms echo the naturalistic botanical accuracy of Ojibwe beadwork.
    -->
    <ellipse cx="200" cy="30" rx="8" ry="4" fill="var(--color-moss-500)" transform="rotate(-20, 200, 30)" opacity="0.6" />
    <ellipse cx="200" cy="30" rx="8" ry="4" fill="var(--color-moss-500)" transform="rotate(20, 200, 30)" opacity="0.6" />
    <!-- ... additional motifs at 400, 600 ... -->
    <!--
      Five-petal blossom at center — a universal woodland motif in Ojibwe beadwork.
      Rendered as five small ellipses around a center point.
    -->
    <circle cx="400" cy="30" r="3" fill="var(--color-gold-400)" opacity="0.8" />
    <!-- petal group at 400,30 ... -->
  </svg>
</div>
```

**Key color choices for motifs (all from Phase 12 @theme static tokens):**
- Vine/stroke: `var(--color-gold-500)` — warm amber, passes AA
- Leaves: `var(--color-moss-500)` — decorative only, does not need to pass AA for text
- Blossom center: `var(--color-gold-400)` — lighter amber for highlight
- Berry/seed accents: `var(--color-berry-600)` — decorative only

### Pattern 2: SVG `<defs>` + `<pattern>` for Tiling Borders

**What:** Define a small repeating tile (e.g., 40×40px with a leaf-and-bud unit) inside `<defs>`, reference it as `fill="url(#floralTile)"` on a `<rect>` spanning the full width.

**When to use:** If a denser, fully-tiled border (like a traditional bandolier bag border) is desired rather than a sparse vine.

**Example:**
```svg
<defs>
  <pattern id="floralTile" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
    <!-- single tile: small five-petal blossom + two leaves -->
    <circle cx="20" cy="20" r="3" fill="var(--color-gold-500)" />
    <!-- petals, leaves ... -->
  </pattern>
</defs>
<rect width="800" height="40" fill="url(#floralTile)" opacity="0.6" />
```

**Limitation:** CSS custom properties in SVG `fill` attributes work when the SVG is **inline** in the HTML. They do NOT work inside CSS `background-image: url("data:image/svg+xml,...")` strings. This confirms inline SVG is the only viable approach for color-token-aware patterns.

### Pattern 3: Cultural Attribution Footer Block

**What:** A text block in the existing footer section of `index.astro` that names the Ojibwe/Anishinaabe woodland floral tradition and contextualizes the site's use of it.

**When to use:** Required by DSN-04.

**Recommended language (draft — adjust after community consultation if pursued):**
```astro
<p class="text-xs text-cream-200 mt-2">
  Decorative design elements on this site are inspired by the woodland floral beadwork
  tradition of the Ojibwe (Anishinaabe) people, whose ancestral homelands include the
  Hiawatha National Forest region. The Ojibwe remain a vibrant, living people and
  cultural force. This use is intended as respectful acknowledgment, not appropriation.
</p>
```

**What good attribution includes (verified via Indigenous design guidance sources):**
1. Names the specific nation/tradition (Ojibwe/Anishinaabe — not generic "Native American")
2. Grounds it in place (ancestral homelands, present-day presence)
3. Affirms living, contemporary culture ("remain a vibrant, living people")
4. States intent clearly

**What to avoid:**
- Treating Ojibwe culture as historical/frozen ("once inhabited" language)
- Generic "Native American" without specificity
- Sacred or ceremonial symbol references (woodland floral beadwork is not ceremonial; it is a material/decorative tradition — this is safe ground)

### Anti-Patterns to Avoid

- **CSS data-URI for color-token-aware SVGs:** `var(--color-*)` inside a `background-image` data-URI is evaluated in the CSS string context, not as a live CSS variable. It will render as the literal text `var(--color-gold-500)` not the resolved value. The existing `topo-divider` hardcodes `%233d6b3d` (URL-encoded `#3d6b3d`) for exactly this reason. Do not use this approach for the new Ojibwe dividers.
- **Using only `role="presentation"` without `aria-hidden="true"`:** `role="presentation"` removes semantic role but does NOT hide the element from the accessibility tree. Screen readers may still announce SVG content. Use `aria-hidden="true"` (and `focusable="false"` for IE11 SVG focus bug) as the correct pattern.
- **Adding `tabindex` to decorative SVGs:** Decorative elements should not be keyboard-focusable. Omit `tabindex` entirely; the default is not focusable for non-interactive elements.
- **Copying Neebin Studios floral set files directly into the project:** The creator permits community use but the context is Anishinaabe and Native institutional use. Incorporate the visual *language* (curvilinear forms, five-petal blossoms, double-curve vine) as inspiration for hand-authored paths, not as direct file inclusions. This also avoids any ambiguity about licensing for a cycling website.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG optimization/minification | Custom build step | None needed — hand-authored inline SVGs are already minimal | Adding SVGO or similar tooling adds build complexity for no benefit on 2–3 simple decorative elements |
| Color-aware repeating pattern | CSS data-URI approach | Inline SVG with `var(--color-*)` | data-URI cannot resolve CSS variables |
| Cultural acknowledgment language | Generic boilerplate | Specific, place-based, nation-named attribution | Generic language is worse than no attribution — specificity signals genuine engagement |

**Key insight:** This phase is almost entirely about SVG authoring craft and cultural sensitivity — not about tooling. The technical implementation is 1–2 Astro components and a footer text block. The planning effort should go into defining the *design* of the SVG motifs before implementation begins.

## Common Pitfalls

### Pitfall 1: CSS Variables Not Resolving in SVG Fills

**What goes wrong:** Developer writes `fill="var(--color-gold-500)"` in an SVG inside a `background-image` CSS data-URI string. The color renders as transparent or not at all.

**Why it happens:** `var()` in SVG `fill` only resolves when the SVG is parsed in the HTML DOM context. Inside a `background-image: url("data:image/svg+xml,...")` string, there is no DOM — the CSS variable is unresolved.

**How to avoid:** Only use `var(--color-*)` in SVG `fill`/`stroke` attributes when the SVG is **inline in the HTML** (i.e., directly in an `.astro` template). For the `topo-divider` (CSS background approach), color had to be hardcoded as `%233d6b3d`. For the new Ojibwe dividers, use the inline SVG component approach.

**Warning signs:** SVG shows no color or a fallback color; inspecting computed styles shows `fill: var(--color-gold-500)` but it's not rendering as the expected color.

### Pitfall 2: SVG ViewBox vs Width/Height Causing Layout Breaks

**What goes wrong:** SVG component renders at a fixed pixel size that breaks at narrow viewports, or the `viewBox` and intrinsic dimensions cause unexpected height/aspect ratio.

**Why it happens:** SVGs without explicit `width="100%"` and a `viewBox` will render at their intrinsic pixel size.

**How to avoid:** Always set `viewBox="0 0 [W] [H]"`, `width="100%"`, and `height="[design height]px"` (e.g., `height="60"`). The `width="100%"` ensures responsive stretching; the fixed `height` preserves the intended visual weight; the `viewBox` maps the design coordinates correctly. This is the same approach as the existing `topo-divider` (400px wide, 60px tall, `background-size: 400px 60px`).

**Warning signs:** Divider has correct appearance on desktop but becomes too large/small on mobile; or there is unexpected vertical whitespace above/below the SVG.

### Pitfall 3: Replacing topo-divider Without Adjusting Surrounding Spacing

**What goes wrong:** The two `<div class="topo-divider">` elements in `index.astro` are replaced by `<FloralDivider />` components, but the new component has different internal padding/margin, causing sections to run together or gap sizes to change.

**Why it happens:** The `topo-divider` div has `height: 60px` from the CSS rule. The new component will establish its own height via the SVG. If surrounding sections have `py-[--spacing-block]` applied and the divider also adds height, the visual rhythm changes.

**How to avoid:** Match the SVG height (60px) to the existing `topo-divider` height. Keep the `FloralDivider` wrapper a bare `<div>` with no added margin — let the section spacing from adjacent elements govern the rhythm.

### Pitfall 4: Cultural Attribution Written Too Vaguely

**What goes wrong:** Footer says "Design elements inspired by Native American art" or "Some imagery draws from Indigenous traditions." This is generic, historically flattening language that does not meet the intent of DSN-04.

**Why it happens:** Easy to default to vague language to avoid saying something wrong.

**How to avoid:** Name the nation (Ojibwe, also known as Anishinaabe), name the specific tradition (woodland floral beadwork), and ground it in place. See the draft attribution language in Pattern 3 above. The attribution should be 1–2 sentences, clearly visible in the footer, and acknowledge living culture.

### Pitfall 5: Accessibility — Using `role="presentation"` Without `aria-hidden`

**What goes wrong:** Developer adds `role="presentation"` to the SVG thinking it's fully hidden from assistive technologies. Screen readers still traverse the SVG element and may announce its dimensions or children.

**Why it happens:** Confusing `role="presentation"` (removes semantic role) with `aria-hidden="true"` (removes from accessibility tree entirely).

**How to avoid:** Use **both** `aria-hidden="true"` and `role="presentation"` on the SVG element (belt and suspenders), plus `focusable="false"` to prevent IE11/old Edge from focusing inline SVGs. The success criteria explicitly require `role="presentation" aria-hidden="true"`.

Correct pattern:
```html
<svg
  aria-hidden="true"
  role="presentation"
  focusable="false"
  ...
>
```

## Code Examples

Verified patterns from official and authoritative sources:

### Decorative SVG — Correct Accessibility Markup
```html
<!-- Source: a11y-collective.com/blog/svg-accessibility/ + WCAG ACT Rules -->
<!-- role="presentation" removes semantic role; aria-hidden removes from accessibility tree -->
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 800 60"
  width="100%"
  height="60"
  aria-hidden="true"
  role="presentation"
  focusable="false"
>
  <!-- decorative paths here -->
</svg>
```

### SVG Fill with CSS Custom Property (Inline SVG Only)
```html
<!-- Source: MDN SVG fills and strokes; CSS-Tricks CSS fill property guide -->
<!-- Works because the SVG is in the HTML DOM where CSS variables are resolved -->
<path
  d="M0 30 Q200 10 400 30 Q600 50 800 30"
  stroke="var(--color-gold-500)"
  fill="none"
  stroke-width="1.5"
/>
```

### SVG Pattern Element for Repeating Motif Tile
```html
<!-- Source: W3Schools SVG pattern; MDN SVG <pattern> element -->
<defs>
  <pattern id="floralBorder" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
    <!-- Tile content: one repeat unit of the motif -->
    <circle cx="20" cy="20" r="3" fill="var(--color-gold-500)" opacity="0.8" />
    <!-- leaf left -->
    <ellipse cx="12" cy="20" rx="6" ry="3" fill="var(--color-moss-500)"
             transform="rotate(-15, 12, 20)" opacity="0.6" />
    <!-- leaf right -->
    <ellipse cx="28" cy="20" rx="6" ry="3" fill="var(--color-moss-500)"
             transform="rotate(15, 28, 20)" opacity="0.6" />
  </pattern>
</defs>
<rect width="100%" height="40" fill="url(#floralBorder)" />
```

### Astro Component with SVG Import (Alternative to Inline)
```astro
---
// Alternative: import SVG file as Astro component (Astro 5.7+/6, stable, no config needed)
import FloralMotif from '../assets/floral-motif.svg';
---

<!-- Props override SVG file attributes -->
<FloralMotif
  width="100%"
  height="60"
  aria-hidden="true"
  role="presentation"
  focusable="false"
/>
```
Note: For this approach, the SVG file must use `var(--color-*)` in its fill attributes (not hardcoded hex) to benefit from color tokens.

### Cultural Attribution Footer Block
```astro
<!-- In the <section> footer in index.astro — append after existing MBTN link -->
<p class="text-xs text-cream-200 mt-3 max-w-prose leading-relaxed">
  Decorative elements on this site are inspired by the woodland floral beadwork
  tradition of the Ojibwe (Anishinaabe) people, the original stewards of the
  Hiawatha National Forest region and surrounding Great Lakes homeland.
  The Ojibwe remain a living, contemporary culture.
</p>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic "Native American" attribution | Nation-specific attribution (Ojibwe/Anishinaabe) | Ongoing shift in design ethics 2019–2026 | Required by DSN-04; generic language is insufficient |
| CSS data-URI SVG (topo-divider) | Inline SVG component | Phase 14 — new elements | Enables CSS custom property color tokens in fills |
| `role="presentation"` alone for decorative SVG | `aria-hidden="true"` + `role="presentation"` | WCAG 2.1/2.2 clarifications | `aria-hidden` is the necessary attribute; `role="presentation"` alone is insufficient |

**Deprecated/outdated:**
- `topo-divider` CSS pattern: Not deprecated — it still exists and can remain — but new dividers use inline SVG for CSS variable support. The topo-divider may be removed or kept alongside as context.

## Open Questions

1. **Community consultation scope**
   - What we know: The blocker note recommends "Ojibwe community consultation." The attribution text will name the Ojibwe/Anishinaabe woodland floral beadwork tradition.
   - What's unclear: Whether community consultation is feasible before launch (requires direct outreach to Ojibwe cultural organizations; this is a personal cycling website). The alternative is thoughtful, specific, place-grounded attribution + commitment to good-faith representation.
   - Recommendation: Plan the attribution text carefully using the guidance in Pattern 3. Note in the plan that the blocker is acknowledged. If consultation is not feasible before launch, the attribution language should be self-aware about its limitations. The Munising, MI area has active Ojibwe/Anishinaabe communities (Bay Mills Indian Community, Keweenaw Bay Indian Community, Sault Ste. Marie Tribe of Chippewa Indians) that could be referenced or consulted.

2. **Motif design specifics — what to draw**
   - What we know: The key visual elements of Ojibwe woodland floral beadwork are: (a) continuous curvilinear vine / "vine of life" as compositional spine, (b) five-petal blossom motifs, (c) opposing teardrop/leaf pairs at inflection points, (d) double-curve motifs (two opposing arcs meeting at a point), (e) naturalistic botanical forms (not geometric)
   - What's unclear: The exact number of motifs (1 divider type? 2?), whether to include a standalone accent motif (e.g., a single blossom for corner decoration), and at what level of complexity/fidelity
   - Recommendation: Plan for 1 primary divider (`FloralDivider.astro`) using the vine + leaf + blossom vocabulary. Keep it sparse and elegant at 60px height. Optionally plan 1 standalone accent motif for future use. Define motif vocabulary in the plan tasks before any SVG coding.

3. **Relationship to topo-divider**
   - What we know: Two `topo-divider` instances exist in `index.astro` (lines 20 and 75)
   - What's unclear: Whether to replace both, supplement one, or keep the topo-divider alongside the new floral divider
   - Recommendation: Replace both existing topo-dividers with `<FloralDivider />`. The topo-divider class in `global.css` can remain in place for possible future use but won't be referenced in the HTML.

## Sources

### Primary (HIGH confidence)
- Direct source analysis of `src/styles/global.css`, `src/pages/index.astro`, `src/components/HeroSection.astro`, `astro.config.mjs` — existing patterns and infrastructure
- https://docs.astro.build/en/guides/images/#svg-files — SVG component import syntax (stable in Astro 5.7+/6, no config required)
- https://www.a11y-collective.com/blog/svg-accessibility/ — `aria-hidden="true"` vs `role="presentation"` for decorative SVGs
- https://www.w3schools.com/graphics/svg_pattern.asp — `<pattern>` element syntax
- https://codyhouse.co/ds/components/info/section-divider — Inline SVG for color-themeable section dividers

### Secondary (MEDIUM confidence)
- https://neebin.com/design/floral_set/ — Anishinaabe floral set by Neebinnaukzhik Southall (Chippewas of Rama First Nation); free for use, SVG format available; useful as visual reference for motif vocabulary
- https://www.indianreservation.info/native-american-tribal-beadwork-patterns-regional-styles-and-cultural-symbolism/ — Ojibwe woodland floral beadwork visual characteristics (curvilinear, five-petal, double-curve, vine of life, botanically specific)
- https://www.robertdesjarlaitfinearts.com/weeblycom/the-contemporary-aesthetics-of-anishinaabe-floral-art — Contemporary Anishinaabe floral art compositional principles (symmetry, vine-of-life anchor, leaf forms, double-curve motif)
- https://vincentdesign.ca/2021/03/08/considerations-and-best-practices-in-indigenous-design/ — Best practices for non-Indigenous designers using Indigenous design elements
- https://nativegov.org/news/a-guide-to-indigenous-land-acknowledgment/ — Best practices for Indigenous acknowledgment language (specific over generic, living culture framing)

### Tertiary (LOW confidence)
- WebSearch results on Ojibwe floral design Pinterest/Etsy ecosystem — Not directly usable but confirms the visual tradition is actively practiced and documented
- WebSearch on Indigenous design attribution ethics 2026 — General principles confirmed via multiple sources but no single authoritative standard

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — No new dependencies; inline SVG is already used in project (HeroSection badge); Astro SVG component import is stable since 5.7; CSS var in inline SVG fill is well-established browser behavior
- Architecture: HIGH — Direct analysis of existing codebase; component structure follows existing patterns
- SVG motif design: MEDIUM — Visual characteristics of Ojibwe woodland floral beadwork are documented; exact path coordinates must be hand-authored by the implementer using that vocabulary
- Cultural attribution: MEDIUM — Best practices are clear (specific, place-grounded, living culture); exact language requires judgment; community consultation recommended but not verified as feasible
- Accessibility: HIGH — `aria-hidden="true"` + `role="presentation"` + `focusable="false"` is the established pattern per WCAG and authoritative accessibility sources

**Research date:** 2026-03-31
**Valid until:** 2026-06-01 (stable APIs; cultural attribution language may benefit from review if community consultation occurs)
