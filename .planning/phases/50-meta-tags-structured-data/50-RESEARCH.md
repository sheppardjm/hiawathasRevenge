# Phase 50: Meta Tags & Structured Data - Research

**Researched:** 2026-04-09
**Domain:** HTML meta tags, Schema.org Event JSON-LD, Google Rich Results, Astro static site
**Confidence:** HIGH

---

## Summary

Phase 50 is a targeted gap-closure phase. Phase 29 (SEO & Social Sharing) already shipped a solid baseline: OpenGraph tags, Twitter Card, canonical link, `og:image:width/height`, and Event JSON-LD are all present in `BaseLayout.astro`. The site URL is correctly set in `astro.config.ts` and the 1200x630 OG image exists at `public/og-image.jpg`.

What's missing is a precise set of six additions, all in `BaseLayout.astro`:

**META gaps (4 tags):** `og:site_name`, `og:locale`, `og:image:alt`, `og:image:type`, `twitter:image:alt`, and `theme-color`.

**SCHEMA gaps (5 fields on the existing Event JSON-LD object):** street address (streetAddress field on PostalAddress), timezone-aware startDate, `offers` block, `geo` coordinates on the Place, standalone `description` field, and explicit `url` field.

**CRAWL-03:** Canonical is already present on `index.astro` via `BaseLayout`. The admin page (`admin.astro`) has a bare `<html>` head without BaseLayout and no canonical — but admin redirects to `/` in prod (`if (import.meta.env.PROD) return Astro.redirect('/')`), so it is never crawled. This is a judgment call: the requirement says "all pages." See Open Questions.

No new npm packages are required. All changes are declarative edits to `BaseLayout.astro`.

**Primary recommendation:** Edit `BaseLayout.astro` to add the 6 missing meta tags and upgrade the 5 schema fields. Verify with Google Rich Results Test on the deployed URL.

---

## Current State (What Phase 29 Already Shipped)

Reading `src/layouts/BaseLayout.astro` directly:

**PRESENT and correct:**
- `og:type`, `og:url`, `og:title`, `og:description`, `og:image` (absolute URL)
- `og:image:width` = 1200, `og:image:height` = 630
- `twitter:card` = summary_large_image, `twitter:title`, `twitter:description`, `twitter:image`
- `<link rel="canonical">` with absolute URL
- Event JSON-LD with `set:html` pattern (correct injection method)
- `astro.config.ts` has `site: 'https://hiawathasrevenge.com'`
- `public/og-image.jpg` exists (1200x630 JPEG, 233KB)

**MISSING (Phase 50 work):**

| Tag/Field | Requirement | Status |
|-----------|-------------|--------|
| `og:site_name` | META-01 | MISSING |
| `og:locale` | META-01 | MISSING |
| `og:image:alt` | META-01 | MISSING |
| `og:image:type` | META-01 | MISSING |
| `og:image:width` / `og:image:height` | META-02 | PRESENT |
| `twitter:image:alt` | META-03 | MISSING |
| `theme-color` | META-04 | MISSING |
| `location.address.streetAddress` | SCHEMA-01 | MISSING (addressLocality/Region/Country present, no street) |
| `startDate` with timezone offset | SCHEMA-02 | MISSING (current: "2026-06-06" date-only) |
| `offers` block | SCHEMA-03 | MISSING |
| `geo` (GeoCoordinates) | SCHEMA-04 | MISSING |
| `url` on Event | SCHEMA-04 | MISSING (organizer has url, Event itself does not) |
| standalone `description` | SCHEMA-04 | PRESENT (description field exists on Event) |
| Google Rich Results Test pass | SCHEMA-05 | UNKNOWN (can only test against deployed URL) |
| Canonical on all pages | CRAWL-03 | Effectively covered (admin never served in prod) |

---

## Standard Stack

No new packages needed. All work is declarative HTML meta tags and JSON object edits.

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Native `<meta>` tags | HTML | OG/Twitter/theme-color | Zero-dependency; all platforms parse standard HTML |
| Schema.org JSON-LD | spec | Event structured data | Google's recommended format |
| Astro `set:html` directive | built-in | JSON injection | Already in use; prevents escaping |

**Installation:** none required.

---

## Architecture Patterns

### Recommended Project Structure

No new files required. All changes to one file:

