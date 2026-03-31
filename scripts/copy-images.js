/**
 * copy-images.js
 *
 * Copies source JPEG images from images/ to public/images/ so they
 * can be served as full-resolution lightbox assets by Astro's static server.
 *
 * Usage: node scripts/copy-images.js
 */

import { readdirSync, mkdirSync, copyFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'images');
const OUT_DIR = join(ROOT, 'public', 'images');

mkdirSync(OUT_DIR, { recursive: true });

const files = readdirSync(SRC_DIR).filter(
  (f) => extname(f).toLowerCase() === '.jpg'
);

let copied = 0;
for (const file of files) {
  const src = join(SRC_DIR, file);
  const dest = join(OUT_DIR, file);
  copyFileSync(src, dest);
  copied++;
}

console.log(`Copied ${copied} images to public/images/`);
