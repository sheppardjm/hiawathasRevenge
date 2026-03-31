---
status: diagnosed
phase: 00-full-site
source: all SUMMARY.md files (phases 1-11)
started: 2026-03-31T21:00:00Z
updated: 2026-03-31T21:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Page Load & Visual Identity
expected: Page loads with deep forest green background, amber/gold accents. National Park font on headings, Space Mono on body text. Shield badge h1 with arrowhead and curved text.
result: pass

### 2. Narrative Content
expected: Below the badge, introductory paragraphs tell the story of Hiawatha (Longfellow's poem, Ojibwe traditions) and how the National Forest got its name. Text is readable cream-on-green.
result: pass

### 3. Route Stats
expected: A stats section shows "102 miles", "2,258 ft" elevation gain, and "4 Surface Types". Below it, a surface breakdown listing forest roads, easy/moderate/hard singletrack with colored indicators.
result: issue
reported: "There is no singletrack on the route so we'll have to rename those surface types. you have ORV trails, pristine Forest Service roads, rugged two-track, regular gravel, and pavement, so do what you will with that. There's also a sand section."
severity: major

### 4. Donate CTA Above Fold
expected: A prominent "Donate to MBTN" button is visible without scrolling on desktop. It has a 3px amber border and hard shadow. Clicking opens mbtn.org/donate in a new tab.
result: pass

### 5. GPX Download
expected: A GPX download link is visible. Clicking it downloads a file named "HiawathasRevenge.gpx" (not the raw source filename).
result: pass

### 6. Topo Dividers
expected: Decorative topographic contour line patterns appear between sections — subtle wavy lines in forest green tones.
result: pass

### 7. Route Map Loads
expected: Scrolling to the map section loads a Leaflet map with the full 100-mile route as a dark green polyline on CyclOSM terrain tiles. OSM attribution visible.
result: pass

### 8. Map Gesture Handling
expected: On desktop, scrolling over the map does NOT zoom it (requires Ctrl+scroll). A message should appear. The map does not trap scrolling.
result: pass

### 9. Map Reset Button
expected: Zoom into the map, then click the circular arrow reset button. The map returns to the original full-route view.
result: pass

### 10. Elevation Chart
expected: Below the map, a Chart.js elevation profile shows an amber line — elevation in feet (Y-axis) vs distance in miles (X-axis).
result: issue
reported: "x-axis should go to maximum of route distance, not 120 miles"
severity: minor

### 11. Crosshair Sync
expected: Hover your cursor along the elevation chart. An amber circle marker should move along the route on the map, tracking the corresponding GPS position in real-time.
result: issue
reported: "no hover effect"
severity: major

### 12. Gravel Sector Overlays
expected: On the map, colored polyline segments overlay the route in 3 colors (green-gold, amber, rust). On the chart, matching colored bands appear behind the elevation line.
result: pass

### 13. Restock Markers
expected: Two restock point markers appear on the map as amber circles. Clicking one opens a popup showing the location name and mileage.
result: issue
reported: "They look like all the other photo markers, need to be differentiated somehow, maybe with a water drop icon"
severity: minor

### 14. Photo Gallery Grid
expected: A photo gallery section shows thumbnails in a responsive grid. Photos are WebP thumbnails that load as you scroll.
result: issue
reported: "photos all 404"
severity: blocker

### 15. PhotoSwipe Lightbox
expected: Click any photo thumbnail. A full-screen lightbox opens with swipe/keyboard navigation.
result: skipped
reason: depends on photo 404 fix (test 14)

### 16. Photo Markers on Map
expected: Photo markers appear on the map as clustered markers. Clicking a marker opens the PhotoSwipe lightbox to that photo.
result: pass

### 17. Mobile Layout (375px)
expected: At 375px viewport, no horizontal scrollbar. Stats stack vertically. Photo gallery shows 2 columns. Badge fits without overflow.
result: pass

### 18. Touch Target Size
expected: Map zoom +/- and reset buttons appear larger (~52px). Donate button and GPX link have comfortable tap target height.
result: pass

## Summary

total: 18
passed: 13
issues: 4
pending: 0
skipped: 1

## Gaps

- truth: "Route stats surface breakdown shows correct surface types for the route"
  status: failed
  reason: "User reported: There is no singletrack on the route. Actual surfaces are ORV trails, pristine Forest Service roads, rugged two-track, regular gravel, pavement, and sand."
  severity: major
  test: 3
  root_cause: "'Singletrack' labels hardcoded in RouteStats.astro lines 44/49/54 — does not match actual route surfaces. Difficulty labels (easy/moderate/hard) mapped to 'X Singletrack' but route has ORV trails, FS roads, two-track, gravel, pavement, sand."
  artifacts:
    - path: "src/components/RouteStats.astro"
      issue: "Lines 44, 49, 54 hardcode 'Moderate Singletrack', 'Easy Singletrack', 'Hard Singletrack'"
  missing:
    - "Replace singletrack labels with actual surface type names from user"
    - "May need to update annotations.json sector definitions and difficulty mapping"

- truth: "Elevation chart X-axis maximum matches actual route distance (~102 miles)"
  status: failed
  reason: "User reported: x-axis should go to maximum of route distance, not 120 miles"
  severity: minor
  test: 10
  root_cause: "No explicit max on Chart.js X-axis linear scale (ElevationProfile.astro ~line 134). Chart.js auto-scales with padding, rounding 101.98 up to ~120. Need x.max = routeData.meta.totalMiles."
  artifacts:
    - path: "src/components/ElevationProfile.astro"
      issue: "X-axis config has no max property — Chart.js auto-scales with ~18% padding"
  missing:
    - "Add max: routeData.meta.totalMiles to x-axis config"

- truth: "Hovering elevation chart moves crosshair marker on map"
  status: failed
  reason: "User reported: no hover effect"
  severity: major
  test: 11
  root_cause: "onHover callback in Chart.js 4.5.1 options may not be firing. The elevation:hover CustomEvent is never dispatched, so the map marker never moves. RouteMap listener is correctly registered. Issue is in ElevationProfile.astro hover event handling."
  artifacts:
    - path: "src/components/ElevationProfile.astro"
      issue: "onHover callback in chart options not triggering — Chart.js 4.x event handling issue"
  missing:
    - "Fix hover event handling — may need canvas mousemove listener or correct Chart.js 4.x plugin approach"

- truth: "Restock markers are visually distinct from photo markers"
  status: failed
  reason: "User reported: They look like all the other photo markers, need to be differentiated somehow, maybe with a water drop icon"
  severity: minor
  test: 13
  root_cause: "Restock markers (#c8973e amber) and photo markers (#d4a84e amber) are nearly identical 14px circles with same border, shadow, and size. Only 22 hex values apart — indistinguishable at map zoom."
  artifacts:
    - path: "src/components/RouteMap.astro"
      issue: "Restock markers (lines ~165-175) and photo markers (lines ~209-214) use nearly identical styling"
  missing:
    - "Replace restock marker with water drop SVG icon or distinctly different shape/color"

- truth: "Photo gallery thumbnails load successfully (not 404)"
  status: failed
  reason: "User reported: photos all 404"
  severity: blocker
  test: 14
  root_cause: "Double path prefix. photos.json thumb field contains '/thumbs/filename.webp'. PhotoGallery.astro line 43 prepends '/thumbs/' again, creating '/thumbs//thumbs/filename.webp'. Files exist in public/thumbs/ but URL is wrong."
  artifacts:
    - path: "src/components/PhotoGallery.astro"
      issue: "Line 43: src={`/thumbs/${photo.thumb}`} doubles the /thumbs/ prefix"
    - path: "public/data/photos.json"
      issue: "thumb field already includes /thumbs/ prefix"
  missing:
    - "Either remove /thumbs/ prefix from photos.json thumb field, or use photo.thumb directly in PhotoGallery.astro without prepending /thumbs/"
