---
phase: 27-audit-gap-closure
verified: 2026-04-02T22:55:11Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Phase 27: Audit Gap Closure Verification Report

**Phase Goal:** Close the two requirement gaps found by the v1.3 milestone audit — EB Garamond font not loading (VIS-02) and panel backdrop close affordance (MAP-08) — plus clean up associated tech debt in RouteMap.astro.
**Verified:** 2026-04-02T22:55:11Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | EB Garamond font loads and `::first-letter` drop-caps render in EB Garamond (not system serif) | VERIFIED | `<Font cssVariable="--font-garamond" />` at BaseLayout.astro line 26 (no preload); CSS variable consumed in HiawathaExplainer.astro lines 382 and 393 inside `::first-letter` rules; astro.config.ts declares `--font-garamond` with Google Fonts provider |
| 2 | Panel click-outside behavior is documented as intentional trade-off (map stays interactive) | VERIFIED | RouteMap.astro lines 539–543 contain the full 5-line trade-off comment explicitly stating "deliberate trade-off for choosing show() over showModal()" |
| 3 | NF2217-2218 name is consistent between sector-details.json and RouteExplainer.astro SEGMENTS | VERIFIED | `sector-details.json` line 34: `"name": "NF2217-2218"`; RouteExplainer.astro line 21: `{ name: 'NF2217-2218', ...}` and line 39: `'NF2217-2218': 'sector-nf2217'` jump-link key |
| 4 | No stale comments or dead CSS remain in RouteMap.astro | VERIFIED | `::backdrop` block absent (grep returns no matches); `Plan 25-02` string absent; `minimal content` string absent; updated comment at line 477 reads "stars, meta, sparkline, description, strava link, jump link" |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/layouts/BaseLayout.astro` | EB Garamond Font component tag | VERIFIED | Line 26: `<Font cssVariable="--font-garamond" />` — no preload (correct: drop-cap is below fold). Space Mono and National Park retain preload. File: 47 lines, well-formed. |
| `public/data/sector-details.json` | Consistent NF2217-2218 sector name | VERIFIED | Line 34: `"name": "NF2217-2218"` inside `"id": "sector-nf2217"` object. 71 lines, substantive data file. |
| `src/components/RouteMap.astro` | Clean tech debt — no ::backdrop, no stale comment, documented MAP-08 trade-off | VERIFIED | 708 lines. `::backdrop` CSS entirely absent. `Plan 25-02` entirely absent. Trade-off documented at lines 539–543. Stale comment at former line 482 replaced with accurate description at line 477. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/layouts/BaseLayout.astro` | `astro.config.ts` fonts[] array | `Font cssVariable="--font-garamond"` matches config `cssVariable: '--font-garamond'` | WIRED | astro.config.ts lines 22–27 declare EB Garamond with `--font-garamond`; BaseLayout.astro line 26 emits the matching Font tag |
| `src/layouts/BaseLayout.astro` | `src/components/HiawathaExplainer.astro` | CSS variable `var(--font-garamond)` in `::first-letter` rules | WIRED | HiawathaExplainer.astro lines 382 and 393 consume `var(--font-garamond, 'EB Garamond', serif)` in `.drop-cap::first-letter` and `.pull-quote p::first-letter` |
| `public/data/sector-details.json` | `src/components/RouteExplainer.astro` SEGMENTS const | NF2217-2218 name matches in both locations | WIRED | sector-details.json `"name": "NF2217-2218"` matches RouteExplainer.astro SEGMENTS `name: 'NF2217-2218'` and jump-link key `'NF2217-2218': 'sector-nf2217'` |

---

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| VIS-02: Drop-cap in EB Garamond | SATISFIED | Font tag wired; CSS variable consumed in two drop-cap rules |
| MAP-08: Panel close affordance | SATISFIED | Documented as deliberate trade-off per success criteria: "OR a documented decision exists that this affordance is intentionally omitted in favor of map interactivity" — that decision is now documented inline |

REQUIREMENTS.md also reflects both as `[x]` complete (MAP-08 line 19, VIS-02 line 30).

---

### Anti-Patterns Found

| File | Pattern | Severity | Finding |
|------|---------|----------|---------|
| All three modified files | TODO/FIXME/placeholder | — | None found |
| `src/layouts/BaseLayout.astro` | Stale comments | — | None found |
| `src/components/RouteMap.astro` | Dead CSS / stale forward-reference comments | — | None found; all targeted patterns fully removed |
| `src/layouts/BaseLayout.astro` | Extra `preload` on Garamond | — | None found; only Space Mono and National Park have `preload` (2 preload tags, correct) |

No blockers. No warnings.

---

### Human Verification Required

One item cannot be verified programmatically:

**1. EB Garamond drop-cap visual rendering**

**Test:** Open the live site (or run `npx astro dev`) and scroll to a section in HiawathaExplainer.astro that uses the `.drop-cap` class. Inspect the `::first-letter` pseudo-element in DevTools.
**Expected:** The first letter renders in EB Garamond (serif, with characteristic oldstyle proportions) rather than a system serif fallback. DevTools Computed panel for `::first-letter` should show `font-family: "EB Garamond"` resolved.
**Why human:** Font rendering cannot be verified by static code analysis — only confirms the wiring is correct. The font loads asynchronously; a browser is needed to confirm the Google Fonts CDN request succeeds and the typeface visually applies.

This is a low-risk visual confirmation. The structural wiring (config, Font tag, CSS variable) is fully verified.

---

### Gaps Summary

No gaps. All four must-have truths are structurally verified:

- VIS-02: Three-layer chain confirmed — astro.config.ts declares the font, BaseLayout.astro emits the Font tag (without inappropriate preload), HiawathaExplainer.astro consumes the CSS variable in both drop-cap pseudo-element rules.
- MAP-08: The trade-off decision (show() vs showModal(), map interactivity preserved) is documented inline at the click-outside event listener with a 5-line comment that meets the success criteria's "documented decision" threshold.
- NF2217-2218 consistency: Both the JSON data source and the TypeScript SEGMENTS const use the identical canonical name; the jump-link mapping key matches.
- Tech debt: Dead `::backdrop` CSS is gone (grep returns no matches), stale forward-reference comment is gone (grep returns no matches), updated comment accurately describes the implemented buildPanelBody content.

---

_Verified: 2026-04-02T22:55:11Z_
_Verifier: Claude (gsd-verifier)_
