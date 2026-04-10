#!/usr/bin/env node
// Generate raster favicon assets from the shield badge SVG
// Produces: public/apple-touch-icon.png (180x180) and public/favicon.ico (32x32)
import sharp from 'sharp';
import toIco from 'to-ico';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Shield SVG with inline fill attributes (no <style> blocks — sharp's SVG renderer
// does not process CSS classes reliably for rasterization)
const FAVICON_SVG = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56">
  <rect width="56" height="56" fill="#1a2e1a" rx="3"/>
  <path d="M28 0 L14 38 Q16 36 22 34 L26 48 L28 56 L30 48 L34 34 Q40 36 42 38 Z" fill="#c8973e"/>
</svg>`);

// Generate apple-touch-icon.png (180x180) for iOS home screen
await sharp(FAVICON_SVG)
  .resize(180, 180)
  .flatten({ background: '#1a2e1a' })
  .ensureAlpha()
  .png()
  .toFile(join(root, 'public/apple-touch-icon.png'));

console.log('✓ Generated public/apple-touch-icon.png (180x180)');

// Generate favicon.ico (32x32) for legacy browsers
const icoBuffer = await sharp(FAVICON_SVG)
  .resize(32, 32)
  .flatten({ background: '#1a2e1a' })
  .ensureAlpha()
  .png()
  .toBuffer();

const icoData = await toIco([icoBuffer]);
writeFileSync(join(root, 'public/favicon.ico'), icoData);

console.log('✓ Generated public/favicon.ico (32x32)');
