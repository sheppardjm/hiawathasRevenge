# Phase 42: Photo Pipeline - Research

**Researched:** 2026-04-07
**Domain:** Build pipeline execution and git artifact staging for new photo assets
**Confidence:** HIGH

## Summary

Phase 42 is fundamentally a "commit and verify" phase, not a "build new systems" phase. All pipeline scripts for photo processing are **fully implemented and working**: `generate-thumbnails.js` (sharp WebP conversion), `copy-images.js` (public/images/ staging), `match-photos.js` (mileage snapping to route coordinates), plus the front-end components `PhotoGallery.astro` (gallery + PhotoSwipe) and `RouteMap.astro` (cluster markers). The entire pipeline was established in Phases 7 and 9.

The current state is: **five new photos have already been processed through the pipeline** — their WebP thumbnails (400px/80%, all verified), `public/images/` copies, updated `photos-manifest.json`, and regenerated `photos.json` are all present on disk. However, **three source images and all five sets of pipeline artifacts are untracked/uncommitted in git**. The pipeline ran correctly; the work is to stage and commit what was generated.

One code change is needed: `match-photos.js` does not sort its output by mileage. `needs.md` v4 item 6 explicitly requests gallery photos in route order (start to finish). Sorting in `match-photos.js` (by `snap.miles` ascending before writing `photos.json`) satisfies PHT-02/PHT-04 deliverables and is the correct place to add this since `PhotoGallery.astro` reads the static JSON at build time with no sort of its own.

**Primary recommendation:** This phase has one code task (add sort to `match-photos.js`), one pipeline run (to regenerate `photos.json` with sorted output), and one commit task (stage all new/modified files). No new scripts, libraries, or architectural changes needed.

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sharp | 0.34.5 | WebP thumbnail generation | Already in devDependencies, fully functional |
| leaflet.markercluster | 1.5.3 | Photo cluster markers on map | Already in dependencies, cluster logic in RouteMap.astro |
| photoswipe | 5.4.4 | Lightbox for gallery | Already in dependencies, initialized in PhotoGallery.astro |

### Supporting (already in use)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:fs (built-in) | N/A | File I/O for pipeline scripts | All pipeline scripts already use it |
| node:path (built-in) | N/A | Path construction | All pipeline scripts already use it |

### Alternatives Considered
None — all tools are already installed and proven. Phase 42 does not introduce new libraries.

**Installation:** None needed. All dependencies are already present in `node_modules/`.

## Architecture Patterns

### Existing Pipeline Flow (already working)
```
images/*.jpg
  → generate-thumbnails.js  → public/thumbs/*.webp
  → copy-images.js          → public/images/*.jpg
  
public/data/photos-manifest.json
  + public/data/route-data.json (100mi route)
  → match-photos.js          → public/data/photos.json

public/data/photos.json (at build time)
  → PhotoGallery.astro       → gallery HTML (sorted by photos.json order)
  
public/data/photos.json (at runtime via fetch)
  → RouteMap.astro           → cluster markers on map
```

### Pattern 1: Sort by Mileage in match-photos.js
**What:** Add `.sort((a, b) => a.mile - b.mile)` after `manifest.map()` in `match-photos.js`.
**When to use:** Single insertion point; no downstream changes needed.
**Example:**
```javascript
// In scripts/match-photos.js — add sort after map:
const photos = manifest.map((entry) => {
  const snap = snapByMileage(entry.mile, routePoints);
  const thumbName = basename(entry.filename, extname(entry.filename)).replace(/ /g, '_') + '.webp';
  return {
    id: entry.filename,
    filename: entry.filename,
    thumb: `/thumbs/${thumbName}`,
    mile: snap.miles,
    lat: snap.lat,
    lon: snap.lon,
    ...(entry.featured ? { featured: true } : {}),
  };
}).sort((a, b) => a.mile - b.mile);  // ← ADD THIS

writeFileSync(OUTPUT_PATH, JSON.stringify(photos, null, 2), 'utf8');
```

Note: `photoIndex` in `RouteMap.astro`'s `map:photoClick` CustomEvent dispatches the array index from `photosData.forEach((photo, index) => ...)`. `PhotoGallery.astro` opens the lightbox with `e.detail.photoIndex`. Both read from the same `photos.json`. As long as both consume the **same sorted order**, the index synchronization holds. The sort makes both consistent.

### Pattern 2: Pipeline Execution (for regeneration after code change)
```bash
/Users/Sheppardjm/.volta/bin/node scripts/pipeline.js
# Or via npm (uses Volta node automatically via package resolution):
npm run pipeline
```

The pipeline runs `match-photos.js` as a shared step after route-specific steps complete. After adding the sort, run the pipeline to regenerate `photos.json` with sorted output.

