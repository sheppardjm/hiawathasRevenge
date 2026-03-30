# Feature Research

**Domain:** Single-route cycling showcase / charity ride marketing site
**Researched:** 2026-03-30
**Confidence:** MEDIUM-HIGH — strong pattern coverage from multiple real-world examples (bikepacking.com, UNBOUND Gravel, Adventure Cycling Golden Gravel Trail, Gravel Worlds), confirmed against PROJECT.md requirements

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features cyclists and donors expect on a route showcase site. Missing these makes the site feel incomplete or untrusted.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Interactive route map | Every serious route showcase has a map — it's the first thing visitors look for | MEDIUM | Leaflet confirmed in PROJECT.md; use tile style matching forest/park theme (Stadia Stamen Terrain or similar — not dark-matter tiles) |
| Elevation profile | Riders need to understand the climbing before committing | MEDIUM | Chart.js; bikepacking.com, UNBOUND, and Golden Gravel Trail all feature elevation data prominently |
| Route stats block | Distance, elevation gain, surface type breakdown | LOW | Static callout: 100 miles, total climbing, % gravel. Seen on every reference site |
| GPX download | Riders expect to load the route onto their Garmin/Wahoo before committing | LOW | Direct file download; confirmed pattern across Gravel Worlds (Ride with GPS), UNBOUND, Golden Gravel Trail |
| Photo gallery | Visual evidence of the landscape — without it the site cannot inspire | MEDIUM | PhotoSwipe lightbox; 40+ images standard on bikepacking.com route pages |
| Donate / support CTA | Riders need a clear path to contribute to MBTN | LOW | Single prominent button linking to mbtn.org/donate; confirmed as primary site purpose |
| Responsive design | Riders research on phones while on the go | MEDIUM | Mobile-first; touch-friendly controls (52px minimum) |
| Route narrative / context | Riders want to understand what makes this route special before clicking away | LOW | Intro text covering Hiawatha National Forest history and Ojibwe context |
| Restock / aid point markers | Critical safety info for a remote 100-mile route; riders WILL ask before attempting | LOW | Map markers with labels; seen on UNBOUND checkpoints page and bikepacking.com resupply notes |

### Differentiators (Competitive Advantage)

Features that set this site apart from a basic event listing or a generic route page. These justify the site's existence as a standalone showcase rather than a page on mbtn.org.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Map + elevation hover sync | Hovering the elevation chart moves a crosshair on the map — makes the route feel explorable, not just readable | HIGH | Confirmed in PROJECT.md; seen as the signature mkUltra pattern; no other sampled site does this at this fidelity |
| Geotagged photo markers on map | Photos appear as map pins at their mileage location — riders "ride the route" visually before they ride it physically | HIGH | Depends on photo manifest pipeline; no reference site does this as natively as described |
| Gravel sector overlays (map + chart) | Color-coded difficulty bands on both the map and elevation profile help riders understand where the hardest sections are | HIGH | Unique to this implementation; UNBOUND shows checkpoints but not surface difficulty gradations |
| Photo manifest admin UI | Easy in-browser mileage assignment for photos without EXIF data — makes the whole feature maintainable | MEDIUM | Internal tool; not user-facing but enables the photo marker differentiator |
| National Park badge visual identity | The Forest Service / NPS aesthetic creates instant credibility and emotional resonance with the wilderness setting | MEDIUM | Design, not code; CSS-only badge typography; rare in cycling sites which default to sport/race aesthetics |
| Historical / cultural intro text | Covering the Hiawatha poem, the Ojibwe legends, and how the forest came to bear this name gives the site depth and meaning beyond "go ride here" | LOW | Writing task, not engineering; differentiates from event-only sites |
| Curated wilderness photography | ~50 route-specific photos showing actual trail conditions and scenery — not stock cycling photos | LOW | Asset curation, not engineering; bikepacking.com's photo galleries are consistently cited as what makes routes compelling |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like natural additions but are explicitly out of scope or actively harmful for this site's purpose.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Race registration / BikeReg integration | Many gravel events have "register now" buttons | This is a ride, not a race — registration implies competitive timing, entry fees, cutoffs. Contradicts the charity/community purpose | Donate to MBTN CTA replaces the "register" action |
| Countdown timer | Standard on race sites | Implies a specific race date that doesn't exist; makes the site feel stale when the date passes | Remove entirely; the ride is anytime, not a specific date |
| KOM / segment timing | Strava culture means cyclists often expect segment data | Introduces competitive framing that undercuts the "come enjoy the wilderness" message | Elevation profile shows the challenge without gamifying it |
| User accounts / login | "Let riders save their progress" | Authentication adds server complexity, maintenance burden, and is completely unnecessary for a static showcase | No accounts; static site |
| Strava / Komoot embed | "Show who's ridden it" | Pulls in third-party styles and scripts; Strava embed is increasingly paywalled; adds dependency on external API | Curated photo gallery conveys community better than activity feeds |
| Real-time features | "Show live riders on the map" | Requires backend infrastructure; no race/event exists to drive live data; adds ongoing hosting cost | Static showcase; photos represent the community |
| Course certification / officials info | Common on race sites | Not a certified race; adding this content implies formal race structure | Leave out entirely |
| Multiple distance options | Many gravel events offer 25/50/100 options | One iconic 100-mile route is the identity; fragmentation dilutes the narrative | Single route, clearly presented |
| Comments / social wall | "Community engagement" | Adds moderation burden, spam risk, and backend requirement for a static site | Link to MBTN's Facebook for community discussion |

