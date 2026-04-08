---
phase: 47-history-light-dark-mode
verified: 2026-04-08T00:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification:
  previous_status: passed
  previous_score: 5/5
  gaps_closed: []
  gaps_remaining: []
  regressions:
    - "Previous verification referenced Remington paintings at /thumbs/historical/; plan 47-03 replaced these with Ojibwe inspiration images at /thumbs/inspiration/. Previous verification was stale on this detail but the underlying truth (desaturated background images exist and are wired) still holds."
---

# Phase 47: History Light/Dark Mode Verification Report

**Phase Goal:** The History section is readable and visually rich in both light and dark OS color scheme preferences, with inspiration images fading in as the user scrolls.
**Verified:** 2026-04-08T00:00:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure plans 47-02 (CSS source order) and 47-03 (Ojibwe inspiration images)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Light mode: cream/off-white background + dark text; dark mode: forest-950/white unchanged | VERIFIED | Default `.hiawatha-section { background-color: var(--color-forest-950) }` at line 147. Light-mode block (line 472, last in file) sets `background-color: var(--color-cream-100)`. Paragraph color: default `cream-100` at line 283, overridden to `forest-900` at line 503. Source order is correct — light-mode block is last. |
| 2 | Desaturated inspiration images appear as faded background layers in both modes | VERIFIED | `::before` system at lines 226-245: `position: absolute; top:0; bottom:0; left:50%; width:100vw; transform:translateX(-50%)` for full-bleed. Dark filter: `sepia(80%) saturate(20%) brightness(0.6)`. Light filter at line 538: `sepia(80%) saturate(15%) brightness(1.2)`. All 3 image files exist at `/public/thumbs/inspiration/poem-bg.webp` (381KB), `forest-bg.webp` (237KB), `ride-bg.webp` (10KB). |
| 3 | Images fade in when subsection scrolls into view, fade out when it leaves | VERIFIED | `data-bg-fade` on all 3 subsection divs (lines 17, 84, 123). IntersectionObserver at lines 549-559 queries `[data-bg-fade]`, calls `classList.toggle('bg-visible', entry.isIntersecting)`. CSS at line 243: `.subsection-bg.bg-visible::before { opacity: 0.08 }` with `transition: opacity 0.6s ease` (line 237). Light-mode override at line 541: `opacity: 0.12`. |
| 4 | All heading text in History section passes WCAG AA contrast in light mode | VERIFIED | Light-mode heading colors against cream-100 (#f5f0e8): h2 forest-900 (#1a2e1a) ≈ 12.8:1; h3 amber → rust-600 (#8b4513) ≈ 6.3:1; h3 turquoise → turquoise-700 (#0f766e) ≈ 4.8:1; h3 sun → rust-600 ≈ 6.3:1; h3 scarlet → scarlet-700 (#b91c1c) ≈ 5.7:1. All exceed 4.5:1 WCAG AA. |
| 5 | prefers-reduced-motion disables scroll-triggered fade animations | VERIFIED | CSS at lines 260-265: `@media (prefers-reduced-motion: reduce) { .subsection-bg::before { transition: none; opacity: 0.04; } }` — images static at low opacity, no transition. JS guard at line 549: entire IntersectionObserver setup is inside `if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)` — no class toggling occurs under reduced-motion. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/HiawathaExplainer.astro` | Light/dark CSS, ::before background image system, IntersectionObserver, reduced-motion guard | VERIFIED | 560 lines. Imports: used at `src/pages/index.astro` line 15+37. No stubs/TODOs. All 5 CSS subsystems present in correct cascade order. |
| `public/thumbs/inspiration/poem-bg.webp` | Ojibwe inspiration image for poem section | VERIFIED | Exists, 381KB WebP |
| `public/thumbs/inspiration/forest-bg.webp` | Ojibwe inspiration image for forest section | VERIFIED | Exists, 237KB WebP |
| `public/thumbs/inspiration/ride-bg.webp` | Ojibwe inspiration image for ride section | VERIFIED | Exists, 10KB WebP |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `[data-bg-fade]` divs (3x) | `bg-visible` class | IntersectionObserver `classList.toggle` | WIRED | Lines 17/84/123 have `data-bg-fade`; observer at line 550 queries that selector; toggle at line 554 |
| `.subsection-bg.bg-visible::before` | `opacity: 0.08` | CSS selector | WIRED | Line 243-245 |
| `@media (prefers-color-scheme: light)` | All dark-mode defaults | CSS source order | WIRED | Light-mode block is last in file (line 472). Default `.editorial-grid p` cream-100 at line 281-284; override forest-900 at line 502-504 — source order correct |
| `@media (prefers-reduced-motion: reduce)` | `::before` transition | CSS cascade | WIRED | Reduced-motion block at lines 260-265, between default `::before` (line 226) and light-mode block (line 472) — correct order |
| JS reduced-motion guard | IntersectionObserver | `window.matchMedia().matches` check | WIRED | Lines 549-559: observer only created when `!matches` |
| `overflow: hidden` | `::before` full-bleed (100vw) | CSS on `.hiawatha-section` | WIRED | Line 149: `overflow: hidden` clips horizontal overflow from 100vw breakout |

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| MODE-01: Dark mode unchanged | SATISFIED | All dark rules are default; light-mode block is additive only |
| MODE-02: Light mode cream background | SATISFIED | `var(--color-cream-100)` = #f5f0e8 |
| MODE-03: Light mode dark text | SATISFIED | `var(--color-forest-900)` on paragraphs, headings in light block |
| MODE-04: WCAG AA heading contrast in light | SATISFIED | All 5 heading color pairs exceed 4.5:1 against cream-100 |
| MODE-05: Background inspiration images | SATISFIED | 3 Ojibwe WebPs at `/thumbs/inspiration/`, wired via `::before` |
| MODE-06: Desaturated filter | SATISFIED | `sepia(80%) saturate(20%)` dark; `sepia(80%) saturate(15%)` light |
| MODE-07: Scroll-triggered fade | SATISFIED | IntersectionObserver + `bg-visible` + `opacity: 0→0.08` transition |
| MODE-08: prefers-reduced-motion | SATISFIED | CSS `transition: none; opacity: 0.04` + JS observer skipped |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | No TODO/FIXME/placeholder/stub patterns found in HiawathaExplainer.astro |

### Human Verification Required

#### 1. Light Mode Visual Appearance

**Test:** In macOS System Preferences > Appearance, switch to Light. Open the site and scroll to the History section.
**Expected:** Cream/parchment background (#f5f0e8), dark forest-green body text, rust/turquoise/scarlet h3 accents. All text legible with good contrast.
**Why human:** OS-level media query can only be confirmed by toggling the real OS setting.

#### 2. Dark Mode Unchanged

**Test:** With OS in Dark mode, verify the History section looks identical to pre-phase appearance.
**Expected:** Dark forest-950 background, cream-100 body text, amber/turquoise/sun/scarlet h3 accents — no regression.
**Why human:** "Identical to before" requires visual comparison.

#### 3. Scroll-Triggered Background Fade

**Test:** In dark mode, scroll slowly into each of the three History subsections (Poem, Forest, Ride).
**Expected:** A very faint sepia/desaturated image texture fades in (opacity 0→0.08) behind each subsection as it crosses the 15% threshold; fades out when it leaves the viewport.
**Why human:** IntersectionObserver behavior requires a live browser with scroll interaction.

#### 4. Light Mode Background Images

**Test:** In light mode, repeat the scroll test above.
**Expected:** Background images fade to opacity 0.12 (slightly more visible than dark mode) with a lighter filter treatment.
**Why human:** Requires OS mode + scroll interaction in live browser.

#### 5. Reduced-Motion Static State

**Test:** In macOS Accessibility settings, enable "Reduce Motion". Reload the page and scroll to History.
**Expected:** Background images are statically visible at very low opacity (0.04) with no fade animation; scrolling produces no opacity changes.
**Why human:** Requires OS accessibility setting toggle and live browser observation.

### Re-Verification Notes

The previous VERIFICATION.md (2026-04-07) was written before plans 47-02 and 47-03 completed. It referenced "Remington paintings at `/thumbs/historical/`" which no longer exist — those paths were replaced by plan 47-03 with Ojibwe inspiration images at `/thumbs/inspiration/`. The structural verification status was already marked `passed`, and that result holds: the image system works the same way, just with different (corrected) source images.

Plan 47-02's CSS source order fix is confirmed: the light-mode `@media (prefers-color-scheme: light)` block is the last major block in the `<style>` tag (line 472 of 560), after all default rules and responsive breakpoints. Source order is now definitively correct.

### Gaps Summary

No gaps. All 5 must-haves verified structurally in the codebase:

- CSS cascade order is correct: default `::before` → reduced-motion override → light-mode block (last in file).
- All three subsections carry `data-bg-fade` and the IntersectionObserver queries that attribute.
- All three Ojibwe inspiration WebP files exist at the URLs referenced in CSS.
- `overflow: hidden` on `.hiawatha-section` clips the 100vw full-bleed breakout.
- All CSS custom properties (`--color-cream-100`, `--color-forest-900`, `--color-forest-800`, `--color-forest-700`, `--color-rust-600`, `--color-turquoise-700`, `--color-scarlet-700`) defined in `src/styles/global.css`.
- Component imported and rendered in `src/pages/index.astro`.
- No stub patterns, no TODOs, no empty implementations.
- 5 items require human browser verification (visual appearance, scroll behavior, OS mode switches) but all structural preconditions are in place.

---

_Verified: 2026-04-08T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
