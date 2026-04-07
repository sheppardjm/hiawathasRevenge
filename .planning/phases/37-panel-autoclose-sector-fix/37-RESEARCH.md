# Phase 37: Panel Auto-Close & Sector Data Fix - Research

**Researched:** 2026-04-06
**Domain:** JavaScript state management bug + data pipeline rename + Strava link wiring
**Confidence:** HIGH (all findings from direct codebase inspection)

## Summary

This phase closes the final v1.5 audit gap (MAP-05) and completes the Ridge Rd sector data. Three independent changes are needed: (1) fix a dead-code bug in `renderRoute()` that prevents the sector panel from closing on route switch, (2) rename "Rapid River Truck Trail" to "Ridge Rd" across all source files and regenerate pipeline artifacts, and (3) wire the Ridge Rd Strava segment ID 41188200 into the two source files that define Strava links.

The bug cause is confirmed by code inspection: `clearActiveRoute()` at step 2 (line 604) nulls `activeSector` at line 556, making the panel-close check at step 9 (line 720) always false. The fix is Option A — move the panel-close check to before `clearActiveRoute()`. This is simpler and has no risk of leaving the `activeSector` reference in a half-cleared state.

All rename and Strava link targets are in source-of-truth files that feed the pipeline. Running `npm run pipeline` after editing those files regenerates all downstream JSON artifacts automatically. No direct editing of generated JSON files is needed.

**Primary recommendation:** Fix the bug using Option A (move check before `clearActiveRoute()`), edit 3 source files for the rename+Strava, then run `npm run pipeline` to regenerate all JSON.

## Standard Stack

This phase is pure bug fix + data update. No new libraries or dependencies are added.

### Core (existing, no changes)
| File | Role | Relevant to Phase |
|------|------|-------------------|
| `src/components/RouteMap.astro` | Bug fix target — `renderRoute()` / `clearActiveRoute()` / `closePanel()` | MAP-05 fix |
| `scripts/route-config.js` | Canonical sector definitions including `name` field | Rename source |
| `scripts/generate-sector-details.js` | Canonical Strava links + descriptions | Rename + Strava |
| `src/components/RouteExplainer.astro` | SEGMENTS const + SECTOR_IDS map | Rename + Strava |
| `scripts/pipeline.js` | Orchestrates all regeneration steps | Run after edits |

### Generated Files (do NOT edit directly — pipeline regenerates)
| File | Populated by | What changes |
|------|-------------|--------------|
| `public/data/100mi/annotations.json` | `resolve-annotations.js` via `route-config.js` | `name` field |
| `public/data/100k/annotations.json` | same | `name` field |
| `public/data/50k/annotations.json` | same | `name` field |
| `public/data/sector-details.json` | `generate-sector-details.js` | `name` + `stravaLink` |
| `public/data/100mi/sector-elevations.json` | `compute-sector-elevations.js` | `name` field |
| `public/data/100k/sector-elevations.json` | same | `name` field |
| `public/data/50k/sector-elevations.json` | same | `name` field |
| `public/data/annotations.json` | legacy root-level file (also present) | `name` field |

**Installation:** No new packages needed.

## Architecture Patterns

### How Sector Names Flow Through the Pipeline

```
scripts/route-config.js  (SECTOR_DEFS[].name)
        │
        ▼
resolve-annotations.js  →  public/data/{routeId}/annotations.json (name field)
        │
        ▼
compute-sector-elevations.js  →  public/data/{routeId}/sector-elevations.json (name field)

scripts/generate-sector-details.js  (reads name FROM annotations.json, not from SECTOR_DEFS)
        │
        ▼
public/data/sector-details.json  (name field)
```

`generate-sector-details.js` merges the sector `name` from `100mi/annotations.json` (which gets it from `route-config.js`). So `route-config.js` is the single upstream source of the `name` field for all four JSON outputs.

### How Strava Links Flow

```
scripts/generate-sector-details.js  (SECTOR_DETAILS[].stravaLink)
        │
        ▼
public/data/sector-details.json  (stravaLink field)
        │
        ▼
RouteMap.astro openPanel()  (details.stravaLink → panel HTML)

src/components/RouteExplainer.astro  (SEGMENTS[].stravaId — separate hardcoded value)
        │
        ▼
Route explainer card Strava link
```

