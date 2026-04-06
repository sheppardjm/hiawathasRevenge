# Phase 35: Elevation Profile & Route Stats - Research

**Researched:** 2026-04-06
**Domain:** Chart.js v4.5.1, vanilla JS DOM update, comparison sidebar layout
**Confidence:** HIGH

## Summary

Phase 34 already implemented a significant portion of Phase 35. The elevation chart data swap (`updateChart`), sector annotation band rebuild, and bike marker snapping (via `routePoints` module-scope variable) are all working as of the Phase 34 verification. The `route:change` CustomEvent pipeline is wired end-to-end.

What Phase 35 actually needs to build is: (1) verify and confirm the elevation/crosshair work already done in 34, (2) make `RouteStats` dynamic by adding a `<script>` block that listens for `route:change` and updates the DOM stat values, (3) add a sector count stat card to `RouteStats`, and (4) build a route comparison sidebar as a new vanilla JS widget.

**Primary recommendation:** Do not destroy/recreate the chart. The in-place data swap pattern (`chart.update('none')`) already implemented in Phase 34 is the correct approach. Phase 35 work is primarily about `RouteStats` and the comparison sidebar.

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| chart.js | 4.5.1 | Elevation line chart | Already integrated, tree-shaken import |
| chartjs-plugin-annotation | 3.1.0 | Sector band overlays + crosshair | Already registered and in use |
| Leaflet | 1.9.4 | Map + bike marker | Already integrated |

### Supporting (no new libraries needed)

All data needed for Phase 35 already exists:
- `public/data/routes.json` — has `totalMiles`, `elevationGainFeet`, `sectorIds` (length = sector count) for all 3 routes
- `public/data/{routeId}/route-data.json` — `meta.totalMiles`, `meta.elevationGainFeet`
- `public/data/{routeId}/annotations.json` — sector count via `.filter(a => a.type === 'sector')`

**Installation:** No new packages required.

## Architecture Patterns

### Current Component Layout (from codebase)

```
src/pages/index.astro
├── <section class="amber-section">
│   └── <RouteStats />          ← static build-time, needs runtime update
├── <section id="route">
│   └── <RouteMap />            ← dispatches route:change from renderRoute()
└── <section class="bg-forest-950">
    └── <ElevationProfile />    ← already has route:change listener + updateChart()
```

The section order matters: RouteStats appears ABOVE the map in the DOM, so it must use `window.addEventListener('route:change', ...)` to receive events dispatched from RouteMap.

### Pattern 1: RouteStats Dynamic Update (runtime DOM mutation)

**What:** Add a `<script>` block to `RouteStats.astro`. The frontmatter continues to render the initial 100mi stats. The script overwrites DOM text content when `route:change` fires.

