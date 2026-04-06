/**
 * generate-routes-manifest.js
 *
 * Reads per-route route-data.json and route-config.js to produce
 * public/data/routes.json -- the top-level manifest consumed by the
 * multi-route UI to list available routes and their metadata.
 *
 * Output shape:
 * {
 *   defaultRoute: "100mi",
 *   routes: [
 *     { id, name, shortName, gpxFile, color, totalMiles, elevationGainFeet, sectorIds }
 *   ]
 * }
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ROUTES, DEFAULT_ROUTE_ID } from './route-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const manifest = {
  defaultRoute: DEFAULT_ROUTE_ID,
  routes: [],
};

for (const route of ROUTES) {
  const routeDataPath = join(projectRoot, 'public', 'data', route.id, 'route-data.json');
  let routeData;
  try {
    routeData = JSON.parse(readFileSync(routeDataPath, 'utf8'));
  } catch (err) {
    console.error(`[generate-routes-manifest] Failed to read ${routeDataPath}:`, err.message);
    process.exit(1);
  }

  const { totalMiles, elevationGainFeet } = routeData.meta;

  manifest.routes.push({
    id: route.id,
    name: route.name,
    shortName: route.id,
    gpxFile: route.gpxFile,
    color: route.color,
    totalMiles,
    elevationGainFeet,
    sectorIds: route.sectorIds,
  });

  console.log(
    `[generate-routes-manifest] ${route.name}: ${totalMiles} mi, ${elevationGainFeet} ft gain`
  );
}

const outPath = join(projectRoot, 'public', 'data', 'routes.json');
writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log(`[generate-routes-manifest] Wrote ${manifest.routes.length} routes to ${outPath}`);
