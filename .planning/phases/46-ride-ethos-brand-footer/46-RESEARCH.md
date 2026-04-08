# Phase 46: Ride Ethos + Brand Footer - Research

**Researched:** 2026-04-07
**Domain:** Astro component authoring, static asset management, CSS declarative layout
**Confidence:** HIGH

---

## Summary

Phase 46 adds two new Astro components: `RideEthos.astro` and `NeucadiaFooter.astro`. Both are purely presentational — no new libraries, no build pipeline changes, no JavaScript required.

**RideEthos** is a compact declarative statement block positioned between the StickyNav and the first `.gold-section` (DonateCallout) in `index.astro`. It communicates four facts about the ride (founding date, free participation, fellowship over competition, all levels welcome) in a visually distinct, non-prose format. The design language of the project points toward a "kicker/stat" layout using the display font at large size rather than a paragraph.

**NeucadiaFooter** is a single full-width line at the very bottom of the page with the Neucadia wordmark logo (already fetched as a 283x42 RGBA PNG) linked to neucadia.com. The logo lives in `/public/images/` and is referenced with explicit `width`/`height` to prevent CLS. Because the admin page doesn't use `BaseLayout`, "every page" in practice means `index.astro` — but adding the footer component to `BaseLayout.astro` before `</main>` future-proofs it for any pages that eventually adopt the layout.

No external libraries are needed. No changes to `global.css @theme static` tokens are needed or permitted (Phase 47 constraint). Both components follow existing project patterns exactly.

**Primary recommendation:** Build both as standalone `.astro` components with scoped `<style>` blocks. Wire `RideEthos` into `index.astro` between `<StickyNav />` and the gold-section. Wire `NeucadiaFooter` into `BaseLayout.astro` immediately before `</main>` so it appears last on every page using the layout.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro `.astro` components | 6.1.1 (project) | Component authoring | Project pattern: every UI piece is a scoped `.astro` file |
| Vanilla CSS (scoped `<style>`) | N/A | Styling | Project never uses CSS-in-JS; all components use Astro scoped styles |
| Static public/ assets | N/A | Serving local logo PNG | All images in project live in `/public/images/`, referenced with absolute paths |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | — | No new dependencies for this phase |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `<img>` with width/height | Astro `<Image>` component | `<Image>` adds optimization pipeline; overkill for a small static logo already optimized. Project pattern is plain `<img>` in public/ |
| Logo in `/public/images/` | Logo in `src/assets/` | `src/assets/` enables Astro Image processing. `/public/images/` is already the project convention for static assets; no benefit to moving |
| NeucadiaFooter in BaseLayout | NeucadiaFooter in index.astro | BaseLayout placement future-proofs for new pages; index.astro placement is simpler but manual. Recommendation: BaseLayout |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── RideEthos.astro          # New: declarative ethos statement section
│   └── NeucadiaFooter.astro     # New: "Powered by Neucadia" footer line
├── pages/
│   └── index.astro              # Wire in RideEthos after <StickyNav />
├── layouts/
│   └── BaseLayout.astro         # Wire in NeucadiaFooter before </main>
public/
└── images/
    └── neucadia-logo.png        # Downloaded from neucadia.com/assets/neucadia_logo.png
```

### Pattern 1: RideEthos declarative kicker layout

**What:** A section containing four declarative "kicker" statements, each combining an emphasized value with a supporting label. Uses `--font-display` (National Park) at large size with `--color-amber-500` accents to be visually distinct from body prose (which is `--font-mono` at `--font-size-base`).

**When to use:** ETHOS-01 through ETHOS-03. The "compact declarative format" requirement (not a paragraph) and "larger, differently styled" requirement both point to a definition-list or stat-card layout.

**Recommended HTML shape:**
```html
<section class="ride-ethos" aria-label="About this ride">
  <div class="ethos-inner">
    <ul class="ethos-list">
      <li class="ethos-item">
        <span class="ethos-value">Since 2014</span>
        <span class="ethos-label">Founded June 7, 2014</span>
      </li>
      <li class="ethos-item">
        <span class="ethos-value">Always Free</span>
        <span class="ethos-label">No entry fee, ever</span>
      </li>
      <li class="ethos-item">
        <span class="ethos-value">Fellowship</span>
        <span class="ethos-label">Not a race</span>
      </li>
      <li class="ethos-item">
        <span class="ethos-value">All Levels</span>
        <span class="ethos-label">50K · 100K · 100 Miles</span>
      </li>
    </ul>
  </div>
