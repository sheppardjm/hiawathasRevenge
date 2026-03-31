/**
 * generate-thumbnails.js
 *
 * Reads source JPEG images from images/, generates 400px-wide WebP
 * thumbnails at 80% quality, and writes them to public/thumbs/.
 *
 * Usage: node scripts/generate-thumbnails.js
 */

import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'images');
const OUT_DIR = join(ROOT, 'public', 'thumbs');

mkdirSync(OUT_DIR, { recursive: true });

const sourceFiles = readdirSync(SRC_DIR).filter(
  (f) => extname(f).toLowerCase() === '.jpg'
);

let generated = 0;
for (const filename of sourceFiles) {
  const srcPath = join(SRC_DIR, filename);
  const thumbName = basename(filename, extname(filename)).replace(/ /g, '_') + '.webp';
  const outPath = join(OUT_DIR, thumbName);

  const info = await sharp(srcPath)
    .autoOrient()
    .resize({ width: 400 })
    .webp({ quality: 80 })
    .toFile(outPath);

  generated++;
  console.log(`  ${thumbName} (${info.width}x${info.height}, ${info.size} bytes)`);
}

console.log(`generate-thumbnails: complete`);
console.log(`  Source images : ${sourceFiles.length}`);
console.log(`  Thumbnails    : ${generated}`);
console.log(`  Output        : public/thumbs/`);
