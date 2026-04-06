/**
 * resolve-annotations.js
 *
 * Reads public/data/${routeId}/route-data.json, snaps gravel sector start/end
 * and restock point coordinates to the nearest route point using haversine
 * distance, and writes the combined result to
 * public/data/${routeId}/annotations.json.
 *
 * Sector and restock definitions come from route-config.js.
 * Only sectors and restocks belonging to the specified route are emitted.
 *
 * Usage: node scripts/resolve-annotations.js <routeId>
 *   e.g. node scripts/resolve-annotations.js 100mi
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { ROUTES, SECTOR_DEFS, RESTOCK_DEFS } from './route-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Parse argv
// ---------------------------------------------------------------------------

const routeId = process.argv[2];
if (!routeId) {
  console.error('Usage: node scripts/resolve-annotations.js <routeId>');
  process.exit(1);
}

const routeConfig = ROUTES.find((r) => r.id === routeId);
if (!routeConfig) {
  console.error(`resolve-annotations: unknown routeId "${routeId}"`);
  console.error(`  Valid ids: ${ROUTES.map((r) => r.id).join(', ')}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Load route data
// ---------------------------------------------------------------------------

const routeDataPath = resolve(ROOT, 'public', 'data', routeId, 'route-data.json');
const routeData = JSON.parse(readFileSync(routeDataPath, 'utf8'));
const routePoints = routeData.points;

// ---------------------------------------------------------------------------
// Filter to this route's sectors and restock points
// ---------------------------------------------------------------------------

const routeSectors = SECTOR_DEFS.filter((s) => routeConfig.sectorIds.includes(s.id));
const routeRestocks = RESTOCK_DEFS.filter((r) => routeConfig.restockIds.includes(r.id));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Haversine distance in meters between two lat/lon pairs.
 */
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

/**
 * Snap a target lat/lon to the nearest route point.
 * Returns { lat, lon, ele, miles, snapIdx, snapDist }.
 */
function snapByCoordinate(targetLat, targetLon, points) {
  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < points.length; i++) {
    const dist = haversineMeters(targetLat, targetLon, points[i].lat, points[i].lon);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  const pt = points[bestIdx];
  return {
    lat: pt.lat,
    lon: pt.lon,
    ele: pt.ele,
    miles: pt.miles,
    snapIdx: bestIdx,
    snapDist: bestDist,
  };
}

/**
 * Round a number to the given number of decimal places.
 */
function round(value, decimals) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// ---------------------------------------------------------------------------
// Snap gravel sectors
// ---------------------------------------------------------------------------

const snappedSectors = routeSectors.map((sector) => {
  const startSnap = snapByCoordinate(sector.startLat, sector.startLon, routePoints);
  const endSnap = snapByCoordinate(sector.endLat, sector.endLon, routePoints);

  // Guarantee startIdx < endIdx (guard against edge-case index ties)
  let endIdx = endSnap.snapIdx;
  if (endIdx <= startSnap.snapIdx) {
    endIdx = routePoints.length - 1;
  }

  const lengthMiles = round(endSnap.miles - startSnap.miles, 2);

  console.log(
    `[resolve-annotations:${routeId}] ${sector.id} start snapped at ${Math.round(startSnap.snapDist)}m, end at ${Math.round(endSnap.snapDist)}m`
  );

  return {
    id: sector.id,
    type: 'sector',
    name: sector.name,
    startMile: round(startSnap.miles, 2),
    endMile: round(endSnap.miles, 2),
    lengthMiles,
    startLat: startSnap.lat,
    startLon: startSnap.lon,
    endLat: endSnap.lat,
    endLon: endSnap.lon,
    startIdx: startSnap.snapIdx,
    endIdx,
    difficulty: sector.difficulty,
    stars: sector.stars,
  };
});

// ---------------------------------------------------------------------------
// Snap restock points
// ---------------------------------------------------------------------------

const snappedRestock = routeRestocks.map((restock) => {
  const snap = snapByCoordinate(restock.lat, restock.lon, routePoints);

  console.log(
    `[resolve-annotations:${routeId}] ${restock.id} snapped at ${Math.round(snap.snapDist)}m`
  );

  return {
    id: restock.id,
    type: 'restock',
    name: restock.name,
    mile: round(snap.miles, 2),
    lat: snap.lat,
    lon: snap.lon,
    ele: snap.ele,
    snapIdx: snap.snapIdx,
  };
});

// ---------------------------------------------------------------------------
// Combine and write output
// ---------------------------------------------------------------------------

const annotations = [...snappedSectors, ...snappedRestock];

const outputPath = resolve(ROOT, 'public', 'data', routeId, 'annotations.json');
writeFileSync(outputPath, JSON.stringify(annotations, null, 2), 'utf8');

// ---------------------------------------------------------------------------
// Summary log
// ---------------------------------------------------------------------------

console.log(`resolve-annotations (${routeId}): complete`);
console.log(`  Sectors snapped  : ${snappedSectors.length}`);
console.log(`  Restock snapped  : ${snappedRestock.length}`);
console.log(`  Total annotations: ${annotations.length}`);
console.log(`  Output           : public/data/${routeId}/annotations.json`);

// Verify startIdx < endIdx for every sector
let valid = true;
for (const s of snappedSectors) {
  if (s.startIdx >= s.endIdx) {
    console.error(`  ERROR: ${s.id} startIdx(${s.startIdx}) >= endIdx(${s.endIdx})`);
    valid = false;
  }
}
if (valid) {
  console.log('  Index check      : all startIdx < endIdx - OK');
}