</section>
```

**CSS approach:**
```css
.ride-ethos {
  background-color: var(--color-forest-900); /* matches page bg */
  border-top: 1px solid var(--color-forest-700);
  border-bottom: 1px solid var(--color-forest-700);
  padding: 2rem 1rem;
}

.ethos-inner {
  max-width: 64rem;
  margin: 0 auto;
}

.ethos-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem 3rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.ethos-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.ethos-value {
  font-family: var(--font-display);
  font-size: var(--font-size-2xl);  /* larger than body prose */
  font-weight: 700;
  color: var(--color-amber-500);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ethos-label {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-cream-200);
  letter-spacing: 0.06em;
  margin-top: 0.25rem;
}
```

**Why this format satisfies requirements:**
- ETHOS-01: Four facts in four items — founding date, free, fellowship, all levels
- ETHOS-02: In index.astro between `<StickyNav />` and `.gold-section`
- ETHOS-03: `--font-display` at `font-size-2xl` is visually distinct from body (`--font-mono` at `font-size-base`)

### Pattern 2: NeucadiaFooter with local logo and CLS prevention

**What:** A `<footer>` element with a single centered line: text "Powered by" + an `<img>` logo linked to neucadia.com. The logo has explicit `width`/`height` attributes matching the source PNG dimensions (displayed at half-scale for crispness), preventing layout shift.

**Example:**
```html
<footer class="neucadia-footer">
  <a
    href="https://neucadia.com"
    target="_blank"
    rel="noopener noreferrer"
    class="neucadia-link"
    aria-label="Powered by Neucadia"
  >
    <span class="neucadia-text">Powered by</span>
    <img
      src="/images/neucadia-logo.png"
      alt="Neucadia"
      width="142"
      height="21"
      loading="lazy"
      decoding="async"
      class="neucadia-logo"
    />
  </a>
</footer>
```

**CLS prevention:** The logo source is 283×42px. Displaying at 142×21 (50% scale) on a 1x display produces crisp rendering. The explicit `width="142" height="21"` attributes let the browser reserve space before the image loads — this is the standard CLS prevention technique.

**Logo colors:** The Neucadia logo is a white/light wordmark with a dark navy "N" initial, on a transparent (RGBA) background. It is designed for dark backgrounds. The project's dark forest backgrounds (`--color-forest-900`, `--color-forest-950`) are ideal.

**CSS approach:**
```css
.neucadia-footer {
  width: 100%;
  padding: 1rem;
  background-color: var(--color-forest-950);
  border-top: 1px solid var(--color-forest-700);
  display: flex;
  justify-content: center;
  align-items: center;
}

