# Research Summary: v1.6 Segment Editorial & Polish

**Project:** Hiawatha's Revenge — Segment Description Rewrite
**Domain:** Cycling showcase site — editorial content + targeted UI polish
**Researched:** 2026-04-06
**Confidence:** HIGH (implementation) / MEDIUM (segment-specific ecology)

---

## Executive Summary

This milestone rewrites 7 segment descriptions on a gravel cycling showcase site, replacing 80-120 word blocks with 35-55 word trail-guide blurbs that lead with surface character and anchor to observable ecological detail. The research consensus across real trail guides (bikepacking.com, SBT GRVL, M.O.R.E. Michigan, ISGG) is clear: the current descriptions are roughly double the ideal length, and the redundant "Surface:" label pattern is a form artifact with no analog in professional trail-guide writing. The rewrite target is two to three sentences: surface-first clause, ecology clause, optional experience clause.

The ecological content for each segment is grounded in LANDFIRE Biophysical Settings (BpS) data for Hiawatha National Forest, synthesized through a single gradient: the route moves from moraine-terrain northern hardwoods (sugar maple, hemlock, yellow birch) near Munising into the sandy glacial outwash interior (jack pine, peatland, black spruce bog) and back. That gradient is directly readable in the road surface — deep sand signals glacial outwash and jack pine; firm maintained gravel signals moraine till and northern hardwood. Surface type and ecology describe the same reality. Writing that links them is both accurate and efficient.

The implementation risk is not in the writing — it is in the data plumbing. Descriptions exist in two separate hardcoded locations (RouteExplainer.astro and generate-sector-details.js) with no automated sync. Editing one without the other produces silently diverged content across the page. This is the single most dangerous pitfall of the milestone: straightforward to prevent, invisible if missed.

---

## Key Findings

### Ecological Zones (from ECOLOGY.md)

The route traverses a clear north-south-north gradient driven by glacial geology. Confidence in the forest-wide BpS distribution is HIGH (official LANDFIRE data). Confidence in segment-specific attribution is MEDIUM (geographic inference from surface type, topographic names, and proximity to named water features — not a GIS overlay against the GPX track).

**The governing principle:** Surface type is an ecological indicator. This is the key insight linking riding experience to vegetation:

| Surface Type | Substrate | Dominant Forest | Key Observable Species |
|---|---|---|---|
| Deep sand / sandy two-track (NF2266, Doe Lake) | Glacial outwash | Jack pine-Black spruce | Sweetfern, lowbush blueberry, reindeer lichen |
| Loose gravel (ND2225) | Sandy till / transitional | Jack pine / mixed transitional | Bracken fern, blueberry, sparse hardwood |
| Maintained gravel (Bass Lake Rd, NF2217-2218, Ridge Rd) | Glacial till moraine | Northern Hardwoods-Hemlock | Sugar maple, yellow birch, hemlock, ferns |
| Paved (520) | Moraine / town edge | Northern Hardwoods-Hemlock | Sugar maple, yellow birch, hemlock |

**Per-segment ecological summary:**

| Segment | Primary BpS | What Riders See | Confidence |
|---|---|---|---|
| 520 | Northern Hardwoods-Hemlock (upland) + Cedar Swamp (low areas) | Sugar maple and yellow birch canopy with hemlock near streams; brief Lake Superior bay glimpse at start | MEDIUM |
| NF2266 | Jack Pine-Black Spruce (outwash upland) + Cedar Swamp (depressions) | Sandy road; jack pine canopy opening up with shorter trees, more sky; blueberry and bracken fern ground cover; cedar swamp dark margins at low crossings | MEDIUM |
| Bass Lake Rd | Northern Hardwoods-Hemlock (moraine uplands) + Cedar Swamp (lake margin) | Bass Lake through tree breaks; sugar maple and yellow birch on moraine knolls; hemlock in north-facing ravines; cedar-tamarack at lake edge | MEDIUM |
| NF2217-2218 | Northern Hardwoods-Hemlock (ridges) + Cedar Swamp + Acidic Peatland (margins) | Camp 7 Lake with forested shores; alternating upland hardwood and wetland corridors; cedar swamp crossings; possible black spruce fringe at drainage edges | MEDIUM |
| ND2225 | Jack Pine-Black Spruce (sandy uplands) + Acidic Peatland (flanking wetlands) | Jack pine with open sky; sweetfern on dry shoulders; abrupt peat bog fringe — stunted black spruce and sphagnum at drainage edges | MEDIUM |
| Doe Lake | Jack Pine-Black Spruce (uplands) + Acidic Peatland (lake margins) | Sandy two-track through jack pine; Doe Lake dark tannin-stained water with peatland margins; possible pitcher plants and sundews at bog edge | MEDIUM |
| Ridge Rd | Northern Hardwoods-Hemlock (moraine ridges) + Cedar Swamp (swales) | Return to taller hardwood canopy; sugar maple and yellow birch reasserting; hemlock in ravines; yellow birch with amber-gold bark | MEDIUM |

