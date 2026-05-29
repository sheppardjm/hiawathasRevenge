# Phase 54: Route Start Relocation & Data Regeneration — Pattern Map

**Mapped:** 2026-05-29
**Files analyzed:** 5 (3 GPX replacements counted as 1 file-class; 2 code changes; 1 new script)
**Analogs found:** 4 / 4 distinct file types

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `Munising_Hiawatha_s_Revenge.gpx` (+ 2 sibling GPX files) | pipeline input | file-I/O | — (binary replacement, no code pattern) | n/a |
| `scripts/match-photos.js` | pipeline utility | transform | `scripts/match-photos.js` itself | self (bug fix) |
| `scripts/migrate-photos-mileage.js` (new) | migration utility | transform | `scripts/match-photos.js`, `scripts/generate-routes-manifest.js` | role-match |
| `scripts/route-config.js` (elevationTargetRange) | config | — | `scripts/route-config.js` itself | self (conditional edit) |
| `public/data/photos-manifest.json` | data file | file-I/O | — (written by migration script) | n/a |

---

## Pattern Assignments

### `scripts/match-photos.js` — Bug Fix (line 23)

**Change:** Single-line path correction. The stale constant `ROUTE_PATH` on line 23 reads the legacy root-level `route-data.json` instead of the per-route subdirectory version.

**Analog:** `scripts/resolve-annotations.js` (lines 45–46) — shows the correct per-route path construction pattern used everywhere else in the pipeline.

**Current broken line 23:**
```javascript
const ROUTE_PATH = resolve(ROOT, 'public', 'data', 'route-data.json');
```

**Fixed line 23** (pattern from `scripts/resolve-annotations.js` lines 45–46):
```javascript
const ROUTE_PATH = resolve(ROOT, 'public', 'data', '100mi', 'route-data.json');
```

**Path construction pattern** (`scripts/resolve-annotations.js` lines 21–22, 45–46):
```javascript
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
// ...
const routeDataPath = resolve(ROOT, 'public', 'data', routeId, 'route-data.json');
```

**Context on the bug** (`scripts/match-photos.js` lines 19–24):
```javascript
// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const MANIFEST_PATH = resolve(ROOT, 'public', 'data', 'photos-manifest.json');
const ROUTE_PATH = resolve(ROOT, 'public', 'data', 'route-data.json');   // ← LINE 23 — BUG HERE
const OUTPUT_PATH = resolve(ROOT, 'public', 'data', 'photos.json');
```

---

### `scripts/migrate-photos-mileage.js` (new one-shot migration script)

**Role:** One-shot Node.js migration utility. Reads `public/data/photos-manifest.json`, applies a +1.59 mile offset to every `mile` field with modulo wrap-around, and writes the result back in-place.

**Primary analog:** `scripts/match-photos.js` — same file I/O pattern (read manifest, transform, write back). No external dependencies. ESM module style.

**Secondary analog:** `scripts/generate-routes-manifest.js` — shows the try/catch pattern for JSON file reads with explicit error messages and `process.exit(1)`.

**Imports pattern** (copy from `scripts/match-photos.js` lines 11–16):
```javascript
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
```

**JSDoc header pattern** (copy from `scripts/match-photos.js` lines 1–9):
```javascript
/**
 * migrate-photos-mileage.js
 *
 * One-shot migration: shifts all mileage values in photos-manifest.json
 * by +OFFSET_MILES (with modulo wrap at NEW_TOTAL_MILES) to account for
 * the ~1.59-mile rotation of the course start to 46.34770, -86.72515.
 *
 * Usage: node scripts/migrate-photos-mileage.js
 */
```

**Path constants pattern** (adapt from `scripts/match-photos.js` lines 22–24):
```javascript
const MANIFEST_PATH = resolve(ROOT, 'public', 'data', 'photos-manifest.json');
```

