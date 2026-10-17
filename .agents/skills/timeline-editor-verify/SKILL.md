---
name: timeline-editor-verify
description: Verify functional, visual, accessibility, persistence, and export quality for a browser-based timeline, roadmap, or Gantt editor. Use before declaring a timeline workflow complete or diagnosing an editor regression.
---

# Timeline Editor Verification

Verify user outcomes, not just component rendering or a green command. Follow repository test instructions and use the smallest check that can falsify the current hypothesis first.

## Pin the behavior and oracle

Name the exact workflow and expected result. Use an independent oracle where possible: known date geometry, expected serialized records, a parsed export, or a manually specified fixture. A test that repeats the implementation's own assumptions is not sufficient. Record the tested revision, command, environment, and any skipped prerequisites when reporting results.

## Functional coverage

Exercise the main create/edit/save/reopen/export journey. Choose cases appropriate to the change:

- Empty timeline and a representative populated timeline.
- Milestones, one-day tasks, long tasks, group/swimlane ordering, and boundary dates.
- Date parsing, invalid and reversed ranges, timezone/DST boundaries, and range clipping.
- Selection, keyboard editing, undo/cancel, deletion, and duplicate labels.
- Save/reload and import/export round trips, including malformed or older-version data.
- Export content and geometry, not merely the existence of a downloaded file.

Keep coverage proportionate; do not add a broad new test suite for a narrow presentational change. Do not weaken assertions or add blanket retries to make tests pass.

## Visual, accessibility, and responsive checks

Use the project's browser-test tooling when available. Capture the real rendered editor at a representative desktop viewport and a narrow mobile viewport. Confirm it is nonblank, actions work, fonts/assets load, and timeline items, labels, controls, and dialogs do not overlap or clip. Use canvas pixel checks only when rendering to canvas makes DOM assertions insufficient.

Check keyboard reachability and visible focus for core editing and export paths, accessible labels for icon-only actions, non-color status cues, contrast, and zoom/reflow behavior. Validate both empty and populated states; long task names and dense timelines are deliberate stress cases.

## Diagnose failures locally

For a failure, capture the reproduction, expected/actual result, and the nearest owner. Distinguish product defects from environment or test-harness limitations. If evidence changes the hypothesis, inspect one nearby control point and revise the check; do not expand into unrelated cleanup.

## Completion report

Summarize the covered user path, checks that ran and passed/failed, screenshots or artifact locations if created, and remaining risks. Be explicit when the authenticated reference editor, external integrations, native PowerPoint compatibility, or a real device/browser was not tested.