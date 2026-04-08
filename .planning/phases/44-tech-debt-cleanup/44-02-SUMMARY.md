---
phase: 44-tech-debt-cleanup
plan: 02
subsystem: segment-cards
tags: [photos, segment-cards, RouteExplainer, cardPhoto, UAT-gap]

requires:
  - phase: 43-gallery-layout-polish
    provides: multi-photo grid that needs reverting
  - phase: 44-01
    provides: parseDims CLS placeholder fix
provides:
  - Single user-chosen hero photo per segment card
  - cardPhoto field in segments.json for user control
affects:
  - Segment card rendering in RouteExplainer.astro

tech-stack:
  added: []
  patterns:
    - "cardPhoto field in segments.json controls which photo displays per segment card"
    - "Full-res /images/ JPGs used for segment cards (not /thumbs/ WebP)"

key-files:
  created: []
  modified:
    - src/components/segments.json
    - src/components/RouteExplainer.astro
  deleted: []

key-decisions:
  - "Use full-res /images/ JPGs instead of 400px /thumbs/ WebP for segment card photos"
  - "User chose specific photos for each segment (not first-by-mileage defaults)"
  - "Doe Lake uses new image 75fe7837 not in original pipeline manifest"

patterns-established:
  - "cardPhoto paths point to /images/ for quality; thumbnails reserved for gallery grid"

duration: ~15min
completed: 2026-04-07
---

# Phase 44 Plan 02: Revert Segment Cards to Single Hero Photo

**Reverted multi-photo grid to single user-chosen hero image per segment card, using full-resolution images for quality.**

## Performance

- Duration: ~15 minutes (including user photo selection checkpoint)
- Tasks: 2/2 (1 auto + 1 checkpoint)
- Files modified: 2

## Accomplishments

1. **Added cardPhoto field to segments.json** — All 7 segments now have a `cardPhoto` field pointing to user-chosen full-resolution images.
2. **Replaced multi-photo grid with single hero image** — RouteExplainer.astro renders one `<img>` per card using `cardPhoto` instead of iterating all segment photos.
3. **Removed .segment-photo-grid CSS** — Replaced with `.segment-hero-photo` styling (max-height 400px, rounded top corners, object-fit cover).
4. **Upgraded to full-res images** — Switched from 400px WebP thumbnails to full-resolution JPGs after user reported grainy quality on laptop.
5. **User-selected photos** — User chose specific photos for each segment via checkpoint review.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add cardPhoto and update RouteExplainer | ddc0d28 | segments.json, RouteExplainer.astro |
| CP | User photo selection (5 segments changed) | 21bf96a | segments.json |
| CP | Full-res images + Doe Lake photo + final selections | 9ff5f2b | segments.json |

## User Photo Selections

| Segment | Photo | Source |
|---------|-------|--------|
| 520 | mile 2.1 (landscape) | `/images/486608604_*-2048x1536.jpg` |
| NF2266 | mile 9.1 (portrait) | `/images/OTV7i7V-*-1536x2048.jpg` |
| Bass Lake Rd | mile 25.6 (portrait) | `/images/3h0Nkl8d*-1536x2048.jpg` |
| NF2217-2218 | mile 40.7 (portrait) | `/images/JT-R1Q7L*-1536x2048.jpg` |
| ND2225 | mile 58.8 (portrait) | `/images/6b6Edbz*-1536x2048.jpg` |
| Doe Lake | user-provided | `/images/75fe7837-fb1c-477a-a42c-2db3fbb5baad.jpg` |
| Ridge Rd | mile 99.9 (portrait) | `/images/fh2Q9sS-*-1536x2048.jpg` |

## Decisions Made

1. **Full-res /images/ JPGs instead of /thumbs/ WebP** — User reported 400px thumbnails looked grainy when displayed at card width (~400-900px). Full-res JPGs provide crisp display.
2. **Doe Lake uses image outside pipeline manifest** — `75fe7837-fb1c-477a-a42c-2db3fbb5baad.jpg` was provided directly by user; not in photos-manifest.json.

## Deviations from Plan

### User-Directed Changes

1. **All 7 default photo selections rejected** — Plan used first-by-mileage defaults; user provided specific choices for all segments.
2. **Switched from thumbnails to full-res images** — Plan specified `/thumbs/` paths; user requested higher quality, switched to `/images/`.
3. **Doe Lake photo changed to non-manifest image** — Plan defaulted to mile 70.1; user provided a separate image file.

## Issues Encountered

None.

## User Setup Required

None.
