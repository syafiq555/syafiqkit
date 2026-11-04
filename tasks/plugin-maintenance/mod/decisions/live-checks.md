<!--LLM-CONTEXT
Status: live checks not yet run in a real session; the open list is `../current.md` § Next Steps.
Domain: plugin-maintenance (mod)
Gotchas (critical): test a changed Desktop mod in a New session; a reload swaps it only when it reports "re-read from its folder" (see Investigations, Reload).
Related: `../current.md` (index), `design-calls.md`
Last updated: 2026-11-04
-->

# The Mod: Live checks by build

Step-by-step checks for builds not yet seen in a real session, newest first. Routed from `../current.md` § Quick Start; the open list is `../current.md` § Next Steps. Investigations are below the checks.

## Live checks by build {#checks}

Desktop checks run in a session started with **New** in Desktop, because a window onto a terminal session shows nothing and proves nothing. Terminal checks say so.

### 00000. 1.398.2 and 1.398.3 (rows 27 and 28), shipped in 1.399.0 (`5b96530`), unseen live. {#check-00000}

1. In a Desktop **New** session, open `/task-docs` and drag the pane to about 40 columns.
2. Check: toolbar buttons wrap to a second line.
3. Check: long open items wrap instead of ending in "…", and the dim on unpicked items survives (Text inside a Button loses colour).
4. Check: each docs list row still shows its status.
5. Repeat in a 40-column terminal for the docs list and `/changes`.

### 0000. 1.397.3, pushed to origin/master, unseen live (row 26). {#check-0000}

1. Start a new terminal session and check `/sk` reads `v1.397.3`. The footer is the only proof which build runs.
2. Open `/task-docs` on a doc with long items. Check:
   - (1) hovering any row lights every row of the item, and a click on any row picks it;
   - (2) the `… N more lines` row expands all items and does not change the pick;
   - (3) a picked item shows `┃` and `╹` in cyan, and the hovered cyan glyph is one cell, not a block;
   - (4) the band yields while a "Heads up" survey shows and returns when it is dismissed (`hasSurvey`, never seen live);
   - (5) whether Tab and Enter reach continuation rows.

### 000. 1.396.2, pushed to master, brings the band back after a close; the blank expanded Desktop frame is NOT fixed, cause unknown. {#check-000}

1. Start a Desktop **New** session. Do not run `/reload-plugins` in it: it orphans the session's trees (`ui_press not handled`).
2. Expand `/changes`, close it with ✕, `< Close` and Esc, and reopen at once.
3. After each close, check the band is back.
4. Note whether the frame still stays blank. Press `< Close` alone once, so `mod.log` shows whether it reaches the mod (`plugin asked to close`).
5. If the frame stays blank with one tag and no draw after the close, write it up as a Desktop bug.
6. Then open a long new `.md` Rendered. Row height in `/changes` is an estimate (`sum(ceil(len/140))` per line) that skips headings and margins, so it may run short.

**1.395.2 and 1.396.0, pushed to master, unseen in Desktop** (row 25). The expanded (big screen) pane could not be closed; the cause was never reproduced. It also includes the 1.395.1 batch (Copy, gallery list).

1. In a new Desktop session in `~/Herd/mrcount`, expand `/changes` and close it with ✕ and `< Close`. If it still hangs, read `~/.claude/doc-pane-cache/mod.log` and `~/Library/Logs/Claude/main.log` first.
2. Check `/changes` on the changed `.png`, the `.pdf` and the new `.md` from the master-outlet session (Before/After, page 1, Rendered/Raw).
3. Pick a tall picture in the gallery and step with Down.

### 00. 1.394.0, seen live {#check-00}

Source: `design-calls.md`, the CLAUDE.md chain row. In a new Desktop session:

1. Open `/task-docs`. CLAUDE.md CHAIN should list the 10 companions with gauges.
2. Open Hand off. The label should sit above a full-width field, and the CHAIN should read as four sections with N/200 on every row.

Both 1.393.0 and 1.394.0 are pushed (afdba5e); this check is the only thing left.

### 0. Main-doc tag, seen live (row 20) {#check-0}

1. Start a new Desktop session in `~/herd/beacon-mart` (see the Reload investigation below).
2. Open `/task-docs`. Expect `crp45 7 · main: delivery`, with `delivery` showing a `main doc` chip.
3. Row 21, same session: in `/changes`, `view ›` on CHANGES should show `Stage all N`, and pressing it should land on "Staged Changes only". On a long page, ↑ Top should draw at the bottom-right and jump up.
4. Row 22: open a PHP file and a task doc in `/changes` and compare with the native Changes panel (flat rows, full-width red/green, coloured keywords, darker changed words). Scroll a long file and read `mod.log` for a size warning.
5. Row 23, same session: the list is in `../current.md` § Next Steps.
6. Fixes found there ship as a new version. A same-version rebuild is not re-copied into the plugin cache, so the footer would still show the old build.

