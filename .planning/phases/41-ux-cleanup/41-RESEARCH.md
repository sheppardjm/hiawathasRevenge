# Phase 41: UX Cleanup - Research

**Researched:** 2026-04-07
**Domain:** Astro component editing — inline HTML string manipulation, static section text
**Confidence:** HIGH

## Summary

Phase 41 is two independent surgical edits with no new dependencies, no new libraries, and no architectural changes. Both requirements are straightforward text/template deletions or additions in existing files.

**DL-01** targets a two-line `<section>` in `src/pages/index.astro` (lines 45–57). The GPX download area currently shows only a download button and a generic tagline ("Load this route onto your GPS device"). The requirement is to add guidance text directing users to the route selector (the pill bar inside the map) to pick an alternate route before downloading. The route selector lives inside `<RouteMap>` and dispatches a `route:change` event that the existing download script already handles — the selector is on the page, works, and is the correct mechanism.

**PNL-01** targets a single conditional expression inside `openPanel()` in `src/components/RouteMap.astro` (line 462–464). The "View in route guide ↓" button is generated as `jumpHtml` when `details.id` exists. The issue noted in `src/needs.md` ("View in route guide button doesn't work, remove") is that the RouteExplainer section (`#sector-520`, etc.) appears **above** the map on the page, making the down-arrow label misleading and the scroll-jump confusing. The fix is to delete the `jumpHtml` variable, its conditional, its injection into `innerHTML`, and the associated `addEventListener` click wiring. The CSS class `.panel-jump-link` should also be removed (it becomes dead code).

**Primary recommendation:** Two file edits only — `src/pages/index.astro` (add guidance text) and `src/components/RouteMap.astro` (delete jump link infrastructure). No data changes, no new dependencies, no new components.

## Standard Stack

No new libraries. This is pure Astro/HTML/JavaScript editing within the existing project stack.

### Core (existing, no changes needed)
| File | Role | What Changes |
|------|------|-------------|
| `src/pages/index.astro` | Page shell — owns GPX download section | Add one `<p>` guidance line in the download section |
| `src/components/RouteMap.astro` | Map + sector panel JS | Remove jump link variable, HTML injection, click listener, CSS |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Deleting jump link | Fixing the anchor scroll direction | Anchor IS functional (IDs match), but the "route guide" section is above the map — fixing requires rethinking page layout, which is out of scope |

**Installation:** None required.

## Architecture Patterns

### Pattern 1: GPX Download Section — Static HTML in index.astro
**What:** The GPX download section is a plain `<section>` block in `src/pages/index.astro` (lines 45–57). It contains an `<a id="gpx-download-link">` and a `<span>` tagline. The download button label and href are updated dynamically via the `route:change` event listener in the page's `<script>` block (lines 235–253).

**Current structure:**
```html
<section data-reveal class="bg-forest-800 w-full py-16">
  <div class="max-w-4xl mx-auto px-4 flex flex-col items-center gap-2">
    <a id="gpx-download-link" href="/Munising_Hiawatha_s_Revenge.gpx"
       download="HiawathasRevenge.gpx" class="gpx-download">
      Download GPX File
    </a>
    <span class="text-xs text-cream-200">Load this route onto your GPS device</span>
  </div>
</section>
```

**After DL-01:** Add a guidance note below the existing `<span>`. The note should explain that the route selector in the map below lets users switch to the 100K or 50K route before downloading. Keep wording concise — this is a `<p>` or `<span>` in `text-xs text-cream-200` to match existing style.

### Pattern 2: Panel Jump Link — Inline HTML String in RouteMap.astro
**What:** `openPanel()` assembles panel HTML from string interpolation. The jump link is built at line 462–464:

```javascript
const jumpHtml = details?.id
  ? `<a href="#${details.id}" class="panel-jump-link">View in route guide ↓</a>`
  : '';
```

It is injected at line 478 (`${jumpHtml}`) inside the `innerHTML` assignment, and the click listener is attached at lines 481–483:

```javascript
const jumpLink = panel.querySelector('.panel-jump-link');
if (jumpLink) jumpLink.addEventListener('click', () => closePanel(), { once: true });
```

**Removal scope for PNL-01:**
1. Delete the `jumpHtml` const declaration (lines 462–464)
2. Remove `${jumpHtml}` from the `innerHTML` template string (line 478)
3. Delete the `jumpLink` querySelector and `addEventListener` (lines 482–483)
4. Delete `.panel-jump-link` and `.panel-jump-link:hover` CSS rules (lines 169–179)

### Anti-Patterns to Avoid
- **Leaving dead CSS:** `.panel-jump-link` CSS must be removed along with the JS that generated elements using it — dead selectors create confusion for future maintainers.
- **Changing the Strava link:** PNL-01 is jump-link-only. The `stravaHtml` / `.panel-strava-link` is a separate link that remains untouched.
- **Altering download JS:** DL-01 only adds guidance text in the HTML. The existing `route:change` listener and the `gpx-download-link` element are correct and must not be changed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Route selector mention | Custom route-switcher UI in download section | Reference the existing route selector (pill bar in map) — it already works |

