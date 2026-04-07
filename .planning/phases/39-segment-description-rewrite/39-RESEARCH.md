# Phase 39: Segment Description Rewrite - Research

**Researched:** 2026-04-07
**Domain:** Content authoring — ecological prose, data file sync
**Confidence:** HIGH

---

## Summary

Phase 39 is a pure content rewrite. There are no libraries to install, no new components to build, and no structural changes to the data pipeline. The work has two parts: (1) write seven new descriptions to spec, and (2) synchronize that text across two locations.

The two locations are tightly coupled. `generate-sector-details.js` hardcodes descriptions in a `SECTOR_DETAILS` const and outputs `public/data/sector-details.json` during the pipeline. `RouteExplainer.astro` hardcodes the same descriptions in a separate `SEGMENTS` const. Both must be updated and kept in sync; the JSON is the rendered output, not the source — `generate-sector-details.js` is the source for the panel text, `RouteExplainer.astro` is the source for the page text. They are NOT auto-synced; manual sync is required.

The Forest Plan PDF (2006) provides the primary ecological reference. Confirmed species and community types for the areas traversed by the route are documented below under Ecological Source Material. The surface characterization decisions are locked in CONTEXT.md and are straightforward to apply.

**Primary recommendation:** Write all seven descriptions in one pass, update both source files, run `node scripts/generate-sector-details.js` to regenerate the JSON, and verify the JSON output matches the prose.

---

## Standard Stack

This phase has no library dependencies. The work is:

| File | Role | Action |
|------|------|--------|
| `src/components/RouteExplainer.astro` | Page rendering — `SEGMENTS` const | Update `description` field for all 7 entries |
| `scripts/generate-sector-details.js` | Pipeline source — `SECTOR_DETAILS` const | Update `description` field for all 7 entries |
| `public/data/sector-details.json` | Pipeline output — read by map panel | Regenerate by running `node scripts/generate-sector-details.js` |

No npm packages. No new files. No schema changes.

---

## Architecture Patterns

### Pattern 1: Two hardcoded sources, one JSON output

`generate-sector-details.js` contains a `SECTOR_DETAILS` array with `id`, `description`, `surface`, and `stravaLink` per sector. It merges these with geometry from `public/data/100mi/annotations.json` to produce `public/data/sector-details.json`.

`RouteExplainer.astro` has a separate `SEGMENTS` array with the same descriptions, rendered directly in the page.

These two are manually maintained in parallel. There is no shared source of truth — both must be updated. The `surface` field in `generate-sector-details.js` is a short label (e.g., `"packed gravel, county-maintained"`) that is NOT required to match prose word-for-word, but must be consistent in characterization (per CONTEXT.md decision).

### Pattern 2: Pipeline regeneration

After editing `generate-sector-details.js`, run:
```bash
node scripts/generate-sector-details.js
```
This is a standalone script — it does not require the full `npm run pipeline`. The output file `public/data/sector-details.json` is committed to the repo (it is not gitignored).

### Anti-Patterns to Avoid

- **Editing `sector-details.json` directly:** It will be overwritten the next time the pipeline runs. Always edit `generate-sector-details.js`.
- **Updating only one source:** Both `RouteExplainer.astro` and `generate-sector-details.js` must be updated. Updating only one leaves the page and panel out of sync.
- **Adding road names, mile markers, or landmarks to prose:** Per CONTEXT.md, landscape only in descriptions — no road names, mile markers, or restock points in the description text (that info lives in segment headers and metadata).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Ecology accuracy | Generic nature-copy or guessed species | Forest Plan PDF + segment coordinates to identify the right community |
| Surface label | Deriving label from prose | Keep `surface` field as short editorial label, independent of prose phrasing |

---

## Ecological Source Material

**Confidence: HIGH** — sourced from 2006 Hiawatha National Forest Plan, Chapter 2 (Vegetation Management) and Chapter 3 (Management Area Direction).

