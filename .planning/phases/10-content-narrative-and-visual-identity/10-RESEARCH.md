# Phase 10: Content, Narrative, and Visual Identity - Research

**Researched:** 2026-03-31
**Domain:** Astro static site content, CSS visual design, build-time data access
**Confidence:** HIGH (verified with Astro docs + codebase inspection)

---

## Summary

Phase 10 adds six things to an existing Astro static site: narrative content, a route stats block, a donate CTA, a GPX download link, a badge h1 enhancement (which largely already exists), and topographic decorative patterns. All tasks are buildable with zero new dependencies — the stack is Astro + Tailwind v4 + inline SVG/CSS.

The most important discovery is that **the badge h1 (plan 10-05) is substantially complete**: `index.astro` already contains a full shield SVG with arrowhead, curved textPath labels, amber/forest colors, and National Park font. Plan 10-05 needs only refinement (tweak sizing, possibly add decorative rule under the miles label), not a from-scratch build. The planner should scope 10-05 narrowly.

For the route stats block, content collections are already defined and typed (`src/content.config.ts` has `routeData` and `annotations` collections). The correct Astro 5 pattern is `getEntry('routeData', 'route')` for `meta.totalMiles` / `meta.elevationGainFeet` and `getCollection('annotations')` filtered by `type === 'sector'` to derive surface-type breakdown — all in the Astro frontmatter, zero runtime fetch needed.

**Primary recommendation:** All plans in this phase use zero new npm packages. Implement with native Astro build-time data access, HTML `download` attribute, CSS/SVG data-URI patterns, and well-researched narrative prose.

---

## Standard Stack

### Core (already in project)
| Tool | Version | Purpose | Why Used |
|------|---------|---------|----------|
| Astro | ^6.1.1 | Static site framework | Already in use |
| Tailwind v4 | ^4.2.2 | Utility CSS | Already in use |
| `astro:content` | built-in | Build-time JSON collection access | Already configured |
| National Park (Google font) | — | Display headings + badge text | Already loaded via `--font-display` |
| Space Mono | — | Body/mono text | Already loaded via `--font-mono` |

### No New Dependencies Needed
All Phase 10 tasks are achievable with the existing stack. No npm installs required.

### Alternatives Considered
| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| `getEntry` from `astro:content` | `fetch('/data/route-data.json')` at runtime | Build-time is better: zero latency, typed, inline in template |
| Inline SVG topographic pattern | External SVG file | Data URI avoids extra HTTP request; file() loader not needed |
| CSS `clip-path` shield badge | SVG `<path>` shield | SVG path already exists and works; do not replace |

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── RouteMap.astro          (existing)
│   ├── ElevationProfile.astro  (existing)
│   ├── PhotoGallery.astro      (existing)
│   ├── RouteStats.astro        (NEW — plan 10-02)
│   └── DonateCallout.astro     (NEW — plan 10-03)
├── pages/
│   └── index.astro             (MODIFIED — plans 10-01, 10-04, 10-05, 10-06)
public/
└── Munising_Hiawatha_s_Revenge.gpx  (COPY from project root — plan 10-04)
```

### Pattern 1: Build-Time Data Access via Content Collections (VERIFIED)
**What:** Query `routeData` and `annotations` collections in Astro frontmatter at build time  
**When to use:** Route stats block (plan 10-02)  
**Example:**
```astro
---
// Source: https://docs.astro.build/en/reference/modules/astro-content/
import { getEntry, getCollection } from 'astro:content';

const routeEntry = await getEntry('routeData', 'route');
const { totalMiles, elevationGainFeet } = routeEntry.data.meta;

const annotations = await getCollection('annotations');
const sectors = annotations.filter(a => a.data.type === 'sector');
const easyMiles  = sectors.filter(s => s.data.difficulty === 'easy')
                          .reduce((sum, s) => sum + s.data.lengthMiles, 0);
const modMiles   = sectors.filter(s => s.data.difficulty === 'moderate')
                          .reduce((sum, s) => sum + s.data.lengthMiles, 0);
const hardMiles  = sectors.filter(s => s.data.difficulty === 'hard')
                          .reduce((sum, s) => sum + s.data.lengthMiles, 0);
