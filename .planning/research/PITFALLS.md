# Domain Pitfalls: SEO & Social Sharing for a Static Event Site

**Domain:** SEO, OG images, favicons, Schema.org, sitemap for Astro 6 static cycling event site
**Researched:** 2026-04-09
**Confidence:** HIGH (verified against official Google docs, current project code, Apple developer documentation, and platform behavior)

---

## Critical Pitfalls

Mistakes that cause broken previews, invisible pages, or invalid structured data.

---

### Pitfall 1: OG Image Cache Poisoning Across Platforms

**What goes wrong:** You update the OG image (from the current cropped hero photo to the planned badge+tagline design) at the same URL (`/og-image.jpg`), but Facebook, iMessage, LinkedIn, Slack, and Discord all continue showing the OLD image for days or weeks. Every share of the site during that window looks wrong.

**Why it happens:** Social platforms cache OG metadata aggressively. Facebook caches for 7-30 days. Apple's iMessage bot scraper has NO user-facing cache-clear mechanism -- there is no debugger tool, no "re-scrape" button. LinkedIn Post Inspector requires manual re-scraping per URL. Each platform has its own crawler with its own cache TTL, and none coordinate.

**Consequences:**
- Old hero photo shows instead of new designed badge image on every platform
- Every iMessage, Facebook post, and Slack share looks outdated during the marketing window before the June 6 event
- No way to force iMessage to refresh on recipients' devices -- Apple provides zero cache-purge tooling
- LinkedIn may cache the old image for weeks even after Facebook is refreshed

**Prevention:**
- **Never reuse the OG image filename when replacing the image.** Use a new filename: `og-image-v2.jpg` or `og-hiawatha-badge.jpg`. Update the `og:image` meta tag to point to the new URL. A new URL forces a cache miss on every platform simultaneously.
- After deploying the new image URL, immediately scrape with these platform tools:
  - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
  - LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
  - Twitter Card Validator (if still available)
- For iMessage: the new-URL strategy is the ONLY reliable approach. Apple provides no cache-purge tool. The Apple Developer Technote TN3156 documents how iMessage fetches previews but provides no mechanism to invalidate cached ones.
- Deploy the OG image change well before any planned social media push for the event.

**Detection:** After deploying the new OG image, share the URL in a private Facebook message and iMessage to yourself. If the old image appears, the cache is stale.

**Which phase:** Address in the OG image redesign task. The filename change must happen in the same deployment as the meta tag update.

