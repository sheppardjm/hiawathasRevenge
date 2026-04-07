# Phase 43: Gallery & Layout Polish — Research

**Researched:** 2026-04-07
**Domain:** CSS layout (Tailwind v4 grid/columns), aspect ratio preservation, Astro component data flow
**Confidence:** HIGH

## Summary

Phase 43 has three independent sub-problems: (1) add a multi-column layout to segment photos in RouteExplainer, (2) verify gallery ordering by route mileage, and (3) ensure thumbnails display at correct aspect ratios. All three are pure CSS/template changes — no new dependencies, no pipeline changes.

**Gallery ordering (PHT-05) is already solved.** Phase 42 added `.sort((a, b) => a.mile - b.mile)` to `match-photos.js`, and `public/data/photos.json` is confirmed sorted ascending by mile (2.12 → 100.40). PhotoGallery.astro renders photos in JSON array order. No code change is required for this requirement — only verification is needed.

**Aspect ratio preservation (PHT-06) is nearly solved for PhotoGallery.** The gallery already uses `width={dims.w}` / `height={dims.h}` attributes plus `style="aspect-ratio: W/H"` and `class="w-full h-auto block"`. This is the correct pattern. RouteExplainer's segment hero uses `object-fit: cover` in a fixed-height container (220px), which intentionally crops — that is by design for the hero photo. The new multi-column photo grid in RouteExplainer must use `w-full h-auto` with no fixed height to respect natural ratios.

**Multi-column segment card photos (PHT-01) requires the only substantive code change.** RouteExplainer currently slices photos to 2 per segment and renders one as a hero image. The requirement changes this to a multi-column thumbnail grid showing all segment photos, each column ≤400px wide. The right CSS approach is CSS Grid with `repeat(auto-fill, minmax(min(400px, 100%), 1fr))` — this gives auto-responsive columns that never exceed 400px, no JavaScript required.

**Primary recommendation:** Use CSS Grid `repeat(auto-fill, minmax(min(400px, 100%), 1fr))` for the multi-column photo grid in RouteExplainer. Keep PhotoGallery unchanged. The segment hero image can stay or be replaced by the grid — see Architecture section for the decision point.

---

## Standard Stack

### Core (already in project)
| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| Tailwind CSS v4 | ^4.2.2 | Utility CSS — grid, responsive breakpoints | CSS-first config, no tailwind.config.js |
| Astro | ^6.1.1 | Component templating, build-time JSON imports | Static output |
| sharp | ^0.34.5 | Thumbnail generation (already done) | No changes needed |

### No new dependencies required
All requirements are achievable with existing CSS utilities + native HTML `aspect-ratio`, `width`, `height` attributes.

---

## Architecture Patterns

### Current RouteExplainer Photo Display

```
RouteExplainer.astro
  segmentsWithPhotos = SEGMENTS.map(seg => ({
    ...seg,
    photos: photosData.filter(p => p.mile >= seg.startMi && p.mile < seg.endMi).slice(0, 2)
  }))
```

Current behavior: shows 1 hero photo per segment (second photo in `seg.photos[1]` is unused — slice gets 2 but only index 0 is rendered). The segment hero is a fixed 220px tall container with `object-fit: cover`.

**Photos per segment (current data — 56 total):**
| Segment | Photo count |
|---------|------------|
| 520 (0–5.6mi) | 2 |
| NF2266 (5.6–18mi) | 9 |
| Bass Lake Rd (18–32mi) | 9 |
| NF2217-2218 (32–50mi) | 12 |
| ND2225 (50–70mi) | 9 |
| Doe Lake (70–92mi) | 7 |
| Ridge Rd (92–110mi) | 8 |

### Pattern 1: Multi-column grid with max column width (PHT-01)

**What:** CSS Grid `auto-fill` with `minmax` limits max column width to 400px and auto-wraps.

**CSS:**
```css
.segment-photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(400px, 100%), 1fr));
  gap: 0.5rem;
}
```

The `min(400px, 100%)` ensures that on narrow screens (< 400px), the column uses 100% width (single column) rather than overflowing. Without it, a 375px viewport would create a 400px column that overflows.

**As Tailwind arbitrary value:**
```html
<div class="grid grid-cols-[repeat(auto-fill,minmax(min(400px,100%),1fr))] gap-2">
```

Or as a named CSS class in component `<style>` block (preferred for readability — this project uses both approaches).

