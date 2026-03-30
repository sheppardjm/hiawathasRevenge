---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [astro, tailwindcss, fonts, design-system, layout, static, svg, national-park-font]

# Dependency graph
requires:
  - phase: 01-01
    provides: Tailwind 4 CSS-first config, global.css @theme design tokens, Astro 6 scaffold
provides:
  - BaseLayout.astro HTML shell with Astro Fonts API, global.css import, and slot
  - Self-hosted National Park and Space Mono fonts via fontProviders.google()
  - index.astro landing page with shield SVG badge h1 and full Forest Service visual identity
  - Shield SVG badge with arrowhead iconography and curved textPath branding
  - public/favicon.svg with forest icon
  - astro.config.ts updated with fonts array config
affects:
  - 01-03 (pages will extend BaseLayout, inherit fonts and design tokens)
  - all subsequent phases (every page component uses BaseLayout)

# Tech tracking
tech-stack:
  added: [National Park (Google Fonts via Astro Fonts API)]
  patterns:
    - "Astro Fonts API via fontProviders.google() — fonts[] array config, Font component in <head>"
    - "BaseLayout.astro as single HTML shell — all pages slot into it"
    - "Font.astro component with preload=true for preload link tags"
    - "SVG badge with <textPath> along shield arc for curved location branding text"

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
  - "National Park font (Google) replaces Special Elite for display headings — authentic National Forest Service aesthetic"
  - "Shield SVG badge shape for location branding h1, with arrowhead iconography and curved textPath"
  - "Font cssVariables --font-national-park and --font-space-mono injected by Astro, used as var() in global.css @theme"
  - "Font.astro component with preload=true added to BaseLayout <head> for preload link tags"

patterns-established:
  - "BaseLayout pattern: all pages import and wrap with <BaseLayout title='...'> component"
  - "Astro Fonts API: cssVariable registered in config, Font component in head, var(--font-*) in CSS"
  - "Shield badge h1 pattern: SVG shield with textPath arc for location branding at top of page"

# Metrics
duration: ~45min
completed: 2026-03-30
---

# Phase 1 Plan 2: BaseLayout and Visual Identity Summary

**National Park font display headings, shield SVG badge with arrowhead and curved textPath, Space Mono body text — Forest Service visual identity live in browser via Astro Fonts API and Tailwind 4 design tokens**

## Performance

- **Duration:** ~45 min (including post-checkpoint font and badge refinements)
- **Started:** 2026-03-30T19:45:51Z
- **Completed:** 2026-03-30
- **Tasks:** 3 (2 auto + 1 checkpoint with post-approval refinements)
- **Files modified:** 5

## Accomplishments
- BaseLayout.astro provides reusable HTML shell with Font.astro injection, global.css, meta tags, and slot
- National Park and Space Mono fonts self-hosted via Astro Fonts API — woff2 files in dist/_astro/fonts/, no external requests
- Shield SVG badge h1 with arrowhead iconography and curved textPath for "Hiawatha National Forest" / "100 Miles" branding
- index.astro renders Forest Service visual identity: forest green background, amber headings in National Park font, cream body text in Space Mono
- Visual identity approved by user after checkpoint review and National Park font + shield badge refinements

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BaseLayout.astro with HTML shell, Astro Fonts API, and global styles** - `5168e0c` (feat)
2. **Task 2: Create index.astro with design system showcase content** - `a94adae` (feat)
3. **Checkpoint pre-commit** - `4881178` (docs)
4. **Fix: Swap Special Elite for National Park font, add badge h1** - `e9894c3` (fix)
5. **Fix: Shield badge with curved SVG textPath and National Park iconography** - `6a356d2` (fix)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/layouts/BaseLayout.astro` - HTML shell with Font.astro, global.css import, title/description props, slot
- `src/pages/index.astro` - Landing page with shield SVG badge h1 and design system showcase sections
- `public/favicon.svg` - Forest tree icon
- `astro.config.ts` - fonts[] array with fontProviders.google() for National Park and Space Mono
- `src/styles/global.css` - Font tokens updated to var(--font-national-park) and var(--font-space-mono)

## Decisions Made
- **National Park font over Special Elite:** User specified National Park (Google Fonts) for display headings during visual review. Matches authentic National Forest Service signage aesthetic more closely than typewriter-style Special Elite.
- **Shield SVG badge shape:** User provided shield path for the location branding h1. Replaces oval/round badge concept. Shield is the canonical National Park / Forest Service badge form.
- **Arrowhead iconography in badge:** Native American arrowhead icon inside badge reinforces route cultural context (Hiawatha — Ojibwe/Anishinaabe reference).
- **Curved textPath for badge text:** "Hiawatha National Forest" curves along interior of shield top arc using SVG `<textPath>`. Matches National Park sign conventions.
- **Astro Fonts API config shape:** The plan suggested `experimental.fonts` + nested `families` array. The actual Astro 6.1.2 API uses a top-level `fonts[]` array with `{ name, provider, cssVariable, weights, styles }` shape.
- **Font cssVariable approach:** Astro injects CSS variables on `:root`. Updated global.css @theme to use `var(--font-national-park, ...)` with fallback chain for dev/prod compatibility.

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

### User-Requested Refinements (Post-Checkpoint)

**1. National Park font swap**
- **Requested:** User specified National Park font instead of Special Elite during visual review
- **Fix:** Updated astro.config.ts, global.css, BaseLayout.astro font references; replaced Special Elite with National Park
- **Committed in:** `e9894c3`

**2. Shield SVG badge with curved textPath**
- **Requested:** User specified shield shape with arrowhead iconography and curved "Hiawatha National Forest" text
- **Fix:** Replaced heading text with SVG shield path, added `<textPath>` along top arc, added arrowhead icon, "100 Miles" text
- **Committed in:** `6a356d2`

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs — incorrect API shape and missing variable bridge), 2 user-directed refinements post-checkpoint
**Impact on plan:** Auto-fixes required for fonts to load. User refinements improved visual fidelity to National Forest Service aesthetic. No scope creep.

## Issues Encountered

- Port 4321 was already occupied by another project's dev server during verification. Confirmed hiawathasRevenge dev server starts cleanly on next available port. User should run `npm run dev` from the `hiawathasRevenge` directory to get port 4321 (or whichever port is free).

## User Setup Required

None - no external service configuration required. Fonts are self-hosted at build time.

## Next Phase Readiness
- BaseLayout and visual identity complete — all future phases use `<BaseLayout title="...">` to inherit fonts, colors, and meta
- Shield badge pattern established for page branding (can be refined in Phase 10 nav work)
- All 5 phase success criteria confirmed met; visual identity approved by user
- Design token system proven: Tailwind 4 @theme tokens resolve as utilities, CSS custom properties work in inline styles
- Plan 01-03 (data pipeline scaffold) can proceed immediately

---
*Phase: 01-foundation*
*Completed: 2026-03-30*
