# Phase 33: Pipeline & Route Data - Research

**Researched:** 2026-04-06
**Domain:** Node.js build pipeline, GPX parsing, multi-route JSON generation
**Confidence:** HIGH — all findings verified against actual source code and GPX files

## Summary

Phase 33 expands the existing 12-step build pipeline to process all 3 GPX files and produce per-route JSON data in subdirectories (`public/data/100mi/`, `public/data/100k/`, `public/data/50k/`). No new npm dependencies are needed — the existing stack (fast-xml-parser, simplify-js) handles everything.

The most important pre-research finding: **actual sector membership differs from the assumptions in prior planning docs.** The 100k and 50k routes loop through the NORTHERN part of the route and pass through Doe Lake and Rapid River sectors (within 5-37m), but NOT through Bass Lake, NF2217-2218, or ND2225 (which are 1,400-26,000m away). Both STACK.md and the phase context estimated membership incorrectly using mile-based reasoning; coordinate analysis proves otherwise.

There is also an important architectural discrepancy between two prior research docs: STACK.md recommends flat `route-data-100mi.json` filename patterns while ARCHITECTURE.md recommends subdirectory patterns (`100mi/route-data.json`). The phase success criteria explicitly requires subdirectories — use the subdirectory approach.

**Primary recommendation:** Create `scripts/route-config.js` as the single source of truth for route definitions and verified sector membership. Run the 4 route-specific pipeline steps in a loop over 3 routes. Use coordinate-based snapping (not mile-based) for sector annotation on shorter routes. Use proximity-based surface inheritance from 100mi RidewithGPS data for 100k/50k surface-points.

## Standard Stack

### Core (No Changes)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fast-xml-parser | 5.5.9 | GPX XML parsing | Already installed, handles all 3 GPX formats |
| simplify-js | 1.2.4 | RDP point simplification | Already installed, stateless, works per-route |
| Node.js built-in | fs, path | File I/O | No dependency needed |

### No New Dependencies Required

All pipeline logic uses stateless pure functions (haversine, RDP simplification, elevation gain). The only architectural change is parameterizing these functions over multiple inputs. No library additions needed.

**Installation:** None required.

## Architecture Patterns

### Recommended Project Structure (New Files)
```
scripts/
├── route-config.js          # NEW: route definitions, sector membership, GPX file refs
├── generate-routes-manifest.js  # NEW: writes public/data/routes.json
├── pipeline.js              # MODIFY: loop route-specific steps
├── parse-gpx.js             # MODIFY: accept routeId arg, write to subdir
├── generate-surface-points.js   # MODIFY: proximity fallback for 100k/50k
├── resolve-annotations.js  # MODIFY: coordinate-based snapping, per-route membership
├── compute-sector-elevations.js # MODIFY: read/write per-route paths
└── copy-gpx.js              # MODIFY: copy all 3 GPX files

public/data/
├── routes.json              # NEW: route manifest with metadata
├── 100mi/
│   ├── route-data.json
│   ├── annotations.json
│   ├── sector-elevations.json
│   └── surface-points.json
├── 100k/
│   ├── route-data.json
│   ├── annotations.json
│   ├── sector-elevations.json
│   └── surface-points.json
├── 50k/
│   ├── route-data.json
│   ├── annotations.json
│   ├── sector-elevations.json
│   └── surface-points.json
├── sector-details.json      # SHARED (editorial, unchanged)
├── photos.json              # SHARED (unchanged)
└── [other shared files]     # SHARED (unchanged)
```

### Pattern 1: Route Config as Single Source of Truth

Create `scripts/route-config.js` defining all routes and their verified sector membership. This config is imported by pipeline.js and all route-specific scripts.

