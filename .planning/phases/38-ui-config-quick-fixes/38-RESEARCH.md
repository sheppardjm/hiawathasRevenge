# Phase 38: UI & Config Quick Fixes - Research

**Researched:** 2026-04-07
**Domain:** Astro config, Leaflet divIcon styling, RouteExplainer photo logic
**Confidence:** HIGH

## Summary

Phase 38 has three fully independent single-file fixes. Each was researched by directly reading the affected source files and data. No external library APIs are involved beyond what is already in use. All three fixes are mechanical edits with no shared risk surface and no new dependencies.

**LABEL-01 (map labels):** The sector pill labels in `RouteMap.astro` are rendered via Leaflet `divIcon` with inline styles. Current values are `font-size: 11px` and `padding: 3px 8px`. The label text is `{sector.name}` which for the longest names ("NF2217-2218", "Bass Lake Rd") will clip at these sizes. The fix is to bump font-size and padding inline — no CSS class to update, the style lives entirely in the divIcon `html` string template.

**PHOTO-01 (520 segment photo):** The 520 segment spans mile 0.0–5.0 in `RouteExplainer.astro`. The photo filter is `p.mile >= seg.startMi && p.mile < seg.endMi`. The minimum photo mile in `photos.json` is 5.51, which falls just outside the boundary. No photos exist in `images/` or `public/images/` that are confirmed to be from CR-520 or Munising Falls (mile 0–5.0). The two new untracked images (`481217662_*.jpg` = Island Lake Campground sign, `486608604_*.jpg` = riders on sandy trail) are not from mile 0–5.0. The closest feasible fix is reassigning the mile 5.51 photo (`3PCGOOVOwBqssLxnyUx4ca6DmyvpSlk49x6iLrCzLK0`) to be "shared" with 520 by adjusting the segment boundary from `endMi: 5.0` to `endMi: 5.6` — NF2266 currently has 8 photos at mile 5.51+ so it loses only its least-impactful first photo. Alternatively, accept the gradient fallback as shipped state and remove the blocker note.

**DEPLOY-01 (site URL):** `astro.config.ts` already has `site: 'https://hiawathasrevenge.com'` but with a `// TODO: update to actual deployed URL` comment. `BaseLayout.astro` uses `Astro.site` to construct canonical URLs and OG image URLs. The fix is a comment removal only — the value is already correct. No deployment infrastructure files (netlify.toml, vercel.json) exist in the repo; the deployed URL cannot be verified from the codebase alone.

**Primary recommendation:** All three fixes are single-file, low-risk edits. Execute in any order. PHOTO-01 has the most design judgment required (boundary shift vs. gradient acceptance).

## Standard Stack

### Core (already in use, no new installs)

| Component | File | What It Does |
|-----------|------|--------------|
| Astro 6 config | `astro.config.ts` | `site` property drives `Astro.site` at build time for canonical/OG URL generation |
| Leaflet `L.divIcon` | `src/components/RouteMap.astro` | Inline-styled HTML div rendered as map marker icon |
| RouteExplainer segment filter | `src/components/RouteExplainer.astro` | `photos.filter(p => p.mile >= startMi && p.mile < endMi)` |

No new libraries. No installation required.

## Architecture Patterns

### LABEL-01: Sector label pill styling

The labels are built in `renderRoute()` inside `RouteMap.astro` at line 676. The inline style string is the only place to change font and padding. There is no CSS class for the pill content — only `.sector-label` (the outer Leaflet marker wrapper) which has `background: transparent !important; border: none !important`.

**Current values (line 683–692):**
```javascript
// Source: src/components/RouteMap.astro lines 678–692
html: `<div style="
  background: ${bgColor};
  color: ${labelTextColor};
  border: 2px solid ${labelTextColor};
  border-radius: 12px;
  padding: 3px 8px;
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  transform: translate(-50%, -50%);
  box-shadow: 2px 2px 0px rgba(0,0,0,0.4);
  line-height: 1.3;
  text-align: center;
