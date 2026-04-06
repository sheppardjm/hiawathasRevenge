# Phase 29: SEO & Social Sharing - Research

**Researched:** 2026-04-06
**Domain:** HTML meta tags, OpenGraph protocol, Twitter/X Card spec, Schema.org JSON-LD, Astro static site configuration
**Confidence:** HIGH

---

## Summary

This phase adds social sharing previews and search engine structured data to the site's existing `BaseLayout.astro`. No new npm packages are required — all four requirements (SEO-01 through SEO-04) are implemented as raw HTML `<meta>` tags and a `<script type="application/ld+json">` block directly in the `<head>`. Astro's `set:html` directive handles the JSON-LD injection safely.

The only non-trivial prerequisite is setting the `site` option in `astro.config.ts` to the deployed URL. Without it, `Astro.site` is `undefined`, and canonical URL construction fails. Because the project currently has no `site` set in `astro.config.ts`, this must be added before canonical and absolute OG/Twitter image URLs will build correctly.

The hero image (`/images/irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536.jpg`) is 4:3 (2048×1536) — wider than ideal for OG (1.91:1). It will still work (Facebook/LinkedIn accept it), but a 1200×630 crop named `og-image.jpg` placed at `public/og-image.jpg` is the cleanest solution. Cropping can be done with the `sharp` binary already installed as a devDependency, or manually — the planner should decide. For Twitter `summary_large_image`, the 2048×1536 source image is also acceptable (Twitter crops to 2:1 anyway).

**Primary recommendation:** Implement all four SEO requirements as hand-authored meta tags in `BaseLayout.astro`, add `site` to `astro.config.ts`, create a 1200×630 OG image crop, and validate with Google Rich Results Test and a social debugger.

---

## Standard Stack

### Core

No new packages needed. Everything is native HTML + Astro.

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Native `<meta>` tags | HTML | OpenGraph, Twitter Card | Zero-dependency; all platforms parse standard HTML meta tags |
| `<script type="application/ld+json">` | HTML | Schema.org JSON-LD | Google's recommended format; no library required |
| Astro `set:html` directive | Built-in | Safe JSON injection into script tags | Prevents Astro's default HTML escaping from corrupting JSON |
| `sharp` (devDep, already installed) | ^0.34.5 | OG image crop | Already in project; can produce 1200×630 JPEG from hero image |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-authored meta tags | `astro-seo` npm package (jonasmerlin/astro-seo) | Library adds abstraction; hand-authored is fewer moving parts and the project has only one page |
| Hand-authored JSON-LD | `astro-seo-schema` npm package | Not needed for a single static event schema |

**Decision: hand-roll.** This is a single-page static site. The `astro-seo` library is worth it for multi-page sites; here it's indirection without gain.

### Installation

```bash
# No new packages to install
```

---

## Architecture Patterns

### Recommended Project Structure

No new files required except possibly the OG image:

```
public/
└── og-image.jpg          # NEW: 1200×630 crop of hero image for OG/Twitter

src/
└── layouts/
    └── BaseLayout.astro  # MODIFIED: add meta tags and JSON-LD to <head>

astro.config.ts           # MODIFIED: add site: 'https://...' option
```

### Pattern 1: Canonical URL from Astro.site

**What:** Astro provides `Astro.site` (the `site` config value as a URL object) and `Astro.url.pathname`. Use these to construct canonical and absolute image URLs.

**When to use:** Always — relative URLs in `og:image` and `link rel="canonical"` fail social scrapers.

```astro
// Source: https://docs.astro.build/en/reference/configuration-reference/ + https://eastondev.com/blog/en/posts/dev/20251202-astro-seo-complete-guide/
---
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const ogImageURL = new URL('/og-image.jpg', Astro.site);
---

<link rel="canonical" href={canonicalURL} />
<meta property="og:url" content={canonicalURL} />
<meta property="og:image" content={ogImageURL} />
```

**Prerequisite:** `astro.config.ts` must include `site: 'https://your-deployed-url.com'`. Without it, `Astro.site` is `undefined` and `new URL(...)` throws at build time.

