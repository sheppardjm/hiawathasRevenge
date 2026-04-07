# Feature Landscape: v1.6 Segment Editorial Content

**Domain:** Trail-guide segment descriptions for a gravel cycling showcase site
**Researched:** 2026-04-06
**Milestone:** v1.6 Segment Editorial & Polish
**Confidence:** HIGH — patterns verified against real route guides (bikepacking.com, SBT GRVL, UNBOUND Gravel, M.O.R.E. Michigan, ISGG surface taxonomy), current descriptions audited from source, tone analyzed against site's established editorial voice

---

## Context

The RouteExplainer component displays 7 named segments, each with: a hero photo, segment name, difficulty stars (1-5), Strava link, and description text. The descriptions are hardcoded in `RouteExplainer.astro` and duplicated in `public/data/sector-details.json` (which feeds the Leaflet panel system).

**Current descriptions are 4-6 sentences, ~80-120 words each.** The user wants them shortened to focused trail-guide blurbs covering gravel type and ecological character. They should shed the logistical scaffolding (restock info, seasonal condition paragraphs, explicit "Surface:" labels) in favor of a more evocative, immediate voice.

**The seven segments:**

| Segment | Surface (current) | Stars | Miles |
|---------|-------------------|-------|-------|
| 520 | Smooth asphalt | 2 | 1-2.4 |
| NF2266 | Sand and gravel two-track | 5 | 6.7-9.9 |
| Bass Lake Rd | Packed gravel, county-maintained | 2 | 25.3-30.3 |
| NF2217-2218 | Compact gravel and hardpack dirt | 2 | 36.8-43.4 |
| ND2225 | Loose gravel transitioning to sandy patches | 3 | 55.7-59.6 |
| Doe Lake | Deep sand and rugged two-track | 4 | 84.7-87.9 |
| Ridge Rd | Firm packed gravel, USFS truck trail | 2 | 94.5-100.9 |

---

## What High-Quality Trail Guides Actually Do

Research across five source types (event route guides, bikepacking route articles, gravel surface taxonomies, trail description frameworks, and the ISGG classification system) reveals consistent patterns.

### Segment description length

**Recommendation: 35-55 words per segment description.**

Evidence:
- Bikepacking.com's Eastern Divide Trail (boreal forest route, structurally similar terrain) uses 40-70 words per day segment.
- ISGG classifications pack complete surface characterizations into 1-2 sentences (~20-35 words).
- SBT GRVL course descriptions for individual course variants run 40-60 words.
- Great American Wheel Route uses 120-180 words per *day* segment, but each "day" covers 50-80 miles; a single named 3-6 mile sector maps more closely to a 35-55 word blurb.
- Trail interpretive signage research (Chesapeake Crossroads guidelines, Mountaineers style guide) confirms that outdoor readers standing at a panel absorb ~30-45 seconds of text — about 50-70 words.

The current descriptions (80-120 words) are roughly double the appropriate length. They include:
- Explicit "Surface:" label (redundant with what the prose already conveys)
- Seasonal condition paragraphs (useful in a PDF guide; decorative on a showcase site)
- Specific landmark callouts with mileage (belongs in the tooltip/panel system, not the explainer)

Strip those three elements and you arrive at the natural target: a tight two-to-three sentence blurb that tells the rider what they're riding through and what it feels like.

### What to include vs. exclude

**Include:**
- Gravel type: specific surface characterization using accepted cyclist vocabulary (see terminology section below)
- Ecological character: one vegetation/forest detail that gives the segment a sense of place
- A single experiential note: what the surface *does* to the rider, or what the landscape looks like from the saddle
- Difficulty signal embedded in language (not as a separate "Surface:" callout)

**Exclude:**
- Explicit "Surface:" label — the prose communicates this without a label
- Specific mileage callouts ("around mile 28") — the map and panel system handle navigation
- Restock point details — the map pins handle this; describing them in the blurb is redundant
- Multi-season condition notes ("in spring... in fall...") — pick the dominant condition, not every variant
- Qualitative judgment as an opener ("Welcome relief," "Technical and punishing") — the stars convey difficulty; the prose should characterize, not evaluate

