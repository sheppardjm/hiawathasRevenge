---
phase: 52-og-image-redesign
verified: 2026-04-09T22:00:00Z
status: human_needed
score: 4/4 must-haves verified (automated)
human_verification:
  - test: "View og-card.jpg at thumbnail size (300x158px)"
    expected: "Shield badge, tagline 'A 100-Mile Gravel Ride Through the Hiawatha', and 'June 6, 2026' are all legible — no text bleed, no unreadable overlap"
    why_human: "Text legibility at small render sizes requires visual inspection; grep cannot assess readability of rendered fonts at scale"
  - test: "Paste site URL into a social platform debug tool (e.g. https://developers.facebook.com/tools/debug/ or Twitter Card Validator)"
    expected: "Preview shows the branded card with shield badge, dimmed forest photo, tagline, and date — not a raw photo crop"
    why_human: "Platform caching and crawl behavior cannot be verified programmatically"
---

# Phase 52: OG Image Redesign Verification Report

**Phase Goal:** Sharing the site on iMessage, Slack, Facebook, X, or Discord shows a branded card with badge, tagline, and event date -- not a raw photo crop
**Verified:** 2026-04-09T22:00:00Z
**Status:** human_needed (all automated checks passed; 2 items require visual/platform confirmation)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | OG image displays shield badge, tagline, and "June 6, 2026" on dimmed forest photo background | VERIFIED | `public/og-card.jpg` exists (201,585 bytes, 1200x630 JPEG); script SVG composites black overlay at opacity 0.55, shield badge rect+path, tagline split across 2 text elements, amber date text |
| 2 | OG image uses filename `og-card.jpg` (not `og-image.jpg`) to bust social platform caches | VERIFIED | `public/og-card.jpg` created Apr 9 21:14; `public/og-image.jpg` still present but unreferenced in src/; no src/ or public/ file references old filename; BaseLayout.astro uses `og-card.jpg` exclusively |
| 3 | `og:image` meta tag in HTML source points to `https://hiawathasrevenge.com/og-card.jpg` | VERIFIED | `BaseLayout.astro` line 17: `const ogImageURL = new URL('/og-card.jpg', Astro.site)`; `astro.config.ts` line 5: `site: 'https://hiawathasrevenge.com'`; tag at line 75: `<meta property="og:image" content={ogImageURL.href} />`; twitter:image also wired at line 87 |
| 4 | Text on the OG image is legible at thumbnail rendering size (300x158px) | NEEDS HUMAN | Font sizes are 42px (tagline) and 46px (date) at 1200px canvas — approximately 10-11px at 300px render. NationalPark-Heavy and SpaceMono-Bold are embedded via base64 @font-face. Visual confirmation required. |

**Score:** 3/4 truths fully verified programmatically; truth 4 needs human

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `public/og-card.jpg` | Branded 1200x630 JPEG | VERIFIED | 201,585 bytes, 1200x630, JPEG format confirmed via sharp metadata |
| `scripts/generate-og-image.js` | Sharp composite pipeline outputting og-card.jpg | VERIFIED | 65 lines; references `og-card.jpg` as OUTPUT; contains full sharp pipeline: resize → extract → composite → toFile |
| `scripts/fonts/NationalPark-Heavy.otf` | National Park Heavy font for tagline rendering | VERIFIED | 19,836 bytes; loaded via readFileSync at line 15 and base64-encoded into SVG @font-face |
| `scripts/fonts/SpaceMono-Bold.ttf` | Space Mono Bold font for date text rendering | VERIFIED | 88,852 bytes; loaded via readFileSync at line 16 and base64-encoded into SVG @font-face |
| `src/layouts/BaseLayout.astro` | og:image meta tag pointing to og-card.jpg | VERIFIED | Line 17 constructs URL from `/og-card.jpg` + `Astro.site`; wired to og:image (line 75), twitter:image (line 87), and JSON-LD event image (line 59) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/generate-og-image.js` | `public/og-card.jpg` | sharp `.toFile(OUTPUT)` | WIRED | `OUTPUT = join(root, 'public/og-card.jpg')` at line 12; `.toFile(OUTPUT)` at line 62; actual file confirmed at 1200x630 |
| `scripts/generate-og-image.js` | `scripts/fonts/NationalPark-Heavy.otf` | `readFileSync` + base64 SVG @font-face | WIRED | Line 15 reads and encodes font; SVG @font-face embeds as data URI at lines 23-25; text elements use `font-family="NationalPark"` |
| `src/layouts/BaseLayout.astro` | `public/og-card.jpg` | `og:image` meta content URL | WIRED | `ogImageURL` constructed with `/og-card.jpg` and `Astro.site` (`https://hiawathasrevenge.com`); used in og:image, twitter:image, and schema.org image property |

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| Shield badge visible on OG card | SATISFIED | SVG overlay includes `<rect>` badge background and `<path>` amber shield; composited over hero photo |
| Tagline "A 100-Mile Gravel Ride Through the Hiawatha" on OG card | SATISFIED | Split across two `<text>` elements at y=278 and y=335 using NationalPark font |
| "June 6, 2026" date on OG card | SATISFIED | `<text>` at y=425, fill="#c8973e" (amber), SpaceMono Bold, 46px |
| New filename for cache busting | SATISFIED | `og-card.jpg` used throughout; no references to `og-image.jpg` in src/ |
| og:image meta tag wired to new URL | SATISFIED | BaseLayout.astro constructs absolute URL from Astro.site + `/og-card.jpg` |
| Text legibility at thumbnail size | NEEDS HUMAN | Font sizes mathematically scale to ~10-11px at 300px width; requires visual check |

### Anti-Patterns Found

None. No TODOs, FIXMEs, placeholders, empty handlers, or stub returns found in any phase artifact.

### Human Verification Required

#### 1. Thumbnail legibility check

**Test:** Open `public/og-card.jpg` in an image viewer and resize/view at approximately 300x158 pixels (25% of full size).
**Expected:** Shield badge is clearly visible; tagline "A 100-Mile Gravel Ride Through the Hiawatha" and date "June 6, 2026" are readable without squinting or overlap.
**Why human:** Text rendering at scale requires visual confirmation. At 300x render width, 42px type becomes roughly 10.5px — passable for bold fonts but needs eye confirmation.

#### 2. Social platform card preview

**Test:** Submit `https://hiawathasrevenge.com` to the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) or [Twitter Card Validator](https://cards-dev.twitter.com/validator) after the site is deployed.
**Expected:** Preview renders the branded card (shield, tagline, date on dimmed forest) rather than the old raw photo crop from `og-image.jpg`.
**Why human:** Platform caches can persist old images. The new filename `og-card.jpg` is the cache-busting mechanism, but platform crawl timing and cache eviction cannot be verified programmatically.

### Gaps Summary

No gaps. All automated must-haves are satisfied:

- `public/og-card.jpg` is a real 1200x630 JPEG (not a placeholder), generated by the sharp pipeline.
- The script reads both font files via `readFileSync`, base64-encodes them into SVG `@font-face` declarations, and composites the overlay over a dimmed hero crop.
- `BaseLayout.astro` constructs the absolute URL using `Astro.site` and wires it to `og:image`, `twitter:image`, and the JSON-LD Event image — three coverage points.
- The old `og-image.jpg` still exists in `public/` (harmless — it is a static asset not referenced by any page) but no source files reference it.
- Two items require human eyes: text legibility at thumbnail scale, and live platform cache verification post-deploy.

---

_Verified: 2026-04-09T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
