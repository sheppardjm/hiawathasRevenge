# Phase 6: Restock Markers - Research

**Researched:** 2026-03-30
**Domain:** Leaflet 1.9.4 — L.marker, L.divIcon, bindPopup, CSS popup theming inside RouteMap.astro
**Confidence:** HIGH

---

## Summary

Phase 6 adds two restock point markers to the existing RouteMap.astro Leaflet map. The markers must show name and mileage via popup or tooltip, and look visually distinct from the route path and future photo markers (Phase 9). The entire implementation lives inside `src/components/RouteMap.astro` — no new files or packages are required.

The mkUltra reference repo (`/Users/Sheppardjm/Repos/mkUltraGravel/src/components/RouteMap.astro`, lines 212–224) contains the exact restock marker pattern for this project. It uses `L.divIcon` with `className: 'restock-marker'` (a named class, not `''`), a 12px cyan circle rendered as an inline `div` in the `html` option, and `.bindPopup()` with an HTML string of `<strong>name</strong><br>Mile X`. The pattern differs from the bike-crosshair marker (which uses `className: ''`) — restock markers use a named class and companion CSS in `global.css` to strip the default white box.

The data is already in `public/data/annotations.json` as a flat array. The `RouteMap.astro` `<script>` block already fetches `annotations.json` and filters for `type === 'sector'`. The same fetch result can be filtered for `type === 'restock'` to get the two restock points. No pipeline changes are needed.

**Primary recommendation:** Add restock markers inside the existing `annotations.json` fetch block in `initMap()`. Use `L.divIcon` with a named class (`restock-marker`), a styled circle in the `html` option using the project's Forest Service color palette (amber-500 `#c8973e` for distinct visibility on CyclOSM light tiles), bind a popup with name and mileage. Add `:global(.restock-marker)` CSS in the component `<style>` block to strip Leaflet's default white box.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `leaflet` | 1.9.4 | Already installed — provides L.marker, L.divIcon, bindPopup | Current stable; already in package.json |

### Supporting
No new libraries needed. This phase uses only the Leaflet APIs already available.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `bindPopup` (click-to-open) | `bindTooltip` with `permanent: true` | Permanent tooltip always shows label without click, simpler interaction but may feel visually busy with 2 markers always showing text |
| `bindPopup` (click-to-open) | `bindTooltip` with `permanent: false` | Hover-only tooltip: no click needed, but tooltip disappears when cursor leaves — less discoverable |
| Inline div circle in html | External SVG asset | Inline is simpler, no public/ asset needed, consistent with existing bikeIcon pattern |
| Named `className: 'restock-marker'` | `className: ''` (empty) | Either works; named class enables targeted CSS in global.css if further styling is needed |

**Installation:** None required. `leaflet@1.9.4` is already in `package.json`.

---

## Architecture Patterns

### Recommended File Structure
No new files. Two existing files are modified:

```
src/
├── components/
│   └── RouteMap.astro       # Add restock marker loop inside initMap(), add :global CSS in <style>
├── styles/
│   └── global.css           # Add forest-themed popup CSS (.leaflet-popup.restock-popup)
public/data/
└── annotations.json         # Already contains 2 restock entries — no changes needed
```

### Pattern 1: Restock Markers via L.divIcon + bindPopup
**What:** Filter the already-fetched `annotations` array for `type === 'restock'`, create an L.marker with L.divIcon for each, bind a popup with name and mileage.
**When to use:** Inside `initMap()`, immediately after the sector polyline loop (restock markers should render above sector overlays but below the bike crosshair).

```javascript
// Source: mkUltraGravel/src/components/RouteMap.astro lines 212–224
// Adapted for this project's color palette (amber-500 #c8973e vs mkUltra's cyan #22d3ee)
const restocks = annotations.filter(a => a.type === 'restock');

for (const stop of restocks) {
  const restockIcon = L.divIcon({
    className: 'restock-marker',   // Named class — strip default white box via :global CSS
    html: '<div style="width:14px;height:14px;background:#c8973e;border:2px solid #1a2e1a;border-radius:50%;"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12]          // Popup opens above the marker center
  });

  L.marker([stop.lat, stop.lon], { icon: restockIcon })
    .bindPopup(
      `<strong>${stop.name}</strong><br>Mile ${stop.mile}`,
      { className: 'restock-popup' }
    )
    .addTo(map);
}
```

