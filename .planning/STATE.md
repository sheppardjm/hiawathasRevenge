---
gsd_state_version: 1.0
milestone: v1.12
milestone_name: Route Start Relocation
status: executing
stopped_at: v1.12 roadmap created — Phase 54 (Route Start Relocation & Data Regeneration), 7/7 requirements mapped
last_updated: "2026-05-29T17:18:33.141Z"
last_activity: 2026-05-29 -- Phase 54 planning complete
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 2
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-29)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.
**Current focus:** v1.12 Route Start Relocation — relocate all three routes to the unified alt-start (46.34770, -86.72515) and regenerate all derived data ahead of the June 6, 2026 ride.

## Current Position

Phase: 54 — Route Start Relocation & Data Regeneration (not started)
Plan: —
Status: Ready to execute
Last activity: 2026-05-29 -- Phase 54 planning complete

## Performance Metrics

**v1.0 Summary:** 33 plans, 12 phases, 2 days
**v1.1 Summary:** 8 plans, 6 phases, 1 day
**v1.2 Summary:** 17 plans, 5 phases + gaps, 2 days
**v1.3 Summary:** 9 plans, 5 phases, 3 days
**v1.4 Summary:** 7 plans, 5 phases, 7 days
**v1.5 Summary:** 10 plans, 5 phases, 1 day
**v1.6 Summary:** 2 plans, 2 phases, <1 day
**v1.7 Summary:** 6 plans, 5 phases, 1 day
**v1.8 Summary:** 5 plans, 3 phases, 2 days
**v1.9 Summary:** 1 plan, 1 phase, <1 day
**v1.10 Summary:** 1 plan, 1 phase, <1 day
**v1.11 Summary:** 4 plans, 4 phases, ~1 day

## Deferred Items

Items acknowledged and deferred at milestone close on 2026-05-29 (v1.11). All 19 v1.11 requirements were verified complete; these are pre-existing artifacts carried forward across v1.0–v1.11.

| Category | Item | Status |
|----------|------|--------|
| debug | history-bg-paintings | diagnosed |
| debug | history-light-mode-text | diagnosed |
| debug | segment-cards-multi-photo | diagnosed |
| uat_gap | Phase 00 (00-UAT.md) | diagnosed (0 pending) |
| uat_gap | Phase 44 (44-UAT.md) | diagnosed (0 pending) |
| uat_gap | Phase 51 (51-UAT.md) | diagnosed (0 pending) |
| uat_gap | Phase 53 (53-UAT.md) | testing (3 pending) |
| verification_gap | Phase 03 (03-VERIFICATION.md) | human_needed |
| verification_gap | Phase 11 (11-VERIFICATION.md) | human_needed |
| verification_gap | Phase 20 (20-VERIFICATION.md) | gaps_found |
| verification_gap | Phase 22 (22-VERIFICATION.md) | human_needed |
| verification_gap | Phase 25 (25-VERIFICATION.md) | gaps_found |
| verification_gap | Phase 39 (39-01-VERIFICATION.md) | gaps_found |
| verification_gap | Phase 52 (52-VERIFICATION.md) | human_needed |

## Accumulated Context

### Decisions

(Full decision log in PROJECT.md Key Decisions table)

**Phase 54 (Route Start Relocation) — context for planning:**

- New unified start/finish: `46.34770, -86.72515` (~2 km SW of old start). Same course footprint; only the start moves, rotating all mileage-anchored data.
- Source GPX: three `(alt start)` exports in `~/Downloads` dated 2026-05-29 10:34.
- Coordinate-based haversine sector snapping (200m threshold) should re-snap cleanly with no code change — see `scripts/route-config.js` SECTOR_DEFS.
- Hardcoded mile values that must be re-derived: `RESTOCK_DEFS` (Camp 7 mile 44.7, Midway mile 75.7 in route-config.js) and photo mileage tags in the photo manifest.
- Per-route sector membership to preserve: 100mi = 8 sectors, 100k = 5, 50k = 4 (route-config.js ROUTES).
- Pipeline reference: 11-step pipeline.js (parse-gpx → resolve-annotations → generate-sector-details → compute-sector-elevations → shared steps).
- `route-config.js` `elevationTargetRange` (100mi [2123, 2411] ft) may need updating if new track elevation shifts.
- Node >=22.12.0 required — use Volta (`/Users/Sheppardjm/.volta/bin/node`).

**Phase 50-01 (Meta Tags & Structured Data):**

- og:locale uses underscore format `en_US` (not hyphen `en-US`)
- theme-color hardcoded as `#1a2e1a` — CSS custom properties don't work in content attribute
- Event startDate timezone is CDT (-05:00) for Michigan UP in June
- offers.isAccessibleForFree is boolean true (not string); offers.price is string "0" (not number)
- admin.astro canonical gap accepted as won't-fix (redirects to / in prod, never crawled)

**Phase 51-01 (Favicon & Icons):**

- favicon.svg uses CSS classes; generate-favicons.js uses inline fill attributes (sharp does not process `<style>` blocks reliably for rasterization)
- Icon link tag order: SVG → apple-touch-icon → ICO with sizes=32x32 (modern browsers prefer SVG; ICO is legacy fallback only)
- No dark-mode media query needed in favicon.svg — forest-green background (#1a2e1a) works on both light and dark tab bars
- to-ico ^1.1.5 added as devDependency for ICO encoding

**Phase 52-01 (OG Image Redesign):**

- Output renamed og-card.jpg (was og-image.jpg) for social platform cache busting
- Fonts stored in scripts/fonts/ — .astro/fonts/ doesn't exist at pipeline/prebuild run time
- SVG overlay uses inline fill attributes on rect/path — CSS class fills unreliable in sharp/librsvg (consistent with phase 51 decision)
- JPEG quality 85 (raised from 75) — text legibility on branded card takes priority
- Font embedding pattern for pipeline scripts: readFileSync + base64 + SVG @font-face data URI

**Phase 53-01 (Crawlability):**

- Static public/robots.txt preferred over dynamic endpoint — fixed URL, no templating benefit
- Sitemap directive uses sitemap-index.xml (not sitemap.xml) — @astrojs/sitemap generates sitemap-index.xml as entry point
- filter() excludes /admin in sitemap — admin.astro is a page file discovered at build time; runtime redirect to / does not prevent sitemap inclusion
- No changefreq or priority fields in sitemap — Google ignores both

### Pending Todos

None.

### Blockers/Concerns

- Ojibwe community consultation recommended (cultural sensitivity review)
- Project requires Node >=22.12.0 -- use Volta (`/Users/Sheppardjm/.volta/bin/node`)
- iOS Safari device testing deferred (requires physical device)

### Tech Debt

- RouteExplainer.astro line 128 comment says "7 cards = 600ms max" but there are now 8 cards (stale comment, info-level only)

## Session Continuity

Last session: 2026-05-29
Stopped at: v1.12 roadmap created — Phase 54 (Route Start Relocation & Data Regeneration), 7/7 requirements mapped
Resume file: None

## Operator Next Steps

- Plan Phase 54 with `/gsd-plan-phase 54`
