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
    description: "A brief paved warm-up along County Road 520 east out of Munising — flat, fast, and deceptively civilized for what lies ahead. Surface: smooth asphalt for the full stretch. You'll pass the Munising Falls trailhead and the Pictured Rocks visitor center before the pavement runs out. In spring, snowmelt can leave sand drifts at the road shoulders; by midsummer, this is a pleasant cruise.",
    surface: 'smooth asphalt',
    stravaLink: 'https://www.strava.com/segments/28533709',
  },
  {
    id: 'sector-nf2266',
    description: "The route's crucible. Deep sand, washboard ruts, and relentless climbs through old-growth hardwoods on a barely maintained Forest Service road. This is where the ride earns its name. Surface: deteriorating sand and gravel two-track, often rutted from logging traffic. Landmarks include the junction with Forest Road 2262 and a seasonal creek crossing that can run shin-deep in May. In spring, this road is a mudpit; in fall, the hardwood canopy explodes with color but the sand never relents.",
    surface: 'sand and gravel two-track',
    stravaLink: 'https://www.strava.com/segments/28533671',
  },
  {
    id: 'sector-bass-lake',
    description: 'Welcome relief after NF2266. A well-graded gravel road rolling past Bass Lake with broad sight lines and room to spin your legs back to life. Surface: packed gravel, county-maintained. Bass Lake itself appears through the birch trees around mile 28 — a good photo stop. In spring and after heavy rain, watch for soft spots, but this stretch is generally the most forgiving gravel on the route.',
    surface: 'packed gravel, county-maintained',
    stravaLink: 'https://www.strava.com/segments/31852807',
  },
  {
    id: 'sector-nf2217',
    description: 'A long, meditative stretch through the forest interior. Smooth gravel threading between Camp 7 Lake and the headwaters of the Indian River — good surface for making up time. Surface: compact gravel and hard-packed dirt, dual forest road. Camp 7 Lake Campground at mile 44.7 has a water pump and vault toilet — your first restock point. In July and August, this corridor buzzes with horseflies; early morning or late season is kinder.',
    surface: 'compact gravel and hard-packed dirt',
    stravaLink: 'https://www.strava.com/segments/41149550',
  },
  {
    id: 'sector-nd2225',
    description: "The route bends south and the surface degrades — loose gravel and intermittent sand demand attention. Quiet and remote, with no services for miles in either direction. Surface: loose gravel transitioning to sandy patches, unmaintained in stretches. You'll cross the Indian River headwaters and pass through stands of jack pine and red pine. Fall color peaks here in late September; spring thaw turns the low-lying sections to pudding.",
    surface: 'loose gravel transitioning to sandy patches',
    stravaLink: 'https://www.strava.com/segments/39343281',
  },
  {
    id: 'sector-doe-lake',
    description: 'Technical and punishing. Sandy two-track weaves through dense forest near Doe Lake with short, sharp climbs that hit different at mile 85. The Midway General Store at mile 75.7 is your last chance to restock — food, water, bathrooms, and precious cell service. Surface: deep sand and rugged two-track, roots and embedded rock in spots. Doe Lake appears briefly through the trees to the east. By October the sand firms up somewhat, but summer heat on this stretch is relentless.',
    surface: 'deep sand and rugged two-track',
    stravaLink: 'https://www.strava.com/segments/34543004',
  },
  {
    id: 'sector-rapid-river',
    description: "The home stretch. A well-maintained truck trail carries you north back toward Munising with long descents and the growing certainty that you're going to finish this thing. Surface: firm packed gravel, USFS-maintained truck trail. You'll cross the Rapid River and catch glimpses of Lake Superior as you descend toward town. In late September, the aspens along this corridor turn gold — a fitting reward for surviving the previous 94 miles.",
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