**Ecological narrative arc:** The route completes a full ecological loop — moraine hardwood-hemlock near Munising, through the sandy interior jack pine and peatland mosaic, back to moraine hardwood-hemlock on return. The contrast between the route's two halves is the defining ecological story and should be reflected in the descriptions as a unit.

**Vocabulary to use:** sweetfern, lowbush blueberry, reindeer lichen (sandy/jack pine zones); northern white-cedar, cinnamon fern, sphagnum (swamp/peatland zones); sugar maple, yellow birch, hemlock (moraine zones).

**Vocabulary to avoid:** formal BpS community type names, precise ecotone mile positions — LANDFIRE is 30m resolution and segment-specific attribution is inference, not measurement.

---

### Description Format (from FEATURES.md)

**Target: 35-55 words per description.** Cross-verified against bikepacking.com (40-70 words/segment), SBT GRVL (40-60 words), ISGG classifications (20-35 words), and interpretive signage research (30-45 second read time). Current descriptions at 80-120 words are roughly double the target.

**Structure (surface-first):**
1. Surface-first clause — what is under the wheels
2. Ecology clause — what is around the rider
3. Experience clause (optional) — what the combination produces

**What to remove from current descriptions:** Explicit "Surface:" labels; specific mileage callouts; restock point details (belong in map pins); multi-season condition notes; evaluative openers ("Welcome relief," "Technical and punishing").

**What to preserve from current text:**
- "This is where the ride earns its name." (NF2266 — keep)
- "the growing certainty that you're going to finish this thing" (Ridge Rd — keep if word budget allows)
- "deceptively civilized" register (520 — keep the attitude, shed the scaffolding)

**Tone:** Site voice is "New Yorker-esque, witty" (PROJECT.md). In trail-guide context, wit means precision with attitude, the unexpected right word, and brevity that implies restraint. Write as someone who has ridden this route and is not impressed by their own experience.

**Per-segment targets:**

| Segment | Target | Primary Ecology | Key Keeps | Key Sheds |
|---|---|---|---|---|
| 520 | ~30 words | Hardwood-hemlock edge | Deceptively civilized tone; bay glimpse | Surface label; visitor center callout |
| NF2266 | ~50 words | Jack pine / old-growth hardwood | "Earns its name"; old-growth canopy reference | Surface label; creek depth; logging context |
| Bass Lake Rd | ~40 words | Birch-hardwood moraine + lake | Contrast with NF2266; birch framing lake | "Welcome relief" opener; surface label |
| NF2217-2218 | ~40 words | Hardwood-wetland mosaic | "Meditative"; Camp 7 Lake reference | Surface label; restock detail; horsefly note |
| ND2225 | ~40 words | Jack pine / sandy interior | South-bending character; jack pine stands | Surface label; Indian River mileage callout |
| Doe Lake | ~45 words | Jack pine + peatland lake | Late-ride difficulty signal; lake appearance | Midway General Store detail; surface label |
| Ridge Rd | ~45 words | Moraine hardwood return | Home stretch energy; aspen-corridor detail | Surface label; unverified Lake Superior claim |

---

### Implementation Architecture (from ARCHITECTURE.md, appended section)

Three targeted fixes are fully specified with exact file locations. All findings from direct code inspection — confidence is HIGH.

**Fix 1: Map label sizing** — 3-line change in `src/components/RouteMap.astro`

| Property | Current | New | Line |
|---|---|---|---|
| `padding` | `3px 8px` | `4px 10px` | 683 |
| `font-size` (name) | `11px` | `12px` | 685 |
| `font-size` (stars) | `9px` | `10px` | 692 |

Inline CSS is correct here — Astro's scoped CSS cannot reach the dynamically built inner div. No refactor to CSS classes needed.

**Fix 2: 520 segment missing hero photo** — Two valid paths:
- Option B (ideal): Source an image from CR-520 or Munising Falls area (mile 0-5.0), add to `public/data/photos.json` with `mile < 5.0`, run `match-photos.js` if EXIF GPS present.
- Option D (acceptable): Accept the styled gradient fallback — it is intentional and functional.
- Do NOT widen `endMi` to capture the 5.51-mile photo — that image is NF2266 terrain, not 520.