**Key insight:** Both fixes are deletions or small additions — zero new abstractions needed.

## Common Pitfalls

### Pitfall 1: Removing jumpHtml but leaving the click listener
**What goes wrong:** If `${jumpHtml}` is removed from innerHTML but the `jumpLink` querySelector block is left in, it silently degrades (querySelector returns null, the `if (jumpLink)` guard prevents a throw). It's harmless but leaves dead code.
**How to avoid:** Delete all three parts together: the `const jumpHtml`, its injection in innerHTML, and the `jumpLink` addEventListener block.

### Pitfall 2: DL-01 guidance text contradicts the existing tagline
**What goes wrong:** The existing tagline ("Load this route onto your GPS device") is generic and correct. Adding a second line that duplicates it or contradicts it creates confusion.
**How to avoid:** Keep the existing tagline; add the route-selector guidance as a separate, distinct sentence below it.

### Pitfall 3: Guidance text refers to a UI element the user can't see yet
**What goes wrong:** The download section appears on the page ABOVE the map section. Users reading the guidance text haven't seen the route selector yet.
**How to avoid:** Use forward-referencing language: "Use the route selector in the map below to switch to the 100K or 50K before downloading." The word "below" is accurate (map is lower on the page) and sets expectation.

### Pitfall 4: Editing sector-details.json or annotations.json
**What goes wrong:** PNL-01 has nothing to do with data files. The `details.id` field is used by the Strava link lookup as well — removing it from data would break stravaHtml generation.
**How to avoid:** Do not touch any `.json` data files. The fix is purely in the JS template inside RouteMap.astro.

## Code Examples

### DL-01: Guidance text addition
```html
<!-- Source: src/pages/index.astro, lines 45–57, after existing <span> -->
<span class="text-xs text-cream-200">Load this route onto your GPS device</span>
<p class="text-xs text-cream-200 text-center max-w-xs">
  Use the route selector in the map below to switch between 100 Mile, 100K, and 50K before downloading.
</p>
```

### PNL-01: Jump link removal — before
```javascript
// src/components/RouteMap.astro — openPanel(), lines 462–483
const jumpHtml = details?.id
  ? `<a href="#${details.id}" class="panel-jump-link">View in route guide ↓</a>`
  : '';

// ...inside innerHTML:
${jumpHtml}

// ...after innerHTML:
const jumpLink = panel.querySelector('.panel-jump-link');
if (jumpLink) jumpLink.addEventListener('click', () => closePanel(), { once: true });
```

### PNL-01: Jump link removal — after
```javascript
// jumpHtml variable: deleted entirely
// ${jumpHtml} in innerHTML: deleted
// jumpLink querySelector block: deleted
```

### PNL-01: CSS removal
```css
/* Delete these rules from RouteMap.astro <style> block (lines 169–179) */
.panel-jump-link {
  display: block;
  color: var(--color-lake-400);
  font-size: 0.85rem;
  text-decoration: none;
  margin-top: 4px;
}
.panel-jump-link:hover {
  text-decoration: underline;
}
```

## State of the Art

No library changes. All patterns are internal to the existing codebase.

| Element | Current State | After Phase 41 |
|---------|---------------|----------------|
| GPX download tagline | "Load this route onto your GPS device" | Same + route selector guidance below |
| Panel jump link | Generated when `details.id` exists; always broken (scroll direction) | Removed entirely |
| `.panel-jump-link` CSS | Present | Deleted |

## Open Questions

1. **Guidance text wording**
   - What we know: The route selector pill bar is inside the map, below the download section on the page.
   - What's unclear: Exact preferred wording is not specified in requirements. DL-01 says "directs users to route selector for alternate route downloads" — specific wording is at planner/implementer discretion.
   - Recommendation: Use something like "Use the route selector in the map below to switch between 100 Mile, 100K, and 50K routes before downloading." Keep it one sentence, match `text-xs text-cream-200` style.

2. **Success criteria scope: "all 7 sectors, all 3 routes"**
   - What we know: The jump link is generated inside `openPanel()` which is called for any sector on any route. A single code removal handles all 21 combinations (7 sectors × 3 routes).
   - What's unclear: Nothing — the fix is in one place.
   - Recommendation: Verify by opening the panel for at least one sector on each of the 3 routes after the edit.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `src/pages/index.astro` lines 45–57, 235–253
- Direct codebase inspection — `src/components/RouteMap.astro` lines 157–179, 462–483
- Direct codebase inspection — `src/components/RouteExplainer.astro` lines 15–23, 40
- Direct codebase inspection — `src/components/segments.json` (sector names)
- Direct codebase inspection — `public/data/sector-details.json` (id field structure)
- Direct codebase inspection — `public/data/routes.json` (3 routes confirmed)
- `src/needs.md` line 33: "View in route guide button doesn't work, remove"

### Secondary (MEDIUM confidence)
- None required — all findings are from direct code inspection

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; pure text editing in known files
- Architecture: HIGH — both change locations pinpointed with exact line numbers
- Pitfalls: HIGH — all identified from direct code inspection, not speculation

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable codebase; no external dependencies)
