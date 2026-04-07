# Phase 40: Map Simplification - Research

**Researched:** 2026-04-07
**Domain:** Leaflet polyline rendering, surface-colored track, two-color map simplification
**Confidence:** HIGH — all findings are sourced directly from reading the live codebase

---

## Summary

Phase 40 replaces the current four-color surface-type polyline (paved/gravel/dirt/unknown mapped to lake/amber/rust/forest-700) with a simple two-color track: one color for gravel sectors, one color for all other road. The existing sector overlay pattern (amber `visiblePoly` + invisible `ghostPoly` hit-target) already produces the gravel-sector color correctly. The change is surgical: replace `drawSurfacePolyline()` with a simpler `drawBasePolyline()` that uses a single "road" color for the entire route, then let the sector overlays continue to show gravel segments in amber as they already do. The `surface-points.json` data files and their fetch remain needed only if the surface points drive sector boundary detection (they don't — sectors come from `annotations.json`). The `surface-points.json` fetch in `renderRoute()` can therefore be dropped entirely.

There is no visual legend or legend component to remove — the "surface legend" in the requirements refers to the implicit color-coded polyline itself acting as a legend. Removing the multi-color surface polyline satisfies MAP-02 without any additional legend-removal code.

**Primary recommendation:** Delete `drawSurfacePolyline()`, replace with a single `L.polyline(latlngs, { color: road_color, ... })` call, drop the `surface-points.json` fetch from `renderRoute()`, and delete the `SURFACE_COLORS` constant. Ghost polylines are unaffected.

---

## Standard Stack

No new libraries are needed. All work is within existing Leaflet APIs already in use.

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Leaflet | ~1.9.x | Polyline rendering | Already used throughout RouteMap.astro |

### No Alternatives to Consider

This is a pure subtraction task (delete multi-color logic, draw one line). No new libraries, no new patterns.

**Installation:** None required.

---

## Architecture Patterns

### Existing Code Structure (Read from Live Codebase)

All map logic lives in a single file:

```
src/components/RouteMap.astro   — the only file to change
public/data/{routeId}/surface-points.json  — fetch can be removed
```

The script block inside `RouteMap.astro` has these relevant module-scope variables and functions:

```
SURFACE_COLORS       — object mapping paved/gravel/dirt/unknown → colors (DELETE)
drawSurfacePolyline() — run-flush algorithm producing multi-color segments (REPLACE)
renderRoute()         — fetches surface-points.json (DROP that fetch), calls drawSurfacePolyline (REPLACE call)
SECTOR_COLOR         — { line: amber500 } — sector overlay color (KEEP AS-IS)
ghostPolylines       — per-route ghost at opacity 0.2 using route.color (KEEP AS-IS)
```

### Pattern 1: Current Multi-Color Surface Polyline (TO BE REPLACED)

**What:** `drawSurfacePolyline()` takes `latlngs` (array of [lat,lon]) and `surfacePoints` (parallel array with `.surface` field), groups consecutive same-surface points into segments, and draws each segment with its surface-type color.

**Current call site in `renderRoute()`:**
```javascript
// Line 609 in RouteMap.astro
drawSurfacePolyline(latlngs, surfacePoints, activeRouteGroup);
```

**Current `renderRoute()` fetches (lines 583-588):**
```javascript
const [routeData, annotations, sectorElevations, surfacePoints] = await Promise.all([
  fetch(`/data/${routeId}/route-data.json`).then(r => r.json()),
  fetch(`/data/${routeId}/annotations.json`).then(r => r.json()),
  fetch(`/data/${routeId}/sector-elevations.json`).then(r => r.json()),
  fetch(`/data/${routeId}/surface-points.json`).then(r => r.json()),   // <-- DROP THIS
]);
```

### Pattern 2: Target Two-Color Architecture

**What:** Draw the full route as one polyline in a "road" color, then let sector overlays sit on top in amber — same as today but without the surface-segmented base layer.

**Replacement for `drawSurfacePolyline()` call:**
```javascript
// Replace the entire drawSurfacePolyline() call with:
L.polyline(latlngs, {
  color: forest900,   // or a dedicated road color CSS var
  weight: 4,
  opacity: 0.9,
  smoothFactor: 1,
  interactive: false,
}).addTo(activeRouteGroup);
```

**Note on color choice:** `forest900` is already used as the fallback uniform color in `drawSurfacePolyline()` (line 558), making it the natural "other road" color. Alternatively, a new CSS variable (e.g., `--color-route-road`) could be introduced for semantic clarity. The planner should decide.

### Pattern 3: Sector Overlays (UNCHANGED)

The sector overlays in step 5 of `renderRoute()` already produce exactly the gravel-sector color behavior required by MAP-01:

- `visiblePoly` at `SECTOR_COLOR.line` (amber500), weight 5 — **this is the gravel color**
- `ghostPoly` at opacity 0, weight 20, interactive — **hit target for clicks/hover**

No changes needed to sector overlay logic. The sector polys sit on top of the base polyline, so gravel sectors will visually appear in amber over the road-colored base.

### Pattern 4: Ghost Polylines (UNCHANGED)

Ghost polylines for inactive routes (lines 831-843) use `route.color` from `routes.json` (amber/green/blue). These are already at opacity 0.2 and drawn behind `activeRouteGroup`. They satisfy success criterion 4 with no changes.

### Anti-Patterns to Avoid

- **Don't "simplify" `SURFACE_COLORS` to two entries:** Reducing to paved/gravel while keeping the run-flush algorithm adds complexity for no gain. Delete the whole algorithm.
- **Don't keep the `surface-points.json` fetch:** Once `drawSurfacePolyline()` is gone, there's no consumer of `surfacePoints`. Keeping the fetch wastes a network round-trip on every route switch.
- **Don't change sector overlay colors:** SECTOR_COLOR.line (amber500) is already the correct "gravel sector" color per MAP-01.
- **Don't touch ghost polylines:** They're already correct per success criterion 4.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Two-color route | Run-flush algorithm with 2 surface buckets | Single `L.polyline()` call | One polyline is simpler, fewer DOM nodes, faster render |
| Color token access | Hardcoded hex | `getCSSColor('--color-forest-900')` (already used) | Propagates with design token changes |

**Key insight:** The existing sector overlay pattern already produces the two-color visual. The work is *removal* of the surface coloring beneath it, not addition of new coloring logic.

---

## Common Pitfalls

### Pitfall 1: Forgetting to Remove the `surface-points.json` Fetch

**What goes wrong:** `surfacePoints` variable becomes undefined, throwing a runtime error if any remaining code references it.
**Why it happens:** `renderRoute()` destructures four fetches. If you remove the function call but leave the fetch, `surfacePoints` is fetched but unused. If you remove the destructuring binding but leave the fetch, the Promise.all still works but wastes bandwidth.
**How to avoid:** Remove the `surface-points.json` fetch from `Promise.all` AND remove `surfacePoints` from the destructuring. Update the Promise.all to three fetches.
**Warning signs:** Console error "surfacePoints is not defined" or network tab showing unnecessary fetch on route switch.

### Pitfall 2: Ghost Polylines Using `route.color` vs. Two-Color Scheme

**What goes wrong:** Ghost polylines use `route.color` (amber/#c8973e for 100mi, green for 100k, blue for 50k). This is by design — they show route comparison context. However, if the requirement "two colors" is read strictly, ghost polylines are a third+ color.
**Why it happens:** The success criterion says "Route track on the map displays exactly two colors" — ghost polylines are explicitly called out as acceptable in criterion 4 ("Ghost polylines for inactive routes remain visible and visually subordinate"). They don't conflict.
**How to avoid:** Confirm understanding that ghost polylines are excluded from the "two colors" constraint per success criterion 4. No code change needed.

### Pitfall 3: Color Choice for Road Segments

**What goes wrong:** Choosing a color that's too similar to CyclOSM tile roads (which are often grey/white), making the active route hard to see.
**Why it happens:** CyclOSM is forest-themed, with grey/white road rendering at most zoom levels. A dark grey route overlay may not contrast well.
**How to avoid:** Use `forest900` (#0d1a0d, near-black dark green) or a blue-grey that contrasts with CyclOSM's palette. `forest900` is already the fallback "uniform color" in the old `drawSurfacePolyline()` code — it's been visually tested.
**Warning signs:** Route track visually disappears into the tile background at certain zoom levels.

### Pitfall 4: Sector Overlay Z-Order

**What goes wrong:** Base polyline renders on top of sector overlays, hiding the amber sector color.
**Why it happens:** Leaflet renders layers in add-order. If the base polyline is added AFTER sector overlays, it will sit on top.
**How to avoid:** The existing code adds the base polyline in step 4 and sector overlays in step 5 — maintaining this order keeps sectors on top. Don't change this ordering.
**Warning signs:** Sector click areas still work but amber color is invisible.

---

## Code Examples

### Full Replacement: `renderRoute()` Changes

**Before (lines 583-609):**
```javascript
const [routeData, annotations, sectorElevations, surfacePoints] = await Promise.all([
  fetch(`/data/${routeId}/route-data.json`).then(r => r.json()),
  fetch(`/data/${routeId}/annotations.json`).then(r => r.json()),
  fetch(`/data/${routeId}/sector-elevations.json`).then(r => r.json()),
  fetch(`/data/${routeId}/surface-points.json`).then(r => r.json()),
]);
// ... (other code) ...
// 4. Draw surface-colored polyline (run-flush algorithm)
drawSurfacePolyline(latlngs, surfacePoints, activeRouteGroup);
```

**After:**
```javascript
const [routeData, annotations, sectorElevations] = await Promise.all([
  fetch(`/data/${routeId}/route-data.json`).then(r => r.json()),
  fetch(`/data/${routeId}/annotations.json`).then(r => r.json()),
  fetch(`/data/${routeId}/sector-elevations.json`).then(r => r.json()),
]);
// ... (other code) ...
// 4. Draw two-color route base (road color — sector overlays in step 5 supply gravel color)
activeRouteGroup.addLayer(L.polyline(latlngs, {
  color: forest900,
  weight: 4,
  opacity: 0.9,
  smoothFactor: 1,
  interactive: false,
}));
```

### Constants to Delete

```javascript
// DELETE this entire block (lines 313-318):
const SURFACE_COLORS = {
  paved:   lake400,
  gravel:  amber400,
  dirt:    getCSSColor('--color-rust-600'),
  unknown: getCSSColor('--color-forest-700'),
};
```

### Function to Delete

```javascript
// DELETE the entire drawSurfacePolyline() function (lines 552-578)
function drawSurfacePolyline(latlngs, surfacePoints, layerGroup) { ... }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-color route polyline | Surface-typed 4-color segments (paved/gravel/dirt/unknown) | v1.3 | Run-flush algorithm, 4 network fetches per route |
| N/A | **Two-color** (this phase): road + gravel-sector | v1.7 (this phase) | Simpler, 3 network fetches per route, cleaner visual |

**Deprecated by this phase:**
- `drawSurfacePolyline()`: Replaced by inline `L.polyline()` call
- `SURFACE_COLORS` constant: Deleted
- `surface-points.json` fetch in `renderRoute()`: Removed (data files remain on disk; can be deleted in future cleanup)

---

## Open Questions

1. **Road color: `forest900` vs. a new CSS variable**
   - What we know: `forest900` is already used as the fallback uniform color in the old code and has been visually tested against CyclOSM tiles. The `getCSSColor('--color-forest-900')` call already exists in `initMap()`.
   - What's unclear: Whether the user wants explicit semantic naming (`--color-route-road`) or is fine with reusing `forest900`.
   - Recommendation: Use `forest900` directly (no new CSS variable needed). Simple, no new tokens, matches existing pattern.

2. **`surface-points.json` files on disk**
   - What we know: The files exist at `public/data/{routeId}/surface-points.json` and are produced by `generate-surface-points.js` in the pipeline. Once the fetch is removed, they become dead data.
   - What's unclear: Whether to remove the pipeline step and the JSON files now or leave for later cleanup.
   - Recommendation: Leave the files and pipeline step in place for this phase. Scope is map rendering only. Dead data files don't hurt anything. If desired, add cleanup to a future tech-debt phase.

3. **Does `lake400` get used elsewhere once removed from `SURFACE_COLORS`?**
   - What we know: `lake400` is declared in `initMap()` at line 302 (`const lake400 = getCSSColor('--color-lake-400')`). It's also used for restock marker SVG fill (line 663) and bike icon stroke (line 393).
   - What's unclear: Nothing — `lake400` is still needed for other uses.
   - Recommendation: Keep the `lake400` variable declaration. Only remove the `SURFACE_COLORS` object that references it.

---

## Sources

### Primary (HIGH confidence)
- Live codebase read: `/src/components/RouteMap.astro` — all line references verified
- Live codebase read: `/public/data/routes.json` — route IDs, colors confirmed
- Live codebase read: `/public/data/100mi/surface-points.json` — surface type data verified
- Live codebase read: `/.planning/PROJECT.md` — key decisions, requirements confirmed

### Secondary (MEDIUM confidence)
- N/A — no external library changes needed

### Tertiary (LOW confidence)
- N/A

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, pure internal codebase change
- Architecture: HIGH — verified against live source code with line references
- Pitfalls: HIGH — grounded in actual code structure and known Leaflet layer ordering

**Research date:** 2026-04-07
**Valid until:** Indefinite — this is a codebase-specific finding, not an external library research concern. Valid until `RouteMap.astro` is significantly restructured.
