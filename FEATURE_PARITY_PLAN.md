# Feature Parity Assessment and Free-Access Plan

**Reference:** Lucen Timeline Online, formerly Office Timeline Online  
**Assessment date:** 2026-10-18  
**Goal:** Match the reference product's user-facing capabilities while keeping every Daymark feature available without a subscription, trial expiry, item cap, watermark, or premium-only template. Daymark remains its own product: parity means equivalent workflows and outcomes, not copied code, branding, artwork, or proprietary template text.

## Executive Summary

Daymark already delivers a capable local-first individual workflow: create from blank or a template, edit tasks and milestones, use Timeline/Gantt/Data views, save in the browser, import CSV/XLSX, and export editable PPTX, SVG, CSV, JSON, and print/PDF. It now has 53 free gallery entries and six composition families, including grouped swimlanes and quarter-based roadmaps.

The largest confirmed parity gaps are:

1. Direct manipulation and richer authoring: no drag-to-reschedule/resize, reorder controls, or undo/redo.
2. Template-by-template depth: the 53 reference cards now have a documented Daymark crosswalk, but many Daymark examples still use generated category patterns and reference-side details remain unverified.
3. Connected data: CSV/XLSX are file imports; there is no Microsoft Project file import or live refresh from Jira, Excel, Smartsheet, or Google Sheets.
4. Collaboration: projects are local to one browser; invitations, permissions, shared cloud state, and revocation are absent.
5. Embedded, refreshable visuals in Google Docs/Slides are absent.
6. Presentation parity: editable PPTX exists, but export needs a systematic fidelity and interoperability pass against all layouts and formatting states.

The recommended sequence is to finish the solo authoring and template workflow first, then strengthen presentation export, then add integrations, then hosted collaboration and embeds. This keeps Daymark useful without an account or network while avoiding a premature backend commitment.

## Evidence and Confidence