### Forest-wide species inventory (confirmed present in Hiawatha NF)

**Northern hardwoods canopy:** sugar maple, beech, red maple, cherry, yellow birch, basswood, oak  
**Conifers mixed into hardwood stands:** white pine, hemlock  
**Upland conifers (managed stands):** red pine, jack pine, white pine  
**Early successional / disturbance:** aspen, paper birch  
**Lowland conifers (swamp/wetland edges):** cedar, hemlock, black spruce, tamarack  
**Understory / shrub layer:** blueberry (confirmed in MA 4.4)

### Segment-by-segment ecological context

The route's GPS coordinates (from `annotations.json`) map segments to approximate management areas. The following is derived from coordinate ranges cross-referenced with Forest Plan landscape descriptions:

**Segment: 520** (mi 1.03–2.43, near Munising, 46.357°N 86.732°W)  
Paved county road east from Munising. Exits town past Munising Falls. Terrain is Munising Moraine — rolling, shallow glacial lake plain near Lake Superior. Vegetation adjacent: northern hardwoods (sugar maple, yellow birch) on upland slopes; proximity to Pictured Rocks corridor. Not a wilderness/interior segment — roadside ecology applies.

**Segment: NF2266** (mi 6.72–9.9, 46.333°N 86.656°W → 46.291°N 86.672°W)  
Interior Forest Service road, Management Area 2.3 character: rolling to steep topography, productive upland soils, northern hardwoods dominant. Desired condition (MA 2.3): "sugar maple and beech dominate... red maple, cherry, yellow birch and basswood also found... white pine and hemlock interspersed within hardwood stands." This is the old-growth hardwood character corridor. Beech understory, multi-layered canopy typical of late seral northern hardwoods.

**Segment: Bass Lake Rd** (mi 25.25–30.3, 46.187°N 86.457°W → 46.122°N 86.436°W)  
County-maintained gravel, rolling terrain south of Munising. Vegetation: mixed; paper birch common on productive upland sands in this range. Bass Lake visible from road — riparian corridor with alder, cedar along lake margins. Upland cover: northern hardwood mix (red maple, paper birch, aspen). Relatively open compared to NF2266.

**Segment: NF2217-2218** (mi 36.75–43.39, 46.072°N 86.467°W → 46.071°N 86.544°W)  
Forest Service dual-track through interior, Indian River drainage. Coordinates sit in the Indian River headwaters watershed — mixed forest, flat to gently rolling outwash plain terrain. MA 4.2 and 4.5 character applicable: red pine common in managed stands; jack pine on sandy soils; mixed northern hardwoods on better soils; lowland conifers (cedar, tamarack) along stream margins. Camp 7 Lake area: lake/stream corridor with cedar and alder fringe. Compact, hard-packed double-track surface typical.

**Segment: ND2225** (mi 55.78–59.58, 46.137°N 86.603°W → 46.153°N 86.541°W)  
Unmaintained forest road, Indian River headwaters area. MA 4.4 character: "Jack pine is most common tree species, although oak, aspen, paper birch, lowland hardwoods, red pine and white pine also found. Blueberries may be found throughout." Dry sandy soils (outwash plains), fire is primary disturbance. Kirtland's warbler habitat zone. Classic jack pine / blueberry understory character distinguishes this segment.

**Segment: Doe Lake** (mi 84.66–87.94, 46.257°N 86.680°W → 46.262°N 86.745°W)  
Sandy two-track near Doe Lake. Coordinates are northwest of the Indian River area, back toward the Munising moraine range. MA 2.3 or 4.2 character: mixed conifer and hardwood, wet soils near lake. Red pine and jack pine on upland sands; cedar and tamarack near lake margins; aspen regeneration in logged patches. Rooty, technical surface with embedded rocks — bedrockcontrolled moraines in this range.

