/**
 * process-inspiration-bg.js
 *
 * Processes three selected Ojibwe-motif inspiration images for use as
 * full-bleed section backgrounds in HiawathaExplainer.astro.
 *
 * Source: images/inspiration/ (specific files chosen for indigenous art focus)
 * Output: public/thumbs/inspiration/
 *   - poem-bg.webp    (Ojibwe motifs/symbols grid)
 *   - forest-bg.webp  (Bogcore nature pattern)
 *   - ride-bg.webp    (Stylized native profile silhouette)
 *
 * Resizes to 1200px wide (full-bleed backgrounds need more resolution than 400px thumbs)
 * WebP quality 80.
 *
 * Usage: node scripts/process-inspiration-bg.js
 */

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'images', 'inspiration');
const OUT_DIR = join(ROOT, 'public', 'thumbs', 'inspiration');

// Three chosen images (Option A: Indigenous art focus)
const IMAGES = [
  {
    src: 'original-0224278e4cf61770e3df248f5cd1f4bb.webp',
    out: 'poem-bg.webp',
    label: 'poem-section (Ojibwe motifs/symbols grid)',
  },
  {
    src: 'original-f146e847f065e9e9058869f6bd59733d.webp',
    out: 'forest-bg.webp',
    label: 'forest-section (Bogcore nature pattern)',
  },
  {
    src: 'original-0ac1226989a12b196feeb9b3f9f6b47e.webp',
    out: 'ride-bg.webp',
    label: 'ride-section (Stylized native profile silhouette)',
  },
];

// ---------------------------------------------------------------------------
// Guard: source directory must exist
// ---------------------------------------------------------------------------

if (!existsSync(SRC_DIR)) {
  console.error(`process-inspiration-bg: source directory not found: ${SRC_DIR}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Create output directory
// ---------------------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Process each image
// ---------------------------------------------------------------------------

let processed = 0;
for (const image of IMAGES) {
  const srcPath = join(SRC_DIR, image.src);
  const outPath = join(OUT_DIR, image.out);

  if (!existsSync(srcPath)) {
    console.error(`  SKIP: ${image.src} — not found in ${SRC_DIR}`);
    continue;
  }

  const info = await sharp(srcPath)
    .autoOrient()
    .resize({ width: 1200 })
    .webp({ quality: 80 })
    .toFile(outPath);

  console.log(`  ${image.out} — ${image.label}`);
  console.log(`    ${info.width}x${info.height}px, ${(info.size / 1024).toFixed(1)} KB`);
  processed++;
}

console.log(`\nprocess-inspiration-bg: complete — ${processed}/${IMAGES.length} images processed`);
console.log(`Output: ${OUT_DIR}`);
