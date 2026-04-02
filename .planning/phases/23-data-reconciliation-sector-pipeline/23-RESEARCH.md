# Phase 23: Data Reconciliation + Sector Details Pipeline - Research

**Researched:** 2026-04-02
**Domain:** Node.js build pipeline — data reconciliation, JSON generation, coordinate mapping
**Confidence:** HIGH

---

## Summary

Phase 23 is a pure data pipeline phase. No new UI components, no new runtime dependencies. All work happens in `scripts/` and `public/data/`. Three requirements map to three concrete tasks:

**DATA-01:** Add a `stars` integer (1–5) to `annotations.json`. The `difficulty` string field ('easy'/'moderate'/'hard') already exists and is used by many components — keep it. Add `stars` alongside it. Source of truth for star values is `data.md` (these values already appear in `RouteExplainer.astro` as hardcoded integers and are consistent with `data.md`). Change is confined to `scripts/resolve-annotations.js` and `src/content.config.ts`.

**DATA-02:** Create `scripts/generate-sector-details.js` that produces `public/data/sector-details.json`. This file consolidates all panel content (name, description, surface label, stars, Strava link, startMile, endMile) into one build-time artifact. The content is currently hardcoded in `RouteExplainer.astro` — Phase 23 extracts it to a JSON file without removing it from the component (that refactoring is Phase 25/26). The script follows the exact same pattern as `resolve-annotations.js`: hardcode source data as a constant, read `annotations.json` for snapped geometry, write output.

**DATA-03:** Create `scripts/generate-surface-points.js` that produces `public/data/surface-points.json`. The `hiawathasRevenge.json` file (RidewithGPS JSON export) contains a `track_points` array of 1,927 points, each with an `S` field (surface type integer). The simplified `route-data.json` has 456 points derived from those 1,927 via RDP (simplify-js). A 100% reliable coordinate matching strategy exists: every simplified point's `lat`/`lon` (rounded to 5 decimal places) exactly matches its originating full-resolution point. This was confirmed empirically — 456/456 simplified points matched by coordinate lookup.

**Primary recommendation:** Follow existing pipeline patterns exactly. All three tasks use `readFileSync`/`writeFileSync` with hardcoded source data constants, matching the `resolve-annotations.js` pattern already established.

---

## Standard Stack

This phase adds no new npm dependencies. The existing pipeline uses:

### Core (already installed)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| Node.js built-ins | — | `readFileSync`, `writeFileSync`, `fileURLToPath` | Used by all existing scripts |
| `fast-xml-parser` | ^5.5.9 | GPX parsing (not needed here) | Already in package.json |

**No new packages required.**

### Build Command
```bash
# Via Volta (required — project needs Node >=22.12.0; local is v20)
/Users/Sheppardjm/.volta/bin/node scripts/pipeline.js

# Or via npm scripts (which use Volta automatically)
npm run pipeline
```

---

## Architecture Patterns

### Existing Pattern: The Pipeline Script
Every script in `scripts/` follows this exact pattern:

```javascript
// Source: scripts/resolve-annotations.js
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// 1. Hardcoded source data (the canonical definition)
const SOURCE_DATA = [ /* ... */ ];

// 2. Load dependency files
const dependency = JSON.parse(readFileSync(resolve(ROOT, 'public', 'data', 'file.json'), 'utf8'));

// 3. Transform
const output = SOURCE_DATA.map(/* ... */);

// 4. Write output
writeFileSync(resolve(ROOT, 'public', 'data', 'output.json'), JSON.stringify(output, null, 2), 'utf8');

// 5. Log summary
console.log('script-name: complete');
```

Use `type: "module"` (already set in `package.json`) — all scripts use ESM.

### Pattern: Adding a Pipeline Step

In `pipeline.js`, the `steps` array is ordered. Insert new steps at the correct position:

```javascript
// Source: scripts/pipeline.js
const steps = [
  { name: 'parse-gpx',                  script: 'scripts/parse-gpx.js' },
  { name: 'generate-surface-points',    script: 'scripts/generate-surface-points.js' }, // NEW after parse-gpx
  { name: 'resolve-annotations',         script: 'scripts/resolve-annotations.js' },
  { name: 'generate-sector-details',     script: 'scripts/generate-sector-details.js' }, // NEW after resolve-annotations
  { name: 'compute-sector-elevations',  script: 'scripts/compute-sector-elevations.js' },
  // ... rest unchanged
];
```

`generate-surface-points` must follow `parse-gpx` (reads `route-data.json`).
`generate-sector-details` must follow `resolve-annotations` (reads `annotations.json`).

