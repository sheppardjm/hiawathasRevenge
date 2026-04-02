# Phase 24: Sector Labels on Map - Research

**Researched:** 2026-04-02
**Domain:** Leaflet L.divIcon markers, CSS pill/badge labels, National Park design system integration
**Confidence:** HIGH

## Summary

Phase 24 adds permanently-visible, non-interactive sector name + star labels to the Leaflet map as `L.divIcon` markers positioned at each sector polyline's geographic midpoint. All infrastructure is already in place: Leaflet 1.9.4 is the project's map library, `sector-details.json` (Phase 23) is the build-time data source, and `annotations.json` already contains the `startIdx`/`endIdx`/`difficulty`/`stars`/`name` fields needed to compute midpoints and style labels.

The implementation is **entirely within `RouteMap.astro`**. No new dependencies are required. The pattern follows exactly the established `L.divIcon` approach already used for restock markers and photo markers in the same file. The midpoint coordinate is computed at runtime as `routeData.points[Math.floor((startIdx + endIdx) / 2)]` using already-fetched data.

The difficulty color mapping uses the existing `SECTOR_COLORS` object in `RouteMap.astro` (easy → `--color-moss-500`, moderate → `--color-amber-500`, hard → `--color-rust-500`) which matches the sector polyline colors — labels and their polylines share the same color visually tying them together. Star display is `'★'.repeat(sector.stars)` from the integer `stars` field in `annotations.json`.

**Primary recommendation:** Add a `for` loop after the sector polyline loop in `RouteMap.astro` that creates one `L.marker` with `L.divIcon` per sector, using `interactive: false, keyboard: false, zIndexOffset: 250`. The pill HTML is an inline-styled `<div>` using `getCSSColor()` extracted hex values (matching the established project pattern). A single `:global(.sector-label)` rule in the `<style>` block clears the default `leaflet-div-icon` white background.

---

## Standard Stack

No new packages. This phase uses what the project already has.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Leaflet | 1.9.4 | `L.divIcon` + `L.marker` for map labels | Already installed; established pattern in RouteMap.astro |

### Supporting
| Tool | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `annotations.json` | build artifact | Sector geometry (startIdx, endIdx, difficulty, stars, name) | Already fetched in RouteMap.astro |
| `route-data.json` | build artifact | Route points array for midpoint lookup | Already fetched as `routeData.points` |
| CSS custom properties | native | Color extraction via `getCSSColor()` | Established pattern throughout RouteMap.astro |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `annotations.json` for label data | `sector-details.json` | sector-details.json lacks `startIdx`/`endIdx` for midpoint calculation; annotations.json has everything needed and is already fetched |
| `getCSSColor()` hex values in inline styles | CSS `var()` in inline styles | Both work; `getCSSColor()` is the established project pattern and is more explicit |
| Inline style on `<div>` in html string | `:global(.sector-label-inner)` CSS class | Inline is simpler for one-off divIcon content; existing markers use inline SVG |

**Installation:** None required.

---

## Architecture Patterns

### Where Labels Live in RouteMap.astro

Labels are added inside `initMap()` after the existing sector polyline loop, before the restock markers loop. This ensures labels render above polylines but below functional markers.

```
initMap() execution order in RouteMap.astro:
├── L.tileLayer (base tiles)
├── L.polyline routeLine (base dark green route)
├── Sector overlay polylines (difficulty-colored, loop over annotations sectors)  ← existing
├── [NEW] Sector label markers (L.divIcon pills at midpoints)                     ← Phase 24
├── Restock point markers (zIndexOffset 500)
├── Photo cluster markers (zIndexOffset 750)
└── bikeMarker created (not added, zIndexOffset 1000)
```

### Pattern: Geographic Midpoint from Index Range

**What:** Compute the lat/lon at the exact middle of a sector's point range.
**When to use:** Any time you need the center of a Leaflet polyline segment.

