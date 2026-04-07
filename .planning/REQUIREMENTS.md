# Requirements: Hiawatha's Revenge

**Defined:** 2026-04-07
**Core Value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.

## v1.6 Requirements

Requirements for segment editorial rewrite and polish. Each maps to roadmap phases.

### Segment Descriptions

- [ ] **DESC-01**: All 7 segment descriptions rewritten to 35-55 words with surface-first + ecology + experience structure
- [ ] **DESC-02**: Descriptions grounded in LANDFIRE ecological zone data (specific tree species, understory, substrate type)
- [ ] **DESC-03**: Descriptions synced across RouteExplainer.astro, generate-sector-details.js, and regenerated sector-details.json

### Map Labels

- [ ] **LABEL-01**: Sector pill labels enlarged (font-size, padding) to fit full segment names at zoom ≥ 12

### Photos

- [ ] **PHOTO-01**: 520 segment has a hero photo in the RouteExplainer (either reassigned or sourced)

### Deployment

- [ ] **DEPLOY-01**: astro.config.ts site URL set to `https://hiawathasrevenge.com` (TODO comment removed)

## Future Requirements

### Cross-Browser/Device (carried from v1.4)

- **XBRO-01**: iOS Safari touch target verification on real device
- **XBRO-02**: Sector panel gesture handling on iOS Safari
- **XBRO-03**: Bottom sheet behavior verification on iOS Safari

### Route Enhancements (deferred to v1.7+)

- **ANI-01**: Animated crossfade transition between routes
- **PERF-01**: Lazy-load shorter route data on first selection

## Out of Scope

| Feature | Reason |
|---------|--------|
| LANDFIRE ecological zone map overlay on Leaflet | Research tool only — not a user-facing feature |
| Segment boundary adjustments | Segments match Strava segments; boundaries are fixed |
| New segment names | Current names match Forest Service road designations |
| Seasonal condition descriptions | Cut for brevity — trail-guide blurbs don't include multi-season info |
| Restock point info in descriptions | Restock markers on map serve this purpose already |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DESC-01 | TBD | Pending |
| DESC-02 | TBD | Pending |
| DESC-03 | TBD | Pending |
| LABEL-01 | TBD | Pending |
| PHOTO-01 | TBD | Pending |
| DEPLOY-01 | TBD | Pending |

**Coverage:**
- v1.6 requirements: 6 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 6

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-07 after initial definition*
