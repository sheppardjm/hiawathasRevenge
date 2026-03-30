# Phase 4: Elevation Profile - Research

**Researched:** 2026-03-30
**Domain:** Chart.js 4.x, Astro script islands, responsive canvas sizing, data decimation
**Confidence:** HIGH (core stack), MEDIUM (responsive height CSS pattern), HIGH (data format)

---

## Summary

Phase 4 builds a Chart.js line chart that visualizes elevation (Y-axis, feet) vs. distance (X-axis, miles) for the 101.98-mile Hiawatha's Revenge route. The chart must lazy-load via IntersectionObserver and render at fixed pixel heights across breakpoints.

The data source is already ideal: `route-data.json` contains 456 pre-simplified points with `{ lat, lon, ele (meters), miles }` per point. Elevation is stored in **meters** and must be converted to feet (`× 3.28084`) before display. The 456 points are well within performance thresholds — LTTB decimation down to ~500 points is the roadmap target but is optional given 456 points is already compact. LTTB will still be configured as future-proofing.

The **Astro pattern used for Leaflet in Phase 3 applies directly here**: a plain `.astro` component with a `<script>` tag, dynamic `import()` of Chart.js inside an IntersectionObserver callback. This keeps Chart.js out of the initial bundle automatically — Vite splits dynamic imports into separate chunks. No framework component or `client:*` directive is needed.

**Primary recommendation:** Use `dynamic import('chart.js')` inside an IntersectionObserver callback in a plain `.astro` component script. Import only tree-shakeable components (not `chart.js/auto`). Set `maintainAspectRatio: false` on the chart instance and control height via the CSS container div with Tailwind responsive classes.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| chart.js | 4.5.1 | Line chart rendering | Latest stable; ESM tree-shakeable; built-in decimation plugin |
| chartjs-plugin-annotation | 3.1.0 | Annotation overlays (e.g. segment markers) | Official Chart.js org plugin; v3.x required for Chart.js 4.x |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none beyond chart.js) | - | - | Chart.js 4.x includes the decimation plugin built-in — no separate install needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| chart.js | d3.js | d3 is lower-level — more code, no built-in responsive sizing or decimation |
| chart.js | recharts | recharts requires React — no framework in this project |
| tree-shaken imports | `chart.js/auto` | `auto` imports everything; use tree-shaken for smaller bundle |

### Installation
```bash
PATH="/usr/local/opt/node/bin:$PATH" npm install chart.js@4.5.1 chartjs-plugin-annotation@3.1.0
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── RouteMap.astro          # Phase 3 (already exists)
│   └── ElevationProfile.astro  # Phase 4 (new)
public/
└── data/
    └── route-data.json         # Source of truth (already exists, 456 points)
```

### Pattern 1: Dynamic Import + IntersectionObserver (mirrors Phase 3 Leaflet pattern)

**What:** Chart.js is dynamically imported inside an IntersectionObserver callback. Vite automatically code-splits the dynamic import into a separate chunk, keeping Chart.js out of the initial page bundle.

**When to use:** Any heavy library that should not load until the component is visible.

```typescript
// Source: https://astro-tips.dev/tips/script-tag-dynamic-imports/
// (Same pattern as RouteMap.astro Phase 3)
<script>
  let chartInitialized = false;
  const container = document.getElementById('elevation-chart-container');

  async function initChart() {
    const { Chart, LineController, LineElement, PointElement, LinearScale, Filler, Tooltip } = await import('chart.js');
    const { Decimation } = await import('chart.js');
    Chart.register(LineController, LineElement, PointElement, LinearScale, Filler, Tooltip, Decimation);

    // Fetch data
    const routeData = await fetch('/data/route-data.json').then(r => r.json());

    // Convert meters -> feet, build {x, y} pairs for parsing: false
    const data = routeData.points.map(pt => ({
      x: pt.miles,
      y: pt.ele * 3.28084   // meters to feet
    }));

    const canvas = document.getElementById('elevation-chart');
    new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [{
          data,
          borderColor: '#c8973e',          // --color-amber-500
          backgroundColor: 'rgba(200, 151, 62, 0.15)',
          fill: 'start',
          pointRadius: 0,
          borderWidth: 1.5,
          tension: 0,
          parsing: false                   // required for decimation
        }]
      },
      options: {
        parsing: false,
        responsive: true,
        maintainAspectRatio: false,        // allows CSS container to set height
        animation: false,                  // performance: single render pass
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false },
          decimation: {
            enabled: true,
            algorithm: 'lttb',
            samples: 300,                  // ~300 display points; well below 456 raw
            threshold: 400
          }
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Distance (miles)', color: '#e8e0d0' },
            ticks: { color: '#e8e0d0', maxTicksLimit: 8 },
            grid: { color: 'rgba(255,255,255,0.08)' }
          },
          y: {
            type: 'linear',
            title: { display: true, text: 'Elevation (ft)', color: '#e8e0d0' },
            ticks: {
              color: '#e8e0d0',
              callback: (v) => `${Math.round(v)} ft`
            },
            grid: { color: 'rgba(255,255,255,0.08)' }
          }
        }
      }
    });
  }

  if (container) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !chartInitialized) {
          chartInitialized = true;
          observer.disconnect();
          initChart();
        }
      },
      { rootMargin: '0px' }
    );
    observer.observe(container);
  }
</script>
```