```javascript
// Source: project-verified — annotations.json has startIdx/endIdx, route-data.json has points array
const midIdx = Math.floor((sector.startIdx + sector.endIdx) / 2);
const midPt = latlngs[midIdx]; // latlngs is already built: routeData.points.map(pt => [pt.lat, pt.lon])
// midPt is [lat, lon] — pass directly to L.marker([...midPt], ...)
```

Verified midpoints for all 7 sectors (from actual data):
| Sector | midIdx | lat | lon | miles |
|--------|--------|-----|-----|-------|
| 520 | 9 | 46.34894 | -86.73962 | 1.8 |
| NF2266 | 28 | 46.31303 | -86.66798 | 8.4 |
| Bass Lake Rd | 121 | 46.15095 | -86.43806 | 28.1 |
| NF2217 | 168 | 46.07691 | -86.50655 | 39.2 |
| ND2225 | 236 | 46.13885 | -86.56314 | 57.8 |
| Doe Lake | 384 | 46.25682 | -86.72637 | 86.9 |
| Rapid River Truck Trail | 431 | 46.37442 | -86.77377 | 97.9 |

### Pattern: L.divIcon Pill Label

**What:** A styled text pill/badge positioned at a geographic coordinate.
**When to use:** Permanently visible non-interactive map labels.

```javascript
// Source: Leaflet 1.9.4 API (verified) + established project pattern from RouteMap.astro

// Color mapping — matches existing SECTOR_COLORS polyline palette
const LABEL_COLORS = {
  easy:     getCSSColor('--color-moss-500'),     // #7d9448
  moderate: getCSSColor('--color-amber-500'),    // #c8973e
  hard:     getCSSColor('--color-rust-500'),     // #a0522d
};

// Text color — forest-900 provides high contrast against all three background colors
const textColor = getCSSColor('--color-forest-900');  // #1a2e1a

for (const sector of sectors) {
  const midIdx = Math.floor((sector.startIdx + sector.endIdx) / 2);
  const midPt = latlngs[midIdx];
  const bgColor = LABEL_COLORS[sector.difficulty] || LABEL_COLORS.moderate;
  const stars = '★'.repeat(sector.stars);

  const labelIcon = L.divIcon({
    className: 'sector-label',  // removes default white background (see :global below)
    html: `<div style="
      background: ${bgColor};
      color: ${textColor};
      border: 2px solid ${textColor};
      border-radius: 12px;
      padding: 3px 8px;
      font-family: var(--font-display);
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      transform: translate(-50%, -50%);
      box-shadow: 2px 2px 0px rgba(0,0,0,0.4);
      line-height: 1.3;
      text-align: center;
    ">${sector.name}<br><span style="font-size: 9px; letter-spacing: 1px;">${stars}</span></div>`,
    iconSize: [0, 0],       // zero size — positioning controlled entirely by CSS transform
    iconAnchor: [0, 0],     // anchor at top-left; CSS transform: translate(-50%, -50%) centers the pill
  });

  L.marker(midPt, {
    icon: labelIcon,
    interactive: false,     // labels are NOT clickable (Phase 25 handles clicks on polylines)
    keyboard: false,        // not tab-focusable
    zIndexOffset: 250,      // above polylines, below restock (500), photo (750), bike (1000) markers
  }).addTo(map);
}
```

### CSS Additions to RouteMap.astro `<style>` Block

```css
/* Sector label markers — clear default leaflet-div-icon white background */
:global(.sector-label) {
  background: transparent !important;
  border: none !important;
}
```

This follows the established `:global(.restock-marker)` and `:global(.photo-marker)` pattern already in `RouteMap.astro`.

### Anti-Patterns to Avoid

- **Using `sector-details.json` as the label data source:** It lacks `startIdx`/`endIdx` so the midpoint can't be computed. Use `annotations.json` (already fetched).
- **Using `<use href="#shield-motif">` inside divIcon html:** The SVG symbol is defined in `BaseLayout.astro`'s `<body>` but `<use href>` referencing cross-document symbols is unreliable. Embed the shield path inline if the shield is required: `<path d="M14 0 L0 38 Q2 36 8 34 L12 48 L14 56 L16 48 L20 34 Q26 36 28 38 Z" fill="currentColor"/>`.
- **Using fixed `iconSize` with variable-width text:** Text labels have variable width depending on sector name length. Use `iconSize: [0, 0]` + `iconAnchor: [0, 0]` + CSS `transform: translate(-50%, -50%)` to center properly.
- **Setting `interactive: true` (the default):** Labels must be `interactive: false` — Phase 25 handles all click events on the underlying polylines. Interactive labels would intercept polyline clicks.
- **Using the `difficulty` string → DIFFICULTY_COLORS mapping from RouteExplainer.astro:** That system maps `stars` (1–5) to sun-yellow/amber/scarlet and is for the card UI. Map labels should use `SECTOR_COLORS` (difficulty string → moss/amber/rust) to visually match the polyline colors they annotate.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Midpoint of polyline segment | Geographic centroid calculation | `latlngs[Math.floor((startIdx + endIdx) / 2)]` | Already have indexed points array; simple midpoint is correct and sufficient |
| Color extraction at runtime | Hardcoded hex values | `getCSSColor('--color-*')` (already in scope) | Established pattern; values auto-update if design tokens change |
| Star display string | Loop or array | `'★'.repeat(sector.stars)` | One-liner; stars is already an integer in annotations.json |

**Key insight:** Everything needed exists — the data, the rendering function, the color system, the CSS infrastructure. This phase is purely additive code within the existing `initMap()` function body.

---

## Common Pitfalls

### Pitfall 1: Default `leaflet-div-icon` White Background
**What goes wrong:** L.divIcon defaults to `className: 'leaflet-div-icon'` which has CSS `background: #fff; border: 1px solid #666;` — a white square appears behind the label.
**Why it happens:** Leaflet adds this class automatically unless overridden.
**How to avoid:** Set `className: 'sector-label'` (or any custom class) in `L.divIcon` options, then add `:global(.sector-label) { background: transparent !important; border: none !important; }` to the `<style>` block.
**Warning signs:** White rectangle visible behind labels on the map.

