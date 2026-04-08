---
phase: 44-tech-debt-cleanup
verified: 2026-04-07T20:00:00Z
status: passed
score: 9/9 must-haves verified
re_verification:
  previous_status: passed
  previous_score: 4/4
  gaps_closed:
    - "Each segment card displays exactly one photo"
    - "The displayed photo is the one the user chose for that segment"
    - "Doe Lake segment shows a photo (user provides path if default is wrong)"
    - "Gallery page still shows all photos unchanged"
    - "segments.json has cardPhoto field on every segment object"
    - "RouteExplainer.astro has single image rendering per segment card"
  gaps_remaining: []
  regressions: []
---

# Phase 44: Tech Debt Cleanup — Verification Report

**Phase Goal:** Clean up minor tech debt from v1.7 — dead files, stale comments, incorrect CLS placeholder, and revert segment cards to single user-chosen hero photo
**Verified:** 2026-04-07
**Status:** passed
**Re-verification:** Yes — after gap closure (44-02 added single-photo segment card work not covered in initial 44-01 verification)

## Goal Achievement

### Observable Truths

| #  | Truth                                                                      | Status     | Evidence                                                                                      |
|----|----------------------------------------------------------------------------|------------|-----------------------------------------------------------------------------------------------|
| 1  | No surface-points.json files exist in public/data/                         | VERIFIED   | find returns nothing; zero results across all subdirectories                                  |
| 2  | RouteMap.astro has no "surface-points" comment reference                   | VERIFIED   | grep -c returns 0                                                                             |
| 3  | RouteMap.astro has no "jump link" comment reference                        | VERIFIED   | grep -c returns 0                                                                             |
| 4  | Photo 486608604 gets landscape dimensions from parseDims (not portrait)    | VERIFIED   | filename suffix -2048x1536 → parseDims yields {w:2048, h:1536}; landscape confirmed           |
| 5  | Each segment card displays exactly one photo                               | VERIFIED   | Single `<img>` block with `{seg.cardPhoto && (` — no photos.map or multi-photo iteration      |
| 6  | The displayed photo is the one the user chose for that segment             | VERIFIED   | All 7 segments have user-selected cardPhoto paths; user approved via checkpoint in 44-02       |
| 7  | Doe Lake segment shows a photo                                             | VERIFIED   | /images/75fe7837-fb1c-477a-a42c-2db3fbb5baad.jpg set as cardPhoto; file exists on disk        |
| 8  | Gallery page still shows all photos unchanged                              | VERIFIED   | PhotoGallery.astro has 0 cardPhoto references; untouched by 44-02                             |
| 9  | segments.json has cardPhoto field on every segment object                  | VERIFIED   | grep -c "cardPhoto" returns 7; all 7 segment objects confirmed in file                        |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact                                    | Expected                                           | Status    | Details                                                                            |
|---------------------------------------------|----------------------------------------------------|-----------|------------------------------------------------------------------------------------|
| `src/components/segments.json`              | cardPhoto field on all 7 segment objects           | VERIFIED  | 7 cardPhoto fields; paths point to /images/ JPGs; all files exist on disk          |
| `src/components/RouteExplainer.astro`       | Single img per segment card using cardPhoto        | VERIFIED  | 221 lines; one `<img>` block gated on `seg.cardPhoto`; no photos.map iteration     |
| `src/components/RouteExplainer.astro`       | .segment-hero-photo CSS, no .segment-photo-grid   | VERIFIED  | 2 segment-hero-photo references (class + CSS); 0 segment-photo-grid references     |
| `src/components/PhotoGallery.astro`         | Unchanged — no cardPhoto reference                 | VERIFIED  | 149 lines; 0 cardPhoto references; gallery rendering untouched                     |
| `src/components/RouteMap.astro`             | No stale comment references                        | VERIFIED  | 0 "surface-points" refs; 0 "jump link" refs                                        |
| `public/data/photos.json`                   | 486608604 entry uses -2048x1536 filename           | VERIFIED  | Confirmed in 44-01; filename, thumb both carry -2048x1536 suffix                   |
| `public/images/75fe7837-...baad.jpg`        | Doe Lake photo exists on disk                      | VERIFIED  | File exists at public/images/75fe7837-fb1c-477a-a42c-2db3fbb5baad.jpg             |
| All 7 cardPhoto image files                 | /images/ JPG exists for each segment               | VERIFIED  | All 7 files confirmed present on disk (not just referenced in JSON)                |

### Key Link Verification

