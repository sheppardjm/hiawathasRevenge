# Requirements: Hiawatha's Revenge

**Defined:** 2026-04-06
**Core Value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.

## v1.4 Requirements

Requirements for ship-ready polish. Each maps to roadmap phases.

### Image Optimization

- [x] **IMG-01**: Hero image converted to WebP with responsive srcset (640w, 1280w, 1600w) and `<picture>` element ✅
- [x] **IMG-02**: Hero image has `<link rel="preload">` hint for LCP optimization ✅
- [x] **IMG-03**: Gallery thumbnails serve existing WebP files instead of JPEG sources ✅
- [x] **IMG-04**: Background parallax images (3 in HiawathaExplainer) have WebP variants via CSS `image-set()` ✅

### Accessibility

- [ ] **A11Y-01**: All interactive elements have `:focus-visible` indicators (sector panel close, GPX download, Strava links, donate CTAs)
- [ ] **A11Y-02**: Gallery thumbnails have meaningful alt text (e.g., "Route photo at mile 42")
- [ ] **A11Y-03**: Star rating empty stars meet WCAG AA contrast ratio (currently 2.95:1)
- [ ] **A11Y-04**: RouteMap sector panel transitions respect `prefers-reduced-motion`

### SEO & Social Sharing

- [x] **SEO-01**: OpenGraph tags in BaseLayout (og:title, og:description, og:image, og:url) ✅
- [x] **SEO-02**: Twitter Card tags in BaseLayout (twitter:card, twitter:title, twitter:image) ✅
- [x] **SEO-03**: Canonical link in BaseLayout ✅
- [x] **SEO-04**: Schema.org Event JSON-LD structured data for June 6, 2026 ride ✅

### Tech Debt

- [x] **DEBT-01**: Fix undefined `--font-body` CSS variable in RouteMap.astro sector panel ✅
- [x] **DEBT-02**: Reconcile NF2217 vs NF2217-2218 pipeline name divergence across annotations and sector-details ✅
- [x] **DEBT-03**: Add Firefox fallback for `-webkit-text-fill-color` on star rating gradient ✅

## Future Requirements

### Cross-Browser/Device (deferred to v1.5+)

- **XBRO-01**: iOS Safari touch target verification on real device
- **XBRO-02**: Sector panel gesture handling on iOS Safari
- **XBRO-03**: Bottom sheet behavior verification on iOS Safari

## Out of Scope

| Feature | Reason |
|---------|--------|
| iOS Safari device testing | Deferred — requires physical device, not code-level fixes |
| Lighthouse CI integration | Over-engineering for a static showcase site |
| Bundle splitting/code splitting | Lazy loading already handles deferred JS; diminishing returns |
| Service worker / PWA | Static site, no offline requirement |
| Image CDN / responsive images API | Static build, no CDN infrastructure |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| IMG-01 | Phase 30 | Complete |
| IMG-02 | Phase 30 | Complete |
| IMG-03 | Phase 30 | Complete |
| IMG-04 | Phase 30 | Complete |
| A11Y-01 | Phase 31 | Pending |
| A11Y-02 | Phase 31 | Pending |
| A11Y-03 | Phase 31 | Pending |
| A11Y-04 | Phase 31 | Pending |
| SEO-01 | Phase 29 | Complete |
| SEO-02 | Phase 29 | Complete |
| SEO-03 | Phase 29 | Complete |
| SEO-04 | Phase 29 | Complete |
| DEBT-01 | Phase 28 | Complete |
| DEBT-02 | Phase 28 | Complete |
| DEBT-03 | Phase 28 | Complete |

**Coverage:**
- v1.4 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after Phase 30 completion*
