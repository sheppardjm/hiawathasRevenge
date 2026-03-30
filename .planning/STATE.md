# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-30)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive showcase that inspires them to ride it and support MBTN.
**Current focus:** Phase 2 — Data Pipeline

## Current Position

Phase: 2 of 11 (Data Pipeline)
Plan: 1 of 4 in current phase (02-01 complete)
Status: In progress
Last activity: 2026-03-30 — Completed 02-01-PLAN.md (GPX parser + route-data.json)

Progress: [███░░░░░░░] 9% (3/31 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: ~17 min
- Total execution time: ~50 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/2 complete | ~50 min | ~25 min |

**Recent Trend:**
- Last 5 plans: 01-01 (4 min), 01-02 (~45 min including checkpoint + post-approval refinements)
- Trend: On track; 01-02 was longer due to visual checkpoint and user-driven font/badge iterations

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Foundation: Clone mkUltra stack exactly — Astro 6.x, Tailwind 4.x, Vite 7 override required
- Foundation: CARTO Dark Matter is default tile fallback; try CyclOSM or Stadia Terrain first for forest aesthetic (resolve in Phase 3)
- Pipeline: Elevation gain must be computed on full-resolution 1927-point set (not simplified). 2m threshold yields 2,258 ft — verified within user GPS range 2,123–2,411 ft (02-01 resolved)
- Photos: Admin UI writes photos-manifest.json; choose fetch POST vs. CLI script for simplicity at Phase 9
- 01-01: Tailwind 4 CSS-first approach confirmed — @theme in global.css, no tailwind.config.js
- 01-01: Vite 7 override required — Tailwind 4.2+ plugin needs Vite 7, Astro 6 ships Vite 6
- 01-01: Node 25 required — Astro 6 requires Node >=22.12.0; use /usr/local/opt/node (v25.8.2) for all npm/astro commands
- 01-01: @layer leaflet reserved in global.css for Phase 3 Leaflet CSS isolation
- 01-02: Astro Fonts API uses fonts[] array (not experimental.fonts + families) — correct shape in astro.config.ts
- 01-02: Font.astro component with preload=true emits preload link tags; must be in <head> of BaseLayout
- 01-02: National Park font (Google) replaces Special Elite for display headings — user-approved National Forest Service aesthetic
- 01-02: Shield SVG badge with arrowhead and curved textPath is the canonical location branding element (index.astro h1)
- 01-02: global.css font tokens use var(--font-national-park) / var(--font-space-mono) to bridge Astro-injected variables
- 02-01: Elevation gain computed on full 1927-point set (not simplified) — RDP strips intermediate changes causing ~45% under-count; 2m filter → 2,258 ft
- 02-01: route-data.json is the single source of truth for all downstream components (456 simplified points for rendering, full-res used only for elevation calc)

### Pending Todos

- All future plans: Use `PATH="/usr/local/opt/node/bin:$PATH"` prefix for node/npm/npx commands (Node 25 required)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-30
Stopped at: Completed 02-01-PLAN.md — GPX parser, route-data.json, elevation fix committed
Resume file: None