```
src/
└── layouts/
    └── BaseLayout.astro  # MODIFIED: add 6 meta tags, upgrade 5 schema fields
```

### Pattern 1: Missing OG Meta Tags

Add to the existing OpenGraph block in `BaseLayout.astro` `<head>`:

```astro
<!-- META-01: site_name, locale, image:alt, image:type -->
<meta property="og:site_name" content="Hiawatha's Revenge" />
<meta property="og:locale" content="en_US" />
<meta property="og:image:alt" content="Autumn forest creek in Hiawatha National Forest — Hiawatha's Revenge 100-mile gravel ride" />
<meta property="og:image:type" content="image/jpeg" />
```

`og:locale` format is language_TERRITORY (underscore, not hyphen): `en_US`.
`og:image:type` declares the MIME type; the OG image is a JPEG so `image/jpeg` is correct.

### Pattern 2: twitter:image:alt

Add to the existing Twitter Card block:

```astro
<!-- META-03 -->
<meta name="twitter:image:alt" content="Autumn forest creek in Hiawatha National Forest — Hiawatha's Revenge 100-mile gravel ride" />
```

### Pattern 3: theme-color

```astro
<!-- META-04 -->
<meta name="theme-color" content="#1a2e1a" />
```

`#1a2e1a` is `--color-forest-900` — the site's primary dark background color. This is a hardcoded hex; CSS custom properties do not work in `content=""` attributes.

**Source:** Syntax verified at developer.chrome.com/docs/lighthouse/pwa/themed-omnibox.

### Pattern 4: Upgraded Event JSON-LD

Replace the existing `eventSchema` object in `BaseLayout.astro` frontmatter. Key changes:

```javascript
const eventSchema = {
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Hiawatha's Revenge",
  // SCHEMA-04: standalone description
  "description": "A 100-mile gravel cycling adventure through Michigan's Hiawatha National Forest, supporting the Munising Bay Trail Network.",
  // SCHEMA-02: timezone-aware startDate (CDT = -05:00 in June)
  "startDate": "2026-06-06T08:00:00-05:00",
  "endDate": "2026-06-06",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Valley Spur Trailhead",
    "address": {
      "@type": "PostalAddress",
      // SCHEMA-01: street address added
      "streetAddress": "Valley Spur Trailhead, M-94",
      "addressLocality": "Munising",
      "addressRegion": "MI",
      "postalCode": "49862",
      "addressCountry": "US"
    },
    // SCHEMA-04: geo coordinates
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 46.36331,
      "longitude": -86.71216
    }
  },
  // SCHEMA-03: free event offers block
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "isAccessibleForFree": true,
    "availability": "https://schema.org/InStock",
    "url": "https://hiawathasrevenge.com"
  },
  // SCHEMA-04: event url
  "url": "https://hiawathasrevenge.com",
  "organizer": {
    "@type": "Organization",
    "name": "Munising Bay Trail Network",
    "url": "https://mbtn.org"
  },
  "image": ogImageURL.href
};
```

**Note on `startDate` timezone:** Michigan observes CDT (UTC-5:00) in June. `2026-06-06T08:00:00-05:00` is 8am local. The requirements spec exactly this value. CDT is -05:00, not -04:00 (EDT would be -04:00).

**Note on street address:** The actual postal street address for Valley Spur is along M-94 approximately 5 miles west of Munising. No formal street number exists for a trailhead. The requirement text specifies "Valley Spur Trailhead, Munising, MI 49862" — using `"Valley Spur Trailhead, M-94"` as streetAddress is the most accurate representation. The planner may want to simplify to just `"M-94"` or omit streetAddress and rely on locality/region/postal.

**Note on geo coordinates:** MTB Project schema confirmed `46.36331, -86.71216` for Valley Spur Singletrack trailhead in Munising. Search also returned `46.36306, -86.69944` for Valley Spur Lodge. The MTB Project coordinates (derived from embedded schema markup) are more reliable for the trailhead itself.

### Pattern 5: `og:image` URL consistency

The current BaseLayout uses `ogImageURL.href` (string) in meta tags. Keep this pattern — no change needed.

### Anti-Patterns to Avoid