### Pattern 2: Responsive Fixed-Height Container

**What:** Chart.js responds to its container's size. Setting `maintainAspectRatio: false` lets the container CSS (not the canvas) control the height. Apply different heights per breakpoint via Tailwind responsive classes on the wrapper div.

**Key insight from docs:** Apply height to the **container div**, not to the canvas directly. The container must be `position: relative`.

```html
<!-- Source: https://www.chartjs.org/docs/latest/configuration/responsive.html -->
<div
  id="elevation-chart-container"
  class="relative w-full h-[140px] sm:h-[180px]"
>
  <canvas id="elevation-chart"></canvas>
</div>
```

Tailwind 4 breakpoints used:
- Default (mobile): `h-[140px]` → 140px
- `sm:` (≥640px, covers tablet and desktop): `h-[180px]` → 180px

This satisfies ELEV-05: mobile 140px, tablet 180px, desktop 180px.

### Pattern 3: Tree-Shaken Chart.js Imports (not `chart.js/auto`)

**What:** Import only the components actually used to minimize chunk size.

**Required registers for a line chart with decimation:**
```typescript
// Source: https://www.chartjs.org/docs/latest/getting-started/integration.html
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Filler,
  Tooltip,
  Decimation
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, Filler, Tooltip, Decimation);
```

Do **not** import CategoryScale (not needed — x-axis is linear, not categorical).

### Anti-Patterns to Avoid

- **`import Chart from 'chart.js/auto'`**: Imports the entire library (~200KB). Use tree-shaken imports instead.
- **Setting height on `<canvas>` directly**: Chart.js reads the parent container size. Canvas height attributes are overridden by the responsive system.
- **Static top-level import of Chart.js**: `import { Chart } from 'chart.js'` at the module top level (outside dynamic import) puts Chart.js in the initial bundle. Must be inside a function called lazily.
- **Using CategoryScale for x-axis with `parsing: false`**: LTTB decimation requires `type: 'linear'` or `'time'` for the x-axis. CategoryScale will break decimation.
- **Omitting `parsing: false` for decimation**: The decimation plugin explicitly requires `parsing: false` to function. Without it, decimation silently does nothing.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data downsampling | Custom LTTB implementation | `chart.js` decimation plugin | Built-in, tested, handles edge cases; Chart.js stores original data as `dataset._data` |
| Responsive canvas resizing | ResizeObserver + canvas resize logic | `maintainAspectRatio: false` + CSS container | Chart.js manages this internally; custom observers cause conflicts |
| Axis label formatting | Manual DOM manipulation | `ticks.callback` function | Chart.js provides clean callback API for tick formatting |
| Gradient fill | Custom canvas afterDraw plugin | Chart.js scriptable `backgroundColor` with `createLinearGradient` | Chart.js supports CanvasGradient objects natively as backgroundColor |

**Key insight:** Chart.js 4's built-in decimation plugin handles the data reduction that would otherwise require a standalone LTTB library. It also respects data mutability and stores originals — don't hand-roll this.

---

## Common Pitfalls

### Pitfall 1: Chart.js in the Initial Bundle
**What goes wrong:** Chart.js appears in the Network tab on first page load, violating ELEV-04 and success criterion 4.
**Why it happens:** Top-level `import { Chart } from 'chart.js'` in the `<script>` tag's module scope gets bundled with the page's entry chunk by Vite.
**How to avoid:** Keep the entire `import('chart.js')` inside the `initChart()` async function, which is only called from within the IntersectionObserver callback.
**Warning signs:** Network tab shows a `chart.js`-named chunk loading before scroll/visibility interaction.

### Pitfall 2: Decimation Silently Disabled
**What goes wrong:** Chart renders all 456 raw points (acceptable for this dataset size, but misconfigured per plan).
**Why it happens:** One of three things: (a) `parsing: false` not set, (b) x-axis not `type: 'linear'`, (c) data count below `threshold`.
**How to avoid:** Set `parsing: false` at the **options** level (not just dataset level), use `type: 'linear'` for x-scale, and set `threshold` lower than point count.
**Warning signs:** `dataset._data` is undefined after chart creation (LTTB sets it when it fires).