**Segment: Ridge Rd / sector-rapid-river** (mi 94.46–100.89, 46.333°N 86.783°W → 46.357°N 86.733°W)  
USFS truck trail heading north back toward Munising, crossing Rapid River drainage. MA 2.3 character: northern hardwoods (sugar maple, yellow birch, beech) on upper slopes; aspen in logged areas; white pine on ridges. Long descents indicate moraine topography. As the route returns to the Munising area, the forest transitions back toward northern hardwoods with Lake Superior influence. Aspen corridor on ridge flanks confirmed.

---

## Common Pitfalls

### Pitfall 1: Removing the "Surface:" label but keeping the label-style phrasing
**What goes wrong:** Description opens with "Packed gravel runs through..." which is still label-first writing, just without the colon. The voice spec requires the surface to be woven in as texture, not announced as a category.
**How to avoid:** The surface should appear as a modifier to an action or place, not as the grammatical subject. "Packed county gravel rolls south past Bass Lake..." not "Packed gravel characterizes this stretch..."

### Pitfall 2: Generic ecology ("hardwoods", "mixed forest")
**What goes wrong:** Using group names instead of species names violates the CONTEXT.md rule on ecology specificity.
**How to avoid:** Name the actual species. "Sugar maple and beech close overhead" not "hardwoods canopy overhead." The Forest Plan confirms which species are present in each area.

### Pitfall 3: Second-person voice creep
**What goes wrong:** Slipping into "you'll find" or "your legs" language.
**How to avoid:** Describe the trail, not the rider's experience. "The surface firms up on north-facing slopes" not "You'll feel the surface firm up."

### Pitfall 4: Word count drift
**What goes wrong:** Descriptions run over 55 or under 35 words.
**How to avoid:** Count words per description before committing. The three-clause structure (surface → ecology → terrain/experience) naturally lands in range if each clause is roughly 12–18 words.

### Pitfall 5: Sync drift between the two source files
**What goes wrong:** Editing `RouteExplainer.astro` but forgetting `generate-sector-details.js` (or vice versa), leaving panel text different from page text.
**How to avoid:** Update both in the same commit. After running `node scripts/generate-sector-details.js`, diff `sector-details.json` descriptions against the Astro file to confirm they match.

### Pitfall 6: Editing `sector-details.json` directly
**What goes wrong:** Changes are wiped on next pipeline run.
**How to avoid:** Always edit `generate-sector-details.js`. Run the script to regenerate the JSON. Commit both.

---

## Code Examples

### Current description structure in generate-sector-details.js
```javascript
// Source: scripts/generate-sector-details.js, SECTOR_DETAILS array
{
  id: 'sector-nf2266',
  description: "The route's crucible. Deep sand, washboard ruts, and relentless climbs through old-growth hardwoods on a barely maintained Forest Service road. This is where the ride earns its name. Surface: deteriorating sand and gravel two-track...",
  surface: 'sand and gravel two-track',
  stravaLink: 'https://www.strava.com/segments/28533671',
},
```

### Target description structure (surface woven in, no label)
```javascript
// After rewrite — surface as texture word in first clause
{
  id: 'sector-nf2266',
  description: "[Surface texture verb/modifier...] [ecological species/community...] [terrain/riding character...]",
  surface: 'sand and gravel two-track',  // short label unchanged
  stravaLink: 'https://www.strava.com/segments/28533671',
},
```

### Corresponding SEGMENTS entry in RouteExplainer.astro
```javascript
// Source: src/components/RouteExplainer.astro, SEGMENTS array
{ name: 'NF2266', startMi: 5.6, endMi: 18.0, ..., description: '...' },
// description must match generate-sector-details.js after rewrite
```