**Why:** RouteStats is currently a build-time static component. The frontmatter fetches 100mi data at build time via `getEntry('routeData', 'route')`. At runtime, the script uses the pre-fetched `routes.json` to avoid a redundant fetch (routes.json is already fetched by RouteMap's `initMap()`).

**Data source at runtime:** `routes.json` manifest already has `totalMiles`, `elevationGainFeet`, `sectorIds.length` for all three routes. No additional fetch needed if we embed the routes data in the script. Alternatively, `routes.json` can be fetched once.

**Pattern:**
```javascript
// Source: existing RouteMap.astro pattern for routes.json consumption
window.addEventListener('route:change', async (e) => {
  const routeId = e.detail.routeId;
  // routes.json is small (~400 bytes), fetch is fine; or embed at build time
  const routesData = await fetch('/data/routes.json').then(r => r.json());
  const route = routesData.routes.find(r => r.id === routeId);
  if (!route) return;
  document.getElementById('stat-miles').textContent = Math.round(route.totalMiles);
  document.getElementById('stat-elevation').textContent = route.elevationGainFeet.toLocaleString();
  document.getElementById('stat-sectors').textContent = route.sectorIds.length;
});
```

**Better pattern (avoid repeated fetch):** Pre-embed routes.json data in the Astro script at build time via a dynamic import or inline JSON, so the listener has it synchronously. But given routes.json is ~400 bytes and already cached after RouteMap fetches it, the fetch pattern is acceptable.

**Best pattern:** Use `fetch('/data/routes.json')` with a module-scope cached promise so the fetch only happens once even if `route:change` fires multiple times.

```javascript
// Source: codebase pattern (module-scope guards in ElevationProfile, RouteMap)
let routesCache = null;
async function getRoutes() {
  if (!routesCache) routesCache = fetch('/data/routes.json').then(r => r.json());
  return routesCache;
}

window.addEventListener('route:change', async (e) => {
  const data = await getRoutes();
  const route = data.routes.find(r => r.id === e.detail.routeId);
  if (!route) return;
  // update DOM
});
```

### Pattern 2: Comparison Sidebar (vanilla JS, static HTML layout)

**What:** A new HTML element (either inline in `RouteStats.astro` or a new component) showing all 3 routes' stats in a grid. Can be rendered at build time from `routes.json` since all data is static.

**When to use:** STAT-02 requirement. Shows all 3 routes side-by-side.

**Approach:** Since all route stats are known at build time (`routes.json`), the comparison table is best rendered in Astro frontmatter as static HTML. A `<script>` adds a visual "active" highlight that updates on `route:change`.

**Astro frontmatter pattern:**
```javascript
// In RouteStats.astro frontmatter — reads routes.json at build time
import routesManifest from '../../public/data/routes.json';
const { routes } = routesManifest;
```

**HTML layout for comparison sidebar:**
```html
<div class="route-comparison">
  {routes.map(route => (
    <div class="comparison-card" data-route-id={route.id}>
      <div class="comparison-header" style={`color: ${route.color}`}>{route.name}</div>
      <div class="comparison-stat">
        <span class="stat-value">{Math.round(route.totalMiles)}</span>
        <span class="stat-label">Miles</span>
      </div>
      <div class="comparison-stat">
        <span class="stat-value">{route.elevationGainFeet.toLocaleString()}</span>
        <span class="stat-label">Ft Climbing</span>
      </div>
      <div class="comparison-stat">
        <span class="stat-value">{route.sectorIds.length}</span>
        <span class="stat-label">Sectors</span>
      </div>
    </div>
  ))}
</div>
```

**Active highlight script:**
```javascript
window.addEventListener('route:change', (e) => {
  document.querySelectorAll('.comparison-card').forEach(card => {
    card.classList.toggle('is-active', card.dataset.routeId === e.detail.routeId);
  });
});
```

### Pattern 3: ElevationProfile Lazy-Init Race Condition (already handled)

The `updateChart()` function has `if (!chart) return;` guard (line 34 of ElevationProfile.astro). If `route:change` fires before the chart is initialized (user switches route before scrolling to elevation section), the update is silently dropped.

**Current behavior:** On first scroll into the elevation section, `initChart()` always loads `100mi` data — it does NOT check the currently active route. This means if a user: (1) scrolls to map, (2) switches to 50k, (3) scrolls to elevation section — the chart initializes showing 100mi data, not 50k.

**This is a latent bug in Phase 34 code.** Phase 35 should fix it:

```javascript
// In initChart(), after chart = new Chart(...), check active route
// RouteMap.astro exposes activeRouteId at module scope but it is not accessible cross-component
// Solution: read from a shared data attribute or a small window variable
// Pattern: use window.__activeRouteId set by RouteMap on each renderRoute()

// In RouteMap.astro renderRoute() — after dispatching route:change:
window.__activeRouteId = routeId;

// In ElevationProfile.astro initChart() — after chart construction:
const pendingRoute = window.__activeRouteId;
if (pendingRoute && pendingRoute !== '100mi') {
  updateChart(pendingRoute);
}
```

**Alternatively:** Dispatch a `route:ready` or `route:sync` event after chart init, and have RouteMap respond by re-dispatching the current route. But the `window.__activeRouteId` approach is simpler and consistent with the codebase pattern (module-scope variables).

### Recommended Project Structure (no changes needed)

```
src/components/
├── ElevationProfile.astro   # modify: fix post-init route sync
├── RouteMap.astro           # modify: set window.__activeRouteId
└── RouteStats.astro         # modify: add <script>, comparison sidebar
```

No new files needed unless the comparison sidebar is complex enough to warrant its own component. Keeping it in RouteStats.astro is fine given its small scope.

### Anti-Patterns to Avoid

- **Destroy/recreate chart on route:change:** The codebase already uses `chart.update('none')` (in-place swap). Switching to destroy/recreate would cause a flash, lose crosshair state, and re-run the dynamic import. Do not do this.
- **Fetching route-data.json in RouteStats for stats:** `routes.json` already has totalMiles and elevationGainFeet. Use it. No need to fetch the per-route route-data.json (which is much larger: 456 points).
- **Mutating `chart.data.labels`:** This chart uses `parsing: false` with `{x, y}` format. Labels array is not used. Do not add/manipulate labels.
- **Using Astro content collections for runtime data:** `RouteStats.astro` currently uses `getEntry('routeData', 'route')` which only has 100mi data hardcoded in content.config.ts. This cannot be made dynamic at runtime. The runtime update must use `fetch('/data/routes.json')`.
- **Calling `chart.update()` with animation on route switch:** Always use `chart.update('none')` to prevent the animation blocking crosshair usability.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart data swap | destroy + recreate | `chart.update('none')` with in-place data replacement | Already implemented, preserves crosshair annotation, no flash |
| Route stats lookup | fetch route-data.json | Read `routes.json` manifest | All stats already in manifest; route-data.json is 10x larger |
| Comparison layout | CSS grid hack | CSS `grid-template-columns: repeat(3, 1fr)` | Matches existing `.stats-grid` pattern in RouteStats.astro |
| Active route tracking | localStorage or URL params | `window.__activeRouteId` module-scope variable | Consistent with codebase pattern, zero overhead |

**Key insight:** The hard work (Chart.js data swap, annotation rebuild, bike marker snapping) is already done by Phase 34. Phase 35 is primarily a UI concern — updating text nodes in RouteStats and adding a comparison grid.

## Common Pitfalls

### Pitfall 1: RouteStats Stale Sector Count

**What goes wrong:** `routes.json` has `sectorIds` array. The count is `route.sectorIds.length`. But the current `RouteStats.astro` does not show a sector count at all (only miles and elevation). The plan requires adding a third stat card for sector count.

**Why it happens:** RouteStats was built before Phase 34's route-switching requirement. It only shows the two stats from the original build-time data.

**How to avoid:** Add a third `<div class="stat-card">` for sectors in the HTML template, with `id="stat-sectors"` for the runtime script to target. Initialize it at build time from `routes.json` for 100mi (7 sectors).

**Warning signs:** If the stats-grid shows only 2 columns after changes, the sector card is missing.

### Pitfall 2: RouteStats Extra `</div>` Bug

**What goes wrong:** Line 17 of `RouteStats.astro` has a spurious `</div>` tag (an extra closing div between the two stat cards and the outer div). This creates invalid HTML.

**Why it happens:** Pre-existing bug in the component.

**How to avoid:** Fix the closing div structure when modifying RouteStats. The correct structure is:
```html
<div class="stats-grid">
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>  <!-- new sector card -->
</div>
```

**Warning signs:** Browser dev tools showing unexpected nesting in the stats section.

### Pitfall 3: Elevation Chart Shows Wrong Route After Lazy Init

**What goes wrong:** User switches to 50k, then scrolls down to the elevation section. `initChart()` initializes with hardcoded `100mi` data. The chart shows 100mi profile, not 50k.

**Why it happens:** `initChart()` always fetches `/data/100mi/route-data.json` (line 105 of ElevationProfile.astro). The `route:change` listener has `if (!chart) return` so the switch event fired before init is silently dropped.

**How to avoid:** After chart construction in `initChart()`, read `window.__activeRouteId`. If it's set and differs from `'100mi'`, call `updateChart(window.__activeRouteId)`. This requires RouteMap to write `window.__activeRouteId = routeId` in `renderRoute()`.

**Warning signs:** After switching routes and scrolling to elevation, chart x-axis shows wrong max distance.

### Pitfall 4: Comparison Sidebar Active State on Page Load

**What goes wrong:** On initial page load, no `route:change` event fires (the default route is just rendered directly by RouteMap). The comparison sidebar cards all appear unselected.

**Why it happens:** `route:change` only fires when the user switches routes, not on initial load.

**How to avoid:** Add `data-route-id="100mi"` initial active class in the HTML template (the default route is `100mi` from `routes.json.defaultRoute`). Or run the active-highlight script once on DOMContentLoaded using `window.__activeRouteId || '100mi'`.

**Simpler approach:** Set the 100mi card as `is-active` directly in the Astro template using a conditional class: `class:list={['comparison-card', { 'is-active': route.id === '100mi' }]}`.

**Warning signs:** All 3 comparison cards appear visually equal on first page load.

### Pitfall 5: amber-section Color Override for New Stat Cards

**What goes wrong:** The stats are inside `.amber-section` which has `color: var(--color-forest-950)`. The existing `.stat-value` and `.stat-label` classes have CSS overrides in `index.astro` (`color: var(--color-amber-500)` and `color: var(--color-cream-200)` respectively). New stat cards use the same classes, so they inherit the override correctly.

**Potential issue:** Comparison sidebar cards are likely NOT inside `.amber-section` (they may be in a different section), so they use the base `.stat-value` color (`--color-amber-500`) directly without needing the override.

**How to avoid:** Keep comparison sidebar card colors consistent with the design system. The route name header uses `route.color` (amber `#c8973e`, moss `#5b9279`, lake `#4a90c4`).

## Code Examples

### Updating RouteStats DOM on route:change

```javascript
// Source: codebase pattern — module-scope cache, same as ElevationProfile.astro pattern
let _routesCache = null;
async function getRoutesData() {
  if (!_routesCache) _routesCache = fetch('/data/routes.json').then(r => r.json());
  return _routesCache;
}

window.addEventListener('route:change', async (e) => {
  const data = await getRoutesData();
  const route = data.routes.find(r => r.id === e.detail.routeId);
  if (!route) return;
  const milesEl = document.getElementById('stat-miles');
  const elevEl  = document.getElementById('stat-elevation');
  const secEl   = document.getElementById('stat-sectors');
  if (milesEl) milesEl.textContent = Math.round(route.totalMiles);
  if (elevEl)  elevEl.textContent  = route.elevationGainFeet.toLocaleString();
  if (secEl)   secEl.textContent   = route.sectorIds.length;
});
```

### Fixing Lazy-Init Race in ElevationProfile

```javascript
// Source: pattern established in RouteMap.astro (module-scope state tracking)

// In RouteMap.astro renderRoute(), after dispatching route:change:
window.__activeRouteId = routeId;

// In ElevationProfile.astro initChart(), after chart = new Chart(canvas, {...}):
// Sync to active route if user switched before chart initialized
const pendingRoute = window.__activeRouteId;
if (pendingRoute && pendingRoute !== '100mi') {
  updateChart(pendingRoute);
}
```

### Comparison Sidebar Build-Time HTML (Astro frontmatter)

```javascript
// Source: routes.json structure verified in codebase investigation
import routesManifest from '../../public/data/routes.json';
// routes has: id, name, shortName, color, totalMiles, elevationGainFeet, sectorIds[]
```

```html
<!-- Rendered at build time — no fetch needed at runtime for the grid itself -->
<div class="route-comparison" role="table" aria-label="Route comparison">
  {routesManifest.routes.map(route => (
    <div
      class:list={['comparison-card', { 'is-active': route.id === routesManifest.defaultRoute }]}
      data-route-id={route.id}
    >
      <div class="comparison-name" style={`border-color: ${route.color}`}>{route.name}</div>
      <div class="comparison-stat">
        <span class="stat-value" id={`cmp-miles-${route.id}`}>{Math.round(route.totalMiles)}</span>
        <span class="stat-label">Miles</span>
      </div>
      <div class="comparison-stat">
        <span class="stat-value" id={`cmp-elev-${route.id}`}>{route.elevationGainFeet.toLocaleString()}</span>
        <span class="stat-label">Ft Climbing</span>
      </div>
      <div class="comparison-stat">
        <span class="stat-value" id={`cmp-sec-${route.id}`}>{route.sectorIds.length}</span>
        <span class="stat-label">Sectors</span>
      </div>
    </div>
  ))}
</div>
```

### Comparison Card Active Highlight Script

```javascript
// Source: codebase pattern — window event listener for route:change
window.addEventListener('route:change', (e) => {
  document.querySelectorAll('.comparison-card').forEach(card => {
    const isActive = card.dataset.routeId === e.detail.routeId;
    card.classList.toggle('is-active', isActive);
  });
});
```

### Chart.js In-Place Data Swap (already implemented — reference)

```javascript
// Source: ElevationProfile.astro lines 42-69 (Phase 34 implementation)
// This is the correct pattern — do NOT change to destroy/recreate

chart.data.datasets[0].data = newData;          // replace dataset in-place
chart.options.scales.x.max = newTotalMiles;     // update x-axis max
chart.options.plugins.annotation.annotations = newAnnotations; // rebuild bands + keep crosshair
chart.update('none');                           // instant, no animation
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static RouteStats (build-time only) | Static HTML + runtime script update | Phase 35 | Stats update on route switch |
| No comparison sidebar | Route comparison grid | Phase 35 | STAT-02 satisfied |
| initChart always uses 100mi | initChart checks window.__activeRouteId | Phase 35 | Fixes lazy-init race condition |

**Deprecated/outdated:**
- `getEntry('routeData', 'route')` in RouteStats.astro: Only useful for 100mi initial render. Runtime stats must come from `routes.json` via fetch or import. Do not expand `getEntry` usage for route switching.

## Open Questions

1. **Where does the comparison sidebar live in the page?**
   - What we know: RouteStats is in `.amber-section`. The comparison sidebar could be inside the same section, below RouteStats, or in the elevation section.
   - What's unclear: UX placement — is it beside the main stats, below them, or near the elevation chart?
   - Recommendation: Place it directly below the active stats in the RouteStats section. The amber-section already has `max-w-4xl mx-auto px-4` container. A full-width comparison grid fits naturally below the current stat cards.

2. **Comparison sidebar visual treatment on amber-section background**
   - What we know: `.amber-section` has amber-500 background (#c8973e), forest-950 text. The `.stat-card` uses `background: var(--color-forest-800)` and `border: 1px solid var(--color-forest-700)`.
   - What's unclear: Whether comparison cards should reuse `.stat-card` styling or have a lighter treatment.
   - Recommendation: Reuse `.stat-card` pattern for cards. The `is-active` state adds a colored bottom border or background highlight using `route.color` with reduced opacity. Keep it simple.

3. **Should ElevationProfile export its active route ID?**
   - What we know: `window.__activeRouteId` is set by RouteMap. ElevationProfile reads it post-init.
   - What's unclear: If Phase 36 (GPX download link) also needs the active route ID, this global may need to be cleaned up.
   - Recommendation: `window.__activeRouteId` is fine for this phase. It's a simple, readable approach consistent with how `window.L` is used in RouteMap.

## Sources

### Primary (HIGH confidence)

- **Codebase direct read** — `src/components/ElevationProfile.astro` (254 lines, complete)
- **Codebase direct read** — `src/components/RouteMap.astro` (903 lines, complete)
- **Codebase direct read** — `src/components/RouteStats.astro` (62 lines, complete)
- **Codebase direct read** — `src/pages/index.astro` (component layout and section structure)
- **Codebase direct read** — `public/data/routes.json` (all route manifests)
- **Codebase direct read** — `public/data/{100mi,100k,50k}/annotations.json` (sector count per route)
- **Phase 34 VERIFICATION.md** — confirms what was built and what is still pending

### Secondary (MEDIUM confidence)

- **Chart.js 4.5.1 installed version** — verified via `node -e require(...)`. In-place data swap with `chart.update('none')` is the documented approach for this version.
- **chartjs-plugin-annotation 3.1.0** — verified installed version. `chart.options.plugins.annotation.annotations` mutation pattern confirmed working in existing code.

### Tertiary (LOW confidence)

- None needed — all critical information came from direct codebase investigation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and node_modules
- Architecture: HIGH — read directly from source files; all patterns are established in existing code
- Pitfalls: HIGH — identified from direct inspection of ElevationProfile.astro, RouteStats.astro, and the Phase 34 VERIFICATION.md
- Comparison sidebar: MEDIUM — pattern is vanilla JS/CSS; specific visual treatment is a design decision for the planner

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable dependencies, no fast-moving concerns)

---

## Phase 35 Work Breakdown Summary

Based on codebase investigation, the actual work breakdown for Phase 35:

### Plan 35-01: Elevation chart sync and RouteStats dynamic update

**Files to modify:** `src/components/ElevationProfile.astro`, `src/components/RouteMap.astro`, `src/components/RouteStats.astro`

1. **Fix ElevationProfile lazy-init race** (ElevationProfile.astro + RouteMap.astro)
   - RouteMap.astro: add `window.__activeRouteId = routeId;` in `renderRoute()` before dispatching `route:change`
   - ElevationProfile.astro: after `chart = new Chart(...)`, read `window.__activeRouteId` and call `updateChart()` if not '100mi'
   - ELEV-01 and ELEV-03 already implemented; this is the one gap

2. **Add RouteStats dynamic update** (RouteStats.astro)
   - Fix spurious `</div>` on line 17
   - Add `id` attributes to stat value spans (`stat-miles`, `stat-elevation`)
   - Add third stat card for sector count (`id="stat-sectors"`)
   - Add `<script>` block with `route:change` listener and cached `routes.json` fetch
   - STAT-01 satisfied

### Plan 35-02: Comparison sidebar

**Files to modify:** `src/components/RouteStats.astro`

1. **Add comparison grid HTML** (Astro frontmatter + template)
   - Import `routes.json` in frontmatter
   - Render 3 comparison cards at build time
   - Add `data-route-id` attribute and initial `is-active` on 100mi card

2. **Add active highlight script** (RouteStats.astro `<script>`)
   - `route:change` listener toggles `is-active` class

3. **CSS** (RouteStats.astro `<style>`)
   - `.route-comparison`: `display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 2rem;`
   - `.comparison-card`: similar to `.stat-card` + `border-bottom: 3px solid transparent` for route color accent
   - `.comparison-card.is-active`: `border-bottom-color: [route-specific via JS]` or via CSS data-attribute
   - STAT-02 satisfied

**Active color per card:** Since CSS can't read JS variables directly, the active state color can use a CSS variable set by JS, or use a simple `outline` with the route color stored in a CSS custom property on the card element.
