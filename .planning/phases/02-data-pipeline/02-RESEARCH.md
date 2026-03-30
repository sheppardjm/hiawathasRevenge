# Phase 2: Data Pipeline - Research

**Researched:** 2026-03-30
**Domain:** GPX parsing, polyline simplification, elevation noise filtering, coordinate snapping, Astro Content Collections
**Confidence:** HIGH (core stack verified via official docs and GitHub), MEDIUM (elevation threshold validation approach)

## Summary

Phase 2 builds a Node.js data pipeline that converts a raw GPX file into two JSON files consumed by the Astro frontend. The pipeline consists of three scripts: a GPX parser that outputs `route-data.json`, an annotation resolver that outputs `annotations.json`, and an orchestrator that wires both as npm lifecycle hooks.

The standard approach is to use `@we-gold/gpxjs` for GPX parsing (modern ESM, typed output, built-in elevation stats) combined with `simplify-js` for RDP reduction. Elevation noise filtering is implemented as a manual threshold loop (standard ~5m minimum delta) — no library needed. Coordinate snapping (for annotations) is a simple minimum-distance scan over the route array. The Astro content layer `file()` loader with Zod schemas handles downstream type-safe consumption, with the constraint that JSON files must be arrays-of-objects-with-id or keyed objects.

**Primary recommendation:** Use `@we-gold/gpxjs` for GPX parsing (avoid manual XML + fast-xml-parser plumbing), use `simplify-js` directly for RDP (avoid @turf/simplify overhead for a single LineString), hand-roll the elevation noise filter (trivial loop, no library needed), and validate the 5m threshold against the known Garmin/Strava figure for this specific GPX after first run.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@we-gold/gpxjs` | latest | Parse GPX to typed JS objects with computed stats | Modern ESM, TypeScript, extracts lat/lon/elevation/distance directly — no XML wrangling |
| `simplify-js` | 1.2.4 | RDP polyline simplification | Vladimir Agafonkin (Leaflet author), well-tested, tiny, no deps |
| Node.js built-ins (`fs`, `path`) | Node 25 | File I/O for pipeline scripts | No external deps needed for reading/writing JSON |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `fast-xml-parser` | 5.5.9 | General XML parsing | Only if @we-gold/gpxjs is insufficient — not needed here |
| `@turf/simplify` | 7.x | RDP on GeoJSON features | Heavier option if working with full GeoJSON pipeline |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@we-gold/gpxjs` | `fast-xml-parser` directly | Manual: must parse GPX XML schema, handle trkpt attributes (@_lat, @_lon), compute distances yourself |
| `@we-gold/gpxjs` | `@tmcw/togeojson` | Converts to GeoJSON (lon/lat/ele in array), requires further processing; last release 0.16.2 (Sep 2023) |
| `simplify-js` | `@turf/simplify` | Turf works on GeoJSON FeatureCollections, heavier; simplify-js works on `{x, y}` arrays directly |
| Manual threshold loop | `gpx-smoother` npm package | gpx-smoother is Node.js only (no ESM), not maintained; threshold loop is 10 lines |

**Installation:**
```bash
PATH="/usr/local/opt/node/bin:$PATH" npm install @we-gold/gpxjs simplify-js
```

## Architecture Patterns

### Recommended Project Structure
```
scripts/
├── parse-gpx.js          # BUILD-01/02/03: reads GPX, simplifies, filters, writes route-data.json
├── resolve-annotations.js # BUILD-06: snaps restock/sector table to route coords, writes annotations.json
└── pipeline.js           # BUILD-07: orchestrator — imports and runs both scripts in order

public/
└── data/                 # output directory (create if absent)
    ├── route-data.json   # consumed by route map components
    └── annotations.json  # consumed by annotation overlay components

src/
└── content.config.ts     # Astro Content Layer schemas for route-data, annotations, photos
```

### Pattern 1: GPX Parsing with @we-gold/gpxjs
**What:** Import `parseGPX`, pass raw GPX string, get typed object with `.tracks[0].points[]` each having `latitude`, `longitude`, `elevation`, and the computed `.tracks[0].distance.total`.
**When to use:** Always — this is the only required step before simplification.
**Example:**
```javascript
// Source: https://github.com/We-Gold/gpxjs
import { parseGPX } from '@we-gold/gpxjs';
import { readFileSync } from 'fs';

const xml = readFileSync('Munising_Hiawatha_s_Revenge.gpx', 'utf8');
const [parsed, error] = parseGPX(xml);
if (error) throw error;

const points = parsed.tracks[0].points;
// Each point: { latitude, longitude, elevation, time }
// parsed.tracks[0].distance.total  → total distance in meters
// parsed.tracks[0].elevation       → { max, min, gain, loss }
```

