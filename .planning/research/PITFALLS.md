# Domain Pitfalls: Segment Editorial Rewrite

**Domain:** Editorial content rewrite on an existing Astro 6 static site with a 12-step build pipeline
**Researched:** 2026-04-06
**Confidence:** HIGH — all findings derived from direct code inspection, not external sources

---

## Critical Pitfalls

Mistakes that silently diverge content or require pipeline re-runs to surface.

---

### Pitfall 1: Description Divergence Between Two Hardcoded Copies

**What goes wrong:** The same description text exists as a hardcoded string in two separate JavaScript objects in two different files. Updating one without the other leaves a user-visible inconsistency: the RouteExplainer section shows one version, the sector detail panel (opened by clicking a segment on the map) shows another.

**Complete catalog of where descriptions live:**

| Location | File | Format | Consumer |
|---|---|---|---|
| `SEGMENTS` array, `description` field | `src/components/RouteExplainer.astro` lines 18-25 | Inline JS object literal | Rendered at build time into the route-guide HTML section |
| `SECTOR_DETAILS` array, `description` field | `scripts/generate-sector-details.js` lines 26-69 | Inline JS object literal | Build-time source; generates `public/data/sector-details.json` |
| `description` field | `public/data/sector-details.json` | Committed JSON artifact | Fetched at runtime by `RouteMap.astro` (`fetch('/data/sector-details.json')`); rendered as `<p class="panel-description">` in `openPanel()` |

Neither file imports the other. The comment on line 8 of `generate-sector-details.js` reads "Descriptions are extracted verbatim from RouteExplainer.astro SEGMENTS const" — but that extraction is manual copy-paste, not automated. The pipeline does not read from `RouteExplainer.astro`.

**Why it happens:** The convention of keeping them in sync has no enforcement mechanism. A writer naturally edits `RouteExplainer.astro` (the component with visible editorial content), regenerates the site, and sees the page look correct — without realizing the panel description is still served from `sector-details.json`, which is only updated by re-running `generate-sector-details.js`.

**Consequences:** Stale panel descriptions are only visible via map interaction (clicking a sector). A standard page review that doesn't open every panel will not catch the divergence.

**Prevention:** Edit both `RouteExplainer.astro` and `generate-sector-details.js` in the same commit. Do a side-by-side diff of all 7 descriptions across both files before committing.

**Warning signs:**
- `git status` shows `RouteExplainer.astro` modified but `generate-sector-details.js` unchanged
- Panel description does not match route-guide card description after clicking a sector

**Phase guidance:** Address both files in the same task. Do not split "update RouteExplainer" and "update generate-sector-details.js" across separate sub-tasks.

---

### Pitfall 2: Forgetting to Regenerate sector-details.json After Editing the Pipeline Script

**What goes wrong:** Editing `generate-sector-details.js` does not automatically regenerate `public/data/sector-details.json`. The JSON is a committed artifact — if the script is updated but the pipeline is not re-run, the deployed site serves the old panel descriptions. The Astro build does not trigger the pipeline; the pipeline must be run separately.

**Why it happens:** The route-guide section renders correctly at build time from the Astro component, so the build appears to succeed. The stale JSON is not noticed until someone clicks a sector on the map.

**Consequences:** Correct descriptions in route guide, stale descriptions in map panels. Two surfaces on the same page, diverged in production.

**Prevention:** After editing `generate-sector-details.js`, immediately run:
```
node scripts/generate-sector-details.js
```
Verify `public/data/sector-details.json` appears as modified in `git status`. Stage and commit the JSON file together with the script.

**Warning signs:**
- `git status` shows `generate-sector-details.js` modified but `public/data/sector-details.json` unchanged after editing descriptions

**Phase guidance:** The pipeline-run step must be explicit in the task checklist. A `git diff public/data/sector-details.json` verification belongs in the done criteria.

---

## Moderate Pitfalls

Mistakes that cause localized bugs or require careful coordination.

---

### Pitfall 3: Photo Assignment Boundary Confusion — Three Different Mileage Systems

**What goes wrong:** Three distinct mileage systems exist in this codebase. They represent different things and are not interchangeable. Adjusting a photo's mile value while confused about which system is in use breaks photo-to-segment association.

**The three systems:**