const forestRoadMiles = totalMiles - (easyMiles + modMiles + hardMiles);
---
```
Note: Content collection entries expose `entry.data.*` not `entry.*` directly.

### Pattern 2: GPX File Placement and Download Link (VERIFIED)
**What:** Place GPX in `public/` so Astro copies it to `dist/` untouched; use HTML `download` attribute  
**When to use:** Plan 10-04  
**Notes:**
- Files in `public/` are served at their path from the site root: `public/route.gpx` → `/route.gpx`
- The `download` attribute only works same-origin (fine for this static site)
- Prefer the smaller GPX: `Munising_Hiawatha_s_Revenge.gpx` (~5,796 lines) over `Hiawatha_100.gpx` (~252,923 lines)
- Copy happens manually (or via a pipeline script step) before build

```html
<!-- Source: MDN HTMLAnchorElement download -->
<a href="/Munising_Hiawatha_s_Revenge.gpx" download="HiawathasRevenge.gpx">
  Download GPX
</a>
```

### Pattern 3: SVG Data URI as CSS Background Pattern (VERIFIED)
**What:** Embed inline SVG as `background-image: url('data:image/svg+xml;utf8,...')` in CSS  
**When to use:** Topographic pattern section dividers / backgrounds (plan 10-06)  
**Notes:**
- Use `%23` for `#` characters in fill colors (URL-encode `#`)
- SVG must have `xmlns="http://www.w3.org/2000/svg"` attribute
- UTF-8 encoding preferred over base64 for readability and editability
- Keep SVG tile small (e.g., 200×200) and let `background-repeat: repeat` tile it

```css
/* Source: css-tricks.com/lodge/svg/09-svg-data-uris/ */
.topo-divider {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><path d="M0 100 Q50 60 100 100 Q150 140 200 100" stroke="%234a8a4a" stroke-width="1" fill="none" opacity="0.4"/><path d="M0 120 Q50 80 100 120 Q150 160 200 120" stroke="%234a8a4a" stroke-width="1" fill="none" opacity="0.25"/></svg>');
  background-repeat: repeat;
  background-size: 200px 200px;
}
```

### Pattern 4: Donate CTA Above-Fold Placement
**What:** Insert DonateCallout.astro between the badge hero section and "The Route" section  
**When to use:** Plan 10-03  
**Layout rationale:** The current `index.astro` hero section is the badge + one-liner. Placing the CTA directly after it (before the map section) ensures desktop viewport shows badge + CTA without scrolling.  
**Button pattern:** Use the existing `--border-badge` token (3px solid amber) + `--shadow-badge` + action-oriented text + `href="https://mbtn.org/donate"`.