**GPX file facts (verified):**
- 1,927 track points in a single `<trkseg>`
- No extensions — pure `<trkpt lat="..." lon="..."><ele>...</ele></trkpt>` structure
- Source: ridewithgps.com, created 2018

### Pattern 2: Cumulative Mileage Computation
**What:** Walk the points array, accumulate haversine distance between consecutive pairs, convert meters → miles.
**When to use:** After parsing, before simplification. Must be computed on the FULL point set, then carried through via index mapping after simplification.

```javascript
// Hand-rolled haversine — no library needed for this use case
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Build full point array with cumulative miles
let cumMiles = 0;
const fullPoints = points.map((pt, i) => {
  if (i > 0) {
    const prev = points[i-1];
    cumMiles += haversineMeters(prev.latitude, prev.longitude, pt.latitude, pt.longitude) / 1609.344;
  }
  return { lat: pt.latitude, lon: pt.longitude, ele: pt.elevation, miles: cumMiles };
});
```

### Pattern 3: RDP Simplification with simplify-js
**What:** `simplify-js` expects `{x, y}` objects. Map lat→y, lon→x, simplify, then reconstruct. Use `highQuality: true` for geographic data.
**When to use:** After computing cumulative mileage on full set. Target output: under 600 points.

**Critical note about tolerance:** `simplify-js` uses the same units as the coordinates. For lat/lon in decimal degrees, a tolerance of `0.0005` (≈ 55m) is a starting point — but must be tuned against the 600-point target. With 1,927 source points, expect to test tolerance values in the range `0.0003–0.001`.

```javascript
import simplify from 'simplify-js';

// Map to {x, y, data} — simplify-js only passes through x/y
// Carry index so we can recover elevation and miles after simplification
const xyPoints = fullPoints.map((pt, i) => ({ x: pt.lon, y: pt.lat, _i: i }));

// highQuality: true uses pure RDP (no radial-distance pre-pass)
const simplified = simplify(xyPoints, 0.0005, true);

// Recover full data via original index
const routePoints = simplified.map(pt => fullPoints[pt._i]);
// routePoints.length should be < 600
```

**Important:** `simplify-js` v1.2.4 is a CJS module. In an ESM project (`"type": "module"` in package.json), use:
```javascript
import simplify from 'simplify-js'; // works via default CJS interop in Node 25
```
If interop fails, use `createRequire`:
```javascript
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const simplify = require('simplify-js');
```

### Pattern 4: Elevation Noise Filter
**What:** Walk the (simplified) point array and only accumulate elevation gain when the delta exceeds a threshold. Use ~5m threshold per phase requirement.
**When to use:** Applied to the simplified point set when computing the `elevationGain` stat to emit in `route-data.json`. The raw elevation values are kept as-is in the output; only the computed gain stat uses the threshold.

```javascript
function computeElevationGain(points, thresholdMeters = 5) {
  let gain = 0;
  let lastEle = points[0].ele;
  for (let i = 1; i < points.length; i++) {
    const delta = points[i].ele - lastEle;
    if (delta > thresholdMeters) {
      gain += delta;
      lastEle = points[i].ele;
    } else if (delta < -thresholdMeters) {
      // reset baseline on significant descent
      lastEle = points[i].ele;
    }
    // small fluctuations ignored
  }
  return gain;
}
```

**Validation requirement:** After first run, compare `elevationGain` output to the known Garmin/Strava figure. If outside ±10%, adjust threshold. Typical Garmin/Strava smoothing corresponds to roughly 5–10m thresholds (per GPS Visualizer guidance).

### Pattern 5: Coordinate Snapping for Annotations
**What:** For each restock point and gravel sector (defined by named mileage in `data.md`), find the nearest route coordinate by scanning the simplified route array and minimizing distance.
**When to use:** In `resolve-annotations.js`, after loading the simplified route (or the output `route-data.json`).

```javascript
function snapToRoute(lat, lon, routePoints) {
  let minDist = Infinity;
  let snapIdx = 0;
  for (let i = 0; i < routePoints.length; i++) {
    const d = Math.hypot(routePoints[i].lat - lat, routePoints[i].lon - lon);
    if (d < minDist) { minDist = d; snapIdx = i; }
  }
  return { ...routePoints[snapIdx], snapIdx };
}
```

