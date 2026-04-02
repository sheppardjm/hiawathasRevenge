# Phase 27: Audit Gap Closure - Research

**Researched:** 2026-04-02
**Domain:** Astro font loading API, HTML dialog affordances, RouteMap.astro tech debt
**Confidence:** HIGH — all findings verified against live source files

## Summary

Phase 27 has three distinct work areas: a one-line font fix (VIS-02), a decision-plus-documentation task for the panel close affordance (MAP-08), and three tech debt cleanups in RouteMap.astro. The work is small and surgical — no new libraries, no architecture changes, no data pipeline involvement.

**VIS-02** is a true one-liner: `<Font cssVariable="--font-garamond" />` is missing from `BaseLayout.astro`. The font is already configured in `astro.config.ts` and the CSS references it correctly; only the `<Font>` component tag in `<head>` is absent. Adding it will immediately cause EB Garamond to load and `::first-letter` drop-caps to render in the correct typeface.

**MAP-08** requires a decision. The audit flagged the click-outside affordance as partial, but a document-level click handler was already added during Phase 25 execution (commit `f12d9c5`). That handler closes the panel for non-Leaflet clicks but intentionally excludes clicks on Leaflet interactive elements (`.leaflet-interactive`) to preserve map interactivity. Whether MAP-08 is satisfied depends on the interpretation of "click outside": if it means any click outside the panel element, the handler is incomplete for map-area clicks; if it means non-map clicks outside the panel, it is already fully implemented. The planner must choose: satisfy the full requirement via an overlay approach, or document the trade-off as an intentional product decision.

**Primary recommendation:** For MAP-08, choose the documented trade-off (Option B). Map interactivity while the panel is open is a deliberate product feature. The existing document-click handler already closes on non-map clicks outside the panel. Document the decision in a code comment and update the audit. For VIS-02 and all three tech debt items, make the straightforward fixes.

## Standard Stack

No new libraries are required. This phase operates entirely within the existing stack.

### Core (already installed)
| Tool | Version | Purpose |
|------|---------|---------|
| Astro | 6.1.2 | Framework — `Font` component from `astro:assets` |
| `astro.config.ts` | — | Font provider configuration (EB Garamond already declared here) |
| `BaseLayout.astro` | — | Layout that provides `<head>` — where the `<Font>` tag must be added |
| `RouteMap.astro` | — | All tech debt items live here |

### No Installation Required

```bash
# Nothing to install — all tools are already in the project
```

## Architecture Patterns

### Pattern 1: Astro Font Component

**What:** The `Font` component from `astro:assets` injects a `<style>` block with `@font-face` rules and optional `<link rel="preload">` tags. It reads config from the `fonts[]` array in `astro.config.ts` keyed by `cssVariable`. If a `cssVariable` is declared in config but the `<Font>` tag is not placed in `<head>`, the font never loads.

**Verified in:** `/Users/Sheppardjm/Repos/hiawathasRevenge/node_modules/astro/components/Font.astro`

```astro
<!-- Signature (from node_modules/astro/components/Font.astro) -->
interface Props {
  cssVariable: CssVariable;   // matches cssVariable in astro.config.ts fonts[]
  preload?: FontPreloadFilter; // defaults to false if omitted
}
```

**Correct fix for VIS-02:**

```astro
<!-- In BaseLayout.astro <head>, alongside existing Font tags -->
<Font cssVariable="--font-space-mono" preload />
<Font cssVariable="--font-national-park" preload />
<Font cssVariable="--font-garamond" />   <!-- no preload — drop-caps are below fold -->
```

**Why no `preload` for Garamond:** `preload` emits `<link rel="preload">` tags that add to critical-path weight. Space Mono and National Park are used for body text and headings (above fold, first paint). EB Garamond is used only for `::first-letter` drop-caps in HiawathaExplainer.astro — always below the fold. Omitting `preload` is correct; the font will still load as a non-blocking resource.

