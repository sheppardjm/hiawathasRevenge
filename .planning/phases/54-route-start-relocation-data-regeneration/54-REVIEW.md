---
phase: 54-route-start-relocation-data-regeneration
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - scripts/match-photos.js
  - scripts/migrate-photos-mileage.js
  - scripts/route-config.js
findings:
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 54: Code Review Report

**Reviewed:** 2026-05-29
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Phase 54 covers three source changes: a one-shot photo-mileage migration script (`migrate-photos-mileage.js`, new), a path fix in `match-photos.js` (`ROUTE_PATH` now points at `public/data/100mi/route-data.json`), and restock-mile value syncs in `route-config.js`.

The `match-photos.js` path fix is correct and verified: `public/data/100mi/route-data.json` exists and has 451 points with `miles` 0..101.91, while the old top-level `public/data/route-data.json` is stale (Apr 6). No issue there.

The migration script is functionally plausible (the manifest was actually shifted: values now span 3.8..101.9, matching the +1.59 modulo-101.91 logic), but it contains a self-contradicting docstring that makes an irreversible, already-applied data transform impossible to verify, plus several robustness gaps (NaN propagation, strict wrap boundary, rounding-after-wrap, no backup). The `route-config.js` restock-mile changes are cosmetically correct but the `mile` field they edit is dead data — the actual annotation output is recomputed by coordinate snapping in `resolve-annotations.js`.

## Critical Issues

### CR-01: Migration docstring contradicts its own offset logic — direction of an irreversible shift is unverifiable

**File:** `scripts/migrate-photos-mileage.js:1-23`
**Issue:** The header comment and the inline source comment describe two mutually exclusive transforms:

- Header (line 4-6): "shifts all mileage values ... by +OFFSET_MILES ... to account for the ~1.59-mile rotation of the course start"
- Inline (line 21): "Old course mile 0 is at new course mile 100.32"

These cannot both be true. If old mile 0 maps to new mile 100.32, the offset must be `+100.32 (mod 101.91)`, producing `shiftMile(0) = 100.32`. But the code uses `OFFSET_MILES = 1.59`, so `shiftMile(0) = 1.6`. The two stated facts imply opposite shift directions (an old photo near the old start ends up either ~1.6 mi in, or ~100.3 mi in — i.e. just *before* the new start).

This is a one-shot, destructive, in-place rewrite of `photos-manifest.json` (line 46 overwrites the input file) that has **already been run** (commit `f3a9c01`). Because the rationale is self-contradictory, a reviewer cannot confirm the 56 photos were rotated in the correct direction. If the inline comment is the true geometry and the +1.59 offset is wrong, every photo is now mis-positioned by ~98 miles and the error is baked into the committed `photos-manifest.json` / `photos.json`.

