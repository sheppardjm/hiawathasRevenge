/**
 * migrate-photos-mileage.js
 *
 * One-shot migration: shifts all mileage values in photos-manifest.json
 * by +OFFSET_MILES (with modulo wrap at NEW_TOTAL_MILES) to account for
 * the ~1.59-mile rotation of the course start to 46.34770, -86.72515.
 *
 * Usage: node scripts/migrate-photos-mileage.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const MANIFEST_PATH = resolve(ROOT, 'public', 'data', 'photos-manifest.json');

// Source: haversine analysis of ~/Downloads/Hiawatha's Revenge 100 (alt start).gpx
// Old course mile 0 is at new course mile 100.32; new total ~101.91 miles
const NEW_TOTAL_MILES = 101.91;
const OFFSET_MILES = 1.59;

function shiftMile(oldMile) {
  let newMile = oldMile + OFFSET_MILES;
  if (newMile > NEW_TOTAL_MILES) {
    newMile = newMile - NEW_TOTAL_MILES;
  }
  return Math.round(newMile * 10) / 10;
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
} catch (err) {
  console.error(`[migrate-photos-mileage] Failed to read ${MANIFEST_PATH}:`, err.message);
  process.exit(1);
}

const updated = manifest.map((entry) => ({
  ...entry,
  mile: shiftMile(entry.mile),
}));

writeFileSync(MANIFEST_PATH, JSON.stringify(updated, null, 2), 'utf8');

console.log('migrate-photos-mileage: complete');
console.log(`  Entries migrated : ${updated.length}`);
console.log(`  Offset applied   : +${OFFSET_MILES} miles (modulo ${NEW_TOTAL_MILES})`);
console.log(`  Output           : public/data/photos-manifest.json`);