---

## Feature Dependencies

```
[GPX file]
    └──parsed-by──> [Build pipeline (gpxparser)]
                        └──produces──> [Route GeoJSON + elevation data JSON]
                                           ├──consumed-by──> [Interactive Leaflet map]
                                           └──consumed-by──> [Chart.js elevation profile]
                                                                 └──synced-with──> [Map crosshair hover]

[Photo manifest UI]
    └──produces──> [Photo manifest JSON (photo → mileage)]
                        └──combined-with──> [Route elevation data JSON]
                                                └──produces──> [Geotagged photo markers on map]

[Photo manifest JSON]
    └──consumed-by──> [Build pipeline (sharp)]
                            └──produces──> [WebP thumbnails]
                                               └──consumed-by──> [Photo gallery (PhotoSwipe)]

[Gravel sector data]
    └──hand-authored──> [Sector JSON (start mile, end mile, difficulty)]
                            ├──overlaid-on──> [Leaflet map]
                            └──overlaid-on──> [Chart.js elevation profile]

[Restock point data]
    └──hand-authored──> [Markers JSON (name, mileage, lat/lng)]
                            └──displayed-on──> [Leaflet map]
```

### Dependency Notes

- **Interactive map requires route GeoJSON:** GPX must be parsed at build time before the map can render. The build pipeline (gpxparser) is a foundational dependency for all map/chart features.
- **Photo markers require photo manifest:** Until mileage is assigned via the admin UI, photo markers cannot appear on the map. The manifest UI unblocks this differentiator.
- **Elevation hover sync requires both map and chart:** Map crosshair and Chart.js must be initialized and share a common data model. Implement after both are individually working.
- **Gravel sector overlays require sectors JSON:** Hand-authored data file. Low complexity once map and chart are working, but requires domain knowledge of the route (knowing where the rough sections are).
- **Restock points are map-only:** No dependency on elevation data. Can be added any time after the base map works.

---

## MVP Definition

### Launch With (v1)

Minimum needed to fulfill the site's core value: inspire riders and drive MBTN donations.

- [ ] Interactive Leaflet map showing the 100-mile GPX route — without this the site has no center of gravity
- [ ] Elevation profile (Chart.js) with route stats block (distance, gain, % gravel) — riders need the challenge picture
- [ ] Photo gallery (PhotoSwipe) with curated images — visual inspiration is the conversion mechanism for donations
- [ ] Donate to MBTN CTA — the explicit purpose of the site
- [ ] Restock point markers on map — safety-critical for a 100-mile remote wilderness route
- [ ] Route narrative text (Hiawatha history + Ojibwe context + MBTN mission) — gives the site meaning
- [ ] National Park badge visual identity — the design is part of the pitch, not decoration
- [ ] Responsive layout (mobile + desktop) — riders will check this on their phones
- [ ] GPX download — removes friction for riders who want to load it on their device

### Add After Validation (v1.x)

Features that enhance the experience once core is confirmed working.

- [ ] Photo manifest admin UI — enables geotagged photo markers; add once photo gallery is live and the mileage assignment workflow is understood
- [ ] Geotagged photo markers on map — depends on manifest UI being built and populated
- [ ] Map + elevation hover sync (crosshair) — requires both map and chart working stably; signature differentiator worth adding in v1.x
- [ ] Gravel sector overlays — requires route knowledge and sector JSON authoring; can be done in a single session once base map is stable

### Future Consideration (v2+)

