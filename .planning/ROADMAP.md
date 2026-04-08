# Roadmap: Hiawatha's Revenge v1.10

## Overview

v1.10 extends the scroll-triggered Ojibwe inspiration background imagery pattern — proven in the History section during v1.8 — to the Route Map and Gallery sections. This is a single-phase milestone applying an established CSS/JS pattern to two new sections with two new processed images.

## Milestones

- v1.0 through v1.9: See .planning/MILESTONES.md
- **v1.10 Section Background Imagery** - Phase 49 (current)

## Phases

- [ ] **Phase 49: Section Background Imagery** - Route Map and Gallery sections gain scroll-triggered inspiration backgrounds matching the History section pattern

## Phase Details

### Phase 49: Section Background Imagery
**Goal**: Visitors see subtle, atmospheric inspiration imagery fade in behind the Route Map and Gallery sections as they scroll, matching the established History section treatment
**Depends on**: Nothing (standalone milestone; builds on v1.8 Phase 47 pattern)
**Requirements**: BG-01, BG-02, BG-03, BG-04, BG-05, BG-06, BG-07
**Success Criteria** (what must be TRUE):
  1. When a visitor scrolls to the Route Map section, a sepia-toned topo arrowheads background image fades in behind the segment cards
  2. When a visitor scrolls to the Gallery section, a sepia-toned morel woodcut background image fades in behind the photo masonry
  3. A visitor using OS-level light mode sees appropriate contrast and opacity adjustments on both backgrounds (no washed-out or invisible imagery)
  4. A visitor with `prefers-reduced-motion: reduce` enabled sees both backgrounds at static low opacity with no fade transition
  5. Both processed images (route-bg.webp, gallery-bg.webp) exist in `public/thumbs/inspiration/` and are referenced by the CSS
**Plans**: TBD

Plans:
- [ ] 49-01: Process images and implement section backgrounds

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 49. Section Background Imagery | 0/TBD | Not started | - |