### Pattern 3: Git Staging for Pipeline Artifacts
Files to stage after pipeline run:
```
images/3hLiyfbORWq6PHzMma1xAc5Xdf96zB4oP2UCqcXSIqQ-2048x1536.jpg    (new source)
images/U0rs5zQNNvUpy-iq7fzqkx1JI1SjVZpFiMCPUSDnpJQ-2048x1536.jpg    (new source)
images/a0WUXHTzuL6dA_nydrHAc9e4D6Y0GePqijGYfK4RjRI-2048x1536.jpg    (new source)
public/images/481217662_940182138298576_9153860934101064276_n.jpg     (copy-images artifact, was missing)
public/images/486608604_9394952410585513_146903612478534164_n.jpg     (copy-images artifact, was missing)
public/images/3hLiyfbORWq6PHzMma1xAc5Xdf96zB4oP2UCqcXSIqQ-2048x1536.jpg  (new)
public/images/U0rs5zQNNvUpy-iq7fzqkx1JI1SjVZpFiMCPUSDnpJQ-2048x1536.jpg  (new)
public/images/a0WUXHTzuL6dA_nydrHAc9e4D6Y0GePqijGYfK4RjRI-2048x1536.jpg   (new)
public/thumbs/481217662_940182138298576_9153860934101064276_n.webp    (thumb, was missing)
public/thumbs/486608604_9394952410585513_146903612478534164_n.webp    (thumb, was missing)
public/thumbs/3hLiyfbORWq6PHzMma1xAc5Xdf96zB4oP2UCqcXSIqQ-2048x1536.webp  (new)
public/thumbs/U0rs5zQNNvUpy-iq7fzqkx1JI1SjVZpFiMCPUSDnpJQ-2048x1536.webp  (new)
public/thumbs/a0WUXHTzuL6dA_nydrHAc9e4D6Y0GePqijGYfK4RjRI-2048x1536.webp  (new)
public/data/photos-manifest.json    (modified: +5 entries)
public/data/photos.json             (regenerated: +5 entries, now sorted)
scripts/match-photos.js             (modified: add sort)
```

Do NOT stage:
- `images/badge.svg` — not a photo, not in manifest
- `images/inspiration/` — reference images, not route photos
- `public/images/badge.svg` — not a photo asset
- `src/components/segments.json` — unrelated to this phase

### Anti-Patterns to Avoid
- **Running `npm run dev` instead of `npm run pipeline`:** `predev` triggers the full pipeline which regenerates many files; this works but is slower and rebuilds things that aren't needed for this phase. Use `node scripts/pipeline.js` or `npm run pipeline` for targeted execution.
- **Staging `git add .` or `git add -A`:** Will accidentally include `badge.svg`, `inspiration/`, `segments.json`, and other unrelated untracked files. Stage files explicitly by name.
- **Sorting in `PhotoGallery.astro` instead of `match-photos.js`:** The gallery component is a server-side Astro component that reads JSON at build time. Sorting in the source of truth (`photos.json`) ensures the map marker `photoIndex` and gallery index stay synchronized.
- **Not re-running the pipeline after editing match-photos.js:** The code change won't affect the deployed gallery until `photos.json` is regenerated. Run pipeline after the sort is added.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Photo clustering on map | Custom cluster logic | `leaflet.markercluster` (already wired) | Already configured in RouteMap.astro with maxClusterRadius: 50 |
| Lightbox | Custom modal/lightbox | `photoswipe` (already wired) | Already initialized with correct gallery/children selectors in PhotoGallery.astro |
| Sort by mileage | Custom sort algorithm | `.sort((a, b) => a.mile - b.mile)` | Native JS array sort, miles are floats, simple numeric comparison is correct |
| JPEG → WebP conversion | Any custom encoder | `sharp` (already in use) | Already installed, proven working in this project |

**Key insight:** Phase 42 has no new architectural work. Every component is proven and working. The only new code is a one-line sort in match-photos.js.

## Common Pitfalls

### Pitfall 1: parseDims fallback for social-style filenames
**What goes wrong:** `PhotoGallery.astro` derives `data-pswp-width`/`data-pswp-height` from the filename pattern `-WIDTHxHEIGHT`. The two social-media photos (`481217662...n.jpg`, `486608604...n.jpg`) don't match this pattern and fall back to `{ w: 1536, h: 2048 }`.
**Why it happens:** Social media filenames don't follow the project's naming convention.
**How to avoid:** The fallback `1536x2048` is acceptable for now. The actual dimensions are `1536x2048` for `481217662` (matches fallback exactly) and `2048x1536` for `486608604` (fallback is WRONG — will cause PhotoSwipe to display with wrong aspect in lightbox). 
**Recommended fix:** Extend `parseDims` to also handle a portrait fallback, OR rename the file to include dimensions, OR accept the minor PhotoSwipe display issue since thumbnails display correctly (it only affects the lightbox transition animation).
**Warning signs:** PhotoSwipe lightbox opens `486608604...n.jpg` with portrait crop instead of landscape.