**Data source for annotations (from data.md):**

Gravel sectors (start distances from start):
| Sector | Distance from Start | Length |
|--------|---------------------|--------|
| 520 | 1.1mi | 1.3mi |
| NF2266 | 6.7mi | 3.2mi |
| Bass Lake Rd | 25.3mi | 4.8mi |
| NF2217 | 36.8mi | 6.6mi |
| ND2225 | 55.7mi | 3.9mi |
| Doe Lake | 84.8mi | 3.1mi |
| Rapid River Truck Trail | 94.6mi | 6.3mi |

Restock points:
| Location | Distance from Start |
|----------|---------------------|
| Camp 7 Lake Campground | 44.7mi |
| Midway General Store | 75.7mi |

**Snapping approach for annotation data:** The annotation table uses mileage, not lat/lon. Snap by finding the route point whose `miles` value is closest to the annotation's distance-from-start. This avoids needing to geocode place names.

```javascript
function snapByMileage(targetMiles, routePoints) {
  let minDiff = Infinity;
  let snapIdx = 0;
  for (let i = 0; i < routePoints.length; i++) {
    const diff = Math.abs(routePoints[i].miles - targetMiles);
    if (diff < minDiff) { minDiff = diff; snapIdx = i; }
  }
  return { ...routePoints[snapIdx], snapIdx };
}
```

### Pattern 6: Output JSON Schema
**What:** The format both output files must conform to for `file()` loader compatibility.

**route-data.json** — single object (use custom parser in content.config.ts OR structure as single-entry array):
```json
{
  "points": [
    { "lat": 46.364, "lon": -86.714, "ele": 261.9, "miles": 0.0 },
    ...
  ],
  "meta": {
    "totalMiles": 103.2,
    "elevationGain": 4200,
    "pointCount": 580
  }
}
```

**annotations.json** — array of objects with `id` field (direct file() loader compatibility):
```json
[
  {
    "id": "camp-7-lake",
    "type": "restock",
    "name": "Camp 7 Lake Campground",
    "targetMiles": 44.7,
    "snappedMiles": 44.68,
    "lat": 46.123,
    "lon": -86.456,
    "amenities": "water pump, vault toilet"
  },
  {
    "id": "520",
    "type": "sector",
    "name": "520",
    "startMiles": 1.1,
    "endMiles": 2.4,
    "difficulty": "2-star",
    "startLat": 46.111, "startLon": -86.444,
    "endLat": 46.122, "endLon": -86.455
  }
]
```

**Important file() loader constraint:** The standard `file()` loader requires either an array of objects (each with a unique `id` field) OR an object with string keys. `route-data.json` is a single flat object — it will NOT work with `file()` directly. Use a custom `parser` callback or wrap as `[{ id: "route", ...routeData }]`.

### Pattern 7: Astro Content Collections with file() Loader
**What:** `src/content.config.ts` defines Zod schemas for each JSON output.
**When to use:** After pipeline produces the JSON files; consumed by Astro components.

```typescript
// src/content.config.ts
// Source: https://docs.astro.build/en/guides/content-collections/
import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

// annotations.json: array with id — works with default file() loader
const annotations = defineCollection({
  loader: file('public/data/annotations.json'),
  schema: z.object({
    type: z.enum(['restock', 'sector']),
    name: z.string(),
    targetMiles: z.number().optional(),
    startMiles: z.number().optional(),
    endMiles: z.number().optional(),
    difficulty: z.string().optional(),
    lat: z.number().optional(),
    lon: z.number().optional(),
    snappedMiles: z.number().optional(),
    amenities: z.string().optional(),
    startLat: z.number().optional(),
    startLon: z.number().optional(),
    endLat: z.number().optional(),
    endLon: z.number().optional(),
  }),
});

// route-data.json: single object — needs custom parser to wrap as single-entry array
const routeData = defineCollection({
  loader: file('public/data/route-data.json', {
    parser: (text) => {
      const data = JSON.parse(text);
      return [{ id: 'route', ...data }];
    },
  }),
  schema: z.object({
    points: z.array(z.object({
      lat: z.number(),
      lon: z.number(),
      ele: z.number(),
      miles: z.number(),
    })),
    meta: z.object({
      totalMiles: z.number(),
      elevationGain: z.number(),
      pointCount: z.number(),
    }),
  }),
});

export const collections = { annotations, routeData };
```