### Pattern 2: HTML Dialog Non-Modal Close Affordances

**What:** `dialog.show()` (non-modal) does not produce a native `::backdrop`. The native Escape key handling is also absent. The project already implements all three close affordances manually:

| Affordance | Implementation | Status |
|-----------|---------------|--------|
| X button | `panel.querySelector('.sector-panel__close').addEventListener('click', closePanel)` | Working |
| Escape key | `window.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.open) closePanel() })` | Working |
| Click outside | `document.addEventListener('click', e => { if (panel.open && !panel.contains(e.target) && !e.target.closest('.leaflet-interactive')) closePanel() })` | Partially working |

**The click-outside gap:** The document handler (added in commit `f12d9c5`) excludes clicks on `.leaflet-interactive` elements. This means clicking map tiles, sectors, or markers while the panel is open does NOT close the panel. Clicks on non-map areas (page header, other sections below/above map) DO close the panel.

**Two legitimate options:**

**Option A — Full click-outside (transparent overlay):**
```javascript
// Add a transparent div behind the panel, above the map
const backdrop = document.createElement('div');
backdrop.style.cssText = 'position:fixed;inset:0;z-index:999;background:transparent;';
backdrop.addEventListener('click', closePanel);
// Show backdrop when opening panel, hide when closing
```
- Advantage: Satisfies MAP-08 strictly — any click outside panel closes it
- Disadvantage: Map becomes non-interactive while panel is open (clicking map closes panel instead of interacting with map)

**Option B — Document the trade-off (current approach):**
- Non-map clicks outside panel close it (page header, sections, etc.)
- Map-area clicks do NOT close panel — map stays fully interactive
- Update the comment in code and the audit to reflect this as a deliberate decision
- This means MAP-08 is "satisfied with documented exception" rather than "partial"

**Recommendation:** Option B. Map interactivity while panel is open is the core reason `dialog.show()` (non-modal) was chosen over `showModal()`. Closing the panel on map-area clicks would undermine that choice. The behavior is reasonable UX: X button and Escape are always available.

### Pattern 3: Tech Debt Cleanup in RouteMap.astro

Three discrete items, all in `/Users/Sheppardjm/Repos/hiawathasRevenge/src/components/RouteMap.astro`:

**Item 1 — Stale comment (line 482):**
```javascript
// Current (stale):
// Build panel body — minimal content; Plan 25-02 adds full buildPanelBody() with sparkline

// Replace with (accurate):
// Build panel body — stars, meta, sparkline, description, strava link, jump link
```

**Item 2 — Dead `::backdrop` CSS (lines 133-135):**
```css
/* Remove this entire block: */
/* Panel backdrop — native dialog ::backdrop (only renders with showModal(), dead code with show()) */
.sector-panel::backdrop {
  background: rgba(0, 0, 0, 0.3);
}
```
The comment already says it's dead code. Remove the rule entirely (3 lines).

**Item 3 — NF2217 display name mismatch:**
- Panel (from `sector-details.json`): shows `"NF2217"`
- Segment card (from `RouteExplainer.astro` `SEGMENTS` const): shows `"NF2217-2218"`
- File: `/Users/Sheppardjm/Repos/hiawathasRevenge/src/components/RouteExplainer.astro` line 21
- File: `/Users/Sheppardjm/Repos/hiawathasRevenge/public/data/sector-details.json`
- Decision needed: which name is canonical? Both refer to the same sector (Forest Road 2217 to 2218). "NF2217-2218" is more descriptive (covers both roads); "NF2217" is the shorter form. Recommend updating `sector-details.json` `name` field to `"NF2217-2218"` to match the card, since the card is user-facing prose.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Font loading | Custom `@font-face` CSS | Astro `<Font>` component (already in use for other fonts) |
| Dialog backdrop | Custom backdrop element (unless choosing Option A) | Document-level click listener (already implemented) |

## Common Pitfalls

