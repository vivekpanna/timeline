---
name: timeline-editor-design
description: Design workflows, interaction models, data structures, and visual behavior for a browser-based timeline, roadmap, or Gantt editor. Use when shaping the editor experience or translating a product brief into an implementable design.
---

# Timeline Editor Design

Design the smallest coherent editor that lets someone make a clear timeline and get it out of the app. Follow the existing repository's framework, design system, and conventions when present; do not impose a new stack or visual system without need.

## Start from the workflow

Use the discovery brief or establish the missing user outcome first. Map the main journey:

`create/open -> edit data -> inspect presentation -> save -> export/share`

For each step, specify the visible state, user action, state change, empty/error/loading behavior, and recovery path. Keep primary editing actions close to the timeline. Make dates, task names, and milestone meaning readable without requiring hover.

## Model the timeline before the canvas

Define a serializable domain model independent of rendering. At minimum, decide:

- Timeline metadata, visible date range, scale, and display preferences.
- Items with stable IDs, titles, start/end dates or a milestone date, status/progress, and optional style overrides.
- Optional groups/swimlanes, ordering, and containment rules.
- Validation for missing, invalid, or reversed dates and out-of-range items.
- A versioned save format and migration behavior if persisted data evolves.

Keep date arithmetic and layout calculations out of presentation components. Establish timezone and date-only semantics before coding; project timelines normally describe calendar dates, not instants. Choose and document overlap, clipping, and milestone placement rules.

## Specify interactions and states

Prefer direct, reversible editing with clear selection and focus. Define pointer and keyboard paths for selecting items, moving/resizing date ranges, editing labels, reordering, and undo/redo when in scope. Avoid making drag the only way to edit a date. Prevent accidental data loss with explicit delete confirmation or undo.

Plan empty, populated, selected, invalid, read-only, export-in-progress, and export-failure states. Define what autosave means, when it occurs, and how a save failure is surfaced. Keep controls stable in size; avoid layout jumps as labels or item counts change.

## Design for clarity and responsive use

Use a compact, task-focused editing surface rather than a marketing landing page. Preserve legibility at desktop and narrow widths. On small screens, choose a deliberate reflow or scroll strategy; do not compress dates and labels until they collide. Use accessible names, visible focus, adequate contrast, and non-color indicators for status.

Create an original visual language. Similarity means comparable user capability and output quality, not copied branding, exact screen composition, product wording, icons, templates, or proprietary assets. Use original or properly licensed assets and follow the project's license requirements.

## Handoff

Return the workflow map, key states, data contract, date/layout rules, responsive behavior, accessibility requirements, unresolved assumptions, and a short acceptance checklist. Identify one nearby existing component or convention to reuse before proposing a new abstraction.