**The two Strava link surfaces are independent:**
- `generate-sector-details.js` → sector detail panel on map
- `RouteExplainer.astro` → route guide segment card

Both must be updated for full coverage.

### MAP-05 Bug: Exact Code Flow

```
renderRoute(routeId)                        // line 594
  step 1: fetch data                        // line 595-601
  step 2: clearActiveRoute()               // line 604
    └── if (activeSector) {
          activeSector.visiblePoly.setStyle(...)
          activeSector = null              // line 556 ← NULLED HERE
        }
  ... steps 3-8 ...
  step 9: if (activeSector && ...)         // line 720 ← ALWAYS FALSE
            closePanel()                   // NEVER RUNS
```

**Why Option A is correct:** Moving the panel-close check to before step 2 is the right semantic order. The panel should close before the route layers are cleared. The check at step 9 was likely added as an afterthought and placed in the wrong position.

**Option A implementation (before step 2):**
```javascript
// 1.5. Panel close-on-switch — must run BEFORE clearActiveRoute() nulls activeSector
const prevRouteConfig = routesManifest?.routes.find(r => r.id === activeRouteId);
if (activeSector && prevRouteConfig && !prevRouteConfig.sectorIds.includes(activeSector.sectorId)) {
  closePanel();
}

// 2. Clear previous route layers
clearActiveRoute();
```

**Wait — there is a subtlety:** The check at step 9 currently compares `activeSector.sectorId` against the NEW route's `sectorIds`. The intent is: "if the sector that was open is not on the new route, close the panel." But checking against the OLD route's config is wrong — we need the NEW route config. So the Option A implementation must use `routeId` (the new route) not `activeRouteId`:

```javascript
// Panel close: check BEFORE clearActiveRoute() nulls activeSector
// Close if the open sector is not on the NEW route being loaded
const newRouteConfig = routesManifest.routes.find(r => r.id === routeId);
if (activeSector && newRouteConfig && !newRouteConfig.sectorIds.includes(activeSector.sectorId)) {
  closePanel();
}

// 2. Clear previous route layers
clearActiveRoute();
```

This preserves the correct logic: the panel stays open if the active sector is also on the new route (e.g., sector-520 is on all 3 routes; switching 100mi → 50k with sector-520 open should keep the panel open).

Note: `routesManifest` is available at this point (loaded in `initMap()` before `renderRoute()` is first called). The existing step 9 already uses `routesManifest.routes.find(r => r.id === routeId)`, so the same pattern works at step 1.5.

After moving the check, **delete the now-dead step 9** (lines 718-722) entirely.

### Rename: Three Source Files to Edit

**File 1: `scripts/route-config.js`**
Location: `SECTOR_DEFS` array, the entry with `id: 'sector-rapid-river'`
Change: `name: 'Rapid River Truck Trail'` → `name: 'Ridge Rd'`
Line: 129

**File 2: `scripts/generate-sector-details.js`**
Location: `SECTOR_DETAILS` array, the entry with `id: 'sector-rapid-river'`
Change: No `name` field here (name comes from annotations). Only `stravaLink` needs updating.
(`stravaLink: null` → `stravaLink: 'https://www.strava.com/segments/41188200'`)

**File 3: `src/components/RouteExplainer.astro`**
Location 1: `SEGMENTS` array, line 24
Change: `name: 'Rapid River Truck Trail'` → `name: 'Ridge Rd'`
Location 2: `SECTOR_IDS` map, line 42
Change: key `'Rapid River Truck Trail'` → `'Ridge Rd'`
Also add: `stravaId: '41188200'` to the SEGMENTS entry (currently missing — no stravaId property)

### Panel Close Mechanism

`closePanel()` simply calls `panel.close()` on the `<dialog id="sector-panel">` element (line 505). The `panel.close()` native dialog method fires a `'close'` event, which the listener at line 509 uses to reset state:

```javascript
panel.addEventListener('close', () => {
  if (activeSector) {
    activeSector.visiblePoly.setStyle(activeSector.defaultStyle);
    activeSector = null;
  }
  previousFocus?.focus();
});
```

This means calling `closePanel()` BEFORE `clearActiveRoute()` is safe: the `'close'` event fires synchronously, the listener runs immediately, `activeSector.visiblePoly.setStyle()` is called on the polyline before `clearActiveRoute()` removes it from the layer group. No timing issue.

