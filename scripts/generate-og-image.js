#!/usr/bin/env node
// Generate 1200x630 OG image: dimmed hero photo + shield badge + tagline + date
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const SOURCE = join(root, 'public/images/irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536.jpg');
const OUTPUT = join(root, 'public/og-card.jpg');

// Load fonts and base64-encode for SVG @font-face embedding
const npHeavy = readFileSync(join(__dirname, 'fonts/NationalPark-Heavy.otf')).toString('base64');
const smBold = readFileSync(join(__dirname, 'fonts/SpaceMono-Bold.ttf')).toString('base64');

// Build SVG overlay (1200x630) with shield badge, tagline, and event date
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <style>
      @font-face {
        font-family: 'NationalPark';
        src: url('data:font/otf;base64,${npHeavy}') format('opentype');
      }
      @font-face {
        font-family: 'SpaceMono';
        src: url('data:font/truetype;base64,${smBold}') format('truetype');
        font-weight: bold;
      }
    </style>
  </defs>

  <!-- Dim the hero photo background -->
  <rect width="1200" height="630" fill="black" opacity="0.55"/>

  <!-- Shield badge centered horizontally at top -->
  <g transform="translate(520,50)">
    <!-- Forest-green badge background -->
    <rect width="160" height="160" rx="8" fill="#1a2e1a" opacity="0.85"/>
    <!-- Amber shield path (favicon path scaled ~2.857x for 160px badge) -->
    <path d="M80 8 L40 108 Q44 104 60 98 L72 136 L80 160 L88 136 L100 98 Q116 104 120 108 Z" fill="#c8973e"/>
  </g>

  <!-- Tagline: line 1 -->
  <text x="600" y="278" text-anchor="middle" font-size="42" fill="white" font-family="NationalPark" letter-spacing="2">A 100-Mile Gravel Ride</text>
  <!-- Tagline: line 2 -->
  <text x="600" y="335" text-anchor="middle" font-size="42" fill="white" font-family="NationalPark" letter-spacing="2">Through the Hiawatha</text>

  <!-- Event date in amber -->
  <text x="600" y="425" text-anchor="middle" font-size="46" fill="#c8973e" font-family="SpaceMono" font-weight="bold">June 6, 2026</text>
</svg>`;

const svgBuffer = Buffer.from(svg);

// Composite: resize hero → center crop → overlay SVG → JPEG
await sharp(SOURCE)
  .resize(1200, null, { withoutEnlargement: true })
  .extract({ left: 0, top: 135, width: 1200, height: 630 })
  .composite([{ input: svgBuffer, blend: 'over' }])
  .jpeg({ quality: 85 })
  .toFile(OUTPUT);

console.log('✓ Generated public/og-card.jpg (1200x630)');