| From                               | To                                        | Via                       | Status    | Details                                                                      |
|------------------------------------|-------------------------------------------|---------------------------|-----------|------------------------------------------------------------------------------|
| `segments.json` cardPhoto          | `RouteExplainer.astro` img src            | `seg.cardPhoto` spread    | VERIFIED  | `...seg` spread carries cardPhoto; `src={seg.cardPhoto}` directly wired      |
| `segments.json` cardPhoto          | `parseDims()` in RouteExplainer           | filename regex -WxH       | VERIFIED  | `width={parseDims(seg.cardPhoto).w}` and height; fallback 1536x2048 for Doe Lake |
| `public/images/` files             | `segments.json` cardPhoto paths           | /images/ path strings     | VERIFIED  | All 7 referenced JPGs exist on disk                                          |
| `public/data/photos.json`          | `public/images/486608604_...-2048x1536.jpg` | filename field            | VERIFIED  | parseDims reads -2048x1536 → landscape (w:2048 > h:1536)                     |
| `PhotoGallery.astro`               | (unchanged)                               | no cardPhoto reference    | VERIFIED  | Gallery shows all photos; not modified in 44-02                              |

### Requirements Coverage

| Requirement                                           | Status    | Notes                                                                  |
|-------------------------------------------------------|-----------|------------------------------------------------------------------------|
| Remove dead surface-points.json files                 | SATISFIED | Files absent; pipeline step removed in 44-01                           |
| Remove stale "surface-points" comment in RouteMap     | SATISFIED | 0 matches in RouteMap.astro                                            |
| Remove stale "jump link" comment in RouteMap          | SATISFIED | 0 matches in RouteMap.astro                                            |
| Fix CLS placeholder for landscape photo 486608604     | SATISFIED | -2048x1536 suffix → parseDims → landscape dimensions                   |
| Each segment card displays exactly one user-chosen photo | SATISFIED | Single img block; 7 user-selected cardPhoto values; no multi-photo grid |
| Doe Lake has a photo                                  | SATISFIED | User-provided 75fe7837 image; file exists on disk                      |
| Gallery page unchanged                                | SATISFIED | PhotoGallery.astro unmodified; 0 cardPhoto refs                        |

### Anti-Patterns Found

None. No TODOs, FIXMEs, placeholders, stub patterns, or empty implementations found in modified files.

### Human Verification Required

The following items pass all automated checks but can only be confirmed visually:

1. **Segment card single-photo display**
   Test: Load the site and scroll to "The Route, Segment by Segment". Each of the 7 cards should show exactly one photo above the card text body.
   Expected: One image per card, not a grid of multiple images.
   Why human: HTML rendering and visual layout cannot be verified by static analysis.

2. **Doe Lake photo quality**
   Test: Verify the Doe Lake card shows the user-provided 75fe7837 image and it looks correct (not corrupted or wrong image).
   Expected: A recognizable Doe Lake area photo filling the card header.
   Why human: Image content and quality requires visual inspection.

3. **Portrait image max-height capping**
   Test: Portrait-oriented cards (NF2266, Bass Lake Rd, NF2217-2218, ND2225, Ridge Rd) should not be excessively tall. CSS max-height: 400px clips the image to prevent dominating the layout.
   Expected: Portrait images display at reasonable height, cropped with object-fit: cover.
   Why human: CSS rendering requires browser inspection.

4. **CLS placeholder visual check (from 44-01)**
   Test: Load the gallery page and inspect the anchor wrapping photo 486608604 for data-pswp-width="2048" and data-pswp-height="1536".
   Expected: Landscape placeholder; no portrait-shaped flash before image loads.
   Why human: CLS behavior requires browser observation.

### Gaps Summary

No gaps. All 9 must-haves are fully satisfied.

The initial 44-VERIFICATION.md (covering 44-01) passed 4/4 truths but was scoped only to dead-file removal and the CLS placeholder fix. The UAT then surfaced a major gap: segment cards were rendering a multi-photo grid from Phase 43, not a single hero image. This was addressed in 44-02 (gap closure plan). The current verification covers the full phase 44 goal including all 44-02 changes.

Specific confirmations:
- `src/components/segments.json` has `cardPhoto` on all 7 segments, pointing to user-selected full-resolution JPGs in `/images/`.
- `src/components/RouteExplainer.astro` renders exactly one `<img>` per segment card, gated on `{seg.cardPhoto && (`. No `photos.map` or multi-photo grid iteration exists anywhere in the template.
- `.segment-photo-grid` CSS class is fully absent (0 matches). `.segment-hero-photo` appears twice (JSX class and CSS rule).
- All 7 referenced image files exist on disk at `public/images/`.
- Doe Lake uses `75fe7837-fb1c-477a-a42c-2db3fbb5baad.jpg` — a user-provided image not in the pipeline manifest; file confirmed present.
- `PhotoGallery.astro` is untouched; gallery continues to show all photos.
- The four 44-01 truths (surface-points removal, comment cleanup, CLS fix) remain verified with 0 regressions.

---

_Verified: 2026-04-07_
_Verifier: Claude (gsd-verifier)_
