# Phase 48: Add Little Indian Segment - Research

**Researched:** 2026-04-08
**Domain:** Gravel sector data pipeline + RouteExplainer UI (pure internal config, no external libraries)
**Confidence:** HIGH (all findings from direct codebase inspection)

## Summary

Phase 48 adds Little Indian as the 8th gravel sector by touching exactly 5 source files and regenerating 5 output files via pipeline. All changes are additive — no logic changes needed in any script. The pipeline architecture (route-config.js -> resolve-annotations.js -> compute-sector-elevations.js -> generate-sector-details.js) already handles an arbitrary number of sectors; adding Little Indian requires only data entries, not code changes.

The most important discovery is that **all 5 source files already have unstaged modifications** in the working tree from prior work. The generate-sector-details.js refactor (from hardcoded descriptions to segments.json lookup) and the RouteExplainer.astro SVG tiling fix (FIX-01) are both already applied but uncommitted. These must be committed together with the phase 48 changes.

The coordinate verification confirms Little Indian sits on both 100mi (miles 65.71–71.23) and 100k (miles 25.34–30.84) routes. The 50k route is 13,717m away from the sector start — definitively not on that route.

**Primary recommendation:** Add Little Indian data entries to 4 source files, adjust 2 photo range boundaries in segments.json, run pipeline, add `nth-child(8)` stagger to RouteExplainer CSS. No architecture changes needed.

## Standard Stack

This phase has no external library dependencies. All work is internal data configuration and JSON file generation using Node.js scripts already in the project.

### Pipeline Architecture
| File | Role | How LI is Added |
|------|------|-----------------|
| `src/components/segments.json` | Editorial data + photo ranges | Add new entry, adjust ND2225/Doe Lake endMi |
| `scripts/route-config.js` | SECTOR_DEFS + sectorIds per route | Add SECTOR_DEFS entry, add to 100mi + 100k sectorIds |
| `scripts/generate-sector-details.js` | Surface label + Strava link lookup | Add SECTOR_DETAILS entry |
| `src/components/RouteExplainer.astro` | SECTOR_IDS mapping + nth-child stagger | Add SECTOR_IDS entry, add nth-child(8) |
| `public/data/photos-manifest.json` | Not modified — photo mile positions already correct | No changes needed |

### Installation

No installation needed — pipeline run via:
```bash
node scripts/pipeline.js
```

Or targeted:
```bash
node scripts/resolve-annotations.js 100mi
node scripts/resolve-annotations.js 100k
node scripts/compute-sector-elevations.js 100mi
node scripts/compute-sector-elevations.js 100k
node scripts/generate-sector-details.js
```

## Architecture Patterns

### How the Pipeline Processes Sectors

1. `route-config.js` `SECTOR_DEFS` — defines sector by id, name, startLat/startLon/endLat/endLon, difficulty, stars
2. `resolve-annotations.js` — snaps SECTOR_DEFS coordinates to nearest GPX track point (haversine); writes annotations.json with startMile, endMile, startIdx, endIdx
3. `compute-sector-elevations.js` — slices route-data.json points by startIdx/endIdx from annotations; writes sector-elevations.json
4. `generate-sector-details.js` — merges surface label + Strava link from SECTOR_DETAILS with description from segments.json and geometry from 100mi/annotations.json; writes sector-details.json

### How RouteExplainer Renders Sectors

- `SEGMENTS` (segments.json) drives the card list — order in file = order displayed
- `segmentsWithPhotos` filters photos.json by `p.mile >= seg.startMi && p.mile < seg.endMi` (exclusive upper bound)
- `SECTOR_IDS` maps segment name → sector id (enables `id` attribute on article + ElevationSparkline)
- `cardPhoto` field in segments.json is the hero image path (relative to `/images/`)

### Anti-Patterns to Avoid

- **Don't change photo mile values in photos-manifest.json** — photos are already at the correct mileages. Only adjust `startMi`/`endMi` in segments.json to control which photos fall in which segment range.
- **Don't set startMi/endMi in segments.json to match SECTOR_DEFS coordinates** — segments.json `startMi`/`endMi` are only for photo range association, not for map rendering. Map rendering uses SECTOR_DEFS coordinates exclusively.
- **Don't forget 50k** — 50k sectorIds must NOT be touched (LI is 13,717m from 50k route).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Coordinate snapping | Custom distance calc | resolve-annotations.js haversine snap (already exists) | Pipeline handles it automatically once SECTOR_DEFS entry added |
| Elevation extraction | Manual extraction | compute-sector-elevations.js (already exists) | Automatically runs after resolve-annotations |
| Description lookup | Duplicate text | segments.json `description` field (already refactored) | generate-sector-details.js now reads from segments.json via `segmentName` key |

## Common Pitfalls

