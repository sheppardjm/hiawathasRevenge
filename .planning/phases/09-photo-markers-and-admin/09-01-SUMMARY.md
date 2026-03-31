---
phase: 09-photo-markers-and-admin
plan: 01
subsystem: admin
tags: [astro, api-route, filesystem, photos-manifest, dev-tooling, node-adapter]

# Dependency graph
requires:
  - phase: 07-photo-pipeline
    provides: generate-thumbnails.js which produces /public/thumbs/*.webp that admin page displays
  - phase: 08-photo-gallery
    provides: match-photos.js which consumes photos-manifest.json written by admin UI
provides:
  - Dev-only admin UI at /admin for assigning mileage to source photos
  - POST API endpoint at /api/save-manifest that writes public/data/photos-manifest.json
  - @astrojs/node adapter wired into astro.config.ts enabling prerender=false pages
affects:
  - 09-02-photo-markers (requires photos-manifest.json produced by admin UI)
  - any future phases using server-rendered Astro pages

# Tech tracking
tech-stack:
  added: [@astrojs/node adapter wired into astro.config.ts]
  patterns:
    - prerender=false + import.meta.env.PROD guard for dev-only pages
    - Standalone HTML admin pages (no BaseLayout/Tailwind) using inline CSS with project color tokens
    - Astro API route POST handler writing to filesystem via writeFileSync

key-files:
  created:
    - src/pages/admin.astro
    - src/pages/api/save-manifest.ts
  modified:
    - astro.config.ts

key-decisions:
  - "@astrojs/node adapter required in astro.config.ts for prerender=false to work in Astro 6 static builds — package was installed in 09-02 but adapter not wired in config"
  - "prerender=false on admin.astro so page renders dynamically in dev (reads live filesystem); PROD guard returns Astro.redirect('/') as SSR response"
  - "Standalone HTML for admin (no BaseLayout) — dev tooling should not depend on visitor-facing layout components"
  - "thumbName derivation in admin.astro matches generate-thumbnails.js exactly: basename.replace(/ /g, '_') + '.webp'"

patterns-established:
  - "Dev-only page pattern: prerender=false + if (import.meta.env.PROD) { return Astro.redirect('/') } at top of frontmatter"
  - "Astro API route POST handler: export const POST: APIRoute = async ({ request }) => {...} with writeFileSync for filesystem writes"

# Metrics
duration: 7min
completed: 2026-03-31
---

# Phase 9 Plan 01: Photo Manifest Admin Summary

**Dev-only admin UI at /admin with photo thumbnails and mileage inputs; POST endpoint writes photos-manifest.json; @astrojs/node adapter wired in astro.config.ts**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-31T15:34:50Z
- **Completed:** 2026-03-31T15:42:38Z
- **Tasks:** 2
- **Files modified:** 4 (admin.astro, save-manifest.ts, astro.config.ts + package.json/lock already done in 09-02)

## Accomplishments
- Admin UI at /admin lists all source JPGs with thumbnails and mileage inputs
- Save button POSTs to /api/save-manifest and writes public/data/photos-manifest.json
- Production guard redirects /admin to / — never exposed to visitors
- @astrojs/node adapter wired into astro.config.ts so prerender=false pages work in Astro 6 builds

## Task Commits

Each task was committed atomically:

1. **Task 1: Create POST endpoint for saving the manifest** - `7c71e1d` (feat)
2. **Task 2: Create admin.astro page with photo manifest editor UI** - `814ea95` (feat)

**Plan metadata:** (included in docs commit below)

## Files Created/Modified
- `src/pages/api/save-manifest.ts` - POST endpoint that reads JSON body and writes public/data/photos-manifest.json; guarded with 403 in PROD
- `src/pages/admin.astro` - Dev-only photo manifest editor; lists all JPGs with thumbnails, mileage inputs, and save button; redirects to / in PROD
- `astro.config.ts` - Added @astrojs/node adapter import and adapter config (required for prerender=false in Astro 6)

## Decisions Made

1. **@astrojs/node adapter required in astro.config.ts** — Astro 6 throws NoAdapterInstalled error when any page uses `prerender = false` in a static build without an adapter. The package was installed in 09-02 but never wired into the config. This plan wired it.

2. **prerender=false on admin.astro with PROD redirect** — In dev, the page renders dynamically on each request (reading live filesystem for photo list and manifest). In production, the server-side handler returns Astro.redirect('/') immediately, never reading files. This satisfies both "dynamic in dev" and "redirects in production" requirements.

3. **Standalone HTML for admin** — No BaseLayout or Tailwind. Admin is internal dev tooling; inline CSS using project color tokens (forest greens #1a2e1a/#3d6b3d, amber #c8973e, cream #f5f0e8) keeps the page self-contained.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @astrojs/node adapter to astro.config.ts**
- **Found during:** Task 2 (build verification)
- **Issue:** `astro build` failed with `NoAdapterInstalled` error — Astro 6 requires an adapter for any page with `prerender = false`, even in `output: 'static'` mode. The plan's anti-pattern "Do NOT add an SSR adapter" was incorrect for Astro 6.
- **Fix:** Added `import node from '@astrojs/node'` and `adapter: node({ mode: 'standalone' })` to astro.config.ts. The `@astrojs/node` package was already installed in package.json from the 09-02 session.
- **Files modified:** astro.config.ts
- **Verification:** `astro build` completes without errors; admin page is server-rendered with PROD guard; index.html is statically prerendered
- **Committed in:** 814ea95 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (blocking build issue)
**Impact on plan:** Required to satisfy the build verification requirement. The node adapter does not affect the visitor-facing static site — it only enables the dev-only admin routes.

## Issues Encountered

- Initial `astro build` failed with `NoAdapterInstalled` — resolved by wiring the node adapter that was already in package.json.
- Astro 6 removed `output: 'hybrid'` (verified by trying it — error confirms it's gone; static mode now handles hybrid behavior natively when adapter is present).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Admin UI is ready to use: run `npm run dev`, visit /admin, assign mileages, save
- Manifest at public/data/photos-manifest.json feeds directly into match-photos.js pipeline step
- Phase 09-02 (photo cluster markers on map) is already complete per git history — photo markers will appear once manifest is populated and pipeline reruns

---
*Phase: 09-photo-markers-and-admin*
*Completed: 2026-03-31*
