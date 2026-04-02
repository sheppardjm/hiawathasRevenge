/**
 * compute-sector-elevations.js
 *
 * Reads public/data/route-data.json and public/data/annotations.json,
 * extracts per-sector elevation point arrays, and writes the result
 * to public/data/sector-elevations.json.
 *
 * Usage: node scripts/compute-sector-elevations.js
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------

const routeDataPath = resolve(ROOT, 'public', 'data', 'route-data.json');
const annotationsPath = resolve(ROOT, 'public', 'data', 'annotations.json');

const routeData = JSON.parse(readFileSync(routeDataPath, 'utf8'));
const annotations = JSON.parse(readFileSync(annotationsPath, 'utf8'));

// ---------------------------------------------------------------------------
// Filter to sectors only
// ---------------------------------------------------------------------------

const sectors = annotations.filter((a) => a.type === 'sector');

if (sectors.length === 0) {
  const outputPath = resolve(ROOT, 'public', 'data', 'sector-elevations.json');
  writeFileSync(outputPath, '[]', 'utf8');
  console.log('compute-sector-elevations: complete');
  console.log('  Sectors found    : 0 (wrote empty array)');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Round to one decimal place.
 */
function round1(value) {
  return Math.round(value * 10) / 10;
}

// ---------------------------------------------------------------------------
// Compute per-sector elevation data
// ---------------------------------------------------------------------------

const routePoints = routeData.points;
let totalPoints = 0;

const results = sectors.map((sector) => {
  const { id, name, difficulty, startMile, endMile, startIdx, endIdx } = sector;

  // Slice route points for this sector (inclusive of endIdx)
  const sectorPoints = routePoints.slice(startIdx, endIdx + 1);

  // Build elevation points array
  const elevationPoints = sectorPoints.map((pt) => ({
    miles: round1(pt.miles),
    ele: round1(pt.ele),
  }));

  totalPoints += elevationPoints.length;

  // Compute statistics
  const eles = elevationPoints.map((p) => p.ele);
  const eleMin = round1(Math.min(...eles));
  const eleMax = round1(Math.max(...eles));

  let eleGainMeters = 0;
  let eleLossMeters = 0;

  for (let i = 1; i < elevationPoints.length; i++) {
    const delta = elevationPoints[i].ele - elevationPoints[i - 1].ele;
    if (delta > 0) {
      eleGainMeters += delta;
    } else {
      eleLossMeters += Math.abs(delta);
    }
  }

  return {
    id,
    name,
    difficulty,
    startMile,
    endMile,
    elevationPoints,
    eleMin,
    eleMax,
    eleGainMeters: Math.round(eleGainMeters),
    eleLossMeters: Math.round(eleLossMeters),
  };
});

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

const outputPath = resolve(ROOT, 'public', 'data', 'sector-elevations.json');
writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');

// ---------------------------------------------------------------------------
// Summary log
// ---------------------------------------------------------------------------

console.log('compute-sector-elevations: complete');
console.log(`  Sectors processed: ${results.length}`);
console.log(`  Total ele points : ${totalPoints}`);
console.log(`  Output           : public/data/sector-elevations.json`);
