---
name: timeline-editor-build
description: Implement or extend a free browser-based timeline, roadmap, or Gantt editor. Use for timeline data models, editing interactions, persistence, rendering, import, or export work.
---

# Timeline Editor Build

Implement the requested user workflow in the existing project. Inspect the local instructions, package scripts, neighboring components, and current tests before changing code. Keep the implementation narrow and preserve the established public APIs and style.

## Route the behavior

Identify the code that owns the behavior, not merely the component that wires it. State one falsifiable hypothesis about the expected behavior and one focused check that could disprove it. Make the smallest testable change; after the first substantive edit, run that focused check before expanding scope.

## Keep the domain dependable

- Use a typed, serializable model with stable item IDs and an explicit format version.
- Keep date-only arithmetic deterministic and independent of local timezone/DST. Parse and validate imports at the boundary; never silently coerce malformed dates.
- Separate domain operations, timeline layout, rendering, persistence, and file export at the existing project boundaries. Add an abstraction only when it removes real complexity or matches a local pattern.
- Preserve identity and ordering through edits and round trips. Define how invalid ranges, milestones, clipping, overlapping labels, empty timelines, and large timelines behave.
- Use established libraries for complex file formats or export where appropriate; verify output compatibility rather than hand-writing a fragile format.

## Keep the free product usable

Prefer a local-first baseline: no account, server, external API, or paid dependency is required to create, save, reopen, or export a timeline unless the user explicitly asks for that architecture. Explain storage limits and make data export/import understandable. Avoid sending timeline contents to analytics or remote services without a clear user-facing reason and consent.

Deliver a working first-run experience with a blank state or useful sample. Ensure users can perform core edits through both direct manipulation and accessible controls. Preserve recovery paths such as undo, cancel, or reload of the last saved state where practical. Never ship hard-coded reference-product branding or assets.

## Verify incrementally

Add or update focused tests for domain rules and the changed user interaction. Cover meaningful negative cases: invalid dates, reversed ranges, deleted/missing items, persistence failures, and malformed import data as applicable. Check serialization round trips and export contents, not only that a button click returns success.

For frontend changes, verify the affected view at desktop and mobile sizes; check overflow, overlap, focus, and legibility. Run the narrow test/typecheck/lint command first, then only broader repository gates required by local instructions or risk. Report executed commands and remaining unverified behavior.