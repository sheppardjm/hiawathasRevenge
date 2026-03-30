# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-30)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive showcase that inspires them to ride it and support MBTN.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 11 (Foundation)
Plan: 2 of 3 in current phase
Status: In progress (awaiting human verification checkpoint)
Last activity: 2026-03-30 — Completed 01-02-PLAN.md tasks (BaseLayout + index page); paused at visual checkpoint

Progress: [██░░░░░░░░] 5% (2/37 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 3.5 min
- Total execution time: 7 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/3 complete | 7 min | 3.5 min |

**Recent Trend:**
- Last 5 plans: 01-01 (4 min), 01-02 (3 min)
- Trend: Fast execution, on track

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Foundation: Clone mkUltra stack exactly — Astro 6.x, Tailwind 4.x, Vite 7 override required
- Foundation: CARTO Dark Matter is default tile fallback; try CyclOSM or Stadia Terrain first for forest aesthetic (resolve in Phase 3)
- Pipeline: Elevation noise filter threshold (~5m) must be validated against known Garmin/Strava figures for this GPX (Phase 2)
- Photos: Admin UI writes photos-manifest.json; choose fetch POST vs. CLI script for simplicity at Phase 9
- 01-01: Tailwind 4 CSS-first approach confirmed — @theme in global.css, no tailwind.config.js
- 01-01: Vite 7 override required — Tailwind 4.2+ plugin needs Vite 7, Astro 6 ships Vite 6
- 01-01: Node 25 required — Astro 6 requires Node >=22.12.0; use /usr/local/opt/node (v25.8.2) for all npm/astro commands
- 01-01: @layer leaflet reserved in global.css for Phase 3 Leaflet CSS isolation
- 01-02: Astro Fonts API uses fonts[] array (not experimental.fonts + families) — correct shape in astro.config.ts
- 01-02: Font.astro component with preload=true emits preload link tags; must be in <head> of BaseLayout
- 01-02: global.css font tokens use var(--font-space-mono) / var(--font-special-elite) to bridge Astro-injected variables

### Pending Todos

- All future plans: Use `PATH="/usr/local/opt/node/bin:$PATH"` prefix for node/npm/npx commands (Node 25 required)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-30T19:48:50Z
Stopped at: 01-02-PLAN.md — Tasks 1 and 2 complete; paused at checkpoint:human-verify (visual identity check)
Resume file: None (resume via /gsd:execute-phase after user approves checkpoint)
