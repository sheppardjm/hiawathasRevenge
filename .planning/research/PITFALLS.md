# Pitfalls Research

**Domain:** Static cycling route showcase site (interactive map + elevation chart + photo gallery)
**Researched:** 2026-03-30
**Confidence:** HIGH (most pitfalls verified with official docs or multiple credible sources)

---

## Critical Pitfalls

### Pitfall 1: Leaflet Crashes at Build Time Due to `window` Dependency

**What goes wrong:**
Importing Leaflet at the top level of an Astro component causes a build-time crash: `ReferenceError: window is not defined`. Leaflet reaches for `window` immediately on import — it is not SSR-safe. This breaks the entire build, not just the map component.

**Why it happens:**
Developers treat Astro like a standard bundler. Astro's default mode renders all components to static HTML at build time (server-side). Leaflet assumes a browser DOM and references `window`, `document`, and `navigator` during module initialization. The Node.js build process has none of these globals.

**How to avoid:**
Use `client:only="vanilla"` (or `client:only="react"` if using a React wrapper) on the Leaflet component. This tells Astro to skip SSR for that component entirely — it ships zero HTML for it and hydrates purely on the client. Do not use `client:load` or `client:idle`, which still attempt SSR. Never import Leaflet at the top of a `.astro` file outside of a component island.

```astro
<!-- Correct -->
<MapComponent client:only="vanilla" />

<!-- Wrong — will crash build -->
<script>
  import L from 'leaflet';
</script>
```

**Warning signs:**
- Build error mentioning `window is not defined`
- Stack trace pointing into leaflet's source
- Works in `astro dev` but fails in `astro build`

**Phase to address:**
Phase that introduces the map component. Establish the `client:only` pattern before writing any Leaflet code.

**Confidence:** HIGH — Verified via Leaflet GitHub issues #6552 and #8327, and Astro Islands documentation.

---

### Pitfall 2: Raw GPX Data Overwhelms Map and Chart Rendering

**What goes wrong:**
The 164KB GPX file likely contains thousands of trackpoints. Passing the full point array to Leaflet (as a polyline) and Chart.js (as an elevation dataset) causes sluggish rendering, especially on mobile. A 42km route can contain 3,000+ points after simple parsing — well beyond what produces a visually meaningful chart or smooth line at most zoom levels.

**Why it happens:**
Developers parse the GPX and immediately render all points without reduction. The temptation is to be "complete." But GPS records points at intervals as short as 1 second — most are redundant for display purposes.

**How to avoid:**
Apply the Ramer-Douglas-Peucker (RDP) algorithm to reduce polyline points before passing to Leaflet. Leaflet's built-in `simplify` option or the `leaflet-gpx` library can help; alternatively, process at build time using a script. For Chart.js, use the built-in decimation plugin (`plugins.decimation`) or pre-downsample to ~500 points for the elevation profile — this is imperceptible at display scale but cuts rendering time dramatically. Do this **at build time** in Astro (e.g., in a `.astro` frontmatter script), not at runtime on the client.

**Warning signs:**
- Map polyline stutters on zoom/pan on a mid-range phone
- Chart.js canvas rendering takes > 100ms (check browser DevTools)
- Build-time GPX parse returns > 5,000 points for the full route

**Phase to address:**
Phase that introduces GPX parsing. Bake reduction into the data pipeline before the map or chart ever sees the data.

**Confidence:** HIGH — Verified via Chart.js official performance docs and community GPX smoother tools documentation.

---

### Pitfall 3: Elevation Gain Statistics Are Wildly Inaccurate Due to GPS Noise

**What goes wrong:**
Naively summing all positive elevation deltas between consecutive GPX points produces an inflated total climb figure — often 2x or more the actual value. A flat stretch with GPS wobble can show hundreds of feet of phantom gain. The displayed "Total Elevation Gain: 4,200 ft" becomes untrusted by cyclists who know the route.