**Alternatively:** `clearActiveRoute()` already calls `activeSector.visiblePoly.setStyle(activeSector.defaultStyle)` and nulls `activeSector` (lines 554-557). So when `closePanel()` is called first and its `'close'` handler runs, `activeSector` gets its style reset and nulled. Then `clearActiveRoute()` runs — its `if (activeSector)` guard (line 554) is now false, so it skips the redundant style reset. This is fine.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Regenerating JSON data files | Manually edit JSON | Run `npm run pipeline` |
| Sector name resolution | Custom lookup | Already done by pipeline from `route-config.js` |

**Key insight:** All downstream JSON artifacts (`annotations.json`, `sector-details.json`, `sector-elevations.json`) are generated files. Editing them directly would be overwritten on the next `npm run pipeline`. Only edit the three source files identified above.

## Common Pitfalls

### Pitfall 1: Using activeRouteId Instead of routeId in Panel Close Check
**What goes wrong:** The moved check compares `activeSector.sectorId` against the WRONG route's `sectorIds`.
**Why it happens:** `activeRouteId` is the currently-displayed route; `routeId` is the one being loaded. The intent is to check if the sector is on the new route.
**How to avoid:** Use `routesManifest.routes.find(r => r.id === routeId)` (the incoming route), not `activeRouteId`.
**Warning signs:** Sector panel closing when switching to a route that also has that sector (e.g., sector-520 open, switch from 100mi to 50k — panel should stay open).

### Pitfall 2: Forgetting the SECTOR_IDS Map Key in RouteExplainer
**What goes wrong:** The `SECTOR_IDS` map uses sector display names as keys. If the SEGMENTS entry is renamed but the SECTOR_IDS key is not, the sector article gets `id=""` (empty), breaking the jump link and elevation sparkline connection.
**How to avoid:** Update both `SEGMENTS[].name` and the `SECTOR_IDS` map key in the same edit.

### Pitfall 3: Leaving Dead Step 9 in renderRoute()
**What goes wrong:** Dead code remains; confuses future readers about intended behavior.
**How to avoid:** After adding the pre-check at step 1.5, delete the now-unreachable step 9 block (lines 718-722).

### Pitfall 4: Editing Generated JSON Directly
**What goes wrong:** Manual JSON edits are overwritten on next `npm run pipeline`.
**How to avoid:** Only edit the 3 source files. Run pipeline to regenerate.

### Pitfall 5: routesManifest Availability at Step 1.5
**What goes wrong:** Assuming `routesManifest` might be null when the panel close check runs.
**How to avoid:** `routesManifest` is populated in `initMap()` before the first `renderRoute()` call. After initial load, it's always populated. The guard `routesManifest?.routes.find(...)` with optional chaining is safe either way.