## Standing checks {#standing-checks}

Checks not tied to one build. They stay open until run.

1. **Terminal windowing, run in iTerm2** (row 18). In a repo with 100+ changes, open `/changes` wide and narrow All diffs.
   - Scroll with the wheel and with PgUp/arrows. Check whether the keyboard fires `ui.scroll`.
   - Check that rows keep drawing past the first two screens.
   - Try to reach a file's `+` far down by keyboard alone.
2. Open `/task-docs` in the 106-doc repo (the one the user's first screenshot came from) and compare the header count with `find tasks -name current.md | wc -l`. Then run it for real:
   - `claude plugin update syafiqkit@syafiqkit`, then restart WITHOUT `--plugin-dir /tmp/mods-try-docs` (a second copy collides on `/sk` and `/task-docs`), and with `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` in iTerm2 (now set in `~/.claude/settings.json` `env`).
3. Desktop, in a session started with **New** there (a Desktop window onto a terminal session shows nothing and proves nothing):
   - Check the panes not yet seen: the docs list in the 106-doc repo, the doc reader, the handoff form, the confirm pages, and `/sk`.
   - Check that the first click after a page change lands and that nothing blanks.
   - Check the gallery's big picture now draws from its smaller copy.
   - Scroll a stack of several tall pictures in iTerm2 too.
4. Check the paths only the kit exercised:
   - Resume under bypass permissions.
   - Band hotkeys while typing in the prompt.
   - Whether `prompt.submit` overwrites a half-typed draft.
   - A submit that lands mid-turn.
5. Test one Claude Code older than 2.1.287 against the shared `hooks.json`. The docs do not say what an older client does with a `modules` key, and the ruleset hook shares that file, so check it first if a colleague reports the ruleset missing.

## Investigations {#investigations}

### Close frame after 1.396.2 {#close-frame}

Measured 2026-10-12 in Desktop:

- a redraw straight after close left the frame blank; no redraw left the band gone;
- a 400 ms delayed redraw (`redrawBandAfterClose`, `core/state.js`, what ships) did not clear the frame;
- after a clean Desktop restart (one module copy) the log showed one `person asked to close` and nothing drawn after, yet the frame stayed blank until Collapse.

So the redraw is not the cause; the frame may be Desktop's own container. A `< Close` press was never seen reaching the mod (only ✕ or Esc, origin `person`).

Code notes:

- Pane-only async redraws (diff loads, doc refresh, diagram renders, `redraw`) go through `invalidatePane`. Band-refreshing redraws (`redrawPane` in `git/controller.js`) stay unguarded, because `$.ui.invalidate` cannot target one component.
- A Desktop-only "band stays visible while a pane is open" variant was built and reverted: its one-letter shortcuts (`c`, `d`, `g`) collide with the pane's, and its launch row goes stale after a close.

Diagnostics:

- New `mod.log` lines, each tagged with a per-load id: `pane drawn while closed`, `close: <origin> asked to close`, `open <view>: not placed`, `close redraw failed`.
- A press on a tree the running module no longer owns logs `ui_press not handled` in `~/Library/Logs/Claude/claude.ai-web.log` (185 in two days), not in `mod.log`.

### Reload did not swap a running mod (2026-10-12; superseded 2026-10-16) {#reload}

- Measured 2026-10-12: with `installed_plugins.json` already at 1.396.2, `/reload-plugins` and `--force` in a Desktop session left the `/sk` footer at v1.396.0. A reload does not swap a running mod, even across a version change.
- A visible string put into the 1.396.2 cache copy (the path the reload had switched to) did not appear after a plain `/reload-plugins` either, so that session's mod was never re-loaded at all.
- A 2026-10-11 transcript (`171d1d00`) reports a plain reload after an in-place edit of the 1.387.0 copy as working. The difference was not found (both sessions log `entrypoint: cli`), so treat that success as unexplained, not as a rule.
- Official docs say a reload loads the module afresh but are silent on Desktop. The test copy was reverted.
- Confirmed by the user 2026-10-12: a new Desktop session shows v1.396.2, so a new session was then the only measured way to load a changed mod. Sessions already running keep their old module.
- 2026-10-16, after the move to a directory-source install: a reload that reports "re-read from its folder" swapped the mod on each rebuild. See `hooks/CLAUDE.md` § Loading a change and testing it.