**Key field names:** The restock schema uses `mile` (not `mi` as in mkUltra) and `lat`/`lon` (same as mkUltra). Verify against actual data:
```json
{ "id": "restock-camp7", "type": "restock", "name": "Camp 7 Lake Campground",
  "mile": 44.7, "lat": 46.05493, "lon": -86.54867, "ele": 232.1, "snapIdx": 185 }
```

### Pattern 2: Stripping Default divIcon White Box via :global CSS
**What:** Leaflet appends divIcon elements to the map DOM outside the Astro component's shadow. Astro's scoped `<style>` does not reach these elements. Use `:global()` wrapper.
**When to use:** Whenever a named className is assigned to a divIcon.

```css
/* Source: mkUltraGravel/src/components/RouteMap.astro lines 19–22 */
/* Inside <style> in RouteMap.astro */
:global(.restock-marker) {
  background: transparent !important;
  border: none !important;
}
```

**Note:** The existing bikeIcon uses `className: ''` (empty string) which strips the default class entirely — that's why it has no `:global` CSS. The restock-marker uses a named class, which means Leaflet applies `.leaflet-div-icon` styling PLUS the named class. The `:global` override is REQUIRED to remove the white box.

**Alternative:** If using `className: ''` on the restock divIcon (like the bikeIcon), no :global CSS is needed. Either approach works. The named class approach is preferable because it enables future CSS targeting without JS changes.

### Pattern 3: Forest-Themed Popup CSS in global.css
**What:** Leaflet's default popup has a white background. For the Forest Service dark theme (forest-900 background), the popup needs custom CSS to match.
**When to use:** Inside a `:global` scope or in `global.css` targeting `.leaflet-popup.restock-popup`.

```css
/* In src/styles/global.css, inside @layer base or as global rule */
/* Adapted from mkUltraGravel/src/styles/global.css lines 169–188 */
:global(.leaflet-popup.restock-popup .leaflet-popup-content-wrapper) {
  background: #1a2e1a;              /* forest-900 — matches page background */
  color: #f5f0e8;                   /* cream-100 — primary text */
  border: 1px solid #3d6b3d;        /* forest-700 — subtle border */
  border-radius: 2px;
  font-family: var(--font-mono);    /* Space Mono — matches site typography */
  font-size: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}
:global(.leaflet-popup.restock-popup .leaflet-popup-tip) {
  background: #1a2e1a;
}
:global(.leaflet-popup.restock-popup .leaflet-popup-close-button) {
  color: #e8e0d0;                   /* cream-200 */
}
```

**Alternative: Inline styles in popup content.** If CSS overrides feel heavyweight for two markers, the popup `html` can use inline styles: `<div style="color:#f5f0e8;background:#1a2e1a;...">${stop.name}</div>`. This avoids the CSS, but Leaflet wraps content in its own `.leaflet-popup-content-wrapper` which retains the white background unless overridden. The `:global` CSS approach is cleaner.

### Pattern 4: zIndexOffset for Render Order
**What:** Leaflet markers render in DOM order by default. The bike crosshair uses `zIndexOffset: 1000`. Restock markers should render above sector polylines but below the crosshair.
**When to use:** When marker layering matters.

```javascript
// Source: Leaflet docs L.marker options
L.marker([stop.lat, stop.lon], {
  icon: restockIcon,
  zIndexOffset: 500   // Below bike crosshair (1000) but above default (0)
})
```

**Note:** The current bikeMarker uses `zIndexOffset: 1000` and is set `interactive: false`. Restock markers should remain interactive (clickable) so do NOT set `interactive: false`.

### Pattern 5: Reset Button Closes Popup
**What:** The existing reset button in RouteMap.astro already calls `map.closePopup()`. This means any open restock popup will be dismissed when the user resets the view. No additional code needed.

```javascript
// Already in RouteMap.astro reset button handler (line 94)
map.closePopup();
```

