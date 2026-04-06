/**
 * pipeline.js
 *
 * Orchestrator that runs all data pipeline scripts in sequence.
 * Route-specific steps run once per route (3 routes). Shared steps run once.
 *
 * Used by the `pipeline`, `prebuild`, and `predev` npm scripts.
 *
 * Usage: node scripts/pipeline.js
 */

import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ROUTES } from './route-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Route-specific steps — run once per route (3 times total)
const routeSpecificSteps = [
  { name: 'parse-gpx',                 script: 'scripts/parse-gpx.js' },
  { name: 'generate-surface-points',   script: 'scripts/generate-surface-points.js' },
  { name: 'resolve-annotations',       script: 'scripts/resolve-annotations.js' },
  { name: 'compute-sector-elevations', script: 'scripts/compute-sector-elevations.js' },
];

// Shared steps — run once after all routes are processed
const sharedSteps = [
  { name: 'generate-routes-manifest',  script: 'scripts/generate-routes-manifest.js' }, // created in plan 33-03
  { name: 'generate-sector-details',   script: 'scripts/generate-sector-details.js' },
  { name: 'generate-thumbnails',       script: 'scripts/generate-thumbnails.js' },
  { name: 'copy-images',               script: 'scripts/copy-images.js' },
  { name: 'generate-webp',             script: 'scripts/generate-webp.js' },
  { name: 'process-historical',        script: 'scripts/process-historical.js' },
  { name: 'match-photos',              script: 'scripts/match-photos.js' },
  { name: 'copy-gpx',                  script: 'scripts/copy-gpx.js' },
  { name: 'generate-og-image',         script: 'scripts/generate-og-image.js' },
];

let currentStep = null;

try {
  // Run route-specific steps for each route
  for (const route of ROUTES) {
    for (const { name, script } of routeSpecificSteps) {
      currentStep = `${name}:${route.id}`;
      console.log(`[pipeline] Running ${name} for route ${route.id}...`);
      execFileSync(process.execPath, [script, route.id], { cwd: projectRoot, stdio: 'inherit' });
    }
  }

  // Run shared steps once
  for (const { name, script } of sharedSteps) {
    currentStep = name;
    console.log(`[pipeline] Running ${name}...`);
    execFileSync(process.execPath, [script], { cwd: projectRoot, stdio: 'inherit' });
  }

  console.log('[pipeline] Complete — all data files generated.');
} catch (err) {
  console.error(`[pipeline] FAILED at ${currentStep}`);
  process.exit(1);
}