### Pitfall 1: segments.json Order Determines Display Order
**What goes wrong:** If Little Indian is inserted in the wrong position in segments.json (e.g., after Doe Lake), the segment cards will render out of route order.
**Why it happens:** RouteExplainer maps SEGMENTS in array order.
**How to avoid:** Insert Little Indian between ND2225 (index 4) and Doe Lake (index 5), making it index 5 and shifting Doe Lake to index 6 and Ridge Rd to index 7.
**Warning signs:** Cards appear in wrong order on the route explainer page.

### Pitfall 2: Photo Range Overlap / Gap
**What goes wrong:** If ND2225 endMi and Little Indian startMi don't align, photos either appear in the wrong card or are omitted.
**Why it happens:** RouteExplainer uses `p.mile >= seg.startMi && p.mile < seg.endMi` — gaps cause photo orphaning, overlaps cause duplication.
**How to avoid:** Use the exact same value for ND2225's new endMi and Little Indian's startMi. Recommended: `65.8` (splits cleanly between mile 65.47 photo in ND2225 and mile 66.91 photo in LI).
**Warning signs:** LI card shows photos that belong to ND2225, or LI card shows no photos.

### Pitfall 3: generate-sector-details.js throws on missing segmentName
**What goes wrong:** Pipeline error: `no segment found for name "Little Indian"`
**Why it happens:** The refactored generate-sector-details.js looks up descriptions via `segmentName` key — the name must exactly match the `name` field in segments.json.
**How to avoid:** Ensure SECTOR_DETAILS entry `segmentName` exactly matches the `name` field added to segments.json.

### Pitfall 4: nth-child stagger not updated for 8th card
**What goes wrong:** The 8th segment card (Little Indian) has no CSS transition-delay, so it animates at the same time as the 7th.
**Why it happens:** RouteExplainer.astro currently only has nth-child(1)–(7) stagger rules.
**How to avoid:** Add `.segment-card-container:nth-child(8) { transition-delay: 700ms; }` after the 7th.
**Warning signs:** Card 8 animates identically to card 7 (cosmetic, not functional).

### Pitfall 5: FIX-01 SVG changes are uncommitted — must be committed with phase
**What goes wrong:** If only the segment data changes are committed and not RouteExplainer.astro, the SVG fix is lost.
**Why it happens:** RouteExplainer.astro already has the SVG tiling fix in the working tree (unstaged).
**How to avoid:** Stage and commit all modified files together: segments.json, route-config.js, generate-sector-details.js, RouteExplainer.astro.

### Pitfall 6: 100k sectorIds must be updated — LI IS on 100k
**What goes wrong:** Little Indian appears on 100mi map but not on 100k map.
**Why it happens:** If only 100mi sectorIds is updated.
**How to avoid:** Add `sector-little-indian` to both `100mi` and `100k` sectorIds in route-config.js. Verified: the 100k route passes within 5m of LI start and 1m of LI end.

## Code Examples

All examples verified from direct codebase inspection.

### segments.json — New Little Indian Entry

Insert between ND2225 and Doe Lake. Adjust ND2225 `endMi` and Doe Lake `startMi`:

```json
{
  "name": "Little Indian",
  "startMi": 65.8,
  "endMi": 71.5,
  "distFromStart": "65.7mi",
  "length": "5.5mi",
  "difficulty": 2,
  "stravaId": "34542982",
  "description": "[description text TBD]",
  "cardPhoto": "/images/uehdzvb4t9NxBDD02kCd53JLSdn1A6INGoMoqm9lJfA-2048x1536.jpg"
}
```

ND2225 `endMi` changes from `70.0` to `65.8`.
Doe Lake `startMi` changes from `70.0` to `71.5`.

### route-config.js — SECTOR_DEFS Entry

Coordinates verified from 100mi route-data.json (haversine snap distance from 100k route: 5m at start, 1m at end):

```js
{
  id: 'sector-little-indian',
  name: 'Little Indian',
  startLat: 46.19103,
  startLon: -86.51472,
  endLat: 46.16807,
  endLon: -86.58981,
  difficulty: 'easy',
  stars: 2,
},
```

Insert between `sector-nd2225` and `sector-doe-lake` in the SECTOR_DEFS array (position matters only for readability — the pipeline matches by id not position).

### route-config.js — sectorIds Updates

**100mi** — add `'sector-little-indian'` between `'sector-nd2225'` and `'sector-doe-lake'`:
```js
sectorIds: [
  'sector-520', 'sector-nf2266', 'sector-bass-lake', 'sector-nf2217',
  'sector-nd2225', 'sector-little-indian', 'sector-doe-lake', 'sector-rapid-river',
],
```

**100k** — add `'sector-little-indian'` between `'sector-nf2266'` and `'sector-doe-lake'`:
```js
sectorIds: ['sector-520', 'sector-nf2266', 'sector-little-indian', 'sector-doe-lake', 'sector-rapid-river'],
```

**50k** — no change.

### generate-sector-details.js — SECTOR_DETAILS Entry

```js
{
  id: 'sector-little-indian',
  segmentName: 'Little Indian',
  surface: 'forest road gravel',
  stravaLink: 'https://www.strava.com/segments/34542982',
},
```