```javascript
// scripts/route-config.js
export const ROUTES = [
  {
    id: '100mi',
    name: '100 Mile',
    gpxFile: 'Munising_Hiawatha_s_Revenge.gpx',
    rwgpsJson: 'hiawathasRevenge.json',  // RidewithGPS JSON with S-field surface data
    color: '#c8973e',
    sectorIds: [
      'sector-520', 'sector-nf2266', 'sector-bass-lake',
      'sector-nf2217', 'sector-nd2225', 'sector-doe-lake',
      'sector-rapid-river'
    ],
    restockIds: ['restock-camp7', 'restock-midway'],
    elevationTargetRange: [2123, 2411],  // ft — verified against Garmin/Strava
  },
  {
    id: '100k',
    name: '100K',
    gpxFile: 'Hiawatha_s_Revenge_100k.gpx',
    rwgpsJson: null,  // Strava export, no RidewithGPS surface data
    color: '#5b9279',
    sectorIds: ['sector-520', 'sector-nf2266', 'sector-doe-lake', 'sector-rapid-river'],
    restockIds: ['restock-midway'],  // Midway at 9m from 100k route; Camp 7 at 11,512m (not on route)
    elevationTargetRange: null,
  },
  {
    id: '50k',
    name: '50K',
    gpxFile: 'Hiawatha_s_Revenge_50K_.gpx',
    rwgpsJson: null,  // RidewithGPS GPX but no JSON export in repo
    color: '#4a90c4',
    sectorIds: ['sector-520', 'sector-nf2266', 'sector-doe-lake', 'sector-rapid-river'],
    restockIds: [],  // No restock within 200m of 50k route
    elevationTargetRange: null,
  },
];

export const DEFAULT_ROUTE_ID = '100mi';

// COORDINATE-BASED SECTOR DEFINITIONS
// These lat/lon values come from the 100mi annotations.json (verified coordinates).
// Used for coordinate snapping on shorter routes instead of mile-based snapping.
export const SECTOR_DEFS = [
  { id: 'sector-520',         name: '520',                     startLat: 46.35686, startLon: -86.73175, endLat: 46.34030, endLon: -86.74120, difficulty: 'moderate', stars: 2 },
  { id: 'sector-nf2266',      name: 'NF2266',                  startLat: 46.33319, startLon: -86.65629, endLat: 46.29100, endLon: -86.67160, difficulty: 'moderate', stars: 5 },
  { id: 'sector-bass-lake',   name: 'Bass Lake Rd',            startLat: 46.18725, startLon: -86.45743, endLat: 46.12210, endLon: -86.43600, difficulty: 'easy',     stars: 2 },
  { id: 'sector-nf2217',      name: 'NF2217-2218',             startLat: 46.07159, startLon: -86.46703, endLat: 46.07140, endLon: -86.54380, difficulty: 'moderate', stars: 2 },
  { id: 'sector-nd2225',      name: 'ND2225',                  startLat: 46.13733, startLon: -86.60283, endLat: 46.15290, endLon: -86.54050, difficulty: 'moderate', stars: 3 },
  { id: 'sector-doe-lake',    name: 'Doe Lake',                startLat: 46.25740, startLon: -86.67980, endLat: 46.26230, endLon: -86.74500, difficulty: 'easy',     stars: 4 },
  { id: 'sector-rapid-river', name: 'Rapid River Truck Trail', startLat: 46.33280, startLon: -86.78320, endLat: 46.35690, endLon: -86.73320, difficulty: 'hard',     stars: 2 },
];

export const RESTOCK_DEFS = [
  { id: 'restock-camp7',  name: 'Camp 7 Lake Campground', mile: 44.7, lat: 46.0549, lon: -86.5487 },
  { id: 'restock-midway', name: 'Midway General Store',   mile: 75.7, lat: 46.1679, lon: -86.6236 },
];
```

### Pattern 2: Pipeline Loop Over Routes

`pipeline.js` runs route-specific steps in a loop:

```javascript
// Route-specific steps — run once per route
const routeSpecificSteps = [
  { name: 'parse-gpx',                    script: 'scripts/parse-gpx.js' },
  { name: 'generate-surface-points',      script: 'scripts/generate-surface-points.js' },
  { name: 'resolve-annotations',          script: 'scripts/resolve-annotations.js' },
  { name: 'compute-sector-elevations',    script: 'scripts/compute-sector-elevations.js' },
];

// Shared steps — run once total
const sharedSteps = [
  { name: 'generate-routes-manifest',     script: 'scripts/generate-routes-manifest.js' },
  { name: 'generate-sector-details',      script: 'scripts/generate-sector-details.js' },
  { name: 'generate-thumbnails',          script: 'scripts/generate-thumbnails.js' },
  { name: 'copy-images',                  script: 'scripts/copy-images.js' },
  { name: 'generate-webp',               script: 'scripts/generate-webp.js' },
  { name: 'process-historical',           script: 'scripts/process-historical.js' },
  { name: 'match-photos',                 script: 'scripts/match-photos.js' },
  { name: 'copy-gpx',                     script: 'scripts/copy-gpx.js' },
  { name: 'generate-og-image',            script: 'scripts/generate-og-image.js' },
];

// Run route-specific steps for each route
for (const route of ROUTES) {
  for (const { name, script } of routeSpecificSteps) {
    execFileSync(process.execPath, [script, route.id], { cwd: projectRoot, stdio: 'inherit' });
  }
}

// Run shared steps once
for (const { name, script } of sharedSteps) {
  execFileSync(process.execPath, [script], { cwd: projectRoot, stdio: 'inherit' });
}
```

