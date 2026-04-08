---
status: diagnosed
trigger: "In the History section, when OS is set to light mode, the body text is too light to read."
created: 2026-04-07T00:00:00Z
updated: 2026-04-07T00:00:00Z
---

## Current Focus

hypothesis: Astro scoped style selectors cannot match `.editorial-grid p` inside light-mode media query because `.editorial-grid` is not a class defined in HiawathaExplainer — Astro data attributes differ. Additionally, the `<p>` tags inside `.two-col-moment` and `.subsection-bg` are nested too deep for the selector.
test: Compare light-mode p color selector vs dark-mode p color selector specificity and scoping
expecting: Scoped selectors fail to override cream text color
next_action: Report diagnosis

## Symptoms

expected: Dark text (forest-900) on cream/beige background in light mode
actual: Text is light-colored (cream-100) and unreadable against cream background
errors: none — purely visual
reproduction: Set OS to light-mode, view History section
started: Phase 47 (light-mode overrides added)

## Evidence

- timestamp: 2026-04-07
  checked: Light-mode media query block (lines 265-337)
  found: Line 295-297 sets `.editorial-grid p { color: var(--color-forest-900); }` for light mode
  implication: This selector targets paragraphs that are DIRECT or nested children of .editorial-grid

- timestamp: 2026-04-07
  checked: Dark-mode default paragraph style (lines 353-357)
  found: `.editorial-grid p { color: var(--color-cream-100); }` at line 355
  implication: Default sets cream text. Light-mode override at line 296 uses SAME selector `.editorial-grid p` — should work for those paragraphs.

- timestamp: 2026-04-07
  checked: HTML structure (lines 10-143)
  found: Paragraphs are NOT direct children of .editorial-grid. They are nested inside .subsection-bg divs. The DOM path is: .editorial-grid > .subsection-bg > p (or deeper: .editorial-grid > .subsection-bg > .two-col-moment > .two-col-prose > p)
  implication: `.editorial-grid p` is a descendant selector, so depth shouldn't matter for CSS matching. The selector should still match.

- timestamp: 2026-04-07
  checked: Astro scoped styles behavior
  found: Astro scoped styles add a data-astro-cid-xxx attribute to elements AND selectors. The selector `.editorial-grid p[data-astro-cid-xxx]` will only match p tags that have the scoping attribute. ALL p tags in this component template will get the attribute. Both the default rule (line 355) and the light-mode rule (line 296) are in the same <style> block, so both get the same scoping.
  implication: Both selectors should match identically — the light-mode version should override in light mode. BUT specificity is equal, so source order matters.

- timestamp: 2026-04-07
  checked: Source order of CSS rules
  found: The light-mode `@media (prefers-color-scheme: light) { .editorial-grid p { color: var(--color-forest-900); } }` is at line 295-297. The DEFAULT `.editorial-grid p { color: var(--color-cream-100); }` is at line 353-357. The DEFAULT comes AFTER the light-mode override in source order.
  implication: ROOT CAUSE FOUND — CSS source order. Both selectors have identical specificity. In CSS, when specificity is equal, the LAST rule wins. The default cream color at line 355 comes AFTER the light-mode forest-900 at line 296, so the default always wins regardless of media query. The media query override is effectively dead code.

## Eliminated

(none needed — root cause found on first hypothesis)

## Resolution

root_cause: CSS source order defeat. The entire `@media (prefers-color-scheme: light)` block (lines 265-337) is placed BEFORE the default dark-mode rules it needs to override (lines 353+). When both selectors have identical specificity, the last rule in source order wins. Every light-mode color override inside the media query is defeated by its corresponding default rule that appears later in the file. Affected selectors:

1. `.editorial-grid p` — light-mode forest-900 at line 296, defeated by cream-100 default at line 355
2. `.pull-quote p` — light-mode forest-900 at line 313, defeated by cream-100 default at line 434
3. `.pull-quote-attribution` — light-mode forest-800 at line 317, defeated by cream-200 default at line 442
4. `.pull-quote-attribution cite a` — light-mode forest-800 at line 321, defeated by cream-200 default at line 446

fix: (not applied — diagnosis only)
verification: (not applied)
files_changed: []