### Anti-Patterns to Avoid
- **Using `L.marker()` without `L.divIcon`:** The default `L.Icon.Default` uses external PNG images. Vite's asset hashing breaks the URL resolution — the default marker icon will render as a broken image. Always use `L.divIcon` for markers in this project.
- **Setting `className: ''` AND keeping the default white box appearance:** Empty string removes `leaflet-div-icon` class entirely, stripping the white box. This is CORRECT for the bike crosshair. For restock markers, a named class with `:global` CSS is preferred so future styling is possible.
- **Placing restock marker creation outside `initMap()`:** All Leaflet calls require `L` to be imported. The `L` variable is scoped to `initMap()`. The restock loop must be inside `initMap()` after `annotations.json` is fetched.
- **Using `stop.mi` instead of `stop.mile`:** The mkUltra annotations use `mi` but this project's annotations use `mile`. Using the wrong field name will display `undefined` in the popup.
- **Binding tooltip with `permanent: true` and `sticky: true` together:** Sticky tooltips follow the cursor, which conflicts with permanent display. Pick one: `permanent: true` for always-visible labels, or omit both for hover-only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Marker icon (avoiding broken default icon) | Custom image assets in /public | `L.divIcon` with inline HTML | Vite hashes asset URLs; divIcon uses no external files |
| Popup open/close logic | Custom click handlers, DOM manipulation | `.bindPopup()` + Leaflet's built-in open/close | bindPopup handles click, escape key, map click dismiss, and autoClose automatically |
| White box removal from divIcon | CSS reset in component styles | `:global(.class-name)` in `<style>` block | Leaflet appends divIcon DOM outside Astro component scope; scoped CSS cannot reach it |

**Key insight:** The annotations fetch is already happening in RouteMap.astro. Restock markers are a simple filter + loop on already-fetched data. The cost is ~15 lines of code.

---

## Common Pitfalls

### Pitfall 1: Wrong field name — `stop.mi` vs `stop.mile`
**What goes wrong:** Popup shows "Mile undefined" instead of "Mile 44.7".
**Why it happens:** mkUltra reference uses `mi` as the mileage field; this project's `resolve-annotations.js` outputs `mile`.
**How to avoid:** Use `stop.mile` (confirmed from reading `public/data/annotations.json` directly).
**Warning signs:** Popup content contains "Mile undefined".

### Pitfall 2: Default Leaflet marker icon breaks in Vite build
**What goes wrong:** If `L.marker([lat, lon])` is called without a custom icon, the default marker image URL is broken — Vite hashes the filename and Leaflet can't find it.
**Why it happens:** Leaflet 1.9.4 constructs the icon URL from `L.Icon.Default.imagePath` which Vite's bundler doesn't track.
**How to avoid:** Always pass `icon: L.divIcon(...)` when creating markers. This phase uses L.divIcon exclusively.
**Warning signs:** Broken image icon on the map in production build; console error about missing PNG.

### Pitfall 3: divIcon white box not removed
**What goes wrong:** Restock marker shows as an amber circle inside a white rectangular box with a border — the default `leaflet-div-icon` styling.
**Why it happens:** When `className` is a non-empty string (e.g., `'restock-marker'`), Leaflet adds BOTH `leaflet-div-icon` AND the custom class. The `leaflet-div-icon` CSS provides white background + border. Setting a named class doesn't remove the default class.
**How to avoid:** Add `:global(.restock-marker) { background: transparent !important; border: none !important; }` in the component `<style>` block. The `!important` is required to override Leaflet's inline style precedence.
**Warning signs:** Amber circle appears inside a white box on the map.

### Pitfall 4: Scoped Astro styles don't reach Leaflet-created DOM
**What goes wrong:** `.restock-marker { background: transparent }` in `<style>` has no effect. The marker still shows the white box.
**Why it happens:** Astro scopes component styles by adding a data attribute selector (e.g., `[data-astro-cid-xxx] .restock-marker`). Leaflet creates divIcon elements directly on `document.body` / the map container, not inside the component's DOM scope.
**How to avoid:** Use `:global(.restock-marker)` to escape the scoped selector, OR put the CSS in `global.css`.
**Warning signs:** CSS rule is visible in DevTools but the map marker doesn't reflect the style; adding `!important` inline in the html string doesn't help.

### Pitfall 5: popupAnchor not set — popup opens overlapping the marker
**What goes wrong:** The popup opens with its tip centered on the marker's `lat/lon` coordinate, which places the popup body ON TOP of the marker circle.
**Why it happens:** Default `popupAnchor` is `[0, 0]` — the popup tip aligns to the iconAnchor point.
**How to avoid:** Set `popupAnchor: [0, -12]` (or similar negative y value) to offset the popup above the marker. Adjust based on the marker's visual size.
**Warning signs:** Popup tip emerges from the center of the marker circle rather than from just above it.