.neucadia-link {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  text-decoration: none;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.neucadia-link:hover {
  opacity: 1;
}

.neucadia-text {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-cream-200);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.neucadia-logo {
  display: block;
  height: 21px;
  width: 142px;
}

@media (prefers-reduced-motion: reduce) {
  .neucadia-link {
    transition: none;
  }
}
```

### Pattern 3: BaseLayout placement for NeucadiaFooter

**What:** Add `<NeucadiaFooter />` to `BaseLayout.astro` immediately before the closing `</main>` tag. This ensures it appears at the bottom of every page using this layout.

**Current BaseLayout structure (relevant section):**
```html
<main>
  <slot />
  <!-- ADD: <NeucadiaFooter /> here -->
</main>
```

**Why inside `<main>` vs after:** The existing structure closes `</main>` before `</body>`. The footer can go inside `<main>` or as a sibling `<footer>` element. Since this is a brand attribution line rather than a site-navigation footer, placing it inside `<main>` (after `<slot />`) is acceptable. Alternatively, replace `</main>` + add a `<footer>` at body level for semantic correctness.

**Semantic HTML recommendation:** Use a proper `<footer>` element at `<body>` level for semantic correctness. Edit BaseLayout to close `<main>` before `<NeucadiaFooter />`:
```html
<main>
  <slot />
</main>
<NeucadiaFooter />
```

This is semantically cleaner — the brand footer is not "main content."

### Pattern 4: index.astro wiring for RideEthos

**Current index.astro order (relevant lines):**
```astro
<HeroSection />
<StickyNav />

<section class="gold-section w-full py-16">   <!-- DonateCallout -->
```

**After Phase 46:**
```astro
<HeroSection />
<StickyNav />
<RideEthos />  <!-- ETHOS-02: between StickyNav and gold DonateCallout -->

<section class="gold-section w-full py-16">   <!-- DonateCallout -->
```

No changes to the StickyNav, gold-section, or any other existing component needed.

### Anti-Patterns to Avoid

- **Modifying `global.css @theme static`:** Phase 47 constraint prohibits adding new global tokens. Use inline values or extend existing tokens in scoped component styles.
- **Adding `data-reveal` to RideEthos or NeucadiaFooter:** The gold-section (the section immediately after RideEthos) does NOT use `data-reveal` — it's always visible. RideEthos should also be always-visible since it's near the top of the page. NeucadiaFooter is at the very bottom and would be invisible until scrolled if `data-reveal` started at opacity:0.
- **Using `target="_blank"` without `rel="noopener noreferrer"`:** Project convention (DonateCallout.astro line 12) is always pair these together.
- **Using Astro `<Image>` component for the Neucadia logo:** The project does not use `src/assets/` for images; all static assets go in `public/images/`. Using `<Image>` would require moving the file and changes to the pipeline.
- **Referencing the logo from an external URL:** FOOT-02 explicitly requires a local asset. Even if the external URL is stable, the requirement is local.
- **Omitting `width` and `height` on the logo `<img>`:** Without explicit dimensions, the browser cannot reserve layout space, causing CLS (Cumulative Layout Shift).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Logo serving | Custom server route or import | Static `/public/images/neucadia-logo.png` | Astro serves public/ at root automatically; zero config needed |
| CLS prevention | JS-based size reservation | `width`/`height` HTML attributes | Browser-native, zero JS, works before paint |
| External link safety | Custom JS handler | `rel="noopener noreferrer"` attribute | HTML attribute, no JS needed |
| Dark background logo tinting | CSS filter | Use the logo as-is (RGBA PNG designed for dark bg) | The Neucadia logo is pre-designed for dark backgrounds; no filter needed |

**Key insight:** Both components are pure HTML + CSS. The only "work" in this phase is writing the components and downloading the logo PNG.

---

## Common Pitfalls

### Pitfall 1: Logo appears washed out or invisible on dark background

**What goes wrong:** The Neucadia logo PNG is a white/light wordmark with a navy "N" on a transparent background. If placed on a light background it would be nearly invisible. But the project's backgrounds are dark forest green — this is actually fine.

**Why it happens:** Confusion about which color the logo is designed for.

**How to avoid:** The logo IS designed for dark backgrounds. Use it as-is on `--color-forest-950` or `--color-forest-900`. Do not add CSS filter or invert it.

**Warning signs:** Logo appears invisible or very faint — this would only happen if placed on a light background (not a concern for this project's dark theme).

### Pitfall 2: CLS from logo without explicit dimensions

**What goes wrong:** Without `width` and `height` on the `<img>`, the browser doesn't know the image's aspect ratio until it loads. This causes layout shift (content jumps down after the image loads).

**Why it happens:** Missing HTML attributes prevent browser from reserving space.

**How to avoid:** Always include `width="142" height="21"` (or whatever display dimensions are chosen). These match the PNG's native 283×42 at 50% scale.

**Warning signs:** Content below the footer jumps when the logo image loads.

### Pitfall 3: RideEthos "kicker" text accidentally matching h1/h2 global styles

**What goes wrong:** Global CSS in `@layer base` applies `font-family: var(--font-display)` and `color: var(--color-amber-500)` to `h1, h2, h3, h4`. If the ethos values are marked as headings, they automatically get `text-shadow: var(--shadow-text)` which may not be desired.

**Why it happens:** Project global heading styles are opinionated.

**How to avoid:** Use `<span>` elements with explicit class-based styling instead of heading elements for the ethos value text. The ethos block itself can use an `aria-label` or a visually-hidden heading for screen reader context if needed.

### Pitfall 4: NeucadiaFooter inside `<main>` vs as `<footer>` sibling

**What goes wrong:** If placed inside `<main>`, screen readers and landmark navigation treat it as main content, not a site footer. Some accessibility tools specifically navigate to `<footer>` elements.

**Why it happens:** BaseLayout currently closes `</main>` at the end. Inserting before `</main>` puts the footer inside main content.

**How to avoid:** Restructure BaseLayout slightly: close `</main>` before the import, then add `<NeucadiaFooter />` as a `<footer>` element at body level. The `NeucadiaFooter.astro` component should use `<footer>` as its root element.

### Pitfall 5: Ethos section text not accessible at small sizes

**What goes wrong:** The ethos label text uses `--font-size-xs` (0.75rem). At browser default 16px that's 12px — technically allowed by WCAG but borderline. The text is informational, not interactive, so AA large text doesn't apply.

**Why it happens:** Design preference for compact labels.

**How to avoid:** The label text uses `--color-cream-200` (#e8e0d0) on `--color-forest-900` (#1a2e1a). Calculate contrast ratio: approximately 10:1 — passes WCAG AA and AAA even at small sizes. This is safe.

### Pitfall 6: Phase 47 constraint violation — modifying `@theme static`

**What goes wrong:** Adding new color or spacing tokens to `global.css @theme static` would conflict with Phase 47's planned light-mode CSS (scoped to `.hiawatha-section` only).

**Why it happens:** Temptation to add a new semantic token like `--color-ethos-value`.

**How to avoid:** Use existing tokens only. `--color-amber-500`, `--color-cream-200`, `--font-display`, `--font-mono`, `--font-size-2xl`, `--font-size-xs` are all already defined. No new @theme additions needed.

---

## Code Examples

### RideEthos.astro — complete component

```astro
---
// RideEthos.astro
// ETHOS-01, ETHOS-02, ETHOS-03
// Compact declarative statement block: founding date, free, fellowship, all levels
// Positioned in index.astro between <StickyNav /> and .gold-section (DonateCallout)
---

<section class="ride-ethos" aria-label="About this ride">
  <div class="ethos-inner">
    <ul class="ethos-list">
      <li class="ethos-item">
        <span class="ethos-value">Since 2014</span>
        <span class="ethos-label">Founded June 7, 2014</span>
      </li>
      <li class="ethos-item">
        <span class="ethos-value">Always Free</span>
        <span class="ethos-label">No entry fee, ever</span>
      </li>
      <li class="ethos-item">
        <span class="ethos-value">Fellowship</span>
        <span class="ethos-label">Not a race</span>
      </li>
      <li class="ethos-item">
        <span class="ethos-value">All Levels</span>
        <span class="ethos-label">50K · 100K · 100 Miles</span>
      </li>
    </ul>
  </div>
</section>

<style>
  .ride-ethos {
    background-color: var(--color-forest-900);
    border-top: 1px solid var(--color-forest-700);
    border-bottom: 1px solid var(--color-forest-700);
    padding: 2rem 1rem;
  }

  .ethos-inner {
    max-width: 64rem;
    margin: 0 auto;
  }

  .ethos-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.5rem 3rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .ethos-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .ethos-value {
    font-family: var(--font-display);
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-amber-500);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    line-height: 1.2;
  }

  .ethos-label {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--color-cream-200);
    letter-spacing: 0.06em;
    margin-top: 0.25rem;
  }

  @media (max-width: 480px) {
    .ethos-list {
      gap: 1.25rem 2rem;
    }
    .ethos-value {
      font-size: var(--font-size-xl);
    }
  }
