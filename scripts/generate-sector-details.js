/**
 * generate-sector-details.js
 *
 * Merges hardcoded editorial content (descriptions, surface labels, Strava links)
 * with snapped geometry data from annotations.json to produce sector-details.json.
 *
 * This is the canonical build-time data source for sector detail panels (Phase 24-25).
 * Descriptions are extracted verbatim from RouteExplainer.astro SEGMENTS const.
 *
 * Usage: node scripts/generate-sector-details.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Hardcoded editorial content (source: RouteExplainer.astro SEGMENTS const)
// These descriptions are human-authored and serve as the canonical panel text.
// The surface field is the EDITORIAL label for display, NOT the RidewithGPS S field.
// ---------------------------------------------------------------------------

const SECTOR_DETAILS = [
  {
    id: 'sector-520',
    description: 'Smooth asphalt rolls east past the Pictured Rocks corridor, where sugar maple and yellow birch hold the upland slopes above a flat glacial lake plain. Open and fast, this road section offers no resistance — a deceptively gentle threshold before the forest interior begins.',
    surface: 'smooth asphalt',
    stravaLink: 'https://www.strava.com/segments/28533709',
  },
  {
    id: 'sector-nf2266',
    description: 'Deteriorating sand and gravel two-track cuts through mature northern hardwoods where sugar maple and beech dominate the canopy, with red maple, cherry, yellow birch, and basswood beneath, white pine and hemlock interspersed throughout. Deep sand, washboard ruts, and relentless climbing define every mile.',
    surface: 'sand and gravel two-track',
    stravaLink: 'https://www.strava.com/segments/28533671',
  },
  {
    id: 'sector-bass-lake',
    description: 'Packed county gravel rolls south along the lake corridor, where paper birch colonizes productive upland sands and red maple and aspen fill the broader canopy; alder and cedar fringe the water margins. Rolling terrain, broad sight lines, and firm gravel make this the most forgiving stretch on the route.',
    surface: 'packed gravel, county-maintained',
    stravaLink: 'https://www.strava.com/segments/31852807',
  },
  {
    id: 'sector-nf2217',
    description: "Compact gravel and hard-packed doubletrack thread across flat outwash plain through a red pine and white pine corridor, cedar and tamarack closing in along stream margins where the Indian River headwaters drain the interior. Long, level, and meditative — the route's quietest stretch.",
    surface: 'compact gravel and hard-packed dirt',
    stravaLink: 'https://www.strava.com/segments/41149550',
  },
  {
    id: 'sector-nd2225',
    description: 'Loose gravel and sandy patches on an unmaintained forest road push through jack pine standing on dry outwash soils, with oak, aspen, and paper birch in the gaps and a low blueberry understory underfoot. Quiet and remote, the surface demands attention through every mile.',
    surface: 'loose gravel transitioning to sandy patches',
    stravaLink: 'https://www.strava.com/segments/39343281',
  },
  {
    id: 'sector-doe-lake',
    description: 'Deep sand and rugged two-track laced with roots and embedded rock runs through red pine and jack pine on morainal upland sands, cedar and tamarack gathering near the lake margins, aspen filling the cut-over gaps. Short, sharp climbs and technical footing define this stretch.',
    surface: 'deep sand and rugged two-track',
    stravaLink: 'https://www.strava.com/segments/34543004',
  },
  {
    id: 'sector-rapid-river',
    description: 'Firm packed gravel on a USFS truck trail descends north through moraine topography where sugar maple, yellow birch, and beech reclaim the upper slopes, aspen flanking the ridges, white pine holding the crests. Long, sweeping descents carry the route back toward the Lake Superior plain.',
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

  return {
    id: detail.id,
    name: annotation.name,
    description: detail.description,
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
