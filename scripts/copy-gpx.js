/**
 * copy-gpx.js
 *
 * Copies the route GPX file to public/ for direct download.
 * Uses the smaller Munising file (~5,796 lines), not the 252k-line Hiawatha_100.gpx.
 */

import { copyFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const srcFile = join(projectRoot, 'Munising_Hiawatha_s_Revenge.gpx');
const destFile = join(projectRoot, 'public', 'Munising_Hiawatha_s_Revenge.gpx');

if (!existsSync(srcFile)) {
  console.warn('[copy-gpx] Source GPX not found, skipping:', srcFile);
} else {
  copyFileSync(srcFile, destFile);
  console.log('[copy-gpx] Copied GPX to public/');
}
