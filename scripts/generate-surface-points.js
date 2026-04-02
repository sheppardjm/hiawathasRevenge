/**
 * generate-surface-points.js
 *
 * Reads hiawathasRevenge.json (RidewithGPS export) and public/data/route-data.json
 * (456 simplified route points), then maps each simplified point to a surface type
 * string via coordinate lookup against the original track_points S field.
 *
 * Writes the result to public/data/surface-points.json — an array of 456 entries
 * each containing { miles, surface } aligned by index with route-data.json points.
 *
 * Usage: node scripts/generate-surface-points.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// S-field to surface type mapping (RidewithGPS track_points)
// Confirmed by empirical analysis of 1927 track points against known route segments.
// RidewithGPS derives S values from OpenStreetMap surface tags.
// ---------------------------------------------------------------------------

const S_TO_SURFACE = {
  95: 'paved',    // asphalt / concrete
  56: 'gravel',   // gravel
  57: 'gravel',   // compacted/fine gravel — treat same as gravel for coloring
  59: 'dirt',     // dirt / natural surface
  0:  'unknown',  // no OSM surface tag — consumer may treat as dirt
};

// ---------------------------------------------------------------------------
// Load inputs
// ---------------------------------------------------------------------------

const routeData = JSON.parse(
  readFileSync(resolve(ROOT, 'public', 'data', 'route-data.json'), 'utf8')
);
const rwgps = JSON.parse(
  readFileSync(resolve(ROOT, 'hiawathasRevenge.json'), 'utf8')
);

const simplifiedPoints = routeData.points;        // 456 points: { lat, lon, ele, miles }
const originalPoints = rwgps.route.track_points;  // 1927 points: { x=lon, y=lat, S }

// ---------------------------------------------------------------------------
// Build coordinate lookup: "lat,lon" -> S value
// parse-gpx.js rounds coordinates to 5 decimal places when writing route-data.json.
// Use the same rounding so every simplified point finds its originating track entry.
// ---------------------------------------------------------------------------

const origLookup = new Map();
for (const op of originalPoints) {
  const key = `${Math.round(op.y * 100000) / 100000},${Math.round(op.x * 100000) / 100000}`;
  if (!origLookup.has(key)) {
    origLookup.set(key, op.S);
  }
}

// ---------------------------------------------------------------------------
// Map simplified points to surface types
// ---------------------------------------------------------------------------

let matched = 0;
let unmatched = 0;

const output = simplifiedPoints.map((sp) => {
  const key = `${sp.lat},${sp.lon}`;
  const sValue = origLookup.get(key);
  if (sValue === undefined) {
    unmatched++;
    return { miles: sp.miles, surface: 'unknown' };
  }
  matched++;
  return { miles: sp.miles, surface: S_TO_SURFACE[sValue] ?? 'unknown' };
});

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

const outputPath = resolve(ROOT, 'public', 'data', 'surface-points.json');
writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

// ---------------------------------------------------------------------------
// Summary log
// ---------------------------------------------------------------------------

console.log('generate-surface-points: complete');
console.log(`  Points matched  : ${matched}/${simplifiedPoints.length}`);
console.log(`  Points unmatched: ${unmatched}`);
console.log('  Output          : public/data/surface-points.json');

// Fail loud if significant unmatched count — more than 5 = coordinate mismatch bug
if (unmatched > 5) {
  console.error(`  ERROR: ${unmatched} unmatched points (expected 0). Check coordinate precision in parse-gpx.js.`);
  process.exit(1);
}
