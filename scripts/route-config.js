/**
 * route-config.js
 *
 * Single source of truth for route definitions, verified sector membership,
 * sector coordinates, and restock point locations.
 *
 * Sector membership verified by coordinate analysis (haversine distance from
 * sector start/end lat/lon to nearest GPX track point). 200m threshold used.
 * See .planning/phases/33-pipeline-route-data/33-RESEARCH.md for verification data.
 */

export const ROUTES = [
  {
    id: '100mi',
    name: '100 Mile',
    gpxFile: 'Munising_Hiawatha_s_Revenge.gpx',
    rwgpsJson: 'hiawathasRevenge.json', // RidewithGPS JSON with S-field surface data
    color: '#c8973e',
    sectorIds: [
      'sector-520',
      'sector-nf2266',
      'sector-bass-lake',
      'sector-nf2217',
      'sector-nd2225',
      'sector-little-indian',
      'sector-doe-lake',
      'sector-rapid-river',
    ],
    restockIds: ['restock-camp7', 'restock-midway'],
    elevationTargetRange: [2123, 2411], // ft — verified against Garmin/Strava recordings
  },
  {
    id: '100k',
    name: '100K',
    gpxFile: 'Hiawatha_s_Revenge_100k.gpx',
    rwgpsJson: null, // Strava export — no RidewithGPS surface data
    color: '#5b9279',
    // Verified: Bass Lake (2,171m away), NF2217 (12,818m), ND2225 (1,446m) are NOT on this route.
    // Doe Lake (17m) and Rapid River (4m) ARE on this route.
    sectorIds: ['sector-520', 'sector-nf2266', 'sector-little-indian', 'sector-doe-lake', 'sector-rapid-river'],
    restockIds: ['restock-midway'], // Midway is 9m from route; Camp 7 is 11,512m away
    elevationTargetRange: null, // No verified reference — use fixed 2m threshold
  },
  {
    id: '50k',
    name: '50K',
    gpxFile: 'Hiawatha_s_Revenge_50K_.gpx',
    rwgpsJson: null, // RidewithGPS GPX but no JSON export with surface data
    color: '#4a90c4',
    // Verified: same northern loop sectors as 100k. Bass Lake (17,553m), NF2217 (26,116m),
    // ND2225 (14,575m) are definitively NOT on this route.
    sectorIds: ['sector-520', 'sector-nf2266', 'sector-doe-lake', 'sector-rapid-river'],
    restockIds: [], // No restock points within 200m of 50k route
    elevationTargetRange: null, // No verified reference — use fixed 2m threshold
  },
];

export const DEFAULT_ROUTE_ID = '100mi';

/**
 * SECTOR_DEFS
 *
 * Coordinate-based sector definitions. startLat/startLon/endLat/endLon come from
 * the 100mi annotations.json (verified coordinates against GPX track).
 * Used for coordinate snapping on all routes instead of mile-based snapping.
 */
export const SECTOR_DEFS = [
  {
    id: 'sector-520',
    name: '520',
    startLat: 46.35686,
    startLon: -86.73175,
    endLat: 46.34030,
    endLon: -86.74120,
    difficulty: 'moderate',
    stars: 2,
  },
  {
    id: 'sector-nf2266',
    name: 'NF2266',
    startLat: 46.33319,
    startLon: -86.65629,
    endLat: 46.29100,
    endLon: -86.67160,
    difficulty: 'moderate',
    stars: 5,
  },
  {
    id: 'sector-bass-lake',
    name: 'Bass Lake Rd',
    startLat: 46.18725,
    startLon: -86.45743,
    endLat: 46.12210,
    endLon: -86.43600,
    difficulty: 'easy',
    stars: 2,
  },
  {
    id: 'sector-nf2217',
    name: 'NF2217-2218',
    startLat: 46.07159,
    startLon: -86.46703,
    endLat: 46.07140,
    endLon: -86.54380,
    difficulty: 'moderate',
    stars: 2,
  },
  {
    id: 'sector-nd2225',
    name: 'ND2225',
    startLat: 46.13733,
    startLon: -86.60283,
    endLat: 46.15290,
    endLon: -86.54050,
    difficulty: 'moderate',
    stars: 3,
  },
  {
    id: 'sector-little-indian',
    name: 'Little Indian',
    startLat: 46.19103,
    startLon: -86.51472,
    endLat: 46.16807,
    endLon: -86.58981,
    difficulty: 'easy',
    stars: 2,
  },
  {
    id: 'sector-doe-lake',
    name: 'Doe Lake',
    startLat: 46.25740,
    startLon: -86.67980,
    endLat: 46.26230,
    endLon: -86.74500,
    difficulty: 'easy',
    stars: 4,
  },
  {
    id: 'sector-rapid-river',
    name: 'Ridge Rd',
    startLat: 46.33280,
    startLon: -86.78320,
    endLat: 46.35690,
    endLon: -86.73320,
    difficulty: 'hard',
    stars: 2,
  },
];

/**
 * RESTOCK_DEFS
 *
 * Restock point definitions with verified coordinates.
 * mile is the position on the 100mi route (not applicable to shorter routes).
 */
export const RESTOCK_DEFS = [
  {
    id: 'restock-camp7',
    name: 'Camp 7 Lake Campground',
    mile: 44.7,
    lat: 46.0549,
    lon: -86.5487,
  },
  {
    id: 'restock-midway',
    name: 'Midway General Store',
    mile: 75.7,
    lat: 46.1679,
    lon: -86.6236,
  },
];
