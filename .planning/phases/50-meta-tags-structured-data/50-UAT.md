---
status: complete
phase: 50-meta-tags-structured-data
source: [50-01-SUMMARY.md]
started: 2026-04-10T02:05:00Z
updated: 2026-04-10T02:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. OG Site Name & Locale Tags
expected: View page source of the built site. `og:site_name` is present with the site name, and `og:locale` is `en_US` (underscore format).
result: pass

### 2. OG Image Accessibility Tags
expected: Page source contains `og:image:alt` and `twitter:image:alt` meta tags with descriptive alt text for the OG image.
result: pass

### 3. OG Image Type & Dimensions
expected: Page source contains `og:image:type` (e.g., `image/jpeg`) and `og:image:width` / `og:image:height` tags with correct pixel dimensions.
result: pass

### 4. Theme Color
expected: Page source contains `<meta name="theme-color" content="#1a2e1a">`. On mobile (or responsive emulation), the browser chrome/address bar tints forest-green.
result: pass

### 5. Event JSON-LD — Address & Location
expected: In page source, the Event JSON-LD script block includes `location` with `streetAddress` containing "Valley Spur Trailhead", `postalCode`, and `geo` with `latitude`/`longitude` coordinates.
result: pass

### 6. Event JSON-LD — Start Date & Timezone
expected: The Event JSON-LD `startDate` is `2026-06-06T08:00:00-05:00` (CDT timezone offset, not EST or EDT).
result: pass

### 7. Event JSON-LD — Free Event Offers
expected: The Event JSON-LD includes an `offers` block with `price: "0"` (string), `isAccessibleForFree: true` (boolean), and `availability` set to InStock.
result: pass

### 8. Event JSON-LD — Event URL
expected: The Event JSON-LD includes a `url` field pointing to the site's canonical URL.
result: pass

### 9. Canonical URL
expected: Every page includes `<link rel="canonical" href="...">` with the correct absolute URL for that page.
result: pass

## Summary

total: 9
passed: 9
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
