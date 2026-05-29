# Requirements: v1.12 Route Start Relocation

**Milestone goal:** Move all three routes (100mi/100k/50k) to the new unified start/finish staging location and regenerate every piece of derived data so the site reflects the re-cut course accurately ahead of the June 6, 2026 ride.

**Source of truth:** The three `(alt start)` GPX exports in `~/Downloads` (2026-05-29 10:34), all sharing start/finish at `46.34770, -86.72515`. Same course footprint as the current routes; only the start/finish location moves (~2 km SW), which rotates all mileage-anchored data.

---

## v1.12 Requirements

### Route Data

- [ ] **ROUTE-01**: All three route GPX files (100mi, 100k, 50k) are replaced with the new alt-start tracks that start and finish at `46.34770, -86.72515`.
- [ ] **ROUTE-02**: The build pipeline runs end-to-end on the three new tracks and regenerates route-data, annotations, sector-details, and elevation data without errors.
- [ ] **ROUTE-03**: All on-route gravel sectors re-snap to the correct location on each new track, preserving per-route membership (8 sectors on 100mi, 5 on 100k, 4 on 50k).
- [ ] **ROUTE-04**: Restock point mileages (Camp 7 Lake, Midway General Store) are re-derived to match the new 100mi course position.
- [ ] **ROUTE-05**: Photo mileage tags are re-validated against the new course so map photo markers and gallery mileage ordering remain correct.
- [ ] **ROUTE-06**: Per-route stats (distance, elevation gain) reflect the new tracks and fall within expected ranges; `route-config.js` `elevationTargetRange` and any hardcoded distances are updated if needed.
- [ ] **ROUTE-07**: The user-downloadable GPX files served by the site are the new alt-start tracks for every route.

---

## Future Requirements (deferred)

- Android PWA install — `site.webmanifest` with 192x192 and 512x512 icons (MANIFEST-01, deferred from v1.11)

## Out of Scope

- Course/route changes beyond the start/finish relocation — the course footprint is unchanged; this milestone only moves the start and refreshes derived data.
- New sectors, photos, or editorial content — data accuracy only.
- Domain research — the course is the same; no new domain knowledge required.

---

## Traceability

| Requirement | Phase |
|-------------|-------|
| ROUTE-01 | _(filled by roadmap)_ |
| ROUTE-02 | _(filled by roadmap)_ |
| ROUTE-03 | _(filled by roadmap)_ |
| ROUTE-04 | _(filled by roadmap)_ |
| ROUTE-05 | _(filled by roadmap)_ |
| ROUTE-06 | _(filled by roadmap)_ |
| ROUTE-07 | _(filled by roadmap)_ |