### Pitfall 6: Popup CSS not applying because className doesn't prefix .leaflet-popup
**What goes wrong:** Custom CSS class on the popup content wrapper doesn't override Leaflet's default white popup styling.
**Why it happens:** The `className` option in `.bindPopup(content, { className: 'restock-popup' })` adds the class to the `.leaflet-popup` div, not the `.leaflet-popup-content-wrapper`. The CSS must target `.leaflet-popup.restock-popup .leaflet-popup-content-wrapper`.
**How to avoid:** Use the compound selector: `.leaflet-popup.restock-popup .leaflet-popup-content-wrapper { ... }` (not just `.restock-popup .leaflet-popup-content-wrapper`).
**Warning signs:** CSS rule targeting `.restock-popup .leaflet-popup-content-wrapper` is in DevTools but shows no match — inspect the actual class hierarchy on the popup element.

---

## Code Examples

Verified patterns from official sources and mkUltra reference:

### Complete Restock Marker Implementation
```javascript
// Source: mkUltraGravel/src/components/RouteMap.astro lines 212-224, adapted for this project
// Place inside initMap(), after the sectors loop, using the already-fetched annotations array

const restocks = annotations.filter(a => a.type === 'restock');

for (const stop of restocks) {
  const restockIcon = L.divIcon({
    className: 'restock-marker',     // Named class — white box stripped via :global CSS
    html: '<div style="width:14px;height:14px;background:#c8973e;border:2px solid #1a2e1a;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],              // Center of circle at coordinate
    popupAnchor: [0, -12]           // Popup opens above marker
  });

  L.marker([stop.lat, stop.lon], {
    icon: restockIcon,
    title: stop.name,               // Browser hover tooltip for accessibility
    zIndexOffset: 500               // Above polylines (0), below bike crosshair (1000)
  })
    .bindPopup(
      `<strong>${stop.name}</strong><br>Mile ${stop.mile}`,
      { className: 'restock-popup' }
    )
    .addTo(map);
}
```

### :global CSS in RouteMap.astro `<style>` Block
```css
/* Source: mkUltraGravel/src/components/RouteMap.astro lines 18-22 */
/* Leaflet appends divIcon elements outside component scope — :global() required */
:global(.restock-marker) {
  background: transparent !important;
  border: none !important;
}
```

### Forest-Themed Popup CSS in global.css
```css
/* Source: mkUltraGravel/src/styles/global.css lines 169-188, adapted for Forest Service palette */
/* Add inside the existing @layer base block or as a global rule */
.leaflet-popup.restock-popup .leaflet-popup-content-wrapper {
  background: #1a2e1a;           /* forest-900 */
  color: #f5f0e8;                /* cream-100 */
  border: 1px solid #3d6b3d;    /* forest-700 */
  border-radius: 2px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}
.leaflet-popup.restock-popup .leaflet-popup-tip {
  background: #1a2e1a;           /* forest-900 — matches content wrapper */
}
.leaflet-popup.restock-popup .leaflet-popup-close-button {
  color: #e8e0d0;                /* cream-200 */
}
```

### Tooltip Alternative (if popup is rejected)
```javascript
// Source: Leaflet docs L.tooltip
// Use bindTooltip if always-visible label is preferred over click-to-open popup
L.marker([stop.lat, stop.lon], { icon: restockIcon })
  .bindTooltip(
    `${stop.name}<br>Mile ${stop.mile}`,
    {
      permanent: false,   // false = hover-only (less visual noise than permanent)
      direction: 'top',   // always above marker
      className: 'restock-tooltip',
      offset: [0, -10]
    }
  )
  .addTo(map);
```

---

## Data Shape Reference

**annotations.json restock shape (confirmed from file read):**
```json
{
  "id": "restock-camp7",
  "type": "restock",
  "name": "Camp 7 Lake Campground",
  "mile": 44.7,
  "lat": 46.05493,
  "lon": -86.54867,
  "ele": 232.1,
  "snapIdx": 185
}
```

**Two restock points total:**
- `restock-camp7`: Camp 7 Lake Campground, Mile 44.7
- `restock-midway`: Midway General Store, Mile 75.7

**Key difference from mkUltra:** This project uses `mile` (not `mi`). The rest of the shape is identical.