">${sector.name}<br><span style="font-size: 9px; letter-spacing: 1px;">${stars}</span></div>`,
```

**Recommended fix values:** `font-size: 13px` (up from 11px), `padding: 5px 10px` (up from 3px 8px), star span `font-size: 10px` (up from 9px). These are proportional increases that keep the pill compact but prevent text clipping. No other files touch this style.

**Zoom gating:** Labels use opacity toggling (not add/remove) at zoom ≥ 12. The `updateLabelVisibility()` function at line 541 sets `el.style.opacity` — this remains unchanged.

### PHOTO-01: 520 segment photo options

**Option A — Boundary adjustment (recommended):**
Change `endMi` for 520 from `5.0` to `5.6` in `RouteExplainer.astro` SEGMENTS array. This captures the mile 5.51 photo (`3PCGOOVOwBqssLxnyUx4ca6DmyvpSlk49x6iLrCzLK0-1536x2048`). That photo shows riders on a gravel road through pine forest — contextually appropriate as a visual for the start of the route, even if technically it is at mile 5.51. NF2266 currently has 8 photos; dropping its first (mile 5.51) leaves it with 7, still well-covered. The RouteExplainer uses `.slice(0, 2)` so only the first 2 photos per segment display anyway.

**The photo at mile 5.51** (`3PCGOOVOwBqssLxnyUx4ca6DmyvpSlk49x6iLrCzLK0`): shows a group of cyclists riding away on a bright gravel road through tall pines. It is an excellent hero photo — evokes the route's character, fits the "warm-up" description of 520. The thumb WebP exists at `/thumbs/3PCGOOVOwBqssLxnyUx4ca6DmyvpSlk49x6iLrCzLK0-1536x2048.webp`. Both `public/images/` and `public/thumbs/` have it.

**Option B — Accept gradient fallback:**
Update STATE.md and remove the blocker note. The gradient fallback (forest-800 to forest-700 diagonal) looks professional. Record this as an explicit decision: "No CR-520 / Munising Falls photo available; gradient fallback is the shipped state for v1.6."

**Images directory audit result:** No images in `images/` or `images/inspiration/` are confirmed to be from mile 0–5.0. The two new untracked images are Island Lake Campground (mid-route) and a sandy trail (also mid-route). Neither is from CR-520 near Munising.

**Recommendation:** Option A (boundary adjustment). The visual is contextually good, the change is one number in one file, and NF2266 is unaffected in practice (8 → 7 photos, only first 2 shown).

### DEPLOY-01: Astro site config

**Current state:** `astro.config.ts` line 5:
```typescript
site: 'https://hiawathasrevenge.com', // TODO: update to actual deployed URL
```

**How Astro uses `site`:** At build time, `Astro.site` is a `URL` object. `BaseLayout.astro` constructs:
- `const canonicalURL = new URL(Astro.url.pathname, Astro.site)` → canonical `<link rel="canonical">`
- `const ogImageURL = new URL('/og-image.jpg', Astro.site)` → OG/Twitter image meta

The value `https://hiawathasrevenge.com` is already what it should be. The only change needed is removing the `// TODO` comment.

**Verification needed at plan time:** The blocker in STATE.md says to confirm the deployed URL. Since no netlify.toml, vercel.json, or .env files exist in the repo, this cannot be verified from code alone. The planner should note this as a pre-execution check: either the user confirms the domain is live, or the comment is removed as-is since the value itself is correct and removing the TODO is the stated goal regardless.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Label sizing | Custom font-size detection | Direct px increase | divIcon inline style is the only control point |
| Photo assignment | New image pipeline | Boundary adjustment in SEGMENTS array | All needed assets already exist in public/ |
| Canonical URL | Custom URL construction | `Astro.site` (already wired in BaseLayout) | Already correct; just remove comment |

## Common Pitfalls

### Pitfall 1: Adjusting only `endMi` without checking `startMi` of adjacent segment

**What goes wrong:** If `endMi` of 520 changes to 5.6, the `startMi` of NF2266 (currently 5.0) still applies. Photos in range 5.0–5.6 would match BOTH segments if any existed in that range. Only the mile 5.51 photo exists there, and it would now match 520 (`>= 0 && < 5.6`). NF2266 would still pick it up too (`>= 5.0 && < 18.0`). To avoid double-assignment, the SEGMENTS array `startMi` for NF2266 should also shift to 5.6, OR photos.json for the 5.51 entry should be reassigned to mile 0.5 (to make it clearly a 520 photo). The cleanest fix: adjust the 520 segment `endMi: 5.6` AND NF2266 `startMi: 5.6` to make the boundaries non-overlapping.

### Pitfall 2: Sector label `iconSize` is [0, 0]

**What goes wrong:** The divIcon uses `iconSize: [0, 0]` and `iconAnchor: [0, 0]` with CSS `transform: translate(-50%, -50%)` for centering. Changing font-size/padding increases the rendered div's actual width but Leaflet is unaware of it (because iconSize is [0,0]). This is fine — the current centering approach already handles variable widths by relying on the CSS transform, not Leaflet's anchor math. No iconSize change is needed.

### Pitfall 3: Removing `// TODO` comment without confirming the URL is live