**Why it happens:**
GPS vertical accuracy is poor — typically 3x worse than horizontal. A modern consumer GPS can have vertical error of ±10–20 meters per reading. Summing raw delta elevations accumulates this noise linearly. This is a documented, well-known issue in Ride with GPS, Gaia GPS, and every cycling platform.

**How to avoid:**
Apply a smoothing pass before computing cumulative gain. Options in increasing robustness: (1) minimum threshold filter — only count gains > N meters (e.g., 5m threshold), (2) moving average or Kalman filter on the elevation array, (3) SRTM/DEM elevation correction by querying an elevation API for cleaner altitude values. For a showcase site, option (1) with a tuned threshold is simplest and sufficient. Run this at build time.

**Warning signs:**
- Computed elevation gain differs significantly from known Garmin/Strava figures for the same route
- Elevation profile chart shows jagged noise spikes instead of smooth climbs

**Phase to address:**
Phase that introduces GPX parsing and stat computation. Do not display elevation stats until noise filtering is confirmed working.

**Confidence:** HIGH — Multiple authoritative sources: Ride with GPS support docs, Gaia GPS community posts, grantholtes.com 2025 research paper on elevation calculation.

---

### Pitfall 4: Map Scroll Trap Ruins Mobile Experience

**What goes wrong:**
On mobile, a full-width Leaflet map intercepts single-finger scroll events. The user tries to scroll past the map, but instead pans the map. They are trapped. On desktop, the scroll wheel zooms the map instead of scrolling the page. Both behaviors frustrate users who are not trying to interact with the map.

**Why it happens:**
Leaflet enables `dragging` and `scrollWheelZoom` by default. This is correct behavior for a full-screen map app, but wrong for a map embedded mid-page in a showcase site.

**How to avoid:**
Install and configure `Leaflet.GestureHandling`. On mobile, this requires two fingers to pan the map (one finger scrolls the page). On desktop, it requires `Ctrl+scroll` to zoom. The plugin auto-detects language for the hint overlay (52 languages supported). Initialize the map with `gestureHandling: true` in map options.

```javascript
// Correct initialization
const map = L.map('map', {
  gestureHandling: true
});
```

**Warning signs:**
- QA tester on a phone gets stuck trying to scroll past the map
- User feedback: "the map hijacks the page"
- Map is wider than 70% of the viewport width

**Phase to address:**
Phase that sets up the Leaflet map. Non-negotiable for mobile-first experience.

**Confidence:** HIGH — Official Leaflet.GestureHandling library documentation, GitHub repository by elmarquis (verified active).

---

### Pitfall 5: OSM Tile Server Policy Violation Gets the Site Blocked

**What goes wrong:**
Using `tile.openstreetmap.org` tiles without proper attribution, or with caching disabled, or with pre-fetching large tile areas, triggers a block from OSM's tile servers — potentially replacing all map tiles with an error image. The site looks broken.

**Why it happens:**
Developers know OSM tiles are "free" and don't read the usage policy. Specific violations: (1) missing or hidden `© OpenStreetMap contributors` attribution, (2) sending `Cache-Control: no-cache` headers that force tile re-fetching, (3) loading the map at build time to "cache" tiles. Attribution must be **visible on the map**, not buried in a footer or hidden behind a toggle.

**How to avoid:**
Always include Leaflet's attribution control (it is on by default — do not disable it). Do not send no-cache headers. Do not pre-fetch tiles programmatically. For a static showcase site with normal visitor traffic, standard interactive usage is within policy. If traffic spikes unexpectedly, consider migrating to Stadia Maps (free tier) or CyclOSM tiles (same OSM policy, cycling-focused rendering more appropriate for this project).

**Warning signs:**
- Map tiles replaced by a reddish "block" image
- Attribution text removed or CSS-hidden (check `attributionControl: false` in map init)
- Build scripts that programmatically load map URLs

**Phase to address:**
Phase that introduces map tiles. Get attribution right from day one.