### Pattern 8: Pipeline Orchestrator + npm Hooks
**What:** `scripts/pipeline.js` runs all scripts in order. Wired as `prebuild` and `predev` lifecycle hooks in `package.json`.

```javascript
// scripts/pipeline.js
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(script) {
  console.log(`[pipeline] running ${script}...`);
  execFileSync(process.execPath, [path.join(__dirname, script)], { stdio: 'inherit' });
}

run('parse-gpx.js');
run('resolve-annotations.js');
console.log('[pipeline] done');
```

```json
// package.json scripts section
{
  "scripts": {
    "pipeline": "node scripts/pipeline.js",
    "prebuild": "node scripts/pipeline.js",
    "predev": "node scripts/pipeline.js",
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

**npm lifecycle hook behavior (verified):** `npm run build` automatically runs `prebuild` first. `npm run dev` automatically runs `predev` first. This requires no extra tooling — it's native npm behavior.

**Node.js path prefix:** All pipeline scripts must be invoked with `PATH="/usr/local/opt/node/bin:$PATH"` in the terminal (or run via `npm` which inherits that env). The `node scripts/pipeline.js` strings in package.json resolve to whatever `node` is on PATH — the user must `export PATH="/usr/local/opt/node/bin:$PATH"` or always prefix npm commands.

### Anti-Patterns to Avoid
- **Don't compute cumulative mileage AFTER simplification:** Mileage values will be subtly wrong (RDP removes points, changing accumulated distance). Compute on the full set, then select values at surviving indices.
- **Don't use @tmcw/togeojson for this pipeline:** It converts to GeoJSON (lon/lat in `[lon, lat, ele]` order per GeoJSON spec — note reversed order), requires DOM parser shim in Node.js, and adds an unnecessary conversion step.
- **Don't store `route-data.json` as a raw array of 600 coordinate objects at the top level:** Astro's `file()` loader would treat each coordinate as a separate collection entry. Use the single-object + custom-parser approach above.
- **Don't use global state or module-level side effects in pipeline scripts:** Each script should be independently runnable via `node scripts/parse-gpx.js` for debugging.
- **Don't hardcode output paths:** Use `path.join(process.cwd(), 'public/data/...')` to keep scripts portable.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GPX XML parsing | Custom XML string parsing | `@we-gold/gpxjs` | GPX schema has quirks; @we-gold handles extensions, multiple segments, time parsing |
| RDP algorithm | Custom polyline simplification | `simplify-js` | RDP has many edge cases; Agafonkin's implementation is battle-tested in Leaflet |
| Elevation gain lib | `gpx-smoother` or `gpx-calc-elevation-gain` | Manual threshold loop | Both are unmaintained/CJS-only; the algorithm is 10 lines |
| Coordinate snapping | External snap-to-road API | Linear scan over route array | Route is static and offline; mileage-based snap is accurate enough; no API key needed |

**Key insight:** The elevation filter, cumulative mileage, and coordinate snapping are each under 20 lines of JavaScript. The only real complexity is GPX XML parsing and RDP — both solved by the two listed libraries.

## Common Pitfalls

### Pitfall 1: simplify-js CJS/ESM Interop
**What goes wrong:** Importing `simplify-js` as `import simplify from 'simplify-js'` may fail in a strict ESM project with `"type": "module"` — the package has no ESM export.
**Why it happens:** simplify-js v1.2.4 (2020) predates ESM. Node 25 supports CJS-to-ESM interop for default imports in most cases, but behavior can depend on the package.json `exports` field.
**How to avoid:** Test the import early. If it fails, use `createRequire(import.meta.url)` to require it as a CJS module.
**Warning signs:** `ERR_REQUIRE_ESM` or `The requested module does not provide an export named 'default'`

### Pitfall 2: simplify-js Tolerance Units
**What goes wrong:** Setting tolerance too low (0.00001) leaves 1,800+ points; setting too high (0.01) collapses the route to 20 points.
**Why it happens:** Tolerance is in the same units as coordinates — decimal degrees. For lat/lon, 0.001° ≈ 111m. Target range for under-600-point output: `0.0003–0.0008`.
**How to avoid:** Log `simplified.length` during development. Tune until below 600.
**Warning signs:** Output point count is near the input count (tolerance too low) or the route looks like a triangle (tolerance too high).

### Pitfall 3: Elevation Gain Threshold Too High for Michigan Terrain
**What goes wrong:** A 10m threshold may under-count elevation for this relatively flat UP Michigan route, producing a gain significantly below the Garmin figure.
**Why it happens:** Michigan's Upper Peninsula terrain has many small rollers; a 10m threshold filters out legitimate gain.
**How to avoid:** Start at 5m per the phase requirement. Validate against the known Garmin/Strava figure within 10%. If under-counting, lower to 3m. If over-counting (unlikely with threshold), raise to 7m.
**Warning signs:** Computed gain is more than 10% below known figure.

### Pitfall 4: file() Loader Requires id Field
**What goes wrong:** `annotations.json` entries missing `id` field cause Astro content layer to throw during build.
**Why it happens:** The `file()` loader's array-of-objects mode requires each entry to have a unique `id` string.
**How to avoid:** Ensure `resolve-annotations.js` writes an `id` field on every annotation entry (e.g., kebab-case of the name).
**Warning signs:** Astro build error: `Entry is missing required 'id' field`

### Pitfall 5: public/data/ Directory May Not Exist
**What goes wrong:** `fs.writeFileSync('public/data/route-data.json', ...)` throws `ENOENT` if `public/data/` doesn't exist.
**Why it happens:** New project, directory never created.
**How to avoid:** In `pipeline.js` or each script, call `fs.mkdirSync('public/data', { recursive: true })` before writing.

### Pitfall 6: content.config.ts Not Found Warning in Phase 1
**What goes wrong:** `[WARN] content config not loaded` in Phase 1 dev output was expected. In Phase 2, if `content.config.ts` exists but `public/data/*.json` files don't (e.g., before first pipeline run), Astro throws at build time.
**Why it happens:** `file()` loader tries to read files during build.
**How to avoid:** Always run `npm run pipeline` before `npm run dev` or `npm run build`. The `predev`/`prebuild` hooks handle this automatically, but a first-time `npm install` won't trigger them.

### Pitfall 7: GeoJSON Coordinate Order vs. lat/lon
**What goes wrong:** GeoJSON stores coordinates as `[longitude, latitude]` (x, y order). If mixing togeojson output with direct lat/lon references, coordinates swap.
**Why it happens:** Convention mismatch between geospatial standards and human intuition.
**How to avoid:** Use `@we-gold/gpxjs` which returns `.latitude` and `.longitude` named properties — no ambiguity. Never use positional coordinate arrays internally.

## Code Examples

Verified patterns from official sources:

### Full parse-gpx.js skeleton
```javascript
// scripts/parse-gpx.js
import { parseGPX } from '@we-gold/gpxjs';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import simplify from 'simplify-js'; // or createRequire fallback

const GPX_PATH = join(process.cwd(), 'Munising_Hiawatha_s_Revenge.gpx');
const OUT_DIR = join(process.cwd(), 'public', 'data');
const OUT_PATH = join(OUT_DIR, 'route-data.json');

// 1. Parse GPX
const [parsed, err] = parseGPX(readFileSync(GPX_PATH, 'utf8'));
if (err) throw err;
const rawPoints = parsed.tracks[0].points;

// 2. Compute cumulative mileage on FULL point set
// ... (haversine loop)

// 3. RDP simplification
// ... (simplify-js call with tolerance tuning)

// 4. Compute elevation gain with noise filter
// ... (threshold loop, default 5m)

// 5. Write output
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify({ points: routePoints, meta }, null, 2));
console.log(`[parse-gpx] wrote ${routePoints.length} points to ${OUT_PATH}`);
```

### content.config.ts with file() loader
```typescript
// Source: https://docs.astro.build/en/guides/content-collections/
// Source: https://docs.astro.build/en/reference/content-loader-reference/
import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

const annotations = defineCollection({
  loader: file('public/data/annotations.json'),
  schema: z.object({ /* ... see Pattern 6 schema above ... */ }),
});