### Pitfall 1: Adding `preload` to EB Garamond Font Tag

**What goes wrong:** Adding `preload` causes the browser to fetch the font file during initial page load, adding to critical-path weight for an asset that's only used below the fold.
**Why it happens:** The existing Space Mono and National Park `<Font>` tags both have `preload` — it's tempting to copy the pattern.
**How to avoid:** Omit `preload` for EB Garamond. The `<Font>` tag without `preload` still injects the `@font-face` CSS so the font loads when the `::first-letter` pseudo-element is first encountered.

### Pitfall 2: Choosing Option A (Overlay) Without Considering Map UX

**What goes wrong:** Implementing a transparent overlay closes the panel on map clicks, making the map non-interactive while the panel is open — the exact scenario `dialog.show()` was chosen to avoid.
**Why it happens:** Option A looks like a "full fix" for MAP-08.
**How to avoid:** If Option A is chosen, the overlay must be carefully scoped to NOT cover the map container. This requires knowing the map DOM structure at runtime, which is fragile. Option B is safer.

### Pitfall 3: Updating Only One Location for NF2217 Name

**What goes wrong:** Updating `sector-details.json` but not `RouteExplainer.astro` SEGMENTS const (or vice versa).
**Why it happens:** The name exists in two places with different data shapes.
**How to avoid:** The `SEGMENTS` const in RouteExplainer.astro line 21 and `sector-details.json` must both be updated. The jump-link mapping (`'NF2217-2218': 'sector-nf2217'`) on line 39 of RouteExplainer.astro must also stay consistent with the SEGMENTS name.

### Pitfall 4: Removing `::backdrop` Breaks Something

**What goes wrong:** The `::backdrop` CSS rule is truly dead code with `dialog.show()`, but removing it could theoretically affect if someone switches to `showModal()` in the future.
**Why it happens:** The rule is commented as dead but is still "documentation" for future behavior.
**How to avoid:** Remove it cleanly. It's dead code per the audit, and its presence causes confusion. If `showModal()` is ever used in the future, the `::backdrop` can be re-added at that time.

## Code Examples

### VIS-02 Fix

```astro
<!-- src/layouts/BaseLayout.astro — add line after existing Font tags -->
<Font cssVariable="--font-space-mono" preload />
<Font cssVariable="--font-national-park" preload />
<Font cssVariable="--font-garamond" />
```

Source: verified against `/Users/Sheppardjm/Repos/hiawathasRevenge/node_modules/astro/components/Font.astro` (line 7-11 Props interface).

### MAP-08 Option B — Updated Comment

```javascript
// Click outside panel to close — dialog.show() (non-modal) has no native backdrop.
// Excludes .leaflet-interactive clicks intentionally: map stays fully interactive while panel is open.
// This is the deliberate trade-off for choosing show() over showModal().
// Non-map clicks outside the panel (page header, other sections) do close the panel.
document.addEventListener('click', (e) => {
  if (panel.open && !panel.contains(e.target) && !e.target.closest('.leaflet-interactive')) {
    closePanel();
  }
});
```

### NF2217 Name Fix (if Option: align to "NF2217-2218")

```json
// public/data/sector-details.json — update name field
{
  "id": "sector-nf2217",
  "name": "NF2217-2218",   // was "NF2217"
  ...
}
```

```javascript
// src/components/RouteExplainer.astro — no change needed to SEGMENTS const
// 'NF2217-2218' in SEGMENTS already matches the proposed canonical name
// Jump-link mapping 'NF2217-2218': 'sector-nf2217' on line 39 already correct
```

## Key Files