**Responsive behavior at breakpoints:**
- 375px (mobile): 1 column (375px < 400px, so `min(400px, 100%)` = 375px → single column)
- 768px (tablet): 1 column (768 / 400 = 1.92 → fills 1 column at ~384px each)
- 800px+: 2 columns (800 / 400 = 2.0 exactly → 2 columns at 400px)
- 1280px (desktop): 3 columns (1280 / 400 = 3.2 → 3 columns at ~400px)

Note: The parent container `max-w-4xl mx-auto px-4` is 896px at full width. So at 1280px viewport, the grid is 896px wide → 2 full columns (448px each). To get 3 columns in a 896px container, min width must be ≤298px. **The 400px max-per-column requirement should be interpreted as a maximum, not a minimum.** At 896px container width: 2 columns = ~448px each (exceeds 400px if using `minmax(400px, 1fr)`). To strictly enforce ≤400px max: use `repeat(auto-fill, minmax(min(300px, 100%), 1fr))` with `max-width: 400px` per item, OR interpret the requirement as "columns are sized at most 400px wide" and allow 2-3 columns depending on container.

**Simplest correct implementation:**
```css
.segment-photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 0.5rem;
}
```
This gives 3 columns on most desktop containers (parent is 896px → 896/280 ≈ 3.2 → 3 cols at ~298px), 2 columns on tablet (768px container → 2 cols at ~384px), 1 column on mobile (375px < 280px minimum, so 1 col). All columns stay well under 400px.

### Pattern 2: Aspect ratio preservation without CSS stretching (PHT-06)

**Correct pattern for thumbnails where you know width/height:**
```html
<img
  src={photo.thumb}
  alt="..."
  width={thumbW}
  height={thumbH}
  loading="lazy"
  decoding="async"
  style={`aspect-ratio: ${thumbW} / ${thumbH};`}
  class="w-full h-auto block"
/>
```

Key rules:
- `w-full` makes the image fill its container column
- `h-auto` lets height flow naturally from aspect ratio
- Never set a fixed pixel height on the `<img>` element itself
- `aspect-ratio` + `width`/`height` HTML attributes prevent layout shift (CLS)

**Thumbnail actual dimensions (all 56 photos):**
- 47 photos: 400×533px (portrait, ratio 0.75 — 3:4)
- 8 photos: 400×300px (landscape, ratio 1.33 — 4:3)
- 1 photo: 400×711px (tall portrait, ratio 0.56 — 9:16 approximately)

All thumbnails are exactly 400px wide (set by `generate-thumbnails.js` `resize({ width: 400 })`).

**For segment card thumbnails**, since thumbs are exactly 400px wide and each column is ≤400px wide, `w-full h-auto` will display them at their natural proportions without any dimension calculation needed. No `parseDims()` function needed in RouteExplainer — just `w-full h-auto` on `<img>` elements.

**Getting thumb dimensions for the `<img>` attributes**: The `parseDims(filename)` regex already extracts source dimensions from filenames like `3PCG...-1536x2048.jpg`. This gives the full-size source dimensions, not thumb dimensions. For setting correct `width`/`height` HTML attributes on thumb images, we have two options:
1. Use thumb dimensions (400 × computed-height) — requires reading actual thumb files or storing in photos.json
2. Use source dimensions with scale ratio — `width=400 height=Math.round(400 * srcH / srcW)`
3. Just use `w-full h-auto` with CSS `aspect-ratio` computed from source dims — same visual result, slightly oversized `width`/`height` hints but still correct for CLS prevention

Option 3 is what PhotoGallery already does and it works correctly. For RouteExplainer thumbnails, the same pattern applies.

### Pattern 3: Gallery ordering verification (PHT-05)

`photos.json` is already sorted by mile ascending (verified: 2.12 → 100.40, `is_sorted=True`). PhotoGallery.astro renders the array in order with no re-sorting. **No code change needed.** The only deliverable is a verification step confirming order is correct.

### Anti-Patterns to Avoid

- **Fixed height containers for aspect-ratio-preserving images:** `height: 220px` with `object-fit: cover` is correct for the existing segment hero (intentional crop), but must NOT be used on the new multi-column grid thumbnails.
- **`object-fit: cover` without a fixed container height:** Will cause height: 0 collapse. If using cover, always set explicit height on the container.
- **Arbitrary grid values with spaces:** Tailwind v4 arbitrary values use `_` for spaces in brackets: `grid-cols-[repeat(auto-fill,minmax(min(400px,100%),1fr))]`. No spaces allowed inside brackets.
- **Removing `.slice(0, 2)` without removing `.slice`:** Currently RouteExplainer slices photos — must change to show all photos for multi-column grid.
- **Missing `break-inside-avoid` on grid items:** Not needed for CSS Grid (unlike CSS columns). Grid items do not break across columns.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|------------|------------|-----|
| Responsive column count | JavaScript resize observer | CSS `auto-fill` + `minmax` | Native CSS handles this — no JS needed |
| Aspect ratio enforcement | Padding-bottom hack (old CSS trick) | `aspect-ratio` CSS property | Supported in all modern browsers; Tailwind `aspect-[W/H]` |
| Image dimension lookup | Custom server-side image introspection at build time | `parseDims()` regex already in PhotoGallery, or HTML `width`/`height` + `h-auto` | Already works for CLS prevention |