**Fix 3: Site URL** — `astro.config.ts` line 5 has a placeholder with `// TODO` comment. If `hiawathasrevenge.com` is the live domain, only remove the comment. If domain differs, update the URL.

**Fix 4: Description authoring locations:**
- Primary: `src/components/RouteExplainer.astro` lines 18-25
- Mirror: `scripts/generate-sector-details.js` lines 26-69
- Regenerate after edits: `node scripts/generate-sector-details.js`
- Commit together: `public/data/sector-details.json` must be staged alongside the scripts

---

### Critical Pitfalls (from PITFALLS.md)

All findings from direct code inspection — confidence is HIGH.

**1. Description divergence between two hardcoded copies (CRITICAL)**
Same text in `RouteExplainer.astro` and `generate-sector-details.js`, no automated sync. Editing one without the other diverges the route-guide cards from the map sector panels. Panel divergence is only visible via map interaction — a standard page review will not catch it. Prevention: edit both files in the same task; side-by-side diff before committing.

**2. Forgetting to regenerate sector-details.json (CRITICAL)**
`generate-sector-details.js` is a script, not a build dependency. The Astro build does not trigger it. Stale panel descriptions are not detected until someone clicks a sector on the map. Prevention: after every edit to `generate-sector-details.js`, run `node scripts/generate-sector-details.js` and verify `public/data/sector-details.json` is dirty in git status.