**Confidence:** HIGH — Verified via official OSM Foundation tile policy at operations.osmfoundation.org/policies/tiles/.

---

### Pitfall 6: Map-Elevation Chart Sync Breaks on Data Mismatch

**What goes wrong:**
The cross-component sync (hover on elevation chart → marker moves on map, or vice versa) silently breaks when the coordinate arrays used by Leaflet and Chart.js differ in length or indexing. A reduction pass on the map polyline but not the chart data creates index drift — the map marker and the chart highlight point to different locations on the route.

**Why it happens:**
Developers apply data reduction independently to each component. Map gets RDP-simplified points. Chart gets a separate downsampled array. Index `i` in one does not correspond to the same geographic location in the other.

**How to avoid:**
Produce **one canonical reduced dataset** at build time (or parse time) and share it with both components. Both Leaflet and Chart.js must consume the same array. If the chart needs more granularity than the map polyline (e.g., smoother elevation curve), maintain a separate chart array but do not use positional index for cross-component sync — use distance-along-route as the shared key instead.

The sync mechanism itself should use a `CustomEvent` dispatched on `window` (or a shared event target), not direct component coupling. This prevents re-renders and works with Astro's islands architecture where components are isolated.

**Warning signs:**
- Elevation hover marker is slightly offset from the expected map position
- Sync works on desktop but drifts on mobile (different rendering path)
- Components load GPX or share data independently rather than from a single source

**Phase to address:**
Phase that introduces cross-component interaction. Design the shared data contract before building either component.