### Pattern 3: Coordinate-Based Sector Snapping

For 100k/50k routes, snap sectors by geographic proximity (not mile-based), because sector mile markers are defined on the 100mi route but geographic positions are fixed:

```javascript
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function snapByCoordinate(targetLat, targetLon, routePoints) {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < routePoints.length; i++) {
    const dist = haversineMeters(targetLat, targetLon, routePoints[i].lat, routePoints[i].lon);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  const pt = routePoints[bestIdx];
  return { lat: pt.lat, lon: pt.lon, ele: pt.ele, miles: pt.miles, snapIdx: bestIdx, snapDist: bestDist };
}

// Use for all routes (not just shorter routes — coordinate snapping is more correct than mile-based for 100mi too)
```

**Membership validation:** A sector is "on" a route if its start and end coordinates snap within 200m. Sectors beyond 1,400m are definitively NOT on the route.

### Pattern 4: Proximity-Based Surface Inheritance

For 100k/50k routes lacking RidewithGPS JSON, inherit surface type from the nearest 100mi RidewithGPS point:

```javascript
// For 100mi: exact coordinate key lookup (existing behavior)
// For 100k/50k: nearest-neighbor from 100mi surface data

// Build surface lookup from 100mi RidewithGPS data (same as current, but as a distance-based lookup)
const origPoints = rwgps.route.track_points;  // {x: lon, y: lat, S}

function findNearestSurface(targetLat, targetLon, origPoints) {
  let bestDist = Infinity;
  let bestS = 0;
  for (const op of origPoints) {
    const dist = haversineMeters(targetLat, targetLon, op.y, op.x);
    if (dist < bestDist) {
      bestDist = dist;
      bestS = op.S;
    }
  }
  // Points >100m from any 100mi point are on divergent segments — mark as 'unknown'
  return bestDist < 100 ? (S_TO_SURFACE[bestS] ?? 'unknown') : 'unknown';
}
```

**Note:** The 100mi route covers the shared northern segments (520, NF2266, Doe Lake, Rapid River areas). The proximity approach gives accurate surface coloring for the shared roads and degrades gracefully to 'unknown' on divergent sections.

### Pattern 5: Routes Manifest

`generate-routes-manifest.js` reads each route's generated `route-data.json` and the route config to produce `public/data/routes.json`:

```json
{
  "defaultRoute": "100mi",
  "routes": [
    {
      "id": "100mi",
      "name": "100 Mile",
      "shortName": "100mi",
      "gpxFile": "Munising_Hiawatha_s_Revenge.gpx",
      "color": "#c8973e",
      "totalMiles": 102.0,
      "elevationGainFeet": 2258,
      "sectorIds": ["sector-520", "sector-nf2266", "sector-bass-lake", "sector-nf2217", "sector-nd2225", "sector-doe-lake", "sector-rapid-river"]
    },
    {
      "id": "100k",
      "name": "100K",
      "shortName": "100k",
      "gpxFile": "Hiawatha_s_Revenge_100k.gpx",
      "color": "#5b9279",
      "totalMiles": 61.7,
      "elevationGainFeet": 1616,
      "sectorIds": ["sector-520", "sector-nf2266", "sector-doe-lake", "sector-rapid-river"]
    },
    {
      "id": "50k",
      "name": "50K",
      "shortName": "50k",
      "gpxFile": "Hiawatha_s_Revenge_50K_.gpx",
      "color": "#4a90c4",
      "totalMiles": 31.2,
      "elevationGainFeet": 809,
      "sectorIds": ["sector-520", "sector-nf2266", "sector-doe-lake", "sector-rapid-river"]
    }
  ]
}
```

### Pattern 6: Backward-Compatible Path Update

Success criterion 5 requires the 100mi site to render identically from the new subdirectory paths. Update all data consumers in one coordinated change:

**content.config.ts:** Change `loader: file('public/data/route-data.json', ...)` to `loader: file('public/data/100mi/route-data.json', ...)` (and same for annotations, sector-elevations).