### Pitfall 6: Legacy Root-Level annotations.json
**What goes wrong:** `public/data/annotations.json` (root level) also contains "Rapid River Truck Trail" but is a legacy artifact. The pipeline does NOT regenerate this file — it's a leftover from pre-Phase 33.
**How to avoid:** Determine if this file is consumed by any active code. Searching shows it's not read by RouteMap.astro (which fetches per-route files) or generate-sector-details.js (which reads `100mi/annotations.json`). It's safe to leave as-is or update manually. Best approach: update it manually as part of the rename for consistency, or leave it (it's a stale artifact).

## Code Examples

### Option A: Panel Close Check Before clearActiveRoute()

```javascript
// ---- renderRoute — fetches per-route data and rebuilds all route-specific layers ----
async function renderRoute(routeId) {
  // 1. Fetch route-specific data in parallel
  const [routeData, annotations, sectorElevations, surfacePoints] = await Promise.all([
    fetch(`/data/${routeId}/route-data.json`).then(r => r.json()),
    fetch(`/data/${routeId}/annotations.json`).then(r => r.json()),
    fetch(`/data/${routeId}/sector-elevations.json`).then(r => r.json()),
    fetch(`/data/${routeId}/surface-points.json`).then(r => r.json()),
  ]);

  // 1.5. Panel close-on-switch — MUST run before clearActiveRoute() nulls activeSector
  // Close the panel if the open sector is not on the new route being loaded
  const newRouteConfig = routesManifest?.routes.find(r => r.id === routeId);
  if (activeSector && newRouteConfig && !newRouteConfig.sectorIds.includes(activeSector.sectorId)) {
    closePanel();
  }

  // 2. Clear previous route layers
  clearActiveRoute();

  // ... rest of steps 3-8 unchanged ...

  // (step 9 DELETED — was dead code, replaced by step 1.5 above)

  // 10. Update active route tracking
  activeRouteId = routeId;
  // ...
}
```

### Route-Config Rename

```javascript
// scripts/route-config.js — SECTOR_DEFS entry (line ~128)
{
  id: 'sector-rapid-river',
  name: 'Ridge Rd',           // was: 'Rapid River Truck Trail'
  startLat: 46.33280,
  // ... rest unchanged
}
```

### Generate-Sector-Details Strava Fix

```javascript
// scripts/generate-sector-details.js — SECTOR_DETAILS entry (line ~64)
{
  id: 'sector-rapid-river',
  description: "The home stretch. ...",
  surface: 'firm packed gravel, USFS-maintained',
  stravaLink: 'https://www.strava.com/segments/41188200',  // was: null
}
```

### RouteExplainer Rename + Strava

```javascript
// src/components/RouteExplainer.astro — SEGMENTS array (line ~24)
{ name: 'Ridge Rd',                            // was: 'Rapid River Truck Trail'
  startMi: 92.0, endMi: 110.0,
  distFromStart: '94.6mi', length: '6.3mi',
  difficulty: 2,
  stravaId: '41188200',                        // was: missing entirely
  description: "The home stretch. ..." }

// SECTOR_IDS map (line ~42)
'Ridge Rd': 'sector-rapid-river',             // was: 'Rapid River Truck Trail': 'sector-rapid-river'
```

## State of the Art

This phase involves no library changes. All patterns (dialog.close(), pipeline orchestration, JSON merge pattern) are established in this codebase.

## Open Questions

1. **Legacy `public/data/annotations.json` (root level)**
   - What we know: This file exists with `name: "Rapid River Truck Trail"` and is not regenerated by pipeline
   - What's unclear: Whether any active code reads this file (search shows it is not consumed by RouteMap.astro or generate-sector-details.js)
   - Recommendation: Update it manually in the same task as the rename for consistency. It's a stale artifact from pre-Phase 33 but no harm in keeping it accurate.

2. **Panel open when switching to a route where the sector IS included**
   - What we know: The fix correctly keeps the panel open when switching routes that share the sector (e.g., sector-520 and sector-rapid-river are on all 3 routes)
   - What's unclear: Whether this edge case should be tested explicitly
   - Recommendation: Include it as a verification step. Open sector-520 panel, switch route — panel should stay open.

3. **`public/data/sector-elevations.json` (root level)**
   - What we know: This file also exists with `name: "Rapid River Truck Trail"` and is not the per-route version
   - What's unclear: Whether it's consumed by any active code
   - Recommendation: Run pipeline after edits; if this file is not regenerated automatically, update manually.

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `src/components/RouteMap.astro` (lines 553-722) — bug location confirmed
- Direct code inspection of `scripts/route-config.js` — rename source confirmed
- Direct code inspection of `scripts/generate-sector-details.js` — Strava link source confirmed
- Direct code inspection of `src/components/RouteExplainer.astro` — segment name + Strava source confirmed
- Direct code inspection of `scripts/pipeline.js` — orchestration confirmed
- Direct inspection of `public/data/sector-details.json` — current state (stravaLink: null) confirmed
- Direct inspection of `public/data/routes.json` — sectorIds confirmed for all 3 routes
- Direct inspection of `.planning/v1.5-MILESTONE-AUDIT.md` — gap details confirmed

## Metadata

**Confidence breakdown:**
- Bug fix (Option A): HIGH — code flow verified by direct inspection, `clearActiveRoute()` nulls `activeSector` at line 556, step 9 at line 720 is provably dead
- Rename scope (all locations): HIGH — grep search across entire codebase, all occurrences found
- Pipeline regeneration: HIGH — pipeline.js inspected, `generate-sector-details.js` and `resolve-annotations.js` confirmed as upstream sources
- Strava link wiring: HIGH — both surfaces (panel + explainer) found and confirmed
- Legacy root-level files: MEDIUM — confirmed they exist and aren't consumed by active code, but not 100% certain no other code reads them

**Research date:** 2026-04-06
**Valid until:** Until RouteMap.astro or pipeline scripts are significantly refactored (stable, 30+ days)