### Pitfall 3: Chart Height Not Responding to CSS
**What goes wrong:** Chart renders at default aspect ratio (2:1) regardless of container height — typically very tall.
**Why it happens:** `maintainAspectRatio` defaults to `true`, which overrides container height.
**How to avoid:** Always set `maintainAspectRatio: false` in the options when using a fixed CSS height.
**Warning signs:** Canvas is taller than the container div; chart overflows its section.

### Pitfall 4: Elevation in Meters, Not Feet
**What goes wrong:** Y-axis shows values like 194–294 instead of 638–964 feet.
**Why it happens:** `route-data.json`'s `ele` field is in **meters** (194.7m–294.1m). The axes requirement (ELEV-01) specifies feet.
**How to avoid:** Multiply `ele * 3.28084` before building the dataset array.
**Warning signs:** Y-axis maximum is below 400 (would be ~964 feet for this route's max).

### Pitfall 5: `parsing: false` Requires Pre-Sorted {x, y} Array
**What goes wrong:** Chart renders incorrectly or decimation fails with unsorted data.
**Why it happens:** With `parsing: false`, Chart.js expects data "sorted and in the formats the associated chart type and scales use internally" (official docs).
**How to avoid:** The `route-data.json` points are already sorted by distance (miles 0 → 101.98), so mapping directly to `{x: pt.miles, y: pt.ele * 3.28084}` is safe.
**Warning signs:** Chart lines appear jagged or loop back.

### Pitfall 6: chartjs-plugin-annotation Version Mismatch
**What goes wrong:** Plugin fails to register or throws errors at runtime.
**Why it happens:** Plugin version 2.x targets Chart.js 3.x. Version 3.x is required for Chart.js 4.x.
**How to avoid:** Install `chartjs-plugin-annotation@3.1.0` (or `^3`) alongside `chart.js@4.5.1`.
**Warning signs:** Console errors about missing or incompatible plugin API.

---

## Code Examples

### Minimal Working Elevation Chart
```typescript
// Source: https://www.chartjs.org/docs/latest/configuration/decimation.html
//         https://www.chartjs.org/docs/latest/configuration/responsive.html

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Filler,
  Tooltip,
  Decimation
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, Filler, Tooltip, Decimation);

const routeData = await fetch('/data/route-data.json').then(r => r.json());
const data = routeData.points.map(pt => ({
  x: pt.miles,
  y: +(pt.ele * 3.28084).toFixed(1)  // meters to feet, 1 decimal
}));

const chart = new Chart(document.getElementById('elevation-chart'), {
  type: 'line',
  data: {
    datasets: [{
      data,
      parsing: false,           // REQUIRED for LTTB decimation
      borderColor: '#c8973e',
      backgroundColor: 'rgba(200, 151, 62, 0.15)',
      fill: 'start',
      pointRadius: 0,
      borderWidth: 1.5,
      tension: 0
    }]
  },
  options: {
    parsing: false,              // REQUIRED at options level too
    animation: false,
    responsive: true,
    maintainAspectRatio: false,  // lets CSS container set height
    plugins: {
      legend: { display: false },
      decimation: {
        enabled: true,
        algorithm: 'lttb',
        samples: 300,
        threshold: 400
      }
    },
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: 'Distance (miles)' },
        ticks: {
          maxTicksLimit: 8,
          callback: (v) => `${v}mi`
        }
      },
      y: {
        type: 'linear',
        title: { display: true, text: 'Elevation (ft)' },
        ticks: {
          callback: (v) => `${Math.round(v)}ft`
        }
      }
    }
  }
});
```

### HTML Container for Responsive Height
```html
<!-- Source: https://www.chartjs.org/docs/latest/configuration/responsive.html -->
<!-- Tailwind 4 responsive height: 140px mobile, 180px tablet/desktop -->
<div
  id="elevation-chart-container"
  class="relative w-full h-[140px] sm:h-[180px]"
>
  <canvas id="elevation-chart"></canvas>
</div>
```

### Gradient Fill (if visual polish desired)
```typescript
// Source: https://www.chartjs.org/docs/latest/samples/advanced/linear-gradient.html
// Use scriptable backgroundColor for gradient that adapts to chart area dimensions
backgroundColor: function(context) {
  const chart = context.chart;
  const { ctx, chartArea } = chart;
  if (!chartArea) return 'rgba(200, 151, 62, 0.15)';
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, 'rgba(200, 151, 62, 0.4)');
  gradient.addColorStop(1, 'rgba(200, 151, 62, 0.02)');
  return gradient;
}
```

---

## Data Facts (from actual route-data.json)

These are confirmed facts about the real dataset the chart will use:

| Property | Value |
|----------|-------|
| Point count (simplified) | 456 |
| Elevation range | 194.7m–294.1m raw → 638ft–965ft displayed |
| Distance range | 0–101.98 miles |
| Ele field unit | **meters** (must convert × 3.28084 for feet) |
| Point format | `{ lat, lon, ele, miles }` |
| Already sorted | Yes, ascending by miles (safe for `parsing: false`) |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `chart.js/auto` (full bundle) | Tree-shaken named imports + `Chart.register()` | Chart.js v3.0 | ~60% bundle size reduction for typical line chart |
| Manual LTTB library | Built-in decimation plugin | Chart.js v3.2 | No extra dependency needed |
| `new Chart(ctx, {type: 'line', data: {labels: [], datasets: []}})` with label arrays | `{x, y}` object arrays with `parsing: false` | Chart.js v3.0 | Required for decimation to work |
| Axis label plugins | `ticks.callback` function | Chart.js v2+ | Built-in API, no plugin needed |

**Deprecated/outdated:**
- `chart.js/auto`: Don't use for production. It imports all chart types, scales, and plugins (~97KB minified vs ~30KB for selective imports for a line chart).
- Category x-scale with label arrays: Not compatible with LTTB decimation. Use `type: 'linear'` with `{x, y}` objects.

---

## Open Questions

1. **Does LTTB add visible benefit with only 456 points?**
   - What we know: LTTB default threshold is 4× canvas width. At 400px wide, threshold = 1600 → 456 points is below threshold, so LTTB would NOT fire by default.
   - What's unclear: Whether to lower `threshold` to force LTTB to fire at 456 points, or skip decimation entirely.
   - Recommendation: Set `threshold: 400` and `samples: 300` to force LTTB for correctness/future-proofing per roadmap. The chart will still render fast at 456 points even without it.

2. **chartjs-plugin-annotation: is it actually used in 04-01/04-02?**
   - What we know: The roadmap says to install it, but neither task description mentions drawing any annotations.
   - What's unclear: Whether annotations will be added in a later phase or were planned for route landmarks.
   - Recommendation: Install it as the roadmap specifies, register it in the chart setup, but add no annotations in this phase unless the planner adds annotation tasks.

3. **Tailwind 4 `sm:` breakpoint value**
   - What we know: Tailwind 4 retains `sm` = 640px breakpoint by default (no tailwind.config.js to change it).
   - Confirmed: `sm:h-[180px]` applies at ≥640px which covers both tablet and desktop per the 3-tier requirement.

---

## Sources

### Primary (HIGH confidence)
- `https://www.chartjs.org/docs/latest/configuration/decimation.html` — Decimation plugin API, requirements, LTTB options
- `https://www.chartjs.org/docs/latest/configuration/responsive.html` — Responsive sizing, `maintainAspectRatio: false`, container pattern
- `https://www.chartjs.org/docs/latest/getting-started/integration.html` — Vite/bundler integration, tree-shaking pattern
- `https://www.chartjs.org/docs/latest/general/data-structures.html` — `{x, y}` object format, `parsing: false` requirements
- `https://www.chartjs.org/docs/latest/axes/cartesian/linear.html` — Linear scale config, `ticks.callback`, `title`
- `https://www.chartjs.org/docs/latest/samples/advanced/linear-gradient.html` — Gradient fill via scriptable backgroundColor
- `https://astro-tips.dev/tips/script-tag-dynamic-imports/` — Dynamic imports in Astro `<script>` tags
- `https://docs.astro.build/en/guides/client-side-scripts/` — Astro script bundling, `is:inline` vs processed scripts
- `public/data/route-data.json` — Direct inspection of actual data structure and values

### Secondary (MEDIUM confidence)
- `https://github.com/chartjs/Chart.js/releases/tag/v4.5.1` — Confirmed 4.5.1 is a stable patch release
- Web search for chartjs-plugin-annotation 3.1.0 — Confirms Chart.js 4.x compatibility; cross-referenced with official annotation docs

### Tertiary (LOW confidence)
- Web search results on elevation profile Chart.js patterns — Supporting context only; not relied on for critical decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed via official GitHub releases + official docs
- Architecture: HIGH — dynamic import pattern confirmed via Astro official docs; mirrors already-working Phase 3 Leaflet pattern
- Data format: HIGH — inspected actual `route-data.json` file directly; confirmed meters, 456 points, `{miles, ele}` keys
- Responsive height: HIGH — official Chart.js docs confirm `maintainAspectRatio: false` + container CSS pattern
- Decimation config: HIGH — official docs confirm `parsing: false` requirement + `type: 'linear'` x-scale requirement
- Pitfalls: HIGH — derived from official docs requirements, confirmed by direct data inspection

**Research date:** 2026-03-30
**Valid until:** 2026-06-30 (stable library; Chart.js 4.x has been stable for 2+ years)
