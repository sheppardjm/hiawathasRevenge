/**
 * match-photos.js
 *
 * Reads photos-manifest.json, validates entries, snaps mileage values
 * to route coordinates, and writes public/data/photos.json.
 * If photos-manifest.json is absent, writes an empty array.
 *
 * Usage: node scripts/match-photos.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, basename, extname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const MANIFEST_PATH = resolve(ROOT, 'public', 'data', 'photos-manifest.json');
const ROUTE_PATH = resolve(ROOT, 'public', 'data', 'route-data.json');
const OUTPUT_PATH = resolve(ROOT, 'public', 'data', 'photos.json');

// ---------------------------------------------------------------------------
// Graceful absent-manifest check
// ---------------------------------------------------------------------------

if (!existsSync(MANIFEST_PATH)) {
  console.warn('match-photos: photos-manifest.json not found — writing empty photos.json');
  writeFileSync(OUTPUT_PATH, '[]', 'utf8');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Load manifest and route data
// ---------------------------------------------------------------------------

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const routeData = JSON.parse(readFileSync(ROUTE_PATH, 'utf8'));
const routePoints = routeData.points;

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
 * Returns { lat, lon, miles }.
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
    miles: round(pt.miles, 2),
  };
}

// ---------------------------------------------------------------------------
// Map manifest entries to photos.json format
// ---------------------------------------------------------------------------

const photos = manifest.map((entry) => {
  const snap = snapByMileage(entry.mile, routePoints);
  // CRITICAL: thumb derivation must be identical to generate-thumbnails.js
  const thumbName = basename(entry.filename, extname(entry.filename)).replace(/ /g, '_') + '.webp';
  return {
    id: entry.filename,
    filename: entry.filename,
    thumb: `/thumbs/${thumbName}`,
    mile: snap.miles,
    lat: snap.lat,
    lon: snap.lon,
    ...(entry.featured ? { featured: true } : {}),
  };
}).sort((a, b) => a.mile - b.mile);

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

writeFileSync(OUTPUT_PATH, JSON.stringify(photos, null, 2), 'utf8');

// ---------------------------------------------------------------------------
// Summary log
// ---------------------------------------------------------------------------

console.log('match-photos: complete');
console.log(`  Photos matched   : ${photos.length}`);
console.log(`  Output           : public/data/photos.json`);