- **CSS variable in theme-color content:** `content="var(--color-forest-900)"` does NOT work. Must use literal hex `#1a2e1a`.
- **Placing `offers.url` pointing to a third-party site:** Google requires offers.url to be a page where the user can get tickets or information. Use the event homepage (`https://hiawathasrevenge.com`) since this is a free event.
- **`startDate` without timezone for a geographically specific event:** Google defaults to the location's timezone if omitted, but explicit offset is required by SCHEMA-02.
- **`isAccessibleForFree` as string:** Must be boolean `true`, not `"true"` or `"yes"`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON injection in Astro | String template in `<script>` body | `set:html={JSON.stringify(obj)}` | Astro escapes `"` to `&quot;` without `set:html`; already in use |
| Absolute URL construction | String concat | `new URL('/og-image.jpg', Astro.site).href` | Already in use; handles edge cases |

---

## Common Pitfalls

### Pitfall 1: Michigan timezone in June is CDT (-05:00), not EST (-06:00)

**What goes wrong:** Using `-06:00` (CST, winter) or `-04:00` (EDT, eastern) for startDate offset.

**Why it happens:** Michigan Upper Peninsula is Central Time zone. CDT (summer) = UTC-5. CST (winter) = UTC-6.

**How to avoid:** Use `-05:00` for June dates in Michigan's UP. `2026-06-06T08:00:00-05:00` is correct.

**Warning signs:** Google Rich Results Test shows a startDate in a different timezone than expected.

### Pitfall 2: Google Rich Results Test only works on deployed/crawlable URLs

**What goes wrong:** Developer tests localhost URL, gets crawl errors, thinks schema is broken.

**Why it happens:** Google's Rich Results Test fetches the URL externally.

**How to avoid:** Either (a) test with `astro preview` behind a tunnel (ngrok), or (b) use the "Code snippet" mode in the Rich Results Test tool which accepts pasted HTML. Both work; the pasted-snippet approach is easiest in dev.

### Pitfall 3: `og:image:type` must match actual file format

**What goes wrong:** Tag says `image/png` but file is JPEG — some scrapers reject or silently fail.

**Why it happens:** Mismatch between tag value and file at `public/og-image.jpg`.

**How to avoid:** `public/og-image.jpg` is a JPEG (verified: `file` command confirms baseline JPEG). Use `image/jpeg`.

### Pitfall 4: `og:locale` format is underscore, not hyphen

**What goes wrong:** `en-US` (BCP47 format) instead of `en_US` (OG format). Facebook and some parsers silently ignore invalid locale.

**Why it happens:** BCP47 (`en-US`) is the web standard; OG uses its own underscore format (`en_US`).

**How to avoid:** Always use `en_US` for `og:locale`, not `en-US`.

### Pitfall 5: CRAWL-03 on admin.astro

**What goes wrong:** If "all pages" is interpreted strictly, `admin.astro` has no canonical tag. But admin redirects to `/` in production, so Google never sees it.

**Why it happens:** Admin page doesn't use BaseLayout; it has a bare `<html>` head.

**How to avoid:** In production, the redirect means the admin page is never served to crawlers. The canonical requirement is effectively satisfied. However, if a strict reading is required, add a `<link rel="canonical" href="https://hiawathasrevenge.com/" />` to admin's `<head>`. This is a judgment call for the planner.

---

## Code Examples

### Complete upgraded BaseLayout `<head>` additions

```astro
<!-- META-01: site_name, locale, image:alt, image:type -->
<meta property="og:site_name" content="Hiawatha's Revenge" />
<meta property="og:locale" content="en_US" />
<meta property="og:image:alt" content="Autumn forest creek in Hiawatha National Forest — Hiawatha's Revenge 100-mile gravel ride" />
<meta property="og:image:type" content="image/jpeg" />

<!-- META-02: width/height already present — no change needed -->

<!-- META-03: twitter:image:alt -->
<meta name="twitter:image:alt" content="Autumn forest creek in Hiawatha National Forest — Hiawatha's Revenge 100-mile gravel ride" />

<!-- META-04: theme-color (forest-900 = #1a2e1a) -->
<meta name="theme-color" content="#1a2e1a" />
```

### Complete upgraded eventSchema object (frontmatter)

