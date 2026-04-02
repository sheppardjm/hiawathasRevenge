# Technology Stack: Map Interactivity Milestone

**Project:** Hiawatha's Revenge — Map Interactivity (sector labels, clickable panels)
**Researched:** 2026-04-02
**Scope:** Stack additions for sector labels on map, clickable sector polylines opening slide-out detail panels, responsive right-panel (desktop) / bottom-sheet (mobile) pattern
**Overall Confidence:** HIGH
**Core constraint:** Minimize new npm dependencies. No UI component libraries. Zero-JS approaches preferred where viable.

---

## Executive Summary

All three new features — sector labels, clickable sectors, and responsive panels — can be implemented with **zero new npm dependencies**. The existing Leaflet 1.9.4 API provides all necessary hooks (`bindTooltip`, `polyline.on('click')`, `L.DomEvent.stopPropagation`). The panel UI is vanilla HTML `<dialog>` + CSS transforms, which is now Baseline Widely Available (March 2022) and handles focus trapping, keyboard dismissal, and backdrop automatically. The one approach that would require a new dependency (leaflet-highlightable-layers) is optional and provides a meaningful UX improvement for touch targets on narrow polylines — its value should be evaluated against the "zero new deps" constraint.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Role | Why |
|------------|---------|------|-----|
| Leaflet | 1.9.4 (current stable) | Sector labels via `bindTooltip({permanent:true})` on non-interactive label markers; polyline click handlers | Already installed. All needed APIs (`bindTooltip`, `L.marker`, `polyline.on`) exist in 1.9.4. Do NOT upgrade to 2.0-alpha — it's pre-release, has breaking changes, and markercluster/gesture-handling plugins have not yet been updated to support it. |
| HTML `<dialog>` element | Native browser API (Baseline: March 2022) | Slide-out panel container. Provides modal semantics, `::backdrop`, focus trapping, Escape-key dismissal automatically. | No library needed. `showModal()` / `close()` are the entire JS surface area. The browser handles all accessibility boilerplate. |
| CSS `transform: translateX()` / `translateY()` | Native CSS | Slide-in from right (desktop), slide-up from bottom (mobile) | Hardware-accelerated. Does not trigger layout. Combined with `@starting-style` for entry animation (Baseline 2024, ~86% support — safe as progressive enhancement). |
| CSS `@media (max-width: ...)` | Native CSS | Switch dialog from right-panel to bottom-sheet at the mobile breakpoint | The same `<dialog>` element changes layout entirely via media query. No JS viewport detection needed. |

### Supporting Libraries (Optional — See Rationale)

| Library | npm Package | Version | Purpose | When to Add |
|---------|------------|---------|---------|------------|
| leaflet-highlightable-layers | `leaflet-highlightable-layers` | 2.x | Wider invisible click/touch target on thin polylines; z-index management for raised selected sector | Add ONLY IF user testing shows touch-click on narrow sector lines is unreliable. Provides transparent border around lines to increase hit area without visual change. |

---

## Detailed Approach by Feature

### Feature 1: Sector Labels on Map

**Approach: L.marker with L.divIcon, non-interactive, placed at sector midpoint**

