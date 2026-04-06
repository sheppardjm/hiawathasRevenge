# Roadmap: Hiawatha's Revenge

## Milestones

- ✅ **v1.0 MVP** - Phases 0-11 (shipped 2026-03-31)
- ✅ **v1.1 Visual Redesign** - Phases 12-17 (shipped 2026-03-31)
- ✅ **v1.2 Cultural Maximalism** - Phases 18-22 + gaps (shipped 2026-04-02)
- ✅ **v1.3 Interactive Map & Editorial Polish** - Phases 23-27 (shipped 2026-04-02)
- ✅ **v1.4 Performance & Polish** - Phases 28-31 (shipped 2026-04-06)

## Phases

<details>
<summary>✅ v1.0 through v1.3 (Phases 0-27) - SHIPPED</summary>

See MILESTONES.md for full history.

</details>

### ✅ v1.4 Performance & Polish (Complete)

**Milestone Goal:** Ship-ready polish — tech debt cleanup, SEO/social sharing metadata, image optimization for performance, and accessibility hardening so the site is confident to share publicly.

- [x] **Phase 28: Tech Debt Cleanup** - Fix carried-forward CSS, pipeline, and cross-browser issues ✅ 2026-04-06
- [x] **Phase 29: SEO & Social Sharing** - Meta tags, structured data, and canonical URL for discoverability ✅ 2026-04-06
- [x] **Phase 30: Image Optimization** - Hero srcset, gallery WebP, parallax image-set() for Lighthouse performance ✅ 2026-04-06
- [x] **Phase 31: Accessibility Hardening** - Focus indicators, alt text, contrast, and reduced-motion for WCAG compliance ✅ 2026-04-06

## Phase Details

### Phase 28: Tech Debt Cleanup ✅
**Goal**: Known code quality issues from v1.3 audit are resolved — no undefined variables, no naming inconsistencies, no browser-specific rendering gaps
**Depends on**: Nothing (first phase of v1.4)
**Requirements**: DEBT-01, DEBT-02, DEBT-03
**Completed**: 2026-04-06
**Success Criteria** (what must be TRUE):
  1. ✓ RouteMap.astro sector panel text renders with the intended body font, not falling back to monospace
  2. ✓ The NF2217/NF2217-2218 segment displays consistent naming across annotations.json, sector-details.json, and the rendered UI
  3. ✓ Star rating gradient text renders identically in Firefox and Chrome (no missing gradient or invisible stars)
**Plans**: 1 plan

Plans:
- [x] 28-01-PLAN.md -- Fix undefined --font-body (add Spectral via Fonts API), reconcile NF2217 naming to NF2217-2218, add Firefox @supports fallback for star rating gradient

### Phase 29: SEO & Social Sharing ✅
**Goal**: The site appears with a rich preview (title, description, hero image) when shared on social media or indexed by search engines, with structured event data for Google
**Depends on**: Nothing (independent of Phase 28)
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04
**Completed**: 2026-04-06
**Success Criteria** (what must be TRUE):
  1. ✓ Sharing the site URL on Facebook/LinkedIn shows the hero image, title "Hiawatha's Revenge", and a compelling description
  2. ✓ Sharing the site URL on Twitter/X shows a large image card with the hero photo
  3. ✓ The page has a canonical URL preventing duplicate content in search results
  4. ✓ Google Rich Results Test validates the Event structured data for June 6, 2026
**Plans**: 1 plan

Plans:
- [x] 29-01: Add OpenGraph, Twitter Card, canonical, and Event JSON-LD to BaseLayout

### Phase 30: Image Optimization ✅
**Goal**: All major images serve modern formats at appropriate sizes — hero LCP is fast, gallery serves existing WebP thumbnails, parallax backgrounds have WebP variants
**Depends on**: Nothing (independent of Phases 28-29)
**Requirements**: IMG-01, IMG-02, IMG-03, IMG-04
**Completed**: 2026-04-06
**Success Criteria** (what must be TRUE):
  1. ✓ Hero image loads as WebP with the browser selecting an appropriate size from 640w/1280w/1600w srcset based on viewport
  2. ✓ Lighthouse reports no "Properly size images" or "Serve images in next-gen formats" warnings for the hero (structural conditions met)
  3. ✓ Gallery grid serves .webp thumbnail files (not .jpg sources) with no visible quality difference
  4. ✓ HiawathaExplainer parallax background images use CSS image-set() with WebP preference and JPEG fallback
**Plans**: 2 plans

Plans:
- [x] 30-01-PLAN.md -- Hero WebP pipeline — generate srcset variants, add `<picture>` element and `<link rel="preload">`
- [x] 30-02-PLAN.md -- Gallery and parallax WebP — update thumbnail paths and add CSS image-set()

### Phase 31: Accessibility Hardening ✅
**Goal**: The site passes a WCAG AA accessibility audit — all interactive elements are keyboard-navigable with visible focus, all images have meaningful alt text, color contrast meets minimums, and motion respects user preferences
**Depends on**: Phase 28 (star rating gradient fix affects A11Y-03 contrast verification)
**Requirements**: A11Y-01, A11Y-02, A11Y-03, A11Y-04
**Completed**: 2026-04-06
**Success Criteria** (what must be TRUE):
  1. ✓ Tabbing through the page shows a visible focus ring on every interactive element (sector panel close button, GPX download link, Strava links, donate CTAs, gallery thumbnails)
  2. ✓ Gallery thumbnail images have descriptive alt text identifying the photo content and approximate mile marker
  3. ✓ Empty stars in difficulty ratings have a contrast ratio of at least 4.5:1 against their background
  4. ✓ Sector panel open/close transitions are instant (no animation) when the user has prefers-reduced-motion enabled
**Plans**: 2 plans

Plans:
- [x] 31-01-PLAN.md -- Focus indicators and gallery alt text — global :focus-visible baseline, component overrides, descriptive alt from mile data
- [x] 31-02-PLAN.md -- Star rating contrast fix and reduced-motion verification — amber-300 empty stars (5.30:1), A11Y-04 comment

## Progress

**Execution Order:**
Phases 28-31. Phases 28, 29, 30 are independent; Phase 31 depends on Phase 28.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 28. Tech Debt Cleanup | v1.4 | 1/1 | ✅ Complete | 2026-04-06 |
| 29. SEO & Social Sharing | v1.4 | 1/1 | ✅ Complete | 2026-04-06 |
| 30. Image Optimization | v1.4 | 2/2 | ✅ Complete | 2026-04-06 |
| 31. Accessibility Hardening | v1.4 | 2/2 | ✅ Complete | 2026-04-06 |
