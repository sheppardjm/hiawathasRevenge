# Phase 53: Crawlability - Research

**Researched:** 2026-04-09
**Domain:** Astro sitemap integration, robots.txt generation
**Confidence:** HIGH

## Summary

Phase 53 is a narrow, well-defined SEO infrastructure task: generate a valid `robots.txt` and an auto-generated `sitemap.xml` at build time. The site is already `output: 'static'` with `site: 'https://hiawathasrevenge.com'` set in `astro.config.mjs` — both prerequisites are satisfied.

The standard approach is `@astrojs/sitemap` (official integration, v3.7.2 current, not yet installed). It produces `sitemap-index.xml` + `sitemap-0.xml` at build time from all statically-generated routes. A `filter()` callback excludes `/admin` and `/api/` paths. `robots.txt` should be a static file in `public/` or a dynamic Astro endpoint (`src/pages/robots.txt.ts`) pointing to `sitemap-index.xml`.

This is low-complexity work: install one package, update `astro.config.mjs`, add a `robots.txt` source. No architecture decisions are needed.

**Primary recommendation:** Use `@astrojs/sitemap` with a `filter()` to exclude `/admin` and `/api/`, add a static `public/robots.txt` pointing to `https://hiawathasrevenge.com/sitemap-index.xml`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@astrojs/sitemap` | 3.7.2 | Auto-generate sitemap-index.xml + sitemap-0.xml at build time | Official Astro integration; zero-config for static sites |

### Supporting

No additional libraries needed. `robots.txt` is a plain text file — static file in `public/` is the simplest and most correct approach for a static site.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `public/robots.txt` (static) | `src/pages/robots.txt.ts` (dynamic endpoint) | Dynamic is useful when you want to DRY up the `site` URL from config. For a static site with one URL, the static file is simpler and has no build-time dependency. |
| `@astrojs/sitemap` | `astro-robots-txt` (third-party) | Third-party handles robots.txt generation but is unnecessary complexity when a static file works. |
| `@astrojs/sitemap` | Hand-rolled `src/pages/sitemap.xml.ts` endpoint | Custom approach requires manual page enumeration; misses the automatic route discovery that `@astrojs/sitemap` provides. |

**Installation:**

```bash
npx astro add sitemap
# OR manually:
npm install @astrojs/sitemap
```

---

## Architecture Patterns

### Recommended Project Structure

```
public/
└── robots.txt          # Static text file — served as-is

astro.config.mjs        # Add sitemap integration + filter

# Build output (dist/):
dist/
├── sitemap-index.xml   # Master index referenced by robots.txt
└── sitemap-0.xml       # Actual page entries
```

### Pattern 1: Sitemap with Path Filter

**What:** Configure `@astrojs/sitemap` with a `filter()` to exclude admin and API paths.

**When to use:** Any time there are pages/routes that should not be indexed (admin panels, API endpoints).

**Example:**
```javascript
// astro.config.mjs
// Source: https://docs.astro.build/en/guides/integrations-guide/sitemap/
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://hiawathasrevenge.com',
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/api/'),
    }),
  ],
  // ... existing fonts and vite config
});
```

### Pattern 2: Static robots.txt

**What:** Plain text file in `public/` — Astro copies it to `dist/` unchanged.

**When to use:** Static sites with known, stable `site` URL. No templating needed.

**Example:**
```
# public/robots.txt
# Source: https://docs.astro.build/en/guides/integrations-guide/sitemap/
User-agent: *
Allow: /

Disallow: /admin
Disallow: /api/

Sitemap: https://hiawathasrevenge.com/sitemap-index.xml
```

### Anti-Patterns to Avoid

- **Pointing robots.txt Sitemap: at `sitemap.xml`**: `@astrojs/sitemap` outputs `sitemap-index.xml`, not `sitemap.xml`. Pointing to `sitemap.xml` will 404.
- **Referencing a relative sitemap URL in robots.txt**: The `Sitemap:` directive requires a full absolute URL including `https://`.
- **Using `changefreq` or `priority` to influence Google**: Google ignores both fields. Don't spend time configuring them.
- **Skipping the `filter()` for /admin**: Even though `/admin` redirects to `/` in production, the sitemap integration will still list it. Explicitly filter it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sitemap generation | Manual `sitemap.xml.ts` endpoint enumerating pages | `@astrojs/sitemap` | Automatic route discovery; handles index + multi-file chunking; edge cases with trailing slashes |
| robots.txt generation | Dynamic endpoint with `import.meta.env.SITE` | Static `public/robots.txt` | Static sites have a fixed URL; no templating value; static file is simpler and zero-risk |

**Key insight:** The sitemap problem looks trivial but automatic route discovery is the hard part. `@astrojs/sitemap` hooks into Astro's build to enumerate all generated routes — a hand-rolled approach requires duplicating that discovery logic.

---

## Common Pitfalls

### Pitfall 1: Wrong Sitemap URL in robots.txt