### Pattern: Coordinate-Based Mapping Between Original and Simplified Points

The key insight for DATA-03: `parse-gpx.js` rounds coordinates to 5 decimal places when writing `route-data.json`. The `hiawathasRevenge.json` full-resolution points have the same coordinates (also stored at 5+ decimal places). A simple round-to-5-decimals lookup table resolves all 456 simplified points to their original track_points entry:

```javascript
// Source: derived from parse-gpx.js analysis
// Build lookup: (rounded_lat, rounded_lon) -> original S value
const origLookup = new Map();
for (const op of originalTrackPoints) {
  const key = `${Math.round(op.y * 100000) / 100000},${Math.round(op.x * 100000) / 100000}`;
  if (!origLookup.has(key)) {
    origLookup.set(key, op.S);
  }
}

// Map simplified points to surface types
for (const sp of simplifiedPoints) {
  const key = `${sp.lat},${sp.lon}`;
  const sValue = origLookup.get(key) ?? 0;
  // ...
}
```

Verified: 456/456 simplified points find exact matches. No fallback needed.

### S Field Value Map (RidewithGPS)

The `S` field in `hiawathasRevenge.json` `track_points` is a surface type integer from RidewithGPS (derived from OpenStreetMap surface tags). The enum values are not documented in RidewithGPS's public OpenAPI spec, but are confirmed by pattern analysis:

| S Value | Count (of 1927 pts) | Miles | Surface Category |
|---------|---------------------|-------|-----------------|
| 95 | 442 | 25.8 mi | `paved` (asphalt) |
| 56 | 648 | 31.1 mi | `gravel` |
| 57 | 158 | 7.2 mi | `gravel` (compacted/fine gravel) |
| 59 | 571 | 30.8 mi | `dirt` |
| 0 | 108 | 7.1 mi | `unknown` |

**Confidence:** MEDIUM (pattern-derived, not from official docs). The mapping is internally consistent (S=95 correlates with paved road starts/ends, S=56 with known gravel roads, S=59 with forest service two-track). RidewithGPS official docs define `S` as "surface type integer" only, no enum published.

For `surface-points.json`, use this mapping:
- S=95 → `"paved"`
- S=56 → `"gravel"`
- S=57 → `"gravel"` (compacted gravel; treat same as gravel for coloring purposes)
- S=59 → `"dirt"`
- S=0 → `"unknown"` (treat as dirt for coloring fallback)

### Anti-Patterns to Avoid
- **Don't use distance-based matching for DATA-03**: The `d` field in `hiawathasRevenge.json` is in meters while `route-data.json` uses miles. Coordinate matching is more reliable and already verified at 100%.
- **Don't attempt to recalculate surface from OSM**: The S field data is already present — no external lookup needed.
- **Don't modify RouteExplainer.astro in Phase 23**: This phase PRODUCES data files, not consumers. Component refactoring to read `sector-details.json` is Phase 25/26 work.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Coordinate precision matching | Custom fuzzy search | 5-decimal round + Map lookup | Already verified 456/456 match rate |
| File I/O | Streams, async | `readFileSync`/`writeFileSync` | Consistent with all existing scripts; pipeline steps are sequential |
| Path resolution | `__dirname` hacks | `dirname(fileURLToPath(import.meta.url))` | ESM pattern already established in every script |

---

## Common Pitfalls

### Pitfall 1: Stars vs Difficulty String Mismatch
**What goes wrong:** The `difficulty` string in `annotations.json` does NOT consistently map to the `stars` integer in `data.md`. Current mismatches:
- `sector-520`: difficulty=`moderate` but stars=`2` (should be easy/2)
- `sector-nf2266`: difficulty=`moderate` but stars=`5` (should be hard/5)
- `sector-nf2217`: difficulty=`moderate` but stars=`2` (should be easy/2)
- `sector-doe-lake`: difficulty=`easy` but stars=`4` (should be hard/4)
- `sector-rapid-river`: difficulty=`hard` but stars=`2` (should be easy/2)

**Why it happens:** The `difficulty` strings in `resolve-annotations.js` were set independently from `data.md` star ratings.