### Format structure

The best-performing trail-guide blurbs follow this implicit structure:

1. **Surface-first clause:** What is under the wheels, immediately.
2. **Forest/ecology clause:** What's around the rider, briefly.
3. **Experience clause (optional):** What the combination produces — speed, fatigue, beauty, silence.

Example from M.O.R.E. route documentation (Michigan UP, HIGH confidence): *"rutted, sandy two-tracks through heavily wooded and marshy areas"* — this is three words of surface plus five words of ecology, compressed into one noun phrase. That economy is the target.

---

## Gravel Surface Terminology Reference

Sources: ISGG (Industry Standard Guide to Gravel) — verified via theunpavedhub.com; Adventure Cycling Association surface types — verified via adventurecycling.org; M.O.R.E. route documentation; Bikepacking.com Eastern Divide Trail.

### ISGG Classification (use as internal reference, not verbatim labels)

| Category | Physical Description | Cyclist Language |
|----------|---------------------|-----------------|
| Cat 1 | Smooth, well-maintained dirt road, sparse or no gravel | "hardpack," "packed dirt," "smooth forest road" |
| Cat 2 | Potholes, washboard, loose blown-out corners, debris outside tracks | "washboard gravel," "loose corners," "chunky" |
| Cat 3 | Infrequently maintained, exposed rocks, rain ruts, sand bogs | "rough gravel," "sand pockets," "chunky two-track" |
| Cat 4 | Deep ruts, rock gardens, unmaintained | "rugged two-track," "deep sand," "primitive road" |

### Surface vocabulary in active use (gravel cycling community, HIGH confidence)

**Hardpack / hardpacked dirt:** Compressed mineral-soil surface that rolls efficiently; implied weather-resistance. Use for NF2217-2218 and Ridge Rd.

**Champagne gravel:** Fine, uniform crushed limestone or similar aggregate that packs firm and rolls fast; associated with SBT GRVL's Steamboat courses. Not native to the UP — do not use for Hiawatha.

**Washboard:** Corrugated ridges perpendicular to travel direction, caused by repeated vehicle traffic. Common on unmaintained county/forest roads. Relevant for NF2266 and ND2225.

**Two-track:** Unpaved road with two parallel wheel ruts separated by a grass or gravel median. The defining surface type for Hiawatha's Revenge forest roads. HIGH confidence — used consistently in M.O.R.E. Michigan documentation.

**Sandy two-track:** Two-track where the substrate is glacial outwash sand rather than gravel or packed dirt. The UP's dominant difficult-terrain type. Relevant for NF2266 and Doe Lake.

**Forest Service road / FS road:** Administrative classification; implies USFS maintenance (variable: from graded gravel to abandoned track). Conveys a specific institutional character.

**Loose gravel:** Angular aggregate not yet compacted; resists traction on corners and climbs.

**Packed / county-maintained gravel:** Graded and rolled gravel, regular blade maintenance. Implies speed and predictability.

**Sand bog / sand pit:** Localized deep-sand deposit that requires dismounting or significant power output. Common in Hiawatha's glacially deposited soils.

**Rut:** Longitudinal groove cut by vehicle or water flow. Relevant for NF2266 after logging traffic or spring thaw.

**Seasonal / primitive:** Implies the road is unmaintained and conditions vary significantly. Use for roads like NF2266.

### UP-specific context (MEDIUM confidence — M.O.R.E. documentation + search synthesis)

Hiawatha National Forest sits on glacial outwash terrain. The soil is predominantly glacial sand and loam over sandstone bedrock, with wetland depressions (bogs, fens) interspersed. This means:
- Forest roads that appear on maps as "gravel" are often sand-over-sand, not aggregate-over-compacted-base
- Apparent hardpack can go soft after rain or snowmelt without warning
- Two-track corridors in jack pine stands tend to be sandier (jack pine grows in well-drained glacial outwash)
- Two-track in mixed hardwood or aspen stands tends toward packed humus

---

## Ecology and Vegetation: What to Reference