| System | File | What the numbers mean |
|---|---|---|
| SEGMENTS `startMi`/`endMi` | `RouteExplainer.astro` lines 18-25 | Broad photo-coverage zones: 520 = 0–5.0 mi, NF2266 = 5.0–18.0 mi, etc. These drive `filter(p.mile >= startMi && p.mile < endMi)` at line 48. |
| `annotations.json` `startMile`/`endMile` | `public/data/annotations.json` | GPS-snapped Strava segment boundaries: sector-520 = 1.03–2.43 mi, sector-nf2266 = 6.72–9.90 mi. Much narrower than the coverage zones. |
| `photos-manifest.json` `mile` field | `public/data/photos-manifest.json` | The value that determines which coverage zone a photo belongs to. `match-photos.js` snaps this to the nearest GPS route point; the output `mile` in `photos.json` is the snapped value. |

**The key risk:** A photo at mile 5.5 in `photos-manifest.json` belongs to the NF2266 coverage zone (5.0–18.0) and currently serves as the first-listed photo (hero image) for that segment card. If this photo's mile value is changed to below 5.0 to associate it with segment 520, the NF2266 card loses its hero photo and falls back to the gradient placeholder — unless NF2266 has another photo in the 5.0–18.0 range appearing before it in the sorted list.

**Safe approach for 520 photo work:** To give segment 520 a hero photo, assign a photo a mile value between 0.0 and 5.0 (exclusive). Do not move photos from the 5.0–18.0 range across the 5.0 boundary. Check the resulting hero state of both 520 and NF2266 after running `match-photos.js`.

**Warning signs:**
- A segment card shows the fallback gradient (`segment-hero-fallback`) after a photo mile adjustment
- `public/data/photos.json` shows a photo with `mile` value inside one coverage zone whose `photos-manifest.json` entry was recently edited

**Phase guidance:** Photo mileage changes require running `node scripts/match-photos.js`, then a visual check of all 7 segment card heroes before committing.

---

### Pitfall 4: Map Label Overlap at the Zoom-12 Visibility Threshold

**What goes wrong:** Sector label pills appear only at zoom >= 12 (`updateLabelVisibility()`, `RouteMap.astro` line 546). At exactly zoom 12, all active sectors for the selected route are simultaneously visible in a compressed viewport. Labels for geographically close segments can overlap.

**Current label implementation (`RouteMap.astro` lines 676-695):**
- Width is unbounded: `white-space: nowrap`, no `max-width`
- Centering via `transform: translate(-50%, -50%)` — not via Leaflet's `iconAnchor`
- `iconSize: [0, 0]`, `iconAnchor: [0, 0]`: Leaflet's offset system is bypassed entirely
- Label position is calculated from the midpoint of the Strava segment (`Math.floor((startIdx + endIdx) / 2)`), which is the GPS midpoint of a short Strava segment (sector-520 spans only indices 5–14)

**Why longer names increase risk:** At 11px display font, "NF2217-2218" (10 chars) and "Bass Lake Rd" (12 chars) render approximately 80–95px wide. These two segments are geographically adjacent in the southern loop. At zoom 12, their pills may touch or overlap.

**This is primarily a naming concern, not a description concern.** Since this milestone rewrites descriptions but does not rename segments, the risk is low. However, if any segment is incidentally renamed as part of the rewrite, overlap must be visually checked.

**Warning signs:**
- Two pills occupying the same pixel region at zoom 12
- One pill's text rendered behind another at zoom 12

**Phase guidance:** If segment `name` fields are changed (they should not be in this milestone), add a zoom-12 visual inspection step for the southern loop. If only descriptions change, this pitfall is dormant.

---

### Pitfall 5: Description/Surface Field Contradiction in the Panel

**What goes wrong:** `generate-sector-details.js` has a separate `surface` field for each sector that is displayed on the panel's meta line (`"X–Y mi · surface label"`). If a description rewrite changes how a segment's surface is characterized — without updating the `surface` field — the panel shows two contradictory characterizations on the same screen.

**Current surface field values:**
- `sector-520`: `smooth asphalt`
- `sector-nf2266`: `sand and gravel two-track`
- `sector-bass-lake`: `packed gravel, county-maintained`
- `sector-nf2217`: `compact gravel and hard-packed dirt`
- `sector-nd2225`: `loose gravel transitioning to sandy patches`
- `sector-doe-lake`: `deep sand and rugged two-track`
- `sector-rapid-river`: `firm packed gravel, USFS-maintained`

**Prevention:** When editing a description that characterizes surface conditions, review whether the `surface` field should change to match. These are separate strings rendered in separate UI locations; one does not automatically reflect the other.

**Phase guidance:** Add a "verify surface field consistency" check to the description-editing task.