### Pattern 2: OpenGraph Tags (website type)

**What:** Four required OG tags + recommended extras. All use `property=` attribute (not `name=`).

```astro
// Source: https://ogp.me/ + https://eastondev.com/blog/en/posts/dev/20251202-astro-seo-complete-guide/
<meta property="og:type" content="website" />
<meta property="og:url" content={canonicalURL} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={ogImageURL} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Forest creek with autumn foliage — Hiawatha National Forest" />
<meta property="og:site_name" content="Hiawatha's Revenge" />
<meta property="og:locale" content="en_US" />
```

### Pattern 3: Twitter/X Card Tags (summary_large_image)

**What:** Twitter uses `name=` attribute (not `property=`). `summary_large_image` shows a wide image card — best for a photo-forward ride site.

```astro
// Source: https://developer.x.com/en/docs/x-for-websites/cards/overview/summary-card-with-large-image + WebSearch (verified)
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImageURL} />
<meta name="twitter:image:alt" content="Forest creek with autumn foliage — Hiawatha National Forest" />
```

Note: `twitter:site` (your @handle) is optional; omit if no Twitter account exists for this ride.

### Pattern 4: JSON-LD Event Structured Data via set:html

**What:** Build the schema object in the frontmatter, inject with `set:html` to bypass Astro's HTML escaping.

```astro
// Source: https://stephen-lunt.dev/blog/astro-structured-data/ + https://timeaton.dev/posts/adding-structured-data-astro/ + https://developers.google.com/search/docs/appearance/structured-data/event
---
const eventSchema = {
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Hiawatha's Revenge",
  "description": "A 100-mile cycling ride through Michigan's Hiawatha National Forest, supporting the Munising Bay Trail Network.",
  "startDate": "2026-06-06",
  "endDate": "2026-06-06",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Munising, MI",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Munising",
      "addressRegion": "MI",
      "addressCountry": "US"
    }
  },
  "image": [ogImageURL.href],
  "url": canonicalURL.href,
  "organizer": {
    "@type": "Organization",
    "name": "Munising Bay Trail Network",
    "url": "https://mbtn.org"
  }
};
---

<script type="application/ld+json" set:html={JSON.stringify(eventSchema)}></script>
```

**Critical:** Use `set:html`, not `{JSON.stringify(...)}` inside the script tag. Without `set:html`, Astro escapes the JSON and Google cannot parse it.

### Anti-Patterns to Avoid

- **Relative URLs in og:image or canonical:** Social scrapers don't resolve relative URLs. Always use `new URL('/og-image.jpg', Astro.site).href`.
- **Missing `site` in astro.config.ts:** Results in `Astro.site === undefined` → runtime error during build.
- **Using the hero image (2048×1536) directly as og:image:** Not broken, but 4:3 ratio means Facebook crops it unexpectedly. Create a 1200×630 crop for correct 1.91:1 ratio.
- **`{JSON.stringify(schema)}` without `set:html`:** Astro escapes `"` to `&quot;` inside script tags, corrupting the JSON for Google.
- **Putting JSON-LD on a blank page:** Google requires structured data to be on the page that displays the content it describes. Index.astro is correct.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON escaping in script tags | String template literals for JSON | `set:html={JSON.stringify(obj)}` | Astro's escaping corrupts raw JSON; `set:html` bypasses it correctly |
| Absolute URL construction | String concatenation | `new URL(path, Astro.site)` | Handles trailing slashes, encoding, and returns a proper URL object |

**Key insight:** For this project, the complexity is in knowing the right tag names and values — there is no algorithmic complexity. All work is declarative HTML and a JSON object.

---

## Common Pitfalls

### Pitfall 1: `Astro.site` is undefined

**What goes wrong:** Build succeeds but `new URL(Astro.url.pathname, Astro.site)` throws `TypeError: Invalid URL` in production, or produces `undefined/path` strings.

**Why it happens:** `astro.config.ts` has no `site` option set. The current project config (`astro.config.ts`) does NOT have `site` configured.

**How to avoid:** Add `site: 'https://your-url.com'` to `astro.config.ts` as the first task in the plan.

