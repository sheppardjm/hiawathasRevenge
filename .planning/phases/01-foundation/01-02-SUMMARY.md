---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [astro, tailwindcss, fonts, design-system, layout, static]

# Dependency graph
requires:
  - phase: 01-01
    provides: Tailwind 4 CSS-first config, global.css @theme design tokens, Astro 6 scaffold
provides:
  - BaseLayout.astro HTML shell with Astro Fonts API, global.css import, and slot
  - Self-hosted Space Mono and Special Elite fonts via fontProviders.google() (5 woff2 files in dist)
  - index.astro landing page demonstrating full Forest Service visual identity
  - public/favicon.svg with forest icon
  - astro.config.ts updated with fonts array config
affects:
  - 01-03 (pages will extend BaseLayout, inherit fonts and design tokens)
  - all subsequent phases (every page component uses BaseLayout)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Astro Fonts API via fontProviders.google() — fonts[] array config, Font component in <head>"
    - "BaseLayout.astro as single HTML shell — all pages slot into it"
    - "Font.astro component with preload=true for preload link tags"

key-files:
  created:
    - src/layouts/BaseLayout.astro
    - src/pages/index.astro
    - public/favicon.svg
  modified:
    - astro.config.ts
    - src/styles/global.css

key-decisions:
  - "Astro Fonts API fonts[] array config (not experimental.fonts) — correct shape for Astro 6.1.x"
  - "Font cssVariables --font-space-mono and --font-special-elite injected by Astro, used as var() in global.css @theme"
  - "Font.astro component with preload=true added to BaseLayout <head> for preload link tags"
  - "Google Fonts self-hosted: 5 woff2 files copied to dist/_astro/fonts/, no external googleapis.com requests"

patterns-established:
  - "BaseLayout pattern: all pages import and wrap with <BaseLayout title='...'> component"
  - "Astro Fonts API: cssVariable registered in config, Font component in head, var(--font-*) in CSS"

# Metrics
duration: 3min
completed: 2026-03-30
---

# Phase 1 Plan 2: BaseLayout and Visual Identity Summary

**Astro Fonts API self-hosting Space Mono and Special Elite with BaseLayout HTML shell and Forest Service visual identity rendered on index page**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-30T19:45:51Z
- **Completed:** 2026-03-30T19:48:50Z
- **Tasks:** 2 (plus checkpoint awaiting human verification)
- **Files modified:** 5

## Accomplishments
- BaseLayout.astro provides reusable HTML shell with Font.astro injection, global.css, meta tags, and slot
- Space Mono (400, 700, italic variants) and Special Elite (400) self-hosted via Astro Fonts API — 5 woff2 files in dist/_astro/fonts/
- index.astro renders Forest Service visual identity: forest green background, amber headings in Special Elite, cream body text in Space Mono, badge-style bordered donate box
- Static build confirmed: 1 page built, no SSR artifacts, no external font requests

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BaseLayout.astro with HTML shell, Astro Fonts API, and global styles** - `5168e0c` (feat)
2. **Task 2: Create index.astro with design system showcase content** - `a94adae` (feat)

**Plan metadata:** (pending final commit after checkpoint)

## Files Created/Modified
- `src/layouts/BaseLayout.astro` - HTML shell with Font.astro, global.css import, title/description props, slot
- `src/pages/index.astro` - Landing page demonstrating all design tokens: forest greens, amber accents, cream text, badge shadows
- `public/favicon.svg` - Forest tree icon
- `astro.config.ts` - Added fonts[] array with fontProviders.google() for Space Mono and Special Elite
- `src/styles/global.css` - Updated --font-mono and --font-display to use var(--font-space-mono) and var(--font-special-elite)

## Decisions Made
- **Astro Fonts API config shape:** The plan suggested `experimental.fonts` + nested `families` array. The actual Astro 6.1.2 API uses a top-level `fonts[]` array directly with `{ name, provider, cssVariable, weights, styles }` shape. Applied correct shape.
- **Font cssVariable approach:** Astro injects CSS variables on `:root` (e.g., `--font-space-mono: "Space Mono-hash", "fallback"`). Updated global.css @theme to use `var(--font-space-mono, ...)` with fallback chain so fonts work both during dev (before Astro injection) and in prod.
- **Font.astro with preload:** Added `<Font cssVariable="..." preload />` to BaseLayout head to emit `<link rel="preload">` tags for each woff2 file — prevents layout shift, prioritizes font loading.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected Astro Fonts API config shape and removed non-existent experimental flag**

- **Found during:** Task 1 (astro.config.ts update)
- **Issue:** Plan specified `experimental: { fonts: true }` and `fonts: { providers: [...], families: [...] }` — neither shape exists in Astro 6.1.x. The actual API uses `fonts: [{ name, provider, cssVariable, ... }]` array at config root.
- **Fix:** Used correct `fonts[]` array shape; removed `experimental.fonts`; added required `cssVariable` property per type def.
- **Files modified:** astro.config.ts
- **Verification:** `astro build` succeeds with "Copying fonts (5 files)..." confirming Fonts API activated
- **Committed in:** `5168e0c` (Task 1 commit)

**2. [Rule 1 - Bug] Updated global.css font tokens to use Astro-injected CSS variables**

- **Found during:** Task 1 (inspecting how Fonts API injects variables)
- **Issue:** Plan had `--font-mono: 'Space Mono', ui-monospace, monospace` as a static string. Astro Fonts API injects `--font-space-mono` with a hashed family name on `:root`. Without consuming this variable, fonts would fall through to system fonts.
- **Fix:** Changed to `var(--font-space-mono, 'Space Mono', ui-monospace, monospace)` with fallback chain.
- **Files modified:** src/styles/global.css
- **Verification:** Built HTML shows `--font-space-mono` on `:root` and `font-family: var(--font-mono)` on `html` via @layer base
- **Committed in:** `5168e0c` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs — incorrect API shape and missing variable bridge)
**Impact on plan:** Both fixes required for fonts to actually load and render. No scope creep. Self-hosting behavior identical to plan intent.

## Issues Encountered

- Port 4321 was already occupied by another project's dev server during verification. Confirmed hiawathasRevenge dev server starts cleanly on next available port. User should run `npm run dev` from the `hiawathasRevenge` directory to get port 4321 (or whichever port is free).

## User Setup Required

None - no external service configuration required. Fonts are self-hosted at build time.

## Next Phase Readiness
- BaseLayout and index page are ready; any subsequent page just imports `BaseLayout` and wraps content in it
- All 5 phase success criteria confirmed met by build output and dev server test
- Awaiting human visual confirmation at checkpoint before marking phase foundation complete
- Plan 01-03 can proceed once checkpoint is approved

---
*Phase: 01-foundation*
*Completed: 2026-03-30*