```javascript
const eventSchema = {
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Hiawatha's Revenge",
  "description": "A 100-mile gravel cycling adventure through Michigan's Hiawatha National Forest, supporting the Munising Bay Trail Network.",
  "startDate": "2026-06-06T08:00:00-05:00",
  "endDate": "2026-06-06",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Valley Spur Trailhead",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Valley Spur Trailhead, M-94",
      "addressLocality": "Munising",
      "addressRegion": "MI",
      "postalCode": "49862",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 46.36331,
      "longitude": -86.71216
    }
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "isAccessibleForFree": true,
    "availability": "https://schema.org/InStock",
    "url": "https://hiawathasrevenge.com"
  },
  "url": "https://hiawathasrevenge.com",
  "organizer": {
    "@type": "Organization",
    "name": "Munising Bay Trail Network",
    "url": "https://mbtn.org"
  },
  "image": ogImageURL.href
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `og:image` only (no width/height) | `og:image:width` + `og:image:height` prevent layout reflow | 2015+ | Scrapers can pre-size containers |
| `startDate` date-only | `startDate` with timezone offset for rich results | Google guidance | Required for Event rich result eligibility |
| `Microdata` attributes | `JSON-LD` via `<script type="application/ld+json">` | ~2015 | Cleaner, no HTML pollution |

---

## Open Questions

1. **CRAWL-03 strict interpretation: does admin.astro need a canonical?**
   - What we know: `admin.astro` is a bare HTML page (not using BaseLayout) with no canonical. In production it immediately redirects to `/`.
   - What's unclear: The requirement says "all pages." A redirect means no crawlable content is served.
   - Recommendation: Mark as low-risk/won't-fix in the plan. Admin is never served in prod. If the requirement must be satisfied strictly, add a `<link rel="canonical" href="https://hiawathasrevenge.com/">` to admin's head block (2-line change).

2. **Exact street address for Valley Spur Trailhead**
   - What we know: Address is "Valley Spur Trailhead, Munising, MI 49862" per requirements. MTB Project uses `46.36331, -86.71216`. No formal street number exists.
   - What's unclear: Whether Google Rich Results Test will flag a `streetAddress` without a number as invalid.
   - Recommendation: Use `"streetAddress": "M-94"` (the highway the trailhead is on) or `"streetAddress": "Valley Spur Trailhead, M-94"`. If the test flags it, fall back to omitting streetAddress and relying on addressLocality/postalCode.

3. **SCHEMA-05: Rich Results Test**
   - What we know: Can be tested via Google's Rich Results Test using the "code snippet" input mode without a live URL.
   - What's unclear: Whether `offers` without a `validFrom` date causes warnings (Google docs list it as optional for offers but recommended).
   - Recommendation: Include `validFrom` as an optional field pointing to the current date or leave it out; Google's docs mark it optional for events.

---

## Sources

### Primary (HIGH confidence)
- `developers.google.com/search/docs/appearance/structured-data/event` — Event rich result required/recommended fields, `offers` block, timezone format requirements
- `schema.org/GeoCoordinates` — `geo` property on Place, `latitude`/`longitude` fields confirmed with WGS 84
- `developer.chrome.com/docs/lighthouse/pwa/themed-omnibox` — `theme-color` meta tag syntax: `<meta name="theme-color" content="#hex">`
- `src/layouts/BaseLayout.astro` (current codebase) — Confirmed existing tags and schema fields
- `src/styles/global.css` (current codebase) — `--color-forest-900: #1a2e1a` confirmed as site's primary background

### Secondary (MEDIUM confidence)
- `mtbproject.com/trail/7014518/valley-spur-singletrack` — GeoCoordinates `46.36331, -86.71216` extracted from page schema markup
- `ogp.me` — `og:locale` underscore format (`en_US`), `og:image:type`, `og:site_name` confirmed
- WebSearch (2026) — Valley Spur Lodge coordinates `46.36306, -86.69944` cross-reference

### Tertiary (LOW confidence)
- WebSearch: `theme-color` browser support table — confirms broad support (Chrome 39+, Safari 15+, Samsung Internet 6.2+); caniuse table referenced but not directly fetched

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; confirmed existing patterns
- Architecture: HIGH — single file edit; all tags are well-specified
- Pitfalls: HIGH — timezone, locale format, and theme-color CSS-var limitation are verified
- Geo coordinates: MEDIUM — from MTB Project embedded schema, not official USFS data

**Research date:** 2026-04-09
**Valid until:** 2026-07-09 (stable specs — OG and Schema.org change slowly)