**Confidence:** HIGH (architectural pattern) / MEDIUM (specific Astro event wiring) — architectural pattern verified via Chart.js decimation docs and Leaflet polyline rendering behavior.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Parse GPX client-side on page load | Simpler build setup | 164KB XML parse blocks main thread on load; noticeably slow on mobile | Never — parse at build time in Astro |
| Use raw GPX point count for chart data | No data processing code to write | Chart.js renders 3,000+ points; animations sluggish; mobile battery drain | Never — always decimate |
| Skip gesture handling plugin | Fewer dependencies | Users stuck scrolling; major UX complaint | Never for embedded maps |
| Store photo metadata in frontmatter only | No separate manifest file | Cannot build admin UI; data lives scattered across 50 markdown files | Acceptable for <10 photos |
| Skip width/height on PhotoSwipe items | Faster setup | PhotoSwipe opening animation breaks; layout shift during load | Never — required by PhotoSwipe |
| Use `tile.openstreetmap.org` without attribution check | Default Leaflet setup | Risk of tile server block; OSM TOS violation | Only in local development |
| Dynamically construct Tailwind class names | Flexible theming | Classes purged in production; styles missing | Never — use static class lists or safelist |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OSM / CyclOSM tiles | Missing or hidden `© OpenStreetMap contributors` attribution | Let Leaflet's `attributionControl` render it; never set `attributionControl: false` in production |
| Stadia Maps (Stamen Terrain replacement) | Attempting to use legacy `maps.stamen.com` URLs | Stamen tiles migrated to Stadia Maps in July 2023; use Stadia URLs; free tier available |
| CyclOSM tile URL | Using outdated URL format from old tutorials | Current URL: `https://{s}.tile-cyclosm.openstreetmap.fr/[cyclosm|cyclosm-lite]/{z}/{x}/{y}.png` |
| PhotoSwipe v5 | Not providing `data-pswp-width` and `data-pswp-height` on gallery items | Use Astro's `getImage()` at build time to get dimensions; required for opening animation and layout |
| Chart.js in Astro | Importing Chart.js at module scope in a `.astro` file | Chart.js is client-only; use inside an island component with `client:visible` for below-fold charts |
| Leaflet in Astro | `import L from 'leaflet'` in `.astro` frontmatter | Always use `client:only` island component |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full GPX point array in Chart.js | Animation lag, high CPU on chart hover | Decimate to ~500 points at build time | > ~1,000 points in chart dataset |
| No image lazy loading | Page load blocked by all 50 photos | Use Astro's `<Image loading="lazy">` default; PhotoSwipe only loads visible + adjacent | Always a problem at 50+ photos |
| Chart.js without `pointRadius: 0` | Rendering thousands of individual point circles | Set `pointRadius: 0` on the elevation line dataset | > ~200 points with default point rendering |
| Leaflet initializing before container has layout | Map renders wrong size; tiles misaligned | Ensure container has explicit height via CSS before `L.map()` call; call `map.invalidateSize()` after any layout change | Any time parent container is display:none or zero-height on init |
| Loading Leaflet JS eagerly | Adds ~98KB to initial page load | Use dynamic `import()` or `client:visible` so map only loads when scrolled into view | Always costs initial load; visible on slow connections |
| Thumbnail generation every build | 50 photos × sharp processing = slow builds | Use Astro's asset cache (`.astro` directory); only regenerate changed images | First build, or after cache clear |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Map with no default bounds | Map initializes to world view; user must find the route | Always call `map.fitBounds(trackBounds)` after adding the route polyline |
| Elevation chart with no distance axis | Users cannot relate chart position to map position | X-axis must be distance (miles/km), not point index |
| Photo gallery with no mileage context | Photos feel disconnected from the route; users cannot locate them | Show mileage marker in photo caption; consider map marker click-to-gallery link |
| Dark/brutalist tile theme on forest/trail route | Tone mismatch; feels like a tech demo, not a trip journal | Use CyclOSM or USGS topo tiles; earthy palette fits Forest Service aesthetic |
| Photo gallery that loads all 50 full-res images | Page hangs; mobile users bail | Use sharp-generated thumbnails for gallery grid; full-res only in lightbox on demand |
| Elevation chart not responsive on mobile | Chart overflows or is unreadably small | Set Chart.js `responsive: true` and `maintainAspectRatio: false`; give container explicit height via CSS, not aspect ratio |
| No "full screen" or expand affordance on map | Mobile users cannot explore the map meaningfully in a constrained container | Add Leaflet Fullscreen plugin or link to external map at full zoom |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **GPX parsing:** Elevation stats shown — verify they match Garmin/Strava figures for the route; raw GPS sum is likely 2x actual
- [ ] **Map attribution:** Map renders tiles — verify `© OpenStreetMap contributors` is visible on the map canvas, not in page footer
- [ ] **PhotoSwipe images:** Gallery opens — verify `data-pswp-width` and `data-pswp-height` are correct on every item (wrong dimensions break opening animation)
- [ ] **Elevation chart sync:** Hover indicator moves on chart — verify the map marker reflects the same geographic position (check index alignment with reduced dataset)
- [ ] **Mobile scroll:** Map looks good on desktop — test single-finger scroll past map on a real iOS/Android device to confirm scroll trap is absent
- [ ] **Tailwind in production:** Styles look correct in dev — run `astro build` and inspect output CSS; dynamically constructed class names may be purged
- [ ] **Photo thumbnails:** Gallery grid loads quickly — verify thumbnail files exist and are served (not full-res originals being resized in-browser)
- [ ] **Admin UI (photo manifest):** Form saves data — verify the JSON manifest is written to the correct path that the Astro build reads; path mismatch means photos silently disappear from the built site

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Build crash: `window is not defined` | LOW | Wrap import in `client:only` component; < 30 minutes |
| OSM tile server block | MEDIUM | Switch tile URL to CyclOSM or Stadia Maps; update attribution string; rebuild |
| Elevation stats wildly wrong | MEDIUM | Add threshold filter to elevation delta accumulation; re-run at build time; re-validate against known figures |
| Map-chart sync drift | HIGH | Audit data pipeline to ensure single canonical dataset; add distance-keyed sync instead of index-based; may require refactoring both components |
| Scroll trap on mobile | LOW | Add `gestureHandling: true` option to existing map init |
| Tailwind classes missing in production | MEDIUM | Add missing patterns to `safelist` in `tailwind.config.js`; audit dynamic class construction patterns |
| PhotoSwipe dimensions wrong | LOW | Run Astro `getImage()` at build time for each photo; use returned `width`/`height` values |
| Thumbnail generation too slow | LOW | Ensure Astro's `.astro` cache dir is preserved between builds; first build is always slow |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Leaflet `window is not defined` | Phase: Map foundation | `astro build` completes without errors |
| Raw GPX data overwhelming rendering | Phase: GPX parsing / data pipeline | Chart renders without lag on a mid-range mobile device |
| Inaccurate elevation gain stats | Phase: GPX parsing / stat computation | Computed gain within 10% of Garmin/Strava for this specific route |
| Mobile scroll trap | Phase: Map foundation | Single-finger scroll past map on iOS/Android Chrome navigates page, not map |
| OSM tile server violation | Phase: Map foundation | Attribution visible; no cache-busting headers; no programmatic tile prefetch |
| Map-chart sync data drift | Phase: Cross-component interaction | Hover on a known landmark in chart highlights the correct map position |
| PhotoSwipe missing dimensions | Phase: Photo gallery | Gallery opens with smooth animation; no layout shift |
| Tailwind purge stripping dynamic classes | Phase: Design / theming | Production build CSS includes all used classes; test with `astro build` not `astro dev` |
| Admin UI path mismatch | Phase: Photo manifest admin | Built site displays photos added via admin UI; no silent drops |