### Pitfall 2: Labels Intercepting Polyline Click Events (Phase 25 prep)
**What goes wrong:** Labels with `interactive: true` (default) capture mouse/touch events, preventing clicks from reaching the polyline beneath.
**Why it happens:** Leaflet markers are interactive by default.
**How to avoid:** Always set `interactive: false, keyboard: false` on decorative non-clickable markers.
**Warning signs:** Sector polyline click handler in Phase 25 doesn't fire when clicking near label position.

### Pitfall 3: `iconSize` Fixed Width Clips Variable-Length Names
**What goes wrong:** `iconSize: [100, 24]` clips long names like "Rapid River Truck Trail".
**Why it happens:** Leaflet sets `width` and `height` CSS on the icon element to match `iconSize`.
**How to avoid:** Use `iconSize: [0, 0]` and `iconAnchor: [0, 0]`. Let the content `<div>` with `white-space: nowrap` determine its own width. Use `transform: translate(-50%, -50%)` to center it.
**Warning signs:** Label text appears cut off or partially visible.

### Pitfall 4: `Math.floor` vs `Math.round` for Midpoint Index
**What goes wrong:** `Math.round` may return `endIdx` for odd-length ranges, which is the start of the next sector. `Math.floor` always stays within the sector range.
**Why it happens:** Integer division edge case.
**How to avoid:** Always use `Math.floor((startIdx + endIdx) / 2)`.
**Warning signs:** Label positioned at the boundary between two sectors.