### Regenerating sector-details.json after edit
```bash
node scripts/generate-sector-details.js
# Output: public/data/sector-details.json (committed to repo)
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|---|---|---|
| Long multi-sentence descriptions (~80-120 words) with seasonal notes, road names, restock points | 35-55 word three-clause prose: surface → ecology → terrain | This phase is the rewrite |
| "Surface: [label]" pattern as standalone sentence | Surface woven as texture word into first clause | Per CONTEXT.md decision |
| Generic group names ("hardwoods", "conifers") | Common species names (sugar maple, beech, jack pine) | Per CONTEXT.md decision |
| Second-person rider perspective ("you'll find") | Third-person naturalist observation | Per CONTEXT.md decision |

---

## Open Questions

1. **NF2266 old-growth claim**
   - What we know: Current description calls it "old-growth hardwoods." Forest Plan confirms MA 2.3 has late seral northern hardwoods with long disturbance return times and multi-layered canopy.
   - What's unclear: Whether the specific NF2266 corridor contains designated old-growth stands (52,000 acres forest-wide) or is simply mature second-growth.
   - Recommendation: Use "mature northern hardwoods" or "late-seral hardwoods" language rather than "old-growth" unless verifiable. "Sugar maple and beech with hemlock understory" captures the character without the claim.

2. **Segment geographic precision**
   - What we know: GPS coordinates from annotations.json provide start/end lat-lon for each sector.
   - What's unclear: The exact management area boundaries aren't mapped here — the ecological characterizations above are inferred from coordinates and Forest Plan landscape descriptions, not from a precise GIS overlay.
   - Recommendation: The Forest Plan species lists are forest-wide confirmed; the per-segment species choices should be treated as ecologically plausible, not certifiably precise. This is appropriate for prose naturalist description.

3. **Bass Lake Rd and NF2217-2218 differentiation**
   - What we know: Both are gravel roads through forest interior. Both involve mixed hardwood/conifer cover. Both are at similar latitudes.
   - What's unclear: The ecological differentiator between these two for prose purposes.
   - Recommendation: Bass Lake Rd differentiator is the lake itself + paper birch on productive upland sands (county-maintained, more open). NF2217-2218 differentiator is the Indian River headwaters + Camp 7 Lake + red/white pine corridor on the flat outwash plain (longer, more meditative character). Use the water feature and pine character to distinguish.

---

## Sources

### Primary (HIGH confidence)
- 2006 Hiawatha National Forest Plan PDF (`documents/2006 Forest Plan Documents.pdf`)
  - Chapter 2, Section 2400: Vegetation Management — forest-wide species list (sugar maple, beech, red maple, cherry, yellow birch, basswood, white pine, hemlock, red pine, jack pine, aspen, paper birch, cedar, tamarack, black spruce, balsam fir)
  - Chapter 3, MA 2.3: Northern hardwoods landscape description and desired conditions (sugar maple, beech, yellow birch, basswood, red maple, cherry, white pine, hemlock)
  - Chapter 3, MA 4.2: Conifer managed landscape (red pine dominant, jack pine, white pine, oak, aspen, paper birch, northern hardwoods)
  - Chapter 3, MA 4.4: Jack pine / sandy soils landscape (jack pine, oak, aspen, paper birch, red pine, white pine, blueberry)
  - Chapter 3, MA 4.5: Lowland conifers (cedar, hemlock, spruce, tamarack)
- `public/data/100mi/annotations.json` — confirmed segment coordinates and mile ranges
- `scripts/generate-sector-details.js` — confirmed data flow: descriptions hardcoded here, output to `public/data/sector-details.json`
- `src/components/RouteExplainer.astro` — confirmed descriptions also hardcoded here in separate `SEGMENTS` const

### Secondary (MEDIUM confidence)
- Segment-to-management-area mapping is inferred from coordinates + Forest Plan landscape descriptions, not from a GIS overlay

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — directly verified from source files
- Architecture: HIGH — directly verified from source files
- Ecological species: HIGH for forest-wide inventory; MEDIUM for per-segment attribution (inferred from coordinates + management area descriptions)
- Pitfalls: HIGH — derived directly from examining current descriptions against spec

**Research date:** 2026-04-07
**Valid until:** Stable content — valid indefinitely unless route alignment or species data changes