**JSON read pattern with error handling** (adapt from `scripts/generate-routes-manifest.js` lines 33–38):
```javascript
let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
} catch (err) {
  console.error(`[migrate-photos-mileage] Failed to read ${MANIFEST_PATH}:`, err.message);
  process.exit(1);
}
```

**Core transform pattern** (from RESEARCH.md Photo Mileage Migration section):
```javascript
// From RESEARCH.md — research-computed constants:
const NEW_TOTAL_MILES = 101.91; // approximate pre-pipeline estimate; snapByMileage clamps gracefully
const OFFSET_MILES = 1.59;      // old course mile 0 is at new course mile 100.32

function shiftMile(oldMile) {
  let newMile = oldMile + OFFSET_MILES;
  if (newMile > NEW_TOTAL_MILES) {
    newMile = newMile - NEW_TOTAL_MILES;
  }
  return Math.round(newMile * 10) / 10;
}

const updated = manifest.map((entry) => ({
  ...entry,
  mile: shiftMile(entry.mile),
}));
```

**JSON write pattern** (copy from `scripts/match-photos.js` line 102):
```javascript
writeFileSync(MANIFEST_PATH, JSON.stringify(updated, null, 2), 'utf8');
```

**Summary log pattern** (copy from `scripts/match-photos.js` lines 108–110):
```javascript
console.log('migrate-photos-mileage: complete');
console.log(`  Entries migrated : ${updated.length}`);
console.log(`  Output           : public/data/photos-manifest.json`);
```

**Complete script structure** (synthesized from analogs):
```javascript
/**
 * migrate-photos-mileage.js
 * [JSDoc header per pattern above]
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const MANIFEST_PATH = resolve(ROOT, 'public', 'data', 'photos-manifest.json');

const NEW_TOTAL_MILES = 101.91;
const OFFSET_MILES = 1.59;

function shiftMile(oldMile) {
  let newMile = oldMile + OFFSET_MILES;
  if (newMile > NEW_TOTAL_MILES) {
    newMile = newMile - NEW_TOTAL_MILES;
  }
  return Math.round(newMile * 10) / 10;
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
} catch (err) {
  console.error(`[migrate-photos-mileage] Failed to read ${MANIFEST_PATH}:`, err.message);
  process.exit(1);
}

const updated = manifest.map((entry) => ({
  ...entry,
  mile: shiftMile(entry.mile),
}));

writeFileSync(MANIFEST_PATH, JSON.stringify(updated, null, 2), 'utf8');

console.log('migrate-photos-mileage: complete');
console.log(`  Entries migrated : ${updated.length}`);
console.log(`  Offset applied   : +${OFFSET_MILES} miles (modulo ${NEW_TOTAL_MILES})`);
console.log(`  Output           : public/data/photos-manifest.json`);
```

---

### `scripts/route-config.js` — Conditional Edit (`elevationTargetRange`)

**Change:** If the pipeline log for 100mi shows no "IN RANGE" annotation across threshold scans, update the `elevationTargetRange` array on line 30 to bracket the closest threshold result logged.

**Current value** (`scripts/route-config.js` line 30):
```javascript
elevationTargetRange: [2123, 2411], // ft — verified against Garmin/Strava recordings
```

**Edit pattern:** Update both bounds to bracket the threshold result that produced the gain value closest to the expected ~2,267 ft midpoint. Preserve the trailing comment format. No other edits.

**No-change case:** If "IN RANGE" appears in the pipeline log, skip this edit entirely.

---

### `public/data/photos-manifest.json` — Written by Migration Script

**No direct code pattern needed.** Structure is a flat JSON array of objects with `filename` (string) and `mile` (number), with optional `featured` (boolean). The migration script writes this file using `JSON.stringify(updated, null, 2)` preserving the existing shape.