### Anti-Patterns to Avoid
- **Do NOT remove or replace the existing shield SVG badge**: It is already correct. Only refine styling if needed (10-05 is narrow scope).
- **Do NOT use `fetch()` at runtime for route stats**: Content collections already provide typed build-time access; there is no reason to defer this to the browser.
- **Do NOT copy BOTH GPX files to public/**: `Hiawatha_100.gpx` is 252,923 lines (~10MB uncompressed). Use only `Munising_Hiawatha_s_Revenge.gpx` (~5,796 lines, much smaller) unless there is a specific reason for the larger file.
- **Do NOT use a raster image for topographic pattern**: Pure CSS/SVG keeps the pattern colorable via CSS variables and adds no file size penalty.
- **Do NOT wrap route stats in a `<script>` tag**: Stats are static build-time data, not runtime-computed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Surface breakdown calculation | Manual JS parser | `getCollection('annotations')` filter+reduce in frontmatter | Already typed, already correct |
| Font rendering in badge | Custom web font loading | `var(--font-display)` / National Park already loaded via astro.config.ts | Font is already preloaded in BaseLayout |
| Topographic tiling | External SVG file + `<img>` | Inline SVG data URI in CSS `background-image` | No extra HTTP request, no `public/` clutter |
| Download behavior | JS `Blob` / fetch-and-download | HTML `download` attribute on `<a>` | Native browser, zero JS, same-origin works fine |

**Key insight:** The entire data layer (route-data.json, annotations.json) is already in content collections with Zod schemas. This phase just needs to surface that data in the template — no data pipeline changes required.

---

## Common Pitfalls

### Pitfall 1: Wrong content collection entry ID
**What goes wrong:** `getEntry('routeData', 'wrong-id')` returns `undefined`, crashing the build  
**Why it happens:** The `routeData` loader wraps the JSON as `[{ id: 'route', ...data }]` — the ID is `'route'` not the file path  
**How to avoid:** Use `getEntry('routeData', 'route')` exactly — confirmed from `src/content.config.ts` line 12  
**Warning signs:** TypeScript error "Argument of type 'X' is not assignable" or null pointer on `.data`

### Pitfall 2: Accessing collection entry fields without `.data`
**What goes wrong:** `entry.totalMiles` is `undefined`; `entry.data.meta.totalMiles` is correct  
**Why it happens:** Astro content collection entries wrap schema fields under `.data`  
**How to avoid:** Always use `entry.data.meta.*` for routeData, `entry.data.difficulty` for annotation sectors

### Pitfall 3: GPX file too large for user download
**What goes wrong:** `Hiawatha_100.gpx` is ~252,923 lines — potentially 5-10MB, bad UX on mobile  
**Why it happens:** Two GPX files exist at project root with very different sizes  
**How to avoid:** Copy only `Munising_Hiawatha_s_Revenge.gpx` to `public/`. Verify file size before committing.

### Pitfall 4: `#` characters in SVG data URI break CSS
**What goes wrong:** `stroke="#4a8a4a"` inside `url('...')` terminates the CSS string at `#`  
**Why it happens:** `#` is a CSS fragment identifier  
**How to avoid:** URL-encode `#` as `%23` in all color values inside SVG data URIs: `stroke="%234a8a4a"`

### Pitfall 5: Badge h1 over-engineering
**What goes wrong:** Plan 10-05 treated as a from-scratch build when badge already exists  
**Why it happens:** Phase description says "implement national park badge-style h1" without noting the existing implementation  
**How to avoid:** Audit `index.astro` badge CSS first (lines 92-167). Shield SVG, arrowhead, textPath arcs, National Park font are ALL already there. 10-05 should be a refinement task, not a creation task. Possible refinements: add a thin horizontal rule between "Hiawatha's Revenge" and "100 Miles", fine-tune responsive sizing, or add a subtle inner glow. Do NOT rebuild from scratch.

### Pitfall 6: Surface breakdown label mismatch
**What goes wrong:** Calling unannotated miles "pavement" or "singletrack" when they are actually forest roads  
**Why it happens:** 71.4% of route miles (72.8 of 101.98) have no sector annotation — they are the connective forest road sections  
**How to avoid:** Label unannotated miles as "Forest Roads" or "Gravel/Two-Track". Annotated sectors break down as: 7.9mi easy singletrack, 15.0mi moderate singletrack, 6.3mi hard singletrack. Present this clearly.

---

## Code Examples

Verified patterns from official sources and codebase inspection:

### Route Stats Block (Build-Time Data)
```astro
---
// RouteStats.astro — Source: astro:content API + content.config.ts inspection
import { getEntry, getCollection } from 'astro:content';

const routeEntry = await getEntry('routeData', 'route');
const { totalMiles, elevationGainFeet } = routeEntry!.data.meta;

const allAnnotations = await getCollection('annotations');
const sectors = allAnnotations.filter(a => a.data.type === 'sector');
const easyMiles     = sectors.filter(s => s.data.difficulty === 'easy').reduce((n, s) => n + s.data.lengthMiles, 0);
const moderateMiles = sectors.filter(s => s.data.difficulty === 'moderate').reduce((n, s) => n + s.data.lengthMiles, 0);
const hardMiles     = sectors.filter(s => s.data.difficulty === 'hard').reduce((n, s) => n + s.data.lengthMiles, 0);
const roadMiles     = Math.round((totalMiles - easyMiles - moderateMiles - hardMiles) * 10) / 10;
---
```

### GPX Download Link
```html
<!-- Place in index.astro after GPX file copied to public/ -->
<a href="/Munising_Hiawatha_s_Revenge.gpx" download="HiawathasRevenge.gpx"
   class="inline-block border-[--border-badge] px-6 py-3 text-amber-400 font-bold uppercase tracking-widest">
  Download GPX
</a>
```

### Topographic Pattern Divider (CSS Data URI)
```css
/* Section divider with repeating contour lines */
.topo-section-divider {
  height: 60px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="60"><path d="M0 30 Q100 10 200 30 Q300 50 400 30" stroke="%233d6b3d" stroke-width="1.5" fill="none"/><path d="M0 45 Q100 25 200 45 Q300 65 400 45" stroke="%233d6b3d" stroke-width="1" fill="none" opacity="0.5"/></svg>');
  background-repeat: repeat-x;
  background-size: 400px 60px;
  opacity: 0.7;
}
```

### Donate CTA Component Pattern
```astro
---
// DonateCallout.astro
---
<div class="flex justify-center py-[--spacing-element]">
  <a
    href="https://mbtn.org/donate"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-block border-[3px] border-amber-500 px-8 py-4
           text-amber-400 font-bold uppercase tracking-widest text-lg
           shadow-[4px_4px_0px_rgba(0,0,0,0.5)]
           hover:bg-amber-500 hover:text-forest-950 transition-colors"
  >
    Donate to MBTN
  </a>