### Pitfall 2: map:photoClick index mismatch after sort
**What goes wrong:** `RouteMap.astro` dispatches `map:photoClick` with `photoIndex: index` based on the `photosData` array order. `PhotoGallery.astro` listens and calls `lightbox.loadAndOpen(e.detail.photoIndex, ...)` using the gallery DOM element order. If the two arrays are different orders, clicking a map marker opens the wrong photo.
**Why it happens:** Both components read from the same `photos.json`, so they ARE the same order. The risk is only if a future change fetches photos.json at runtime but renders gallery at build time with a different sort.
**How to avoid:** Both components already use the same `photos.json` source. The sort in `match-photos.js` ensures the JSON itself is sorted, so both runtime fetch (map) and build-time import (gallery) use identical order.
**Warning signs:** Clicking a map marker opens an incorrect photo in the lightbox.

### Pitfall 3: generate-thumbnails always regenerates all thumbs
**What goes wrong:** Unlike `generate-webp.js` (which has `existsSync` checks to skip existing files), `generate-thumbnails.js` regenerates ALL thumbnails every pipeline run. For 56 source images this is fast enough (~2-5 seconds with sharp), but worth knowing.
**Why it happens:** No `existsSync` guard in the current implementation.
**How to avoid:** For Phase 42, this is acceptable. No fix needed.
**Warning signs:** N/A — pipeline is just slower than necessary, no correctness issue.

### Pitfall 4: Featured flag was removed from two manifest entries
**What goes wrong:** The `featured` flag was removed from `iU0rfyHu6xWrBRL3fhhcd3T1rNdhu9iNWV5gVDwDNbQ-2048x1536.jpg` and `irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536.jpg` in the current unstaged manifest changes.
**Why it happens:** The manifest was edited via admin UI and the featured flags weren't preserved.
**Impact:** `PhotoGallery.astro` uses `photo.featured` for `column-span: all` (full-width treatment). Without the flag, these photos display at normal gallery column width. `match-photos.js` does pass through the `featured` field if present (the `...(entry.featured ? { featured: true } : {})` spread).
**How to avoid:** If the featured treatment is desired, re-add `"featured": true` to those two manifest entries before committing. This is a content decision, not a bug in the pipeline.

## Code Examples

### match-photos.js sort addition (the only code change needed)
```javascript
// In scripts/match-photos.js — line ~96
// BEFORE:
const photos = manifest.map((entry) => {
  // ... mapping logic
});

// AFTER — add .sort() after .map():
const photos = manifest.map((entry) => {
  const snap = snapByMileage(entry.mile, routePoints);
  const thumbName = basename(entry.filename, extname(entry.filename)).replace(/ /g, '_') + '.webp';
  return {
    id: entry.filename,
    filename: entry.filename,
    thumb: `/thumbs/${thumbName}`,
    mile: snap.miles,
    lat: snap.lat,
    lon: snap.lon,
    ...(entry.featured ? { featured: true } : {}),
  };
}).sort((a, b) => a.mile - b.mile);
```

### Verify thumbnail quality/format (spot check)
```bash
# Verify all 5 new thumbs are 400px wide WebP (already confirmed in research)
/Users/Sheppardjm/.volta/bin/node -e "
import('sharp').then(({ default: sharp }) => {
  const thumbs = [
    '3hLiyfbORWq6PHzMma1xAc5Xdf96zB4oP2UCqcXSIqQ-2048x1536.webp',
    '481217662_940182138298576_9153860934101064276_n.webp',
    '486608604_9394952410585513_146903612478534164_n.webp',
    'U0rs5zQNNvUpy-iq7fzqkx1JI1SjVZpFiMCPUSDnpJQ-2048x1536.webp',
    'a0WUXHTzuL6dA_nydrHAc9e4D6Y0GePqijGYfK4RjRI-2048x1536.webp',
  ].map(t => 'public/thumbs/' + t);
  Promise.all(thumbs.map(f => sharp(f).metadata().then(m => ({name: f.split('/').pop(), w: m.width, format: m.format}))))
    .then(results => results.forEach(r => console.log(r.name, r.w + 'px', r.format)));
});"
```