### Pitfall 5: Difficulty String vs Stars for Color Selection
**What goes wrong:** Using `sector.stars` to look up a color in `LABEL_COLORS` (which expects difficulty string keys like `'easy'`).
**Why it happens:** The project has two parallel difficulty representations: `difficulty` string (easy/moderate/hard for polyline colors) and `stars` integer (1-5 for UI display). They do NOT map cleanly to each other (e.g., Doe Lake has `difficulty: 'easy'` but `stars: 4`).
**How to avoid:** Use `sector.difficulty` for color lookup in `LABEL_COLORS`. Use `sector.stars` only for the star string display via `'★'.repeat(sector.stars)`.
**Warning signs:** Label color doesn't match the polyline color for the same sector.

### Pitfall 6: Font Not Available in Leaflet Container
**What goes wrong:** `font-family: var(--font-display)` resolves to `National Park` font only if the font has loaded. During map lazy-init (triggered on scroll), the font is likely loaded but not guaranteed.
**Why it happens:** Leaflet map initializes lazily (scroll/IntersectionObserver trigger).
**How to avoid:** The font is preloaded via `<Font cssVariable="--font-national-park" preload />` in BaseLayout.astro. By scroll time, it will be loaded. If fallback is needed, add `'National Park', sans-serif` to the font-family inline style.
**Warning signs:** Labels render in a generic sans-serif font.

---

## Code Examples

Verified patterns from project codebase:

### Complete Label Loop (drop into initMap() after sector polyline loop)

