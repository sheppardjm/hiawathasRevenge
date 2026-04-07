---
status: complete
phase: 44-tech-debt-cleanup
source: 44-01-SUMMARY.md
started: 2026-04-07T19:10:00Z
updated: 2026-04-07T19:17:00Z
---

## Current Test

[testing complete]

## Tests

### 1. No surface-points.json files in build output
expected: No surface-points.json files exist in public/data/ or any route subdirectory (100mi, 100k, 50k). Running `ls public/data/*/surface-points.json public/data/surface-points.json` returns no results.
result: pass

### 2. Site builds without errors
expected: Running `npm run build` completes successfully with no errors. The pipeline no longer attempts to generate surface-points.json files.
result: pass

### 3. Photo 486608604 displays with correct landscape aspect ratio
expected: On a segment card or gallery view containing photo 486608604, the image displays in landscape orientation (wider than tall). No vertical stretching or portrait-shaped CLS placeholder flash before the image loads.
result: issue
reported: "There are multiple photos per segment card. I only wanted one photo per card. Please let me choose which photo I want. Doe Lake is missing a photo so I'll provide the path to that one."
severity: major

### 4. Renamed photo loads correctly in lightbox
expected: Clicking the photo 486608604 thumbnail in the gallery opens the full-size image in the PhotoSwipe lightbox. The image loads without 404 errors and displays at full landscape resolution.
result: pass

## Summary

total: 4
passed: 3
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Each segment card displays exactly one photo, chosen by the user"
  status: failed
  reason: "User reported: There are multiple photos per segment card. I only wanted one photo per card. Please let me choose which photo I want. Doe Lake is missing a photo so I'll provide the path to that one."
  severity: major
  test: 3
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