**What goes wrong:** If `hiawathasrevenge.com` is not the actual deployed domain, canonical tags will point to the wrong URL after removing the TODO reminder. The TODO comment exists precisely because the domain was unconfirmed. The fix is safe to ship regardless — the URL value itself is correct and canonical tags with a wrong domain are better than no canonical tags — but the STATE.md blocker note should be cleared.

### Pitfall 4: `white-space: nowrap` on label

The existing `white-space: nowrap` is correct and must be kept. Removing it could cause multi-line wrapping of segment names and break the pill shape.

## Code Examples

### LABEL-01: Updated divIcon inline style
```javascript
// src/components/RouteMap.astro — replace lines 678–693
const labelIcon = L.divIcon({
  className: 'sector-label',
  html: `<div style="
    background: ${bgColor};
    color: ${labelTextColor};
    border: 2px solid ${labelTextColor};
    border-radius: 12px;
    padding: 5px 10px;
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    transform: translate(-50%, -50%);
    box-shadow: 2px 2px 0px rgba(0,0,0,0.4);
    line-height: 1.3;
    text-align: center;
  ">${sector.name}<br><span style="font-size: 10px; letter-spacing: 1px;">${stars}</span></div>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});
```

### PHOTO-01: Boundary adjustment in RouteExplainer.astro
```javascript
// src/components/RouteExplainer.astro — SEGMENTS array
// Change line 18: endMi from 5.0 to 5.6, and line 19: startMi from 5.0 to 5.6
{ name: '520',    startMi: 0,    endMi: 5.6,   ... },  // was endMi: 5.0
{ name: 'NF2266', startMi: 5.6,  endMi: 18.0,  ... },  // was startMi: 5.0
```

### DEPLOY-01: astro.config.ts comment removal
```typescript
// src/astro.config.ts — remove the TODO comment from line 5
site: 'https://hiawathasrevenge.com',  // TODO comment removed
```

## State of the Art

| Area | Current State | Notes |
|------|--------------|-------|
| Astro site config | `site` property in `defineConfig()` is the standard | No changes needed to pattern, only comment removal |
| Leaflet divIcon styling | Inline style string is idiomatic for dynamic colors | No Leaflet API changes relevant |
| Photo/segment boundary logic | Simple range filter in `.map()` | Proven pattern — used by all 7 segments |

## Open Questions

1. **Is `hiawathasrevenge.com` live and is it the correct deployed domain?**
   - What we know: The URL is already set in astro.config.ts. No netlify.toml or vercel.json in repo.
   - What's unclear: Whether this domain is actually registered and pointing at the Netlify/Vercel deployment.
   - Recommendation: User should confirm before executing DEPLOY-01. But the task itself (removing the TODO comment) is safe to do regardless — the value is what it should be.

2. **Does the mile 5.51 photo visually represent mile 0–5 (CR-520 / paved segment)?**
   - What we know: The photo shows riders on gravel road through pine forest. Mile 5.51 is the very beginning of NF2266, which is a forest road. CR-520 is paved asphalt.
   - What's unclear: Whether a gravel-road photo is acceptable as the hero for a paved-road segment card.
   - Recommendation: The photo is contextually close enough (same ride, same forest aesthetic, immediately adjacent) and far better than gradient fallback. Planner should note this tradeoff.

## Sources

### Primary (HIGH confidence)
- Direct code read: `src/components/RouteMap.astro` (lines 668–707) — sector label construction
- Direct code read: `src/components/RouteExplainer.astro` (lines 17–50) — segment definitions and photo filter logic
- Direct code read: `astro.config.ts` — site URL and comment
- Direct code read: `src/layouts/BaseLayout.astro` — how `Astro.site` is used for canonical/OG URLs
- Direct data read: `public/data/photos.json` — all 51 photo entries with mile values
- Direct visual inspection: `public/images/3PCGOOVOwBqssLxnyUx4ca6DmyvpSlk49x6iLrCzLK0-1536x2048.jpg` — gravel road, cyclists, pine forest
- Directory listing: `public/thumbs/` — WebP thumb for mile 5.51 photo confirmed present

### Secondary (MEDIUM confidence)
- Leaflet divIcon documentation: `iconSize: [0,0]` with CSS transform for centering is a documented pattern for variable-size labels (verified against Leaflet 1.9.4 in use)

## Metadata

**Confidence breakdown:**
- LABEL-01 (map labels): HIGH — all styling is inline in a single file, no external dependencies
- PHOTO-01 (520 photo): HIGH for data facts (no 0–5mi photos exist), MEDIUM for recommendation (boundary shift is pragmatic, not perfect)
- DEPLOY-01 (site URL): HIGH for code change, LOW for domain verification (cannot confirm from code)

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable codebase, no fast-moving dependencies)