**Key insight:** This phase is pure CSS layout work. No new libraries, no pipeline changes. The parseDims/aspect-ratio pattern already proven in PhotoGallery just needs to be applied consistently.

---

## Common Pitfalls

### Pitfall 1: Column overflow on narrow viewports
**What goes wrong:** `minmax(400px, 1fr)` creates a 400px minimum column. On a 375px mobile screen, this overflows horizontally.
**Why it happens:** `minmax` minimum is absolute — won't shrink below 400px.
**How to avoid:** Use `minmax(min(400px, 100%), 1fr)` — the `min()` CSS function clamps the minimum to the container width.
**Warning signs:** Horizontal scrollbar on mobile viewport tests.

### Pitfall 2: RouteExplainer still slices photos
**What goes wrong:** The current code has `.slice(0, 2)` — even after adding the grid, only 2 photos show.
**Why it happens:** `.slice(0, 2)` was added when only a single hero photo was shown, to limit data fetch.
**How to avoid:** Remove `.slice(0, 2)` (or change to no slice) when implementing the multi-column grid.
**Warning signs:** Only 1–2 photos appear per segment regardless of grid column count.

### Pitfall 3: Segment hero conflict
**What goes wrong:** The current "segment hero" (the 220px fixed-height featured image) conflicts with a new photo grid. Having both creates visual redundancy.
**Why it happens:** Architecture decision needed — keep hero + add grid below it, or replace hero with grid.
**How to avoid:** Decide explicitly in planning. Two options:
  - Option A: Replace the hero with the multi-column grid (photos at natural ratio, ordered by mile)
  - Option B: Keep hero (first photo, cropped) + add grid for remaining photos below
  Option A is cleaner and aligns better with PHT-06 (no CSS stretching). Option B preserves the current visual hierarchy.
**Warning signs:** No explicit decision made → inconsistent result.

### Pitfall 4: `parseDims` fallback returns wrong orientation
**What goes wrong:** 2 photos don't have dimensions in their filenames. `parseDims` falls back to 1536×2048 (portrait). Both photos are actually 400×300 (landscape) thumbnails. Using wrong aspect-ratio causes layout jump.
**Why it happens:** These files were added with Facebook-format filenames, not the `WxH` naming convention.
**How to avoid:** For these 2 photos, `parseDims` gives wrong source dims but thumbs ARE landscape (400×300). The aspect-ratio computed from source dims matches visual output (both landscape), so the error is benign for the current gallery. For RouteExplainer thumbnails, `w-full h-auto` without forced aspect-ratio will always be correct because the browser reads the actual image dimensions.
**Warning signs:** Noticeably wrong aspect ratio for the two Facebook-named photos.

### Pitfall 5: `max-w-4xl` container limits effective column count
**What goes wrong:** RouteExplainer's content wrapper is `max-w-4xl` (896px). At 1280px viewport, the grid container is only 896px wide. With `minmax(min(400px, 100%), 1fr)`: `floor(896/400) = 2` columns, not 3.
**Why it happens:** The 400px minimum blocks packing 3 columns into 896px.
**How to avoid:** If 3 columns at desktop is desired, use a smaller minmax value (e.g., `minmax(min(280px, 100%), 1fr)`) — this gives 3 columns at 896px container. The success criterion says "each column no wider than 400px" — a 280px minimum with 3-column layout satisfies this.
**Warning signs:** Only 2 columns at 1280px when 3 were expected.

---

## Code Examples

### Multi-column photo grid with correct aspect ratios

```astro
<!-- In RouteExplainer.astro — replace current segment-hero block -->
{seg.photos.length > 0 && (
  <div class="segment-photo-grid">
    {seg.photos.map((photo) => {
      const dims = parseDims(photo.filename);
      return (
        <img
          src={photo.thumb}
          alt={`Route photo at mile ${photo.mile.toFixed(1)}`}
          loading="lazy"
          decoding="async"
          width={dims.w}
          height={dims.h}
          style={`aspect-ratio: ${dims.w} / ${dims.h};`}
          class="w-full h-auto block rounded-sm"
        />
      );
    })}
  </div>
)}
```