**Sources:**
- [OG Preview: Why OG Images Not Updating](https://ogpreview.app/why-og-images-not-updating/)
- [Apple TN3156: Rich Previews for Messages](https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages)
- [Apple Developer Forums: Messages showing old link preview](https://developer.apple.com/forums/thread/735324)

---

### Pitfall 2: OG Image Format Incompatibility (WebP/AVIF Trap)

**What goes wrong:** The site uses WebP for all other images (hero preload, gallery). It is tempting to serve the new OG image as WebP too for file size savings. But LinkedIn does not reliably support WebP for OG images, and some older messaging platform clients silently fail -- showing no preview image at all, not an error.

**Why it happens:** The rest of the site is optimized for WebP (the hero preload in BaseLayout.astro is `.webp`). Developers assume OG crawlers have the same format support as modern browsers. They do not. OG crawlers are not browsers -- they are lightweight HTTP fetchers that may only support JPEG/PNG.

**Consequences:**
- LinkedIn shares show no image (silent failure, no error message)
- Some iMessage/WhatsApp clients on older iOS or Android may fail to render the preview image
- No error signal -- just a blank or text-only link preview card

**Current state:** The existing `og-image.jpg` is JPEG, 1200x630, 233KB. This is correct. The risk is during redesign when someone exports the new badge image in the wrong format.

**Prevention:**
- **Always use JPEG for the OG image.** JPEG is universally supported across all social platform crawlers.
- Do NOT use WebP, AVIF, or SVG for `og:image`. Even though Facebook claims WebP support, LinkedIn and iMessage are not guaranteed.
- Keep the file under 1MB (current 233KB is fine; Facebook limit is 8MB but smaller is faster for crawlers).
- Add `og:image:type` meta tag: `<meta property="og:image:type" content="image/jpeg" />` to be explicit.

**Detection:** Validate with https://www.opengraph.xyz/ which tests actual crawler behavior across platforms.

**Which phase:** Enforce as a constraint during OG image redesign. Add to the design spec: "Export as JPEG only."

**Sources:**
- [Ctrl Blog: WebP as OG Image](https://www.ctrl.blog/entry/webp-ogp.html)
- [OG Preview: Facebook OG Guide](https://ogpreview.app/guides/facebook-link-preview)

---

### Pitfall 3: Schema.org Event Missing `offers` for Free Event (Google Eligibility Loss)

**What goes wrong:** The current Schema.org JSON-LD (in `BaseLayout.astro`, lines 19-44) has no `offers` property and no `isAccessibleForFree` flag. Google's Rich Results Test may not surface this as a hard error, but without `offers`, the event loses eligibility for Google's enhanced event search display. For a free event with no registration, the correct markup pattern is non-obvious.

**Why it happens:** The event is free and has no registration or tickets, so the developer thinks "we have no tickets, so we don't need an `offers` block." But Google expects `offers` with `price: "0"` to understand event pricing. Without it, Google cannot determine whether the event is free or just missing pricing data, and may decline to show it in event search results.

**Current state (from BaseLayout.astro):**
```json
{
  "@type": "Event",
  "name": "Hiawatha's Revenge",
  "startDate": "2026-06-06",
  "endDate": "2026-06-06",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": { ... },
  "organizer": { ... },
  "image": "..."
}
```
Missing: `offers`, `isAccessibleForFree`, `geo` coordinates, `description` (the standalone property, not just the meta description).

**Consequences:**
- Event may not appear in Google event search results for queries like "cycling events Michigan June 2026"
- Google Search Console may flag warnings about missing recommended properties
- Users searching for free outdoor events near Munising won't find the event through Google's event aggregation

**Prevention:** Add the following to the Event JSON-LD:
```json
"offers": {
  "@type": "Offer",
  "price": "0",
  "priceCurrency": "USD",
  "availability": "https://schema.org/InStock",
  "url": "https://hiawathasrevenge.com"
},
"isAccessibleForFree": true
```
- `price: "0"` signals a free event to Google
- `priceCurrency` is required by Google even for free events -- omitting it can make the event ineligible
- `availability: InStock` signals the event is open for participation
- `url` points to the event page itself (not a ticket vendor, since there is none)
- `isAccessibleForFree: true` is a Schema.org property that applies to Event (confirmed at schema.org/isAccessibleForFree, GitHub issue #900 on schemaorg/schemaorg)

**Detection:** Run https://search.google.com/test/rich-results on the live URL. Check for warnings (yellow), not just errors (red).

**Which phase:** Address in the Schema.org audit task.

**Sources:**
- [Google: Event Structured Data](https://developers.google.com/search/docs/appearance/structured-data/event) -- "If the event is available without payment, fees, or service charges, set the price to 0"
- [Schema.org: isAccessibleForFree](https://schema.org/isAccessibleForFree)
- [Google Search Central Community: Structured data for free events](https://support.google.com/webmasters/thread/101282079/structured-data-for-free-events)

---

### Pitfall 4: Using `SportsEvent` Instead of `Event` for a Non-Competitive Ride

**What goes wrong:** Someone sees "cycling event" and upgrades `@type` from `Event` to `SportsEvent` during the Schema.org audit. But `SportsEvent` is specifically for competitive sporting events -- races, tournaments, matches with results/rankings. Using it for a non-competitive group ride is semantically incorrect.

**Why it happens:** SportsEvent is a subtype of Event in Schema.org. Cycling is a sport. The upgrade seems like an improvement but is a misclassification. Schema.org describes SportsEvent as "Event type: Sports event" for "competitive fixtures."

**Consequences:**
- Google may misclassify the event or present it in wrong search contexts (competition/results oriented)
- Semantic mismatch between the schema type and the actual nature of the event
- May trigger Google guidelines violation for misrepresenting event type

**Prevention:**
- Keep `@type: "Event"` (which is already correct in the current codebase). Do NOT change it to `SportsEvent`.
- The event description should use "ride" and "adventure" language, not "race" or "competition"
- This is a "leave it alone" pitfall -- the current code is right, the risk is in "improving" it

**Detection:** Review the `@type` field in JSON-LD after the audit. Should remain `"Event"`.

**Which phase:** Validate during Schema.org audit. This is currently correct -- the pitfall is to avoid changing it.

**Sources:**
- [Schema.org: SportsEvent](https://schema.org/SportsEvent) -- "A sub-property of Event" for competitive fixtures

---

## Moderate Pitfalls

Mistakes that cause degraded previews, incomplete indexing, or technical debt.

---

### Pitfall 5: Favicon Emoji SVG (Missing ICO, Apple Touch Icon, and Proper SVG)

**What goes wrong:** The current favicon is a 116-byte SVG containing only a tree emoji text element:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <text x="4" y="26" font-size="28">tree-emoji</text>
</svg>
```
This has multiple problems:
1. **Emoji rendering varies by OS/browser.** The tree emoji renders differently on macOS, Windows, Android, and Linux. Users on different platforms see different icons.
2. **No `favicon.ico` fallback.** Legacy browsers, bookmarking tools, and some RSS readers request `/favicon.ico` directly. A 404 is returned.
3. **No `apple-touch-icon.png`.** iOS users adding the site to their home screen see a generic page screenshot thumbnail instead of an icon.
4. **No manifest icons.** Android "Add to Home Screen" has no icon to use.
5. **The `rel="icon"` declaration in BaseLayout.astro lacks `sizes="32x32"`.** Without it, Chrome may download both the ICO and SVG, wasting a request.
6. **The SVG is an emoji, not the badge design.** The site has a distinctive badge/shield motif that should be the favicon.

**Consequences:**
- iOS home screen shows ugly screenshot instead of badge icon
- Windows/Android bookmark icons vary unpredictably
- Browser tab icon is an inconsistent emoji across platforms
- Site looks unfinished in browser chrome

**Prevention:** Generate from the badge SVG, creating the minimal set recommended for 2026:
```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```
- `favicon.ico`: 32x32 ICO format at site root (browsers auto-request `/favicon.ico`)
- `icon.svg`: The badge design as proper SVG vector art (not emoji text). Can include `@media (prefers-color-scheme: dark)` CSS for dark mode support in browser tabs.
- `apple-touch-icon.png`: 180x180 PNG with ~20px padding and a solid background color. iOS adds rounded corners automatically -- do NOT bake rounded corners into the source image (see Pitfall 13).

**Detection:** Check browser tab icon on Windows. Check iOS "Add to Home Screen." Both should show the badge, not an emoji or screenshot.

**Which phase:** Address in the favicon creation task.

**Sources:**
- [Evil Martians: How to Favicon in 2026](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs)

---

### Pitfall 6: OG Image Text Illegible at Thumbnail Rendering Size

**What goes wrong:** The new OG image is designed with badge logo + tagline text. It looks great at 1200x630 in Figma/design tool. But when rendered as a small thumbnail -- 300x158 in an iMessage bubble, ~476x249 in a Facebook mobile feed, or ~506x265 on Twitter mobile -- the tagline text becomes unreadable. The badge logo detail is lost.

**Why it happens:** Designers view and approve the image at full 1200px resolution. Social platforms render it at 25-40% of that size. Text that is readable at 1200px wide becomes 4-5px tall at thumbnail rendering. Additionally, platforms crop differently: Facebook trims sides, iMessage may overlay its own title text atop the image, and LinkedIn crops to a different aspect ratio in some views.

**Consequences:**
- Tagline text is illegible in most actual sharing contexts
- Badge logo fine details merge into blur at small sizes
- Text overlaps with platform-added title/description text overlays
- The carefully designed image communicates nothing more than a color blob

**Prevention:**
- Design at 1200x630 but **test at 300x158** (smallest common rendering, iMessage compact bubble)
- Keep text to 3-5 LARGE words maximum. The tagline must be extremely short and in bold, high-contrast type.
- Place the badge and any text in the center 60% of the image. Platforms crop edges unpredictably.
- Use bold, high-contrast text (light on dark or dark on light). No thin or decorative fonts.
- Test with https://www.opengraph.xyz/ and https://ogpreview.app/ which render actual platform sizes.
- Consider: the badge logo may work alone without text at small sizes. Sometimes an icon-only OG image is more effective than text that can't be read.

**Detection:** Share the URL in an iMessage to yourself and view on iPhone. If you squint to read the text, it's too small.

**Which phase:** Address during OG image design. Build a review step that tests thumbnail rendering before finalizing.

---

### Pitfall 7: Sitemap Hash Fragments and Robots.txt Mismatches

**What goes wrong:** Several related sub-pitfalls for a single-page site:

**7a: Hash fragments in sitemap.** The site has hash-based deep links (`#route=100k`, `#route=100mi`, `#route=50k`). Including URLs like `https://hiawathasrevenge.com/#route=100k` in the sitemap is pointless -- Google ignores everything after `#` in URLs. These entries waste crawl budget and signal poor SEO understanding.

**7b: Sitemap filename mismatch in robots.txt.** The `@astrojs/sitemap` integration generates `sitemap-index.xml` (not `sitemap.xml`). If a hand-written `robots.txt` references `Sitemap: https://hiawathasrevenge.com/sitemap.xml`, the reference is broken. Google will 404 trying to fetch it.

**7c: Missing `site` config silently breaks sitemap.** The `@astrojs/sitemap` integration requires the `site` field in `astro.config.ts`. The current config has `site: 'https://hiawathasrevenge.com'` -- this is correct. But if someone removes it during a refactor, the sitemap silently fails to generate during build. No error, just no sitemap file in `dist/`.

**7d: `changefreq` and `priority` are noise.** Google has explicitly stated it ignores these sitemap values. Including them adds XML bulk without value.

**Prevention:**
- For a single-page site, the sitemap should contain exactly ONE URL: `https://hiawathasrevenge.com/`
- Do NOT include hash-fragment URLs in the sitemap
- Install `@astrojs/sitemap` integration (not a hand-written file) to auto-generate. It reads the Astro routing automatically.
- Create `robots.txt` referencing the actual generated filename. Verify after build that `dist/sitemap-index.xml` exists and `robots.txt` points to it correctly.
- `lastmod` is the only useful optional sitemap field (Google uses it if it is consistently accurate)

**Recommended robots.txt content:**
```
User-agent: *
Allow: /

Sitemap: https://hiawathasrevenge.com/sitemap-index.xml
```

**Detection:** After build, check that `dist/sitemap-index.xml` exists, contains only `https://hiawathasrevenge.com/`, and that `dist/robots.txt` references the correct filename.

**Which phase:** Address in the robots.txt + sitemap task.

**Sources:**
- [Astro Docs: Sitemap Integration](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [Google: Build and Submit Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

---

### Pitfall 8: Canonical URL Trailing Slash Inconsistency

**What goes wrong:** The current code computes canonical URL as:
```js
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
```
This produces `https://hiawathasrevenge.com/` for the index page. But Astro's `trailingSlash` config is not set in `astro.config.ts` (defaults to `'ignore'`). If some external links point to `https://hiawathasrevenge.com` (no slash) and the canonical is `https://hiawathasrevenge.com/` (with slash), Google may see these as two different URLs and split PageRank between them.

For a single-page site this is unlikely to cause major damage, but it is an easy fix and prevents a class of edge cases.

**Prevention:**
- Set `trailingSlash: 'never'` or `trailingSlash: 'always'` explicitly in `astro.config.ts`
- Verify the canonical URL in the built HTML matches exactly the URL submitted to Google Search Console
- Verify the hosting provider's redirect behavior matches the chosen config (e.g., if `trailingSlash: 'never'`, the host should 301-redirect `/` to the bare domain or vice versa)

**Detection:** View source of built HTML. Check `<link rel="canonical">` value. Compare to the URL in the address bar when visiting the live site.

**Which phase:** Address in the canonical URL verification task.

**Sources:**
- [Google: Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

---

### Pitfall 9: Schema.org Event Image Requirements Stricter Than OG Image

**What goes wrong:** Google has specific image requirements for Event structured data that are stricter and different from OG image requirements:
- Minimum width: 720px (recommended: 1920px)
- Google recommends providing images in multiple aspect ratios: 16:9, 4:3, and 1:1
- The image must "clearly represent the event" -- Google specifically warns against using just a logo
- Must be crawlable and indexable (not behind auth or robots.txt disallow)

The current JSON-LD points `"image"` to the same OG image URL. If the OG image is redesigned to be primarily a badge/logo with text overlay, it may violate Google's guideline that event images should represent the event, not just be a logo.

**Consequences:**
- Google Rich Results Test may flag an image warning
- Event may lose eligibility for the enhanced event experience in search results
- Only providing one aspect ratio means Google cannot optimize display across surfaces

**Prevention:**
- The Schema.org Event `image` property can be a DIFFERENT URL than the `og:image`. Consider keeping the original event photo (the scenic hero shot) for structured data while using the designed badge image for social sharing.
- Provide multiple image sizes: `"image": ["https://hiawathasrevenge.com/event-photo-16x9.jpg", "https://hiawathasrevenge.com/event-photo-4x3.jpg", "https://hiawathasrevenge.com/event-photo-1x1.jpg"]`
- Ensure the event image is at least 720px wide (current 1200px is fine)
- Do not point structured data `image` at a pure badge/logo

**Detection:** Run Google Rich Results Test after the OG image is changed. Check specifically for image-related warnings.

**Which phase:** Address during Schema.org audit. Decide whether structured data image should differ from OG image.

**Sources:**
- [Google: Event Structured Data](https://developers.google.com/search/docs/appearance/structured-data/event) -- "images that clearly represent the event"

---

### Pitfall 10: Schema.org Event Missing Recommended Properties

**What goes wrong:** The current JSON-LD is missing several recommended properties that reduce the richness of the event listing in Google search results. While not blocking errors, each missing recommended property reduces the likelihood of Google showing the event in enhanced results.

**Currently missing from the JSON-LD:**
- `offers` and `isAccessibleForFree` (covered in Pitfall 3, Critical)
- `description` as a standalone property in the JSON-LD (it only exists as meta description)
- `geo` coordinates in the location (for map integration in search results)
- Specific street address (current address is city-level only: "Munising, MI" -- no street)
- Multiple `image` aspect ratios (covered in Pitfall 9)

**Prevention:**
- Add `description` directly in the JSON-LD object (can match the meta description):
  ```json
  "description": "A 100-mile cycling adventure through Michigan's Hiawatha National Forest supporting the Munising Bay Trail Network."
  ```
- Add `geo` coordinates to the location for map integration:
  ```json
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 46.4111,
    "longitude": -86.6489
  }
  ```
- Add a more specific location if the start/finish point is known (trailhead, park, town square)
- Optionally add `duration` if the event has an expected timeframe

**Detection:** Rich Results Test shows recommended (yellow) warnings, not just required (red) errors. Each yellow warning is a missed opportunity.

**Which phase:** Address during Schema.org audit. Bundle all missing recommended properties into one task.

---

## Minor Pitfalls

Mistakes that cause annoyance or inconsistency but are quickly fixable.

---

### Pitfall 11: Astro `site` Config URL Mismatch (www vs non-www, HTTP vs HTTPS)

**What goes wrong:** The `site` in `astro.config.ts` is `https://hiawathasrevenge.com`. All generated URLs (canonical, sitemap, OG image absolute paths) derive from this. If the actual production domain differs -- `www.hiawathasrevenge.com`, or if HTTP is not redirected to HTTPS -- every generated URL is technically wrong.

**Prevention:**
- Verify `https://hiawathasrevenge.com` is the actual canonical production URL
- Ensure the hosting provider redirects `www` to non-www (or vice versa) with a 301
- Ensure HTTPS is enforced (HTTP requests 301 to HTTPS)
- These redirects should be verified before the SEO milestone, not after

**Detection:** Visit `http://www.hiawathasrevenge.com`, `http://hiawathasrevenge.com`, and `https://www.hiawathasrevenge.com`. All three should 301-redirect to `https://hiawathasrevenge.com`.

**Which phase:** Verify as a pre-flight check before deploying any SEO changes.

---

### Pitfall 12: Deploying OG Changes Without Testing Actual Platform Crawlers

**What goes wrong:** Developers test OG tags by viewing page source or browser dev tools. Everything looks correct in HTML. But social platform crawlers may behave differently: they may timeout on slow images, fail on redirects, or render different results than what the HTML suggests. Astro generates static HTML so JS rendering is not a concern, but image accessibility and redirect chains are.

**Prevention:**
After every deployment that touches meta tags or OG images, test with ACTUAL platform crawler tools:
- https://www.opengraph.xyz/ (multi-platform preview, shows rendering from real crawlers)
- https://developers.facebook.com/tools/debug/ (Facebook Sharing Debugger)
- https://www.linkedin.com/post-inspector/ (LinkedIn)
- https://search.google.com/test/rich-results (Google structured data)

Add these validation URLs to the UAT checklist for the milestone.

**Detection:** If any platform tool shows different data than what's in the HTML, there is a crawling/caching issue.

**Which phase:** Add as a UAT step for every task that modifies meta tags, OG images, or structured data.

---

### Pitfall 13: Apple Touch Icon with Baked-In Rounded Corners

**What goes wrong:** When creating `apple-touch-icon.png` from the badge SVG, the developer adds rounded corners to the PNG file. iOS applies its own corner rounding mask automatically at render time. The result is double-rounded corners with visible white or transparent artifacts at the corners.

**Prevention:**
- Export `apple-touch-icon.png` as a perfect square (180x180) with NO rounded corners
- Add approximately 20px padding around the icon content
- Fill the background with a solid color (the forest green `#1a2e1a` from the site theme would work well)
- iOS handles ALL masking and corner rounding automatically

**Detection:** "Add to Home Screen" on an iOS device. Look for double-rounding or white corner artifacts.

**Which phase:** Address during favicon creation.

**Sources:**
- [Evil Martians: How to Favicon in 2026](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs) -- "Apple will handle cropping itself"

---

### Pitfall 14: Using `rel="shortcut icon"` (Invalid Legacy Markup)

**What goes wrong:** Many favicon guides recommend `rel="shortcut icon"`. The `shortcut` keyword is not a valid link relation type per the HTML spec. Modern browsers ignore it and parse `icon`, but it signals outdated practices and causes HTML validation warnings.

**Current state:** The codebase uses `rel="icon" type="image/svg+xml"` which is correct syntax. The risk is in copy-pasting from outdated guides during the favicon expansion.

**Prevention:** Use `rel="icon"` (correct). Never `rel="shortcut icon"`.

**Which phase:** Validate during favicon implementation.

---

### Pitfall 15: iMessage Title Truncation at ~44 Characters

**What goes wrong:** iMessage link previews truncate `og:title` text at approximately 44 characters, replacing the rest with an ellipsis. If the OG title is long ("Hiawatha's Revenge - A 100-Mile Gravel Cycling Adventure Through Michigan's Upper Peninsula"), the preview shows only "Hiawatha's Revenge - A 100-Mile Grav..."

**Prevention:**
- Keep `og:title` under 44 characters for iMessage compatibility
- "Hiawatha's Revenge" (19 chars) or "Hiawatha's Revenge | June 6, 2026" (33 chars) both fit
- The longer description belongs in `og:description`, not the title

**Detection:** Share the URL in iMessage and check if the title is truncated.

**Which phase:** Verify during OG tag audit.

**Sources:**
- [Apple TN3156: Rich Previews for Messages](https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages) -- title text truncation behavior

---

## Phase-Specific Warning Reference

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| OG Image Redesign | Cache poisoning -- old image persists across all platforms | Use new filename, not same URL. Scrape with platform debuggers immediately after deploy. |
| OG Image Redesign | Text illegible at thumbnail rendering size | Design at 1200x630, test at 300x158. Keep text to 3-5 bold words max. |
| OG Image Redesign | WebP format used accidentally (matches rest of site) | Export as JPEG only. Never WebP/AVIF/SVG for og:image. |
| Schema.org Audit | Missing `offers` block for free event | Add `offers` with `price: "0"` + `priceCurrency: "USD"` + `isAccessibleForFree: true`. |
| Schema.org Audit | Upgrading to SportsEvent (incorrect for a ride) | Keep as `Event`. This is a ride, not a race. |
| Schema.org Audit | Event image mismatch (logo badge vs scenic event photo) | Consider separate image for structured data vs og:image. |
| Schema.org Audit | Missing recommended properties (geo, description, offers) | Bundle all missing properties into one audit pass. |
| Robots.txt + Sitemap | Hash fragments in sitemap URLs | Only include `https://hiawathasrevenge.com/`. Zero hash URLs. |
| Robots.txt + Sitemap | Sitemap filename mismatch in robots.txt | Reference `sitemap-index.xml` (what @astrojs/sitemap actually generates). |
| Favicon Creation | Missing ICO fallback and apple-touch-icon | Generate full set: .ico (32x32), .svg (vector badge), apple-touch-icon.png (180x180). |
| Favicon Creation | Double-rounded corners on iOS home screen | Export apple-touch-icon as square with NO corner rounding. iOS masks automatically. |
| Favicon Creation | Emoji SVG varies across platforms | Replace emoji with actual badge vector art. |
| Canonical URL | Trailing slash inconsistency | Set `trailingSlash` explicitly in astro.config.ts. |
| All Tasks | Not testing with actual platform crawlers | Add crawler-tool validation (opengraph.xyz, FB debugger, Rich Results Test) to UAT. |

---

## Current Project State Reference

| Asset | Current State | Issues to Address |
|-------|---------------|-------------------|
| `og-image.jpg` | JPEG, 1200x630, 233KB | Correct format/size. Content is hero photo crop -- planned for badge+tagline redesign. |
| `og:image` meta tag | Points to `/og-image.jpg` with width/height | Correct implementation. Missing `og:image:type`. |
| `og:title` | Dynamic from page `title` prop | Verify length under 44 chars for iMessage. |
| `twitter:card` | `summary_large_image` | Correct. |
| `canonical` URL | Computed from `Astro.url.pathname` + `Astro.site` | Works. `trailingSlash` not set explicitly. |
| `favicon.svg` | 116-byte emoji SVG (tree emoji as text element) | Placeholder. Needs complete replacement with badge vector art. |
| `favicon.ico` | Missing (404 on direct request) | Needs creation as 32x32 ICO. |
| `apple-touch-icon.png` | Missing | Needs creation as 180x180 PNG. |
| Schema.org JSON-LD | `Event` type with name, dates, location, organizer, image | Missing: `offers`, `isAccessibleForFree`, `geo`, `description` (standalone), specific street address. |
| `robots.txt` | Missing entirely | Needs creation. |
| `sitemap.xml` | Missing entirely | Needs `@astrojs/sitemap` integration. |
| `site` config | `https://hiawathasrevenge.com` | Correct. Required for sitemap and canonical URL generation. |
| `trailingSlash` config | Not set (defaults to `'ignore'`) | Should be set explicitly. |

---

## Sources

All critical pitfalls verified against official documentation or direct code inspection:

**Official Documentation (HIGH confidence):**
- [Google: Event Structured Data Requirements](https://developers.google.com/search/docs/appearance/structured-data/event)
- [Schema.org: isAccessibleForFree](https://schema.org/isAccessibleForFree)
- [Schema.org: SportsEvent](https://schema.org/SportsEvent)
- [Apple TN3156: Rich Previews for Messages](https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages)
- [Google: Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: Build and Submit Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Astro Docs: Sitemap Integration](https://docs.astro.build/en/guides/integrations-guide/sitemap/)

**Verified Community Sources (MEDIUM confidence):**
- [Evil Martians: How to Favicon in 2026](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs)
- [OG Preview: Why OG Images Not Updating](https://ogpreview.app/why-og-images-not-updating/)
- [Ctrl Blog: WebP as OG Image](https://www.ctrl.blog/entry/webp-ogp.html)

**Project Code Inspection (HIGH confidence):**
- `src/layouts/BaseLayout.astro` -- existing meta tags, JSON-LD, canonical URL computation
- `astro.config.ts` -- site URL, missing trailingSlash config
- `public/og-image.jpg` -- JPEG 1200x630 233KB (verified via `sips` and `file`)
- `public/favicon.svg` -- 116-byte emoji placeholder (verified via read)