Do NOT use `polyline.bindTooltip({permanent:true})`. The Leaflet issue tracker (issue #5758) documents that permanent tooltip positioning on polylines is inconsistent — tooltips anchor to the first point of the polyline's dataset rather than a geometric center, and the position drifts when the polyline shape is non-rectangular. There is no official fix; the issue was closed without a code change.

The correct approach:

1. **Calculate the geographic midpoint** of each sector using the midpoint index of its coordinate array: `sectorPts[Math.floor(sectorPts.length / 2)]`.
2. **Create a non-interactive `L.marker`** at that coordinate with `L.divIcon` containing the label HTML.
3. **Configure the marker as non-interactive** using `{interactive: false, keyboard: false, bubblingMouseEvents: false}` — this prevents the label from capturing click events that should go to the underlying polyline.

```javascript
// Sector label — placed at geographic midpoint of the sector polyline
const midPt = sectorPts[Math.floor(sectorPts.length / 2)];
const starRating = sector.difficulty === 'hard' ? '★★★★★'
  : sector.difficulty === 'moderate' ? '★★★'
  : '★★';

const labelIcon = L.divIcon({
  html: `<div class="sector-label">
    <span class="sector-label__name">${sector.name}</span>
    <span class="sector-label__stars">${starRating}</span>
  </div>`,
  className: '',         // Clears default white-box leaflet-div-icon styling
  iconSize: null,        // null = size driven by CSS content
  iconAnchor: [0, 0],   // Adjusted per label width in CSS
});

L.marker(midPt, {
  icon: labelIcon,
  interactive: false,   // Does not receive mouse events — clicks pass through to polyline
  keyboard: false,
  bubblingMouseEvents: false,
  zIndexOffset: -100,   // Below sector polylines so labels don't obstruct click target
}).addTo(map);
```

**Label CSS in `RouteMap.astro` `<style>` block:**

```css
:global(.sector-label) {
  background: var(--color-forest-900);
  color: var(--color-cream-100);
  border: 1px solid var(--color-forest-700);
  border-radius: 2px;
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;   /* Belt-and-suspenders: CSS also blocks mouse events */
  text-align: center;
}

:global(.sector-label__stars) {
  display: block;
  color: var(--color-amber-500);
  font-size: 0.5rem;
  letter-spacing: 1px;
}
```

**Why this over `bindTooltip`:** The marker approach gives full CSS control over appearance, correct positioning, and does not interfere with the underlying polyline's click events. The `interactive:false` marker passes all events through to the polyline below.

**Note on `zIndexOffset`:** Leaflet places labels in the `tooltipPane` (z-index 650) by default. Marker DivIcons go into `markerPane` (z-index 600). Using a negative `zIndexOffset` keeps labels visually below the polylines' SVG layer while keeping click events on polylines functional.

---

### Feature 2: Clickable Sector Polylines

**Approach: `polyline.on('click', handler)` with `L.DomEvent.stopPropagation`**

Leaflet polylines fire `click` events (inherited from `L.Path` via `L.Interactive Layer`). The event carries the `latlng` of the click and a reference to the layer.

Key pattern:

```javascript
const sectorPolyline = L.polyline(sectorPts, {
  color: colors.line,
  weight: 5,
  opacity: 0.85,
  interactive: true,    // Default true, but explicit for clarity
  bubblingMouseEvents: false, // Prevent click from also firing on the map
}).addTo(map);

sectorPolyline.on('click', (e) => {
  L.DomEvent.stopPropagation(e);  // Belt-and-suspenders with bubblingMouseEvents:false
  openSectorPanel(sector);
});

// Hover state: visual feedback before click
sectorPolyline.on('mouseover', () => {
  sectorPolyline.setStyle({ weight: 7, opacity: 1.0 });
});
sectorPolyline.on('mouseout', () => {
  sectorPolyline.setStyle({ weight: 5, opacity: 0.85 });
});
```

**`bubblingMouseEvents: false` is the critical setting.** Without it, a sector polyline click fires both `polyline.click` AND `map.click` simultaneously, which would clear any open panel if the map has a click listener.

**Touch events:** Leaflet 1.9.4 maps pointer/touch events to its own event model. The `click` event fires on both mouse click and tap on touch devices. No separate touch handler is needed.

**Hit area on narrow lines (5px weight):** On mobile, 5px is at the low end of reliable touch targets. If tap-to-select proves unreliable in testing, add `leaflet-highlightable-layers` which draws a transparent 20px-wide border around each polyline, expanding the hit area without visual change.

---

### Feature 3: Responsive Detail Panel (Right Slide-out / Bottom Sheet)

**Approach: Single `<dialog>` element with CSS-only responsive layout switch**

The HTML `<dialog>` element is the correct primitive. It provides:
- `showModal()` for modal behavior (backdrop, focus trap, Escape key close)
- `show()` for non-modal behavior (no backdrop, panel floats over map)
- `::backdrop` pseudo-element for the overlay tint
- Automatic focus management: focus moves to first focusable element on open, returns to trigger on close
- No JS focus-trap library needed

**Panel HTML structure (added to `RouteMap.astro` template, outside `<div id="map">`):**

```html
<dialog id="sector-panel" aria-label="Sector detail">
  <button id="sector-panel-close" aria-label="Close sector panel">
    <svg><!-- X icon --></svg>
  </button>
  <div id="sector-panel-content">
    <!-- Populated by JS on sector click -->
  </div>
</dialog>
```

**CSS for the panel — in `RouteMap.astro` `<style>` block:**

```css
/* ---------- Desktop: right slide-out panel ---------- */
:global(#sector-panel) {
  /* Override browser default centering */
  position: fixed;
  inset: 0 0 0 auto;   /* top:0, right:0, bottom:0, left:auto */
  margin: 0;
  padding: 1.5rem;
  width: min(400px, 90vw);
  max-height: 100dvh;
  height: 100dvh;
  overflow-y: auto;

  /* Appearance */
  background: var(--color-forest-900);
  color: var(--color-cream-100);
  border: none;
  border-left: 1px solid var(--color-forest-700);
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.5);

  /* Z-index: above Leaflet controls (z-index: 1000) */
  z-index: 1100;

  /* Slide-in transition */
  translate: 100% 0;
  transition: translate 0.25s ease-out,
              overlay 0.25s allow-discrete,
              display 0.25s allow-discrete;
}

:global(#sector-panel[open]) {
  translate: 0 0;

  /* @starting-style: defines pre-entry state so entry animation fires */
  @starting-style {
    translate: 100% 0;
  }
}

:global(#sector-panel::backdrop) {
  background: transparent;   /* Desktop: no dimming overlay — map stays visible */
}

/* ---------- Mobile: bottom sheet ---------- */
@media (max-width: 768px) {
  :global(#sector-panel) {
    inset: auto 0 0 0;   /* top:auto, right:0, bottom:0, left:0 */
    width: 100%;
    height: 60dvh;
    max-height: 85dvh;
    border-left: none;
    border-top: 1px solid var(--color-forest-700);
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.5);

    /* Bottom sheet slides up, not from right */
    translate: 0 100%;
  }

  :global(#sector-panel[open]) {
    translate: 0 0;

    @starting-style {
      translate: 0 100%;
    }
  }

  :global(#sector-panel::backdrop) {
    background: rgba(0, 0, 0, 0.4);  /* Mobile: dim backdrop helps separate sheet from map */
  }
}

/* prefers-reduced-motion: remove transitions, show panel immediately */
@media (prefers-reduced-motion: reduce) {
  :global(#sector-panel) {
    transition: none;
    translate: 0 0;
  }
}
```

**JS to open and close — in `RouteMap.astro` `<script>` block:**

```javascript
const panel = document.getElementById('sector-panel');
const panelContent = document.getElementById('sector-panel-content');
const panelClose = document.getElementById('sector-panel-close');

function openSectorPanel(sector) {
  panelContent.innerHTML = buildPanelHTML(sector);
  panel.showModal();  // showModal() enables ::backdrop and Escape key
}

panelClose.addEventListener('click', () => panel.close());

// Clicking the backdrop closes the panel (light-dismiss pattern)
panel.addEventListener('click', (e) => {
  if (e.target === panel) panel.close();
});
```

**`showModal()` vs `show()`:** Use `showModal()`. It creates the `::backdrop`, enables Escape-key close, and properly traps focus within the panel. The map remains scrollable and usable through the backdrop on desktop because `::backdrop` has `background: transparent` for desktop — the visual result is the panel slides in and the map stays accessible alongside it. On mobile, the backdrop dims the map, which signals to the user the sheet is modal.

**Z-index consideration:** Leaflet's map controls (`.leaflet-top`, `.leaflet-bottom`) have `z-index: 1000`. The panel CSS uses `z-index: 1100` to ensure it renders above map controls. However, elements in the top layer (created by `showModal()`) already exist outside the normal stacking context and do not require explicit z-index. The `z-index: 1100` is belt-and-suspenders for the `show()` (non-modal) fallback case.

---

### `@starting-style` Browser Support Note

`@starting-style` is **Baseline Newly Available** as of August 2024. Current support is approximately 86% (Chrome 117+, Edge 117+, Safari 17.5+, Firefox 129+).

For the 14% of browsers that do not support it, the entry animation simply does not occur — the panel appears instantly without sliding. This is an acceptable progressive enhancement because:
1. The panel content still appears correctly
2. The interaction is functional
3. Only the animation is missing

No polyfill or fallback is required.

---

## Installation

No new packages are needed for the baseline implementation.

```bash
# Optional: only if touch hit-area proves inadequate in testing
npm install leaflet-highlightable-layers
```

If `leaflet-highlightable-layers` is added, import it after the existing Leaflet import in `RouteMap.astro`:

```javascript
// After: const L = (await import('leaflet')).default;
const { HighlightablePolyline } = await import('leaflet-highlightable-layers');
// Replace L.polyline(...) with new HighlightablePolyline(...)
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Sector labels | `L.marker` + `L.divIcon` at midpoint | `polyline.bindTooltip({permanent:true})` | Tooltip positioning on polylines is documented-inconsistent (Leaflet issue #5758). Anchors to first point, not geometric center. No official fix. |
| Sector labels | `L.marker` + `L.divIcon` at midpoint | Leaflet.label plugin | Deprecated since Leaflet 1.0; replaced by `L.Tooltip` in core. Do not use. |
| Panel UI | Native `<dialog>` | Headless UI Dialog (React) | Project is Astro static site, not React. Headless UI requires React. |
| Panel UI | Native `<dialog>` | Alpine.js modal | Would add a ~15KB JS dependency for behavior that `dialog.showModal()` provides natively. |
| Panel UI | Native `<dialog>` | CSS-only checkbox toggle | Cannot handle focus trapping, keyboard navigation, or `::backdrop`. Poor accessibility. |
| Panel animation | CSS `translate` + `@starting-style` | GSAP / Web Animations API | 25KB+ for what CSS handles natively. No benefit for a single panel animation. |
| Hover highlight | `polyline.setStyle()` on `mouseover` | `leaflet-highlightable-layers` | `setStyle()` handles visual weight/opacity change at zero cost. Library is justified only for touch hit-area expansion, not basic hover highlight. |
| Map click handler | `bubblingMouseEvents: false` | `L.DomEvent.stopPropagation(e)` inside handler | Use both. `bubblingMouseEvents: false` prevents the event from reaching the map in the first place. `stopPropagation` is belt-and-suspenders for any edge case. |

---

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| **Leaflet 2.0-alpha** | Pre-release. `leaflet.markercluster` and `leaflet-gesture-handling` have not published alpha-compatible releases. Breaking changes in ESM API. The project's existing plugins were written against 1.x. Stay on 1.9.4 stable. |
| **Leaflet.label plugin** | Deprecated since Leaflet 1.0 (2016). `L.Tooltip` in core replaced it. The GitHub repo is archived. |
| **Leaflet popup for sector detail** | `L.popup` anchors to a map coordinate and has a tail/pointer. It moves with the map, closes on map click, and competes visually with the route. A fixed-position `<dialog>` is a better UX for a multi-field content panel. |
| **Bootstrap / Material-UI drawer** | Adds 30-100KB of JS+CSS for drawer behavior that `<dialog>` + 30 lines of CSS provides natively. |
| **React/Vue component libraries** | The project is Astro. All map code runs in vanilla `<script>` blocks. Adding a component framework for a panel would be a significant architectural change with no benefit. |
| **Popover API (`popover` attribute)** | The Popover API provides "light-dismiss" (click-outside-to-close) but does NOT create a true modal — it does not focus-trap. For a content panel with interactive elements (links, buttons), `<dialog showModal>` is the correct choice. |
| **`position: fixed` div (custom panel)** | Technically viable but requires manual implementation of every feature `<dialog>` provides for free: focus management, Escape key, backdrop, ARIA semantics. Strictly worse than the native element. |
| **iframes for sector detail** | No reason to use iframes for same-page content. |

---

## Version Compatibility Matrix

| Package | Current Version | Compatible With | Notes |
|---------|----------------|-----------------|-------|
| `leaflet` | 1.9.4 | All features described here | Do NOT upgrade to 2.0-alpha |
| `leaflet.markercluster` | 1.5.3 | Leaflet 1.9.4 | Unchanged. No conflict with new sector label markers. |
| `leaflet-gesture-handling` | 1.2.2 | Leaflet 1.9.4 | Unchanged. |
| `leaflet-highlightable-layers` | 2.x (if added) | Leaflet 1.9.4 | ES module only (v2+). Compatible with Vite 7 + Astro 6 dynamic import. |
| HTML `<dialog>` | Native | Chrome 37+, Firefox 98+, Safari 15.4+ | Baseline Widely Available since March 2022. No polyfill needed. |
| CSS `@starting-style` | Native | Chrome 117+, Firefox 129+, Safari 17.5+ | Baseline Newly Available August 2024. ~86% support. Progressive enhancement — no polyfill needed. |
| CSS `translate` property | Native | Chrome 104+, Firefox 103+, Safari 14.1+ | Separate from `transform: translate()`. Baseline Widely Available. |

---

## Integration Points with Existing Stack

**RouteMap.astro changes required:**

1. Add `<dialog id="sector-panel">` to the Astro template (outside `<div id="map">`, inside the same component)
2. In `initMap()`, after the sector polyline loop, attach `click`/`mouseover`/`mouseout` handlers and create label markers
3. In `initMap()`, add a `buildPanelHTML(sector)` function that assembles the panel's inner content from the `sector` object (name, difficulty, length, elevation data)
4. Add panel CSS to the `<style>` block (`:global()` wrappers required since Leaflet renders into a separate DOM scope)
5. Add panel JS after the `initMap()` function definition (panel open/close does not require the Leaflet object)

**CustomEvent bus:** No new events needed. The existing `elevation:hover` and `map:photoClick` pattern can be extended if the panel needs to sync the elevation chart to the selected sector, but that is out of scope for this milestone.

**CSS layer ordering:** Panel CSS goes in the `components` layer (currently implicit). The Leaflet controls `z-index: 1000` is overridden by the `<dialog>` top layer (for `showModal()`) automatically, so explicit z-index is only needed if non-modal `show()` is ever used instead.

**IntersectionObserver lazy init:** Panel HTML and JS are part of `RouteMap.astro`. They initialize with the map (inside `initMap()`). No separate lazy-load needed — the panel DOM exists before the map initializes but is `display:none` until `showModal()` is called.

---

## Sources

### Verified HIGH Confidence (Context7 / Official Docs / Official GitHub)

- [Leaflet 1.9.4 Documentation — Tooltip options](https://leafletjs.com/reference.html) — `permanent`, `direction`, `sticky`, `className`, `interactive`, `pane` options confirmed
- [Leaflet 1.9.4 Documentation — Path events](https://leafletjs.com/reference.html#polyline) — `click`, `mouseover`, `mouseout`, `bubblingMouseEvents` confirmed
- [Leaflet 1.9.4 Documentation — Marker options](https://leafletjs.com/reference.html#marker-option-interactive) — `interactive: false`, `keyboard: false`, `bubblingMouseEvents: false` confirmed
- [Leaflet GitHub Releases](https://github.com/leaflet/leaflet/releases) — 1.9.4 is current stable; 2.0.0-alpha.1 is pre-release
- [MDN — `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) — `showModal()`, `show()`, `close()`, `::backdrop`; Baseline Widely Available March 2022
- [MDN — `@starting-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style) — Baseline Newly Available August 2024; ~86% browser support

### Verified MEDIUM Confidence (Official Source + WebSearch cross-reference)

- [Leaflet issue #5758 — Polyline tooltip positioning inconsistency](https://github.com/Leaflet/Leaflet/issues/5758) — Documents why `bindTooltip({permanent:true})` on polylines is unreliable; anchors to first point, not midpoint. Issue closed without fix.
- [Ben Nadel — Dialog as Fly-out Sidebar](https://www.bennadel.com/blog/4862-opening-the-dialog-element-as-a-fly-out-sidebar.htm) — CSS override pattern for converting centered dialog to right-panel: `inset: 0 0 0 auto`, `margin: 0`, `max-height: 100vh`
- [Simon Willison TIL — Full-height Dialog](https://til.simonwillison.net/css/dialog-full-height) — `max-height: 100dvh`, `height: 100dvh` to prevent browser default gap at bottom
- [Frontend Masters — Dialog Entry and Exit Animations](https://frontendmasters.com/blog/the-dialog-element-with-entry-and-exit-animations/) — `@starting-style` + `translate` pattern for dialog slide-in
- [leaflet-highlightable-layers on GitHub](https://github.com/FacilMap/Leaflet.HighlightableLayers) — ES module, Leaflet 1.x compatible, `npm install leaflet-highlightable-layers`

---

*Stack research for: Hiawatha's Revenge — Map Interactivity Milestone*
*Researched: 2026-04-02*
*Previous: v1.2 stack research (2026-03-31) — core stack unchanged; this file covers the map interactivity addition only*