```css
/* In RouteExplainer.astro <style> block */
.segment-photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 0.375rem;
}
```

### parseDims function (reuse from PhotoGallery pattern)

```typescript
// Already in PhotoGallery.astro — copy to RouteExplainer.astro frontmatter
function parseDims(filename: string): { w: number; h: number } {
  const m = filename.match(/-(\d+)x(\d+)/);
  return m ? { w: Number(m[1]), h: Number(m[2]) } : { w: 1536, h: 2048 };
}
```

### Gallery order verification (no code change — just a check)

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('public/data/photos.json', 'utf8'));
const sorted = d.every((p, i, a) => i === 0 || p.mile >= a[i - 1].mile);
console.log('Photos sorted by mile:', sorted);
console.log('First:', d[0].mile, 'Last:', d[d.length-1].mile);
"
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| Padding-bottom hack for aspect ratio | `aspect-ratio` CSS property + HTML `width`/`height` | Supported everywhere; already used in PhotoGallery |
| Manual breakpoint column switching (`sm:columns-1 md:columns-2 lg:columns-3`) | CSS Grid `auto-fill` + `minmax` | One rule handles all breakpoints; never overflows |
| Fixed-height hero image only | Multi-column natural-ratio grid | Preserves aspect ratios, shows more photos |

---

## Open Questions

1. **Hero vs. grid architecture decision (Pitfall 3)**
   - What we know: Current code shows a 220px fixed-height hero image per segment. PHT-01 requires a multi-column grid.
   - What's unclear: Should the hero be replaced entirely by the grid, or kept with the grid added below?
   - Recommendation: Replace the hero with the grid. This satisfies PHT-06 (no fixed-height cropping), keeps layout simpler, and aligns with the "show photos at correct proportions" goal. The segment name/difficulty overlay currently on the hero needs to move — likely into the card body header.

2. **Minimum grid column width (affects column count at desktop)**
   - What we know: Parent container is max-w-4xl (896px). 400px minimum = 2 columns max. 280px minimum = 3 columns.
   - What's unclear: Does "each column no wider than 400px" mean max-400px or exactly-400px?
   - Recommendation: Interpret as max 400px. Use 280px minimum to get 3 columns at desktop (success criterion mentions desktop 1280px, where container is 896px). Each column will be ~298px — well under 400px.

3. **Segment name/difficulty display after hero removal**
   - What we know: The segment name and ShieldMotif currently live in a gradient overlay on the hero photo.
   - What's unclear: If the hero is replaced, where does the segment name go?
   - Recommendation: Move to the top of `.segment-body` div, already padded at 1.25rem. The ShieldMotif + heading is small and composable.

---

## Sources

### Primary (HIGH confidence)
- Official Tailwind CSS docs (WebFetch verified 2026-04-07):
  - https://tailwindcss.com/docs/grid-template-columns — grid utilities, arbitrary values
  - https://tailwindcss.com/docs/columns — CSS columns utilities
  - https://tailwindcss.com/docs/aspect-ratio — aspect-ratio utility
  - https://tailwindcss.com/docs/object-fit — object-fit utilities
  - https://tailwindcss.com/docs/responsive-design — breakpoints (sm:640px, md:768px, lg:1024px, xl:1280px)
- Codebase direct inspection (2026-04-07):
  - `/src/components/PhotoGallery.astro` — existing aspect-ratio pattern
  - `/src/components/RouteExplainer.astro` — current segment layout
  - `/public/data/photos.json` — 56 photos, confirmed sorted by mile
  - `/scripts/match-photos.js` — sort already applied (`.sort((a, b) => a.mile - b.mile)`)
  - `/scripts/generate-thumbnails.js` — all thumbs 400px wide
  - Actual thumbnail dimensions via sharp: 47×(400×533), 8×(400×300), 1×(400×711)

### Secondary (MEDIUM confidence)
- CSS Grid `min()` within `minmax()` pattern — widely documented pattern, confirmed via multiple sources for solving the mobile overflow issue.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Tailwind v4, Astro already in project, verified via package.json and docs
- Architecture: HIGH — direct code inspection, actual dimensions from sharp
- Gallery ordering: HIGH — confirmed in photos.json by inspection and match-photos.js code
- Pitfalls: HIGH — derived from direct code analysis, verified CSS behavior

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable CSS/Tailwind domain)