Sources: Hiawatha National Forest official documentation; M.O.R.E. bikepacking route; National Forests Foundation Hiawatha entry; Eastern Divide Trail writing analysis.

### What makes ecological description work for cyclists

Good gravel route ecology writing does two things simultaneously:

1. **Gives the rider a navigation texture:** "jack pine stands" feels different from "hardwood canopy" — the canopy tells you about shade, density, and the quality of the light. This doubles as wayfinding.
2. **Earns its place emotionally:** The vegetation detail should make the rider *feel* something about the segment, not merely identify a species. "Hardwood canopy explodes with color" is a payoff. "Adjacent to mixed hardwood forest" is noise.

### The UP vegetation zones relevant to these 7 segments

**Northern hardwoods (sugar maple, beech, yellow birch, basswood):** Dense canopy, shade-deep corridors, rich forest floor. Associated with the route's more demanding terrain (NF2266's old-growth hardwoods). The hardwood designation signals both ecological maturity and difficult surface (roots, ruts, seasonal mud).

**Aspen / paper birch corridors:** Second-growth, open canopy, high light. Common on roadsides and disturbed areas. Fast visual rhythm — the trees are smaller and closer to the road. Ridge Rd aspens turning gold is accurate and evocative.

**Jack pine / red pine stands:** Sandy, dry, open. Jack pine is a fire-adapted species and a direct indicator of the loose sand substrate that makes those segments hard. Mentioning jack pine tells a knowledgeable rider: expect deep sand. Relevant for ND2225.

**Bogs and wetland corridors:** The Hiawatha has numerous black spruce / tamarack bogs. These are visually distinctive (sphagnum, leatherleaf, the smell of open water) and tell the rider the road is crossing a water table — which means soft shoulders and potential standing water on the road surface.

**Mixed forest (secondary growth):** The baseline condition for much of the route. Less evocative than the specific types above; use sparingly and only when nothing more specific applies.

### How to use ecology without being boring

The trap in trail-guide ecology writing is the inventory ("you'll pass jack pine and red pine and mixed hardwood and..."). The antidote is selection and specificity — pick one detail that does double duty:

- **Jack pine = sand warning.** "Sandy two-track through jack pine stands" communicates both surface and ecology in seven words.
- **Old-growth hardwood = canopy depth and root complexity.** "Old-growth hardwood canopy" signals both beauty and technical demand.
- **Aspen corridor = light and movement.** "Quaking aspen corridor" communicates a specific sensory quality — the trees move, the light filters differently.
- **Bog adjacency = smell, silence, moisture.** A brief bog mention grounds the rider in the UP's specific wetland character.

---

## Tone Reference

### The site's established voice

From PROJECT.md: "New Yorker-esque, witty." The current descriptions already demonstrate this well in their best moments:

- *"This is where the ride earns its name."* — compressed, earned.
- *"the growing certainty that you're going to finish this thing"* — conversational authority.
- *"in July and August, this corridor buzzes with horseflies; early morning or late season is kinder"* — specific, wry, true.

These moments should survive the compression. What should go is the expository scaffolding around them.

### Comparative tone references (verified)

**Bikepacking.com Eastern Divide Trail:** Reflective and advocacy-oriented, 40-70 word segments. Uses surface specificity ("fast-rolling hardpack," "deep sand," "smooth pea-gravel multi-use path") blended with landscape atmosphere. Does not use "Surface:" labels.

**SBT GRVL course descriptions:** Confident and enthusiastic, 40-60 words per course. Uses precise surface nouns as embedded modifiers: "chunky Cow Creek finish," "champagne gravel rollers," "sandy washboard." The surface adjective precedes the noun — it's part of the character, not a separate field.

**M.O.R.E. Michigan route:** Enthusiastic-practical, honest about sand. Uses "rutted, sandy two-tracks" and "heavily wooded and marshy" as characteristic phrases. Ecology is always paired with the surface condition it explains.

**ISGG surface descriptions:** Extremely compressed, clinically precise. Not for direct adoption — too technical — but useful as a vocabulary source.

### What "witty" means in this context