const routeData = defineCollection({
  loader: file('public/data/route-data.json', {
    parser: (text) => [{ id: 'route', ...JSON.parse(text) }],
  }),
  schema: z.object({ /* ... see Pattern 6 schema above ... */ }),
});

export const collections = { annotations, routeData };
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Astro `src/content/` folder with markdown files | Content Layer API (`src/content.config.ts` with loaders) | Astro 5.0 (late 2024) | Now supports arbitrary data sources via loaders; `file()` for JSON |
| `@mapbox/togeojson` | `@we-gold/gpxjs` | 2022+ | More modern API, typed, computes stats; mapbox version last updated 2023 |
| Manual RDP implementation | `simplify-js` | Stable since 2014 | Agafonkin's implementation is the reference; no reason to hand-roll |
| `src/content/` collection type `'data'` | `file()` loader | Astro 5.0 | Type `'data'` is legacy; use `file()` loader in content.config.ts |

**Deprecated/outdated:**
- Astro legacy content collections (`src/content/config.ts` with `defineCollection({ type: 'data' })`): replaced by Content Layer API in Astro 5.0. This project uses Astro 6 — use the new API only.
- `type: 'data'` in old defineCollection: does not exist in Astro 6 content layer.

## Open Questions

1. **Exact tolerance value for simplify-js to hit <600 points**
   - What we know: 1,927 source points; typical tolerance for lat/lon ≈ 0.0003–0.001
   - What's unclear: Actual compression ratio for this specific Michigan route (relatively straight roads vs. winding forest trails)
   - Recommendation: Make tolerance a named constant at the top of `parse-gpx.js` (e.g., `const RDP_TOLERANCE = 0.0005`), log the resulting count, and iterate during 02-01 execution

