# Phase 28: Tech Debt Cleanup - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix three known code quality issues carried forward from the v1.3 audit: an undefined CSS variable (DEBT-01), a pipeline naming inconsistency (DEBT-02), and a cross-browser star rating rendering gap (DEBT-03). No new features — just resolving existing defects.

</domain>

<decisions>
## Implementation Decisions

### NF2217 canonical naming (DEBT-02)
- Canonical name is **NF2217-2218** — the route follows NF2217 then transitions to NF2218 end-to-end
- Display name in UI is "NF2217-2218" as-is (no friendly label needed — riders know these designations)
- Update all three sources directly: annotations.json, sector-details.json, and rendered UI
- No single source of truth — fix each file independently to use NF2217-2218

### Body font resolution (DEBT-01)
- The undefined `--font-body` variable should resolve to **Spectral** (serif)
- Establish a `--font-serif` CSS custom property with Spectral as the value
- RouteMap.astro sector panel body text should use the serif variable instead of falling back to monospace
- Load Spectral via **Google Fonts** CDN
- Include weights: **Regular (400) and Bold (700)**

### Star rating Firefox fallback (DEBT-03)
- Firefox fallback should **match the gradient look as closely as possible** using a Firefox-compatible CSS technique
- 90% visual similarity is acceptable — minor differences between browsers are fine as long as it looks intentional and polished
- Claude determines existing gradient colors from the codebase and matches them in the fallback
- **Both filled and empty stars** need to render well in Firefox, not just filled

### Claude's Discretion
- Specific CSS technique for Firefox gradient fallback (background-clip, SVG mask, etc.)
- Exact Spectral Google Fonts import configuration
- Whether --font-serif is defined globally or scoped to relevant components

</decisions>

<specifics>
## Specific Ideas

- User specified Spectral by name as the serif base font — this is a deliberate typography choice, not a placeholder
- The NF2217-to-NF2218 transition reflects actual geography (the roads connect end-to-end), so the compound name is accurate

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 28-tech-debt-cleanup*
*Context gathered: 2026-04-06*