</div>
```

---

## Content Research: Historical Narrative

Verified historical facts for the Hiawatha narrative content (plans 10-01):

### The Historical Hiawatha (MEDIUM confidence — Wikipedia + NPS)
- Haudenosaunee (Iroquois) leader, associated with the Mohawk people
- Central figure in uniting the Five Nations (Seneca, Cayuga, Onondaga, Oneida, Mohawk) into the Iroquois Confederacy
- Carried Deganawida's message of peace; his historical territory was present-day southern Ontario and upper New York

### Longfellow's Hiawatha (MEDIUM confidence — Wikipedia + NPS)
- 1855 epic poem by Henry Wadsworth Longfellow
- Despite the name, Longfellow's character is based on **Ojibwe** (not Iroquois) oral traditions — specifically the figure of Manabozho
- Longfellow mistakenly conflated the Iroquois Hiawatha with Ojibwe/Chippewa legends
- The poem is geographically set in the Pictured Rocks area of Michigan's Upper Peninsula — i.e., the exact landscape of this route
- Key source for Longfellow: Henry Rowe Schoolcraft's ethnographic work on Ojibwe culture

### Hiawatha National Forest Naming (HIGH confidence — USFS + Wikipedia)
- Named after the Mohawk chief Hiawatha (via the Longfellow poem's cultural popularity)
- West Unit designated Hiawatha National Forest in 1931
- Location: Michigan's Upper Peninsula, ~894,836 acres
- Features: over 100 miles of Great Lakes shoreline, 6 wilderness areas, 5 Wild & Scenic Rivers
- The forest's naming reflects how Longfellow's poem shaped cultural geography of the region

### MBTN Mission (HIGH confidence — mbtn.org)
- Munising Bay Trail Network, 501(c)(3) nonprofit
- Founded 2012 by Rob Lundquist and Mike Verhamme
- Builds and maintains singletrack trail system in Munising Bay area / Hiawatha National Forest (Valley Spur Recreation Area, Bruno's Run H-13, Grand Island)
- Organizes events including **Hiawatha's Revenge** (the route this site covers)
- Donate URL: `https://mbtn.org/donate`

### Surface Type Breakdown (HIGH confidence — calculated from annotations.json)
- Total route: 101.98 miles
- Easy singletrack: 7.9 miles (7.7%) — Bass Lake Rd (4.8mi), Doe Lake (3.1mi)
- Moderate singletrack/two-track: 15.0 miles (14.7%) — 520, NF2266, NF2217, ND2225
- Hard singletrack: 6.3 miles (6.2%) — Rapid River Truck Trail
- Forest roads / gravel: ~72.8 miles (71.4%) — unannotated connective segments

---

## Key Decisions for Planner

1. **10-05 is a refinement, not a creation**: Badge SVG exists at index.astro lines 11-44. Plan should say "audit and refine" not "build from scratch." Acceptable refinements: decorative rule between title and miles, minor sizing adjustments.

2. **10-04 GPX selection**: Use `Munising_Hiawatha_s_Revenge.gpx` (small file). Add a copy step to public/ in the pipeline script OR add to `prebuild` npm script. Destination: `public/Munising_Hiawatha_s_Revenge.gpx`.