2. **Known Garmin/Strava elevation figure for validation**
   - What we know: Route source is ridewithgps.com (2018). Phase requirement says "matches known Garmin/Strava figures within 10%"
   - What's unclear: The actual target figure is not documented in the repo. `@we-gold/gpxjs` reports `.tracks[0].elevation.gain` as a cross-check, but that has no noise filter applied.
   - Recommendation: Plan 02-01 should include a step to read `parsed.tracks[0].elevation.gain` (raw library gain) and log it alongside the threshold-filtered gain. The planner should add a human verification step for the known figure.

3. **simplify-js ESM interop on Node 25**
   - What we know: Package is CJS only; Node 25 has improved CJS-ESM interop
   - What's unclear: Whether `import simplify from 'simplify-js'` works directly in Node 25 with `"type": "module"`
   - Recommendation: Plan 02-01 should test the import first; provide `createRequire` fallback in the plan

4. **photos collection schema (task 02-04)**
   - What we know: Plan mentions `photos` collection in content.config.ts
   - What's unclear: No photos directory or photo data exists yet. The schema may need to be a stub/placeholder.
   - Recommendation: Define a minimal photos schema in 02-04 that can be extended later (Phase 2 only needs route-data and annotations to be functional)

## Sources

### Primary (HIGH confidence)
- https://github.com/We-Gold/gpxjs — @we-gold/gpxjs API, TypeScript types, point structure
- https://docs.astro.build/en/guides/content-collections/ — file() loader, Zod schema integration
- https://docs.astro.build/en/reference/content-loader-reference/ — file() loader constraints (array or keyed object required, id field required)
- https://docs.astro.build/en/reference/modules/astro-content/ — getCollection/getEntry API
- https://mourner.github.io/simplify-js/ — simplify-js API (tolerance, highQuality parameters)
- https://github.com/mourner/simplify-js — current version v1.2.4
- https://github.com/NaturalIntelligence/fast-xml-parser — fast-xml-parser v5.5.9, ESM API, attribute parsing config
- https://docs.npmjs.com/cli/v11/using-npm/scripts/ — prebuild/predev lifecycle hook behavior

### Secondary (MEDIUM confidence)
- https://www.gpsvisualizer.com/tutorials/elevation_gain.php — elevation threshold guidance (5–10m range), Strava/Garmin smoothing pattern
- https://github.com/withastro/roadmap/discussions/626 — Astro single-file collection confirmed supported since 5.0
- https://turfjs.org/docs/api/simplify — @turf/simplify API (tolerance parameter in decimal degrees)

### Tertiary (LOW confidence)
- WebSearch results on pnpm predev behavior — pnpm does NOT run predev hooks; npm does. Project uses npm so this is not a concern, but worth noting if package manager ever changes.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — @we-gold/gpxjs and simplify-js verified via official GitHub; Astro file() loader verified via official docs
- Architecture: HIGH — pattern verified against Astro 6 content layer API; GPX structure verified by inspecting actual file (1,927 points, no extensions)
- Pitfalls: MEDIUM — simplify-js ESM interop and tolerance tuning are empirical; elevation gain threshold requires validation against actual Garmin/Strava figure

**Research date:** 2026-03-30
**Valid until:** 2026-05-01 (stable libraries; Astro content layer API is stable in 6.x)