</style>
```

### NeucadiaFooter.astro — complete component

```astro
---
// NeucadiaFooter.astro
// FOOT-01, FOOT-02
// "Powered by Neucadia" full-width footer line with local logo asset
// Logo: /public/images/neucadia-logo.png (283x42 RGBA PNG, dark-bg logo)
// Displayed at 142x21 (50% scale) with explicit dimensions for CLS prevention
---

<footer class="neucadia-footer">
  <a
    href="https://neucadia.com"
    target="_blank"
    rel="noopener noreferrer"
    class="neucadia-link"
    aria-label="Powered by Neucadia (opens in new tab)"
  >
    <span class="neucadia-text">Powered by</span>
    <img
      src="/images/neucadia-logo.png"
      alt="Neucadia"
      width="142"
      height="21"
      loading="lazy"
      decoding="async"
      class="neucadia-logo"
    />
  </a>
</footer>

<style>
  .neucadia-footer {
    width: 100%;
    padding: 0.875rem 1rem;
    background-color: var(--color-forest-950);
    border-top: 1px solid var(--color-forest-700);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .neucadia-link {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    text-decoration: none;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .neucadia-link:hover {
    opacity: 1;
  }

  .neucadia-text {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--color-cream-200);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .neucadia-logo {
    display: block;
    height: 21px;
    width: 142px;
  }

  @media (prefers-reduced-motion: reduce) {
    .neucadia-link {
      transition: none;
    }
  }
</style>
```

### BaseLayout.astro wiring (structural change)

```astro
<!-- BEFORE -->
<main>
  <slot />
</main>

<!-- AFTER (semantic: footer is body-level, not inside main) -->
<main>
  <slot />
</main>
<NeucadiaFooter />
```

Add import at the top of BaseLayout.astro frontmatter:
```astro
import NeucadiaFooter from '../components/NeucadiaFooter.astro';
```

### index.astro wiring (RideEthos insertion)

```astro
import RideEthos from '../components/RideEthos.astro';

<!-- in template -->
<HeroSection />
<StickyNav />
<RideEthos />   {/* ETHOS-02: before gold-section DonateCallout */}

<section class="gold-section w-full py-16">
  ...
```

### Logo download step (FOOT-02)

The logo must be copied to the project before running dev/build:

```bash
curl -o /Users/Sheppardjm/Repos/hiawathasRevenge/public/images/neucadia-logo.png \
  https://neucadia.com/assets/neucadia_logo.png
```

The file has already been fetched and confirmed as a valid 283×42 RGBA PNG (5.1KB).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Layout shift from unsized images | `width`/`height` on `<img>` | HTML spec; standard since 2020 browser improvements | Browser reserves space before image loads; zero CLS |
| `<img>` with external logo URL | Local asset in `/public/` | Project requirement FOOT-02 | No dependency on external server; works offline/in preview |
| Global heading styles for large display text | Class-based `<span>` elements | Project convention for non-heading large text | Avoids inheriting unwanted `text-shadow` and heading semantics |

**Deprecated/outdated:**
- Hosting brand logos from external CDN without local copy: Eliminated per FOOT-02 requirement.
- Using `::before`/`::after` for "Powered by" text: Simpler with explicit DOM — better for screen readers.

---

## Open Questions

1. **Exact ethos copy for each kicker value/label**
   - What we know: Requirements specify four facts — founding date (June 7, 2014), always free, fellowship over competition, all levels welcome
   - What's unclear: Whether to be minimal ("Always Free" / "No entry fee, ever") or more narrative. The planner/implementer should decide the exact wording.
   - Recommendation: Keep values short (1-3 words), labels ultra-compact (4-7 words). The example copy above is a reasonable starting point.

2. **RideEthos background color — match page or differentiate?**
   - What we know: ETHOS-03 says "visually distinct from body text" in terms of typography, not necessarily background. The section's visual distinction comes from font, size, and color.
   - What's unclear: Whether a different background (e.g., `--color-forest-800` or a subtle separator pattern) would help it stand out more from the surrounding sections.
   - Recommendation: Use `--color-forest-900` (page default) with top/bottom `border: 1px solid --color-forest-700` as a subtle separator. Keeps it visually connected to the page while distinct from the gold-section immediately below.

3. **NeucadiaFooter display size of logo**
   - What we know: Native PNG is 283×42. At 50% scale: 142×21. At full scale: 283×42.
   - What's unclear: What display size looks right in context of a "single line" footer.
   - Recommendation: 142×21 (50%) for normal screens, with CSS `height: auto` and `max-width: 100%` as safety. Could use `srcset` for 2x retina, but that's overkill for a footer logo this size.

---

## Sources

### Primary (HIGH confidence)

- Codebase inspection: `src/pages/index.astro` — exact component ordering, gold-section placement, existing footer credits section (lines 27-115)
- Codebase inspection: `src/layouts/BaseLayout.astro` — `<main><slot /></main>` structure, no existing `<footer>` element
- Codebase inspection: `src/styles/global.css` — full `@theme static` token inventory, font families, color palette
- Codebase inspection: `src/components/DonateCallout.astro` — external link pattern (`target="_blank" rel="noopener noreferrer"`)
- WebFetch: `https://neucadia.com/assets/neucadia_logo.png` — confirmed 283×42 RGBA PNG, 5.1KB, transparent background, white/navy wordmark

### Secondary (MEDIUM confidence)

- MDN: `width`/`height` attributes on `<img>` for CLS prevention — standard browser behavior since all major browsers updated aspect-ratio inference
- Visual inspection of fetched PNG: logo is white wordmark on transparent background, navy "N" initial, designed for dark backgrounds

### Tertiary (LOW confidence)

- None required — all findings verified from authoritative sources or direct file inspection.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all patterns from codebase inspection
- Architecture: HIGH — exact file paths, exact insertion points, exact DOM structure verified
- Pitfalls: HIGH — all verified against codebase patterns or direct asset inspection
- Code examples: HIGH — based on existing component patterns from the codebase; minor values (display size, padding) may be tuned during implementation

**Research date:** 2026-04-07
**Valid until:** 2026-10-07 (stable technology choices; logo URL stability is LOW confidence but moot since we're using a local copy)
