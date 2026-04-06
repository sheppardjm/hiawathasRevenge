/**
 * resolve-annotations.js
 *
 * Reads public/data/route-data.json, snaps gravel sector start/end mile
 * values and restock point mile values to the nearest route coordinate,
 * and writes the combined result to public/data/annotations.json.
 *
 * Usage: node scripts/resolve-annotations.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Annotation definitions (hardcoded from route research)
// ---------------------------------------------------------------------------

const GRAVEL_SECTORS = [
  { id: 'sector-520',         name: '520',                     startMile: 1.1,  lengthMiles: 1.3, difficulty: 'moderate', stars: 2 },
  { id: 'sector-nf2266',      name: 'NF2266',                  startMile: 6.7,  lengthMiles: 3.2, difficulty: 'moderate', stars: 5 },
  { id: 'sector-bass-lake',   name: 'Bass Lake Rd',            startMile: 25.3, lengthMiles: 4.8, difficulty: 'easy',     stars: 2 },
  { id: 'sector-nf2217',      name: 'NF2217-2218',             startMile: 36.8, lengthMiles: 6.6, difficulty: 'moderate', stars: 2 },
  { id: 'sector-nd2225',      name: 'ND2225',                  startMile: 55.7, lengthMiles: 3.9, difficulty: 'moderate', stars: 3 },
  { id: 'sector-doe-lake',    name: 'Doe Lake',                startMile: 84.8, lengthMiles: 3.1, difficulty: 'easy',     stars: 4 },
  { id: 'sector-rapid-river', name: 'Rapid River Truck Trail', startMile: 94.6, lengthMiles: 6.3, difficulty: 'hard',     stars: 2 },
];

const RESTOCK_POINTS = [
  { id: 'restock-camp7',  name: 'Camp 7 Lake Campground', mile: 44.7 },
  { id: 'restock-midway', name: 'Midway General Store',   mile: 75.7 },
];

// ---------------------------------------------------------------------------
// Load route data
// ---------------------------------------------------------------------------

const routeDataPath = resolve(ROOT, 'public', 'data', 'route-data.json');
const routeData = JSON.parse(readFileSync(routeDataPath, 'utf8'));
const routePoints = routeData.points;
const totalMiles = routeData.meta.totalMiles;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Round a number to the given number of decimal places.
 */
function round(value, decimals) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Find the route point whose `miles` value is closest to targetMile.
 * Returns { lat, lon, ele, miles, snapIdx }.
 */
function snapByMileage(targetMile, points) {
  let bestIdx = 0;
  let bestDiff = Infinity;

  for (let i = 0; i < points.length; i++) {
    const diff = Math.abs(points[i].miles - targetMile);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }

  const pt = points[bestIdx];
  return {
    lat: round(pt.lat, 5),
    lon: round(pt.lon, 5),
    ele: round(pt.ele, 1),
    miles: round(pt.miles, 2),
    snapIdx: bestIdx,
  };
}

// ---------------------------------------------------------------------------
// Snap gravel sectors
// ---------------------------------------------------------------------------

const snappedSectors = GRAVEL_SECTORS.map((sector) => {
  const startSnap = snapByMileage(sector.startMile, routePoints);

  // Cap endMile at route total so the last sector doesn't overshoot
  const rawEndMile = sector.startMile + sector.lengthMiles;
  const cappedEndMile = Math.min(rawEndMile, totalMiles);
  const endSnap = snapByMileage(cappedEndMile, routePoints);

  // Guarantee startIdx < endIdx (guard against edge-case index ties)
  let endIdx = endSnap.snapIdx;
  if (endIdx <= startSnap.snapIdx) {
    endIdx = routePoints.length - 1;
  }

  return {
    id: sector.id,
    type: 'sector',
    name: sector.name,
    startMile: round(sector.startMile, 2),
    endMile: round(cappedEndMile, 2),
    lengthMiles: round(sector.lengthMiles, 2),
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

const snappedRestock = RESTOCK_POINTS.map((pt) => {
  const snap = snapByMileage(pt.mile, routePoints);

  return {
    id: pt.id,
    type: 'restock',
    name: pt.name,
    mile: round(pt.mile, 2),
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

const outputPath = resolve(ROOT, 'public', 'data', 'annotations.json');
writeFileSync(outputPath, JSON.stringify(annotations, null, 2), 'utf8');

// ---------------------------------------------------------------------------
// Summary log
// ---------------------------------------------------------------------------

const totalGravelMiles = GRAVEL_SECTORS.reduce((sum, s) => sum + s.lengthMiles, 0);

console.log('resolve-annotations: complete');
console.log(`  Sectors snapped  : ${snappedSectors.length}`);
console.log(`  Restock snapped  : ${snappedRestock.length}`);
console.log(`  Total gravel mi  : ${round(totalGravelMiles, 1)}`);
console.log(`  Output           : public/data/annotations.json`);

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
