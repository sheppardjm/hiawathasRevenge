---
phase: 36-downloads-deep-linking-hero-video
verified: 2026-04-06T00:00:00Z
status: passed
score: 8/8 must-haves verified
---

# Phase 36: Downloads, Deep Linking & Hero Video — Verification Report

**Phase Goal:** Users can download GPX files for any route, share links that pre-select a specific route, and experience a video hero section
**Verified:** 2026-04-06
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Switching routes updates GPX download link href and label | VERIFIED | `route:change` listener in `index.astro` L243-252 sets `link.href`, `link.download`, `link.textContent` from `route.gpxFile`, `route.shortName`, `route.name` |
| 2 | Navigating to `#route=100k` pre-selects the 100k route on load | VERIFIED | `RouteMap.astro` L383-388 parses `location.hash.match(/^#route=(.+)$/)`, validates against `validIds`, and passes result as `initialRouteId` to `renderRoute` |
| 3 | Switching routes updates URL hash without page reload | VERIFIED | `history.replaceState(null, '', '#route=' + routeId)` at `RouteMap.astro` L737 |
| 4 | GPX download link starts correct for the default route on initial load | VERIFIED | Static HTML `href="/Munising_Hiawatha_s_Revenge.gpx"` matches `100mi` default; `renderRoute(initialRouteId)` at L856 fires `route:change` on init, correcting download attribute and label text |
| 5 | Hero section plays a looping background video behind badge and content | VERIFIED | `<video class="hero-video" autoplay muted loop playsinline>` with `position: absolute; inset: 0; object-fit: cover` in `HeroSection.astro` L30-39 |
| 6 | Existing hero image shows as fallback when video cannot play | VERIFIED | `<picture>/<img>` rendered beneath video in DOM order; `poster` attribute on video points to same hero image |
| 7 | Video respects prefers-reduced-motion by pausing | VERIFIED | CSS `@media (prefers-reduced-motion: reduce) { .hero-video { display: none } }` at L111-115; JS also calls `heroVideo.pause()` on init if `mq.matches` and dynamically responds to `mq` changes at L263-275 |
| 8 | Video autoplays without sound on all modern browsers including iOS Safari | VERIFIED | `muted`, `playsinline`, and `autoplay` all present — the required combination for iOS Safari autoplay permission |

**Score:** 8/8 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/pages/index.astro` | Contains GPX download link + route:change listener | VERIFIED | 253 lines; `id="gpx-download-link"` at L48; listener at L243-252 |
| `src/components/RouteMap.astro` | Contains `history.replaceState` and `initialRouteId` deep-link logic | VERIFIED | 914 lines; `replaceState` at L737; hash parsing at L383-388; `renderRoute(initialRouteId)` at L856 |
| `src/components/HeroSection.astro` | Contains `hero-video` element with video source | VERIFIED | 277 lines; `class="hero-video"` at L31; source at L38 |
| `public/Stationary_Hero_Video_With_Motion.mp4` | Video file served from public | VERIFIED | 7.1MB; present at `public/Stationary_Hero_Video_With_Motion.mp4` |
| `public/data/routes.json` | Routes manifest with `gpxFile` and `shortName` fields | VERIFIED | All three routes have `gpxFile` and `shortName`; `defaultRoute: "100mi"` |
| `public/Munising_Hiawatha_s_Revenge.gpx` | 100mi GPX file | VERIFIED | Present in `public/` |
| `public/Hiawatha_s_Revenge_100k.gpx` | 100k GPX file | VERIFIED | Present in `public/` |
| `public/Hiawatha_s_Revenge_50K_.gpx` | 50k GPX file | VERIFIED | Present in `public/` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/pages/index.astro` | `gpx-download-link` DOM element | `route:change` event listener | WIRED | Listener at L243 calls `document.getElementById('gpx-download-link')` and updates `href`, `download`, `textContent` |
| `src/components/RouteMap.astro` | URL hash | `history.replaceState` | WIRED | Called at L737 inside `renderRoute` on every route switch |
| `src/components/RouteMap.astro` | `initialRouteId` from URL hash | `location.hash.match` + `renderRoute` | WIRED | Hash parsed at L383-388; `renderRoute(initialRouteId)` called at L856 which also dispatches `route:change` to update GPX link |
| `src/components/HeroSection.astro` | Video file | `src="/Stationary_Hero_Video_With_Motion.mp4"` | WIRED | Exact path confirmed at L38 |
| `src/components/HeroSection.astro` | `prefers-reduced-motion` → video pause | CSS `display:none` + JS `pause()` | WIRED | Both CSS media query (L111-115) and JS listener (L263-275) handle reduced-motion |

---

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| GPX download link is route-aware | SATISFIED | Updates on every `route:change` event |
| URL hash deep-linking pre-selects route | SATISFIED | Parsed on init before first `renderRoute` call |
| Route switching updates hash without reload | SATISFIED | `replaceState` — no navigation event |
| Hero video plays looping background | SATISFIED | `autoplay muted loop playsinline` with cover layout |
| Hero image is poster/fallback | SATISFIED | `poster` attribute set; image rendered beneath video |
| Reduced-motion respected | SATISFIED | Both CSS and JS coverage |
| iOS Safari autoplay compatible | SATISFIED | `muted` + `playsinline` + `autoplay` combo |

---

### Anti-Patterns Found

None detected. No TODO/FIXME/placeholder patterns. No stub implementations. No empty handlers.

---

### Human Verification Required

#### 1. GPX File Downloads

**Test:** Click the GPX download link on the default route (100mi), switch to 100k, click again, switch to 50k, click again.
**Expected:** Each download triggers the correct GPX file with the correct filename (`HiawathasRevenge-100mi.gpx`, `HiawathasRevenge-100k.gpx`, `HiawathasRevenge-50k.gpx`).
**Why human:** File download behavior cannot be verified programmatically from source code.

#### 2. Deep-link navigation

**Test:** Navigate directly to `/#route=100k` and `/#route=50k` in a browser.
**Expected:** The page loads with the 100k or 50k route pre-selected on the map, and the GPX link reflects that route.
**Why human:** Browser navigation behavior and async init sequence require runtime testing.

#### 3. Video autoplay on iOS Safari

**Test:** Load the page on a real iOS device using Safari.
**Expected:** Video autoplays silently in the background; poster image shows momentarily before video starts if any delay.
**Why human:** iOS Safari autoplay behavior requires hardware testing.

#### 4. Reduced-motion behavior

**Test:** Enable "Reduce Motion" in system accessibility settings, load the page.
**Expected:** Video does not play; the hero image (poster) is visible as the hero background.
**Why human:** System-level accessibility setting must be tested in the OS.

---

## Notes

The initial static HTML for the GPX download link (`textContent="Download GPX File"`, `download="HiawathasRevenge.gpx"`) is generic rather than route-specific. However, `renderRoute(initialRouteId)` always fires on page load and dispatches `route:change`, which causes the index.astro listener to immediately correct the label and download attribute to match the actual default route. The `href` in static HTML (`/Munising_Hiawatha_s_Revenge.gpx`) does correctly match the `100mi` default, so even before JS hydrates, the link points to the right file.

---

_Verified: 2026-04-06_
_Verifier: Claude (gsd-verifier)_
