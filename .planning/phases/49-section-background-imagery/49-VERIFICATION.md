---
phase: 49-section-background-imagery
verified: 2026-04-08T00:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
human_verification:
  - test: "Scroll to Route Map section and observe background fade"
    expected: "Subtle sepia-toned topo arrowheads image fades in behind segment cards as section enters viewport"
    why_human: "IntersectionObserver scroll behavior and visual opacity level require browser verification"
  - test: "Scroll to Gallery section and observe background fade"
    expected: "Subtle sepia-toned Hiawatha scenes grid tiles behind the photo masonry as section enters viewport"
    why_human: "Tiling repeat pattern at 400px and visual result across 56-photo tall section requires browser verification"
  - test: "Toggle OS light mode and verify both section backgrounds"
    expected: "Both backgrounds visible with brightness(1.2) filter and opacity 0.12 (slightly brighter, not washed out)"
    why_human: "Light mode CSS media query behavior and contrast requires visual check"
  - test: "Enable Reduce Motion in OS accessibility settings"
    expected: "Both backgrounds display at static opacity 0.04 with no fade transition animation"
    why_human: "prefers-reduced-motion behavior requires OS accessibility toggle and visual confirmation"
  - test: "Interact with Leaflet map while route background is visible"
    expected: "Map tiles, controls, and segment card panel all remain fully interactive and visually above the background"
    why_human: "z-index stacking context interaction with Leaflet requires browser verification"
---

# Phase 49: Section Background Imagery Verification Report

