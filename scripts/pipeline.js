/**
 * pipeline.js
 *
 * Orchestrator that runs all data pipeline scripts in sequence.
 * Used by the `pipeline`, `prebuild`, and `predev` npm scripts.
 *
 * Usage: node scripts/pipeline.js
 */

import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const steps = [
  { name: 'parse-gpx', script: 'scripts/parse-gpx.js' },
  { name: 'generate-surface-points', script: 'scripts/generate-surface-points.js' },
  { name: 'resolve-annotations', script: 'scripts/resolve-annotations.js' },
  { name: 'compute-sector-elevations', script: 'scripts/compute-sector-elevations.js' },
  { name: 'generate-thumbnails', script: 'scripts/generate-thumbnails.js' },
  { name: 'copy-images', script: 'scripts/copy-images.js' },
  { name: 'process-historical', script: 'scripts/process-historical.js' },
  { name: 'match-photos', script: 'scripts/match-photos.js' },
  { name: 'copy-gpx', script: 'scripts/copy-gpx.js' },
];

let currentStep = null;

try {
  for (const { name, script } of steps) {
    currentStep = name;
    console.log(`[pipeline] Running ${name}...`);
    execFileSync(process.execPath, [script], { cwd: projectRoot, stdio: 'inherit' });
  }
  console.log('[pipeline] Complete — all data files generated.');
} catch (err) {
  console.error(`[pipeline] FAILED at ${currentStep}`);
  process.exit(1);
}
