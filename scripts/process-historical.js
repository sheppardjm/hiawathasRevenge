/**
 * process-historical.js
 *
 * Reads historical-manifest.json, validates entries (category: "historical"),
 * generates 400px-wide WebP thumbnails via sharp, copies full-res images, and
 * writes public/data/historical-photos.json.
 *
 * Supported input formats: .jpg, .jpeg, .png, .tiff, .tif, .webp
 * If historical-manifest.json is absent, writes an empty array and exits 0.
 * If images/historical/ is absent, creates it, writes an empty array, and exits 0.
 *
 * Usage: node scripts/process-historical.js
 */

import sharp from 'sharp';
import { readdirSync, mkdirSync, existsSync, copyFileSync, readFileSync, writeFileSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'images', 'historical');
const OUT_THUMBS = join(ROOT, 'public', 'thumbs', 'historical');
const OUT_IMAGES = join(ROOT, 'public', 'images', 'historical');
const MANIFEST_PATH = join(ROOT, 'public', 'data', 'historical-manifest.json');
const OUTPUT_PATH = join(ROOT, 'public', 'data', 'historical-photos.json');

const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.webp']);

// ---------------------------------------------------------------------------
// Graceful absent-manifest guard
// ---------------------------------------------------------------------------

if (!existsSync(MANIFEST_PATH)) {
  console.warn('process-historical: historical-manifest.json not found — writing empty output');
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, '[]', 'utf8');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Graceful absent-source-dir guard
// ---------------------------------------------------------------------------

if (!existsSync(SRC_DIR)) {
  mkdirSync(SRC_DIR, { recursive: true });
  console.warn('process-historical: images/historical/ not found — created, writing empty output');
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, '[]', 'utf8');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Create output directories
// ---------------------------------------------------------------------------

mkdirSync(OUT_THUMBS, { recursive: true });
mkdirSync(OUT_IMAGES, { recursive: true });
mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

// ---------------------------------------------------------------------------
// Load manifest and source file listing
// ---------------------------------------------------------------------------

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const sourceFiles = readdirSync(SRC_DIR).filter(
  (f) => SUPPORTED_EXTS.has(extname(f).toLowerCase())
);

// ---------------------------------------------------------------------------
// Process each manifest entry
// ---------------------------------------------------------------------------

const results = [];
for (const entry of manifest) {
  if (entry.category !== 'historical') {
    console.warn(`  SKIP: ${entry.filename} — category is not "historical"`);
    continue;
  }
  if (!sourceFiles.includes(entry.filename)) {
    console.warn(`  SKIP: ${entry.filename} — not found in images/historical/`);
    continue;
  }

  const srcPath = join(SRC_DIR, entry.filename);
  const thumbName = basename(entry.filename, extname(entry.filename)).replace(/ /g, '_') + '.webp';
  const thumbPath = join(OUT_THUMBS, thumbName);

  const info = await sharp(srcPath)
    .autoOrient()
    .resize({ width: 400 })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  copyFileSync(srcPath, join(OUT_IMAGES, entry.filename));

  results.push({
    filename: entry.filename,
    category: 'historical',
    thumb: `/thumbs/historical/${thumbName}`,
    title: entry.title,
    artist: entry.artist,
    year: entry.year,
    source: entry.source,
    license: entry.license,
  });
  console.log(`  ${thumbName} (${info.width}x${info.height}, ${info.size} bytes)`);
}

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf8');
console.log(`process-historical: complete — ${results.length} images processed`);
