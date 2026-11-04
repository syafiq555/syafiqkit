<!--LLM-CONTEXT
Status: Archive of earlier Last Session blocks, kept for the user decisions and measurements they record. Not current state: read `../current.md`.
Domain: plugin-maintenance/mod (session-history)
Gotchas (critical): none recorded here
Related: `../current.md` (index), `builds.md`, `design-calls.md`, `enhance.md`, `live-checks.md`, `pictures.md`
Last updated: 2026-11-04
-->

# The Mod: Session history

Earlier Last Session blocks, kept for the user decisions and measurements they record. Routed from `../current.md` § Last Session.

## Key Technical Decisions {#decisions}

Entries are grouped by session date, newest first. A user decision names who made it and when; a measurement keeps its number and version. Build numbers, commit hashes and shipping checks are in `builds.md` and git history.

### 2026-10-15 {#2026-10-15}

- **User report (2026-10-15):** sent a Desktop screenshot of the doc reader at about 40 columns, with the toolbar clipped after "Hand", and asked for other places to be checked too.
- **Fixes (1.398.2 to 1.399.0):** the handoff row's wrap was removed, since its truncating text already kept Resume visible; the missed single-file diff toolbar was added; the narrow `/changes` caption was clipped. Two unmeasured risks were recorded in Next Steps.

### 2026-10-14 {#2026-10-14}

- **User report (2026-10-14):** sent screenshots of the terminal `/task-docs` reader: long open items cut off, and only the first row of an item highlighted. Asked for the UX to be rethought and researched.
- **Measured:** the host highlights only the first line of a multi-line button, and `inverse` on a multi-line `Text` stops there too. A `ui.focus` hook logged nothing live, so the full-item highlight through focus was dropped (`hooks/CLAUDE.md`, The Mod, records both). A hover group, which the kit cannot see, produced the whole-item light-up seen in 1.397.1.
- **Research:** case studies (fzf, bubbles, ratatui, Textual, Ink, WCAG) agreed on marking state on every row of a multi-line item with a gutter, and spacing items apart.
- **User decision (2026-10-14):** a 3-row cap with an expand key, a blank line after multi-row items, and clickable rows.
- **Finding:** a "Heads up" survey hidden by the band was a missing `hasSurvey` check.
- **`/done` review:** no defects. Product review found that the `… N more lines` row toggled the pick (fixed: it expands), and a picked capped item hid its extra rows (fixed: `(included)`). Left in Next Steps: three Tab stops per long item, and the gauge's mixed units.

### 2026-10-12 {#2026-10-12}

Bullets keep the original block's order. "Before that" and "Earlier" place an item in time against the bullets around it, not against the bullet above.

- **User report, latest (2026-10-12):** two Desktop faults, with screenshots: Close leaving a blank expanded pane, and blank space under a rendered new `.md` in `/changes`.
- **Measured:** four Desktop runs disproved the post-close redraw that earlier agents blamed. The frame stays blank with no redraw, and there is one module copy.
- **Shipped:** only the band is restored, plus diagnostics (`live-checks.md` item 000). A `/done` review rejected a Desktop-only "band stays visible beside the pane" variant (shortcut collisions, stale launch row). The code and docs say the frame is unfixed.
- **Earlier:** the user could not see the `/sk` version stamp. Cause: the stale cache bundle (`live-checks.md` item 000); fixed by copying `hooks/register.js` into the 1.396.0 cache folder.
- **User post (2026-10-12):** the `/task-docs` CLAUDE.md CHAIN panel (3 rows, global 250/200), asking where the companions and nested CLAUDE.md files were.
- **Chain change:** the panel now also lists nested `CLAUDE.md` files and `.claude-companions/shared` folders (`design-calls.md`, the CLAUDE.md chain row). `/done` review: nested rows were ordered by `fs.list` completion time (now sorted by path). The product reviewer's claim that dot-folders are walked was wrong (`isDirectory` drops them).
- **Desktop Hand off form:** the label now sits above a full-width field, after the user said "this uiux need to improve" (taken through `uiux`). The "Move" tag in their screenshot is probably Desktop's drag-handle label, not drawn by the mod (unconfirmed).
- **User report after running in a real app (25 chain rows, five named `CLAUDE.md`, mixed KB and line counts):** "i have trouble reading this".
- **Rebuilt as four foldable sections:** Loaded every session; Nested · load when touched; Global companions · on demand; Project companions · on demand. Nested rows show their path with the end kept when clipped (`clipStart`). Every chain doc is measured, so each row reads N/200. Review: no defect; one unconfirmed risk, long nested paths wrapping in Desktop, is handled by the clip and not yet seen in a real Desktop session.
- **User decisions (2026-10-12):** leave companions in the chain list; a companion over 200 lines keeps the Shrink button. 75 tests pass.
- **Earlier the same day, user question:** whether Desktop was crashing. `~/Library/Logs/Claude/main.log` showed no crash, and `mod.log` carried size warnings from builds older than 1.390.0.
- **Measured:** a new 313-file dense-diff kit test found a real blank-pane cause, a spacer `Box` over 10,000 rows. Fixed in 1.393.0 (Desktop-log notes live in `CLAUDE.local.md`).
- **Pinned bars (row 23, 1.392.0):** `/done` review tightened the `Domain:`/`(hub` match (still marks exactly `marketplace/core` and `crp45/delivery` in `~/herd`); the rest went to Next Steps.
- **User screenshots and decision (2026-10-12):** showed a `/changes` file bar scrolled out of view. The user asked that "all the headers / actions" stay sticky, and chose every page, plus the current file's bar on All changes.
- **`/done` review:** no high-confidence defect. Medium findings (raw vs clamped offset, stale offset after a page change, the root re-parenting on scroll) were fixed. Product review's obvious fixes (Add repo left out of the pinned copy, the swap happening late) were applied; the rest are in Next Steps.
- **Tests:** 73 pass. Installed at 1.392.0 (cache bundle replaced by hand after the fixes and the pinned Filter).