| Evidence | What it confirms | Confidence / limit |
|---|---|---|
| [Lucen Timeline Online product page](https://www.lucensoftware.com/products/timeline-online) | Browser-based timeline, roadmap, and swimlane creation; full template gallery; native PowerPoint export; teammate invitations and role permissions; imports from Jira, Microsoft Project, Excel, Smartsheet, and Google Sheets; dynamic refresh; Google Docs/Slides embedding | Official product claims, checked 2026-10-18. Marketing claims do not define every editor interaction or connector edge case. |
| [Lucen Timeline Online pricing](https://www.lucensoftware.com/products/timeline-online#pick-your-plan) | The public Online offer has Free and Premium. Premium advertises collaboration, integrations, watermark-free exports, and the full template gallery. Daymark's target is to make those capabilities free. | Official plan summary; exact limits and prices may change. |
| [Reference web app](https://online.officetimeline.com/app/#/new-from-template) | Gallery sections include All, Popular, Swimlane, and Browse by category; template cards show free/premium state; preview has Use, Import, Prev, and Next actions. The visible catalog in the shared session had 53 cards. | Direct browser observation. The authenticated session expired during this reassessment; premium Use actions were not taken. |
| Prior authorized reference session in this workspace | New routes were From template, Import data, and From scratch. The import surface exposed Microsoft Project/Excel files, Google Sheets/Jira/Smartsheet connections, and recent imports. | Observed earlier in the user-provided session. Not reverified after the session timed out. |
| Daymark source: [src/TimelineEditor.tsx](src/TimelineEditor.tsx), [src/timeline.ts](src/timeline.ts), [src/spreadsheetImport.ts](src/spreadsheetImport.ts), [src/powerpoint.ts](src/powerpoint.ts) | Current workflows and data/export boundaries listed below | Direct source inspection. |
| Unknown | Exact online-editor capabilities for selection, keyboard shortcuts, text/shape styling, conflict handling, embed permissions, and per-connector refresh semantics | Do not treat these as requirements until checked in an authorized live editor or official documentation. |

**Scope guard:** Office Timeline's separate PowerPoint add-in plan matrix mentions capabilities such as dependencies, critical path, sub-swimlanes, and planned-vs-actual tracking. Those are not counted as confirmed Timeline Online parity in this plan unless the Online editor is independently verified to support them.

## Current Daymark Offer

| Capability | What Daymark offers now | Status |
|---|---|---|
| Create | Start blank, create from a gallery template, or import a spreadsheet | Present |
| Gallery | 53 free entries, search, category filtering, preview cards, six layout families, differentiated starter data | Present; template-by-template fidelity is partial |
| Core data | Tasks and milestones with title, workstream, owner, start/end dates, and integer progress | Present |
| Editing | Item dialog and spreadsheet-style Data view; paste tabular rows; add/delete items | Present; no drag/resize, row/lane reordering, or undo/redo |
| Visualization | Timeline, Gantt, and Data modes; week/month scale; Today; classic/colorful/minimal design; layout-aware swimlane, roadmap, portfolio, milestone, and event rendering | Present; a project's composition is currently selected by its template/layout rather than freely switchable |
| Persistence | Local browser storage with JSON backup/restore | Present; no account, cloud sync, or cross-device workspace |
| Imports | CSV and XLSX file import; validation and row-level error reporting | Partial; no MPP/Project import, online connector, or refresh link |
| Exports | Editable PPTX, SVG, CSV, JSON, and print/PDF | Present; PPTX fidelity and editability need formal compatibility checks |
| Collaboration | None; timelines remain in the local browser | Missing |
| Integrations/embeds | None | Missing |
| Free access | No paid tier or premium markers in Daymark; local workflow requires no account | Present for current features; future hosted services must also avoid feature gates and hidden usage caps |

The data model is currently version 1 and includes the original template `layout`, a separately persisted `presentation` (`timeline`, `roadmap`, or `swimlane`), items, groups, and project dates. The task model does not currently represent source links, risk flags, comments, or collaboration state. Build and lint scripts exist; there is no dedicated test script in `package.json`.
| Visualization | Timeline, Gantt, and Data modes; independently switchable Timeline/Roadmap/Swimlane compositions; week/month scale; Today; classic/colorful/minimal design; layout-aware portfolio, milestone, and event variants | Present; composition persists per project and SVG/PPTX follow it |

## Gap Matrix

Priority meanings: **P0** = needed for a complete solo product workflow; **P1** = presentation quality and reliable handoff; **P2** = connected-source parity; **P3** = sharing and embeds. Effort is relative (S/M/L), not a calendar commitment.

| Area | Reference capability | Daymark today | Gap | Priority |
|---|---|---|---|---|
| Entry points | Template, import, and scratch starts | All three equivalent starts exist | Mostly parity; import source breadth remains | P0/P2 |
| Gallery navigation | Popular, Swimlane, category browsing, search, previews; free and premium cards | Search, category filter, 53 free cards, layout-aware previews | Reconcile every reference card with a deliberate original equivalent; add gallery sections if they improve discovery | P0 |
| Gallery navigation | Popular, Swimlane, category browsing, search, previews; free and premium cards | Search, category filter, 53 free cards, layout-aware previews, and a 53-row nearest-fit crosswalk in [TEMPLATE_PARITY_INVENTORY.md](TEMPLATE_PARITY_INVENTORY.md) | Reference lane/item/horizon/license facts need authenticated per-card review; improve gallery discovery only where useful | P0 |
| Timeline/roadmap/swimlane | Separate presentation types | Timeline/Gantt/Data modes plus template-selected layout metadata | Add an explicit composition switch that preserves data and supports switching without recreating the project | P0 |
| Timeline/roadmap/swimlane | Separate presentation types | Independent, persisted Timeline/Roadmap/Swimlane composition; template layout retained separately; SVG/PPTX use selected composition | Portfolio, milestone, and event remain template archetypes/variants rather than additional top-level views | Complete for the three primary views |
| Work planning | Update tasks/milestones and make status visible | Dialog/table editing, progress, owners, dates, grouped lanes | Direct move/resize, ordering, lane management, undo/redo, and validation feedback | P0 |
| Presentation | Executive-ready timelines and native PowerPoint output | PPTX exports editable shapes; SVG and print also exist | Test and improve fidelity across layouts, long labels, zoom/ranges, and milestones; expose useful export options | P1 |
| Template depth | Full gallery across project, roadmap, and swimlane uses | 53 cards, but many use a shared category generator | Curate each equivalent independently: content, duration, lane assignment, milestones, preview, and acceptance fixture | P0 |
| File-based data | Microsoft Project and Excel imports are shown in the observed import flow | CSV and XLSX | Add `.mpp`/supported Project import only after format/library feasibility review; expand Excel mapping and round-trip QA | P2 |
| Connected data | Jira, Microsoft Project, Excel, Smartsheet, Google Sheets; official page claims refresh from source changes | No connectors or source refresh | Connector adapters, authentication, mapping, refresh status, error and conflict behavior | P2 |
| Workspace | Multiple timelines and shared timelines | Multiple local projects | Cloud workspace, cross-device sync, ownership and recovery | P3 |
| Collaboration | Invite people; role permissions; one current shared plan | None | Identity, invite, editor/viewer roles, revocation, concurrent update handling, audit trail | P3 |
| Embedding | Dynamic timelines in Google Docs/Slides | None | Read-only embed, authorization, refresh, and revoke controls | P3 |
| Price/access | Free starter and paid Premium; some capabilities are plan-gated | Current Daymark features are free | Make all delivered features available without paywall, watermark, time limit, or item/template cap | All priorities |

## Prioritized Delivery Plan

### P0 — Complete the Solo Authoring Workflow

**Outcome:** A user can start from any template, change the composition and data, save locally, and produce a clear timeline without needing an account.

**Work packages**

1. **Template parity inventory (M).** Build a 53-row internal catalog checklist from the reference gallery: card name/category, intended audience, layout family, lane count, item types, visible horizon, and free/premium state. Map every entry to a Daymark original equivalent. Keep Daymark wording and artwork original; do not reuse the reference's proprietary preview images or complete task copy.
1. **Template parity inventory (M) — crosswalk complete.** See [TEMPLATE_PARITY_INVENTORY.md](TEMPLATE_PARITY_INVENTORY.md). All 53 visible titles/categories are mapped to original Daymark templates with actual Daymark composition metrics. Reference per-card lane/item/horizon/license details remain unverified pending an authenticated gallery session.
2. **Independent view selection (M) — complete for primary views.** A separate project `presentation` lets users switch Timeline, Roadmap, and Swimlane without mutating template identity or item data. The selection persists in local storage and JSON; SVG/PPTX follow it. Portfolio, Milestone, and Event remain template archetypes/variants.
- [x] All three primary view types can be switched on one project without changing item identity, dates, or owners.
3. **Lane and item management (M).** Add/rename/reorder/remove groups and reorder items. Define what happens when deleting a non-empty lane (move items, delete items, or cancel). Make ordering stable in editor, JSON, SVG, and PPTX.
4. **Direct timeline editing (L).** Drag a task to move its dates, drag handles to resize its range, and move items between lanes. Keep the dialog/table as accessible alternatives. Show keyboard-operable date changes; do not make pointer drag the only path.
5. **Undo/redo and recovery (M).** Add a bounded edit history for item, lane, and layout operations. Confirm deletion or provide undo. Surface storage quota and restore errors without losing the current in-memory edit.
6. **Template content pass (L).** Replace broad repeated category samples with reviewed per-template examples. Preserve all 53 cards as free; each preview must represent the actual created composition. Add one fixture per entry and verify item counts, lane memberships, date span, and milestone placement.

**Acceptance gate**

- Every gallery entry creates a valid, meaningfully distinct original project; no premium badge, paywall, trial expiry, watermark, or hidden item cap appears.
- All three primary view types can be switched on one project without changing item identity, dates, or owners.
- A user can add/edit/delete/reorder tasks and lanes, move/resize a task, and undo/redo each operation; the same changes remain possible from keyboard/dialog/data controls.
- Save/reload and JSON export/import preserve ordering, layout, all item fields, and dates.
- Long names, dense lanes, overlapping milestones, empty projects, and narrow screens have defined behavior and no page-level overflow.

### P1 — Presentation-Ready Exports and Styling

**Outcome:** Daymark output remains legible and editable in the destination, not just in the browser.

**Work packages**

1. **PPTX fidelity audit (M).** Test each layout at short/long date ranges, 1/53+ items, long labels, milestones, progress, and every design preset. Confirm 16:9 placement, font fallback, clipping, page splitting, and true editability of text/shapes in desktop PowerPoint and compatible viewers.
2. **Export controls (M).** Add practical controls for visible range, title/subtitle, legend, owner/progress display, and whether to include empty lanes. Ensure SVG and PPTX use the same composition and palette rules.
3. **Presentation details (M).** Add optional callout/annotation and risk markers if confirmed as part of the required online workflow. Keep risk distinct from color alone and define accessible text equivalents.
4. **Round-trip and regression fixtures (S/M).** Store representative original project fixtures; compare exported structure and geometry against stable assertions rather than screenshot-only checks.

**Acceptance gate**

- PPTX opens without repair warnings; all labels and shapes are selectable/editable; no milestone or task is clipped at chart boundaries.
- SVG, PPTX, and browser views agree on lane ordering, quarter/date scale, status/progress, and project name.
- No watermark is emitted in any format. Export failure leaves the project unchanged and presents a useful error.

### P2 — File and Connected-Source Parity

**Outcome:** Users can bring existing plans into Daymark and intentionally refresh them without losing edits.

**Work packages**

1. **Import contract (S).** Publish supported columns, date formats, progress semantics, duplicate handling, and required fields. Preserve the existing CSV/XLSX path and strict validation.
2. **Project file import (M/L).** Evaluate `.mpp` format support and licensing/maintenance risk before implementation. If robust browser parsing is not viable, support a documented interchange export from Project rather than pretending native `.mpp` support.
3. **Connector adapters (L, per source).** Add Jira, Microsoft Project, Excel, Smartsheet, and Google Sheets adapters in dependency order based on user demand. Map tasks, milestones, owners, dates, status, groups, and identifiers. Preserve source IDs for refresh.
4. **Refresh and conflict UX (M).** Show last sync, changed rows, failed fields, and conflicts. Let the user preview and accept/reject updates; never silently overwrite local edits. Define manual refresh first, then automatic refresh only where provider APIs allow it.
5. **Credentials and privacy (L/cross-cutting).** Use least-privilege OAuth, encrypted server-side refresh tokens, explicit disconnect/delete, and no content analytics. Avoid putting client secrets in browser code.

**Acceptance gate**

- Each supported source has a documented field mapping and error recovery path.
- Repeated refresh is idempotent; unchanged source rows do not duplicate items; removed/renamed source items are handled explicitly.
- A refresh conflict can be resolved without data loss. Users can export a local backup before connecting or refreshing.
- No connector requires a paid Daymark account. Any third-party API quotas and self-hosting requirements are disclosed.

### P3 — Shared Workspaces, Roles, and Embeds

**Outcome:** Teams can work from one current plan and share a safe read-only presentation.

**Work packages**

1. **Free hosting architecture decision (M).** Choose between a Daymark-operated service with a sustainable budget and a self-hostable/open deployment. Keep local-only mode available. A no-charge feature promise does not remove hosting, database, email, or API operating costs.
2. **Accounts and workspaces (L).** Add sign-in, server persistence, cross-device sync, owner recovery, and export/delete-account workflows. Ensure local projects can be migrated without destroying the original backup.
3. **Invitations and roles (L).** Support owner/editor/viewer roles, scoped project invitations, revoke/expiry, and clear shared/private state. Default projects to private; avoid guessable public URLs.
4. **Concurrent edits and activity (L).** Define optimistic update/version behavior, conflict resolution, autosave status, and a minimal audit trail. Do not silently discard another editor's changes.
5. **Google Docs/Slides embedding (L).** Provide a permissioned read-only embed that refreshes from the current project. Add revoke controls and a safe fallback if the viewer loses access.

**Acceptance gate**

- Owner, editor, and viewer permissions are enforced on server requests, not only hidden in the UI.
- Revoking access blocks future requests; shared links are non-guessable and can be disabled.
- Two editors changing the same item receive an explicit conflict outcome; neither edit disappears silently.
- A shared/embedded view updates after a committed change and exposes no project data after access is revoked.
- Local-only users can continue to create, edit, import, and export without signing in.

## Cross-Cutting Definition of Free

- No premium-only routes, templates, layout types, export options, watermarks, trial clock, or item caps.
- No required paid Daymark service for core create/edit/save/import/export.
- Integrations remain free to the user; document any provider limits, user-owned credentials, and deployment requirements. Do not promise unlimited third-party API usage that Daymark cannot control.
- If hosted collaboration cannot be operated at zero cost sustainably, publish a free self-host deployment and keep the local workflow first-class rather than introducing a surprise paywall.

## Recommended Sequence and Dependencies

1. P0 template inventory + data/layout contract.
2. P0 editable view switching, lane management, drag/resize, undo/recovery.
3. P0 per-template content and acceptance fixtures.
4. P1 export fidelity and presentation options.
5. P2 file/connector imports and refresh. Stabilize item/source IDs before implementing refresh.
6. P3 hosted workspace, roles, concurrency, then embeds. Embeds depend on access-control and revocation being correct.
7. Run the final cross-cutting browser, accessibility, migration, security, and export gates after each release, not only at the end.

## Parity Release Checklist

- [ ] Every reference feature is tagged `confirmed`, `unverified`, or `out of scope`; no inferred add-in-only capability is sold as Online parity.
- [ ] All reference gallery entries have an original Daymark equivalent and pass a template fixture.
- [ ] All templates, layouts, exports, and editing controls are free with no hidden limits or watermark.
- [ ] Local-first create/edit/save/reopen/import/export works offline after the app loads.
- [ ] Local-only create/edit/save/reopen/import/export works without an account or backend dependency.
- [ ] CSV/XLSX and each added connector preserve source identity and report errors/conflicts.
- [ ] PPTX is opened in a real PowerPoint-compatible viewer; exported shapes remain editable.
- [ ] Desktop and mobile checks cover empty/populated/dense projects, long labels, focus order, contrast, and page overflow.
- [ ] Collaboration permissions, revocation, concurrent edits, and embed access are tested server-side.
- [ ] Privacy, backup, account deletion, and self-hosting requirements are documented.

## Open Decisions

1. Is “exactly same” a goal of full functional coverage, or must Daymark also reproduce the reference's exact 53 template names? This plan assumes functional equivalents with original names, wording, and artwork.
2. Should cloud collaboration be hosted by Daymark at no charge, or is a free self-hosted deployment acceptable? The answer changes architecture and ongoing operating cost.
3. Which connected source should be implemented first after files: Jira, Microsoft Project, Excel refresh, Smartsheet, or Google Sheets?
4. Is compatibility with the separate PowerPoint add-in also desired, or is the target strictly Timeline Online? Dependencies, critical path, baselines, and add-in-only functions remain uncommitted until confirmed for Online.