---

## Sources

- [Leaflet GitHub Issue #6552: `window is not defined`](https://github.com/Leaflet/Leaflet/issues/6552) — HIGH confidence
- [Leaflet GitHub Issue #8327: SSR `window is not defined`](https://github.com/Leaflet/Leaflet/issues/8327) — HIGH confidence
- [Astro Islands Architecture Docs](https://docs.astro.build/en/concepts/islands/) — HIGH confidence
- [Leaflet.GestureHandling library](https://github.com/elmarquis/Leaflet.GestureHandling) — HIGH confidence
- [OSM Foundation Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) — HIGH confidence
- [Chart.js Performance Documentation](https://www.chartjs.org/docs/latest/general/performance.html) — HIGH confidence
- [Ride with GPS: Grade, Elevation, and GPS Accuracy FAQ](https://support.ridewithgps.com/hc/en-us/articles/4419010957467-Grade-Elevation-and-GPS-GPS-Accuracy-FAQ) — HIGH confidence
- [Gaia GPS: Errors in cumulative elevation are a known issue](https://help.gaiagps.com/hc/en-us/community/posts/360014520714) — MEDIUM confidence
- [Grant Holtes: A Smoother Approach to Elevation Gain Calculation (July 2025)](https://www.grantholtes.com/assets/documents/Gaia_Elevation_Calculation.pdf) — MEDIUM confidence
- [CyclOSM OpenStreetMap Wiki](https://wiki.openstreetmap.org/wiki/CyclOSM) — HIGH confidence
- [Stamen Maps → Stadia Maps migration announcement](https://stamen.com/here-comes-the-future-of-stamen-maps/) — HIGH confidence
- [PhotoSwipe Data Sources docs](https://photoswipe.com/data-sources/) — HIGH confidence
- [Using PhotoSwipe in Astro (launchfa.st)](https://www.launchfa.st/blog/photoswipe-astro) — MEDIUM confidence
- [Tailwind content path misconfiguration (community discussion)](https://github.com/tailwindlabs/tailwindcss/discussions/7568) — MEDIUM confidence
- [Leaflet.GestureHandling alternative by Raruto](https://github.com/Raruto/leaflet-gesture-handling) — MEDIUM confidence

---
*Pitfalls research for: cycling route showcase site (Hiawatha's Revenge)*
*Researched: 2026-03-30*