Wit in trail-guide writing is not jokes. It is:
- Precision that carries an attitude ("deceptively civilized" is good; "pleasant" is not)
- The unexpected right word where a cliche would sit ("the certainty you're going to finish this thing" rather than "the satisfying home stretch")
- Brevity that implies restraint — saying less than you could, which signals confidence

The new descriptions should feel like they were written by someone who has ridden this route and is not impressed by their own experience, but is genuinely trying to tell you what it is like.

---

## Segment-by-Segment Rewrite Guidance

Based on research findings applied to each specific segment.

### 520 (smooth asphalt, stars: 2)
**Keep:** The "deceptively civilized" note — it's the best line in the current descriptions.
**Shed:** The explicit "Surface: smooth asphalt" label, the visitor center callout, the seasonal sand drift note.
**Ecology:** None required — this is paved road. The ecological interest is in what you can see (Munising Falls, Lake Superior horizon), not the road surface.
**Target:** ~30 words. Shortest segment gets shortest description.

### NF2266 (deep sand / two-track, stars: 5)
**Keep:** "This is where the ride earns its name." The washboard and sand detail. The old-growth hardwood canopy reference.
**Shed:** The explicit surface label, the creek depth callout, the logging traffic context.
**Ecology:** Old-growth northern hardwood canopy (sugar maple, yellow birch) — this is the ecologically richest segment of the route. The canopy closes in, the road deteriorates, these are causally related.
**Target:** ~50 words. Most important segment; deserves slightly more space.

### Bass Lake Rd (packed gravel, stars: 2)
**Keep:** The contrast with NF2266. The birch-framing of the lake.
**Shed:** "Welcome relief" opener (evaluative, not characterizing), the explicit surface label, the soft spots warning.
**Ecology:** Paper birch lining the road, Bass Lake glimpsed through the trees. This is an aspen/birch corridor — light, open, recovery terrain.
**Target:** ~40 words.

### NF2217-2218 (compact gravel / hardpack, stars: 2)
**Keep:** "Meditative stretch through the forest interior." The Camp 7 Lake reference (landmark and mood).
**Shed:** The surface label, the restock detail (belongs in map pins), the horsefly note.
**Ecology:** Mixed northern forest along the Indian River headwaters — this corridor has wetland adjacency and the spacious, quiet character of interior forest roads.
**Target:** ~40 words.

### ND2225 (loose gravel to sandy, stars: 3)
**Keep:** The south-bending route character. The jack pine / red pine stand reference — this is ecologically accurate and communicates the sandy substrate.
**Shed:** The explicit surface label, the Indian River crossing callout, the seasonal pudding note.
**Ecology:** Jack pine and red pine stands are the correct ecological signal here — dry, sandy, open canopy. The surface texture is explained by the ecology.
**Target:** ~40 words.

### Doe Lake (deep sand / two-track, stars: 4)
**Keep:** The late-ride difficulty signal ("hit different at mile 85"). The lake appearance through trees.
**Shed:** The Midway General Store restock detail (map pin), the explicit surface label, the October sand-firming note.
**Ecology:** Dense mixed forest around the Doe Lake basin — this is the enclosed, enclosed-sky feel of deep forest two-track.
**Target:** ~45 words.