Features to defer — either low ROI or require significant new infrastructure.

- [ ] Printable route card / PDF export — nice for riders planning offline; low priority relative to core mission
- [ ] Dark/light mode toggle — design is forest-themed and intentional; adding a mode toggle dilutes the aesthetic intent
- [ ] Ride report / blog section — content maintenance burden; keep MBTN's site as the home for community content

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Interactive Leaflet map | HIGH | MEDIUM | P1 |
| Elevation profile (Chart.js) | HIGH | MEDIUM | P1 |
| Donate CTA | HIGH | LOW | P1 |
| Photo gallery (PhotoSwipe) | HIGH | MEDIUM | P1 |
| Route stats block | HIGH | LOW | P1 |
| GPX download | HIGH | LOW | P1 |
| Restock point markers | HIGH | LOW | P1 |
| Route narrative text | HIGH | LOW | P1 |
| National Park badge identity | HIGH | MEDIUM | P1 |
| Responsive design | HIGH | MEDIUM | P1 |
| Map + elevation hover sync | HIGH | HIGH | P2 |
| Gravel sector overlays | MEDIUM | MEDIUM | P2 |
| Photo manifest admin UI | MEDIUM | MEDIUM | P2 |
| Geotagged photo markers | HIGH | HIGH | P2 |
| Printable route card / PDF | LOW | MEDIUM | P3 |
| Ride report / blog | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

Research examined: bikepacking.com route pages, UNBOUND Gravel routes, Adventure Cycling Golden Gravel Trail, Gravel Worlds, Munising Bay Trail Network (mbtn.org).

| Feature | bikepacking.com | UNBOUND Gravel | Golden Gravel Trail | Our Approach |
|---------|----------------|----------------|---------------------|--------------|
| Interactive map | Embedded (Ride with GPS) | Off-site via Garmin / RWGPS links | Tab-based static map images | Leaflet native, fully integrated |
| Elevation profile | Shown on route pages | Listed as stats, no chart | Detailed stats table per section | Chart.js with hover sync |
| Photo gallery | 40+ photos, grid + lightbox | Hero image only | None visible | PhotoSwipe with 50 curated images |
| GPX download | Yes | Via RWGPS / Garmin | Yes, free download | Direct file download |
| Restock / aid points | Text notes + map markers | Checkpoint list with cutoffs | Text narrative with town names | Map markers with labels |
| Donate / fundraise CTA | None (commercial site) | None (entry fees) | None (free route) | Prominent donate button to mbtn.org |
| Surface breakdown | Route stats block | N/A (race focus) | Terrain section with % data | Stats block + gravel sector color overlays |
| Visual identity | Monochrome editorial | Race-branded black/white | Adventure Cycling brand | NPS / Forest Service: deep green, amber, parchment |
| Map + elevation sync | No | No | No | Yes (crosshair hover) — unique |
| Photo-to-map pinning | No | No | No | Yes (via photo manifest pipeline) — unique |

The two features no reference site offers — elevation-map hover sync and geotagged photo markers — are the signature differentiators that justify building a standalone site instead of submitting a route to bikepacking.com.

---

## Sources

- [bikepacking.com/routes/croatan-gravel-vanish/](https://bikepacking.com/routes/croatan-gravel-vanish/) — detailed route page feature audit (MEDIUM confidence, WebFetch)
- [adventurecycling.org — Golden Gravel Trail](https://www.adventurecycling.org/routes-and-maps/adventure-cycling-route-network/golden-gravel-trail/) — route showcase feature audit (MEDIUM confidence, WebFetch)
- [gravelworlds.com/routes](https://www.gravelworlds.com/routes) — event route page feature audit (MEDIUM confidence, WebFetch)
- [unboundgravel.com/routes/](https://www.unboundgravel.com/routes/) — gravel event route feature audit (MEDIUM confidence, WebFetch)
- [mbtn.org](https://www.mbtn.org/) — beneficiary site audit; confirmed donate page at /donate (MEDIUM confidence, WebFetch)
- PROJECT.md — confirmed features, constraints, out-of-scope list (HIGH confidence, direct read)
- WebSearch: "gravel cycling event website best design interactive map elevation GPX download 2025" — ecosystem survey (LOW confidence, unverified, used for pattern triangulation only)
- WebSearch: "MBTN Michigan Bear Trap North trail network" — confirmed MBTN identity and donate URL (MEDIUM confidence, multiple results agree)

---
*Feature research for: Hiawatha's Revenge cycling route showcase*
*Researched: 2026-03-30*