---

## Minor Pitfalls

Localized mistakes, straightforward to fix.

---

### Pitfall 6: Ecological Specificity Beyond LANDFIRE's 30m Resolution

**What goes wrong:** Using formal vegetation community names or precise ecotone boundaries in descriptions implies spatial accuracy that LANDFIRE's 30m raster resolution cannot support. LANDFIRE zone boundaries are grid-snapped; on-the-ground ecotone transitions can occur 30–90m from the data boundary.

**What level of specificity is appropriate:** General character visible to a rider at 8–12 mph — "dense forest," "jack pine and red pine stands," "northern hardwood canopy," "open understory." This is the level the current descriptions use and it is correct.

**What to avoid in rewrites:** Formal Ecological Systems names (e.g., "Laurentian-Acadian Northern Hardwood Forest"), BpS community type codes, or precise species-composition claims based on LANDFIRE data alone.

**The current descriptions** already handle this correctly. New descriptions should follow the same pattern: observable character, not classification.

**Warning signs:** Any description that names a specific vegetation community type or implies the boundary of a habitat zone falls at a particular mile marker.

**Phase guidance:** Review vegetation language at the drafting step. No separate audit pass needed if writers follow the "observable to a rider" standard.

---

### Pitfall 7: Breaking the Sector Jump Link via Segment ID Mismatch

**What goes wrong:** The sector panel "View in route guide" jump link uses `details.id` from `sector-details.json` as an `href` anchor target (e.g., `href="#sector-rapid-river"`). The corresponding `<article>` in `RouteExplainer.astro` receives its `id` from the `SECTOR_IDS` lookup (line 60: `id={SECTOR_IDS[seg.name] ?? ''}`). If the segment `name` and the `SECTOR_IDS` mapping diverge, the anchor target breaks silently.

**Key legacy mapping to preserve:**
- Display name `'Ridge Rd'` maps to id `'sector-rapid-river'` — intentionally. The id carries the legacy name from when this segment was called "Rapid River." Changing the id would break URL anchors and jump links.

**Prevention:** This milestone rewrites descriptions, not names. The `name` fields in SEGMENTS should not change. If a rename is ever needed, it requires coordinated updates to: SEGMENTS array, SECTOR_IDS map, `annotations.json`, `sector-details.json`, `route-config.js` SECTOR_DEFS, and ROUTES `sectorIds` arrays.

**Phase guidance:** Dormant for a description-only rewrite. Becomes active if segment names are touched.

---

## Phase-Specific Warning Reference

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Rewriting descriptions in RouteExplainer.astro | Forgetting to mirror changes in generate-sector-details.js (Pitfall 1) | Edit both files in same task; side-by-side diff before commit |
| Committing the editorial update | sector-details.json not regenerated (Pitfall 2) | Run `node scripts/generate-sector-details.js` as an explicit step; verify JSON is dirty in git status |
| Photo mile adjustment for 520 segment | Stealing NF2266's hero image (Pitfall 3) | Check NF2266 retains a hero photo in 5.0–18.0 mi range before crossing the 5.0 boundary |
| Map label sizing (if names change) | Overlap at zoom 12 for southern loop (Pitfall 4) | Visual check at zoom 12, southern loop — only needed if names change |
| Surface characterization in descriptions | Surface field/description contradiction in panel (Pitfall 5) | Review surface field for each segment edited |
| Vegetation descriptions using LANDFIRE data | Over-specified zone boundaries (Pitfall 6) | Write at "observable to a rider" level; avoid formal community type names |
| Any segment renaming | Jump link anchor target breaking (Pitfall 7) | Full SECTOR_IDS + annotations + route-config audit — but this milestone should not rename segments |

---

## Sources

All findings are HIGH confidence — derived exclusively from direct code inspection.

- `src/components/RouteExplainer.astro` — SEGMENTS array, SECTOR_IDS map, photo filter logic
- `scripts/generate-sector-details.js` — SECTOR_DETAILS array, pipeline merge logic
- `scripts/match-photos.js` — photo snapping algorithm, manifest → photos.json pipeline
- `scripts/pipeline.js` — build step ordering
- `src/components/RouteMap.astro` — label rendering, zoom gating, panel description rendering, sector-details.json fetch
- `public/data/sector-details.json` — current committed descriptions and surface values
- `public/data/photos-manifest.json` — current photo mile values
- `public/data/annotations.json` — GPS-snapped segment boundaries
- `scripts/route-config.js` — SECTOR_DEFS, stable IDs
