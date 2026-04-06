/**
 * copy-gpx.js
 *
 * Copies all route GPX files to public/ for direct download.
 * Iterates over ROUTES from route-config.js so new routes are handled automatically.
 */

import { copyFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ROUTES } from './route-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

for (const route of ROUTES) {
  const src = join(projectRoot, route.gpxFile);
  const dest = join(projectRoot, 'public', route.gpxFile);

  if (!existsSync(src)) {
    console.warn(`[copy-gpx] Source not found, skipping: ${route.gpxFile}`);
    continue;
  }

  copyFileSync(src, dest);
  console.log(`[copy-gpx] Copied ${route.gpxFile} to public/`);
}
