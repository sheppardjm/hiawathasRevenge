---
phase: 20-content-route-enrichment
verified: 2026-04-01T00:00:00Z
status: gaps_found
score: 4.5/5 must-haves verified
gaps:
  - truth: "Each route segment has a Strava segment link"
    status: partial
    reason: "Strava link mechanism is correctly built (conditional render, brand color, noopener) but zero stravaId values are set in the SEGMENTS data — no Strava links render on the page"
    artifacts:
      - path: "src/components/RouteExplainer.astro"
        issue: "All 7 SEGMENTS entries omit stravaId field — the conditional {seg.stravaId && ...} never fires"
    missing:
      - "stravaId values for at least one segment (e.g., '12345678') to make the success criterion demonstrably true"
      - "Note: The plan explicitly deferred this to the user ('user provides IDs later'), so this is a known deferral, not a surprise — but SC#5 in the ROADMAP requires the link to exist, not just the mechanism"
---

# Phase 20: Content & Route Enrichment Verification Report

**Phase Goal:** The HiawathaExplainer and RouteExplainer sections are transformed with historical imagery, dramatic typography, pull quotes, and enriched segment details -- the site reads like an award-winning editorial feature, not a simple ride page
**Verified:** 2026-04-01T00:00:00Z
**Status:** gaps_found
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | HiawathaExplainer has 4 National Park subheadings with 3+ distinct colors | VERIFIED | h3s: "The Poem" (amber-500), "The Confusion" (turquoise-400), "The Forest" (sun-400), "The Ride" (scarlet-400) — all use `font-display` class resolving to National Park typeface via `--font-display` CSS var in `@theme static` |
| 2   | 2 historical illustrations appear between paragraphs with figcaption attribution, sepia treatment, 6-8rem whitespace | VERIFIED | `historicalPhotos[0]` and `[1]` condionally rendered inside `<figure class="historical-break">` with `<figcaption>` rendering title/artist/year/source from `historical-photos.json`; `.historical-break { margin: 6rem auto }` confirmed; positioned after blockquote and after "The Forest" paragraph |
| 3   | Historical illustrations are visually distinct from route photos (sepia vs full-color) | VERIFIED | `.historical-img { filter: sepia(80%) saturate(30%) brightness(0.9) }` applied only in HiawathaExplainer; RouteExplainer has zero filter CSS on segment photos |
| 4   | Longfellow critique blockquote has dramatic pull quote treatment | VERIFIED | `.pull-quote`: `background-color: var(--color-forest-950)`, `max-width: 48rem` (wider than max-w-prose ~65ch), `::before { content: '\201C'; font-size: 5rem; color: var(--color-gold-500) }`, `font-family: var(--font-display)`, ShieldMotif at size=12 with `.pull-quote-ornament` class |
| 5   | Each route segment has National Park subheading, difficulty-coded color, shield icon, Strava link, expanded terrain description | PARTIAL | Subheadings (font-display), DIFFICULTY_COLORS record (sun-400/amber-500/scarlet-400), ShieldMotif at size=10, and expanded descriptions with Surface:/landmarks/seasonal ALL verified. Strava link: mechanism built but all 7 stravaId fields omitted from SEGMENTS data -- no links render |