**RouteMap.astro annotations fetch (already in place):**
```javascript
// Already in RouteMap.astro initMap() — line 136
const annotations = await fetch('/data/annotations.json').then(r => r.json());
const sectors = annotations.filter(a => a.type === 'sector');
// ADD: const restocks = annotations.filter(a => a.type === 'restock');
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `L.marker()` with default icon | `L.marker()` with `L.divIcon` | Vite adoption (2021+) | Default icon breaks in Vite due to asset URL hashing |
| Scoped component CSS for divIcon | `:global()` wrapper | Astro 1.0+ | Astro scoped CSS can't reach Leaflet-created DOM elements |
| Direct popup HTML with white bg | Custom `className` + CSS override | Leaflet 1.x | `className` option on bindPopup enables targeted CSS overrides |

**Deprecated/outdated:**
- `L.Icon.Default.prototype.options.iconUrl = ...`: Valid fix for default icon, but unnecessary when `L.divIcon` is used. Not needed in this phase.

---

## Open Questions

1. **Popup vs Tooltip interaction model**
   - What we know: The requirements say "clicking or hovering" — both popup (click) and tooltip (hover) satisfy the requirement.
   - What's unclear: Whether the product decision is click-to-open popup or always-visible/hover tooltip.
   - Recommendation: Use `bindPopup` (click-to-open). With only 2 markers, the interaction is simple and discoverable. Permanent tooltips may feel cluttered, especially when zoomed out showing both markers simultaneously. Popup is consistent with the mkUltra reference.

2. **Marker color — amber vs distinct accent**
   - What we know: The route polyline is `#1a2e1a` (forest-900 dark green). Sector overlays are `#8a9a5b` (easy), `#c8973e` (moderate), `#a0522d` (hard). The amber-500 `#c8973e` is already used for moderate sectors.
   - What's unclear: Whether restock markers using amber-500 would be visually confused with moderate-difficulty sector polylines.
   - Recommendation: Use amber-500 for the marker fill (it's the primary accent color and will stand out on CyclOSM light tiles). The circular marker shape is visually distinct from linear polylines — shape differentiates them, not color alone. If confusion is a concern, use `#c8973e` fill with a `#1a2e1a` border (2px dark outline) to give the circle a "badge" appearance distinct from the polylines.

3. **Reset button — should it close open restock popups?**
   - What we know: The existing reset button handler already calls `map.closePopup()` (line 94 of RouteMap.astro). This is the global popup close which closes any open Leaflet popup.
   - What's unclear: Nothing — this works automatically with no changes needed.
   - Recommendation: No changes needed. The existing `map.closePopup()` in the reset handler already handles this.

---

## Sources

### Primary (HIGH confidence)
- `/Users/Sheppardjm/Repos/mkUltraGravel/src/components/RouteMap.astro` lines 19–37, 211–224 — Complete working restock marker implementation in production codebase
- `/Users/Sheppardjm/Repos/mkUltraGravel/src/styles/global.css` lines 169–188 — Dark popup CSS pattern verified in production
- `https://leafletjs.com/reference.html#marker` — L.marker options: icon, title, zIndexOffset, interactive, keyboard
- `https://leafletjs.com/reference.html#divicon` — L.divIcon options: html, className, iconSize, iconAnchor, popupAnchor, tooltipAnchor; className behavior (replaces vs appends)
- `https://leafletjs.com/reference.html#popup` — bindPopup API, className option placement (.leaflet-popup level)
- `https://leafletjs.com/reference.html#tooltip` — bindTooltip, permanent, direction, offset options
- `/Users/Sheppardjm/Repos/hiawathasRevenge/public/data/annotations.json` — Confirmed restock data shape: `mile` field (not `mi`), 2 entries

### Secondary (MEDIUM confidence)
- Leaflet official docs (WebFetch confirmed): `className` in `L.divIcon` replaces the default `leaflet-div-icon` class rather than appending — confirmed behavior
- Leaflet official docs (WebFetch confirmed): `bindPopup className` option adds class to `.leaflet-popup` element, not `.leaflet-popup-content-wrapper` — confirmed selector hierarchy

### Tertiary (LOW confidence)
None — all critical claims verified against mkUltra reference or official Leaflet docs.

---

## Metadata

**Confidence breakdown:**
- Standard stack (Leaflet L.marker + L.divIcon + bindPopup): HIGH — verified against official docs and working mkUltra reference
- Architecture (filter existing annotations fetch, loop for markers, :global CSS pattern): HIGH — exact pattern in mkUltra reference, confirmed against Astro scoping behavior
- Data shape (restock field names): HIGH — read directly from public/data/annotations.json
- Pitfalls: HIGH — pitfall 1 (wrong field name) verified by data inspection; pitfalls 2-6 verified against Leaflet docs and mkUltra reference

**Research date:** 2026-03-30
**Valid until:** 2026-09-30 (Leaflet 1.9.x is stable; API unlikely to change in patch versions)
