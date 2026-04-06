#!/usr/bin/env node
// Generate 1200x630 OG image from hero photo for social sharing previews
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const SOURCE = join(root, 'public/images/irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536.jpg');
const OUTPUT = join(root, 'public/og-image.jpg');

// Source is 2048x1536 (4:3). Target is 1200x630 (≈1.91:1).
// Strategy: resize to 1200px wide (maintaining aspect → 1200x900), then
// extract a 1200x630 center crop (keeping the middle of the image).
await sharp(SOURCE)
  .resize(1200, null, { withoutEnlargement: true })
  .extract({ left: 0, top: Math.round((900 - 630) / 2), width: 1200, height: 630 })
  .jpeg({ quality: 75 })
  .toFile(OUTPUT);

console.log('✓ Generated public/og-image.jpg (1200x630)');