**Fix:** Resolve the contradiction in the source and prove the direction. State a single, testable mapping and make the code match it, e.g.:
```js
// New course start (lat 46.34770, -86.72515) sits OFFSET_MILES *after* the old
// start along the old track, so an old reading R maps to new mile (R + OFFSET) mod TOTAL.
// Verification: old start photo (mile ~0) must land at the new start, i.e. ~0 or ~TOTAL.
const NEW_TOTAL_MILES = 101.91;
const OFFSET_MILES = 1.59;
```
Then add a one-line assertion of the anchor case (e.g. a known photo's expected new mile) so the direction is self-documenting. If the inline "100.32" figure is actually correct, the offset and the entire committed dataset must be re-derived. Remove or correct the "100.32" comment either way — leaving it makes the migration unauditable.

## Warnings

### WR-01: `shiftMile` produces NaN for entries with a missing/non-numeric `mile`

**File:** `scripts/migrate-photos-mileage.js:25-31, 41-44`
**Issue:** `shiftMile(undefined)` returns `NaN` (verified). The `.map` blindly applies it to every entry. If any manifest entry lacks `mile` (e.g. a newly added, not-yet-matched photo), the migration silently writes `"mile": null` (NaN serializes to `null` in JSON) into the manifest, corrupting that entry with no warning. For a destructive in-place rewrite this silently loses data.
**Fix:** Validate before shifting:
```js
const updated = manifest.map((entry) => {
  if (typeof entry.mile !== 'number' || Number.isNaN(entry.mile)) {
    console.error(`[migrate-photos-mileage] entry "${entry.filename}" has invalid mile: ${entry.mile}`);
    process.exit(1);
  }
  return { ...entry, mile: shiftMile(entry.mile) };
});
```

### WR-02: Destructive in-place rewrite with no backup and no re-run guard

**File:** `scripts/migrate-photos-mileage.js:46`
**Issue:** The script reads and overwrites the same file (`MANIFEST_PATH`). Because the shift is additive (`+1.59 mod 101.91`), running it twice silently double-shifts every value with no error — the operation is not idempotent and there is no guard, no backup, and no dry-run. Re-invocation (easy to do by accident given the plain `node scripts/...` usage) silently corrupts the dataset.
**Fix:** Write to a new file or take a timestamped backup first, and/or add an idempotency marker:
```js
import { copyFileSync } from 'fs';
copyFileSync(MANIFEST_PATH, `${MANIFEST_PATH}.pre-migrate-54.bak`);
// ...then write
```
At minimum, document loudly that this is one-shot and must not be re-run. Since the migration is already applied, consider deleting the script or renaming it `migrate-photos-mileage.applied.js` to prevent reuse.

### WR-03: Wrap uses strict `>` and rounds after wrapping — boundary values misclassified

**File:** `scripts/migrate-photos-mileage.js:25-31`
**Issue:** Two coupled boundary defects:
1. `if (newMile > NEW_TOTAL_MILES)` is strict, so a pre-round sum exactly equal to `101.91` does *not* wrap and is emitted as `101.9` rather than `0.0`. Verified: `shiftMile(100.32)` → `101.9` (sum is exactly 101.91, no wrap).
2. Rounding happens *after* the wrap subtraction, so sums just over total (e.g. old `100.34` → sum `101.93` → wrap `0.02` → `0.0`) collapse to 0, while sums just under (e.g. `100.31` → `101.90`) stay near total. The result is a discontinuity/ambiguity right at the seam where old-end photos live.

For a circular course the correct primitive is a true modulo on the unrounded value. The current strict-`>` plus post-wrap rounding leaves the mile-0 seam handled inconsistently.
**Fix:** Use a proper positive modulo and round once at the end:
```js
function shiftMile(oldMile) {
  const wrapped = ((oldMile + OFFSET_MILES) % NEW_TOTAL_MILES + NEW_TOTAL_MILES) % NEW_TOTAL_MILES;
  return Math.round(wrapped * 10) / 10;
}
```

### WR-04: `route-config.js` restock `mile` values are dead data — sync gives false confidence

**File:** `scripts/route-config.js:160, 167`
**Issue:** The phase-54 change updates `restock-camp7.mile` 44.7→42.69 and `restock-midway.mile` 75.7→74.22. But this field is never consumed for output: the only reader, `scripts/resolve-annotations.js:150-161`, snaps each restock by *coordinate* and emits `mile: round(snap.miles, 2)` — i.e. `snap.miles`, not `restock.mile`. Verified: `100mi/annotations.json` restock miles (42.69, 74.22) come from coordinate snapping, independent of these constants. Editing this field looks like it changes pipeline output but does not; if the constant and the snapped value ever diverge, nothing flags it, and a future maintainer may "fix" the wrong number.
**Fix:** Either remove the `mile` field from `RESTOCK_DEFS` (and the misleading comment at line 155 "mile is the position on the 100mi route") since it is non-authoritative, or add a comment stating it is documentation-only and that the authoritative value is computed in `resolve-annotations.js`. Do not leave an editable field that silently has no effect.

## Info

### IN-01: `match-photos.js` parses route data unconditionally before any validation

**File:** `scripts/match-photos.js:41-42`
**Issue:** `ROUTE_PATH` is read with `readFileSync`/`JSON.parse` with no `existsSync` guard (unlike `MANIFEST_PATH` at line 30). If `100mi/route-data.json` is missing or malformed the script throws a raw stack trace instead of the friendly diagnostics used elsewhere. `routeData.points` is also assumed to exist (line 42); a route-data file without `points` would fail later inside `snapByMileage` with a less clear error.
**Fix:** Add an existence/shape check mirroring the manifest guard, e.g. `if (!existsSync(ROUTE_PATH)) { console.error(...); process.exit(1); }` and validate `Array.isArray(routeData.points)`.

### IN-02: Magic constants `101.91` / `1.59` duplicated as literals in comments and code

**File:** `scripts/migrate-photos-mileage.js:22-23`
**Issue:** The total (101.91) is also the documented max of `100mi/route-data.json` (the route's true length). Hardcoding it as a literal means a future route-length regeneration silently desyncs the migration constant from the actual data. Minor for a one-shot script, but worth noting alongside CR-01.
**Fix:** If the script is retained, derive `NEW_TOTAL_MILES` from `100mi/route-data.json` (`points[points.length-1].miles`) rather than hardcoding, so the constant cannot drift from the source of truth.

---

_Reviewed: 2026-05-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
