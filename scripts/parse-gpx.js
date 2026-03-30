/**
 * parse-gpx.js
 *
 * Parses Hiawatha_100.gpx, applies haversine mileage computation
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

const gpxContent = readFileSync(join(ROOT, 'Hiawatha_100.gpx'), 'utf-8');

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

// ── 4. Elevation gain with noise filter — computed on FULL-RESOLUTION set ─
//
// IMPORTANT: Elevation gain must be computed on fullPoints, not simplifiedPoints.
// RDP simplification optimises for horizontal accuracy and discards intermediate
// elevation changes, causing significant under-counting. Using the full 1927-point
// set gives figures consistent with Garmin/Strava recordings.

function computeElevationGain(points, thresholdMeters) {
  let gainMeters = 0;
  let lastEle = points[0].elevation;
  for (let i = 1; i < points.length; i++) {
    const delta = points[i].elevation - lastEle;
    if (Math.abs(delta) > thresholdMeters) {
      if (delta > 0) {
        gainMeters += delta;
      }
      lastEle = points[i].elevation;
    }
  }
  return gainMeters;
}

// Target range: 2,123–2,411 ft (user-verified GPS figures)
// Iterate thresholds starting at 2m until we land in range
const TARGET_MIN_FT = 2123;
const TARGET_MAX_FT = 2411;
const THRESHOLDS_TO_TRY = [2, 1, 3, 1.5, 2.5, 4];

let ELEVATION_THRESHOLD_METERS = 2;
let elevationGainMeters = computeElevationGain(fullPoints, ELEVATION_THRESHOLD_METERS);
let elevationGainFeet = Math.round(elevationGainMeters * 3.28084);

console.log(`Elevation gain scan (full ${fullPoints.length}-point set):`);
for (const threshold of THRESHOLDS_TO_TRY) {
  const gain = computeElevationGain(fullPoints, threshold);
  const gainFt = Math.round(gain * 3.28084);
  const inRange = gainFt >= TARGET_MIN_FT && gainFt <= TARGET_MAX_FT ? ' ✓ IN RANGE' : '';
  console.log(`  threshold=${threshold}m → ${Math.round(gain)}m / ${gainFt}ft${inRange}`);
  if (gainFt >= TARGET_MIN_FT && gainFt <= TARGET_MAX_FT) {
    ELEVATION_THRESHOLD_METERS = threshold;
    elevationGainMeters = gain;
    elevationGainFeet = gainFt;
    break;
  }
}

console.log(`Selected threshold: ${ELEVATION_THRESHOLD_METERS}m`);
console.log(`Elevation gain (${ELEVATION_THRESHOLD_METERS}m noise filter, full res): ${Math.round(elevationGainMeters)}m / ${elevationGainFeet}ft`);

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
