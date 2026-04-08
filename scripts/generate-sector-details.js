/**
 * generate-sector-details.js
 *
 * Merges editorial content from segments.json (descriptions) with surface labels,
 * Strava links, and snapped geometry from annotations.json to produce sector-details.json.
 *
 * This is the canonical build-time data source for sector detail panels (Phase 24-25).
 * segments.json is the single source of truth for segment descriptions.
 *
 * Usage: node scripts/generate-sector-details.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Load segments.json — single source of truth for descriptions
// ---------------------------------------------------------------------------

const segmentsPath = resolve(ROOT, 'src', 'components', 'segments.json');
const segments = JSON.parse(readFileSync(segmentsPath, 'utf8'));

// Map segment names to descriptions for lookup
const descByName = Object.fromEntries(segments.map((s) => [s.name, s.description]));

// ---------------------------------------------------------------------------
// Sector editorial metadata (surface labels, Strava links, name→id mapping)
// The surface field is the EDITORIAL label for display, NOT the RidewithGPS S field.
// ---------------------------------------------------------------------------

const SECTOR_DETAILS = [
  {
    id: 'sector-520',
    segmentName: '520',
    surface: 'snowmobile trail',
    stravaLink: 'https://www.strava.com/segments/28533709',
  },
  {
    id: 'sector-nf2266',
    segmentName: 'NF2266',
    surface: 'sand and gravel two-track',
    stravaLink: 'https://www.strava.com/segments/28533671',
  },
  {
    id: 'sector-bass-lake',
    segmentName: 'Bass Lake Rd',
    surface: 'packed gravel, county-maintained',
    stravaLink: 'https://www.strava.com/segments/31852807',
  },
  {
    id: 'sector-nf2217',
    segmentName: 'NF2217-2218',
    surface: 'compact gravel and hard-packed dirt',
    stravaLink: 'https://www.strava.com/segments/41149550',
  },
  {
    id: 'sector-nd2225',
    segmentName: 'ND2225',
    surface: 'loose gravel transitioning to sandy patches',
    stravaLink: 'https://www.strava.com/segments/39343281',
  },
  {
    id: 'sector-little-indian',
    segmentName: 'Little Indian',
    surface: 'forest road gravel',
    stravaLink: 'https://www.strava.com/segments/34542982',
  },
  {
    id: 'sector-doe-lake',
    segmentName: 'Doe Lake',
    surface: 'deep, loose gravel',
    stravaLink: 'https://www.strava.com/segments/34543004',
  },
  {
    id: 'sector-rapid-river',
    segmentName: 'Ridge Rd',
    surface: 'firm packed gravel, USFS-maintained',
    stravaLink: 'https://www.strava.com/segments/41188200',
  },
];

// ---------------------------------------------------------------------------
// Load annotations.json and filter to sectors
// ---------------------------------------------------------------------------

const annotationsPath = resolve(ROOT, 'public', 'data', '100mi', 'annotations.json');
const annotations = JSON.parse(readFileSync(annotationsPath, 'utf8'));
const sectorAnnotations = annotations.filter((a) => a.type === 'sector');

// ---------------------------------------------------------------------------
// Merge editorial content with annotation geometry/metadata
// ---------------------------------------------------------------------------

const sectorDetails = SECTOR_DETAILS.map((detail) => {
  const annotation = sectorAnnotations.find((a) => a.id === detail.id);
  if (!annotation) {
    throw new Error(`generate-sector-details: no annotation found for id "${detail.id}"`);
  }

  const description = descByName[detail.segmentName];
  if (!description) {
    throw new Error(`generate-sector-details: no segment found for name "${detail.segmentName}"`);
  }

  return {
    id: detail.id,
    name: annotation.name,
    description,
    surface: detail.surface,
    stars: annotation.stars,
    stravaLink: detail.stravaLink,
    startMile: annotation.startMile,
    endMile: annotation.endMile,
  };
});

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

const outputPath = resolve(ROOT, 'public', 'data', 'sector-details.json');
writeFileSync(outputPath, JSON.stringify(sectorDetails, null, 2), 'utf8');

// ---------------------------------------------------------------------------
// Summary log
// ---------------------------------------------------------------------------

console.log('generate-sector-details: complete');
console.log(`  Sectors written  : ${sectorDetails.length}`);
console.log(`  Output           : public/data/sector-details.json`);