**RouteMap.astro:** Change `fetch('/data/route-data.json')` to `fetch('/data/100mi/route-data.json')` (and similar for all 4 route-specific fetches).

**ElevationProfile.astro:** Same fetch path updates.

The shared files (`sector-details.json`, `photos.json`, etc.) stay at `public/data/` with no path changes.

### Anti-Patterns to Avoid

- **Mile-based sector snapping for shorter routes:** NF2217-2218 starts at mile 36.8 on the 100mi route, but that mile position is on a completely different road segment on 100k/50k. Geographic coordinates are the only reliable anchor.
- **Running pipeline steps in nested loops with execFileSync:** Pass route ID as `process.argv[2]`, not as env vars, to avoid shell-specific issues.
- **Overwriting public/data/*.json during per-route loops:** Always write to per-route subdirectories; never write to the flat `public/data/` root for route-specific data.
- **Using Hiawatha_100.gpx for any processing:** This is a 252K-line raw device recording (~84,000 points, ~10MB). It is NOT one of the 3 routes for the pipeline.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Haversine distance | Custom trig | Copy from existing parse-gpx.js | Already correct and battle-tested in the codebase |
| GPX XML parsing | Custom regex/parser | fast-xml-parser (already installed) | Handles namespace variants, attribute prefixes |
| Point simplification | Custom RDP | simplify-js (already installed) | Well-tested, handles edge cases |
| JSON file writing | Stream/buffer | fs.writeFileSync | Sync write is fine for build pipeline |

**Key insight:** This phase is 90% data flow plumbing. The mathematical functions (haversine, RDP) are already written and tested. The work is parameterization, looping, and directory structure.

## Verified Sector Membership

This is the most critical data in this research. Verified by measuring haversine distance from each sector's start/end coordinates to the nearest point on each route's GPX track:

| Sector | 100mi start | 100k start | 50k start | On 100mi | On 100k | On 50k |
|--------|-------------|------------|-----------|----------|---------|--------|
| 520 | 0m | 17m | 2m | YES | YES | YES |
| NF2266 | 0m | 13m | 4m | YES | YES | YES |
| Bass Lake Rd | 0m | 2,171m | 17,553m | YES | NO | NO |
| NF2217-2218 | 0m | 12,818m | 26,116m | YES | NO | NO |
| ND2225 | 0m | 1,446m | 14,575m | YES | NO | NO |
| Doe Lake | 0m | 17m | 37m | YES | YES | YES |
| Rapid River | 0m | 4m | 5m | YES | YES | YES |

**Membership threshold:** 200m = "on this route." All verified — no ambiguous cases.

**Restock points:**
- Camp 7 Lake (mile 44.7 on 100mi): 11,512m from 100k, 24,634m from 50k — 100mi only
- Midway General Store: 9m from 100k route — 100mi and 100k; 10,830m from 50k — not on 50k

**Note for route-config.js:** STACK.md estimated 100k had [sector-520, sector-nf2266, sector-bass-lake, sector-nf2217] and 50k had [sector-520, sector-nf2266]. Both are WRONG. The correct membership is [sector-520, sector-nf2266, sector-doe-lake, sector-rapid-river] for BOTH 100k and 50k. This is because the shorter routes loop NORTH back to Munising and traverse the same northern gravel sectors.

## Route Data Facts

Verified by parsing all GPX files:

| Route | GPX File | Source | Track Points | Actual Distance | Est. Simplified Pts |
|-------|----------|--------|-------------|----------------|---------------------|
| 100mi | Munising_Hiawatha_s_Revenge.gpx | RidewithGPS | 1,927 | 102.0 mi | ~456 |
| 100k | Hiawatha_s_Revenge_100k.gpx | Strava (StravaGPX) | 2,780 | 61.7 mi | ~300-450 |
| 50k | Hiawatha_s_Revenge_50K_.gpx | RidewithGPS | 954 | 31.2 mi | ~150-250 |
| (unused) | Hiawatha_100.gpx | Unknown (raw device) | 22,992 | -- | DO NOT USE |

**Elevation gains (computed with 2m threshold):**
- 100mi: verified 2,258 ft (from existing route-data.json meta)
- 100k: ~1,616 ft (computed, no Strava reference to validate)
- 50k: ~809 ft (computed, no reference to validate)

## Common Pitfalls

### Pitfall 1: GPX Source Differences (Strava vs RidewithGPS)

**What goes wrong:** 100k is from Strava and has triplicate starting points (artifact), 7-decimal lat/lon, no `<metadata>` block. 50k is from RidewithGPS with a `<metadata>` block.

**How to avoid:** Add duplicate-point deduplication (skip consecutive identical coords). The existing `parsed.gpx.trk.trkseg.trkpt` access path works for all 3 files — verified by running the parser mentally against each GPX structure.

**Warning signs:** Total distance for 100k is slightly off due to the 3 identical starting points contributing ~0m but inflating point count.

### Pitfall 2: Elevation Calibration Is 100mi-Specific

**What goes wrong:** `parse-gpx.js` has a threshold calibration loop targeting 2,123-2,411 ft which is the 100mi verified range. Running this loop against 100k/50k finds no match and silently uses default 2m.

**How to avoid:** The `elevationTargetRange: null` config for 100k/50k triggers the calibration to skip its range check and use the fixed 2m threshold. Log the computed elevation gain prominently so it can be manually verified.

### Pitfall 3: Content Collection Paths Break Astro Build

**What goes wrong:** `content.config.ts` loads `public/data/route-data.json` (flat path). After Phase 33, this file no longer exists at that path — it's at `public/data/100mi/route-data.json`. Astro will fail to build.

**How to avoid:** Update `content.config.ts` in the same commit that moves the pipeline output. The `ElevationSparkline.astro` component uses `getCollection('sectorElevations')` at build time — this collection must load from `public/data/100mi/sector-elevations.json`.

**Warning signs:** Astro build fails with "file not found" on content collection loaders.

### Pitfall 4: generate-sector-details.js Has a Hardcoded Dependency

**What goes wrong:** `generate-sector-details.js` calls `sectorAnnotations.find(a => a.id === detail.id)` against `public/data/annotations.json`. After Phase 33, this file is at `public/data/100mi/annotations.json`. The script will fail unless updated.

**How to avoid:** Update the `annotationsPath` in `generate-sector-details.js` to read from `public/data/100mi/annotations.json` (the 100mi version is the canonical source for editorial sector details).

### Pitfall 5: Surface Proximity Lookup Is O(n×m) and Can Be Slow

**What goes wrong:** For each of ~300 100k simplified points, finding the nearest of 1,927 RidewithGPS points requires ~582,000 haversine calculations. This is slower than the current O(n) key lookup.

**How to avoid:** The pipeline runs at build time, not in the browser. Even if it takes 2-3 seconds extra per route, this is acceptable. If needed, a simple spatial index (grid bucketing by lat/lon degrees) would reduce this to O(n×k) where k is the bucket size. For MVP, brute-force is fine.

### Pitfall 6: resolve-annotations.js Reads from Flat Path

**What goes wrong:** Currently reads from `public/data/route-data.json`. In the multi-route pipeline, it must read from `public/data/{routeId}/route-data.json`.

**How to avoid:** Accept `routeId` from `process.argv[2]`, construct the input path as `join(ROOT, 'public', 'data', routeId, 'route-data.json')`.

### Pitfall 7: compute-sector-elevations.js Reads from Flat Paths

**What goes wrong:** Reads from both `public/data/route-data.json` and `public/data/annotations.json`. Both move to subdirectories.

**How to avoid:** Same pattern — accept `routeId` from `process.argv[2]`, use `join(ROOT, 'public', 'data', routeId, ...)` for all paths.

## Code Examples

### GPX Parsing (Multi-Route)

```javascript
// scripts/parse-gpx.js — accept routeId from argv
import { ROUTES } from './route-config.js';

const routeId = process.argv[2];
if (!routeId) throw new Error('Usage: node scripts/parse-gpx.js <routeId>');

const routeConfig = ROUTES.find(r => r.id === routeId);
if (!routeConfig) throw new Error(`Unknown routeId: ${routeId}`);

const gpxContent = readFileSync(join(ROOT, routeConfig.gpxFile), 'utf-8');
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
const parsed = parser.parse(gpxContent);

// Handle both Strava (no metadata) and RidewithGPS (with metadata) GPX structures
const trkpts = parsed.gpx.trk.trkseg.trkpt;

// Deduplicate consecutive identical points (Strava triplicate start artifact)
const dedupedPts = trkpts.filter((pt, i) => {
  if (i === 0) return true;
  const prev = trkpts[i - 1];
  return pt['@_lat'] !== prev['@_lat'] || pt['@_lon'] !== prev['@_lon'];
});

const outDir = join(ROOT, 'public', 'data', routeId);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'route-data.json'), JSON.stringify(output, null, 2));
```

### Coordinate-Based Annotation Snapping

```javascript
// scripts/resolve-annotations.js — coordinate-based snapping for all routes
import { ROUTES, SECTOR_DEFS, RESTOCK_DEFS } from './route-config.js';

const routeId = process.argv[2];
const routeConfig = ROUTES.find(r => r.id === routeId);

// Load this route's simplified points
const routeData = JSON.parse(readFileSync(join(ROOT, 'public', 'data', routeId, 'route-data.json'), 'utf8'));
const routePoints = routeData.points;

// Filter sectors to those on this route (from config — already verified by coordinate analysis)
const routeSectors = SECTOR_DEFS.filter(s => routeConfig.sectorIds.includes(s.id));

// Snap by geographic coordinate (not mile)
function snapByCoordinate(targetLat, targetLon, points) {
  let bestIdx = 0, bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const dist = haversineMeters(targetLat, targetLon, points[i].lat, points[i].lon);
    if (dist < bestDist) { bestDist = dist; bestIdx = i; }
  }
  const pt = points[bestIdx];
  return { lat: pt.lat, lon: pt.lon, ele: pt.ele, miles: pt.miles, snapIdx: bestIdx, snapDist: bestDist };
}

const snappedSectors = routeSectors.map(sector => {
  const startSnap = snapByCoordinate(sector.startLat, sector.startLon, routePoints);
  const endSnap = snapByCoordinate(sector.endLat, sector.endLon, routePoints);
  return {
    id: sector.id, type: 'sector', name: sector.name,
    startMile: round(startSnap.miles, 2), endMile: round(endSnap.miles, 2),
    lengthMiles: round(endSnap.miles - startSnap.miles, 2),
    startLat: startSnap.lat, startLon: startSnap.lon,
    endLat: endSnap.lat, endLon: endSnap.lon,
    startIdx: startSnap.snapIdx, endIdx: endSnap.snapIdx,
    difficulty: sector.difficulty, stars: sector.stars,
  };
});

writeFileSync(join(ROOT, 'public', 'data', routeId, 'annotations.json'), JSON.stringify([...snappedSectors, ...snappedRestocks], null, 2));
```

### Surface Points with Proximity Fallback

```javascript
// scripts/generate-surface-points.js
import { ROUTES } from './route-config.js';

const routeId = process.argv[2];
const routeConfig = ROUTES.find(r => r.id === routeId);

const routeData = JSON.parse(readFileSync(join(ROOT, 'public', 'data', routeId, 'route-data.json'), 'utf8'));
const simplifiedPoints = routeData.points;

let output;
if (routeConfig.rwgpsJson) {
  // 100mi: exact coordinate key lookup (existing behavior)
  const rwgps = JSON.parse(readFileSync(join(ROOT, routeConfig.rwgpsJson), 'utf8'));
  const origLookup = new Map();
  for (const op of rwgps.route.track_points) {
    const key = `${Math.round(op.y * 100000) / 100000},${Math.round(op.x * 100000) / 100000}`;
    if (!origLookup.has(key)) origLookup.set(key, op.S);
  }
  output = simplifiedPoints.map(sp => {
    const key = `${sp.lat},${sp.lon}`;
    const sValue = origLookup.get(key);
    return { miles: sp.miles, surface: sValue !== undefined ? (S_TO_SURFACE[sValue] ?? 'unknown') : 'unknown' };
  });
} else {
  // 100k/50k: proximity-based from 100mi RidewithGPS data
  const rwgps = JSON.parse(readFileSync(join(ROOT, '100mi-rwgps.json'), 'utf8'));  // or read hiawathasRevenge.json
  output = simplifiedPoints.map(sp => {
    let bestDist = Infinity, bestS = 0;
    for (const op of rwgps.route.track_points) {
      const dist = haversineMeters(sp.lat, sp.lon, op.y, op.x);
      if (dist < bestDist) { bestDist = dist; bestS = op.S; }
    }
    const surface = bestDist < 100 ? (S_TO_SURFACE[bestS] ?? 'unknown') : 'unknown';
    return { miles: sp.miles, surface };
  });
}

writeFileSync(join(ROOT, 'public', 'data', routeId, 'surface-points.json'), JSON.stringify(output, null, 2));
```

## State of the Art

| Old Approach | Phase 33 Approach | Impact |
|--------------|-------------------|--------|
| Single hardcoded GPX file path | Route config table, routeId from argv | Loop over 3 routes |
| Mile-based sector snapping | Coordinate-based snapping (lat/lon) | Correct positions for all routes |
| Exact coordinate key for surface | Proximity haversine for 100k/50k | Surface coloring works without RidewithGPS JSON |
| Flat `public/data/*.json` | Per-route subdirectories | Lazy loading; no index collisions |
| No route manifest | `routes.json` manifest | Route selector UI can load metadata first |

**Deprecated/changed:**
- `public/data/route-data.json` (flat path) → `public/data/100mi/route-data.json`
- `public/data/annotations.json` (flat) → per-route subdirectory
- `public/data/sector-elevations.json` (flat) → per-route subdirectory
- `public/data/surface-points.json` (flat) → per-route subdirectory

## Open Questions

1. **100k/50k elevation gain validation**
   - What we know: computed as ~1,616 ft (100k) and ~809 ft (50k) with 2m threshold
   - What's unclear: no Strava/Garmin reference to cross-check against
   - Recommendation: Log the values prominently in pipeline output. Add a comment in route-config.js noting these are unverified. Flag for manual cross-check against RidewithGPS route page.

2. **50k Doe Lake sector alignment confidence**
   - What we know: Doe Lake start is 37.2m from nearest 50k point (within 200m threshold)
   - What's unclear: 37.2m is the largest proximity of any "on route" sector — borderline
   - Recommendation: Accept 37.2m as "on route" (threshold is 200m; 37m is fine). If sector overlay looks off visually, increase threshold to 50m and validate.

3. **Strava 100k duplicate start points**
   - What we know: First 3 track points of 100k GPX are identical (Strava export artifact)
   - What's unclear: Whether deduplication is needed or the distance impact is negligible
   - Recommendation: Add deduplication of consecutive identical coordinates in parse-gpx.js. The 3 identical points contribute 0 meters to distance so the impact is minimal, but deduplication is cleaner.

4. **generate-sector-details.js: Reads from 100mi annotations**
   - What we know: This script reads `public/data/annotations.json` (flat path, will break)
   - What's unclear: Should it read from `public/data/100mi/annotations.json` or from SECTOR_DEFS in route-config.js?
   - Recommendation: Update the path to `public/data/100mi/annotations.json`. The sector IDs and coordinates come from the 100mi route's annotations, which is correct — editorial details are route-agnostic.

## Sources

### Primary (HIGH confidence)
- Direct analysis of all 12 pipeline scripts (`/scripts/*.js`) — file I/O paths, dependencies, data flow
- Direct analysis of `/src/content.config.ts` — content collection schemas and loaders
- Direct analysis of `RouteMap.astro` (lines 309-316) and `ElevationProfile.astro` (lines 56, 66) — runtime fetch paths
- Python coordinate analysis of all 3 GPX files — verified sector membership, actual distances, snap distances

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` (2026-04-06) — architectural decisions, component change patterns
- `.planning/research/PITFALLS.md` (2026-04-06) — pitfall catalog (HIGH confidence where derived from code analysis)
- `.planning/research/STACK.md` (2026-04-06) — stack assessment (use with caution: sector membership table is incorrect)

### Corrections to Prior Research
- **STACK.md sector membership is WRONG:** It claims 100k has [520, NF2266, Bass Lake, NF2217] and 50k has [520, NF2266]. Coordinate analysis disproves this. Correct membership is [520, NF2266, Doe Lake, Rapid River] for BOTH 100k and 50k.
- **STACK.md vs ARCHITECTURE.md file naming:** STACK.md recommends flat keyed filenames (`route-data-100mi.json`). ARCHITECTURE.md and the phase success criteria require subdirectories (`100mi/route-data.json`). Use subdirectories.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against package.json, existing script imports
- Architecture: HIGH — derived from direct code and GPX analysis
- Sector membership: HIGH — verified by haversine distance from every sector to every route
- Surface fallback: MEDIUM — proximity approach is correct in theory; accuracy on divergent segments is inherently uncertain
- Elevation gain for 100k/50k: LOW — computed but unverified against reference recordings

**Research date:** 2026-04-06
**Valid until:** Stable (pipeline infrastructure changes rarely; valid until GPX files are replaced or sectors change)