**Warning signs:** `Astro.site` evaluates to `undefined` in the dev console or build output contains literal `undefined` in URLs.

### Pitfall 2: OG image aspect ratio mismatch

**What goes wrong:** Facebook/LinkedIn shows the image with unexpected cropping, cutting off the top or bottom. WhatsApp and Slack may show a square crop.

**Why it happens:** Hero image is 4:3 (2048×1536). OG standard is 1.91:1 (1200×630).

**How to avoid:** Create a dedicated OG image at 1200×630 pixels. The hero image can be cropped with `sharp` (already installed). Place at `public/og-image.jpg`.

**Warning signs:** Facebook Sharing Debugger shows image with letterboxing or unexpected crop.

### Pitfall 3: Twitter ignores tags due to cache

**What goes wrong:** Twitter shows old preview or no preview after deploying.

**Why it happens:** Twitter aggressively caches card data per URL.

**How to avoid:** Use the X Card Validator at `cards-dev.x.com/validator` to force a fresh crawl after deployment.

**Warning signs:** Tags are correct in source but Twitter shows wrong preview.

### Pitfall 4: Google Rich Results Test fails on Event schema

**What goes wrong:** Google cannot parse the Event or marks it as "not eligible for rich results."

**Why it happens:** Either `set:html` was not used (JSON is escaped), required fields are missing (`name`, `startDate`, `location`, `location.address`), or the URL tested is not the page where the markup lives.

**How to avoid:** Test the live URL (not localhost) with https://search.google.com/test/rich-results after deployment. Required fields per Google: `name`, `startDate`, `location` (with `name` and `address`).

### Pitfall 5: og:image URL is not absolute

**What goes wrong:** Social platforms display no image — just the title and description.

**Why it happens:** `og:image` content is `/og-image.jpg` (relative path). Scrapers do not resolve relative URLs.

**How to avoid:** Always use `new URL('/og-image.jpg', Astro.site).href` to produce `https://your-site.com/og-image.jpg`.

---

## Code Examples

### Complete BaseLayout.astro head block

```astro
// Source: Synthesized from ogp.me, developer.x.com, developers.google.com/search, docs.astro.build
---
interface Props {
  title: string;
  description?: string;
}

const {
  title,
  description = "A 100-mile cycling showcase through Michigan's Hiawatha National Forest",
} = Astro.props;

const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const ogImageURL = new URL('/og-image.jpg', Astro.site);

const eventSchema = {
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Hiawatha's Revenge",
  "description": description,
  "startDate": "2026-06-06",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Munising, MI",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Munising",
      "addressRegion": "MI",
      "addressCountry": "US"
    }
  },
  "image": [ogImageURL.href],
  "url": canonicalURL.href,
  "organizer": {
    "@type": "Organization",
    "name": "Munising Bay Trail Network",
    "url": "https://mbtn.org"
  }
};
---

<head>
  <!-- ... existing tags ... -->

  <!-- Canonical -->
  <link rel="canonical" href={canonicalURL} />

  <!-- OpenGraph (SEO-01) -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalURL} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImageURL} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Hiawatha National Forest autumn creek — Hiawatha's Revenge 100-mile ride" />
  <meta property="og:site_name" content="Hiawatha's Revenge" />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter Card (SEO-02) -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImageURL} />
  <meta name="twitter:image:alt" content="Hiawatha National Forest autumn creek — Hiawatha's Revenge 100-mile ride" />

  <!-- Event JSON-LD (SEO-04) -->
  <script type="application/ld+json" set:html={JSON.stringify(eventSchema)}></script>
</head>
```

### astro.config.ts site option

```typescript
// Source: https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: 'https://your-deployed-url.com', // required for Astro.site and canonical URLs
  output: 'static',
  // ... rest of existing config
});
```

### OG image crop with sharp (CLI)