```javascript
// Source: derived from existing RouteMap.astro patterns (verified project code)
// Add AFTER the sector polyline loop, BEFORE the restock markers loop

const LABEL_COLORS = {
  easy:     getCSSColor('--color-moss-500'),
  moderate: getCSSColor('--color-amber-500'),
  hard:     getCSSColor('--color-rust-500'),
};
const labelTextColor = getCSSColor('--color-forest-900');

for (const sector of sectors) {
  const midIdx = Math.floor((sector.startIdx + sector.endIdx) / 2);
  const midPt = latlngs[midIdx];
  const bgColor = LABEL_COLORS[sector.difficulty] || LABEL_COLORS.moderate;
  const stars = '★'.repeat(sector.stars);

  const labelIcon = L.divIcon({
    className: 'sector-label',
    html: `<div style="background:${bgColor};color:${labelTextColor};border:2px solid ${labelTextColor};border-radius:12px;padding:3px 8px;font-family:var(--font-display);font-size:11px;font-weight:700;white-space:nowrap;transform:translate(-50%,-50%);box-shadow:2px 2px 0px rgba(0,0,0,0.4);line-height:1.3;text-align:center;">${sector.name}<br><span style="font-size:9px;letter-spacing:1px;">${stars}</span></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

  L.marker(midPt, {
    icon: labelIcon,
    interactive: false,
    keyboard: false,
    zIndexOffset: 250,
  }).addTo(map);
}
```

### CSS Addition to RouteMap.astro `<style>` Block

```css
/* Source: matches existing :global(.restock-marker) and :global(.photo-marker) patterns */
:global(.sector-label) {
  background: transparent !important;
  border: none !important;
}
```

### Existing getCSSColor Pattern (already in scope, no changes needed)

```javascript
// Source: RouteMap.astro line 68-71 (verified)
// getCSSColor is already defined at top of initMap() — call it freely
function getCSSColor(varName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}
```

### Existing SECTOR_COLORS Pattern (extend, don't replace)

```javascript
// Source: RouteMap.astro lines 81-85 (verified)
// SECTOR_COLORS already exists for polylines — LABEL_COLORS reuses same mapping
const SECTOR_COLORS = {
  easy:     { line: getCSSColor('--color-moss-500') },
  moderate: { line: amber500 },
  hard:     { line: getCSSColor('--color-rust-500') },
};
// LABEL_COLORS is a new parallel object (not a replacement):
const LABEL_COLORS = {
  easy:     getCSSColor('--color-moss-500'),
  moderate: amber500,   // already extracted as module-level const
  hard:     getCSSColor('--color-rust-500'),
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Leaflet.label plugin for labels | `L.divIcon` with HTML string | Leaflet 1.x included built-in divIcon | No plugin dependency; full CSS control |
| Fixed iconSize for text labels | `iconSize: [0, 0]` + CSS transform centering | Standard practice | Variable-width text labels work correctly |

**Deprecated/outdated:**
- `Leaflet.label` plugin: Superseded by built-in `L.divIcon` capability. The project already avoids this dependency.
- `L.DivOverlay` for labels: Overkill for static text badges; `L.divIcon` is the right tool.

---

## Open Questions

1. **Shield motif in labels (MAP-02 says "shield motif")**
   - What we know: MAP-02 requires "shield motif, difficulty color coding." The shield SVG path is `M14 0 L0 38 Q2 36 8 34 L12 48 L14 56 L16 48 L20 34 Q26 36 28 38 Z` (viewBox 0 0 28 56). `<use href="#shield-motif">` won't work reliably inside divIcon html (SVG symbol is in a different SVG element).
   - What's unclear: Whether to (a) embed the shield SVG path inline in the divIcon html, (b) use an SVG `<image>` reference, or (c) omit the shield and use only the pill border + colors as the "shield aesthetic."
   - Recommendation: Embed the shield path inline as a small SVG (e.g., 10x20px) to the left of the text. This is self-contained and guaranteed to work inside Leaflet's DOM. Keep it small to avoid label crowding.

2. **Label visibility at default zoom level**
   - What we know: The map auto-fits to route bounds with `map.fitBounds(routeLine.getBounds(), { padding: [20, 20] })`. At this zoom level, all 7 labels will be visible simultaneously. The route spans ~100 miles so labels will be small relative to the map.
   - What's unclear: Whether label overlap is an issue at default zoom (sectors are geographically spread across the route, so overlap is unlikely but not verified visually).
   - Recommendation: No dynamic show/hide based on zoom (adds complexity). Permanent labels as required. Verify visually after implementation.

---

## Sources

### Primary (HIGH confidence)
- Leaflet 1.9.4 official reference (leafletjs.com/reference.html) — L.divIcon API: `html`, `className`, `iconSize`, `iconAnchor`; L.marker options: `interactive`, `keyboard`, `zIndexOffset`
- Leaflet GitHub source (Leaflet/Leaflet DivIcon.js) — default `className: 'leaflet-div-icon'` confirmed; CSS causes white background
- Project source `RouteMap.astro` (verified) — `getCSSColor()` pattern, `SECTOR_COLORS`, existing `:global()` rules, `L.divIcon` with `className: ''` pattern
- Project source `annotations.json` (verified) — all 7 sectors have `startIdx`, `endIdx`, `difficulty`, `stars`, `name`
- Project source `route-data.json` (verified) — 456 points, midpoint coordinates computed and verified for all 7 sectors
- Project source `global.css` (verified) — all color CSS variables, font variables

### Secondary (MEDIUM confidence)
- Leaflet CSS file `node_modules/leaflet/dist/leaflet.css` (verified locally) — `.leaflet-div-icon { background: #fff; border: 1px solid #666; }`
- WebSearch cross-reference — `className: ''` removes default white background (multiple community sources agree, verified against Leaflet source)

### Tertiary (LOW confidence)
- None. All critical claims are verified against project source or official documentation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Leaflet 1.9.4 already installed, no new dependencies
- Architecture: HIGH — verified against actual project code; midpoint coordinates computed against real data
- Pitfalls: HIGH — verified against Leaflet CSS source, project code patterns, and Leaflet API docs
- Open questions: the shield motif embedding approach is MEDIUM — the path data is known, the embedding technique works but exact sizing/layout requires visual iteration

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (Leaflet 1.9.4 is stable; project design tokens are stable)