**3. Photo boundary confusion — three independent mileage systems (MODERATE)**
SEGMENTS `startMi/endMi`, `annotations.json` GPS boundaries, and `photos-manifest.json` snapped values are not interchangeable. Moving a photo from 5.51 miles (NF2266's hero) to below 5.0 for the 520 fix would strip NF2266 of its hero and fall back to gradient. Prevention: only add new photos with `mile < 5.0`; never move existing photos across the 5.0 boundary.

**4. Surface field / description contradiction in panel (MODERATE)**
`generate-sector-details.js` has a separate `surface` field rendered as a panel meta label. A description rewrite that changes surface characterization without updating this field produces contradictory text on the same screen. Prevention: review `surface` field for each edited segment.

**5. Ecological over-specification (MINOR)**
LANDFIRE is a 30m raster; segment BpS attribution is geographic inference. Formal community type names or precise ecotone mile positions in descriptions imply accuracy the data cannot support. Prevention: write at the "observable to a rider at 10 mph" level.

---

## Implications for Roadmap

The milestone has two workstreams (infrastructure polish + editorial rewrite) sharing one risk zone (the description sync protocol). Suggested phase structure:

### Phase 1: Map Label Sizing
**Rationale:** Isolated 3-line CSS change with no dependencies on content work. Zero risk of triggering description-sync pitfalls. Ship first to reduce active bugs.
**Delivers:** Readable sector label pills on the map.
**Avoids:** None of the editorial pitfalls — fully isolated.
**Research flag:** Skip — exact lines and values specified in ARCHITECTURE.md.

### Phase 2: Site URL Update
**Rationale:** 1-line change in astro.config.ts. No dependencies on other work. Only external input needed: confirm the actual deployed domain.
**Delivers:** Correct canonical URL tags; removes TODO comment.
**Gap:** Confirm actual deployed URL before editing (see Gaps section).
**Research flag:** Skip — exact location specified.

### Phase 3: Description Rewrite (Core Deliverable)
**Rationale:** The substantive work of the milestone. Must be treated as an atomic unit — both `RouteExplainer.astro` and `generate-sector-details.js` edited in the same pass, pipeline script run immediately after, JSON artifact committed in the same changeset.
**Delivers:** All 7 descriptions rewritten to 35-55 words, surface-first structure, ecological grounding, "Surface:" labels removed.
**Avoids:** Pitfall 1 (description divergence) and Pitfall 2 (stale JSON) — both require atomic editing discipline.
**Research flag:** Skip — ecological data in ECOLOGY.md, format in FEATURES.md, pitfall prevention in PITFALLS.md.

### Phase 4: 520 Photo Fix
**Rationale:** Dependent on image availability (empirical check, not research). Independent of description rewrite; can run in parallel or after.
**Delivers:** Either a hero photo for the 520 segment card, or a documented decision to accept the gradient fallback.
**Avoids:** Pitfall 3 (photo boundary confusion) — add new entries only; do not move NF2266's existing photo.
**Research flag:** Skip — options fully specified with file locations.

### Phase Ordering Rationale

- Phases 1 and 2 are independent of each other and of the description work; run in any order or in parallel.
- Phase 3 must be atomic — splitting "edit RouteExplainer" from "edit generate-sector-details.js" across separate tasks is exactly the failure mode that produces diverged content.
- Phase 4 is fully independent; it touches photos.json and pipeline scripts only.
- The description-sync protocol (Pitfalls 1 and 2) applies exclusively to Phase 3.

### Research Flags

All phases use standard, fully-specified patterns — no additional research-phase passes needed:
- Phase 1: Exact CSS values and line numbers documented in ARCHITECTURE.md.
- Phase 2: Exact file and line documented; only external confirmation needed (deployed URL).
- Phase 3: Ecological data in ECOLOGY.md, format guidance in FEATURES.md, sync protocol in PITFALLS.md.
- Phase 4: Architecture options documented with exact file locations and risk boundaries.

---

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| Ecology (forest-wide BpS distribution) | HIGH | Official LANDFIRE data, multiple MNFI/MSU/USDA sources |
| Ecology (segment-specific attribution) | MEDIUM | Geographic inference from surface type and topography; not GIS-verified against route GPX |
| Description format (word count, structure) | HIGH | Cross-verified across bikepacking.com, SBT GRVL, ISGG, interpretive signage research |
| Tone guidance | HIGH | Established site voice; reference guides analyzed directly |
| Implementation locations (label, photo, URL) | HIGH | Direct code inspection, exact line numbers |
| Pitfall identification | HIGH | Direct code inspection; pipeline behavior analyzed |
| Lake Superior visibility from Ridge Rd | LOW | Claimed in current description; not confirmed by GPX elevation data |

**Overall confidence:** HIGH for implementation; MEDIUM for segment-specific ecological detail — appropriate for a showcase site description, not a scientific document.

### Gaps to Address

- **Actual deployed URL:** Confirm whether `hiawathasrevenge.com` is the live domain or a placeholder before updating `astro.config.ts`. Check Vercel/Netlify dashboard or DNS records.
- **520 segment image availability:** Audit `images/` directory for any photo taken on CR-520 or near Munising Falls (mile 0-5.0) before committing to Option B vs. Option D.
- **Ridge Rd Lake Superior visibility:** Current description claims visibility of Lake Superior from Ridge Rd. Verify against GPX elevation data before including in the rewrite. If unverifiable, drop the claim.
- **Plantation vs. natural forest on ND2225 / Doe Lake:** Red pine plantations exist in Hiawatha NF and differ from natural jack pine stands. LANDFIRE does not distinguish plantation from natural. If descriptions use red pine imagery, caveat appropriately or use only observable character ("tall red-barked pines" rather than implying natural origin).

---

## Sources

### HIGH Confidence — Official Data / Direct Code Inspection

- Randy Swaty, 2023 LANDFIRE-powered Hiawatha NF assessment: https://rswaty.github.io/hiawatha2023/
- Michigan Natural Features Inventory community descriptions: https://mnfi.anr.msu.edu/
- MSU Extension, Forest Types of Michigan: https://www.canr.msu.edu/resources/
- USDA Forest Service, Black Spruce Silvics: https://research.fs.usda.gov/silvics/black-spruce
- NatureServe Explorer, Laurentian-Acadian Alkaline Conifer-Hardwood Swamp: https://explorer.natureserve.org/
- Industry Standard Guide to Gravel (ISGG): https://theunpavedhub.com/resources/industry-standard-guide-to-gravel/
- Direct code inspection: `src/components/RouteExplainer.astro`, `src/components/RouteMap.astro`, `scripts/generate-sector-details.js`, `scripts/match-photos.js`, `astro.config.ts`, `public/data/sector-details.json`, `public/data/photos.json`, `public/data/annotations.json`

### MEDIUM Confidence — Multiple Sources Agree

- Bikepacking.com Eastern Divide Trail (segment description length/format): https://bikepacking.com/routes/edt1/
- SBT GRVL course descriptions (surface-first format): https://www.sbtgrvl.com/2025courses
- Michigan Off-Road Expedition (M.O.R.E.) documentation (UP terrain vocabulary): https://bikepacking.com/routes/more/
- Hiawatha NF general vegetation description: multiple USFS / tourism sources agree
- Adventure Cycling Association surface types: https://www.adventurecycling.org/guided-tours/surface-types/

### LOW Confidence — Requires Verification

- Lake Superior visibility from Ridge Rd: claimed in current site description; not confirmed against elevation/topography data
- Plantation vs. natural forest distribution along ND2225 and Doe Lake: LANDFIRE does not distinguish

---

*Research completed: 2026-04-06*
*Ready for roadmap: yes*
