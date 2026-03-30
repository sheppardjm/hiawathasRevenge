/**
 * parse-gpx.js
 *
 * Parses Munising_Hiawatha_s_Revenge.gpx, applies haversine mileage computation
 * on the full-resolution track, then simplifies via RDP (simplify-js) and applies
 * a noise-filtered elevation gain calculation before writing public/data/route-data.json.
 *
 * Usage: node scripts/parse-gpx.js
 */

import { XMLParser } from 'fast-xml-parser';
import simplify from 'simplify-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── 1. Read and parse GPX ──────────────────────────────────────────────────

const gpxContent = readFileSync(join(ROOT, 'Munising_Hiawatha_s_Revenge.gpx'), 'utf-8');

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
const parsed = parser.parse(gpxContent);

const trkpts = parsed.gpx.trk.trkseg.trkpt;
console.log(`Parsed GPX: ${trkpts.length} raw track points`);

// Build full-resolution point array
const fullPoints = trkpts.map((pt) => ({
  latitude: parseFloat(pt['@_lat']),
  longitude: parseFloat(pt['@_lon']),
  elevation: typeof pt.ele === 'number' ? pt.ele : parseFloat(pt.ele),
}));

// ── 2. Compute cumulative mileage on FULL point set ────────────────────────

function haversineMeters(p1, p2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(p2.latitude - p1.latitude);
  const dLon = toRad(p2.longitude - p1.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const a =
    sinLat * sinLat +
    Math.cos(toRad(p1.latitude)) * Math.cos(toRad(p2.latitude)) * sinLon * sinLon;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let cumulativeMeters = 0;
for (let i = 0; i < fullPoints.length; i++) {
  if (i === 0) {
    fullPoints[i].miles = 0;
  } else {
    cumulativeMeters += haversineMeters(fullPoints[i - 1], fullPoints[i]);
    fullPoints[i].miles = cumulativeMeters / 1609.344;
  }
}

const totalMilesFull = fullPoints[fullPoints.length - 1].miles;
console.log(`Total distance (full resolution): ${totalMilesFull.toFixed(2)} miles`);

// ── 3. RDP simplification via simplify-js ─────────────────────────────────

// Map to {x: lon, y: lat} carrying original index for reconstruction
const simplifyInput = fullPoints.map((pt, i) => ({ x: pt.longitude, y: pt.latitude, _i: i }));

const TOLERANCE = 0.0002; // decimal degrees — produces ~456 points, good elevation fidelity
const simplified = simplify(simplifyInput, TOLERANCE, true);
console.log(`Simplified: ${simplified.length} points (from ${fullPoints.length}, tolerance=${TOLERANCE})`);

if (simplified.length > 600) {
  console.warn(`WARNING: ${simplified.length} points exceeds 600 target — consider increasing tolerance`);
}

// Reconstruct full point data using original index
const simplifiedPoints = simplified.map((sp) => {
  const orig = fullPoints[sp._i];
  return {
    lat: Math.round(orig.latitude * 100000) / 100000,
    lon: Math.round(orig.longitude * 100000) / 100000,
    ele: Math.round(orig.elevation * 10) / 10,
    miles: Math.round(orig.miles * 100) / 100,
  };
});

// ── 4. Elevation gain with noise filter ───────────────────────────────────

const ELEVATION_THRESHOLD_METERS = 5;
let elevationGainMeters = 0;
let lastEle = simplifiedPoints[0].ele;

for (let i = 1; i < simplifiedPoints.length; i++) {
  const delta = simplifiedPoints[i].ele - lastEle;
  if (Math.abs(delta) > ELEVATION_THRESHOLD_METERS) {
    if (delta > 0) {
      elevationGainMeters += delta;
    }
    lastEle = simplifiedPoints[i].ele;
  }
}

const elevationGainFeet = Math.round(elevationGainMeters * 3.28084);
console.log(`Elevation gain (${ELEVATION_THRESHOLD_METERS}m noise filter): ${Math.round(elevationGainMeters)}m / ${elevationGainFeet}ft`);

// ── 5. Total distance from simplified set ─────────────────────────────────

const totalMiles = simplifiedPoints[simplifiedPoints.length - 1].miles;
console.log(`Total distance (simplified last point): ${totalMiles.toFixed(2)} miles`);

// ── 6. Write output JSON ───────────────────────────────────────────────────

const output = {
  points: simplifiedPoints,
  meta: {
    totalMiles,
    elevationGainMeters: Math.round(elevationGainMeters),
    elevationGainFeet,
    pointCount: simplifiedPoints.length,
    originalPointCount: fullPoints.length,
    simplificationTolerance: TOLERANCE,
    elevationThresholdMeters: ELEVATION_THRESHOLD_METERS,
  },
};

const outDir = join(ROOT, 'public', 'data');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'route-data.json');
writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log(`Written: ${outPath}`);
console.log(`meta.pointCount=${output.meta.pointCount}, meta.totalMiles=${output.meta.totalMiles}`);