Insert between `sector-nd2225` and `sector-doe-lake` entries.

### RouteExplainer.astro — SECTOR_IDS and nth-child

**SECTOR_IDS addition:**
```ts
'Little Indian': 'sector-little-indian',
```

**nth-child(8) stagger:**
```css
.segment-card-container:nth-child(8) { transition-delay: 700ms; }
```

**Note:** The SVG tiling fix (FIX-01) is already in the working tree — DO NOT rewrite those lines, just stage what's already there.

## Coordinate Data

Verified coordinates for SECTOR_DEFS (from 100mi route-data.json, snapped to route):

| Point | 100mi Mile | Lat | Lon | 100k Snap Dist |
|-------|-----------|-----|-----|----------------|
| LI Start | 65.71 | 46.19103 | -86.51472 | 5m |
| LI End | 71.23 | 46.16807 | -86.58981 | 1m |

The 100k sector will resolve to approximately miles 25.34–30.84 on the 100k route.

## Photo Range Data

Photos in the Little Indian zone (verified from photos-manifest.json + photos.json):

| Mile | Filename | Proposed Assignment |
|------|----------|---------------------|
| 60.04 | XcAnGEkKX_182Dv...jpg | ND2225 (< 65.8) |
| 63.16 | b8FoS3yIXlHv...jpg | ND2225 (< 65.8) |
| 65.47 | K1BlvQ0v04ge...jpg | ND2225 (< 65.8) |
| 66.91 | uehdzvb4t9Nx...jpg | **LI** (>= 65.8, < 71.5) — **recommended cardPhoto** |
| 68.81 | y2ixqJhrwwhC...jpg | **LI** (>= 65.8, < 71.5) |
| 70.11 | Esp2EJCRBear...jpg | **LI** (>= 65.8, < 71.5) |
| 70.11 | K9zNeD_N2ik...jpg | **LI** (>= 65.8, < 71.5) |
| 72.28 | wtE9BpPeXi3D...jpg | Doe Lake (>= 71.5) |
| 72.61 | U0rs5zQNNvUpy...jpg | Doe Lake (>= 71.5) |
| 75.96 | PryHw3SCuzPhq...jpg | Doe Lake (>= 71.5) |

All 3 candidate photos exist in `/public/images/`.

## Working Tree State (Pre-Phase)

The following files are already modified in the working tree and must be staged as part of this phase commit:

| File | Modification | Status |
|------|-------------|--------|
| `src/components/RouteExplainer.astro` | FIX-01: SVG wave paths fixed for seamless tiling | Unstaged |
| `scripts/generate-sector-details.js` | Refactored to read descriptions from segments.json | Unstaged |
| `public/data/sector-details.json` | Regenerated after the refactor | Unstaged |

The planner should include staging all modified files (not just new additions) in the commit task.

## Open Questions

1. **Little Indian description text** — The phase spec does not include a description. The planner will need to either use a placeholder or have a description authored. Pattern from other segments: 2-4 sentences, terrain/vegetation/challenge description.
   - What we know: It's between ND2225 and Doe Lake, approximately 5.5 miles, 2-star difficulty
   - Recommendation: Use a placeholder and flag for content authoring, or match style of existing descriptions

2. **`distFromStart` precision** — Currently set to "65.7mi" based on sector start mile. Other segments use `.Xmi` format (e.g., "55.7mi", "84.8mi"). The actual annotation will compute to ~65.71mi.
   - Recommendation: Use "65.7mi" to match format consistency

3. **`length` field precision** — Computed sector length will be ~5.52 miles (71.23 - 65.71). Other lengths use one decimal: "5.5mi" is consistent.
   - Recommendation: Use "5.5mi"

## Sources

### Primary (HIGH confidence)
- Direct inspection of `src/components/segments.json` — current 7-segment data structure
- Direct inspection of `scripts/route-config.js` — SECTOR_DEFS + sectorIds per route
- Direct inspection of `scripts/generate-sector-details.js` — current (refactored) SECTOR_DETAILS pattern
- Direct inspection of `src/components/RouteExplainer.astro` — SECTOR_IDS + CSS nth-child stagger
- Direct inspection of `public/data/100mi/route-data.json` — GPX coordinates at miles 65.71 and 71.23
- Direct inspection of `public/data/100k/route-data.json` — haversine snap verification (5m, 1m)
- Direct inspection of `public/data/50k/route-data.json` — 50k route 13,717m from LI start
- Direct inspection of `public/data/photos-manifest.json` — photo mile assignments in LI zone

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — this is pure data entry into existing well-understood patterns
- Architecture: HIGH — all pipeline code inspected, flow verified end-to-end
- Pitfalls: HIGH — photo boundary math verified, coordinate snap distances measured, working tree state confirmed
- Coordinates: HIGH — exact values extracted from route-data.json, snap distances computed

**Research date:** 2026-04-08
**Valid until:** Stable — internal data, no external dependencies