**What goes wrong:** Developer writes `Sitemap: https://hiawathasrevenge.com/sitemap.xml` — this 404s because `@astrojs/sitemap` outputs `sitemap-index.xml`.
**Why it happens:** Name confusion — you'd expect a single `sitemap.xml`.
**How to avoid:** Always reference `sitemap-index.xml` in `robots.txt`. Verify the dist/ output after first build.
**Warning signs:** Google Search Console "Sitemap could not be read" error.

### Pitfall 2: `site` Not Set in astro.config

**What goes wrong:** `@astrojs/sitemap` throws an error or produces no output if `site` is not set.
**Why it happens:** Integration requires the full origin to construct absolute URLs.
**How to avoid:** Confirm `site: 'https://hiawathasrevenge.com'` is present before adding the integration. (It already is in this project.)

### Pitfall 3: /admin Appearing in Sitemap

**What goes wrong:** `/admin` is a page file (`src/pages/admin.astro`) so `@astrojs/sitemap` will list it unless explicitly filtered.
**Why it happens:** The integration discovers all page routes regardless of their runtime behavior (the redirect to `/` only happens at runtime, not at build-time).
**How to avoid:** Use `filter: (page) => !page.includes('/admin')` in the sitemap config.

### Pitfall 4: API Routes in Sitemap

**What goes wrong:** API routes like `src/pages/api/save-manifest.ts` are `.ts` endpoint files, not page files — `@astrojs/sitemap` does NOT include them automatically. However, if a `robots.txt.ts` endpoint is created, it won't appear in the sitemap either.
**Why it happens:** The integration correctly distinguishes between page files and endpoint files.
**How to avoid:** No action needed for endpoints. Adding `/api/` to the filter is belt-and-suspenders but not strictly required.

---

## Code Examples

Verified patterns from official sources:

### Complete astro.config.mjs (after integration)

```javascript
// Source: https://docs.astro.build/en/guides/integrations-guide/sitemap/
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://hiawathasrevenge.com',
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/api/'),
    }),
  ],
  fonts: [
    // ... existing font config unchanged
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### public/robots.txt

```
User-agent: *
Allow: /

Disallow: /admin
Disallow: /api/

Sitemap: https://hiawathasrevenge.com/sitemap-index.xml
```

### Verification after build

```bash
# After `npm run build`, check dist/ output:
ls dist/sitemap*.xml
# Should show: sitemap-index.xml  sitemap-0.xml

# Verify robots.txt content:
cat dist/robots.txt
# Should show Sitemap line pointing to sitemap-index.xml

# Check sitemap-0.xml contents:
cat dist/sitemap-0.xml
# Should NOT include /admin or /api/ URLs
# Should include https://hiawathasrevenge.com/
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-rolled `sitemap.xml` in public/ | `@astrojs/sitemap` integration | Astro v2+ | Automatic route discovery; no manual maintenance |
| Static `public/robots.txt` | Still standard for static sites | N/A | No change needed for static output |

**Deprecated/outdated:**
- `astro-robots-txt` (third-party): superseded for most use cases by the simple static file approach for static sites.

---

## Open Questions

1. **Does this site have only one page (index.astro)?**
   - What we know: `src/pages/` contains `index.astro`, `admin.astro`, and `api/save-manifest.ts`. So there is exactly one public-facing page: `/`.
   - What's unclear: Nothing — the sitemap will just have one entry.
   - Recommendation: Filter out `/admin`, the sitemap will contain only `https://hiawathasrevenge.com/`. This is correct.

2. **Should the admin page also have a `<meta name="robots" content="noindex">` tag?**
   - What we know: CRAWL-03 says canonical URL is complete (Phase 50). The success criteria only mention robots.txt Disallow and sitemap exclusion.
   - What's unclear: Whether noindex meta on admin is in scope.
   - Recommendation: Out of scope per phase requirements. The robots.txt `Disallow: /admin` is sufficient for the stated success criteria.

---

## Sources

### Primary (HIGH confidence)
- `https://docs.astro.build/en/guides/integrations-guide/sitemap/` — Installation, config options, filter syntax, output file names, robots.txt reference pattern
- `https://docs.astro.build/en/guides/endpoints/` — Astro endpoint file naming convention (`.txt.ts` pattern), static GET export syntax
- `npm show @astrojs/sitemap version` (local CLI) — confirmed version 3.7.2

### Secondary (MEDIUM confidence)
- WebSearch results (April 2026): confirmed static file approach for robots.txt is standard for static Astro sites; confirmed `@astrojs/sitemap` is the standard tool

### Tertiary (LOW confidence)
- None — all key claims verified with official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@astrojs/sitemap` is the official integration, version confirmed via npm
- Architecture: HIGH — output filenames (`sitemap-index.xml`) and filter syntax verified from official docs
- Pitfalls: HIGH — wrong sitemap URL and /admin inclusion pitfalls derived directly from documented behavior

**Research date:** 2026-04-09
**Valid until:** 2026-07-09 (stable library, 90-day window appropriate)