```bash
# Source: sharp docs — already installed as devDependency
node -e "
const sharp = require('sharp');
sharp('public/images/irrVhAXHnnFzslJGVemLiPEy5iQFbqZF6VzqxYOHL1o-2048x1536.jpg')
  .resize(1200, 630, { position: 'centre' })
  .jpeg({ quality: 85 })
  .toFile('public/og-image.jpg')
  .then(() => console.log('done'));
"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Twitter Card `twitter:` tags via Twitter developer portal | X Card validator at `cards-dev.x.com/validator` | 2023 (rebrand) | Same tag names, different validator URL |
| Microdata / RDFa structured data | JSON-LD in `<script>` tag | ~2015 | JSON-LD is Google's official recommendation now; no page markup pollution |
| `og:image` as relative URL | Absolute URL required | Always required | Many devs still get this wrong |

**Deprecated/outdated:**
- Twitter meta `twitter:creator:id`: Only needed if linking to a specific Twitter account. Not required for `summary_large_image`.
- Microdata HTML attributes: Not used by Google for Events anymore. JSON-LD only.

---

## Open Questions

1. **What is the deployed site URL?**
   - What we know: The project is `output: 'static'` and `astro.config.ts` has no `site` set. No `.env` files or deployment config found.
   - What's unclear: The canonical URL depends on where the site will be hosted (GitHub Pages, Netlify, custom domain, etc.)
   - Recommendation: The plan should include a placeholder URL (e.g., `https://hiawathasrevenge.com`) and note that the owner must update this before deploying. Alternatively, the plan task can use `import.meta.env.SITE` as a fallback pattern.

2. **Should og:image be the hero image directly or a purpose-made crop?**
   - What we know: Hero is 2048×1536 (4:3). OG standard is 1200×630 (1.91:1). The existing photo works but Facebook/LinkedIn will crop it.
   - Recommendation: Create `public/og-image.jpg` as a 1200×630 center-crop of the hero using `sharp`. This is a one-liner and `sharp` is already installed.

3. **endDate for the Event schema?**
   - What we know: The ride is June 6, 2026. No end time is specified anywhere in the codebase.
   - What's unclear: Is it a one-day event with a known finish time, or should endDate be omitted?
   - Recommendation: Set `endDate: "2026-06-06"` (same as startDate) to indicate a single-day event. Google accepts date-only ISO 8601 for events without a specific end time.

---

## Sources

### Primary (HIGH confidence)
- https://ogp.me/ — Complete OpenGraph tag specification (og:type, og:url, og:title, og:description, og:image, og:image:width, og:image:height, og:site_name, og:locale)
- https://developers.google.com/search/docs/appearance/structured-data/event — Google's required/recommended Event JSON-LD properties, JSON-LD example
- https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data — JSON-LD parsing requirements, `set:html` necessity
- https://docs.astro.build/en/reference/configuration-reference/ — `site` config option and `Astro.site` behavior

### Secondary (MEDIUM confidence)
- https://eastondev.com/blog/en/posts/dev/20251202-astro-seo-complete-guide/ — Manual BaseLayout meta tag pattern for Astro; canonical URL construction with `new URL(Astro.url.pathname, Astro.site)` — verified against Astro docs
- https://stephen-lunt.dev/blog/astro-structured-data/ — JSON-LD component pattern with `set:html` — verified against Astro template directives docs
- https://timeaton.dev/posts/adding-structured-data-astro/ — `set:html` + `JSON.stringify()` anti-XSS pattern — verified against Astro docs
- https://myogimage.com/blog/og-image-size-meta-tags-complete-guide — OG image 1200×630 recommended size — verified against ogp.me spec

### Tertiary (LOW confidence)
- WebSearch results on Twitter/X `summary_large_image` tags — tag names verified against historical developer.twitter.com docs; X developer portal now requires payment to access, reducing direct verification ability. Community consensus on tag names is high-confidence but official X docs are paywalled.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — hand-authored HTML meta tags require no library; well-documented by OG protocol and Google
- Architecture: HIGH — single-page static site; one BaseLayout file to modify; Astro `set:html` pattern verified by multiple sources
- Pitfalls: HIGH — `Astro.site` requirement and `set:html` necessity are the two most likely failure modes; both well-documented

**Research date:** 2026-04-06
**Valid until:** 2026-07-06 (stable spec — OG and Schema.org change slowly; re-verify if Astro major version changes)
