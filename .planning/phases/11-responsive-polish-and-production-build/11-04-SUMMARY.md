---
phase: 11-responsive-polish-and-production-build
plan: 04
subsystem: infra
tags: [astro, static-build, adapter, production, dist]

# Dependency graph
requires:
  - phase: 09-photo-markers-and-admin
    provides: admin.astro and save-manifest.ts with prerender=false and @astrojs/node adapter
  - phase: 10-content-narrative-and-visual-identity
    provides: fully assembled index.astro and complete site content
provides:
  - Static-only Astro build producing flat dist/ directory
  - astro.config.ts without @astrojs/node adapter
  - admin.astro and save-manifest.ts without prerender = false
  - Verified dist/ structure with index.html, thumbs/, data/, and GPX file
affects: [deployment, CI/CD, any future adapter configuration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@astrojs/node removed — output: 'static' with no adapter produces flat dist/"
    - "Admin page uses import.meta.env.PROD meta-refresh redirect without SSR/prerender=false"
    - "save-manifest.ts API route skipped entirely in static build (dev-server-only behavior)"

key-files:
  created: []
  modified:
    - astro.config.ts
    - src/pages/admin.astro
    - src/pages/api/save-manifest.ts

key-decisions:
  - "Removing @astrojs/node adapter and prerender=false is sufficient — static build skips API routes, admin prerender emits meta-refresh redirect"
  - "save-manifest.ts POST endpoint only runs on dev server in static mode — no guard needed in static build, Astro omits it"
  - "Admin page emits dist/admin/index.html with meta-refresh to / — acceptable, no sensitive data exposed"

patterns-established:
  - "Static-only pattern: output: 'static' + no adapter = flat dist/ directory deployable anywhere"

# Metrics
duration: 5min
completed: 2026-03-31
---

# Phase 11 Plan 04: Production Build Fix Summary

**Removed @astrojs/node adapter and prerender=false flags to produce flat dist/ with index.html, thumbs/, data/, and GPX file from a pure static Astro build**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-31T13:10:00Z
- **Completed:** 2026-03-31T13:15:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Removed @astrojs/node import and adapter config from astro.config.ts
- Removed `export const prerender = false` from admin.astro and save-manifest.ts
- Ran `astro build` — mode: "static", flat dist/ output confirmed with all required files

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove @astrojs/node adapter and prerender = false** - `c1205e6` (chore)
2. **Task 2: Run astro build and verify flat dist/ output** - verified via build run, no new source files to commit

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `astro.config.ts` — Removed @astrojs/node import and adapter: node({ mode: 'standalone' }) lines
- `src/pages/admin.astro` — Removed export const prerender = false line; import.meta.env.PROD guard unchanged
- `src/pages/api/save-manifest.ts` — Removed export const prerender = false line; PROD guard unchanged

## Decisions Made
- Removing the adapter and prerender=false is sufficient for correct static output — Astro static builds automatically skip non-prerenderable API routes
- Admin page generates dist/admin/index.html with a meta-refresh redirect to / in production — acceptable behavior, no sensitive data exposed
- save-manifest.ts is a dev-only tool; in static mode it's effectively not present in dist/ (no handler for GET, POST only served by dev server)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Build completed cleanly in 3.66s. One warning about `save-manifest` having no GET handler is expected and harmless (Astro renders it as an empty static page; POST-only endpoints cannot be accessed via GET in production anyway).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 11 complete — all 4 plans done
- Production build is a flat dist/ directory deployable to any static host (Netlify, Cloudflare Pages, S3+CloudFront, GitHub Pages, etc.)
- No blockers

---
*Phase: 11-responsive-polish-and-production-build*
*Completed: 2026-03-31*