### Verify photos.json sorted after pipeline run
```bash
/Users/Sheppardjm/.volta/bin/node -e "
const p = JSON.parse(require('fs').readFileSync('public/data/photos.json'));
const miles = p.map(x => x.mile);
const ok = miles.every((m,i) => i === 0 || m >= miles[i-1]);
console.log('Sorted by mile:', ok, '| Count:', p.length);
"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pipeline artifacts manually copied | `npm run pipeline` runs all steps in sequence | Phase 7 | Reproducible build |
| Photos embedded in code | `photos-manifest.json` + admin UI | Phase 9 | New photos added without code changes |
| Admin UI saves via API | Admin UI downloads JSON for manual placement | Phase 41 (unstaged) | Simpler local workflow |

**Deprecated/outdated:**
- The `featured` field in manifest: currently still supported in `match-photos.js` and `PhotoGallery.astro`, but was removed from two entries in the current unstaged changes. Not deprecated, just deprioritized.
- Direct route-data.json path in `match-photos.js`: uses `public/data/route-data.json` (the 100mi legacy file, which matches the 100mi per-route file). Not a problem, but could be documented.

## Open Questions

1. **Should the `featured` flag be restored on the two entries that lost it?**
   - What we know: `iU0rfyHu6...` and `irrVhAXHnn...` had `"featured": true` in HEAD but not in the current unstaged manifest.
   - What's unclear: Was this intentional (design decision to remove full-width treatment)?
   - Recommendation: Check with user or proceed without featured treatment (it's cosmetic only). The planner should create a task to decide.

2. **Should `parseDims` be extended to handle social-media filenames correctly?**
   - What we know: `486608604...n.jpg` is `2048x1536` landscape, but falls back to `1536x2048` portrait in `PhotoGallery.astro`.
   - What's unclear: Is the PhotoSwipe lightbox aspect mismatch visible/significant to users?
   - Recommendation: This is a minor issue — the thumbnail shows correctly, only the lightbox transition is affected. Defer to Phase 43 (Gallery & Layout Polish) if needed.

3. **Is sorting in `match-photos.js` in scope for Phase 42 (vs. Phase 43)?**
   - What we know: `needs.md` v4 item 6 says gallery should be in route order. PHT-05 (gallery ordered by mileage) is assigned to Phase 43 per ROADMAP.md and REQUIREMENTS.md.
   - What's unclear: PHT-05 is formally a Phase 43 requirement, but the sort is a one-liner in `match-photos.js` and Phase 43 depends on Phase 42.
   - Recommendation: Add the sort in Phase 42 since it's trivially small and Phase 43 needs it anyway. The planner should mark PHT-05 as delivered in Phase 42 or defer it explicitly.

## Sources

### Primary (HIGH confidence)
- `/Users/Sheppardjm/Repos/hiawathasRevenge/scripts/generate-thumbnails.js` — thumbnail generation logic, verified working
- `/Users/Sheppardjm/Repos/hiawathasRevenge/scripts/match-photos.js` — mileage snapping, no sort present
- `/Users/Sheppardjm/Repos/hiawathasRevenge/scripts/copy-images.js` — public/images/ staging
- `/Users/Sheppardjm/Repos/hiawathasRevenge/scripts/pipeline.js` — orchestration order
- `/Users/Sheppardjm/Repos/hiawathasRevenge/src/components/PhotoGallery.astro` — gallery rendering, PhotoSwipe init, parseDims fallback
- `/Users/Sheppardjm/Repos/hiawathasRevenge/src/components/RouteMap.astro` — cluster marker code, photoIndex dispatch
- `/Users/Sheppardjm/Repos/hiawathasRevenge/public/data/photos-manifest.json` — current state: 56 entries, 5 new vs HEAD
- `/Users/Sheppardjm/Repos/hiawathasRevenge/public/data/photos.json` — current state: 56 entries, NOT sorted by mile
- Live verification: all 5 new thumbs confirmed 400px wide WebP at correct aspect ratios
- Live verification: `public/images/` contains copies of all 5 new photos
- `.planning/phases/07-photo-pipeline/07-RESEARCH.md` — prior research, confirmed still accurate
- `git status` output — confirmed untracked files and what needs staging

### Secondary (MEDIUM confidence)
- `.planning/ROADMAP.md` — PHT-05 assigned to Phase 43 (sort is "officially" Phase 43)
- `.planning/REQUIREMENTS.md` — requirement traceability table
- `src/needs.md` v4 item 6 — explicit user request for mileage-ordered gallery

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools already installed and proven working
- Architecture: HIGH — all scripts read and verified; data flow confirmed
- Pitfalls: HIGH for sort index sync; MEDIUM for parseDims issue (minor cosmetic)

**Research date:** 2026-04-07
**Valid until:** 2026-07-07 (stable pipeline, no active library churn)