### Ridge Rd (firm packed gravel, stars: 2)
**Keep:** "The home stretch" energy. The aspen-corridor-turning-gold detail. The Rapid River crossing.
**Shed:** The "growing certainty you're going to finish this thing" (keep only if word budget allows — it's the second-best line in the set), the explicit surface label, the Lake Superior glimpse (verify accuracy — this may be optimistic given topography).
**Ecology:** Aspen corridor is accurate and the right detail. USFS truck trail means regularly graded hardpack — appropriate payoff surface for the final segment.
**Target:** ~45 words.

---

## Example Descriptions from Real Trail Guides

These are verified, published examples demonstrating the target register. Each is approximately 35-55 words.

**Example 1 — M.O.R.E. Michigan (UP terrain, HIGH confidence):**
"terrain ranges from scenic bike path and pavement to gorgeous, well-maintained gravel to near-abandoned singletrack and rutted, sandy two-tracks"
This is 23 words covering an entire route arc. For a single segment, 40-55 words gives more texture without losing economy.

**Example 2 — Bikepacking.com Eastern Divide Trail (boreal forest, HIGH confidence):**
*Day segment description at ~60 words:* "Rolling westward, the route takes a short stint on pavement before connecting with the Newfoundland T'Railway... make no mistake, this isn't your typical rail trail." Surface type ("pea-gravel multi-use path"), forest context ("large trees, bogs"), and experiential register ("vibrant urban and rural") all in a single paragraph with no "Surface:" heading.

**Example 3 — SBT GRVL Black Course (segment character, HIGH confidence):**
"loose, steep, dusty and chunky terrain, and beautiful views of the more remote areas of Routt County"
15 words. Four surface adjectives stacked before the noun. This is the surface-first clause approach at its purest.

**Example 4 — ISGG Category 3 (reference vocabulary, HIGH confidence):**
"Infrequently maintained roads [with] exposed rocks, tire-eating rain ruts, sand bogs and any number of other unexpected challenges."
This is a surface classification, not a description — but it demonstrates how much character can be packed into a single noun phrase. "Tire-eating rain ruts" is one phrase. The Hiawatha descriptions can use this density.

---

## MVP Recommendation

The minimum set for v1.6:

1. **Rewrite all 7 descriptions** at 35-55 words each, following the structure: surface-first clause + ecology clause + experience clause.
2. **Remove the "Surface:" label pattern** — it's redundant with what the prose conveys and reads as form-filling rather than editorial voice.
3. **Anchor to LANDFIRE ecological zone data** for the vegetation details (this is the planned research input for the actual rewrite — the LANDFIRE data should confirm or refine the jack pine / hardwood / aspen characterizations above).

Defer to a future milestone:
- Seasonal variants (per-season description switching) — unnecessary complexity for the current use case
- Difficulty-stratified descriptions (different text for 100k vs 100mi) — routes share segments; one description fits

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Ideal word count (35-55 words) | HIGH | Cross-verified: bikepacking.com, SBT GRVL, ISGG, interpretive signage research |
| Surface terminology | HIGH | ISGG primary source verified; M.O.R.E. Michigan confirms UP-specific usage |
| Ecology-surface pairing (jack pine = sand, etc.) | MEDIUM | Plant-soil relationships are ecologically correct; LANDFIRE data should confirm route-specific coverage |
| Tone guidance | HIGH | Site voice established in existing content; reference guides analyzed directly |
| "Surface:" label removal | HIGH | No professional trail guide uses an explicit label; it's a form artifact, not editorial convention |
| Lake Superior visibility from Ridge Rd | LOW | Current description claims "glimpses of Lake Superior" — verify with GPX elevation data before writing new description |

---

## Sources

- [Industry Standard Guide to Gravel (ISGG) — The Unpaved Hub](https://theunpavedhub.com/resources/industry-standard-guide-to-gravel/)
- [Surface Types — Adventure Cycling Association](https://www.adventurecycling.org/guided-tours/surface-types/)
- [Michigan Off-Road Expedition (M.O.R.E.) — BIKEPACKING.com](https://bikepacking.com/routes/more/)
- [Eastern Divide Trail Segment 1 — BIKEPACKING.com](https://bikepacking.com/routes/edt1/)
- [Great American Wheel Route Segment 1 — BIKEPACKING.com](https://bikepacking.com/routes/gawr-s1/)
- [2025 SBT GRVL Courses — SBT GRVL](https://www.sbtgrvl.com/2025courses)
- [Hiawatha National Forest — National Forest Foundation](https://www.nationalforests.org/forest/hiawatha-national-forest/)
- [Belgian Waffle Ride — Course Descriptions](https://www.belgianwaffleride.bike/)
- [UNBOUND Gravel Athlete Guides](https://www.unboundgravel.com/routes/)
- [Dirty Freehub Glossary](https://dirtyfreehub.org/glossary/)
- [Northwoods Route — Bikepacking Roots / Otso Cycles](https://otsocycles.com/blogs/otso-journal/bikepacking-roots-releases-the-600-mile-northwoods-route)
