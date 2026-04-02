# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-02)

**Core value:** Visitors experience the beauty and scale of the Hiawatha's Revenge route through an immersive, visually stunning showcase that inspires them to ride it and support MBTN.
**Current focus:** Phase 26 — Final Polish / iOS Safari Testing

## Current Position

Phase: 26 of 26 (Editorial Polish / iOS Safari Testing)
Plan: 2 of 2 in current phase
Status: Phase complete
Last activity: 2026-04-02 — Completed 26-02-PLAN.md (EB Garamond typography, cultural motifs, background fade)

Progress: [████████████████████] v1.0 ✅ | v1.1 ✅ | v1.2 ✅ | v1.3 Phase 23 ✅ | Phase 24 ✅ | Phase 25 ✅ | Phase 26 ✅ | v1.3 COMPLETE

## Performance Metrics

**v1.0 Summary:** 33 plans, 12 phases, 2 days
**v1.1 Summary:** 8 plans, 6 phases, 1 day
**v1.2 Summary:** 17 plans, 5 phases + gaps, 2 days

**v1.3 Phase 23:** 2 plans, 5 commits, ~8 min
**v1.3 Phase 24:** 1 plan, 2 task commits, ~2 min
*v1.3 metrics tracked as plans complete*

## Accumulated Context

### Decisions

All decisions logged in PROJECT.md Key Decisions table and MILESTONES.md entries.

Recent decisions relevant to v1.3:
- Build-time `sector-details.json` (not hardcoded in RouteExplainer) — single source of truth for panel content
- Ghost polyline pattern (not `leaflet-highlightable-layers`) — zero new dependencies
- HTML `<dialog>` + CSS translate — no JS animation library needed
- Panel as sibling of `#map` inside `.route-map` wrapper — avoids Leaflet z-index stacking context
- stars field is additive in annotations.json — difficulty string preserved unchanged to avoid breaking existing components
- Coordinate matching (5-decimal rounding Map) is the correct strategy for route-data.json -> hiawathasRevenge.json lookup (456/456 match rate)
- Phase 24: LABEL_COLORS reuses amber500 module-scope const for moderate — avoids duplicate getCSSColor call
- Phase 24: zIndexOffset 250 for labels — above polylines, below restock (500), photo (750), bike (1000)
- Phase 24: Panel hidden via absence of open attribute (not CSS display:none) — uses native dialog semantics; Phase 25 adds/removes open
- Phase 25-01: dialog.show() (not showModal()) — map stays interactive while panel is open
- Phase 25-01: position: fixed on .sector-panel — viewport-anchored during scroll (absolute scrolls away)
- Phase 25-01: if (!panel.open) panel.show() guard — prevents double-show error in Safari 16
- Phase 25-01: activeSector guard in hover handlers — prevents hover from overwriting active highlight
- Phase 25-01: flushRun borrows endIdx+1 point — handles 13 single-point surface runs
- Phase 25-02: Hardcoded hex colors in generateSparklineSvg (#7d9448, #c8973e, #f87171) — CSS vars can't be read from innerHTML-injected SVG without getComputedStyle(); hex matches resolved design tokens
- Phase 25-02: elevData.eleMin/eleMax used directly for ft range — avoids re-computing Math.min/max, values pre-computed in sector-elevations.json
- Phase 26-01: Cascade fix (not component relocation) for stat legibility — specific :global() overrides after broad span rule; no !important
- Phase 26-01: Skeleton on `<a>` wrapper (not `<img>`) — wrapper fills column space; .loaded removes shimmer cleanly
- Phase 26-01: parseDims() width/height attrs on `<img>` — zero-cost CLS prevention using data already extracted for PhotoSwipe
- Phase 26-02: Background image uses full JPG (no thumbnails directory) at 6% opacity — plan anticipated this substitution
- Phase 26-02: Bidirectional IntersectionObserver (classList.toggle) not one-shot for background fade in/out on scroll
- Phase 26-02: prefers-reduced-motion: static 4% opacity (not zero) — subtle atmospheric quality preserved for all users
- Phase 26-02: TurtleMotif uses currentColor for Tailwind text-* theming (same as ShieldMotif pattern)

### Pending Todos

None.

### Blockers/Concerns

- Ojibwe community consultation recommended (cultural sensitivity review)
- Project requires Node >=22.12.0 — use Volta (`/Users/Sheppardjm/.volta/bin/node`)
- Strava IDs populated for 6/7 segments (Rapid River Truck Trail pending — user hasn't created segment yet)
- Phase 25 requires iOS Safari device testing — Chrome DevTools cannot reproduce `leaflet-gesture-handling` iOS issues #98/#99

### Tech Debt (carried forward)

- Hero image 640KB JPEG — no WebP fallback, no srcset, no preload hint
- DATA-01 resolved (23-01): stars integer added to annotations.json
- DATA-03 resolved (23-01): surface-points.json produced with 456 entries
- DATA-02 resolved (23-02): sector-details.json produced with 7 entries (id, name, description, surface, stars, stravaLink, startMile, endMile)

## Session Continuity

Last session: 2026-04-02T21:34:23Z
Stopped at: Completed 26-02-PLAN.md (EB Garamond typography, cultural motifs, background fade) — v1.3 COMPLETE
Resume file: None
