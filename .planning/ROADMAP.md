# Roadmap: Hiawatha's Revenge

## Milestones

- ✅ **v1.0 MVP** — Phases 0-11 (shipped 2026-03-31)
- ✅ **v1.1 Visual Redesign** — Phases 12-17 (shipped 2026-03-31)
- ✅ **v1.2 → v1.10** — Phases 18-49 (shipped through 2026-04-08)
- ✅ **v1.11 SEO & Social Sharing** — Phases 50-53 (shipped 2026-05-29)
- 🚧 **v1.12 Route Start Relocation** — Phase 54 (in progress)

## Phases

<details>
<summary>✅ v1.0 through v1.10 (Phases 0-49) — SHIPPED</summary>

See `.planning/MILESTONES.md` and `.planning/milestones/` for full history.

</details>

<details>
<summary>✅ v1.11 SEO & Social Sharing (Phases 50-53) — SHIPPED 2026-05-29</summary>

**Milestone Goal:** Site looks compelling and accurate when shared on social platforms or found via search — badge logo, proper descriptions, structured data, and crawlability.

- [x] Phase 50: Meta Tags & Structured Data (1/1 plans) — completed 2026-04-09
- [x] Phase 51: Favicon & Icons (1/1 plans) — completed 2026-04-09
- [x] Phase 52: OG Image Redesign (1/1 plans) — completed 2026-04-09
- [x] Phase 53: Crawlability (1/1 plans) — completed 2026-04-09

Full phase details archived at `.planning/milestones/v1.11-ROADMAP.md`.

</details>

### 🚧 v1.12 Route Start Relocation (In Progress)

**Milestone Goal:** Move all three routes (100mi/100k/50k) to the new unified start/finish staging location (46.34770, -86.72515) and regenerate every piece of derived data so the site reflects the re-cut course accurately ahead of the June 6, 2026 ride.

- [ ] **Phase 54: Route Start Relocation & Data Regeneration** - Swap in the three alt-start GPX tracks, re-run the pipeline, and re-derive all mileage-anchored data for the rotated course

## Phase Details

### Phase 54: Route Start Relocation & Data Regeneration
**Goal**: All three routes start and finish at the new unified staging point (46.34770, -86.72515), and every piece of derived data — route geometry, gravel sector snapping, restock mileages, photo mileage tags, per-route stats, and the downloadable GPX files — accurately reflects the rotated course.
**Depends on**: Phase 53 (v1.11 baseline)
**Requirements**: ROUTE-01, ROUTE-02, ROUTE-03, ROUTE-04, ROUTE-05, ROUTE-06, ROUTE-07
**Success Criteria** (what must be TRUE):
  1. All three routes render on the map starting and finishing at the new staging point (46.34770, -86.72515), ~2 km SW of the old start, with no build errors from the pipeline.
  2. Gravel sectors appear correctly positioned on every route — 8 sectors on 100mi, 5 on 100k, 4 on 50k — each snapped to its on-route location.
  3. Restock markers (Camp 7 Lake on 100mi; Midway on 100mi/100k) show re-derived mileages that match their position along the new course, and photo map markers / gallery ordering reflect the rotated mileage tags.
  4. Per-route stats (distance and elevation gain) shown in the route selector and comparison sidebar fall within expected ranges for the new tracks, with `route-config.js` updated where references changed.
  5. The GPX download link serves the new alt-start track for each selected route.
**Plans**: 2 plans
Plans:
- [ ] 54-01-PLAN.md — Pre-pipeline setup: swap alt-start GPX, fix match-photos.js path bug, run photo-mileage migration (ROUTE-01, ROUTE-05)
- [ ] 54-02-PLAN.md — Run pipeline, verify sector/restock/elevation/GPX gates, build smoke test (ROUTE-02, ROUTE-03, ROUTE-04, ROUTE-06, ROUTE-07)
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order. Phase 54 is the sole phase of v1.12.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 50. Meta Tags & Structured Data | v1.11 | 1/1 | ✓ Complete | 2026-04-09 |
| 51. Favicon & Icons | v1.11 | 1/1 | ✓ Complete | 2026-04-09 |
| 52. OG Image Redesign | v1.11 | 1/1 | ✓ Complete | 2026-04-09 |
| 53. Crawlability | v1.11 | 1/1 | ✓ Complete | 2026-04-09 |
| 54. Route Start Relocation & Data Regeneration | v1.12 | 0/2 | Not started | - |

(Phases 0-49 complete — see `.planning/milestones/` archives.)

---
*Last updated: 2026-05-29 — v1.12 Phase 54 planned (2 plans, 2 waves)*