**Score:** 4.5/5 truths verified (SC#5 partial — Strava links not functional)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/components/HiawathaExplainer.astro` | Editorial restructure with subheadings, historical images, pull quote | VERIFIED | 199 lines, substantive, imported and rendered in index.astro |
| `src/components/RouteExplainer.astro` | Segment cards with difficulty colors, ShieldMotif, Strava links, expanded descriptions | VERIFIED (partial) | 232 lines, substantive, imported and rendered in index.astro; Strava mechanism present but not activated |
| `public/data/historical-photos.json` | 2 entries with thumb paths and attribution metadata | VERIFIED | 2 entries with filename, category, thumb, title, artist, year, source, license fields |
| `public/data/historical-manifest.json` | 2 entries with attribution metadata | VERIFIED | 2 entries matching historical-photos.json |
| `public/thumbs/historical/remington-hiawatha-departure-1891.webp` | 400px WebP thumbnail | VERIFIED | 16KB, exists at expected path |
| `public/thumbs/historical/remington-hiawatha-fasting-1891.webp` | 400px WebP thumbnail | VERIFIED | 9.6KB, exists at expected path |
| `public/images/historical/*.jpg` | Full-resolution source images | VERIFIED | 2.1MB and 3.1MB JPEGs at correct paths |
| `src/components/ShieldMotif.astro` | Decorative shield SVG component | VERIFIED | 33 lines, `#shield-motif` symbol defined in BaseLayout.astro, used in both HiawathaExplainer and RouteExplainer |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `HiawathaExplainer.astro` | `historical-photos.json` | `import historicalPhotos from '../../public/data/historical-photos.json'` | WIRED | Import present, array access at `[0]` and `[1]` with conditional guards |
| `HiawathaExplainer.astro` | `ShieldMotif.astro` | `import ShieldMotif` + `<ShieldMotif size={12} class="pull-quote-ornament" />` | WIRED | Imported and rendered inside blockquote |
| `RouteExplainer.astro` | `ShieldMotif.astro` | `import ShieldMotif` + `<ShieldMotif size={10} class={DIFFICULTY_COLORS[...]}/>` | WIRED | Imported and rendered in every segment card |
| `RouteExplainer.astro` | `strava.com/segments` | `{seg.stravaId && <a href=...>}` | PARTIAL | Conditional link wired; never fires because zero stravaId fields are set |
| `RouteExplainer.astro` | `DIFFICULTY_COLORS` | `DIFFICULTY_COLORS[seg.difficulty] ?? 'text-amber-500'` | WIRED | Record defined and applied to both ShieldMotif and h3 class |
| `index.astro` | `HiawathaExplainer` | `import` + `<HiawathaExplainer />` | WIRED | Lines 12 and 27 of index.astro |
| `index.astro` | `RouteExplainer` | `import` + `<RouteExplainer />` | WIRED | Lines 13 and 29 of index.astro |
| `--font-display` | National Park typeface | `@theme static { --font-display: var(--font-national-park, ...) }` | WIRED | CSS var defined in global.css `@theme static` block; Tailwind v4 generates `font-display` utility class; National Park font loaded via Astro Fonts API in astro.config.ts |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
| ----------- | ------ | -------------- |
| CON-01 (historical imagery) | SATISFIED | 2 Remington illustrations in HiawathaExplainer with figcaption |
| CON-02 (editorial subheadings) | SATISFIED | 4 National Park subheadings with 4 distinct colors |
| CON-03 (historical visual distinction) | SATISFIED | sepia(80%) saturate(30%) brightness(0.9) on historical; no filter on route photos |
| CON-04 (pull quote treatment) | SATISFIED | forest-950 background, 5rem gold quotation mark, ShieldMotif ornament, 48rem breakout |
| CON-05 (generous whitespace) | SATISFIED | 6rem margins on historical image breaks and section subheadings |
| RTE-01 (segment subheadings) | SATISFIED | All 7 segments have font-display h3 with difficulty-coded color and ShieldMotif |
| RTE-03 (Strava links) | BLOCKED | Mechanism exists but no stravaId values populated — zero links render |
| RTE-04 (expanded descriptions) | SATISFIED | All 7 segments have Surface: label, named landmarks, and seasonal timing notes |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `RouteExplainer.astro` | 14, 91 | `stravaId?: string` declared; all 7 instances omitted from data | Warning | Strava links never render; SC#5 partially unmet |

No TODO/FIXME/placeholder comments found in either component. No empty handler stubs. No placeholder content.

### Human Verification Required

#### 1. National Park Typeface Renders Visually

**Test:** Open the site in a browser and inspect the HiawathaExplainer subheadings ("The Poem," "The Confusion," etc.)
**Expected:** Subheadings render in National Park typeface (a condensed display font with slab-serif character), not in Space Mono or a system sans-serif fallback
**Why human:** Font loading is runtime behavior -- the Astro Fonts API injects `--font-national-park` at build time but rendering depends on CDN delivery of the Google Fonts National Park asset

#### 2. Historical Image Sepia vs Route Photo Color Contrast

**Test:** Scroll the page and compare the historical Remington illustrations in HiawathaExplainer against segment photos in RouteExplainer
**Expected:** Remington illustrations appear visibly aged/desaturated (warm sepia tone), route photos appear in full color -- the visual register difference is immediately apparent
**Why human:** CSS filter rendering varies slightly by browser; subjective "clearly distinct" threshold requires a human judgment call

#### 3. Pull Quote Visual Breakout

**Test:** View the HiawathaExplainer section and find the Longfellow critique blockquote
**Expected:** The blockquote visually breaks out beyond the prose text column width, has a dark forest-950 background distinguishable from the surrounding section, shows a large gold quotation mark in the upper-left, and the ShieldMotif ornament appears below the quote text
**Why human:** Layout breakout behavior depends on the actual rendered widths of max-w-prose vs max-width: 48rem in context; overflow behavior on narrow viewports needs human check

### Gaps Summary

One gap blocks full achievement of SC#5: zero `stravaId` values are populated in the SEGMENTS array, so no Strava segment links render anywhere on the page. The plan for 20-03 explicitly deferred this to "user provides IDs later" -- the conditional rendering mechanism, CSS, and external link structure are all correctly implemented. The ROADMAP success criterion requires "a Strava segment link" to exist per segment, which currently it does not.

The gap is narrow in scope: adding even one `stravaId` value (e.g., an actual Strava segment ID for the 520 segment) would make the mechanism demonstrably functional. All 7 links would need IDs for full compliance with SC#5.

All other success criteria are fully verified in the codebase with no stubs, placeholders, or broken wiring. The editorial character of the components -- National Park subheadings, sepia historical imagery, pull quote treatment, and expanded segment prose -- is substantively implemented and wired into the live page.

---

_Verified: 2026-04-01T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
