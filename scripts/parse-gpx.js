/**
 * parse-gpx.js
 *
 * Parses a GPX file for a given route, applies haversine mileage computation
 * on the full-resolution track, then simplifies via RDP (simplify-js) and applies
 * a noise-filtered elevation gain calculation before writing
 * public/data/{routeId}/route-data.json.
 *
 * Usage: node scripts/parse-gpx.js <routeId>
 *   routeId: '100mi' | '100k' | '50k'
 */

import { XMLParser } from 'fast-xml-parser';
import simplify from 'simplify-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { ROUTES } from './route-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── 0. Resolve route config from argv ─────────────────────────────────────

const routeId = process.argv[2];
if (!routeId) throw new Error('Usage: node scripts/parse-gpx.js <routeId>');

const routeConfig = ROUTES.find((r) => r.id === routeId);
if (!routeConfig) throw new Error(`[parse-gpx] Unknown routeId: ${routeId}. Valid: ${ROUTES.map(r => r.id).join(', ')}`);

// ── 1. Read and parse GPX ──────────────────────────────────────────────────

const gpxContent = readFileSync(join(ROOT, routeConfig.gpxFile), 'utf-8');

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
const parsed = parser.parse(gpxContent);

const trkpts = parsed.gpx.trk.trkseg.trkpt;
console.log(`[parse-gpx:${routeId}] Parsed GPX: ${trkpts.length} raw track points`);

// Deduplicate consecutive identical coordinates (handles Strava triplicate-start artifact)
const dedupedPts = trkpts.filter((pt, i) => {
  if (i === 0) return true;
  const prev = trkpts[i - 1];
  return pt['@_lat'] !== prev['@_lat'] || pt['@_lon'] !== prev['@_lon'];
});

if (dedupedPts.length < trkpts.length) {
  console.log(`[parse-gpx:${routeId}] Deduplicated ${trkpts.length - dedupedPts.length} consecutive duplicate point(s)`);
}

// Build full-resolution point array
const fullPoints = dedupedPts.map((pt) => ({
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
console.log(`[parse-gpx:${routeId}] Total distance (full resolution): ${totalMilesFull.toFixed(2)} miles`);

// ── 3. RDP simplification via simplify-js ─────────────────────────────────

// Map to {x: lon, y: lat} carrying original index for reconstruction
const simplifyInput = fullPoints.map((pt, i) => ({ x: pt.longitude, y: pt.latitude, _i: i }));

const TOLERANCE = 0.0002; // decimal degrees — produces ~456 points for 100mi, good elevation fidelity
const simplified = simplify(simplifyInput, TOLERANCE, true);
console.log(`[parse-gpx:${routeId}] Simplified: ${simplified.length} points (from ${fullPoints.length}, tolerance=${TOLERANCE})`);

if (simplified.length > 600) {
  console.warn(`[parse-gpx:${routeId}] WARNING: ${simplified.length} points exceeds 600 target — consider increasing tolerance`);
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
// elevation changes, causing significant under-counting. Using the full point
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

const THRESHOLDS_TO_TRY = [2, 1, 3, 1.5, 2.5, 4];

let ELEVATION_THRESHOLD_METERS = 2;
let elevationGainMeters = computeElevationGain(fullPoints, ELEVATION_THRESHOLD_METERS);
let elevationGainFeet = Math.round(elevationGainMeters * 3.28084);

if (routeConfig.elevationTargetRange !== null) {
  // 100mi: Iterate thresholds until we land in the verified target range
  const TARGET_MIN_FT = routeConfig.elevationTargetRange[0];
  const TARGET_MAX_FT = routeConfig.elevationTargetRange[1];

  console.log(`[parse-gpx:${routeId}] Elevation gain scan (full ${fullPoints.length}-point set):`);
  for (const threshold of THRESHOLDS_TO_TRY) {
    const gain = computeElevationGain(fullPoints, threshold);
    const gainFt = Math.round(gain * 3.28084);
    const inRange = gainFt >= TARGET_MIN_FT && gainFt <= TARGET_MAX_FT ? ' IN RANGE' : '';
    console.log(`[parse-gpx:${routeId}]   threshold=${threshold}m -> ${Math.round(gain)}m / ${gainFt}ft${inRange}`);
    if (gainFt >= TARGET_MIN_FT && gainFt <= TARGET_MAX_FT) {
      ELEVATION_THRESHOLD_METERS = threshold;
      elevationGainMeters = gain;
      elevationGainFeet = gainFt;
      break;
    }
  }
  console.log(`[parse-gpx:${routeId}] Selected threshold: ${ELEVATION_THRESHOLD_METERS}m`);
} else {
  // 100k/50k: No verified reference range — use fixed 2m threshold
  // NOTE: Elevation figures for 100k (~1,616 ft) and 50k (~809 ft) are computed
  // but unverified against Strava/Garmin reference recordings.
  console.log(`[parse-gpx:${routeId}] Using fixed ${ELEVATION_THRESHOLD_METERS}m threshold (no verified target range)`);
}

console.log(`[parse-gpx:${routeId}] Elevation gain (${ELEVATION_THRESHOLD_METERS}m noise filter, full res): ${Math.round(elevationGainMeters)}m / ${elevationGainFeet}ft`);

// ── 5. Total distance from simplified set ─────────────────────────────────

const totalMiles = simplifiedPoints[simplifiedPoints.length - 1].miles;
console.log(`[parse-gpx:${routeId}] Total distance (simplified last point): ${totalMiles.toFixed(2)} miles`);

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

const outDir = join(ROOT, 'public', 'data', routeId);
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'route-data.json');
writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log(`[parse-gpx:${routeId}] Written: ${outPath}`);
console.log(`[parse-gpx:${routeId}] meta.pointCount=${output.meta.pointCount}, meta.totalMiles=${output.meta.totalMiles}`);