3. **10-02 component vs. inline**: RouteStats can be either a new component (`RouteStats.astro`) or an inline section in `index.astro`. A separate component is cleaner given the data query complexity.

4. **10-03 placement**: DonateCallout goes between the hero badge section and "The Route" section in index.astro. This ensures it's visible above the fold on desktop (badge is ~300-420px tall, donate button sits at ~500px from top before first scroll).

5. **10-06 topographic pattern approach**: Pure CSS SVG data URI. No external file needed. Use `var(--color-forest-700)` translated to `%233d6b3d` for the stroke color. Apply as section divider (horizontal strip between major sections) rather than full-page texture (which would fight with the forest-900 background).

6. **10-01 narrative placement**: The existing "The Route" section has placeholder text. Replace that text with the Hiawatha narrative. Do not add a new section — expand the existing one. Keep prose concise (3-4 paragraphs): Longfellow poem context → geographical connection to Upper Peninsula → National Forest naming → MBTN and the event.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| `fetch('/data/route-data.json')` at runtime | `getEntry('routeData', 'route')` in frontmatter | Zero runtime cost, TypeScript typed |
| Base64-encoded SVG backgrounds | UTF-8 URL-encoded SVG in data URI | Smaller, readable, maintainable |
| Content collections with `src/content/` folder | Content Layer API with `file()` / `glob()` loaders | Already in use (Astro 5 pattern) |

---

## Open Questions

1. **Which GPX file is canonical for riders?**
   - What we know: `Munising_Hiawatha_s_Revenge.gpx` is much smaller (5,796 lines vs 252,923); both exist at project root
   - What's unclear: Whether the smaller file has fewer waypoints that would make it less useful on GPS devices
   - Recommendation: Use the smaller file. If riders need the full-resolution file, document this in a code comment.

2. **Surface type label for unannotated miles**
   - What we know: 71.4% of route is unannotated
   - What's unclear: Whether these are technically "gravel," "forest roads," "two-track," or mixed
   - Recommendation: Label as "Forest Roads" — that matches the Hiawatha National Forest context and is the most accurate general term for USFS road surfaces.

3. **Topographic pattern visual weight**
   - What we know: Forest 900 background is dark (#1a2e1a); using forest-700 (#3d6b3d) for subtle pattern
   - What's unclear: Whether pattern will be visible enough without being distracting
   - Recommendation: Start with `opacity: 0.5-0.7` and test. The pattern should be felt not seen.

---

## Sources

### Primary (HIGH confidence)
- Astro `astro:content` API docs — `getCollection` and `getEntry` usage
- `src/content.config.ts` — confirmed collection names (`routeData`, `annotations`) and entry ID (`'route'`)
- `src/pages/index.astro` — confirmed badge SVG already complete (lines 11-44, styles 92-167)
- `public/data/annotations.json` — confirmed 7 sectors, surface breakdown calculation
- `public/data/route-data.json` — confirmed `meta.totalMiles: 101.98`, `meta.elevationGainFeet: 2258`
- `astro.config.ts` — confirmed National Park font loaded, `output: 'static'`
- Astro project structure docs — confirmed `public/` files copied untouched to `dist/`

### Secondary (MEDIUM confidence)
- Wikipedia: The Song of Hiawatha — Longfellow poem, Ojibwe connection, geographic setting
- Wikipedia: Hiawatha National Forest — naming history, USFS designation 1931
- NPS: Longfellow House / Hiawatha page — historical vs fictional Hiawatha distinction
- mbtn.org — MBTN mission, donate URL, organization founding

### Tertiary (LOW confidence)
- CSS-Tricks SVG data URI pattern — encoding approach for `background-image`
- General CTA above-fold placement research — position DonateCallout below hero badge

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — inspected package.json, astro.config.ts, content.config.ts directly
- Architecture: HIGH — getEntry/getCollection verified with official Astro docs; build patterns match existing components
- Content/history: MEDIUM — Wikipedia and NPS sources; facts are well-established but sourced from secondary not primary historical records
- Pitfalls: HIGH — derived directly from code inspection (badge exists, GPX sizes, collection schema)

**Research date:** 2026-03-31
**Valid until:** 2026-06-30 (Astro API stable; content/history facts don't expire)