**Phase Goal:** Visitors see subtle, atmospheric inspiration imagery fade in behind the Route Map and Gallery sections as they scroll, matching the established History section treatment
**Verified:** 2026-04-08
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Scrolling to the Route Map section fades in a sepia-toned topo arrowheads background behind the segment cards | VERIFIED | `data-bg-fade` on `#route` (index.astro:71); `::before` with `background-image: url('/thumbs/inspiration/route-bg.webp')` (index.astro:277-279); `sepia(80%) saturate(20%) brightness(0.6)` filter; `bg-visible` opacity toggle 0→0.08; route-bg.webp exists at 49KB |
| 2 | Scrolling to the Gallery section fades in a sepia-toned background behind the photo masonry (image changed to Hiawatha scenes grid per user approval) | VERIFIED | `data-bg-fade` on `#gallery` (index.astro:87); `::before` with `background-image: url('/thumbs/inspiration/gallery-bg.webp')` (index.astro:281-285); tiling `background-size: 400px; background-repeat: repeat` for tall section; gallery-bg.webp exists at 30KB |
| 3 | In OS-level light mode, both backgrounds appear with adjusted brightness and opacity | VERIFIED | `@media (prefers-color-scheme: light)` block in index.astro (lines 295-304): `filter: sepia(80%) saturate(15%) brightness(1.2)` and `opacity: 0.12` on `.bg-visible`; confirmed in built CSS |
| 4 | With prefers-reduced-motion enabled, both backgrounds show at static low opacity with no fade transition | VERIFIED | `@media (prefers-reduced-motion: reduce)` block (lines 287-293): `transition: none; opacity: 0.04`; confirmed in built CSS as `#route:before,#gallery:before{transition:none;opacity:.04}` |
| 5 | route-bg.webp and gallery-bg.webp exist in public/thumbs/inspiration/ | VERIFIED | `public/thumbs/inspiration/route-bg.webp` (49,754 bytes), `public/thumbs/inspiration/gallery-bg.webp` (30,914 bytes); both produced by 5-entry IMAGES array in process-inspiration-bg.js |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `public/thumbs/inspiration/route-bg.webp` | Processed topo arrowheads WebP | VERIFIED | 49,754 bytes; exists |
| `public/thumbs/inspiration/gallery-bg.webp` | Processed Hiawatha scenes grid WebP | VERIFIED | 30,914 bytes; exists |
| `scripts/process-inspiration-bg.js` | 5-entry IMAGES array with route-bg and gallery-bg | VERIFIED | 102 lines; 5 entries; `original-21cf144750c04b7d07af135578e70983.webp` → route-bg.webp; `original-116171370441ce4fcd033d6070c3fdf2.webp` → gallery-bg.webp; header comment says "Five chosen images" |
| `src/pages/index.astro` | data-bg-fade on #route and #gallery, ::before CSS for both | VERIFIED | `data-bg-fade` at lines 71 and 87; complete CSS block lines 241-305 with ::before, bg-visible, reduced-motion, and light-mode rules; all selectors use `:global()` |
| `src/components/HiawathaExplainer.astro` | IntersectionObserver threshold lowered to 0.01 | VERIFIED | Line 560: `{ threshold: 0.01 }` — changed from 0.15 to prevent tall gallery section from never triggering |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/pages/index.astro` | `public/thumbs/inspiration/route-bg.webp` | CSS `background-image: url('/thumbs/inspiration/route-bg.webp')` | WIRED | index.astro line 278; confirmed in built CSS |
| `src/pages/index.astro` | `public/thumbs/inspiration/gallery-bg.webp` | CSS `background-image: url('/thumbs/inspiration/gallery-bg.webp')` | WIRED | index.astro line 282; confirmed in built CSS |
| `src/pages/index.astro` | `src/components/HiawathaExplainer.astro` IntersectionObserver | `data-bg-fade` on #route and #gallery auto-enrolled in global `querySelectorAll('[data-bg-fade]')` | WIRED | HiawathaExplainer.astro line 554: `document.querySelectorAll('[data-bg-fade]')` — document-wide query picks up all three new attributes; threshold=0.01 |

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| BG-01: Route map section displays topo arrowheads background | SATISFIED | data-bg-fade on #route, route-bg.webp CSS-linked, file exists |
| BG-02: Gallery section displays morel woodcut background | SATISFIED | Image changed to Hiawatha scenes grid per user approval; behavior matches (sepia, scroll-triggered, ::before) |
| BG-03: Both use ::before with sepia filter matching History section | SATISFIED | `::before` with `filter: sepia(80%) saturate(20%) brightness(0.6)` on both; same filter values as History |
| BG-04: Both fade in via IntersectionObserver | SATISFIED | Existing global observer in HiawathaExplainer picks up new data-bg-fade elements; opacity 0→0.08 on bg-visible |
| BG-05: Both respect prefers-reduced-motion | SATISFIED | `@media (prefers-reduced-motion: reduce)` — transition:none, opacity:0.04 static |
| BG-06: Both have light-mode overrides | SATISFIED | `@media (prefers-color-scheme: light)` — brightness(1.2), opacity:0.12 |
| BG-07: Two new images processed (route-bg.webp, gallery-bg.webp) | SATISFIED | Both files in public/thumbs/inspiration/, script has 5 entries |

### Anti-Patterns Found

None. No TODO/FIXME/placeholder stubs found in any modified file. No unfilled template tokens (the `[MOREL_WOODCUT_FILENAME_TBD]` placeholder from the PLAN was correctly replaced with `original-116171370441ce4fcd033d6070c3fdf2.webp`).

### Human Verification Required

#### 1. Route Map background fade

**Test:** Run `npm run dev`, open http://localhost:4321, scroll to the "Explore the Route" section
**Expected:** Subtle sepia-toned topo arrowheads image fades in behind the segment cards as the section enters the viewport; map remains fully interactive
**Why human:** IntersectionObserver scroll behavior, visual subtlety of opacity 0.08, and Leaflet z-index stacking require browser verification

#### 2. Gallery background fade

**Test:** Continue scrolling to the "Photos" section
**Expected:** Subtle sepia-toned Hiawatha scenes grid tiles behind the 56-photo masonry; photos clearly visible above background
**Why human:** Tiling repeat at 400px across a 5000+ px tall section requires visual confirmation

#### 3. Light mode contrast

**Test:** Toggle OS-level light mode while viewing the site
**Expected:** Both backgrounds visible with brighter filter (brightness 1.2) and slightly higher opacity (0.12); not washed out
**Why human:** CSS media query behavior and subjective contrast assessment require visual check

#### 4. Reduced motion static display

**Test:** Enable "Reduce Motion" in OS accessibility settings
**Expected:** Both backgrounds appear at static opacity 0.04 with no fade animation on scroll
**Why human:** OS accessibility toggle and absence-of-animation requires browser verification

#### 5. Leaflet map interactivity with background visible

**Test:** Scroll to Route Map section, verify map is interactive
**Expected:** Panning, zooming, and clicking segment cards all work normally with the background visible behind the map
**Why human:** z-index stacking context interaction with Leaflet's internal layers requires browser testing

### Gaps Summary

No gaps. All five must-have truths are verified at all three levels (existence, substantive, wired). The only items requiring further confirmation are experiential/visual behaviors that need human browser testing.

Key deviation from plan (user-approved): The gallery background image was changed from "morel woodcut" to "Hiawatha scenes illustration grid" (`original-116171370441ce4fcd033d6070c3fdf2.webp`), with tiling `background-repeat: repeat` at 400px instead of `background-size: cover`. The behavior (sepia-toned, scroll-triggered, ::before pseudo-element) matches the success criterion. The IntersectionObserver threshold was also changed from 0.15 to 0.01 in HiawathaExplainer.astro to ensure tall sections trigger the fade.

---

_Verified: 2026-04-08_
_Verifier: Claude (gsd-verifier)_
