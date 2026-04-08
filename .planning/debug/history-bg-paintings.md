---
status: diagnosed
trigger: "History section background paintings: wrong positioning (text column only, not full-width) and wrong images (Remington instead of Ojibwe/inspiration)"
created: 2026-04-07T00:00:00Z
updated: 2026-04-07T00:00:00Z
---

## Current Focus

hypothesis: Two independent issues — (1) width constrained by parent max-w-5xl container, (2) images hardcoded as Remington per Phase 47 plan
test: Read CSS layout chain and image references
expecting: Confirm container constraint and image choices
next_action: Report findings

## Symptoms

expected: Background paintings cover full viewport width of History section, using Ojibwe-themed inspiration images
actual: Paintings appear only within ~65ch prose column width; images are Remington paintings from historical-photos.json
errors: None (visual/design issue)
reproduction: View History section on any wide viewport
started: Phase 47 implementation (commit 5db2155)

## Eliminated

(none needed — root causes identified on first pass)

## Evidence

- timestamp: 2026-04-07
  checked: HTML structure in HiawathaExplainer.astro lines 10-12
  found: Section has `<div class="max-w-5xl mx-auto px-4">` wrapper inside `<section class="hiawatha-section">`
  implication: The .editorial-grid and all .subsection-bg elements are children of this max-w-5xl container — they can never exceed ~64rem

- timestamp: 2026-04-07
  checked: .subsection-bg CSS (lines 177-188)
  found: Uses `grid-column: full` within editorial-grid, but editorial-grid itself is constrained by parent max-w-5xl. The ::before uses `position: absolute; inset: 0` which fills only the positioned ancestor (.subsection-bg has position: relative)
  implication: ::before fills .subsection-bg which fills .editorial-grid which fills max-w-5xl — never the full viewport

- timestamp: 2026-04-07
  checked: ::before CSS (lines 225-252)
  found: Three background-image URLs all point to /thumbs/historical/remington-*.webp files
  implication: Only two Remington images exist; ride-section reuses departure painting

- timestamp: 2026-04-07
  checked: Phase 47 plan (47-01-PLAN.md)
  found: Plan explicitly specified "Remington paintings" — this was a deliberate design choice in the plan, not a coding error
  implication: The plan itself chose the wrong images; implementation correctly followed the plan

- timestamp: 2026-04-07
  checked: /images/inspiration/ directory
  found: 49 files including Ojibwe-themed artwork (original-*.webp), UI references (ui-*.webp), and landscape photos
  implication: Alternative imagery exists but is in /images/inspiration/ (non-public source directory), not in /public/thumbs/

## Resolution

root_cause: Two root causes identified — see report
fix: (diagnosis only)
verification: (diagnosis only)
files_changed: []