**Observed schema** (from `public/data/photos-manifest.json` lines 1–10):
```json
[
  {
    "filename": "3PCGOOVOwBqssLxnyUx4ca6DmyvpSlk49x6iLrCzLK0-1536x2048.jpg",
    "mile": 5.5
  },
  ...
]
```

**Near-end photos that wrap** (entries with `mile` >= 99.0 in the current manifest, lines 48–62 and 153–165):
- `DJJZnbN0A7oHtXa2iCmuD_Bk0jtfLsM7Fpa1q39lx7c-1536x2048.jpg` mile 99.0 → shifts to ~100.59
- `SCgulYASTg77ri9A1WZTvJOyl1GfeF_97HD7JBFE4DI-1536x2048.jpg` mile 99.1 → shifts to ~100.69
- `fh2Q9sS-8lUg5C440GXzj1W18TTlZIBjs5MNGUzoDf0-1536x2048.jpg` mile 99.9 → shifts to ~101.49
- `ewEz-rAufhLbF8XwfwfAC0rKeXvFkE9uGo9xxGdkWVI-1536x2048.jpg` mile 100.1 → shifts to ~101.69
- `bhrt78MHvrVBto-qBpwHU11DLfAMJrU2VT8M2CLyRq0-1536x2048.jpg` mile 100.3 → shifts to ~101.89

All 5 remain below `NEW_TOTAL_MILES` (101.91) — no modulo wrap fires for these. Two entries at mile 97.2 and 97.4 also shift into the 98-99 range (no wrap).

---

## Shared Patterns

### ESM Module Boilerplate
**Source:** Every script in `scripts/` — all use the same ESM `__dirname` pattern.
**Apply to:** `scripts/migrate-photos-mileage.js`
```javascript
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
```

### JSON Read/Write
**Source:** `scripts/match-photos.js` lines 40–42, 102; `scripts/generate-routes-manifest.js` lines 33–38, 58–59
**Apply to:** `scripts/migrate-photos-mileage.js`
```javascript
// Read
const data = JSON.parse(readFileSync(PATH, 'utf8'));

// Write (2-space indent, utf8 explicit)
writeFileSync(PATH, JSON.stringify(data, null, 2), 'utf8');
```

### Console Summary Log
**Source:** `scripts/match-photos.js` lines 108–110; `scripts/resolve-annotations.js` lines 182–198
**Apply to:** `scripts/migrate-photos-mileage.js`
```javascript
console.log('[script-name]: complete');
console.log(`  Key stat : ${value}`);
console.log(`  Output   : relative/path/to/output`);
```

### Per-Route Path Construction
**Source:** `scripts/resolve-annotations.js` lines 45–46; `scripts/parse-gpx.js` lines 187–189
**Apply to:** Any post-pipeline verification steps that read per-route JSON.
```javascript
const routeDataPath = resolve(ROOT, 'public', 'data', routeId, 'route-data.json');
const annotationsPath = resolve(ROOT, 'public', 'data', routeId, 'annotations.json');
```

---

## No Analog Found

No files in this phase lack analogs. The migration script has a strong role-match in `match-photos.js` (same JSON read-transform-write pattern) and `generate-routes-manifest.js` (error handling pattern).

| File | Role | Data Flow | Note |
|------|------|-----------|------|
| GPX files (3x) | pipeline input | file-I/O | Binary file copy — no code pattern applies. Filenames are kept identical so no config changes cascade. |

---

## Metadata

**Analog search scope:** `scripts/` directory (17 scripts read/reviewed)
**Files scanned:** `match-photos.js`, `pipeline.js`, `parse-gpx.js`, `resolve-annotations.js`, `route-config.js`, `copy-gpx.js`, `generate-routes-manifest.js`, `public/data/photos-manifest.json`
**Pattern extraction date:** 2026-05-29
**No migration script precedent exists in this codebase** — `scripts/migrate-photos-mileage.js` will be the first. House style derived from `match-photos.js` (closest analog by data flow: JSON array read → transform → write back).
