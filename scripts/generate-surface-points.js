/**
 * generate-surface-points.js
 *
 * Maps each simplified route point to a surface type string and writes the
 * result to public/data/${routeId}/surface-points.json.
 *
 * Two modes:
 *  - Exact lookup (100mi):  Build a "lat,lon" -> S Map from RidewithGPS JSON
 *    track_points. Every simplified point should find an exact match.
 *  - Proximity fallback (100k/50k): No RidewithGPS JSON available. Load the
 *    100mi RidewithGPS JSON and find the nearest original track point within
 *    100 m using haversine distance. Segments with no nearby match receive
 *    surface = 'unknown'.
 *
 * Usage: node scripts/generate-surface-points.js <routeId>
 *   e.g. node scripts/generate-surface-points.js 100mi
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { ROUTES } from './route-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Parse argv
// ---------------------------------------------------------------------------

const routeId = process.argv[2];
if (!routeId) {
  console.error('Usage: node scripts/generate-surface-points.js <routeId>');
  process.exit(1);
}

const routeConfig = ROUTES.find((r) => r.id === routeId);
if (!routeConfig) {
  console.error(`generate-surface-points: unknown routeId "${routeId}"`);
  console.error(`  Valid ids: ${ROUTES.map((r) => r.id).join(', ')}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// S-field to surface type mapping (RidewithGPS track_points)
// Confirmed by empirical analysis of 1927 track points against known route segments.
// RidewithGPS derives S values from OpenStreetMap surface tags.
// ---------------------------------------------------------------------------

const S_TO_SURFACE = {
  95: 'paved',    // asphalt / concrete
  56: 'gravel',   // gravel
  57: 'gravel',   // compacted/fine gravel -- treat same as gravel for coloring
  59: 'dirt',     // dirt / natural surface
  0:  'unknown',  // no OSM surface tag -- consumer may treat as dirt
};

// ---------------------------------------------------------------------------
// Haversine distance helper (inline; used by proximity mode)
// ---------------------------------------------------------------------------

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Load simplified route points for this route
// ---------------------------------------------------------------------------

const routeData = JSON.parse(
  readFileSync(resolve(ROOT, 'public', 'data', routeId, 'route-data.json'), 'utf8')
);
const simplifiedPoints = routeData.points;

// ---------------------------------------------------------------------------
// Build surface map and generate output
// ---------------------------------------------------------------------------

let output;
let matched = 0;
let unknown = 0;

if (routeConfig.rwgpsJson) {
  // ---- Exact coordinate key lookup (100mi) --------------------------------
  const rwgps = JSON.parse(
    readFileSync(resolve(ROOT, routeConfig.rwgpsJson), 'utf8')
  );
  const originalPoints = rwgps.route.track_points;

  // Build "lat,lon" -> S lookup. parse-gpx.js rounds to 5 decimal places.
  const origLookup = new Map();
  for (const op of originalPoints) {
    const key = `${Math.round(op.y * 100000) / 100000},${Math.round(op.x * 100000) / 100000}`;
    if (!origLookup.has(key)) {
      origLookup.set(key, op.S);
    }
  }

  output = simplifiedPoints.map((sp) => {
    const key = `${sp.lat},${sp.lon}`;
    const sValue = origLookup.get(key);
    if (sValue === undefined) {
      unknown++;
      return { miles: sp.miles, surface: 'unknown' };
    }
    matched++;
    return { miles: sp.miles, surface: S_TO_SURFACE[sValue] ?? 'unknown' };
  });

  console.log(`generate-surface-points (${routeId}): exact lookup mode`);
  console.log(`  Points matched  : ${matched}/${simplifiedPoints.length}`);
  console.log(`  Points unmatched: ${unknown}`);

  // Fail loud for exact mode -- more than 5 unmatched = coordinate mismatch bug
  if (unknown > 5) {
    console.error(
      `  ERROR: ${unknown} unmatched points (expected 0). Check coordinate precision in parse-gpx.js.`
    );
    process.exit(1);
  }
} else {
  // ---- Proximity fallback (100k / 50k) ------------------------------------
  const PROXIMITY_THRESHOLD_METERS = 100;

  // Load 100mi RidewithGPS JSON as the surface reference
  const route100mi = ROUTES.find((r) => r.id === '100mi');
  const rwgps = JSON.parse(
    readFileSync(resolve(ROOT, route100mi.rwgpsJson), 'utf8')
  );
  const originalPoints = rwgps.route.track_points; // { x: lon, y: lat, S }

  output = simplifiedPoints.map((sp) => {
    let bestDist = Infinity;
    let bestS = null;

    for (const op of originalPoints) {
      const dist = haversineMeters(sp.lat, sp.lon, op.y, op.x);
      if (dist < bestDist) {
        bestDist = dist;
        bestS = op.S;
      }
    }

    if (bestDist < PROXIMITY_THRESHOLD_METERS) {
      matched++;
      return { miles: sp.miles, surface: S_TO_SURFACE[bestS] ?? 'unknown' };
    } else {
      unknown++;
      return { miles: sp.miles, surface: 'unknown' };
    }
  });

  console.log(`generate-surface-points (${routeId}): proximity mode (threshold ${PROXIMITY_THRESHOLD_METERS}m)`);
  console.log(
    `  [generate-surface-points:${routeId}] ${matched} matched, ${unknown} unknown (proximity mode, threshold ${PROXIMITY_THRESHOLD_METERS}m)`
  );
}

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

const outputPath = resolve(ROOT, 'public', 'data', routeId, 'surface-points.json');
writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

console.log(`  Output          : public/data/${routeId}/surface-points.json`);
console.log(`generate-surface-points (${routeId}): complete`);