| File | Relevance |
|------|-----------|
| `/Users/Sheppardjm/Repos/hiawathasRevenge/src/layouts/BaseLayout.astro` | VIS-02 fix target (add `<Font>` tag line 25) |
| `/Users/Sheppardjm/Repos/hiawathasRevenge/astro.config.ts` | Font config reference — EB Garamond declared at lines 22-27, no changes needed |
| `/Users/Sheppardjm/Repos/hiawathasRevenge/src/components/RouteMap.astro` | All MAP-08 and tech debt work |
| `/Users/Sheppardjm/Repos/hiawathasRevenge/public/data/sector-details.json` | NF2217 name fix |
| `/Users/Sheppardjm/Repos/hiawathasRevenge/src/components/RouteExplainer.astro` | NF2217 name reference (already "NF2217-2218") |
| `/Users/Sheppardjm/Repos/hiawathasRevenge/src/components/HiawathaExplainer.astro` | Drop-cap CSS uses `var(--font-garamond)` — will work once font loads |

## State of the Art

| Topic | Current State | Finding |
|-------|--------------|---------|
| Astro Font component | Astro 6.1.2 | `<Font cssVariable preload? />` from `astro:assets` — verified from node_modules |
| EB Garamond font provider | Google Fonts | Already configured in `astro.config.ts` with `fontProviders.google()` — no change needed |
| HTML dialog non-modal | Browser native | `dialog.show()` produces no `::backdrop` — well-established behavior |
| MAP-08 click-outside handler | Already implemented | `document.addEventListener` with `.leaflet-interactive` exclusion added in commit `f12d9c5` |

## Open Questions

1. **NF2217 canonical name: "NF2217" or "NF2217-2218"?**
   - What we know: panel shows "NF2217" (from sector-details.json), card shows "NF2217-2218" (RouteExplainer SEGMENTS)
   - What's unclear: which reflects the actual road name in Hiawatha National Forest? Forest Road 2217 connects to 2218 — the combined designation "NF2217-2218" is more accurate for the full sector.
   - Recommendation: Update `sector-details.json` to `"NF2217-2218"` to match the card. No other file changes needed since the jump-link mapping key is already `'NF2217-2218'`.

2. **MAP-08 decision scope: does "click outside" include map-area clicks?**
   - What we know: X button and Escape work; non-map clicks outside panel work; map-area clicks do not close panel
   - What's unclear: the original requirement "click outside" is ambiguous about whether map-area is "outside"
   - Recommendation: Document as intentional trade-off (Option B). The audit's success criteria explicitly provides this as a valid resolution: "OR a documented decision exists."

## Sources

### Primary (HIGH confidence)
- `/Users/Sheppardjm/Repos/hiawathasRevenge/node_modules/astro/components/Font.astro` — verified Font component Props interface and behavior
- `/Users/Sheppardjm/Repos/hiawathasRevenge/src/layouts/BaseLayout.astro` — confirmed existing Font tags and missing EB Garamond tag
- `/Users/Sheppardjm/Repos/hiawathasRevenge/astro.config.ts` — confirmed EB Garamond already in fonts[] config
- `/Users/Sheppardjm/Repos/hiawathasRevenge/src/components/RouteMap.astro` — confirmed all three tech debt items and current click-outside handler
- `/Users/Sheppardjm/Repos/hiawathasRevenge/.planning/v1.3-MILESTONE-AUDIT.md` — authoritative gap definitions
- `git log` — confirmed click-outside fix (commit `f12d9c5`) was applied during Phase 25 execution, before the audit was filed

### Secondary (MEDIUM confidence)
- `/Users/Sheppardjm/Repos/hiawathasRevenge/public/data/sector-details.json` — NF2217 name field verified
- `/Users/Sheppardjm/Repos/hiawathasRevenge/src/components/RouteExplainer.astro` — NF2217-2218 in SEGMENTS const and jump-link mapping verified

## Metadata

**Confidence breakdown:**
- VIS-02 fix: HIGH — one-line fix, verified against Font component source and existing usage pattern
- MAP-08 analysis: HIGH — current handler behavior verified from source; decision is product/UX call
- Tech debt items: HIGH — all three verified to exist exactly as described by the audit

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable — no fast-moving library concerns)