**How to avoid:** `stars` is the canonical source per DATA-01. Keep `difficulty` field as-is (don't change it to avoid breaking existing components). Add `stars` as a separate field. Future phases can derive difficulty from stars if needed.

**Warning sign:** If `difficulty` and `stars` are reconciled to match each other in the same phase, many existing components break.

### Pitfall 2: Pipeline Step Ordering
**What goes wrong:** `generate-surface-points` placed after `resolve-annotations` but it only needs `route-data.json` (from `parse-gpx`). No ordering issue here, but `generate-sector-details` MUST follow `resolve-annotations` because it reads `annotations.json`.

**How to avoid:** Insert `generate-surface-points` immediately after `parse-gpx` and `generate-sector-details` immediately after `resolve-annotations`.

### Pitfall 3: content.config.ts Schema Not Updated
**What goes wrong:** Adding `stars` to `annotations.json` without updating `content.config.ts` causes Astro's content collection to throw a validation error at build time.

**How to avoid:** After modifying `resolve-annotations.js`, update the sector schema in `content.config.ts` to add `stars: z.number().int().min(1).max(5)`.

### Pitfall 4: Node Version
**What goes wrong:** Running scripts with system Node (v20.19.5) instead of Volta Node (v22+). Project's `package.json` engines field requires Node >=22.12.0.

**How to avoid:** Use `npm run pipeline` (uses Volta) or explicitly use `/Users/Sheppardjm/.volta/bin/node scripts/pipeline.js`.

### Pitfall 5: sector-details.json Surface Field vs DATA-03 Surface Field
**What goes wrong:** Using the RidewithGPS S-field-derived surface types for the `sector-details.json` surface label. The RidewithGPS data is sourced from OSM which has errors (e.g., County Road 520 shows as gravel S=56 but the editorial description says "smooth asphalt").

**How to avoid:** `sector-details.json` `surface` field = editorial description (human-authored, from RouteExplainer.astro). `surface-points.json` = mechanically derived from RidewithGPS S values. These serve different purposes.

---

## Code Examples

### DATA-01: Adding Stars to resolve-annotations.js

```javascript
// Source: scripts/resolve-annotations.js (to be modified)
const GRAVEL_SECTORS = [
  { id: 'sector-520',         name: '520',                     startMile: 1.1,  lengthMiles: 1.3, difficulty: 'moderate', stars: 2 },
  { id: 'sector-nf2266',      name: 'NF2266',                  startMile: 6.7,  lengthMiles: 3.2, difficulty: 'moderate', stars: 5 },
  { id: 'sector-bass-lake',   name: 'Bass Lake Rd',            startMile: 25.3, lengthMiles: 4.8, difficulty: 'easy',     stars: 2 },
  { id: 'sector-nf2217',      name: 'NF2217',                  startMile: 36.8, lengthMiles: 6.6, difficulty: 'moderate', stars: 2 },
  { id: 'sector-nd2225',      name: 'ND2225',                  startMile: 55.7, lengthMiles: 3.9, difficulty: 'moderate', stars: 3 },
  { id: 'sector-doe-lake',    name: 'Doe Lake',                startMile: 84.8, lengthMiles: 3.1, difficulty: 'easy',     stars: 4 },
  { id: 'sector-rapid-river', name: 'Rapid River Truck Trail', startMile: 94.6, lengthMiles: 6.3, difficulty: 'hard',     stars: 2 },
];

// In the snappedSectors.map():
return {
  // ... existing fields ...
  difficulty: sector.difficulty,
  stars: sector.stars,  // ADD THIS
};
```

### DATA-01: content.config.ts schema update

```typescript
// Source: src/content.config.ts (to be modified)
z.object({
  id: z.string(),
  type: z.literal('sector'),
  name: z.string(),
  startMile: z.number(),
  endMile: z.number(),
  lengthMiles: z.number(),
  startLat: z.number(),
  startLon: z.number(),
  endLat: z.number(),
  endLon: z.number(),
  startIdx: z.number(),
  endIdx: z.number(),
  difficulty: z.enum(['easy', 'moderate', 'hard']),
  stars: z.number().int().min(1).max(5),  // ADD THIS
})
```

### DATA-02: generate-sector-details.js structure

```javascript
// Source: new file scripts/generate-sector-details.js
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SECTOR_DETAILS = [
  {
    id: 'sector-520',
    description: 'A brief paved warm-up along County Road 520 east out of Munising...',
    surface: 'paved',
    stravaLink: 'https://www.strava.com/segments/28533709',
  },
  {
    id: 'sector-nf2266',
    description: "The route's crucible. Deep sand, washboard ruts...",
    surface: 'sand and gravel two-track',
    stravaLink: 'https://www.strava.com/segments/28533671',
  },
  // ... all 7 sectors
  {
    id: 'sector-rapid-river',
    description: "The home stretch...",
    surface: 'packed gravel',
    stravaLink: null,  // Strava segment not yet created
  },
];

// Load annotations for stars, startMile, endMile, name
const annotations = JSON.parse(
  readFileSync(resolve(ROOT, 'public', 'data', 'annotations.json'), 'utf8')
);
const sectorAnnotations = annotations.filter(a => a.type === 'sector');

// Merge
const output = SECTOR_DETAILS.map(detail => {
  const annotation = sectorAnnotations.find(a => a.id === detail.id);
  if (!annotation) throw new Error(`No annotation found for ${detail.id}`);
  return {
    id: detail.id,
    name: annotation.name,
    description: detail.description,
    surface: detail.surface,
    stars: annotation.stars,
    stravaLink: detail.stravaLink,
    startMile: annotation.startMile,
    endMile: annotation.endMile,
  };
});

writeFileSync(
  resolve(ROOT, 'public', 'data', 'sector-details.json'),
  JSON.stringify(output, null, 2),
  'utf8'
);
console.log('generate-sector-details: complete');
console.log(`  Sectors: ${output.length}`);
console.log('  Output: public/data/sector-details.json');
```

### DATA-03: generate-surface-points.js structure

```javascript
// Source: new file scripts/generate-surface-points.js
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// S-field to surface type mapping (from RidewithGPS track_points)
// Confirmed by empirical analysis of 1927 track points against known route segments
const S_TO_SURFACE = {
  95: 'paved',
  56: 'gravel',
  57: 'gravel',   // compacted/fine gravel
  59: 'dirt',
  0:  'unknown',  // treat as unknown; consumer may override to 'dirt'
};

// Load inputs
const routeData = JSON.parse(
  readFileSync(resolve(ROOT, 'public', 'data', 'route-data.json'), 'utf8')
);
const rwgps = JSON.parse(
  readFileSync(resolve(ROOT, 'hiawathasRevenge.json'), 'utf8')
);

const simplifiedPoints = routeData.points;
const originalPoints = rwgps.route.track_points;

// Build coordinate lookup: "lat,lon" -> S value
// parse-gpx.js rounds to 5 decimal places — use same rounding for lookup
const origLookup = new Map();
for (const op of originalPoints) {
  const key = `${Math.round(op.y * 100000) / 100000},${Math.round(op.x * 100000) / 100000}`;
  if (!origLookup.has(key)) {
    origLookup.set(key, op.S);
  }
}

// Map simplified points to surface types
let matched = 0;
let unmatched = 0;
const output = simplifiedPoints.map(sp => {
  const key = `${sp.lat},${sp.lon}`;
  const sValue = origLookup.get(key);
  if (sValue === undefined) {
    unmatched++;
    return { miles: sp.miles, surface: 'unknown' };
  }
  matched++;
  return { miles: sp.miles, surface: S_TO_SURFACE[sValue] ?? 'unknown' };
});

writeFileSync(
  resolve(ROOT, 'public', 'data', 'surface-points.json'),
  JSON.stringify(output, null, 2),
  'utf8'
);
console.log('generate-surface-points: complete');
console.log(`  Points matched  : ${matched}/${simplifiedPoints.length}`);
console.log(`  Points unmatched: ${unmatched}`);
console.log('  Output          : public/data/surface-points.json');

// Fail loud if significant unmatched count (more than 5 = coordinate mismatch bug)
if (unmatched > 5) {
  console.error(`  ERROR: ${unmatched} unmatched points (expected 0). Check coordinate precision.`);
  process.exit(1);
}
```

---

## Data Discrepancies Documented

### Discrepancy: 520 surface label
RidewithGPS S-field shows sector-520 as mostly S=56 (gravel), but RouteExplainer description says "smooth asphalt." County Road 520 is a paved county road in Michigan. The OSM data backing RidewithGPS may be stale or incorrect for this segment. **Resolution:** `sector-details.json` surface = `"paved"` (editorial truth). `surface-points.json` will show most of sector 520 as `"gravel"` (RidewithGPS data). Phases 25–26 will render the track coloring from `surface-points.json`; the discrepancy will be visible on the map.

### Discrepancy: difficulty string vs stars integer
Current `annotations.json` has `difficulty` strings that were assigned independently and don't consistently map to the `data.md` star ratings. See Pitfall 1 for full table. **Resolution:** Keep both fields. `stars` is authoritative per DATA-01. The `difficulty` strings are left as-is to avoid breaking existing components.

### Missing Strava ID: Rapid River Truck Trail
`segments.md` lists Strava IDs for 6 of 7 sectors. Rapid River Truck Trail has no Strava segment ID. RouteExplainer also omits the `stravaId` prop for this segment. **Resolution:** Set `stravaLink: null` in `generate-sector-details.js` for `sector-rapid-river`. Consumer components skip the Strava link when null.

---

## Output File Formats

### `public/data/annotations.json` (modified — sector entries gain `stars`)
```json
{
  "id": "sector-520",
  "type": "sector",
  "name": "520",
  "startMile": 1.1,
  "endMile": 2.4,
  "lengthMiles": 1.3,
  "startLat": 46.35686,
  "startLon": -86.73175,
  "endLat": 46.34027,
  "endLon": -86.74124,
  "startIdx": 5,
  "endIdx": 14,
  "difficulty": "moderate",
  "stars": 2
}
```

### `public/data/sector-details.json` (new)
```json
[
  {
    "id": "sector-520",
    "name": "520",
    "description": "A brief paved warm-up along County Road 520...",
    "surface": "paved",
    "stars": 2,
    "stravaLink": "https://www.strava.com/segments/28533709",
    "startMile": 1.1,
    "endMile": 2.4
  }
]
```

### `public/data/surface-points.json` (new)
```json
[
  { "miles": 0, "surface": "paved" },
  { "miles": 0.06, "surface": "gravel" },
  { "miles": 0.14, "surface": "gravel" }
]
```
Array of 456 entries, aligned with `route-data.json` points array by index.

---

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `scripts/resolve-annotations.js` — existing pipeline pattern
- Codebase analysis: `scripts/pipeline.js` — step ordering
- Codebase analysis: `scripts/parse-gpx.js` — RDP simplification, coordinate precision
- Codebase analysis: `public/data/annotations.json` — current schema
- Codebase analysis: `src/content.config.ts` — Astro content collection schema
- Codebase analysis: `src/components/RouteExplainer.astro` — hardcoded segment data
- Codebase analysis: `data.md` — canonical star ratings source
- Codebase analysis: `segments.md` — Strava IDs for 6/7 sectors
- Empirical test: 456/456 simplified points matched to original track points by coordinate lookup

### Secondary (MEDIUM confidence)
- RidewithGPS S field value mapping: pattern-derived from route context analysis. S=95 matches known paved road segments; S=56/59/57 match known gravel/dirt segments. RidewithGPS OpenAPI spec confirms `S` = "surface type integer" but publishes no enum values.

### Tertiary (LOW confidence)
- RidewithGPS developer docs at `https://ridewithgps.com/api/v1/doc/reference/track_points` confirm field names but not enum values
- Official RidewithGPS surface types article confirms: paved = asphalt/concrete/tarmac/chip seal; unpaved = gravel/dirt/natural trail

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, existing Node.js patterns
- Architecture: HIGH — directly mirrors existing pipeline scripts
- Pitfalls: HIGH — identified from codebase analysis, verified empirically
- S field values: MEDIUM — pattern-derived, not from official documentation

**Research date:** 2026-04-02
**Valid until:** Stable — this is all self-contained project data, not external API

---

## Implementation Checklist (for planner)

Tasks required for Phase 23:

1. **Modify `scripts/resolve-annotations.js`**
   - Add `stars` integer to each entry in `GRAVEL_SECTORS` const (values from data.md)
   - Include `stars` in the output object of `snappedSectors.map()`

2. **Update `src/content.config.ts`**
   - Add `stars: z.number().int().min(1).max(5)` to the sector schema in the `annotations` collection

3. **Create `scripts/generate-sector-details.js`**
   - Hardcode `SECTOR_DETAILS` const with description, surface label, Strava link per sector
   - Reads `public/data/annotations.json` for stars, startMile, endMile, name
   - Writes `public/data/sector-details.json`

4. **Create `scripts/generate-surface-points.js`**
   - Reads `hiawathasRevenge.json` for original track_points with S values
   - Reads `public/data/route-data.json` for simplified 456 points
   - Maps via coordinate lookup (5-decimal rounding)
   - Writes `public/data/surface-points.json`

5. **Modify `scripts/pipeline.js`**
   - Add `{ name: 'generate-surface-points', script: 'scripts/generate-surface-points.js' }` after `parse-gpx`
   - Add `{ name: 'generate-sector-details', script: 'scripts/generate-sector-details.js' }` after `resolve-annotations`

6. **Verify build passes**
   - Run `npm run pipeline` — all 5 logs should show "complete"
   - Run `npm run build` (or `npx astro build`) — no missing-data errors
   - Check `public/data/sector-details.json` has 7 entries
   - Check `public/data/surface-points.json` has 456 entries
   - Check `public/data/annotations.json` sectors all have `stars` field
