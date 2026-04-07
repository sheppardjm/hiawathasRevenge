# Phase 39: Segment Description Rewrite - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Rewrite all 7 segment descriptions to 35-55 words with a fixed three-clause structure (surface, ecology, terrain/experience). Eliminate "Surface:" label pattern. Sync text across RouteExplainer.astro and sector-details.json. No new segments or structural changes.

</domain>

<decisions>
## Implementation Decisions

### Writing voice & tone
- Observational naturalist voice — precise but evocative, not clipped trail-guide or literary nature writing
- Impersonal/descriptive — no second-person "you", describe the trail itself
- Fixed clause order: surface first → ecology → terrain/riding experience
- Word choice: factual and precise, no strong constraints on specific words — Claude's judgment on avoiding cliches

### Ecology specificity
- Common species names only — no Latin, no generic groups like "hardwoods"
- Species count per segment: Claude's discretion — name as many as needed to make each segment ecologically distinct
- Structure: surface → ecology → terrain as the three fixed clauses
- Primary ecological source: land management plan PDF in documents folder + LANDFIRE data for accuracy
- Simplify for prose — use real data to get species right, but don't reference zone classifications in the text

### Surface characterization
- Surface woven into first clause as a texture word, not a category label — "Packed gravel threads through..." not "Surface: packed gravel"
- Dominant surface only — don't enumerate mixed surfaces or short transitional patches
- Cycling-specific terminology — "doubletrack", "singletrack", "fire road" (audience is gravel riders)
- The `surface` field in generate-sector-details.js stays as a short label (e.g., "Packed gravel") — does not need to match prose word-for-word, just be consistent in characterization

### Segment distinctiveness
- No single formula — use whatever makes each segment most distinct (understory, terrain, unique features)
- Third clause includes riding character — "fast and open", "rooty and technical", etc.
- Landscape only in prose — no road names, mile markers, or landmarks (that info is in segment headers)

### Claude's Discretion
- Exact species count per segment
- Which differentiating features to emphasize per segment
- Word choice and phrasing within the voice guidelines
- How to handle segments that share similar canopy types

</decisions>

<specifics>
## Specific Ideas

- Land management plan PDF in documents folder is available as a primary reference for ecological accuracy
- Descriptions should read like a naturalist's field notes — grounded in observable species, not generic nature-copy

</specifics>

<deferred>
## Deferred Ideas

- Add "Little Indian" as a new segment — this is a new capability, needs its own phase or roadmap addition

</deferred>

---

*Phase: 39-segment-description-rewrite*
*Context gathered: 2026-04-07*
