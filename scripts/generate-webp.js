#!/usr/bin/env node
/**
 * generate-webp.js
 *
 * Generates WebP variants for hero image (responsive srcset) and
 * parallax backgrounds (full-size conversion). Skips files that
 * already exist for idempotent re-runs.
 *
 * Usage: node scripts/generate-webp.js
 */
import sharp from 'sharp';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IMAGES_DIR = join(ROOT, 'public', 'images');

let generated = 0;

// --- Hero srcset variants ---
const HERO_BASENAME = 'irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536';
const HERO_SRC = join(IMAGES_DIR, `${HERO_BASENAME}.jpg`);
const HERO_WIDTHS = [640, 1280, 1600];

for (const width of HERO_WIDTHS) {
  const dest = join(IMAGES_DIR, `${HERO_BASENAME}-${width}w.webp`);
  if (!existsSync(dest)) {
    const info = await sharp(HERO_SRC)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(dest);
    generated++;
    console.log(`  hero ${width}w: ${info.width}x${info.height} (${info.size} bytes)`);
  }
}

// --- Parallax background WebP (convert at native dimensions, no resize) ---
const PARALLAX_BASENAMES = [
  'Eo6Lpv5a2onA-EMkS4BGrkQOHMQb4rwDbey7kfJDAZc-1536x2048',
  'K9zNeD_N2ikOKXNlKHc1dGUY7N6W3cGWVevoXlB49aI-1536x2048',
  'Gw-ZiugqoNyWNNMHZ-n65VcO7XjnipWnDWQz77mE2kQ-1536x2048',
];

for (const basename of PARALLAX_BASENAMES) {
  const src = join(IMAGES_DIR, `${basename}.jpg`);
  const dest = join(IMAGES_DIR, `${basename}.webp`);
  if (!existsSync(dest)) {
    const info = await sharp(src)
      .webp({ quality: 80 })
      .toFile(dest);
    generated++;
    console.log(`  parallax: ${basename.slice(0, 12)}... ${info.width}x${info.height} (${info.size} bytes)`);
  }
}

console.log(`generate-webp: complete (${generated} new files)`);
