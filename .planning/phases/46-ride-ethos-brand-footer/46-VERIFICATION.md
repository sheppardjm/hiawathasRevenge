---
phase: 46-ride-ethos-brand-footer
verified: 2026-04-07T00:00:00Z
status: passed
score: 5/5 must-haves verified
---

# Phase 46: Ride Ethos & Brand Footer Verification Report

**Phase Goal:** Visitors immediately understand what kind of ride Hiawatha's Revenge is and see brand attribution at the bottom of the page.
**Verified:** 2026-04-07
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Ethos section with four kicker statements appears between StickyNav and gold DonateCallout | VERIFIED | index.astro lines 26-33: `<StickyNav />` then `<RideEthos />` then `<section class="gold-section">` |
| 2 | Ethos statement uses display font at large size with amber-500 color — visually distinct from body prose | VERIFIED | RideEthos.astro: `.ethos-value` uses `var(--font-display)`, `var(--font-size-2xl)`, `var(--color-amber-500)`; label uses `var(--font-mono)`, `var(--font-size-xs)` |
| 3 | "Powered by Neucadia" footer line with inline logo at very bottom of every page | VERIFIED | BaseLayout.astro line 115: `<NeucadiaFooter />` placed after `</main>`, before `</body>` |
| 4 | Neucadia logo served from local `/images/neucadia-logo.png` with explicit width/height | VERIFIED | NeucadiaFooter.astro: `src="/images/neucadia-logo.png"`, `width="142"`, `height="21"`; file exists at `public/images/neucadia-logo.png` (5,243 bytes) |
| 5 | Neucadia logo links to neucadia.com in new tab with rel="noopener noreferrer" | VERIFIED | NeucadiaFooter.astro: `href="https://neucadia.com"`, `target="_blank"`, `rel="noopener noreferrer"` |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/RideEthos.astro` | Compact declarative ethos with four kicker items | VERIFIED | 89 lines (min 40); four `ethos-item` entries with Since 2014, Always Free, Fellowship, All Levels |
| `src/components/NeucadiaFooter.astro` | Footer with Powered by text and local logo | VERIFIED | 74 lines (min 30); full implementation with logo, link, styles |
| `public/images/neucadia-logo.png` | Local copy of Neucadia wordmark (283x42 RGBA PNG) | VERIFIED | File exists, 5,243 bytes |
| `src/pages/index.astro` | RideEthos wired between StickyNav and gold-section | VERIFIED | Import at line 19, placement at lines 26-27, gold-section at line 29 |
| `src/layouts/BaseLayout.astro` | NeucadiaFooter placed after `</main>` as body-level footer | VERIFIED | Import at line 4, placement at line 115 immediately after `</main>` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/pages/index.astro` | `src/components/RideEthos.astro` | Astro import + placement after StickyNav, before gold-section | WIRED | `import RideEthos` at line 19; `<RideEthos />` at line 27 between StickyNav (26) and gold-section (29) |
| `src/layouts/BaseLayout.astro` | `src/components/NeucadiaFooter.astro` | Astro import + placement after `</main>` | WIRED | `import NeucadiaFooter` at line 4; `<NeucadiaFooter />` at line 115 after `</main>` |
| `src/components/NeucadiaFooter.astro` | `public/images/neucadia-logo.png` | `img src` referencing local asset | WIRED | `src="/images/neucadia-logo.png"` confirmed; file exists in `public/images/` |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| Ethos statement appears before first content section (above MBTN donate callout) | SATISFIED | — |
| Ethos communicates founding date, free participation, fellowship, all-levels welcome | SATISFIED | Four kicker items confirmed: Since 2014, Always Free, Fellowship, All Levels |
| Ethos visually distinct from body prose — larger, differently styled, not a paragraph | SATISFIED | Display font 2xl amber-500 vs mono xs cream-200 |
| "Powered by Neucadia" footer on every page | SATISFIED | Placed in BaseLayout.astro which wraps every page |
| Neucadia logo from local asset with no layout shift | SATISFIED | Local PNG with explicit width=142 height=21 |

### Anti-Patterns Found

None. No TODO, FIXME, placeholder, or stub patterns found in either component.

### Human Verification Required

#### 1. Ethos Visual Appearance

**Test:** Load the homepage. Scroll past the hero video to the sticky nav area.
**Expected:** Four kicker stats (Since 2014 / Always Free / Fellowship / All Levels) appear in a dark forest-900 band with large amber uppercase labels and small mono sub-labels — visually distinct from the gold section below and the body text elsewhere.
**Why human:** Font rendering, color contrast, and overall visual hierarchy cannot be verified programmatically.

#### 2. Neucadia Footer Logo Rendering

**Test:** Scroll to the very bottom of any page. Observe the footer band.
**Expected:** "Powered by" text appears alongside the Neucadia wordmark logo image. Clicking/tapping the footer link opens neucadia.com in a new tab.
**Why human:** Image rendering (whether the PNG actually displays, not a broken img tag), and new-tab behavior require a browser.

### Gaps Summary

No gaps. All five truths verified, all five artifacts substantive and wired, all three key links confirmed. Phase goal achieved.

---

_Verified: 2026-04-07_
_Verifier: Claude (gsd-verifier)_
